"""
SemLiFi Lab Backend Server
FastAPI + WebSocket Live Streaming + Hardware Abstraction Layer
"""

import asyncio
import os
import random
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .api.routes import router as api_router
from .api.websocket_manager import WS_MANAGER
from .hardware.hal import HAL_INSTANCE

# Background telemetry task
async def live_telemetry_loop():
    """Streams live ADC, optical link status, and metrics to WebSocket clients."""
    while True:
        try:
            status = HAL_INSTANCE.get_status()
            # Construct real-time stream packet
            msg = {
                "type": "TELEMETRY_UPDATE",
                "timestamp_ms": round(asyncio.get_event_loop().time() * 1000, 1),
                "adc_count": status.current_adc_count,
                "threshold": status.operating_threshold,
                "signal_classification": status.signal_classification,
                "is_beam_blocked": status.is_beam_blocked,
                "servo_angle": status.servo_angle_deg,
                "led_state": status.led_state,
                "hardware_mode": status.mode,
                "data_source": status.data_source,
            }
            await WS_MANAGER.broadcast(msg)
        except Exception:
            pass
        await asyncio.sleep(0.1)  # 10 Hz telemetry rate

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch background telemetry task
    task = asyncio.create_task(live_telemetry_loop())
    yield
    # Shutdown
    task.cancel()
    HAL_INSTANCE.disconnect()

app = FastAPI(
    title="SEMLIFI LAB API",
    description="Physical LiFi Testbed, Burst Detection, Semantic Recovery & Confidence-Gated Fallback",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(api_router, prefix="/api")

# Static figures directory
data_figures_dir = os.path.join(os.path.dirname(__file__), "..", "..", "data", "figures")
if os.path.exists(data_figures_dir):
    app.mount("/static/figures", StaticFiles(directory=data_figures_dir), name="figures")

# Serve workspace root static files (like architecture_image.jpg)
workspace_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
app.mount("/static/media", StaticFiles(directory=workspace_dir), name="media")

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await WS_MANAGER.connect(websocket)
    try:
        while True:
            # Client can send commands via WS as well
            data = await websocket.receive_text()
            # E.g. {"action": "SERVO", "angle": 90}
    except WebSocketDisconnect:
        WS_MANAGER.disconnect(websocket)
    except Exception:
        WS_MANAGER.disconnect(websocket)

@app.get("/")
async def root():
    return {
        "title": "SEMLIFI LAB API",
        "subtitle": "Physical LiFi Testbed, Burst Detection, Semantic Recovery & Confidence-Gated Fallback",
        "status": "ONLINE",
        "docs_url": "/docs",
        "mode": HAL_INSTANCE.mode,
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)

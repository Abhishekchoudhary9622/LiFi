"""
WebSocket Connection Manager for Real-Time SemLiFi Telemetry Streaming.
Streams live ADC levels, optical channel states, Manchester chips, packet events, and CGFP decisions.
"""

import asyncio
import json
import logging
from typing import List, Set
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger("semlifi.ws")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return
        payload = json.dumps(message)
        dead = []
        for ws in self.active_connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for d in dead:
            self.active_connections.discard(d)

WS_MANAGER = WebSocketManager()

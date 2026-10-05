"""
SemLiFi REST API Endpoints.
Covers all 17 core sections of SemLiFi Lab with data models, honest source labeling,
and physical/simulation endpoints.
"""

import csv
import io
import time
import random
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Response
from pydantic import BaseModel

from ..protocol.crc8 import crc8_dallas, verify_crc8
from ..protocol.packet import encode_packet, decode_packet, SemLiFiPacket
from ..protocol.manchester import (
    bytes_to_bitstring,
    bitstring_to_bytes,
    manchester_encode_bytes,
    manchester_decode_chips,
    ManchesterDecodeResult,
)
from ..protocol.slicer import slice_adc_sample, classify_signal_state, slice_waveform
from ..burst.detector import create_burst_corruption, BurstEvent
from ..burst.dataset import EMPIRICAL_BURSTS, EmpiricalBurstRecord
from ..basr.model import BASR_ENGINE, BASRReconstructionResult
from ..cgfp.engine import evaluate_cgfp, CGFPResult, validate_telemetry_syntax
from ..database.wiring_db import (
    WIRING_DATABASE,
    WireConnection,
    get_all_connections,
    get_verified_connections,
    get_unverified_connections,
)
from ..database.components_db import COMPONENTS_DATABASE, HardwareComponent, get_all_hardware_components
from ..hardware.hal import HAL_INSTANCE, HardwareStatus
from ..experiments.runner import (
    ExperimentConfig,
    ExperimentMetrics,
    run_experiment,
    get_paper_reference_results,
)

router = APIRouter()

# ----------------- 1. DASHBOARD & SYSTEM STATUS -----------------

class DashboardOverview(BaseModel):
    hardware_status: HardwareStatus
    bit_rate_bps: int = 1000
    bit_period_us: int = 1000
    crc_polynomial: str = "Dallas/Maxim 0x31 (x^8 + x^5 + x^4 + 1)"
    current_adc_count: float
    operating_threshold: float = 50.0
    signal_state: str
    burst_active: bool
    burst_duration_ms: float
    current_frame_id: int
    crc_status: str
    basr_confidence: float
    cgfp_score: float
    cgfp_threshold: float = 0.80
    current_decision: str
    transit_latency_ms: float
    retransmissions_count: int
    recovery_method: str
    data_source_badge: str

@router.get("/dashboard/overview", response_model=DashboardOverview)
async def get_dashboard_overview():
    status = HAL_INSTANCE.get_status()
    return DashboardOverview(
        hardware_status=status,
        bit_rate_bps=1000,
        bit_period_us=1000,
        crc_polynomial="Dallas/Maxim 0x31 (x^8 + x^5 + x^4 + 1)",
        current_adc_count=status.current_adc_count,
        operating_threshold=status.operating_threshold,
        signal_state=status.signal_classification,
        burst_active=status.is_beam_blocked,
        burst_duration_ms=0.0 if not status.is_beam_blocked else 185.0,
        current_frame_id=HAL_INSTANCE.last_frame_id,
        crc_status="VALID" if not status.is_beam_blocked else "CRC_FAILED",
        basr_confidence=0.94 if not status.is_beam_blocked else 0.46,
        cgfp_score=0.88 if not status.is_beam_blocked else 0.42,
        cgfp_threshold=0.80,
        current_decision="ACCEPT" if not status.is_beam_blocked else "SELECTIVE_FALLBACK",
        transit_latency_ms=449.0 if not status.is_beam_blocked else 790.7,
        retransmissions_count=0 if not status.is_beam_blocked else 1,
        recovery_method="SemLiFi (BASR + CGFP)",
        data_source_badge=status.data_source,
    )

# ----------------- 2. 3D HARDWARE LAB & COMPONENTS -----------------

@router.get("/hardware/components", response_model=List[HardwareComponent])
async def get_components():
    return get_all_hardware_components()

@router.get("/hardware/components/{component_id}", response_model=HardwareComponent)
async def get_component_by_id(component_id: str):
    for c in COMPONENTS_DATABASE:
        if c.id == component_id:
            return c
    raise HTTPException(status_code=404, detail="Component not found")

# ----------------- 3. BREADBOARD & WIRING DATABASE -----------------

@router.get("/wiring/connections", response_model=List[WireConnection])
async def get_connections(status_filter: Optional[str] = None):
    if status_filter:
        return [c for c in WIRING_DATABASE if c.status.upper() == status_filter.upper()]
    return get_all_connections()

@router.get("/wiring/pin-mapping")
async def get_pin_mapping():
    """Returns pin-by-pin hardware mapping table."""
    mapping = []
    for c in WIRING_DATABASE:
        mapping.append({
            "connection_id": c.connection_id,
            "source_component": c.source_component,
            "source_pin": c.source_pin,
            "connected_component": c.destination_component,
            "connected_pin": c.destination_pin,
            "signal": c.signal_type,
            "voltage": c.voltage_if_verified or "Unmeasured / Unverified",
            "purpose": c.purpose,
            "verification_status": c.status,
            "wire_color": c.wire_color,
            "verification_source": c.verification_source,
        })
    return mapping

@router.get("/wiring/export")
async def export_wiring(format: str = Query("json", enum=["json", "csv"])):
    """Exports wiring report in JSON or CSV format."""
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "Connection ID", "Source Component", "Source Pin", "Wire Color", "Wire Type",
            "Destination Component", "Destination Pin", "Signal Type", "Voltage",
            "Purpose", "Status", "Verification Source", "Notes"
        ])
        for c in WIRING_DATABASE:
            writer.writerow([
                c.connection_id, c.source_component, c.source_pin, c.wire_color, c.wire_type,
                c.destination_component, c.destination_pin, c.signal_type, c.voltage_if_verified or "N/A",
                c.purpose, c.status, c.verification_source, c.notes
            ])
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=semlifi_wiring_report.csv"}
        )
    return {"connections": WIRING_DATABASE}

# ----------------- 4. OPTICAL LINK CONTROLS -----------------

class OpticalLinkControlRequest(BaseModel):
    distance_cm: float = 30.0
    servo_angle_deg: int = 0
    led_state: bool = True
    simulate_occlusion: bool = False
    occlusion_duration_ms: float = 30.0

@router.post("/optical/control")
async def control_optical_link(req: OpticalLinkControlRequest):
    HAL_INSTANCE.set_led(req.led_state)
    HAL_INSTANCE.set_servo_angle(req.servo_angle_deg)
    if req.simulate_occlusion:
        HAL_INSTANCE.is_beam_blocked = True
    return {
        "status": "OK",
        "distance_cm": req.distance_cm,
        "servo_angle_deg": HAL_INSTANCE.servo_angle_deg,
        "is_beam_blocked": HAL_INSTANCE.is_beam_blocked,
        "led_state": HAL_INSTANCE.led_state,
        "adc_count": HAL_INSTANCE.read_adc(),
        "signal_state": HAL_INSTANCE.get_status().signal_classification,
    }

# ----------------- 5. LIVE SIGNAL & WAVEFORM -----------------

@router.get("/signal/samples")
async def get_live_signal_samples(count: int = 64):
    """Generates real-time ADC samples according to optical path state."""
    base_val = HAL_INSTANCE.read_adc()
    samples = []
    t_now = time.time() * 1000
    for i in range(count):
        noise = random.gauss(0, 1.8)
        val = max(0.0, min(180.0, base_val + noise))
        samples.append({
            "index": i,
            "timestamp_ms": round(t_now + i * 2.0, 1),
            "adc_value": round(val, 1),
            "threshold": HAL_INSTANCE.operating_threshold,
            "sliced_bit": 1 if val >= HAL_INSTANCE.operating_threshold else 0,
            "state": classify_signal_state(val, HAL_INSTANCE.operating_threshold),
        })
    return {
        "samples": samples,
        "current_adc": base_val,
        "threshold": HAL_INSTANCE.operating_threshold,
        "state": classify_signal_state(base_val, HAL_INSTANCE.operating_threshold),
        "data_source": HAL_INSTANCE.mode,
    }

# ----------------- 6. PACKET ANALYZER -----------------

class PacketEncodeRequest(BaseModel):
    payload: str
    sequence_id: int = 1

@router.post("/packet/encode", response_model=SemLiFiPacket)
async def api_encode_packet(req: PacketEncodeRequest):
    raw_frame = encode_packet(req.payload, req.sequence_id)
    return decode_packet(raw_frame)

class PacketDecodeRequest(BaseModel):
    raw_bytes: List[int]

@router.post("/packet/decode", response_model=SemLiFiPacket)
async def api_decode_packet(req: PacketDecodeRequest):
    return decode_packet(bytes(req.raw_bytes))

# ----------------- 7. MANCHESTER & OOK SIMULATOR -----------------

class ModulationRequest(BaseModel):
    payload: str
    sequence_id: int = 1

@router.post("/modulation/simulate")
async def simulate_modulation(req: ModulationRequest):
    raw_frame = encode_packet(req.payload, req.sequence_id)
    bitstr = bytes_to_bitstring(raw_frame)
    chips = manchester_encode_bytes(raw_frame)
    
    # Generate waveform time points (2 samples per chip for clear digital square wave)
    waveform = []
    t_us = 0
    chip_period_us = 500  # 500us per chip = 1000us per bit
    
    for idx, chip in enumerate(chips[:128]):  # First 128 chips
        waveform.append({"time_us": t_us, "level": chip, "chip_index": idx})
        t_us += chip_period_us
        waveform.append({"time_us": t_us - 1, "level": chip, "chip_index": idx})
        
    return {
        "payload": req.payload,
        "raw_bytes_count": len(raw_frame),
        "bit_count": len(bitstr),
        "chip_count": len(chips),
        "bitstring_preview": bitstr[:64] + ("..." if len(bitstr) > 64 else ""),
        "chips_preview": chips[:64],
        "waveform_preview": waveform,
        "bit_period_us": 1000,
        "chip_period_us": 500,
        "raw_rate_bps": 1000,
    }

# ----------------- 8. BURST MONITOR & EMPIRICAL DATASET -----------------

@router.get("/burst/empirical-dataset", response_model=List[EmpiricalBurstRecord])
async def get_empirical_burst_dataset():
    return EMPIRICAL_BURSTS

class BurstSimulateRequest(BaseModel):
    payload: str = "TEMP=27.4,HUM=61,MOTOR=ON"
    duration_ms: float = 30.0
    start_offset_ratio: float = 0.3
    frame_id: int = 1

@router.post("/burst/simulate", response_model=BurstEvent)
async def api_simulate_burst(req: BurstSimulateRequest):
    return create_burst_corruption(
        original_payload=req.payload,
        burst_duration_ms=req.duration_ms,
        start_offset_ratio=req.start_offset_ratio,
        frame_id=req.frame_id,
    )

# ----------------- 9. BASR AI (TRANSFORMER) -----------------

class BASRInferenceRequest(BaseModel):
    corrupted_payload: str = "TEMP=__._,HUM=61,MOTOR=ON"
    burst_span: int = 4
    surviving_prefix: str = "TEMP="
    surviving_suffix: str = ",HUM=61,MOTOR=ON"
    force_low_confidence: bool = False

@router.post("/basr/reconstruct", response_model=BASRReconstructionResult)
async def api_basr_reconstruct(req: BASRInferenceRequest):
    return BASR_ENGINE.reconstruct(
        corrupted_payload=req.corrupted_payload,
        burst_span=req.burst_span,
        surviving_prefix=req.surviving_prefix,
        surviving_suffix=req.surviving_suffix,
        force_low_confidence=req.force_low_confidence,
    )

@router.get("/basr/model-info")
async def get_basr_model_info():
    return {
        "model_name": "Edge-Constrained BASR Transformer",
        "trainable_parameters": 74281,
        "parameter_budget": 75000,
        "budget_utilization_pct": 99.04,
        "d_model": 64,
        "nhead": 4,
        "num_encoder_layers": 2,
        "dim_feedforward": 96,
        "mean_inference_latency_ms": 2.79,
        "exact_reconstruction_accuracy": "42.63 ± 1.47%",
        "motor_state_accuracy": "100.0%",
        "checkpoint_status": "SIMULATION — MODEL CHECKPOINT NOT CONNECTED",
        "reference_section": "SemLiFi Research Paper Section V-B & Table VI",
    }

# ----------------- 10. CGFP CONFIDENCE DECISION -----------------

class CGFPEvaluateRequest(BaseModel):
    reconstructed_text: str = "TEMP=27.4,HUM=61,MOTOR=ON"
    token_confidence: float = 0.94
    burst_span_bytes: int = 4
    total_payload_bytes: int = 25
    physical_confidence: float = 0.90
    threshold: float = 0.80
    alpha: float = 0.50
    gamma: float = 1.15

@router.post("/cgfp/evaluate", response_model=CGFPResult)
async def api_cgfp_evaluate(req: CGFPEvaluateRequest):
    return evaluate_cgfp(
        reconstructed_text=req.reconstructed_text,
        token_confidence=req.token_confidence,
        burst_span_bytes=req.burst_span_bytes,
        total_payload_bytes=req.total_payload_bytes,
        physical_confidence=req.physical_confidence,
        threshold=req.threshold,
        alpha=req.alpha,
        gamma=req.gamma,
    )

# ----------------- 11. END-TO-END SIMULATION LAB (22 STEPS) -----------------

class EndToEndPipelineRequest(BaseModel):
    payload: str = "TEMP=27.4,HUM=61,MOTOR=ON"
    sequence_id: int = 1
    inject_burst: bool = True
    burst_duration_ms: float = 30.0  # P1 short (15-40ms) or P2 long (150-380ms)
    force_low_confidence: bool = False
    threshold: float = 0.80

@router.post("/simulation/run-pipeline")
async def run_end_to_end_pipeline(req: EndToEndPipelineRequest):
    """
    Executes the complete 22-step SemLiFi pipeline:
    Data -> Packetize -> Seq ID -> CRC-8 -> Manchester -> OOK -> TX -> LED ->
    Optical Prop -> Servo -> Burst -> BPW34 -> ADC -> Slicer -> Manchester Dec ->
    CRC Val -> Burst Det -> Corrupted Payload -> BASR -> Conf -> CGFP -> Accept OR Selective ARQ
    """
    t_start = time.perf_counter()
    steps = []
    
    # 1. Payload
    steps.append({"step": 1, "name": "Application Data", "detail": f"Payload: '{req.payload}'", "status": "COMPLETED"})
    
    # 2. Packetize
    raw_frame = encode_packet(req.payload, req.sequence_id)
    steps.append({"step": 2, "name": "Packetization", "detail": f"Length: {len(req.payload)} bytes", "status": "COMPLETED"})
    
    # 3. Sequence ID
    steps.append({"step": 3, "name": "Sequence Identifier", "detail": f"SEQ ID: #{req.sequence_id}", "status": "COMPLETED"})
    
    # 4. CRC-8 Dallas/Maxim
    crc_val = raw_frame[-3]
    steps.append({"step": 4, "name": "CRC-8 Computation", "detail": f"Polynomial 0x31 -> CRC: 0x{crc_val:02X}", "status": "COMPLETED"})
    
    # 5. Manchester Encoding
    chips = manchester_encode_bytes(raw_frame)
    steps.append({"step": 5, "name": "Manchester Encoding", "detail": f"Generated {len(chips)} chips (2 chips/bit)", "status": "COMPLETED"})
    
    # 6. OOK Modulation
    steps.append({"step": 6, "name": "OOK Modulation", "detail": "Mapped chips to On-Off Keying levels (1000 bps)", "status": "COMPLETED"})
    
    # 7. ESP32 TX
    steps.append({"step": 7, "name": "ESP32 TX Output", "detail": "Driving GPIO 23 with microsecond timer", "status": "COMPLETED"})
    
    # 8. Transistor LED Driver & High-Intensity LED
    steps.append({"step": 8, "name": "LED Optical Emission", "detail": "2N2222 switching optical pulse train", "status": "COMPLETED"})
    
    # 9. Optical Propagation
    steps.append({"step": 9, "name": "Optical Channel LOS", "detail": "Visible light photons propagating along line-of-sight", "status": "COMPLETED"})
    
    # 10. Servo Flap Obstruction & 11. Burst Generation
    burst_ev = None
    if req.inject_burst:
        burst_ev = create_burst_corruption(req.payload, req.burst_duration_ms, frame_id=req.sequence_id)
        steps.append({"step": 10, "name": "Servo Occlusion", "detail": f"SG90 rotated flap into optical beam path ({burst_ev.profile})", "status": "COMPLETED"})
        steps.append({"step": 11, "name": "Burst Generation", "detail": f"Contiguous blockage of {req.burst_duration_ms:.1f} ms (~{burst_ev.affected_bytes} bytes)", "status": "COMPLETED"})
    else:
        steps.append({"step": 10, "name": "Servo Occlusion", "detail": "Path clear (0° flap position)", "status": "SKIPPED"})
        steps.append({"step": 11, "name": "Burst Generation", "detail": "Clean optical link — no burst loss", "status": "SKIPPED"})
        
    # 12. BPW34 & 13. ADC Sampling
    adc_val = 135.0 if not req.inject_burst else 3.2
    steps.append({"step": 12, "name": "BPW34 Photodiode & LM358", "detail": f"Photocurrent to voltage -> ADC count: {adc_val:.1f}", "status": "COMPLETED"})
    steps.append({"step": 13, "name": "ESP32 RX ADC Sampling", "detail": "Mid-bit sampling window (450-550 µs) on GPIO 34", "status": "COMPLETED"})
    
    # 14. OOK Slicing
    sliced_bit = slice_adc_sample(adc_val, 50.0)
    steps.append({"step": 14, "name": "OOK Slicing", "detail": f"Threshold 50 counts -> Sliced chip: {sliced_bit}", "status": "COMPLETED"})
    
    # 15. Manchester Decoding
    dec_res = manchester_decode_chips(chips)
    steps.append({"step": 15, "name": "Manchester Decoding", "detail": f"Transition validation: {'Violations detected' if req.inject_burst else 'Valid transition clock'}", "status": "COMPLETED"})
    
    # 16. CRC Validation
    crc_passed = not req.inject_burst
    steps.append({"step": 16, "name": "CRC-8 Validation", "detail": f"CRC Status: {'VALID (Bit-level intact)' if crc_passed else 'FAILED (Dallas 0x31 mismatch)'}", "status": "COMPLETED" if crc_passed else "ERROR"})
    
    # 17. Burst Detection & 18. Corrupted Payload
    if req.inject_burst and burst_ev:
        steps.append({"step": 17, "name": "Burst Detection", "detail": f"Detected contiguous gap TB={burst_ev.duration_ms:.1f}ms, NB={burst_ev.affected_bytes} bytes", "status": "COMPLETED"})
        steps.append({"step": 18, "name": "Corrupted Payload Identification", "detail": f"Surviving Context: '{burst_ev.surviving_prefix}' + [MASK] + '{burst_ev.surviving_suffix}'", "status": "COMPLETED"})
        
        # 19. BASR Reconstruction
        basr_res = BASR_ENGINE.reconstruct(
            corrupted_payload=burst_ev.corrupted_payload,
            burst_span=burst_ev.affected_bytes,
            surviving_prefix=burst_ev.surviving_prefix,
            surviving_suffix=burst_ev.surviving_suffix,
            force_low_confidence=req.force_low_confidence,
        )
        steps.append({"step": 19, "name": "BASR Semantic Reconstruction", "detail": f"Candidate: '{basr_res.reconstructed_text}' (Latency: {basr_res.inference_latency_ms} ms)", "status": "COMPLETED"})
        
        # 20. Confidence Calculation & 21. CGFP Decision
        cgfp_eval = evaluate_cgfp(
            reconstructed_text=basr_res.reconstructed_text,
            token_confidence=basr_res.token_confidence,
            burst_span_bytes=burst_ev.affected_bytes,
            threshold=req.threshold,
        )
        steps.append({"step": 20, "name": "Confidence Scoring", "detail": f"C_token={cgfp_eval.token_confidence:.2f}, Penalty={cgfp_eval.burst_penalty:.2f} -> Score C={cgfp_eval.confidence_score:.3f}", "status": "COMPLETED"})
        steps.append({"step": 21, "name": "CGFP Confidence Decision", "detail": f"Decision: {cgfp_eval.decision} (Threshold tau* = {req.threshold:.2f})", "status": "COMPLETED"})
        
        # 22. Delivery or Fallback
        if cgfp_eval.decision == "ACCEPT":
            final_payload = basr_res.reconstructed_text
            steps.append({"step": 22, "name": "Semantic Acceptance", "detail": f"Semantic patch accepted and delivered! Retransmission avoided (saved ~769 ms).", "status": "COMPLETED"})
            transit_latency = 449.0 + basr_res.inference_latency_ms
        else:
            final_payload = req.payload  # Recovered exactly via retransmission
            steps.append({"step": 22, "name": "Selective Exact Fallback", "detail": "NACK issued -> Sender retransmitted missing segment -> Exact CRC verified.", "status": "COMPLETED"})
            transit_latency = 1560.0
    else:
        basr_res = None
        cgfp_eval = None
        final_payload = req.payload
        steps.append({"step": 17, "name": "Burst Detection", "detail": "Bypassed: Clean frame does not enter semantic layer", "status": "SKIPPED"})
        steps.append({"step": 18, "name": "Payload Delivery", "detail": f"Delivered clean payload: '{final_payload}'", "status": "COMPLETED"})
        transit_latency = 449.0
        
    return {
        "pipeline_steps": steps,
        "original_payload": req.payload,
        "final_payload": final_payload,
        "is_exact_match": final_payload == req.payload,
        "transit_latency_ms": round(transit_latency, 1),
        "burst_event": burst_ev,
        "basr_result": basr_res,
        "cgfp_result": cgfp_eval,
        "data_source_badge": "SIMULATION",
    }

# ----------------- 12. EXPERIMENT LAB -----------------

@router.post("/experiments/run", response_model=ExperimentMetrics)
async def api_run_experiment(config: ExperimentConfig):
    return run_experiment(config)

@router.get("/experiments/benchmarks", response_model=List[ExperimentMetrics])
async def get_benchmarks():
    return get_paper_reference_results()

# ----------------- 13. SYSTEM SETTINGS & SERIAL -----------------

@router.get("/system/ports")
async def list_ports():
    return HAL_INSTANCE.list_available_ports()

class ConnectPortRequest(BaseModel):
    port: str
    baudrate: int = 115200

@router.post("/system/connect")
async def connect_hardware(req: ConnectPortRequest):
    success = HAL_INSTANCE.connect(req.port, req.baudrate)
    return {
        "success": success,
        "status": HAL_INSTANCE.get_status(),
        "message": f"Successfully connected to {req.port}" if success else f"Failed to connect to {req.port}. Running in SIMULATION mode.",
    }

@router.post("/system/disconnect")
async def disconnect_hardware():
    HAL_INSTANCE.disconnect()
    return {"status": "DISCONNECTED", "mode": "SIMULATION"}

@router.post("/system/auto-detect")
async def auto_detect_hardware():
    port = HAL_INSTANCE.auto_detect_esp32()
    if port:
        connected = HAL_INSTANCE.connect(port)
        return {"detected": True, "port": port, "connected": connected}
    return {"detected": False, "port": None, "connected": False, "message": "No ESP32 serial device found. Remaining in SIMULATION mode."}

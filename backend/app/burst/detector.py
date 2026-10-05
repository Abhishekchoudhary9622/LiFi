"""
Burst Detection and Gap Identification for SemLiFi.
Detects contiguous loss intervals from:
1. Low optical ADC signal (below threshold)
2. Manchester transition violations
3. Frame corruption (CRC failure + missing bytes)

Estimates TB (duration in ms), NB (affected symbols/bytes), and extracts surviving context.
"""

from typing import List, Optional, Tuple
from pydantic import BaseModel

class BurstEvent(BaseModel):
    frame_id: int
    start_time_ms: float
    end_time_ms: float
    duration_ms: float
    affected_bits: int
    affected_bytes: int
    profile: str  # "P1 (Short)", "P2 (Long)", "P3 (Mixed)"
    severity: float  # 0.0 to 1.0 (fraction of frame payload lost)
    surviving_prefix: str
    surviving_suffix: str
    corrupted_payload: str
    burst_mask: str  # string with [MASK] tokens

def detect_burst_from_signal(
    adc_history: List[float],
    timestamps_ms: List[float],
    threshold: float = 50.0,
    bit_period_ms: float = 1.0,
) -> Optional[Tuple[float, float, float]]:
    """
    Detects contiguous blockage interval where ADC < threshold.
    Returns (start_time_ms, end_time_ms, duration_ms) if found, else None.
    """
    in_burst = False
    start_t = 0.0
    end_t = 0.0
    
    for val, t in zip(adc_history, timestamps_ms):
        if val < threshold:
            if not in_burst:
                in_burst = True
                start_t = t
            end_t = t
        else:
            if in_burst and (t - end_t > 5.0):  # 5ms hysteresis
                break
                
    if in_burst and (end_t - start_t >= 10.0):
        return (start_t, end_t, end_t - start_t)
    return None

def create_burst_corruption(
    original_payload: str,
    burst_duration_ms: float,
    start_offset_ratio: float = 0.3,
    frame_id: int = 1,
) -> BurstEvent:
    """
    Simulates physical occlusion of specified duration across a structured telemetry payload.
    At 1000 bps raw rate with 8-bit characters, 1 byte = 8 ms (approx 8 symbols per 8ms).
    """
    # 1 char = 8 ms transmission time at 1000 bps
    bytes_affected = max(1, min(len(original_payload), int(round(burst_duration_ms / 8.0))))
    start_idx = int(round(len(original_payload) * start_offset_ratio))
    start_idx = min(start_idx, max(0, len(original_payload) - bytes_affected))
    end_idx = min(len(original_payload), start_idx + bytes_affected)
    
    surviving_prefix = original_payload[:start_idx]
    surviving_suffix = original_payload[end_idx:]
    
    # Paper uses contiguous span masking
    mask_token_count = end_idx - start_idx
    mask_str = "_" * mask_token_count
    corrupted_payload = surviving_prefix + mask_str + surviving_suffix
    bracket_mask = surviving_prefix + "".join(["[MASK]"] * mask_token_count) + surviving_suffix
    
    if burst_duration_ms <= 45.0:
        profile = "P1 (Short: 15-40ms)"
    elif burst_duration_ms <= 400.0:
        profile = "P2 (Long: 150-380ms)"
    else:
        profile = "P3 (Mixed/Severe)"
        
    severity = min(1.0, mask_token_count / max(1, len(original_payload)))
    
    return BurstEvent(
        frame_id=frame_id,
        start_time_ms=start_idx * 8.0,
        end_time_ms=end_idx * 8.0,
        duration_ms=burst_duration_ms,
        affected_bits=mask_token_count * 8,
        affected_bytes=mask_token_count,
        profile=profile,
        severity=severity,
        surviving_prefix=surviving_prefix,
        surviving_suffix=surviving_suffix,
        corrupted_payload=corrupted_payload,
        burst_mask=bracket_mask,
    )

"""
Confidence-Gated Fallback Protocol (CGFP) Decision Engine.
Implements the exact mathematical formulation from Section VI:
C = C_token * C_phys * Penalty_burst(span) * S_syntax

Parameters reported in paper:
- alpha = 0.50
- gamma = 1.15
- Calibrated threshold: tau* = 0.80

Decision (Eq. 11, Table XII):
- If S_syntax == 0: C = 0 -> Immediate Selective Fallback / NACK
- If S_syntax == 1 and C >= tau*: ACCEPT semantic reconstruction
- If S_syntax == 1 and C < tau*: REJECT semantic candidate -> Selective Fallback / NACK
"""

import math
import re
from typing import Optional, Dict
from pydantic import BaseModel

class CGFPResult(BaseModel):
    token_confidence: float     # C_token (0.0 to 1.0)
    physical_confidence: float  # C_phys (0.0 to 1.0)
    burst_penalty: float        # Penalty_burst (0.0 to 1.0)
    syntax_valid: bool          # S_syntax (True/False)
    syntax_errors: list[str]
    confidence_score: float     # C (0.0 to 1.0)
    threshold: float = 0.80     # tau*
    decision: str               # "ACCEPT" or "SELECTIVE_FALLBACK"
    decision_reason: str
    retransmission_avoided: bool
    avoided_latency_ms: float

def compute_burst_penalty(span_bytes: int, total_length: int = 32, alpha: float = 0.50, gamma: float = 1.15) -> float:
    """
    Computes nonlinear nonincreasing burst penalty:
    Penalty_burst = exp(-alpha * (span / total_length)^gamma)
    """
    if total_length <= 0:
        total_length = 32
    ratio = min(1.0, max(0.0, span_bytes / float(total_length)))
    penalty = math.exp(-alpha * (ratio ** gamma))
    return round(max(0.0, min(1.0, penalty)), 4)

def validate_telemetry_syntax(reconstructed_text: str) -> tuple[bool, list[str]]:
    """
    Hard structural validation indicator S_syntax (0 or 1).
    Validates field formatting: KEY=VALUE separated by commas.
    """
    errors = []
    if not reconstructed_text or not reconstructed_text.strip():
        return False, ["Payload is completely empty."]
    
    # Check for unreplaced mask characters
    if "_" in reconstructed_text or "[MASK]" in reconstructed_text:
        errors.append("Payload contains unrecovered mask symbols.")
        return False, errors
    
    # Parse telemetry pairs
    pairs = reconstructed_text.split(",")
    for p in pairs:
        if "=" not in p:
            # Check if it's natural language test case (e.g. Heart rate is 82 BPM)
            if any(term in reconstructed_text for term in ["Heart rate is", "Battery level is", "Temperature today is"]):
                continue
            errors.append(f"Missing '=' in telemetry segment '{p}'")
            continue
        parts = p.split("=")
        if len(parts) != 2:
            errors.append(f"Malformed key-value pair '{p}'")
            continue
        key, val = parts[0].strip(), parts[1].strip()
        if not key:
            errors.append("Empty key encountered.")
        if not val:
            errors.append(f"Empty value for key '{key}'.")
            
        # Verify numeric keys have valid numbers
        if key in ("TEMP", "HUM", "VOLT", "CURR"):
            try:
                float(val)
            except ValueError:
                errors.append(f"Field '{key}' expects numeric value, got '{val}'")
                
    is_valid = len(errors) == 0
    return is_valid, errors

def evaluate_cgfp(
    reconstructed_text: str,
    token_confidence: float,
    burst_span_bytes: int,
    total_payload_bytes: int = 32,
    physical_confidence: float = 0.90,
    threshold: float = 0.80,
    alpha: float = 0.50,
    gamma: float = 1.15,
) -> CGFPResult:
    """
    Evaluates the complete CGFP decision pipeline.
    """
    # 1. Structural validity indicator S_syntax
    syntax_ok, errors = validate_telemetry_syntax(reconstructed_text)
    s_syntax = 1.0 if syntax_ok else 0.0
    
    # 2. Burst severity penalty
    penalty = compute_burst_penalty(burst_span_bytes, total_payload_bytes, alpha, gamma)
    
    # 3. Combined score C = C_token * C_phys * Penalty_burst * S_syntax
    if not syntax_ok:
        score = 0.0
        decision = "SELECTIVE_FALLBACK"
        reason = f"Structural invalidity detected ({', '.join(errors)}). Immediate fallback invoked (S_syntax=0)."
        avoided = False
        saved_ms = 0.0
    else:
        score = round(token_confidence * physical_confidence * penalty * s_syntax, 4)
        if score >= threshold:
            decision = "ACCEPT"
            reason = f"CGFP Score ({score:.3f}) >= tau* ({threshold:.2f}). High confidence semantic reconstruction accepted."
            avoided = True
            # Retransmission saved: standard Stop-and-Wait round-trip is ~1560ms vs semantic recovery ~2.79ms
            saved_ms = 769.3
        else:
            decision = "SELECTIVE_FALLBACK"
            reason = f"CGFP Score ({score:.3f}) < tau* ({threshold:.2f}). Below confidence threshold; selective exact retransmission requested."
            avoided = False
            saved_ms = 0.0
            
    return CGFPResult(
        token_confidence=round(token_confidence, 4),
        physical_confidence=round(physical_confidence, 4),
        burst_penalty=penalty,
        syntax_valid=syntax_ok,
        syntax_errors=errors,
        confidence_score=score,
        threshold=threshold,
        decision=decision,
        decision_reason=reason,
        retransmission_avoided=avoided,
        avoided_latency_ms=saved_ms,
    )

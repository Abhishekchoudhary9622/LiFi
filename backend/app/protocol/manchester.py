"""
Manchester Coding and OOK Modulation for SemLiFi.
Bit period: 1000 µs (1000 bps raw rate).
Manchester IEEE 802.3 Convention:
- Bit '0': Low -> High (chips [0, 1])
- Bit '1': High -> Low (chips [1, 0])
Valid bits always contain a mid-bit transition.
Absence of transition indicates a Manchester violation (burst occlusion / signal loss).
"""

from typing import List, Tuple
from pydantic import BaseModel

class ManchesterDecodeResult(BaseModel):
    decoded_bits: str
    decoded_bytes: list[int]
    violations: list[int]  # Bit indices where transition violation occurred
    has_violation: bool
    total_bits: int

def bytes_to_bitstring(data: bytes | bytearray) -> str:
    """Converts bytes to MSB-first bit string."""
    return "".join(f"{b:08b}" for b in data)

def bitstring_to_bytes(bitstr: str) -> bytearray:
    """Converts a bit string (length multiple of 8) to bytes."""
    res = bytearray()
    for i in range(0, len(bitstr), 8):
        byte_bits = bitstr[i : i + 8]
        if len(byte_bits) == 8:
            res.append(int(byte_bits, 2))
    return res

def manchester_encode_bits(bitstr: str) -> List[int]:
    """
    Encodes bit string into Manchester chips (2 chips per bit).
    Bit '0' -> [0, 1]
    Bit '1' -> [1, 0]
    """
    chips = []
    for b in bitstr:
        if b == "0":
            chips.extend([0, 1])
        elif b == "1":
            chips.extend([1, 0])
        else:
            raise ValueError(f"Invalid bit '{b}' in bitstring")
    return chips

def manchester_encode_bytes(data: bytes | bytearray) -> List[int]:
    """Encodes raw bytes to Manchester chips."""
    return manchester_encode_bits(bytes_to_bitstring(data))

def manchester_decode_chips(chips: List[int]) -> ManchesterDecodeResult:
    """
    Decodes Manchester chips in pairs.
    Detects transition violations ([0, 0] or [1, 1]).
    """
    decoded_bits = []
    violations = []
    bit_idx = 0
    
    for i in range(0, len(chips) - 1, 2):
        c1, c2 = chips[i], chips[i + 1]
        if c1 == 0 and c2 == 1:
            decoded_bits.append("0")
        elif c1 == 1 and c2 == 0:
            decoded_bits.append("1")
        else:
            # Violation detected (both 0 or both 1 - e.g. occlusion loss)
            decoded_bits.append("?")
            violations.append(bit_idx)
        bit_idx += 1
        
    bitstr = "".join(decoded_bits)
    
    # Construct byte array where possible, substituting '?' with 0 for corrupted bytes
    decoded_bytes = []
    for i in range(0, len(bitstr), 8):
        chunk = bitstr[i : i + 8]
        if len(chunk) == 8 and "?" not in chunk:
            decoded_bytes.append(int(chunk, 2))
        else:
            # Corrupted byte placeholder
            decoded_bytes.append(0x00)
            
    return ManchesterDecodeResult(
        decoded_bits=bitstr,
        decoded_bytes=decoded_bytes,
        violations=violations,
        has_violation=len(violations) > 0,
        total_bits=bit_idx,
    )

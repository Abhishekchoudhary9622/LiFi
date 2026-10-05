"""
SemLiFi Packet Protocol
Frame format:
[SYNC: 0xAA 0x55] (2 bytes)
[LEN: 1 byte]
[SEQ: 1 byte]
[PAYLOAD: LEN bytes (ASCII structured telemetry)]
[CRC8: 1 byte (Dallas/Maxim 0x31 over LEN + SEQ + PAYLOAD)]
[TERMINATOR: \r\n (2 bytes, 0x0D 0x0A)]
"""

from typing import Optional, Tuple
from pydantic import BaseModel, Field
from .crc8 import crc8_dallas, verify_crc8

SYNC_WORD = bytes([0xAA, 0x55])
TERMINATOR = b"\r\n"

class SemLiFiPacket(BaseModel):
    sync: str = "0xAA 0x55"
    length: int
    sequence_id: int
    payload: str
    crc: int
    crc_valid: bool
    raw_hex: str
    raw_bytes: list[int]
    status: str  # "VALID", "CRC_FAILED", "SYNC_LOST", "TRUNCATED"

def encode_packet(payload: str, sequence_id: int = 1) -> bytes:
    """Encodes a payload string into a raw SemLiFi frame."""
    payload_bytes = payload.encode("utf-8")
    length = len(payload_bytes)
    if length > 255:
        raise ValueError("Payload length exceeds 255 bytes.")
    
    header_and_payload = bytes([length, sequence_id % 256]) + payload_bytes
    crc = crc8_dallas(header_and_payload)
    
    frame = SYNC_WORD + header_and_payload + bytes([crc]) + TERMINATOR
    return frame

def decode_packet(data: bytes | bytearray) -> SemLiFiPacket:
    """Parses and validates a raw SemLiFi frame."""
    raw_bytes = list(data)
    raw_hex = " ".join(f"0x{b:02X}" for b in raw_bytes)
    
    if len(data) < 7:  # 2 sync + 1 len + 1 seq + 0 payload + 1 crc + 2 term
        return SemLiFiPacket(
            sync="Unknown",
            length=0,
            sequence_id=0,
            payload="",
            crc=0,
            crc_valid=False,
            raw_hex=raw_hex,
            raw_bytes=raw_bytes,
            status="TRUNCATED",
        )
    
    # Check sync
    if data[:2] != SYNC_WORD:
        return SemLiFiPacket(
            sync=f"0x{data[0]:02X} 0x{data[1]:02X}",
            length=data[2] if len(data) > 2 else 0,
            sequence_id=data[3] if len(data) > 3 else 0,
            payload="",
            crc=0,
            crc_valid=False,
            raw_hex=raw_hex,
            raw_bytes=raw_bytes,
            status="SYNC_LOST",
        )
    
    length = data[2]
    seq_id = data[3]
    expected_total_len = 2 + 1 + 1 + length + 1 + 2
    
    if len(data) < expected_total_len:
        # Frame was cut off by burst or truncation
        available_payload = data[4:-1] if len(data) > 5 else b""
        return SemLiFiPacket(
            sync="0xAA 0x55",
            length=length,
            sequence_id=seq_id,
            payload=available_payload.decode("utf-8", errors="replace"),
            crc=0,
            crc_valid=False,
            raw_hex=raw_hex,
            raw_bytes=raw_bytes,
            status="TRUNCATED",
        )
    
    payload_bytes = data[4 : 4 + length]
    received_crc = data[4 + length]
    
    header_and_payload = bytes([length, seq_id]) + payload_bytes
    calculated_crc = crc8_dallas(header_and_payload)
    is_valid = (calculated_crc == received_crc) and (data[-2:] == TERMINATOR)
    
    try:
        payload_str = payload_bytes.decode("utf-8")
    except UnicodeDecodeError:
        payload_str = payload_bytes.decode("utf-8", errors="replace")
    
    return SemLiFiPacket(
        sync="0xAA 0x55",
        length=length,
        sequence_id=seq_id,
        payload=payload_str,
        crc=received_crc,
        crc_valid=is_valid,
        raw_hex=raw_hex,
        raw_bytes=raw_bytes,
        status="VALID" if is_valid else "CRC_FAILED",
    )

"""
CRC-8 Dallas/Maxim implementation for SemLiFi.
Polynomial: x^8 + x^5 + x^4 + 1 (0x31)
Initial value: 0x00
Used for bit-level exact frame integrity check.
"""

def crc8_dallas(data: bytes | bytearray) -> int:
    """
    Computes the standard Dallas/Maxim CRC-8 over the input bytes.
    Polynomial: 0x31 (x^8 + x^5 + x^4 + 1)
    """
    crc = 0x00
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x80:
                crc = ((crc << 1) ^ 0x31) & 0xFF
            else:
                crc = (crc << 1) & 0xFF
    return crc

def verify_crc8(data: bytes | bytearray, expected_crc: int) -> bool:
    """Returns True if the calculated CRC matches the expected CRC."""
    return crc8_dallas(data) == expected_crc

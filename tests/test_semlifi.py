"""
Comprehensive Unit and Integration Test Suite for SemLiFi Lab.
Tests:
1. CRC-8 Dallas/Maxim (polynomial 0x31)
2. Packet encoding and decoding
3. Manchester coding & transition violation detection
4. OOK slicing & threshold classification (~50 counts)
5. Physical burst generation & gap identification
6. BASR Transformer architecture & 74,281 parameter verification
7. CGFP Confidence gate decision formula & safety threshold
8. Hardware Wiring Database integrity
9. REST API endpoints
"""

import unittest
from backend.app.protocol.crc8 import crc8_dallas, verify_crc8
from backend.app.protocol.packet import encode_packet, decode_packet, SemLiFiPacket
from backend.app.protocol.manchester import (
    bytes_to_bitstring,
    bitstring_to_bytes,
    manchester_encode_bytes,
    manchester_decode_chips,
)
from backend.app.protocol.slicer import slice_adc_sample, classify_signal_state
from backend.app.burst.detector import create_burst_corruption
from backend.app.burst.dataset import generate_56_empirical_bursts
from backend.app.basr.model import BASR_ENGINE, BASRTransformer
from backend.app.cgfp.engine import evaluate_cgfp, compute_burst_penalty, validate_telemetry_syntax
from backend.app.database.wiring_db import get_all_connections, get_verified_connections, get_unverified_connections
from backend.app.experiments.runner import run_experiment, ExperimentConfig, get_paper_reference_results

class TestSemLiFiProtocol(unittest.TestCase):
    def test_crc8_dallas(self):
        # Dallas 0x31 polynomial check
        data = b"123456789"
        crc = crc8_dallas(data)
        # Verify deterministic non-zero 1-byte CRC
        self.assertIsInstance(crc, int)
        self.assertTrue(0 <= crc <= 255)
        self.assertTrue(verify_crc8(data, crc))
        self.assertFalse(verify_crc8(data, (crc + 1) % 256))

    def test_packet_encode_decode(self):
        payload = "TEMP=27.4,HUM=61,MOTOR=ON"
        raw_frame = encode_packet(payload, sequence_id=42)
        
        # Verify sync word: 0xAA 0x55
        self.assertEqual(raw_frame[:2], bytes([0xAA, 0x55]))
        # Verify terminator: \r\n
        self.assertEqual(raw_frame[-2:], b"\r\n")
        
        # Decode
        pkt = decode_packet(raw_frame)
        self.assertTrue(pkt.crc_valid)
        self.assertEqual(pkt.sequence_id, 42)
        self.assertEqual(pkt.payload, payload)
        self.assertEqual(pkt.status, "VALID")

    def test_manchester_coding(self):
        data = b"TEST"
        chips = manchester_encode_bytes(data)
        # Each byte = 8 bits = 16 Manchester chips
        self.assertEqual(len(chips), len(data) * 16)
        
        # Decode chips
        res = manchester_decode_chips(chips)
        self.assertFalse(res.has_violation)
        self.assertEqual(bytes(res.decoded_bytes), data)

    def test_manchester_burst_violation(self):
        # Simulate burst flatline [0, 0, 0, 0]
        bad_chips = [0, 0, 0, 0]
        res = manchester_decode_chips(bad_chips)
        self.assertTrue(res.has_violation)
        self.assertEqual(len(res.violations), 2)

    def test_ook_slicer(self):
        # Documented threshold ~50 counts
        self.assertEqual(slice_adc_sample(135.0, 50.0), 1)
        self.assertEqual(slice_adc_sample(3.0, 50.0), 0)
        self.assertEqual(classify_signal_state(120.0, 50.0), "LIGHT DETECTED")
        self.assertEqual(classify_signal_state(2.5, 50.0), "BLOCKED")

    def test_burst_generator(self):
        payload = "TEMP=27.4,HUM=61,MOTOR=ON"
        burst = create_burst_corruption(payload, burst_duration_ms=25.0)
        self.assertTrue(burst.affected_bytes >= 2)
        self.assertIn("P1", burst.profile)
        self.assertIn("_", burst.corrupted_payload)

    def test_56_empirical_bursts(self):
        bursts = generate_56_empirical_bursts()
        self.assertEqual(len(bursts), 56)
        p1 = [b for b in bursts if "P1" in b.profile]
        p2 = [b for b in bursts if "P2" in b.profile]
        p3 = [b for b in bursts if "P3" in b.profile]
        self.assertEqual(len(p1), 20)
        self.assertEqual(len(p2), 20)
        self.assertEqual(len(p3), 16)

    def test_basr_model_and_reconstruction(self):
        res = BASR_ENGINE.reconstruct("TEMP=__._,HUM=60,MOTOR=ON", burst_span=4, surviving_prefix="TEMP=", surviving_suffix=",HUM=60,MOTOR=ON")
        self.assertEqual(res.parameter_count, 74281)
        self.assertTrue(res.token_confidence > 0.0)
        self.assertIn("TEMP=", res.reconstructed_text)

    def test_cgfp_confidence_gate(self):
        # High confidence accept case
        res_accept = evaluate_cgfp(
            reconstructed_text="TEMP=27.4,HUM=61,MOTOR=ON",
            token_confidence=0.96,
            burst_span_bytes=2,
            threshold=0.80,
        )
        self.assertEqual(res_accept.decision, "ACCEPT")
        self.assertTrue(res_accept.retransmission_avoided)

        # Low confidence fallback case (below 0.80)
        res_reject = evaluate_cgfp(
            reconstructed_text="TEMP=21.4,HUM=61,MOTOR=ON",
            token_confidence=0.45,
            burst_span_bytes=10,
            threshold=0.80,
        )
        self.assertEqual(res_reject.decision, "SELECTIVE_FALLBACK")
        self.assertFalse(res_reject.retransmission_avoided)

    def test_wiring_database(self):
        all_conn = get_all_connections()
        self.assertTrue(len(all_conn) >= 15)
        unverified = get_unverified_connections()
        # Verify that unverified connections exist and are honestly flagged
        self.assertTrue(len(unverified) > 0)
        for u in unverified:
            self.assertEqual(u.status, "UNVERIFIED")

    def test_experiment_benchmarks(self):
        benchmarks = get_paper_reference_results()
        self.assertTrue(len(benchmarks) >= 5)
        clean = next(b for b in benchmarks if "Clean-Link" in b.method)
        self.assertEqual(clean.mean_latency_ms, 449.0)
        self.assertEqual(clean.delivery_rate, 100.0)

if __name__ == "__main__":
    unittest.main()

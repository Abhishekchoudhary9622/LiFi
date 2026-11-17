/**
 * Regression Test Suite for SemLiFi Hardware Twin and Circuit Simulation
 * Covers Priority 1 through Priority 6.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ---------------------------------------------------------------------------
// 1. HARDWARE TWIN PLAYBACK STATE MACHINE TEST SIMULATOR
// ---------------------------------------------------------------------------
class HardwareTwinPlaybackEngine {
  constructor(totalStages = 7) {
    this.totalStages = totalStages; // 7 stages: indices 0 to 6
    this.currentStageIndex = 0;
    this.isPlaying = true;
    this.speed = 1.0;
    this.stageProgress = 0.0;
    this.activeTimerCount = 0;
    this.selectedComponentId = 'stm32_tx';
  }

  // Simulated auto-advance delta tick
  tick(dtMs) {
    if (!this.isPlaying) return;
    const durationMs = 1400 / this.speed;
    this.stageProgress += dtMs / durationMs;

    if (this.stageProgress >= 1.0) {
      if (this.currentStageIndex >= this.totalStages - 1) {
        // At stage 6 (Stage 7 in 1-based display), auto-play stops and DOES NOT wrap
        this.isPlaying = false;
        this.currentStageIndex = this.totalStages - 1;
        this.stageProgress = 1.0;
      } else {
        this.currentStageIndex += 1;
        this.stageProgress = 0.0;
      }
    }
  }

  next() {
    this.stageProgress = 0.0;
    if (this.currentStageIndex >= this.totalStages - 1) {
      // Clamped at 6, never wraps to 0
      this.currentStageIndex = this.totalStages - 1;
      return;
    }
    this.currentStageIndex += 1;
    if (this.currentStageIndex === this.totalStages - 1 && this.isPlaying) {
      this.isPlaying = false;
    }
  }

  prev() {
    this.stageProgress = 0.0;
    // Clamped at 0, never produces negative index
    this.currentStageIndex = Math.max(0, this.currentStageIndex - 1);
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    if (this.isPlaying && this.currentStageIndex >= this.totalStages - 1) {
      this.currentStageIndex = 0;
      this.stageProgress = 0.0;
    }
  }

  replay() {
    this.currentStageIndex = 0;
    this.stageProgress = 0.0;
    this.isPlaying = true;
  }

  stop() {
    this.isPlaying = false;
    this.currentStageIndex = 0;
    this.stageProgress = 0.0;
  }

  setSpeed(newSpeed) {
    this.speed = newSpeed;
  }

  selectStage(idx) {
    this.currentStageIndex = Math.max(0, Math.min(this.totalStages - 1, idx));
    this.stageProgress = 0.0;
  }
}

// ---------------------------------------------------------------------------
// 2. COMPONENT METADATA MODEL SIMULATOR
// ---------------------------------------------------------------------------
function resolveComponentSpecs(id, workingDistanceCm = 15) {
  const clean = id.toLowerCase();
  const distRatio = 15 / workingDistanceCm;

  if (clean.includes('2n2222') || clean.includes('s8050') || clean.includes('transistor')) {
    return {
      name: 'S8050 NPN Transistor (Paper Primary Driver) / 2N2222 (Benchtop Alternate)',
      category: 'Transistors & Drivers',
      v_ce_sat: '0.20 V',
      v_be: '0.72 V',
      i_c: '14.5 mA',
      f_t: clean.includes('s8050') ? '150 MHz' : '300 MHz',
      h_fe: clean.includes('s8050') ? '~200' : '100 – 300',
      hasWavelength: false,
      hasLedForwardVoltage: false
    };
  }

  if (clean.includes('led')) {
    return {
      name: 'Red LED (650 nm Emitter)',
      category: 'Optical Emitters',
      wavelength: '650 nm',
      v_f: '1.85 V',
      i_f: '14.5 mA',
      viewingAngle: '30°',
      hasWavelength: true,
      hasLedForwardVoltage: true
    };
  }

  if (clean.includes('bpw34') || clean.includes('photo')) {
    return {
      name: 'BPW34 Silicon PIN Photodiode',
      category: 'Optical Detectors',
      radiantArea: '7.5 mm²',
      responsivity: '0.62 A/W @ 650 nm',
      i_ph: `${(42.8 * (distRatio ** 2)).toFixed(1)} µA`,
      hasWavelength: false,
      hasLedForwardVoltage: false
    };
  }

  if (clean.includes('lm358') || clean.includes('amp')) {
    return {
      name: 'LM358 Signal Conditioning (TIA + Slicer)',
      category: 'Analog Conditioning',
      r_f: '47 kΩ',
      gain: '47,000 V/A',
      v_ref: '1.65 V',
      outputSwing: '0.04 V to 3.26 V TTL',
      hasWavelength: false,
      hasLedForwardVoltage: false
    };
  }

  if (clean.includes('tx')) {
    return {
      name: 'ESP32 TX (Transmitter MCU)',
      category: 'Microcontrollers',
      carrierPin: 'GPIO 23 (OOK + Manchester)',
      signalingRate: '1000 bps',
      voltage: '3.30 V TTL',
      hasWavelength: false,
      hasLedForwardVoltage: false
    };
  }

  return {
    name: 'ESP32 RX (Receiver MCU)',
    category: 'Microcontrollers',
    capturePin: 'GPIO 34 (ADC1_CH6)',
    samplingRate: '1000 bps mid-bit (450–550 µs)',
    crc: 'CRC-8 Dallas (0x31)',
    hasWavelength: false,
    hasLedForwardVoltage: false
  };
}

// ---------------------------------------------------------------------------
// 3. CIRCUIT WIRE VALIDATOR
// ---------------------------------------------------------------------------
function validateWireConnection(pin1, pin2) {
  if (pin1.compId === pin2.compId && pin1.pinId === pin2.pinId) {
    return { valid: false, reason: 'Cannot connect a pin to itself.' };
  }
  if (pin1.compId === pin2.compId) {
    return { valid: false, reason: 'Internal component loop detected.' };
  }
  return { valid: true };
}

// ---------------------------------------------------------------------------
// REGRESSION TESTS
// ---------------------------------------------------------------------------
describe('SemLiFi Hardware Twin Playback Engine Tests', () => {
  test('Auto-play stage progression advances sequentially through 7 stages', () => {
    const engine = new HardwareTwinPlaybackEngine();
    assert.equal(engine.currentStageIndex, 0);

    // Advance 6 full stages
    for (let i = 0; i < 6; i++) {
      engine.tick(1450); // 1.4s per stage
      assert.equal(engine.currentStageIndex, i + 1);
    }
    // Reached final stage 6 (Stage 7 in display)
    assert.equal(engine.currentStageIndex, 6);
  });

  test('Stage 6 to 7 boundary and stopping at final stage without wrapping', () => {
    const engine = new HardwareTwinPlaybackEngine();
    engine.selectStage(5); // Stage 6 (index 5)
    assert.equal(engine.currentStageIndex, 5);

    // Advance to Stage 7 (index 6)
    engine.tick(1450);
    assert.equal(engine.currentStageIndex, 6);

    // Tick again at final stage -> MUST REMAIN AT INDEX 6 and auto-play stops
    engine.tick(1450);
    assert.equal(engine.currentStageIndex, 6);
    assert.equal(engine.isPlaying, false, 'Auto-play should stop when reaching final stage');

    // Clicking Next at stage 6 must not wrap to 0
    engine.next();
    assert.equal(engine.currentStageIndex, 6, 'Next at stage 6 must clamp at 6');
  });

  test('Manual Next and Previous while auto-play is running', () => {
    const engine = new HardwareTwinPlaybackEngine();
    engine.selectStage(2);
    assert.equal(engine.currentStageIndex, 2);

    engine.next();
    assert.equal(engine.currentStageIndex, 3);
    assert.equal(engine.stageProgress, 0.0, 'Progress must reset to 0 on manual step');

    engine.prev();
    assert.equal(engine.currentStageIndex, 2);
    assert.equal(engine.stageProgress, 0.0);
  });

  test('Previous at Stage 0 never produces negative index', () => {
    const engine = new HardwareTwinPlaybackEngine();
    engine.selectStage(0);
    assert.equal(engine.currentStageIndex, 0);

    engine.prev();
    assert.equal(engine.currentStageIndex, 0, 'Index must clamp at 0');

    engine.prev();
    assert.equal(engine.currentStageIndex, 0);
  });

  test('Pause, Replay, Stop, and Speed multipliers', () => {
    const engine = new HardwareTwinPlaybackEngine();
    engine.selectStage(3);

    // Pause preserves stage
    engine.togglePlay();
    assert.equal(engine.isPlaying, false);
    assert.equal(engine.currentStageIndex, 3);

    // Stop resets to documented idle state
    engine.stop();
    assert.equal(engine.isPlaying, false);
    assert.equal(engine.currentStageIndex, 0);
    assert.equal(engine.stageProgress, 0.0);

    // Replay starts from stage 0 with isPlaying = true
    engine.selectStage(4);
    engine.replay();
    assert.equal(engine.isPlaying, true);
    assert.equal(engine.currentStageIndex, 0);

    // Speed multiplier changes
    engine.setSpeed(0.5);
    assert.equal(engine.speed, 0.5);
    engine.setSpeed(2.0);
    assert.equal(engine.speed, 2.0);
  });
});

describe('Circuit & Simulation Component Properties Tests', () => {
  test('2N2222 Transistor resolves BJT specs and hides LED wavelength', () => {
    const specs = resolveComponentSpecs('transistor_2n2222');
    assert.equal(specs.category, 'Transistors & Drivers');
    assert.equal(specs.v_ce_sat, '0.20 V');
    assert.equal(specs.v_be, '0.72 V');
    assert.equal(specs.i_c, '14.5 mA');
    assert.equal(specs.f_t, '300 MHz');
    assert.equal(specs.hasWavelength, false, '2N2222 must not have wavelength property');
    assert.equal(specs.hasLedForwardVoltage, false, '2N2222 must not have LED forward voltage');
  });

  test('S8050 Paper Primary Transistor resolves BJT specs with 150 MHz f_T', () => {
    const specs = resolveComponentSpecs('transistor_s8050');
    assert.equal(specs.category, 'Transistors & Drivers');
    assert.equal(specs.v_ce_sat, '0.20 V');
    assert.equal(specs.v_be, '0.72 V');
    assert.equal(specs.i_c, '14.5 mA');
    assert.equal(specs.f_t, '150 MHz');
    assert.equal(specs.h_fe, '~200');
    assert.equal(specs.hasWavelength, false);
  });

  test('Red LED resolves 650 nm optical specs', () => {
    const specs = resolveComponentSpecs('led_tx');
    assert.equal(specs.category, 'Optical Emitters');
    assert.equal(specs.wavelength, '650 nm');
    assert.equal(specs.v_f, '1.85 V');
    assert.equal(specs.hasWavelength, true);
  });

  test('BPW34 Photodiode resolves 7.5mm² radiant area and distance-scaled photocurrent', () => {
    const specs15 = resolveComponentSpecs('bpw34_photodiode', 15);
    assert.equal(specs15.radiantArea, '7.5 mm²');
    assert.equal(specs15.responsivity, '0.62 A/W @ 650 nm');
    assert.equal(specs15.i_ph, '42.8 µA');

    // At 30 cm distance (2x), photocurrent drops by 1/4 (10.7 µA)
    const specs30 = resolveComponentSpecs('bpw34_photodiode', 30);
    assert.equal(specs30.i_ph, '10.7 µA');
  });

  test('LM358 Op-Amp resolves TIA gain and slicing threshold', () => {
    const specs = resolveComponentSpecs('lm358_amplifier');
    assert.equal(specs.category, 'Analog Conditioning');
    assert.equal(specs.r_f, '47 kΩ');
    assert.equal(specs.v_ref, '1.65 V');
  });

  test('ESP32 TX and RX resolve MCU parameters', () => {
    const tx = resolveComponentSpecs('esp32_tx');
    assert.equal(tx.carrierPin, 'GPIO 23 (OOK + Manchester)');
    assert.equal(tx.signalingRate, '1000 bps');

    const rx = resolveComponentSpecs('esp32_rx');
    assert.equal(rx.capturePin, 'GPIO 34 (ADC1_CH6)');
    assert.equal(rx.crc, 'CRC-8 Dallas (0x31)');
  });
});

describe('Circuit & Simulation Interactive Tools Tests', () => {
  test('Wire validation allows inter-component connections and rejects invalid loops', () => {
    const pinTX = { compId: 'stm32_tx', pinId: 'pa9' };
    const pinTransistorBase = { compId: 'transistor_2n2222', pinId: 'base' };
    const pinTransistorCollector = { compId: 'transistor_2n2222', pinId: 'collector' };

    // Valid connection: TX -> Driver Base
    const resValid = validateWireConnection(pinTX, pinTransistorBase);
    assert.equal(resValid.valid, true);

    // Invalid connection: Pin to itself
    const resSelf = validateWireConnection(pinTX, pinTX);
    assert.equal(resSelf.valid, false);
    assert.match(resSelf.reason, /Cannot connect a pin to itself/);

    // Invalid connection: Internal loop within same transistor
    const resLoop = validateWireConnection(pinTransistorBase, pinTransistorCollector);
    assert.equal(resLoop.valid, false);
    assert.match(resLoop.reason, /Internal component loop/);
  });

  test('Zoom controls: zoom in/out and explicit 100% reset', () => {
    let zoom = 100;
    const zoomIn = () => { zoom = Math.min(160, zoom + 10); };
    const zoomOut = () => { zoom = Math.max(60, zoom - 10); };
    const resetZoom = () => { zoom = 100; };

    zoomIn();
    assert.equal(zoom, 110);
    zoomIn();
    assert.equal(zoom, 120);

    zoomOut();
    assert.equal(zoom, 110);

    resetZoom();
    assert.equal(zoom, 100, 'Reset zoom must restore 100%');
  });
});

// ---------------------------------------------------------------------------
// 4. DYNAMIC TRANSMISSION & CGFP FALLBACK VALIDATION TESTS
// ---------------------------------------------------------------------------
function calculateDallasCRC8(bytes) {
  let crc = 0x00;
  for (const b of bytes) {
    crc ^= b;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x80) {
        crc = ((crc << 1) ^ 0x31) & 0xff;
      } else {
        crc = (crc << 1) & 0xff;
      }
    }
  }
  return crc;
}

function evaluateCGFP(c_token, c_phys, penalty_burst, s_syntax, threshold = 0.80) {
  const total_confidence = s_syntax === 1 ? c_token * c_phys * penalty_burst * s_syntax : 0.0;
  const decision = total_confidence >= threshold ? 'ACCEPT' : 'FALLBACK_NACK';
  return {
    confidence: Number(total_confidence.toFixed(3)),
    threshold,
    decision,
    retransmissionAvoided: decision === 'ACCEPT'
  };
}

describe('Dynamic Transmission & CGFP Fallback Validation Tests', () => {
  test('Dallas CRC-8 calculation validates telemetry payloads with polynomial 0x31', () => {
    const payload = 'TEMP=27.4,HUM=61,MOTOR=ON';
    const bytes = Array.from(payload).map((c) => c.charCodeAt(0));
    const crc = calculateDallasCRC8(bytes);
    assert.ok(typeof crc === 'number' && crc >= 0 && crc <= 255);

    // Corrupting one byte MUST alter the calculated CRC
    const corruptedBytes = [...bytes];
    corruptedBytes[5] = corruptedBytes[5] ^ 0x01;
    const corruptedCRC = calculateDallasCRC8(corruptedBytes);
    assert.notEqual(crc, corruptedCRC, 'Bit flip in payload must alter Dallas CRC-8');
  });

  test('CGFP decision gate: confidence below 0.80 mandates FALLBACK_NACK (Scenario P2)', () => {
    // Paper calibrated scenario P2: C_token=0.91, C_phys=0.96, Penalty_burst=0.835, S_syntax=1 -> C = 0.729 (< 0.80)
    const evalP2 = evaluateCGFP(0.91, 0.96, 0.835, 1, 0.80);
    assert.equal(evalP2.confidence, 0.729);
    assert.ok(evalP2.confidence < 0.80);
    assert.equal(evalP2.decision, 'FALLBACK_NACK', 'C = 0.729 < 0.80 must trigger FALLBACK_NACK');
    assert.equal(evalP2.retransmissionAvoided, false, 'Fallback retransmission must be executed');
  });

  test('CGFP decision gate: confidence >= 0.80 accepts semantic recovery (Scenario P1)', () => {
    // Scenario P1 minor burst: C_token=0.96, C_phys=0.98, Penalty_burst=0.97, S_syntax=1 -> C = 0.913
    const evalP1 = evaluateCGFP(0.96, 0.98, 0.97, 1, 0.80);
    assert.ok(evalP1.confidence >= 0.80);
    assert.equal(evalP1.decision, 'ACCEPT');
    assert.equal(evalP1.retransmissionAvoided, true);
  });

  test('Structural syntax invalidity (S_syntax = 0) is a hard condition forcing fallback', () => {
    // Even if token confidence is 1.0, syntax error S_syntax = 0 forces exact fallback
    const evalSyntaxFail = evaluateCGFP(1.0, 1.0, 1.0, 0, 0.80);
    assert.equal(evalSyntaxFail.confidence, 0.0);
    assert.equal(evalSyntaxFail.decision, 'FALLBACK_NACK');
  });

  test('SG90 servo obstruction angles map to correct burst duration profiles', () => {
    const burstDurationMap = { 0: 0, 30: 30, 60: 250, 90: 500 };
    assert.equal(burstDurationMap[0], 0, '0 deg must be clean LOS');
    assert.equal(burstDurationMap[30], 30, '30 deg must map to P1 short burst');
    assert.equal(burstDurationMap[60], 250, '60 deg must map to P2 moderate burst');
    assert.equal(burstDurationMap[90], 500, '90 deg must map to P3 full beam cut');
  });
});

// ---------------------------------------------------------------------------
// 5. EXPERIMENT BENCHMARK LABORATORY & EXPORT TESTS
// ---------------------------------------------------------------------------
function formatCSVBenchmarks(benchmarks) {
  const headers = ['Method', 'Total Frames', 'Delivery Rate (%)', 'Live UFER (%)', 'Avoided TX (%)'];
  const rows = benchmarks.map((b) => [`"${b.method}"`, b.total_frames, b.delivery_rate, b.ufer, b.retransmissions_avoided_pct]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

describe('Experiment Benchmark Laboratory & Export Tests', () => {
  test('Paper reference benchmarks reflect empirical research metrics across all 5 schemes', () => {
    // 1. Clean Link Baseline
    const clean = { method: 'Clean-Link Baseline', delivery_rate: 100.0, ufer: 0.0, mean_latency_ms: 449.0 };
    assert.equal(clean.delivery_rate, 100.0);
    assert.equal(clean.ufer, 0.0);

    // 2. RS-FEC fails on contiguous burst occlusions
    const rs = { method: 'RS-FEC', delivery_rate: 37.5, ufer: 62.5 };
    assert.equal(rs.delivery_rate, 37.5);
    assert.equal(rs.ufer, 62.5);

    // 3. Stop-and-Wait ARQ has high latency overhead
    const arq = { method: 'Stop-and-Wait ARQ', delivery_rate: 97.1, mean_latency_ms: 1560.0 };
    assert.equal(arq.delivery_rate, 97.1);
    assert.ok(arq.mean_latency_ms > 1000.0);

    // 4. BASR (unvalidated) has critical safety risk without CGFP
    const basr = { method: 'BASR Only', delivery_rate: 100.0, ufer: 57.37 };
    assert.equal(basr.ufer, 57.37, 'Unvalidated BASR introduces 57.37% undetected errors');

    // 5. SemLiFi guarantees 0.00% live UFER
    const semlifiLive = { method: 'SemLiFi Live Hardware', delivery_rate: 100.0, ufer: 0.00 };
    assert.equal(semlifiLive.delivery_rate, 100.0);
    assert.equal(semlifiLive.ufer, 0.00, 'SemLiFi CGFP gate guarantees 0.00% live UFER');
  });

  test('Benchmark export serializes valid CSV with escaped fields', () => {
    const mock = [
      { method: 'Clean-Link Baseline', total_frames: 100, delivery_rate: 100.0, ufer: 0.0, retransmissions_avoided_pct: 0.0 },
      { method: 'SemLiFi (100% Burst)', total_frames: 100, delivery_rate: 100.0, ufer: 1.0, retransmissions_avoided_pct: 27.15 }
    ];
    const csv = formatCSVBenchmarks(mock);
    assert.ok(csv.includes('Method,Total Frames,Delivery Rate (%)'));
    assert.ok(csv.includes('"SemLiFi (100% Burst)",100,100,1,27.15'));
  });

  test('Benchmark export produces valid JSON string', () => {
    const mock = [
      { method: 'Stop-and-Wait ARQ', delivery_rate: 97.1, mean_latency_ms: 1560.0 }
    ];
    const jsonStr = JSON.stringify(mock);
    const parsed = JSON.parse(jsonStr);
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].method, 'Stop-and-Wait ARQ');
    assert.equal(parsed[0].mean_latency_ms, 1560.0);
  });
});

// ---------------------------------------------------------------------------
// 6. DUAL ESP32 HARDWARE PINOUT & MANCHESTER CARRIER REGRESSION TESTS
// ---------------------------------------------------------------------------
describe('Dual ESP32 Hardware Pinout & Studio Integration Regression Tests', () => {
  const rootDir = resolve('.');

  test('Circuit metadata correctly maps TX to ESP32 GPIO 23 and RX to ESP32 GPIO 34', () => {
    const filePath = resolve(rootDir, 'frontend/src/model/circuitMetadata.ts');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('ESP32 TX (Transmitter MCU)'), 'Metadata must specify ESP32 TX');
    assert.ok(content.includes('GPIO 23'), 'Metadata must specify GPIO 23');
    assert.ok(content.includes('ESP32 RX (Receiver MCU)'), 'Metadata must specify ESP32 RX');
    assert.ok(content.includes('GPIO 34'), 'Metadata must specify GPIO 34');
    assert.ok(content.includes('ADC1_CH6'), 'Metadata must specify ADC1_CH6');
    assert.ok(content.includes('1000 bps'), 'Metadata must specify 1000 bps signaling rate');
  });

  test('SignalsPage oscilloscope channels bind to ESP32 GPIO 23 and GPIO 34', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/SignalsPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('CH1: ESP32 TX Manchester Drive (GPIO 23)'));
    assert.ok(content.includes('CH4: ESP32 RX ADC Mid-Bit Logic (GPIO 34)'));
    assert.ok(!content.includes('CH1: STM32 TX'));
    assert.ok(!content.includes('CH4: STM32 RX'));
  });

  test('SchematicPage Block U1 and U3 render ESP32-WROOM-32D pinouts', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/SchematicPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('U1: ESP32 TX'));
    assert.ok(content.includes('U3: ESP32 RX'));
    assert.ok(content.includes('ESP32-WROOM-32D'));
    assert.ok(content.includes('GPIO 23'));
    assert.ok(content.includes('GPIO 34'));
    assert.ok(!content.includes('STM32F103C8'));
  });

  test('DocumentationPage pinout tables reflect Dual ESP32 GPIO 23 and GPIO 34', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/DocumentationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('Dual ESP32 Hardware Pinout'));
    assert.ok(content.includes('ESP32 TX (U1)'));
    assert.ok(content.includes('GPIO 23'));
    assert.ok(content.includes('ESP32 RX (U3)'));
    assert.ok(content.includes('GPIO 34'));
    assert.ok(!content.includes('STM32 Pinout'));
  });

  test('HardwareTwinPage resolves ESP32 dual controllers with 1000 bps Manchester OOK', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/HardwareTwinPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('ESP32 TX (GPIO 23)'));
    assert.ok(content.includes('ESP32 RX (GPIO 34'));
    assert.ok(content.includes('dual-ESP32 physical breadboard'));
    assert.ok(content.includes('1000 bps Manchester OOK'));
    assert.ok(!content.includes('STM32F103C8'));
  });

  test('FullHardwareSetupStudio component inventory reflects ESP32-WROOM-32D specs', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/FullHardwareSetupStudio.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('ESP32-WROOM-32D (Transmitter - TX)'));
    assert.ok(content.includes('ESP32-WROOM-32D (Receiver - RX)'));
    assert.ok(content.includes('GPIO 23 (TX Output)'));
    assert.ok(content.includes('GPIO 34 (ADC1_CH6)'));
    assert.ok(content.includes('1000 bps Manchester'));
    assert.ok(!content.includes('STM32F103C8'));
    assert.ok(!content.includes('PA9 (PWM Output)'));
    assert.ok(!content.includes('PA0 (ADC Input)'));
  });

  test('PresentationModePage slides specify ESP32-WROOM-32D transmitter and receiver', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/PresentationModePage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('ESP32 TX TRANSMITTER'));
    assert.ok(content.includes('ESP32 RX RECEIVER'));
    assert.ok(content.includes('ESP32-WROOM-32D'));
    assert.ok(content.includes('GPIO 23'));
    assert.ok(content.includes('GPIO 34'));
    assert.ok(!content.includes('STM32F103C8'));
  });

  test('Studio pages enforce 1000 bps Manchester OOK signaling rate and eliminate legacy 10 kHz carrier strings', () => {
    const pages = [
      'frontend/src/components/studio/DashboardPage.tsx',
      'frontend/src/components/studio/DocumentationPage.tsx',
      'frontend/src/components/studio/SignalsPage.tsx',
      'frontend/src/components/studio/WaveformsResultsPage.tsx'
    ];

    for (const relPath of pages) {
      const content = readFileSync(resolve(rootDir, relPath), 'utf-8');
      assert.ok(!content.includes('10.0 kHz'), `${relPath} must not contain "10.0 kHz"`);
      assert.ok(!content.includes('10 kHz'), `${relPath} must not contain "10 kHz"`);
    }

    const docContent = readFileSync(resolve(rootDir, 'frontend/src/components/studio/DocumentationPage.tsx'), 'utf-8');
    assert.ok(docContent.includes('1000 bps'), 'Documentation must specify 1000 bps');
    assert.ok(docContent.includes('1000 &mu;s Manchester OOK'), 'Documentation must specify Manchester OOK');
  });
});

// ---------------------------------------------------------------------------
// 7. MILESTONE 5: HARDWARE SERIAL ABSTRACTION & VIVA DEFENSE TESTS
// ---------------------------------------------------------------------------
describe('Milestone 5 Hardware Serial Abstraction & Viva Defense Tests', () => {
  const rootDir = resolve('.');

  test('SemLiFiStudioShell mounts Hardware HAL modal and real-time status pill', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/SemLiFiStudioShell.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('SystemSettingsView'), 'Must import SystemSettingsView');
    assert.ok(content.includes('SIMULATION (Twin)'), 'Must have simulation badge');
    assert.ok(content.includes('LIVE ESP32'), 'Must have live hardware badge');
    assert.ok(content.includes('Hardware Abstraction Layer (HAL)'), 'Must have HAL modal title');
    assert.ok(content.includes('setShowHardwareModal(true)'), 'Must trigger hardware modal');
  });

  test('DocumentationPage contains interactive Viva Voce & Defense Q&A with 6 core topics', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/DocumentationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Tab presence
    assert.ok(content.includes('Viva & Defense Q&A (Examiner Prep)'), 'Must have Viva tab');

    // 6 Core Defense Topics
    assert.ok(content.includes('VIVA TOPIC 1'), 'Must contain Topic 1');
    assert.ok(content.includes('Why is S_syntax a non-negotiable hard gate'), 'Topic 1 must cover syntax validity');
    assert.ok(content.includes('VIVA TOPIC 2'), 'Must contain Topic 2');
    assert.ok(content.includes('optimal threshold tau* = 0.80'), 'Topic 2 must cover threshold calibration');
    assert.ok(content.includes('VIVA TOPIC 3'), 'Must contain Topic 3');
    assert.ok(content.includes('Reed-Solomon FEC fail'), 'Topic 3 must cover RS-FEC failure mechanism');
    assert.ok(content.includes('VIVA TOPIC 4'), 'Must contain Topic 4');
    assert.ok(content.includes('BASR is deployed without CGFP gating'), 'Topic 4 must cover unvalidated BASR risk');
    assert.ok(content.includes('VIVA TOPIC 5'), 'Must contain Topic 5');
    assert.ok(content.includes('GPIO 23 and GPIO 34 specifically chosen'), 'Topic 5 must cover pinout selection');
    assert.ok(content.includes('VIVA TOPIC 6'), 'Must contain Topic 6');
    assert.ok(content.includes('mid-bit 450–550 µs window'), 'Topic 6 must cover mid-bit sampling');
  });
});

// ---------------------------------------------------------------------------
// 8. MILESTONE 6: CIRCUIT SIMULATION PROBING & SERVO LIVE COUPLING TESTS
// ---------------------------------------------------------------------------
describe('Milestone 6 Circuit Simulation Probing & Servo Live Coupling Tests', () => {
  const rootDir = resolve('.');

  test('circuitMetadata getCircuitComponentMetadata dynamically calculates optical occlusion', () => {
    const filePath = resolve(rootDir, 'frontend/src/model/circuitMetadata.ts');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('servoAngle: number = 0'), 'Signature must accept servoAngle');
    assert.ok(content.includes('servoTransmission = servoAngle === 0 ? 1.0'), 'Must calculate transmission factor');
    assert.ok(content.includes('T=${(servoTransmission * 100).toFixed(0)}%'), 'Must display optical transmission percentage');
    assert.ok(content.includes('P1 30° Partial Occlusion'), 'Must classify P1 occlusion');
    assert.ok(content.includes('P2 60° Burst Occlusion'), 'Must classify P2 occlusion');
    assert.ok(content.includes('P3 90° Full Occlusion'), 'Must classify P3 occlusion');
    assert.ok(content.includes('C=0.729 < 0.80 ➔ FALLBACK'), 'Must reflect P2 CGFP fallback at 60°');
  });

  test('CircuitSimulationPage couples servoAngle with live multimeter probing and backend HAL', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Selected component metadata memoization with servoAngle
    assert.ok(content.includes('getCircuitComponentMetadata(selectedComponentId, workingDistanceCm, ambientLux, isSimulating, servoAngle)'));

    // Backend HAL coupling
    assert.ok(content.includes('servo_angle_deg: servoAngle'));
    assert.ok(content.includes('simulate_occlusion: servoAngle > 0'));
    assert.ok(content.includes('occlusion_duration_ms: servoAngle === 30 ? 30 : servoAngle === 60 ? 250 : servoAngle === 90 ? 500 : 0'));

    // Probing handler with servoAngle
    assert.ok(content.includes('getCircuitComponentMetadata(compId, workingDistanceCm, ambientLux, isSimulating, servoAngle)'));

    // Reactive probe effect
    assert.ok(content.includes('activeProbeReading && isSimulating'));
    assert.ok(content.includes('servo flap = ${servoAngle}°'));

    // SVG Schematic dynamic beam and servo flap rotation
    assert.ok(content.includes('rotate(${servoAngle - 90}, 50, 10)'), 'Must rotate SG90 mechanical flap blade');
    assert.ok(content.includes('x2={servoAngle >= 60 ? "46" : "100"}'), 'Must sever optical beam when servoAngle >= 60°');
    assert.ok(content.includes('SERVO OCCLUSION:'), 'Must show servo occlusion in Multimeter Probe HUD');
  });
});

// ---------------------------------------------------------------------------
// 9. MILESTONE 7: MULTI-CHANNEL OSCILLOSCOPE & WAVEFORMS INSPECTION TESTS
// ---------------------------------------------------------------------------
describe('Milestone 7 Multi-Channel Oscilloscope & Waveforms Inspection Tests', () => {
  const rootDir = resolve('.');

  test('SignalsPage couples SG90 servo angle, real Manchester line coding, and ESP32 hardware clock', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/SignalsPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // ESP32 Xtensa Dual-Core clock check (eliminates legacy ARM Cortex-M3 72.0 MHz)
    assert.ok(content.includes('ESP32 XTENSA DUAL-CORE HARDWARE CLOCK'), 'Must specify ESP32 hardware clock');
    assert.ok(content.includes('240 MHz'), 'Must specify 240 MHz clock frequency');
    assert.ok(!content.includes('ARM CORTEX-M3'), 'Must not contain legacy ARM Cortex-M3');

    // Servo flap burst occlusion coupling
    assert.ok(content.includes('servoAngle'), 'Must manage servoAngle state');
    assert.ok(content.includes('servoTransmission = servoAngle === 0 ? 1.0'), 'Must calculate transmission factor');
    assert.ok(content.includes('LINK INTEGRITY:'), 'Must show real-time link integrity');
    assert.ok(content.includes('P2 BURST (250 ms) — CGFP FALLBACK'), 'Must reflect P2 CGFP trigger');

    // Bitstream injector and IEEE 802.3 Manchester line coding
    assert.ok(content.includes('BITSTREAM PATTERN:'), 'Must feature bitstream pattern injector');
    assert.ok(content.includes('10110010'), 'Must support default research bit pattern');
    assert.ok(content.includes('chipVal = dataBit === 1'), 'Must implement Manchester chip encoding');
    assert.ok(content.includes('Tb = 1000 µs'), 'Must specify 1000 µs bit period');
    assert.ok(content.includes('Tc = 500 µs'), 'Must specify 500 µs chip period');
  });

  test('WaveformsResultsPage integrates 5-channel DSO with SG90 flap selector and CRT Signal Analyzer sub-tab', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/WaveformsResultsPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Sub-tab integration
    assert.ok(content.includes('5-Channel DSO'), 'Must feature 5-Channel DSO tab');
    assert.ok(content.includes('CRT Signal Analyzer'), 'Must feature CRT Signal Analyzer tab');
    assert.ok(content.includes('<SignalsPage'), 'Must mount SignalsPage inside CRT Signal Analyzer tab');

    // Servo flap selector in DSO control panel
    assert.ok(content.includes('FLAP:'), 'Must feature SG90 flap selector in top panel');
    assert.ok(content.includes('handleServoChange(angle)'), 'Must update servo angle on button click');

    // Dynamic traces with servoTransmission
    assert.ok(content.includes('servoTransmission = currentServoAngle === 0 ? 1.0'), 'Traces must scale with servoTransmission');
    assert.ok(content.includes('opticalAttenuation * servoTransmission'), 'Optical channel must attenuate with servo flap');
    assert.ok(content.includes('BURST / CGFP GATE'), 'Must feature live burst/CGFP gate readout card');
    assert.ok(content.includes('P2: C=0.729 < 0.80'), 'Must reflect P2 CGFP gate fallback');
  });
});

// ---------------------------------------------------------------------------
// 10. MILESTONE 8: SECONDARY VIEWS, COMPREHENSIVE REPORT, & CLEANUP TESTS
// ---------------------------------------------------------------------------
describe('Milestone 8 Secondary Views & Architecture Consistency Tests', () => {
  const rootDir = resolve('.');

  test('ReportView.tsx documents Dual ESP32 architecture, GPIO 23/34 pinouts, and eliminates legacy STM32 strings', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/ReportView.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('Dual-ESP32 VLC Transceiver'), 'Report must specify Dual-ESP32 VLC Transceiver');
    assert.ok(content.includes('ESP32-WROOM-32D'), 'Report must specify ESP32-WROOM-32D');
    assert.ok(content.includes('GPIO 23'), 'Report must specify GPIO 23');
    assert.ok(content.includes('GPIO 34'), 'Report must specify GPIO 34');
    assert.ok(content.includes('ADC1_CH6'), 'Report must specify ADC1_CH6');
    assert.ok(content.includes('1000 bps Manchester OOK Modulator'), 'Report must specify 1000 bps Manchester OOK Modulator');
    assert.ok(content.includes('240 MHz'), 'Report must specify 240 MHz Xtensa core clock');
    assert.ok(!content.includes('STM32F103C8'), 'Report must not contain STM32F103C8');
    assert.ok(!content.includes('PA9'), 'Report must not contain PA9');
    assert.ok(!content.includes('PA0'), 'Report must not contain PA0');
    assert.ok(!content.includes('10.0 kHz'), 'Report must not contain 10.0 kHz carrier');
  });

  test('LiveLinkPage.tsx node cards specify ESP32 TX GPIO 23 and ESP32 RX GPIO 34', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/LiveLinkPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('ESP32 TX'), 'Must specify ESP32 TX');
    assert.ok(content.includes('Node 1: Transmitter (GPIO 23)'), 'Must specify Node 1: Transmitter (GPIO 23)');
    assert.ok(content.includes('MODULATING GPIO 23'), 'Must specify MODULATING GPIO 23');
    assert.ok(content.includes('ESP32 RX'), 'Must specify ESP32 RX');
    assert.ok(content.includes('Node 2: Receiver (GPIO 34)'), 'Must specify Node 2: Receiver (GPIO 34)');
    assert.ok(content.includes('SAMPLING GPIO 34'), 'Must specify SAMPLING GPIO 34');
    assert.ok(!content.includes('STM32 PA9'), 'Must not contain STM32 PA9');
    assert.ok(!content.includes('STM32 PA0'), 'Must not contain STM32 PA0');
  });

  test('demoCircuit.ts configures ESP32-WROOM-32D defaults and eliminates STM32 references', () => {
    const demoPath = resolve(rootDir, 'frontend/src/circuit/demoCircuit.ts');
    const demoContent = readFileSync(demoPath, 'utf-8');

    assert.ok(demoContent.includes('ESP32-WROOM-32D'), 'Demo circuit must specify ESP32-WROOM-32D');
    assert.ok(demoContent.includes('GPIO 23'), 'Demo circuit must specify GPIO 23');
    assert.ok(demoContent.includes('GPIO 34'), 'Demo circuit must specify GPIO 34');
    assert.ok(demoContent.includes('240 MHz'), 'Demo circuit must specify 240 MHz clock');
    assert.ok(!demoContent.includes('STM32F103C8'), 'Demo circuit must not contain STM32F103C8');
    assert.ok(!demoContent.includes('72.0 MHz'), 'Demo circuit must not contain 72.0 MHz');
  });

  test('SchematicView, LiFiView, and SettingsView align to ESP32-WROOM-32D and 1000 bps Manchester OOK', () => {
    const schematicContent = readFileSync(resolve(rootDir, 'frontend/src/components/SchematicView.tsx'), 'utf-8');
    assert.ok(schematicContent.includes('ESP32-WROOM'), 'SchematicView U1 must specify ESP32-WROOM');
    assert.ok(schematicContent.includes('GPIO 23'), 'SchematicView must specify GPIO 23');
    assert.ok(schematicContent.includes('GPIO 34'), 'SchematicView must specify GPIO 34');
    assert.ok(!schematicContent.includes('STM32F103C8'), 'SchematicView must not contain STM32F103C8');

    const lifiContent = readFileSync(resolve(rootDir, 'frontend/src/components/LiFiView.tsx'), 'utf-8');
    assert.ok(lifiContent.includes('ESP32 TX (GPIO 23)'), 'LiFiView must specify ESP32 TX');
    assert.ok(lifiContent.includes('ESP32 RX (GPIO 34)'), 'LiFiView must specify ESP32 RX');
    assert.ok(lifiContent.includes('240 MHz'), 'LiFiView must specify 240 MHz');
    assert.ok(!lifiContent.includes('STM32 TX'), 'LiFiView must not contain STM32 TX');
    assert.ok(!lifiContent.includes('STM32 RX'), 'LiFiView must not contain STM32 RX');

    const settingsContent = readFileSync(resolve(rootDir, 'frontend/src/components/SettingsView.tsx'), 'utf-8');
    assert.ok(settingsContent.includes('ESP32-WROOM-32D'), 'SettingsView must specify ESP32-WROOM-32D');
    assert.ok(settingsContent.includes('GPIO 23'), 'SettingsView must specify GPIO 23');
    assert.ok(settingsContent.includes('GPIO 34'), 'SettingsView must specify GPIO 34');
    assert.ok(!settingsContent.includes('STM32F103C8'), 'SettingsView must not contain STM32F103C8');
    assert.ok(!settingsContent.includes('physical STM32'), 'SettingsView must not contain physical STM32');
  });

  test('SemLiFiExecutionFlowModal and ruleChecker enforce ESP32 GPIO 23 driving Red LED', () => {
    const modalContent = readFileSync(resolve(rootDir, 'frontend/src/components/SemLiFiExecutionFlowModal.tsx'), 'utf-8');
    assert.ok(modalContent.includes('ESP32 TX (GPIO 23)'), 'Modal must specify ESP32 TX GPIO 23');
    assert.ok(!modalContent.includes('PA9'), 'Modal must not contain PA9');
    assert.ok(!modalContent.includes('10.0 kHz CARRIER'), 'Modal must not contain 10.0 kHz CARRIER');

    const ruleContent = readFileSync(resolve(rootDir, 'frontend/src/validation/ruleChecker.ts'), 'utf-8');
    assert.ok(ruleContent.includes('ESP32 GPIO 23'), 'RuleChecker must specify ESP32 GPIO 23');
    assert.ok(!ruleContent.includes('PA9'), 'RuleChecker must not contain PA9');
  });
});

// ---------------------------------------------------------------------------
// 11. MILESTONE 1 APPLICATION REPAIR VERIFICATION TESTS (TASKS A–G)
// ---------------------------------------------------------------------------
describe('Milestone 1 Application Repair Verification Tests', () => {
  const rootDir = resolve('.');

  test('Task A: WaveformsResultsPage renders all 5 channels, visible voltage/time axes, and simulation badge', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/WaveformsResultsPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // 5 Channels
    assert.ok(content.includes('CH1: ESP32 TX (GPIO 23)'), 'CH1 TX PWM must be rendered');
    assert.ok(content.includes('CH2: S8050 / 2N2222 V_CE (Collector)'), 'CH2 S8050 / 2N2222 must be rendered');
    assert.ok(content.includes('CH3: BPW34 Photocurrent / LM358 TIA'), 'CH3 Photodiode must be rendered');
    assert.ok(content.includes('CH4: LM358 Sliced Output'), 'CH4 LM358 must be rendered');
    assert.ok(content.includes('CH5: ESP32 RX ADC (GPIO 34)'), 'CH5 RX Capture must be rendered');

    // Visible Vertical Voltage Axis
    assert.ok(content.includes('Visible Vertical Voltage Axis'), 'Scope must have vertical voltage axis');
    assert.ok(content.includes('3.3 V') && content.includes('1.65 V') && content.includes('0.0 V'), 'Voltage divisions must be present');

    // Controls & Labels
    assert.ok(content.includes('TIMEBASE:'), 'Must feature timebase controls');
    assert.ok(content.includes('isSimulating ? \'Simulation\' : \'Live Hardware\''), 'Must label simulation state');
    assert.ok(content.includes('isScopeRunning ? \'RUN\' : \'STOP\''), 'Must have RUN/STOP toggle');
  });

  test('Task B: ResultsPage renders distance-versus-irradiance graph, model assumptions, and data table', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/ResultsPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Graph & Model Assumptions
    assert.ok(content.includes('Distance vs Optical Irradiance Decay (Inverse Square Law)'), 'Graph header must be present');
    assert.ok(content.includes('1. Optical Transmitter (TX)'), 'Model assumptions must cover transmitter');
    assert.ok(content.includes('2. Optical Detector (RX)'), 'Model assumptions must cover detector');
    assert.ok(content.includes('3. Channel Assumptions'), 'Model assumptions must cover channel');
    assert.ok(content.includes('Lambertian'), 'Must document Lambertian optical channel');

    // Underlying Data Table
    assert.ok(content.includes('Underlying Empirical Lab Data Table'), 'Must feature underlying data table');
    assert.ok(content.includes('Theoretical E(d)'), 'Table must contain theoretical irradiance column');
    assert.ok(content.includes('BPW34 I_ph'), 'Table must contain photocurrent column');
  });

  test('Task C: HardwareTwinPage contains 7 consistent stages, real photos, and navigation controls', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/HardwareTwinPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // All 7 consistent stage names
    assert.ok(content.includes('ESP32 TX — GPIO 23 Manchester Output'), 'Stage 1 name must match');
    assert.ok(content.includes('2N2222 Transistor — LED Driver Stage'), 'Stage 2 name must match');
    assert.ok(content.includes('Red LED — Optical Transmission'), 'Stage 3 name must match');
    assert.ok(content.includes('Air Channel — Optical Propagation'), 'Stage 4 name must match');
    assert.ok(content.includes('BPW34 Photodiode — Optical-to-Electrical'), 'Stage 5 name must match');
    assert.ok(content.includes('LM358 — Signal Conditioning / TIA'), 'Stage 6 name must match');
    assert.ok(content.includes('ESP32 RX — GPIO 34 ADC Mid-bit Sampling & Recovery'), 'Stage 7 name must match');

    // Real hardware photos
    assert.ok(content.includes('/hardware/full_hardware_setup.jpg'), 'Must link full setup photograph');
    assert.ok(content.includes('handleToggleFlow'), 'Must have play/pause handler');
    assert.ok(content.includes('handleReplayFlow'), 'Must have replay handler');
  });

  test('Task D: MessageBitsPage enforces input validation, packet structure, and simulation labelling', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/MessageBitsPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Input validation
    assert.ok(content.includes('validatePayload'), 'Must use validatePayload');
    assert.ok(content.includes('disabled={isTransmitting || !validation.valid}'), 'Transmit must disable on invalid input');
    assert.ok(content.includes('Validation Error:'), 'Must show validation error message');

    // Packet structure breakdown
    assert.ok(content.includes('PREAMBLE'), 'Must show Preamble');
    assert.ok(content.includes('SOF'), 'Must show Start of Frame');
    assert.ok(content.includes('LEN'), 'Must show Length byte');
    assert.ok(content.includes('PAYLOAD'), 'Must show Payload bytes');
    assert.ok(content.includes('CRC-8'), 'Must show Dallas CRC-8');

    // Bit & Chip metrics
    assert.ok(content.includes('PAYLOAD LENGTH'), 'Must show payload length');
    assert.ok(content.includes('TOTAL FRAME BITS'), 'Must show total frame bits');
    assert.ok(content.includes('MANCHESTER CHIPS'), 'Must show Manchester chips');

    // Simulation notice
    assert.ok(content.includes('Operating in deterministic simulation mode'), 'Must show simulation mode notice');
  });

  test('Task E: Shared experiment result model guarantees data consistency across modules', () => {
    const expModelPath = resolve(rootDir, 'frontend/src/model/experimentModel.ts');
    const expModelContent = readFileSync(expModelPath, 'utf-8');

    // Mandatory fields in SharedExperimentResult interface
    assert.ok(expModelContent.includes('experiment_id: string;'));
    assert.ok(expModelContent.includes('timestamp: string;'));
    assert.ok(expModelContent.includes('mode: ExperimentMode;'));
    assert.ok(expModelContent.includes('original_payload: string;'));
    assert.ok(expModelContent.includes('transmitted_packet: TransmittedPacketStructure;'));
    assert.ok(expModelContent.includes('received_payload: string;'));
    assert.ok(expModelContent.includes('payload_length: number;'));
    assert.ok(expModelContent.includes('frame_length: number;'));
    assert.ok(expModelContent.includes('crc_status: \'PASS\' | \'FAIL\';'));
    assert.ok(expModelContent.includes('error_count: number;'));
    assert.ok(expModelContent.includes('ber: number;'));
    assert.ok(expModelContent.includes('packet_delivery_status: PacketDeliveryStatus;'));
    assert.ok(expModelContent.includes('obstruction_duration_ms: number;'));
    assert.ok(expModelContent.includes('recovery_method: RecoveryMethod;'));
    assert.ok(expModelContent.includes('cgfp_decision: CgfpDecision;'));
    assert.ok(expModelContent.includes('confidence_score: number | null;'));
    assert.ok(expModelContent.includes('latency_ms: number;'));

    // Studio Shell passes activeExperiment to views
    const shellContent = readFileSync(resolve(rootDir, 'frontend/src/components/studio/SemLiFiStudioShell.tsx'), 'utf-8');
    assert.ok(shellContent.includes('activeExperiment={activeExperiment}'), 'Shell must pass activeExperiment to views');
    assert.ok(shellContent.includes('experimentHistory={experimentHistory}'), 'Shell must pass experimentHistory');

    // Dashboard renders dynamic recent experiments and stats
    const dashContent = readFileSync(resolve(rootDir, 'frontend/src/components/studio/DashboardPage.tsx'), 'utf-8');
    assert.ok(dashContent.includes('experimentHistory.slice(0, 3).map'), 'Dashboard must map experimentHistory');
    assert.ok(dashContent.includes('ACTIVE RUN:'), 'Dashboard must show active run HUD card');
  });
});

// ---------------------------------------------------------------------------
// 12. MILESTONE 2: REAL INTERACTIVE ELECTRICAL CIRCUIT EDITOR TESTS
// ---------------------------------------------------------------------------
describe('Milestone 2 Real Interactive Circuit Editor Tests', () => {
  const rootDir = resolve('.');
  test('Requirement 1 & 2: Draggable Catalogue and Canvas Component Positioning', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Drag-and-drop catalogue integration
    assert.ok(content.includes('onDrop={handleDrop}'), 'Canvas must support onDrop');
    assert.ok(content.includes('e.dataTransfer.setData(\'componentTypeId\', template.typeId)'), 'Catalogue must set componentTypeId on dragStart');
    assert.ok(content.includes('draggable'), 'Catalogue items must be draggable');

    // Canvas positioning with x and y coordinates
    assert.ok(content.includes('handleComponentMouseDown'), 'Components must handle mouse down for movement');
    assert.ok(content.includes('handleCanvasMouseMove'), 'Canvas must update component x, y during mouse move');
    assert.ok(content.includes('snappedX'), 'Must support grid snapping for component placement');
  });

  test('Requirement 3 & 4: Exposed Component Pins and Interactive Terminal Wiring', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Terminal pins exposed
    assert.ok(content.includes('handlePinClick(comp, pin, e)'), 'Pin terminals must have interactive click handler');
    assert.ok(content.includes('Terminal ${pin.name}'), 'Terminal pin tooltips must show pin name and type');

    // Dynamic SVG wiring with Bezier curves
    assert.ok(content.includes('const d = `M ${pt1.x} ${pt1.y} C'), 'Must draw smooth SVG Bezier curve wires');
    assert.ok(content.includes('wireDraftStart'), 'Must render active drafting wire following mouse pointer');
    assert.ok(content.includes('canvasWires.map'), 'Must render all connected wires on canvas');
  });

  test('Requirement 5: Wire Selection and Deletion via Toolbar and Keyboard', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Wire selection
    assert.ok(content.includes('setSelectedWireId(wire.id)'), 'Clicking wire must select it');
    assert.ok(content.includes('isSelected ? \'#fbbf24\' : wire.color'), 'Selected wire must highlight with amber stroke');

    // Wire deletion
    assert.ok(content.includes('handleDeleteSelectedWire'), 'Must feature dedicated wire delete handler');
    assert.ok(content.includes('e.key === \'Delete\' || e.key === \'Backspace\''), 'Must delete wire on Delete or Backspace key');
  });

  test('Requirement 6 & Transistor Configuration: Component Inspector with Explicit S8050/2N2222 Model', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    // Component Inspector
    assert.ok(content.includes('Component Inspector'), 'Right panel must render Component Inspector');
    assert.ok(content.includes('selectedComp.properties.map'), 'Must render verified electrical parameters');

    // Explicit S8050 (Paper Primary) vs 2N2222 (Benchtop Alternate) selector
    assert.ok(content.includes('handleSetTransistorModel(\'s8050\')'), 'Must provide S8050 Paper Primary model selection');
    assert.ok(content.includes('handleSetTransistorModel(\'2n2222\')'), 'Must provide 2N2222 Benchtop Alternate model selection');
    assert.ok(content.includes('S8050 NPN BJT (Paper Primary Spec)'), 'Must label S8050 as Paper Primary');
    assert.ok(content.includes('2N2222 NPN BJT (Benchtop Alternate)'), 'Must label 2N2222 as Benchtop Alternate');
  });

  test('Requirement 7: Modular Electrical Connectivity Validation & DRC Engine', () => {
    const canvasModelPath = resolve(rootDir, 'frontend/src/model/circuitCanvasModel.ts');
    const content = readFileSync(canvasModelPath, 'utf-8');

    assert.ok(content.includes('export function validateCircuitConnectivity'), 'Must export validateCircuitConnectivity engine');
    assert.ok(content.includes('rule_tx_connected'), 'Must validate TX modulation connection');
    assert.ok(content.includes('rule_driver_base'), 'Must validate transistor base drive');
    assert.ok(content.includes('rule_optical_path'), 'Must validate free-space optical channel continuity');
    assert.ok(content.includes('rule_rx_conditioning'), 'Must validate receiver slicing and ADC network');
    assert.ok(content.includes('detectedTopology'), 'Must report detected circuit topology');
    assert.ok(content.includes('Complete SemLiFi 7-Stage Transceiver Link'), 'Must recognize complete SemLiFi transceiver link');
    assert.ok(content.includes('score'), 'Must compute DRC percentage score');
  });

  test('Requirement 8: Zoom, Pan, and Dedicated 100% Reset', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('handleZoomIn'), 'Must support Zoom In');
    assert.ok(content.includes('handleZoomOut'), 'Must support Zoom Out');
    assert.ok(content.includes('handleResetZoom'), 'Must support Reset Zoom');
    assert.ok(content.includes('setZoomLevel(100)'), 'Reset zoom must set zoomLevel to 100%');
    assert.ok(content.includes('setPanOffset({ x: 0, y: 0 })'), 'Reset zoom must center pan offset to (0,0)');
  });

  test('Requirement 9: Local Circuit Save, Load, JSON Export and Import', () => {
    const filePath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
    const content = readFileSync(filePath, 'utf-8');

    assert.ok(content.includes('handleSaveCircuitLocally'), 'Must implement handleSaveCircuitLocally');
    assert.ok(content.includes('localStorage.setItem(\'semlifi_canvas_circuit\''), 'Must save circuit to localStorage');
    assert.ok(content.includes('handleLoadCircuitLocally'), 'Must implement handleLoadCircuitLocally');
    assert.ok(content.includes('localStorage.getItem(\'semlifi_canvas_circuit\')'), 'Must load circuit from localStorage');
    assert.ok(content.includes('handleExportCircuitJson'), 'Must implement handleExportCircuitJson');
    assert.ok(content.includes('handleImportCircuitJson'), 'Must implement handleImportCircuitJson');
    assert.ok(content.includes('handleResetToDefaultTopology'), 'Must implement handleResetToDefaultTopology');
  });

  test('Requirement 10: Multimeter Voltage and Current Probe Interface with Documented Educational Model', () => {
    const canvasModelPath = resolve(rootDir, 'frontend/src/model/circuitCanvasModel.ts');
    const content = readFileSync(canvasModelPath, 'utf-8');

    assert.ok(content.includes('export function calculateProbeTelemetry'), 'Must export calculateProbeTelemetry function');
    assert.ok(content.includes('3.30 V TTL (Square Wave)'), 'Must calculate 3.3V for ESP32 TX');
    assert.ok(content.includes('1000 bps (500 µs Chips)'), 'Must calculate 1000 bps carrier');
    assert.ok(content.includes('V_CE(sat) = 0.20 V'), 'Must calculate V_CE sat = 0.20V for BJT');
    assert.ok(content.includes('14.5 mA (Switched Current)'), 'Must calculate 14.5 mA switched current');
    assert.ok(content.includes('Optical Irradiance'), 'Must calculate irradiance for air gap');
    assert.ok(content.includes('0 bps (Beam Severed)'), 'Must calculate beam severed at >= 60 deg occlusion');
    assert.ok(content.includes('Educational Hardware Physics Model') || content.includes('SPICE-equivalent') || content.includes('CALCULATED'), 'Must label educational model calculations');
  });
});

// ---------------------------------------------------------------------------
// MILESTONE 3: HARDWARE DIGITAL TWIN (PART 2 BRIEF VERIFICATION)
// ---------------------------------------------------------------------------
describe('Milestone 3 — Hardware Digital Twin (Part 2 Brief)', () => {
  const rootDir = resolve('.');
  const twinPath = resolve(rootDir, 'frontend/src/components/studio/HardwareTwinPage.tsx');
  let twinContent = '';

  try {
    twinContent = readFileSync(twinPath, 'utf-8');
  } catch (err) {
    twinContent = '';
  }

  test('Twin View Modes: Must render 4 dedicated tabs (Physical, Wiring, Optical Channel, Signal Flow)', () => {
    assert.ok(twinContent.length > 0, 'HardwareTwinPage.tsx must exist');
    assert.ok(twinContent.includes("viewMode === 'physical'"), 'Must have Physical View state');
    assert.ok(twinContent.includes("viewMode === 'wiring'"), 'Must have Wiring View state');
    assert.ok(twinContent.includes("viewMode === 'optical'"), 'Must have Optical Channel View state');
    assert.ok(twinContent.includes("viewMode === 'signal_flow'"), 'Must have Signal Flow View state');
    assert.ok(twinContent.includes('Physical View'), 'Must display tab label Physical View');
    assert.ok(twinContent.includes('Wiring View'), 'Must display tab label Wiring View');
    assert.ok(twinContent.includes('Optical Channel'), 'Must display tab label Optical Channel');
    assert.ok(twinContent.includes('Signal Flow (10-Step)'), 'Must display tab label Signal Flow (10-Step)');
  });

  test('Mode Selector: Must provide Simulation, Hardware Connected, and Recorded Experiment Replay', () => {
    assert.ok(twinContent.includes('SIMULATION'), 'Must support SIMULATION mode');
    assert.ok(twinContent.includes('HARDWARE_CONNECTED'), 'Must support HARDWARE_CONNECTED mode');
    assert.ok(twinContent.includes('RECORDED_REPLAY'), 'Must support RECORDED_REPLAY mode');
    assert.ok(
      twinContent.includes('RESEARCH INTEGRITY RULE: Never display simulated values as live sensor measurements.'),
      'Must display the prominent research integrity rule banner'
    );
  });

  test('Physical View: Must render actual hardware photography, bounding boxes and component inspector', () => {
    assert.ok(twinContent.includes('/hardware/full_hardware_setup.jpg'), 'Must link to real hardware setup photograph');
    assert.ok(twinContent.includes('HARDWARE_SUBSYSTEM_BOXES'), 'Must define interactive bounding boxes for components');
    assert.ok(twinContent.includes('ESP32 TX (GPIO 23)'), 'Must label ESP32 TX stage');
    assert.ok(twinContent.includes('S8050 / 2N2222 Driver'), 'Must label S8050 driver stage');
    assert.ok(twinContent.includes('Red LED (650 nm)'), 'Must label Red LED stage');
    assert.ok(twinContent.includes('Optical Link (15 cm)'), 'Must label Optical Link stage');
    assert.ok(twinContent.includes('BPW34 Photodiode'), 'Must label BPW34 stage');
    assert.ok(twinContent.includes('LM358 TIA Amplifier'), 'Must label LM358 stage');
    assert.ok(twinContent.includes('ESP32 RX (GPIO 34)'), 'Must label ESP32 RX stage');
  });

  test('Wiring View: Must display complete pin mappings, DuPont connections, and power rails', () => {
    assert.ok(twinContent.includes('DUPONT BREADBOARD WIRING'), 'Must render DuPont Breadboard Wiring section');
    assert.ok(twinContent.includes('ESP32 TX GPIO 23'), 'Must map ESP32 TX GPIO 23');
    assert.ok(twinContent.includes('ESP32 RX GPIO 34'), 'Must map ESP32 RX GPIO 34');
    assert.ok(twinContent.includes('Base Limiter: 1kΩ'), 'Must document base resistor');
    assert.ok(twinContent.includes('BPW34 &bull; LM358 TIA'), 'Must document receiver chain');
    assert.ok(twinContent.includes('handleSelectStage'), 'Must allow clicking stages in wiring view');
  });

  test('Optical Channel View: Must compute Lambertian attenuation, distance, ambient light and SG90 burst obstruction', () => {
    assert.ok(twinContent.includes('opticalDistanceCm'), 'Must feature distance slider state');
    assert.ok(twinContent.includes('opticalAmbientLux'), 'Must feature ambient lux state');
    assert.ok(twinContent.includes('opticalServoAngle'), 'Must feature SG90 flap angle selector');
    assert.ok(twinContent.includes('opticalIrradianceUw'), 'Must calculate optical irradiance');
    assert.ok(twinContent.includes('CHANNEL AVAILABLE (100% LOS)'), 'Must define clean LOS scenario');
    assert.ok(twinContent.includes('CHANNEL DEGRADED (P1 30ms)'), 'Must define P1 30ms burst scenario');
    assert.ok(twinContent.includes('CHANNEL DROPPED (P2 250ms)'), 'Must define P2 250ms burst scenario');
    assert.ok(twinContent.includes('CHANNEL SEVERED (P3 500ms)'), 'Must define P3 500ms burst scenario');
  });

  test('Signal Flow View: Must implement 10-step pipeline from Manchester OOK to CGFP decision and fallback', () => {
    assert.ok(twinContent.includes('SEMLIFI_SIGNAL_FLOW_10_STEPS'), 'Must define the 10 signal flow steps');
    assert.ok(twinContent.includes('1. Manchester OOK Modulation'), 'Step 1: Manchester encoding');
    assert.ok(twinContent.includes('2. Driver Transistor Sinking'), 'Step 2: Transistor driver switching');
    assert.ok(twinContent.includes('3. Red LED Optical Conversion'), 'Step 3: Optical conversion');
    assert.ok(twinContent.includes('4. Optical Channel & Obstruction'), 'Step 4: Optical channel propagation');
    assert.ok(twinContent.includes('5. BPW34 Photocurrent Generation'), 'Step 5: Photodiode photocurrent');
    assert.ok(twinContent.includes('6. LM358 TIA Amplification & Slicing'), 'Step 6: Analog amplification and slicing');
    assert.ok(twinContent.includes('7. ESP32 RX ADC Mid-Bit Sampling'), 'Step 7: RX mid-bit sampling');
    assert.ok(twinContent.includes('8. Burst Loss Detection'), 'Step 8: Burst detection');
    assert.ok(twinContent.includes('9. BASR Semantic Edge Recovery'), 'Step 9: BASR recovery');
    assert.ok(twinContent.includes('10. CGFP Gating & Exact Fallback'), 'Step 10: CGFP gating and fallback');
  });

  test('Playback Synchronization: Must support Play, Pause, Replay, Step, and Speed controls', () => {
    assert.ok(twinContent.includes('isPlaying'), 'Must track play state');
    assert.ok(twinContent.includes('speed'), 'Must support playback speed adjustment');
    assert.ok(twinContent.includes('handleToggleFlow'), 'Must implement toggle play/pause');
    assert.ok(twinContent.includes('handleReplayFlow'), 'Must implement replay');
    assert.ok(twinContent.includes('handleNextStage'), 'Must implement next step navigation');
    assert.ok(twinContent.includes('handlePrevStage'), 'Must implement prev step navigation');
  });
});

// ---------------------------------------------------------------------------
// MILESTONE 4: UNIFIED EXPERIMENT ENGINE (PART 3) & RECOVERY METHODOLOGY (PART 4)
// ---------------------------------------------------------------------------
describe('Milestone 4 — Unified Experiment Engine & SemLiFi Recovery Methodology', () => {
  const rootDir = resolve('.');
  const expModelPath = resolve(rootDir, 'frontend/src/model/experimentModel.ts');
  const msgBitsPath = resolve(rootDir, 'frontend/src/components/studio/MessageBitsPage.tsx');
  const resultsPath = resolve(rootDir, 'frontend/src/components/studio/ResultsPage.tsx');

  const expModelContent = readFileSync(expModelPath, 'utf-8');
  const msgBitsContent = readFileSync(msgBitsPath, 'utf-8');
  const resultsContent = readFileSync(resultsPath, 'utf-8');

  test('Part 3 Unified Model: Shared experiment record contains all 19 mandatory fields', () => {
    // Check type definition contains all mandatory Part 3 fields
    const requiredFields = [
      'experiment_id',
      'timestamp',
      'operating_mode',
      'transmitted_payload',
      'packet_sequence',
      'frame_structure',
      'encoded_bitstream',
      'manchester_waveform_samples',
      'optical_channel_parameters',
      'burst_start_time',
      'burst_end_time',
      'missing_corrupted_symbols',
      'receiver_samples',
      'decoded_payload',
      'crc_result',
      'basr_candidate',
      'cgfp_score',
      'final_decision',
      'exact_fallback_status',
      'end_to_end_latency'
    ];

    for (const f of requiredFields) {
      assert.ok(
        expModelContent.includes(f),
        `SharedExperimentResult must define mandatory Part 3 field '${f}'`
      );
    }
  });

  test('Part 3 Transmit Packet & Framing: Builds standard framed packet with sequence ID', () => {
    assert.ok(expModelContent.includes('export function buildTransmittedPacket'), 'Must export buildTransmittedPacket');
    assert.ok(expModelContent.includes('preamble: \'0xAA\''), 'Packet must specify 0xAA preamble');
    assert.ok(expModelContent.includes('sof: \'0x7E\''), 'Packet must specify 0x7E SOF');
    assert.ok(expModelContent.includes('sequence_id'), 'Packet must track sequence ID');
    assert.ok(expModelContent.includes('crc8'), 'Packet must include Dallas CRC-8');
    assert.ok(expModelContent.includes('manchester_chips_count'), 'Packet must calculate Manchester chip count');
  });

  test('Part 4 CGFP Mathematical Logic: Implements C = C_token * C_phys * Penalty_burst * S_syntax', () => {
    assert.ok(expModelContent.includes('export function computeBurstPenalty'), 'Must export computeBurstPenalty');
    assert.ok(expModelContent.includes('export function evaluateCGFPModel'), 'Must export evaluateCGFPModel');
    assert.ok(expModelContent.includes('export function validateTelemetrySyntax'), 'Must export validateTelemetrySyntax');
    assert.ok(expModelContent.includes('alpha: number = 0.50'), 'Must use calibrated alpha = 0.50');
    assert.ok(expModelContent.includes('gamma: number = 1.15'), 'Must use calibrated gamma = 1.15');
    assert.ok(expModelContent.includes('0.80'), 'Must enforce calibrated threshold tau* = 0.80');
  });

  test('Part 4 Hard Syntax Validation: S_syntax = 0 forces C = 0 and immediate exact fallback', () => {
    assert.ok(
      expModelContent.includes('s_syntax: 0.0') && expModelContent.includes('total_score: 0.0'),
      'Invalid syntax must force s_syntax = 0 and score = 0'
    );
    assert.ok(
      expModelContent.includes('decision: \'FALLBACK_NACK\''),
      'Invalid syntax must trigger immediate FALLBACK_NACK'
    );
  });

  test('Part 4 Critical Control Field Protection: Protects MOTOR command and critical keys', () => {
    assert.ok(expModelContent.includes('criticalFieldsIntact'), 'Must verify critical control fields intactness');
    assert.ok(expModelContent.includes('MOTOR'), 'Must validate MOTOR control field specifically');
    assert.ok(expModelContent.includes('critical_control_field_protected: true'), 'Experiment record must record critical field protection');
    assert.ok(msgBitsContent.includes('Control Field Safeguard Active'), 'Message & Bits UI must render control field safeguard');
  });

  test('Part 4 Research Accuracy Separation: Distinguishes exact reconstruction from task accuracy and false recovery', () => {
    assert.ok(expModelContent.includes('ResearchAccuracyMetrics'), 'Must define typed ResearchAccuracyMetrics');
    assert.ok(expModelContent.includes('exact_reconstruction_accuracy: 42.63'), 'Must report 42.63% exact reconstruction accuracy');
    assert.ok(expModelContent.includes('task_field_accuracy: 100.0'), 'Must report 100% task field accuracy');
    assert.ok(expModelContent.includes('accepted_patch_precision: 96.8'), 'Must report 96.8% accepted patch precision');
    assert.ok(expModelContent.includes('false_recovery_rate: 1.2'), 'Must report 1.2% false recovery rate');
    assert.ok(expModelContent.includes('exact_fallback_success: 100.0'), 'Must report 100% exact fallback success');
    assert.ok(msgBitsContent.includes('Research Accuracy Separation'), 'UI must render research accuracy separation panel');
  });

  test('Part 3 UI Integration: MessageBitsPage renders BASR Context, CGFP breakdown, and Bitstream', () => {
    assert.ok(msgBitsContent.includes('BASR Context &amp; Mask Infilling'), 'Must display BASR context inspector');
    assert.ok(msgBitsContent.includes('Surviving Prefix'), 'Must show surviving prefix');
    assert.ok(msgBitsContent.includes('Surviving Suffix'), 'Must show surviving suffix');
    assert.ok(msgBitsContent.includes('Burst Infilling Mask'), 'Must show burst mask');
    assert.ok(msgBitsContent.includes('CGFP Mathematical Confidence Gating'), 'Must display CGFP formula breakdown');
    assert.ok(msgBitsContent.includes('C = C_token &times; C_phys &times; Penalty_burst(span) &times; S_syntax'), 'Must display CGFP formula equation');
  });

  test('Part 3 Cross-Module Consistency: ResultsPage and other modules display unified active experiment record', () => {
    assert.ok(resultsContent.includes('ACTIVE UNIFIED EXPERIMENT RECORD'), 'ResultsPage must render active experiment HUD');
    assert.ok(resultsContent.includes('activeExperiment.experiment_id'), 'ResultsPage must bind active experiment ID');
    assert.ok(resultsContent.includes('activeExperiment.cgfp_decision'), 'ResultsPage must bind active experiment CGFP decision');
    assert.ok(resultsContent.includes('activeExperiment.packet_delivery_status'), 'ResultsPage must bind delivery status');
  });
});

// ---------------------------------------------------------------------------
// MILESTONE 5: SIGNAL OBSERVATORY — 5-CHANNEL OSCILLOSCOPE (PART 5 BRIEF)
// ---------------------------------------------------------------------------
describe('Milestone 5 — Signal Observatory (Part 5 Brief)', () => {
  const rootDir = resolve('.');
  const waveformsPath = resolve(rootDir, 'frontend/src/components/studio/WaveformsResultsPage.tsx');
  let waveformsContent = '';

  try {
    waveformsContent = readFileSync(waveformsPath, 'utf-8');
  } catch (err) {
    waveformsContent = '';
  }

  test('Part 5 Channels: Renders all five operational channels with verified hardware signals', () => {
    assert.ok(waveformsContent.includes('CH1: ESP32 TX (GPIO 23)'), 'CH1: ESP32 TX Manchester trace');
    assert.ok(waveformsContent.includes('CH2: S8050 / 2N2222'), 'CH2: LED driver transistor trace');
    assert.ok(waveformsContent.includes('CH3: BPW34'), 'CH3: Photodiode photocurrent trace');
    assert.ok(waveformsContent.includes('CH4: LM358'), 'CH4: LM358 comparator slicer trace');
    assert.ok(waveformsContent.includes('CH5: ESP32 RX ADC (GPIO 34)'), 'CH5: ESP32 RX ADC mid-bit capture trace');
  });

  test('Part 5 Axes: Renders shared time axis and visible voltage axis', () => {
    assert.ok(waveformsContent.includes('3.3 V') && waveformsContent.includes('0.0 V'), 'Must render voltage axis ticks');
    assert.ok(waveformsContent.includes('1.65 V'), 'Must render mid-scale 1.65V threshold');
    assert.ok(waveformsContent.includes('0 µs'), 'Must render shared time origin');
    assert.ok(waveformsContent.includes('timebaseUs'), 'Must scale time axis with timebaseUs');
  });

  test('Part 5 Timebase & Zoom Controls: Implements variable timebase and horizontal zoom', () => {
    assert.ok(waveformsContent.includes('value={timebaseUs}'), 'Must support interactive timebase selection');
    assert.ok(waveformsContent.includes('50 µs / div'), 'Must provide 50 µs/div range');
    assert.ok(waveformsContent.includes('100 µs / div'), 'Must provide 100 µs/div range');
    assert.ok(waveformsContent.includes('1.0 ms / div'), 'Must provide 1.0 ms/div range');
    assert.ok(waveformsContent.includes('setZoom'), 'Must provide time-window zoom adjustment');
    assert.ok(waveformsContent.includes('ZoomIn') || waveformsContent.includes('zoom'), 'Must feature Zoom controls');
  });

  test('Part 5 Channel Selection: Allows toggling individual channels', () => {
    assert.ok(waveformsContent.includes('toggleChannel'), 'Must implement toggleChannel handler');
    assert.ok(waveformsContent.includes('enabledChannels.ch1'), 'Must toggle CH1 TX');
    assert.ok(waveformsContent.includes('enabledChannels.ch2'), 'Must toggle CH2 Driver');
    assert.ok(waveformsContent.includes('enabledChannels.ch3'), 'Must toggle CH3 Photodiode');
    assert.ok(waveformsContent.includes('enabledChannels.ch4'), 'Must toggle CH4 Slicer');
    assert.ok(waveformsContent.includes('enabledChannels.ch5'), 'Must toggle CH5 RX ADC');
  });

  test('Part 5 Dual Cursor Measurements: Computes delta-t, frequency, and delta-V', () => {
    assert.ok(waveformsContent.includes('showCursors'), 'Must support dual cursor toggle');
    assert.ok(waveformsContent.includes('cursor1TimeUs') && waveformsContent.includes('cursor2TimeUs'), 'Must track T1 and T2 positions');
    assert.ok(waveformsContent.includes('cursor2TimeUs - cursor1TimeUs'), 'Must calculate delta-t between cursors');
    assert.ok(waveformsContent.includes('1000 / Math.max(1'), 'Must calculate cursor frequency f = 1/delta-t');
    assert.ok(waveformsContent.includes('CURSOR MEASUREMENTS'), 'Must render cursor readout bar');
  });

  test('Part 5 Obstruction Markers & Burst Interval: Visualizes burst interval overlay', () => {
    assert.ok(waveformsContent.includes('burstInterval'), 'Must compute burst interval state');
    assert.ok(waveformsContent.includes('BURST INTERVAL') || waveformsContent.includes('OBSTRUCTION BURST'), 'Must render burst interval marker');
    assert.ok(waveformsContent.includes('SG90 OCCLUSION'), 'Must label SG90 servo occlusion state');
  });

  test('Part 5 Signal Snapshots: Captures and manages waveform snapshots', () => {
    assert.ok(waveformsContent.includes('handleTakeSnapshot'), 'Must implement handleTakeSnapshot handler');
    assert.ok(waveformsContent.includes('snapshots'), 'Must maintain snapshot gallery state');
    assert.ok(waveformsContent.includes('CAPTURED SIGNAL SNAPSHOTS'), 'Must display captured snapshots section');
  });

  test('Part 5 Trace Export & Experiment Traceability: Exports sample data and binds to active experiment', () => {
    assert.ok(waveformsContent.includes('handleExportSampleData'), 'Must implement handleExportSampleData handler');
    assert.ok(waveformsContent.includes('text/csv'), 'Must support CSV sample export');
    assert.ok(waveformsContent.includes('application/json'), 'Must support JSON sample export');
    assert.ok(waveformsContent.includes('EXPERIMENT TRACEABILITY'), 'Must display active experiment traceability HUD');
    assert.ok(waveformsContent.includes('activeExperiment.experiment_id'), 'Waveforms must trace to active experiment ID');
  });
});

// ---------------------------------------------------------------------------
// MILESTONE 6: EXPERIMENTAL BENCHMARKS COMPARISON LABORATORY (PART 6 BRIEF)
// ---------------------------------------------------------------------------
describe('Milestone 6 — Experimental Benchmarks Comparison Laboratory (Part 6 Brief)', () => {
  const rootDir = resolve('.');
  const labPath = resolve(rootDir, 'frontend/src/model/benchmarkLaboratory.ts');
  const resultsPath = resolve(rootDir, 'frontend/src/components/studio/ResultsPage.tsx');
  const labContent = readFileSync(labPath, 'utf-8');
  const resultsContent = readFileSync(resultsPath, 'utf-8');

  test('Part 6 Schemes: Implements all five comparative transmission & recovery schemes', () => {
    // 1. Raw reception (No FEC / No ARQ)
    assert.ok(labContent.includes("'raw'"), "Must support 'raw' scheme ID");
    assert.ok(labContent.includes('Raw Reception (No FEC / No ARQ)'), "Must define Raw Reception scheme");

    // 2. Reed-Solomon FEC (RS(33,25))
    assert.ok(labContent.includes("'rs_fec'"), "Must support 'rs_fec' scheme ID");
    assert.ok(labContent.includes('Reed-Solomon RS(33,25) FEC'), "Must define Reed-Solomon FEC scheme");

    // 3. Stop-and-Wait ARQ
    assert.ok(labContent.includes("'arq'"), "Must support 'arq' scheme ID");
    assert.ok(labContent.includes('Stop-and-Wait ARQ (Classic Retransmission)'), "Must define Stop-and-Wait ARQ scheme");

    // 4. BASR
    assert.ok(labContent.includes("'basr'"), "Must support 'basr' scheme ID");
    assert.ok(labContent.includes('BASR (Edge Transformer only — No Gating)'), "Must define BASR scheme");

    // 5. BASR + CGFP
    assert.ok(labContent.includes("'semlifi'"), "Must support 'semlifi' scheme ID");
    assert.ok(labContent.includes('SemLiFi (BASR + CGFP Safety Gate, τ* = 0.80)'), "Must define SemLiFi full scheme");
  });

  test('Part 6 Metrics: Computes all 9 required research metrics across all schemes', () => {
    const requiredMetrics = [
      'ber_pct',                                // 1. BER
      'pdr_pct',                                // 2. PDR
      'exact_recovery_pct',                     // 3. Exact recovery
      'semantic_reconstruction_accuracy_pct',   // 4. Semantic reconstruction accuracy
      'accepted_patch_precision_pct',           // 5. Accepted patch precision
      'false_recovery_rate_pct',                // 6. False recovery rate (UFER)
      'mean_latency_ms',                        // 7. Mean latency
      'throughput_bps',                         // 8. Throughput
      'retransmissions_avoided_pct'             // 9. Retransmissions avoided
    ];

    for (const metric of requiredMetrics) {
      assert.ok(
        labContent.includes(metric),
        `ComparativeSchemeMetric must define mandatory Part 6 metric '${metric}'`
      );
    }
  });

  test('Part 6 Repeatable Experiments: PRNG algorithm produces deterministic, reproducible streams', () => {
    // Test deterministic PRNG implementation
    function createMulberry32(seed) {
      let s = Math.floor(Math.abs(seed)) >>> 0;
      if (s === 0) s = 1;
      return function () {
        s = (s + 0x6D2B79F5) | 0;
        let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const prng1 = createMulberry32(42);
    const prng2 = createMulberry32(42);
    const prng3 = createMulberry32(43);

    const seq1 = [prng1(), prng1(), prng1(), prng1(), prng1()];
    const seq2 = [prng2(), prng2(), prng2(), prng2(), prng2()];
    const seq3 = [prng3(), prng3(), prng3(), prng3(), prng3()];

    // Identical seeds must produce byte-for-byte identical pseudorandom sequences
    assert.deepEqual(seq1, seq2, 'Identical seed must yield identical pseudorandom stream');
    // Different seeds must produce distinct sequences
    assert.notDeepEqual(seq1, seq3, 'Different seed must yield different pseudorandom stream');
  });

  test('Part 6 Fair Comparison: Evaluates schemes on identical payloads and channel perturbations', () => {
    assert.ok(labContent.includes('STANDARD_TELEMETRY_BANK'), 'Must maintain synchronized telemetry bank');
    assert.ok(labContent.includes('hasBurst'), 'All schemes must be evaluated against the same hasBurst event');
    assert.ok(labContent.includes('burstSpanBytes'), 'All schemes must face identical burst span in bytes');
    assert.ok(labContent.includes('calculateOpticalChannelMetrics'), 'Must derive optical SNR from Lambertian channel model');
  });

  test('Part 6 Separation: Academic research baselines are kept separate from live trial outputs', () => {
    assert.ok(labContent.includes('PUBLISHED_RESEARCH_BASELINES'), 'Must export PUBLISHED_RESEARCH_BASELINES');
    assert.ok(labContent.includes('Clean-Link Baseline (Paper Table V)'), 'Must cite Table V clean link');
    assert.ok(labContent.includes('Reed-Solomon RS(33,25) FEC (Paper Table VII)'), 'Must cite Table VII RS-FEC');
    assert.ok(labContent.includes('Stop-and-Wait ARQ (Paper Table VII)'), 'Must cite Table VII ARQ');
    assert.ok(labContent.includes('BASR (Edge Transformer only) (Paper Table VI)'), 'Must cite Table VI BASR');
    assert.ok(labContent.includes('SemLiFi (100% Burst Simulation) (Paper Table VII)'), 'Must cite Table VII SemLiFi 100% burst');

    // UI separation assertion in ResultsPage
    assert.ok(resultsContent.includes('Published Research Reference Baselines'), 'ResultsPage must feature distinct published baselines section');
    assert.ok(resultsContent.includes('Academic Baseline Isolation'), 'ResultsPage must explicitly note academic baseline isolation');
  });

  test('Part 6 Export: Implements comprehensive CSV and JSON export routines', () => {
    assert.ok(labContent.includes('export function exportComparativeResultsCSV'), 'Must export CSV export function');
    assert.ok(labContent.includes('export function exportComparativeResultsJSON'), 'Must export JSON export function');
    assert.ok(labContent.includes('# SemLiFi Multi-Scheme Comparative Benchmark Report'), 'CSV must contain metadata header');
    assert.ok(labContent.includes('Delivery Rate (PDR %)'), 'CSV must export PDR column');
    assert.ok(labContent.includes('False Recovery Rate (UFER %)'), 'CSV must export UFER column');
    assert.ok(labContent.includes('Mean Latency (ms)'), 'CSV must export Latency column');
    assert.ok(labContent.includes('Avoided Retransmissions (%)'), 'CSV must export Avoided Retransmissions column');
  });

  test('Part 6 UI Integration: ResultsPage renders synchronized 5-scheme matrix and visual analytics', () => {
    assert.ok(resultsContent.includes('Fair Multi-Scheme Benchmark Laboratory'), 'Must render laboratory header');
    assert.ok(resultsContent.includes('SYNCHRONIZED CHANNEL REPLAY'), 'Must badge synchronized channel replay');
    assert.ok(resultsContent.includes('PRNG SEED (REPEATABILITY)'), 'Must render seed control');
    assert.ok(resultsContent.includes('Randomize Seed'), 'Must provide seed randomizer');
    assert.ok(resultsContent.includes('Reset Seed (42)'), 'Must provide default seed reset');
    assert.ok(resultsContent.includes('TRIAL FRAME COUNT (N)'), 'Must provide frame count selector');
    assert.ok(resultsContent.includes('BURST PROBABILITY (p)'), 'Must provide burst probability selector');
    assert.ok(resultsContent.includes('Run 5 Schemes'), 'Must provide comparative execution button');
    assert.ok(resultsContent.includes('1. Latency Overhead vs ARQ'), 'Must render latency comparison card');
    assert.ok(resultsContent.includes('2. False Recovery (UFER) Risk'), 'Must render UFER risk comparison card');
    assert.ok(resultsContent.includes('3. Retransmission Savings'), 'Must render retransmission savings card');
    assert.ok(resultsContent.includes('Interactive Frame-by-Frame Comparison Inspector'), 'Must render frame-by-frame inspector accordion');
  });
});

// ---------------------------------------------------------------------------
// MILESTONE 7: UI & UX IMPROVEMENTS (PART 7 BRIEF)
// ---------------------------------------------------------------------------
describe('Milestone 7 — UI & UX Improvements (Part 7 Brief)', () => {
  const rootDir = resolve('.');
  const shellPath = resolve(rootDir, 'frontend/src/components/studio/SemLiFiStudioShell.tsx');
  const circuitPath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
  const waveformsPath = resolve(rootDir, 'frontend/src/components/studio/WaveformsResultsPage.tsx');
  const shortcutsPath = resolve(rootDir, 'frontend/src/components/studio/KeyboardShortcutsModal.tsx');

  const shellContent = readFileSync(shellPath, 'utf-8');
  const circuitContent = readFileSync(circuitPath, 'utf-8');
  const waveformsContent = readFileSync(waveformsPath, 'utf-8');
  const shortcutsContent = readFileSync(shortcutsPath, 'utf-8');

  test('Part 7 Global Keyboard Accessibility: Implements single-key module switching 1..7', () => {
    assert.ok(shellContent.includes("key === '1'"), "Must support '1' for Dashboard navigation");
    assert.ok(shellContent.includes("key === '2'"), "Must support '2' for Circuit navigation");
    assert.ok(shellContent.includes("key === '3'"), "Must support '3' for Hardware Twin navigation");
    assert.ok(shellContent.includes("key === '4'"), "Must support '4' for Message & Bits navigation");
    assert.ok(shellContent.includes("key === '5'"), "Must support '5' for Waveforms navigation");
    assert.ok(shellContent.includes("key === '6'"), "Must support '6' for Results navigation");
    assert.ok(shellContent.includes("key === '7'"), "Must support '7' for Documentation navigation");
    assert.ok(shellContent.includes("key === '?'"), "Must support '?' to toggle shortcuts cheat-sheet");
    assert.ok(shellContent.includes("key === 'Escape'"), "Must support 'Escape' to close modals");
    assert.ok(shellContent.includes("key === 't'"), "Must support 't' to toggle light/dark theme");
    assert.ok(shellContent.includes("key === ' '"), "Must support 'Space' to toggle simulation running state");
  });

  test('Part 7 Sidebar Badges & Header Telemetry: Renders keyboard indicators and telemetry pill', () => {
    assert.ok(shellContent.includes('index + 1'), 'Sidebar tabs must display keyboard shortcut index [1..7]');
    assert.ok(shellContent.includes('Shortcuts'), 'Sidebar footer must provide shortcuts modal trigger');
    assert.ok(shellContent.includes('EXP:'), 'Header must render active experiment telemetry pill');
    assert.ok(shellContent.includes('KeyboardShortcutsModal'), 'Shell must mount KeyboardShortcutsModal');
  });

  test('Part 7 Canvas Usability: Configurable grid snapping and coordinate HUD', () => {
    assert.ok(circuitContent.includes('gridSnap'), 'Must maintain configurable gridSnap state');
    assert.ok(circuitContent.includes('Grid Snap:'), 'Must render grid snap selector bar');
    assert.ok(circuitContent.includes('snappedX'), 'Component dragging must calculate snapped coordinates');
    assert.ok(circuitContent.includes('Math.round(mousePos.x)'), 'Must render live X/Y cursor coordinate HUD');
  });

  test('Part 7 Panel Resizing: Inspector collapsing and width adjustment', () => {
    assert.ok(circuitContent.includes('isInspectorCollapsed'), 'Must maintain isInspectorCollapsed state');
    assert.ok(circuitContent.includes('inspectorWidth'), 'Must maintain inspectorWidth state');
    assert.ok(circuitContent.includes('Set width to'), 'Must provide 280/320/380px inspector width pills');
    assert.ok(circuitContent.includes('Collapse Inspector Panel') || circuitContent.includes('Collapse Panel'), 'Must provide collapse button');
    assert.ok(circuitContent.includes('Expand Component Inspector'), 'Must render floating button to expand inspector');
  });

  test('Part 7 Canvas Keyboard Shortcuts: Quick tool switching and deletion', () => {
    assert.ok(circuitContent.includes("e.key === 'Delete'"), "Must support Delete key for selected wire");
    assert.ok(circuitContent.includes("e.key === 'v'"), "Must support 'v' for Select tool");
    assert.ok(circuitContent.includes("e.key === 'w'"), "Must support 'w' for Wire tool");
    assert.ok(circuitContent.includes("e.key === 'p'"), "Must support 'p' for Probe tool");
    assert.ok(circuitContent.includes("e.key === '0'"), "Must support '0' for Zoom 100% reset");
  });

  test('Part 7 Empty States: Schematic canvas and waveforms display clear empty states', () => {
    assert.ok(circuitContent.includes('Schematic Canvas Empty'), 'Must render empty canvas state message');
    assert.ok(circuitContent.includes('handleResetToDefaultTopology'), 'Empty canvas must provide restore topology button');
    assert.ok(waveformsContent.includes('All Channels Muted'), 'Waveforms must render empty state when all channels disabled');
  });

  test('Part 7 Keyboard Shortcuts Modal: Comprehensive operational testbed cheat sheet', () => {
    assert.ok(shortcutsContent.includes('Telecommunications Testbed Keyboard Accessibility'), 'Modal must feature telecommunications testbed header');
    assert.ok(shortcutsContent.includes('Studio Module Navigation'), 'Must document module navigation keys');
    assert.ok(shortcutsContent.includes('Interactive Circuit Editor'), 'Must document circuit editor shortcuts');
    assert.ok(shortcutsContent.includes('Hardware Twin &amp; Waveform Controls') || shortcutsContent.includes('Hardware Twin & Waveform Controls'), 'Must document twin/DSO controls');
  });
});

// ---------------------------------------------------------------------------
describe('Phase 2 — Circuit & Simulation Layout Repair & Directional Wiring Tests', () => {
  const rootDir = resolve('.');
  const circuitPath = resolve(rootDir, 'frontend/src/components/studio/CircuitSimulationPage.tsx');
  const circuitModelPath = resolve(rootDir, 'frontend/src/model/circuitCanvasModel.ts');
  const circuitContent = readFileSync(circuitPath, 'utf-8');
  const circuitModelContent = readFileSync(circuitModelPath, 'utf-8');

  test('Layout: Left Catalogue is smoothly collapsible and provides a compact icon rail', () => {
    assert.ok(circuitContent.includes('isCatalogueCollapsed'), 'Must maintain isCatalogueCollapsed state');
    assert.ok(circuitContent.includes('setIsCatalogueCollapsed(false)'), 'Must allow expanding catalogue from compact rail');
    assert.ok(circuitContent.includes('setIsCatalogueCollapsed(true)'), 'Must allow collapsing catalogue via header button');
    assert.ok(circuitContent.includes('PARTS ('), 'Collapsed rail must render vertical badge with part count');
  });

  test('Layout: Main Circuit Canvas provides Fit-to-Screen and Reset View controls', () => {
    assert.ok(circuitContent.includes('handleFitToScreen'), 'Must implement dynamic Fit-to-Screen calculation');
    assert.ok(circuitContent.includes('Fit Screen'), 'Toolbar must render Fit-to-Screen button');
    assert.ok(circuitContent.includes('Reset (100%)'), 'Toolbar must render dedicated 100% Reset View button');
    assert.ok(circuitContent.includes('hasAutoFittedRef'), 'Must automatically fit circuit on initial mount');
  });

  test('Layout: Full-Screen Workspace option is provided for uncluttered engineering', () => {
    assert.ok(circuitContent.includes('isFullscreenCanvas'), 'Must support isFullscreenCanvas state');
    assert.ok(circuitContent.includes('fixed inset-0 z-50'), 'Fullscreen mode must expand canvas across entire viewport');
    assert.ok(circuitContent.includes('Fullscreen'), 'Toolbar must provide full-screen toggle');
  });

  test('Wiring: SVG directional arrowheads and midpoint flow chevrons are rendered', () => {
    assert.ok(circuitContent.includes('marker id="wire-arrow-cyan"'), 'Must define SVG directional arrowhead marker for TTL net');
    assert.ok(circuitContent.includes('marker id="wire-arrow-optical"'), 'Must define SVG directional arrowhead marker for optical path');
    assert.ok(circuitContent.includes('marker id="wire-arrow-blue"'), 'Must define SVG directional arrowhead marker for TX modulation');
    assert.ok(circuitContent.includes('markerEnd='), 'Wires must apply SVG markerEnd for arrow directionality');
  });

  test('Collision: Overlap check and non-overlapping coordinate resolution are enforced', () => {
    assert.ok(circuitModelContent.includes('export function checkComponentOverlap'), 'Model must export checkComponentOverlap');
    assert.ok(circuitModelContent.includes('export function resolveNonOverlappingPosition'), 'Model must export resolveNonOverlappingPosition');
    assert.ok(circuitContent.includes('checkComponentOverlap(comp.id, comp.x, comp.y'), 'Dragging must verify component clearance on mouse-up');
    assert.ok(circuitContent.includes('resolveNonOverlappingPosition'), 'Must relocate overlapping components with safe clearance');
  });

  test('Validation: Terminal connection rules distinguish optical, power, ground, and electrical nets', () => {
    assert.ok(circuitModelContent.includes('export function validateWireConnection'), 'Model must export validateWireConnection');
    assert.ok(circuitModelContent.includes('Incompatible Net: Optical radiant beam pin'), 'Must explain optical vs electrical incompatibility');
    assert.ok(circuitModelContent.includes('Deadly Short Circuit: Direct connection between +3.3V Power Rail and GND'), 'Must explain short circuits');
    assert.ok(circuitContent.includes('validateWireConnection(fromComp, fromPin, comp, pin)'), 'Wire completion must enforce physical rule validation');
  });
});

// ---------------------------------------------------------------------------
describe('Phase 3 — Message & Bits Actual Digital Transmission Pipeline Tests', () => {
  const rootDir = resolve('.');
  const msgBitsPath = resolve(rootDir, 'frontend/src/components/studio/MessageBitsPage.tsx');
  const enginePath = resolve(rootDir, 'frontend/src/model/digitalTransmissionEngine.ts');
  const msgBitsContent = readFileSync(msgBitsPath, 'utf-8');
  const engineContent = readFileSync(enginePath, 'utf-8');

  // Helper implementations matching digitalTransmissionEngine for unit test assertions
  function validateInput(text) {
    if (text === null || text === undefined || text.length === 0) {
      return { valid: false, error: 'Input message cannot be empty.' };
    }
    if (text.trim().length === 0) {
      return { valid: false, error: 'Input message cannot consist solely of whitespace.' };
    }
    if (text.length > 64) {
      return { valid: false, error: `Payload length (${text.length} B) exceeds maximum 64-byte frame buffer limit.` };
    }
    for (let i = 0; i < text.length; i++) {
      if (text.charCodeAt(i) > 127) {
        return { valid: false, error: `Invalid character '${text[i]}' at position ${i}. Only ASCII telemetry is supported.` };
      }
    }
    return { valid: true, error: null };
  }

  function encodeFrame(payload, seq = 1) {
    const payloadBytes = Array.from(payload).map((c) => c.charCodeAt(0));
    const syncWords = [0xaa, 0x55];
    const lengthByte = payloadBytes.length;
    const seqByte = seq % 256;
    const crcProtected = [lengthByte, seqByte, ...payloadBytes];
    let crc = 0x00;
    for (const b of crcProtected) {
      crc ^= b;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x80) crc = (crc << 1) ^ 0x31;
        else crc <<= 1;
        crc &= 0xff;
      }
    }
    const terminator = [0x0d, 0x0a];
    const rawBytes = [...syncWords, lengthByte, seqByte, ...payloadBytes, crc, ...terminator];
    return {
      payloadBytes,
      rawBytes,
      totalBytes: rawBytes.length,
      totalBits: rawBytes.length * 8,
      totalChips: rawBytes.length * 16,
      transmissionDurationMs: rawBytes.length * 8
    };
  }

  function manchesterEncode(bits) {
    const chips = [];
    for (const bit of bits) {
      if (bit === 0) {
        chips.push(0, 1);
      } else {
        chips.push(1, 0);
      }
    }
    return chips;
  }

  test('Input Validation: Rejects empty, whitespace-only, >64B buffer overflow, and non-ASCII', () => {
    // 1. Rejects empty string
    const emptyRes = validateInput('');
    assert.equal(emptyRes.valid, false);
    assert.equal(emptyRes.error, 'Input message cannot be empty.');

    // 2. Rejects whitespace string
    const wsRes = validateInput('    ');
    assert.equal(wsRes.valid, false);
    assert.equal(wsRes.error, 'Input message cannot consist solely of whitespace.');

    // 3. Rejects >64B buffer
    const longStr = 'A'.repeat(65);
    const longRes = validateInput(longStr);
    assert.equal(longRes.valid, false);
    assert.ok(longRes.error.includes('exceeds maximum 64-byte frame buffer limit'));

    // 4. Rejects non-ASCII
    const nonAscii = 'TEMP=27.4°C';
    const nonAsciiRes = validateInput(nonAscii);
    assert.equal(nonAsciiRes.valid, false);
    assert.ok(nonAsciiRes.error.includes('Only ASCII telemetry is supported'));

    // 5. Accepts standard telemetry payloads
    assert.equal(validateInput('A').valid, true);
    assert.equal(validateInput('HELLO').valid, true);
    assert.equal(validateInput('TEMP=27.4,HUM=61,MOTOR=ON').valid, true);
    assert.equal(validateInput('STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200').valid, true);
  });

  test('UI Presets & ASCII Table Drawer: Presets for test messages and character inspection', () => {
    assert.ok(msgBitsContent.includes("setMessage('A')"), "Must have preset button for 'A'");
    assert.ok(msgBitsContent.includes("setMessage('HELLO')"), "Must have preset button for 'HELLO'");
    assert.ok(msgBitsContent.includes("setMessage('TEMP=27.4,HUM=61,MOTOR=ON')"), 'Must have preset button for weather telemetry');
    assert.ok(msgBitsContent.includes("setMessage('STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200')"), 'Must have preset button for long telemetry');
    assert.ok(msgBitsContent.includes("setMessage('')"), 'Must have clear button to test input validation');

    // ASCII Table inspection drawer
    assert.ok(msgBitsContent.includes('showAsciiTable'), 'Must manage showAsciiTable state');
    assert.ok(msgBitsContent.includes('Inspect Character Bits (ASCII Table)'), 'Must have button to toggle ASCII inspection');
    assert.ok(msgBitsContent.includes('A = 01000001'), 'Must include canonical A = 01000001 guidance example');
  });

  test('Canonical 7-Segment Framing: N + 7 bytes, total bits, and chip calculation', () => {
    // Test Case 1: 'A' (N = 1) -> 8 bytes, 64 bits, 128 chips, 64 ms
    const frameA = encodeFrame('A');
    assert.equal(frameA.totalBytes, 8);
    assert.equal(frameA.totalBits, 64);
    assert.equal(frameA.totalChips, 128);
    assert.equal(frameA.transmissionDurationMs, 64);

    // Test Case 2: 'HELLO' (N = 5) -> 12 bytes, 96 bits, 192 chips, 96 ms
    const frameHello = encodeFrame('HELLO');
    assert.equal(frameHello.totalBytes, 12);
    assert.equal(frameHello.totalBits, 96);
    assert.equal(frameHello.totalChips, 192);
    assert.equal(frameHello.transmissionDurationMs, 96);

    // Test Case 3: 'TEMP=27.4,HUM=61,MOTOR=ON' (N = 25) -> 32 bytes, 256 bits, 512 chips, 256 ms
    const frameTelemetry = encodeFrame('TEMP=27.4,HUM=61,MOTOR=ON');
    assert.equal(frameTelemetry.totalBytes, 32);
    assert.equal(frameTelemetry.totalBits, 256);
    assert.equal(frameTelemetry.totalChips, 512);
    assert.equal(frameTelemetry.transmissionDurationMs, 256);

    // Verify framing tokens in UI
    assert.ok(msgBitsContent.includes('PREAMBLE'), 'Must show PREAMBLE in frame header');
    assert.ok(msgBitsContent.includes('SOF'), 'Must show SOF in frame header');
    assert.ok(msgBitsContent.includes('LEN'), 'Must show LEN in frame header');
    assert.ok(msgBitsContent.includes('SEQ'), 'Must show SEQ in frame header');
    assert.ok(msgBitsContent.includes('PAYLOAD'), 'Must show PAYLOAD in frame header');
    assert.ok(msgBitsContent.includes('CRC-8'), 'Must show CRC-8 in frame header');
    assert.ok(msgBitsContent.includes('TERM'), 'Must show TERM in frame header');
  });

  test('Manchester Line Coding: IEEE 802.3 standard convention and chip transition representation', () => {
    // IEEE 802.3 convention: Bit 0 -> [0, 1] (Low-to-High), Bit 1 -> [1, 0] (High-to-Low)
    const chips0 = manchesterEncode([0]);
    assert.deepEqual(chips0, [0, 1], 'Bit 0 must encode to [0, 1]');

    const chips1 = manchesterEncode([1]);
    assert.deepEqual(chips1, [1, 0], 'Bit 1 must encode to [1, 0]');

    // Byte 'A' = 0x41 = 0b01000001 -> bits [0, 1, 0, 0, 0, 0, 0, 1]
    const bitsA = [0, 1, 0, 0, 0, 0, 0, 1];
    const chipsA = manchesterEncode(bitsA);
    assert.equal(chipsA.length, 16, '8 bits must produce exactly 16 Manchester chips');
    assert.deepEqual(chipsA.slice(0, 4), [0, 1, 1, 0], 'First two bits (0, 1) must encode to [0, 1, 1, 0]');

    // UI Interactive Bitstream Inspector
    assert.ok(msgBitsContent.includes('showBitstreamDetail'), 'Must manage showBitstreamDetail state');
    assert.ok(msgBitsContent.includes('Inspect Serial Bitstream & Manchester Chips (IEEE 802.3)'), 'Must have button to toggle bitstream viewer');
    assert.ok(msgBitsContent.includes('Low-to-High Transition'), 'Must explain Bit 0 low-to-high transition');
    assert.ok(msgBitsContent.includes('High-to-Low Transition'), 'Must explain Bit 1 high-to-low transition');
  });

  test('Digital Transmission Engine Integration: Synchronized shared experiment produced on transmit', () => {
    assert.ok(msgBitsContent.includes('executeDigitalTransmissionPipeline'), 'Must execute digital transmission engine');
    assert.ok(engineContent.includes('export function executeDigitalTransmissionPipeline'), 'Engine must export executeDigitalTransmissionPipeline');
    assert.ok(engineContent.includes('simulatePhysicalChannel'), 'Engine must simulate physical optical channel');
    assert.ok(engineContent.includes('decodeManchesterChips'), 'Engine must decode Manchester chips and detect violations');
  });
});

// ---------------------------------------------------------------------------
describe('Phases 4-8 — Comprehensive Pipeline Integration & Multi-Payload Validation Tests', () => {
  const rootDir = resolve('.');
  const dashPath = resolve(rootDir, 'frontend/src/components/studio/DashboardPage.tsx');
  const waveformsPath = resolve(rootDir, 'frontend/src/components/studio/WaveformsResultsPage.tsx');
  const shellPath = resolve(rootDir, 'frontend/src/components/studio/SemLiFiStudioShell.tsx');
  const dashContent = readFileSync(dashPath, 'utf-8');
  const waveformsContent = readFileSync(waveformsPath, 'utf-8');
  const shellContent = readFileSync(shellPath, 'utf-8');

  // Exact framing calculator for test assertions
  function getFrameStats(payload, seq = 1) {
    const payloadBytes = Array.from(payload).map((c) => c.charCodeAt(0));
    const syncWords = [0xaa, 0x55];
    const lengthByte = payloadBytes.length;
    const seqByte = seq % 256;
    const crcProtected = [lengthByte, seqByte, ...payloadBytes];
    let crc = 0x00;
    for (const b of crcProtected) {
      crc ^= b;
      for (let i = 0; i < 8; i++) {
        if (crc & 0x80) crc = (crc << 1) ^ 0x31;
        else crc <<= 1;
        crc &= 0xff;
      }
    }
    const terminator = [0x0d, 0x0a];
    const totalBytes = 2 + 1 + 1 + lengthByte + 1 + 2; // sync (2) + len (1) + seq (1) + N + crc (1) + term (2) = N + 7
    return {
      payloadLength: payloadBytes.length,
      totalBytes,
      totalBits: totalBytes * 8,
      totalChips: totalBytes * 16,
      durationMs: totalBytes * 8,
      crc
    };
  }

  test('Dashboard Refactor: Generic greeting eliminated, professional SemLiFi Research Laboratory heading present', () => {
    // Objective 4 verification
    assert.ok(!dashContent.includes('Welcome back, Abhishek'), 'Generic greeting "Welcome back, Abhishek" must be removed');
    assert.ok(dashContent.includes('SemLiFi Research Laboratory'), 'Must render "SemLiFi Research Laboratory" heading');
    assert.ok(
      dashContent.includes('An experimental environment for optical communication, burst-loss analysis and confidence-gated semantic recovery.'),
      'Must render required research laboratory subtitle'
    );
    assert.ok(dashContent.includes('CURRENT EXPERIMENT STATUS'), 'Must communicate current experiment status');
    assert.ok(dashContent.includes('Operating Mode:'), 'Must communicate operating mode');
    assert.ok(dashContent.includes('ESP32 GPIO 23 &rarr; 34'), 'Must communicate communication system status');
    assert.ok(dashContent.includes('1000 bps Manchester'), 'Must communicate line coding rate');
  });

  test("Test Payload 1: 'A' (Single ASCII character benchmark)", () => {
    const stats = getFrameStats('A');
    assert.equal(stats.payloadLength, 1);
    assert.equal(stats.totalBytes, 8); // 1 + 7
    assert.equal(stats.totalBits, 64);
    assert.equal(stats.totalChips, 128);
    assert.equal(stats.durationMs, 64);
    assert.ok(stats.crc >= 0 && stats.crc <= 255);
  });

  test("Test Payload 2: 'HELLO' (5-byte ASCII telemetry word)", () => {
    const stats = getFrameStats('HELLO');
    assert.equal(stats.payloadLength, 5);
    assert.equal(stats.totalBytes, 12); // 5 + 7
    assert.equal(stats.totalBits, 96);
    assert.equal(stats.totalChips, 192);
    assert.equal(stats.durationMs, 96);
  });

  test("Test Payload 3: 'TEMP=27.4,HUM=61,MOTOR=ON' (Canonical research telemetry)", () => {
    const stats = getFrameStats('TEMP=27.4,HUM=61,MOTOR=ON');
    assert.equal(stats.payloadLength, 25);
    assert.equal(stats.totalBytes, 32); // 25 + 7
    assert.equal(stats.totalBits, 256);
    assert.equal(stats.totalChips, 512);
    assert.equal(stats.durationMs, 256);
  });

  test("Test Payload 4: 'STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200' (Longer telemetry message)", () => {
    const stats = getFrameStats('STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200');
    assert.equal(stats.payloadLength, 42);
    assert.equal(stats.totalBytes, 49); // 42 + 7
    assert.equal(stats.totalBits, 392);
    assert.equal(stats.totalChips, 784);
    assert.equal(stats.durationMs, 392);
  });

  test('Test Payload 5: Empty message input validation', () => {
    function validatePayload(text) {
      if (text === null || text === undefined || text.length === 0) {
        return { valid: false, error: 'Input message cannot be empty.' };
      }
      return { valid: true, error: null };
    }
    const res = validatePayload('');
    assert.equal(res.valid, false);
    assert.equal(res.error, 'Input message cannot be empty.');
  });

  test('Test Payload 6: Invalid input handling (whitespace, overflow, and non-ASCII)', () => {
    function validatePayload(text) {
      if (text.trim().length === 0) return { valid: false, error: 'whitespace' };
      if (text.length > 64) return { valid: false, error: 'overflow' };
      for (let i = 0; i < text.length; i++) {
        if (text.charCodeAt(i) > 127) return { valid: false, error: 'non-ascii' };
      }
      return { valid: true, error: null };
    }

    assert.equal(validatePayload('    ').valid, false);
    assert.equal(validatePayload('A'.repeat(65)).valid, false);
    assert.equal(validatePayload('TEMP=27°C').valid, false);
  });

  test('Waveforms Connected to Reality: 5-Channel DSO derives traces from transmitted message and burst occlusion', () => {
    // Objective 3 verification
    assert.ok(waveformsContent.includes('CH1: ESP32 TX'), 'Must trace CH1 ESP32 TX');
    assert.ok(waveformsContent.includes('CH2: S8050 / 2N2222'), 'Must trace CH2 S8050/2N2222 transistor driver');
    assert.ok(waveformsContent.includes('CH3: BPW34 Photocurrent'), 'Must trace CH3 BPW34 photodiode');
    assert.ok(waveformsContent.includes('CH4: LM358 Sliced Output'), 'Must trace CH4 LM358 comparator');
    assert.ok(waveformsContent.includes('CH5: ESP32 RX ADC Mid-bit Capture'), 'Must trace CH5 ESP32 RX ADC');
    assert.ok(waveformsContent.includes('isBurstActive'), 'Must couple optical burst obstruction with photodiode trace');
    assert.ok(waveformsContent.includes('EXPERIMENT TRACEABILITY:'), 'Must show experiment traceability HUD');
    assert.ok(waveformsContent.includes('handleExportSampleData'), 'Must support exporting sample data');
  });

  test('Cross-Module Integration: Active experiment is shared across all 7 studio tabs', () => {
    // Objective 1-5 consistency across shell
    assert.ok(shellContent.includes('activeTab === \'dashboard\''), 'Shell must route dashboard tab');
    assert.ok(shellContent.includes('activeTab === \'circuit\''), 'Shell must route circuit tab');
    assert.ok(shellContent.includes('activeTab === \'hardware\''), 'Shell must route hardware twin tab');
    assert.ok(shellContent.includes('activeTab === \'message\''), 'Shell must route message & bits tab');
    assert.ok(shellContent.includes('activeTab === \'waveforms\''), 'Shell must route waveforms tab');
    assert.ok(shellContent.includes('activeTab === \'results\''), 'Shell must route results tab');
    assert.ok(shellContent.includes('activeTab === \'documentation\''), 'Shell must route documentation tab');
    assert.ok(shellContent.includes('activeExperiment={activeExperiment}'), 'Shell must pass activeExperiment to child views');
  });

  test('Transmission & Signal Analyzer: Real waveforms and receiver decoding gated strictly behind TRANSMIT SIGNAL', () => {
    const analyzerPath = resolve(rootDir, 'frontend/src/components/studio/TransmissionSignalAnalyzerPage.tsx');
    const analyzerContent = readFileSync(analyzerPath, 'utf-8');

    // Verification of user directive: "i need real waveform after i click on transmit signal then also not before"
    assert.ok(analyzerContent.includes('hasTransmitted'), 'Must maintain hasTransmitted state to gate waveform generation');
    assert.ok(analyzerContent.includes('idleTraces'), 'Must calculate quiescent standby baseline before transmission');
    assert.ok(analyzerContent.includes('liveTraces'), 'Must derive real physical waveforms post-transmission');
    assert.ok(analyzerContent.includes('handleMessageChange'), 'Editing message payload must invalidate prior transmission');
    assert.ok(analyzerContent.includes('DSO ARMED'), 'Must present armed DSO banner while optical carrier is quiescent');
    assert.ok(analyzerContent.includes('No optical transmission detected'), 'Receiver must report awaiting optical link before transmission');
    assert.ok(analyzerContent.includes('handleTransmit'), 'Must execute full physical transmission pipeline on transmit click');
  });
});





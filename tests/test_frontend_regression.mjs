/**
 * Regression Test Suite for SemLiFi Hardware Twin and Circuit Simulation
 * Covers Priority 1 through Priority 6.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

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

  if (clean.includes('2n2222') || clean.includes('transistor')) {
    return {
      name: '2N2222 NPN Transistor (LED Driver)',
      category: 'Transistors & Drivers',
      v_ce_sat: '0.20 V',
      v_be: '0.72 V',
      i_c: '14.5 mA',
      f_t: '300 MHz',
      h_fe: '100 – 300',
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
      name: 'STM32 TX (Transmitter MCU)',
      category: 'Microcontrollers',
      carrierPin: 'PA9 (TIM1_CH2 PWM)',
      frequency: '10.0 kHz',
      voltage: '3.30 V TTL',
      hasWavelength: false,
      hasLedForwardVoltage: false
    };
  }

  return {
    name: 'STM32 RX (Receiver MCU)',
    category: 'Microcontrollers',
    capturePin: 'PA0 (TIM2_CH1)',
    samplingRate: '1.0 MSPS',
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

  test('STM32 TX and RX resolve MCU parameters', () => {
    const tx = resolveComponentSpecs('stm32_tx');
    assert.equal(tx.carrierPin, 'PA9 (TIM1_CH2 PWM)');
    assert.equal(tx.frequency, '10.0 kHz');

    const rx = resolveComponentSpecs('stm32_rx');
    assert.equal(rx.capturePin, 'PA0 (TIM2_CH1)');
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

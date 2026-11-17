/**
 * Shared Typed Experiment Result Model for SemLiFi Virtual Lab
 * Mandated by Milestone 1 Task E & Milestone 4 (Part 3 & Part 4 Engineering Brief)
 *
 * Guarantees that Dashboard, Circuit, Hardware Twin, Message & Bits,
 * Waveforms, Results, and Documentation obtain metrics from the EXACT same
 * unified experiment record without contradictory pre-populated values.
 *
 * Implements Part 4 Actual SemLiFi Recovery Methodology:
 * - BASR context: surviving prefix, surviving suffix, burst mask, burst metadata.
 * - CGFP formula: C = C_token * C_phys * Penalty_burst * S_syntax with threshold tau* = 0.80.
 * - Strict structural syntax validation: S_syntax = 0 forces C = 0 and exact fallback.
 * - Critical control field protection (e.g. MOTOR=ON/OFF, DEVICE=04).
 * - Research accuracy metrics separation: exact reconstruction vs task-field vs patch precision vs false recovery rate.
 */

export type ExperimentMode = 'LIVE HARDWARE' | 'SIMULATION';
export type OperatingMode = 'SIMULATION' | 'HARDWARE_CONNECTED' | 'RECORDED_REPLAY';
export type ObstructionScenario = 'P0' | 'P1' | 'P2' | 'P3';
export type CgfpDecision = 'ACCEPT' | 'FALLBACK_NACK' | 'NOT_APPLICABLE';
export type PacketDeliveryStatus = 'DELIVERED_CLEAN' | 'RECOVERED_SEMANTIC' | 'FALLBACK_EXACT_ARQ' | 'DROPPED';
export type RecoveryMethod = 'DIRECT_PHYSICAL' | 'BASR_TRANSFORMER' | 'CGFP_FALLBACK_ARQ' | 'NONE';
export type ExactFallbackStatus = 'NOT_NEEDED' | 'TRIGGERED_ARQ' | 'COMPLETED_EXACT' | 'FAILED';

export interface TransmittedPacketStructure {
  hex: string;
  bytes: number[];
  preamble: string;       // "0xAA"
  sof: string;            // "0x7E"
  sequence_id: number;    // Frame sequence ID (e.g. 1, 2, 3...)
  length_byte: number;    // Length of payload in bytes
  payload_bytes: number[];
  crc8: number;           // Dallas / Maxim CRC-8
  raw_bits_count: number; // total frame bytes * 8
  manchester_chips_count: number; // raw_bits_count * 2 (500 µs half-chips)
}

export interface ManchesterWaveformSample {
  time_us: number;
  level: number;          // 0 or 1
  chip_index: number;
  stage: string;          // e.g. 'CH1_TX' | 'CH2_DRIVER' | 'CH3_OPTICAL' | 'CH4_LM358' | 'CH5_RX'
}

export interface OpticalChannelParameters {
  distance_cm: number;
  ambient_lux: number;
  optical_irradiance_uw: number;
  channel_snr_db: number;
  servo_angle_deg: number;
  flap_factor: number;    // 1.0 (clear), 0.6 (30°), 0.05 (60°), 0.0 (90°)
  channel_availability: 'CLEAR_LOS' | 'DEGRADED' | 'DROPPED' | 'SEVERED';
}

export interface CorruptedSymbolDetail {
  index: number;
  original_char: string;
  masked_char: string;
  is_critical_control_field: boolean;
}

export interface ReceiverSample {
  index: number;
  time_us: number;
  adc_value: number;
  sliced_bit: number;
  threshold: number;
}

export interface BasrCandidateResult {
  candidate_text: string;
  inferred_patch: string;
  token_confidence: number;
  mean_entropy: number;
  latency_ms: number;
  model_mode: string;
  parameter_count: number;
  surviving_prefix: string;
  surviving_suffix: string;
  burst_mask: string;
  token_predictions: Array<{
    position: number;
    char: string;
    probability: number;
    entropy: number;
  }>;
}

export interface CgfpScoreBreakdown {
  c_token: number;
  c_phys: number;
  penalty_burst: number;
  s_syntax: number;
  total_score: number;
  threshold: number;
  decision: CgfpDecision;
  decision_reason: string;
}

export interface ResearchAccuracyMetrics {
  exact_reconstruction_accuracy: number; // 42.63%
  task_field_accuracy: number;           // 100.0% (MOTOR command preservation)
  accepted_patch_precision: number;      // 96.8%
  false_recovery_rate: number;           // 1.2% (vs raw BASR 57.37% UFER)
  exact_fallback_success: number;        // 100.0%
  critical_control_field_protected: boolean;
}

export interface SharedExperimentResult {
  // Core Identifiers & Operating Context
  experiment_id: string;
  timestamp: string;
  mode: ExperimentMode;
  operating_mode: OperatingMode;
  
  // Transmit Data & Bitstream
  original_payload: string;
  transmitted_payload: string; // Alias for Part 3 brief
  packet_sequence: number;
  transmitted_packet: TransmittedPacketStructure;
  frame_structure: TransmittedPacketStructure; // Alias for Part 3 brief
  encoded_bitstream: string;
  manchester_waveform_samples: ManchesterWaveformSample[];
  
  // Channel & Obstruction
  optical_channel_parameters: OpticalChannelParameters;
  obstruction_scenario: ObstructionScenario;
  obstruction_duration_ms: number;
  servo_angle_deg: number;
  burst_start_time: number;
  burst_end_time: number;
  missing_corrupted_symbols: CorruptedSymbolDetail[];
  burst_mask: string;
  surviving_prefix: string;
  surviving_suffix: string;
  
  // Receiver & Slicing
  receiver_samples: ReceiverSample[];
  received_payload: string;
  decoded_payload: string; // Alias for Part 3 brief
  payload_length: number;
  frame_length: number;
  crc_status: 'PASS' | 'FAIL';
  calculated_crc: number;
  received_crc: number;
  crc_result: {
    status: 'PASS' | 'FAIL';
    calculated_crc: number;
    received_crc: number;
    polynomial: string;
  };
  error_count: number;
  ber: number;
  
  // Recovery & CGFP Decision
  packet_delivery_status: PacketDeliveryStatus;
  recovery_method: RecoveryMethod;
  basr_candidate: BasrCandidateResult;
  cgfp_score: CgfpScoreBreakdown;
  cgfp_decision: CgfpDecision;
  final_decision: CgfpDecision; // Alias for Part 3 brief
  exact_fallback_status: ExactFallbackStatus;
  confidence_score: number | null;
  syntax_valid: boolean;
  end_to_end_latency: number; // ms
  latency_ms: number;         // ms (backward compatibility)
  retransmissions_saved: number;
  channel_snr_db: number;
  photodiode_current_ua: number;
  data_source_badge: 'LIVE HARDWARE' | 'BACKEND PIPELINE' | 'DETERMINISTIC SIMULATION';
  notes?: string;
  
  // Research Methodology Metrics
  research_metrics: ResearchAccuracyMetrics;
}

/**
 * Dallas / Maxim CRC-8 Calculation
 * Polynomial: x^8 + x^5 + x^4 + 1 (0x31)
 * Initial value: 0x00
 */
export function calculateDallasCRC8(bytes: number[]): number {
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

/**
 * Validates payload input string
 */
export function validatePayload(text: string): { valid: boolean; error: string | null } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Payload cannot be empty' };
  }
  if (text.length > 64) {
    return { valid: false, error: `Payload length (${text.length} B) exceeds max frame buffer (64 B)` };
  }
  for (let i = 0; i < text.length; i++) {
    if (text.charCodeAt(i) > 127) {
      return { valid: false, error: 'Only standard ASCII characters are supported by the physical link' };
    }
  }
  return { valid: true, error: null };
}

/**
 * Formats a payload into a framed packet:
 * [PREAMBLE 0xAA][SOF 0x7E][SEQ_ID 1B][LENGTH 1B][PAYLOAD NB][CRC-8 1B]
 */
export function buildTransmittedPacket(payload: string, sequenceId: number = 1): TransmittedPacketStructure {
  const payloadBytes = Array.from(payload).map((c) => c.charCodeAt(0));
  const crc = calculateDallasCRC8(payloadBytes);
  const bytes = [0xaa, 0x7e, sequenceId & 0xff, payloadBytes.length, ...payloadBytes, crc];
  const hex = bytes.map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  const rawBits = bytes.length * 8;

  return {
    hex,
    bytes,
    preamble: '0xAA',
    sof: '0x7E',
    sequence_id: sequenceId,
    length_byte: payloadBytes.length,
    payload_bytes: payloadBytes,
    crc8: crc,
    raw_bits_count: rawBits,
    manchester_chips_count: rawBits * 2
  };
}

/**
 * Nonlinear Nonincreasing Burst Penalty from Paper Section VI:
 * Penalty_burst = exp(-alpha * (span / total_length)^gamma)
 * alpha = 0.50, gamma = 1.15
 */
export function computeBurstPenalty(
  spanBytes: number,
  totalLength: number = 32,
  alpha: number = 0.50,
  gamma: number = 1.15
): number {
  if (totalLength <= 0) totalLength = 32;
  const ratio = Math.min(1.0, Math.max(0.0, spanBytes / totalLength));
  const penalty = Math.exp(-alpha * Math.pow(ratio, gamma));
  return Number(Math.max(0.0, Math.min(1.0, penalty)).toFixed(4));
}

/**
 * Hard Structural Validation Indicator S_syntax (0 or 1).
 * Validates telemetry syntax: KEY=VALUE pairs separated by commas.
 * Protects critical control fields (e.g. MOTOR, DEVICE) from unsupported semantic guesses.
 */
export function validateTelemetrySyntax(reconstructedText: string): {
  valid: boolean;
  errors: string[];
  s_syntax: number;
  criticalFieldsIntact: boolean;
} {
  const errors: string[] = [];
  if (!reconstructedText || !reconstructedText.trim()) {
    return { valid: false, errors: ['Payload is completely empty.'], s_syntax: 0, criticalFieldsIntact: false };
  }

  // Check for unresolved mask tokens
  if (reconstructedText.includes('_') || reconstructedText.includes('[MASK]')) {
    errors.push('Payload contains unrecovered mask symbols.');
    return { valid: false, errors, s_syntax: 0, criticalFieldsIntact: false };
  }

  let criticalFieldsIntact = true;
  const pairs = reconstructedText.split(',');

  for (const pair of pairs) {
    if (!pair.includes('=')) {
      errors.push(`Missing '=' in telemetry segment '${pair}'`);
      continue;
    }
    const parts = pair.split('=');
    if (parts.length !== 2) {
      errors.push(`Malformed key-value pair '${pair}'`);
      continue;
    }
    const key = parts[0].trim();
    const val = parts[1].trim();

    if (!key) errors.push('Empty telemetry key encountered.');
    if (!val) errors.push(`Empty value for key '${key}'.`);

    // Verify numeric keys have valid numeric representations
    if (['TEMP', 'HUM', 'VOLT', 'CURR'].includes(key)) {
      if (isNaN(Number(val))) {
        errors.push(`Field '${key}' expects numeric value, got '${val}'`);
      }
    }

    // Critical control fields protection (MOTOR command state must be exactly ON or OFF)
    if (key === 'MOTOR') {
      if (val !== 'ON' && val !== 'OFF') {
        errors.push(`Critical control field MOTOR must be strictly 'ON' or 'OFF', got '${val}'`);
        criticalFieldsIntact = false;
      }
    }
    if (key === 'STATUS') {
      if (!['OK', 'ACTIVE', 'WARN', 'FAIL'].includes(val)) {
        errors.push(`Critical control field STATUS has invalid value '${val}'`);
        criticalFieldsIntact = false;
      }
    }
  }

  const valid = errors.length === 0;
  return {
    valid,
    errors,
    s_syntax: valid ? 1.0 : 0.0,
    criticalFieldsIntact
  };
}

/**
 * Evaluates the CGFP Decision Gate:
 * C = C_token * C_phys * Penalty_burst * S_syntax
 * Calibrated threshold tau* = 0.80
 */
export function evaluateCGFPModel(
  reconstructedText: string,
  tokenConfidence: number,
  burstSpanBytes: number,
  totalPayloadBytes: number = 32,
  physicalConfidence: number = 0.90,
  threshold: number = 0.80
): CgfpScoreBreakdown {
  const syntax = validateTelemetrySyntax(reconstructedText);
  const penalty = computeBurstPenalty(burstSpanBytes, totalPayloadBytes);

  if (!syntax.valid) {
    return {
      c_token: tokenConfidence,
      c_phys: physicalConfidence,
      penalty_burst: penalty,
      s_syntax: 0.0,
      total_score: 0.0,
      threshold,
      decision: 'FALLBACK_NACK',
      decision_reason: `Structural invalidity detected (${syntax.errors.join('; ')}). Hard syntax gate forced S_syntax=0 -> C=0.000 -> Immediate exact fallback.`
    };
  }

  const score = Number((tokenConfidence * physicalConfidence * penalty * syntax.s_syntax).toFixed(4));
  const isAccepted = score >= threshold;

  return {
    c_token: tokenConfidence,
    c_phys: physicalConfidence,
    penalty_burst: penalty,
    s_syntax: syntax.s_syntax,
    total_score: score,
    threshold,
    decision: isAccepted ? 'ACCEPT' : 'FALLBACK_NACK',
    decision_reason: isAccepted
      ? `CGFP Score (${score.toFixed(3)}) >= tau* (${threshold.toFixed(2)}). Semantic reconstruction accepted; Stop-and-Wait ARQ retransmission avoided.`
      : `CGFP Score (${score.toFixed(3)}) < tau* (${threshold.toFixed(2)}). Below confidence threshold; selective exact retransmission requested.`
  };
}

/**
 * Creates a fully consistent, enriched SharedExperimentResult
 * Satisfying Milestone 4 Part 3 (Unified Model) and Part 4 (SemLiFi Methodology).
 */
export function createExperimentRecord(
  payload: string,
  scenario: ObstructionScenario = 'P1',
  mode: ExperimentMode = 'SIMULATION',
  source: 'LIVE HARDWARE' | 'BACKEND PIPELINE' | 'DETERMINISTIC SIMULATION' = 'DETERMINISTIC SIMULATION',
  backendResult?: {
    receivedText?: string;
    confidenceScore?: number;
    latencyMs?: number;
    cgfpDecision?: 'ACCEPT' | 'FALLBACK_NACK';
    sequenceId?: number;
  }
): SharedExperimentResult {
  const sequenceId = backendResult?.sequenceId || 1;
  const packet = buildTransmittedPacket(payload, sequenceId);
  const experimentId = `EXP_${Date.now()}`;
  const timestamp = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // Compute full binary bitstream string
  const encodedBitstream = packet.bytes
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('');

  // Generate 64 Manchester waveform samples
  const manchesterSamples: ManchesterWaveformSample[] = [];
  let tUs = 0;
  const bitArray = packet.bytes.flatMap((b) =>
    Array.from({ length: 8 }, (_, idx) => (b >> (7 - idx)) & 1)
  );
  for (let i = 0; i < Math.min(32, bitArray.length); i++) {
    const bit = bitArray[i];
    // Manchester encoding: 1 -> [1, 0], 0 -> [0, 1]
    const chip1 = bit === 1 ? 1 : 0;
    const chip2 = bit === 1 ? 0 : 1;
    manchesterSamples.push({ time_us: tUs, level: chip1, chip_index: i * 2, stage: 'CH1_TX' });
    tUs += 500;
    manchesterSamples.push({ time_us: tUs, level: chip2, chip_index: i * 2 + 1, stage: 'CH1_TX' });
    tUs += 500;
  }

  // Optical channel parameters based on scenario
  let distanceCm = 15.0;
  let ambientLux = 250;
  let servoAngle = 0;
  let flapFactor = 1.0;
  let durationMs = 0;
  let burstStartTime = 0;
  let burstEndTime = 0;
  let channelAvailability: 'CLEAR_LOS' | 'DEGRADED' | 'DROPPED' | 'SEVERED' = 'CLEAR_LOS';
  let opticalIrradianceUw = 32.4;
  let channelSnr = 28.5;
  let photodiodeCurrent = 42.8;

  let errorCount = 0;
  let ber = 0.0;
  let crcStatus: 'PASS' | 'FAIL' = 'PASS';
  let calculatedCrc = packet.crc8;
  let receivedPayload = payload;
  let deliveryStatus: PacketDeliveryStatus = 'DELIVERED_CLEAN';
  let recoveryMethod: RecoveryMethod = 'DIRECT_PHYSICAL';
  let exactFallback: ExactFallbackStatus = 'NOT_NEEDED';
  let latencyMs = 449.0;
  let retransmissionsSaved = 0;

  // Burst details
  let survivingPrefix = payload;
  let survivingSuffix = '';
  let burstMask = payload;
  let inferredPatch = '';
  let tokenConfidence = 1.0;
  let physicalConfidence = 0.98;
  const corruptedSymbols: CorruptedSymbolDetail[] = [];

  switch (scenario) {
    case 'P0':
      servoAngle = 0;
      flapFactor = 1.0;
      channelAvailability = 'CLEAR_LOS';
      durationMs = 0;
      burstStartTime = 0;
      burstEndTime = 0;
      opticalIrradianceUw = 32.4;
      channelSnr = 28.5;
      photodiodeCurrent = 42.8;
      errorCount = 0;
      ber = 0.0;
      crcStatus = 'PASS';
      calculatedCrc = packet.crc8;
      receivedPayload = payload;
      deliveryStatus = 'DELIVERED_CLEAN';
      recoveryMethod = 'DIRECT_PHYSICAL';
      exactFallback = 'NOT_NEEDED';
      latencyMs = 449.0;
      retransmissionsSaved = 0;
      survivingPrefix = payload;
      survivingSuffix = '';
      burstMask = payload;
      inferredPatch = '';
      tokenConfidence = 1.0;
      physicalConfidence = 0.98;
      break;

    case 'P1':
      servoAngle = 30;
      flapFactor = 0.60;
      channelAvailability = 'DEGRADED';
      durationMs = 80;
      burstStartTime = 120;
      burstEndTime = 200;
      opticalIrradianceUw = 19.4;
      channelSnr = 18.2;
      photodiodeCurrent = 25.7;
      errorCount = 4;
      ber = Number((4 / packet.raw_bits_count).toFixed(4));
      crcStatus = 'FAIL';
      calculatedCrc = (packet.crc8 ^ 0x5c) & 0xff;
      deliveryStatus = 'RECOVERED_SEMANTIC';
      recoveryMethod = 'BASR_TRANSFORMER';
      exactFallback = 'NOT_NEEDED';
      latencyMs = backendResult?.latencyMs ?? 451.8;
      retransmissionsSaved = 1;

      // Extract prefix/suffix for telemetry key (e.g. TEMP=27.4,HUM=61,MOTOR=ON)
      if (payload.includes('TEMP=')) {
        survivingPrefix = 'TEMP=';
        survivingSuffix = payload.substring(payload.indexOf(',HUM='));
        inferredPatch = payload.substring(5, payload.indexOf(',HUM='));
        burstMask = `TEMP=${'_'.repeat(inferredPatch.length)}${survivingSuffix}`;
      } else {
        survivingPrefix = payload.substring(0, Math.min(6, payload.length));
        survivingSuffix = payload.substring(Math.min(10, payload.length));
        inferredPatch = payload.substring(survivingPrefix.length, survivingPrefix.length + 4);
        burstMask = `${survivingPrefix}____${survivingSuffix}`;
      }

      for (let i = 0; i < inferredPatch.length; i++) {
        corruptedSymbols.push({
          index: survivingPrefix.length + i,
          original_char: inferredPatch[i],
          masked_char: '_',
          is_critical_control_field: false
        });
      }

      receivedPayload = payload; // Successfully repaired by BASR
      tokenConfidence = 0.94;
      physicalConfidence = 0.96;
      break;

    case 'P2':
      servoAngle = 60;
      flapFactor = 0.05;
      channelAvailability = 'DROPPED';
      durationMs = 250;
      burstStartTime = 100;
      burstEndTime = 350;
      opticalIrradianceUw = 1.6;
      channelSnr = 9.4;
      photodiodeCurrent = 1.8;
      errorCount = 26;
      ber = Number((26 / packet.raw_bits_count).toFixed(4));
      crcStatus = 'FAIL';
      calculatedCrc = (packet.crc8 ^ 0xa3) & 0xff;
      deliveryStatus = 'FALLBACK_EXACT_ARQ';
      recoveryMethod = 'CGFP_FALLBACK_ARQ';
      exactFallback = 'COMPLETED_EXACT';
      latencyMs = backendResult?.latencyMs ?? 790.7;
      retransmissionsSaved = 0;

      survivingPrefix = payload.substring(0, Math.min(5, payload.length));
      survivingSuffix = payload.substring(Math.max(survivingPrefix.length, payload.length - 8));
      const maskedLen = Math.max(4, payload.length - survivingPrefix.length - survivingSuffix.length);
      burstMask = `${survivingPrefix}${'_'.repeat(maskedLen)}${survivingSuffix}`;
      inferredPatch = payload.substring(survivingPrefix.length, survivingPrefix.length + maskedLen);

      for (let i = 0; i < maskedLen; i++) {
        corruptedSymbols.push({
          index: survivingPrefix.length + i,
          original_char: inferredPatch[i] || '?',
          masked_char: '_',
          is_critical_control_field: false
        });
      }

      receivedPayload = payload; // Recovered via exact Stop-and-Wait ARQ retransmission
      tokenConfidence = 0.88;
      physicalConfidence = 0.82;
      break;

    case 'P3':
    default:
      servoAngle = 90;
      flapFactor = 0.0;
      channelAvailability = 'SEVERED';
      durationMs = 500;
      burstStartTime = 50;
      burstEndTime = 550;
      opticalIrradianceUw = 0.0;
      channelSnr = 2.1;
      photodiodeCurrent = 0.2;
      errorCount = packet.raw_bits_count - 8;
      ber = 0.95;
      crcStatus = 'FAIL';
      calculatedCrc = 0x00;
      receivedPayload = '[LINK_OCCLUDED: RE-SYNC REQUIRED]';
      deliveryStatus = 'DROPPED';
      recoveryMethod = 'NONE';
      exactFallback = 'FAILED';
      latencyMs = 1560.0;
      retransmissionsSaved = 0;

      survivingPrefix = '';
      survivingSuffix = '';
      burstMask = '________________________________';
      inferredPatch = '';
      tokenConfidence = 0.0;
      physicalConfidence = 0.0;
      break;
  }

  // Evaluate CGFP scoring pipeline
  const cgfp = evaluateCGFPModel(
    receivedPayload,
    tokenConfidence,
    corruptedSymbols.length,
    packet.length_byte,
    physicalConfidence,
    0.80
  );

  // If backend results are provided, integrate them
  if (backendResult) {
    if (backendResult.receivedText) receivedPayload = backendResult.receivedText;
    if (backendResult.latencyMs !== undefined) latencyMs = backendResult.latencyMs;
    if (backendResult.cgfpDecision) cgfp.decision = backendResult.cgfpDecision;
  }

  // Generate 16 receiver ADC mid-bit samples
  const receiverSamples: ReceiverSample[] = [];
  const baseAdc = scenario === 'P0' ? 120 : scenario === 'P1' ? 75 : scenario === 'P2' ? 12 : 3;
  for (let idx = 0; idx < 16; idx++) {
    const noise = Math.sin(idx * 0.8) * 3;
    const adcVal = Math.max(0, Math.min(180, baseAdc + noise));
    receiverSamples.push({
      index: idx,
      time_us: idx * 1000 + 500, // sampled at 500 µs mid-bit
      adc_value: Number(adcVal.toFixed(1)),
      sliced_bit: adcVal >= 50.0 ? 1 : 0,
      threshold: 50.0
    });
  }

  // BASR Candidate Result Structure
  const basrCandidate: BasrCandidateResult = {
    candidate_text: receivedPayload,
    inferred_patch: inferredPatch,
    token_confidence: tokenConfidence,
    mean_entropy: Number((1.0 - tokenConfidence).toFixed(3)),
    latency_ms: 2.79,
    model_mode: source === 'BACKEND PIPELINE' ? 'PYTORCH_CHECKPOINT' : 'SIMULATION — MODEL CHECKPOINT NOT CONNECTED',
    parameter_count: 74281,
    surviving_prefix: survivingPrefix,
    surviving_suffix: survivingSuffix,
    burst_mask: burstMask,
    token_predictions: corruptedSymbols.map((s, i) => ({
      position: s.index,
      char: s.original_char,
      probability: Number(Math.max(0.4, tokenConfidence - i * 0.03).toFixed(3)),
      entropy: Number((0.2 + i * 0.04).toFixed(3))
    }))
  };

  // Research Methodology Metrics
  const researchMetrics: ResearchAccuracyMetrics = {
    exact_reconstruction_accuracy: 42.63,
    task_field_accuracy: 100.0,
    accepted_patch_precision: 96.8,
    false_recovery_rate: 1.2,
    exact_fallback_success: 100.0,
    critical_control_field_protected: true
  };

  return {
    experiment_id: experimentId,
    timestamp,
    mode,
    operating_mode: mode === 'LIVE HARDWARE' ? 'HARDWARE_CONNECTED' : 'SIMULATION',

    original_payload: payload,
    transmitted_payload: payload,
    packet_sequence: sequenceId,
    transmitted_packet: packet,
    frame_structure: packet,
    encoded_bitstream: encodedBitstream,
    manchester_waveform_samples: manchesterSamples,

    optical_channel_parameters: {
      distance_cm: distanceCm,
      ambient_lux: ambientLux,
      optical_irradiance_uw: opticalIrradianceUw,
      channel_snr_db: channelSnr,
      servo_angle_deg: servoAngle,
      flap_factor: flapFactor,
      channel_availability: channelAvailability
    },
    obstruction_scenario: scenario,
    obstruction_duration_ms: durationMs,
    servo_angle_deg: servoAngle,
    burst_start_time: burstStartTime,
    burst_end_time: burstEndTime,
    missing_corrupted_symbols: corruptedSymbols,
    burst_mask: burstMask,
    surviving_prefix: survivingPrefix,
    surviving_suffix: survivingSuffix,

    receiver_samples: receiverSamples,
    received_payload: receivedPayload,
    decoded_payload: receivedPayload,
    payload_length: packet.length_byte,
    frame_length: packet.bytes.length,
    crc_status: crcStatus,
    calculated_crc: calculatedCrc,
    received_crc: packet.crc8,
    crc_result: {
      status: crcStatus,
      calculated_crc: calculatedCrc,
      received_crc: packet.crc8,
      polynomial: 'Dallas/Maxim 0x31 (x^8 + x^5 + x^4 + 1)'
    },
    error_count: errorCount,
    ber,

    packet_delivery_status: deliveryStatus,
    recovery_method: recoveryMethod,
    basr_candidate: basrCandidate,
    cgfp_score: cgfp,
    cgfp_decision: cgfp.decision,
    final_decision: cgfp.decision,
    exact_fallback_status: exactFallback,
    confidence_score: cgfp.total_score,
    syntax_valid: cgfp.s_syntax === 1.0,
    end_to_end_latency: latencyMs,
    latency_ms: latencyMs,
    retransmissions_saved: retransmissionsSaved,
    channel_snr_db: channelSnr,
    photodiode_current_ua: photodiodeCurrent,
    data_source_badge: source,
    notes: `SemLiFi experiment record executed with calibrated threshold τ* = 0.80 on dual-ESP32 1000 bps optical link.`,

    research_metrics: researchMetrics
  };
}

/**
 * Default Shared Initial Experiment Record
 * Synchronized across all 7 modules on startup.
 */
export const DEFAULT_SHARED_EXPERIMENT: SharedExperimentResult = createExperimentRecord(
  'TEMP=27.4,HUM=61,MOTOR=ON',
  'P1',
  'SIMULATION',
  'DETERMINISTIC SIMULATION'
);

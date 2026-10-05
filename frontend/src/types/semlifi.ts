export type VerificationStatus = 
  | 'VERIFIED HARDWARE' 
  | 'DOCUMENTED HARDWARE' 
  | 'SIMULATED' 
  | 'UNVERIFIED';

export type SignalClassification = 
  | 'LIGHT DETECTED' 
  | 'BLOCKED' 
  | 'NO SIGNAL' 
  | 'UNKNOWN';

export interface HardwareStatus {
  is_connected: boolean;
  mode: 'LIVE HARDWARE' | 'SIMULATION';
  port: string | null;
  baudrate: number;
  tx_node_status: string;
  rx_node_status: string;
  led_state: boolean;
  servo_angle_deg: number;
  is_beam_blocked: boolean;
  current_adc_count: number;
  operating_threshold: number;
  signal_classification: SignalClassification;
  last_frame_id: number;
  data_source: string;
}

export interface DashboardOverview {
  hardware_status: HardwareStatus;
  bit_rate_bps: number;
  bit_period_us: number;
  crc_polynomial: string;
  current_adc_count: number;
  operating_threshold: number;
  signal_state: string;
  burst_active: boolean;
  burst_duration_ms: number;
  current_frame_id: number;
  crc_status: string;
  basr_confidence: number;
  cgfp_score: number;
  cgfp_threshold: number;
  current_decision: 'ACCEPT' | 'SELECTIVE_FALLBACK';
  transit_latency_ms: number;
  retransmissions_count: number;
  recovery_method: string;
  data_source_badge: string;
}

export interface HardwareComponent {
  id: string;
  name: string;
  type: string;
  purpose: string;
  inputs: string;
  outputs: string;
  connections: string[];
  why_used: string;
  how_it_works: string;
  simulation_behavior: string;
  datasheet_reference: string;
  verification_status: VerificationStatus;
  layer_index: number;
  color: string;
}

export interface WireConnection {
  connection_id: string;
  wire_name?: string;
  source_component: string;
  source_pin: string;
  source_location: string;
  source_breadboard_hole?: string;
  wire_color: string;
  wire_type: string;
  destination_component: string;
  destination_pin: string;
  destination_location: string;
  destination_breadboard_hole?: string;
  signal_type: string;
  voltage_if_verified: string | null;
  purpose: string;
  status: VerificationStatus;
  verification_source: string;
  professor_explanation?: string;
  notes: string;
}

export interface SemLiFiPacket {
  sync: string;
  length: number;
  sequence_id: number;
  payload: string;
  crc: number;
  crc_valid: boolean;
  raw_hex: string;
  raw_bytes: number[];
  status: 'VALID' | 'CRC_FAILED' | 'SYNC_LOST' | 'TRUNCATED';
}

export interface BurstEvent {
  frame_id: number;
  start_time_ms: number;
  end_time_ms: number;
  duration_ms: number;
  affected_bits: number;
  affected_bytes: number;
  profile: string;
  severity: number;
  surviving_prefix: string;
  surviving_suffix: string;
  corrupted_payload: string;
  burst_mask: string;
}

export interface EmpiricalBurstRecord {
  event_id: number;
  profile: string;
  duration_ms: number;
  affected_bytes: number;
  servo_angle_deg: number;
  source_label: string;
  testbed_type: string;
  notes: string;
}

export interface TokenPrediction {
  position: number;
  char: string;
  probability: number;
  entropy: number;
  top_candidates: Array<{ token: string; prob: number }>;
}

export interface BASRReconstructionResult {
  original_prompt: string;
  corrupted_input: string;
  burst_mask: string;
  reconstructed_text: string;
  token_confidence: number;
  mean_entropy: number;
  inference_latency_ms: number;
  parameter_count: number;
  model_mode: string;
  token_predictions: TokenPrediction[];
}

export interface CGFPResult {
  token_confidence: number;
  physical_confidence: number;
  burst_penalty: number;
  syntax_valid: boolean;
  syntax_errors: string[];
  confidence_score: number;
  threshold: number;
  decision: 'ACCEPT' | 'SELECTIVE_FALLBACK';
  decision_reason: string;
  retransmission_avoided: boolean;
  avoided_latency_ms: number;
}

export interface ExperimentMetrics {
  method: string;
  total_frames: number;
  successful_frames: number;
  delivery_rate: number;
  mean_latency_ms: number;
  ufer: number;
  crc_failures: number;
  burst_events: number;
  retransmissions_count: number;
  retransmissions_avoided_pct: number;
  patch_precision_pct: number;
  patch_error_rate_pct: number;
  motor_state_accuracy_pct: number;
  source_label: string;
}

export interface PipelineStep {
  step: number;
  name: string;
  detail: string;
  status: 'COMPLETED' | 'SKIPPED' | 'ERROR';
}

export interface PipelineRunResult {
  pipeline_steps: PipelineStep[];
  original_payload: string;
  final_payload: string;
  is_exact_match: boolean;
  transit_latency_ms: number;
  burst_event: BurstEvent | null;
  basr_result: BASRReconstructionResult | null;
  cgfp_result: CGFPResult | null;
  data_source_badge: string;
}

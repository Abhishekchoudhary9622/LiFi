import {
  DashboardOverview,
  HardwareComponent,
  WireConnection,
  SemLiFiPacket,
  BurstEvent,
  EmpiricalBurstRecord,
  BASRReconstructionResult,
  CGFPResult,
  ExperimentMetrics,
  PipelineRunResult,
} from '../types/semlifi';

const API_BASE = '/api';

export const api = {
  // 1. Dashboard
  async getDashboardOverview(): Promise<DashboardOverview> {
    const res = await fetch(`${API_BASE}/dashboard/overview`);
    if (!res.ok) throw new Error('Failed to load dashboard overview');
    return res.json();
  },

  // 2. Hardware Components
  async getComponents(): Promise<HardwareComponent[]> {
    const res = await fetch(`${API_BASE}/hardware/components`);
    if (!res.ok) throw new Error('Failed to load components');
    return res.json();
  },

  // 3. Wiring Database
  async getConnections(statusFilter?: string): Promise<WireConnection[]> {
    const url = statusFilter 
      ? `${API_BASE}/wiring/connections?status_filter=${encodeURIComponent(statusFilter)}` 
      : `${API_BASE}/wiring/connections`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to load wiring connections');
    return res.json();
  },

  async getPinMapping(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/wiring/pin-mapping`);
    if (!res.ok) throw new Error('Failed to load pin mapping');
    return res.json();
  },

  // 4. Optical Link Control
  async controlOptical(data: {
    distance_cm?: number;
    servo_angle_deg?: number;
    led_state?: boolean;
    simulate_occlusion?: boolean;
    occlusion_duration_ms?: number;
  }) {
    const res = await fetch(`${API_BASE}/optical/control`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 5. Live Signal Samples
  async getSignalSamples(count: number = 64) {
    const res = await fetch(`${API_BASE}/signal/samples?count=${count}`);
    return res.json();
  },

  // 6. Packet Analyzer
  async encodePacket(payload: string, sequenceId: number = 1): Promise<SemLiFiPacket> {
    const res = await fetch(`${API_BASE}/packet/encode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, sequence_id: sequenceId }),
    });
    return res.json();
  },

  // 7. Manchester & OOK Simulator
  async simulateModulation(payload: string, sequenceId: number = 1) {
    const res = await fetch(`${API_BASE}/modulation/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, sequence_id: sequenceId }),
    });
    return res.json();
  },

  // 8. Burst Monitor
  async getEmpiricalBursts(): Promise<EmpiricalBurstRecord[]> {
    const res = await fetch(`${API_BASE}/burst/empirical-dataset`);
    return res.json();
  },

  async simulateBurst(payload: string, durationMs: number): Promise<BurstEvent> {
    const res = await fetch(`${API_BASE}/burst/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload, duration_ms: durationMs }),
    });
    return res.json();
  },

  // 9. BASR AI
  async basrReconstruct(data: {
    corrupted_payload: string;
    burst_span: number;
    surviving_prefix: string;
    surviving_suffix: string;
    force_low_confidence?: boolean;
  }): Promise<BASRReconstructionResult> {
    const res = await fetch(`${API_BASE}/basr/reconstruct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getBasrModelInfo() {
    const res = await fetch(`${API_BASE}/basr/model-info`);
    return res.json();
  },

  // 10. CGFP
  async evaluateCgfp(data: {
    reconstructed_text: string;
    token_confidence: number;
    burst_span_bytes: number;
    threshold?: number;
    alpha?: number;
    gamma?: number;
  }): Promise<CGFPResult> {
    const res = await fetch(`${API_BASE}/cgfp/evaluate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 11. Simulation Lab End-to-End
  async runPipeline(data: {
    payload: string;
    sequence_id?: number;
    inject_burst?: boolean;
    burst_duration_ms?: number;
    force_low_confidence?: boolean;
    threshold?: number;
  }): Promise<PipelineRunResult> {
    const res = await fetch(`${API_BASE}/simulation/run-pipeline`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // 12. Experiments
  async runExperiment(config: {
    experiment_id: string;
    num_frames: number;
    burst_probability: number;
    burst_profile: string;
    recovery_method: string;
    tau_threshold: number;
    channel_mode: string;
  }): Promise<ExperimentMetrics> {
    const res = await fetch(`${API_BASE}/experiments/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  async getBenchmarks(): Promise<ExperimentMetrics[]> {
    const res = await fetch(`${API_BASE}/experiments/benchmarks`);
    return res.json();
  },

  // 13. System & Serial
  async listPorts() {
    const res = await fetch(`${API_BASE}/system/ports`);
    return res.json();
  },

  async connectHardware(port: string, baudrate: number = 115200) {
    const res = await fetch(`${API_BASE}/system/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ port, baudrate }),
    });
    return res.json();
  },

  async disconnectHardware() {
    const res = await fetch(`${API_BASE}/system/disconnect`, { method: 'POST' });
    return res.json();
  },

  async autoDetectHardware() {
    const res = await fetch(`${API_BASE}/system/auto-detect`, { method: 'POST' });
    return res.json();
  }
};

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  X,
  Copy,
  Check,
  Zap,
  Activity,
  Cpu,
  Radio,
  Sliders,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  RefreshCw,
  Info,
  Layers,
  ArrowDown
} from 'lucide-react';

export interface SemLiFiExecutionFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSimulation?: () => void;
}

export type ExecutionScenario = 'P2_FALLBACK' | 'P1_ACCEPTANCE' | 'P3_SYNTAX_FAIL' | 'P0_CLEAN';

export interface FlowStepItem {
  id: number;
  phase: 'TX' | 'CHANNEL' | 'BASR' | 'CGFP';
  phaseLabel: string;
  phaseColor: string;
  title: string;
  shortLabel: string;
  subtitle: string;
  timestampMs: number;
  status: 'PENDING' | 'ACTIVE' | 'DONE';
  waveformType: 'square' | 'manchester' | 'optical' | 'burst' | 'attention' | 'threshold' | 'ack';
  pinTelemetry: {
    pin: string;
    voltage: string;
    state: string;
    note: string;
  };
  payloadState: {
    prefix: string;
    corruptedOrPatched: string;
    suffix: string;
    label: string;
    isCorrupted?: boolean;
    isPatched?: boolean;
  };
  theoryCard: {
    formula: string;
    description: string;
    paperRef: string;
  };
}

export const SCENARIO_PRESETS: Record<ExecutionScenario, {
  name: string;
  tag: string;
  tagColor: string;
  description: string;
  confidence: number;
  threshold: number;
  decision: 'FALLBACK_NACK' | 'ACCEPT_SEMANTIC' | 'SYNTAX_REJECT' | 'CLEAN_PASS';
  steps: FlowStepItem[];
}> = {
  P2_FALLBACK: {
    name: 'Scenario P2: Moderate Burst (250 ms) — CGFP Fallback Gate',
    tag: 'Paper Baseline (Table II & VII)',
    tagColor: 'bg-amber-950/80 border-amber-600/70 text-amber-300',
    description: 'SG90 servo flap blocks optical beam for 250 ms. BASR reconstructs telemetry but confidence C = 0.73 is below calibrated τ* = 0.80. CGFP triggers selective NACK with exact ARQ retransmission (100% Delivery, 0.00% live UFER).',
    confidence: 0.73,
    threshold: 0.80,
    decision: 'FALLBACK_NACK',
    steps: [
      {
        id: 0,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'ESP32 Transmitter Node (TX)',
        shortLabel: 'ESP32 TX',
        subtitle: 'Generates structured telemetry frame in UART TX buffer',
        timestampMs: 0.0,
        status: 'PENDING',
        waveformType: 'square',
        pinTelemetry: {
          pin: 'ESP32 GPIO 23',
          voltage: '3.30 V',
          state: 'TX_ACTIVE',
          note: 'Framing: [0xAA 0x55][LEN=29][SEQ=1][PAYLOAD][CRC8=0x4E]'
        },
        payloadState: {
          prefix: 'TEMP=27.4,',
          corruptedOrPatched: 'HUM=61,',
          suffix: 'MOTOR=ON',
          label: 'Original Transmitted Payload (Dallas CRC-8: 0x4E)'
        },
        theoryCard: {
          formula: 'Y = [y_1, y_2, ..., y_N], \\quad \\text{Frame} = [\\text{SYNC}][\\text{LEN}][\\text{SEQ}][Y][\\text{CRC8}]',
          description: 'The source telemetry is serialized with sync word 0xAA55 and Dallas/Maxim CRC-8 (x^8 + x^5 + x^4 + 1).',
          paperRef: 'Section III-C, Frame and Recovery Semantics'
        }
      },
      {
        id: 1,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'Manchester Line Coding',
        shortLabel: 'Manchester encoding',
        subtitle: 'Transforms raw binary into DC-balanced clock-synchronized transitions',
        timestampMs: 12.0,
        status: 'PENDING',
        waveformType: 'manchester',
        pinTelemetry: {
          pin: 'Line Encoder',
          voltage: '0.00V / 3.30V',
          state: 'DC_BALANCED',
          note: 'Bit Period Tb = 1000 µs (1000 bps raw modulation)'
        },
        payloadState: {
          prefix: '01 10 10 01',
          corruptedOrPatched: '10 01 01 10',
          suffix: '01 10 10 01',
          label: 'Clock-embedded transitions assist receiver lock without DC drift'
        },
        theoryCard: {
          formula: 'x(t) = d_k \\oplus \\text{CLK}(t), \\quad \\mathbb{E}[x(t)] = 0.50',
          description: 'Each bit has a guaranteed mid-bit transition, allowing simple edge timing and immediate error flag on invalid transition.',
          paperRef: 'Section IV-B, Optical Modulation and Sampling'
        }
      },
      {
        id: 2,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'Transistor Driver & LED Modulation',
        shortLabel: 'LED modulation',
        subtitle: 'S8050 NPN transistor sinks 120 mA through high-power optical LED',
        timestampMs: 25.0,
        status: 'PENDING',
        waveformType: 'optical',
        pinTelemetry: {
          pin: 'S8050 Collector / LED',
          voltage: '1.95 V (Fwd)',
          state: 'PULSING',
          note: 'Peak optical radiant flux: ~180 mW at λ = 650 nm'
        },
        payloadState: {
          prefix: 'PHOTONS EMITTED',
          corruptedOrPatched: '10.0 kHz CARRIER',
          suffix: 'LOS CONE ACTIVE',
          label: 'Lambertian radiant beam emitted across 15.0 cm free-space gap'
        },
        theoryCard: {
          formula: 'I_{\\text{LED}} = \\frac{V_{\\text{CC}} - V_F - V_{\\text{CE,sat}}}{R_{\\text{limit}}} \\approx 120\\text{ mA}',
          description: 'Transistor switch isolates microcontroller GPIO while driving intense optical bursts with fast rise time (< 25 ns).',
          paperRef: 'Section IV-A, Physical Testbed Configuration'
        }
      },
      {
        id: 3,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#f59e0b',
        title: 'Optical Channel Propagation',
        shortLabel: 'Optical channel',
        subtitle: 'Line-of-sight free space path (d = 15 cm, Irradiance E = 145 µW/cm²)',
        timestampMs: 40.0,
        status: 'PENDING',
        waveformType: 'optical',
        pinTelemetry: {
          pin: 'Air Gap (15 cm)',
          voltage: '0.00 V (Free space)',
          state: 'PROPAGATING',
          note: 'Ambient indoor illumination: ~320 lux background'
        },
        payloadState: {
          prefix: 'LOS LINK',
          corruptedOrPatched: 'CLEAR PATH',
          suffix: 'SNR = 28.4 dB',
          label: 'Surviving symbols travel unhindered prior to physical obstruction'
        },
        theoryCard: {
          formula: 'E = \\frac{I_0 \\cos^m(\\phi)}{d^2} \\cos(\\psi), \\quad \\text{SNR} = 28.4\\text{ dB}',
          description: 'Komine-Nakagawa indoor channel model verifies high clean SNR under direct line-of-sight alignment.',
          paperRef: 'Section II-A, Optical Wireless Communication'
        }
      },
      {
        id: 4,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#ef4444',
        title: 'SG90 Servo 250 ms Flap Blockage',
        shortLabel: '250 ms blockage',
        subtitle: 'Opaque physical barrier intersects optical cone (TB = 250 ms)',
        timestampMs: 140.0,
        status: 'PENDING',
        waveformType: 'burst',
        pinTelemetry: {
          pin: 'SG90 Servo Flap',
          voltage: '5.00 V PWM',
          state: 'BLOCKED',
          note: 'Burst span: NB ≈ 25 bytes contiguous symbol erasure'
        },
        payloadState: {
          prefix: 'TEMP=27.4,',
          corruptedOrPatched: '████████',
          suffix: 'MOTOR=ON',
          isCorrupted: true,
          label: 'Physical obstruction removes ~25 contiguous bytes (Exceeds RS-FEC t=4 capability!)'
        },
        theoryCard: {
          formula: 'T_B = t_e - t_s = 250\\text{ ms}, \\quad N_B \\approx \\frac{T_B}{T_b} = 250\\text{ bits} \\approx 25\\text{ bytes}',
          description: 'The burst duration is determined by physical obstruction mechanics rather than memoryless independent bit noise.',
          paperRef: 'Section IV-D, Burst Profiles & Figure 2'
        }
      },
      {
        id: 5,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#ef4444',
        title: 'BPW34 Photodiode & Burst Detection',
        shortLabel: 'Burst detected',
        subtitle: 'LM358 TIA drops to dark counts (0-5 ADC) and CRC-8 check fails',
        timestampMs: 290.0,
        status: 'PENDING',
        waveformType: 'burst',
        pinTelemetry: {
          pin: 'BPW34 / GPIO 34 ADC',
          voltage: '0.04 V',
          state: 'DARK_COUNT (3)',
          note: 'Slicer: 3 < Threshold (50 counts) -> CRC-8 MISMATCH (0x9B != 0x4E)'
        },
        payloadState: {
          prefix: 'Y^- = "TEMP=27.4,"',
          corruptedOrPatched: 'B = [0...1 1 1...0]',
          suffix: 'Y^+ = ",MOTOR=ON"',
          isCorrupted: true,
          label: 'Corrupted Frame Detected: Isolating Prefix (Y^-), Suffix (Y^+), and Mask (B)'
        },
        theoryCard: {
          formula: 'Y\' = \\mathcal{C}(Y, B), \\quad \\text{CRC-8}(Y\') \\neq \\text{CRC-8}_{\\text{rx}} \\implies \\text{CORRUPT}',
          description: 'Receiver slicer extracts exact burst boundaries [t_start, t_end] to create binary mask B for semantic layer.',
          paperRef: 'Section III-A, Equations (1)-(3)'
        }
      },
      {
        id: 6,
        phase: 'BASR',
        phaseLabel: 'Phase 3: Semantic BASR',
        phaseColor: '#8b5cf6',
        title: 'BASR Edge Transformer Reconstruction',
        shortLabel: 'BASR reconstruction',
        subtitle: '74,281-parameter edge-constrained Transformer infers missing telemetry',
        timestampMs: 340.0,
        status: 'PENDING',
        waveformType: 'attention',
        pinTelemetry: {
          pin: 'ESP32 Edge Inference',
          voltage: 'Internal RAM',
          state: 'INFERENCE',
          note: 'd_model=64, 4 attention heads, 2 encoder layers, d_ff=96'
        },
        payloadState: {
          prefix: 'TEMP=27.4,',
          corruptedOrPatched: 'HUM=58,',
          suffix: 'MOTOR=ON',
          isPatched: true,
          label: 'Candidate Patch: Inferred "HUM=58," (vs true transmitted "HUM=61,")'
        },
        theoryCard: {
          formula: '\\hat{Y}_m = f(Y^-, Y^+, B; \\theta), \\quad |\\theta| = 74,281 \\le 75,000\\text{ budget}',
          description: 'Transformer exploits structured semantics (field keys, punctuation, motor correlation) to synthesize candidate patch.',
          paperRef: 'Section V-B, Edge-Constrained Transformer'
        }
      },
      {
        id: 7,
        phase: 'BASR',
        phaseLabel: 'Phase 3: Semantic BASR',
        phaseColor: '#8b5cf6',
        title: 'Multi-Factor Confidence Evaluation',
        shortLabel: 'Confidence = 0.73',
        subtitle: 'Computes joint score from token logprobs, physics, and burst penalty',
        timestampMs: 380.0,
        status: 'PENDING',
        waveformType: 'threshold',
        pinTelemetry: {
          pin: 'CGFP Evaluator',
          voltage: 'Float Math',
          state: 'EVALUATING',
          note: 'C_token=0.91, C_phys=0.88, Penalty=0.91, S_syntax=1.0'
        },
        payloadState: {
          prefix: 'C_token (0.91)',
          corruptedOrPatched: '× Penalty (0.91) × C_phys (0.88)',
          suffix: '= C: 0.73',
          label: 'Combined Confidence Score: C = 0.73 (Semantic candidate has marginal uncertainty)'
        },
        theoryCard: {
          formula: 'C = C_{\\text{token}} \\cdot C_{\\text{phys}} \\cdot \\text{Penalty}_{\\text{burst}}(\\text{span}) \\cdot S_{\\text{syntax}} = 0.73',
          description: 'Penalizes long burst spans (α=0.50, γ=1.15) and validates strict syntax grammar S_syntax ∈ {0, 1}.',
          paperRef: 'Section VI-A, Equation (10)'
        }
      },
      {
        id: 8,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#06b6d4',
        title: 'CGFP Calibrated Threshold Gating',
        shortLabel: '0.73 < 0.80',
        subtitle: 'Compares confidence C = 0.73 against calibrated threshold τ* = 0.80',
        timestampMs: 410.0,
        status: 'PENDING',
        waveformType: 'threshold',
        pinTelemetry: {
          pin: 'CGFP Gate',
          voltage: 'Logic Comparator',
          state: 'THRESHOLD_CHECK',
          note: 'Calibrated threshold τ* = 0.80 (calibrated on 664 disjoint bursts)'
        },
        payloadState: {
          prefix: 'Calculated C = 0.73',
          corruptedOrPatched: '< (LESS THAN)',
          suffix: 'Threshold τ* = 0.80',
          label: 'Gate Condition: 0.73 < 0.80 -> Semantic candidate is REJECTED to preserve integrity!'
        },
        theoryCard: {
          formula: '\\mathcal{D} = \\begin{cases} \\text{Accept}, & C \\ge \\tau^* \\\\ \\text{Selective Fallback}, & C < \\tau^* \\end{cases}, \\quad \\tau^* = 0.80',
          description: 'CGFP operates conservatively: when confidence is marginal, it guarantees safety by reverting to exact recovery.',
          paperRef: 'Section VI-A, Equation (11) & Figure 3'
        }
      },
      {
        id: 9,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#06b6d4',
        title: 'Selective NACK Feedback',
        shortLabel: 'NACK',
        subtitle: 'Receiver issues selective negative acknowledgment for Sequence #1',
        timestampMs: 440.0,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: {
          pin: 'Return Channel (UART / WiFi)',
          voltage: '3.30 V',
          state: 'NACK_SENT',
          note: 'Packet: [0x55 0xAA][NACK][SEQ=1][BURST_SPAN=25]'
        },
        payloadState: {
          prefix: 'FRAME SEQ #1',
          corruptedOrPatched: 'NACK DISPATCHED',
          suffix: 'AWAITING RETRANSMIT',
          label: 'Requests selective retransmission of the affected frame from transmitter'
        },
        theoryCard: {
          formula: 'T_{\\text{fallback}} = T_{\\text{NACK}} + T_{\\text{retransmit}} + T_{\\text{decode}}',
          description: 'Fallback ARQ ensures 0.00% undetected frame error rate at the cost of retransmission delay.',
          paperRef: 'Section VI-C, Selective Exact Fallback'
        }
      },
      {
        id: 10,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#06b6d4',
        title: 'Exact ARQ Retransmission',
        shortLabel: 'Exact retransmission',
        subtitle: 'Transmitter re-sends original frame after optical blockage clears',
        timestampMs: 650.0,
        status: 'PENDING',
        waveformType: 'square',
        pinTelemetry: {
          pin: 'ESP32 TX (PA9 / GPIO 23)',
          voltage: '3.30 V',
          state: 'RETRANSMIT_OK',
          note: 'Servo flap cleared: optical path restored (Clean SNR 28.4 dB)'
        },
        payloadState: {
          prefix: 'TEMP=27.4,',
          corruptedOrPatched: 'HUM=61,',
          suffix: 'MOTOR=ON',
          label: 'Retransmitted Frame Received with Valid Dallas CRC-8 (0x4E)'
        },
        theoryCard: {
          formula: 'T_{\\text{total}} = 790.7\\text{ ms} \\ll 1560.0\\text{ ms (Standard ARQ)}',
          description: 'Total continuous burst latency is 790.7 ms, delivering 100% frame delivery with zero bit error.',
          paperRef: 'Section VII, Table VII & Abstract'
        }
      },
      {
        id: 11,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: 'Integrity Verified: Valid Payload',
        shortLabel: '✓ VALID PAYLOAD',
        subtitle: 'CRC-8 passes 100% bit-exact delivery (UFER = 0.00% on live hardware)',
        timestampMs: 790.7,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: {
          pin: 'Application Queue',
          voltage: '3.30 V',
          state: 'DELIVERED',
          note: 'UFER: 0.00% live hardware | Delivery Rate: 100.0% | Latency: 790.7 ms'
        },
        payloadState: {
          prefix: 'TEMP=27.4,',
          corruptedOrPatched: 'HUM=61,',
          suffix: 'MOTOR=ON',
          label: 'DELIVERED PAYLOAD: 100% BIT-PERFECT RECOVERY'
        },
        theoryCard: {
          formula: '\\text{UFER} = \\frac{N_{\\text{incorrect final}}}{N_{\\text{evaluated}}} = 0.00\\% \\le 2.0\\%\\text{ safety bound}',
          description: 'The system meets all preregistered safety constraints, providing guaranteed exactness via CGFP gating.',
          paperRef: 'Section VII-C & Abstract'
        }
      }
    ]
  },
  P1_ACCEPTANCE: {
    name: 'Scenario P1: Mild Burst (80 ms) — Direct Semantic Acceptance',
    tag: 'Semantic Fast-Path (27.15% Retransmissions Avoided)',
    tagColor: 'bg-emerald-950/80 border-emerald-600/70 text-emerald-300',
    description: 'A brief 80 ms occlusion erases 8 symbols. BASR reconstructs missing values with high confidence C = 0.91 >= 0.80. CGFP accepts semantic patch directly, avoiding retransmission and saving 341.7 ms latency!',
    confidence: 0.91,
    threshold: 0.80,
    decision: 'ACCEPT_SEMANTIC',
    steps: [
      {
        id: 0,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'ESP32 Transmitter Node (TX)',
        shortLabel: 'ESP32 TX',
        subtitle: 'Serializes payload "TEMP=27.4,HUM=61,MOTOR=ON"',
        timestampMs: 0.0,
        status: 'PENDING',
        waveformType: 'square',
        pinTelemetry: { pin: 'GPIO 23', voltage: '3.30V', state: 'TX_IDLE', note: 'Bit period Tb = 1000 µs' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'Transmitted Frame' },
        theoryCard: { formula: 'Y = [y_1 \\dots y_N]', description: 'Structured telemetry transmission', paperRef: 'Sec. III-A' }
      },
      {
        id: 1,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'Manchester Line Coding',
        shortLabel: 'Manchester encoding',
        subtitle: 'Encoding 1000 bps optical data',
        timestampMs: 12.0,
        status: 'PENDING',
        waveformType: 'manchester',
        pinTelemetry: { pin: 'Encoder', voltage: '3.30V', state: 'ACTIVE', note: 'Tb = 1000 µs' },
        payloadState: { prefix: '01 10 10 01', corruptedOrPatched: '10 01 01 10', suffix: '01 10', label: 'Manchester Encoded' },
        theoryCard: { formula: 'x(t) = d_k \\oplus \\text{CLK}(t)', description: 'Clock synchronization', paperRef: 'Sec. IV-B' }
      },
      {
        id: 2,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'LED Modulation',
        shortLabel: 'LED modulation',
        subtitle: '10.0 kHz OOK optical pulse',
        timestampMs: 25.0,
        status: 'PENDING',
        waveformType: 'optical',
        pinTelemetry: { pin: 'LED Driver', voltage: '1.95V', state: 'PULSING', note: '120 mA peak current' },
        payloadState: { prefix: 'OPTICAL', corruptedOrPatched: 'PULSE', suffix: 'BEAM', label: '10 kHz Light Pulses' },
        theoryCard: { formula: 'I_{\\text{LED}} = 120\\text{ mA}', description: 'Optical modulation', paperRef: 'Sec. IV-A' }
      },
      {
        id: 3,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#f59e0b',
        title: 'Optical Channel',
        shortLabel: 'Optical channel',
        subtitle: 'Direct LOS line propagation',
        timestampMs: 40.0,
        status: 'PENDING',
        waveformType: 'optical',
        pinTelemetry: { pin: 'Air Gap', voltage: '0V', state: 'PROPAGATING', note: 'Clean SNR: 28.4 dB' },
        payloadState: { prefix: 'LOS CONE', corruptedOrPatched: 'PROPAGATING', suffix: '15 cm GAP', label: 'Free Space Transmission' },
        theoryCard: { formula: 'E \\propto d^{-2}', description: 'Optical path loss', paperRef: 'Sec. II-A' }
      },
      {
        id: 4,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#ef4444',
        title: 'Mild 80 ms Burst Occlusion',
        shortLabel: '80 ms blockage',
        subtitle: 'P1 short blockage erases 8 contiguous symbols',
        timestampMs: 90.0,
        status: 'PENDING',
        waveformType: 'burst',
        pinTelemetry: { pin: 'Servo Flap P1', voltage: '5V PWM', state: 'FLAP_EDGE', note: 'Mild occlusion: TB = 80 ms' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: '████████', suffix: 'MOTOR=ON', isCorrupted: true, label: 'Short 8-byte burst' },
        theoryCard: { formula: 'T_B = 80\\text{ ms}, \\quad N_B \\approx 8\\text{ bytes}', description: 'Short physical occlusion', paperRef: 'Sec. IV-D' }
      },
      {
        id: 5,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#ef4444',
        title: 'Photodiode Slicing & Burst Detected',
        shortLabel: 'Burst detected',
        subtitle: 'CRC-8 mismatch identifies localized burst',
        timestampMs: 160.0,
        status: 'PENDING',
        waveformType: 'burst',
        pinTelemetry: { pin: 'GPIO 34 ADC', voltage: '0.12V', state: 'BURST_FLAG', note: 'Localized erasure isolated' },
        payloadState: { prefix: 'Y^- = "TEMP=27.4,"', corruptedOrPatched: 'B = [0...1...0]', suffix: 'Y^+ = ",MOTOR=ON"', isCorrupted: true, label: 'Prefix & Suffix intact' },
        theoryCard: { formula: 'Y^- = \\text{Prefix}, \\quad Y^+ = \\text{Suffix}', description: 'Context isolation', paperRef: 'Sec. III-A' }
      },
      {
        id: 6,
        phase: 'BASR',
        phaseLabel: 'Phase 3: Semantic BASR',
        phaseColor: '#8b5cf6',
        title: 'BASR Semantic Inference',
        shortLabel: 'BASR reconstruction',
        subtitle: 'Transformer reconstructs exact missing patch "HUM=61,"',
        timestampMs: 210.0,
        status: 'PENDING',
        waveformType: 'attention',
        pinTelemetry: { pin: 'BASR Model', voltage: 'RAM', state: 'PREDICTED', note: 'High model confidence: C_token = 0.96' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', isPatched: true, label: 'Predicted: "HUM=61," (Exact match!)' },
        theoryCard: { formula: '\\hat{Y}_m = f(Y^-, Y^+, B; \\theta)', description: 'Semantic context inference', paperRef: 'Sec. V-B' }
      },
      {
        id: 7,
        phase: 'BASR',
        phaseLabel: 'Phase 3: Semantic BASR',
        phaseColor: '#8b5cf6',
        title: 'High Confidence Computation',
        shortLabel: 'Confidence = 0.91',
        subtitle: 'Mild burst penalty results in C = 0.91',
        timestampMs: 250.0,
        status: 'PENDING',
        waveformType: 'threshold',
        pinTelemetry: { pin: 'CGFP Score', voltage: 'Float', state: 'HIGH_CONF', note: 'C = 0.96 × 0.97 × 0.98 × 1.0 = 0.91' },
        payloadState: { prefix: 'Token Conf: 0.96', corruptedOrPatched: 'Mild Penalty: 0.98', suffix: '= C: 0.91', label: 'High Confidence Reached' },
        theoryCard: { formula: 'C = 0.91 \\ge \\tau^* (0.80)', description: 'High confidence evaluation', paperRef: 'Sec. VI-A' }
      },
      {
        id: 8,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: 'Threshold Test: Accepted!',
        shortLabel: '0.91 ≥ 0.80',
        subtitle: '0.91 exceeds τ* = 0.80 -> Immediate Semantic Acceptance!',
        timestampMs: 290.0,
        status: 'PENDING',
        waveformType: 'threshold',
        pinTelemetry: { pin: 'CGFP Decision', voltage: 'HIGH', state: 'ACCEPT_SEMANTIC', note: 'Precision: 97.13% | Patch Error: 0.78%' },
        payloadState: { prefix: 'C = 0.91', corruptedOrPatched: '≥ (GREATER)', suffix: 'τ* = 0.80', label: 'Semantic Reconstruction Accepted' },
        theoryCard: { formula: 'C \\ge \\tau^* \\implies \\text{Accept Semantic Patch}', description: 'Semantic path activated', paperRef: 'Sec. VI-A' }
      },
      {
        id: 9,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: 'Zero-Retransmission Fast Path',
        shortLabel: 'Retransmission avoided',
        subtitle: 'No NACK required: saving 341.7 ms and wireless bandwidth',
        timestampMs: 330.0,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: { pin: 'Channel', voltage: '0V', state: 'NO_ARQ_NEEDED', note: '27.15% retransmissions avoided in testbed' },
        payloadState: { prefix: 'ARQ BYPASSED', corruptedOrPatched: 'LATENCY SAVED', suffix: 'BANDWIDTH SAVED', label: 'Instant Delivery' },
        theoryCard: { formula: '\\Delta T_{\\text{saved}} \\approx 341.7\\text{ ms}', description: 'Semantic efficiency gain', paperRef: 'Abstract & Sec. VII' }
      },
      {
        id: 10,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: 'Clean Semantic Delivery',
        shortLabel: 'Semantic Delivery',
        subtitle: 'Fast delivery at 449.0 ms end-to-end latency',
        timestampMs: 449.0,
        status: 'PENDING',
        waveformType: 'square',
        pinTelemetry: { pin: 'Rx Buffer', voltage: '3.3V', state: 'PATCHED', note: 'Latency: 449.0 ms (Clean speed)' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'Semantically Restored Telemetry' },
        theoryCard: { formula: 'T_{\\text{rec}} = 449.0\\text{ ms}', description: 'Low-latency recovery', paperRef: 'Sec. VII, Table VII' }
      },
      {
        id: 11,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: '✓ VALID PAYLOAD DELIVERED',
        shortLabel: '✓ VALID PAYLOAD',
        subtitle: 'Application receives perfect structured telemetry at 449 ms',
        timestampMs: 449.0,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: { pin: 'App Queue', voltage: '3.3V', state: 'DELIVERED', note: '100% Task Accuracy' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'EXACT MATCH DELIVERED' },
        theoryCard: { formula: '\\text{Acc}_{\\text{motor}} = 100.0\\%', description: 'Zero semantic distortion', paperRef: 'Sec. VII' }
      }
    ]
  },
  P3_SYNTAX_FAIL: {
    name: 'Scenario P3: Severe Occlusion (500 ms) — Hard Syntax Veto (S_syntax = 0)',
    tag: 'Safety Guardrail',
    tagColor: 'bg-rose-950/80 border-rose-600/70 text-rose-300',
    description: 'Prolonged 500 ms blockage. BASR attempts reconstruction but output violates telemetry key syntax (S_syntax = 0). CGFP multiplies confidence by zero, triggering instant fallback.',
    confidence: 0.00,
    threshold: 0.80,
    decision: 'SYNTAX_REJECT',
    steps: [
      {
        id: 0,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'ESP32 Transmitter Node',
        shortLabel: 'ESP32 TX',
        subtitle: 'Source telemetry transmission',
        timestampMs: 0.0,
        status: 'PENDING',
        waveformType: 'square',
        pinTelemetry: { pin: 'GPIO 23', voltage: '3.3V', state: 'TX', note: 'Normal frame' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'Transmitted Frame' },
        theoryCard: { formula: 'Y = [y_1 \\dots y_N]', description: 'Source frame', paperRef: 'Sec. III-A' }
      },
      {
        id: 1,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#ef4444',
        title: 'Severe 500 ms Physical Blockage',
        shortLabel: '500 ms blockage',
        subtitle: 'Severe obstruction wipes out 50 symbols',
        timestampMs: 250.0,
        status: 'PENDING',
        waveformType: 'burst',
        pinTelemetry: { pin: 'Servo Flap', voltage: '5V', state: 'FULL_BLOCK', note: '500 ms erasure' },
        payloadState: { prefix: 'T██████', corruptedOrPatched: '██████████', suffix: '██████ON', isCorrupted: true, label: 'Massive loss' },
        theoryCard: { formula: 'T_B = 500\\text{ ms}, \\quad N_B \\approx 50\\text{ bytes}', description: 'Severe burst', paperRef: 'Sec. IV-D' }
      },
      {
        id: 2,
        phase: 'BASR',
        phaseLabel: 'Phase 3: Semantic BASR',
        phaseColor: '#8b5cf6',
        title: 'Degraded Reconstruction',
        shortLabel: 'BASR degraded',
        subtitle: 'Context insufficient: output has malformed syntax',
        timestampMs: 350.0,
        status: 'PENDING',
        waveformType: 'attention',
        pinTelemetry: { pin: 'Model', voltage: 'RAM', state: 'SYNTAX_ERROR', note: 'Missing delimiter ","' },
        payloadState: { prefix: 'T=27.4', corruptedOrPatched: 'HM??61', suffix: 'MTR_ON', isCorrupted: true, label: 'Syntactically Malformed Patch' },
        theoryCard: { formula: 'S_{\\text{syntax}} = 0', description: 'Syntax validation fails', paperRef: 'Sec. VI-A' }
      },
      {
        id: 3,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#ef4444',
        title: 'Hard Syntax Veto (C = 0.00)',
        shortLabel: 'S_syntax = 0 -> C = 0',
        subtitle: 'Binary syntax factor S_syntax = 0 forces C = 0 immediately',
        timestampMs: 380.0,
        status: 'PENDING',
        waveformType: 'threshold',
        pinTelemetry: { pin: 'CGFP Logic', voltage: '0V', state: 'HARD_VETO', note: 'C = C_token × C_phys × Penalty × 0 = 0.00' },
        payloadState: { prefix: 'SYNTAX INVALID', corruptedOrPatched: 'S_syntax = 0', suffix: 'C = 0.00', label: 'Veto Activated' },
        theoryCard: { formula: 'C = C_{\\text{token}} C_{\\text{phys}} \\text{Penalty} \\cdot 0 = 0.00', description: 'Hard safety veto', paperRef: 'Sec. VI-A' }
      },
      {
        id: 4,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#06b6d4',
        title: 'Selective NACK & Full ARQ Retransmit',
        shortLabel: 'NACK + Fallback',
        subtitle: 'Fallback ensures no corrupted semantic data reaches application',
        timestampMs: 420.0,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: { pin: 'ARQ Snd', voltage: '3.3V', state: 'NACK', note: 'Triggering exact retransmission' },
        payloadState: { prefix: 'NACK DISPATCHED', corruptedOrPatched: 'ARQ RETRY', suffix: 'SAFETY PRESERVED', label: 'Fallback in Progress' },
        theoryCard: { formula: '\\mathcal{D} = \\text{Selective Fallback}', description: 'Guaranteed exactness', paperRef: 'Sec. VI-C' }
      },
      {
        id: 5,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: '✓ VALID PAYLOAD DELIVERED (Fallback OK)',
        shortLabel: '✓ VALID PAYLOAD',
        subtitle: 'Exact frame retransmitted and verified bit-perfect',
        timestampMs: 920.0,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: { pin: 'App Queue', voltage: '3.3V', state: 'DELIVERED', note: '100% Bit-Perfect via ARQ' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'Bit-Exact Final Delivery' },
        theoryCard: { formula: '\\text{UFER} = 0.00\\%', description: 'Zero undetected errors', paperRef: 'Sec. VII' }
      }
    ]
  },
  P0_CLEAN: {
    name: 'Scenario P0: Clean Link (0 ms) — Direct Physical Pass',
    tag: 'Clean Baseline (0 ms Obstruction)',
    tagColor: 'bg-blue-950/80 border-blue-600/70 text-blue-300',
    description: 'No optical occlusion. Beam is direct and unobstructed. Dallas CRC-8 passes immediately on first arrival with zero bit errors and 449.0 ms mean latency.',
    confidence: 1.00,
    threshold: 0.80,
    decision: 'CLEAN_PASS',
    steps: [
      {
        id: 0,
        phase: 'TX',
        phaseLabel: 'Phase 1: Optical TX',
        phaseColor: '#3b82f6',
        title: 'ESP32 Transmitter Node',
        shortLabel: 'ESP32 TX',
        subtitle: 'Serializes payload and calculates CRC-8: 0x4E',
        timestampMs: 0.0,
        status: 'PENDING',
        waveformType: 'square',
        pinTelemetry: { pin: 'GPIO 23', voltage: '3.3V', state: 'TX', note: 'Clean signal' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'Clean Payload' },
        theoryCard: { formula: 'Y = [y_1 \\dots y_N]', description: 'Clean source', paperRef: 'Sec. III-A' }
      },
      {
        id: 1,
        phase: 'CHANNEL',
        phaseLabel: 'Phase 2: Channel & Burst',
        phaseColor: '#3b82f6',
        title: 'Unobstructed Optical Path',
        shortLabel: 'Clean LOS (0ms)',
        subtitle: '15 cm free-space path with zero flap occlusion',
        timestampMs: 40.0,
        status: 'PENDING',
        waveformType: 'optical',
        pinTelemetry: { pin: 'Air Gap', voltage: '0V', state: 'CLEAR', note: 'BER = 0.0, SNR = 28.4 dB' },
        payloadState: { prefix: 'CLEAR LOS', corruptedOrPatched: 'ZERO LOSS', suffix: 'SNR = 28.4 dB', label: 'Unimpeded Light Propagation' },
        theoryCard: { formula: 'T_B = 0\\text{ ms}, \\quad N_B = 0', description: 'Clean baseline', paperRef: 'Sec. VII-A' }
      },
      {
        id: 2,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: 'Direct CRC-8 Verification Pass',
        shortLabel: 'CRC-8 Pass (0x4E)',
        subtitle: 'BPW34 photodiode recovers 100% bit stream, CRC-8 matches exactly',
        timestampMs: 449.0,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: { pin: 'GPIO 34 ADC', voltage: '1.85V', state: 'CRC_MATCH', note: 'CRC Calculated: 0x4E == Received: 0x4E' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'Direct Uncorrupted Match' },
        theoryCard: { formula: '\\text{CRC-8}(Y) == \\text{CRC-8}_{\\text{rx}}', description: 'Direct hardware validation', paperRef: 'Sec. III-C' }
      },
      {
        id: 3,
        phase: 'CGFP',
        phaseLabel: 'Phase 4: CGFP Decision',
        phaseColor: '#10b981',
        title: '✓ VALID PAYLOAD DELIVERED',
        shortLabel: '✓ VALID PAYLOAD',
        subtitle: 'Zero bit errors, 449.0 ms baseline mean latency',
        timestampMs: 449.0,
        status: 'PENDING',
        waveformType: 'ack',
        pinTelemetry: { pin: 'App Queue', voltage: '3.3V', state: 'DELIVERED', note: 'Mean Latency: 449.0 ms | BER: 0' },
        payloadState: { prefix: 'TEMP=27.4,', corruptedOrPatched: 'HUM=61,', suffix: 'MOTOR=ON', label: 'Zero Bit Errors' },
        theoryCard: { formula: 'T_{\\text{clean}} = 449.0\\text{ ms}, \\quad \\text{BER} = 0', description: 'Clean link baseline', paperRef: 'Sec. VII-A' }
      }
    ]
  }
};

export const SemLiFiExecutionFlowModal: React.FC<SemLiFiExecutionFlowModalProps> = ({
  isOpen,
  onClose,
  onStartSimulation
}) => {
  const [selectedScenarioKey, setSelectedScenarioKey] = useState<ExecutionScenario>('P2_FALLBACK');
  const [currentStepIdx, setCurrentStepIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playSpeed, setPlaySpeed] = useState<number>(1);
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  const scenario = SCENARIO_PRESETS[selectedScenarioKey];
  const steps = scenario.steps;
  const activeStep = steps[Math.min(currentStepIdx, steps.length - 1)];

  // Audio tone feedback
  const audioCtxRef = useRef<AudioContext | null>(null);
  const playTone = (freq = 800) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio not permitted
    }
  };

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(250, Math.round(1000 / playSpeed));
    const timer = setInterval(() => {
      setCurrentStepIdx((prev) => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          playTone(1200);
          return prev;
        }
        const next = prev + 1;
        playTone(600 + next * 60);
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, steps.length]);

  const handleSelectScenario = (key: ExecutionScenario) => {
    setIsPlaying(false);
    setSelectedScenarioKey(key);
    setCurrentStepIdx(0);
    playTone(700);
  };

  const handleStepChange = (forward: boolean) => {
    setIsPlaying(false);
    setCurrentStepIdx((prev) => {
      const next = forward ? Math.min(steps.length - 1, prev + 1) : Math.max(0, prev - 1);
      playTone(500 + next * 70);
      return next;
    });
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIdx(0);
    playTone(450);
  };

  const handlePlayToggle = () => {
    if (currentStepIdx >= steps.length - 1) {
      setCurrentStepIdx(0);
    }
    setIsPlaying((p) => !p);
    playTone(850);
  };

  const handleCopyTrace = () => {
    const text = `SemLiFi Execution Flow Trace (${scenario.name})\n` +
      `Description: ${scenario.description}\n` +
      `Confidence: C = ${scenario.confidence} | Threshold: τ* = ${scenario.threshold} | Decision: ${scenario.decision}\n\n` +
      `Step-by-step Execution Log:\n` +
      steps.map((s, idx) => `[${s.timestampMs.toFixed(1)} ms] Step ${idx + 1}: ${s.title} (${s.phaseLabel})\n  -> State: ${s.pinTelemetry.note}\n  -> Payload: ${s.payloadState.prefix} ${s.payloadState.corruptedOrPatched} ${s.payloadState.suffix}\n  -> Formula: ${s.theoryCard.formula}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 select-none animate-in fade-in">
      <div className="bg-[#0b111e] border border-[#1e2d4a] rounded-2xl max-w-5xl w-full h-[92vh] max-h-[860px] flex flex-col shadow-2xl overflow-hidden relative font-sans text-xs">
        {/* ========================================================= */}
        {/* 1. TOP HEADER & METADATA BAR                              */}
        {/* ========================================================= */}
        <div className="px-5 py-3.5 bg-[#0e1628] border-b border-[#1b2b48] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-white font-mono tracking-wide">
                  SemLiFi Cross-Layer Execution Trace
                </h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950/80 border border-cyan-700/60 text-cyan-300">
                  Step {currentStepIdx + 1} of {steps.length}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Synchronized pipeline from physical optical pulse to BASR Edge Transformer &amp; CGFP decision gate
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyTrace}
              className="px-2.5 py-1.5 rounded-lg bg-[#141f36] hover:bg-[#1c2c4d] text-slate-300 hover:text-white border border-slate-700 text-xs font-mono flex items-center space-x-1.5 transition-all"
              title="Copy complete trace and formulas to clipboard"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedSummary ? 'Copied!' : 'Copy Trace'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#1a263d] text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. SCENARIO SELECTOR TABS                                 */}
        {/* ========================================================= */}
        <div className="px-5 py-2.5 bg-[#080d18] border-b border-[#16243d] flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-1.5 overflow-x-auto scrollbar-none py-0.5">
            <span className="text-[11px] font-mono text-slate-400 font-bold mr-1 shrink-0">
              SCENARIO:
            </span>

            {(Object.keys(SCENARIO_PRESETS) as ExecutionScenario[]).map((key) => {
              const item = SCENARIO_PRESETS[key];
              const isSelected = selectedScenarioKey === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectScenario(key)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30'
                      : 'bg-[#0f172a] text-slate-300 hover:text-white border-slate-700/80 hover:border-slate-500'
                  }`}
                >
                  {key === 'P2_FALLBACK' && 'P2: 250ms Fallback (User Flow)'}
                  {key === 'P1_ACCEPTANCE' && 'P1: 80ms Fast Semantic (Accept)'}
                  {key === 'P3_SYNTAX_FAIL' && 'P3: 500ms Syntax Veto (C=0)'}
                  {key === 'P0_CLEAN' && 'P0: Clean LOS (0ms)'}
                </button>
              );
            })}
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className={`px-2 py-0.5 rounded border text-[10px] font-bold ${scenario.tagColor}`}>
              {scenario.tag}
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. PLAYBACK CONTROLS & TIMELINE STATUS BAR                */}
        {/* ========================================================= */}
        <div className="px-5 py-2 bg-[#091020] border-b border-[#14223b] flex items-center justify-between text-xs font-mono shrink-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePlayToggle}
              className={`px-3 py-1 rounded-lg font-bold flex items-center space-x-1.5 shadow transition-all ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? 'Pause' : 'Auto Play'}</span>
            </button>

            <button
              onClick={() => handleStepChange(false)}
              disabled={currentStepIdx === 0}
              className="p-1.5 rounded-lg bg-[#121c2e] hover:bg-[#1a2842] text-slate-300 disabled:opacity-40 border border-slate-700"
              title="Previous Step"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={() => handleStepChange(true)}
              disabled={currentStepIdx === steps.length - 1}
              className="p-1.5 rounded-lg bg-[#121c2e] hover:bg-[#1a2842] text-slate-300 disabled:opacity-40 border border-slate-700"
              title="Next Step"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-[#121c2e] hover:bg-[#1a2842] text-slate-300 border border-slate-700 flex items-center space-x-1"
              title="Reset Trace to Step 1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>

          {/* Speed Selector & Time Badge */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="text-slate-400 text-[10px]">Speed:</span>
              {[1, 2, 5].map((s) => (
                <button
                  key={s}
                  onClick={() => setPlaySpeed(s)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    playSpeed === s ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            <div className="h-3 w-[1px] bg-slate-700 hidden sm:block" />

            <div className="text-cyan-300 font-bold bg-[#0d182b] px-2 py-0.5 rounded border border-cyan-800/60 text-[11px]">
              T + {activeStep.timestampMs.toFixed(1)} ms
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. MAIN SPLIT: PIPELINE FLOWCHART (LEFT) + DETAILS (RIGHT)*/}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* ------------------------------------------------------- */}
          {/* LEFT: INTERACTIVE STEPPING PIPELINE FLOWCHART           */}
          {/* ------------------------------------------------------- */}
          <div className="w-full md:w-[48%] xl:w-[45%] border-r border-[#16233a] bg-[#070b16] flex flex-col min-h-0 overflow-hidden">
            <div className="p-3 border-b border-[#142036] flex justify-between items-center bg-[#090f1d] shrink-0">
              <span className="text-[11px] font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                <span>Execution Node Chain</span>
              </span>
              <span className="text-[10px] font-mono text-cyan-400">
                {currentStepIdx + 1} / {steps.length} Executed
              </span>
            </div>

            {/* Scrollable Node Stack */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2">
              {steps.map((item, idx) => {
                const isActive = currentStepIdx === idx;
                const isPassed = currentStepIdx > idx;
                const isFinal = idx === steps.length - 1;

                return (
                  <div key={item.id} className="relative">
                    {/* Node Card */}
                    <div
                      onClick={() => {
                        setIsPlaying(false);
                        setCurrentStepIdx(idx);
                        playTone(500 + idx * 60);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-950/90 to-cyan-950/90 border-cyan-400 shadow-lg shadow-cyan-950/60 ring-1 ring-cyan-400/50'
                          : isPassed
                          ? 'bg-[#0d1627] border-slate-700/70 text-slate-200'
                          : 'bg-[#090d18] border-slate-800/80 text-slate-500 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        {/* Step Number Badge */}
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-[10px] shrink-0 ${
                            isFinal && (isActive || isPassed)
                              ? 'bg-emerald-600 text-white'
                              : isActive
                              ? 'bg-cyan-500 text-black shadow-md shadow-cyan-500/40 animate-pulse'
                              : isPassed
                              ? 'bg-[#1b2b48] text-cyan-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isFinal && (isActive || isPassed) ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        {/* Title & Phase Subtitle */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-1.5">
                            <span
                              className={`text-xs font-mono font-bold truncate ${
                                isActive ? 'text-white' : isPassed ? 'text-slate-200' : 'text-slate-400'
                              }`}
                            >
                              {item.shortLabel}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                            {item.phaseLabel} • {item.timestampMs.toFixed(0)} ms
                          </div>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <div className="shrink-0 ml-2">
                        {isActive ? (
                          <span className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500 text-cyan-300 font-mono text-[9px] font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                            <span>ACTIVE</span>
                          </span>
                        ) : isPassed ? (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-700/60 text-emerald-400 text-[9px] font-bold font-mono">
                            DONE
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[9px] font-mono">
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Connecting Arrow */}
                    {idx < steps.length - 1 && (
                      <div className="flex justify-center my-0.5">
                        <ArrowDown
                          className={`w-3.5 h-3.5 transition-colors ${
                            currentStepIdx > idx ? 'text-cyan-500' : 'text-slate-700'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ------------------------------------------------------- */}
          {/* RIGHT: DEEP-DIVE STEP INSPECTOR & THEORETICAL PROOFS   */}
          {/* ------------------------------------------------------- */}
          <div className="flex-1 bg-[#060a14] p-4 lg:p-5 overflow-y-auto space-y-4">
            {/* Step Header Card */}
            <div className="p-4 rounded-xl bg-[#0b1324] border border-[#1b2b48] shadow-lg space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span
                    className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                    style={{ backgroundColor: `${activeStep.phaseColor}20`, color: activeStep.phaseColor }}
                  >
                    {activeStep.phaseLabel} (Step {currentStepIdx + 1} of {steps.length})
                  </span>
                  <h3 className="text-base font-bold text-white font-mono mt-1">
                    {activeStep.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {activeStep.subtitle}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-bold text-cyan-300 font-mono">
                    T + {activeStep.timestampMs.toFixed(1)} ms
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Elapsed Execution
                  </div>
                </div>
              </div>
            </div>

            {/* Live Hardware Telemetry Probe Card */}
            <div className="p-3.5 rounded-xl bg-[#090f1d] border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Physical Hardware State Probe</span>
                </span>
                <span className="text-cyan-400 font-bold">{activeStep.pinTelemetry.pin}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-mono">
                <div className="bg-[#050812] p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">VOLTAGE LEVEL</span>
                  <strong className="text-white text-xs">{activeStep.pinTelemetry.voltage}</strong>
                </div>
                <div className="bg-[#050812] p-2 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[9px]">STATE FLAG</span>
                  <strong className="text-emerald-400 text-xs">{activeStep.pinTelemetry.state}</strong>
                </div>
                <div className="bg-[#050812] p-2 rounded-lg border border-slate-800 col-span-2 sm:col-span-1">
                  <span className="text-slate-500 block text-[9px]">SAMPLING WINDOW</span>
                  <strong className="text-cyan-300 text-xs">450 - 550 µs</strong>
                </div>
              </div>

              <div className="p-2 bg-[#050812] rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300">
                <span className="text-slate-500">Note: </span>
                <span>{activeStep.pinTelemetry.note}</span>
              </div>
            </div>

            {/* Payload State & Buffer Inspector */}
            <div className="p-3.5 rounded-xl bg-[#090f1d] border border-slate-800 space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                <span className="font-bold text-white flex items-center space-x-1.5">
                  <FileCode className="w-3.5 h-3.5 text-purple-400" />
                  <span>Telemetry Payload Buffer</span>
                </span>
                <span className="text-xs text-purple-300 font-bold">{activeStep.payloadState.label}</span>
              </div>

              {/* Visual String Dissection */}
              <div className="p-2.5 bg-black/60 rounded-lg border border-slate-800 font-mono text-xs flex flex-wrap items-center gap-1.5">
                <span className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 font-bold">
                  {activeStep.payloadState.prefix}
                </span>

                <span
                  className={`px-2 py-1 rounded font-bold ${
                    activeStep.payloadState.isCorrupted
                      ? 'bg-rose-950 border border-rose-600 text-rose-300 animate-pulse'
                      : activeStep.payloadState.isPatched
                      ? 'bg-purple-950 border border-purple-500 text-purple-200'
                      : 'bg-blue-950/80 border border-blue-600/70 text-blue-300'
                  }`}
                >
                  {activeStep.payloadState.corruptedOrPatched}
                </span>

                <span className="px-2 py-1 rounded bg-emerald-950/80 border border-emerald-600/70 text-emerald-300 font-bold">
                  {activeStep.payloadState.suffix}
                </span>
              </div>

              <div className="flex justify-between text-[10px] font-mono text-slate-500 px-1">
                <span>Prefix (Surviving context)</span>
                <span>Affected Target Region</span>
                <span>Suffix (Surviving context)</span>
              </div>
            </div>

            {/* Research Paper Theory & Mathematical Formulation */}
            <div className="p-3.5 rounded-xl bg-[#0c1424] border border-[#1b2b48] space-y-2">
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400 border-b border-slate-800/80 pb-1.5">
                <span className="font-bold text-cyan-300 flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Research Paper Mathematical Formulation</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{activeStep.theoryCard.paperRef}</span>
              </div>

              <div className="p-2 bg-[#050914] rounded-lg border border-cyan-900/50 font-mono text-xs text-cyan-200 overflow-x-auto">
                {activeStep.theoryCard.formula}
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                {activeStep.theoryCard.description}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. BOTTOM RUN BUTTON                                      */}
        {/* ========================================================= */}
        <div className="p-3 bg-[#090f1d] border-t border-[#16233a] flex items-center justify-between shrink-0">
          <div className="text-[11px] font-mono text-slate-400">
            <span>Result: </span>
            <strong className="text-white">
              {scenario.decision === 'FALLBACK_NACK' && 'Confidence 0.73 < 0.80 -> NACK & Retransmit -> Valid Payload (100% Delivery)'}
              {scenario.decision === 'ACCEPT_SEMANTIC' && 'Confidence 0.91 >= 0.80 -> Semantic Patch Accepted (Fast 449 ms Delivery)'}
              {scenario.decision === 'SYNTAX_REJECT' && 'Syntax Error S_syntax=0 -> Immediate Fallback (0.00% Live UFER)'}
              {scenario.decision === 'CLEAN_PASS' && 'Zero Occlusion -> Clean CRC-8 Match (449 ms Baseline)'}
            </strong>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (onStartSimulation) {
                  onClose();
                  onStartSimulation();
                } else {
                  handlePlayToggle();
                }
              }}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center space-x-1.5 transition-all text-xs font-mono"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Execution Trace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SemLiFiExecutionFlowModal;

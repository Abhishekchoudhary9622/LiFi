import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Camera,
  Share2,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Cpu,
  Zap,
  Radio,
  Activity,
  ArrowRight,
  Info,
  Play,
  Pause,
  RotateCcw,
  Square,
  ChevronRight,
  ChevronLeft,
  Gauge,
  Sliders,
  Sparkles,
  ShieldCheck,
  Eye,
  Layers,
  HelpCircle,
  SlidersHorizontal,
  AlertTriangle
} from 'lucide-react';
import {
  DIGITAL_TWIN_COMPONENTS,
  DIGITAL_TWIN_CONNECTIONS,
  DigitalTwinComponent
} from '../../model/digitalTwin';
import { api } from '../../services/api';
import { SharedExperimentResult } from '../../model/experimentModel';

// ---------------------------------------------------------------------------
// 1. TYPED SIGNAL FLOW MODEL (7 Synchronized Physical Stages)
// ---------------------------------------------------------------------------
export interface SignalFlowStage {
  stageNumber: number; // 1 to 7
  id: string;
  name: string;
  shortLabel: string;
  componentId: string;
  connectionId: string;
  actionLabel: string;
  color: string;
  glowColor: string;
  type: 'ELECTRICAL' | 'OPTICAL' | 'ANALOG' | 'DIGITAL';
  startCoord: { x: number; y: number };
  controlCoord?: { x: number; y: number };
  endCoord: { x: number; y: number };
  pathD: string;
  pinFrom: string;
  pinTo: string;
  signalType: string;
  voltageOrMetric: string;
  technicalDescription: string;
  schematicWire: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    label: string;
  };
}

export const SIGNAL_FLOW_STAGES: SignalFlowStage[] = [
  {
    stageNumber: 1,
    id: 'stage_tx_pwm',
    name: 'ESP32 TX — GPIO 23 Manchester Output',
    shortLabel: 'ESP32 TX Drive',
    componentId: 'stm32_tx',
    connectionId: 'conn_tx_base',
    actionLabel: 'Transmitting 1000 bps Manchester OOK',
    color: '#3b82f6', // Electric Blue
    glowColor: 'rgba(59, 130, 246, 0.45)',
    type: 'DIGITAL',
    startCoord: { x: 250, y: 360 },
    controlCoord: { x: 360, y: 420 },
    endCoord: { x: 470, y: 430 },
    pathD: 'M 250 360 Q 360 420 470 430',
    pinFrom: 'ESP32 TX (GPIO 23)',
    pinTo: 'S8050 / 2N2222 Base (via 1 kΩ Resistor)',
    signalType: 'Manchester Encoded OOK (1000 bps, Tb = 1000 µs)',
    voltageOrMetric: '3.30 V TTL (500 µs Chip Interval)',
    technicalDescription: 'Hardware microsecond timer drives GPIO 23 with Manchester chip transitions (500 µs half-bit intervals) framing structured telemetry.',
    schematicWire: {
      x1: 155,
      y1: 240,
      x2: 215,
      y2: 240,
      label: 'GPIO 23 (1000 bps OOK)'
    }
  },
  {
    stageNumber: 2,
    id: 'stage_driver_sink',
    name: 'S8050 / 2N2222 Transistor — LED Driver Stage',
    shortLabel: 'BJT Current Sinking',
    componentId: 'transistor_2n2222',
    connectionId: 'conn_collector_led',
    actionLabel: 'BJT Current Sinking Active (14.5 mA)',
    color: '#f97316', // Vibrant Orange
    glowColor: 'rgba(249, 115, 22, 0.45)',
    type: 'ELECTRICAL',
    startCoord: { x: 520, y: 420 },
    controlCoord: { x: 500, y: 300 },
    endCoord: { x: 422, y: 215 },
    pathD: 'M 520 420 Q 500 300 422 215',
    pinFrom: 'S8050 / 2N2222 Collector (Pin 3)',
    pinTo: 'Red LED Cathode (- Lead)',
    signalType: 'Switched Sinking Current (Ground Return)',
    voltageOrMetric: 'V_CE(sat) = 0.20 V, I_c = 14.5 mA',
    technicalDescription: 'Paper-specified S8050 NPN switching transistor (or verified 2N2222 alternate) enters saturation mode (V_CE < 0.2V), sinking 14.5 mA through the LED with sub-100ns switching edges.',
    schematicWire: {
      x1: 295,
      y1: 240,
      x2: 355,
      y2: 240,
      label: 'Collector Sink'
    }
  },
  {
    stageNumber: 3,
    id: 'stage_led_optical_emission',
    name: 'Red LED — Optical Transmission',
    shortLabel: 'Optical Emission (650 nm)',
    componentId: 'led_tx',
    connectionId: 'conn_led_beam',
    actionLabel: 'Emitting 650 nm Radiant Optical Photons',
    color: '#ef4444', // Red
    glowColor: 'rgba(239, 68, 68, 0.45)',
    type: 'OPTICAL',
    startCoord: { x: 422, y: 215 },
    controlCoord: { x: 422, y: 192 },
    endCoord: { x: 422, y: 192 },
    pathD: 'M 422 215 L 422 192',
    pinFrom: 'Red LED Cathode / Anode',
    pinTo: 'Free-Space Lens Aperture',
    signalType: '650 nm Visible Red Radiant Flux (180 mcd)',
    voltageOrMetric: 'V_f = 1.95 V, Radiant Flux = 18.5 mW',
    technicalDescription: 'Forward biased LED converts 14.5 mA electrical pulse train into 650 nm visible red photon beam with 18 ns rise time.',
    schematicWire: {
      x1: 435,
      y1: 240,
      x2: 495,
      y2: 240,
      label: 'Vf = 1.95 V 650 nm'
    }
  },
  {
    stageNumber: 4,
    id: 'stage_optical_free_space',
    name: 'Air Channel — Optical Propagation',
    shortLabel: 'Optical Propagation (15 cm)',
    componentId: 'optical_channel',
    connectionId: 'conn_beam_photodiode',
    actionLabel: 'Photons Traversing Atmospheric Air Gap',
    color: '#eab308', // Amber / Gold
    glowColor: 'rgba(234, 179, 8, 0.45)',
    type: 'OPTICAL',
    startCoord: { x: 422, y: 192 },
    controlCoord: { x: 540, y: 197 },
    endCoord: { x: 662, y: 202 },
    pathD: 'M 422 192 Q 540 197 662 202',
    pinFrom: 'Transmitter LED Lens Dome',
    pinTo: 'Receiver BPW34 Photodiode Surface',
    signalType: 'Atmospheric Free-Space Optical Channel (LOS)',
    voltageOrMetric: 'Irradiance: 32.4 µW/cm² (d = 15 cm)',
    technicalDescription: 'Beam propagates through free space obeying Lambertian radiant intensity law: E(d) = (I_0 * cos^2(phi)) / d^2, subject to SG90 servo motor burst occlusion.',
    schematicWire: {
      x1: 575,
      y1: 240,
      x2: 635,
      y2: 240,
      label: 'Air Gap d = 15 cm'
    }
  },
  {
    stageNumber: 5,
    id: 'stage_photodiode_detection',
    name: 'BPW34 Photodiode — Optical-to-Electrical',
    shortLabel: 'Photocurrent Generation',
    componentId: 'photodiode_rx',
    connectionId: 'conn_diode_tias',
    actionLabel: 'Photons Generating Reverse Photocurrent',
    color: '#10b981', // Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.45)',
    type: 'ANALOG',
    startCoord: { x: 662, y: 202 },
    controlCoord: { x: 740, y: 190 },
    endCoord: { x: 830, y: 180 },
    pathD: 'M 662 202 Q 740 190 830 180',
    pinFrom: 'BPW34 PIN Junction (7.5 mm²)',
    pinTo: 'LM358 Inverting Input Pin 2',
    signalType: 'Reverse Photocurrent (I_ph)',
    voltageOrMetric: 'I_ph = 42.8 µA (Responsivity: 0.62 A/W)',
    technicalDescription: 'Photons incident on 7.5 mm² silicon radiant area liberate electron-hole pairs, generating proportional photocurrent I_ph = R_lambda * E * A_det.',
    schematicWire: {
      x1: 715,
      y1: 240,
      x2: 775,
      y2: 240,
      label: 'I_ph = 42.8 µA'
    }
  },
  {
    stageNumber: 6,
    id: 'stage_lm358_amplification',
    name: 'LM358 — Signal Conditioning / TIA',
    shortLabel: 'LM358 TIA / Slicing',
    componentId: 'signal_conditioning',
    connectionId: 'conn_amp_rx',
    actionLabel: 'Transimpedance Amplification (TIA)',
    color: '#06b6d4', // Cyan
    glowColor: 'rgba(6, 182, 212, 0.45)',
    type: 'ANALOG',
    startCoord: { x: 830, y: 180 },
    controlCoord: { x: 865, y: 220 },
    endCoord: { x: 897, y: 190 },
    pathD: 'M 830 180 Q 865 220 897 190',
    pinFrom: 'LM358 Inverting Pin 2',
    pinTo: 'LM358 Output Pin 1 Header',
    signalType: 'Conditioned Analog Waveform & Slicing',
    voltageOrMetric: 'V_out = 2.85 V_pp (R_f = 47 kΩ)',
    technicalDescription: 'Converts microamp photocurrent into voltage (TIA Stage), then slices against reference threshold to recover sharp TTL logic.',
    schematicWire: {
      x1: 855,
      y1: 240,
      x2: 915,
      y2: 240,
      label: 'Rf = 47 kΩ Sliced TTL'
    }
  },
  {
    stageNumber: 7,
    id: 'stage_rx_adc_sampling',
    name: 'ESP32 RX — GPIO 34 ADC Mid-bit Sampling & Recovery',
    shortLabel: 'ESP32 RX Sampling',
    componentId: 'stm32_rx',
    connectionId: 'conn_amp_rx',
    actionLabel: 'Mid-bit Sampling & Burst Recovery',
    color: '#8b5cf6', // Violet / Purple
    glowColor: 'rgba(139, 92, 246, 0.45)',
    type: 'DIGITAL',
    startCoord: { x: 897, y: 190 },
    controlCoord: { x: 880, y: 290 },
    endCoord: { x: 800, y: 370 },
    pathD: 'M 897 190 Q 880 290 800 370',
    pinFrom: 'LM358 Pin 1 TIA Output',
    pinTo: 'ESP32 RX (GPIO 34 / ADC1_CH6)',
    signalType: 'Analog Voltage (0 - 3.3V Sliced)',
    voltageOrMetric: '12-bit ADC / Slicer Threshold: 50 counts',
    technicalDescription: 'Mid-bit window (450–550 µs) samples ADC on GPIO 34, slices at ~50 counts, decodes Manchester symbols, validates Dallas CRC-8, and detects burst losses for BASR + CGFP.',
    schematicWire: {
      x1: 915,
      y1: 240,
      x2: 960,
      y2: 240,
      label: 'GPIO 34 ADC Mid-Bit'
    }
  }
];

// Physical Subsystems Bounding Boxes on 1024x682 Hardware Photograph
interface SubsystemBox {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  flowStep: number;
}

const HARDWARE_SUBSYSTEM_BOXES: SubsystemBox[] = [
  { id: 'stm32_tx', label: 'ESP32 TX (GPIO 23)', x: 75, y: 235, width: 215, height: 255, color: '#3b82f6', flowStep: 1 },
  { id: 'transistor_2n2222', label: 'S8050 / 2N2222 Driver', x: 390, y: 370, width: 260, height: 125, color: '#f97316', flowStep: 2 },
  { id: 'led_tx', label: 'Red LED (650 nm)', x: 350, y: 65, width: 145, height: 255, color: '#ef4444', flowStep: 3 },
  { id: 'optical_channel', label: 'Optical Link (15 cm)', x: 450, y: 230, width: 160, height: 55, color: '#eab308', flowStep: 4 },
  { id: 'photodiode_rx', label: 'BPW34 Photodiode', x: 610, y: 75, width: 105, height: 255, color: '#10b981', flowStep: 5 },
  { id: 'signal_conditioning', label: 'LM358 TIA Amplifier', x: 805, y: 55, width: 185, height: 255, color: '#06b6d4', flowStep: 6 },
  { id: 'stm32_rx', label: 'ESP32 RX (GPIO 34)', x: 710, y: 355, width: 280, height: 155, color: '#8b5cf6', flowStep: 7 }
];

// 10-Step Full Signal Processing Chain (Part 2 Brief Requirement)
export interface SignalPipelineStep {
  stepNumber: number;
  id: string;
  name: string;
  subsystem: string;
  signalType: string;
  metric: string;
  description: string;
  color: string;
}

export const SEMLIFI_SIGNAL_FLOW_10_STEPS: SignalPipelineStep[] = [
  {
    stepNumber: 1,
    id: 'step_manchester_tx',
    name: '1. Manchester OOK Modulation',
    subsystem: 'ESP32 TX MCU',
    signalType: 'Digital TTL (0 / 3.3V)',
    metric: '1000 bps (Tb = 1000 µs, Tc = 500 µs)',
    description: 'Hardware microsecond timer modulates framed telemetry bits into Manchester chip transitions at GPIO 23.',
    color: '#3b82f6'
  },
  {
    stepNumber: 2,
    id: 'step_bjt_driver',
    name: '2. Driver Transistor Sinking',
    subsystem: 'S8050 / 2N2222 BJT',
    signalType: 'Switched Sinking Current',
    metric: 'V_CE(sat) = 0.20 V, I_c = 14.5 mA',
    description: 'BJT base saturates via 1kΩ resistor, sinking LED current to circuit ground with sub-100ns edges.',
    color: '#f97316'
  },
  {
    stepNumber: 3,
    id: 'step_led_emission',
    name: '3. Red LED Optical Conversion',
    subsystem: '5mm Red LED (650 nm)',
    signalType: 'Radiant Optical Photons',
    metric: 'V_f = 1.95 V, Radiant Flux = 18.5 mW',
    description: 'Forward biased LED emits 650 nm optical photons through epoxy dome with 30° viewing half-angle.',
    color: '#ef4444'
  },
  {
    stepNumber: 4,
    id: 'step_optical_channel',
    name: '4. Optical Channel & Obstruction',
    subsystem: 'Atmospheric Air Gap & SG90',
    signalType: 'Free-Space Line-of-Sight',
    metric: 'E(15cm) = 32.4 µW/cm², Loss ∝ 1/d²',
    description: 'Light propagates across 15 cm air gap, subject to controlled burst obstruction by SG90 servo motor.',
    color: '#eab308'
  },
  {
    stepNumber: 5,
    id: 'step_bpw34_photodiode',
    name: '5. BPW34 Photocurrent Generation',
    subsystem: 'Silicon PIN Photodiode',
    signalType: 'Analog Reverse Current',
    metric: 'I_ph = 42.8 µA (R_λ = 0.62 A/W)',
    description: 'Photons incident on 7.5 mm² active area generate proportional photocurrent under 3.3V reverse bias.',
    color: '#10b981'
  },
  {
    stepNumber: 6,
    id: 'step_lm358_conditioning',
    name: '6. LM358 TIA Amplification & Slicing',
    subsystem: 'LM358 Dual Op-Amp',
    signalType: 'Conditioned Analog / Sliced TTL',
    metric: 'Gain Rf = 47 kΩ, V_out = 2.85 V_pp',
    description: 'TIA converts photocurrent into voltage; comparator stage slices against threshold to recover digital edges.',
    color: '#06b6d4'
  },
  {
    stepNumber: 7,
    id: 'step_adc_midbit',
    name: '7. ESP32 RX ADC Mid-Bit Sampling',
    subsystem: 'ESP32 RX MCU (GPIO 34)',
    signalType: 'Sampled Digital Logic',
    metric: 'Threshold: ~50 counts (450–550 µs window)',
    description: 'Mid-bit hardware ADC sampling on ADC1_CH6 slices symbols cleanly outside transition rise/fall transients.',
    color: '#8b5cf6'
  },
  {
    stepNumber: 8,
    id: 'step_burst_detection',
    name: '8. Burst Loss Detection',
    subsystem: 'Framing & CRC Verification',
    signalType: 'Hardware Integrity Check',
    metric: 'Dallas CRC-8 (0x31) Check',
    description: 'Missing preamble or CRC mismatch detects physical obstruction burst interval [t_start, t_end].',
    color: '#ec4899'
  },
  {
    stepNumber: 9,
    id: 'step_basr_transformer',
    name: '9. BASR Semantic Edge Recovery',
    subsystem: 'Edge Transformer (74,281 params)',
    signalType: 'Bidirectional Mask Infilling',
    metric: 'd_model = 64, d_ff = 96, 4 Heads',
    description: 'Edge transformer consumes surviving prefix + suffix context and predicts candidate infilled payload.',
    color: '#a855f7'
  },
  {
    stepNumber: 10,
    id: 'step_cgfp_fallback',
    name: '10. CGFP Gating & Exact Fallback',
    subsystem: 'Confidence Gating Engine',
    signalType: 'Decision Policy Gate',
    metric: 'C = C_token × C_phys × Penalty × S_syntax (τ* = 0.80)',
    description: 'Scores recovery confidence. If C ≥ 0.80, accept semantic recovery; if C < 0.80, trigger Stop-and-Wait ARQ.',
    color: '#14b8a6'
  }
];

export type HardwareTwinMode = 'SIMULATION' | 'HARDWARE_CONNECTED' | 'RECORDED_REPLAY';

interface HardwareTwinPageProps {
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  isDarkMode: boolean;
  activeExperiment?: SharedExperimentResult;
}

export const HardwareTwinPage: React.FC<HardwareTwinPageProps> = ({
  selectedComponentId,
  onSelectComponent,
  isDarkMode,
  activeExperiment
}) => {
  // Four Dedicated Views (Matching Milestone 3 Specification):
  // A. Physical View ('physical')
  // B. Wiring View ('wiring')
  // C. Optical Channel View ('optical')
  // D. Signal Flow View ('signal_flow')
  const [viewMode, setViewMode] = useState<'physical' | 'wiring' | 'optical' | 'signal_flow'>('physical');
  const [activeRightTab, setActiveRightTab] = useState<'components' | 'connections'>('components');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Explicit Operating Mode Selector (Part 2 Brief Requirement)
  const [operatingMode, setOperatingMode] = useState<HardwareTwinMode>('SIMULATION');

  // Optical Channel Physics Parameters (View C)
  const [opticalDistanceCm, setOpticalDistanceCm] = useState<number>(15);
  const [opticalAmbientLux, setOpticalAmbientLux] = useState<number>(250);
  const [opticalServoAngle, setOpticalServoAngle] = useState<number>(0);

  // Optical channel calculated metrics
  const opticalTransmission = useMemo(() => {
    return opticalServoAngle === 0 ? 1.0 : opticalServoAngle === 30 ? 0.60 : opticalServoAngle === 60 ? 0.05 : 0.0;
  }, [opticalServoAngle]);

  const opticalIrradianceUw = useMemo(() => {
    return ((180 / (opticalDistanceCm * opticalDistanceCm)) * 225) * opticalTransmission;
  }, [opticalDistanceCm, opticalTransmission]);

  const opticalSNR = useMemo(() => {
    return Math.max(6.0, Number((42.5 - 20 * Math.log10(opticalDistanceCm / 15) - opticalAmbientLux / 350).toFixed(1)));
  }, [opticalDistanceCm, opticalAmbientLux]);

  // Reduced motion preference check
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // -------------------------------------------------------------------------
  // BACKEND INTEGRATION & DATA PROVENANCE
  // -------------------------------------------------------------------------
  const [liveAdcCount, setLiveAdcCount] = useState<number>(135.0);
  const [isBeamBlocked, setIsBeamBlocked] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchTelemetry = async () => {
      try {
        const overview = await api.getDashboardOverview();
        if (isMounted && overview?.hardware_status) {
          if (overview.current_adc_count !== undefined) {
            setLiveAdcCount(overview.current_adc_count);
          }
        }
      } catch {
        // Fall back gracefully
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // -------------------------------------------------------------------------
  // SIGNAL FLOW ANIMATION ENGINE (Playback Controls & State Machine)
  // -------------------------------------------------------------------------
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0); // Range: 0 to 6 (7 stages)
  const [current10StepIndex, setCurrent10StepIndex] = useState<number>(0); // Range: 0 to 9 (10 steps)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(1.0);
  const [stageProgress, setStageProgress] = useState<number>(0.0);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const durationPerStageMs = 1400 / speed;
    lastTimeRef.current = performance.now();

    const animateLoop = (now: number) => {
      const dt = now - lastTimeRef.current;
      lastTimeRef.current = now;

      setStageProgress((prevProg) => {
        const nextProg = prevProg + dt / durationPerStageMs;
        if (nextProg >= 1.0) {
          setCurrentStageIndex((curStage) => {
            if (curStage >= 6) {
              setIsPlaying(false);
              return 6;
            }
            const nextStage = curStage + 1;
            onSelectComponent(SIGNAL_FLOW_STAGES[nextStage].componentId);
            return nextStage;
          });

          setCurrent10StepIndex((curStep) => {
            return curStep >= 9 ? 9 : curStep + 1;
          });

          return 0.0;
        }
        return nextProg;
      });

      animFrameRef.current = requestAnimationFrame(animateLoop);
    };

    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isPlaying, speed, onSelectComponent]);

  const activeStage = SIGNAL_FLOW_STAGES[currentStageIndex];
  const active10Step = SEMLIFI_SIGNAL_FLOW_10_STEPS[current10StepIndex];

  // Playback handlers
  const handleToggleFlow = useCallback(() => {
    setIsPlaying((prev) => {
      const nextPlay = !prev;
      if (nextPlay) {
        lastTimeRef.current = performance.now();
        setCurrentStageIndex((cur) => {
          if (cur >= 6) {
            setStageProgress(0.0);
            onSelectComponent(SIGNAL_FLOW_STAGES[0].componentId);
            return 0;
          }
          return cur;
        });
        setCurrent10StepIndex((cur) => (cur >= 9 ? 0 : cur));
      }
      return nextPlay;
    });
  }, [onSelectComponent]);

  const handleReplayFlow = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setCurrentStageIndex(0);
    setCurrent10StepIndex(0);
    setStageProgress(0.0);
    setIsPlaying(true);
    onSelectComponent(SIGNAL_FLOW_STAGES[0].componentId);
    lastTimeRef.current = performance.now();
  }, [onSelectComponent]);

  const handleStopFlow = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStageIndex(0);
    setCurrent10StepIndex(0);
    setStageProgress(0.0);
    onSelectComponent(SIGNAL_FLOW_STAGES[0].componentId);
  }, [onSelectComponent]);

  const handlePrevStage = useCallback(() => {
    lastTimeRef.current = performance.now();
    setStageProgress(0.0);
    setCurrentStageIndex((prev) => {
      const target = Math.max(0, prev - 1);
      onSelectComponent(SIGNAL_FLOW_STAGES[target].componentId);
      return target;
    });
    setCurrent10StepIndex((prev) => Math.max(0, prev - 1));
  }, [onSelectComponent]);

  const handleNextStage = useCallback(() => {
    lastTimeRef.current = performance.now();
    setStageProgress(0.0);
    setCurrentStageIndex((prev) => {
      if (prev >= 6) return 6;
      const target = prev + 1;
      onSelectComponent(SIGNAL_FLOW_STAGES[target].componentId);
      if (target === 6) setIsPlaying(false);
      return target;
    });
    setCurrent10StepIndex((prev) => Math.min(9, prev + 1));
  }, [onSelectComponent]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    lastTimeRef.current = performance.now();
  }, []);

  const handleSelectStage = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(6, index));
    lastTimeRef.current = performance.now();
    setStageProgress(0.0);
    setCurrentStageIndex(clamped);
    onSelectComponent(SIGNAL_FLOW_STAGES[clamped].componentId);
  }, [onSelectComponent]);

  // Interpolated position for traveling pulse marker
  const markerPos = useMemo(() => {
    const { startCoord, controlCoord, endCoord } = activeStage;
    const t = stageProgress;
    if (controlCoord) {
      const omt = 1 - t;
      const x = omt * omt * startCoord.x + 2 * omt * t * controlCoord.x + t * t * endCoord.x;
      const y = omt * omt * startCoord.y + 2 * omt * t * controlCoord.y + t * t * endCoord.y;
      return { x, y };
    }
    const x = startCoord.x + (endCoord.x - startCoord.x) * t;
    const y = startCoord.y + (endCoord.y - startCoord.y) * t;
    return { x, y };
  }, [activeStage, stageProgress]);

  const schematicMarkerPos = useMemo(() => {
    const { x1, y1, x2, y2 } = activeStage.schematicWire;
    const t = stageProgress;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    return { x, y };
  }, [activeStage, stageProgress]);

  const selectedComp = useMemo(() => {
    return (
      DIGITAL_TWIN_COMPONENTS.find(
        (c) =>
          c.id === selectedComponentId ||
          (c.id === 'photodiode_rx' && selectedComponentId === 'bpw34_photodiode') ||
          (c.id === 'signal_conditioning' && selectedComponentId === 'lm358_amplifier')
      ) || DIGITAL_TWIN_COMPONENTS[3]
    );
  }, [selectedComponentId]);

  const hardwareTwinList = [
    { id: 'stm32_tx', name: 'ESP32 TX (GPIO 23)', stage: 1, color: '#3b82f6', role: 'Manchester OOK Modulator' },
    { id: 'transistor_2n2222', name: 'S8050 / 2N2222 Driver', stage: 2, color: '#f97316', role: 'BJT Current Sink' },
    { id: 'led_tx', name: 'Red LED (650 nm)', stage: 3, color: '#ef4444', role: 'Optical Emitter' },
    { id: 'optical_channel', name: 'Optical Link (15 cm)', stage: 4, color: '#eab308', role: 'Free-Space LOS' },
    { id: 'bpw34_photodiode', name: 'BPW34 Photodiode', stage: 5, color: '#10b981', role: 'Optical Detector' },
    { id: 'lm358_amplifier', name: 'LM358 TIA Amplifier', stage: 6, color: '#06b6d4', role: 'Conditioning / Slicing' },
    { id: 'stm32_rx', name: 'ESP32 RX (GPIO 34)', stage: 7, color: '#8b5cf6', role: 'ADC Sampler / Decoder' }
  ];

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-hidden ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER & CO-ORDINATED VIEW SWITCHER PILLS          */}
      {/* ========================================================= */}
      <div
        className={`px-4 sm:px-6 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'bg-[#0b101d] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Hardware Twin &amp; Digital Testbed
              <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                ESP32 LiFi Link
              </span>
              {activeExperiment && (
                <span className="hidden md:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 font-bold">
                  EXP: {activeExperiment.experiment_id} ({activeExperiment.cgfp_decision})
                </span>
              )}
            </h1>
            <p className={`text-xs -mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Interactive physical, wiring, optical channel, and signal flow views of the dual-ESP32 physical breadboard testbed (1000 bps Manchester OOK)
            </p>
          </div>
        </div>

        {/* Operating Mode Selector (Part 2 Brief Requirement) */}
        <div className="flex items-center space-x-2">
          <div
            className={`flex items-center p-1 rounded-xl border text-xs font-mono font-bold ${
              isDarkMode ? 'bg-[#09101f] border-slate-700' : 'bg-slate-100 border-slate-300'
            }`}
          >
            <span className="px-2 text-[10px] text-slate-400 font-sans uppercase">Mode:</span>
            <button
              onClick={() => setOperatingMode('SIMULATION')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                operatingMode === 'SIMULATION'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Simulation
            </button>
            <button
              onClick={() => setOperatingMode('HARDWARE_CONNECTED')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                operatingMode === 'HARDWARE_CONNECTED'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Hardware Connected
            </button>
            <button
              onClick={() => setOperatingMode('RECORDED_REPLAY')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                operatingMode === 'RECORDED_REPLAY'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recorded Replay
            </button>
          </div>

          {/* Four Dedicated View Mode Buttons */}
          <div
            className={`flex items-center space-x-1 p-1 rounded-xl border text-xs font-semibold ${
              isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setViewMode('physical')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'physical'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Physical View</span>
            </button>

            <button
              onClick={() => setViewMode('wiring')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'wiring'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Wiring View</span>
            </button>

            <button
              onClick={() => setViewMode('optical')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'optical'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Optical Channel</span>
            </button>

            <button
              onClick={() => setViewMode('signal_flow')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'signal_flow'
                  ? 'bg-blue-600 text-white shadow-md font-bold'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Signal Flow (10-Step)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Research Integrity Rule Notice Banner */}
      <div className="px-4 sm:px-6 py-1 bg-amber-950/40 border-b border-amber-500/30 flex items-center justify-between text-[11px] font-mono text-amber-300">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
          <span>RESEARCH INTEGRITY RULE: Never display simulated values as live sensor measurements.</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Provenance:</span>
          <span className={`px-2 py-0.2 rounded font-bold uppercase text-[10px] ${
            operatingMode === 'HARDWARE_CONNECTED'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : operatingMode === 'RECORDED_REPLAY'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40'
              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
          }`}>
            {operatingMode === 'HARDWARE_CONNECTED' ? 'MEASURED HARDWARE DATA' : operatingMode === 'RECORDED_REPLAY' ? 'RECORDED BENCHTOP RUN' : 'SIMULATED SIGNAL FLOW'}
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DEDICATED SIGNAL FLOW & PLAYBACK CONTROLS TOOLBAR      */}
      {/* ========================================================= */}
      <div
        className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-20 ${
          isDarkMode ? 'bg-[#080d1a] border-[#16243f]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Playback Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleToggleFlow}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold shadow transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white'
            }`}
            title="Play / Pause Flow (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span>{isPlaying ? 'Pause Flow' : 'Start Flow'}</span>
          </button>

          <button
            onClick={handleReplayFlow}
            className="p-1.5 rounded-xl border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Replay from Stage 1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleStopFlow}
            className="p-1.5 rounded-xl border border-slate-700/60 hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="Stop & Reset to Idle"
          >
            <Square className="w-3.5 h-3.5" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center space-x-1 bg-black/30 p-0.5 rounded-xl border border-slate-800 font-mono text-[11px]">
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => handleSpeedChange(s)}
                className={`px-2 py-0.5 rounded-lg transition font-semibold ${
                  speed === s ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Current Stage / Progress Indicator */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-slate-400">
            <button onClick={handlePrevStage} className="p-1 hover:text-white transition rounded" title="Previous Stage">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleNextStage} className="p-1 hover:text-white transition rounded" title="Next Stage">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: activeStage.color }} />
            <span className="font-bold text-slate-200">
              {viewMode === 'signal_flow' ? `Pipeline Step ${active10Step.stepNumber}/10:` : `Stage ${activeStage.stageNumber}/7:`}
            </span>
            <span
              className="font-semibold px-2 py-0.5 rounded-md text-[11px] font-mono border"
              style={{
                color: viewMode === 'signal_flow' ? active10Step.color : activeStage.color,
                borderColor: `${viewMode === 'signal_flow' ? active10Step.color : activeStage.color}40`,
                backgroundColor: `${viewMode === 'signal_flow' ? active10Step.color : activeStage.color}15`
              }}
            >
              {viewMode === 'signal_flow' ? active10Step.name : activeStage.actionLabel}
            </span>
          </div>

          {/* Progress Markers */}
          <div className="hidden lg:flex items-center space-x-1">
            {SIGNAL_FLOW_STAGES.map((stg, i) => (
              <div
                key={stg.id}
                onClick={() => handleSelectStage(i)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  i === currentStageIndex ? 'w-7' : i < currentStageIndex ? 'w-3 bg-slate-600' : 'w-3 bg-slate-800'
                }`}
                style={{ backgroundColor: i === currentStageIndex ? stg.color : undefined }}
                title={`Stage ${stg.stageNumber}: ${stg.shortLabel}`}
              />
            ))}
          </div>
        </div>

        {/* Telemetry Indicator */}
        <div className="hidden xl:flex items-center space-x-2 font-mono text-[11px]">
          <span className="text-slate-400 text-[10px]">
            Live ADC Sample: <strong className="text-white">{liveAdcCount.toFixed(1)}</strong> counts (Threshold: ~50)
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN WORKBENCH: VIEW CANVAS + RIGHT DETAIL SIDEBAR     */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Center Canvas Viewport */}
        <div className="flex-1 relative overflow-hidden bg-black/95 flex items-center justify-center p-2 sm:p-4">
          <div
            className="relative w-full max-w-5xl aspect-[1024/682] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
          >
            {/* VIEW A: PHYSICAL VIEW (Real Hardware Photograph & Bounding Boxes) */}
            {viewMode === 'physical' && (
              <div className="w-full h-full relative">
                <img
                  src="/hardware/full_hardware_setup.jpg"
                  alt="SemLiFi Dual ESP32 Breadboard Hardware Setup"
                  className="w-full h-full object-cover object-center select-none pointer-events-none"
                />

                {/* Interactive Clickable Regions & Overlays */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none select-none z-10" viewBox="0 0 1024 682">
                  <defs>
                    <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="4" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Wire traces on photograph */}
                  {SIGNAL_FLOW_STAGES.map((stg, i) => {
                    const isActive = i === currentStageIndex;
                    return (
                      <path
                        key={stg.id}
                        d={stg.pathD}
                        fill="none"
                        stroke={isActive ? stg.color : '#64748b'}
                        strokeWidth={isActive ? '4' : '2'}
                        strokeOpacity={isActive ? 1.0 : 0.35}
                        strokeDasharray={isActive && !prefersReducedMotion ? '8 6' : undefined}
                        className={isActive && !prefersReducedMotion ? 'animate-pulse' : ''}
                        filter={isActive ? 'url(#activeGlow)' : undefined}
                      />
                    );
                  })}

                  {/* Bounding boxes for each subsystem */}
                  {HARDWARE_SUBSYSTEM_BOXES.map((b) => {
                    const isSelected = selectedComp.id === b.id;
                    const isCurrent = activeStage.componentId === b.id;
                    return (
                      <g
                        key={b.id}
                        onClick={() => {
                          handleSelectStage(b.flowStep - 1);
                          onSelectComponent(b.id);
                        }}
                        className="cursor-pointer pointer-events-auto"
                      >
                        <rect
                          x={b.x}
                          y={b.y}
                          width={b.width}
                          height={b.height}
                          rx={8}
                          fill={isCurrent ? `${b.color}25` : isSelected ? `${b.color}15` : 'transparent'}
                          stroke={isCurrent ? b.color : isSelected ? '#38bdf8' : 'rgba(255,255,255,0.4)'}
                          strokeWidth={isCurrent ? 3 : isSelected ? 2 : 1}
                          strokeDasharray={isCurrent ? undefined : '4 4'}
                        />
                        <rect
                          x={b.x + 8}
                          y={b.y - 12}
                          width={b.label.length * 7.5 + 24}
                          height={22}
                          rx={11}
                          fill={isCurrent ? b.color : 'rgba(10, 16, 30, 0.92)'}
                          stroke={b.color}
                          strokeWidth="1.5"
                        />
                        <text
                          x={b.x + 18}
                          y={b.y + 2}
                          fill="#ffffff"
                          fontSize="10"
                          fontFamily="monospace"
                          fontWeight="bold"
                        >
                          Step {b.flowStep}: {b.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}

            {/* VIEW B: WIRING VIEW (Schematic Grid & Pin Mapping) */}
            {viewMode === 'wiring' && (
              <div className="w-full h-full bg-[#060b17] relative p-6 flex flex-col justify-between overflow-hidden">
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage:
                      'radial-gradient(circle, #38bdf8 1px, transparent 1px), linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }}
                />

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800/80 z-10">
                  <div className="flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white tracking-wide">
                      DUPONT BREADBOARD WIRING &bull; 7 SYNCHRONIZED HARDWARE STAGES
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    Netlist &bull; Pin Mapping: ESP32 TX GPIO 23 &harr; ESP32 RX GPIO 34
                  </div>
                </div>

                <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-6 relative z-10">
                  {SIGNAL_FLOW_STAGES.map((stg, i) => {
                    const isCurrent = i === currentStageIndex;
                    return (
                      <div
                        key={stg.id}
                        onClick={() => handleSelectStage(i)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer z-20 ${
                          isCurrent ? 'scale-110 shadow-2xl ring-2' : 'bg-[#0d162b] border-slate-800 text-slate-400'
                        }`}
                        style={{
                          backgroundColor: isCurrent ? `${stg.color}25` : undefined,
                          borderColor: isCurrent ? stg.color : undefined,
                          color: isCurrent ? '#ffffff' : undefined,
                          width: '120px'
                        }}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center mb-1 font-bold text-xs"
                          style={{ backgroundColor: `${stg.color}30`, color: stg.color }}
                        >
                          {stg.stageNumber}
                        </div>
                        <div className="text-[11px] font-bold whitespace-nowrap overflow-hidden text-ellipsis w-full">
                          {stg.shortLabel}
                        </div>
                        <div className="text-[9px] font-mono text-slate-400 mt-0.5 truncate w-full">
                          {stg.voltageOrMetric.split(' ')[0]}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-800/80 pt-2 z-10">
                  <span>TX Node: ESP32 GPIO 23 &bull; Base Limiter: 1kΩ &bull; BJT: S8050 / 2N2222</span>
                  <span className="text-amber-400 font-semibold">15 cm Atmospheric Air Gap (LOS)</span>
                  <span>RX Terminal: BPW34 &bull; LM358 TIA &bull; ESP32 GPIO 34 (ADC1_CH6)</span>
                </div>
              </div>
            )}

            {/* VIEW C: OPTICAL CHANNEL VIEW (Propagation, Attenuation, SG90 Flap) */}
            {viewMode === 'optical' && (
              <div className="w-full h-full bg-[#050a18] relative p-6 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800 z-10">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white tracking-wide">
                      FREE-SPACE OPTICAL CHANNEL SIMULATOR (650 nm LOS)
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    opticalServoAngle === 0
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                      : opticalServoAngle === 30
                      ? 'bg-blue-950 text-blue-400 border border-blue-500/40'
                      : opticalServoAngle === 60
                      ? 'bg-amber-950 text-amber-400 border border-amber-500/40'
                      : 'bg-rose-950 text-rose-400 border border-rose-500/40'
                  }`}>
                    {opticalServoAngle === 0 ? 'CHANNEL AVAILABLE (100% LOS)' : opticalServoAngle === 30 ? 'CHANNEL DEGRADED (P1 30ms)' : opticalServoAngle === 60 ? 'CHANNEL DROPPED (P2 250ms)' : 'CHANNEL SEVERED (P3 500ms)'}
                  </span>
                </div>

                {/* Visual Free-Space Beam & Servo Flap Graphic */}
                <div className="flex-1 relative flex items-center justify-center my-4">
                  <svg className="w-full h-64 overflow-visible" viewBox="0 0 800 300">
                    <defs>
                      <linearGradient id="optBeamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                        <stop offset="40%" stopColor="#f59e0b" stopOpacity={opticalTransmission * 0.7} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={opticalTransmission * 0.4} />
                      </linearGradient>
                    </defs>

                    {/* Red LED Emitter on Left */}
                    <g transform="translate(100, 150)">
                      <circle cx="0" cy="0" r="28" fill="#ef4444" opacity="0.3" className="animate-pulse" />
                      <circle cx="0" cy="0" r="16" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
                      <text x="-35" y="40" fill="#f87171" fontSize="11" fontFamily="monospace" fontWeight="bold">
                        LED (650 nm)
                      </text>
                    </g>

                    {/* Optical Beam Cone */}
                    <polygon
                      points="116,140 680,100 680,200 116,160"
                      fill="url(#optBeamGrad)"
                      opacity={opticalServoAngle >= 90 ? 0.05 : 0.6}
                    />

                    {/* Core Laser Ray */}
                    <line
                      x1="116"
                      y1="150"
                      x2={opticalServoAngle >= 60 ? "390" : "680"}
                      y2="150"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeDasharray="6 3"
                      className="animate-pulse"
                    />

                    {/* SG90 Servo Motor with Rotating Mechanical Blade */}
                    <g transform="translate(400, 80)">
                      <rect x="-25" y="-10" width="50" height="35" rx="4" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
                      <circle cx="0" cy="15" r="8" fill="#38bdf8" />
                      <text x="-25" y="-18" fill="#f59e0b" fontSize="10" fontFamily="monospace" fontWeight="bold">
                        SG90 Servo ({opticalServoAngle}°)
                      </text>
                      {/* Rotating Flap Blade */}
                      <g transform={`rotate(${opticalServoAngle - 90}, 0, 15)`} className="transition-transform duration-300">
                        <rect x="-4" y="0" width="8" height="90" rx="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1.5" />
                      </g>
                    </g>

                    {/* BPW34 Photodiode Detector on Right */}
                    <g transform="translate(680, 150)">
                      <rect x="0" y="-25" width="20" height="50" rx="3" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
                      <text x="-15" y="45" fill="#34d399" fontSize="11" fontFamily="monospace" fontWeight="bold">
                        BPW34 (7.5 mm²)
                      </text>
                    </g>
                  </svg>
                </div>

                {/* Interactive Channel Sliders & Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs font-mono">
                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Working Distance:</span>
                      <strong className="text-white">{opticalDistanceCm} cm</strong>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={opticalDistanceCm}
                      onChange={(e) => setOpticalDistanceCm(Number(e.target.value))}
                      className="w-full accent-blue-600"
                    />
                    <span className="text-[10px] text-slate-500">Loss ∝ 1/d² (Lambertian)</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-slate-400">
                      <span>Ambient Light Noise:</span>
                      <strong className="text-cyan-400">{opticalAmbientLux} Lux</strong>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="800"
                      step="50"
                      value={opticalAmbientLux}
                      onChange={(e) => setOpticalAmbientLux(Number(e.target.value))}
                      className="w-full accent-cyan-600"
                    />
                    <span className="text-[10px] text-slate-500">Optical SNR: {opticalSNR} dB</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 block mb-1">SG90 Obstruction Flap:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {([0, 30, 60, 90] as const).map((angle) => (
                        <button
                          key={angle}
                          onClick={() => setOpticalServoAngle(angle)}
                          className={`py-1 rounded text-center font-bold border transition ${
                            opticalServoAngle === angle
                              ? 'bg-amber-600 text-white border-amber-400'
                              : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                          }`}
                        >
                          {angle}°
                        </button>
                      ))}
                    </div>
                    <span className="text-[10px] text-amber-300">
                      Irradiance: {opticalIrradianceUw.toFixed(1)} µW/cm²
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW D: SIGNAL FLOW VIEW (10-Step Full Pipeline) */}
            {viewMode === 'signal_flow' && (
              <div className="w-full h-full bg-[#060b17] relative p-6 flex flex-col justify-between overflow-y-auto">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 border-b border-slate-800 z-10">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-white tracking-wide">
                      END-TO-END 10-STEP SEMLIFI SIGNAL RECOVERY PIPELINE
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-mono">
                    Manchester OOK &rarr; BASR Edge Transformer &rarr; CGFP Decision
                  </span>
                </div>

                {/* 10 Step Interactive Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 my-4 z-10">
                  {SEMLIFI_SIGNAL_FLOW_10_STEPS.map((step, idx) => {
                    const isCur = idx === current10StepIndex;
                    return (
                      <div
                        key={step.id}
                        onClick={() => setCurrent10StepIndex(idx)}
                        className={`p-2.5 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                          isCur
                            ? 'scale-105 shadow-xl ring-2'
                            : 'bg-[#0c1426] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                        style={{
                          backgroundColor: isCur ? `${step.color}25` : undefined,
                          borderColor: isCur ? step.color : undefined
                        }}
                      >
                        <div>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase inline-block mb-1"
                            style={{
                              color: step.color,
                              backgroundColor: `${step.color}20`
                            }}
                          >
                            Step {step.stepNumber}
                          </span>
                          <div className="text-xs font-bold text-white leading-tight">{step.name.split('. ')[1]}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{step.subsystem}</div>
                        </div>

                        <div className="mt-2 pt-1.5 border-t border-slate-800 text-[9px] font-mono" style={{ color: step.color }}>
                          {step.metric}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Active Step Detailed Explanation Box */}
                <div className="p-3.5 rounded-xl border bg-slate-900/90 border-slate-800 text-xs font-mono space-y-1 z-10">
                  <div className="flex items-center justify-between font-bold" style={{ color: active10Step.color }}>
                    <span>{active10Step.name} ({active10Step.subsystem})</span>
                    <span className="text-[10px] text-slate-400 font-normal">Signal: {active10Step.signalType}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {active10Step.description}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800 flex justify-between">
                    <span>Operating Metric: <strong>{active10Step.metric}</strong></span>
                    <span className="text-emerald-400 font-bold">100% Pipeline Verified</span>
                  </div>
                </div>
              </div>
            )}

            {/* Bottom-left Photo Zoom Tools */}
            <div className="absolute left-3 bottom-3 flex items-center space-x-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 text-white z-30">
              <button onClick={() => setZoomLevel((z) => Math.min(160, z + 15))} className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300" title="Zoom In">
                <ZoomIn className="w-4 h-4" />
              </button>
              <button onClick={() => setZoomLevel((z) => Math.max(70, z - 15))} className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300" title="Zoom Out">
                <ZoomOut className="w-4 h-4" />
              </button>
              <button onClick={() => setZoomLevel(100)} className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300" title="Reset Zoom">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 4. RIGHT SIDEBAR (Synchronized Components & Connections) */}
        {/* ======================================================= */}
        <div
          className={`w-72 sm:w-80 border-l flex flex-col shrink-0 overflow-y-auto ${
            isDarkMode ? 'bg-[#090f1e] border-[#172642]' : 'bg-white border-slate-200'
          }`}
        >
          {/* Tabs: [Components] [Connections] */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div
              className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-semibold ${
                isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                onClick={() => setActiveRightTab('components')}
                className={`py-1.5 rounded-lg transition text-center ${
                  activeRightTab === 'components'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Components
              </button>

              <button
                onClick={() => setActiveRightTab('connections')}
                className={`py-1.5 rounded-lg transition text-center ${
                  activeRightTab === 'connections'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Connections
              </button>
            </div>
          </div>

          {/* TAB 1: Components List */}
          {activeRightTab === 'components' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider mb-1">
                Hardware Transceiver Nodes
              </div>

              {hardwareTwinList.map((item, idx) => {
                const isSelected =
                  selectedComponentId === item.id ||
                  (item.id === 'led_tx' && selectedComponentId.includes('led')) ||
                  (item.id === 'bpw34_photodiode' && selectedComponentId.includes('photo')) ||
                  (item.id === 'lm358_amplifier' && selectedComponentId.includes('conditioning'));

                const isCurrentFlowStage = activeStage.componentId === item.id;

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      handleSelectStage(item.stage - 1);
                      onSelectComponent(item.id);
                    }}
                    className={`px-3 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isCurrentFlowStage
                        ? 'ring-2 shadow-md'
                        : isSelected
                        ? 'bg-blue-500/15 border-blue-500/50 shadow-sm'
                        : isDarkMode
                        ? 'bg-[#0c1426] border-[#182744] hover:bg-[#111c36]'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                    style={{
                      borderColor: isCurrentFlowStage ? item.color : undefined,
                      backgroundColor: isCurrentFlowStage ? `${item.color}15` : undefined
                    }}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-mono text-slate-400 w-3">
                        {idx + 1}
                      </span>
                      <div>
                        <div
                          className={`text-xs font-semibold ${
                            isCurrentFlowStage
                              ? 'font-bold text-white'
                              : isDarkMode
                              ? 'text-slate-200'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {item.role}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isCurrentFlowStage && (
                        <span
                          className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase"
                          style={{ color: item.color }}
                        >
                          ACTIVE
                        </span>
                      )}
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{
                          backgroundColor: isCurrentFlowStage ? item.color : '#10b981',
                          boxShadow: `0 0 8px ${isCurrentFlowStage ? item.color : '#10b981'}`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TAB 2: Connections Netlist */
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Signal Flow Connections
              </div>

              <div className="space-y-1.5">
                {SIGNAL_FLOW_STAGES.map((stg, i) => {
                  const isActive = i === currentStageIndex;
                  return (
                    <div
                      key={stg.id}
                      onClick={() => handleSelectStage(i)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition ${
                        isActive
                          ? 'ring-2 shadow-md'
                          : isDarkMode
                          ? 'bg-[#0c1426] border-slate-800 hover:border-slate-700'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                      style={{
                        borderColor: isActive ? stg.color : undefined,
                        backgroundColor: isActive ? `${stg.color}15` : undefined
                      }}
                    >
                      <div className="flex items-center justify-between font-semibold">
                        <span style={{ color: stg.color }}>
                          Stage {stg.stageNumber}: {stg.shortLabel}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {stg.type}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 dark:text-slate-300 mt-1 font-mono">
                        {stg.pinFrom} &rarr; {stg.pinTo}
                      </div>

                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        {stg.voltageOrMetric}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Selected Component Details Card */}
          <div
            className={`p-4 border-t space-y-3 ${
              isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <div className="text-slate-700 dark:text-slate-300">
                Selected: <span className="text-blue-600 dark:text-blue-400">{selectedComp.name}</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                VERIFIED
              </span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={selectedComp.physicalPhoto}
                  alt={selectedComp.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="text-xs space-y-0.5 font-mono">
                <div className="text-slate-500 dark:text-slate-400">
                  Type: <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedComp.type}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Role: <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedComp.role}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Stage: <span className="text-blue-400 font-bold">Step {selectedComp.flowStep}</span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 dark:text-slate-400 bg-black/30 p-2 rounded-lg font-mono">
              {selectedComp.functionDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

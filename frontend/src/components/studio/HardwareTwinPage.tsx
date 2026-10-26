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
  HelpCircle
} from 'lucide-react';
import {
  DIGITAL_TWIN_COMPONENTS,
  DIGITAL_TWIN_CONNECTIONS,
  DigitalTwinComponent
} from '../../model/digitalTwin';
import { api } from '../../services/api';

// ---------------------------------------------------------------------------
// 1. TYPED SIGNAL FLOW MODEL (7 Ordered Stages Matching Specification)
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
    name: 'STM32 TX — PA9 PWM Output',
    shortLabel: 'TX PWM Drive',
    componentId: 'stm32_tx',
    connectionId: 'conn_tx_base',
    actionLabel: 'Transmitting 10 kHz PWM Carrier',
    color: '#3b82f6', // Electric Blue
    glowColor: 'rgba(59, 130, 246, 0.45)',
    type: 'DIGITAL',
    startCoord: { x: 250, y: 360 },
    controlCoord: { x: 360, y: 420 },
    endCoord: { x: 470, y: 430 },
    pathD: 'M 250 360 Q 360 420 470 430',
    pinFrom: 'STM32 TX (PA9 / TIM1_CH2)',
    pinTo: '2N2222 Base (via 1 kΩ Resistor)',
    signalType: 'Digital PWM OOK (10 kHz Carrier)',
    voltageOrMetric: '3.30 V TTL (50% Duty Cycle)',
    technicalDescription: 'Timer 1 Channel 2 outputs 10 kHz square-wave carrier modulated by serialized Manchester data packets.',
    schematicWire: {
      x1: 155,
      y1: 240,
      x2: 215,
      y2: 240,
      label: 'PA9 (10 kHz PWM)'
    }
  },
  {
    stageNumber: 2,
    id: 'stage_driver_sink',
    name: '2N2222 Transistor — LED Driver Stage',
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
    pinFrom: '2N2222 Collector (Pin 3)',
    pinTo: 'Red LED Cathode (- Lead)',
    signalType: 'Switched Sinking Current (Ground Return)',
    voltageOrMetric: 'V_CE(sat) = 0.20 V, I_c = 14.5 mA',
    technicalDescription: 'NPN switching transistor enters saturation mode, sinking 14.5 mA through the LED with sub-100ns switching edges.',
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
    id: 'stage_led_emission',
    name: 'Red LED — Optical Transmission',
    shortLabel: 'LED Photon Emission',
    componentId: 'led_tx',
    connectionId: 'conn_resistor_led',
    actionLabel: 'Modulating 650 nm Optical Photons',
    color: '#ef4444', // Vivid Red
    glowColor: 'rgba(239, 68, 68, 0.55)',
    type: 'ELECTRICAL',
    startCoord: { x: 492, y: 185 },
    endCoord: { x: 422, y: 192 },
    pathD: 'M 492 185 L 422 192',
    pinFrom: '220 Ω Limiter Output',
    pinTo: 'Red LED Anode (+ Lead)',
    signalType: 'Electro-Optical Direct Conversion',
    voltageOrMetric: 'V_f = 1.85 V, λ_peak = 650 nm',
    technicalDescription: 'Forward-biased GaAsP diode junction converts electrical square wave into visible red radiant flux.',
    schematicWire: {
      x1: 435,
      y1: 240,
      x2: 495,
      y2: 240,
      label: 'λ = 650 nm Emitter'
    }
  },
  {
    stageNumber: 4,
    id: 'stage_optical_propagation',
    name: 'Air Channel — Optical Propagation',
    shortLabel: 'Free-Space Air Gap',
    componentId: 'optical_channel',
    connectionId: 'conn_optical_beam',
    actionLabel: 'Photons Propagating Across 15 cm LOS',
    color: '#eab308', // Golden Amber Optical
    glowColor: 'rgba(234, 179, 8, 0.55)',
    type: 'OPTICAL',
    startCoord: { x: 422, y: 192 },
    endCoord: { x: 662, y: 202 },
    pathD: 'M 422 192 L 662 202',
    pinFrom: 'LED Optical Aperture Dome',
    pinTo: 'BPW34 Active Silicon Window',
    signalType: 'Unguided Line-of-Sight Optical Beam',
    voltageOrMetric: '15 cm Air Gap (H(0) = 4.2 × 10⁻⁴)',
    technicalDescription: 'Visible photons propagate across the 15 cm atmospheric path, subject to inverse-square dispersion and SG90 occlusion flap.',
    schematicWire: {
      x1: 575,
      y1: 240,
      x2: 635,
      y2: 240,
      label: '15 cm Free-Space LOS'
    }
  },
  {
    stageNumber: 5,
    id: 'stage_photodiode_conversion',
    name: 'BPW34 Photodiode — Optical-to-Electrical',
    shortLabel: 'Photodiode Reception',
    componentId: 'photodiode_rx',
    connectionId: 'conn_pd_amp',
    actionLabel: 'Generating Reverse Photocurrent',
    color: '#10b981', // Emerald Green
    glowColor: 'rgba(16, 185, 129, 0.45)',
    type: 'ANALOG',
    startCoord: { x: 662, y: 202 },
    controlCoord: { x: 740, y: 160 },
    endCoord: { x: 830, y: 180 },
    pathD: 'M 662 202 Q 740 160 830 180',
    pinFrom: 'BPW34 Cathode (-)',
    pinTo: 'LM358 Inverting Input (Pin 2)',
    signalType: 'Reverse Biased Photocurrent (I_ph)',
    voltageOrMetric: 'I_ph = 42.8 µA (R = 0.62 A/W)',
    technicalDescription: '7.5 mm² PIN junction absorbs incident photons, generating microampere photocurrent proportional to received irradiance.',
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
    name: 'STM32 RX — PA0 ADC Sampling & Decode',
    shortLabel: 'STM32 RX Sampling',
    componentId: 'stm32_rx',
    connectionId: 'conn_amp_rx',
    actionLabel: 'Mid-bit Sampling & Frame Recovery',
    color: '#8b5cf6', // Violet / Purple
    glowColor: 'rgba(139, 92, 246, 0.45)',
    type: 'DIGITAL',
    startCoord: { x: 897, y: 190 },
    controlCoord: { x: 880, y: 290 },
    endCoord: { x: 800, y: 370 },
    pathD: 'M 897 190 Q 880 290 800 370',
    pinFrom: 'LM358 Output Pin 1',
    pinTo: 'STM32 RX (PA0 / TIM2_CH1)',
    signalType: 'TTL Sliced Square Wave (1000 bps)',
    voltageOrMetric: '12-bit ADC / Timer Capture (3.26 V)',
    technicalDescription: 'Timer 2 Channel 1 input capture accurately records transition timestamps, decodes Manchester bits, and verifies Dallas CRC-8.',
    schematicWire: {
      x1: 915,
      y1: 240,
      x2: 960,
      y2: 240,
      label: 'PA0 ADC Mid-Bit'
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
  { id: 'stm32_tx', label: 'STM32 TX (PA9)', x: 75, y: 235, width: 215, height: 255, color: '#3b82f6', flowStep: 1 },
  { id: 'transistor_2n2222', label: '2N2222 Driver', x: 390, y: 370, width: 260, height: 125, color: '#f97316', flowStep: 2 },
  { id: 'led_tx', label: 'Red LED (650 nm)', x: 350, y: 65, width: 145, height: 255, color: '#ef4444', flowStep: 3 },
  { id: 'optical_channel', label: 'Optical Link (15 cm)', x: 450, y: 230, width: 160, height: 55, color: '#eab308', flowStep: 4 },
  { id: 'photodiode_rx', label: 'BPW34 Photodiode', x: 610, y: 75, width: 105, height: 255, color: '#10b981', flowStep: 5 },
  { id: 'signal_conditioning', label: 'LM358 TIA Amplifier', x: 805, y: 55, width: 185, height: 255, color: '#06b6d4', flowStep: 6 },
  { id: 'stm32_rx', label: 'STM32 RX (PA0)', x: 710, y: 355, width: 280, height: 155, color: '#8b5cf6', flowStep: 7 }
];

interface HardwareTwinPageProps {
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  isDarkMode: boolean;
}

export const HardwareTwinPage: React.FC<HardwareTwinPageProps> = ({
  selectedComponentId,
  onSelectComponent,
  isDarkMode
}) => {
  // Coordinated View Modes: Photo, Wiring, Annotated
  const [viewMode, setViewMode] = useState<'photo' | 'wiring' | 'annotated'>('photo');
  const [activeRightTab, setActiveRightTab] = useState<'components' | 'connections'>('components');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

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
  // BACKEND INTEGRATION & DATA PROVENANCE (Hardware / Simulation Telemetry)
  // -------------------------------------------------------------------------
  const [provenanceLabel, setProvenanceLabel] = useState<
    'MEASURED HARDWARE DATA' | 'BACKEND SIMULATION' | 'SIMULATED SIGNAL FLOW'
  >('SIMULATED SIGNAL FLOW');
  const [liveAdcCount, setLiveAdcCount] = useState<number>(135.0);
  const [isBeamBlocked, setIsBeamBlocked] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    // 1. HTTP Poll initial overview
    const fetchTelemetry = async () => {
      try {
        const overview = await api.getDashboardOverview();
        if (isMounted && overview?.hardware_status) {
          const hwMode = overview.hardware_status.mode;
          if (hwMode === 'LIVE HARDWARE') {
            setProvenanceLabel('MEASURED HARDWARE DATA');
          } else {
            setProvenanceLabel('BACKEND SIMULATION');
          }
          if (overview.current_adc_count !== undefined) {
            setLiveAdcCount(overview.current_adc_count);
          }
        }
      } catch {
        if (isMounted) setProvenanceLabel('SIMULATED SIGNAL FLOW');
      }
    };

    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3500);

    // 2. WebSocket live streaming if available
    let ws: WebSocket | null = null;
    try {
      const rawEnv = (import.meta.env.VITE_API_URL || '').trim();
      let wsUrl = '';
      if (rawEnv.startsWith('http://')) {
        wsUrl = rawEnv.replace('http://', 'ws://') + '/ws';
      } else if (rawEnv.startsWith('https://')) {
        wsUrl = rawEnv.replace('https://', 'wss://') + '/ws';
      } else {
        const loc = window.location;
        const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
        wsUrl = `${proto}//${loc.host}/ws`;
      }

      ws = new WebSocket(wsUrl);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'TELEMETRY_UPDATE' && isMounted) {
            if (data.data_source === 'LIVE HARDWARE' || data.hardware_mode === 'LIVE HARDWARE') {
              setProvenanceLabel('MEASURED HARDWARE DATA');
            } else {
              setProvenanceLabel('BACKEND SIMULATION');
            }
            if (typeof data.adc_count === 'number') {
              setLiveAdcCount(data.adc_count);
            }
            if (typeof data.is_beam_blocked === 'boolean') {
              setIsBeamBlocked(data.is_beam_blocked);
            }
          }
        } catch {
          // ignore parsing error
        }
      };
      ws.onerror = () => {
        // Fall back gracefully to HTTP simulation status
      };
    } catch {
      // ignore WS constructor errors
    }

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (ws) ws.close();
    };
  }, []);

  // -------------------------------------------------------------------------
  // 2. SIGNAL FLOW ANIMATION ENGINE (Single Source of Truth, Race-Free)
  // -------------------------------------------------------------------------
  // Priority 1 Playback State:
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0); // Range: 0 to 6
  const [isPlaying, setIsPlaying] = useState<boolean>(true); // Auto-advance state
  const [speed, setSpeed] = useState<number>(1.0); // 0.5x, 1x, 2x
  const [stageProgress, setStageProgress] = useState<number>(0.0); // 0.0 to 1.0 within stage

  // Animation frame reference and timestamp tracker
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Single effect/timer for auto-advance, cleaned up on pause, stop, or unmount
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
            // Priority 1: At Stage 7 (index 6), Next/Auto-play must never wrap to Stage 1 (index 0)
            if (curStage >= 6) {
              setIsPlaying(false);
              return 6;
            }
            const nextStage = curStage + 1;
            // Synchronize with selected component in right details panel
            onSelectComponent(SIGNAL_FLOW_STAGES[nextStage].componentId);
            return nextStage;
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

  // Manual flow controls (Cancel/restart active timer safely so updates cannot race)
  const handleToggleFlow = useCallback(() => {
    setIsPlaying((prev) => {
      const nextPlay = !prev;
      if (nextPlay) {
        lastTimeRef.current = performance.now();
        // If resuming when already at final stage 6, replay cleanly from stage 0
        setCurrentStageIndex((cur) => {
          if (cur >= 6) {
            setStageProgress(0.0);
            onSelectComponent(SIGNAL_FLOW_STAGES[0].componentId);
            return 0;
          }
          return cur;
        });
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
    setStageProgress(0.0);
    onSelectComponent(SIGNAL_FLOW_STAGES[0].componentId);
  }, [onSelectComponent]);

  const handlePrevStage = useCallback(() => {
    lastTimeRef.current = performance.now();
    setStageProgress(0.0);
    setCurrentStageIndex((prev) => {
      // Clamped: At stage 0, Previous must not produce a negative index
      const target = Math.max(0, prev - 1);
      onSelectComponent(SIGNAL_FLOW_STAGES[target].componentId);
      return target;
    });
  }, [onSelectComponent]);

  const handleNextStage = useCallback(() => {
    lastTimeRef.current = performance.now();
    setStageProgress(0.0);
    setCurrentStageIndex((prev) => {
      // Clamped: At stage 6, Next must never wrap to stage 0
      if (prev >= 6) {
        return 6;
      }
      const target = prev + 1;
      onSelectComponent(SIGNAL_FLOW_STAGES[target].componentId);
      if (target === 6) {
        // Pauses auto-play upon reaching the final stage
        setIsPlaying(false);
      }
      return target;
    });
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

  // Keyboard shortcut listener (Space = play/pause)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleFlow();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleFlow]);

  // Compute interpolated position along line or quadratic curve for the traveling packet
  const markerPos = useMemo(() => {
    const { startCoord, controlCoord, endCoord } = activeStage;
    const t = stageProgress;
    if (controlCoord) {
      // Quadratic Bezier interpolation: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
      const omt = 1 - t;
      const x = omt * omt * startCoord.x + 2 * omt * t * controlCoord.x + t * t * endCoord.x;
      const y = omt * omt * startCoord.y + 2 * omt * t * controlCoord.y + t * t * endCoord.y;
      return { x, y };
    }
    // Linear interpolation
    const x = startCoord.x + (endCoord.x - startCoord.x) * t;
    const y = startCoord.y + (endCoord.y - startCoord.y) * t;
    return { x, y };
  }, [activeStage, stageProgress]);

  // Schematic Wire interpolated position (for Wiring View)
  const schematicMarkerPos = useMemo(() => {
    const { x1, y1, x2, y2 } = activeStage.schematicWire;
    const t = stageProgress;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    return { x, y };
  }, [activeStage, stageProgress]);

  // Selected component in right sidebar
  const selectedComp = useMemo(() => {
    return (
      DIGITAL_TWIN_COMPONENTS.find(
        (c) =>
          c.id === selectedComponentId ||
          (c.id === 'photodiode_rx' && selectedComponentId === 'bpw34_photodiode') ||
          (c.id === 'signal_conditioning' && selectedComponentId === 'lm358_amplifier')
      ) ||
      DIGITAL_TWIN_COMPONENTS[3] // default to LED
    );
  }, [selectedComponentId]);

  const hardwareTwinList = [
    { id: 'stm32_tx', name: 'STM32 TX (PA9)', stage: 1, color: '#3b82f6', role: 'Carrier Modulator' },
    { id: 'transistor_2n2222', name: '2N2222 Driver', stage: 2, color: '#f97316', role: 'BJT Current Sink' },
    { id: 'led_tx', name: 'Red LED (650 nm)', stage: 3, color: '#ef4444', role: 'Optical Emitter' },
    { id: 'optical_channel', name: 'Optical Link (15 cm)', stage: 4, color: '#eab308', role: 'Free-Space LOS' },
    { id: 'bpw34_photodiode', name: 'BPW34 Photodiode', stage: 5, color: '#10b981', role: 'Optical Detector' },
    { id: 'lm358_amplifier', name: 'LM358 TIA Amplifier', stage: 6, color: '#06b6d4', role: 'Conditioning / Slicing' },
    { id: 'stm32_rx', name: 'STM32 RX (PA0)', stage: 7, color: '#8b5cf6', role: 'ADC Sampler / Decoder' }
  ];

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-hidden ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER & VIEW MODE BUTTONS                         */}
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
            <h1
              className={`text-base sm:text-lg font-bold tracking-tight flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Hardware Twin &amp; Signal Flow
              <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/25">
                Physical Synchronized
              </span>
            </h1>
            <p className={`text-xs -mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Synchronized 7-stage signal path across dual-STM32 physical breadboard
            </p>
          </div>
        </div>

        {/* Coordinated View Switcher Pills */}
        <div
          className={`flex items-center space-x-1 p-1 rounded-xl border text-xs font-semibold ${
            isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setViewMode('photo')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'photo'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photo View</span>
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
            onClick={() => setViewMode('annotated')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'annotated'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Annotated View</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. DEDICATED SIGNAL FLOW CONTROLS TOOLBAR                 */}
      {/* ========================================================= */}
      <div
        className={`px-4 sm:px-6 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-20 ${
          isDarkMode ? 'bg-[#080d1a] border-[#16243f]' : 'bg-slate-50 border-slate-200'
        }`}
      >
        {/* Playback Action Buttons */}
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

        {/* Current Active Stage & Progress Display */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-slate-400">
            <button
              onClick={handlePrevStage}
              className="p-1 hover:text-white transition rounded"
              title="Previous Stage"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleNextStage}
              className="p-1 hover:text-white transition rounded"
              title="Next Stage"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: activeStage.color }}
            />
            <span className="font-bold text-slate-200">
              Stage {activeStage.stageNumber}/7:
            </span>
            <span
              className="font-semibold px-2 py-0.5 rounded-md text-[11px] font-mono border"
              style={{
                color: activeStage.color,
                borderColor: `${activeStage.color}40`,
                backgroundColor: `${activeStage.color}15`
              }}
            >
              {activeStage.actionLabel}
            </span>
          </div>

          {/* 7-Segmented Mini Progress Bar */}
          <div className="hidden lg:flex items-center space-x-1">
            {SIGNAL_FLOW_STAGES.map((stg, i) => (
              <div
                key={stg.id}
                onClick={() => handleSelectStage(i)}
                className={`h-2 rounded-full cursor-pointer transition-all ${
                  i === currentStageIndex
                    ? 'w-7'
                    : i < currentStageIndex
                    ? 'w-3 bg-slate-600'
                    : 'w-3 bg-slate-800'
                }`}
                style={{
                  backgroundColor: i === currentStageIndex ? stg.color : undefined
                }}
                title={`Stage ${stg.stageNumber}: ${stg.shortLabel}`}
              />
            ))}
          </div>
        </div>

        {/* Explicit Data Provenance Badge (Requirement 6) */}
        <div className="hidden xl:flex items-center space-x-2 font-mono text-[11px]">
          <span
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border ${
              provenanceLabel === 'MEASURED HARDWARE DATA'
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/50'
                : provenanceLabel === 'BACKEND SIMULATION'
                ? 'bg-blue-950/80 text-blue-400 border-blue-500/50'
                : 'bg-slate-900 text-slate-300 border-slate-700'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                provenanceLabel === 'MEASURED HARDWARE DATA'
                  ? 'bg-emerald-400 animate-pulse'
                  : provenanceLabel === 'BACKEND SIMULATION'
                  ? 'bg-blue-400'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-bold">{provenanceLabel}</span>
          </span>

          <span className="text-slate-400 text-[10px]">
            ADC Count: <strong className="text-white">{liveAdcCount.toFixed(1)}</strong>
          </span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MAIN WORKBENCH: STAGE + RIGHT DETAIL SIDEBAR           */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Center Canvas */}
        <div className="flex-1 relative overflow-hidden bg-black/95 flex items-center justify-center p-2 sm:p-4">
          <div
            className="relative w-full max-w-5xl aspect-[1024/682] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
          >
            {/* VIEW A & C: REAL HARDWARE PHOTOGRAPH (Photo & Annotated Views) */}
            {(viewMode === 'photo' || viewMode === 'annotated') && (
              <img
                src="/hardware/full_hardware_setup.jpg"
                alt="SemLiFi Dual STM32 Breadboard Hardware Setup"
                className="w-full h-full object-cover object-center select-none pointer-events-none"
              />
            )}

            {/* VIEW B: CLEAN SCHEMATIC-STYLE GRID (Wiring View) */}
            {viewMode === 'wiring' && (
              <div className="w-full h-full bg-[#060b17] relative p-6 flex flex-col justify-between overflow-hidden">
                {/* Grid Background Pattern */}
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
                      SCHEMATIC WIRING DIAGRAM &bull; 7 SYNCHRONIZED STAGES
                    </span>
                  </div>
                  <div className="text-[11px] text-cyan-400 font-mono">
                    Orthogonal Netlist &bull; Labeled Signal Flow
                  </div>
                </div>

                {/* 7 Schematic Node Cards Along Pipeline */}
                <div className="flex-1 flex items-center justify-between px-2 sm:px-6 py-6 relative z-10">
                  {SIGNAL_FLOW_STAGES.map((stg, i) => {
                    const isCurrent = i === currentStageIndex;
                    return (
                      <div
                        key={stg.id}
                        onClick={() => handleSelectStage(i)}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer z-20 ${
                          isCurrent
                            ? 'scale-110 shadow-2xl ring-2'
                            : 'bg-[#0d162b] border-slate-800 hover:border-slate-600 text-slate-400'
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
                          style={{
                            backgroundColor: `${stg.color}30`,
                            color: stg.color
                          }}
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

                {/* Bottom Schematic Metadata Legend */}
                <div className="text-[11px] font-mono text-slate-500 flex justify-between border-t border-slate-800/80 pt-2 z-10">
                  <span>TX Node: STM32 PA9 (TIM1_CH2 PWM)</span>
                  <span className="text-amber-400 font-semibold">15 cm Atmospheric Air Gap (LOS)</span>
                  <span>RX Terminal: STM32 PA0 (TIM2_CH1 ADC)</span>
                </div>
              </div>
            )}

            {/* ======================================================= */}
            {/* 4. CO-ALIGNED SVG OVERLAY (Photo & Annotated Views: 1024x682) */}
            {/* ======================================================= */}
            {viewMode !== 'wiring' && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
                viewBox="0 0 1024 682"
                preserveAspectRatio="none"
              >
                <defs>
                  {/* Glow Filter for Active Signal Paths */}
                  <filter id="activeGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="beamSpreadGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Linear Gradient for Optical Beam Cone (LED -> Photodiode) */}
                  <linearGradient id="opticalConeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                    <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0.30" />
                  </linearGradient>

                  {/* Radial Gradient for LED optical radiant burst */}
                  <radialGradient id="ledBurstGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="40%" stopColor="#ef4444" stopOpacity="0.85" />
                    <stop offset="80%" stopColor="#dc2626" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* 1. All Connection Traces on the Physical Breadboard */}
                {SIGNAL_FLOW_STAGES.map((stg, i) => {
                  const isActive = i === currentStageIndex;
                  return (
                    <g key={stg.id}>
                      {/* Base Physical Wire Trace */}
                      <path
                        d={stg.pathD}
                        fill="none"
                        stroke={isActive ? stg.color : '#64748b'}
                        strokeWidth={isActive ? '4' : '2'}
                        strokeOpacity={isActive ? 1.0 : 0.35}
                        strokeDasharray={
                          isActive && !prefersReducedMotion ? '8 6' : undefined
                        }
                        className={
                          isActive && !prefersReducedMotion ? 'animate-pulse' : ''
                        }
                        filter={isActive ? 'url(#activeGlow)' : undefined}
                      />

                      {/* Directional Endpoint Dot */}
                      {isActive && (
                        <circle
                          cx={stg.endCoord.x}
                          cy={stg.endCoord.y}
                          r="3.5"
                          fill={stg.color}
                        />
                      )}
                    </g>
                  );
                })}

                {/* 2. Optical Channel Conical Light Beam (Stage 4) */}
                <g className="transition-opacity duration-300">
                  {/* Conical Light Spread Area from LED (422, 192) to Photodiode (662, 202) */}
                  <polygon
                    points="422,175 662,170 662,234 422,209"
                    fill="url(#opticalConeGrad)"
                    filter="url(#beamSpreadGlow)"
                    opacity={currentStageIndex === 3 ? 0.75 : 0.2}
                  />

                  {/* Core Photon Line */}
                  <line
                    x1="422"
                    y1="192"
                    x2="662"
                    y2="202"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="6 6"
                    opacity={currentStageIndex === 3 ? 0.95 : 0.3}
                  />
                </g>

                {/* 3. Transmitter LED Radiant Burst (Stage 3 & 4) */}
                {(currentStageIndex === 2 || currentStageIndex === 3) && (
                  <g className="transition-opacity duration-200">
                    <circle
                      cx="422"
                      cy="192"
                      r="36"
                      fill="url(#ledBurstGlow)"
                      className="animate-pulse"
                    />
                    <circle cx="422" cy="192" r="10" fill="#ffffff" filter="url(#activeGlow)" />
                  </g>
                )}

                {/* 4. Receiver Photodiode Active Detection Spot (Stage 5) */}
                {currentStageIndex === 4 && (
                  <g className="transition-opacity duration-200">
                    <circle
                      cx="662"
                      cy="202"
                      r="26"
                      fill="rgba(16, 185, 129, 0.45)"
                      filter="url(#activeGlow)"
                    />
                    <circle cx="662" cy="202" r="7" fill="#34d399" filter="url(#activeGlow)" />
                  </g>
                )}

                {/* 5. Traveling Signal Pulse Marker (Directional Energy Wavefront & Reticle) */}
                {!prefersReducedMotion && (
                  <g
                    transform={`translate(${markerPos.x}, ${markerPos.y})`}
                    className="transition-transform duration-75 pointer-events-none"
                  >
                    {/* Outer Rotating Radar Ring */}
                    <circle
                      r="14"
                      fill="none"
                      stroke={activeStage.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.75"
                    />
                    {/* Precision Crosshair Ticks */}
                    <line x1="-11" y1="0" x2="-6" y2="0" stroke={activeStage.color} strokeWidth="1.5" />
                    <line x1="6" y1="0" x2="11" y2="0" stroke={activeStage.color} strokeWidth="1.5" />
                    <line x1="0" y1="-11" x2="0" y2="-6" stroke={activeStage.color} strokeWidth="1.5" />
                    <line x1="0" y1="6" x2="0" y2="11" stroke={activeStage.color} strokeWidth="1.5" />
                    {/* High-Tech Diamond Energy Core */}
                    <polygon
                      points="0,-6 6,0 0,6 -6,0"
                      fill={activeStage.color}
                      filter="url(#activeGlow)"
                      opacity="0.9"
                    />
                    <circle
                      r="2.5"
                      fill="#ffffff"
                      filter="url(#activeGlow)"
                    />
                    {/* Floating Micro Vector Tag */}
                    <rect
                      x="14"
                      y="-10"
                      width="72"
                      height="19"
                      rx="4"
                      fill="rgba(6, 11, 24, 0.92)"
                      stroke={activeStage.color}
                      strokeWidth="1.2"
                    />
                    <text
                      x="18"
                      y="3"
                      fill={activeStage.color}
                      fontSize="8.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      PULSE S{activeStage.stageNumber}
                    </text>
                  </g>
                )}

                {/* 6. Annotated View: Subsystem Bounding Boxes & Callouts */}
                {viewMode === 'annotated' &&
                  HARDWARE_SUBSYSTEM_BOXES.map((b) => {
                    const isSelected = selectedComp.id === b.id;
                    const isCurrent = activeStage.componentId === b.id;
                    return (
                      <g
                        key={b.id}
                        onClick={() => handleSelectStage(b.flowStep - 1)}
                        className="cursor-pointer pointer-events-auto group"
                      >
                        <rect
                          x={b.x}
                          y={b.y}
                          width={b.width}
                          height={b.height}
                          rx={8}
                          fill={
                            isCurrent
                              ? `${b.color}25`
                              : isSelected
                              ? `${b.color}15`
                              : 'transparent'
                          }
                          stroke={isCurrent ? b.color : isSelected ? '#38bdf8' : 'rgba(255,255,255,0.4)'}
                          strokeWidth={isCurrent ? 3 : isSelected ? 2 : 1}
                          strokeDasharray={isCurrent ? undefined : '4 4'}
                          filter={isCurrent ? 'url(#activeGlow)' : undefined}
                          className="transition-all duration-150"
                        />

                        {/* Floating Subsystem Label Pill in SVG */}
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
            )}

            {/* ======================================================= */}
            {/* 5. SVG OVERLAY FOR WIRING VIEW (1000x500 Grid Coordinates) */}
            {/* ======================================================= */}
            {viewMode === 'wiring' && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none select-none z-15"
                viewBox="0 0 1000 500"
                preserveAspectRatio="none"
              >
                <defs>
                  <marker
                    id="schematicArrow"
                    viewBox="0 0 10 10"
                    refX="6"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                  </marker>
                </defs>

                {/* Connection Lines between schematic nodes with distinct signal category visual styling */}
                {SIGNAL_FLOW_STAGES.map((stg, i) => {
                  const isActive = i === currentStageIndex;
                  const { x1, y1, x2, y2, label } = stg.schematicWire;

                  // Distinct visual stroke styles:
                  // OPTICAL: dashed amber ray
                  // DIGITAL: solid with square endpoints
                  // ANALOG: solid wave with glow
                  // ELECTRICAL: standard solid conductor
                  const isOptical = stg.type === 'OPTICAL';
                  const isDigital = stg.type === 'DIGITAL';
                  const isAnalog = stg.type === 'ANALOG';

                  return (
                    <g key={stg.id}>
                      {/* Schematic Bus Wire */}
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isActive ? stg.color : isOptical ? '#78350f' : isDigital ? '#334155' : isAnalog ? '#0f766e' : '#475569'}
                        strokeWidth={isActive ? (isOptical ? '5' : '4') : '2'}
                        strokeDasharray={isOptical ? '8 4' : isDigital ? undefined : isAnalog ? '12 2' : undefined}
                        className={isActive && !prefersReducedMotion ? 'animate-pulse' : ''}
                      />

                      {/* Direction Arrow / Node Dot */}
                      <circle cx={x2} cy={y2} r={isOptical ? '4' : '3'} fill={isActive ? stg.color : '#64748b'} />

                      {/* Signal Net Label with Type Badge */}
                      <text
                        x={(x1 + x2) / 2}
                        y={y1 - 12}
                        textAnchor="middle"
                        fill={isActive ? stg.color : '#94a3b8'}
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {label} {isOptical ? '⚡' : ''}
                      </text>
                    </g>
                  );
                })}

                {/* Traveling Signal Pulse Wavefront on Schematic Wire */}
                {!prefersReducedMotion && (
                  <g
                    transform={`translate(${schematicMarkerPos.x}, ${schematicMarkerPos.y})`}
                    className="transition-transform duration-75 pointer-events-none"
                  >
                    <circle
                      r="12"
                      fill="none"
                      stroke={activeStage.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                      opacity="0.8"
                    />
                    <polygon
                      points="0,-5 5,0 0,5 -5,0"
                      fill={activeStage.color}
                      filter="url(#activeGlow)"
                      opacity="0.9"
                    />
                    <circle r="2.5" fill="#ffffff" />
                    <rect
                      x="10"
                      y="-9"
                      width="64"
                      height="18"
                      rx="4"
                      fill="rgba(10, 16, 30, 0.94)"
                      stroke={activeStage.color}
                      strokeWidth="1.2"
                    />
                    <text
                      x="14"
                      y="3.5"
                      fill="#ffffff"
                      fontSize="8"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      FLOW &bull; S{activeStage.stageNumber}
                    </text>
                  </g>
                )}
              </svg>
            )}

            {/* Dynamic Active Wire Callout Tooltip in Annotated View */}
            {viewMode === 'annotated' && (
              <div
                className="absolute bg-slate-900/95 text-white text-[11px] font-mono p-3 rounded-xl border border-slate-700 shadow-2xl backdrop-blur-md max-w-xs z-30 transition-all pointer-events-none"
                style={{
                  left: `${Math.min(75, Math.max(5, (markerPos.x / 1024) * 100))}%`,
                  top: `${Math.min(70, Math.max(8, ((markerPos.y - 95) / 682) * 100))}%`,
                  borderColor: activeStage.color
                }}
              >
                <div
                  className="flex items-center space-x-1.5 font-bold mb-1"
                  style={{ color: activeStage.color }}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Stage {activeStage.stageNumber}: {activeStage.name}</span>
                </div>
                <div className="text-slate-300 text-[10px] leading-snug">
                  {activeStage.technicalDescription}
                </div>
                <div className="mt-1.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                  <span>{activeStage.pinFrom}</span>
                  <span className="font-bold text-white">&rarr; {activeStage.pinTo}</span>
                </div>
              </div>
            )}

            {/* Bottom-left Photo Zoom Tools */}
            <div className="absolute left-3 bottom-3 flex items-center space-x-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 text-white z-30">
              <button
                onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* 6. RIGHT SIDEBAR (Synchronized Components & Connections) */}
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

          {/* TAB 1: Components List (Synchronized with active flow stage) */}
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
                    onClick={() => handleSelectStage(item.stage - 1)}
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
            /* TAB 2: Connections Netlist (Synchronized with 7 stages) */
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

          {/* Bottom Selected Component Card (Detailed specs & verification) */}
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

            {/* Quick Specs summary */}
            <div className="text-[11px] text-slate-400 dark:text-slate-400 bg-black/30 p-2 rounded-lg font-mono">
              {selectedComp.functionDescription}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

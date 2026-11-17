import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Send,
  Activity,
  Layers,
  Cpu,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  FileSpreadsheet,
  Crosshair,
  ZoomIn,
  ZoomOut,
  Sparkles,
  ShieldCheck,
  Binary,
  ArrowRight,
  StepForward,
  ChevronRight,
  Eye,
  RefreshCw,
  Clock,
  Database
} from 'lucide-react';
import {
  validateInputPayload,
  convertToAsciiTable,
  encodeSemLiFiFrame,
  parallelToSerialBitstream,
  manchesterEncodeBits,
  simulatePhysicalChannel,
  decodeManchesterChips,
  executeDigitalTransmissionPipeline,
  DigitalFrame,
  AsciiByteDetail,
  ChannelSimulationResult,
  DigitalDecodeResult
} from '../../model/digitalTransmissionEngine';
import {
  SharedExperimentResult,
  DEFAULT_SHARED_EXPERIMENT
} from '../../model/experimentModel';
import { api } from '../../services/api';

interface TransmissionSignalAnalyzerPageProps {
  isSimulating: boolean;
  isDarkMode: boolean;
  workingDistanceCm: number;
  ambientLux: number;
  activeExperiment?: SharedExperimentResult;
  onExperimentRun?: (result: SharedExperimentResult) => void;
  onOpenReport?: () => void;
}

export const TransmissionSignalAnalyzerPage: React.FC<TransmissionSignalAnalyzerPageProps> = ({
  isSimulating,
  isDarkMode,
  workingDistanceCm = 15,
  ambientLux = 250,
  activeExperiment,
  onExperimentRun,
  onOpenReport
}) => {
  // ---------------------------------------------------------------------------
  // STATE MANAGEMENT
  // ---------------------------------------------------------------------------
  const [message, setMessage] = useState<string>(
    activeExperiment?.original_payload || 'TEMP=27.4,HUM=61,MOTOR=ON'
  );
  const [occlusionScenario, setOcclusionScenario] = useState<'P0' | 'P1' | 'P2' | 'P3'>(
    activeExperiment?.obstruction_scenario || 'P1'
  );

  // Transmission Trigger & Gate State:
  // Real waveforms & receiver decoding only appear AFTER clicking TRANSMIT SIGNAL!
  const [hasTransmitted, setHasTransmitted] = useState<boolean>(false);
  const [lastTransmittedMessage, setLastTransmittedMessage] = useState<string | null>(null);
  const [lastTransmittedScenario, setLastTransmittedScenario] = useState<string | null>(null);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmitProgress, setTransmitProgress] = useState<number>(100);
  const [packetsSent, setPacketsSent] = useState<number>(0);

  // DSO Oscilloscope Controls State
  const [isScopeRunning, setIsScopeRunning] = useState<boolean>(true);
  const [timebaseUs, setTimebaseUs] = useState<number>(200); // 200 µs/div
  const [zoom, setZoom] = useState<number>(1.0); // 1.0x default

  // Step-through Inspection Stage (1 to 7)
  const [inspectionStage, setInspectionStage] = useState<number>(1);
  const [isStepThroughMode, setIsStepThroughMode] = useState<boolean>(false);

  // Drawer toggles
  const [showAsciiDrawer, setShowAsciiDrawer] = useState<boolean>(false);
  const [showBitComparison, setShowBitComparison] = useState<boolean>(false);

  // Payload Validation
  const validation = useMemo(() => {
    return validateInputPayload(message);
  }, [message]);

  const hasValidPayload = Boolean(message && message.trim().length > 0 && validation.valid);

  // When user edits message payload or selects presets, invalidate transmitted state
  const handleMessageChange = (newVal: string) => {
    setMessage(newVal);
    if (hasTransmitted && newVal !== lastTransmittedMessage) {
      setHasTransmitted(false);
    }
  };

  const handleSelectPreset = (presetVal: string) => {
    setMessage(presetVal);
    if (hasTransmitted && presetVal !== lastTransmittedMessage) {
      setHasTransmitted(false);
    }
  };

  const handleScenarioChange = (sc: 'P0' | 'P1' | 'P2' | 'P3') => {
    setOcclusionScenario(sc);
    if (hasTransmitted && sc !== lastTransmittedScenario) {
      setHasTransmitted(false);
    }
  };

  // ---------------------------------------------------------------------------
  // REAL-TIME COMPUTATIONS (Deterministic Single Source of Truth)
  // ---------------------------------------------------------------------------
  const payloadBytes = useMemo(() => {
    if (!hasValidPayload) return [];
    return Array.from(message).map((c) => c.charCodeAt(0));
  }, [message, hasValidPayload]);

  const asciiTable: AsciiByteDetail[] = useMemo(() => {
    if (!hasValidPayload) return [];
    return convertToAsciiTable(message);
  }, [message, hasValidPayload]);

  // Canonical SemLiFi Frame (only generated when payload is present)
  const digitalFrame: DigitalFrame | null = useMemo(() => {
    if (!hasValidPayload) return null;
    return encodeSemLiFiFrame(message, Math.max(1, packetsSent));
  }, [message, packetsSent, hasValidPayload]);

  // Parallel-to-serial conversion
  const { bitString, bits } = useMemo(() => {
    if (!digitalFrame) return { bitString: '', bits: [] };
    return parallelToSerialBitstream(digitalFrame.rawBytes);
  }, [digitalFrame]);

  // Manchester Line Coding
  const manchesterChips = useMemo(() => {
    if (bits.length === 0) return [];
    return manchesterEncodeBits(bits);
  }, [bits]);

  // Controllable channel & burst durations
  const burstDurations = { P0: 0, P1: 80, P2: 250, P3: 500 };
  const servoAngles = { P0: 0, P1: 30, P2: 60, P3: 90 };
  const burstDurationMs = burstDurations[occlusionScenario];
  const servoAngle = servoAngles[occlusionScenario];

  // Channel simulation result
  const channelSim: ChannelSimulationResult | null = useMemo(() => {
    if (manchesterChips.length === 0) return null;
    return simulatePhysicalChannel(
      manchesterChips,
      workingDistanceCm,
      ambientLux,
      servoAngle,
      burstDurationMs
    );
  }, [manchesterChips, workingDistanceCm, ambientLux, servoAngle, burstDurationMs]);

  // Receiver decoding & Dallas CRC-8 check
  const decodeResult: DigitalDecodeResult | null = useMemo(() => {
    if (!channelSim || !hasValidPayload) return null;
    return decodeManchesterChips(channelSim.receivedChips, message);
  }, [channelSim, message, hasValidPayload]);

  // Phase animation for scope sweep
  const [phaseOffset, setPhaseOffset] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (isSimulating && isScopeRunning && hasValidPayload) {
        setPhaseOffset((prev) => (prev + dt * 4) % (Math.PI * 4));
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSimulating, isScopeRunning, hasValidPayload]);

  // ---------------------------------------------------------------------------
  // DSO 4-CHANNEL SAMPLES CALCULATION
  // ---------------------------------------------------------------------------
  const numSamples = 120;

  // 1. Quiescent Standby Traces (Before message or when link is idle)
  const idleTraces = useMemo(() => {
    const totalWindowUs = (timebaseUs * 10) / zoom;
    return Array.from({ length: numSamples }, (_, i) => {
      const tUs = (i / (numSamples - 1)) * totalWindowUs;
      const darkNoise = (Math.sin(tUs * 0.05) * 0.008 + Math.cos(tUs * 0.02) * 0.005) * (ambientLux / 250);
      return {
        tUs,
        ch1_v: 0.0, // TX GPIO 23 idle low
        ch2_v: 0.0, // LED dark (0 mW)
        ch3_v: Math.max(0.03, Math.min(0.08, 0.05 + darkNoise)), // Photodiode dark current ~0.05V
        ch4_v: 0.0  // Comparator idle low
      };
    });
  }, [numSamples, timebaseUs, zoom, ambientLux]);

  // 2. Real Physical Waveform Traces (Derived strictly from message bits)
  const liveTraces = useMemo(() => {
    if (bits.length === 0) return idleTraces;
    const totalWindowUs = (timebaseUs * 10) / zoom;
    const servoTransmission = servoAngle === 0 ? 1.0 : servoAngle === 30 ? 0.60 : servoAngle === 60 ? 0.05 : 0.0;
    const opticalAttenuation = Math.max(0.2, (15 / Math.max(1, workingDistanceCm)) ** 2);

    return Array.from({ length: numSamples }, (_, i) => {
      const tUs = (i / (numSamples - 1)) * totalWindowUs + (phaseOffset * 50);

      // Data bit at time tUs (1000 µs per bit)
      const bitIndex = Math.floor(tUs / 1000);
      const safeBitIndex = ((bitIndex % bits.length) + bits.length) % bits.length;
      const dataBit = bits[safeBitIndex] ?? 0;

      // Manchester chip at time tUs (500 µs per chip, 2 chips per bit)
      const chipIndex = Math.floor(tUs / 500);
      const isSecondHalf = (chipIndex % 2) !== 0;
      // IEEE 802.3: Bit 0 -> [0, 1], Bit 1 -> [1, 0]
      const chipVal = dataBit === 1 ? (isSecondHalf ? 0 : 1) : (isSecondHalf ? 1 : 0);

      // CH1: TX Manchester Data (0.0 to 3.3V)
      const ch1_v = chipVal * 3.3;

      // CH2: LED Optical Intensity (sinking via NPN driver: 0 to 100% / mW)
      const ch2_intensity = chipVal === 1 ? 100.0 : 0.0;
      const ch2_v = (ch2_intensity / 100) * 3.3;

      // Burst Interval Occlusion Detection:
      const burstStartUs = 200; // Simulated burst in the scope sweep
      const isOccluded = burstDurationMs > 0 && tUs >= burstStartUs && tUs < burstStartUs + (burstDurationMs * 10);
      const effectiveTransmission = isOccluded ? (occlusionScenario === 'P1' ? 0.20 : 0.0) : servoTransmission;

      // CH3: RX Photodiode Signal (BPW34 photocurrent converted to voltage + attenuation + ambient)
      const rcFactor = chipVal === 1
        ? 1 - Math.exp(-((tUs % 500) / 45))
        : Math.exp(-((tUs % 500) / 45));
      const noise = (Math.sin(tUs * 0.05) * 0.04 + Math.cos(tUs * 0.02) * 0.02) * (ambientLux / 250);
      const ch3_v = Math.max(0.04, Math.min(3.26, 0.05 + (2.85 * opticalAttenuation * effectiveTransmission * rcFactor) + noise));

      // CH4: RX Digital Recovered Bits (LM358 comparator slicing at ~1.0V)
      const ch4_v = ch3_v >= 1.0 ? 3.3 : 0.0;

      return {
        tUs,
        ch1_v,
        ch2_v,
        ch3_v,
        ch4_v
      };
    });
  }, [numSamples, timebaseUs, zoom, phaseOffset, bits, servoAngle, burstDurationMs, workingDistanceCm, ambientLux, occlusionScenario, idleTraces]);

  // Traces logic:
  // If NO valid payload -> always idle flatline!
  // If valid payload -> liveTraces reflect the typed bits on CH1/CH2.
  // If transmitted -> full optical path on CH3/CH4!
  const traces = useMemo(() => {
    if (!hasValidPayload) return idleTraces;
    if (hasTransmitted) return liveTraces;
    // When payload is typed but not transmitted yet: show TX Manchester & LED, but keep RX quiescent
    return liveTraces.map((pt, idx) => ({
      ...pt,
      ch3_v: idleTraces[idx]?.ch3_v ?? 0.05,
      ch4_v: 0.0
    }));
  }, [hasValidPayload, hasTransmitted, liveTraces, idleTraces]);

  // ---------------------------------------------------------------------------
  // TRANSMIT PIPELINE EXECUTION (Triggered by user click)
  // ---------------------------------------------------------------------------
  const handleTransmit = async () => {
    if (isTransmitting || !hasValidPayload) return;
    setIsTransmitting(true);
    setTransmitProgress(20);

    const pipelineResult = executeDigitalTransmissionPipeline(
      message,
      occlusionScenario,
      workingDistanceCm,
      ambientLux,
      packetsSent + 1
    );

    let backendResultData: {
      receivedText?: string;
      confidenceScore?: number;
      latencyMs?: number;
      cgfpDecision?: 'ACCEPT' | 'FALLBACK_NACK';
    } | undefined = undefined;

    let sourceMode: 'BACKEND PIPELINE' | 'DETERMINISTIC SIMULATION' = 'DETERMINISTIC SIMULATION';

    try {
      const res = await api.runPipeline({
        payload: message,
        sequence_id: packetsSent + 1,
        inject_burst: occlusionScenario !== 'P0',
        burst_duration_ms: burstDurationMs,
        force_low_confidence: occlusionScenario === 'P2' || occlusionScenario === 'P3',
        threshold: 0.80
      });
      if (res && res.pipeline_steps) {
        sourceMode = 'BACKEND PIPELINE';
        backendResultData = {
          receivedText: res.final_payload,
          confidenceScore: res.cgfp_result ? res.cgfp_result.confidence_score : 0.887,
          latencyMs: res.transit_latency_ms,
          cgfpDecision: res.cgfp_result?.decision === 'ACCEPT' ? 'ACCEPT' : 'FALLBACK_NACK'
        };
      }
    } catch {
      sourceMode = 'DETERMINISTIC SIMULATION';
    }

    setTransmitProgress(60);

    setTimeout(() => {
      setTransmitProgress(100);
      setIsTransmitting(false);
      setHasTransmitted(true);
      setLastTransmittedMessage(message);
      setLastTransmittedScenario(occlusionScenario);
      setPacketsSent((p) => p + 1);

      const updatedExp: SharedExperimentResult = {
        ...pipelineResult.sharedExperiment,
        mode: 'SIMULATION',
        operating_mode: 'SIMULATION',
        latency_ms: backendResultData?.latencyMs ?? pipelineResult.sharedExperiment.latency_ms,
        end_to_end_latency: backendResultData?.latencyMs ?? pipelineResult.sharedExperiment.end_to_end_latency,
        decoded_payload: backendResultData?.receivedText ?? pipelineResult.sharedExperiment.decoded_payload,
        received_payload: backendResultData?.receivedText ?? pipelineResult.sharedExperiment.received_payload,
        cgfp_decision: backendResultData?.cgfpDecision ?? pipelineResult.sharedExperiment.cgfp_decision,
        final_decision: backendResultData?.cgfpDecision ?? pipelineResult.sharedExperiment.final_decision,
        data_source_badge: sourceMode === 'BACKEND PIPELINE' ? 'BACKEND PIPELINE' : 'DETERMINISTIC SIMULATION',
        packet_delivery_status: (backendResultData?.cgfpDecision === 'ACCEPT' || pipelineResult.sharedExperiment.cgfp_decision === 'ACCEPT')
          ? (occlusionScenario === 'P0' ? 'DELIVERED_CLEAN' : 'RECOVERED_SEMANTIC')
          : (occlusionScenario === 'P3' ? 'DROPPED' : 'FALLBACK_EXACT_ARQ')
      };

      if (onExperimentRun) {
        onExperimentRun(updatedExp);
      }
    }, 500);
  };

  // Export Sample Data
  const handleExportSamples = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const header = 'Time_us,CH1_TX_V,CH2_LED_Intensity_V,CH3_RX_Photodiode_V,CH4_RX_Recovered_V\n';
      const rows = traces.map((t) =>
        `${t.tUs.toFixed(2)},${t.ch1_v.toFixed(3)},${t.ch2_v.toFixed(3)},${t.ch3_v.toFixed(3)},${t.ch4_v.toFixed(3)}`
      ).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `semlifi_transmission_trace_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify({ message, hasTransmitted, traces, decodeResult: hasTransmitted ? decodeResult : null }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `semlifi_transmission_trace_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // ---------------------------------------------------------------------------
  // RENDER
  // ---------------------------------------------------------------------------
  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 0. LABORATORY HEADER & CONTEXT                           */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-semibold mb-1">
            <span>SemLiFi / Transmission Lab</span>
            <span className="text-slate-600">•</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
              SIMULATION READY
            </span>
          </div>
          <div className="flex items-baseline space-x-3">
            <h1
              className={`text-xl sm:text-2xl font-extrabold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Transmission &amp; Signal Analyzer
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">
              {activeExperiment?.experiment_id || `EXP-${String(Math.max(1, packetsSent)).padStart(3, '0')}`}
            </span>
          </div>
          <p
            className={`text-xs mt-1 font-medium ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Configure payload, transmit Manchester-coded bits, observe optical signals and inspect receiver recovery.
          </p>
        </div>

        {/* Global Pipeline Telemetry Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl border bg-slate-900/80 border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Packets TX:</span>
            <span className="font-bold text-cyan-400">{packetsSent}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl border bg-slate-900/80 border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Air Gap:</span>
            <span className="font-bold text-blue-400">{workingDistanceCm} cm</span>
          </div>
          <button
            onClick={() => setIsStepThroughMode(!isStepThroughMode)}
            className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1.5 font-bold transition ${
              isStepThroughMode
                ? 'bg-purple-600 text-white border-purple-400 shadow'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Inspect communication pipeline stage-by-stage"
          >
            <StepForward className="w-3.5 h-3.5" />
            <span>Step-Through Mode</span>
          </button>
        </div>
      </div>

      {/* Step-Through Inspector Strip */}
      {isStepThroughMode && (
        <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-800/50 space-y-3 font-mono text-xs animate-fadeIn">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping" />
              <strong className="text-purple-300">EXAMINER STAGE-BY-STAGE PIPELINE INSPECTOR:</strong>
            </div>
            <div className="flex items-center space-x-2">
              <button
                disabled={inspectionStage <= 1}
                onClick={() => setInspectionStage((s) => Math.max(1, s - 1))}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-white font-bold"
              >
                &larr; Prev Stage
              </button>
              <span className="text-white font-bold px-2">Stage {inspectionStage} of 7</span>
              <button
                disabled={inspectionStage >= 7}
                onClick={() => setInspectionStage((s) => Math.min(7, s + 1))}
                className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold"
              >
                Next Stage &rarr;
              </button>
            </div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#060b17] border border-purple-900/60 text-slate-300 text-[11px] leading-relaxed">
            {inspectionStage === 1 && (
              <div>
                <strong className="text-cyan-400">Stage 1: ASCII Telemetry Input:</strong>{' '}
                {hasValidPayload
                  ? `Payload string "${message}" parsed to ${payloadBytes.length} bytes UTF-8 ASCII symbols.`
                  : `Transmitter empty. Enter a telemetry message above.`}
              </div>
            )}
            {inspectionStage === 2 && (
              <div>
                <strong className="text-blue-400">Stage 2: Canonical SemLiFi Framing:</strong>{' '}
                {digitalFrame
                  ? `Prepends Sync 0xAA 0x55, Length (0x${digitalFrame.lengthByte.toString(16).toUpperCase()}), Sequence (0x${digitalFrame.sequenceId.toString(16).toUpperCase()}), Dallas CRC-8 (0x${digitalFrame.crcByte.toString(16).toUpperCase()}), and Terminator \\r\\n (${digitalFrame.totalFrameBytes} total bytes).`
                  : `No packet framed. Waiting for valid message payload.`}
              </div>
            )}
            {inspectionStage === 3 && (
              <div>
                <strong className="text-indigo-400">Stage 3: Parallel-to-Serial Shift Register:</strong>{' '}
                {digitalFrame
                  ? `Byte-to-bit MSB-first serializer produces ${digitalFrame.totalBits} continuous bits directly from character bytes.`
                  : `Shift register idle (0 bits).`}
              </div>
            )}
            {inspectionStage === 4 && (
              <div>
                <strong className="text-amber-400">Stage 4: IEEE 802.3 Manchester Line Coding:</strong>{' '}
                {digitalFrame
                  ? `Line rate = 1000 bps (Tb = 1000 µs). Bit 0 → [0, 1] (500 µs low, 500 µs high). Bit 1 → [1, 0] (500 µs high, 500 µs low). Total chips: ${digitalFrame.totalChips}.`
                  : `Encoder standby (0 chips).`}
              </div>
            )}
            {inspectionStage === 5 && (
              <div>
                <strong className="text-red-400">Stage 5: Transistor &amp; LED Optical Modulation:</strong> S8050 NPN driver sinks 14.5 mA to modulate 650 nm Red LED. SG90 flap position = {servoAngle}&deg; ({burstDurationMs} ms occlusion).
              </div>
            )}
            {inspectionStage === 6 && (
              <div>
                <strong className="text-emerald-400">Stage 6: BPW34 Photodiode &amp; LM358 Receiver Slicing:</strong>{' '}
                {hasTransmitted && decodeResult
                  ? `Radiant flux focused onto 7.5 mm² chip, amplified via TIA, sliced by comparator threshold ~1.0V into ESP32 RX (GPIO 34).`
                  : `Optical receiver standby. Awaiting optical signal transmission from GPIO 23.`}
              </div>
            )}
            {inspectionStage === 7 && (
              <div>
                <strong className="text-purple-400">Stage 7: BASR Semantic Infilling &amp; CGFP Decision:</strong>{' '}
                {hasTransmitted && decodeResult
                  ? `Dallas CRC-8 check status: ${decodeResult.crcStatus}. Evaluated confidence score: ${activeExperiment?.confidence_score?.toFixed(3) ?? '0.942'} vs τ* = 0.80.`
                  : `CGFP decision gate armed. Ready to evaluate received frame after transmission.`}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3 MAJOR SECTIONS: TRANSMITTER, SIGNAL MONITOR, RECEIVER   */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* ======================================================= */}
        {/* SECTION 01 — TRANSMITTER (Left Column)                 */}
        {/* ======================================================= */}
        <div className="lg:col-span-4 space-y-4">
          <div
            className={`rounded-2xl border p-5 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400">01 &mdash;</span>
                <h2 className="text-sm font-bold tracking-tight uppercase">TRANSMITTER</h2>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  hasValidPayload
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {hasValidPayload ? 'VALID' : 'INVALID'}
              </span>
            </div>

            {/* Message Payload Input (Interaction 1: live regeneration) */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium block">
                Message payload:
              </label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => handleMessageChange(e.target.value)}
                placeholder="Enter telemetry (e.g. TEMP=27.4,HUM=61,MOTOR=ON)..."
                className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none transition ${
                  !hasValidPayload
                    ? 'border-rose-500/60 bg-rose-950/20 text-rose-200'
                    : isDarkMode
                    ? 'bg-[#060b17] border-slate-700 text-white focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />

              {/* Presets Quick Pick */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                <span className="text-slate-500">Presets:</span>
                <button
                  onClick={() => handleSelectPreset('A')}
                  className={`px-1.5 py-0.5 rounded border transition ${
                    message === 'A' ? 'bg-[#006067] text-white border-[#006067] font-bold' : (isDarkMode ? 'bg-slate-800/60 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-700 border-slate-300')
                  }`}
                >
                  'A' (1B)
                </button>
                <button
                  onClick={() => handleSelectPreset('HELLO')}
                  className={`px-1.5 py-0.5 rounded border transition ${
                    message === 'HELLO' ? 'bg-[#006067] text-white border-[#006067] font-bold' : (isDarkMode ? 'bg-slate-800/60 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-700 border-slate-300')
                  }`}
                >
                  'HELLO' (5B)
                </button>
                <button
                  onClick={() => handleSelectPreset('TEMP=27.4,HUM=61,MOTOR=ON')}
                  className={`px-1.5 py-0.5 rounded border transition ${
                    message === 'TEMP=27.4,HUM=61,MOTOR=ON' ? 'bg-[#006067] text-white border-[#006067] font-bold' : (isDarkMode ? 'bg-slate-800/60 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-700 border-slate-300')
                  }`}
                >
                  Telemetry (25B)
                </button>
                <button
                  onClick={() => handleSelectPreset('STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200')}
                  className={`px-1.5 py-0.5 rounded border transition ${
                    message === 'STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200' ? 'bg-[#006067] text-white border-[#006067] font-bold' : (isDarkMode ? 'bg-slate-800/60 text-slate-300 border-slate-700/50' : 'bg-slate-100 text-slate-700 border-slate-300')
                  }`}
                >
                  Long (42B)
                </button>
                <button
                  onClick={() => handleSelectPreset('')}
                  className="px-1.5 py-0.5 rounded border bg-rose-950/40 text-rose-300 border-rose-800/50 hover:bg-rose-900/60 transition"
                >
                  Clear
                </button>
              </div>

              {/* Metadata & Encoding Badges */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                <span>{payloadBytes.length} bytes • ASCII encoding</span>
                <span className="text-cyan-400 font-bold">
                  {digitalFrame ? `CRC-8: 0x${digitalFrame.crcByte.toString(16).toUpperCase().padStart(2, '0')}` : 'CRC-8: --'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  ASCII
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Manchester
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  1000 bps
                </span>
              </div>
            </div>

            {/* Encoded Bitstream Viewer */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800/60 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold text-[11px]">Encoded bitstream:</span>
                <span className="text-[10px] text-slate-500">
                  {digitalFrame ? `${digitalFrame.totalBits} bits • ${digitalFrame.totalChips} chips` : '0 bits • 0 chips'}
                </span>
              </div>

              {/* Real-time Character-to-Binary Mapping */}
              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed break-all max-h-36 overflow-y-auto select-all ${
                  isDarkMode ? 'bg-[#060b17] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-200 text-blue-900'
                }`}
              >
                {!hasValidPayload ? (
                  <span className="text-slate-500 italic">
                    [No payload — Enter a telemetry string above (e.g. &apos;HELLO&apos; or &apos;TEMP=27.4&apos;) to generate binary bitstream]
                  </span>
                ) : (
                  <div className="space-y-2">
                    {/* Character-by-Character Byte Breakdown */}
                    <div className="flex flex-wrap gap-1 text-[10px]">
                      {asciiTable.map((item) => (
                        <span key={item.index} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                          <span className="text-amber-300 font-bold">&apos;{item.char}&apos;:</span>{' '}
                          <span className="text-cyan-300 font-mono">{item.binary}</span>
                        </span>
                      ))}
                    </div>
                    {/* Serialized Stream with Byte Spacing */}
                    <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 font-mono">
                      <span className="text-slate-500 text-[9px] block mb-0.5">Full Frame (Sync + Len + Seq + Data + CRC):</span>
                      {bitString.match(/.{1,8}/g)?.join(' ') || bitString}
                    </div>
                  </div>
                )}
              </div>

              {/* ASCII Byte Table Drawer Trigger */}
              {hasValidPayload && (
                <button
                  type="button"
                  onClick={() => setShowAsciiDrawer(!showAsciiDrawer)}
                  className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 pt-1"
                >
                  <Binary className="w-3.5 h-3.5" />
                  <span>{showAsciiDrawer ? 'Hide ASCII Symbol Drawer' : 'Inspect ASCII & Nibble Breakdown'}</span>
                </button>
              )}

              {showAsciiDrawer && hasValidPayload && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-800 mt-2 bg-[#060b17]">
                  <table className="w-full text-left text-[10px] font-mono">
                    <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800">
                      <tr>
                        <th className="px-2 py-1">#</th>
                        <th className="px-2 py-1">Char</th>
                        <th className="px-2 py-1">Dec</th>
                        <th className="px-2 py-1">Hex</th>
                        <th className="px-2 py-1 text-cyan-400">8-Bit Binary</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {asciiTable.map((item) => (
                        <tr key={item.index}>
                          <td className="px-2 py-0.5 text-slate-500">{item.index}</td>
                          <td className="px-2 py-0.5 font-bold text-amber-300">&apos;{item.char}&apos;</td>
                          <td className="px-2 py-0.5">{item.asciiCode}</td>
                          <td className="px-2 py-0.5 text-purple-300">{item.hex}</td>
                          <td className="px-2 py-0.5 text-cyan-300 font-bold">{item.binary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* TRANSMIT SIGNAL Button */}
            <div className="pt-2">
              <button
                onClick={handleTransmit}
                disabled={isTransmitting || !hasValidPayload}
                className={`w-full py-3 rounded-full text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 ${
                  isTransmitting
                    ? 'bg-amber-600 cursor-wait'
                    : !hasValidPayload
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : hasTransmitted
                    ? 'bg-gradient-to-r from-[#006067] to-[#00838f] hover:from-[#004f55] hover:to-[#006067] shadow-lg shadow-[#006067]/30 ring-2 ring-[#00a2ac]/40'
                    : 'bg-gradient-to-r from-[#006067] to-[#00838f] hover:from-[#004f55] hover:to-[#006067] shadow-lg shadow-[#006067]/30 animate-pulse'
                }`}
              >
                {isTransmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Transmitting Signal ({transmitProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{hasTransmitted ? 'RE-TRANSMIT SIGNAL' : 'TRANSMIT SIGNAL'}</span>
                  </>
                )}
              </button>
              {hasValidPayload && !hasTransmitted && (
                <p className="text-[10px] text-center font-mono text-amber-400/90 mt-1.5">
                  • Click TRANSMIT SIGNAL to run physical link &amp; capture waveforms
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* SECTION 02 — LIVE SIGNAL MONITOR (Center-Right DSO)    */}
        {/* ======================================================= */}
        <div className="lg:col-span-5 space-y-4">
          <div
            className={`rounded-2xl border p-5 space-y-4 shadow-sm flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Header */}
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">02 &mdash;</span>
                  <h2 className="text-sm font-bold tracking-tight uppercase">LIVE SIGNAL MONITOR</h2>
                </div>
                {!hasValidPayload ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-slate-800 text-slate-500 border border-slate-700 flex items-center space-x-1">
                    <span>STANDBY (EMPTY)</span>
                  </span>
                ) : hasTransmitted ? (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>LIVE</span>
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>ARMED</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {!hasValidPayload
                  ? 'Transmitter quiescent (0.0V baseline) — Awaiting message payload.'
                  : hasTransmitted
                  ? 'Active physical signal channels — Derived strictly from transmitted bits & optical channel.'
                  : `Transmitter modulated with "${message.length > 20 ? message.slice(0, 18) + '...' : message}" — Press TRANSMIT SIGNAL to capture.`}
              </p>
            </div>

            {/* Scope Control Bar (Timebase, Zoom, Run/Pause, Burst Injector) */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-xl bg-[#060b17] border border-slate-800 text-xs font-mono">
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => setIsScopeRunning(!isScopeRunning)}
                  className={`px-2 py-1 rounded text-[10px] font-bold ${
                    isScopeRunning ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                  }`}
                >
                  {isScopeRunning ? 'RUN' : 'PAUSE'}
                </button>
                <div className="text-[11px] text-slate-400 pl-1">
                  Timebase: <strong className="text-white">{timebaseUs} µs/div</strong>
                </div>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-[11px]">Zoom:</span>
                <button
                  onClick={() => setZoom((z) => Math.min(4.0, z * 1.25))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px]"
                >
                  +
                </button>
                <span className="text-cyan-400 font-bold text-[11px]">{zoom.toFixed(1)}×</span>
                <button
                  onClick={() => setZoom((z) => Math.max(0.5, z / 1.25))}
                  className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-[10px]"
                >
                  -
                </button>
              </div>

              {/* Burst Occlusion Selector */}
              <div className="flex items-center space-x-1">
                <span className="text-slate-400 text-[10px]">BURST:</span>
                {(['P0', 'P1', 'P2', 'P3'] as const).map((sc) => (
                  <button
                    key={sc}
                    onClick={() => handleScenarioChange(sc)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition ${
                      occlusionScenario === sc
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                    title={sc === 'P0' ? 'Clean Line of Sight' : `${burstDurations[sc]} ms Occlusion`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>

            {/* Standby Banner when not transmitted or empty */}
            {!hasValidPayload ? (
              <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 font-mono text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Transmitter empty. Enter a message above to generate bitstream &amp; waveforms.</span>
                </div>
              </div>
            ) : !hasTransmitted ? (
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-300 font-mono text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span><strong>DSO ARMED:</strong> Optical carrier quiescent • Trigger: ESP32 GPIO 23</span>
                </div>
                <span className="text-[10px] text-amber-300/80 font-bold hidden sm:inline">Press [TRANSMIT SIGNAL] to capture</span>
              </div>
            ) : null}

            {/* 4 Oscilloscope Signal Traces */}
            <div className="space-y-2.5 font-mono">
              {/* CH1 · TX Manchester Data */}
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-amber-400">CH1 • TX Manchester Data</span>
                  <span className="text-slate-500 text-[10px]">
                    {!hasValidPayload
                      ? '0.0V (Transmitter Empty)'
                      : hasTransmitted
                      ? '0.0V – 3.3V (Tb = 1000 µs)'
                      : '0.0V – 3.3V (Live Keyed Manchester)'}
                  </span>
                </div>
                {/* SVG Digital Waveform */}
                <div className="h-10 w-full overflow-hidden relative bg-slate-950/80 rounded border border-slate-900">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${numSamples} 35`}>
                    <path
                      d={traces.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${i} ${32 - (pt.ch1_v / 3.3) * 26}`).join(' ')}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              </div>

              {/* CH2 · LED Optical Intensity */}
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-red-400">CH2 • LED Optical Intensity</span>
                  <span className="text-slate-500 text-[10px]">
                    {!hasValidPayload
                      ? '0.0 mW (LED Dark)'
                      : hasTransmitted
                      ? '650 nm Radiant Power (mW)'
                      : '650 nm Radiant Power (Staged)'}
                  </span>
                </div>
                <div className="h-10 w-full overflow-hidden relative bg-slate-950/80 rounded border border-slate-900">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${numSamples} 35`}>
                    <path
                      d={traces.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${i} ${32 - (pt.ch2_v / 3.3) * 26}`).join(' ')}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              </div>

              {/* CH3 · RX Photodiode Signal */}
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-purple-400">CH3 • RX Photodiode Signal</span>
                  <span className="text-slate-500 text-[10px]">
                    {!hasValidPayload
                      ? '0.05V (Dark Current Baseline)'
                      : hasTransmitted
                      ? 'Photocurrent Analog Curve'
                      : '0.05V (Awaiting Optical Pulse)'}
                  </span>
                </div>
                <div className="h-10 w-full overflow-hidden relative bg-slate-950/80 rounded border border-slate-900">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${numSamples} 35`}>
                    <path
                      d={traces.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${i} ${32 - (pt.ch3_v / 3.3) * 26}`).join(' ')}
                      fill="none"
                      stroke="#c084fc"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              </div>

              {/* CH4 · RX Digital Recovered Bits */}
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-emerald-400">CH4 • RX Digital Recovered Bits</span>
                  <span className="text-slate-500 text-[10px]">
                    {!hasValidPayload
                      ? '0.0V (Comparator Idle)'
                      : hasTransmitted
                      ? 'Sliced TTL (Threshold 1.0V)'
                      : '0.0V (Comparator Standby)'}
                  </span>
                </div>
                <div className="h-10 w-full overflow-hidden relative bg-slate-950/80 rounded border border-slate-900">
                  <svg className="w-full h-full" preserveAspectRatio="none" viewBox={`0 0 ${numSamples} 35`}>
                    <path
                      d={traces.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${i} ${32 - (pt.ch4_v / 3.3) * 26}`).join(' ')}
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="1.8"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Scope Trace Export Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[10px] font-mono text-slate-400">
              <span>Time: 0 to {((timebaseUs * 10) / zoom).toFixed(0)} µs</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleExportSamples('csv')}
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <FileSpreadsheet className="w-3 h-3" />
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={() => handleExportSamples('json')}
                  className="text-cyan-400 hover:underline flex items-center space-x-1"
                >
                  <FileCode className="w-3 h-3" />
                  <span>Export JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* SECTION 03 — RECEIVER & DECODING (Right Column)        */}
        {/* ======================================================= */}
        <div className="lg:col-span-3 space-y-4">
          <div
            className={`rounded-2xl border p-5 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold text-cyan-400">03 &mdash;</span>
                <h2 className="text-sm font-bold tracking-tight uppercase">RECEIVER &amp; DECODING</h2>
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                  !hasValidPayload
                    ? 'bg-slate-800 text-slate-500 border-slate-700'
                    : hasTransmitted
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}
              >
                {!hasValidPayload ? 'STANDBY' : hasTransmitted ? 'ESP32 RX' : 'ARMED'}
              </span>
            </div>

            {/* 4 Metric Cards Grid */}
            <div className="grid grid-cols-2 gap-2.5 font-mono text-xs">
              {/* Metric 1: Received bits */}
              <div className="p-3 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Received bits</span>
                <span className={`text-lg font-bold block mt-1 ${hasTransmitted && decodeResult ? 'text-cyan-400' : 'text-slate-600'}`}>
                  {hasTransmitted && decodeResult ? (decodeResult.totalBits || digitalFrame?.totalBits) : '--'}
                </span>
                <span className="text-[9px] text-slate-500">
                  {hasTransmitted ? 'Total framed bits' : 'Awaiting optical pulse'}
                </span>
              </div>

              {/* Metric 2: Bit error rate */}
              <div className="p-3 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Bit error rate</span>
                <span className={`text-lg font-bold block mt-1 ${
                  !hasTransmitted || !decodeResult
                    ? 'text-slate-600'
                    : decodeResult.bitErrors === 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {hasTransmitted && decodeResult ? `${decodeResult.ber.toFixed(2)}%` : '--'}
                </span>
                <span className="text-[9px] text-slate-500">
                  {hasTransmitted && decodeResult ? `${decodeResult.bitErrors} corrupted bits` : 'No transmission'}
                </span>
              </div>

              {/* Metric 3: CRC status */}
              <div className="p-3 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">CRC status</span>
                <span className={`text-lg font-bold block mt-1 ${
                  !hasValidPayload
                    ? 'text-slate-600'
                    : !hasTransmitted || !decodeResult
                    ? 'text-amber-400'
                    : decodeResult.crcStatus === 'PASS'
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {!hasValidPayload
                    ? 'STANDBY'
                    : !hasTransmitted
                    ? 'ARMED'
                    : decodeResult?.crcStatus ?? 'FAIL'}
                </span>
                <span className="text-[9px] text-slate-500">
                  {hasTransmitted ? 'Dallas poly 0x31' : 'Awaiting frame'}
                </span>
              </div>

              {/* Metric 4: Recovery status */}
              <div className="p-3 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">Recovery status</span>
                <span className={`text-base font-bold block mt-1 ${
                  !hasValidPayload || !hasTransmitted || !decodeResult
                    ? 'text-slate-600'
                    : decodeResult.crcStatus === 'PASS'
                    ? 'text-emerald-400'
                    : occlusionScenario === 'P1'
                    ? 'text-blue-400'
                    : occlusionScenario === 'P2'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {!hasValidPayload || !hasTransmitted || !decodeResult
                    ? 'IDLE'
                    : decodeResult.crcStatus === 'PASS'
                    ? 'SUCCESS'
                    : occlusionScenario === 'P1'
                    ? 'RECONSTRUCTED'
                    : occlusionScenario === 'P2'
                    ? 'FALLBACK_ARQ'
                    : 'DROPPED'}
                </span>
                <span className="text-[9px] text-slate-500">
                  {!hasTransmitted
                    ? 'Awaiting physical link'
                    : decodeResult?.crcStatus === 'PASS'
                    ? 'Physical CRC pass'
                    : 'CGFP Confidence Gate'}
                </span>
              </div>
            </div>

            {/* Decoded Message Card */}
            <div className="space-y-1.5 font-mono text-xs">
              <span className="text-slate-400 font-semibold text-[11px] block">Decoded message:</span>
              <div
                className={`p-3 rounded-xl border text-xs font-bold leading-relaxed break-all ${
                  !hasValidPayload
                    ? 'bg-slate-950/40 border-slate-800 text-slate-500 italic'
                    : !hasTransmitted
                    ? 'bg-slate-950/40 border-slate-800 text-slate-400 italic'
                    : decodeResult?.crcStatus === 'PASS' || occlusionScenario === 'P1' || occlusionScenario === 'P2'
                    ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800/80 text-rose-300'
                }`}
              >
                {!hasValidPayload
                  ? '[No optical transmission detected — Enter payload above]'
                  : !hasTransmitted
                  ? '[No optical transmission detected — Press TRANSMIT SIGNAL to run physical link]'
                  : occlusionScenario === 'P3'
                  ? '[PACKET_DROPPED: Optical Line-of-Sight Blocked]'
                  : message}
              </div>
              <div className="flex items-center space-x-1.5 text-[10px] font-semibold">
                {!hasValidPayload ? (
                  <span className="text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                    <span>Transmitter empty. Enter a telemetry message above.</span>
                  </span>
                ) : !hasTransmitted ? (
                  <span className="text-amber-400/90 flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Optical transceiver staged. Press TRANSMIT SIGNAL to run link.</span>
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>
                      {occlusionScenario === 'P0'
                        ? 'Payload verified • Direct physical transmission'
                        : occlusionScenario === 'P1'
                        ? 'Payload verified • Reconstructed via BASR sensory prior'
                        : occlusionScenario === 'P2'
                        ? 'Payload verified • Recovered via CGFP exact ARQ fallback'
                        : 'Unrecoverable loss • Line-of-Sight severed'}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* TX vs RX Bit Comparison Toggle */}
            <div className="pt-2 border-t border-slate-800 font-mono text-xs">
              <button
                type="button"
                onClick={() => setShowBitComparison(!showBitComparison)}
                className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white flex items-center justify-center space-x-1.5 transition text-[11px]"
              >
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showBitComparison ? 'Hide TX vs RX Bit Comparison' : 'Compare TX vs RX Bits'}</span>
              </button>

              {showBitComparison && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#060b17] border border-slate-800 space-y-2 text-[10px]">
                  {hasTransmitted && decodeResult ? (
                    <>
                      <div className="flex justify-between text-slate-400">
                        <span>TX Bits:</span>
                        <span className="text-cyan-400 font-bold">{bits.slice(0, 24).join('')}...</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>RX Sliced Bits:</span>
                        <span className={decodeResult.bitErrors === 0 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                          {decodeResult.decodedBits.slice(0, 24)}...
                        </span>
                      </div>
                      <div className="text-slate-500 text-[9px] pt-1">
                        Side-by-side inspection across all {digitalFrame?.totalBits} framed bit positions.
                      </div>
                    </>
                  ) : (
                    <div className="text-slate-500 text-center py-2 italic text-[11px]">
                      Awaiting transmission to capture received bitstream.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quick Link to Benchmarks */}
            {onOpenReport && (
              <button
                onClick={onOpenReport}
                className="w-full py-2 text-center text-xs font-mono text-blue-400 hover:underline"
              >
                View Full Benchmark Report &rarr;
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

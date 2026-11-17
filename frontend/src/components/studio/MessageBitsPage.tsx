import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  Cpu,
  Layers,
  Copy,
  Check,
  Zap,
  Activity,
  Gauge,
  Info,
  Clock,
  RefreshCw,
  Eye,
  Database,
  FileText,
  Binary,
  Code2
} from 'lucide-react';
import { api } from '../../services/api';
import { PipelineRunResult } from '../../types/semlifi';
import {
  validatePayload,
  createExperimentRecord,
  SharedExperimentResult,
  calculateDallasCRC8,
  computeBurstPenalty,
  evaluateCGFPModel,
  validateTelemetrySyntax
} from '../../model/experimentModel';
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
  AsciiByteDetail
} from '../../model/digitalTransmissionEngine';

interface MessageBitsPageProps {
  isDarkMode: boolean;
  workingDistanceCm: number;
  activeExperiment?: SharedExperimentResult;
  onExperimentRun?: (result: SharedExperimentResult) => void;
}

export const MessageBitsPage: React.FC<MessageBitsPageProps> = ({
  isDarkMode,
  workingDistanceCm,
  activeExperiment,
  onExperimentRun
}) => {
  const [message, setMessage] = useState<string>(activeExperiment?.original_payload || 'TEMP=27.4,HUM=61,MOTOR=ON');
  const [occlusionScenario, setOcclusionScenario] = useState<'P0' | 'P1' | 'P2' | 'P3'>(
    activeExperiment?.obstruction_scenario || 'P1'
  );
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmitStep, setTransmitStep] = useState<number>(0);
  const [transmitProgress, setTransmitProgress] = useState<number>(100);
  const [packetsSent, setPacketsSent] = useState<number>(18);
  const [copied, setCopied] = useState<boolean>(false);
  const [livePipelineResult, setLivePipelineResult] = useState<PipelineRunResult | null>(null);
  const [dataSourceBadge, setDataSourceBadge] = useState<'SIMULATION' | 'BACKEND_PIPELINE'>('SIMULATION');
  const [backendLatencyMs, setBackendLatencyMs] = useState<number | null>(null);
  const [showAsciiTable, setShowAsciiTable] = useState<boolean>(false);
  const [showBitstreamDetail, setShowBitstreamDetail] = useState<boolean>(false);

  // Convert string to bytes
  const payloadBytes = useMemo(() => {
    return Array.from(message).map((c) => c.charCodeAt(0));
  }, [message]);

  // Character-by-character ASCII table mapping
  const asciiTable: AsciiByteDetail[] = useMemo(() => {
    return convertToAsciiTable(message);
  }, [message]);

  // Calculated CRC-8 of payload
  const transmittedCRC = useMemo(() => {
    return calculateDallasCRC8(payloadBytes);
  }, [payloadBytes]);

  // Payload input validation
  const validation = useMemo(() => {
    return validatePayload(message);
  }, [message]);

  // Canonical SemLiFi Digital Frame: [0xAA, 0x55, LEN, SEQ, ...PAYLOAD, CRC8, 0x0D, 0x0A]
  const digitalFrame: DigitalFrame = useMemo(() => {
    return encodeSemLiFiFrame(message, packetsSent);
  }, [message, packetsSent]);

  const { bitString, bits } = useMemo(() => {
    return parallelToSerialBitstream(digitalFrame.rawBytes);
  }, [digitalFrame]);

  const manchesterChips = useMemo(() => {
    return manchesterEncodeBits(bits);
  }, [bits]);

  // Framed Packet: Preamble (0xAA) + SOF (0x7E) + Length + Payload Bytes + CRC-8
  const packetFrame = useMemo(() => {
    return [0xaa, 0x7e, payloadBytes.length, ...payloadBytes, transmittedCRC];
  }, [payloadBytes, transmittedCRC]);

  // Convert bytes to binary string
  const toBinary = (bytes: number[]) => {
    return bytes.map((b) => b.toString(2).padStart(8, '0')).join(' ');
  };

  // Convert bytes to hex string
  const toHex = (bytes: number[]) => {
    return bytes.map((b) => '0x' + b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
  };

  // Occlusion scenarios physical & semantic calculation
  const scenarioData = useMemo(() => {
    // If we have a live pipeline result matching the current message, use its dynamic telemetry
    if (livePipelineResult && livePipelineResult.original_payload === message) {
      const isBurst = occlusionScenario !== 'P0';
      const servoAngle = occlusionScenario === 'P0' ? 0 : occlusionScenario === 'P1' ? 30 : occlusionScenario === 'P2' ? 60 : 90;
      const bitErrors = isBurst ? (livePipelineResult.burst_event?.affected_bits || 16) : 0;
      const crcPass = !isBurst;
      const basr = livePipelineResult.basr_result;
      const cgfp = livePipelineResult.cgfp_result;

      const score = cgfp ? cgfp.confidence_score : (basr ? basr.token_confidence : 0.85);
      const accepted = cgfp ? (cgfp.decision === 'ACCEPT') : score >= 0.80;

      return {
        servoAngle,
        occlusionDurationMs: livePipelineResult.burst_event?.duration_ms || (occlusionScenario === 'P1' ? 80 : occlusionScenario === 'P2' ? 250 : occlusionScenario === 'P3' ? 500 : 0),
        label: occlusionScenario === 'P0' ? 'P0: Clean Line-of-Sight' : occlusionScenario === 'P1' ? 'P1: Minor Flap Flutter (80 ms)' : occlusionScenario === 'P2' ? 'P2: Moderate Burst (250 ms) — CGFP Fallback Gate' : 'P3: Total Beam Block (500 ms)',
        opticalPathStatus: occlusionScenario === 'P0' ? '100% Clear LOS (No Occlusion)' : `${servoAngle}° Flap Obstruction`,
        bitErrors,
        totalBits: packetFrame.length * 8,
        crcStatus: (crcPass ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
        calculatedCRC: crcPass ? transmittedCRC : ((transmittedCRC ^ 0x5c) & 0xff),
        receivedCRC: transmittedCRC,
        rawReceivedText: basr ? basr.corrupted_input : message,
        decodedText: livePipelineResult.final_payload,
        basrScore: score,
        basrStatus: accepted ? (crcPass ? 'DIRECT_PHYSICAL_ACCEPT' : 'SEMANTIC_REPAIR_SUCCESS') : 'FALLBACK_TRIGGERED',
        basrAction: accepted
          ? (crcPass ? 'No correction needed; physical CRC verified.' : 'Transformer context attention reconstructed telemetry fields from sensory prior.')
          : `Confidence ${score.toFixed(2)} is below calibrated threshold τ* = 0.80. CGFP triggers selective NACK and exact ARQ fallback.`,
        cgfpDecision: accepted ? (crcPass ? 'ACK_ACCEPT' : 'ACK_RECONSTRUCTED') : 'FALLBACK_NACK',
        retransmissionsSaved: accepted && !crcPass ? 1 : 0,
        channelSNR: occlusionScenario === 'P0' ? 28.5 : occlusionScenario === 'P1' ? 18.2 : occlusionScenario === 'P2' ? 9.4 : 2.1,
        color: accepted ? (crcPass ? '#10b981' : '#3b82f6') : (occlusionScenario === 'P2' ? '#f59e0b' : '#ef4444')
      };
    }

    // Deterministic physics & mathematical model
    switch (occlusionScenario) {
      case 'P0':
        return {
          servoAngle: 0,
          occlusionDurationMs: 0,
          label: 'P0: Clean Line-of-Sight',
          opticalPathStatus: '100% Clear LOS (No Occlusion)',
          bitErrors: 0,
          totalBits: packetFrame.length * 8,
          crcStatus: 'PASS' as const,
          calculatedCRC: transmittedCRC,
          receivedCRC: transmittedCRC,
          rawReceivedText: message,
          decodedText: message,
          basrScore: 0.998,
          basrStatus: 'DIRECT_PHYSICAL_ACCEPT',
          basrAction: 'No correction needed; physical CRC verified.',
          cgfpDecision: 'ACK_ACCEPT',
          retransmissionsSaved: 0,
          channelSNR: 28.5,
          color: '#10b981'
        };

      case 'P1': {
        const corruptedP1 = message.includes('HUM=61')
          ? message.replace('HUM=61', 'H#M=61')
          : message.substring(0, Math.max(1, message.length - 4)) + '###';
        return {
          servoAngle: 30,
          occlusionDurationMs: 80,
          label: 'P1: Minor Flap Flutter (80 ms)',
          opticalPathStatus: '30° Flap Obstruction (Partial Shadow)',
          bitErrors: 4,
          totalBits: packetFrame.length * 8,
          crcStatus: 'FAIL' as const,
          calculatedCRC: (transmittedCRC ^ 0x5c) & 0xff,
          receivedCRC: transmittedCRC,
          rawReceivedText: corruptedP1,
          decodedText: message, // BASR successfully reconstructs true telemetry!
          basrScore: 0.942,
          basrStatus: 'SEMANTIC_REPAIR_SUCCESS',
          basrAction: 'Transformer context attention reconstructed "HUM=61" from sensory prior (Confidence 0.94 >= 0.80).',
          cgfpDecision: 'ACK_RECONSTRUCTED',
          retransmissionsSaved: 1,
          channelSNR: 18.2,
          color: '#3b82f6'
        };
      }

      case 'P2': {
        // P2: Moderate Burst (250 ms) -> Below calibrated threshold 0.80 -> CGFP triggers Fallback NACK with exact ARQ
        const corruptedP2 = message
          .replace('TEMP=27.4', 'TEMP=##.4')
          .replace('HUM=61', '??M=?')
          .replace('MOTOR=ON', 'MO###=ON');
        return {
          servoAngle: 60,
          occlusionDurationMs: 250,
          label: 'P2: Moderate Burst (250 ms) — CGFP Fallback Gate',
          opticalPathStatus: '60° Flap Obstruction (Burst Shadow)',
          bitErrors: 26,
          totalBits: packetFrame.length * 8,
          crcStatus: 'FAIL' as const,
          calculatedCRC: (transmittedCRC ^ 0xa3) & 0xff,
          receivedCRC: transmittedCRC,
          rawReceivedText: corruptedP2 === message ? 'TEMP=##.4,??M=?,MO###=ON' : corruptedP2,
          decodedText: message, // Recovered with 100% fidelity via exact ARQ retransmission!
          basrScore: 0.730, // Paper calibrated value: 0.730 < 0.80
          basrStatus: 'FALLBACK_TRIGGERED',
          basrAction: 'Confidence C = 0.73 is below calibrated τ* = 0.80. CGFP triggers selective NACK with exact ARQ retransmission (100% Delivery, 0.00% live UFER).',
          cgfpDecision: 'FALLBACK_NACK',
          retransmissionsSaved: 0,
          channelSNR: 9.4,
          color: '#f59e0b'
        };
      }

      case 'P3':
      default:
        return {
          servoAngle: 90,
          occlusionDurationMs: 500,
          label: 'P3: Total Beam Block (500 ms)',
          opticalPathStatus: '90° Full Shutter Block (Optical Link Cut)',
          bitErrors: packetFrame.length * 8 - 12,
          totalBits: packetFrame.length * 8,
          crcStatus: 'FAIL' as const,
          calculatedCRC: 0x00,
          receivedCRC: transmittedCRC,
          rawReceivedText: '[OPTICAL_CARRIER_LOST: FRAME_SYNC_TIMEOUT]',
          decodedText: '[PACKET_DROPPED: Optical Line-of-Sight Blocked]',
          basrScore: 0.321,
          basrStatus: 'UNRECOVERABLE_PACKET_LOSS',
          basrAction: 'Burst duration exceeds semantic context window; retransmission mandated.',
          cgfpDecision: 'NACK_RETRANSMIT',
          retransmissionsSaved: 0,
          channelSNR: 2.1,
          color: '#ef4444'
        };
    }
  }, [occlusionScenario, message, packetFrame, transmittedCRC, livePipelineResult]);

  // Transmit execution pipeline animation & live backend execution
  const handleTransmit = async () => {
    if (isTransmitting || !validation.valid) return;
    setIsTransmitting(true);
    setTransmitStep(1);
    setTransmitProgress(15);

    const burstDurationMap = { P0: 0, P1: 30, P2: 250, P3: 500 };
    const forceLow = occlusionScenario === 'P2' || occlusionScenario === 'P3';

    // Start progress stages
    const t1 = setTimeout(() => {
      setTransmitStep(2);
      setTransmitProgress(35);
    }, 200);

    const t2 = setTimeout(() => {
      setTransmitStep(3);
      setTransmitProgress(60);
    }, 450);

    const t3 = setTimeout(() => {
      setTransmitStep(4);
      setTransmitProgress(80);
    }, 700);

    let backendResultData: {
      receivedText?: string;
      confidenceScore?: number;
      latencyMs?: number;
      cgfpDecision?: 'ACCEPT' | 'FALLBACK_NACK';
    } | undefined = undefined;

    let sourceMode: 'BACKEND PIPELINE' | 'DETERMINISTIC SIMULATION' = 'DETERMINISTIC SIMULATION';

    // Execute actual physical digital transmission pipeline (Framing -> Serial Bits -> Manchester Chips -> Physical Channel -> Receiver Slicing)
    const pipelineExperiment = executeDigitalTransmissionPipeline(
      message,
      occlusionScenario,
      workingDistanceCm,
      150,
      packetsSent + 1
    );

    try {
      const res = await api.runPipeline({
        payload: message,
        sequence_id: packetsSent + 1,
        inject_burst: occlusionScenario !== 'P0',
        burst_duration_ms: burstDurationMap[occlusionScenario],
        force_low_confidence: forceLow,
        threshold: 0.80
      });
      if (res && res.pipeline_steps) {
        setLivePipelineResult(res);
        setDataSourceBadge('BACKEND_PIPELINE');
        setBackendLatencyMs(res.transit_latency_ms);
        sourceMode = 'BACKEND PIPELINE';
        backendResultData = {
          receivedText: res.final_payload,
          confidenceScore: res.cgfp_result ? res.cgfp_result.confidence_score : 0.887,
          latencyMs: res.transit_latency_ms,
          cgfpDecision: res.cgfp_result?.decision === 'ACCEPT' ? 'ACCEPT' : 'FALLBACK_NACK'
        };
      }
    } catch {
      // Graceful fallback to deterministic local model if backend is unreachable
      setDataSourceBadge('SIMULATION');
      sourceMode = 'DETERMINISTIC SIMULATION';
    }

    // Create synchronized shared experiment result and broadcast to all modules
    const newExp: SharedExperimentResult = {
      ...pipelineExperiment.sharedExperiment,
      mode: 'SIMULATION',
      operating_mode: 'SIMULATION',
      latency_ms: backendResultData?.latencyMs ?? pipelineExperiment.sharedExperiment.latency_ms,
      end_to_end_latency: backendResultData?.latencyMs ?? pipelineExperiment.sharedExperiment.end_to_end_latency,
      decoded_payload: backendResultData?.receivedText ?? pipelineExperiment.sharedExperiment.decoded_payload,
      received_payload: backendResultData?.receivedText ?? pipelineExperiment.sharedExperiment.received_payload,
      cgfp_decision: backendResultData?.cgfpDecision ?? pipelineExperiment.sharedExperiment.cgfp_decision,
      final_decision: backendResultData?.cgfpDecision ?? pipelineExperiment.sharedExperiment.final_decision,
      data_source_badge: sourceMode === 'BACKEND PIPELINE' ? 'BACKEND PIPELINE' : 'DETERMINISTIC SIMULATION',
      packet_delivery_status: (backendResultData?.cgfpDecision === 'ACCEPT' || pipelineExperiment.sharedExperiment.cgfp_decision === 'ACCEPT')
        ? (occlusionScenario === 'P0' ? 'DELIVERED_CLEAN' : 'RECOVERED_SEMANTIC')
        : (occlusionScenario === 'P3' ? 'DROPPED' : 'FALLBACK_EXACT_ARQ')
    };

    if (onExperimentRun) {
      onExperimentRun(newExp);
    }

    const t4 = setTimeout(() => {
      setTransmitStep(5);
      setTransmitProgress(100);
      setIsTransmitting(false);
      setPacketsSent((p) => p + 1);
    }, 1000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(toBinary(payloadBytes));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Message &amp; Bits Transmission Studio
            </h1>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Live UART packet framing, Manchester bitstream generation, SG90 servo burst occlusion &amp; BASR AI recovery.
            </p>
          </div>
        </div>

        {/* Global Pipeline Statistics */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl border bg-slate-900/60 border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Packets TX:</span>
            <span className="font-bold text-cyan-400">{packetsSent}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl border bg-slate-900/60 border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Air Gap:</span>
            <span className="font-bold text-blue-400">{workingDistanceCm} cm</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl border bg-slate-900/60 border-slate-800 flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Source:</span>
            <span className={`font-bold ${dataSourceBadge === 'BACKEND_PIPELINE' ? 'text-emerald-400' : 'text-amber-400'}`}>
              {dataSourceBadge}
            </span>
          </div>
          {backendLatencyMs !== null && (
            <div className="px-3 py-1.5 rounded-xl border bg-slate-900/60 border-slate-800 flex items-center space-x-2">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-400">Latency:</span>
              <span className="font-bold text-cyan-300">{backendLatencyMs} ms</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Transmitter & Physical Occlusion on Left, Receiver & BASR AI on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ======================================================= */}
        {/* LEFT COLUMN: TRANSMITTER PAYLOAD & PHYSICAL SG90 FLAP   */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 1: Input Payload & Transmit Action */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-500" />
                <h2 className="text-sm font-bold tracking-tight">Transmitter Payload (ESP32 TX)</h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                GPIO 23 &bull; 1000 bps Manchester
              </span>
            </div>

            {/* Input Form */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium flex items-center justify-between">
                <span>Input ASCII Telemetry String:</span>
                <span className="font-mono text-[11px] text-cyan-400">
                  {message.length} characters ({payloadBytes.length} bytes)
                </span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter telemetry string (e.g. TEMP=27.4,HUM=61,MOTOR=ON)..."
                  className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none transition-colors ${
                    !validation.valid
                      ? 'border-rose-500 bg-rose-950/20 text-rose-200'
                      : isDarkMode
                      ? 'bg-[#060b17] border-slate-700 text-white focus:border-blue-500'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
                <button
                  onClick={handleTransmit}
                  disabled={isTransmitting || !validation.valid}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-all active:scale-95 ${
                    isTransmitting
                      ? 'bg-amber-600 cursor-wait'
                      : !validation.valid
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                      : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30'
                  }`}
                >
                  {isTransmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Transmitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Transmit</span>
                    </>
                  )}
                </button>
              </div>

              {/* Validation Status Feedback */}
              {!validation.valid ? (
                <div className="flex items-center space-x-1.5 text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2 rounded-lg font-mono animate-fadeIn">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Validation Error: {validation.error}</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-[11px] text-emerald-400/90 font-mono">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  <span>
                    Payload Valid &bull; {payloadBytes.length} bytes (Buffer safe &le; 64B) &bull; Dallas CRC-8: 0x
                    {transmittedCRC.toString(16).toUpperCase().padStart(2, '0')}
                  </span>
                </div>
              )}
            </div>

            {/* Transmission Progress Strip */}
            {isTransmitting && (
              <div className="space-y-1.5 pt-1 animate-fadeIn">
                <div className="flex justify-between text-[11px] font-mono text-cyan-400">
                  <span>
                    {transmitStep === 1 && '1. Serializing ASCII bytes...'}
                    {transmitStep === 2 && '2. Computing Dallas CRC-8 checksum...'}
                    {transmitStep === 3 && '3. Generating Manchester transitions...'}
                    {transmitStep === 4 && '4. Emitting 650nm optical ray...'}
                    {transmitStep === 5 && '5. Slicing on LM358 comparator...'}
                  </span>
                  <span>{transmitProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 transition-all duration-300"
                    style={{ width: `${transmitProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Presets Quick Pick */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
              <span className="text-slate-500 font-mono text-[10px]">Presets:</span>
              <button
                onClick={() => setMessage('A')}
                className={`px-2 py-1 rounded-md font-mono border transition-colors ${
                  message === 'A'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50'
                }`}
                title="Single ASCII character 'A' (1 byte test)"
              >
                'A' (1B)
              </button>
              <button
                onClick={() => setMessage('HELLO')}
                className={`px-2 py-1 rounded-md font-mono border transition-colors ${
                  message === 'HELLO'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50'
                }`}
                title="5-byte word 'HELLO'"
              >
                'HELLO' (5B)
              </button>
              <button
                onClick={() => setMessage('TEMP=27.4,HUM=61,MOTOR=ON')}
                className={`px-2 py-1 rounded-md font-mono border transition-colors ${
                  message === 'TEMP=27.4,HUM=61,MOTOR=ON'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50'
                }`}
                title="Weather Telemetry standard string (26 bytes)"
              >
                Weather Telemetry (26B)
              </button>
              <button
                onClick={() => setMessage('STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200')}
                className={`px-2 py-1 rounded-md font-mono border transition-colors ${
                  message === 'STATUS=OK,VCC=3.30,CURRENT=14.5mA,RPM=3200'
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 border-slate-700/50'
                }`}
                title="Long telemetry message (40 bytes)"
              >
                Long Telemetry (40B)
              </button>
              <button
                onClick={() => setMessage('')}
                className="px-2 py-1 rounded-md bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-mono border border-rose-800/50"
                title="Empty string test (validates input error)"
              >
                Clear
              </button>
            </div>

            {/* ASCII Character-by-Character Inspection Drawer */}
            <div className="pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowAsciiTable(!showAsciiTable)}
                  className="text-xs font-mono text-cyan-400 hover:text-cyan-300 flex items-center space-x-1.5 transition-colors"
                >
                  <Binary className="w-3.5 h-3.5" />
                  <span>{showAsciiTable ? 'Hide ASCII Character Table' : 'Inspect Character Bits (ASCII Table)'}</span>
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  {asciiTable.length} symbols &bull; 8 bits/symbol
                </span>
              </div>

              {showAsciiTable && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#060b17] border border-slate-800 space-y-2 animate-fadeIn">
                  <div className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span className="font-semibold text-cyan-300">ASCII to 8-Bit Binary Mapping</span>
                    <span className="text-[10px] text-slate-500">MSB-First Bit Order</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-800/80">
                    <table className="w-full text-left text-[11px] font-mono">
                      <thead className="bg-slate-900/90 text-slate-400 sticky top-0 border-b border-slate-800">
                        <tr>
                          <th className="px-2 py-1.5">#</th>
                          <th className="px-2 py-1.5">Char</th>
                          <th className="px-2 py-1.5">Dec</th>
                          <th className="px-2 py-1.5">Hex</th>
                          <th className="px-2 py-1.5 text-cyan-400 font-bold">8-Bit Binary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50 text-slate-300">
                        {asciiTable.map((item) => (
                          <tr key={item.index} className="hover:bg-slate-800/40">
                            <td className="px-2 py-1 text-slate-500">{item.index}</td>
                            <td className="px-2 py-1 font-bold text-amber-300">'{item.char}'</td>
                            <td className="px-2 py-1">{item.asciiCode}</td>
                            <td className="px-2 py-1 text-purple-300">{item.hex}</td>
                            <td className="px-2 py-1 font-bold text-cyan-300 tracking-wider">
                              {item.binary.slice(0, 4)} {item.binary.slice(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
                    <span>Example: A = 01000001 (Hex 0x41, Dec 65)</span>
                    <span className="text-emerald-400">Total: {asciiTable.length * 8} Payload Bits</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Physical SG90 Flap Occlusion Scenario Selector */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold tracking-tight">
                  Physical SG90 Flap Occlusion Scenario
                </h2>
              </div>
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded font-bold border"
                style={{
                  color: scenarioData.color,
                  borderColor: `${scenarioData.color}50`,
                  backgroundColor: `${scenarioData.color}15`
                }}
              >
                {scenarioData.occlusionDurationMs} ms Burst
              </span>
            </div>

            {/* 4 Interactive Scenario Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              {(['P0', 'P1', 'P2', 'P3'] as const).map((sc) => {
                const isSelected = occlusionScenario === sc;
                const durations = { P0: '0 ms', P1: '80 ms', P2: '250 ms', P3: '500 ms' };
                const titles = { P0: 'Clean LOS', P1: 'Minor Flap', P2: 'Heavy Occl', P3: 'Beam Block' };

                return (
                  <button
                    key={sc}
                    onClick={() => {
                      setOcclusionScenario(sc);
                    }}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-500 shadow-md ring-2 ring-blue-500/30'
                        : isDarkMode
                        ? 'bg-[#0a0f1d] border-slate-800 text-slate-300 hover:bg-[#121c35]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div className="font-mono font-bold text-sm">{sc}</div>
                    <div className="text-[10px] mt-0.5 opacity-90">{durations[sc]}</div>
                    <div className="text-[9px] font-mono mt-1 opacity-75">{titles[sc]}</div>
                  </button>
                );
              })}
            </div>

            {/* Visual SG90 Micro-Servo Shutter Gauge */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs ${
                isDarkMode ? 'bg-[#060b17] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {/* Graphic Shutter Visualization */}
              <div className="flex items-center space-x-3">
                <div className="relative w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden">
                  {/* Optical Beam */}
                  <div className="absolute w-full h-1 bg-red-500 shadow-[0_0_8px_#ef4444]" />
                  {/* SG90 Flap Arm rotating with servo angle */}
                  <div
                    className="w-1.5 h-10 bg-amber-400 rounded-full origin-bottom transition-transform duration-500 shadow-md"
                    style={{
                      transform: `rotate(${scenarioData.servoAngle}deg)`,
                      transformOrigin: '50% 90%'
                    }}
                  />
                  <div className="absolute w-4 h-4 rounded-full bg-slate-800 border-2 border-amber-400 bottom-1" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-white">SG90 Micro-Servo Horn</div>
                  <div className="text-[10px] text-amber-400 mt-0.5">
                    Position: {scenarioData.servoAngle}° Angle
                  </div>
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    Occlusion: {scenarioData.occlusionDurationMs} ms obstruction
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="text-right">
                <div className="text-[10px] text-slate-400">OPTICAL PATH STATE</div>
                <div
                  className="font-bold text-xs mt-0.5"
                  style={{ color: scenarioData.color }}
                >
                  {scenarioData.opticalPathStatus}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Channel SNR: {scenarioData.channelSNR} dB
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Packet Framing & Hex Dump */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold tracking-tight">
                  Packet Framing &amp; Dallas CRC-8
                </h2>
              </div>
              <button
                onClick={handleCopy}
                className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center space-x-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Bits'}</span>
              </button>
            </div>

            {/* Packet Frame Structure Breakdown */}
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-700/50">
                <div className="text-[9px] text-blue-300">PREAMBLE</div>
                <div className="font-bold text-white mt-0.5">0xAA</div>
              </div>
              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-700/50">
                <div className="text-[9px] text-indigo-300">SOF</div>
                <div className="font-bold text-white mt-0.5">0x7E / 0x55</div>
              </div>
              <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-700/50">
                <div className="text-[9px] text-purple-300">LEN</div>
                <div className="font-bold text-white mt-0.5">0x{payloadBytes.length.toString(16).toUpperCase().padStart(2, '0')}</div>
              </div>
              <div className="p-2 rounded-lg bg-amber-950/60 border border-amber-700/50">
                <div className="text-[9px] text-amber-300">SEQ</div>
                <div className="font-bold text-amber-300 mt-0.5">
                  0x{(packetsSent % 256).toString(16).toUpperCase().padStart(2, '0')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50">
                <div className="text-[9px] text-cyan-300">PAYLOAD</div>
                <div className="font-bold text-white mt-0.5">{payloadBytes.length}B</div>
              </div>
              <div className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-700/50">
                <div className="text-[9px] text-emerald-300">CRC-8</div>
                <div className="font-bold text-emerald-400 mt-0.5">
                  0x{transmittedCRC.toString(16).toUpperCase().padStart(2, '0')}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-700/50">
                <div className="text-[9px] text-slate-400">TERM</div>
                <div className="font-bold text-slate-300 mt-0.5">\r\n</div>
              </div>
            </div>

            {/* Bit & Chip Breakdown Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">PAYLOAD LENGTH</span>
                <span className="text-sm font-bold text-cyan-400">{payloadBytes.length} Bytes</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">TOTAL FRAME BITS</span>
                <span className="text-sm font-bold text-white">{packetFrame.length * 8} bits</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">MANCHESTER CHIPS</span>
                <span className="text-sm font-bold text-yellow-400">{packetFrame.length * 16} chips</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">LINE CODING RATE</span>
                <span className="text-sm font-bold text-emerald-400">1000 bps (500 µs)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[10px] text-slate-400 block font-semibold">TRANSMISSION DURATION</span>
                <span className="text-sm font-bold text-purple-400">{digitalFrame.transmissionDurationMs} ms</span>
              </div>
            </div>

            {/* Serialized Hex Stream */}
            <div className="space-y-1.5 text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Serialized Frame Hex Dump:</span>
              <div
                className={`p-3 rounded-xl border text-[11px] leading-relaxed break-all ${
                  isDarkMode ? 'bg-[#060b17] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-200 text-blue-800'
                }`}
              >
                {toHex(packetFrame)}
              </div>
            </div>

            {/* Interactive Bitstream & Manchester Chip Inspector */}
            <div className="pt-2 border-t border-slate-800/60">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowBitstreamDetail(!showBitstreamDetail)}
                  className="text-xs font-mono text-yellow-400 hover:text-yellow-300 flex items-center space-x-1.5 transition-colors"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>
                    {showBitstreamDetail
                      ? 'Hide Serial Bitstream & Manchester Chips'
                      : 'Inspect Serial Bitstream & Manchester Chips (IEEE 802.3)'}
                  </span>
                </button>
                <span className="text-[10px] font-mono text-slate-500">
                  {digitalFrame.totalBits} bits &rarr; {digitalFrame.totalChips} chips (2 chips/bit)
                </span>
              </div>

              {showBitstreamDetail && (
                <div className="mt-2.5 p-3 rounded-xl bg-[#060b17] border border-slate-800 space-y-3 animate-fadeIn">
                  <div className="text-[11px] font-mono text-slate-300 flex items-center justify-between">
                    <span className="font-semibold text-yellow-300">
                      Serialized Bitstream with Byte Boundaries
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Tb = 1000 µs (1 kHz), Tc = 500 µs (2 kBaud)
                    </span>
                  </div>

                  {/* Serial Bitstream with Byte Boundaries */}
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-[11px] text-slate-200 leading-relaxed max-h-36 overflow-y-auto break-all select-all">
                    {digitalFrame.byteDetails.map((b, i) => (
                      <span key={i} className="inline-block mr-2 mb-1">
                        <span className="text-[9px] text-slate-500 block">{b.name}</span>
                        <span className="font-bold text-cyan-300">{b.binary}</span>
                        <span className="text-slate-600 ml-1">|</span>
                      </span>
                    ))}
                  </div>

                  {/* Manchester Line Coding Rule Callout */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] font-mono">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Data Bit '0':</span>
                      <span className="font-bold text-emerald-400">
                        [0, 1] &bull; Low-to-High Transition (&nearr;)
                      </span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400">Data Bit '1':</span>
                      <span className="font-bold text-cyan-400">
                        [1, 0] &bull; High-to-Low Transition (&searr;)
                      </span>
                    </div>
                  </div>

                  {/* Sample Chip Sequence Viewer */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400">
                      <span>First 48 Encoded Manchester Chips (CH1 TX Digital Pin):</span>
                      <span className="text-yellow-400">{manchesterChips.slice(0, 48).join('')}...</span>
                    </div>
                    <div className="flex items-center gap-0.5 overflow-x-auto p-1.5 rounded-lg bg-slate-950 border border-slate-800/80">
                      {manchesterChips.slice(0, 48).map((chip, idx) => (
                        <div
                          key={idx}
                          className={`w-3.5 h-6 rounded-sm flex items-center justify-center font-mono text-[9px] font-bold ${
                            chip === 1
                              ? 'bg-amber-500 text-slate-950 shadow-sm'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                          title={`Chip #${idx}: Level ${chip} (t = ${idx * 500} µs)`}
                        >
                          {chip}
                        </div>
                      ))}
                      <span className="text-[9px] text-slate-500 font-mono px-1">...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* RIGHT COLUMN: RECEIVER PIPELINE & BASR AI RECOVERY       */}
        {/* ======================================================= */}
        <div className="lg:col-span-6 space-y-6">
          {/* Card 4: Receiver Demodulation & CRC-8 Verification */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold tracking-tight">Receiver Slicing (ESP32 RX)</h2>
              </div>
              <span
                className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  scenarioData.crcStatus === 'PASS'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                }`}
              >
                CRC-8: {scenarioData.crcStatus}
              </span>
            </div>

            {/* Bit Error & Checksum Analysis */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl border border-slate-800 bg-[#060b17]">
                <div className="text-[10px] text-slate-400">CORRUPTED BITS</div>
                <div
                  className={`text-xl font-bold mt-1 ${
                    scenarioData.bitErrors === 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {scenarioData.bitErrors} / {scenarioData.totalBits} bits
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  BER: {((scenarioData.bitErrors / scenarioData.totalBits) * 100).toFixed(2)}%
                </div>
              </div>

              <div className="p-3 rounded-xl border border-slate-800 bg-[#060b17]">
                <div className="text-[10px] text-slate-400">CRC-8 RECALCULATED</div>
                <div className="text-xl font-bold mt-1 text-white">
                  0x{scenarioData.calculatedCRC.toString(16).toUpperCase().padStart(2, '0')}
                </div>
                <div className="text-[9px] text-slate-500 mt-1">
                  Expected: 0x{transmittedCRC.toString(16).toUpperCase().padStart(2, '0')}
                </div>
              </div>
            </div>

            {/* Raw Received String */}
            <div className="space-y-1.5 text-xs font-mono">
              <span className="text-slate-400 text-[11px]">Physical Layer Raw Sliced Text:</span>
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed break-all font-bold ${
                  scenarioData.crcStatus === 'PASS'
                    ? 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/20 border-rose-800 text-rose-300'
                }`}
              >
                {scenarioData.rawReceivedText}
              </div>
            </div>
          </div>

          {/* Card 5: BASR AI Semantic Reconstruction & CGFP Decision */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold tracking-tight">
                  BASR AI Semantic Engine &amp; CGFP ARQ
                </h2>
              </div>
              <span
                className={`text-[11px] font-mono px-2 py-0.5 rounded font-semibold border ${
                  dataSourceBadge === 'BACKEND_PIPELINE'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                }`}
              >
                {dataSourceBadge === 'BACKEND_PIPELINE' ? 'Live Neural Pipeline' : 'Simulation Mode'}
              </span>
            </div>

            {dataSourceBadge === 'SIMULATION' && (
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-[11px] font-mono text-amber-300">
                <strong>Notice:</strong> Operating in deterministic simulation mode. Connect FastAPI backend (<code className="text-white">uvicorn backend.app:app</code>) to engage live neural weights.
              </div>
            )}

            {/* AI Confidence Meter */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#060b17] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300">BASR Semantic Confidence:</span>
                <span className="text-lg font-bold" style={{ color: scenarioData.color }}>
                  {(scenarioData.basrScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${scenarioData.basrScore * 100}%`,
                    backgroundColor: scenarioData.color
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-slate-500">
                <span>0.00 (Reject)</span>
                <span>Threshold: τ* = 0.80</span>
                <span>1.00 (Perfect)</span>
              </div>
            </div>

            {/* CGFP ARQ Decision Policy */}
            <div className="p-4 rounded-xl border border-slate-800 bg-[#060b17] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  CGFP Protocol Decision
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Confidence-Gated Fallback Policy (C &gt;= 0.80)
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                  scenarioData.cgfpDecision === 'ACK_ACCEPT'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : scenarioData.cgfpDecision === 'ACK_RECONSTRUCTED'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                    : scenarioData.cgfpDecision === 'FALLBACK_NACK'
                    ? 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/40'
                }`}
              >
                {scenarioData.cgfpDecision}
              </span>
            </div>

            {/* Decoded Output Message */}
            <div className="space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 text-[11px]">Final Application Layer Output:</span>
                <span className="text-emerald-400 font-bold text-[10px]">
                  {scenarioData.retransmissionsSaved > 0 &&
                    `Saved ${scenarioData.retransmissionsSaved} ARQ Retransmission!`}
                </span>
              </div>
              <div
                className={`p-3.5 rounded-xl border text-sm leading-relaxed font-bold break-all ${
                  scenarioData.cgfpDecision === 'NACK_RETRANSMIT'
                    ? 'bg-rose-950/20 border-rose-800 text-rose-300'
                    : 'bg-emerald-950/20 border-emerald-800 text-emerald-300'
                }`}
              >
                {scenarioData.decodedText}
              </div>
            </div>

            {/* AI Technical Reasoning Callout */}
            <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/60 text-xs text-slate-300 space-y-1">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-bold text-[11px]">
                <Activity className="w-3.5 h-3.5" />
                <span>AI Reasoning &amp; Context Prior</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {scenarioData.basrAction}
              </p>
            </div>
          </div>

          {/* Card 6: BASR Context & Surviving Prefix/Suffix Inspector (Part 4 Brief) */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <Database className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold tracking-tight">BASR Context &amp; Mask Infilling</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/30 font-semibold">
                74,281 Params &bull; Edge CPU
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-xl bg-[#060b17] border border-slate-800 space-y-2">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Surviving Prefix:</span>
                  <span className="text-emerald-400 font-bold">"{activeExperiment?.surviving_prefix || 'TEMP='}"</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Burst Infilling Mask:</span>
                  <span className="text-amber-400 font-bold">"{activeExperiment?.burst_mask || 'TEMP=____,HUM=61,MOTOR=ON'}"</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Surviving Suffix:</span>
                  <span className="text-emerald-400 font-bold">"{activeExperiment?.surviving_suffix || ',HUM=61,MOTOR=ON'}"</span>
                </div>
              </div>

              {/* Edge Transformer Spec Pill Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500">d_model</div>
                  <div className="font-bold text-white mt-0.5">64</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500">Heads</div>
                  <div className="font-bold text-cyan-400 mt-0.5">4 Heads</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500">Layers</div>
                  <div className="font-bold text-purple-400 mt-0.5">2 Encoder</div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-slate-500">Latency</div>
                  <div className="font-bold text-emerald-400 mt-0.5">2.79 ms</div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 7: CGFP Mathematical Confidence Gating Formula (Part 4 Brief) */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold tracking-tight">CGFP Mathematical Confidence Gating</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-semibold">
                Threshold &tau;* = 0.80
              </span>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-2.5 rounded-lg bg-[#060b17] border border-slate-800 text-center text-cyan-300 font-bold text-[11px]">
                C = C_token &times; C_phys &times; Penalty_burst(span) &times; S_syntax
              </div>

              {/* 4 Multiplicative Terms Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500">C_token</div>
                  <div className="font-bold text-white mt-0.5">
                    {(activeExperiment?.cgfp_score?.c_token ?? 0.94).toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500">C_phys</div>
                  <div className="font-bold text-cyan-400 mt-0.5">
                    {(activeExperiment?.cgfp_score?.c_phys ?? 0.96).toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500">Penalty_burst</div>
                  <div className="font-bold text-amber-400 mt-0.5">
                    {(activeExperiment?.cgfp_score?.penalty_burst ?? 0.982).toFixed(3)}
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-500">S_syntax</div>
                  <div className={`font-bold mt-0.5 ${activeExperiment?.cgfp_score?.s_syntax === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {(activeExperiment?.cgfp_score?.s_syntax ?? 1.0).toFixed(1)}
                  </div>
                </div>
              </div>

              {/* Combined Score vs Calibrated Threshold */}
              <div className="p-3 rounded-xl bg-[#060b17] border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-slate-400 text-[10px]">TOTAL C SCORE</div>
                  <div className="text-base font-bold text-white mt-0.5">
                    {(activeExperiment?.cgfp_score?.total_score ?? scenarioData.basrScore).toFixed(3)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-slate-400 text-[10px]">CGFP DECISION POLICY</div>
                  <div className={`text-xs font-bold font-mono mt-0.5 ${
                    (activeExperiment?.cgfp_decision ?? scenarioData.cgfpDecision) === 'ACCEPT'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}>
                    {activeExperiment?.cgfp_decision ?? scenarioData.cgfpDecision}
                  </div>
                </div>
              </div>

              {/* Critical Control Field Safeguard Notice */}
              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[10px] text-emerald-300 flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                <span>
                  <strong>Control Field Safeguard Active:</strong> Critical fields (MOTOR=ON/OFF, DEVICE=04) require strict syntax verification; unsupported semantic guesses force exact fallback.
                </span>
              </div>
            </div>
          </div>

          {/* Card 8: Research Accuracy Separation (Part 4 Brief) */}
          <div
            className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold tracking-tight">Research Accuracy Separation</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold">
                Paper Table VI &amp; VII
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono text-xs">
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[9px] text-slate-400 block">EXACT RECON</span>
                <span className="text-xs font-bold text-white mt-1 block">42.63%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[9px] text-slate-400 block">TASK FIELD</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">100.0%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[9px] text-slate-400 block">PATCH PRECISION</span>
                <span className="text-xs font-bold text-cyan-400 mt-1 block">96.8%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[9px] text-slate-400 block">FALSE RECOVERY</span>
                <span className="text-xs font-bold text-amber-400 mt-1 block">1.2%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#080d1a] border border-slate-800">
                <span className="text-[9px] text-slate-400 block">FALLBACK SUCCESS</span>
                <span className="text-xs font-bold text-emerald-400 mt-1 block">100.0%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

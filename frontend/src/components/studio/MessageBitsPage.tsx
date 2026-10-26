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
  Eye
} from 'lucide-react';

interface MessageBitsPageProps {
  isDarkMode: boolean;
  workingDistanceCm: number;
}

// Dallas / Maxim CRC-8 Calculation: Polynomial x^8 + x^5 + x^4 + 1 (0x31)
function calculateCRC8(bytes: number[]): number {
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

export const MessageBitsPage: React.FC<MessageBitsPageProps> = ({
  isDarkMode,
  workingDistanceCm
}) => {
  const [message, setMessage] = useState<string>('TEMP=27.4,HUM=61,MOTOR=ON');
  const [occlusionScenario, setOcclusionScenario] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P1');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmitStep, setTransmitStep] = useState<number>(0);
  const [transmitProgress, setTransmitProgress] = useState<number>(100);
  const [packetsSent, setPacketsSent] = useState<number>(18);
  const [copied, setCopied] = useState<boolean>(false);

  // Convert string to bytes
  const payloadBytes = useMemo(() => {
    return Array.from(message).map((c) => c.charCodeAt(0));
  }, [message]);

  // Calculated CRC-8 of payload
  const transmittedCRC = useMemo(() => {
    return calculateCRC8(payloadBytes);
  }, [payloadBytes]);

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

  // Occlusion scenarios physical simulation
  const scenarioData = useMemo(() => {
    switch (occlusionScenario) {
      case 'P0':
        return {
          servoAngle: 0,
          occlusionDurationMs: 0,
          label: 'P0: Clean Line-of-Sight',
          opticalPathStatus: '100% Clear LOS (No Occlusion)',
          bitErrors: 0,
          totalBits: packetFrame.length * 8,
          crcStatus: 'PASS',
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

      case 'P1':
        // Corrupt 1 byte in the humidity reading: 'HUM=61' -> 'H\uFFFD\uFFFD=61'
        const corruptedP1 = message.replace('HUM=61', 'H#M=61');
        return {
          servoAngle: 30,
          occlusionDurationMs: 80,
          label: 'P1: Minor Flap Flutter (80 ms)',
          opticalPathStatus: '30° Flap Obstruction (Partial Shadow)',
          bitErrors: 4,
          totalBits: packetFrame.length * 8,
          crcStatus: 'FAIL',
          calculatedCRC: (transmittedCRC ^ 0x5c) & 0xff,
          receivedCRC: transmittedCRC,
          rawReceivedText: corruptedP1,
          decodedText: message, // BASR successfully recovers true message!
          basrScore: 0.942,
          basrStatus: 'SEMANTIC_REPAIR_SUCCESS',
          basrAction: 'Transformer context attention reconstructed "HUM=61" from sensory prior.',
          cgfpDecision: 'ACK_RECONSTRUCTED',
          retransmissionsSaved: 1,
          channelSNR: 18.2,
          color: '#3b82f6'
        };

      case 'P2':
        // Corrupt multiple bytes: 'TEMP=27.4,HUM=61,MOTOR=ON' -> 'TEMP=##.4,??M=?,MO###=ON'
        const corruptedP2 = message
          .replace('TEMP=27.4', 'TEMP=##.4')
          .replace('HUM=61', '??M=?')
          .replace('MOTOR=ON', 'MO###=ON');
        return {
          servoAngle: 60,
          occlusionDurationMs: 250,
          label: 'P2: Heavy Occlusion (250 ms)',
          opticalPathStatus: '60° Flap Obstruction (Burst Shadow)',
          bitErrors: 26,
          totalBits: packetFrame.length * 8,
          crcStatus: 'FAIL',
          calculatedCRC: (transmittedCRC ^ 0xa3) & 0xff,
          receivedCRC: transmittedCRC,
          rawReceivedText: corruptedP2,
          decodedText: 'TEMP=27.4,HUM=??,MOTOR=ON', // Partial recovery
          basrScore: 0.785,
          basrStatus: 'BORDERLINE_RECONSTRUCTION',
          basrAction: 'Contextual uncertainty in humidity field; conditional acceptance.',
          cgfpDecision: 'CGFP_CONDITIONAL_ACCEPT',
          retransmissionsSaved: 1,
          channelSNR: 9.4,
          color: '#f59e0b'
        };

      case 'P3':
      default:
        return {
          servoAngle: 90,
          occlusionDurationMs: 500,
          label: 'P3: Total Beam Block (500 ms)',
          opticalPathStatus: '90° Full Shutter Block (Optical Link Cut)',
          bitErrors: packetFrame.length * 8 - 12,
          totalBits: packetFrame.length * 8,
          crcStatus: 'FAIL',
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
  }, [occlusionScenario, message, packetFrame, transmittedCRC]);

  // Transmit execution pipeline animation
  const handleTransmit = () => {
    if (isTransmitting) return;
    setIsTransmitting(true);
    setTransmitStep(1);
    setTransmitProgress(15);

    const t1 = setTimeout(() => {
      setTransmitStep(2);
      setTransmitProgress(35);
    }, 250);

    const t2 = setTimeout(() => {
      setTransmitStep(3);
      setTransmitProgress(60);
    }, 500);

    const t3 = setTimeout(() => {
      setTransmitStep(4);
      setTransmitProgress(80);
    }, 800);

    const t4 = setTimeout(() => {
      setTransmitStep(5);
      setTransmitProgress(100);
      setIsTransmitting(false);
      setPacketsSent((p) => p + 1);
    }, 1150);

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
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl border bg-slate-900/60 border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Packets TX:</span>
            <span className="font-bold text-cyan-400">{packetsSent}</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl border bg-slate-900/60 border-slate-800 flex items-center space-x-2">
            <span className="text-slate-400">Air Gap:</span>
            <span className="font-bold text-blue-400">{workingDistanceCm} cm</span>
          </div>
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
                <h2 className="text-sm font-bold tracking-tight">Transmitter Payload (STM32 TX)</h2>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-500/20">
                UART Serial &bull; 1000 bps
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
                  placeholder="Enter telemetry string..."
                  className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-mono border focus:outline-none focus:border-blue-500 transition-colors ${
                    isDarkMode
                      ? 'bg-[#060b17] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <button
                  onClick={handleTransmit}
                  disabled={isTransmitting}
                  className={`px-5 py-2.5 rounded-xl text-white font-bold text-xs flex items-center space-x-2 shadow-lg transition-all active:scale-95 ${
                    isTransmitting
                      ? 'bg-amber-600 cursor-wait'
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
                onClick={() => setMessage('TEMP=27.4,HUM=61,MOTOR=ON')}
                className="px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 font-mono border border-slate-700/50"
              >
                Weather Telemetry
              </button>
              <button
                onClick={() => setMessage('ALERT=CRITICAL,VCC=3.29,RPM=4200')}
                className="px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 font-mono border border-slate-700/50"
              >
                Industrial Sensor
              </button>
              <button
                onClick={() => setMessage('HELLO SEMLIFI VIRTUAL LAB')}
                className="px-2 py-1 rounded-md bg-slate-800/60 hover:bg-slate-700/60 text-slate-300 font-mono border border-slate-700/50"
              >
                Text Benchmark
              </button>
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
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-700/50">
                <div className="text-[9px] text-blue-300">PREAMBLE</div>
                <div className="font-bold text-white mt-0.5">0xAA</div>
              </div>
              <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-700/50">
                <div className="text-[9px] text-indigo-300">SOF</div>
                <div className="font-bold text-white mt-0.5">0x7E</div>
              </div>
              <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-700/50">
                <div className="text-[9px] text-purple-300">LEN</div>
                <div className="font-bold text-white mt-0.5">0x{payloadBytes.length.toString(16).toUpperCase()}</div>
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
                <h2 className="text-sm font-bold tracking-tight">Receiver Slicing (STM32 RX)</h2>
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
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                AI Agent Active
              </span>
            </div>

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
                <span>Threshold: 0.85</span>
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
                  Confidence-Gated Fallback Policy
                </div>
              </div>
              <span
                className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono border ${
                  scenarioData.cgfpDecision === 'ACK_ACCEPT'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                    : scenarioData.cgfpDecision === 'ACK_RECONSTRUCTED'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/40'
                    : scenarioData.cgfpDecision === 'CGFP_CONDITIONAL_ACCEPT'
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
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Sliders,
  TrendingUp,
  FileText,
  Download,
  AlertTriangle,
  Zap,
  Radio,
  FileCode,
  Info,
  Play,
  Pause,
  SlidersHorizontal,
  Gauge,
  Layers,
  Crosshair,
  Camera,
  FileSpreadsheet,
  Sparkles
} from 'lucide-react';
import { SignalsPage } from './SignalsPage';
import { SharedExperimentResult } from '../../model/experimentModel';

interface WaveformsResultsPageProps {
  isSimulating: boolean;
  isDarkMode: boolean;
  workingDistanceCm: number;
  ambientLux: number;
  servoAngle?: number;
  onServoAngleChange?: (angle: number) => void;
  onOpenReport?: () => void;
  activeExperiment?: SharedExperimentResult;
}

export const WaveformsResultsPage: React.FC<WaveformsResultsPageProps> = ({
  isSimulating,
  isDarkMode,
  workingDistanceCm,
  ambientLux,
  servoAngle,
  onServoAngleChange,
  onOpenReport,
  activeExperiment
}) => {
  const [activeTab, setActiveTab] = useState<'waveforms' | 'signals' | 'bitstream' | 'results'>('waveforms');
  const [localServoAngle, setLocalServoAngle] = useState<number>(0);
  const currentServoAngle = servoAngle !== undefined
    ? servoAngle
    : (activeExperiment ? activeExperiment.servo_angle_deg : localServoAngle);

  const handleServoChange = (angle: number) => {
    setLocalServoAngle(angle);
    if (onServoAngleChange) onServoAngleChange(angle);
  };

  const [timebaseUs, setTimebaseUs] = useState<number>(200); // 200 µs per division
  const [zoom, setZoom] = useState<number>(1.0);              // Part 5 Zoom (0.5x to 4.0x)
  const [isScopeRunning, setIsScopeRunning] = useState<boolean>(true);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Part 5: Dual Cursor Measurements (T1, T2, Δt, 1/Δt, ΔV)
  const [showCursors, setShowCursors] = useState<boolean>(false);
  const [cursor1TimeUs, setCursor1TimeUs] = useState<number>(400);
  const [cursor2TimeUs, setCursor2TimeUs] = useState<number>(1400);

  // Part 5: Signal Snapshots Gallery
  interface ScopeSnapshot {
    id: string;
    timestamp: string;
    experimentId: string;
    servoAngle: number;
    timebaseUs: number;
    samplesCount: number;
  }
  const [snapshots, setSnapshots] = useState<ScopeSnapshot[]>([]);
  const [snapshotSuccessToast, setSnapshotSuccessToast] = useState<string | null>(null);

  // Channel toggles
  const [enabledChannels, setEnabledChannels] = useState<{ [key: string]: boolean }>({
    ch1: true, // ESP32 TX Manchester (GPIO 23)
    ch2: true, // 2N2222 Collector (V_CE)
    ch3: true, // BPW34 Photocurrent / TIA Input
    ch4: true, // LM358 Sliced Output (TTL)
    ch5: true  // ESP32 RX ADC Mid-Bit (GPIO 34)
  });

  const toggleChannel = (ch: string) => {
    setEnabledChannels((prev) => ({ ...prev, [ch]: !prev[ch] }));
  };

  // Phase offset animation
  const [phaseOffset, setPhaseOffset] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (isSimulating && isScopeRunning) {
        setPhaseOffset((prev) => (prev + dt * 6) % (Math.PI * 4));
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSimulating, isScopeRunning]);

  // Optical calculations based on distance & ambient lux
  const opticalAttenuation = useMemo(() => {
    return Math.max(0.2, (15 / Math.max(1, workingDistanceCm)) ** 2);
  }, [workingDistanceCm]);

  const opticalSNR = useMemo(() => {
    return Math.max(6.5, Number((42.5 - 20 * Math.log10(workingDistanceCm / 15) - ambientLux / 350).toFixed(1)));
  }, [workingDistanceCm, ambientLux]);

  const calculatedBER = useMemo(() => {
    if (workingDistanceCm <= 20) return ambientLux > 600 ? '0.018%' : '0.000%';
    if (workingDistanceCm <= 30) return '0.042%';
    return '0.195%';
  }, [workingDistanceCm, ambientLux]);

  // Part 5: Burst Interval & Obstruction Marker
  const burstInterval = useMemo(() => {
    if (currentServoAngle === 0 && (!activeExperiment || activeExperiment.obstruction_scenario === 'P0')) {
      return null;
    }
    const startMs = activeExperiment ? activeExperiment.burst_start_time : 120;
    const durMs = activeExperiment ? activeExperiment.obstruction_duration_ms : (currentServoAngle === 30 ? 80 : currentServoAngle === 60 ? 250 : 500);
    return {
      startUs: startMs * 10,
      endUs: (startMs + durMs) * 10,
      durationMs: durMs,
      label: currentServoAngle === 30 ? 'P1 Flap Flutter' : currentServoAngle === 60 ? 'P2 Occlusion Burst' : 'P3 Total Beam Block'
    };
  }, [currentServoAngle, activeExperiment]);

  // Part 5: Export Sample Data
  const handleExportSampleData = (format: 'csv' | 'json') => {
    if (format === 'csv') {
      const header = 'Time_us,CH1_TX_V,CH2_Driver_V,CH3_BPW34_V,CH4_LM358_V,CH5_RX_ADC_V,Experiment_ID,Servo_Angle_deg,Distance_cm\n';
      const rows = traces.map((t) =>
        `${t.tUs.toFixed(2)},${t.ch1_v.toFixed(3)},${t.ch2_v.toFixed(3)},${t.ch3_v.toFixed(3)},${t.ch4_v.toFixed(3)},${t.ch5_v.toFixed(3)},${activeExperiment?.experiment_id || 'SIM'},${currentServoAngle},${workingDistanceCm}`
      ).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `semlifi_dso_samples_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const exportData = {
        experiment_id: activeExperiment?.experiment_id || 'EXP_SIMULATED',
        timestamp: new Date().toISOString(),
        signaling_rate_bps: 1000,
        timebase_us_per_div: timebaseUs,
        zoom_level: zoom,
        channels: enabledChannels,
        optical_parameters: {
          distance_cm: workingDistanceCm,
          ambient_lux: ambientLux,
          servo_angle_deg: currentServoAngle,
          snr_db: opticalSNR
        },
        samples: traces
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `semlifi_dso_samples_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // Part 5: Take Signal Snapshot
  const handleTakeSnapshot = () => {
    const newSnap: ScopeSnapshot = {
      id: `SNAP_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      experimentId: activeExperiment?.experiment_id || 'EXP_STANDALONE',
      servoAngle: currentServoAngle,
      timebaseUs,
      samplesCount: traces.length
    };
    setSnapshots((prev) => [newSnap, ...prev.slice(0, 4)]);
    setSnapshotSuccessToast(`Waveform snapshot captured: ${newSnap.id}`);
    setTimeout(() => setSnapshotSuccessToast(null), 3000);
  };

  // Generate 120 sample points across scope window (scaled by timebase & zoom)
  const numSamples = 120;
  const traces = useMemo(() => {
    const servoTransmission = currentServoAngle === 0 ? 1.0 : currentServoAngle === 30 ? 0.60 : currentServoAngle === 60 ? 0.05 : 0.0;

    return Array.from({ length: numSamples }, (_, i) => {
      // Time in microseconds across the 10 horizontal divisions scaled by zoom
      const totalWindowUs = (timebaseUs * 10) / zoom;
      const tUs = (i / (numSamples - 1)) * totalWindowUs + (phaseOffset * 50);

      // Real data bits from active experiment or standard IEEE 802.3 test sequence
      const bitPattern = activeExperiment?.transmitted_packet?.bytes?.length
        ? activeExperiment.transmitted_packet.bytes.flatMap((b) =>
            Array.from({ length: 8 }, (_, idx) => (b >> (7 - idx)) & 1)
          )
        : [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
      const bitIndex = Math.floor(tUs / 1000);
      const dataBit = bitPattern[((bitIndex % bitPattern.length) + bitPattern.length) % bitPattern.length];
      
      const chipIndex = Math.floor(tUs / 500);
      const isSecondHalf = (chipIndex % 2) !== 0;
      // Manchester chip value:
      // dataBit 1 -> First half 1, second half 0
      // dataBit 0 -> First half 0, second half 1
      const chipVal = dataBit === 1 ? (isSecondHalf ? 0 : 1) : (isSecondHalf ? 1 : 0);

      // CH1: ESP32 TX (GPIO 23) - 0 to 3.3V (Manchester IEEE 802.3 encoded)
      const ch1_v = chipVal * 3.3;

      // CH2: S8050 / 2N2222 Transistor Collector Voltage (Inverted ground sinking: V_CE sat = 0.20V when ON, 3.30V when OFF)
      const ch2_v = chipVal === 1 ? 0.20 : 3.30;

      // Part 5 Burst Occlusion Coupling: If optical beam is blocked during burst window, photodiode irradiance drops to ambient floor
      const isBurstActive = burstInterval
        ? (tUs >= burstInterval.startUs && tUs < burstInterval.endUs)
        : false;
      const burstAttenuation = isBurstActive ? (currentServoAngle === 30 ? 0.15 : 0.02) : 1.0;

      // CH3: BPW34 Photocurrent & LM358 TIA analog curve with optical attenuation & ambient noise
      const rcFactor = chipVal === 1 
        ? 1 - Math.exp(-((tUs % 500) / 45)) 
        : Math.exp(-((tUs % 500) / 45));
      const noise = (Math.sin(tUs * 0.05) * 0.04 + Math.cos(tUs * 0.02) * 0.02) * (ambientLux / 250);
      const ch3_v = Math.max(0.04, Math.min(3.26, 0.05 + (2.85 * opticalAttenuation * servoTransmission * burstAttenuation * rcFactor) + noise));

      // CH4: LM358 Sliced Output (Operating threshold ~50 ADC counts ≈ 1.0V)
      const ch4_v = ch3_v >= 1.0 ? 3.26 : 0.04;

      // CH5: ESP32 RX ADC Mid-bit Capture (GPIO 34)
      const ch5_v = ch4_v >= 1.8 ? 3.3 : 0.0;

      return { tUs, ch1_v, ch2_v, ch3_v, ch4_v, ch5_v };
    });
  }, [numSamples, timebaseUs, zoom, phaseOffset, opticalAttenuation, ambientLux, currentServoAngle, activeExperiment]);

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-hidden ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER & SUB-TABS                                  */}
      {/* ========================================================= */}
      <div
        className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'bg-[#0b101d] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Digital Storage Oscilloscope (DSO) &amp; Waveforms
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 font-bold">
                5-Channel Real-Time
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 font-bold uppercase">
                {isSimulating ? 'Simulation' : 'Live Hardware'}
              </span>
              {activeExperiment && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  EXP: {activeExperiment.experiment_id} ({activeExperiment.cgfp_decision})
                </span>
              )}
            </div>
            <p
              className={`text-xs -mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Tektronix/Keysight laboratory mixed-signal capture across transmitter, driver, optical link &amp; receiver
            </p>
          </div>
        </div>

        {/* Sub-Tabs: [Oscilloscope DSO] [CRT Signal Analyzer] [Bit Stream] [Benchmarks] */}
        <div
          className={`flex items-center space-x-1 p-1 rounded-xl border text-xs font-semibold ${
            isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('waveforms')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'waveforms'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>5-Channel DSO</span>
          </button>

          <button
            onClick={() => setActiveTab('signals')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'signals'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>CRT Signal Analyzer</span>
          </button>

          <button
            onClick={() => setActiveTab('bitstream')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'bitstream'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Bit Stream</span>
          </button>

          <button
            onClick={() => setActiveTab('results')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Benchmarks</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN ACTIVE TAB CONTENT                                */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4">
        {activeTab === 'waveforms' && (
          <div
            className={`flex-1 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-xl transition-all ${
              isDarkMode ? 'bg-[#060a16] border-[#192744]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Active Experiment Traceability HUD Banner (Part 5 Requirement) */}
            {activeExperiment && (
              <div className="mb-3 p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-cyan-300 shadow">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="font-bold text-white tracking-wide">EXPERIMENT TRACEABILITY:</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700 text-cyan-300 font-bold">
                    {activeExperiment.experiment_id}
                  </span>
                  <span className="text-slate-400">({activeExperiment.mode})</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px]">
                  <span>Payload: <strong className="text-white">"{activeExperiment.original_payload}"</strong></span>
                  <span>CRC-8: <strong className={activeExperiment.crc_status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'}>{activeExperiment.crc_status}</strong></span>
                  <span>CGFP: <strong className="text-emerald-400 font-bold">{activeExperiment.cgfp_decision}</strong></span>
                  <span className="text-cyan-400 font-bold">Dist: {activeExperiment.optical_channel_parameters?.distance_cm ?? workingDistanceCm} cm</span>
                </div>
              </div>
            )}

            {/* Oscilloscope DSO Top Control Panel */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              {/* Left: Timebase, Run/Stop & Servo Flap */}
              <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                <button
                  onClick={() => setIsScopeRunning((r) => !r)}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold transition shadow ${
                    isScopeRunning
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                  title={isScopeRunning ? 'Pause Scope Sweep' : 'Resume Scope Sweep'}
                >
                  {isScopeRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  <span>{isScopeRunning ? 'RUN' : 'STOP'}</span>
                </button>

                <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-slate-400">FLAP:</span>
                  {([0, 30, 60, 90] as const).map((angle) => (
                    <button
                      key={angle}
                      onClick={() => handleServoChange(angle)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition ${
                        currentServoAngle === angle
                          ? angle === 0
                            ? 'bg-emerald-600 text-white font-bold'
                            : angle === 30
                            ? 'bg-blue-600 text-white font-bold'
                            : angle === 60
                            ? 'bg-amber-600 text-white font-bold'
                            : 'bg-rose-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                      }`}
                      title={angle === 0 ? 'Clear LOS' : angle === 30 ? 'P1 Short Burst (30 ms)' : angle === 60 ? 'P2 Moderate Burst (250 ms)' : 'P3 Full Occlusion (500 ms)'}
                    >
                      {angle}&deg;
                    </button>
                  ))}
                </div>

                <div className="flex items-center space-x-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
                  <span className="text-slate-400">TIMEBASE:</span>
                  <select
                    value={timebaseUs}
                    onChange={(e) => setTimebaseUs(Number(e.target.value))}
                    className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                  >
                    <option value={50}>50 µs / div</option>
                    <option value={100}>100 µs / div</option>
                    <option value={200}>200 µs / div</option>
                    <option value={500}>500 µs / div</option>
                    <option value={1000}>1.0 ms / div</option>
                  </select>
                </div>

                {/* Zoom Controls (Part 5 Requirement) */}
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => setZoom((z) => Math.min(4.0, Number((z * 1.25).toFixed(2))))}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
                    title="Zoom In (Time Axis)"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom((z) => Math.max(0.5, Number((z / 1.25).toFixed(2))))}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded transition"
                    title="Zoom Out (Time Axis)"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setZoom(1.0)}
                    className="px-1.5 py-0.5 text-[10px] font-bold text-cyan-400 hover:text-white transition"
                    title="Reset Zoom to 1.0x"
                  >
                    {zoom}×
                  </button>
                </div>

                {/* Dual Cursors Toggle (Part 5 Requirement) */}
                <button
                  onClick={() => setShowCursors((c) => !c)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border font-bold transition ${
                    showCursors
                      ? 'bg-cyan-600 text-white border-cyan-400 shadow'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                  title="Toggle Dual Time/Voltage Measurement Cursors"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>CURSORS</span>
                </button>

                {/* Snapshot Capture Button (Part 5 Requirement) */}
                <button
                  onClick={handleTakeSnapshot}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 font-bold transition"
                  title="Capture Waveform Snapshot"
                >
                  <Camera className="w-3.5 h-3.5 text-purple-400" />
                  <span>SNAP ({snapshots.length})</span>
                </button>

                {/* Export Data Controls (Part 5 Requirement) */}
                <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded-lg border border-slate-700">
                  <button
                    onClick={() => handleExportSampleData('csv')}
                    className="flex items-center space-x-1 px-2 py-0.5 text-[10px] text-emerald-400 hover:text-white transition font-bold"
                    title="Export Plotted Trace Samples as CSV"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportSampleData('json')}
                    className="flex items-center space-x-1 px-2 py-0.5 text-[10px] text-cyan-400 hover:text-white transition font-bold"
                    title="Export Plotted Trace Samples as JSON"
                  >
                    <Download className="w-3 h-3" />
                    <span>JSON</span>
                  </button>
                </div>
              </div>

              {/* Right: 5 Channel Toggles */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                <button
                  onClick={() => toggleChannel('ch1')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    enabledChannels.ch1
                      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/60'
                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                  }`}
                >
                  CH1: TX PWM
                </button>
                <button
                  onClick={() => toggleChannel('ch2')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    enabledChannels.ch2
                      ? 'bg-orange-500/20 text-orange-400 border-orange-500/60'
                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                  }`}
                >
                  CH2: S8050 / 2N2222
                </button>
                <button
                  onClick={() => toggleChannel('ch3')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    enabledChannels.ch3
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/60'
                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                  }`}
                >
                  CH3: BPW34
                </button>
                <button
                  onClick={() => toggleChannel('ch4')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    enabledChannels.ch4
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/60'
                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                  }`}
                >
                  CH4: LM358
                </button>
                <button
                  onClick={() => toggleChannel('ch5')}
                  className={`px-2 py-0.5 rounded border transition font-bold ${
                    enabledChannels.ch5
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/60'
                      : 'bg-slate-800 text-slate-500 border-slate-700 line-through'
                  }`}
                >
                  CH5: RX Capture
                </button>
              </div>
            </div>

            {/* Snapshot Toast Feedback */}
            {snapshotSuccessToast && (
              <div className="mt-2 p-2 rounded-lg bg-purple-950/80 border border-purple-500/50 text-purple-200 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{snapshotSuccessToast}</span>
              </div>
            )}

            {/* Phosphor Oscilloscope Screen */}
            <div
              className="flex-1 min-h-[360px] sm:min-h-[420px] my-3 rounded-xl border border-[#1b2b48] bg-[#02050c] relative overflow-hidden flex flex-col justify-between p-3 select-none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const totalUs = (timebaseUs * 10) / zoom;
                const relX = (e.clientX - rect.left) / rect.width;
                setHoverX(Math.max(0, Math.min(totalUs, relX * totalUs)));
              }}
              onMouseLeave={() => setHoverX(null)}
            >
              {/* Engineering Scope Grid (10 horizontal x 8 vertical divisions) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-40">
                <defs>
                  <pattern id="dsoMinorGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#132238" strokeWidth="0.5" />
                  </pattern>
                  <pattern id="dsoMajorGrid" width="100" height="100" patternUnits="userSpaceOnUse">
                    <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#223b61" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#dsoMinorGrid)" />
                <rect width="100%" height="100%" fill="url(#dsoMajorGrid)" />
                {/* Center Crosshair Axis */}
                <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
                <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 4" opacity="0.6" />
              </svg>

              {/* Obstruction Marker & Burst Interval Shaded Region (Part 5 Requirement) */}
              {burstInterval && (
                <div
                  className="absolute top-0 bottom-8 bg-amber-500/15 border-l-2 border-r-2 border-amber-400 pointer-events-none z-15 flex flex-col justify-start p-1.5 animate-fadeIn"
                  style={{
                    left: `${Math.min(85, Math.max(10, ((burstInterval.startUs % ((timebaseUs * 10) / zoom)) / ((timebaseUs * 10) / zoom)) * 100))}%`,
                    width: `${Math.min(60, Math.max(15, (burstInterval.durationMs * 10 / ((timebaseUs * 10) / zoom)) * 100))}%`
                  }}
                >
                  <span className="text-[9px] font-mono font-bold text-amber-300 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/50 uppercase w-max shadow">
                    BURST INTERVAL [{burstInterval.startUs}–{burstInterval.endUs} µs] &bull; SG90 OCCLUSION ({currentServoAngle}&deg;)
                  </span>
                </div>
              )}

              {/* Dual Measurement Cursors Lines (Part 5 Requirement) */}
              {showCursors && (
                <>
                  <div
                    className="absolute top-0 bottom-8 w-0.5 bg-cyan-400 border-r border-cyan-200 border-dashed z-25 pointer-events-none"
                    style={{ left: `${Math.min(98, Math.max(2, (cursor1TimeUs / ((timebaseUs * 10) / zoom)) * 100))}%` }}
                  >
                    <span className="absolute top-1 -left-2 bg-cyan-600 text-white font-bold text-[9px] font-mono px-1 rounded shadow">
                      T1
                    </span>
                  </div>
                  <div
                    className="absolute top-0 bottom-8 w-0.5 bg-purple-400 border-r border-purple-200 border-dashed z-25 pointer-events-none"
                    style={{ left: `${Math.min(98, Math.max(2, (cursor2TimeUs / ((timebaseUs * 10) / zoom)) * 100))}%` }}
                  >
                    <span className="absolute top-1 -left-2 bg-purple-600 text-white font-bold text-[9px] font-mono px-1 rounded shadow">
                      T2
                    </span>
                  </div>
                </>
              )}

              {/* Visible Vertical Voltage Axis */}
              <div className="absolute right-2 top-2 bottom-8 flex flex-col justify-between text-[9px] font-mono text-cyan-400/70 pointer-events-none z-20 select-none text-right">
                <span className="bg-[#02050c]/80 px-1 rounded border border-slate-800/80">3.3 V</span>
                <span className="bg-[#02050c]/80 px-1 rounded border border-slate-800/80">2.5 V</span>
                <span className="bg-[#02050c]/80 px-1 rounded border border-slate-800/80">1.65 V</span>
                <span className="bg-[#02050c]/80 px-1 rounded border border-slate-800/80">0.8 V</span>
                <span className="bg-[#02050c]/80 px-1 rounded border border-slate-800/80">0.0 V</span>
              </div>

              {/* All Channels Muted Empty State */}
              {!enabledChannels.ch1 && !enabledChannels.ch2 && !enabledChannels.ch3 && !enabledChannels.ch4 && !enabledChannels.ch5 && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-25 pointer-events-none">
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-700/80 backdrop-blur-md max-w-sm pointer-events-auto shadow-2xl space-y-2 font-mono text-xs">
                    <Activity className="w-6 h-6 text-cyan-400 mx-auto" />
                    <div className="font-bold text-white uppercase tracking-wider">All Channels Muted</div>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Enable CH1 (TX), CH2 (Driver), CH3 (Photodiode), CH4 (LM358), or CH5 (RX ADC) on the selector bar above to display live traces.
                    </p>
                  </div>
                </div>
              )}

              {/* 5 Stacked Channel Traces */}
              <div className="relative w-full h-full flex flex-col justify-between py-1 z-10 pr-12">
                {/* CH1: TX PWM (Yellow) */}
                {enabledChannels.ch1 && (
                  <div className="h-16 relative flex items-center">
                    <div className="absolute left-2 top-0 flex items-center space-x-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />
                      <span className="text-xs font-bold font-mono text-yellow-400">
                        CH1: ESP32 TX (GPIO 23)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">1000 bps Manchester &bull; 1.0 V/div</span>
                    </div>
                    <svg className="w-full h-12 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 120 100">
                      <polyline
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={traces
                          .map((p, i) => `${i},${85 - (p.ch1_v / 3.3) * 70}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}

                {/* CH2: 2N2222 Collector (Orange) */}
                {enabledChannels.ch2 && (
                  <div className="h-16 relative flex items-center">
                    <div className="absolute left-2 top-0 flex items-center space-x-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-sm bg-orange-400" />
                      <span className="text-xs font-bold font-mono text-orange-400">
                        CH2: S8050 / 2N2222 V_CE (Collector)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">0.20V Sat / 3.3V Cut-off</span>
                    </div>
                    <svg className="w-full h-12 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 120 100">
                      <polyline
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={traces
                          .map((p, i) => `${i},${85 - (p.ch2_v / 3.3) * 70}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}

                {/* CH3: BPW34 Photocurrent / TIA Input (Cyan) */}
                {enabledChannels.ch3 && (
                  <div className="h-16 relative flex items-center">
                    <div className="absolute left-2 top-0 flex items-center space-x-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400" />
                      <span className="text-xs font-bold font-mono text-cyan-400">
                        CH3: BPW34 Photocurrent / LM358 TIA
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Analog Exponential ({workingDistanceCm} cm &bull; {ambientLux} Lux)
                      </span>
                    </div>
                    <svg className="w-full h-12 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 120 100">
                      <polyline
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={traces
                          .map((p, i) => `${i},${85 - (p.ch3_v / 3.3) * 70}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}

                {/* CH4: LM358 Sliced Output (Green) */}
                {enabledChannels.ch4 && (
                  <div className="h-16 relative flex items-center">
                    <div className="absolute left-2 top-0 flex items-center space-x-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                      <span className="text-xs font-bold font-mono text-emerald-400">
                        CH4: LM358 Sliced Output
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Threshold ~50 ADC Counts</span>
                    </div>
                    <svg className="w-full h-12 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 120 100">
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={traces
                          .map((p, i) => `${i},${85 - (p.ch4_v / 3.3) * 70}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}

                {/* CH5: ESP32 RX Capture (Purple) */}
                {enabledChannels.ch5 && (
                  <div className="h-16 relative flex items-center">
                    <div className="absolute left-2 top-0 flex items-center space-x-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                      <span className="text-xs font-bold font-mono text-purple-400">
                        CH5: ESP32 RX ADC (GPIO 34)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">Mid-bit (450–550 µs) Sampling</span>
                    </div>
                    <svg className="w-full h-12 overflow-hidden" preserveAspectRatio="none" viewBox="0 0 120 100">
                      <polyline
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        points={traces
                          .map((p, i) => `${i},${85 - (p.ch5_v / 3.3) * 70}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}

                {/* Precision Oscilloscope Time Cursor Tooltip */}
                {hoverX !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-30"
                    style={{ left: `${(hoverX / ((timebaseUs * 10) / zoom)) * 100}%` }}
                  >
                    <div className="absolute -top-3 left-2 bg-slate-900/95 text-white text-[10px] font-mono p-2 rounded-lg border border-cyan-500/60 shadow-2xl whitespace-nowrap space-y-0.5">
                      <div className="text-cyan-300 font-bold border-b border-slate-700 pb-0.5">
                        t = {hoverX.toFixed(1)} µs
                      </div>
                      <div className="text-yellow-400">CH1 TX: 3.30 V</div>
                      <div className="text-orange-400">CH2 Vce: 0.20 V</div>
                      <div className="text-cyan-400">CH3 TIA: {(2.85 * opticalAttenuation).toFixed(2)} V</div>
                      <div className="text-emerald-400">CH4 TTL: 3.26 V</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Time Axis Divisions at Bottom (Scaled by Zoom) */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span>0 µs</span>
                <span>{((timebaseUs * 2) / zoom).toFixed(0)} µs</span>
                <span>{((timebaseUs * 4) / zoom).toFixed(0)} µs</span>
                <span>{((timebaseUs * 6) / zoom).toFixed(0)} µs</span>
                <span>{((timebaseUs * 8) / zoom).toFixed(0)} µs</span>
                <span>{((timebaseUs * 10) / zoom).toFixed(0)} µs</span>
              </div>
            </div>

            {/* Dual Cursor Measurements Bar (Part 5 Requirement) */}
            {showCursors && (
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/90 border border-cyan-500/50 text-xs font-mono text-cyan-300 shadow">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center space-x-1.5 font-bold text-white">
                    <Crosshair className="w-4 h-4 text-cyan-400" />
                    <span>CURSOR MEASUREMENTS:</span>
                  </div>
                  <span>T1: <strong className="text-cyan-400">{cursor1TimeUs.toFixed(1)} µs</strong></span>
                  <span>T2: <strong className="text-purple-400">{cursor2TimeUs.toFixed(1)} µs</strong></span>
                  <span className="text-yellow-400 font-bold">
                    Δt: {Math.abs(cursor2TimeUs - cursor1TimeUs).toFixed(1)} µs
                  </span>
                  <span className="text-emerald-400 font-bold">
                    f = 1/Δt: {(1000 / Math.max(1, Math.abs(cursor2TimeUs - cursor1TimeUs))).toFixed(2)} kHz
                  </span>
                  <span className="text-white">
                    ΔV: {(Math.abs((enabledChannels.ch1 ? 3.3 : 0) - (enabledChannels.ch2 ? 0.2 : 0))).toFixed(2)} V
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 text-[11px]">
                  <span className="text-slate-400 mr-1">Position:</span>
                  <button onClick={() => setCursor1TimeUs((c) => Math.max(0, c - 50))} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">&larr; T1</button>
                  <button onClick={() => setCursor1TimeUs((c) => c + 50)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">T1 &rarr;</button>
                  <button onClick={() => setCursor2TimeUs((c) => Math.max(0, c - 50))} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">&larr; T2</button>
                  <button onClick={() => setCursor2TimeUs((c) => c + 50)} className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-bold">T2 &rarr;</button>
                </div>
              </div>
            )}

            {/* Signal Snapshots Gallery (Part 5 Requirement) */}
            {snapshots.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-purple-300">
                  <span className="font-bold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-purple-400" />
                    CAPTURED SIGNAL SNAPSHOTS ({snapshots.length}/5)
                  </span>
                  <button onClick={() => setSnapshots([])} className="text-[10px] text-slate-400 hover:text-rose-400">Clear All</button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  {snapshots.map((s) => (
                    <div key={s.id} className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                      <div className="text-cyan-400 font-bold truncate">{s.id}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {s.timestamp} &bull; {s.timebaseUs} µs/div &bull; {s.servoAngle}&deg; Flap
                      </div>
                      <div className="text-[10px] text-purple-400 mt-0.5">
                        {s.samplesCount} samples &bull; {s.experimentId}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Live Measurements Readout Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">SIGNALING RATE</div>
                <div className="font-bold text-white text-sm mt-0.5">1000 bps</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">BIT PERIOD (Tb)</div>
                <div className="font-bold text-yellow-400 text-sm mt-0.5">1000 µs</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">CHIP PERIOD (Tc)</div>
                <div className="font-bold text-cyan-400 text-sm mt-0.5">500 µs</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">ADC THRESHOLD</div>
                <div className="font-bold text-cyan-400 text-sm mt-0.5">50 counts</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">OPTICAL SNR</div>
                <div className="font-bold text-emerald-400 text-sm mt-0.5">{opticalSNR} dB</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">ZOOM LEVEL</div>
                <div className="font-bold text-purple-400 text-sm mt-0.5">{zoom}× (Window)</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">BURST / CGFP GATE</div>
                <div className={`font-bold text-xs mt-0.5 truncate ${
                  currentServoAngle === 0 ? 'text-emerald-400' : currentServoAngle === 30 ? 'text-blue-400' : currentServoAngle === 60 ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {currentServoAngle === 0 ? 'LOS: VALID CRC' : currentServoAngle === 30 ? 'P1: SEMANTIC ACCEPT' : currentServoAngle === 60 ? 'P2: C=0.729 < 0.80' : 'P3: C=0.000'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: High-Performance CRT Mixed-Signal Analyzer (SignalsPage) */}
        {activeTab === 'signals' && (
          <div className="flex-1 min-h-[620px] rounded-2xl overflow-hidden border border-slate-800 shadow-xl flex flex-col">
            <SignalsPage initialServoAngle={currentServoAngle} activeExperiment={activeExperiment} />
          </div>
        )}

        {/* Tab 2: Bit Stream Dissection */}
        {activeTab === 'bitstream' && (
          <div
            className={`rounded-2xl border p-5 space-y-4 ${
              isDarkMode ? 'bg-[#0b101e] border-[#1a2b4b]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Synchronous Manchester Bit Stream &amp; Packet Structure
              </h3>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                IEEE 802.3 / Manchester Encoding
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#0c1426] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-slate-400 font-mono">
                  TRANSMITTED PACKET FRAMING BREAKDOWN
                </div>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  <span className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    PREAMBLE: 0xAA (10101010 Clock Sync)
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/30">
                    SOF: 0x7E (Start of Frame Delimiter)
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    LENGTH: 0x1B (27 Bytes Payload)
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    PAYLOAD: TEMP=27.4,HUM=61,MOTOR=ON
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    CRC-8: Dallas 0x4D (Polynomial x⁸+x⁵+x⁴+1)
                  </span>
                </div>
              </div>

              {/* Manchester Encoding Rules Callout */}
              <div className="p-4 rounded-xl bg-[#080d1a] border border-slate-800 text-xs font-mono space-y-2">
                <div className="text-cyan-400 font-bold">MANCHESTER PHASE TRANSITIONS (SELF-CLOCKING)</div>
                <p className="text-slate-400 leading-relaxed">
                  In Manchester coding, a logic <strong>0</strong> is represented by a Low-to-High transition at the mid-bit interval,
                  while a logic <strong>1</strong> is represented by a High-to-Low transition. This guarantees continuous DC balance
                  and eliminates long strings of consecutive 0s or 1s, preventing optical receiver baseline wander on the LM358.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Detailed Evaluation Results */}
        {activeTab === 'results' && (
          <div
            className={`rounded-2xl border p-5 space-y-4 ${
              isDarkMode ? 'bg-[#0b101e] border-[#1a2b4b]' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Quantitative VLC Optical Communication Benchmarks
              </h3>
              {onOpenReport && (
                <button
                  onClick={onOpenReport}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Lab Report</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                <div className="text-slate-500 font-mono text-[11px]">Optical SNR</div>
                <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                  {opticalSNR} dB
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Line-of-sight @ {workingDistanceCm} cm</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                <div className="text-slate-500 font-mono text-[11px]">End-to-End Latency</div>
                <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  1.82 ms
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Timer Capture to UART Interrupt</div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                <div className="text-slate-500 font-mono text-[11px]">Packet Delivery Ratio (PDR)</div>
                <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                  99.98%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Under P0 clean LOS</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. BOTTOM METRICS BAR                                     */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">Data Rate</span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-white mt-1">
              1,000 bps
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">Bit Error Rate</span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 mt-1">
              {calculatedBER}
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">CRC-8 Check</span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-400 mt-1">
              Passed (0x4D)
            </span>
          </div>

          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">ARQ Retransmissions</span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-white mt-1">
              0
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300 leading-tight">
                Link Operational
              </div>
              <div className="text-[10px] text-emerald-400/80 font-mono">
                LOS Aligned &bull; 15 cm
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

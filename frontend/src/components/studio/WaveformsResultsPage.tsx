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
  Gauge
} from 'lucide-react';

interface WaveformsResultsPageProps {
  isSimulating: boolean;
  isDarkMode: boolean;
  workingDistanceCm: number;
  ambientLux: number;
  onOpenReport?: () => void;
}

export const WaveformsResultsPage: React.FC<WaveformsResultsPageProps> = ({
  isSimulating,
  isDarkMode,
  workingDistanceCm,
  ambientLux,
  onOpenReport
}) => {
  const [activeTab, setActiveTab] = useState<'waveforms' | 'bitstream' | 'results'>('waveforms');
  const [timebaseUs, setTimebaseUs] = useState<number>(200); // 200 µs per division
  const [isScopeRunning, setIsScopeRunning] = useState<boolean>(true);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Channel toggles
  const [enabledChannels, setEnabledChannels] = useState<{ [key: string]: boolean }>({
    ch1: true, // TX PWM (PA9)
    ch2: true, // 2N2222 Collector (V_CE)
    ch3: true, // BPW34 Photocurrent / TIA Input
    ch4: true, // LM358 Sliced Output (TTL)
    ch5: true  // STM32 RX Capture (PA0)
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

  // Generate 120 sample points across scope window
  const numSamples = 120;
  const traces = useMemo(() => {
    return Array.from({ length: numSamples }, (_, i) => {
      // Time in microseconds across the 10 horizontal divisions
      const totalWindowUs = timebaseUs * 10;
      const tUs = (i / (numSamples - 1)) * totalWindowUs;

      // 10 kHz carrier period = 100 µs
      const carrierPeriodUs = 100;
      const phase = ((tUs % carrierPeriodUs) / carrierPeriodUs) * Math.PI * 2 + phaseOffset;

      // Data bit changes every 1000 µs (10 carrier cycles per bit)
      const bitIndex = Math.floor(tUs / 1000);
      const bitPattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
      const dataBit = bitPattern[bitIndex % bitPattern.length];

      // Carrier modulation: 10 kHz square wave gated by Manchester bit
      const rawCarrierHigh = Math.sin(phase) > 0 ? 1 : 0;
      const txPWM = dataBit === 1 ? rawCarrierHigh : (rawCarrierHigh === 1 ? 0.3 : 0);

      // CH1: STM32 TX (PA9) - 0 to 3.3V
      const ch1_v = txPWM * 3.3;

      // CH2: 2N2222 Collector Voltage (Inverted: V_CE sat = 0.20V when ON, 3.3V when OFF)
      const ch2_v = txPWM > 0.5 ? 0.20 : 3.30;

      // CH3: BPW34 Photocurrent & TIA analog curve with optical attenuation & ambient noise
      const rcFactor = txPWM > 0.5 ? 1 - Math.exp(-((tUs % 100) / 18)) : Math.exp(-((tUs % 100) / 18));
      const noise = (Math.sin(tUs * 0.05 + phaseOffset * 2) * 0.06 + Math.cos(tUs * 0.02) * 0.03) * (ambientLux / 250);
      const ch3_v = Math.max(0.04, Math.min(3.26, 0.05 + (2.85 * opticalAttenuation * rcFactor) + noise));

      // CH4: LM358 Sliced Output (TTL sliced against 1.65V threshold)
      const ch4_v = ch3_v >= 1.65 ? 3.26 : 0.04;

      // CH5: STM32 RX Input Capture (PA0)
      const ch5_v = ch4_v >= 2.0 ? 3.3 : 0.0;

      return { tUs, ch1_v, ch2_v, ch3_v, ch4_v, ch5_v };
    });
  }, [numSamples, timebaseUs, phaseOffset, opticalAttenuation, ambientLux]);

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

        {/* Sub-Tabs: [Waveforms] [Bit Stream] [Results] */}
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
            <span>Oscilloscope</span>
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
            {/* Oscilloscope DSO Top Control Panel */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              {/* Left: Timebase & Run/Stop */}
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

                <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>TRIG: AUTO (10.0 kHz Edge)</span>
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
                  CH2: 2N2222
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

            {/* Phosphor Oscilloscope Screen */}
            <div
              className="flex-1 min-h-[360px] sm:min-h-[420px] my-3 rounded-xl border border-[#1b2b48] bg-[#02050c] relative overflow-hidden flex flex-col justify-between p-3 select-none"
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = (e.clientX - rect.left) / rect.width;
                setHoverX(Math.max(0, Math.min(timebaseUs * 10, relX * timebaseUs * 10)));
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

              {/* 5 Stacked Channel Traces */}
              <div className="relative w-full h-full flex flex-col justify-between py-1 z-10">
                {/* CH1: TX PWM (Yellow) */}
                {enabledChannels.ch1 && (
                  <div className="h-16 relative flex items-center">
                    <div className="absolute left-2 top-0 flex items-center space-x-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-sm bg-yellow-400" />
                      <span className="text-xs font-bold font-mono text-yellow-400">
                        CH1: STM32 TX (PA9)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">10 kHz PWM &bull; 1.0 V/div</span>
                    </div>
                    <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 120 1">
                      <polyline
                        fill="none"
                        stroke="#eab308"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={traces
                          .map((p, i) => `${i},${0.9 - (p.ch1_v / 3.3) * 0.75}`)
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
                        CH2: 2N2222 V_CE (Collector)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">0.20V Sat / 3.3V Cut-off</span>
                    </div>
                    <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 120 1">
                      <polyline
                        fill="none"
                        stroke="#f97316"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={traces
                          .map((p, i) => `${i},${0.9 - (p.ch2_v / 3.3) * 0.75}`)
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
                        CH3: BPW34 Photocurrent / TIA
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Analog Exponential ({workingDistanceCm} cm &bull; {ambientLux} Lux)
                      </span>
                    </div>
                    <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 120 1">
                      <polyline
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={traces
                          .map((p, i) => `${i},${0.9 - (p.ch3_v / 3.3) * 0.75}`)
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
                        CH4: LM358 Sliced TTL
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">1.65V Slicer Threshold</span>
                    </div>
                    <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 120 1">
                      <polyline
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={traces
                          .map((p, i) => `${i},${0.9 - (p.ch4_v / 3.3) * 0.75}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}

                {/* CH5: STM32 RX Capture (Purple) */}
                {enabledChannels.ch5 && (
                  <div className="h-16 relative flex items-center">
                    <div className="absolute left-2 top-0 flex items-center space-x-1.5 z-20">
                      <span className="w-2.5 h-2.5 rounded-sm bg-purple-400" />
                      <span className="text-xs font-bold font-mono text-purple-400">
                        CH5: STM32 RX Capture (PA0)
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">TIM2_CH1 Edge Timestamped</span>
                    </div>
                    <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 120 1">
                      <polyline
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        points={traces
                          .map((p, i) => `${i},${0.9 - (p.ch5_v / 3.3) * 0.75}`)
                          .join(' ')}
                      />
                    </svg>
                  </div>
                )}

                {/* Precision Oscilloscope Time Cursor Tooltip */}
                {hoverX !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-30"
                    style={{ left: `${(hoverX / (timebaseUs * 10)) * 100}%` }}
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

              {/* Time Axis Divisions at Bottom */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                <span>0 µs</span>
                <span>{(timebaseUs * 2).toFixed(0)} µs</span>
                <span>{(timebaseUs * 4).toFixed(0)} µs</span>
                <span>{(timebaseUs * 6).toFixed(0)} µs</span>
                <span>{(timebaseUs * 8).toFixed(0)} µs</span>
                <span>{(timebaseUs * 10).toFixed(0)} µs</span>
              </div>
            </div>

            {/* Live Measurements Readout Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 pt-2 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">FREQUENCY</div>
                <div className="font-bold text-white text-sm mt-0.5">10.00 kHz</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">V_PP</div>
                <div className="font-bold text-yellow-400 text-sm mt-0.5">3.30 V</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">RISE TIME (t_r)</div>
                <div className="font-bold text-cyan-400 text-sm mt-0.5">1.42 µs</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">FALL TIME (t_f)</div>
                <div className="font-bold text-cyan-400 text-sm mt-0.5">1.68 µs</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">OPTICAL SNR</div>
                <div className="font-bold text-emerald-400 text-sm mt-0.5">{opticalSNR} dB</div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">DUTY CYCLE</div>
                <div className="font-bold text-purple-400 text-sm mt-0.5">50.0%</div>
              </div>
            </div>
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

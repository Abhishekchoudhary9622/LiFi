import React, { useState, useEffect, useRef } from 'react';
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
  Info
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
  const [timeScale, setTimeScale] = useState<string>('10 ms');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [hoverX, setHoverX] = useState<number | null>(null);

  // Animated phase offset for live oscilloscope trace
  const [phaseOffset, setPhaseOffset] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    let lastTime = performance.now();
    const animate = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;
      if (isSimulating) {
        setPhaseOffset((prev) => (prev + dt * 4) % (Math.PI * 4));
      }
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isSimulating]);

  // Derived metrics based on working distance and ambient light
  const calculatedBER = workingDistanceCm <= 25 ? (ambientLux > 600 ? '0.042%' : '0.021%') : '0.185%';
  const isCrcPassed = workingDistanceCm <= 35 && ambientLux <= 750;

  // Generate multi-channel signal points (100 sample points across 10 ms)
  const numSamples = 100;
  const traces = Array.from({ length: numSamples }, (_, i) => {
    const tMs = (i / (numSamples - 1)) * 10; // 0 to 10 ms
    const bitPeriod = 1.0; // 1 ms per bit -> 10 bits in window
    const bitIndex = Math.floor(tMs / bitPeriod);

    // Bit pattern: 1, 0, 1, 1, 0, 0, 1, 0, 1, 1
    const bitPattern = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1];
    const rawBit = bitPattern[bitIndex % bitPattern.length];

    // 1. TX Bits (clean digital 0 or 1)
    const txBit = rawBit;

    // 2. LED Voltage (0 to 3.3V modulated)
    const ledV = rawBit === 1 ? 3.3 : 0.0;

    // 3. RX Analog Voltage (photodiode + LM358 op-amp RC exponential curve + noise)
    const subBitT = (tMs % bitPeriod) / bitPeriod;
    const rcFactor = rawBit === 1 ? 1 - Math.exp(-subBitT * 5) : Math.exp(-subBitT * 5);
    const noise = Math.sin(tMs * 20 + phaseOffset) * 0.08 * (ambientLux / 300);
    const opticalAttenuation = Math.max(0.4, 1.0 - (workingDistanceCm - 10) * 0.02);
    const rxV = Math.max(0, Math.min(3.3, 0.2 + (rawBit === 1 ? 2.8 * opticalAttenuation * rcFactor : 0.3 * rcFactor) + noise));

    // 4. Decoded Digital Bits (recovered through ADC thresholding at 1.6V)
    const decodedBit = rxV > 1.6 ? 1 : 0;

    return { tMs, txBit, ledV, rxV, decodedBit };
  });

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
        className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'bg-[#0b101d] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1
              className={`text-base sm:text-lg font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Waveforms &amp; Results
            </h1>
            <p
              className={`text-xs -mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Visualize signals and evaluate communication performance.
            </p>
          </div>
        </div>

        {/* Sub-Tabs (Exact match: [Waveforms] [Bit Stream] [Results]) */}
        <div
          className={`flex items-center space-x-1 p-1 rounded-xl border text-xs font-semibold ${
            isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveTab('waveforms')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'waveforms'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Waveforms</span>
          </button>

          <button
            onClick={() => setActiveTab('bitstream')}
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
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
            className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'results'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Results</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN ACTIVE TAB CONTENT                                */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4">
        {activeTab === 'waveforms' && (
          <div
            className={`flex-1 rounded-2xl border p-4 sm:p-5 flex flex-col justify-between shadow-sm transition-all ${
              isDarkMode ? 'bg-[#0b101e] border-[#1a2b4b]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Oscilloscope Header Controls (Time Scale, Zoom, Expand) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-3 text-xs">
                <span className="font-mono text-slate-400">Scale:</span>
                <select
                  value={timeScale}
                  onChange={(e) => setTimeScale(e.target.value)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-mono font-bold focus:outline-none ${
                    isDarkMode
                      ? 'bg-[#0e172a] border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="2 ms">2 ms</option>
                  <option value="5 ms">5 ms</option>
                  <option value="10 ms">10 ms</option>
                  <option value="20 ms">20 ms</option>
                  <option value="50 ms">50 ms</option>
                </select>

                <div className="flex items-center space-x-1 text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-mono font-semibold">
                    {isSimulating ? 'TRIGGER: AUTO (10 kHz)' : 'TRIGGER: HOLD'}
                  </span>
                </div>
              </div>

              {/* Right Scope Actions */}
              <div className="flex items-center space-x-1 text-slate-400">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.2))}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1.0)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                  title="Reset Scale"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4-Channel Precision Waveform Display (SVG Scope matching reference) */}
            <div
              className={`flex-1 min-h-[300px] sm:min-h-[380px] my-3 rounded-xl border relative overflow-hidden flex flex-col justify-between p-4 ${
                isDarkMode ? 'bg-[#040711] border-[#16233d]' : 'bg-[#fcfdfd] border-slate-200'
              }`}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const relX = (e.clientX - rect.left) / rect.width;
                setHoverX(Math.max(0, Math.min(10, relX * 10)));
              }}
              onMouseLeave={() => setHoverX(null)}
            >
              {/* Scope Background Grid */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-30">
                <defs>
                  <pattern id="scopeGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke={isDarkMode ? '#1e293b' : '#cbd5e1'}
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#scopeGrid)" />
              </svg>

              {/* 4 Multi-Channel Traces SVG */}
              <div className="relative w-full h-full flex flex-col justify-between py-2 z-10">
                {/* Channel 1: TX Bits (Blue) */}
                <div className="h-16 relative flex items-center">
                  <div className="absolute left-0 top-0 flex items-center space-x-1.5 z-20">
                    <span className="w-2.5 h-2.5 rounded bg-blue-600" />
                    <span className="text-xs font-bold font-mono text-blue-600 dark:text-blue-400">
                      TX Bits
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">1/0 Logic</span>
                  </div>
                  <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 1">
                    <polyline
                      fill="none"
                      stroke="#2563eb"
                      strokeWidth="2.5"
                      points={traces
                        .map((p, i) => `${i},${p.txBit === 1 ? 0.15 : 0.85}`)
                        .join(' ')}
                    />
                  </svg>
                </div>

                {/* Channel 2: LED (V) (Red) */}
                <div className="h-16 relative flex items-center">
                  <div className="absolute left-0 top-0 flex items-center space-x-1.5 z-20">
                    <span className="w-2.5 h-2.5 rounded bg-red-600" />
                    <span className="text-xs font-bold font-mono text-red-600 dark:text-red-400">
                      LED (V)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">0 - 3.3 V</span>
                  </div>
                  <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 1">
                    <polyline
                      fill="none"
                      stroke="#dc2626"
                      strokeWidth="2.5"
                      points={traces
                        .map((p, i) => `${i},${p.ledV > 1.5 ? 0.15 : 0.85}`)
                        .join(' ')}
                    />
                  </svg>
                </div>

                {/* Channel 3: RX (V) (Green - Analog Optical Curve) */}
                <div className="h-16 relative flex items-center">
                  <div className="absolute left-0 top-0 flex items-center space-x-1.5 z-20">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      RX (V)
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">Conditioned Analog</span>
                  </div>
                  <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 1">
                    <polyline
                      fill="none"
                      stroke="#059669"
                      strokeWidth="2.5"
                      points={traces
                        .map((p, i) => `${i},${0.9 - (p.rxV / 3.3) * 0.75}`)
                        .join(' ')}
                    />
                  </svg>
                </div>

                {/* Channel 4: Decoded (Purple) */}
                <div className="h-16 relative flex items-center">
                  <div className="absolute left-0 top-0 flex items-center space-x-1.5 z-20">
                    <span className="w-2.5 h-2.5 rounded bg-purple-600" />
                    <span className="text-xs font-bold font-mono text-purple-600 dark:text-purple-400">
                      Decoded
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">Recovered Bitstream</span>
                  </div>
                  <svg className="w-full h-12 overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 1">
                    <polyline
                      fill="none"
                      stroke="#7c3aed"
                      strokeWidth="2.5"
                      points={traces
                        .map((p, i) => `${i},${p.decodedBit === 1 ? 0.15 : 0.85}`)
                        .join(' ')}
                    />
                  </svg>
                </div>

                {/* Crosshair Cursor Hover Tooltip */}
                {hoverX !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-px bg-cyan-400 pointer-events-none z-30"
                    style={{ left: `${(hoverX / 10) * 100}%` }}
                  >
                    <div className="absolute -top-2 left-2 bg-slate-900 text-white text-[10px] font-mono p-1 rounded border border-slate-700 shadow-lg whitespace-nowrap">
                      t = {hoverX.toFixed(2)} ms
                    </div>
                  </div>
                )}
              </div>

              {/* Time Axis Labels at Bottom: 0, 2, 4, 6, 8, 10 ms */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800">
                <span>0 ms</span>
                <span>2 ms</span>
                <span>4 ms</span>
                <span>6 ms</span>
                <span>8 ms</span>
                <span>10 ms</span>
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
                Synchronous Manchester Bit Stream Breakdown
              </h3>
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                IEEE 802.3 Convention
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0c1426] border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-semibold text-slate-500 font-mono mb-2">
                  TRANSMITTED FRAME (HEX &amp; BINARY)
                </div>
                <div className="flex flex-wrap gap-2 font-mono text-xs">
                  <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                    PREAMBLE: 0xAA (10101010)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    HEADER: 0x7E (FRAME_START)
                  </span>
                  <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    PAYLOAD: 50 BITS
                  </span>
                  <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    CRC-8: 0x4B (VALID)
                  </span>
                </div>
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
                Quantitative VLC Communication Benchmarks
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
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                <div className="text-slate-500 font-mono text-[11px]">Optical SNR</div>
                <div className="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
                  34.2 dB
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Line-of-sight 15 cm</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                <div className="text-slate-500 font-mono text-[11px]">End-to-End Latency</div>
                <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
                  1.85 ms
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Interrupt Capture to Parse</div>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                <div className="text-slate-500 font-mono text-[11px]">Packet Delivery Ratio</div>
                <div className="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
                  99.98%
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Without physical occlusion</div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* 3. BOTTOM METRICS BAR (Exact match to reference bottom)   */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {/* Metric 1: Bit Rate */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">Bit Rate</span>
            <span
              className={`text-sm sm:text-base font-extrabold font-mono mt-1 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              1,000 bps
            </span>
          </div>

          {/* Metric 2: BER */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">BER</span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {calculatedBER}
            </span>
          </div>

          {/* Metric 3: CRC */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">CRC</span>
            <span className="text-sm sm:text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              Passed
            </span>
          </div>

          {/* Metric 4: Retransmissions */}
          <div
            className={`p-3 rounded-xl border flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1426] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <span className="text-[11px] text-slate-400 font-medium">Retransmissions</span>
            <span
              className={`text-sm sm:text-base font-extrabold font-mono mt-1 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              0
            </span>
          </div>

          {/* Status Card: Transmission Successful (Exact green container) */}
          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 leading-tight">
                Transmission Successful
              </div>
              <div className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono">
                50 bits received, 0 errors
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

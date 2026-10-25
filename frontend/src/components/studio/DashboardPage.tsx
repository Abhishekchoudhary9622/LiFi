import React from 'react';
import {
  Play,
  RotateCcw,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu,
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  Radio,
  FileText,
  Share2,
  FolderOpen
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onStartSimulation: () => void;
  isSimulating: boolean;
  isDarkMode: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onStartSimulation,
  isSimulating,
  isDarkMode
}) => {
  return (
    <div
      className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 font-sans select-none transition-colors duration-200 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* ========================================================= */}
        {/* 1. GREETING HEADER                                        */}
        {/* ========================================================= */}
        <div>
          <h1
            className={`text-2xl sm:text-3xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Welcome back, Abhishek 👋
          </h1>
          <p
            className={`text-xs sm:text-sm mt-1 font-medium ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Design, simulate and analyze a complete LiFi communication system.
          </p>
        </div>

        {/* ========================================================= */}
        {/* 2. HERO BANNER CARD (Exact match to top-left quadrant)    */}
        {/* ========================================================= */}
        <div
          className={`relative rounded-2xl overflow-hidden border transition-all shadow-md ${
            isDarkMode
              ? 'bg-gradient-to-r from-[#0b1426] via-[#0d1c3a] to-[#0a1224] border-[#1d2d4c]'
              : 'bg-gradient-to-r from-[#0d1d3d] via-[#122b5c] to-[#0f2347] border-slate-300 text-white'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
            {/* Left Content Column */}
            <div className="p-6 sm:p-8 lg:col-span-7 space-y-4">
              <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>LiFi Communication Lab</span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  LiFi Communication Lab
                </h2>
                <p className="text-xs sm:text-sm text-cyan-200/80 font-medium tracking-wide mt-1">
                  Simulate &bull; Experiment &bull; Analyze
                </p>
              </div>

              <p className="text-slate-300 text-xs sm:text-sm max-w-lg leading-relaxed">
                Experience physical visible light communication across transmitter and receiver STM32
                nodes with high-frequency LED carrier modulation and photodiode signal amplification.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={onStartSimulation}
                  className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/40 hover:shadow-blue-600/60 transition active:scale-95"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>{isSimulating ? 'Simulation Active' : 'Start Simulation'}</span>
                </button>

                <button
                  onClick={() => onNavigate('circuit')}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs sm:text-sm transition backdrop-blur-sm"
                >
                  <FolderOpen className="w-4 h-4 text-slate-300" />
                  <span>Open Last Project</span>
                </button>
              </div>
            </div>

            {/* Right Photo Column */}
            <div className="lg:col-span-5 h-56 sm:h-64 lg:h-full min-h-[220px] relative overflow-hidden">
              <img
                src="/hardware/overview_hero_setup.jpg"
                alt="LiFi Breadboard Experiment"
                className="w-full h-full object-cover object-center filter brightness-95 contrast-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-[#0b1426] via-transparent to-transparent opacity-80" />
              {/* Glowing LED indicator marker */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
                <span className="w-6 h-6 rounded-full bg-red-500/40 animate-ping absolute" />
                <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_15px_#ef4444]" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. FOUR QUICK-ACTION FEATURE CARDS                        */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Build Circuit */}
          <div
            onClick={() => onNavigate('circuit')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
              <Share2 className="w-5 h-5" />
            </div>
            <h3
              className={`text-sm font-bold mt-3.5 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Build Circuit
            </h3>
            <p
              className={`text-xs mt-1 leading-snug ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Drag, drop and wire components
            </p>
          </div>

          {/* Card 2: Hardware Twin */}
          <div
            onClick={() => onNavigate('hardware')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-105 transition">
              <Cpu className="w-5 h-5" />
            </div>
            <h3
              className={`text-sm font-bold mt-3.5 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Hardware Twin
            </h3>
            <p
              className={`text-xs mt-1 leading-snug ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Explore real setup and connections
            </p>
          </div>

          {/* Card 3: Analyze Signals */}
          <div
            onClick={() => onNavigate('waveforms')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
              <Activity className="w-5 h-5" />
            </div>
            <h3
              className={`text-sm font-bold mt-3.5 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Analyze Signals
            </h3>
            <p
              className={`text-xs mt-1 leading-snug ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              View and measure waveforms
            </p>
          </div>

          {/* Card 4: Evaluate Results */}
          <div
            onClick={() => onNavigate('results')}
            className={`p-4 sm:p-5 rounded-2xl border transition-all duration-200 cursor-pointer group hover:-translate-y-0.5 hover:shadow-md ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
              <Sliders className="w-5 h-5" />
            </div>
            <h3
              className={`text-sm font-bold mt-3.5 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Evaluate Results
            </h3>
            <p
              className={`text-xs mt-1 leading-snug ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              BER, CRC and performance metrics
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. BOTTOM ROW: RECENT EXPERIMENTS & QUICK STATS           */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Recent Experiments Table */}
          <div
            className={`lg:col-span-7 rounded-2xl border p-5 sm:p-6 transition-all shadow-sm ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3
                className={`text-sm font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Recent Experiments
              </h3>
              <button
                onClick={() => onNavigate('results')}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>View all</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs mt-1">
              {/* Row 1 */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between">
                <div>
                  <div
                    className={`font-semibold ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Optical Link - 1 kbps
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Carrier: 10 kHz &bull; LOS: 15 cm
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    26 Oct, 10:40 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Passed
                  </span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between">
                <div>
                  <div
                    className={`font-semibold ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Manchester Encoding
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Self-clocking 0/1 transition integrity
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    25 Oct, 02:15 PM
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Passed
                  </span>
                </div>
              </div>

              {/* Row 3 */}
              <div className="py-3 sm:py-3.5 flex items-center justify-between">
                <div>
                  <div
                    className={`font-semibold ${
                      isDarkMode ? 'text-slate-200' : 'text-slate-800'
                    }`}
                  >
                    Burst Error Analysis
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    250 ms physical occlusion flap triggered
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                    24 Oct, 11:02 AM
                  </span>
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                    NACK
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Stats Card */}
          <div
            className={`lg:col-span-5 rounded-2xl border p-5 sm:p-6 transition-all shadow-sm flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
                <h3
                  className={`text-sm font-bold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Quick Stats
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
                  Live Benchmarks
                </span>
              </div>

              <div className="space-y-4 pt-3.5">
                {/* Stat 1 */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Total Runs
                  </span>
                  <span
                    className={`text-base font-extrabold font-mono ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    12
                  </span>
                </div>

                {/* Stat 2 */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Success Rate
                  </span>
                  <span className="text-base font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                    83%
                  </span>
                </div>

                {/* Stat 3 */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-medium ${
                      isDarkMode ? 'text-slate-300' : 'text-slate-600'
                    }`}
                  >
                    Avg. BER
                  </span>
                  <span className="text-base font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
                    0.021%
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Link bar */}
            <div
              className={`mt-4 pt-4 border-t flex items-center justify-between text-xs ${
                isDarkMode ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>CRC-8 Verification active</span>
              </div>
              <button
                onClick={() => onNavigate('waveforms')}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Inspect signals &rarr;
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

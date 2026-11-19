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
  FolderOpen,
  BarChart3
} from 'lucide-react';
import { SharedExperimentResult } from '../../model/experimentModel';

interface DashboardPageProps {
  onNavigate: (tab: string) => void;
  onStartSimulation: () => void;
  isSimulating: boolean;
  isDarkMode: boolean;
  activeExperiment?: SharedExperimentResult;
  experimentHistory?: SharedExperimentResult[];
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onStartSimulation,
  isSimulating,
  isDarkMode,
  activeExperiment,
  experimentHistory = []
}) => {
  // Dynamic stats calculated from shared experiment history
  const totalRuns = experimentHistory.length || 1;
  const successfulRuns = experimentHistory.filter(
    (e) => e.packet_delivery_status === 'DELIVERED_CLEAN' || e.packet_delivery_status === 'RECOVERED_SEMANTIC' || e.packet_delivery_status === 'FALLBACK_EXACT_ARQ'
  ).length || 1;
  const successRate = Math.round((successfulRuns / totalRuns) * 100);
  const avgBer = experimentHistory.length > 0
    ? (experimentHistory.reduce((acc, e) => acc + (e.ber || 0), 0) / experimentHistory.length * 100).toFixed(3)
    : '0.000';

  return (
    <div
      className={`flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 font-sans select-none transition-colors duration-150 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      <div className="max-w-[1440px] mx-auto space-y-6">
        {/* ========================================================= */}
        {/* 1. PROFESSIONAL ENGINEERING HEADER                        */}
        {/* ========================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h1
                  className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  SemLiFi Research Laboratory
                </h1>
                <p
                  className={`text-xs sm:text-sm mt-0.5 font-medium ${
                    isDarkMode ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  An experimental environment for optical communication, burst-loss analysis and confidence-gated semantic recovery.
                </p>
              </div>
            </div>
          </div>

          {/* Real-Time System Telemetry Badges */}
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
            <div className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 ${
              isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-slate-500">Operating Mode:</span>
              <span className={`font-bold ${isDarkMode ? 'text-cyan-400' : 'text-blue-700'}`}>
                {activeExperiment?.operating_mode || 'SIMULATION'}
              </span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 ${
              isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <Cpu className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-slate-500">Transceiver:</span>
              <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>ESP32 GPIO 23 &rarr; 34</span>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border flex items-center space-x-2 ${
              isDarkMode ? 'bg-slate-900/70 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
            }`}>
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-slate-500">Line Coding:</span>
              <span className={`font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>1000 bps Manchester</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. COMMUNICATION SYSTEM STATUS & CURRENT EXPERIMENT HUD   */}
        {/* ========================================================= */}
        <div
          className={`relative rounded-xl overflow-hidden border transition-all ${
            isDarkMode
              ? 'bg-[#0b1222] border-[#1d2d4c]'
              : 'bg-white border-slate-200/90 shadow-xs text-slate-900'
          }`}
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800/60">
            {/* Left: Active Experiment Snapshot */}
            <div className="p-5 sm:p-6 lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-semibold tracking-wide font-mono">
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400 animate-pulse" />
                  <span>CURRENT EXPERIMENT STATUS</span>
                </div>
                <span className="text-xs font-mono text-slate-500">
                  ID: <strong className={isDarkMode ? 'text-white' : 'text-slate-900'}>{activeExperiment?.experiment_id || 'EXP-SEMLIFI-STANDBY'}</strong>
                </span>
              </div>

              {/* Experiment Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-xs">
                <div className={`p-2.5 rounded-lg border ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 block font-semibold">TRANSMITTED PAYLOAD</span>
                  <span className={`text-xs font-bold truncate block mt-0.5 ${isDarkMode ? 'text-cyan-300' : 'text-blue-700'}`} title={activeExperiment?.original_payload}>
                    "{activeExperiment?.original_payload || 'TEMP=27.4,HUM=61,MOTOR=ON'}"
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 block font-semibold">BURST SCENARIO</span>
                  <span className={`text-xs font-bold block mt-0.5 ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                    {activeExperiment?.obstruction_scenario || 'P1'} ({activeExperiment?.obstruction_duration_ms || 80} ms)
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 block font-semibold">CGFP DECISION</span>
                  <span className={`text-xs font-bold block mt-0.5 ${
                    activeExperiment?.cgfp_decision === 'ACCEPT'
                      ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-700')
                      : (isDarkMode ? 'text-amber-400' : 'text-amber-700')
                  }`}>
                    {activeExperiment?.cgfp_decision || 'ACCEPT'} (C={activeExperiment?.confidence_score?.toFixed(3) ?? '0.942'})
                  </span>
                </div>
                <div className={`p-2.5 rounded-lg border ${
                  isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-500 block font-semibold">DELIVERY STATUS</span>
                  <span className={`text-xs font-bold block mt-0.5 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    {activeExperiment?.packet_delivery_status || 'DELIVERED_CLEAN'}
                  </span>
                </div>
              </div>

              {/* Physical Link Hardware Pipeline */}
              <div className={`p-3 rounded-lg border space-y-2 text-xs font-mono ${
                isDarkMode ? 'bg-[#060b17] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                  Verified Physical Optical Link Topology
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[11px]">
                  <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-blue-950 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'}`}>ESP32 TX (GPIO 23)</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-blue-950 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-800 font-semibold'}`}>S8050 NPN Driver</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-red-950 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800 font-semibold'}`}>650 nm Red LED</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-amber-950 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800 font-semibold'}`}>Free-Space Optical Link</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-purple-950 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800 font-semibold'}`}>BPW34 Photodiode</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-purple-950 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800 font-semibold'}`}>LM358 Slicer</span>
                  <span className="text-slate-400">&rarr;</span>
                  <span className={`px-2 py-0.5 rounded border ${isDarkMode ? 'bg-emerald-950 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold'}`}>ESP32 RX (GPIO 34)</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  onClick={() => onNavigate('analyzer')}
                  className="flex items-center space-x-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition active:scale-95"
                >
                  <Radio className="w-3.5 h-3.5" />
                  <span>Configure Telemetry &amp; Transmit</span>
                </button>
                <button
                  onClick={() => onNavigate('analyzer')}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg border font-semibold text-xs transition ${
                    isDarkMode
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                      : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-blue-600 dark:text-cyan-400" />
                  <span>Inspect 5-Channel DSO</span>
                </button>
              </div>
            </div>

            {/* Right: Optical Lab Visual View */}
            <div className={`lg:col-span-5 relative overflow-hidden min-h-[220px] flex flex-col justify-between p-5 ${
              isDarkMode ? 'bg-slate-950' : 'bg-slate-900'
            }`}>
              <img
                src="/hardware/overview_hero_setup.jpg"
                alt="SemLiFi Optical Testbed"
                className="absolute inset-0 w-full h-full object-cover opacity-40 filter hover:opacity-60 transition duration-300"
              />
              <div className="relative z-10 flex justify-between items-start font-mono text-xs">
                <span className="px-2 py-0.5 rounded bg-black/70 border border-slate-700 text-white font-bold">
                  TESTBED STATUS
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-900/80 border border-emerald-600 text-emerald-300 font-bold">
                  NORMAL CH 28.5 dB
                </span>
              </div>
              <div className="relative z-10 font-mono text-xs space-y-1 bg-black/75 p-3 rounded-lg border border-slate-700/80 text-white">
                <div className="flex justify-between text-slate-300">
                  <span>Air Gap Distance:</span>
                  <span className="font-bold text-white">15 cm</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Ambient Irradiance:</span>
                  <span className="font-bold text-white">250 Lux (Fluorescent)</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>SG90 Shutter Angle:</span>
                  <span className="font-bold text-amber-400">{activeExperiment?.servo_angle_deg || 0}&deg; Position</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. FOUR QUICK-ACTION FEATURE CARDS                        */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Circuit & Simulation */}
          <div
            onClick={() => onNavigate('circuit')}
            className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
              <Share2 className="w-4 h-4" />
            </div>
            <h3
              className={`text-sm font-bold mt-3 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Circuit &amp; Simulation
            </h3>
            <p
              className={`text-xs mt-1 leading-snug ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Drag, drop and wire schematic components
            </p>
          </div>

          {/* Card 2: Hardware Twin */}
          <div
            onClick={() => onNavigate('hardware')}
            className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition">
              <Cpu className="w-4 h-4" />
            </div>
            <h3
              className={`text-sm font-bold mt-3 tracking-tight ${
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
              Interactive breadboard CAD &amp; physical setup
            </p>
          </div>

          {/* Card 3: Transmission & Signal Analysis */}
          <div
            onClick={() => onNavigate('analyzer')}
            className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-105 transition">
              <Activity className="w-4 h-4" />
            </div>
            <h3
              className={`text-sm font-bold mt-3 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Transmission &amp; Signal Analysis
            </h3>
            <p
              className={`text-xs mt-1 leading-snug ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              5-channel DSO, Manchester coding &amp; recovery
            </p>
          </div>

          {/* Card 4: Results & Benchmarks */}
          <div
            onClick={() => onNavigate('results')}
            className={`p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer group hover:-translate-y-0.5 hover:shadow-xs ${
              isDarkMode
                ? 'bg-[#0c1220] hover:bg-[#10192e] border-[#1a2844]'
                : 'bg-white hover:bg-slate-50/80 border-slate-200/90 shadow-2xs'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition">
              <Sliders className="w-4 h-4" />
            </div>
            <h3
              className={`text-sm font-bold mt-3 tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Results &amp; Benchmarks
            </h3>
            <p
              className={`text-xs mt-1 leading-snug ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Pareto sensitivity curves &amp; ablation studies
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. BOTTOM ROW: RECENT EXPERIMENTS & QUICK STATS           */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Recent Experiments Table */}
          <div
            className={`lg:col-span-7 rounded-xl border p-5 sm:p-6 transition-all ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-xs'
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
              {experimentHistory.slice(0, 3).map((exp, idx) => (
                <div key={idx} className="py-3 sm:py-3.5 flex items-center justify-between">
                  <div>
                    <div className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                      {exp.mode} &bull; {exp.obstruction_scenario} ({exp.payload_length}B)
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[280px]">
                      &ldquo;{exp.original_payload}&rdquo; &bull; CRC-8: 0x{exp.transmitted_packet.crc8.toString(16).toUpperCase()}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                      {exp.timestamp}
                    </span>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${
                        exp.packet_delivery_status === 'DELIVERED_CLEAN'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                          : exp.packet_delivery_status === 'RECOVERED_SEMANTIC'
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30'
                          : exp.packet_delivery_status === 'FALLBACK_EXACT_ARQ'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
                          : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30'
                      }`}
                    >
                      {exp.packet_delivery_status === 'DELIVERED_CLEAN'
                        ? 'Passed'
                        : exp.packet_delivery_status === 'RECOVERED_SEMANTIC'
                        ? 'Recovered'
                        : exp.packet_delivery_status === 'FALLBACK_EXACT_ARQ'
                        ? 'NACK / ARQ'
                        : 'Dropped'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quick Stats Card */}
          <div
            className={`lg:col-span-5 rounded-xl border p-5 sm:p-6 transition-all flex flex-col justify-between ${
              isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-xs'
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
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 font-semibold border border-blue-200 dark:border-transparent">
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
                    {totalRuns}
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
                    {successRate}%
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
                  <span className="text-base font-extrabold font-mono text-blue-600 dark:text-cyan-400">
                    {avgBer}%
                  </span>
                </div>

                {/* Active Experiment HUD Summary */}
                {activeExperiment && (
                  <div className={`p-2.5 rounded-lg border text-[11px] font-mono space-y-1.5 ${
                    isDarkMode ? 'bg-[#080d1a] border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex justify-between text-slate-500">
                      <span>ACTIVE RUN:</span>
                      <span className={`font-bold ${isDarkMode ? 'text-cyan-300' : 'text-blue-700'}`}>{activeExperiment.experiment_id}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>STATUS:</span>
                      <span className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>{activeExperiment.packet_delivery_status}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>CGFP DECISION:</span>
                      <span className={`font-bold ${activeExperiment.cgfp_decision === 'ACCEPT' ? (isDarkMode ? 'text-emerald-400' : 'text-emerald-700') : (isDarkMode ? 'text-amber-400' : 'text-amber-700')}`}>
                        {activeExperiment.cgfp_decision} (C={activeExperiment.confidence_score?.toFixed(3) ?? '0.00'})
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>LATENCY / SAVED:</span>
                      <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>
                        {activeExperiment.latency_ms} ms &bull; {activeExperiment.retransmissions_saved} Saved
                      </span>
                    </div>
                  </div>
                )}
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
                onClick={() => onNavigate('analyzer')}
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

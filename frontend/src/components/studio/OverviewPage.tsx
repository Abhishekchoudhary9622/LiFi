import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  Cpu,
  Zap,
  Radio,
  Eye,
  Activity,
  CheckCircle2,
  Box,
  Sun,
  Clock,
  Sparkles,
  Hexagon,
  Sliders,
  Check
} from 'lucide-react';

interface OverviewPageProps {
  onNavigate: (tab: 'overview' | 'hardware' | 'schematic' | 'livelink' | 'signals' | 'results' | 'presentation') => void;
  currentMessage?: string;
  onUpdateMessage?: (msg: string) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  onNavigate,
  currentMessage = 'Hello SemLiFi! 🚀',
  onUpdateMessage
}) => {
  const [distance, setDistance] = useState<number>(15);
  const [isEditingMsg, setIsEditingMsg] = useState<boolean>(false);
  const [tempMsg, setTempMsg] = useState<string>(currentMessage);

  const handleSaveMsg = () => {
    if (onUpdateMessage) onUpdateMessage(tempMsg);
    setIsEditingMsg(false);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#040813] text-slate-100 flex flex-col font-sans select-none">
      <div className="max-w-[1400px] mx-auto w-full px-6 py-6 space-y-6">
        {/* ========================================================= */}
        {/* 1. HERO SECTION (2 Columns: Title/Actions + Real Photo)   */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Headlines & Actions */}
          <div className="lg:col-span-5 space-y-5">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-0.5 bg-cyan-400" />
              <span className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase">
                NEXT GENERATION WIRELESS COMMUNICATION
              </span>
            </div>

            <div>
              <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-white font-sans leading-none">
                SemLiFi
              </h1>
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 bg-clip-text text-transparent mt-2">
                Communication Through Light
              </h2>
            </div>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-lg font-sans">
              Real-time data transmission using modulated visible light between two STM32 nodes.
            </p>

            <div className="flex flex-wrap items-center gap-3.5 pt-2">
              {/* Start Live Demo Button */}
              <button
                onClick={() => onNavigate('livelink')}
                className="flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs sm:text-sm font-semibold tracking-wide shadow-lg shadow-blue-600/40 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Start Live Demo</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Explore Hardware Button */}
              <button
                onClick={() => onNavigate('hardware')}
                className="flex items-center space-x-2.5 px-5 py-3 rounded-xl bg-[#0c1426]/80 hover:bg-[#121f3b] border border-[#21355a] text-slate-200 hover:text-white text-xs sm:text-sm font-medium tracking-wide transition shadow-sm"
              >
                <Hexagon className="w-4 h-4 text-cyan-400" />
                <span>Explore Hardware</span>
              </button>
            </div>
          </div>

          {/* Right Column: Hero Real Hardware Breadboard Photo */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl overflow-hidden border border-[#1c2e50] bg-[#070d1d] shadow-2xl group aspect-[16/9]">
              <img
                src="/hardware/overview_hero_setup.jpg"
                alt="SemLiFi Hardware Setup with Dual STM32 Nodes"
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
              />

              {/* Gradient Vignette Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

              {/* Hotspot & Annotation Overlays matching the original prototype */}
              {/* STM32 TX Callout (Left) */}
              <div className="absolute top-[28%] left-[30%] -translate-x-1/2 flex flex-col items-center pointer-events-none animate-fadeIn">
                <div className="px-2.5 py-1 rounded-md bg-[#0a1224]/90 border border-blue-500/80 backdrop-blur-md shadow-lg shadow-blue-950/60 text-center">
                  <span className="text-[10px] font-bold text-white block">Transmitter</span>
                  <span className="text-[9px] font-mono text-blue-400 block">(STM32 TX)</span>
                </div>
                <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-transparent" />
              </div>

              {/* LED TX Callout */}
              <div className="absolute top-[16%] left-[45%] -translate-x-1/2 flex flex-col items-center pointer-events-none animate-fadeIn">
                <div className="px-2.5 py-1 rounded-md bg-[#1f0a0e]/90 border border-rose-500/80 backdrop-blur-md shadow-lg shadow-rose-950/60 text-center">
                  <span className="text-[10px] font-bold text-white block">LED</span>
                  <span className="text-[9px] font-mono text-rose-400 block">(Transmitter)</span>
                </div>
                <div className="w-0.5 h-6 bg-gradient-to-b from-rose-500 to-transparent" />
              </div>

              {/* Optical Link Arrow Callout */}
              <div className="absolute top-[26%] left-[54%] -translate-x-1/2 flex flex-col items-center pointer-events-none animate-fadeIn">
                <div className="px-2.5 py-1 rounded-md bg-[#1a0814]/90 border border-rose-500/60 backdrop-blur-md shadow-lg shadow-rose-950/40 text-center">
                  <span className="text-[10px] font-bold text-rose-300 block">Optical Link</span>
                  <span className="text-[9px] font-mono text-slate-300 block">(~ 15 cm)</span>
                </div>
              </div>

              {/* Photodiode RX Callout */}
              <div className="absolute top-[16%] left-[64%] -translate-x-1/2 flex flex-col items-center pointer-events-none animate-fadeIn">
                <div className="px-2.5 py-1 rounded-md bg-[#071911]/90 border border-emerald-500/80 backdrop-blur-md shadow-lg shadow-emerald-950/60 text-center">
                  <span className="text-[10px] font-bold text-white block">Photodiode</span>
                  <span className="text-[9px] font-mono text-emerald-400 block">(Receiver)</span>
                </div>
                <div className="w-0.5 h-6 bg-gradient-to-b from-emerald-500 to-transparent" />
              </div>

              {/* STM32 RX Callout (Right) */}
              <div className="absolute top-[28%] left-[78%] -translate-x-1/2 flex flex-col items-center pointer-events-none animate-fadeIn">
                <div className="px-2.5 py-1 rounded-md bg-[#0a1224]/90 border border-blue-500/80 backdrop-blur-md shadow-lg shadow-blue-950/60 text-center">
                  <span className="text-[10px] font-bold text-white block">Receiver</span>
                  <span className="text-[9px] font-mono text-blue-400 block">(STM32 RX)</span>
                </div>
                <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-transparent" />
              </div>

              {/* Real-time Link Status Badge */}
              <div className="absolute bottom-3 left-4 flex items-center space-x-2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-slate-300">REAL HARDWARE TWIN &bull; LIVE SYNCED</span>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 2. 3-BLOCK HARDWARE STATUS PIPELINE STRIP                 */}
        {/* ========================================================= */}
        <section className="rounded-2xl border border-[#1b2a48] bg-[#070d1e]/90 p-4 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Card 1: Transmitter */}
            <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-[#091126]/60 border border-[#15233e]">
              <div className="w-11 h-11 rounded-xl bg-blue-950/80 border border-blue-500/40 flex items-center justify-center shrink-0 text-blue-400 shadow-md shadow-blue-950/50">
                <Box className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-white truncate">
                    Transmitter (STM32 TX)
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 shrink-0">
                    ● Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  Generates PWM modulated signal to drive the LED
                </p>
              </div>
            </div>

            {/* Card 2: Optical Link */}
            <div className="relative flex items-center space-x-3.5 p-3 rounded-xl bg-[#091126]/60 border border-[#15233e] overflow-hidden">
              <div className="w-11 h-11 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400 shadow-md shadow-amber-950/50">
                <Sun className="w-5 h-5" />
              </div>
              <div className="min-w-0 z-10">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-white truncate">
                    Optical Link
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 shrink-0">
                    ● Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  Visible light transmission (line-of-sight ~ 15 cm)
                </p>
              </div>

              {/* Glowing Particle Wave Line Graphic */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-28 h-8 opacity-40 pointer-events-none">
                <svg viewBox="0 0 100 24" className="w-full h-full">
                  <path
                    d="M0,12 Q25,0 50,12 T100,12"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                </svg>
              </div>
            </div>

            {/* Card 3: Receiver */}
            <div className="flex items-center space-x-3.5 p-3 rounded-xl bg-[#091126]/60 border border-[#15233e]">
              <div className="w-11 h-11 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400 shadow-md shadow-cyan-950/50">
                <Cpu className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-bold text-white truncate">
                    Receiver (STM32 RX)
                  </h3>
                  <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/40 shrink-0">
                    ● Active
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">
                  Receives, amplifies and decodes the signal back to data
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. "HOW IT WORKS?" 6-STEP HORIZONTAL PIPELINE             */}
        {/* ========================================================= */}
        <section className="space-y-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-3.5 h-0.5 bg-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-wide font-sans">
                How It Works?
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              End-to-end visible light communication in 6 simple steps
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Step 01: Input Data */}
            <div className="rounded-xl border border-[#192742] bg-[#080e1e] p-3 flex flex-col justify-between hover:border-blue-500/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-600/40">
                  01
                </span>
                <span className="text-[11px] font-bold text-white">Input Data</span>
              </div>

              {/* Graphic: Laptop Screen */}
              <div className="my-2.5 h-16 rounded-lg bg-[#040711] border border-[#1c2c4c] p-2 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-blue-500/40 transition">
                <div className="px-2 py-1 rounded bg-blue-950/80 border border-blue-500/60 text-[9px] font-mono text-cyan-300 text-center truncate max-w-full">
                  Hello SemLiFi! 🚀
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Text message is converted to binary data.
              </p>
            </div>

            {/* Step 02: STM32 TX */}
            <div className="rounded-xl border border-[#192742] bg-[#080e1e] p-3 flex flex-col justify-between hover:border-blue-500/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-600/40">
                  02
                </span>
                <span className="text-[11px] font-bold text-white">STM32 TX</span>
              </div>

              {/* Graphic: Board + PWM square wave */}
              <div className="my-2.5 h-16 rounded-lg bg-[#040711] border border-[#1c2c4c] p-1.5 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-blue-500/40 transition">
                <img
                  src="/hardware/stm32_board.jpg"
                  alt="STM32 TX"
                  className="h-8 w-auto object-cover rounded opacity-80"
                />
                <div className="w-full h-3 flex items-center justify-center mt-1">
                  <svg viewBox="0 0 80 12" className="w-full h-full stroke-cyan-400 fill-none stroke-[1.5]">
                    <path d="M0,10 L15,10 L15,2 L30,2 L30,10 L45,10 L45,2 L60,2 L60,10 L80,10" />
                  </svg>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Generates PWM modulated signal to drive the LED.
              </p>
            </div>

            {/* Step 03: LED Transmission */}
            <div className="rounded-xl border border-[#192742] bg-[#080e1e] p-3 flex flex-col justify-between hover:border-rose-500/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/40">
                  03
                </span>
                <span className="text-[11px] font-bold text-white">LED Transmission</span>
              </div>

              {/* Graphic: Glowing Red LED */}
              <div className="my-2.5 h-16 rounded-lg bg-[#040711] border border-[#1c2c4c] p-1.5 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-rose-500/40 transition">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-rose-600 shadow-lg shadow-rose-500/60 animate-pulse border border-rose-400" />
                  <div className="w-10 h-4 flex items-center">
                    <svg viewBox="0 0 40 12" className="w-full h-full stroke-rose-400 fill-none stroke-[1.5]">
                      <path d="M0,10 L10,10 L10,2 L20,2 L20,10 L30,10 L30,2 L40,2" />
                    </svg>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Converts electrical signal into modulated light.
              </p>
            </div>

            {/* Step 04: Optical Link */}
            <div className="rounded-xl border border-[#192742] bg-[#080e1e] p-3 flex flex-col justify-between hover:border-rose-500/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-600/40">
                  04
                </span>
                <span className="text-[11px] font-bold text-white">Optical Link</span>
              </div>

              {/* Graphic: Photon Beam rays */}
              <div className="my-2.5 h-16 rounded-lg bg-[#040711] border border-[#1c2c4c] p-1.5 flex items-center justify-center relative overflow-hidden group-hover:border-rose-500/40 transition">
                <div className="w-full flex items-center justify-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <ArrowRight className="w-4 h-4 text-rose-400" />
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Light travels through air (line-of-sight) to the receiver.
              </p>
            </div>

            {/* Step 05: Photodiode & Conditioning */}
            <div className="rounded-xl border border-[#192742] bg-[#080e1e] p-3 flex flex-col justify-between hover:border-emerald-500/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40">
                  05
                </span>
                <span className="text-[10px] font-bold text-white truncate">Photodiode & Cond.</span>
              </div>

              {/* Graphic: Photodiode chip + green analog wave */}
              <div className="my-2.5 h-16 rounded-lg bg-[#040711] border border-[#1c2c4c] p-1.5 flex items-center justify-center space-x-2 relative overflow-hidden group-hover:border-emerald-500/40 transition">
                <img
                  src="/hardware/photodiode_macro.jpg"
                  alt="Photodiode"
                  className="w-6 h-6 object-cover rounded opacity-80"
                />
                <div className="w-10 h-4 flex items-center">
                  <svg viewBox="0 0 40 12" className="w-full h-full stroke-emerald-400 fill-none stroke-[1.5]">
                    <path d="M0,6 Q10,0 20,6 T40,6" />
                  </svg>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Converts light to electrical signal and amplifies/filters it.
              </p>
            </div>

            {/* Step 06: STM32 RX */}
            <div className="rounded-xl border border-[#192742] bg-[#080e1e] p-3 flex flex-col justify-between hover:border-blue-500/50 transition group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-300 border border-blue-600/40">
                  06
                </span>
                <span className="text-[11px] font-bold text-white">STM32 RX</span>
              </div>

              {/* Graphic: Board + Decoded message bubble */}
              <div className="my-2.5 h-16 rounded-lg bg-[#040711] border border-[#1c2c4c] p-1.5 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-blue-500/40 transition">
                <img
                  src="/hardware/stm32_board.jpg"
                  alt="STM32 RX"
                  className="h-7 w-auto object-cover rounded opacity-80"
                />
                <span className="text-[8px] font-mono text-emerald-300 mt-1 truncate">
                  Hello SemLiFi! 🚀
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Samples and reconstructs the received data.
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* 4. BOTTOM TELEMETRY DOCK (4 Metric Cards)                 */}
        {/* ========================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Demo Ready */}
          <div className="p-3.5 rounded-xl border border-[#1b2a48] bg-[#070d1e] flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 flex items-center justify-center shrink-0 text-purple-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">
                Live Demo Ready
              </h4>
              <div className="flex items-center space-x-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] text-emerald-400 font-mono">
                  System configured and connected
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Optical Link Distance */}
          <div className="p-3.5 rounded-xl border border-[#1b2a48] bg-[#070d1e] flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-950/80 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
              <Sun className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white truncate">
                  Optical Link Distance
                </h4>
                <span className="text-[10px] font-mono text-cyan-300">
                  ~ {distance} cm (Adjustable)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="35"
                value={distance}
                onChange={(e) => setDistance(Number(e.target.value))}
                className="w-full mt-1.5 accent-cyan-400 cursor-pointer h-1 bg-slate-800 rounded"
              />
            </div>
          </div>

          {/* Card 3: Current Transmission */}
          <div className="p-3.5 rounded-xl border border-[#1b2a48] bg-[#070d1e] flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center shrink-0 text-cyan-400">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  Current Transmission
                </h4>
                {isEditingMsg ? (
                  <div className="flex items-center space-x-1 mt-0.5">
                    <input
                      type="text"
                      value={tempMsg}
                      onChange={(e) => setTempMsg(e.target.value)}
                      className="text-[11px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-300 font-mono w-28 focus:outline-none"
                    />
                    <button
                      onClick={handleSaveMsg}
                      className="p-1 rounded bg-blue-600 text-white hover:bg-blue-500"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[11px] text-cyan-300 font-mono truncate mt-0.5">
                    {currentMessage}
                  </p>
                )}
              </div>
            </div>

            {!isEditingMsg && (
              <button
                onClick={() => setIsEditingMsg(true)}
                className="px-2.5 py-1 rounded-lg bg-[#0e172c] hover:bg-[#162340] border border-[#203358] text-[10px] font-medium text-slate-300 hover:text-white transition shrink-0"
              >
                Change
              </button>
            )}
          </div>

          {/* Card 4: Last Transmission */}
          <div className="p-3.5 rounded-xl border border-[#1b2a48] bg-[#070d1e] flex items-center justify-between space-x-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white truncate">
                  Last Transmission
                </h4>
                <div className="flex items-center space-x-1.5 mt-0.5 text-[11px] font-mono">
                  <span className="text-emerald-400 font-bold">Success</span>
                  <span className="text-slate-500">&bull;</span>
                  <span className="text-slate-400">0 bit errors</span>
                </div>
              </div>
            </div>

            <div className="text-right text-[10px] font-mono text-slate-500 shrink-0">
              <div>10 Oct 2026</div>
              <div>04:55 AM</div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

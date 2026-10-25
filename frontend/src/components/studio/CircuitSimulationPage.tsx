import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  MousePointer,
  PenTool,
  Type,
  Activity,
  Camera,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  Cpu,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { DIGITAL_TWIN_COMPONENTS, DigitalTwinComponent } from '../../model/digitalTwin';

interface CircuitSimulationPageProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  isDarkMode: boolean;
  workingDistanceCm: number;
  onDistanceChange: (d: number) => void;
  ambientLux: number;
  onAmbientLuxChange: (lux: number) => void;
}

export const CircuitSimulationPage: React.FC<CircuitSimulationPageProps> = ({
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  selectedComponentId,
  onSelectComponent,
  isDarkMode,
  workingDistanceCm,
  onDistanceChange,
  ambientLux,
  onAmbientLuxChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeCanvasTool, setActiveCanvasTool] = useState<'select' | 'wire' | 'text' | 'probe' | 'camera'>('select');

  // Accordion open states
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({
    mcu: true,
    optical: true,
    analog: true,
    drivers: true
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const selectedComp =
    DIGITAL_TWIN_COMPONENTS.find((c) => c.id === selectedComponentId) ||
    DIGITAL_TWIN_COMPONENTS.find((c) => c.id === 'led_tx') ||
    DIGITAL_TWIN_COMPONENTS[0];

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-hidden ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER & SIMULATION CONTROLS                       */}
      {/* ========================================================= */}
      <div
        className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'bg-[#0b101d] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h1
              className={`text-base sm:text-lg font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Circuit &amp; Simulation
            </h1>
            <p
              className={`text-xs -mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Design and simulate the LiFi communication circuit
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onToggleSimulation}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-md transition-all active:scale-95 ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'
            }`}
          >
            {isSimulating ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isSimulating ? 'Pause Simulation' : 'Run Simulation'}</span>
          </button>

          <button
            onClick={onResetSimulation}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
              isDarkMode
                ? 'bg-[#0f172a] hover:bg-[#1e293b] text-slate-300 border-slate-700'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. THREE-COLUMN WORKBENCH LAYOUT                          */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* ======================================================= */}
        {/* COLUMN A: COMPONENTS LIBRARY (Left Panel)               */}
        {/* ======================================================= */}
        <div
          className={`w-64 sm:w-72 border-r flex flex-col shrink-0 overflow-hidden ${
            isDarkMode ? 'bg-[#090f1e] border-[#172642]' : 'bg-white border-slate-200'
          }`}
        >
          {/* Library Header */}
          <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
            <h2
              className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Components
            </h2>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors ${
                  isDarkMode
                    ? 'bg-[#0c1426] border-[#1c2d4e] text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Accordion Categories */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-2 text-xs">
            {/* Category 1: Microcontrollers */}
            <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory('mcu')}
                className={`w-full px-3 py-2 flex items-center justify-between font-semibold transition ${
                  isDarkMode ? 'bg-[#0e172c] hover:bg-[#131f3b] text-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {openCategories.mcu ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Microcontrollers</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  2
                </span>
              </button>

              {openCategories.mcu && (
                <div className="p-1.5 space-y-1">
                  <div
                    onClick={() => onSelectComponent('stm32_tx')}
                    className={`p-2 rounded-lg flex items-center space-x-2.5 cursor-pointer transition ${
                      selectedComponentId === 'stm32_tx'
                        ? 'bg-blue-500/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-xs">STM32F103C8</div>
                      <div className="text-[10px] text-slate-400 font-mono">ARM Cortex-M3</div>
                    </div>
                  </div>

                  <div
                    onClick={() => onSelectComponent('stm32_rx')}
                    className={`p-2 rounded-lg flex items-center space-x-2.5 cursor-pointer transition ${
                      selectedComponentId === 'stm32_rx'
                        ? 'bg-blue-500/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center shrink-0">
                      <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <div>
                      <div className="text-xs">ESP32 DevKit</div>
                      <div className="text-[10px] text-slate-400 font-mono">Dual-Core 240MHz</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category 2: Optical */}
            <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory('optical')}
                className={`w-full px-3 py-2 flex items-center justify-between font-semibold transition ${
                  isDarkMode ? 'bg-[#0e172c] hover:bg-[#131f3b] text-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {openCategories.optical ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Optical</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  2
                </span>
              </button>

              {openCategories.optical && (
                <div className="p-1.5 space-y-1">
                  <div
                    onClick={() => onSelectComponent('led_tx')}
                    className={`p-2 rounded-lg flex items-center space-x-2.5 cursor-pointer transition ${
                      selectedComponentId === 'led_tx'
                        ? 'bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    </div>
                    <div>
                      <div className="text-xs">Red LED</div>
                      <div className="text-[10px] text-slate-400 font-mono">650 nm Emitter</div>
                    </div>
                  </div>

                  <div
                    onClick={() => onSelectComponent('bpw34_photodiode')}
                    className={`p-2 rounded-lg flex items-center space-x-2.5 cursor-pointer transition ${
                      selectedComponentId === 'bpw34_photodiode'
                        ? 'bg-blue-500/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center shrink-0">
                      <Radio className="w-3.5 h-3.5 text-cyan-500" />
                    </div>
                    <div>
                      <div className="text-xs">BPW34 Photodiode</div>
                      <div className="text-[10px] text-slate-400 font-mono">PIN Sensor (7.5mm²)</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category 3: Analog */}
            <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory('analog')}
                className={`w-full px-3 py-2 flex items-center justify-between font-semibold transition ${
                  isDarkMode ? 'bg-[#0e172c] hover:bg-[#131f3b] text-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {openCategories.analog ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Analog</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  1
                </span>
              </button>

              {openCategories.analog && (
                <div className="p-1.5 space-y-1">
                  <div
                    onClick={() => onSelectComponent('lm358_amplifier')}
                    className={`p-2 rounded-lg flex items-center space-x-2.5 cursor-pointer transition ${
                      selectedComponentId === 'lm358_amplifier'
                        ? 'bg-blue-500/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-amber-500/20 flex items-center justify-center shrink-0">
                      <Activity className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <div>
                      <div className="text-xs">LM358 Op-Amp</div>
                      <div className="text-[10px] text-slate-400 font-mono">Dual TIA / Filter</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Category 4: Transistors & Drivers */}
            <div className="border border-slate-200 dark:border-slate-800/80 rounded-xl overflow-hidden">
              <button
                onClick={() => toggleCategory('drivers')}
                className={`w-full px-3 py-2 flex items-center justify-between font-semibold transition ${
                  isDarkMode ? 'bg-[#0e172c] hover:bg-[#131f3b] text-slate-200' : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {openCategories.drivers ? (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span>Transistors &amp; Drivers</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                  1
                </span>
              </button>

              {openCategories.drivers && (
                <div className="p-1.5 space-y-1">
                  <div
                    onClick={() => onSelectComponent('transistor_2n2222')}
                    className={`p-2 rounded-lg flex items-center space-x-2.5 cursor-pointer transition ${
                      selectedComponentId === 'transistor_2n2222'
                        ? 'bg-blue-500/15 border border-blue-500/40 text-blue-600 dark:text-blue-400 font-semibold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center shrink-0">
                      <Zap className="w-3.5 h-3.5 text-purple-500" />
                    </div>
                    <div>
                      <div className="text-xs">2N2222 NPN</div>
                      <div className="text-[10px] text-slate-400 font-mono">BJT 800mA Switch</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* COLUMN B: INTERACTIVE CANVAS (Center Area)              */}
        {/* ======================================================= */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Canvas Toolbar (Top floating bar matching reference) */}
          <div
            className={`px-4 py-2 border-b flex items-center justify-between z-10 ${
              isDarkMode ? 'bg-[#09101f] border-[#182744]' : 'bg-white/95 border-slate-200/90 shadow-sm'
            }`}
          >
            {/* Left Tool Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setActiveCanvasTool('select')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'select'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title="Select Tool"
              >
                <MousePointer className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveCanvasTool('wire')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'wire'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title="Wire / Pencil"
              >
                <PenTool className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveCanvasTool('text')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'text'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title="Add Text Label"
              >
                <Type className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveCanvasTool('probe')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'probe'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title="Voltage Probe / Multimeter"
              >
                <Activity className="w-4 h-4" />
              </button>

              <button
                onClick={() => setActiveCanvasTool('camera')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'camera'
                    ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white'
                }`}
                title="Take Canvas Snapshot"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Right Zoom Controls */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 10))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="px-1.5">{zoomLevel}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.min(150, z + 10))}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Schematic Canvas */}
          <div
            className={`flex-1 overflow-auto flex items-center justify-center p-6 ${
              isDarkMode
                ? 'bg-[#050811] tech-grid'
                : 'bg-[#f1f5f9] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]'
            }`}
          >
            {/* Connected Schematic Diagram Frame */}
            <div
              className={`w-full max-w-4xl p-6 sm:p-8 rounded-2xl border transition-all duration-300 shadow-xl relative overflow-hidden ${
                isDarkMode ? 'bg-[#080d1a] border-[#182a4a]' : 'bg-white border-slate-200'
              }`}
              style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
            >
              {/* Circuit Title Header */}
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span
                    className={`text-xs font-bold font-mono tracking-wide ${
                      isDarkMode ? 'text-white' : 'text-slate-800'
                    }`}
                  >
                    SemLiFi Full Optical Transceiver Pipeline
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Carrier: 10 kHz PWM &bull; Optical Air Gap: {workingDistanceCm} cm
                </div>
              </div>

              {/* Main Connected Blocks Row */}
              <div className="py-8 flex flex-wrap items-center justify-between gap-3 relative">
                {/* 1. STM32 (TX) */}
                <div
                  onClick={() => onSelectComponent('stm32_tx')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all w-28 text-center ${
                    selectedComponentId === 'stm32_tx'
                      ? 'bg-blue-500/20 border-blue-500 shadow-lg shadow-blue-500/20 ring-2 ring-blue-500/30'
                      : isDarkMode
                      ? 'bg-[#0e172a] border-slate-700 hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-400 shadow-sm'
                  }`}
                >
                  <Cpu className="w-6 h-6 text-blue-500 mb-1.5" />
                  <div
                    className={`text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    STM32 (TX)
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">TIM1_CH2</div>
                </div>

                {/* Wire Arrow */}
                <div className="flex items-center text-slate-400 dark:text-slate-600 font-bold text-xs">
                  &rarr;
                </div>

                {/* 2. 2N2222 Driver */}
                <div
                  onClick={() => onSelectComponent('transistor_2n2222')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all w-28 text-center ${
                    selectedComponentId === 'transistor_2n2222'
                      ? 'bg-purple-500/20 border-purple-500 shadow-lg shadow-purple-500/20 ring-2 ring-purple-500/30'
                      : isDarkMode
                      ? 'bg-[#0e172a] border-slate-700 hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 hover:border-purple-400 shadow-sm'
                  }`}
                >
                  <Zap className="w-6 h-6 text-purple-500 mb-1.5" />
                  <div
                    className={`text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    2N2222 Driver
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">NPN BJT</div>
                </div>

                {/* Wire Arrow */}
                <div className="flex items-center text-slate-400 dark:text-slate-600 font-bold text-xs">
                  &rarr;
                </div>

                {/* 3. Red LED (650 nm) */}
                <div
                  onClick={() => onSelectComponent('led_tx')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all w-32 text-center relative ${
                    selectedComponentId === 'led_tx'
                      ? 'bg-red-500/20 border-red-500 shadow-lg shadow-red-500/20 ring-2 ring-red-500/30'
                      : isDarkMode
                      ? 'bg-[#0e172a] border-slate-700 hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 hover:border-red-400 shadow-sm'
                  }`}
                >
                  <div className="relative mb-1.5">
                    <span
                      className={`w-4 h-4 rounded-full bg-red-500 inline-block ${
                        isSimulating ? 'animate-ping opacity-75' : ''
                      }`}
                    />
                    <span className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_12px_#ef4444] absolute inset-0" />
                  </div>
                  <div
                    className={`text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Red LED
                  </div>
                  <div className="text-[9px] text-red-500 font-mono mt-0.5 font-semibold">650 nm</div>
                </div>

                {/* 4. Optical Channel Box (Exact match to reference) */}
                <div
                  className={`px-3 py-2 rounded-xl border border-dashed flex flex-col items-center justify-center min-w-[130px] transition ${
                    isSimulating
                      ? 'border-red-500 bg-red-500/10'
                      : isDarkMode
                      ? 'border-slate-700 bg-slate-900/40 text-slate-400'
                      : 'border-slate-300 bg-slate-50 text-slate-500'
                  }`}
                >
                  <div className="text-[10px] font-mono font-bold text-red-500">
                    Optical Channel
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    (~ {workingDistanceCm} cm LOS)
                  </div>
                  {isSimulating && (
                    <div className="flex space-x-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce [animation-delay:0.3s]" />
                    </div>
                  )}
                </div>

                {/* Wire Arrow */}
                <div className="flex items-center text-slate-400 dark:text-slate-600 font-bold text-xs">
                  &rarr;
                </div>

                {/* 5. BPW34 (RX) */}
                <div
                  onClick={() => onSelectComponent('bpw34_photodiode')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all w-28 text-center ${
                    selectedComponentId === 'bpw34_photodiode'
                      ? 'bg-cyan-500/20 border-cyan-500 shadow-lg shadow-cyan-500/20 ring-2 ring-cyan-500/30'
                      : isDarkMode
                      ? 'bg-[#0e172a] border-slate-700 hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 hover:border-cyan-400 shadow-sm'
                  }`}
                >
                  <Radio className="w-6 h-6 text-cyan-500 mb-1.5" />
                  <div
                    className={`text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    BPW34 (RX)
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">PIN Detector</div>
                </div>

                {/* Wire Arrow */}
                <div className="flex items-center text-slate-400 dark:text-slate-600 font-bold text-xs">
                  &rarr;
                </div>

                {/* 6. LM358 Amplifier */}
                <div
                  onClick={() => onSelectComponent('lm358_amplifier')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all w-32 text-center ${
                    selectedComponentId === 'lm358_amplifier'
                      ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/30'
                      : isDarkMode
                      ? 'bg-[#0e172a] border-slate-700 hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 hover:border-amber-400 shadow-sm'
                  }`}
                >
                  <Activity className="w-6 h-6 text-amber-500 mb-1.5" />
                  <div
                    className={`text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    LM358 Amplifier
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">Transimpedance</div>
                </div>

                {/* Wire Arrow */}
                <div className="flex items-center text-slate-400 dark:text-slate-600 font-bold text-xs">
                  &rarr;
                </div>

                {/* 7. STM32 (RX) */}
                <div
                  onClick={() => onSelectComponent('stm32_rx')}
                  className={`flex flex-col items-center justify-center p-3.5 rounded-xl border cursor-pointer transition-all w-28 text-center ${
                    selectedComponentId === 'stm32_rx'
                      ? 'bg-emerald-500/20 border-emerald-500 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                      : isDarkMode
                      ? 'bg-[#0e172a] border-slate-700 hover:border-slate-500'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-400 shadow-sm'
                  }`}
                >
                  <Cpu className="w-6 h-6 text-emerald-500 mb-1.5" />
                  <div
                    className={`text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    STM32 (RX)
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono mt-0.5">TIM2_CH1 Capture</div>
                </div>
              </div>
            </div>
          </div>

          {/* Canvas Bottom: Communication Pipeline Bar (Exact Match to screenshot) */}
          <div
            className={`px-5 py-3 border-t shrink-0 ${
              isDarkMode ? 'bg-[#09101f] border-[#182744]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                Communication Pipeline
              </div>

              {/* Horizontal Pill Steps */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-medium">
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Message
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Manchester Encode
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                  LED Modulation
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Optical Channel
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/30">
                  Amplification
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  ADC &amp; Decode
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* COLUMN C: PROPERTIES INSPECTOR (Right Panel)            */}
        {/* ======================================================= */}
        <div
          className={`w-72 sm:w-80 border-l flex flex-col shrink-0 overflow-y-auto ${
            isDarkMode ? 'bg-[#090f1e] border-[#172642]' : 'bg-white border-slate-200'
          }`}
        >
          {/* Properties Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2
              className={`text-xs font-bold uppercase tracking-wider ${
                isDarkMode ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              Properties
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              Active
            </span>
          </div>

          {/* Component Details Card (Matching Red LED Properties in reference) */}
          <div className="p-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <span className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444]" />
              </div>
              <div>
                <h3
                  className={`text-sm font-bold tracking-tight ${
                    isDarkMode ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {selectedComp.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedComp.type}
                </span>
              </div>
            </div>

            {/* Specifications Table */}
            <div
              className={`rounded-xl border p-3 text-xs space-y-2.5 ${
                isDarkMode ? 'bg-[#0c1426] border-[#1a2b4b]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Wavelength</span>
                <span
                  className={`font-mono font-bold ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  650 nm
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Forward Voltage</span>
                <span
                  className={`font-mono font-bold ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  2.0 V
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 dark:text-slate-500">Current (If)</span>
                <span
                  className={`font-mono font-bold ${
                    isDarkMode ? 'text-white' : 'text-slate-800'
                  }`}
                >
                  20 mA
                </span>
              </div>
            </div>

            {/* Info Callout Box (Exact match to reference) */}
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/25 text-blue-900 dark:text-blue-300 text-xs space-y-1">
              <div className="flex items-center space-x-1.5 font-bold">
                <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>IR/Visible Emitter</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-700 dark:text-blue-200/90">
                Converts electrical signal to modulated optical signal.
              </p>
            </div>

            {/* Simulation Channel Knobs */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono">
                Simulation Knobs
              </h4>

              {/* Working Distance Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Air Gap (Distance):</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {workingDistanceCm} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={workingDistanceCm}
                  onChange={(e) => onDistanceChange(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Ambient Noise Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Ambient Noise:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {ambientLux} Lux
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="50"
                  value={ambientLux}
                  onChange={(e) => onAmbientLuxChange(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

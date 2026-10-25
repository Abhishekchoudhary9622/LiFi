import React, { useState } from 'react';
import {
  Camera,
  Share2,
  Tag,
  ZoomIn,
  ZoomOut,
  Maximize2,
  CheckCircle2,
  Cpu,
  Zap,
  Radio,
  Activity,
  ArrowRight,
  Info
} from 'lucide-react';
import {
  DIGITAL_TWIN_COMPONENTS,
  DIGITAL_TWIN_CONNECTIONS,
  DigitalTwinComponent
} from '../../model/digitalTwin';

interface HardwareTwinPageProps {
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  isDarkMode: boolean;
}

export const HardwareTwinPage: React.FC<HardwareTwinPageProps> = ({
  selectedComponentId,
  onSelectComponent,
  isDarkMode
}) => {
  const [viewMode, setViewMode] = useState<'photo' | 'wiring' | 'annotated'>('photo');
  const [activeRightTab, setActiveRightTab] = useState<'components' | 'connections'>('components');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const selectedComp =
    DIGITAL_TWIN_COMPONENTS.find((c) => c.id === selectedComponentId) ||
    DIGITAL_TWIN_COMPONENTS.find((c) => c.id === 'led_tx') ||
    DIGITAL_TWIN_COMPONENTS[0];

  // Specific 6 components listed in user's reference mockup
  const hardwareTwinList = [
    { id: 'led_tx', name: 'Red LED', badge: 'Active', color: 'bg-red-500' },
    { id: 'bpw34_photodiode', name: 'BPW34', badge: 'Active', color: 'bg-cyan-500' },
    { id: 'lm358_amplifier', name: 'LM358', badge: 'Active', color: 'bg-amber-500' },
    { id: 'transistor_2n2222', name: '2N2222', badge: 'Active', color: 'bg-purple-500' },
    { id: 'stm32_tx', name: 'STM32 (TX)', badge: 'Active', color: 'bg-blue-500' },
    { id: 'stm32_rx', name: 'STM32 (RX)', badge: 'Active', color: 'bg-emerald-500' }
  ];

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-hidden ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER & VIEW MODE BUTTONS                         */}
      {/* ========================================================= */}
      <div
        className={`px-5 py-3.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'bg-[#0b101d] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div>
          <h1
            className={`text-base sm:text-lg font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Hardware Twin
          </h1>
          <p
            className={`text-xs -mt-0.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Explore the real hardware setup, wiring and pin configuration.
          </p>
        </div>

        {/* View Switch Buttons (Exact match to Photo View / Wiring View / Annotated View) */}
        <div
          className={`flex items-center space-x-1 p-1 rounded-xl border text-xs font-semibold ${
            isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setViewMode('photo')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'photo'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Photo View</span>
          </button>

          <button
            onClick={() => setViewMode('wiring')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'wiring'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Wiring View</span>
          </button>

          <button
            onClick={() => setViewMode('annotated')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'annotated'
                ? 'bg-blue-600 text-white shadow-md font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Annotated View</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN SPLIT VIEW (Interactive Photo vs Right Sidebar)   */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Main Left Stage: Photo & Hotspots */}
        <div className="flex-1 relative overflow-hidden bg-black/95 flex items-center justify-center p-2 sm:p-4">
          <div
            className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-slate-800 shadow-2xl transition-transform duration-200"
            style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'center' }}
          >
            {/* The Real Breadboard Hardware Setup Photo */}
            <img
              src="/hardware/full_hardware_setup.jpg"
              alt="SemLiFi Physical Hardware Setup"
              className={`w-full h-auto object-cover object-center max-h-[72vh] select-none ${
                viewMode === 'wiring' ? 'filter grayscale brightness-50 contrast-125' : ''
              }`}
            />

            {/* Overlaid Wiring Overlay (when in Wiring View) */}
            {viewMode === 'wiring' && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1000 600"
                preserveAspectRatio="none"
              >
                {/* STM32 TX to 2N2222 Wire */}
                <path
                  d="M 230 400 Q 250 350 270 380"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
                {/* 2N2222 to Red LED Wire */}
                <path
                  d="M 285 380 Q 300 320 330 330"
                  fill="none"
                  stroke="#eab308"
                  strokeWidth="3.5"
                />
                {/* Optical Beam */}
                <line
                  x1="345"
                  y1="340"
                  x2="520"
                  y2="340"
                  stroke="#ef4444"
                  strokeWidth="6"
                  strokeOpacity="0.75"
                  strokeDasharray="8,6"
                />
                {/* Photodiode to LM358 */}
                <path
                  d="M 535 340 Q 560 380 580 400"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3.5"
                />
                {/* LM358 to STM32 RX */}
                <path
                  d="M 610 400 Q 680 380 730 400"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3.5"
                  strokeDasharray="6,4"
                  className="animate-pulse"
                />
              </svg>
            )}

            {/* ======================================================= */}
            {/* INTERACTIVE HOTSPOTS MATCHING USER IMAGE                */}
            {/* ======================================================= */}
            {(viewMode === 'photo' || viewMode === 'annotated') && (
              <>
                {/* Hotspot 1: STM32 (TX) */}
                <div
                  onClick={() => onSelectComponent('stm32_tx')}
                  className={`absolute left-[18%] bottom-[24%] cursor-pointer group transition-all z-20 ${
                    selectedComponentId === 'stm32_tx' ? 'scale-110' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-900/90 hover:bg-blue-800 text-white border-2 border-blue-400 text-xs font-bold shadow-xl backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>STM32 (TX)</span>
                  </div>
                </div>

                {/* Hotspot 2: Red LED (650 nm) */}
                <div
                  onClick={() => onSelectComponent('led_tx')}
                  className={`absolute left-[34%] top-[45%] cursor-pointer group transition-all z-20 ${
                    selectedComponentId === 'led_tx' ? 'scale-110' : ''
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-red-900/90 hover:bg-red-800 text-white border-2 border-red-400 text-xs font-bold shadow-xl backdrop-blur-md">
                      <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                      <span>Red LED (650 nm)</span>
                    </div>
                  </div>
                </div>

                {/* Hotspot 3: BPW34 (Photodiode) */}
                <div
                  onClick={() => onSelectComponent('bpw34_photodiode')}
                  className={`absolute left-[50%] top-[47%] cursor-pointer group transition-all z-20 ${
                    selectedComponentId === 'bpw34_photodiode' ? 'scale-110' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-emerald-950/90 hover:bg-emerald-900 text-white border-2 border-emerald-400 text-xs font-bold shadow-xl backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>BPW34 (Photodiode)</span>
                  </div>
                </div>

                {/* Hotspot 4: LM358 (Amplifier) */}
                <div
                  onClick={() => onSelectComponent('lm358_amplifier')}
                  className={`absolute left-[54%] bottom-[16%] cursor-pointer group transition-all z-20 ${
                    selectedComponentId === 'lm358_amplifier' ? 'scale-110' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-amber-950/90 hover:bg-amber-900 text-white border-2 border-amber-400 text-xs font-bold shadow-xl backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span>LM358 (Amplifier)</span>
                  </div>
                </div>

                {/* Hotspot 5: STM32 (RX) */}
                <div
                  onClick={() => onSelectComponent('stm32_rx')}
                  className={`absolute right-[14%] bottom-[24%] cursor-pointer group transition-all z-20 ${
                    selectedComponentId === 'stm32_rx' ? 'scale-110' : ''
                  }`}
                >
                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-900/90 hover:bg-blue-800 text-white border-2 border-blue-400 text-xs font-bold shadow-xl backdrop-blur-md">
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                    <span>STM32 (RX)</span>
                  </div>
                </div>
              </>
            )}

            {/* Bottom-left Photo Tools */}
            <div className="absolute left-3 bottom-3 flex items-center space-x-1.5 bg-black/75 backdrop-blur-md p-1.5 rounded-xl border border-slate-700 text-white z-30">
              <button
                onClick={() => setZoomLevel((z) => Math.min(160, z + 15))}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(70, z - 15))}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(100)}
                className="p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white"
                title="Reset Zoom"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* RIGHT SIDEBAR (Components & Connections + Selected Card)*/}
        {/* ======================================================= */}
        <div
          className={`w-72 sm:w-80 border-l flex flex-col shrink-0 overflow-y-auto ${
            isDarkMode ? 'bg-[#090f1e] border-[#172642]' : 'bg-white border-slate-200'
          }`}
        >
          {/* Tabs: [Components] [Connections] */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-800">
            <div
              className={`grid grid-cols-2 p-1 rounded-xl border text-xs font-semibold ${
                isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                onClick={() => setActiveRightTab('components')}
                className={`py-1.5 rounded-lg transition text-center ${
                  activeRightTab === 'components'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Components
              </button>

              <button
                onClick={() => setActiveRightTab('connections')}
                className={`py-1.5 rounded-lg transition text-center ${
                  activeRightTab === 'connections'
                    ? 'bg-blue-600 text-white shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Connections
              </button>
            </div>
          </div>

          {/* Tab Content: Components List */}
          {activeRightTab === 'components' ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
              {hardwareTwinList.map((item, idx) => {
                const isSelected =
                  selectedComponentId === item.id ||
                  (item.id === 'led_tx' && selectedComponentId.includes('led'));

                return (
                  <div
                    key={item.id}
                    onClick={() => onSelectComponent(item.id)}
                    className={`px-3 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/50 shadow-sm'
                        : isDarkMode
                        ? 'bg-[#0c1426] border-[#182744] hover:bg-[#111c36]'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-xs font-mono text-slate-400 w-3">
                        {idx + 1}
                      </span>
                      <span
                        className={`text-xs font-semibold ${
                          isSelected
                            ? 'text-blue-600 dark:text-blue-400 font-bold'
                            : isDarkMode
                            ? 'text-slate-200'
                            : 'text-slate-800'
                        }`}
                      >
                        {item.name}
                      </span>
                    </div>

                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Connections Table */
            <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
              <div className="text-[11px] font-mono text-slate-400 font-bold uppercase">
                Hardware Netlist
              </div>
              <div className="space-y-1.5">
                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    STM32 TX (PA9) &rarr; 2N2222 Base
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    10 kHz PWM Modulator via 1 kΩ base resistor
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                  <div className="font-semibold text-red-600 dark:text-red-400">
                    2N2222 Collector &rarr; Red LED Cathode
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    High-speed sinking switch (14.5 mA switched)
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    BPW34 Cathode &rarr; LM358 Inverting Pin
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Reverse biased photocurrent detection
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426]">
                  <div className="font-semibold text-cyan-600 dark:text-cyan-400">
                    LM358 Output &rarr; STM32 RX (PA0 ADC)
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Clean 3.3V recovered bitstream for decoding
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Selected Component Card (Exact match to Selected: Red LED) */}
          <div
            className={`p-4 border-t space-y-3 ${
              isDarkMode ? 'bg-[#0c1426] border-[#182744]' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Selected: <span className="text-blue-600 dark:text-blue-400">{selectedComp.name}</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-red-500/15 border border-red-500/30 flex items-center justify-center shrink-0">
                <span className="w-5 h-5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
              </div>

              <div className="text-xs space-y-0.5 font-mono">
                <div className="text-slate-500 dark:text-slate-400">
                  Type: <span className="text-slate-800 dark:text-slate-200 font-semibold">{selectedComp.type}</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  &lambda;: <span className="text-slate-800 dark:text-slate-200 font-semibold">650 nm</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  Vf: <span className="text-slate-800 dark:text-slate-200 font-semibold">2.0 V</span>
                </div>
                <div className="text-slate-500 dark:text-slate-400">
                  If: <span className="text-slate-800 dark:text-slate-200 font-semibold">20 mA</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

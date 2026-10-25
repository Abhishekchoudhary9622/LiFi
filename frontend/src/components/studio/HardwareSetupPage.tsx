import React, { useState } from 'react';
import {
  Camera,
  Layers,
  Radio,
  Sliders,
  CheckCircle2,
  X,
  ExternalLink,
  Info,
  Maximize2,
  Minimize2,
  Zap,
  Tag,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import {
  DIGITAL_TWIN_COMPONENTS,
  DIGITAL_TWIN_CONNECTIONS,
  DigitalTwinComponent
} from '../../model/digitalTwin';

interface HardwareSetupPageProps {
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  onNavigateToSchematic?: () => void;
}

export const HardwareSetupPage: React.FC<HardwareSetupPageProps> = ({
  selectedComponentId,
  onSelectComponent,
  onNavigateToSchematic
}) => {
  // Top view controls: 'top' | 'closeup'
  const [viewMode, setViewMode] = useState<'top' | 'closeup'>('top');
  const [isAnnotated, setIsAnnotated] = useState<boolean>(true);
  const [isConnectionsOn, setIsConnectionsOn] = useState<boolean>(true);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);

  const selectedComp = DIGITAL_TWIN_COMPONENTS.find(c => c.id === selectedComponentId) || DIGITAL_TWIN_COMPONENTS[3]; // default to LED

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#030712] text-slate-100 font-sans overflow-hidden select-none">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & VIEW CONTROLS                             */}
      {/* ========================================================= */}
      <div className="px-4 py-3 bg-[#060c1a] border-b border-[#14233c] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-lg md:text-xl font-extrabold text-white font-sans tracking-wide">
            Hardware Setup
          </h2>
          <p className="text-[11px] text-slate-400 font-mono -mt-0.5 hidden sm:block">
            Dual STM32F103C8 Transceiver Nodes on Physical Breadboard
          </p>
        </div>

        {/* Top View Mode Buttons (Exact match to user screenshot) */}
        <div className="flex items-center space-x-1.5 bg-[#091122] p-1 rounded-xl border border-[#182744] text-xs font-mono">
          <button
            onClick={() => setViewMode('top')}
            className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
              viewMode === 'top'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Top View
          </button>

          <button
            onClick={() => setViewMode('closeup')}
            className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
              viewMode === 'closeup'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Close Up
          </button>

          <button
            onClick={() => setIsAnnotated(a => !a)}
            className={`px-3 py-1.5 rounded-lg transition-all font-bold ${
              isAnnotated
                ? 'bg-indigo-600/90 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Annotated
          </button>

          <button
            onClick={() => setIsConnectionsOn(c => !c)}
            className={`px-3 py-1.5 rounded-lg transition-all font-bold flex items-center space-x-1 ${
              isConnectionsOn
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3 text-cyan-200" />
            <span>Connections</span>
          </button>
        </div>

        {/* Persistent Minimal Signal Path (Section 11) */}
        <div className="hidden xl:flex items-center space-x-1 bg-[#040814] px-2.5 py-1 rounded-lg border border-[#14233c] text-[10px] font-mono">
          <span className="text-slate-500 font-bold uppercase mr-1">Signal Path:</span>
          {[
            { id: 'stm32_tx', label: 'STM32 TX' },
            { id: 'transistor_2n2222', label: 'DRIVER' },
            { id: 'led_tx', label: 'LED' },
            { id: 'optical_channel', label: 'OPTICAL' },
            { id: 'photodiode_rx', label: 'PHOTODIODE' },
            { id: 'signal_conditioning', label: 'AMPLIFIER' },
            { id: 'stm32_rx', label: 'STM32 RX' }
          ].map((item, idx, arr) => (
            <React.Fragment key={item.id}>
              <button
                onClick={() => onSelectComponent(item.id)}
                className={`flex items-center space-x-1 px-1.5 py-0.5 rounded transition-all ${
                  selectedComponentId === item.id
                    ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-500 shadow-sm shadow-cyan-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${selectedComponentId === item.id ? 'bg-cyan-400 animate-pulse' : 'bg-slate-600'}`} />
                <span>{item.label}</span>
              </button>
              {idx < arr.length - 1 && <span className="text-slate-600">&rarr;</span>}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. MAIN CENTER STAGE + RIGHT INSPECTOR                     */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* CENTER STAGE: REAL HARDWARE PHOTOGRAPH CANVAS */}
        <div className="flex-1 relative overflow-hidden bg-[#02050e] flex items-center justify-center p-2 sm:p-4">
          <div
            className={`relative max-w-full max-h-full aspect-[16/10] sm:aspect-[16/9] w-full rounded-2xl overflow-hidden border border-[#1b2b48] shadow-2xl transition-all duration-500 bg-black ${
              viewMode === 'closeup' ? 'scale-125 translate-y-[-5%]' : 'scale-100'
            }`}
          >
            {/* The Real Hardware Photograph (Hero) */}
            <img
              src="/hardware/full_hardware_setup.jpg"
              alt="Real SemLiFi Hardware Breadboard Setup"
              className="w-full h-full object-cover object-center select-none pointer-events-none"
            />

            {/* SVG OVERLAY: HOTSPOTS, ANNOTATIONS, & SIGNAL CONNECTIONS */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-auto"
              viewBox="0 0 1000 600"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Glow Filter for Active Component Hotspot */}
                <filter id="hwGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="beamPulseGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* OVERLAY CONNECTIONS (Visible when isConnectionsOn is TRUE) */}
              {isConnectionsOn && (
                <g className="transition-opacity duration-300">
                  {/* Electrical Wires (Solid Crisp Lines) */}
                  {/* STM32 TX (220, 360) -> 2N2222 Driver (310, 372) */}
                  <line
                    x1="220"
                    y1="360"
                    x2="310"
                    y2="372"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* 2N2222 Driver (310, 372) -> LED Cathode (340, 264) */}
                  <line
                    x1="310"
                    y1="372"
                    x2="340"
                    y2="264"
                    stroke="#a855f7"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* 220Ω Resistor (330, 312) -> LED Anode (340, 264) */}
                  <line
                    x1="330"
                    y1="312"
                    x2="340"
                    y2="264"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="4 2"
                  />

                  {/* Photodiode (430, 282) -> LM358 Signal Conditioning (540, 300) */}
                  <line
                    x1="430"
                    y1="282"
                    x2="540"
                    y2="300"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* LM358 (540, 300) -> STM32 RX (630, 360) */}
                  <line
                    x1="540"
                    y1="300"
                    x2="630"
                    y2="360"
                    stroke="#6366f1"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* =================================================== */}
                  {/* ✨ ANIMATED OPTICAL BEAM ACROSS FREE-SPACE AIR GAP  */}
                  {/* =================================================== */}
                  {/* Core Red Optical Ray with Moving Dash Array */}
                  <line
                    x1="340"
                    y1="264"
                    x2="430"
                    y2="282"
                    stroke="#ef4444"
                    strokeWidth="5"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    filter="url(#beamPulseGlow)"
                    className="animate-pulse"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="28"
                      to="0"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </line>

                  {/* Inner White Photon Core */}
                  <line
                    x1="340"
                    y1="264"
                    x2="430"
                    y2="282"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="6 8"
                    strokeLinecap="round"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="28"
                      to="0"
                      dur="0.6s"
                      repeatCount="indefinite"
                    />
                  </line>

                  {/* Optical Arrow Indicator right in the center */}
                  <polygon
                    points="392,270 384,265 384,275"
                    fill="#ef4444"
                  />
                </g>
              )}

              {/* HOTSPOTS FOR ALL 7 COMPONENTS (Normalized Coordinates mapped to 1000x600) */}
              {DIGITAL_TWIN_COMPONENTS.map((comp) => {
                const posX = comp.normalizedPosition.x * 1000;
                const posY = comp.normalizedPosition.y * 600;
                const boxW = comp.box.width * 1000;
                const boxH = comp.box.height * 600;
                const isSelected = selectedComponentId === comp.id;

                return (
                  <g
                    key={comp.id}
                    onClick={() => {
                      onSelectComponent(comp.id);
                      setIsInspectorOpen(true);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Glowing highlight box around the component on photo */}
                    <rect
                      x={posX - boxW / 2}
                      y={posY - boxH / 2}
                      width={boxW}
                      height={boxH}
                      rx="10"
                      fill={isSelected ? 'rgba(56, 189, 248, 0.22)' : 'rgba(15, 23, 42, 0.05)'}
                      stroke={isSelected ? '#38bdf8' : 'rgba(255, 255, 255, 0.3)'}
                      strokeWidth={isSelected ? '3' : '1.5'}
                      strokeDasharray={isSelected ? 'none' : '4 3'}
                      filter={isSelected ? 'url(#hwGlow)' : undefined}
                      className="transition-all duration-200 group-hover:stroke-cyan-400 group-hover:fill-cyan-500/10"
                    />

                    {/* Glowing Center Pulse Indicator */}
                    <circle
                      cx={posX}
                      cy={posY}
                      r={isSelected ? '6' : '4'}
                      fill={isSelected ? '#38bdf8' : '#ffffff'}
                      className="group-hover:scale-125 transition-transform"
                    />

                    {/* ANNOTATED CALLOUT BADGES (Matching User Screenshot exactly!) */}
                    {isAnnotated && (
                      <g className="transition-opacity duration-200">
                        {/* Connecting Pointer Stem */}
                        <line
                          x1={posX}
                          y1={posY - boxH / 2}
                          x2={posX}
                          y2={posY - boxH / 2 - 14}
                          stroke={isSelected ? '#38bdf8' : '#64748b'}
                          strokeWidth="1.5"
                        />

                        {/* Callout Pill / Badge */}
                        <g transform={`translate(${posX}, ${posY - boxH / 2 - 24})`}>
                          <rect
                            x="-65"
                            y="-14"
                            width="130"
                            height="24"
                            rx="12"
                            fill="rgba(8, 14, 28, 0.92)"
                            stroke={isSelected ? '#38bdf8' : '#1e3052'}
                            strokeWidth={isSelected ? '2' : '1'}
                            filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.6))"
                          />
                          <text
                            x="0"
                            y="2"
                            textAnchor="middle"
                            fill={isSelected ? '#38bdf8' : '#ffffff'}
                            fontSize="10"
                            fontWeight="bold"
                            fontFamily="monospace"
                          >
                            {comp.shortName}
                          </text>
                        </g>
                      </g>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT: COMPONENT DETAILS / INSPECTOR (Exact Match Image) */}
        {/* ========================================================= */}
        {isInspectorOpen && (
          <aside className="w-80 lg:w-96 bg-[#070d1d] border-l border-[#162540] flex flex-col shrink-0 shadow-2xl z-20 overflow-y-auto">
            {/* Inspector Header */}
            <div className="p-3.5 border-b border-[#162540] flex items-center justify-between bg-[#0a1226]">
              <span className="text-sm font-bold text-white font-sans tracking-wide">
                Component Details
              </span>
              <button
                onClick={() => setIsInspectorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Component High-Res Macro Image */}
              <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-[#1e3052] bg-black shadow-lg">
                <img
                  src={selectedComp.physicalPhoto}
                  alt={selectedComp.name}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border shadow ${selectedComp.badgeColor}`}>
                    {selectedComp.badge}
                  </span>
                </div>
              </div>

              {/* Title & Role */}
              <div>
                <h3 className="text-base font-extrabold text-white font-sans flex items-center justify-between">
                  <span>{selectedComp.name}</span>
                </h3>
                <p className="text-xs text-cyan-400 font-mono mt-0.5">
                  {selectedComp.type}
                </p>
              </div>

              {/* Specs & Measurements Table */}
              <div className="bg-[#040814] rounded-xl border border-[#14233c] p-3 space-y-2 font-mono text-xs">
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Type</span>
                  <span className="text-slate-200 font-bold text-right">{selectedComp.type}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-1.5">
                  <span className="text-slate-400">Role</span>
                  <span className="text-slate-200 font-bold text-right">{selectedComp.role}</span>
                </div>
                {selectedComp.specs.map((spec, sIdx) => (
                  <div key={sIdx} className="flex justify-between border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                    <span className="text-slate-400">{spec.label}</span>
                    <div className="text-right">
                      <span className="text-cyan-300 font-bold">{spec.value}</span>
                      <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">
                        {spec.status}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Status</span>
                  <span className="text-emerald-400 font-bold flex items-center space-x-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ON (Active Node)</span>
                  </span>
                </div>
              </div>

              {/* Role Summary / Function Card with Icon (Matching Screenshot) */}
              <div className="bg-gradient-to-br from-[#0c162e] to-[#080e1e] border border-[#1d3154] rounded-xl p-3 flex items-start space-x-2.5 text-xs">
                <div className="p-1.5 rounded-lg bg-blue-900/50 text-cyan-300 shrink-0">
                  <Info className="w-4 h-4" />
                </div>
                <p className="text-slate-300 leading-relaxed font-sans">
                  {selectedComp.functionDescription}
                </p>
              </div>

              {/* Connection Information */}
              <div className="bg-[#050a16] border border-[#132038] rounded-xl p-3 text-xs font-mono space-y-1">
                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">
                  Connections:
                </span>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  {selectedComp.connections}
                </p>
              </div>

              {/* Interactive Quick Actions */}
              <div className="flex items-center space-x-2 pt-1">
                {onNavigateToSchematic && (
                  <button
                    onClick={onNavigateToSchematic}
                    className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center space-x-1 shadow-md transition-colors"
                  >
                    <span>View Schematic</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setIsConnectionsOn(true)}
                  className="px-3 py-2 rounded-lg bg-[#0f1b34] hover:bg-[#182a52] text-slate-300 border border-[#1e3358] font-mono text-xs transition-colors"
                >
                  View Connections
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ========================================================= */}
      {/* 3. BOTTOM COMPONENT THUMBNAIL CARDS (Exact match to image) */}
      {/* ========================================================= */}
      <div className="px-4 py-3 bg-[#050b18] border-t border-[#14233c] shrink-0 overflow-x-auto scrollbar-thin">
        <div className="flex items-center space-x-3 min-w-max">
          {DIGITAL_TWIN_COMPONENTS.map((comp) => {
            const isSelected = selectedComponentId === comp.id;

            return (
              <button
                key={comp.id}
                onClick={() => {
                  onSelectComponent(comp.id);
                  setIsInspectorOpen(true);
                }}
                className={`w-32 sm:w-36 rounded-xl border p-1.5 flex flex-col items-center transition-all group ${
                  isSelected
                    ? 'bg-[#0e1b38] border-cyan-400 shadow-xl shadow-cyan-500/20 scale-[1.03]'
                    : 'bg-[#070e1c] border-[#15233c] hover:border-slate-600 opacity-80 hover:opacity-100'
                }`}
              >
                {/* Thumbnail Image */}
                <div className="aspect-[4/3] w-full rounded-lg overflow-hidden bg-black mb-1.5">
                  <img
                    src={comp.physicalPhoto}
                    alt={comp.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>

                {/* Name */}
                <span className={`text-[11px] font-mono font-bold truncate max-w-full text-center ${isSelected ? 'text-cyan-300' : 'text-slate-300'}`}>
                  {comp.shortName}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

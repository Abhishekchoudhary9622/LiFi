import React from 'react';
import {
  DIGITAL_TWIN_COMPONENTS,
  DigitalTwinComponent
} from '../../model/digitalTwin';
import {
  Layers,
  Sparkles,
  Info,
  ArrowRight,
  Zap,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

interface SchematicPageProps {
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  onNavigateToHardware: () => void;
}

export const SchematicPage: React.FC<SchematicPageProps> = ({
  selectedComponentId,
  onSelectComponent,
  onNavigateToHardware
}) => {
  const selectedComp = DIGITAL_TWIN_COMPONENTS.find(c => c.id === selectedComponentId) || DIGITAL_TWIN_COMPONENTS[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#02050e] text-slate-100 font-sans select-none overflow-hidden">
      {/* Header Bar */}
      <div className="px-5 py-3 bg-[#050b18] border-b border-[#14233c] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg md:text-xl font-extrabold text-white font-sans tracking-wide">
              Circuit Schematic Diagram
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-950 border border-blue-600/50 text-cyan-300 font-mono">
              PROTEUS CAD VIEW
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono -mt-0.5">
            Orthogonal Electrical Wiring &bull; Discrete Optical Channel Air Gap &bull; Interactive Component Inspection
          </p>
        </div>

        <button
          onClick={onNavigateToHardware}
          className="px-3 py-1.5 rounded-lg bg-[#0e1b38] hover:bg-[#162952] text-cyan-300 border border-cyan-800/60 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
        >
          <span>View on Physical Breadboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Schematic Workbench */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Center SVG Circuit Canvas */}
        <div className="flex-1 overflow-auto bg-[#030611] flex items-center justify-center p-4 tech-grid">
          <div className="w-full max-w-5xl aspect-[16/9] min-w-[760px] bg-[#050b19] border border-[#172744] rounded-2xl shadow-2xl relative p-4 overflow-hidden">
            <svg
              className="w-full h-full"
              viewBox="0 0 1100 620"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                <filter id="schematicGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <pattern id="schematicGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#0a1428" strokeWidth="0.8" />
                </pattern>
              </defs>

              {/* Grid Background */}
              <rect width="1100" height="620" fill="url(#schematicGrid)" />

              {/* Power Rail Lines (+3.3V Top, GND Bottom) */}
              <line x1="50" y1="60" x2="1050" y2="60" stroke="#ef4444" strokeWidth="2.5" />
              <text x="60" y="52" fill="#ef4444" fontSize="11" fontFamily="monospace" fontWeight="bold">+3.3V VCC BUS</text>

              <line x1="50" y1="560" x2="1050" y2="560" stroke="#3b82f6" strokeWidth="2.5" />
              <text x="60" y="580" fill="#3b82f6" fontSize="11" fontFamily="monospace" fontWeight="bold">GND (COMMON 0V REFERENCE BUS)</text>

              {/* ======================================================= */}
              {/* STAGE 1: STM32 TX (U1)                                  */}
              {/* ======================================================= */}
              <g
                onClick={() => onSelectComponent('stm32_tx')}
                className="cursor-pointer group"
              >
                <rect
                  x="80"
                  y="180"
                  width="150"
                  height="260"
                  rx="8"
                  fill="#070f22"
                  stroke={selectedComponentId === 'stm32_tx' ? '#38bdf8' : '#1e3860'}
                  strokeWidth={selectedComponentId === 'stm32_tx' ? '3' : '1.5'}
                  filter={selectedComponentId === 'stm32_tx' ? 'url(#schematicGlow)' : undefined}
                />
                <rect x="80" y="180" width="150" height="30" rx="8" fill="#0d1b38" />
                <text x="155" y="200" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">U1: STM32 TX</text>
                <text x="155" y="224" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">STM32F103C8</text>

                {/* Pins */}
                <text x="95" y="260" fill="#94a3b8" fontSize="10" fontFamily="monospace">3.3V (VCC)</text>
                <text x="95" y="415" fill="#94a3b8" fontSize="10" fontFamily="monospace">GND</text>
                <text x="215" y="325" textAnchor="end" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">PA9 (PWM Out)</text>

                {/* Power wires to rails */}
                <line x1="120" y1="180" x2="120" y2="60" stroke="#ef4444" strokeWidth="2" />
                <circle cx="120" cy="60" r="3.5" fill="#ef4444" />

                <line x1="120" y1="440" x2="120" y2="560" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="120" cy="560" r="3.5" fill="#3b82f6" />
              </g>

              {/* Wire from PA9 to Base Resistor */}
              <line x1="230" y1="320" x2="270" y2="320" stroke="#38bdf8" strokeWidth="2.5" />

              {/* 1k Base Resistor */}
              <g>
                <rect x="270" y="312" width="30" height="16" fill="#0b1730" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="285" y="304" textAnchor="middle" fill="#94a3b8" fontSize="9" fontFamily="monospace">R_b (1k)</text>
                <line x1="300" y1="320" x2="330" y2="320" stroke="#38bdf8" strokeWidth="2" />
              </g>

              {/* ======================================================= */}
              {/* STAGE 2: 2N2222 DRIVER (Q1)                             */}
              {/* ======================================================= */}
              <g
                onClick={() => onSelectComponent('transistor_2n2222')}
                className="cursor-pointer group"
              >
                <circle
                  cx="355"
                  y="320"
                  r="24"
                  fill="#070f22"
                  stroke={selectedComponentId === 'transistor_2n2222' ? '#a855f7' : '#1e3860'}
                  strokeWidth={selectedComponentId === 'transistor_2n2222' ? '3' : '1.5'}
                  filter={selectedComponentId === 'transistor_2n2222' ? 'url(#schematicGlow)' : undefined}
                />
                {/* NPN BJT symbol inside circle */}
                <line x1="345" y1="310" x2="345" y2="330" stroke="#ffffff" strokeWidth="3" />
                <line x1="330" y1="320" x2="345" y2="320" stroke="#ffffff" strokeWidth="2" />
                {/* Collector */}
                <line x1="345" y1="314" x2="362" y2="304" stroke="#ffffff" strokeWidth="2" />
                {/* Emitter with Arrow */}
                <line x1="345" y1="326" x2="362" y2="336" stroke="#ffffff" strokeWidth="2" />
                <polygon points="362,336 354,330 357,338" fill="#ffffff" />

                <text x="355" y="285" textAnchor="middle" fill="#a855f7" fontSize="11" fontWeight="bold" fontFamily="monospace">Q1: 2N2222</text>
              </g>

              {/* Emitter to GND */}
              <line x1="362" y1="336" x2="362" y2="560" stroke="#3b82f6" strokeWidth="2" />
              <circle cx="362" cy="560" r="3.5" fill="#3b82f6" />

              {/* ======================================================= */}
              {/* STAGE 3: 220Ω RESISTOR (R1) & LED (D1)                  */}
              {/* ======================================================= */}
              {/* Top rail down to R1 */}
              <line x1="430" y1="60" x2="430" y2="120" stroke="#ef4444" strokeWidth="2" />
              <circle cx="430" cy="60" r="3.5" fill="#ef4444" />

              {/* Resistor R1 (220Ω) */}
              <g
                onClick={() => onSelectComponent('resistor_220')}
                className="cursor-pointer group"
              >
                <rect
                  x="418"
                  y="120"
                  width="24"
                  height="45"
                  fill="#0b1730"
                  stroke={selectedComponentId === 'resistor_220' ? '#f59e0b' : '#1e3860'}
                  strokeWidth={selectedComponentId === 'resistor_220' ? '3' : '1.5'}
                  filter={selectedComponentId === 'resistor_220' ? 'url(#schematicGlow)' : undefined}
                />
                <text x="455" y="146" fill="#f59e0b" fontSize="10" fontWeight="bold" fontFamily="monospace">R1: 220Ω</text>
              </g>

              <line x1="430" y1="165" x2="430" y2="195" stroke="#ef4444" strokeWidth="2" />

              {/* LED D1 (Transmitter) */}
              <g
                onClick={() => onSelectComponent('led_tx')}
                className="cursor-pointer group"
              >
                <g transform="translate(430, 215)">
                  {/* Diode Triangle */}
                  <polygon
                    points="0,18 -15,-8 15,-8"
                    fill="#ef4444"
                    stroke={selectedComponentId === 'led_tx' ? '#ffffff' : '#b91c1c'}
                    strokeWidth="2"
                    filter={selectedComponentId === 'led_tx' ? 'url(#schematicGlow)' : undefined}
                  />
                  {/* Cathode Bar */}
                  <line x1="-15" y1="18" x2="15" y2="18" stroke="#ffffff" strokeWidth="2.5" />
                  {/* Two Outward Light Emission Arrows */}
                  <line x1="12" y1="4" x2="26" y2="-4" stroke="#f87171" strokeWidth="2" />
                  <polygon points="26,-4 22,-1 20,-6" fill="#f87171" />
                  <line x1="16" y1="12" x2="30" y2="4" stroke="#f87171" strokeWidth="2" />
                  <polygon points="30,4 26,7 24,2" fill="#f87171" />
                </g>
                <text x="465" y="222" fill="#ef4444" fontSize="11" fontWeight="bold" fontFamily="monospace">D1: LED (650nm)</text>
              </g>

              {/* Cathode wire from LED to 2N2222 Collector */}
              <line x1="430" y1="233" x2="430" y2="304" stroke="#a855f7" strokeWidth="2" />
              <line x1="430" y1="304" x2="362" y2="304" stroke="#a855f7" strokeWidth="2" />

              {/* ======================================================= */}
              {/* STAGE 4: FREE-SPACE OPTICAL CHANNEL (AIR GAP)           */}
              {/* ======================================================= */}
              <g
                onClick={() => onSelectComponent('optical_channel')}
                className="cursor-pointer group"
              >
                <rect
                  x="485"
                  y="170"
                  width="95"
                  height="110"
                  rx="8"
                  fill="rgba(6, 182, 212, 0.08)"
                  stroke={selectedComponentId === 'optical_channel' ? '#06b6d4' : '#155e75'}
                  strokeWidth={selectedComponentId === 'optical_channel' ? '2.5' : '1.5'}
                  strokeDasharray="6 4"
                  filter={selectedComponentId === 'optical_channel' ? 'url(#schematicGlow)' : undefined}
                />
                {/* Wavy light rays */}
                <path d="M 500,200 Q 530,190 560,200" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 3" />
                <path d="M 500,225 Q 530,215 560,225" fill="none" stroke="#ef4444" strokeWidth="3" strokeDasharray="4 2" />
                <path d="M 500,250 Q 530,240 560,250" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="3 3" />

                <text x="532" y="160" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold" fontFamily="monospace">FREE-SPACE</text>
                <text x="532" y="295" textAnchor="middle" fill="#06b6d4" fontSize="10" fontWeight="bold" fontFamily="monospace">OPTICAL LINK</text>
              </g>

              {/* ======================================================= */}
              {/* STAGE 5: BPW34 PHOTODIODE (D2)                          */}
              {/* ======================================================= */}
              <g
                onClick={() => onSelectComponent('photodiode_rx')}
                className="cursor-pointer group"
              >
                {/* Reverse bias connection to VCC */}
                <line x1="620" y1="60" x2="620" y2="195" stroke="#ef4444" strokeWidth="2" />
                <circle cx="620" cy="60" r="3.5" fill="#ef4444" />

                <g transform="translate(620, 215)">
                  {/* Diode Triangle (Reverse Biased, pointing down) */}
                  <polygon
                    points="0,-8 -15,18 15,18"
                    fill="#10b981"
                    stroke={selectedComponentId === 'photodiode_rx' ? '#ffffff' : '#047857'}
                    strokeWidth="2"
                    filter={selectedComponentId === 'photodiode_rx' ? 'url(#schematicGlow)' : undefined}
                  />
                  {/* Cathode Bar on Top (tied to +3.3V) */}
                  <line x1="-15" y1="-8" x2="15" y2="-8" stroke="#ffffff" strokeWidth="2.5" />
                  {/* Two Inward Optical Arrows */}
                  <line x1="-28" y1="2" x2="-14" y2="10" stroke="#34d399" strokeWidth="2" />
                  <polygon points="-14,10 -20,6 -18,12" fill="#34d399" />
                  <line x1="-24" y1="-6" x2="-10" y2="2" stroke="#34d399" strokeWidth="2" />
                  <polygon points="-10,2 -16,-2 -14,4" fill="#34d399" />
                </g>

                <text x="645" y="215" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="monospace">D2: BPW34</text>
                <text x="645" y="230" fill="#6ee7b7" fontSize="9" fontFamily="monospace">Photodiode</text>
              </g>

              {/* Anode wire to LM358 */}
              <line x1="620" y1="233" x2="620" y2="300" stroke="#10b981" strokeWidth="2" />
              <line x1="620" y1="300" x2="690" y2="300" stroke="#10b981" strokeWidth="2" />

              {/* ======================================================= */}
              {/* STAGE 6: LM358 SIGNAL CONDITIONING (U2A / U2B)          */}
              {/* ======================================================= */}
              <g
                onClick={() => onSelectComponent('signal_conditioning')}
                className="cursor-pointer group"
              >
                <rect
                  x="690"
                  y="200"
                  width="150"
                  height="220"
                  rx="8"
                  fill="#070f22"
                  stroke={selectedComponentId === 'signal_conditioning' ? '#14b8a6' : '#1e3860'}
                  strokeWidth={selectedComponentId === 'signal_conditioning' ? '3' : '1.5'}
                  filter={selectedComponentId === 'signal_conditioning' ? 'url(#schematicGlow)' : undefined}
                />
                <rect x="690" y="200" width="150" height="28" rx="8" fill="#0d1f34" />
                <text x="765" y="219" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold" fontFamily="monospace">U2: LM358 (Dual)</text>

                {/* Op-Amp Triangle inside (Stage 1 TIA) */}
                <polygon points="705,255 705,325 750,290" fill="#08182b" stroke="#14b8a6" strokeWidth="1.5" />
                <text x="712" y="278" fill="#ffffff" fontSize="10" fontFamily="monospace">-</text>
                <text x="712" y="312" fill="#ffffff" fontSize="10" fontFamily="monospace">+</text>
                <text x="732" y="293" fill="#14b8a6" fontSize="9" fontFamily="monospace">TIA</text>

                {/* Stage 2 Comparator Triangle */}
                <polygon points="775,305 775,375 820,340" fill="#08182b" stroke="#14b8a6" strokeWidth="1.5" />
                <text x="782" y="328" fill="#ffffff" fontSize="10" fontFamily="monospace">+</text>
                <text x="782" y="362" fill="#ffffff" fontSize="10" fontFamily="monospace">-</text>
                <text x="800" y="343" fill="#14b8a6" fontSize="9" fontFamily="monospace">CMP</text>

                {/* Wire between Stage 1 & 2 */}
                <line x1="750" y1="290" x2="765" y2="290" stroke="#14b8a6" strokeWidth="1.5" />
                <line x1="765" y1="290" x2="765" y2="325" stroke="#14b8a6" strokeWidth="1.5" />
                <line x1="765" y1="325" x2="775" y2="325" stroke="#14b8a6" strokeWidth="1.5" />

                {/* Power connection */}
                <line x1="765" y1="200" x2="765" y2="60" stroke="#ef4444" strokeWidth="2" />
                <circle cx="765" cy="60" r="3.5" fill="#ef4444" />
                <line x1="765" y1="420" x2="765" y2="560" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="765" cy="560" r="3.5" fill="#3b82f6" />
              </g>

              {/* Output from LM358 Comparator */}
              <line x1="820" y1="340" x2="890" y2="340" stroke="#6366f1" strokeWidth="2.5" />

              {/* ======================================================= */}
              {/* STAGE 7: STM32 RX (U3)                                  */}
              {/* ======================================================= */}
              <g
                onClick={() => onSelectComponent('stm32_rx')}
                className="cursor-pointer group"
              >
                <rect
                  x="890"
                  y="180"
                  width="150"
                  height="260"
                  rx="8"
                  fill="#070f22"
                  stroke={selectedComponentId === 'stm32_rx' ? '#38bdf8' : '#1e3860'}
                  strokeWidth={selectedComponentId === 'stm32_rx' ? '3' : '1.5'}
                  filter={selectedComponentId === 'stm32_rx' ? 'url(#schematicGlow)' : undefined}
                />
                <rect x="890" y="180" width="150" height="30" rx="8" fill="#0d1b38" />
                <text x="965" y="200" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" fontFamily="monospace">U3: STM32 RX</text>
                <text x="965" y="224" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace">STM32F103C8</text>

                {/* Input Pins */}
                <text x="905" y="345" fill="#34d399" fontSize="11" fontWeight="bold" fontFamily="monospace">PA0 (ADC1 / Timer)</text>
                <text x="905" y="260" fill="#94a3b8" fontSize="10" fontFamily="monospace">3.3V (VCC)</text>
                <text x="905" y="415" fill="#94a3b8" fontSize="10" fontFamily="monospace">GND</text>

                {/* Power wires to rails */}
                <line x1="990" y1="180" x2="990" y2="60" stroke="#ef4444" strokeWidth="2" />
                <circle cx="990" cy="60" r="3.5" fill="#ef4444" />

                <line x1="990" y1="440" x2="990" y2="560" stroke="#3b82f6" strokeWidth="2" />
                <circle cx="990" cy="560" r="3.5" fill="#3b82f6" />
              </g>
            </svg>
          </div>
        </div>

        {/* Right Info Inspector Panel */}
        <div className="w-80 bg-[#070d1d] border-l border-[#162540] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold tracking-wider">
                Schematic Component
              </span>
              <h3 className="text-base font-bold text-white font-sans mt-0.5">
                {selectedComp.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Node Ref: <span className="text-cyan-300 font-bold">{selectedComp.schematicNodeId}</span>
              </p>
            </div>

            {/* Role & Function */}
            <div className="bg-[#050914] rounded-xl border border-[#14233c] p-3 space-y-2 text-xs">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                Circuit Function:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {selectedComp.functionDescription}
              </p>
            </div>

            {/* Pin Connections */}
            <div className="bg-[#050914] rounded-xl border border-[#14233c] p-3 space-y-1 text-xs font-mono">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider block">
                Schematic Netlist:
              </span>
              <p className="text-slate-300 leading-relaxed text-[11px]">
                {selectedComp.connections}
              </p>
            </div>

            {/* Viva Note */}
            <div className="bg-blue-950/40 rounded-xl border border-blue-600/40 p-3 text-xs space-y-1">
              <span className="text-cyan-300 text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1">
                <Info className="w-3 h-3" />
                <span>Engineering Principle:</span>
              </span>
              <p className="text-slate-300 leading-relaxed font-sans text-[11px]">
                {selectedComp.vivaNote}
              </p>
            </div>
          </div>

          <div className="pt-4">
            <button
              onClick={onNavigateToHardware}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/25 transition-all"
            >
              <span>Inspect on Breadboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

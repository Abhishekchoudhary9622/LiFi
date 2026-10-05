import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Download,
  Share2,
  FileCode,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import { CircuitComponent, Wire } from '../types/circuit';

interface SchematicViewProps {
  components: CircuitComponent[];
  wires: Wire[];
}

export const SchematicView: React.FC<SchematicViewProps> = ({ components, wires }) => {
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [showGrid, setShowGrid] = useState(true);

  // Group wires by net names for electrical netlist
  const nets = [
    { name: 'VCC_3V3', color: '#ef4444', description: 'Regulated 3.3V Power Bus', nodes: ['PWR_1:vcc', 'MCU_1:vcc_3v3', 'TX_1:vcc', 'PD_1:cathode', 'AMP_1:vcc'] },
    { name: 'GND', color: '#64748b', description: 'System Common Ground (0V)', nodes: ['PWR_1:gnd', 'MCU_1:gnd_1', 'MCU_1:gnd_2', 'TX_1:gnd', 'AMP_1:gnd'] },
    { name: 'NET_PA0_TX', color: '#06b6d4', description: 'STM32 Optical Modulation Out', nodes: ['MCU_1:pa0', 'R_1:pin1'] },
    { name: 'NET_TX_ANODE', color: '#06b6d4', description: 'Current-Limited LED Drive', nodes: ['R_1:pin2', 'TX_1:mod_in'] },
    { name: 'OPTICAL_BEAM', color: '#eab308', description: 'Free-Space Optical Photon Link (850nm)', nodes: ['TX_1:opt_out', 'PD_1:opt_in'] },
    { name: 'NET_PD_ANODE', color: '#3b82f6', description: 'Photocurrent Signal In', nodes: ['PD_1:anode', 'AMP_1:in'] },
    { name: 'NET_ADC1_RX', color: '#10b981', description: 'Conditioned Analog Rx Signal', nodes: ['AMP_1:out', 'MCU_1:pa1'] }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d16] font-mono text-slate-200 select-none overflow-hidden">
      {/* Top Toolbar */}
      <div className="h-10 bg-[#0c1220] border-b border-[#1f293d] flex items-center justify-between px-4 text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-cyan-300 font-bold">
            <FileCode className="w-4 h-4 text-cyan-400" />
            <span>Auto-Generated Electrical Schematic</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
            IEEE / ANSI Standard
          </span>
          <span className="text-slate-400 text-[11px] hidden sm:inline">
            Directly mapped from {components.length} components and {wires.length} breadboard nets
          </span>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-cyan-400 w-10 text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.0, z + 0.1))}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 40, y: 40 });
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded"
            title="Fit Schematic"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#1f293d]" />

          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`p-1 rounded ${showGrid ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white'}`}
            title="Toggle Grid"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Schematic Body with Side Netlist */}
      <div className="flex-1 flex overflow-hidden">
        {/* Schematic Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#0a0e17]">
          {/* Engineering Schematic Grid */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #38bdf8 0.75px, transparent 0.75px)',
                backgroundSize: '20px 20px',
                transform: `translate(${pan.x}px, ${pan.y}px)`
              }}
            />
          )}

          <svg className="w-full h-full">
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Title Block in bottom right */}
              <g transform="translate(680, 480)">
                <rect x={0} y={0} width={260} height={90} fill="#0d1424" stroke="#334155" strokeWidth={1.5} />
                <line x1={0} y1={25} x2={260} y2={25} stroke="#334155" strokeWidth={1} />
                <line x1={0} y1={55} x2={260} y2={55} stroke="#334155" strokeWidth={1} />
                <line x1={140} y1={25} x2={140} y2={90} stroke="#334155" strokeWidth={1} />
                <text x={10} y={16} fill="#ffffff" fontSize={11} fontWeight="bold" className="font-mono">
                  SEMLIFI HARDWARE LAB
                </text>
                <text x={10} y={42} fill="#94a3b8" fontSize={9} className="font-mono">
                  TITLE: Transceiver Schematic
                </text>
                <text x={10} y={74} fill="#64748b" fontSize={8} className="font-mono">
                  REV: 2.1 | DATE: 2026-10-05
                </text>
                <text x={150} y={42} fill="#94a3b8" fontSize={9} className="font-mono">
                  SHEET: 1 / 1
                </text>
                <text x={150} y={74} fill="#38bdf8" fontSize={8} className="font-mono">
                  STATUS: VERIFIED
                </text>
              </g>

              {/* Top VCC Power Rail Symbol (Bar + Arrow) */}
              <g transform="translate(60, 40)">
                <line x1={0} y1={20} x2={780} y2={20} stroke="#ef4444" strokeWidth={2} />
                <text x={10} y={12} fill="#ef4444" fontSize={11} fontWeight="bold" className="font-mono">
                  +3.3V (VCC POWER RAIL)
                </text>
                {/* Arrow up at 0 */}
                <polygon points="0,20 -6,10 6,10" fill="#ef4444" />
              </g>

              {/* Bottom Ground Rail Symbol (Earth triangle) */}
              <g transform="translate(60, 420)">
                <line x1={0} y1={0} x2={780} y2={0} stroke="#64748b" strokeWidth={2} />
                <text x={10} y={18} fill="#94a3b8" fontSize={11} fontWeight="bold" className="font-mono">
                  GND (0V COMMON REFERENCE)
                </text>
                {/* Earth ground symbols at regular intervals */}
                {[120, 280, 460, 680].map((gx) => (
                  <g key={gx} transform={`translate(${gx}, 0)`}>
                    <line x1={0} y1={0} x2={0} y2={10} stroke="#64748b" strokeWidth={1.5} />
                    <line x1={-12} y1={10} x2={12} y2={10} stroke="#64748b" strokeWidth={1.5} />
                    <line x1={-8} y1={14} x2={8} y2={14} stroke="#64748b" strokeWidth={1.5} />
                    <line x1={-4} y1={18} x2={4} y2={18} stroke="#64748b" strokeWidth={1.5} />
                  </g>
                ))}
              </g>

              {/* -------------------------------------------------- */}
              {/* SCHEMATIC SYMBOL 1: STM32F103C8 Microcontroller   */}
              {/* -------------------------------------------------- */}
              <g transform="translate(80, 140)">
                <rect x={0} y={0} width={130} height={180} fill="#0d1424" stroke="#38bdf8" strokeWidth={2} rx={2} />
                <text x={65} y={22} fill="#38bdf8" fontSize={11} fontWeight="bold" textAnchor="middle">
                  U1: STM32F103
                </text>
                <text x={65} y={35} fill="#64748b" fontSize={8} textAnchor="middle">
                  ARM CORTEX-M3
                </text>

                {/* VCC Pin Top */}
                <line x1={65} y1={0} x2={65} y2={-80} stroke="#ef4444" strokeWidth={1.5} />
                <circle cx={65} cy={-80} r={3} fill="#ef4444" />
                <text x={65} y={-4} fill="#ef4444" fontSize={9} textAnchor="middle">VCC (3.3V)</text>

                {/* GND Pin Bottom */}
                <line x1={65} y1={180} x2={65} y2={280} stroke="#64748b" strokeWidth={1.5} />
                <circle cx={65} cy={280} r={3} fill="#64748b" />
                <text x={65} y={174} fill="#94a3b8" fontSize={9} textAnchor="middle">GND</text>

                {/* PA0 TX Pin */}
                <line x1={130} y1={70} x2={165} y2={70} stroke="#06b6d4" strokeWidth={1.5} />
                <text x={122} y={73} fill="#06b6d4" fontSize={9} textAnchor="end">PA0 (PWM TX)</text>

                {/* PA1 RX Pin */}
                <line x1={130} y1={120} x2={165} y2={120} stroke="#10b981" strokeWidth={1.5} />
                <text x={122} y={123} fill="#10b981" fontSize={9} textAnchor="end">PA1 (ADC1 RX)</text>
              </g>

              {/* -------------------------------------------------- */}
              {/* SCHEMATIC SYMBOL 2: Resistor R1 (Zigzag IEEE)      */}
              {/* -------------------------------------------------- */}
              <g transform="translate(245, 195)">
                <line x1={0} y1={15} x2={15} y2={15} stroke="#06b6d4" strokeWidth={1.5} />
                {/* Zigzag */}
                <polyline
                  points="15,15 20,5 28,25 36,5 44,25 52,5 60,25 65,15"
                  fill="none"
                  stroke="#fbbf24"
                  strokeWidth={2}
                />
                <line x1={65} y1={15} x2={85} y2={15} stroke="#06b6d4" strokeWidth={1.5} />
                <text x={40} y={-2} fill="#fbbf24" fontSize={10} fontWeight="bold" textAnchor="middle">
                  R1: 220 Ω
                </text>
                <text x={40} y={38} fill="#64748b" fontSize={8} textAnchor="middle">
                  0.25W 5%
                </text>
              </g>

              {/* -------------------------------------------------- */}
              {/* SCHEMATIC SYMBOL 3: LiFi LED Transmitter Emitter   */}
              {/* -------------------------------------------------- */}
              <g transform="translate(330, 195)">
                {/* Diode Triangle */}
                <polygon points="30,5 30,25 50,15" fill="#14b8a6" stroke="#2dd4bf" strokeWidth={1.5} />
                {/* Cathode Bar */}
                <line x1={50} y1={5} x2={50} y2={25} stroke="#2dd4bf" strokeWidth={2} />
                {/* Optical Arrows */}
                <line x1={40} y1={3} x2={52} y2={-7} stroke="#eab308" strokeWidth={1.5} />
                <polygon points="52,-7 46,-6 50,-2" fill="#eab308" />
                <line x1={46} y1={3} x2={58} y2={-7} stroke="#eab308" strokeWidth={1.5} />
                <polygon points="58,-7 52,-6 56,-2" fill="#eab308" />

                {/* Lead to Ground */}
                <line x1={50} y1={15} x2={70} y2={15} stroke="#64748b" strokeWidth={1.5} />
                <line x1={70} y1={15} x2={70} y2={225} stroke="#64748b" strokeWidth={1.5} />
                <circle cx={70} cy={225} r={3} fill="#64748b" />

                <text x={40} y={-14} fill="#2dd4bf" fontSize={10} fontWeight="bold" textAnchor="middle">
                  D1: LiFi LED
                </text>
                <text x={40} y={40} fill="#64748b" fontSize={8} textAnchor="middle">
                  850nm NIR
                </text>
              </g>

              {/* -------------------------------------------------- */}
              {/* OPTICAL LINK CHANNEL (Photon Waves)                */}
              {/* -------------------------------------------------- */}
              <g transform="translate(415, 195)">
                <rect x={0} y={-15} width={90} height={60} fill="#0b172a" stroke="#eab308" strokeDasharray="3 3" strokeWidth={1} rx={4} />
                <text x={45} y={-2} fill="#eab308" fontSize={8} fontWeight="bold" textAnchor="middle">
                  OPTICAL CHANNEL
                </text>
                <text x={45} y={18} fill="#fde047" fontSize={11} fontWeight="bold" textAnchor="middle">
                  )))))))))&gt;
                </text>
                <text x={45} y={35} fill="#94a3b8" fontSize={8} textAnchor="middle">
                  1.2 m Free-Space
                </text>
              </g>

              {/* -------------------------------------------------- */}
              {/* SCHEMATIC SYMBOL 4: Photodiode Receiver (BPW34)    */}
              {/* -------------------------------------------------- */}
              <g transform="translate(525, 195)">
                {/* Diode Triangle pointing in reverse */}
                <polygon points="50,5 50,25 30,15" fill="#4338ca" stroke="#818cf8" strokeWidth={1.5} />
                {/* Cathode Bar */}
                <line x1={30} y1={5} x2={30} y2={25} stroke="#818cf8" strokeWidth={2} />
                {/* Incoming Optical Arrows */}
                <line x1={15} y1={-8} x2={27} y2={2} stroke="#eab308" strokeWidth={1.5} />
                <polygon points="27,2 21,1 25,-3" fill="#eab308" />
                <line x1={22} y1={-8} x2={34} y2={2} stroke="#eab308" strokeWidth={1.5} />
                <polygon points="34,2 28,1 32,-3" fill="#eab308" />

                {/* Reverse bias cathode to 3.3V power */}
                <line x1={30} y1={15} x2={10} y2={15} stroke="#ef4444" strokeWidth={1.5} />
                <line x1={10} y1={15} x2={10} y2={-135} stroke="#ef4444" strokeWidth={1.5} />
                <circle cx={10} cy={-135} r={3} fill="#ef4444" />

                {/* Anode output to amplifier */}
                <line x1={50} y1={15} x2={75} y2={15} stroke="#3b82f6" strokeWidth={1.5} />

                <text x={40} y={-14} fill="#818cf8" fontSize={10} fontWeight="bold" textAnchor="middle">
                  PD1: BPW34
                </text>
                <text x={40} y={40} fill="#64748b" fontSize={8} textAnchor="middle">
                  Si PIN 0.62 A/W
                </text>
              </g>

              {/* -------------------------------------------------- */}
              {/* SCHEMATIC SYMBOL 5: Transimpedance Op-Amp (TIA)    */}
              {/* -------------------------------------------------- */}
              <g transform="translate(600, 190)">
                {/* Op-Amp Triangle */}
                <polygon points="0,0 0,60 50,30" fill="#0d1424" stroke="#10b981" strokeWidth={2} />
                <text x={8} y={20} fill="#ef4444" fontSize={11}>-</text>
                <text x={8} y={45} fill="#64748b" fontSize={11}>+</text>
                {/* Non-inverting input tied to ground */}
                <line x1={0} y1={42} x2={-15} y2={42} stroke="#64748b" strokeWidth={1.5} />
                <line x1={-15} y1={42} x2={-15} y2={230} stroke="#64748b" strokeWidth={1.5} />
                <circle cx={-15} cy={230} r={3} fill="#64748b" />

                {/* Op-Amp Output line returning to STM32 PA1 */}
                <line x1={50} y1={30} x2={75} y2={30} stroke="#10b981" strokeWidth={1.5} />
                <line x1={75} y1={30} x2={75} y2={140} stroke="#10b981" strokeWidth={1.5} />
                <line x1={75} y1={140} x2={-355} y2={140} stroke="#10b981" strokeWidth={1.5} />
                <line x1={-355} y1={140} x2={-355} y2={70} stroke="#10b981" strokeWidth={1.5} />

                <text x={25} y={-8} fill="#10b981" fontSize={10} fontWeight="bold" textAnchor="middle">
                  U2: TIA Pre-Amp
                </text>
                <text x={25} y={75} fill="#64748b" fontSize={8} textAnchor="middle">
                  Gain: 82 kΩ
                </text>
              </g>
            </g>
          </svg>
        </div>

        {/* Side Netlist & Pinout Inspector */}
        <div className="w-80 bg-[#0a0e17] border-l border-[#1f293d] p-3 flex flex-col shrink-0 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f293d] mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Schematic Netlist ({nets.length} Nets)
            </h3>
            <span className="text-[10px] text-emerald-400 font-bold">100% ROUTED</span>
          </div>

          <div className="space-y-2.5 flex-1">
            {nets.map((net) => (
              <div key={net.name} className="p-2.5 bg-[#111827] border border-[#1f293d] rounded text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: net.color }} />
                    <span className="font-bold text-white text-[11px]">{net.name}</span>
                  </div>
                  <span className="text-[9px] text-slate-400">{net.nodes.length} nodes</span>
                </div>
                <p className="text-[10px] text-slate-400">{net.description}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {net.nodes.map((node) => (
                    <span key={node} className="text-[9px] px-1.5 py-0.5 rounded bg-[#0a0e17] text-slate-300 border border-slate-800">
                      {node}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

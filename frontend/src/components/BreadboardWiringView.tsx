import React, { useState } from 'react';
import { 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  HelpCircle, 
  Play, 
  Volume2, 
  ChevronRight, 
  ChevronLeft, 
  Sliders, 
  Search, 
  Filter 
} from 'lucide-react';
import { WireConnection, VerificationStatus } from '../types/semlifi';

interface BreadboardWiringViewProps {
  connections: WireConnection[];
  onSelectWire: (wire: WireConnection | null) => void;
  selectedWire: WireConnection | null;
}

interface StepInfo {
  step: number;
  title: string;
  wireId: string;
  script: string;
}

export const BreadboardWiringView: React.FC<BreadboardWiringViewProps> = ({
  connections,
  onSelectWire,
  selectedWire,
}) => {
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'VISUAL' | 'PIN_MAPPING' | 'REPORT'>('VISUAL');
  const [activeStepIdx, setActiveStepIdx] = useState<number>(0);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const presentationSteps: StepInfo[] = [
    {
      step: 1,
      title: 'TX Power & Microcontroller Ground Rail',
      wireId: 'CONN-TX-05',
      script: 'Professor, this is the transmitter breadboard. The black jumper ties the ESP32 transmitter ground header directly to the breadboard blue ground rail. This establishes the zero-volt reference for both the microcontroller and the optical LED driver switch, preventing floating voltage offsets during high-speed 1000 bps switching.'
    },
    {
      step: 2,
      title: 'GPIO 23 to 2N2222 Base Switching Circuit',
      wireId: 'CONN-TX-01',
      script: 'Professor, this yellow wire connects ESP32 GPIO 23 to Row 14 on the transmitter breadboard. When GPIO 23 goes HIGH (3.3V), base current flows through a 1kΩ current-limiting resistor into the 2N2222 NPN transistor base, driving the transistor into saturation (V_CE_sat < 0.2V) and turning the optical LED ON. When LOW (0V), the transistor enters cutoff.'
    },
    {
      step: 3,
      title: 'Transistor Low-Side Collector Sink to LED Cathode',
      wireId: 'CONN-TX-02',
      script: 'Professor, this blue wire connects the 2N2222 collector on Row 15 to the LED cathode on Row 18. An ESP32 GPIO pin can safely deliver at most 12mA, but our high-intensity LiFi LED requires over 80mA for sufficient optical irradiance. The 2N2222 acts as a low-side current switch, sinking high current directly to ground without stressing the ESP32.'
    },
    {
      step: 4,
      title: 'Physical Optical Line-of-Sight & SG90 Servo Flap',
      wireId: 'CONN-OPT-01',
      script: 'Professor, here is the free-space optical channel between the transmitter LED and receiver photodiode. In the center is the SG90 micro-servo motor. By controlling its PWM signal, the servo swings an opaque physical flap into the optical beam path. This creates authentic physical burst losses (P1 15-40ms, P2 150-380ms, P3 mixed) matching real-world obstructions.'
    },
    {
      step: 5,
      title: 'BPW34 PIN Photodiode Photocurrent Reception',
      wireId: 'CONN-RX-01',
      script: 'Professor, on the receiver breadboard sits the BPW34 silicon PIN photodiode. When visible light photons strike its 7.5 mm² active area, it generates reverse photocurrent. This white lead routes the microamp photocurrent directly into Pin 2 (the inverting input) of the LM358 transimpedance amplifier. This lead is kept short to minimize noise pickup.'
    },
    {
      step: 6,
      title: 'LM358 Transimpedance Feedback Loop (Rf Gain)',
      wireId: 'CONN-RX-03',
      script: 'Professor, the LM358 operational amplifier IC straddles the center divider trough. A feedback resistor Rf (bridging Pin 1 and Pin 2) sets the transimpedance gain (V_out = I_photo * Rf), converting microamp photocurrents into a clean 0 to 1.2V analog voltage signal. Pin 3 is grounded for single-supply ground-sensing operation.'
    },
    {
      step: 7,
      title: 'LM358 Output to ESP32 RX GPIO 34 ADC & Bench Ground',
      wireId: 'CONN-RX-05',
      script: 'Professor, this green wire carries the amplified optical analog voltage from LM358 Pin 1 into ESP32 GPIO 34 (ADC1 Channel 6). The ESP32 samples this voltage in a mid-bit window of 450–550 µs and slices it against our calibrated threshold of ~50 counts. A common ground tie connects transmitter and receiver ground rails across the workbench.'
    }
  ];

  const toggleSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const selectStep = (idx: number) => {
    setActiveStepIdx(idx);
    const step = presentationSteps[idx];
    if (step) {
      const found = connections.find(c => c.connection_id === step.wireId) || null;
      onSelectWire(found);
      if (isSpeaking && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      }
    }
  };

  const filteredConnections = connections.filter((conn) => {
    const matchesFilter = filter === 'ALL' || conn.status.toUpperCase() === filter.toUpperCase();
    const matchesSearch = 
      conn.source_component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.destination_component.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.source_pin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conn.connection_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status: VerificationStatus | string) => {
    switch (status) {
      case 'VERIFIED HARDWARE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>VERIFIED HARDWARE</span>
          </span>
        );
      case 'DOCUMENTED HARDWARE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>DOCUMENTED HARDWARE</span>
          </span>
        );
      case 'SIMULATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Sliders className="w-3 h-3" />
            <span>SIMULATED</span>
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3" />
            <span>UNVERIFIED</span>
          </span>
        );
    }
  };

  const downloadReport = (format: 'json' | 'csv') => {
    window.open(`/api/wiring/export?format=${format}`, '_blank');
  };

  const handleWireClick = (connId: string) => {
    const wire = connections.find(c => c.connection_id === connId) || null;
    onSelectWire(wire);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Explaining Strict Verification Rule */}
      <div className="p-4 bg-amber-950/40 border border-amber-500/40 rounded-xl flex items-start space-x-3.5">
        <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
        <div className="space-y-1">
          <h4 className="text-sm font-semibold text-amber-200">
            Strict Engineering Policy: Breadboard Wiring Integrity &amp; Academic Defense
          </h4>
          <p className="text-xs text-amber-300/80 leading-relaxed">
            Every connection below shows the exact socket holes, electrical net, signal type, and measured voltage. Core functional paths from the SemLiFi paper (GPIO 23 OOK TX, GPIO 34 ADC RX, LM358 TIA, BPW34 photodiode, 2N2222 driver, SG90 servo) are tagged as{' '}
            <strong className="text-blue-300 font-mono">DOCUMENTED HARDWARE</strong>. Passives requiring photographic confirmation are marked <strong className="text-rose-300 font-mono">UNVERIFIED</strong>.
          </p>
        </div>
      </div>

      {/* Navigation Tabs & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('VISUAL')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'VISUAL'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Visual Breadboard Sockets
          </button>
          <button
            onClick={() => setActiveTab('PIN_MAPPING')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'PIN_MAPPING'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Pin Mapping Table
          </button>
          <button
            onClick={() => setActiveTab('REPORT')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              activeTab === 'REPORT'
                ? 'bg-cyan-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Wiring Report &amp; Audit
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => downloadReport('json')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => downloadReport('csv')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Filter Status:</span>
          {(['ALL', 'DOCUMENTED HARDWARE', 'UNVERIFIED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition ${
                filter === st
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search pin, component, signal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* TAB 1: VISUAL BREADBOARD VIEW */}
      {activeTab === 'VISUAL' && (
        <div className="space-y-4">
          {/* Quick Guided Step Selector */}
          <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-900/90 rounded-2xl border border-slate-800">
            <span className="text-[11px] font-mono text-amber-400 font-bold px-2 flex items-center space-x-1.5 shrink-0">
              <Play className="w-3 h-3 fill-current" />
              <span>DEFENSE STEP TOUR:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              {presentationSteps.map((step, idx) => (
                <button
                  key={step.wireId}
                  onClick={() => selectStep(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                    activeStepIdx === idx && selectedWire?.connection_id === step.wireId
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-slate-950/40 text-[10px] flex items-center justify-center font-bold">
                    {step.step}
                  </span>
                  <span>{step.title.split(' ')[0]} {step.title.split(' ')[1]}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => onSelectWire(null)}
              className="px-3 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 ml-auto shrink-0"
            >
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Interactive SVG Diagram */}
            <div className="lg:col-span-2 bg-slate-950 p-6 rounded-2xl border border-slate-800 shadow-2xl overflow-x-auto">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-white tracking-wide">Physical Breadboard Sockets &amp; Wiring Diagram</h4>
                  <p className="text-xs text-slate-400 font-mono">Row &amp; Column Hole Sockets with Real Jumper Trajectories</p>
                </div>
                <span className="text-xs text-cyan-400 font-mono bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800">
                  Click any jumper wire to inspect
                </span>
              </div>

              <svg
                viewBox="0 0 920 480"
                className="w-full h-auto select-none"
                style={{ minWidth: '700px' }}
              >
                <defs>
                  {/* Glow filter for active wires */}
                  <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {/* ---------------- 1. TRANSMITTER BREADBOARD ---------------- */}
                <rect x="20" y="20" width="370" height="400" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <text x="40" y="48" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  TRANSMITTER BREADBOARD (TX)
                </text>

                {/* Top Power Rails */}
                <rect x="35" y="65" width="340" height="10" fill="#ef4444" opacity="0.5" />
                <rect x="35" y="80" width="340" height="10" fill="#3b82f6" opacity="0.5" />
                <text x="380" y="74" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">+</text>
                <text x="380" y="89" fill="#3b82f6" fontSize="10" fontWeight="bold" fontFamily="monospace">-</text>

                {/* Center IC Divider Trough */}
                <rect x="35" y="235" width="340" height="14" fill="#1e293b" />
                <text x="45" y="246" fill="#475569" fontSize="9" fontFamily="monospace">IC DIVIDER TROUGH</text>

                {/* Bottom Power Rails */}
                <rect x="35" y="380" width="340" height="10" fill="#3b82f6" opacity="0.5" />
                <rect x="35" y="395" width="340" height="10" fill="#ef4444" opacity="0.5" />
                <text x="380" y="389" fill="#3b82f6" fontSize="10" fontWeight="bold" fontFamily="monospace">-</text>
                <text x="380" y="404" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">+</text>

                {/* TX Breadboard Row Numbers Markers */}
                <text x="26" y="125" fill="#64748b" fontSize="8" fontFamily="monospace">R1</text>
                <text x="26" y="165" fill="#64748b" fontSize="8" fontFamily="monospace">R11</text>
                <text x="26" y="200" fill="#64748b" fontSize="8" fontFamily="monospace">R14</text>
                <text x="26" y="280" fill="#64748b" fontSize="8" fontFamily="monospace">R18</text>

                {/* ESP32 TX Board */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-TX-01')}>
                  <rect x="40" y="105" width="115" height="230" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
                  <rect x="52" y="118" width="90" height="60" rx="4" fill="#cbd5e1" opacity="0.95" />
                  <text x="97" y="152" fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    ESP32 TX
                  </text>
                  <text x="97" y="166" fill="#334155" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    NODE MCU
                  </text>
                  
                  {/* Pin Markers */}
                  <circle cx="145" cy="125" r="4" fill="#000" />
                  <text x="110" y="129" fill="#cbd5e1" fontSize="9" fontFamily="monospace">GND</text>
                  
                  <circle cx="145" cy="180" r="5" fill="#eab308" />
                  <text x="95" y="184" fill="#facc15" fontSize="10" fontWeight="bold" fontFamily="monospace">GPIO 23</text>
                </g>

                {/* 2N2222 Transistor */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-TX-02')}>
                  <circle cx="230" cy="200" r="22" fill="#020617" stroke="#64748b" strokeWidth="2" />
                  <text x="230" y="198" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    2N2222
                  </text>
                  <text x="230" y="210" fill="#94a3b8" fontSize="7" textAnchor="middle">NPN BJT</text>

                  {/* 3 Transistor Pins (E, B, C) */}
                  <circle cx="218" cy="200" r="3" fill="#cbd5e1" />
                  <text x="218" y="218" fill="#94a3b8" fontSize="8" textAnchor="middle">E</text>

                  <circle cx="230" cy="200" r="3" fill="#eab308" />
                  <text x="230" y="218" fill="#facc15" fontSize="8" textAnchor="middle">B</text>

                  <circle cx="242" cy="200" r="3" fill="#38bdf8" />
                  <text x="242" y="218" fill="#38bdf8" fontSize="8" textAnchor="middle">C</text>
                </g>

                {/* 1kΩ Base Resistor R_base */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-TX-01')}>
                  <rect x="175" y="195" width="28" height="10" rx="3" fill="#d4b996" stroke="#8b4513" strokeWidth="1" />
                  <line x1="182" y1="195" x2="182" y2="205" stroke="#8b4513" strokeWidth="2" />
                  <line x1="187" y1="195" x2="187" y2="205" stroke="#000" strokeWidth="2" />
                  <line x1="192" y1="195" x2="192" y2="205" stroke="#ef4444" strokeWidth="2" />
                  <text x="189" y="190" fill="#d4b996" fontSize="7" textAnchor="middle" fontFamily="monospace">1kΩ</text>
                </g>

                {/* High-Intensity Optical LED */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-TX-02')}>
                  <circle cx="320" cy="200" r="18" fill="#fef08a" stroke="#eab308" strokeWidth="2" />
                  <text x="320" y="204" fill="#713f12" fontSize="9" fontWeight="bold" textAnchor="middle">LED</text>
                  <text x="320" y="235" fill="#fef08a" fontSize="8" textAnchor="middle" fontWeight="bold">TX 5mm</text>
                  <circle cx="312" cy="200" r="3" fill="#ef4444" />
                  <circle cx="328" cy="200" r="3" fill="#3b82f6" />
                </g>

                {/* TX WIRING JUMPERS */}
                {/* 1. CONN-TX-05: ESP32 GND -> TX Ground Rail (Black) */}
                <path
                  d="M 145 125 C 160 110, 180 90, 200 90"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-TX-05' ? '#38bdf8' : '#334155'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-TX-05' ? 5 : 2.5}
                  filter={selectedWire?.connection_id === 'CONN-TX-05' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-TX-05')}
                />

                {/* 2. CONN-TX-01: ESP32 GPIO 23 -> 1kΩ -> 2N2222 Base (Yellow) */}
                <path
                  d="M 145 180 C 155 190, 165 200, 175 200"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-TX-01' ? '#38bdf8' : '#eab308'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-TX-01' ? 5 : 3}
                  filter={selectedWire?.connection_id === 'CONN-TX-01' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-TX-01')}
                />
                <path
                  d="M 203 200 L 227 200"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-TX-01' ? '#38bdf8' : '#eab308'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-TX-01' ? 5 : 3}
                  filter={selectedWire?.connection_id === 'CONN-TX-01' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-TX-01')}
                />

                {/* 3. CONN-TX-02: 2N2222 Collector -> LED Cathode (Blue) */}
                <path
                  d="M 242 200 C 265 170, 290 170, 328 197"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-TX-02' ? '#38bdf8' : '#3b82f6'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-TX-02' ? 5 : 3}
                  filter={selectedWire?.connection_id === 'CONN-TX-02' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-TX-02')}
                />

                {/* 4. CONN-TX-03: 2N2222 Emitter -> Ground Rail (Black) */}
                <path
                  d="M 218 200 C 210 260, 210 320, 210 380"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-TX-03' ? '#38bdf8' : '#334155'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-TX-03' ? 5 : 2.5}
                  filter={selectedWire?.connection_id === 'CONN-TX-03' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-TX-03')}
                />

                {/* 5. CONN-TX-04: +5V Rail -> LED Anode (Red) */}
                <path
                  d="M 312 75 C 312 110, 312 150, 312 197"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-TX-04' ? '#38bdf8' : '#ef4444'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-TX-04' ? 5 : 2.5}
                  filter={selectedWire?.connection_id === 'CONN-TX-04' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-TX-04')}
                />

                {/* ---------------- 2. OPTICAL FREE-SPACE CHANNEL ---------------- */}
                <rect x="400" y="170" width="130" height="60" fill="none" stroke="#38bdf8" strokeDasharray="4 4" opacity="0.6" />
                <text x="465" y="195" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  OPTICAL BEAM
                </text>
                <text x="465" y="210" fill="#94a3b8" fontSize="8" textAnchor="middle">
                  Line of Sight (LOS)
                </text>

                {/* SG90 Servo Actuator */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-OPT-01')}>
                  <rect x="440" y="250" width="50" height="70" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="465" y="280" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">
                    SG90
                  </text>
                  <text x="465" y="295" fill="#bae6fd" fontSize="7" textAnchor="middle">
                    Occluder
                  </text>
                  {/* Flap arm */}
                  <rect x="462" y="180" width="6" height="70" fill="#1e293b" stroke="#f43f5e" strokeWidth="1.5" />
                </g>

                {/* SG90 3-Wire Ribbon Cable */}
                <path
                  d="M 440 300 C 400 320, 350 340, 280 340"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-OPT-01' ? '#38bdf8' : '#f97316'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-OPT-01' ? 4 : 2}
                  filter={selectedWire?.connection_id === 'CONN-OPT-01' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-OPT-01')}
                />

                {/* ---------------- 3. RECEIVER BREADBOARD ---------------- */}
                <rect x="540" y="20" width="360" height="400" rx="14" fill="#0f172a" stroke="#334155" strokeWidth="2" />
                <text x="560" y="48" fill="#94a3b8" fontSize="12" fontWeight="bold" fontFamily="monospace">
                  RECEIVER BREADBOARD (RX)
                </text>

                {/* RX Top Power Rails */}
                <rect x="555" y="65" width="330" height="10" fill="#ef4444" opacity="0.5" />
                <rect x="555" y="80" width="330" height="10" fill="#3b82f6" opacity="0.5" />
                <text x="890" y="74" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">+</text>
                <text x="890" y="89" fill="#3b82f6" fontSize="10" fontWeight="bold" fontFamily="monospace">-</text>

                {/* Center IC Divider Trough */}
                <rect x="555" y="235" width="330" height="14" fill="#1e293b" />
                <text x="565" y="246" fill="#475569" fontSize="9" fontFamily="monospace">IC DIVIDER TROUGH</text>

                {/* RX Bottom Power Rails */}
                <rect x="555" y="380" width="330" height="10" fill="#3b82f6" opacity="0.5" />
                <rect x="555" y="395" width="330" height="10" fill="#ef4444" opacity="0.5" />
                <text x="890" y="389" fill="#3b82f6" fontSize="10" fontWeight="bold" fontFamily="monospace">-</text>
                <text x="890" y="404" fill="#ef4444" fontSize="10" fontWeight="bold" fontFamily="monospace">+</text>

                {/* BPW34 Silicon PIN Photodiode */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-RX-01')}>
                  <rect x="555" y="185" width="30" height="30" rx="3" fill="#3b0764" stroke="#c084fc" strokeWidth="2" />
                  <rect x="560" y="190" width="20" height="20" fill="#581c87" />
                  <text x="570" y="203" fill="#f5d0fe" fontSize="7" fontWeight="bold" textAnchor="middle">
                    BPW34
                  </text>
                  <circle cx="585" cy="195" r="3" fill="#ffffff" />
                  <circle cx="585" cy="205" r="3" fill="#000000" />
                </g>

                {/* LM358 DIP-8 Operational Amplifier */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-RX-03')}>
                  <rect x="635" y="180" width="65" height="85" rx="5" fill="#020617" stroke="#a855f7" strokeWidth="2" />
                  <circle cx="667" cy="188" r="4" fill="#334155" />
                  <text x="667" y="215" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    LM358
                  </text>
                  <text x="667" y="230" fill="#c084fc" fontSize="8" textAnchor="middle">TIA OP-AMP</text>

                  {/* DIP-8 Pins (1 to 4 Left, 5 to 8 Right) */}
                  <circle cx="635" cy="195" r="3" fill="#22c55e" /> {/* Pin 1 OUT1 */}
                  <text x="643" y="198" fill="#4ade80" fontSize="7">1</text>

                  <circle cx="635" cy="210" r="3" fill="#f8fafc" /> {/* Pin 2 IN1- */}
                  <text x="643" y="213" fill="#f8fafc" fontSize="7">2</text>

                  <circle cx="635" cy="225" r="3" fill="#000000" /> {/* Pin 3 IN1+ */}
                  <text x="643" y="228" fill="#94a3b8" fontSize="7">3</text>

                  <circle cx="635" cy="245" r="3" fill="#000000" /> {/* Pin 4 GND */}
                  <text x="643" y="248" fill="#94a3b8" fontSize="7">4</text>

                  <circle cx="700" cy="195" r="3" fill="#ef4444" /> {/* Pin 8 VCC */}
                  <text x="692" y="198" fill="#f87171" fontSize="7">8</text>
                </g>

                {/* Feedback Resistor Rf (~1MΩ) bridging Pin 1 and Pin 2 */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-RX-03')}>
                  <path
                    d="M 635 195 C 615 195, 615 210, 635 210"
                    fill="none"
                    stroke={selectedWire?.connection_id === 'CONN-RX-03' ? '#38bdf8' : '#d4b996'}
                    strokeWidth={selectedWire?.connection_id === 'CONN-RX-03' ? 5 : 3}
                    filter={selectedWire?.connection_id === 'CONN-RX-03' ? 'url(#wire-glow)' : undefined}
                  />
                  <rect x="610" y="198" width="14" height="8" rx="2" fill="#d4b996" stroke="#8b4513" strokeWidth="1" />
                  <text x="617" y="193" fill="#d4b996" fontSize="7" textAnchor="middle" fontFamily="monospace">Rf</text>
                </g>

                {/* ESP32 RX Receiver Board */}
                <g className="cursor-pointer" onClick={() => handleWireClick('CONN-RX-05')}>
                  <rect x="745" y="105" width="115" height="230" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="1.5" />
                  <rect x="757" y="118" width="90" height="60" rx="4" fill="#cbd5e1" opacity="0.95" />
                  <text x="802" y="152" fill="#0f172a" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
                    ESP32 RX
                  </text>
                  <text x="802" y="166" fill="#334155" fontSize="8" textAnchor="middle" fontFamily="monospace">
                    RECEIVER
                  </text>

                  {/* Pin Markers */}
                  <circle cx="745" cy="125" r="4" fill="#000" />
                  <text x="755" y="129" fill="#cbd5e1" fontSize="9" fontFamily="monospace">GND</text>

                  <circle cx="745" cy="205" r="5" fill="#22c55e" />
                  <text x="755" y="209" fill="#4ade80" fontSize="10" fontWeight="bold" fontFamily="monospace">GPIO 34</text>
                </g>

                {/* RX WIRING JUMPERS */}
                {/* 6. CONN-RX-01: BPW34 Anode -> LM358 Pin 2 (White) */}
                <path
                  d="M 585 195 C 600 195, 615 210, 635 210"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-RX-01' ? '#38bdf8' : '#f8fafc'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-RX-01' ? 5 : 3}
                  filter={selectedWire?.connection_id === 'CONN-RX-01' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-RX-01')}
                />

                {/* 7. CONN-RX-02: BPW34 Cathode -> RX Ground Rail (Black) */}
                <path
                  d="M 585 205 C 585 260, 585 320, 585 380"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-RX-02' ? '#38bdf8' : '#334155'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-RX-02' ? 5 : 2.5}
                  filter={selectedWire?.connection_id === 'CONN-RX-02' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-RX-02')}
                />

                {/* 8. CONN-RX-04: LM358 Pin 3 IN+ -> RX Ground Rail (Black) */}
                <path
                  d="M 635 225 C 625 280, 625 330, 625 380"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-RX-04' ? '#38bdf8' : '#334155'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-RX-04' ? 5 : 2.5}
                  filter={selectedWire?.connection_id === 'CONN-RX-04' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-RX-04')}
                />

                {/* 9. CONN-RX-05: LM358 Pin 1 OUT1 -> ESP32 RX GPIO 34 (Green) */}
                <path
                  d="M 635 195 C 670 170, 710 170, 745 205"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-RX-05' ? '#38bdf8' : '#22c55e'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-RX-05' ? 5 : 3.5}
                  filter={selectedWire?.connection_id === 'CONN-RX-05' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-RX-05')}
                />

                {/* 10. CONN-RX-06: LM358 Pin 8 VCC -> RX Power Rail (Red) */}
                <path
                  d="M 700 195 C 700 150, 700 110, 700 75"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-RX-06' ? '#38bdf8' : '#ef4444'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-RX-06' ? 5 : 2.5}
                  filter={selectedWire?.connection_id === 'CONN-RX-06' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-RX-06')}
                />

                {/* 11. CONN-RX-08: ESP32 RX GND -> RX Ground Rail (Black) */}
                <path
                  d="M 745 125 C 730 110, 710 90, 690 90"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-RX-08' ? '#38bdf8' : '#334155'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-RX-08' ? 5 : 2.5}
                  filter={selectedWire?.connection_id === 'CONN-RX-08' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-RX-08')}
                />

                {/* 12. CONN-BENCH-01: Workbench Common Ground Tie (Black) */}
                <path
                  d="M 375 85 C 450 120, 500 120, 555 85"
                  fill="none"
                  stroke={selectedWire?.connection_id === 'CONN-BENCH-01' ? '#38bdf8' : '#020617'}
                  strokeWidth={selectedWire?.connection_id === 'CONN-BENCH-01' ? 6 : 3.5}
                  filter={selectedWire?.connection_id === 'CONN-BENCH-01' ? 'url(#wire-glow)' : undefined}
                  className="cursor-pointer hover:stroke-cyan-400"
                  onClick={() => handleWireClick('CONN-BENCH-01')}
                />
                <text x="465" y="115" fill="#64748b" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                  BENCH COMMON GND JUMPER
                </text>
              </svg>
            </div>

            {/* Wire / Component Details Drawer */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col justify-between">
              {selectedWire ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-xs font-mono text-cyan-400 font-bold">{selectedWire.connection_id}</span>
                      <h4 className="text-sm font-bold text-white mt-0.5">{selectedWire.wire_name || 'Circuit Connection'}</h4>
                    </div>
                    {getStatusBadge(selectedWire.status)}
                  </div>

                  {/* What to explain to professor callout */}
                  {selectedWire.professor_explanation && (
                    <div className="p-3.5 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-mono font-bold text-amber-300 flex items-center space-x-1.5 uppercase">
                          <Volume2 className="w-3.5 h-3.5" />
                          <span>Professor Defense Script:</span>
                        </span>
                        <button
                          onClick={() => toggleSpeech(selectedWire.professor_explanation || '')}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 hover:text-white"
                        >
                          {isSpeaking ? 'Stop' : 'Speak'}
                        </button>
                      </div>
                      <p className="text-xs text-amber-100/90 leading-relaxed font-sans font-medium">
                        &quot;{selectedWire.professor_explanation}&quot;
                      </p>
                    </div>
                  )}

                  <div className="space-y-2.5 text-xs font-mono">
                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Breadboard Origin:</span>
                      <span className="text-white font-semibold block">{selectedWire.source_component} ({selectedWire.source_pin})</span>
                      <span className="text-amber-300 block text-[11px] font-bold">
                        Hole: {selectedWire.source_breadboard_hole || selectedWire.source_location}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950/60 rounded-lg border border-slate-800/80">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase">Breadboard Destination:</span>
                      <span className="text-white font-semibold block">{selectedWire.destination_component} ({selectedWire.destination_pin})</span>
                      <span className="text-amber-300 block text-[11px] font-bold">
                        Hole: {selectedWire.destination_breadboard_hole || selectedWire.destination_location}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Signal:</span>
                        <span className="text-amber-300 font-bold text-[11px] block">{selectedWire.signal_type}</span>
                      </div>
                      <div className="p-2 bg-slate-950/40 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[10px]">Wire Spec:</span>
                        <span className="text-white text-[11px] block">{selectedWire.wire_color}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">Circuit Function:</span>
                      <p className="text-slate-300 leading-relaxed font-sans text-xs">{selectedWire.purpose}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-800/80">
                      <span className="text-slate-400 block font-bold text-[10px] uppercase mb-1">Paper Citation:</span>
                      <p className="text-cyan-300 font-mono text-[11px] leading-relaxed">
                        {selectedWire.verification_source}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-3">
                  <HelpCircle className="w-10 h-10 text-cyan-500/50 animate-pulse" />
                  <h5 className="text-sm font-bold text-slate-300">Select a Wire or Breadboard Socket</h5>
                  <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                    Click any jumper wire, transistor lead, photodiode node, or choose a step from the tour above to view the exact breadboard sockets and defense scripts.
                  </p>
                </div>
              )}

              <div className="pt-4 border-t border-slate-800 mt-4 text-[11px] text-slate-500 flex justify-between font-mono">
                <span>Loaded: {filteredConnections.length} connections</span>
                {selectedWire && (
                  <button
                    onClick={() => onSelectWire(null)}
                    className="text-cyan-400 hover:underline"
                  >
                    Clear selection
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PIN MAPPING TABLE */}
      {activeTab === 'PIN_MAPPING' && (
        <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Source Component</th>
                  <th className="py-3 px-4">Source Socket / Hole</th>
                  <th className="py-3 px-4">Destination</th>
                  <th className="py-3 px-4">Dest Socket / Hole</th>
                  <th className="py-3 px-4">Signal</th>
                  <th className="py-3 px-4">Wire Color</th>
                  <th className="py-3 px-4">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredConnections.map((c) => (
                  <tr
                    key={c.connection_id}
                    onClick={() => {
                      onSelectWire(c);
                      setActiveTab('VISUAL');
                    }}
                    className="hover:bg-slate-900/70 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 text-cyan-400 font-bold">{c.connection_id}</td>
                    <td className="py-3 px-4 text-white font-sans font-medium">{c.source_component}</td>
                    <td className="py-3 px-4 text-amber-300 font-bold">{c.source_breadboard_hole || c.source_pin}</td>
                    <td className="py-3 px-4 text-slate-300 font-sans">{c.destination_component}</td>
                    <td className="py-3 px-4 text-emerald-400 font-bold">{c.destination_breadboard_hole || c.destination_pin}</td>
                    <td className="py-3 px-4 text-slate-300">{c.signal_type}</td>
                    <td className="py-3 px-4 text-slate-400">{c.wire_color}</td>
                    <td className="py-3 px-4 font-sans">{getStatusBadge(c.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WIRING REPORT */}
      {activeTab === 'REPORT' && (
        <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">SemLiFi Comprehensive Wiring Audit Report</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit breakdown of documented hardware connections against physical validation criteria
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => downloadReport('csv')}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Official CSV Audit</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono">Documented Hardware</span>
              <p className="text-2xl font-bold text-blue-400 mt-1">
                {connections.filter(c => c.status === 'DOCUMENTED HARDWARE').length}
              </p>
              <span className="text-[11px] text-slate-500">Explicitly verified from paper text and Table II</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono">Unverified Passives / Bias</span>
              <p className="text-2xl font-bold text-rose-400 mt-1">
                {connections.filter(c => c.status === 'UNVERIFIED').length}
              </p>
              <span className="text-[11px] text-slate-500">Requires workbench breadboard photo</span>
            </div>
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-mono">Total Tracked Connections</span>
              <p className="text-2xl font-bold text-white mt-1">
                {connections.length}
              </p>
              <span className="text-[11px] text-slate-500">Across TX, Optical, and RX breadboards</span>
            </div>
          </div>

          <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800/80 text-xs text-slate-400 space-y-2">
            <h5 className="font-semibold text-slate-200">Engineering Defense Guidelines:</h5>
            <p>
              When explaining the physical setup to evaluators, emphasize that the testbed uses authentic optical modulation (1000 bps Manchester OOK driven by an NPN transistor switch) and real transimpedance amplification (BPW34 silicon PIN photodiode feeding an LM358 single-supply amplifier into an ESP32 12-bit SAR ADC at GPIO 34). Occurrences of burst error are physically generated via an SG90 servo swinging an opaque flap, rather than synthetic software corruptions.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

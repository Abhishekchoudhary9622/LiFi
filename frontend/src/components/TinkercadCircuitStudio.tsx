import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Code2, 
  Download, 
  Search, 
  Sliders, 
  Cpu, 
  Zap, 
  Radio, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  Copy, 
  Check,
  ChevronDown,
  RefreshCw,
  Eye,
  Layers,
  Sparkles,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { Hardware3DLab } from './Hardware3DLab';
import { WireConnection, HardwareComponent } from '../types/semlifi';
import { api } from '../services/api';

const WIRE_COLORS = [
  { name: 'Yellow', hex: '#eab308' },
  { name: 'Blue', hex: '#3b82f6' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Black', hex: '#1e293b' },
  { name: 'Green', hex: '#22c55e' },
  { name: 'Orange', hex: '#f97316' },
  { name: 'White', hex: '#f8fafc' },
  { name: 'Brown', hex: '#8b4513' },
];

export const TinkercadCircuitStudio: React.FC = () => {
  // Master View Mode: 2D Breadboard, 3D Hardware Lab, or Split View
  const [viewMode, setViewMode] = useState<'2D' | '3D' | 'SPLIT'>('2D');

  // Simulation State
  const [isSimulating, setIsSimulating] = useState(false);
  const [simTimeSeconds, setSimTimeSeconds] = useState(0);
  const [selectedWireColor, setSelectedWireColor] = useState(WIRE_COLORS[0]);
  const [wireColorDropdownOpen, setWireColorDropdownOpen] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>('CONN-TX-01');
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'TX' | 'RX'>('TX');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Live Optical Channel Simulation
  const [liveLedState, setLiveLedState] = useState(false);
  const [liveServoAngle, setLiveServoAngle] = useState(0);
  const [isBeamBlocked, setIsBeamBlocked] = useState(false);
  const [liveMultimeterVolts, setLiveMultimeterVolts] = useState(0.0);
  const [oscWaveform, setOscWaveform] = useState<number[]>([]);

  // Telemetry and database
  const [connections, setConnections] = useState<WireConnection[]>([]);
  const [components, setComponents] = useState<HardwareComponent[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [connData, compData] = await Promise.all([
          api.getConnections(),
          api.getComponents()
        ]);
        setConnections(connData);
        setComponents(compData);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  // Simulation loop
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimTimeSeconds(prev => +(prev + 0.1).toFixed(1));

        // 1000 bps Manchester pulse simulation (500 µs half-bits)
        const isHigh = Math.sin(Date.now() / 250) > 0;
        setLiveLedState(isHigh);

        // Cyclic burst occlusion every 5 seconds
        const cycle = (Date.now() / 1000) % 5.5;
        const occluded = cycle > 4.0;
        setIsBeamBlocked(occluded);
        const targetAngle = occluded ? 90 : 0;
        setLiveServoAngle(targetAngle);

        // Multimeter and ADC voltage
        if (occluded) {
          setLiveMultimeterVolts(0.03);
        } else if (isHigh) {
          setLiveMultimeterVolts(+(1.14 + Math.random() * 0.03).toFixed(2));
        } else {
          setLiveMultimeterVolts(+(0.18 + Math.random() * 0.02).toFixed(2));
        }

        // Oscilloscope waveform trace
        setOscWaveform(prev => {
          const val = occluded ? 4 : (isHigh ? 146 : 22) + Math.floor(Math.random() * 4 - 2);
          return [...prev.slice(-32), val];
        });
      }, 100);
    } else {
      setSimTimeSeconds(0);
      setLiveLedState(false);
      setLiveMultimeterVolts(0.0);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  const toggleSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  const selectedWire = connections.find(c => c.connection_id === selectedElementId) || null;

  // C++ Arduino Firmware Code
  const TX_FIRMWARE_CODE = `// ==========================================
// SemLiFi Transmitter Firmware (ESP32 TX)
// Hardware: ESP32 DevKit V1 -> 2N2222 -> LED
// Bit Rate: 1000 bps (Bit Period = 1000 µs)
// Modulation: Manchester IEEE 802.3
// ==========================================

#define TX_LED_PIN 23    // GPIO 23 -> 1kΩ -> 2N2222 Base
#define BIT_PERIOD_US 1000
#define HALF_BIT_US 500

hw_timer_t *timer = NULL;
portMUX_TYPE timerMux = portMUX_INITIALIZER_UNLOCKED;

// Dallas/Maxim CRC-8 (Polynomial 0x31)
uint8_t crc8_dallas(const uint8_t *data, size_t len) {
  uint8_t crc = 0x00;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (uint8_t b = 0; b < 8; b++) {
      if (crc & 0x80) crc = (crc << 1) ^ 0x31;
      else crc <<= 1;
    }
  }
  return crc;
}

// Manchester Half-Bit Transmission
void send_manchester_bit(uint8_t bit) {
  if (bit == 0) {
    digitalWrite(TX_LED_PIN, LOW);   // Half-bit 0
    delayMicroseconds(HALF_BIT_US);
    digitalWrite(TX_LED_PIN, HIGH);  // Half-bit 1
    delayMicroseconds(HALF_BIT_US);
  } else {
    digitalWrite(TX_LED_PIN, HIGH);  // Half-bit 1
    delayMicroseconds(HALF_BIT_US);
    digitalWrite(TX_LED_PIN, LOW);   // Half-bit 0
    delayMicroseconds(HALF_BIT_US);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(TX_LED_PIN, OUTPUT);
  digitalWrite(TX_LED_PIN, LOW);
  Serial.println("[SemLiFi-TX] Transmitter initialized on GPIO 23.");
}

void loop() {
  const char payload[] = "TEMP=27.4,HUM=61,MOTOR=ON";
  uint8_t crc = crc8_dallas((uint8_t*)payload, strlen(payload));

  // Frame: [0xAA 0x55][LEN][SEQ][PAYLOAD][CRC8]
  send_manchester_byte(0xAA);
  send_manchester_byte(0x55);
  send_manchester_byte(strlen(payload));
  send_manchester_byte(0x01);

  for (size_t i = 0; i < strlen(payload); i++) {
    send_manchester_byte(payload[i]);
  }
  send_manchester_byte(crc);

  delay(200);
}`;

  const RX_FIRMWARE_CODE = `// ==========================================
// SemLiFi Receiver Firmware (ESP32 RX)
// Hardware: BPW34 -> LM358 TIA -> GPIO 34 ADC1_CH6
// Slicer Threshold: ~50 ADC Counts
// Mid-Bit Sampling Window: 450 - 550 µs
// ==========================================

#define RX_ADC_PIN 34    // GPIO 34 (ADC1 Channel 6)
#define SLICER_THRESHOLD 50
#define SAMPLING_WINDOW_START_US 450
#define SAMPLING_WINDOW_END_US 550

void setup() {
  Serial.begin(115200);
  analogReadResolution(12); // 12-bit ADC (0 - 4095)
  analogSetAttenuation(ADC_11db); // 0 - 3.3V range
  Serial.println("[SemLiFi-RX] Receiver listening on GPIO 34...");
}

uint8_t sample_optical_bit() {
  delayMicroseconds(500); // Align to mid-bit window
  uint16_t adc = analogRead(RX_ADC_PIN);
  
  if (adc < 15) {
    // Optical occlusion detected!
    trigger_burst_loss_detected();
    return 0xFF; // Violation
  }
  return (adc >= SLICER_THRESHOLD) ? 1 : 0;
}

void trigger_burst_loss_detected() {
  Serial.println("[BURST] Physical beam occlusion! Fallback to BASR.");
}

void loop() {
  uint16_t raw_adc = analogRead(RX_ADC_PIN);
  if (raw_adc > SLICER_THRESHOLD) {
    decode_frame();
  }
}`;

  // Helper to render an authentic white solderless breadboard
  const renderBreadboard = (x: number, y: number, label: string) => {
    const width = 450;
    const height = 340;
    const rows = 26;

    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* Breadboard Base Shadow & Off-White Body */}
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          rx="12"
          fill="#f8fafc"
          stroke="#cbd5e1"
          strokeWidth="2.5"
          filter="drop-shadow(0 10px 15px rgba(0,0,0,0.4))"
        />

        {/* Board Title Label */}
        <text
          x={width / 2}
          y="24"
          fill="#475569"
          fontSize="12"
          fontWeight="bold"
          textAnchor="middle"
          fontFamily="monospace"
        >
          {label}
        </text>

        {/* Top Power Rails Strip */}
        <line x1="25" y1="42" x2={width - 25} y2="42" stroke="#ef4444" strokeWidth="2" />
        <line x1="25" y1="58" x2={width - 25} y2="58" stroke="#3b82f6" strokeWidth="2" />
        <text x="12" y="45" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">+</text>
        <text x="12" y="61" fill="#3b82f6" fontSize="14" fontWeight="bold" fontFamily="monospace">-</text>

        {/* Center IC Divider Trough */}
        <rect x="20" y="165" width={width - 40} height="16" fill="#e2e8f0" rx="3" />
        <text x={width / 2} y="177" fill="#94a3b8" fontSize="8" textAnchor="middle" fontFamily="monospace">
          IC DIVIDER TROUGH (0.3&quot; PITCH)
        </text>

        {/* Bottom Power Rails Strip */}
        <line x1="25" y1="285" x2={width - 25} y2="285" stroke="#3b82f6" strokeWidth="2" />
        <line x1="25" y1="301" x2={width - 25} y2="301" stroke="#ef4444" strokeWidth="2" />
        <text x="12" y="288" fill="#3b82f6" fontSize="14" fontWeight="bold" fontFamily="monospace">-</text>
        <text x="12" y="304" fill="#ef4444" fontSize="12" fontWeight="bold" fontFamily="monospace">+</text>

        {/* Realistic Metallic Holes Grid with Column Letters and Row Numbers */}
        {/* Column letters */}
        {['a', 'b', 'c', 'd', 'e'].map((col, idx) => (
          <text key={`col-top-${col}`} x="16" y={82 + idx * 16} fill="#94a3b8" fontSize="8" fontFamily="monospace">
            {col}
          </text>
        ))}
        {['f', 'g', 'h', 'i', 'j'].map((col, idx) => (
          <text key={`col-bot-${col}`} x="16" y={198 + idx * 16} fill="#94a3b8" fontSize="8" fontFamily="monospace">
            {col}
          </text>
        ))}

        {/* Sockets */}
        {Array.from({ length: rows }).map((_, r) => {
          const rowX = 35 + r * 15.5;
          const showNum = r % 5 === 0;

          return (
            <g key={`row-${r}`}>
              {/* Row Number */}
              {showNum && (
                <text x={rowX} y="72" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {r + 1}
                </text>
              )}

              {/* Power Rail Sockets */}
              <circle cx={rowX} cy="42" r="2.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.5" />
              <circle cx={rowX} cy="58" r="2.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.5" />

              {/* Columns a-e (Top) */}
              {[0, 1, 2, 3, 4].map(c => (
                <circle key={`t-${r}-${c}`} cx={rowX} cy={80 + c * 16} r="2.8" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.6" />
              ))}

              {/* Columns f-j (Bottom) */}
              {[0, 1, 2, 3, 4].map(c => (
                <circle key={`b-${r}-${c}`} cx={rowX} cy={196 + c * 16} r="2.8" fill="#0f172a" stroke="#94a3b8" strokeWidth="0.6" />
              ))}

              {/* Bottom Power Rail Sockets */}
              <circle cx={rowX} cy="285" r="2.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.5" />
              <circle cx={rowX} cy="301" r="2.5" fill="#0f172a" stroke="#cbd5e1" strokeWidth="0.5" />

              {showNum && (
                <text x={rowX} y="276" fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
                  {r + 1}
                </text>
              )}
            </g>
          );
        })}
      </g>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] bg-[#0a0e17] text-slate-100 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* ---------------- TOP MASTER TOOLBAR ---------------- */}
      <div className="h-16 bg-[#0f172a] border-b border-slate-800 px-5 flex items-center justify-between shrink-0 select-none z-20">
        {/* Left Branding */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-extrabold text-white text-sm shadow-lg shadow-cyan-500/25">
            TC
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm font-extrabold text-white tracking-wide">SemLiFi Real Hardware Workbench</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                PRO HARDWARE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Authentic Solderless Breadboards, Discrete ICs &amp; Jumper Tubes</p>
          </div>
        </div>

        {/* Center: View Switcher (2D Breadboard / 3D Hardware Lab / Split View) */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => setViewMode('2D')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === '2D'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>2D Real Breadboard</span>
          </button>

          <button
            onClick={() => setViewMode('3D')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === '3D'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3D Interactive Lab</span>
          </button>

          <button
            onClick={() => setViewMode('SPLIT')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              viewMode === 'SPLIT'
                ? 'bg-gradient-to-r from-cyan-600 to-amber-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Split 2D + 3D View</span>
          </button>
        </div>

        {/* Right Actions: Code & Simulation */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowCodeEditor(!showCodeEditor)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition border ${
              showCodeEditor
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                : 'bg-slate-900 text-slate-300 hover:text-white border-slate-700'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>C++ Code</span>
          </button>

          {/* Start/Stop Simulation */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-extrabold transition shadow-lg ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30 animate-pulse'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
            }`}
          >
            {isSimulating ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isSimulating ? `Stop (${simTimeSeconds}s)` : 'Start Simulation'}</span>
          </button>
        </div>
      </div>

      {/* ---------------- WORKSPACE CONTENT ---------------- */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT / CENTER VIEW */}
        <div className="flex-1 flex flex-col overflow-auto bg-[#070b12] relative">
          {/* Top Quick Status Pill */}
          <div className="p-3 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between px-6 shrink-0">
            <div className="flex items-center space-x-4 text-xs font-mono">
              <span className="text-slate-400">Optical Emitter:</span>
              <span className={liveLedState ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                {liveLedState ? '1000 bps Manchester OOK (LED ON)' : 'IDLE (LED OFF)'}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">SG90 Servo Flap:</span>
              <span className={isBeamBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                {isBeamBlocked ? `OCCLUSION ACTIVE (${liveServoAngle}°)` : `BEAM CLEAR (${liveServoAngle}°)`}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">TIA Photodiode Output:</span>
              <span className="text-cyan-400 font-bold">{liveMultimeterVolts.toFixed(2)} V</span>
            </div>

            <span className="text-[11px] font-mono text-cyan-400 font-bold">
              CLICK ANY JUMPER WIRE FOR PROFESSOR DEFENSE SCRIPT
            </span>
          </div>

          {/* MAIN CANVAS ROUTER (2D, 3D, OR SPLIT) */}
          <div className="flex-1 flex overflow-auto">
            {/* 2D CANVAS CONTAINER */}
            {(viewMode === '2D' || viewMode === 'SPLIT') && (
              <div className={`${viewMode === 'SPLIT' ? 'w-1/2 border-r border-slate-800' : 'w-full'} flex-1 p-4 overflow-auto`}>
                <div className="relative bg-[#0d131f] rounded-2xl border border-slate-800 shadow-2xl p-4 overflow-x-auto min-w-[950px]">
                  <svg viewBox="0 0 1120 540" className="w-full h-auto select-none" style={{ minWidth: '950px' }}>
                    <defs>
                      <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge>
                          <feMergeNode in="blur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>

                    {/* 1. TRANSMITTER BREADBOARD (X = 40) */}
                    {renderBreadboard(40, 90, 'TRANSMITTER BREADBOARD (TX)')}

                    {/* 2. RECEIVER BREADBOARD (X = 630) */}
                    {renderBreadboard(630, 90, 'RECEIVER BREADBOARD (RX)')}

                    {/* ESP32 TX BOARD PLUGGED ACROSS BREADBOARD */}
                    <g 
                      id="comp-esp32-tx" 
                      className="cursor-pointer"
                      onClick={() => setSelectedElementId('CONN-TX-01')}
                    >
                      <rect x="75" y="170" width="135" height="230" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
                      <rect x="88" y="185" width="110" height="65" rx="4" fill="#cbd5e1" />
                      <text x="143" y="218" fill="#0f172a" fontSize="12" fontWeight="bold" textAnchor="middle">ESP-WROOM-32</text>
                      <text x="143" y="234" fill="#334155" fontSize="9" textAnchor="middle" fontFamily="monospace">TX CONTROLLER</text>

                      {/* Header Pins */}
                      <circle cx="195" cy="270" r="5" fill="#eab308" stroke="#000" strokeWidth="1.5" />
                      <text x="165" y="274" fill="#facc15" fontSize="9" fontWeight="bold" fontFamily="monospace">GPIO 23</text>

                      <circle cx="195" cy="300" r="5" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                      <text x="168" y="304" fill="#cbd5e1" fontSize="9" fontFamily="monospace">GND</text>
                    </g>

                    {/* 1kΩ BASE RESISTOR R_base (Row 11 to Row 14) */}
                    <g id="comp-res-base" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-TX-01')}>
                      <path d="M 195 270 C 220 270, 220 295, 245 295" fill="none" stroke="#94a3b8" strokeWidth="2" />
                      <rect x="230" y="290" width="30" height="11" rx="3" fill="#d4b996" stroke="#8b4513" strokeWidth="1" />
                      {/* Bands: Brown, Black, Red, Gold */}
                      <line x1="237" y1="290" x2="237" y2="301" stroke="#8b4513" strokeWidth="2" />
                      <line x1="242" y1="290" x2="242" y2="301" stroke="#000000" strokeWidth="2" />
                      <line x1="247" y1="290" x2="247" y2="301" stroke="#ef4444" strokeWidth="2" />
                      <line x1="254" y1="290" x2="254" y2="301" stroke="#d4af37" strokeWidth="1.5" />
                      <text x="245" y="285" fill="#d4b996" fontSize="8" textAnchor="middle" fontFamily="monospace">1kΩ</text>
                    </g>

                    {/* 2N2222 NPN TRANSISTOR DRIVER (Row 13, 14, 15) */}
                    <g id="comp-2n2222" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-TX-02')}>
                      <circle cx="310" cy="295" r="22" fill="#020617" stroke="#64748b" strokeWidth="2" filter="drop-shadow(0 2px 4px rgba(0,0,0,0.6))" />
                      <text x="310" y="293" fill="#f8fafc" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">2N2222</text>
                      <text x="310" y="305" fill="#94a3b8" fontSize="8" textAnchor="middle">NPN</text>

                      {/* Pins E, B, C */}
                      <circle cx="295" cy="295" r="4" fill="#0f172a" stroke="#fff" strokeWidth="1" />
                      <text x="295" y="313" fill="#94a3b8" fontSize="8" textAnchor="middle">E</text>

                      <circle cx="310" cy="295" r="4" fill="#eab308" stroke="#000" strokeWidth="1" />
                      <text x="310" y="313" fill="#facc15" fontSize="8" textAnchor="middle">B</text>

                      <circle cx="325" cy="295" r="4" fill="#3b82f6" stroke="#000" strokeWidth="1" />
                      <text x="325" y="313" fill="#38bdf8" fontSize="8" textAnchor="middle">C</text>
                    </g>

                    {/* HIGH-INTENSITY OPTICAL LED (Row 18) */}
                    <g id="comp-led" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-TX-02')}>
                      {isSimulating && liveLedState && (
                        <circle cx="415" cy="295" r="38" fill="#fef08a" opacity="0.45" filter="url(#glow-cyan)" />
                      )}
                      <circle cx="415" cy="295" r="20" fill={isSimulating && liveLedState ? '#fef08a' : '#854d0e'} stroke="#eab308" strokeWidth="2" />
                      <text x="415" y="298" fill={isSimulating && liveLedState ? '#713f12' : '#fef08a'} fontSize="9" fontWeight="bold" textAnchor="middle">LED</text>
                      <text x="415" y="330" fill="#fef08a" fontSize="8" textAnchor="middle" fontWeight="bold">TX 5mm</text>

                      <circle cx="405" cy="305" r="4" fill="#ef4444" />
                      <circle cx="425" cy="305" r="4" fill="#3b82f6" />
                    </g>

                    {/* OPTICAL BEAM CHANNEL IN CENTER */}
                    <g id="opt-beam">
                      <path
                        d="M 435 285 L 660 265 L 660 325 L 435 305 Z"
                        fill="#38bdf8"
                        opacity={isSimulating ? (isBeamBlocked ? 0.04 : (liveLedState ? 0.4 : 0.08)) : 0.15}
                      />
                      <text x="545" y="275" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                        OPTICAL BEAM
                      </text>
                      <text x="545" y="290" fill="#94a3b8" fontSize="8" textAnchor="middle">
                        {isBeamBlocked ? '⛔ OCCLUSION FLAP IN BEAM' : 'FREE-SPACE BEAM CLEAR'}
                      </text>
                    </g>

                    {/* SG90 SERVO MECHANISM */}
                    <g id="comp-servo" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-OPT-01')}>
                      <rect x="520" y="350" width="55" height="85" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                      <text x="547" y="385" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle">SG90</text>
                      <text x="547" y="400" fill="#bae6fd" fontSize="8" textAnchor="middle">Servo</text>

                      {/* Moving Flap Arm */}
                      <g transform={`rotate(${liveServoAngle}, 547, 340)`} style={{ transition: 'transform 0.15s ease-out' }}>
                        <rect x="544" y="260" width="6" height="85" fill="#1e293b" stroke="#f43f5e" strokeWidth="1.5" rx="2" />
                        <rect x="536" y="260" width="22" height="30" fill="#f43f5e" rx="3" />
                        <text x="547" y="278" fill="#fff" fontSize="7" fontWeight="bold" textAnchor="middle">FLAP</text>
                      </g>
                    </g>

                    {/* BPW34 SILICON PIN PHOTODIODE */}
                    <g id="comp-bpw34" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-RX-01')}>
                      <rect x="665" y="280" width="32" height="32" rx="3" fill="#3b0764" stroke="#c084fc" strokeWidth="2" />
                      <rect x="670" y="285" width="22" height="22" fill="#581c87" />
                      <text x="681" y="299" fill="#f5d0fe" fontSize="7" fontWeight="bold" textAnchor="middle">BPW34</text>
                      <circle cx="690" cy="305" r="4" fill="#ffffff" />
                    </g>

                    {/* LM358 DUAL OP-AMP IC DIP-8 STRADDLING TROUGH */}
                    <g id="comp-lm358" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-RX-03')}>
                      <rect x="745" y="235" width="70" height="90" rx="5" fill="#020617" stroke="#a855f7" strokeWidth="2" />
                      <circle cx="780" cy="242" r="4" fill="#475569" />
                      <text x="780" y="275" fill="#f8fafc" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">LM358</text>
                      <text x="780" y="290" fill="#c084fc" fontSize="8" textAnchor="middle">TIA OP-AMP</text>

                      {/* Pins 1 to 4 */}
                      <circle cx="745" cy="255" r="4" fill="#22c55e" />
                      <text x="753" y="258" fill="#4ade80" fontSize="7">1</text>
                      <circle cx="745" cy="275" r="4" fill="#f8fafc" />
                      <text x="753" y="278" fill="#f8fafc" fontSize="7">2</text>
                      <circle cx="745" cy="295" r="4" fill="#0f172a" stroke="#fff" strokeWidth="1" />
                      <text x="753" y="298" fill="#94a3b8" fontSize="7">3</text>
                      <circle cx="745" cy="315" r="4" fill="#0f172a" stroke="#fff" strokeWidth="1" />
                      <text x="753" y="318" fill="#94a3b8" fontSize="7">4</text>

                      {/* Pins 5 to 8 */}
                      <circle cx="815" cy="255" r="4" fill="#ef4444" />
                      <text x="807" y="258" fill="#f87171" fontSize="7">8</text>
                    </g>

                    {/* Rf FEEDBACK RESISTOR 1MΩ BRIDGING PIN 1 & 2 */}
                    <g id="comp-res-rf" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-RX-03')}>
                      <path d="M 745 255 C 720 255, 720 275, 745 275" fill="none" stroke="#d4b996" strokeWidth="3" />
                      <rect x="715" y="260" width="18" height="10" rx="2" fill="#d4b996" stroke="#8b4513" strokeWidth="1" />
                      <text x="724" y="255" fill="#d4b996" fontSize="7" textAnchor="middle" fontFamily="monospace">Rf 1MΩ</text>
                    </g>

                    {/* ESP32 RX RECEIVER BOARD */}
                    <g id="comp-esp32-rx" className="cursor-pointer" onClick={() => setSelectedElementId('CONN-RX-05')}>
                      <rect x="850" y="170" width="135" height="230" rx="8" fill="#1e3a8a" stroke="#3b82f6" strokeWidth="2" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.5))" />
                      <rect x="863" y="185" width="110" height="65" rx="4" fill="#cbd5e1" />
                      <text x="918" y="218" fill="#0f172a" fontSize="12" fontWeight="bold" textAnchor="middle">ESP-WROOM-32</text>
                      <text x="918" y="234" fill="#334155" fontSize="9" textAnchor="middle" fontFamily="monospace">RX RECEIVER</text>

                      {/* GPIO 34 ADC Pin */}
                      <circle cx="850" cy="270" r="5" fill="#22c55e" stroke="#000" strokeWidth="1.5" />
                      <text x="862" y="274" fill="#4ade80" fontSize="9" fontWeight="bold" fontFamily="monospace">GPIO 34</text>

                      <circle cx="850" cy="300" r="5" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
                      <text x="862" y="304" fill="#cbd5e1" fontSize="9" fontFamily="monospace">GND</text>
                    </g>

                    {/* ---------------- REALISTIC DUPONT JUMPER WIRES ---------------- */}
                    {/* W-TX-01 (Yellow): GPIO 23 -> 2N2222 Base */}
                    <path
                      d="M 195 270 C 230 250, 270 270, 310 295"
                      fill="none"
                      stroke={selectedElementId === 'CONN-TX-01' ? '#38bdf8' : '#eab308'}
                      strokeWidth={selectedElementId === 'CONN-TX-01' ? 6 : 4}
                      filter={selectedElementId === 'CONN-TX-01' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-TX-01')}
                    />

                    {/* W-TX-02 (Blue): 2N2222 Collector -> LED Cathode */}
                    <path
                      d="M 325 295 C 350 260, 385 260, 425 305"
                      fill="none"
                      stroke={selectedElementId === 'CONN-TX-02' ? '#38bdf8' : '#3b82f6'}
                      strokeWidth={selectedElementId === 'CONN-TX-02' ? 6 : 4}
                      filter={selectedElementId === 'CONN-TX-02' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-TX-02')}
                    />

                    {/* W-TX-03 (Black): 2N2222 Emitter -> Ground Rail */}
                    <path
                      d="M 295 295 C 295 340, 295 380, 295 405"
                      fill="none"
                      stroke={selectedElementId === 'CONN-TX-03' ? '#38bdf8' : '#1e293b'}
                      strokeWidth={selectedElementId === 'CONN-TX-03' ? 6 : 3.5}
                      filter={selectedElementId === 'CONN-TX-03' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-TX-03')}
                    />

                    {/* W-TX-04 (Red): +5V Rail -> LED Anode */}
                    <path
                      d="M 405 132 C 405 180, 405 240, 405 305"
                      fill="none"
                      stroke={selectedElementId === 'CONN-TX-04' ? '#38bdf8' : '#ef4444'}
                      strokeWidth={selectedElementId === 'CONN-TX-04' ? 6 : 3.5}
                      filter={selectedElementId === 'CONN-TX-04' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-TX-04')}
                    />

                    {/* W-TX-05 (Black): ESP32 GND -> TX Ground Rail */}
                    <path
                      d="M 195 300 C 195 340, 195 380, 195 405"
                      fill="none"
                      stroke={selectedElementId === 'CONN-TX-05' ? '#38bdf8' : '#1e293b'}
                      strokeWidth={selectedElementId === 'CONN-TX-05' ? 6 : 3.5}
                      filter={selectedElementId === 'CONN-TX-05' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-TX-05')}
                    />

                    {/* W-RX-01 (White): BPW34 Anode -> LM358 Pin 2 */}
                    <path
                      d="M 690 305 C 710 305, 725 275, 745 275"
                      fill="none"
                      stroke={selectedElementId === 'CONN-RX-01' ? '#38bdf8' : '#f8fafc'}
                      strokeWidth={selectedElementId === 'CONN-RX-01' ? 6 : 4}
                      filter={selectedElementId === 'CONN-RX-01' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-RX-01')}
                    />

                    {/* W-RX-05 (Green): LM358 Pin 1 -> ESP32 RX GPIO 34 */}
                    <path
                      d="M 745 255 C 780 210, 815 210, 850 270"
                      fill="none"
                      stroke={selectedElementId === 'CONN-RX-05' ? '#38bdf8' : '#22c55e'}
                      strokeWidth={selectedElementId === 'CONN-RX-05' ? 6 : 4.5}
                      filter={selectedElementId === 'CONN-RX-05' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-RX-05')}
                    />

                    {/* W-BENCH-01 (Long Black Bench Ground Jumper) */}
                    <path
                      d="M 450 405 C 540 450, 580 450, 670 405"
                      fill="none"
                      stroke={selectedElementId === 'CONN-BENCH-01' ? '#38bdf8' : '#020617'}
                      strokeWidth={selectedElementId === 'CONN-BENCH-01' ? 7 : 4}
                      filter={selectedElementId === 'CONN-BENCH-01' ? 'url(#glow-cyan)' : undefined}
                      className="cursor-pointer hover:stroke-cyan-400"
                      onClick={() => setSelectedElementId('CONN-BENCH-01')}
                    />
                    <text x="560" y="445" fill="#64748b" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                      BENCH COMMON GROUND JUMPER
                    </text>
                  </svg>
                </div>
              </div>
            )}

            {/* 3D CANVAS CONTAINER */}
            {(viewMode === '3D' || viewMode === 'SPLIT') && (
              <div className={`${viewMode === 'SPLIT' ? 'w-1/2' : 'w-full'} flex-1 p-4 overflow-auto`}>
                <Hardware3DLab
                  components={components}
                  connections={connections}
                  isBeamBlocked={isBeamBlocked}
                  servoAngle={liveServoAngle}
                  ledOn={liveLedState}
                  onSelectComponent={() => {}}
                  onSelectWire={(wire) => setSelectedElementId(wire?.connection_id || null)}
                  selectedWire={selectedWire}
                />
              </div>
            )}
          </div>

          {/* BOTTOM PROFESSOR DEFENSE SCRIPT CARD */}
          {selectedWire && (
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center space-x-2 font-mono">
                  <span className="text-xs font-bold text-cyan-400">{selectedWire.connection_id}</span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-white font-bold">{selectedWire.wire_name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    {selectedWire.status}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  <strong className="text-amber-400 font-mono">What to explain to your professor: </strong>
                  &quot;{selectedWire.professor_explanation}&quot;
                </p>

                <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-400">
                  <span>Start: <strong className="text-white">{selectedWire.source_breadboard_hole || selectedWire.source_location}</strong></span>
                  <span>&rarr;</span>
                  <span>End: <strong className="text-white">{selectedWire.destination_breadboard_hole || selectedWire.destination_location}</strong></span>
                  <span className="text-amber-300">({selectedWire.signal_type})</span>
                </div>
              </div>

              <button
                onClick={() => toggleSpeech(selectedWire.professor_explanation || '')}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-300 hover:text-white hover:bg-slate-800 transition shrink-0"
              >
                <Volume2 className="w-4 h-4" />
                <span>{isSpeaking ? 'Stop Audio' : 'Speak Aloud (TTS)'}</span>
              </button>
            </div>
          )}
        </div>

        {/* RIGHT CODE EDITOR SIDEBAR */}
        {showCodeEditor && (
          <div className="w-[420px] bg-[#111827] border-l border-slate-800 flex flex-col z-20 shadow-2xl">
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
                <button
                  onClick={() => setActiveCodeTab('TX')}
                  className={`px-3 py-1 rounded font-bold transition ${activeCodeTab === 'TX' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                >
                  ESP32_TX.ino
                </button>
                <button
                  onClick={() => setActiveCodeTab('RX')}
                  className={`px-3 py-1 rounded font-bold transition ${activeCodeTab === 'RX' ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                >
                  ESP32_RX.ino
                </button>
              </div>

              <button
                onClick={() => {
                  const code = activeCodeTab === 'TX' ? TX_FIRMWARE_CODE : RX_FIRMWARE_CODE;
                  navigator.clipboard.writeText(code);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-slate-800 text-xs font-mono text-slate-300 hover:text-white"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="flex-1 p-3 overflow-auto font-mono text-[11px] leading-relaxed bg-[#070b12] text-cyan-300">
              <pre className="whitespace-pre">
                {activeCodeTab === 'TX' ? TX_FIRMWARE_CODE : RX_FIRMWARE_CODE}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

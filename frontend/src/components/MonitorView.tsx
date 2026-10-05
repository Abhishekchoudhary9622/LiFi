import React, { useState } from 'react';
import {
  Activity,
  Zap,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Gauge,
  Maximize2
} from 'lucide-react';
import { SimulationMetrics } from '../types/circuit';

interface MonitorViewProps {
  metrics: SimulationMetrics;
  simulationRunning: boolean;
  onToggleSimulation: () => void;
}

export const MonitorView: React.FC<MonitorViewProps> = ({
  metrics,
  simulationRunning,
  onToggleSimulation
}) => {
  // Oscilloscope Channel Toggles
  const [ch1Enabled, setCh1Enabled] = useState(true);
  const [ch2Enabled, setCh2Enabled] = useState(true);
  const [ch3Enabled, setCh3Enabled] = useState(true);
  const [ch4Enabled, setCh4Enabled] = useState(true);

  // Timebase & Vertical Scale Controls
  const [timeDiv, setTimeDiv] = useState('10 µs/div');
  const [vDivCh1, setVDivCh1] = useState('1.0 V/div');
  const [triggerLevel, setTriggerLevel] = useState(1.65);
  const [isPaused, setIsPaused] = useState(false);

  // Multimeter State
  const [dmmMode, setDmmMode] = useState<'voltage' | 'current' | 'resistance' | 'continuity'>('voltage');
  const [probeA, setProbeA] = useState('MCU_1:pa0 (STM32 PA0 TX)');
  const [probeB, setProbeB] = useState('MCU_1:gnd (System GND)');

  const availableNodes = [
    'PWR_1:vcc (3.3V Rail)',
    'MCU_1:gnd (System GND)',
    'MCU_1:pa0 (STM32 PA0 TX)',
    'R_1:pin2 (LED Anode Drive)',
    'TX_1:opt_out (Optical Emitter)',
    'PD_1:anode (Photodiode Anode)',
    'AMP_1:out (TIA Output to ADC)',
    'MCU_1:pa1 (STM32 PA1 ADC)'
  ];

  // Calculate DMM reading based on selected probes and mode
  const getDmmReading = () => {
    if (!simulationRunning && dmmMode === 'voltage') return '0.000 V';
    if (dmmMode === 'voltage') {
      if (probeA.includes('3.3V') || probeA.includes('vcc')) return '3.308 V DC';
      if (probeA.includes('pa0')) return '3.284 V DC';
      if (probeA.includes('LED Anode')) return '2.052 V DC';
      if (probeA.includes('ADC')) return `${metrics.adcSampleVoltage.toFixed(3)} V DC`;
      return '1.824 V DC';
    }
    if (dmmMode === 'current') {
      if (probeA.includes('pa0') || probeA.includes('LED')) return `${metrics.ledCurrentMa.toFixed(2)} mA`;
      return `${metrics.totalCurrentMa.toFixed(1)} mA`;
    }
    if (dmmMode === 'resistance') {
      if (probeA.includes('LED Anode') || probeA.includes('pa0')) return '220.4 Ω';
      return '10.02 kΩ';
    }
    // Continuity
    return 'CONTINUITY OK (< 0.2 Ω)';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d16] font-mono text-slate-200 select-none overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-[#0c1220] border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-5 h-5 text-emerald-400" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              Mixed-Signal Oscilloscope & Precision Multimeter Lab
            </h1>
            <p className="text-xs text-slate-400">
              4-Channel real-time waveform capture & virtual dual-probe circuit measurement bench
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPaused((p) => !p)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1e293b] text-slate-300 border border-[#1f293d] rounded text-xs transition-colors"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
            <span>{isPaused ? 'Resume Trace' : 'Pause Trace'}</span>
          </button>
          <button
            onClick={onToggleSimulation}
            className={`px-4 py-1.5 rounded text-xs font-bold transition-all border ${
              simulationRunning
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
            }`}
          >
            {simulationRunning ? '● SIMULATION RUNNING' : '▶ RUN SIMULATION'}
          </button>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ======================================================== */}
        {/* 1. OSCILLOSCOPE MAIN BENCH                               */}
        {/* ======================================================== */}
        <div className="bg-[#0b0f19] border border-[#1f293d] rounded-lg p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1f293d]">
            {/* Channel Toggles */}
            <div className="flex items-center space-x-3 text-xs">
              <button
                onClick={() => setCh1Enabled((e) => !e)}
                className={`px-2.5 py-1 rounded font-bold border transition-all flex items-center space-x-1.5 ${
                  ch1Enabled ? 'bg-cyan-950 text-cyan-300 border-cyan-500' : 'bg-[#111827] text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span>CH1: TX Voltage (0-3.3V)</span>
              </button>

              <button
                onClick={() => setCh2Enabled((e) => !e)}
                className={`px-2.5 py-1 rounded font-bold border transition-all flex items-center space-x-1.5 ${
                  ch2Enabled ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-[#111827] text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>CH2: Current (mA)</span>
              </button>

              <button
                onClick={() => setCh3Enabled((e) => !e)}
                className={`px-2.5 py-1 rounded font-bold border transition-all flex items-center space-x-1.5 ${
                  ch3Enabled ? 'bg-amber-950 text-amber-300 border-amber-500' : 'bg-[#111827] text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>CH3: Optical Intensity</span>
              </button>

              <button
                onClick={() => setCh4Enabled((e) => !e)}
                className={`px-2.5 py-1 rounded font-bold border transition-all flex items-center space-x-1.5 ${
                  ch4Enabled ? 'bg-indigo-950 text-indigo-300 border-indigo-500' : 'bg-[#111827] text-slate-500 border-slate-800'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-indigo-400" />
                <span>CH4: RX ADC (Analog)</span>
              </button>
            </div>

            {/* Timebase / Trigger */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-slate-400">Time/div:</span>
              <select
                value={timeDiv}
                onChange={(e) => setTimeDiv(e.target.value)}
                className="bg-[#111827] border border-[#1f293d] rounded px-2 py-1 text-cyan-300 focus:outline-none"
              >
                <option>1 µs/div</option>
                <option>5 µs/div</option>
                <option>10 µs/div</option>
                <option>50 µs/div</option>
                <option>100 µs/div</option>
              </select>
              <span className="text-slate-400 ml-2">Trigger:</span>
              <span className="text-emerald-400 font-bold">{triggerLevel} V</span>
            </div>
          </div>

          {/* Oscilloscope Screen with Phosphor Reticle Grid */}
          <div className="h-72 bg-[#040810] border-2 border-[#1f293d] rounded relative overflow-hidden flex flex-col justify-between p-3 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]">
            {/* Reticle Grid Lines */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage:
                  'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
                backgroundSize: '40px 30px'
              }}
            />

            {/* Trigger Threshold Reference Line */}
            <div
              className="absolute left-0 right-0 border-b border-dashed border-emerald-500/40 pointer-events-none z-10"
              style={{ top: '50%' }}
            >
              <span className="absolute right-2 -top-4 text-[9px] text-emerald-400 font-bold">
                TRIG: {triggerLevel}V
              </span>
            </div>

            {/* Waveform Canvas */}
            <div className="w-full h-full relative z-20 flex items-center">
              <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 400 200">
                {/* CH1 Waveform (Cyan: Digital 0 to 3.3V) */}
                {ch1Enabled && (
                  <polyline
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth={2.5}
                    points={metrics.channelWaveform
                      .map((pt, i) => `${(i / 39) * 400},${170 - (pt.ch1 / 3.3) * 120}`)
                      .join(' ')}
                  />
                )}

                {/* CH2 Waveform (Emerald: Current in mA) */}
                {ch2Enabled && (
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth={2}
                    points={metrics.channelWaveform
                      .map((pt, i) => `${(i / 39) * 400},${175 - (pt.ch2 / 20.0) * 110}`)
                      .join(' ')}
                  />
                )}

                {/* CH3 Waveform (Amber: Optical Signal Intensity) */}
                {ch3Enabled && (
                  <polyline
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    points={metrics.channelWaveform
                      .map((pt, i) => `${(i / 39) * 400},${180 - (pt.ch3 / 4.0) * 115}`)
                      .join(' ')}
                  />
                )}

                {/* CH4 Waveform (Indigo: RX ADC analog waveform) */}
                {ch4Enabled && (
                  <polyline
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth={2}
                    strokeDasharray="2 1"
                    points={metrics.channelWaveform
                      .map((pt, i) => `${(i / 39) * 400},${185 - (pt.ch4 / 3.3) * 120}`)
                      .join(' ')}
                  />
                )}
              </svg>
            </div>

            {/* Live Readouts Bar */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 z-30 bg-[#080d16]/90 px-3 py-1 rounded border border-slate-800">
              <span className="text-cyan-400">CH1 Vpp: {simulationRunning ? '3.31 V' : '0.00 V'}</span>
              <span className="text-emerald-400">CH2 Ipk: {simulationRunning ? `${metrics.ledCurrentMa.toFixed(1)} mA` : '0.0 mA'}</span>
              <span className="text-amber-400">CH3 P_opt: {simulationRunning ? `${metrics.opticalPowerMw} mW` : '0.0 mW'}</span>
              <span className="text-indigo-400">CH4 ADC: {simulationRunning ? `${metrics.adcSampleVoltage.toFixed(3)} V` : '0.0 V'}</span>
              <span className="text-white font-bold">RATE: {metrics.dataRateKbps} kbps</span>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. VIRTUAL PRECISION DIGITAL MULTIMETER (DMM)            */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* DMM Digital Display & Modes */}
          <div className="lg:col-span-7 bg-[#111827] border border-[#1f293d] rounded p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Gauge className="w-4 h-4 text-cyan-400" />
                <span>Virtual Digital Multimeter (Bench DMM)</span>
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                AUTO-RANGING
              </span>
            </div>

            {/* Glowing 7-Segment High-Contrast Display */}
            <div className="p-4 bg-[#050912] border-2 border-[#1f293d] rounded text-center shadow-[inset_0_0_20px_rgba(0,0,0,0.9)]">
              <div className="text-[10px] text-cyan-400/70 font-mono tracking-widest uppercase mb-1">
                MEASURING: {dmmMode.toUpperCase()} | PROBE A → PROBE B
              </div>
              <div className="text-3xl sm:text-4xl font-mono font-bold text-cyan-300 tracking-wider py-1 drop-shadow-[0_0_12px_rgba(6,182,212,0.6)]">
                {getDmmReading()}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-1">
                Accuracy: ±0.05% + 2 digits | Sampling: 5 Sa/s True RMS
              </div>
            </div>

            {/* DMM Modes Selection */}
            <div className="grid grid-cols-4 gap-2">
              {(['voltage', 'current', 'resistance', 'continuity'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setDmmMode(mode)}
                  className={`py-2 rounded text-xs font-bold capitalize transition-all border ${
                    dmmMode === mode
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                      : 'bg-[#0a0e17] text-slate-400 border-[#1f293d] hover:text-white'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* DMM Probe Nodes Selection */}
          <div className="lg:col-span-5 bg-[#111827] border border-[#1f293d] rounded p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Dual-Probe Node Attachment
            </h3>

            {/* Probe A (Red Lead) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-rose-400 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Probe A (Positive Red Terminal):</span>
              </label>
              <select
                value={probeA}
                onChange={(e) => setProbeA(e.target.value)}
                className="w-full bg-[#0a0e17] border border-[#1f293d] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                {availableNodes.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            {/* Probe B (Black Ground Lead) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500 inline-block" />
                <span>Probe B (Common Black Terminal):</span>
              </label>
              <select
                value={probeB}
                onChange={(e) => setProbeB(e.target.value)}
                className="w-full bg-[#0a0e17] border border-[#1f293d] rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-slate-500"
              >
                {availableNodes.map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>

            <div className="p-2.5 bg-[#0a0e17] border border-[#1f293d] rounded text-[11px] text-slate-400 leading-relaxed">
              <strong>Tip:</strong> Select any two electrical circuit nodes above to instantly probe the differential potential or impedance between them.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

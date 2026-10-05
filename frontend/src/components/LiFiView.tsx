import React, { useState } from 'react';
import {
  Radio,
  Sliders,
  Sun,
  Activity,
  Layers,
  Zap,
  Cpu,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Signal,
  CheckCircle2
} from 'lucide-react';
import { SimulationMetrics, LiFiChannelConfig } from '../types/circuit';

interface LiFiViewProps {
  metrics: SimulationMetrics;
  config: LiFiChannelConfig;
  onUpdateConfig: (newConfig: Partial<LiFiChannelConfig>) => void;
  simulationRunning: boolean;
  onToggleSimulation: () => void;
}

export const LiFiView: React.FC<LiFiViewProps> = ({
  metrics,
  config,
  onUpdateConfig,
  simulationRunning,
  onToggleSimulation
}) => {
  const [pulsePhase, setPulsePhase] = useState(0);

  // Modulation options
  const modulations: LiFiChannelConfig['modulation'][] = ['OOK', 'Manchester', 'PWM', 'PPM'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d16] font-mono text-slate-200 select-none overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-[#0c1220] border-b border-[#1f293d] flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base font-bold text-white tracking-wide">LiFi Optical Channel Laboratory</h1>
            <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${
              simulationRunning
                ? 'bg-amber-950 text-amber-300 border-amber-800 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {simulationRunning ? 'OPTICAL BEAM ACTIVE' : 'CARRIER STANDBY'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Electro-optical modulation, free-space photon propagation, atmospheric ambient attenuation & Demodulation
          </p>
        </div>

        <button
          onClick={onToggleSimulation}
          className={`px-4 py-1.5 rounded text-xs font-bold transition-all border ${
            simulationRunning
              ? 'bg-rose-950 text-rose-300 border-rose-700 hover:bg-rose-900'
              : 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
          }`}
        >
          {simulationRunning ? '■ Halt Optical Link' : '▶ Start Optical Link'}
        </button>
      </div>

      {/* Main Container */}
      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* ======================================================== */}
        {/* VISUALLY IMPRESSIVE OPTICAL PIPELINE VISUALIZATION       */}
        {/* ======================================================== */}
        <div className="bg-[#0b0f19] border border-[#1f293d] rounded-lg p-5 relative overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Full End-to-End LiFi Hardware & Optical Channel Pipeline</span>
            </h2>
            <div className="text-xs text-cyan-300 font-bold">
              LOS Distance: {config.distanceM.toFixed(2)} m | Wavelength: {config.wavelengthNm} nm
            </div>
          </div>

          {/* Pipeline Graphic Diagram */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
            {/* TRANSMITTER STAGES (Cols 1-4) */}
            <div className="lg:col-span-4 bg-[#111827] border border-cyan-900/60 rounded p-3 space-y-2">
              <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#1f293d] pb-1">
                <span>1. Transmitter Stage</span>
                <span>STM32 TX (PA0)</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 bg-[#0a0e17] rounded border border-cyan-950">
                  <div className="text-slate-400 text-[9px]">MCU Core</div>
                  <div className="font-bold text-white">72 MHz</div>
                </div>
                <div className="p-1.5 bg-[#0a0e17] rounded border border-cyan-950">
                  <div className="text-slate-400 text-[9px]">Modulation</div>
                  <div className="font-bold text-cyan-300">{config.modulation}</div>
                </div>
                <div className="p-1.5 bg-[#0a0e17] rounded border border-cyan-950">
                  <div className="text-slate-400 text-[9px]">Driver</div>
                  <div className="font-bold text-emerald-400">MOSFET</div>
                </div>
              </div>
              {/* Emitter Visual */}
              <div className="flex items-center justify-between p-2 bg-[#09101d] rounded border border-cyan-800/40">
                <div className="flex items-center space-x-2">
                  <div className={`w-4 h-4 rounded-full ${simulationRunning ? 'bg-amber-400 animate-ping' : 'bg-slate-700'}`} />
                  <span className="text-xs font-bold text-white">850nm LED Emitter</span>
                </div>
                <span className="text-xs font-bold text-amber-400">{metrics.running ? metrics.opticalPowerMw : config.txPowerMw} mW</span>
              </div>
            </div>

            {/* FREE-SPACE OPTICAL BEAM CHANNEL (Cols 5-8) */}
            <div className="lg:col-span-4 bg-[#0a0e17] border border-amber-900/60 rounded p-4 relative overflow-hidden flex flex-col justify-center items-center text-center space-y-2 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]">
              {/* Background ambient noise glow */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(245,158,11,0.15) 0%, transparent 70%)',
                  opacity: simulationRunning ? 1 : 0.2
                }}
              />

              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center space-x-1">
                <Sun className="w-3.5 h-3.5" />
                <span>Optical Channel (Free Space)</span>
              </div>

              {/* Animated Optical Waves/Photons */}
              <div className="text-amber-400 text-lg font-mono font-bold tracking-widest py-1 select-none">
                {simulationRunning ? (
                  <span className="inline-block animate-pulse text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,0.8)]">
                    ))))))))))))))))))))))))&gt;
                  </span>
                ) : (
                  <span className="text-slate-600">------------------------&gt;</span>
                )}
              </div>

              <div className="flex items-center justify-between w-full text-[10px] text-slate-400 px-2 pt-1 border-t border-slate-800">
                <span>Ambient: <strong className="text-amber-300">{config.ambientLux} Lux</strong></span>
                <span>Noise: <strong className="text-rose-400">{config.opticalNoisePercent}%</strong></span>
                <span>Loss: <strong className="text-white">{(config.distanceM * config.distanceM * 1.8).toFixed(1)} dB</strong></span>
              </div>
            </div>

            {/* RECEIVER STAGES (Cols 9-12) */}
            <div className="lg:col-span-4 bg-[#111827] border border-indigo-900/60 rounded p-3 space-y-2">
              <div className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center justify-between border-b border-[#1f293d] pb-1">
                <span>2. Receiver Stage</span>
                <span>STM32 RX (PA1)</span>
              </div>
              {/* Photodiode Window */}
              <div className="flex items-center justify-between p-2 bg-[#0d1326] rounded border border-indigo-800/40">
                <div className="flex items-center space-x-2">
                  <div className="w-3.5 h-3.5 bg-indigo-500 rounded-sm" />
                  <span className="text-xs font-bold text-white">BPW34 PIN Diode</span>
                </div>
                <span className="text-xs font-bold text-indigo-300">{metrics.running ? metrics.photodiodeCurrentUa : '15.2'} µA</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                <div className="p-1.5 bg-[#0a0e17] rounded border border-indigo-950">
                  <div className="text-slate-400 text-[9px]">TIA Gain</div>
                  <div className="font-bold text-white">82 kΩ</div>
                </div>
                <div className="p-1.5 bg-[#0a0e17] rounded border border-indigo-950">
                  <div className="text-slate-400 text-[9px]">ADC1</div>
                  <div className="font-bold text-emerald-400">{metrics.running ? metrics.adcSampleVoltage.toFixed(2) : '2.14'} V</div>
                </div>
                <div className="p-1.5 bg-[#0a0e17] rounded border border-indigo-950">
                  <div className="text-slate-400 text-[9px]">Demod</div>
                  <div className="font-bold text-cyan-300">Burst Rx</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LIVE BINARY DATA STREAMING & BIT ERROR ANALYSIS          */}
        {/* ======================================================== */}
        <div className="bg-[#0b0f19] border border-[#1f293d] rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Real-Time Binary Data Stream & Mismatch Verification</span>
            </h3>
            <div className="flex items-center space-x-3 text-xs">
              <span>BER: <strong className="text-indigo-400">{(metrics.running ? metrics.ber * 100 : 0.02).toFixed(3)}%</strong></span>
              <span>Errors: <strong className={metrics.errorIndices.length > 0 ? 'text-rose-400' : 'text-emerald-400'}>{metrics.errorIndices.length} Bits</strong></span>
            </div>
          </div>

          <div className="p-4 bg-[#080d16] border border-[#1f293d] rounded font-mono text-sm space-y-3">
            {/* Transmitted Bits */}
            <div className="flex items-center space-x-4">
              <span className="w-28 text-xs text-slate-400 font-bold uppercase">Transmitted:</span>
              <div className="flex space-x-1 tracking-widest text-cyan-400 font-bold text-base">
                {metrics.txBits.split('').map((bit, idx) => (
                  <span key={`tx_${idx}`} className="w-5 text-center bg-[#111827] rounded py-0.5">
                    {bit}
                  </span>
                ))}
              </div>
            </div>

            {/* Received Bits with Error Highlighting */}
            <div className="flex items-center space-x-4">
              <span className="w-28 text-xs text-slate-400 font-bold uppercase">Received:</span>
              <div className="flex space-x-1 tracking-widest font-bold text-base">
                {metrics.rxBits.split('').map((bit, idx) => {
                  const isError = metrics.errorIndices.includes(idx);
                  return (
                    <span
                      key={`rx_${idx}`}
                      className={`w-5 text-center rounded py-0.5 transition-colors ${
                        isError
                          ? 'bg-rose-900/80 text-rose-200 border border-rose-500 animate-pulse'
                          : 'bg-[#111827] text-emerald-400'
                      }`}
                    >
                      {bit}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Caret Error Indicators */}
            <div className="flex items-center space-x-4">
              <span className="w-28 text-xs text-slate-400 font-bold uppercase">Bit Errors:</span>
              <div className="flex space-x-1 tracking-widest text-rose-400 font-bold text-xs">
                {metrics.txBits.split('').map((_, idx) => {
                  const isError = metrics.errorIndices.includes(idx);
                  return (
                    <span key={`err_${idx}`} className="w-5 text-center">
                      {isError ? '^' : ' '}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* LIFI PHYSICAL PARAMETERS CONFIGURATION & METRICS         */}
        {/* ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls & Sliders */}
          <div className="bg-[#111827] border border-[#1f293d] rounded p-5 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Channel Parameter Controls</span>
            </h3>

            {/* Distance Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Link Distance (d):</span>
                <span className="text-cyan-400 font-bold">{config.distanceM.toFixed(2)} meters</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="4.0"
                step="0.05"
                value={config.distanceM}
                onChange={(e) => onUpdateConfig({ distanceM: parseFloat(e.target.value) })}
                className="w-full accent-cyan-500 bg-slate-800"
              />
            </div>

            {/* Ambient Light Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Ambient Background Illumination:</span>
                <span className="text-amber-400 font-bold">{config.ambientLux} Lux</span>
              </div>
              <input
                type="range"
                min="0"
                max="1500"
                step="25"
                value={config.ambientLux}
                onChange={(e) => onUpdateConfig({ ambientLux: parseInt(e.target.value) })}
                className="w-full accent-amber-500 bg-slate-800"
              />
            </div>

            {/* Optical Noise Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">Optical Atmospheric Noise:</span>
                <span className="text-rose-400 font-bold">{config.opticalNoisePercent.toFixed(1)} %</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="25.0"
                step="0.5"
                value={config.opticalNoisePercent}
                onChange={(e) => onUpdateConfig({ opticalNoisePercent: parseFloat(e.target.value) })}
                className="w-full accent-rose-500 bg-slate-800"
              />
            </div>

            {/* Modulation Type Selection */}
            <div>
              <div className="text-xs text-slate-300 mb-1.5">Modulation Scheme:</div>
              <div className="grid grid-cols-4 gap-2">
                {modulations.map((mod) => (
                  <button
                    key={mod}
                    onClick={() => onUpdateConfig({ modulation: mod })}
                    className={`py-1.5 rounded text-xs font-bold border transition-colors ${
                      config.modulation === mod
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                        : 'bg-[#0a0e17] text-slate-400 border-[#1f293d] hover:text-white'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Real-Time Calculated Physics Metrics */}
          <div className="bg-[#111827] border border-[#1f293d] rounded p-5 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Signal className="w-4 h-4 text-emerald-400" />
              <span>Calculated Optical Link Metrics (Analytical Model)</span>
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-[#0a0e17] border border-[#1f293d] rounded">
                <div className="text-slate-400 text-[10px]">RECEIVED OPTICAL POWER</div>
                <div className="text-base font-bold text-amber-400">
                  {metrics.running ? `${(metrics.opticalPowerMw * 0.04).toFixed(3)} mW` : '0.096 mW'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">At 7.5 mm² receiver aperture</div>
              </div>

              <div className="p-3 bg-[#0a0e17] border border-[#1f293d] rounded">
                <div className="text-slate-400 text-[10px]">SIGNAL-TO-NOISE RATIO</div>
                <div className="text-base font-bold text-emerald-400">
                  {metrics.running ? `${metrics.snrDb} dB` : '24.80 dB'}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">10 log₁₀(I_sig² / σ_noise²)</div>
              </div>

              <div className="p-3 bg-[#0a0e17] border border-[#1f293d] rounded">
                <div className="text-slate-400 text-[10px]">BIT ERROR RATE (BER)</div>
                <div className="text-base font-bold text-indigo-400">
                  {(metrics.running ? metrics.ber * 100 : 0.02).toFixed(3)}%
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Q-function complementary error</div>
              </div>

              <div className="p-3 bg-[#0a0e17] border border-[#1f293d] rounded">
                <div className="text-slate-400 text-[10px]">CHANNEL DATA RATE</div>
                <div className="text-base font-bold text-cyan-300">
                  {config.dataRateKbps} kbps
                </div>
                <div className="text-[10px] text-slate-400 mt-1">STM32 Timer2 Hardware PWM</div>
              </div>
            </div>

            <div className="p-2.5 bg-cyan-950/30 border border-cyan-900/60 rounded text-[11px] text-cyan-300 leading-relaxed">
              <strong>Notice:</strong> Advanced optical noise values are computed using analytical approximations tagged as <em>Estimated</em> until the full physical SPICE engine is engaged.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

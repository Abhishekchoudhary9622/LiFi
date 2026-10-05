import React, { useState } from 'react';
import {
  Sliders,
  Cpu,
  Save,
  Download,
  Upload,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Zap,
  HardDrive,
  FileJson
} from 'lucide-react';
import { HardwareMapping, CircuitComponent, Wire } from '../types/circuit';

interface SettingsViewProps {
  simulationSpeed: number;
  onSetSimulationSpeed: (speed: number) => void;
  onSaveProject: () => void;
  onExportProject: () => void;
  onImportProject: () => void;
  onResetToDemo: () => void;
  components: CircuitComponent[];
  wires: Wire[];
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  simulationSpeed,
  onSetSimulationSpeed,
  onSaveProject,
  onExportProject,
  onImportProject,
  onResetToDemo,
  components,
  wires
}) => {
  const speeds = [0.25, 0.5, 1.0, 2.0, 5.0];

  // Default Hardware Mapping Table
  const [hardwareMappings, setHardwareMappings] = useState<HardwareMapping[]>([
    {
      virtualComponentId: 'MCU_1',
      virtualPinId: 'vcc_3v3',
      physicalComponent: 'STM32F103C8 Blue Pill',
      physicalPin: 'Pin 3.3V (Header 1 Pin 18)',
      connectionDescription: '+3.3V Regulated Power Rail',
      status: 'verified'
    },
    {
      virtualComponentId: 'MCU_1',
      virtualPinId: 'gnd_1',
      physicalComponent: 'STM32F103C8 Blue Pill',
      physicalPin: 'Pin GND (Header 1 Pin 19)',
      connectionDescription: 'System Digital Ground',
      status: 'verified'
    },
    {
      virtualComponentId: 'MCU_1',
      virtualPinId: 'pa0',
      physicalComponent: 'STM32F103C8 Blue Pill',
      physicalPin: 'Pin PA0 (Header 1 Pin 6)',
      connectionDescription: 'Timer 2 CH1 PWM Modulator -> 220Ω -> LED Anode',
      status: 'verified'
    },
    {
      virtualComponentId: 'MCU_1',
      virtualPinId: 'pa1',
      physicalComponent: 'STM32F103C8 Blue Pill',
      physicalPin: 'Pin PA1 (Header 1 Pin 7)',
      connectionDescription: 'ADC1 Channel 1 <- TIA Pre-amplifier Output',
      status: 'verified'
    },
    {
      virtualComponentId: 'TX_1',
      virtualPinId: 'opt_out',
      physicalComponent: 'Everlight IR333-A 850nm LED',
      physicalPin: 'Anode Lead (+)',
      connectionDescription: 'High-speed optical transmitter diode',
      status: 'verified'
    },
    {
      virtualComponentId: 'PD_1',
      virtualPinId: 'anode',
      physicalComponent: 'Vishay BPW34 PIN Photodiode',
      physicalPin: 'Anode Pin (Long Lead)',
      connectionDescription: 'Reverse-biased photocurrent detector window',
      status: 'verified'
    }
  ]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d16] font-mono text-slate-200 select-none overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-[#0c1220] border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              System Settings & Hardware Pin Mapping
            </h1>
            <p className="text-xs text-slate-400">
              Correlate virtual simulation nodes with real-world physical STM32 benchtop hardware pins
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* ======================================================== */}
        {/* 1. SIMULATION SPEED CONTROLS                             */}
        {/* ======================================================== */}
        <div className="bg-[#111827] border border-[#1f293d] rounded p-5 space-y-3">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Simulation Execution Speed</span>
          </h2>
          <p className="text-xs text-slate-400">
            Adjust the simulation clock multiplier for slow-motion pulse inspection or high-throughput link stress testing.
          </p>

          <div className="flex items-center space-x-3 pt-2">
            {speeds.map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSimulationSpeed(spd)}
                className={`px-4 py-2 rounded text-xs font-bold font-mono transition-all border ${
                  simulationSpeed === spd
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-[#0a0e17] text-slate-400 border-[#1f293d] hover:text-white'
                }`}
              >
                {spd}x Speed
              </button>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* 2. PHYSICAL TO VIRTUAL HARDWARE MAPPING                  */}
        {/* ======================================================== */}
        <div className="bg-[#111827] border border-[#1f293d] rounded p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Physical Hardware Mapping Matrix</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Exact pin-for-pin cross reference bridging virtual canvas components to physical lab bench wiring.
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
              6 PINS MAPPED
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-[#1f293d]">
              <thead className="bg-[#0a0e17] text-slate-400">
                <tr>
                  <th className="p-2.5 border-b border-[#1f293d]">Virtual Node</th>
                  <th className="p-2.5 border-b border-[#1f293d]">Physical Hardware Module</th>
                  <th className="p-2.5 border-b border-[#1f293d]">Physical Header Pin</th>
                  <th className="p-2.5 border-b border-[#1f293d]">Bench Connection Target</th>
                  <th className="p-2.5 border-b border-[#1f293d]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f293d]">
                {hardwareMappings.map((map, idx) => (
                  <tr key={idx} className="hover:bg-[#162136] transition-colors">
                    <td className="p-2.5 font-bold text-cyan-300">
                      {map.virtualComponentId}:{map.virtualPinId}
                    </td>
                    <td className="p-2.5 text-white">{map.physicalComponent}</td>
                    <td className="p-2.5 text-amber-300">{map.physicalPin}</td>
                    <td className="p-2.5 text-slate-300">{map.connectionDescription}</td>
                    <td className="p-2.5">
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. PROJECT STORAGE & DATA MANAGEMENT                     */}
        {/* ======================================================== */}
        <div className="bg-[#111827] border border-[#1f293d] rounded p-5 space-y-4">
          <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Project File & Workspace Persistence</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <button
              onClick={onSaveProject}
              className="p-3 bg-[#0a0e17] hover:bg-[#1e293b] border border-[#1f293d] rounded text-left transition-colors flex items-center space-x-3"
            >
              <Save className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Save Project</div>
                <div className="text-[10px] text-slate-400">Store in LocalStorage</div>
              </div>
            </button>

            <button
              onClick={onExportProject}
              className="p-3 bg-[#0a0e17] hover:bg-[#1e293b] border border-[#1f293d] rounded text-left transition-colors flex items-center space-x-3"
            >
              <Download className="w-5 h-5 text-blue-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Export Project JSON</div>
                <div className="text-[10px] text-slate-400">Download .semproject</div>
              </div>
            </button>

            <button
              onClick={onImportProject}
              className="p-3 bg-[#0a0e17] hover:bg-[#1e293b] border border-[#1f293d] rounded text-left transition-colors flex items-center space-x-3"
            >
              <Upload className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <div className="font-bold text-white">Import Project</div>
                <div className="text-[10px] text-slate-400">Load JSON netlist</div>
              </div>
            </button>

            <button
              onClick={onResetToDemo}
              className="p-3 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/60 rounded text-left transition-colors flex items-center space-x-3"
            >
              <RotateCcw className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <div className="font-bold text-rose-300">Reset Demo Circuit</div>
                <div className="text-[10px] text-slate-400">Reload SemLiFi Basic Link</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

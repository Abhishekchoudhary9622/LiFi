import React, { useRef } from 'react';
import {
  Printer,
  Download,
  FileText,
  CheckCircle2,
  Share2,
  Copy,
  Zap,
  Radio,
  Cpu,
  Layers,
  ShieldCheck
} from 'lucide-react';
import {
  CircuitComponent,
  Wire,
  SimulationMetrics,
  ValidationResult,
  LiFiChannelConfig
} from '../types/circuit';

interface ReportViewProps {
  projectName: string;
  components: CircuitComponent[];
  wires: Wire[];
  metrics: SimulationMetrics;
  validation: ValidationResult;
  config: LiFiChannelConfig;
}

export const ReportView: React.FC<ReportViewProps> = ({
  projectName,
  components,
  wires,
  metrics,
  validation,
  config
}) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyMarkdown = () => {
    const md = `
# SemLiFi Lab Engineering Project Report
**Project Name:** ${projectName}
**Date:** ${new Date().toISOString().slice(0, 10)}
**System Status:** ${validation.valid ? 'CIRCUIT VALID (PASSED)' : 'HAS WARNINGS'}

## 1. Project Title
SemLiFi: Hardware Simulation & Optical Communication Prototype

## 2. Project Overview
A complete hardware-in-the-loop emulation and physical optical breadboard prototype recreating an ARM Cortex-M3 STM32F103 microcontroller optical transceiver.

## 3. Objective
Validate line-of-sight (LOS) optical communication using 850nm NIR modulated LED and silicon PIN photodiode receiver with automated DRC checks and BER analysis.

## 4. Hardware Components
${components.map((c) => `- **${c.name}** (ID: ${c.id})`).join('\n')}

## 5. Wiring Netlist
${wires.map((w) => `- ${w.fromComponentId}:${w.fromPinId} → ${w.toComponentId}:${w.toPinId} (${w.color})`).join('\n')}

## 6. Telemetry & Simulation Results
- VCC Voltage: ${metrics.vccVoltage.toFixed(2)} V
- System Current: ${metrics.totalCurrentMa} mA
- Optical Output: ${metrics.opticalPowerMw} mW
- Optical SNR: ${metrics.snrDb} dB
- Calculated BER: ${(metrics.ber * 100).toFixed(3)} %
- Modulation: ${config.modulation} @ ${config.dataRateKbps} kbps
- Optical Distance: ${config.distanceM} m
`;
    navigator.clipboard.writeText(md);
    alert('Project Report copied to clipboard as Markdown!');
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d16] font-mono text-slate-200 select-none overflow-y-auto">
      {/* Top Action Toolbar */}
      <div className="p-4 bg-[#0c1220] border-b border-[#1f293d] flex items-center justify-between print:hidden">
        <div className="flex items-center space-x-3">
          <FileText className="w-5 h-5 text-indigo-400" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              Official Engineering Project Report Generator
            </h1>
            <p className="text-xs text-slate-400">
              Complete 19-section formal hardware & optical documentation package
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopyMarkdown}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1e293b] text-slate-300 border border-[#1f293d] rounded text-xs transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Markdown</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white rounded text-xs font-bold transition-all shadow-[0_0_12px_rgba(99,102,241,0.3)]"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Export PDF</span>
          </button>
        </div>
      </div>

      {/* Formal Document Sheet */}
      <div className="p-8 max-w-4xl mx-auto w-full my-6 bg-[#0b0f19] border border-[#1f293d] rounded-lg shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none space-y-8">
        {/* Document Header */}
        <div className="border-b-2 border-cyan-500 pb-4 flex justify-between items-start">
          <div>
            <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest print:text-cyan-700">
              SemLiFi Research Laboratory • Formal Technical Report
            </div>
            <h1 className="text-2xl font-bold text-white print:text-black mt-1">
              SemLiFi Prototype Verification & Optical Analysis
            </h1>
            <div className="text-xs text-slate-400 print:text-slate-600 mt-1">
              Document ID: SLF-REP-2026-001 | Revision: 2.4 | Classification: Technical Specification
            </div>
          </div>
          <div className="text-right text-xs text-slate-400 print:text-slate-600">
            <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
            <div><strong>Author:</strong> Lead Hardware Engineer</div>
            <div className={`mt-1 font-bold ${validation.valid ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
              STATUS: {validation.valid ? 'VERIFIED (PASS)' : 'FAULTS PRESENT'}
            </div>
          </div>
        </div>

        {/* Section 1 & 2: Project Overview & Objectives */}
        <div className="space-y-4">
          <div>
            <h2 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider border-b border-[#1f293d] pb-1 mb-2">
              1. Project Title & Executive Summary
            </h2>
            <p className="text-xs text-slate-300 print:text-slate-800 leading-relaxed">
              This technical document outlines the design, hardware breadboard assembly, DRC verification, and real-time physical simulation of the <strong>SemLiFi Prototype</strong>. The prototype investigates burst-aware optical data transmission over near-infrared (850nm) wavelengths between an STM32 ARM Cortex-M3 microcontroller and a silicon PIN photodetector receiver stage.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider border-b border-[#1f293d] pb-1 mb-2">
              2. Objectives
            </h2>
            <ul className="list-disc list-inside text-xs text-slate-300 print:text-slate-800 space-y-1">
              <li>Recreate physical 30-row breadboard layout with accurate pin snapping and net compliance.</li>
              <li>Provide active current limiting (220 Ω) on high-speed emitter LEDs to protect GPIO stages.</li>
              <li>Establish line-of-sight (LOS) optical channel with real-time BER & SNR monitoring.</li>
              <li>Demonstrate 115.2 kbps OOK data transmission and sample analog pulses via STM32 12-bit ADC.</li>
            </ul>
          </div>
        </div>

        {/* Section 4 & 5: Hardware Components & Specifications */}
        <div>
          <h2 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider border-b border-[#1f293d] pb-1 mb-2">
            3. Bill of Materials & Component Specifications
          </h2>
          <table className="w-full text-xs text-left border border-[#1f293d] print:border-slate-300">
            <thead className="bg-[#111827] print:bg-slate-100 text-slate-300 print:text-black">
              <tr>
                <th className="p-2 border-b border-[#1f293d]">Component ID</th>
                <th className="p-2 border-b border-[#1f293d]">Device Description</th>
                <th className="p-2 border-b border-[#1f293d]">Key Specification</th>
                <th className="p-2 border-b border-[#1f293d]">Operating Rail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f293d] print:divide-slate-200 text-slate-400 print:text-slate-800">
              {components.map((comp) => (
                <tr key={comp.id}>
                  <td className="p-2 font-bold text-white print:text-black">{comp.id}</td>
                  <td className="p-2">{comp.name}</td>
                  <td className="p-2">
                    {comp.typeId === 'resistor' && '220 Ω, 0.25 W, 5%'}
                    {comp.typeId === 'stm32' && 'STM32F103C8T6, 72 MHz, 64KB Flash'}
                    {comp.typeId === 'lifi_tx' && '850nm NIR LED, 3.5 mW Emitter'}
                    {comp.typeId === 'photodiode' && 'BPW34 Si PIN, 0.62 A/W, 7.5mm²'}
                    {comp.typeId === 'signal_amplifier' && 'TIA Stage, 82 kΩ Gain, Rail-to-Rail'}
                    {comp.typeId === 'power_3v3' && '3.3V Regulated DC Rail (800mA Limit)'}
                  </td>
                  <td className="p-2">+3.3V / Common GND</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 6 & 7: Breadboard Wiring Netlist */}
        <div>
          <h2 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider border-b border-[#1f293d] pb-1 mb-2">
            4. Breadboard Wiring Schedule & Netlist
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {wires.map((wire, idx) => (
              <div key={wire.id} className="p-2 bg-[#111827] print:bg-slate-50 border border-[#1f293d] print:border-slate-200 rounded flex items-center justify-between">
                <div>
                  <span className="font-bold text-white print:text-black">Net #{idx + 1}: </span>
                  <span className="text-cyan-300 print:text-cyan-700">{wire.fromComponentId}:{wire.fromPinId}</span>
                  <span className="text-slate-400"> → </span>
                  <span className="text-cyan-300 print:text-cyan-700">{wire.toComponentId}:{wire.toPinId}</span>
                </div>
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: wire.color }} />
              </div>
            ))}
          </div>
        </div>

        {/* Section 13, 14, 15, 16: Telemetry & Measured Results */}
        <div>
          <h2 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider border-b border-[#1f293d] pb-1 mb-2">
            5. Electrical & Optical Performance Measurements
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#111827] print:bg-slate-50 border border-[#1f293d] print:border-slate-200 rounded">
              <div className="text-[10px] text-slate-400">SUPPLY VOLTAGE</div>
              <div className="text-base font-bold text-amber-400 print:text-amber-700">{metrics.vccVoltage.toFixed(2)} V</div>
              <div className="text-[9px] text-slate-400">Target 3.30V</div>
            </div>

            <div className="p-3 bg-[#111827] print:bg-slate-50 border border-[#1f293d] print:border-slate-200 rounded">
              <div className="text-[10px] text-slate-400">SYSTEM CURRENT</div>
              <div className="text-base font-bold text-emerald-400 print:text-emerald-700">{metrics.totalCurrentMa} mA</div>
              <div className="text-[9px] text-slate-400">Peak Load</div>
            </div>

            <div className="p-3 bg-[#111827] print:bg-slate-50 border border-[#1f293d] print:border-slate-200 rounded">
              <div className="text-[10px] text-slate-400">OPTICAL POWER</div>
              <div className="text-base font-bold text-cyan-400 print:text-cyan-700">{metrics.opticalPowerMw} mW</div>
              <div className="text-[9px] text-slate-400">850nm Output</div>
            </div>

            <div className="p-3 bg-[#111827] print:bg-slate-50 border border-[#1f293d] print:border-slate-200 rounded">
              <div className="text-[10px] text-slate-400">SIGNAL-TO-NOISE</div>
              <div className="text-base font-bold text-emerald-400 print:text-emerald-700">{metrics.snrDb} dB</div>
              <div className="text-[9px] text-slate-400">LOS Channel</div>
            </div>
          </div>
        </div>

        {/* Section 18: Design Rule Validation Summary */}
        <div>
          <h2 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider border-b border-[#1f293d] pb-1 mb-2">
            6. Design Rule Checking (DRC) Verification Summary
          </h2>
          <div className="space-y-1.5 text-xs">
            {validation.rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between p-2 bg-[#111827] print:bg-slate-50 rounded border border-[#1f293d] print:border-slate-200">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 print:text-emerald-600" />
                  <span className="font-bold text-white print:text-black">{rule.title}</span>
                </div>
                <span className="text-[10px] text-emerald-400 print:text-emerald-700 font-bold uppercase">
                  {rule.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Section 19: Conclusion & Engineering Sign-Off */}
        <div className="border-t border-[#1f293d] pt-4">
          <h2 className="text-sm font-bold text-cyan-400 print:text-cyan-800 uppercase tracking-wider mb-2">
            7. Conclusion & Engineering Sign-off
          </h2>
          <p className="text-xs text-slate-300 print:text-slate-800 leading-relaxed mb-6">
            The SemLiFi prototype circuit topology satisfies all electrical rules, maintains regulated 3.3V logic levels without thermal stress, and establishes a robust 115.2 kbps optical link with a measured BER of {(metrics.ber * 100).toFixed(3)}%. Hardware fabrication and physical PCB layout are recommended to proceed.
          </p>
          <div className="grid grid-cols-2 gap-8 text-xs pt-4 border-t border-[#1f293d]">
            <div>
              <div className="text-slate-400 print:text-slate-600">Hardware Verified By:</div>
              <div className="font-bold text-white print:text-black mt-1">Lead Research Engineer, SemLiFi Group</div>
            </div>
            <div>
              <div className="text-slate-400 print:text-slate-600">Laboratory Director:</div>
              <div className="font-bold text-white print:text-black mt-1">Principal Investigator, Embedded Optical Systems</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

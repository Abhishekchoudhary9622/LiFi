import React, { useState } from 'react';
import {
  Compass,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  X,
  Zap,
  Cpu,
  Radio,
  Play
} from 'lucide-react';

interface GuidedBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRunSimulation: () => void;
}

interface Step {
  stepNumber: number;
  title: string;
  description: string;
  actionHint: string;
  pinHighlights: string[];
}

export const GuidedBuildModal: React.FC<GuidedBuildModalProps> = ({
  isOpen,
  onClose,
  onRunSimulation
}) => {
  const [currentStep, setCurrentStep] = useState(1);

  if (!isOpen) return null;

  const steps: Step[] = [
    {
      stepNumber: 1,
      title: 'Power Rail Connection',
      description: 'Connect the STM32 VCC pin to the 3.3V breadboard rail to establish core logic supply.',
      actionHint: 'Wire PWR_1:vcc → MCU_1:vcc_3v3',
      pinHighlights: ['PWR_1:vcc', 'MCU_1:vcc_3v3']
    },
    {
      stepNumber: 2,
      title: 'Common Ground Return',
      description: 'Connect STM32 GND to the breadboard ground rail to establish a 0V electrical reference.',
      actionHint: 'Wire PWR_1:gnd → MCU_1:gnd_1',
      pinHighlights: ['PWR_1:gnd', 'MCU_1:gnd_1']
    },
    {
      stepNumber: 3,
      title: 'Current-Limiting Resistor Placement',
      description: 'Place the 220 Ω current-limiting resistor between STM32 GPIO PA0 and the optical transmitter.',
      actionHint: 'Wire MCU_1:pa0 → R_1:pin1',
      pinHighlights: ['MCU_1:pa0', 'R_1:pin1']
    },
    {
      stepNumber: 4,
      title: 'LiFi LED Transmitter Connection',
      description: 'Connect the resistor output terminal to the LiFi transmitter modulation drive pin (MOD_IN).',
      actionHint: 'Wire R_1:pin2 → TX_1:mod_in',
      pinHighlights: ['R_1:pin2', 'TX_1:mod_in']
    },
    {
      stepNumber: 5,
      title: 'Photodiode Receiver Reverse Bias',
      description: 'Connect the BPW34 photodiode cathode to the +3.3V rail to reverse-bias the PN junction for high speed.',
      actionHint: 'Wire PWR_1:vcc → PD_1:cathode',
      pinHighlights: ['PWR_1:vcc', 'PD_1:cathode']
    },
    {
      stepNumber: 6,
      title: 'Optical Signal Conditioning to ADC',
      description: 'Connect the transimpedance amplifier (TIA) analog output to STM32 PA1 (ADC1 channel 1).',
      actionHint: 'Wire AMP_1:out → MCU_1:pa1',
      pinHighlights: ['AMP_1:out', 'MCU_1:pa1']
    },
    {
      stepNumber: 7,
      title: 'Design Rule Check (DRC) Verification',
      description: 'Inspect the netlist for any floating critical pins or potential short-circuits between VCC and GND.',
      actionHint: 'All 11 automated DRC checks verified: CIRCUIT VALID.',
      pinHighlights: []
    },
    {
      stepNumber: 8,
      title: 'Launch LiFi Simulation & Optical Stream',
      description: 'Start the real-time simulation engine to propagate photons through free space and analyze bitstreams.',
      actionHint: 'Press ▶ RUN SIMULATION in the header.',
      pinHighlights: []
    }
  ];

  const activeStep = steps[currentStep - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
      <div className="bg-[#0b0f19] border border-[#1f293d] rounded-lg max-w-lg w-full p-6 shadow-2xl relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-2 text-cyan-400 mb-2">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Guided Build Mode • Physical Assembly Tutorial
          </span>
        </div>

        {/* Progress Bar & Step Counter */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-xs text-slate-400">
            <span className="font-bold text-white">STEP {currentStep} / {steps.length}</span>
            <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Active Step Content */}
        <div className="p-4 bg-[#111827] border border-[#1f293d] rounded-lg space-y-3 mb-6">
          <div className="flex items-center space-x-2">
            <span className="w-6 h-6 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center justify-center font-bold text-xs">
              {activeStep.stepNumber}
            </span>
            <h3 className="text-base font-bold text-white">{activeStep.title}</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {activeStep.description}
          </p>

          <div className="p-2.5 bg-[#0a0e17] rounded border border-cyan-900/60 text-xs text-cyan-300 flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
            <span><strong>Target Action:</strong> {activeStep.actionHint}</span>
          </div>
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}
            disabled={currentStep === 1}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs transition-colors ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed text-slate-500'
                : 'bg-[#111827] hover:bg-[#1e293b] text-slate-300'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          {currentStep < steps.length ? (
            <button
              onClick={() => setCurrentStep((s) => Math.min(steps.length, s + 1))}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded text-xs font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
            >
              <span>Next Step</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => {
                onClose();
                onRunSimulation();
              }}
              className="flex items-center space-x-1.5 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded text-xs font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <Play className="w-3.5 h-3.5" fill="currentColor" />
              <span>Finish & Run Simulation</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

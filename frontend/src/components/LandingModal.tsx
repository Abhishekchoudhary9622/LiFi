import React from 'react';
import {
  Zap,
  ArrowRight,
  FolderOpen,
  PlusCircle,
  Cpu,
  Radio,
  Activity,
  CheckCircle2,
  X
} from 'lucide-react';

interface LandingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNewProject: () => void;
  onLoadProject: () => void;
}

export const LandingModal: React.FC<LandingModalProps> = ({
  isOpen,
  onClose,
  onNewProject,
  onLoadProject
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 font-mono select-none">
      <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl max-w-2xl w-full p-8 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 text-slate-400 hover:text-white rounded"
          title="Enter Lab Workspace"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Logo & Lab Branding */}
        <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-700 mx-auto flex items-center justify-center border border-cyan-400/50 shadow-[0_0_25px_rgba(6,182,212,0.4)] mb-4">
          <Zap className="w-9 h-9 text-white" />
        </div>

        <h1 className="text-3xl font-extrabold text-white tracking-wide">
          SemLiFi Lab
        </h1>
        <div className="text-sm font-semibold text-cyan-400 mt-1 uppercase tracking-widest">
          Design. Simulate. Visualize. Analyze.
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-3 leading-relaxed">
          An interactive electrical and optical simulation environment for SemLiFi hardware prototypes, bridging physical breadboard wiring, ARM STM32 embedded firmware, and free-space LiFi photon propagation.
        </p>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-3 gap-3 my-6 text-left">
          <div className="p-3 bg-[#111827] border border-[#1f293d] rounded-lg">
            <Cpu className="w-4 h-4 text-cyan-400 mb-1.5" />
            <div className="font-bold text-white text-xs">CAD Breadboard</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              30-row addressable holes with snap-to-pin wiring.
            </p>
          </div>

          <div className="p-3 bg-[#111827] border border-[#1f293d] rounded-lg">
            <Radio className="w-4 h-4 text-amber-400 mb-1.5" />
            <div className="font-bold text-white text-xs">Optical Channel</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              850nm LED beam with ambient lux & noise model.
            </p>
          </div>

          <div className="p-3 bg-[#111827] border border-[#1f293d] rounded-lg">
            <Activity className="w-4 h-4 text-emerald-400 mb-1.5" />
            <div className="font-bold text-white text-xs">Oscilloscope & DMM</div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              4-Channel real-time waveform & node probing.
            </p>
          </div>
        </div>

        {/* Primary Call to Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center justify-center space-x-2"
          >
            <span>Open Lab</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              onNewProject();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#111827] hover:bg-[#1e293b] text-slate-200 border border-[#1f293d] rounded font-bold text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span>New Project</span>
          </button>

          <button
            onClick={() => {
              onLoadProject();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#111827] hover:bg-[#1e293b] text-slate-200 border border-[#1f293d] rounded font-bold text-xs transition-colors flex items-center justify-center space-x-2"
          >
            <FolderOpen className="w-4 h-4 text-blue-400" />
            <span>Load Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

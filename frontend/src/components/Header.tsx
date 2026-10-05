import React from 'react';
import {
  Play,
  Square,
  RotateCcw,
  RotateCw,
  Save,
  Download,
  Settings,
  Zap,
  Activity,
  Compass
} from 'lucide-react';
import { SimulationMetrics } from '../types/circuit';

interface HeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  simulationRunning: boolean;
  onToggleSimulation: () => void;
  metrics: SimulationMetrics;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onOpenSettings: () => void;
  onStartGuidedBuild: () => void;
  onOpenLanding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  projectName,
  onProjectNameChange,
  simulationRunning,
  onToggleSimulation,
  metrics,
  onSave,
  onUndo,
  onRedo,
  onExport,
  onOpenSettings,
  onStartGuidedBuild,
  onOpenLanding
}) => {
  return (
    <header className="h-14 bg-[#0a0e17] border-b border-[#1f293d] flex items-center justify-between px-4 z-40 select-none">
      {/* Left: Branding */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={onOpenLanding} title="Open Welcome Hub">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-cyan-600 to-blue-800 flex items-center justify-center border border-cyan-400/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
          <Zap className="w-4 h-4 text-cyan-200" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white text-base tracking-wide font-mono">SemLiFi Lab</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">v2.4-CAD</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono tracking-tight -mt-0.5">
            Hardware Simulation & Optical Communication Laboratory
          </p>
        </div>
      </div>

      {/* Center: Project Name & Quick State */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center bg-[#111827] border border-[#1f293d] rounded px-3 py-1 text-xs font-mono">
          <span className="text-slate-400 mr-2 text-[11px]">PROJECT:</span>
          <input
            type="text"
            value={projectName}
            onChange={(e) => onProjectNameChange(e.target.value)}
            className="bg-transparent border-none text-cyan-300 font-semibold focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1 text-xs w-36 text-center"
            title="Click to rename project"
          />
        </div>

        <button
          onClick={onStartGuidedBuild}
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-[#1e293b]/70 hover:bg-[#1e293b] text-cyan-300 hover:text-cyan-200 border border-cyan-800/60 rounded text-xs font-mono transition-colors"
          title="Interactive Step-by-Step Guided Build Mode"
        >
          <Compass className="w-3.5 h-3.5 text-cyan-400" />
          <span>Guided Build</span>
        </button>
      </div>

      {/* Right: Actions & Simulation Control */}
      <div className="flex items-center space-x-2">
        {/* Undo / Redo */}
        <div className="flex items-center border border-[#1f293d] rounded bg-[#111827] overflow-hidden">
          <button
            onClick={onUndo}
            className="p-1.5 hover:bg-[#1e293b] text-slate-400 hover:text-slate-200 transition-colors"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-4 bg-[#1f293d]" />
          <button
            onClick={onRedo}
            className="p-1.5 hover:bg-[#1e293b] text-slate-400 hover:text-slate-200 transition-colors"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Save */}
        <button
          onClick={onSave}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1e293b] text-slate-300 hover:text-white border border-[#1f293d] rounded text-xs font-mono transition-colors"
          title="Save Project (Ctrl+S)"
        >
          <Save className="w-3.5 h-3.5 text-emerald-400" />
          <span>Save</span>
        </button>

        {/* Export */}
        <button
          onClick={onExport}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#111827] hover:bg-[#1e293b] text-slate-300 hover:text-white border border-[#1f293d] rounded text-xs font-mono transition-colors"
          title="Export Project File"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>Export</span>
        </button>

        {/* Prominent Simulation Button */}
        {simulationRunning ? (
          <button
            onClick={onToggleSimulation}
            className="flex items-center space-x-2 px-4 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-600/80 text-rose-200 rounded font-mono text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(244,63,94,0.35)] transition-all animate-pulse"
            title="Stop Simulation (S)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
            <Square className="w-3.5 h-3.5 text-rose-300" fill="currentColor" />
            <span>● SIMULATION RUNNING</span>
          </button>
        ) : (
          <button
            onClick={onToggleSimulation}
            className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white border border-emerald-400 rounded font-mono text-xs font-bold tracking-wider shadow-[0_0_15px_rgba(16,185,129,0.35)] transition-all"
            title="Run Simulation (S)"
          >
            <Play className="w-3.5 h-3.5 text-white" fill="currentColor" />
            <span>▶ RUN SIMULATION</span>
          </button>
        )}

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 bg-[#111827] hover:bg-[#1e293b] text-slate-400 hover:text-slate-200 border border-[#1f293d] rounded transition-colors"
          title="Settings & Hardware Mapping"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};

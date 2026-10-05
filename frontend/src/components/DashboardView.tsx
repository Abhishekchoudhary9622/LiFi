import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Zap,
  Radio,
  Cpu,
  Layers,
  Activity,
  Play,
  FileText,
  FolderOpen,
  PlusCircle,
  Upload,
  ArrowRight,
  ShieldCheck,
  Clock,
  Gauge
} from 'lucide-react';
import { CircuitComponent, Wire, SimulationMetrics, ValidationResult, ActiveSection } from '../types/circuit';

interface DashboardViewProps {
  projectName: string;
  components: CircuitComponent[];
  wires: Wire[];
  metrics: SimulationMetrics;
  validation: ValidationResult;
  onNavigate: (section: ActiveSection) => void;
  onToggleSimulation: () => void;
  onNewProject: () => void;
  onOpenProject: () => void;
  onImportCircuit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projectName,
  components,
  wires,
  metrics,
  validation,
  onNavigate,
  onToggleSimulation,
  onNewProject,
  onOpenProject,
  onImportCircuit
}) => {
  return (
    <div className="flex-1 bg-[#0b0f19] p-6 overflow-y-auto font-mono text-slate-200">
      {/* Top Banner / Welcome */}
      <div className="flex items-center justify-between pb-6 border-b border-[#1f293d]">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">SemLiFi Prototype Dashboard</h1>
            <span className={`px-2 py-0.5 rounded text-xs font-semibold flex items-center space-x-1 border ${
              validation.valid
                ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800'
                : 'bg-rose-950/80 text-rose-400 border-rose-800'
            }`}>
              {validation.valid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>✓ Circuit Valid</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>✕ DRC Warnings</span>
                </>
              )}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time telemetry, hardware configuration, and optical link diagnostics for current prototype.
          </p>
        </div>

        {/* Quick Primary Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigate('build')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white rounded text-xs font-bold transition-all shadow-[0_0_15px_rgba(6,182,212,0.25)]"
          >
            <Cpu className="w-4 h-4" />
            <span>Continue Designing</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
          <button
            onClick={onToggleSimulation}
            className={`flex items-center space-x-2 px-4 py-2 rounded text-xs font-bold transition-all border ${
              metrics.running
                ? 'bg-rose-950 text-rose-300 border-rose-700'
                : 'bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900'
            }`}
          >
            <Play className="w-4 h-4" fill="currentColor" />
            <span>{metrics.running ? 'Running Simulation' : 'Run Simulation'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Grid (High density engineering data) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 my-6">
        {/* Metric 1: Project */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Project</div>
          <div className="text-sm font-bold text-cyan-300 truncate" title={projectName}>{projectName}</div>
          <div className="text-[10px] text-slate-400 mt-1">ARM M3 LiFi</div>
        </div>

        {/* Metric 2: Circuit Status */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Circuit Status</div>
          <div className={`text-sm font-bold ${validation.valid ? 'text-emerald-400' : 'text-rose-400'}`}>
            {validation.valid ? '✓ Valid' : '✕ Faulty'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">DRC Checked</div>
        </div>

        {/* Metric 3: Components */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Components</div>
          <div className="text-sm font-bold text-white">{components.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Placed on board</div>
        </div>

        {/* Metric 4: Connections */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Connections</div>
          <div className="text-sm font-bold text-cyan-400">{wires.length}</div>
          <div className="text-[10px] text-slate-400 mt-1">Nets verified</div>
        </div>

        {/* Metric 5: Power */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Power</div>
          <div className="text-sm font-bold text-amber-400">
            {metrics.running ? `${metrics.vccVoltage.toFixed(2)} V` : '3.30 V'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Regulated VCC</div>
        </div>

        {/* Metric 6: Current */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Current</div>
          <div className="text-sm font-bold text-emerald-400">
            {metrics.running ? `${metrics.totalCurrentMa} mA` : '118 mA'}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">System draw</div>
        </div>

        {/* Metric 7: Optical Link */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Optical Link</div>
          <div className="text-sm font-bold text-cyan-300 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping mr-1" />
            <span>CONNECTED</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1">{metrics.linkDistanceM} m LOS</div>
        </div>

        {/* Metric 8: Data Rate & BER */}
        <div className="bg-[#111827] border border-[#1f293d] p-3 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Rate / BER</div>
          <div className="text-sm font-bold text-indigo-400">
            {metrics.dataRateKbps}k / {(metrics.running ? metrics.ber * 100 : 0.02).toFixed(2)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-1">OOK Modulation</div>
        </div>
      </div>

      {/* Main Dashboard Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Circuit Health & Signal Telemetry Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Circuit Health & DRC Checks */}
          <div className="bg-[#111827] border border-[#1f293d] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <h2 className="text-sm font-bold text-white">Circuit Health & Design Rule Verification</h2>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {validation.passedChecks} of {validation.totalChecks} Checks Passed
              </span>
            </div>

            <div className="w-full bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${validation.valid ? 'bg-emerald-500' : 'bg-amber-500'}`}
                style={{ width: `${validation.score}%` }}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {validation.rules.slice(0, 6).map((rule) => (
                <div
                  key={rule.id}
                  className={`p-2.5 rounded border flex items-start space-x-2 ${
                    rule.status === 'pass'
                      ? 'bg-[#0a0e17]/80 border-emerald-900/40 text-slate-300'
                      : rule.status === 'warning'
                      ? 'bg-amber-950/20 border-amber-900/60 text-amber-200'
                      : 'bg-rose-950/30 border-rose-900/70 text-rose-200'
                  }`}
                >
                  {rule.status === 'pass' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-semibold text-white text-[11px]">{rule.title}</div>
                    <div className="text-[10px] text-slate-400 line-clamp-1">{rule.description}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 flex justify-end">
              <button
                onClick={() => onNavigate('validation')}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>View Full Validation Report</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Real-Time Waveform & Optical Link Summary */}
          <div className="bg-[#111827] border border-[#1f293d] rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-white">Live Signal Waveform Preview</h2>
              </div>
              <div className="flex items-center space-x-3 text-[10px]">
                <span className="flex items-center space-x-1 text-cyan-400">
                  <span className="w-2 h-0.5 bg-cyan-400 inline-block" />
                  <span>CH1: TX (3.3V)</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-400">
                  <span className="w-2 h-0.5 bg-emerald-400 inline-block" />
                  <span>CH2: Current (mA)</span>
                </span>
                <span className="flex items-center space-x-1 text-amber-400">
                  <span className="w-2 h-0.5 bg-amber-400 inline-block" />
                  <span>CH3: Optical (mW)</span>
                </span>
              </div>
            </div>

            {/* Mini Waveform Visualization Canvas */}
            <div className="h-32 bg-[#080d16] border border-[#1f293d] rounded relative overflow-hidden flex items-end px-2 pb-2">
              <div className="absolute inset-0 tech-grid opacity-20 pointer-events-none" />
              <div className="w-full flex items-end justify-between space-x-1 h-24 z-10">
                {metrics.channelWaveform.slice(0, 32).map((pt, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center justify-end h-full space-y-0.5">
                    <div
                      className="w-full bg-cyan-400/80 rounded-t-sm transition-all"
                      style={{ height: `${(pt.ch1 / 3.3) * 70}%` }}
                    />
                    <div
                      className="w-full bg-amber-400/80 rounded-t-sm transition-all"
                      style={{ height: `${Math.min(100, (pt.ch3 / 4.0) * 100)}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <div>SNR: <span className="text-white font-bold">{metrics.snrDb} dB</span> | Optical Power: <span className="text-white font-bold">{metrics.opticalPowerMw} mW</span></div>
              <button
                onClick={() => onNavigate('monitor')}
                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
              >
                <span>Open Oscilloscope Lab</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Project Metadata */}
        <div className="space-y-6">
          {/* Quick Actions Panel */}
          <div className="bg-[#111827] border border-[#1f293d] rounded p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>Quick Actions</span>
            </h2>
            <div className="space-y-2">
              <button
                onClick={onNewProject}
                className="w-full flex items-center justify-between p-2.5 bg-[#0a0e17] hover:bg-[#1e293b] border border-[#1f293d] rounded text-xs transition-colors text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <PlusCircle className="w-4 h-4 text-emerald-400" />
                  <div>
                    <div className="font-semibold text-white">New Project</div>
                    <div className="text-[10px] text-slate-400">Initialize clean hardware workspace</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={onOpenProject}
                className="w-full flex items-center justify-between p-2.5 bg-[#0a0e17] hover:bg-[#1e293b] border border-[#1f293d] rounded text-xs transition-colors text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <FolderOpen className="w-4 h-4 text-blue-400" />
                  <div>
                    <div className="font-semibold text-white">Open Project</div>
                    <div className="text-[10px] text-slate-400">Load saved circuit from storage</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={onImportCircuit}
                className="w-full flex items-center justify-between p-2.5 bg-[#0a0e17] hover:bg-[#1e293b] border border-[#1f293d] rounded text-xs transition-colors text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <div>
                    <div className="font-semibold text-white">Import Circuit</div>
                    <div className="text-[10px] text-slate-400">Load JSON circuit netlist</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>

              <button
                onClick={() => onNavigate('report')}
                className="w-full flex items-center justify-between p-2.5 bg-[#0a0e17] hover:bg-[#1e293b] border border-[#1f293d] rounded text-xs transition-colors text-left"
              >
                <div className="flex items-center space-x-2.5">
                  <FileText className="w-4 h-4 text-indigo-400" />
                  <div>
                    <div className="font-semibold text-white">Generate Report</div>
                    <div className="text-[10px] text-slate-400">19-section engineering export</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Recent Simulations History */}
          <div className="bg-[#111827] border border-[#1f293d] rounded p-4">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center space-x-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span>Recent Simulation Runs</span>
            </h2>
            <div className="space-y-2 text-xs">
              <div className="p-2 bg-[#0a0e17] border border-[#1f293d] rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">RUN #104 - 115.2 kbps OOK</div>
                  <div className="text-[10px] text-slate-400">Distance 1.2m | BER 0.02%</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                  PASSED
                </span>
              </div>

              <div className="p-2 bg-[#0a0e17] border border-[#1f293d] rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">RUN #103 - Manchester 57.6 kbps</div>
                  <div className="text-[10px] text-slate-400">Distance 2.0m | BER 0.14%</div>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                  PASSED
                </span>
              </div>

              <div className="p-2 bg-[#0a0e17] border border-[#1f293d] rounded flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">RUN #102 - 500 Lux Ambient Noise</div>
                  <div className="text-[10px] text-slate-400">High Optical Noise test</div>
                </div>
                <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800">
                  WARN
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

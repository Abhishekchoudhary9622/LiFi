import React, { useState, useEffect } from 'react';
import { 
  FlaskConical, 
  Play, 
  BarChart2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw,
  Sliders,
  FileText
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { ExperimentMetrics } from '../types/semlifi';
import { api } from '../services/api';

export const ExperimentLabView: React.FC = () => {
  const [numFrames, setNumFrames] = useState(50);
  const [burstProfile, setBurstProfile] = useState('P3 (Mixed)');
  const [burstPrevalence, setBurstPrevalence] = useState(0.40);
  const [recoveryMethod, setRecoveryMethod] = useState('SemLiFi (BASR + CGFP)');
  const [threshold, setThreshold] = useState(0.80);
  const [isRunning, setIsRunning] = useState(false);
  
  const [latestResult, setLatestResult] = useState<ExperimentMetrics | null>(null);
  const [benchmarks, setBenchmarks] = useState<ExperimentMetrics[]>([]);

  useEffect(() => {
    const loadBenchmarks = async () => {
      try {
        const data = await api.getBenchmarks();
        setBenchmarks(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadBenchmarks();
  }, []);

  const handleRunExperiment = async () => {
    setIsRunning(true);
    try {
      const res = await api.runExperiment({
        experiment_id: `EXP-${Date.now()}`,
        num_frames: numFrames,
        burst_probability: burstPrevalence,
        burst_profile: burstProfile,
        recovery_method: recoveryMethod,
        tau_threshold: threshold,
        channel_mode: 'SIMULATION',
      });
      setLatestResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  // Chart data comparing methods
  const chartData = [
    { name: 'RS-FEC', delivery: 37.5, latency: 449.0, ufer: 62.5 },
    { name: 'ARQ (Stop-Wait)', delivery: 97.1, latency: 1560.0, ufer: 0.0 },
    { name: 'BASR Only', delivery: 100.0, latency: 451.8, ufer: 57.4 },
    { name: 'SemLiFi (Sim 100%)', delivery: 100.0, latency: 790.7, ufer: 1.0 },
    { name: 'SemLiFi (Live N=15)', delivery: 100.0, latency: 714.8, ufer: 0.0 },
  ];

  if (latestResult) {
    chartData.push({
      name: `Current Run (${latestResult.method.split(' ')[0]})`,
      delivery: latestResult.delivery_rate,
      latency: latestResult.mean_latency_ms,
      ufer: latestResult.ufer,
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Experiment Lab & Benchmark Verification</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Compare No-Recovery, Reed-Solomon RS(33,25), Stop-and-Wait ARQ, pure BASR, and SemLiFi hybrid recovery
          </p>
        </div>

        <button
          onClick={handleRunExperiment}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-lg disabled:opacity-50"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? 'RUNNING EXPERIMENT...' : 'START EXPERIMENT'}</span>
        </button>
      </div>

      {/* Configuration Form */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1">
          <label className="text-xs text-slate-400 block font-medium">Recovery Method:</label>
          <select
            value={recoveryMethod}
            onChange={(e) => setRecoveryMethod(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="SemLiFi (BASR + CGFP)">SemLiFi (BASR + CGFP)</option>
            <option value="Stop-and-Wait ARQ">Stop-and-Wait ARQ</option>
            <option value="RS-FEC">RS-FEC (Reed-Solomon)</option>
            <option value="BASR (Semantic only)">BASR (Semantic only)</option>
            <option value="No Recovery">No Recovery</option>
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-xs text-slate-400 block font-medium">Burst Profile:</label>
          <select
            value={burstProfile}
            onChange={(e) => setBurstProfile(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none"
          >
            <option value="P1 (Short)">P1: Short (15–40 ms)</option>
            <option value="P2 (Long)">P2: Long (150–380 ms)</option>
            <option value="P3 (Mixed)">P3: Mixed / Randomized</option>
          </select>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium">Frame Count:</span>
            <span className="font-mono text-white font-bold">{numFrames}</span>
          </div>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={numFrames}
            onChange={(e) => setNumFrames(parseInt(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-2"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium">Burst Prevalence:</span>
            <span className="font-mono text-amber-400 font-bold">{(burstPrevalence * 100).toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="0.10"
            max="1.0"
            step="0.10"
            value={burstPrevalence}
            onChange={(e) => setBurstPrevalence(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500 mt-2"
          />
        </div>
      </div>

      {/* Latest Run Results Cards */}
      {latestResult && (
        <div className="bg-slate-950 p-5 rounded-xl border border-cyan-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">Latest Execution Results ({latestResult.method})</h4>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
              {latestResult.source_label}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono text-xs text-center">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Delivery Rate</span>
              <span className="text-lg font-bold text-emerald-400 mt-0.5 block">{latestResult.delivery_rate}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Mean Latency</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{latestResult.mean_latency_ms} ms</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">UFER</span>
              <span className="text-lg font-bold text-rose-400 mt-0.5 block">{latestResult.ufer}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Avoided Retrans.</span>
              <span className="text-lg font-bold text-cyan-300 mt-0.5 block">{latestResult.retransmissions_avoided_pct}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Patch Precision</span>
              <span className="text-lg font-bold text-purple-300 mt-0.5 block">{latestResult.patch_precision_pct}%</span>
            </div>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[10px] text-slate-500 block">Motor-State Acc.</span>
              <span className="text-lg font-bold text-amber-300 mt-0.5 block">{latestResult.motor_state_accuracy_pct}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Comparative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Latency Comparison Chart */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Latency Comparison (ms) — Lower is Better
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="latency" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Latency (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Delivery Rate & UFER Chart */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Delivery Rate (%) vs UFER (%)
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="delivery" fill="#10b981" radius={[4, 4, 0, 0]} name="Delivery Rate (%)" />
                <Bar dataKey="ufer" fill="#f43f5e" radius={[4, 4, 0, 0]} name="UFER (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Official Paper Reference Results Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-white">Paper-Reported Ground Truth Benchmarks (Tables IV & VII)</h4>
          <span className="text-xs font-mono text-purple-400 font-bold">PAPER RESULTS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Method</th>
                <th className="py-3 px-4">Delivery</th>
                <th className="py-3 px-4">Mean Latency</th>
                <th className="py-3 px-4">UFER</th>
                <th className="py-3 px-4">Retrans. Avoided</th>
                <th className="py-3 px-4">Evidence Citation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {benchmarks.map((b, idx) => (
                <tr key={idx} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 text-cyan-300 font-bold font-sans">{b.method}</td>
                  <td className="py-3 px-4 text-emerald-400 font-bold">{b.delivery_rate}%</td>
                  <td className="py-3 px-4 text-white font-bold">{b.mean_latency_ms} ms</td>
                  <td className="py-3 px-4 text-rose-400">{b.ufer}%</td>
                  <td className="py-3 px-4 text-amber-300">{b.retransmissions_avoided_pct}%</td>
                  <td className="py-3 px-4 text-slate-400 text-[11px] font-sans">{b.source_label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

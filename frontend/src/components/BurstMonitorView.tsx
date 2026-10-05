import React, { useState, useEffect } from 'react';
import { 
  ZapOff, 
  Clock, 
  Sliders, 
  BarChart3, 
  Filter, 
  Search, 
  AlertTriangle, 
  Play, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { EmpiricalBurstRecord, BurstEvent } from '../types/semlifi';
import { api } from '../services/api';

export const BurstMonitorView: React.FC = () => {
  const [empiricalBursts, setEmpiricalBursts] = useState<EmpiricalBurstRecord[]>([]);
  const [profileFilter, setProfileFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Interactive Burst Generator State
  const [simDurationMs, setSimDurationMs] = useState<number>(30.0);
  const [simPayload, setSimPayload] = useState<string>('TEMP=27.4,HUM=61,MOTOR=ON');
  const [activeBurstEvent, setActiveBurstEvent] = useState<BurstEvent | null>(null);

  useEffect(() => {
    const loadBursts = async () => {
      try {
        const data = await api.getEmpiricalBursts();
        setEmpiricalBursts(data);
      } catch (e) {
        console.error(e);
      }
    };
    loadBursts();
  }, []);

  const handleSimulateBurst = async () => {
    try {
      const res = await api.simulateBurst(simPayload, simDurationMs);
      setActiveBurstEvent(res);
    } catch (e) {
      console.error(e);
    }
  };

  const filteredBursts = empiricalBursts.filter((b) => {
    const matchesProfile = profileFilter === 'ALL' || b.profile.includes(profileFilter);
    const matchesSearch = 
      b.notes.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.profile.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.event_id.toString().includes(searchQuery);
    return matchesProfile && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Explaining the 56 Empirical Events */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ZapOff className="w-5 h-5 text-rose-400" />
            <h3 className="text-base font-bold text-white">Physical Optical Burst Monitor & Empirical Dataset</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical characterization of contiguous optical losses from SG90 servo-actuated physical flap occlusions
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
          PAPER-REPORTED DATASET (56 EVENTS)
        </span>
      </div>

      {/* Profiles Overview Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-emerald-400 font-bold">PROFILE P1 (SHORT)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">20 Events</span>
          </div>
          <p className="text-xl font-extrabold text-white mt-2">15 – 40 ms</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Corrupts ~2–5 contiguous bytes (rapid servo transit)
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-rose-400 font-bold">PROFILE P2 (LONG)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">20 Events</span>
          </div>
          <p className="text-xl font-extrabold text-white mt-2">150 – 380 ms</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Corrupts ~18–25 contiguous bytes (dwell occlusion)
          </span>
        </div>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-amber-400 font-bold">PROFILE P3 (MIXED)</span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">16 Events</span>
          </div>
          <p className="text-xl font-extrabold text-white mt-2">45 – 145 ms</p>
          <span className="text-[11px] text-slate-400 mt-1 block">
            Randomized variable-speed occlusion profiles
          </span>
        </div>
      </div>

      {/* Interactive Burst Injection Generator */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Interactive Physical Occlusion Generator
          </h4>
          <span className="text-xs font-mono text-cyan-400">Simulation Parameter</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs text-slate-300 font-medium block">Payload to Occlude:</label>
            <input
              type="text"
              value={simPayload}
              onChange={(e) => setSimPayload(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">Burst Duration (TB):</span>
              <span className="text-amber-400 font-mono font-bold">{simDurationMs.toFixed(1)} ms</span>
            </div>
            <input
              type="range"
              min="15"
              max="380"
              step="5"
              value={simDurationMs}
              onChange={(e) => setSimDurationMs(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSimulateBurst}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Generate Physical Occlusion</span>
          </button>
        </div>

        {/* Live Burst Event Output */}
        {activeBurstEvent && (
          <div className="mt-4 p-4 bg-slate-900/90 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono font-bold text-rose-400">CORRUPTION PROFILE:</span>
                <span className="text-xs font-mono text-white">{activeBurstEvent.profile}</span>
              </div>
              <span className="text-xs font-mono text-amber-300">
                Duration: {activeBurstEvent.duration_ms.toFixed(1)} ms ({activeBurstEvent.affected_bytes} bytes lost)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">Surviving Prefix Context:</span>
                <span className="text-emerald-400 font-mono font-bold">&quot;{activeBurstEvent.surviving_prefix}&quot;</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Surviving Suffix Context:</span>
                <span className="text-emerald-400 font-mono font-bold">&quot;{activeBurstEvent.surviving_suffix}&quot;</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <span className="text-slate-500 block text-[10px] mb-1">Masked Payload for BASR Transformer:</span>
              <div className="p-2.5 bg-slate-950 rounded font-mono text-xs text-amber-300 border border-slate-800">
                {activeBurstEvent.burst_mask}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 56 Empirical Events Table */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <FileSpreadsheet className="w-4 h-4 text-cyan-400" />
            <h4 className="text-sm font-semibold text-white">56 Physical Burst Events Log</h4>
            <span className="text-xs text-slate-500 font-mono">Recorded from Physical Testbed</span>
          </div>

          <div className="flex items-center space-x-2">
            {(['ALL', 'P1', 'P2', 'P3'] as const).map((prof) => (
              <button
                key={prof}
                onClick={() => setProfileFilter(prof)}
                className={`px-2.5 py-1 rounded text-xs font-medium font-mono transition ${
                  profileFilter === prof
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {prof}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 uppercase text-[10px] border-b border-slate-800 sticky top-0">
              <tr>
                <th className="py-2.5 px-4">Event ID</th>
                <th className="py-2.5 px-4">Profile</th>
                <th className="py-2.5 px-4">Duration (TB)</th>
                <th className="py-2.5 px-4">Affected Bytes (NB)</th>
                <th className="py-2.5 px-4">Servo Angle</th>
                <th className="py-2.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredBursts.map((b) => (
                <tr key={b.event_id} className="hover:bg-slate-900/50 transition">
                  <td className="py-2 px-4 text-cyan-400 font-bold">#{b.event_id.toString().padStart(2, '0')}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      b.profile.includes('P1') ? 'bg-emerald-500/20 text-emerald-300' :
                      b.profile.includes('P2') ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {b.profile}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-white font-bold">{b.duration_ms.toFixed(1)} ms</td>
                  <td className="py-2 px-4 text-amber-300">{b.affected_bytes} bytes</td>
                  <td className="py-2 px-4 text-slate-300">{b.servo_angle_deg}°</td>
                  <td className="py-2 px-4 text-slate-400 text-[11px] font-sans truncate max-w-xs">{b.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

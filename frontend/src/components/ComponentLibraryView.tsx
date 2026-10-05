import React, { useState, useEffect } from 'react';
import { 
  Cpu, 
  Search, 
  ExternalLink, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle,
  Layers,
  Zap,
  Info
} from 'lucide-react';
import { HardwareComponent, VerificationStatus } from '../types/semlifi';
import { api } from '../services/api';

export const ComponentLibraryView: React.FC = () => {
  const [components, setComponents] = useState<HardwareComponent[]>([]);
  const [selectedComp, setSelectedComp] = useState<HardwareComponent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    const loadComp = async () => {
      try {
        const data = await api.getComponents();
        setComponents(data);
        if (data.length > 0) setSelectedComp(data[0]);
      } catch (e) {
        console.error(e);
      }
    };
    loadComp();
  }, []);

  const filteredComponents = components.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'ALL' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED HARDWARE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>VERIFIED HARDWARE</span>
          </span>
        );
      case 'DOCUMENTED HARDWARE':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/40">
            <CheckCircle2 className="w-3 h-3" />
            <span>DOCUMENTED HARDWARE</span>
          </span>
        );
      case 'UNVERIFIED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <AlertTriangle className="w-3 h-3" />
            <span>UNVERIFIED</span>
          </span>
        );
    }
  };

  const types = ['ALL', ...Array.from(new Set(components.map((c) => c.type)))];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">SemLiFi Hardware Component Library</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Exhaustive engineering specification of all 15 transmitter, channel, and receiver hardware elements
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
          15 Physical Components
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-1.5">
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                filterType === t
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-850'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search component name or specs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Grid: Component List and Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Selector List */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xl space-y-2 max-h-[720px] overflow-y-auto">
          {filteredComponents.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedComp(c)}
              className={`w-full text-left p-3.5 rounded-xl border transition flex items-start space-x-3 ${
                selectedComp?.id === c.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg'
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 text-slate-400'
              }`}
            >
              <div
                className="w-3 h-3 rounded-full mt-1 shrink-0"
                style={{ backgroundColor: c.color }}
              />
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold ${selectedComp?.id === c.id ? 'text-cyan-200' : 'text-white'}`}>
                    {c.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">L{c.layer_index}</span>
                </div>
                <span className="text-[11px] text-slate-400 block line-clamp-1">{c.purpose}</span>
                <div className="pt-1">{getStatusBadge(c.verification_status)}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Component Deep-Dive Inspection Card */}
        {selectedComp && (
          <div className="lg:col-span-2 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl space-y-5">
            <div className="flex items-start justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs font-mono text-cyan-400 font-bold uppercase">{selectedComp.type} (Layer {selectedComp.layer_index})</span>
                <h3 className="text-xl font-bold text-white mt-1">{selectedComp.name}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{selectedComp.purpose}</p>
              </div>
              <div>{getStatusBadge(selectedComp.verification_status)}</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">Inputs:</span>
                <p className="text-slate-200 font-mono">{selectedComp.inputs}</p>
              </div>
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <span className="text-slate-400 font-medium block mb-1">Outputs:</span>
                <p className="text-emerald-300 font-mono">{selectedComp.outputs}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <span className="text-cyan-400 font-bold block mb-1">Why It Is Used in SemLiFi:</span>
                <p className="text-slate-300 leading-relaxed">{selectedComp.why_used}</p>
              </div>

              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <span className="text-purple-400 font-bold block mb-1">How It Works (Physical Physics & Electronics):</span>
                <p className="text-slate-300 leading-relaxed">{selectedComp.how_it_works}</p>
              </div>

              <div className="p-3 bg-slate-900/70 rounded-xl border border-slate-800">
                <span className="text-amber-400 font-bold block mb-1">Digital Twin / Simulation Behavior:</span>
                <p className="text-slate-300 leading-relaxed font-mono text-[11px]">{selectedComp.simulation_behavior}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
              <span>Datasheet Reference: {selectedComp.datasheet_reference}</span>
              <span>Layer #{selectedComp.layer_index}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

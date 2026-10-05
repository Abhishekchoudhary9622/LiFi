import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Layers, 
  Cpu, 
  Play, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  Sliders,
  HelpCircle,
  Network
} from 'lucide-react';
import { BASRReconstructionResult } from '../types/semlifi';
import { api } from '../services/api';

export const BasrAiView: React.FC = () => {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [corruptedInput, setCorruptedInput] = useState('TEMP=__._,HUM=60,MOTOR=ON');
  const [prefix, setPrefix] = useState('TEMP=');
  const [suffix, setSuffix] = useState(',HUM=60,MOTOR=ON');
  const [spanBytes, setSpanBytes] = useState(4);
  const [forceLowConf, setForceLowConf] = useState(false);
  const [result, setResult] = useState<BASRReconstructionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const info = await api.getBasrModelInfo();
        setModelInfo(info);
      } catch (e) {
        console.error(e);
      }
    };
    loadInfo();
  }, []);

  const handleReconstruct = async (isLowConf: boolean = forceLowConf) => {
    setLoading(true);
    try {
      const res = await api.basrReconstruct({
        corrupted_payload: corruptedInput,
        burst_span: spanBytes,
        surviving_prefix: prefix,
        surviving_suffix: suffix,
        force_low_confidence: isLowConf,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleReconstruct();
  }, [corruptedInput, spanBytes]);

  const loadExample = (type: 'CORRECT' | 'INCORRECT_PLAUSIBLE' | 'BATTERY') => {
    if (type === 'CORRECT') {
      setCorruptedInput('TEMP=__._,HUM=60,MOTOR=ON');
      setPrefix('TEMP=');
      setSuffix(',HUM=60,MOTOR=ON');
      setSpanBytes(4);
      setForceLowConf(false);
    } else if (type === 'INCORRECT_PLAUSIBLE') {
      setCorruptedInput('TEMP=__._,HUM=60,MOTOR=ON');
      setPrefix('TEMP=');
      setSuffix(',HUM=60,MOTOR=ON');
      setSpanBytes(4);
      setForceLowConf(true);
    } else {
      setCorruptedInput('Battery level is __% and voltage is 3.9V.');
      setPrefix('Battery level is ');
      setSuffix('% and voltage is 3.9V.');
      setSpanBytes(2);
      setForceLowConf(true);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Model Status */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Brain className="w-5 h-5 text-purple-400" />
            <h3 className="text-base font-bold text-white">BASR: Burst-Aware Semantic Reconstruction</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Edge-constrained Transformer encoder for structured telemetry span reconstruction
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
          SIMULATION — MODEL CHECKPOINT NOT CONNECTED
        </span>
      </div>

      {/* Model Architecture Specifications (Section V-B) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-mono text-slate-500 block">Trainable Params</span>
          <span className="text-lg font-mono font-extrabold text-cyan-300 mt-0.5 block">74,281</span>
          <span className="text-[10px] text-slate-500 font-mono">Budget: 75,000 (99.04%)</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-mono text-slate-500 block">Model Dim (d_model)</span>
          <span className="text-lg font-mono font-extrabold text-purple-300 mt-0.5 block">64</span>
          <span className="text-[10px] text-slate-500">Compact Edge Design</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-mono text-slate-500 block">Attention Heads</span>
          <span className="text-lg font-mono font-extrabold text-indigo-300 mt-0.5 block">4 Heads</span>
          <span className="text-[10px] text-slate-500 font-mono">d_k = 16 per head</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-mono text-slate-500 block">Encoder Layers</span>
          <span className="text-lg font-mono font-extrabold text-emerald-300 mt-0.5 block">2 Layers</span>
          <span className="text-[10px] text-slate-500 font-mono">d_ff = 96</span>
        </div>

        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
          <span className="text-[10px] uppercase font-mono text-slate-500 block">Edge CPU Latency</span>
          <span className="text-lg font-mono font-extrabold text-amber-300 mt-0.5 block">2.79 ms</span>
          <span className="text-[10px] text-slate-500">Reported Mean Inference</span>
        </div>
      </div>

      {/* Visual Neural Network Flow Diagram */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          BASR Transformer Pipeline Dataflow
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-mono text-cyan-400 font-bold block">1. INPUT EMBEDDING</span>
            <span className="text-xs text-slate-300 font-mono">Tokens + Pos (d=64)</span>
            <span className="text-[10px] text-slate-500 block">Prefix + [MASK] + Suffix</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-mono text-purple-400 font-bold block">2. MULTI-HEAD ATTENTION</span>
            <span className="text-xs text-slate-300 font-mono">4 Heads (d_k=16)</span>
            <span className="text-[10px] text-slate-500 block">Self-attention across span</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-mono text-indigo-400 font-bold block">3. FEED-FORWARD (d_ff=96)</span>
            <span className="text-xs text-slate-300 font-mono">2-Layer MLP + LayerNorm</span>
            <span className="text-[10px] text-slate-500 block">Non-linear projection</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-mono text-emerald-400 font-bold block">4. OUTPUT PROJECTION</span>
            <span className="text-xs text-slate-300 font-mono">Softmax Logits</span>
            <span className="text-[10px] text-slate-500 block">Vocab probability distribution</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-center space-y-1">
            <span className="text-[10px] font-mono text-amber-400 font-bold block">5. RECONSTRUCTED PATCH</span>
            <span className="text-xs text-slate-300 font-mono">Candidate + Confidence</span>
            <span className="text-[10px] text-slate-500 block">Routed to CGFP decision gate</span>
          </div>
        </div>
      </div>

      {/* Interactive Inference & Example Scenarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Panel */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Masked Telemetry Input
            </h4>
            <span className="text-xs font-mono text-purple-400">Mask: [MASK] or _</span>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={corruptedInput}
              onChange={(e) => setCorruptedInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Prefix Context:</label>
              <input
                type="text"
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Suffix Context:</label>
              <input
                type="text"
                value={suffix}
                onChange={(e) => setSuffix(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-white"
              />
            </div>
          </div>

          {/* Preset Buttons */}
          <div className="space-y-2 pt-2">
            <span className="text-xs text-slate-400 font-medium block">Research Paper Scenarios:</span>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => loadExample('CORRECT')}
                className="p-2 bg-slate-900 hover:bg-slate-850 rounded text-left border border-slate-800 transition"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-emerald-400 font-bold">1. High-Confidence Correct Reconstruction</span>
                  <span className="text-[10px] font-mono text-slate-500">C = 0.94</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                  TEMP=__._,HUM=60,MOTOR=ON -&gt; Reconstructs &quot;34.0&quot;
                </span>
              </button>

              <button
                onClick={() => loadExample('INCORRECT_PLAUSIBLE')}
                className="p-2 bg-slate-900 hover:bg-slate-850 rounded text-left border border-slate-800 transition"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-rose-400 font-bold">2. Semantically Plausible but Factually Wrong</span>
                  <span className="text-[10px] font-mono text-slate-500">C = 0.42</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                  Reconstructs &quot;21.4&quot; instead of &quot;27.4&quot; (CGFP must reject!)
                </span>
              </button>

              <button
                onClick={() => loadExample('BATTERY')}
                className="p-2 bg-slate-900 hover:bg-slate-850 rounded text-left border border-slate-800 transition"
              >
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-400 font-bold">3. Architecture Diagram Scenario 2</span>
                  <span className="text-[10px] font-mono text-slate-500">C = 0.42</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono mt-0.5 block">
                  &quot;Battery level is __%&quot; -&gt; Predicts &quot;18%&quot; instead of &quot;78%&quot;
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Reconstruction Output Panel */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              BASR Output & Token Probabilities
            </h4>
            <span className="text-xs font-mono text-emerald-400">
              Latency: {result?.inference_latency_ms || 2.79} ms
            </span>
          </div>

          {result && (
            <div className="space-y-4">
              <div>
                <span className="text-slate-500 block text-[10px]">Reconstructed Payload:</span>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-sm text-cyan-300 font-bold">
                  {result.reconstructed_text}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Mean Token Confidence (P):</span>
                  <span className="text-lg font-bold text-white">{(result.token_confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="p-3 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Prediction Entropy:</span>
                  <span className="text-lg font-bold text-purple-300">{result.mean_entropy.toFixed(3)} bits</span>
                </div>
              </div>

              {/* Token-by-token probability bars */}
              <div>
                <span className="text-slate-400 block text-xs font-medium mb-2">Reconstructed Token Probabilities:</span>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {result.token_predictions.map((tp, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-xs font-mono">
                      <span className="w-5 text-center px-1 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">
                        {tp.char}
                      </span>
                      <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full"
                          style={{ width: `${tp.probability * 100}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-slate-300">{(tp.probability * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Semantic Plausibility vs Exact Correctness Warning Box */}
      <div className="p-4 bg-purple-950/30 border border-purple-500/40 rounded-xl space-y-2 text-xs">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-purple-400" />
          <h5 className="font-semibold text-purple-200">
            Research Insight: Why Semantic Plausibility ≠ Exact Correctness
          </h5>
        </div>
        <p className="text-slate-300 leading-relaxed">
          If a sensor transmits <code className="text-cyan-300">TEMP=27.4</code> and optical blockage masks the digits, a Transformer can easily predict <code className="text-amber-300">TEMP=21.4</code>. Both strings are perfectly valid English and valid telemetry syntax. A CRC calculated over the original bits cannot certify this reconstruction because the bits changed! This is why SemLiFi introduces the <strong>Confidence-Gated Fallback Protocol (CGFP)</strong>: never deliver guesses when confidence falls below the calibrated safety threshold $\tau^* = 0.80$.
        </p>
      </div>
    </div>
  );
};

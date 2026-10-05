import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Sliders, 
  Sparkles,
  Zap,
  Activity,
  Layers,
  Check,
  Clock
} from 'lucide-react';
import { PipelineRunResult } from '../types/semlifi';
import { api } from '../services/api';

export const SimulationLabView: React.FC = () => {
  const [payloadInput, setPayloadInput] = useState('TEMP=27.4,HUM=61,MOTOR=ON');
  const [sequenceId, setSequenceId] = useState(1);
  const [injectBurst, setInjectBurst] = useState(true);
  const [burstDuration, setBurstDuration] = useState(30.0);
  const [forceLowConf, setForceLowConf] = useState(false);
  const [threshold, setThreshold] = useState(0.80);

  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(-1);
  const [pipelineResult, setPipelineResult] = useState<PipelineRunResult | null>(null);

  // Simulation Preset Scenarios
  const loadScenario = (scenario: string) => {
    switch (scenario) {
      case 'CLEAN':
        setPayloadInput('TEMP=27.4,HUM=61,MOTOR=ON');
        setInjectBurst(false);
        setBurstDuration(0);
        setForceLowConf(false);
        break;
      case 'SHORT_BURST':
        setPayloadInput('TEMP=27.4,HUM=61,MOTOR=ON');
        setInjectBurst(true);
        setBurstDuration(25.0); // P1
        setForceLowConf(false);
        break;
      case 'LONG_BURST':
        setPayloadInput('TEMP=34.0,HUM=60,MOTOR=ON');
        setInjectBurst(true);
        setBurstDuration(220.0); // P2
        setForceLowConf(false);
        break;
      case 'LOW_CONF':
        setPayloadInput('Battery level is 78% and voltage is 3.9V.');
        setInjectBurst(true);
        setBurstDuration(40.0);
        setForceLowConf(true); // forces C < 0.80
        break;
      case 'FALLBACK':
        setPayloadInput('DEVICE=04,TEMP=26.8,STATUS=ACTIVE');
        setInjectBurst(true);
        setBurstDuration(180.0);
        setForceLowConf(true);
        break;
      default:
        break;
    }
  };

  const handleStartSimulation = async () => {
    setIsRunning(true);
    setCurrentStepIndex(0);
    setPipelineResult(null);

    try {
      const res = await api.runPipeline({
        payload: payloadInput,
        sequence_id: sequenceId,
        inject_burst: injectBurst,
        burst_duration_ms: burstDuration,
        force_low_confidence: forceLowConf,
        threshold: threshold,
      });

      // Animate through all 22 steps sequentially
      for (let i = 0; i < res.pipeline_steps.length; i++) {
        setCurrentStepIndex(i);
        await new Promise((resolve) => setTimeout(resolve, 80));
      }

      setPipelineResult(res);
      setSequenceId((prev) => (prev % 255) + 1);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">22-Step End-to-End Simulation Lab</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Step-by-step physical and semantic execution pipeline from application telemetry to confidence-gated delivery
          </p>
        </div>

        <button
          onClick={handleStartSimulation}
          disabled={isRunning}
          className="flex items-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{isRunning ? 'SIMULATING PIPELINE...' : 'START SIMULATION'}</span>
        </button>
      </div>

      {/* Preset Scenarios Selector */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xl space-y-2">
        <span className="text-xs text-slate-400 uppercase font-mono font-bold block">
          Preset Simulation Scenarios:
        </span>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'CLEAN', label: '1. Clean Link (No Burst)' },
            { id: 'SHORT_BURST', label: '2. P1 Short Burst (25ms)' },
            { id: 'LONG_BURST', label: '3. P2 Long Burst (220ms)' },
            { id: 'LOW_CONF', label: '4. Low Confidence (C < 0.80)' },
            { id: 'FALLBACK', label: '5. Fallback / Selective ARQ' },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => loadScenario(s.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Parameters Panel */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 space-y-1">
          <label className="text-xs text-slate-400 block font-medium">Input Telemetry Payload:</label>
          <input
            type="text"
            value={payloadInput}
            onChange={(e) => setPayloadInput(e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs font-mono text-cyan-300"
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium">Burst Occlusion:</span>
            <span className="font-mono text-amber-400 font-bold">{injectBurst ? `${burstDuration.toFixed(0)} ms` : 'Disabled'}</span>
          </div>
          <div className="flex items-center space-x-2 pt-1">
            <button
              onClick={() => setInjectBurst(!injectBurst)}
              className={`px-3 py-1 rounded text-xs font-bold transition ${
                injectBurst ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {injectBurst ? 'OCCLUSION ACTIVE' : 'CLEAN'}
            </button>
            {injectBurst && (
              <input
                type="range"
                min="15"
                max="350"
                step="5"
                value={burstDuration}
                onChange={(e) => setBurstDuration(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400 font-medium">Threshold τ*:</span>
            <span className="font-mono text-purple-400 font-bold">{threshold.toFixed(2)}</span>
          </div>
          <input
            type="range"
            min="0.50"
            max="0.95"
            step="0.05"
            value={threshold}
            onChange={(e) => setThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 mt-2"
          />
        </div>
      </div>

      {/* 22-Step Pipeline Progress List */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Pipeline Execution Steps (1 through 22)
          </h4>
          <span className="text-xs font-mono text-cyan-400">
            {pipelineResult ? 'Execution Complete' : isRunning ? `Running Step ${currentStepIndex + 1} of 22` : 'Ready to Run'}
          </span>
        </div>

        {pipelineResult ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[440px] overflow-y-auto pr-1">
            {pipelineResult.pipeline_steps.map((st) => (
              <div
                key={st.step}
                className={`p-2.5 rounded-lg border text-xs flex items-start space-x-2.5 transition ${
                  st.status === 'COMPLETED'
                    ? 'bg-slate-900/80 border-slate-800 text-slate-300'
                    : st.status === 'ERROR'
                    ? 'bg-rose-950/30 border-rose-800 text-rose-300'
                    : 'bg-slate-900/30 border-slate-850 text-slate-500'
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {st.status === 'COMPLETED' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  ) : st.status === 'ERROR' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-slate-600 block" />
                  )}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white font-mono">
                      Step {st.step}: {st.name}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                      {st.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate">{st.detail}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            Click <strong>&quot;START SIMULATION&quot;</strong> above to execute all 22 physical, encoding, optical, and semantic steps.
          </div>
        )}

        {/* Final Pipeline Summary Result */}
        {pipelineResult && (
          <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">Delivered Payload:</span>
              <span className="text-cyan-300 font-bold font-mono text-sm block mt-0.5 truncate">
                {pipelineResult.final_payload}
              </span>
              <span className={pipelineResult.is_exact_match ? 'text-emerald-400 text-[10px]' : 'text-rose-400 text-[10px]'}>
                {pipelineResult.is_exact_match ? '✓ Bit-Level Exact Match' : '⚠ Semantic Approximation'}
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">End-to-End Latency:</span>
              <span className="text-white font-bold font-mono text-sm block mt-0.5">
                {pipelineResult.transit_latency_ms} ms
              </span>
              <span className="text-slate-400 text-[10px]">
                {pipelineResult.cgfp_result?.decision === 'ACCEPT' ? 'Semantic patch accepted' : 'Exact retransmission used'}
              </span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-500 block text-[10px]">CGFP Safety Gate:</span>
              <span className={`font-bold font-mono text-sm block mt-0.5 ${
                pipelineResult.cgfp_result?.decision === 'ACCEPT' ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {pipelineResult.cgfp_result ? pipelineResult.cgfp_result.decision : 'CLEAN BYPASS'}
              </span>
              <span className="text-slate-400 text-[10px]">
                {pipelineResult.cgfp_result ? `Score C = ${pipelineResult.cgfp_result.confidence_score.toFixed(3)}` : 'Clean link delivered'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

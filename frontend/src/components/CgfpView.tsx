import React, { useState, useEffect } from 'react';
import { 
  Gauge, 
  ShieldCheck, 
  ShieldAlert, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ArrowRight, 
  Sparkles,
  RefreshCw,
  Send
} from 'lucide-react';
import { CGFPResult } from '../types/semlifi';
import { api } from '../services/api';

export const CgfpView: React.FC = () => {
  const [tokenConf, setTokenConf] = useState<number>(0.93);
  const [burstSpan, setBurstSpan] = useState<number>(4);
  const [threshold, setThreshold] = useState<number>(0.80);
  const [alpha, setAlpha] = useState<number>(0.50);
  const [gamma, setGamma] = useState<number>(1.15);
  const [reconstructedText, setReconstructedText] = useState<string>('TEMP=27.4,HUM=61,MOTOR=ON');
  const [evalResult, setEvalResult] = useState<CGFPResult | null>(null);

  const handleEvaluate = async () => {
    try {
      const res = await api.evaluateCgfp({
        reconstructed_text: reconstructedText,
        token_confidence: tokenConf,
        burst_span_bytes: burstSpan,
        threshold: threshold,
        alpha: alpha,
        gamma: gamma,
      });
      setEvalResult(res);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    handleEvaluate();
  }, [tokenConf, burstSpan, threshold, alpha, gamma, reconstructedText]);

  // Load illustrative paper decision (Section VI-D)
  const loadPaperExample = () => {
    setTokenConf(0.93);
    setBurstSpan(5);
    setThreshold(0.80);
    setReconstructedText('TEMP=27.4,HUM=61,MOTOR=ON');
  };

  const loadSyntaxFailure = () => {
    setTokenConf(0.99);
    setBurstSpan(2);
    setReconstructedText('TEMP=INVALID_VAL,HUM,MOTOR');
  };

  const scorePct = evalResult ? evalResult.confidence_score * 100 : 0;
  const isAccepted = evalResult?.decision === 'ACCEPT';

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white">CGFP: Confidence-Gated Fallback Protocol Engine</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mathematical decision gate: <code className="text-cyan-300 font-mono">C = C_token · C_phys · Penalty_burst(span) · S_syntax</code> (Threshold τ* = 0.80)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={loadPaperExample}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-cyan-300 rounded-lg border border-slate-700 transition"
          >
            Load Paper Example (Sec VI-D)
          </button>
          <button
            onClick={loadSyntaxFailure}
            className="px-3 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-xs font-mono text-rose-300 rounded-lg border border-rose-800 transition"
          >
            Syntax Failure Test
          </button>
        </div>
      </div>

      {/* Main Grid: Interactive Parameters vs Decision Gauge */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input Factors & Sliders */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Confidence Gate Input Factors
          </h4>

          {/* Factor 1: Model Confidence C_token */}
          <div className="space-y-1 p-3 bg-slate-900/70 rounded-lg border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">1. Token Prediction Confidence (C_token):</span>
              <span className="font-mono text-cyan-400 font-bold">{(tokenConf * 100).toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.01"
              value={tokenConf}
              onChange={(e) => setTokenConf(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          {/* Factor 2: Burst Span (Penalty) */}
          <div className="space-y-1 p-3 bg-slate-900/70 rounded-lg border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">2. Burst Span / Severity (Affected Bytes):</span>
              <span className="font-mono text-amber-400 font-bold">{burstSpan} bytes lost</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={burstSpan}
              onChange={(e) => setBurstSpan(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Penalty: {evalResult?.burst_penalty.toFixed(3) || '0.950'}</span>
              <span>(α = {alpha}, γ = {gamma})</span>
            </div>
          </div>

          {/* Factor 3: Decision Threshold tau* */}
          <div className="space-y-1 p-3 bg-slate-900/70 rounded-lg border border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 font-medium">3. Calibrated Threshold (τ*):</span>
              <span className="font-mono text-purple-400 font-bold">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.95"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <span className="text-[10px] text-slate-500 font-mono block">Paper reported operating point: τ* = 0.80</span>
          </div>

          {/* Factor 4: Syntax / Format Validity */}
          <div className="space-y-1 p-3 bg-slate-900/70 rounded-lg border border-slate-800">
            <label className="text-xs text-slate-300 font-medium block">4. Reconstructed Text for Syntax Check (S_syntax):</label>
            <input
              type="text"
              value={reconstructedText}
              onChange={(e) => setReconstructedText(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <div className="flex items-center space-x-2 pt-1">
              <span className={`w-2 h-2 rounded-full ${evalResult?.syntax_valid ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span className="text-[11px] font-mono text-slate-400">
                S_syntax: {evalResult?.syntax_valid ? '1 (Syntactically Valid)' : '0 (Hard Structural Invalidity)'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Decision Gauge & Action Card */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between items-center text-center">
          <div className="w-full">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono mb-4">
              Real-Time CGFP Decision Output
            </h4>

            {/* Circular Gauge Representation */}
            <div className="relative w-56 h-32 mx-auto overflow-hidden">
              <div className="w-56 h-56 rounded-full border-[14px] border-slate-800 border-b-transparent border-l-transparent -rotate-45" />
              {/* Threshold Marker Indicator */}
              <div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ transform: `rotate(${(threshold * 180) - 90}deg)` }}
              >
                <div className="w-1 h-20 bg-purple-400 opacity-80" />
              </div>
              {/* Center Needle & Text */}
              <div className="absolute bottom-2 inset-x-0 text-center">
                <span className="text-3xl font-mono font-extrabold text-white block">
                  {evalResult ? evalResult.confidence_score.toFixed(3) : '0.000'}
                </span>
                <span className="text-[11px] font-mono text-slate-400">Combined Score (C)</span>
              </div>
            </div>

            {/* Decision Status Box */}
            <div className={`mt-6 p-4 rounded-xl border text-center transition-all ${
              isAccepted
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-emerald-900/20'
                : 'bg-rose-950/40 border-rose-500/50 shadow-rose-900/20'
            }`}>
              <div className="flex items-center justify-center space-x-2">
                {isAccepted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span className={`text-base font-bold ${isAccepted ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {evalResult?.decision === 'ACCEPT' ? 'ACCEPT RECONSTRUCTED SEGMENT' : 'INVOKE SELECTIVE EXACT FALLBACK'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
                {evalResult?.decision_reason}
              </p>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-slate-800/80 mt-4 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>Threshold τ* = {threshold.toFixed(2)}</span>
            <span>Retransmission: {evalResult?.retransmission_avoided ? 'AVOIDED (Saved ~769ms)' : 'REQUESTED (NACK)'}</span>
          </div>
        </div>
      </div>

      {/* Fallback Flowchart (Section 13) */}
      <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          Architecture Distinction: Semantic Recovery + Exact Fallback
        </h4>
        <p className="text-xs text-slate-400">
          SemLiFi is <strong>NOT</strong> &quot;Semantic Recovery instead of Exact Recovery&quot;. It is an intelligent acceleration layer: if confidence is high, save bandwidth and latency; if marginal or low, guarantee bit-level exactness via selective ARQ.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
            BASR Candidate
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded bg-slate-900 text-purple-300 border border-slate-800">
            CGFP Decision
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded bg-rose-950/60 text-rose-300 border border-rose-800">
            Low Conf (C &lt; 0.80)
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded bg-slate-900 text-amber-300 border border-slate-800">
            Back-Channel NACK
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded bg-slate-900 text-blue-300 border border-slate-800">
            Selective Retransmit
          </span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
          <span className="px-3 py-1.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-bold">
            Exact CRC Payload
          </span>
        </div>
      </div>
    </div>
  );
};

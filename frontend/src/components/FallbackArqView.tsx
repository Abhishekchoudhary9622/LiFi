import React, { useState } from 'react';
import { 
  RotateCcw, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Radio, 
  Layers, 
  Cpu, 
  Send,
  Zap,
  Play
} from 'lucide-react';

export const FallbackArqView: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  const steps = [
    {
      title: '1. Burst Loss Detection & Surviving Context',
      desc: 'Receiver detects contiguous burst gap TB. Extracts surviving prefix context & suffix context.',
      badge: 'Physical Layer',
      color: 'border-blue-500/40 text-blue-300'
    },
    {
      title: '2. BASR Semantic Reconstruction',
      desc: 'Edge-constrained Transformer infers missing tokens with token probabilities and entropy.',
      badge: 'AI Layer (74k Params)',
      color: 'border-purple-500/40 text-purple-300'
    },
    {
      title: '3. CGFP Confidence Decision Gate',
      desc: 'Evaluates score C = C_token · C_phys · Penalty_burst · S_syntax against safety threshold τ* = 0.80.',
      badge: 'Safety Gate',
      color: 'border-amber-500/40 text-amber-300'
    },
    {
      title: '4. Low Confidence Identified (C < 0.80)',
      desc: 'Score is below 0.80 or structural invalidity detected. Semantic candidate is strictly rejected.',
      badge: 'Gate Decision',
      color: 'border-rose-500/40 text-rose-300'
    },
    {
      title: '5. Selective NACK Issued via Return Link',
      desc: 'Receiver issues a selective negative acknowledgment requesting ONLY the missing sequence ID.',
      badge: 'Back-Channel (RF/Reverse LiFi)',
      color: 'border-amber-500/40 text-amber-300'
    },
    {
      title: '6. Sender Retransmits Missing Segment',
      desc: 'Transmitter reads sequence ID from back-channel queue and re-emits the exact missing block.',
      badge: 'Selective ARQ',
      color: 'border-cyan-500/40 text-cyan-300'
    },
    {
      title: '7. CRC-8 Dallas/Maxim Exact Verification',
      desc: 'Receiver validates Dallas polynomial 0x31 on the exact retransmitted payload. Delivery certified.',
      badge: 'Integrity Certified',
      color: 'border-emerald-500/40 text-emerald-300'
    }
  ];

  const runAnimation = async () => {
    setIsSimulating(true);
    for (let i = 0; i < steps.length; i++) {
      setActiveStep(i);
      await new Promise(r => setTimeout(r, 600));
    }
    setIsSimulating(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <RotateCcw className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white">Selective Exact Fallback &amp; Back-Channel ARQ Protocol</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Hybrid Architecture: <strong>Semantic Recovery + Exact Fallback</strong> (Never semantic recovery instead of exact recovery)
          </p>
        </div>

        <button
          onClick={runAnimation}
          disabled={isSimulating}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-lg disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{isSimulating ? 'SIMULATING FALLBACK...' : 'ANIMATE FALLBACK FLOW'}</span>
        </button>
      </div>

      {/* Visual Sequence of the 7 Steps */}
      <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
          End-to-End Fallback State Machine
        </h4>

        <div className="space-y-3">
          {steps.map((st, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-xl border transition-all flex items-start space-x-4 ${
                activeStep === idx
                  ? 'bg-slate-900 border-cyan-500/80 shadow-lg shadow-cyan-950/40 scale-[1.01]'
                  : 'bg-slate-900/40 border-slate-800 text-slate-400'
              }`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 ${
                activeStep === idx ? 'bg-cyan-500 text-slate-950 font-extrabold' : 'bg-slate-800 text-slate-400'
              }`}>
                {idx + 1}
              </div>

              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h5 className={`text-sm font-bold ${activeStep === idx ? 'text-white' : 'text-slate-300'}`}>
                    {st.title}
                  </h5>
                  <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${st.color}`}>
                    {st.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">{st.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Research Clarification Card */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
        <div className="flex items-center space-x-2 text-cyan-400">
          <Layers className="w-4 h-4" />
          <h5 className="text-sm font-semibold text-white">Why Selective Fallback is Essential</h5>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          In mission-critical sensor networks, an erroneous semantic hallucination can be disastrous (e.g. reporting a motor state as ON when it is OFF, or a battery reading of 18% instead of 78%). SemLiFi avoids this completely: if the combined confidence falls below the calibrated bound of $\tau^* = 0.80$, the candidate is instantly rejected and an exact selective retransmission occurs. In the 15-frame live hardware run reported in Table VII, all low-confidence predictions were conservatively rejected and routed to exact retransmission, proving zero accepted errors ($0.00\%$ UFER).
        </p>
      </div>
    </div>
  );
};

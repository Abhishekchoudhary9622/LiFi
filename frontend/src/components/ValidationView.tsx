import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Zap,
  ArrowRight,
  ExternalLink,
  Info
} from 'lucide-react';
import { ValidationResult, ActiveSection } from '../types/circuit';

interface ValidationViewProps {
  validation: ValidationResult;
  onNavigateToBuild: () => void;
  onHighlightComponent?: (compId: string) => void;
}

export const ValidationView: React.FC<ValidationViewProps> = ({
  validation,
  onNavigateToBuild,
  onHighlightComponent
}) => {
  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d16] font-mono text-slate-200 select-none overflow-y-auto">
      {/* Top Banner */}
      <div className="p-4 bg-[#0c1220] border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <div>
            <h1 className="text-base font-bold text-white tracking-wide">
              Circuit Test & Electrical Rule Validation (DRC)
            </h1>
            <p className="text-xs text-slate-400">
              Automated Design Rule Checking, overvoltage inspection, and educational circuit diagnostics
            </p>
          </div>
        </div>

        <button
          onClick={onNavigateToBuild}
          className="flex items-center space-x-2 px-3 py-1.5 bg-[#111827] hover:bg-[#1e293b] text-cyan-300 border border-cyan-800 rounded text-xs transition-colors"
        >
          <span>Return to Build Canvas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">
        {/* Overall Status Card */}
        <div className={`p-6 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          validation.valid
            ? 'bg-emerald-950/20 border-emerald-800/80 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
            : 'bg-rose-950/30 border-rose-800/80 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
        }`}>
          <div className="flex items-center space-x-4">
            {validation.valid ? (
              <div className="w-12 h-12 rounded-full bg-emerald-900/60 border border-emerald-500 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-rose-900/60 border border-rose-500 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-7 h-7 text-rose-400" />
              </div>
            )}
            <div>
              <div className="text-xl font-bold text-white flex items-center space-x-2">
                <span>{validation.valid ? 'CIRCUIT VALID' : 'CIRCUIT HAS ERRORS'}</span>
                <span className={`text-xs px-2 py-0.5 rounded font-mono ${
                  validation.valid ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                }`}>
                  DRC Score: {validation.score}%
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {validation.valid
                  ? 'All 11 design rules verified. The circuit is safe to power on and simulate optical communication.'
                  : 'Design rule violations detected. Resolve all critical short-circuits and floating pins before hardware fabrication.'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-white">
              {validation.passedChecks} / {validation.totalChecks}
            </div>
            <div className="text-xs text-slate-400">Rules Passed</div>
          </div>
        </div>

        {/* Detailed Design Rule Checks */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Diagnostic Rule Check Results
          </h2>

          <div className="space-y-3">
            {validation.rules.map((rule) => {
              const isPass = rule.status === 'pass';
              const isWarning = rule.status === 'warning';
              const isError = rule.status === 'error';

              return (
                <div
                  key={rule.id}
                  className={`p-4 rounded border transition-all ${
                    isPass
                      ? 'bg-[#111827] border-[#1f293d]'
                      : isWarning
                      ? 'bg-amber-950/20 border-amber-800'
                      : 'bg-rose-950/20 border-rose-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      {isPass ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                      )}

                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-white">{rule.title}</span>
                          <span className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${
                            isPass
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              : isWarning
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-rose-950 text-rose-300 border border-rose-800'
                          }`}>
                            {rule.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {rule.description}
                        </p>

                        {rule.recommendation && (
                          <div className="mt-2.5 p-2 bg-[#0a0e17] rounded border border-slate-800 text-xs text-cyan-300 flex items-start space-x-2">
                            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                            <div>
                              <strong>Engineering Recommendation:</strong> {rule.recommendation}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {!isPass && (
                      <button
                        onClick={onNavigateToBuild}
                        className="px-3 py-1 bg-[#1e293b] hover:bg-[#334155] text-cyan-300 rounded text-xs transition-colors shrink-0 ml-4"
                      >
                        Locate Problem
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Educational Reference on Physical Faults */}
        <div className="bg-[#111827] border border-[#1f293d] rounded p-5 space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>Common Embedded & LiFi Physical Failure Modes Guide</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 space-y-1">
              <div className="font-bold text-rose-400">GPIO Thermal Runaway</div>
              <p className="text-slate-400 text-[11px]">
                Driving an 850nm LED without a 220Ω series resistor causes excessive forward current ({'>'}40mA), heating the bonding wire and damaging the STM32 GPIO push-pull stage.
              </p>
            </div>
            <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 space-y-1">
              <div className="font-bold text-amber-400">Floating High-Impedance ADC</div>
              <p className="text-slate-400 text-[11px]">
                Leaving PA1 (ADC1) unconnected leaves the internal sample-and-hold capacitor vulnerable to EMI/RFI noise pickup, generating random spurious bits.
              </p>
            </div>
            <div className="p-3 bg-[#0a0e17] rounded border border-slate-800 space-y-1">
              <div className="font-bold text-cyan-400">Optical Alignment Loss</div>
              <p className="text-slate-400 text-[11px]">
                Lambertian optical beam divergence decreases collected power with $1/d^2$. Misaligning emitter and photodetector cones drops the SNR below the 12 dB threshold.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

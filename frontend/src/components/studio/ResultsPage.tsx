import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  ShieldCheck,
  Zap,
  Radio,
  Sliders,
  RefreshCw,
  Info,
  Play,
  Database,
  Layers,
  ArrowUpRight,
  AlertTriangle,
  FileSpreadsheet,
  Cpu,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Eye,
  Shuffle,
  Copy,
  Check,
  Calculator,
  Award,
  BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import { ExperimentMetrics } from '../../types/semlifi';
import { SharedExperimentResult } from '../../model/experimentModel';
import {
  ComparativeLabConfig,
  ComparativeLabResult,
  ComparativeSchemeMetric,
  SchemeId,
  runComparativeEvaluation,
  exportComparativeResultsCSV,
  exportComparativeResultsJSON,
  PUBLISHED_RESEARCH_BASELINES,
  STANDARD_TELEMETRY_BANK,
  calculateOpticalChannelMetrics
} from '../../model/benchmarkLaboratory';

interface ResultsPageProps {
  onOpenReport?: () => void;
  isDarkMode?: boolean;
  activeExperiment?: SharedExperimentResult;
}

const StatusTag: React.FC<{ status: 'MEASURED' | 'SIMULATED' | 'ESTIMATED' | 'PAPER BENCHMARK' }> = ({ status }) => {
  const styles = {
    MEASURED: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
    SIMULATED: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
    ESTIMATED: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
    'PAPER BENCHMARK': 'bg-purple-950/80 text-purple-300 border-purple-500/50'
  };

  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase tracking-wider ${styles[status]}`}>
      {status}
    </span>
  );
};

export const ResultsPage: React.FC<ResultsPageProps> = ({ onOpenReport, isDarkMode = true, activeExperiment }) => {
  // Navigation / View Tabs: Research Novelty (Project Defense) set as primary!
  const [activeTab, setActiveTab] = useState<'RESEARCH_NOVELTY' | 'COMPARATIVE_LAB' | 'PUBLISHED_BENCHMARKS' | 'OPTICAL_CHANNEL' | 'HARDWARE_DEFENSE' | 'ALL_VIEWS'>('RESEARCH_NOVELTY');

  // Interactive CGFP Gate Calculator State
  const [cgfpSimToken, setCgfpSimToken] = useState<number>(0.92);
  const [cgfpSimPhys, setCgfpSimPhys] = useState<number>(0.95);
  const [cgfpSimBurstMs, setCgfpSimBurstMs] = useState<number>(45);
  const [cgfpSimSyntaxValid, setCgfpSimSyntaxValid] = useState<boolean>(true);
  const [cgfpSimTau, setCgfpSimTau] = useState<number>(0.80);
  const [copiedLatex, setCopiedLatex] = useState<boolean>(false);

  // Dynamic formula calculation for CGFP confidence score
  const cgfpBurstPenalty = Math.max(0.2, 1.0 - (cgfpSimBurstMs / 200));
  const cgfpCalculatedScore = Number((cgfpSimToken * cgfpSimPhys * cgfpBurstPenalty * (cgfpSimSyntaxValid ? 1.0 : 0.0)).toFixed(3));
  const cgfpDecision = cgfpCalculatedScore >= cgfpSimTau ? 'ACCEPT' : 'FALLBACK_ARQ';

  // =========================================================================
  // 1. COMPARATIVE BENCHMARK LABORATORY STATE (Part 6 Brief)
  // =========================================================================
  const [labConfig, setLabConfig] = useState<ComparativeLabConfig>({
    seed: 42,
    num_frames: 50,
    burst_probability: 0.40,
    burst_profile: 'P2',
    distance_cm: 20,
    ambient_light_lux: 250,
    tau_threshold: 0.80,
    payload_template: 'DEVICE=04;TEMP=23.4C;MOTOR=ON;'
  });

  const [labResult, setLabResult] = useState<ComparativeLabResult>(() => runComparativeEvaluation({
    seed: 42,
    num_frames: 50,
    burst_probability: 0.40,
    burst_profile: 'P2',
    distance_cm: 20,
    ambient_light_lux: 250,
    tau_threshold: 0.80,
    payload_template: 'DEVICE=04;TEMP=23.4C;MOTOR=ON;'
  }));

  // Generates publication-ready IEEE/ACM LaTeX table snippet
  const generateLatexTable = useCallback(() => {
    return `% SemLiFi Benchmark Results Table (IEEE/ACM Format)
\\begin{table}[htbp]
\\centering
\\caption{Comparative Performance of SemLiFi vs. Traditional Schemes under Optical Burst Occlusions (PRNG Seed: ${labResult.config.seed}, $N=${labResult.config.num_frames}$ frames, Profile: ${labResult.config.burst_profile})}
\\label{tab:semlifi_comparative}
\\resizebox{\\columnwidth}{!}{%
\\begin{tabular}{lcccccc}
\\hline
\\textbf{Scheme} & \\textbf{PDR (\\%)} & \\textbf{Exact Rec (\\%)} & \\textbf{Sem Acc (\\%)} & \\textbf{UFER (\\%)} & \\textbf{Latency (ms)} & \\textbf{Saved TX (\\%)} \\\\
\\hline
Raw Reception & ${labResult.schemes.raw.pdr_pct.toFixed(1)} & ${labResult.schemes.raw.exact_recovery_pct.toFixed(1)} & ${labResult.schemes.raw.semantic_reconstruction_accuracy_pct.toFixed(1)} & ${labResult.schemes.raw.false_recovery_rate_pct.toFixed(2)} & ${labResult.schemes.raw.mean_latency_ms.toFixed(1)} & ${labResult.schemes.raw.retransmissions_avoided_pct.toFixed(1)} \\\\
RS(33,25) FEC & ${labResult.schemes.rs_fec.pdr_pct.toFixed(1)} & ${labResult.schemes.rs_fec.exact_recovery_pct.toFixed(1)} & ${labResult.schemes.rs_fec.semantic_reconstruction_accuracy_pct.toFixed(1)} & ${labResult.schemes.rs_fec.false_recovery_rate_pct.toFixed(2)} & ${labResult.schemes.rs_fec.mean_latency_ms.toFixed(1)} & ${labResult.schemes.rs_fec.retransmissions_avoided_pct.toFixed(1)} \\\\
Stop-and-Wait ARQ & ${labResult.schemes.arq.pdr_pct.toFixed(1)} & ${labResult.schemes.arq.exact_recovery_pct.toFixed(1)} & ${labResult.schemes.arq.semantic_reconstruction_accuracy_pct.toFixed(1)} & ${labResult.schemes.arq.false_recovery_rate_pct.toFixed(2)} & ${labResult.schemes.arq.mean_latency_ms.toFixed(1)} & ${labResult.schemes.arq.retransmissions_avoided_pct.toFixed(1)} \\\\
BASR Only (No Gate) & ${labResult.schemes.basr.pdr_pct.toFixed(1)} & ${labResult.schemes.basr.exact_recovery_pct.toFixed(1)} & ${labResult.schemes.basr.semantic_reconstruction_accuracy_pct.toFixed(1)} & ${labResult.schemes.basr.false_recovery_rate_pct.toFixed(2)} & ${labResult.schemes.basr.mean_latency_ms.toFixed(1)} & ${labResult.schemes.basr.retransmissions_avoided_pct.toFixed(1)} \\\\
\\textbf{SemLiFi (Proposed)} & \\textbf{${labResult.schemes.semlifi.pdr_pct.toFixed(1)}} & \\textbf{${labResult.schemes.semlifi.exact_recovery_pct.toFixed(1)}} & \\textbf{${labResult.schemes.semlifi.semantic_reconstruction_accuracy_pct.toFixed(1)}} & \\textbf{${labResult.schemes.semlifi.false_recovery_rate_pct.toFixed(2)}} & \\textbf{${labResult.schemes.semlifi.mean_latency_ms.toFixed(1)}} & \\textbf{${labResult.schemes.semlifi.retransmissions_avoided_pct.toFixed(1)}} \\\\
\\hline
\\end{tabular}%
}
\\end{table}`;
  }, [labResult]);

  const handleCopyLatex = useCallback(() => {
    try {
      navigator.clipboard.writeText(generateLatexTable());
      setCopiedLatex(true);
      setTimeout(() => setCopiedLatex(false), 3000);
    } catch {
      // Fallback
    }
  }, [generateLatexTable]);

  const [isExecutingLab, setIsExecutingLab] = useState<boolean>(false);
  const [showFrameInspector, setShowFrameInspector] = useState<boolean>(false);
  const [labToast, setLabToast] = useState<string | null>(null);

  // Optical physics calculation for Distance vs Irradiance section
  const [distance, setDistance] = useState<number>(20); // cm
  const [ambientLightLux, setAmbientLightLux] = useState<number>(250); // Lux

  const opticalSNR = Math.max(8.0, Number((42.5 - 20 * Math.log10(distance / 15) - (ambientLightLux / 400)).toFixed(1)));

  // Lab test points for Distance vs Optical Irradiance
  const testPoints = [
    { dist: 10, irradiance: 92, ber: 0.0, snr: 38.5, status: 'MEASURED' },
    { dist: 15, irradiance: 78, ber: 0.0, snr: 34.2, status: 'MEASURED' },
    { dist: 20, irradiance: 54, ber: 0.0, snr: 28.6, status: 'MEASURED' },
    { dist: 25, irradiance: 36, ber: 0.0001, snr: 22.4, status: 'MEASURED' },
    { dist: 30, irradiance: 22, ber: 0.0035, snr: 16.1, status: 'MEASURED' },
    { dist: 35, irradiance: 14, ber: 0.0120, snr: 11.2, status: 'MEASURED' },
    { dist: 40, irradiance: 9, ber: 0.0450, snr: 7.8, status: 'ESTIMATED' }
  ];

  // Execute synchronized fair comparative trial across all 5 schemes
  const handleRunComparativeTrial = () => {
    setIsExecutingLab(true);
    setLabToast(null);

    // Brief animation frame for realistic UI feedback
    setTimeout(() => {
      const result = runComparativeEvaluation(labConfig);
      setLabResult(result);
      setIsExecutingLab(false);
      setLabToast(`Fair Comparative Benchmark Completed: Seed ${labConfig.seed} (${labConfig.num_frames} frames, ${labConfig.burst_profile} profile)`);
      setTimeout(() => setLabToast(null), 4000);
    }, 250);
  };

  // Randomize Seed
  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(Math.random() * 90000) + 1000;
    setLabConfig((prev) => ({ ...prev, seed: newSeed }));
  };

  // Reset to Seed 42 (Standard Reference Seed)
  const handleResetSeed = () => {
    setLabConfig((prev) => ({ ...prev, seed: 42 }));
  };

  // Export CSV of Comparative Lab
  const handleExportComparativeCSV = () => {
    const csvContent = exportComparativeResultsCSV(labResult);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SemLiFi_Comparative_Benchmark_Seed_${labResult.config.seed}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export JSON of Comparative Lab
  const handleExportComparativeJSON = () => {
    const jsonStr = exportComparativeResultsJSON(labResult);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SemLiFi_Comparative_Benchmark_Seed_${labResult.config.seed}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Scheme list for ordered rendering
  const schemeOrder: SchemeId[] = ['raw', 'rs_fec', 'arq', 'basr', 'semlifi'];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-y-auto text-slate-100 font-sans">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & PROVENANCE BAR                            */}
      {/* ========================================================= */}
      <div className="px-6 py-4 border-b border-[#1f293d] bg-[#0c1220]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky top-0 z-20">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-lg font-semibold tracking-wide text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              Experimental Benchmarks &amp; Comparative Laboratory
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-700/50">
              Part 6 Brief • Tables IV–VII
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded border font-bold bg-emerald-950/80 text-emerald-300 border-emerald-500/50">
              5 SCHEMES • SEEDED PRNG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Fair cross-layer evaluation: Raw Reception, RS(33,25) FEC, Stop-and-Wait ARQ, BASR, and SemLiFi (BASR + CGFP).
          </p>
        </div>

        {/* Action Controls: Copy LaTeX, Export CSV/JSON & Report */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyLatex}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#006067]/20 hover:bg-[#006067] border border-[#006067]/60 text-xs font-mono font-medium text-cyan-300 hover:text-white transition shadow-sm"
            title="Copy publication-ready LaTeX table snippet for thesis or paper"
          >
            {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{copiedLatex ? 'LaTeX Copied!' : 'Copy LaTeX Table'}</span>
          </button>

          <button
            onClick={handleExportComparativeCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1a253c] border border-slate-700 text-xs font-mono font-medium text-slate-200 transition"
            title="Download comparative multi-scheme metrics as CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportComparativeJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] hover:bg-[#1a253c] border border-slate-700 text-xs font-mono font-medium text-slate-200 transition"
            title="Download comparative multi-scheme metrics as JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export JSON</span>
          </button>

          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-mono font-medium text-white shadow-md transition"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Engineering Report</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="px-6 py-2.5 bg-[#090f1d] border-b border-[#172338] flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="text-slate-500 text-[11px] uppercase tracking-wider mr-1">View Modules:</span>
        {[
          { id: 'RESEARCH_NOVELTY', label: '1. Research Novelty & Academic Defense (Key Contributions)', icon: Award },
          { id: 'COMPARATIVE_LAB', label: '2. Multi-Scheme Comparison Lab (Part 6)', icon: Layers },
          { id: 'PUBLISHED_BENCHMARKS', label: '3. Published Paper Baselines (Tables IV–VII)', icon: Database },
          { id: 'OPTICAL_CHANNEL', label: '4. Distance vs Irradiance Graph', icon: BarChart3 },
          { id: 'HARDWARE_DEFENSE', label: '5. Hardware Setup & Viva Defense', icon: ShieldCheck },
          { id: 'ALL_VIEWS', label: '6. All Views (Full Dashboard)', icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition ${
                isActive
                  ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                  : 'bg-[#0c1322] border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-[#121c33]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-current" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Toast Feedback */}
      {labToast && (
        <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-950/90 border border-emerald-600 text-emerald-200 text-xs font-mono flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{labToast}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* ========================================================= */}
        {/* UNIFIED EXPERIMENT RECORD HUD (Part 3 & Part 4 Brief)    */}
        {/* ========================================================= */}
        {activeExperiment && (
          <div className="p-5 rounded-2xl border border-cyan-500/40 bg-[#091224] shadow-lg space-y-4 font-mono text-xs animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-cyan-500/20 gap-2">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white tracking-wide">ACTIVE UNIFIED EXPERIMENT RECORD</span>
                <span className="text-cyan-400 font-bold px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[11px]">
                  {activeExperiment.experiment_id}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 text-[10px]">TIMESTAMP: {activeExperiment.timestamp}</span>
                <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase">
                  {activeExperiment.mode}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">ORIGINAL PAYLOAD</span>
                <span className="font-bold text-white truncate block mt-0.5" title={activeExperiment.original_payload}>
                  {activeExperiment.original_payload}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">DELIVERY STATUS</span>
                <span className={`font-bold mt-0.5 block ${
                  activeExperiment.packet_delivery_status === 'DELIVERED_CLEAN'
                    ? 'text-emerald-400'
                    : activeExperiment.packet_delivery_status === 'RECOVERED_SEMANTIC'
                    ? 'text-cyan-400'
                    : activeExperiment.packet_delivery_status === 'FALLBACK_EXACT_ARQ'
                    ? 'text-amber-400'
                    : 'text-rose-400'
                }`}>
                  {activeExperiment.packet_delivery_status}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CGFP DECISION</span>
                <span className={`font-bold mt-0.5 block ${
                  activeExperiment.cgfp_decision === 'ACCEPT' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {activeExperiment.cgfp_decision} (C={activeExperiment.confidence_score?.toFixed(3) ?? '0.00'})
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CRC-8 STATUS</span>
                <span className={`font-bold mt-0.5 block ${
                  activeExperiment.crc_status === 'PASS' ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {activeExperiment.crc_status} (0x{activeExperiment.calculated_crc.toString(16).toUpperCase().padStart(2, '0')})
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">END-TO-END LATENCY</span>
                <span className="font-bold text-white mt-0.5 block">
                  {activeExperiment.latency_ms} ms
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#060b17] border border-slate-800">
                <span className="text-[10px] text-slate-400 block">RETRANSMISSIONS SAVED</span>
                <span className="font-bold text-emerald-400 mt-0.5 block">
                  {activeExperiment.retransmissions_saved} Saved
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
              <span>
                <strong>Research Metric Isolation:</strong> Exact Recon: 42.63% • Task Field: 100.0% • Patch Precision: 96.8% • False Recovery: 1.2%
              </span>
              <span className="text-cyan-400 font-semibold">
                Optical Link: {activeExperiment.optical_channel_parameters?.distance_cm ?? 15} cm • SNR: {activeExperiment.channel_snr_db} dB • {activeExperiment.servo_angle_deg}° SG90 Flap
              </span>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 1: COMPARATIVE BENCHMARK LABORATORY (Part 6 Brief)       */}
        {/* ================================================================= */}
                {/* ================================================================= */}
        {/* SECTION 0: RESEARCH NOVELTY & ACADEMIC DEFENSE SHOWCASE           */}
        {/* ================================================================= */}
        {(activeTab === 'RESEARCH_NOVELTY' || activeTab === 'ALL_VIEWS') && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Banner: Academic Provenance & Defense Ready */}
            <div className="rounded-2xl border border-cyan-500/40 bg-gradient-to-r from-[#0b162c] via-[#091122] to-[#070d1a] p-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-wrap items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5 text-cyan-400" />
                      Academic Defense &amp; Project Submission Showcase
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-950/70 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-bold">
                      IEEE/ACM LiFi Testbed
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                    SemLiFi: Burst-Aware Semantic Recovery with Confidence-Gated Fallback
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                    A cross-layer optical wireless communication framework that combines edge domain priors with calibrated 4-factor confidence gating (&#964;* = 0.80) to eliminate retransmission storms and protect against semantic hallucinations.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 font-mono text-xs">
                  <button
                    onClick={handleCopyLatex}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#006067] to-[#00838f] hover:from-[#007078] hover:to-[#0097a7] text-white font-bold shadow-lg transition active:scale-95"
                    title="Copy IEEE/ACM LaTeX table for your thesis submission"
                  >
                    {copiedLatex ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4 text-cyan-200" />}
                    <span>{copiedLatex ? 'LaTeX Snippet Copied!' : 'Copy Thesis LaTeX Table'}</span>
                  </button>
                </div>
              </div>

              {/* High-Level Impact Metric Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-slate-800/80 font-mono">
                <div className="p-3 rounded-xl bg-[#060c18]/80 border border-cyan-500/20">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Latency Reduction</span>
                  <span className="text-lg font-extrabold text-cyan-300 mt-0.5 block">89.8% Lower</span>
                  <span className="text-[10px] text-slate-400">1320 ms &rarr; 134.4 ms</span>
                </div>
                <div className="p-3 rounded-xl bg-[#060c18]/80 border border-emerald-500/20">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Retransmission Savings</span>
                  <span className="text-lg font-extrabold text-emerald-400 mt-0.5 block">27.15% Avoided</span>
                  <span className="text-[10px] text-slate-400">Zero duplicate round-trips</span>
                </div>
                <div className="p-3 rounded-xl bg-[#060c18]/80 border border-purple-500/20">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Hallucination Gate</span>
                  <span className="text-lg font-extrabold text-purple-300 mt-0.5 block">0.00% Live UFER</span>
                  <span className="text-[10px] text-slate-400">14.6% un-gated &rarr; 0.00% protected</span>
                </div>
                <div className="p-3 rounded-xl bg-[#060c18]/80 border border-amber-500/20">
                  <span className="text-[10px] text-slate-400 uppercase block font-semibold">Edge Microcontroller</span>
                  <span className="text-lg font-extrabold text-amber-300 mt-0.5 block">&lt;4 kB SRAM</span>
                  <span className="text-[10px] text-slate-400">100% offline dual ESP32</span>
                </div>
              </div>
            </div>

            {/* The 3 Core Research Novelties (Pillar Cards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Novelty 1: BASR */}
              <div className="p-5 rounded-2xl border border-cyan-500/30 bg-[#09101f] shadow-lg flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shadow-sm">
                      <Zap className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                      NOVELTY 1
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Burst-Aware Semantic Recovery (BASR)
                    </h3>
                    <span className="text-[11px] text-cyan-400 font-mono block mt-0.5">
                      Sub-2.5 ms Cross-Layer Packet Patching
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong>The Problem:</strong> Visible light channels suffer from physical line-of-sight occlusions (walking pedestrians, moving machinery). Even 15–40 ms bursts corrupt multiple byte symbols (&gt;4 bytes), defeating Reed-Solomon (33,25) FEC and causing conventional LiFi links to drop the entire frame.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    <strong>The Solution:</strong> BASR introduces domain-specific semantic transition models that infer the corrupted character spans from surrounding syntax frames without requiring the transmitter to re-send.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#060b16] border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Bandwidth Overhead:</span>
                    <strong className="text-emerald-400">0% (Zero extra bits)</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Compute Overhead:</span>
                    <strong className="text-cyan-300">&lt;1.2 ms on ESP32</strong>
                  </div>
                </div>
              </div>

              {/* Novelty 2: CGFP */}
              <div className="p-5 rounded-2xl border border-purple-500/30 bg-[#09101f] shadow-lg flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400 shadow-sm">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                      NOVELTY 2
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Confidence-Gated Fallback Protocol (CGFP)
                    </h3>
                    <span className="text-[11px] text-purple-400 font-mono block mt-0.5">
                      Optimal Threshold &#964;* = 0.80 Gating
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong>The Problem:</strong> Pure semantic AI reconstruction is prone to hallucinations (14.6% to 65% Undetected Frame Error Rate). In industrial LiFi telemetry, a hallucinated command (`MOTOR=ON` instead of `OFF`) causes catastrophic equipment failures.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    <strong>The Solution:</strong> CGFP computes a composite confidence score C = C_token &times; C_phys &times; Penalty_burst &times; S_syntax. Only patches exceeding &#964;* = 0.80 are accepted; uncertain predictions safely fall back to ARQ retransmission.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#060b16] border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Un-gated UFER:</span>
                    <strong className="text-rose-400">14.60% (Unsafe)</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>SemLiFi Gated UFER:</span>
                    <strong className="text-emerald-400">1.20% (0.00% on Hardware)</strong>
                  </div>
                </div>
              </div>

              {/* Novelty 3: Hardware Validation */}
              <div className="p-5 rounded-2xl border border-emerald-500/30 bg-[#09101f] shadow-lg flex flex-col justify-between space-y-4">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="w-9 h-9 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-sm">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      NOVELTY 3
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Real Dual-ESP32 Hardware Testbed
                    </h3>
                    <span className="text-[11px] text-emerald-400 font-mono block mt-0.5">
                      100% Offline Microcontroller Inference
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">
                    <strong>The Problem:</strong> Most semantic communication papers rely solely on PyTorch GPU simulations that ignore hardware parasitics, ADC jitter, and microcontroller memory limits.
                  </p>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    <strong>The Solution:</strong> SemLiFi is physically constructed and validated on dual ESP32-WROOM-32D MCUs at 1000 bps Manchester OOK over a 15 cm optical link with discrete S8050 BJT drivers, BPW34 photodiodes, and LM358 op-amps. Physical occlusions are generated via an SG90 servo motor shutter.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#060b16] border border-slate-800 text-[11px] font-mono space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>Cloud Dependency:</span>
                    <strong className="text-emerald-400">Zero (100% Edge)</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Physical Bursts:</span>
                    <strong className="text-cyan-300">56 Tested &amp; Validated</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive CGFP Mathematical Gate Simulator */}
            <div className="p-6 rounded-2xl border border-cyan-500/30 bg-[#091224] shadow-xl space-y-5">
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
                      Live CGFP Mathematical Gate Simulator
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60 font-semibold">
                        INTERACTIVE FORMULA
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-sans">
                      Test how the 4-factor confidence function evaluates incoming frames against the fallback threshold &#964;.
                    </p>
                  </div>
                </div>

                {/* Live Formula Display */}
                <div className="px-3 py-1.5 rounded-lg bg-[#060b17] border border-cyan-500/40 font-mono text-xs text-cyan-300">
                  <span>C = C_token &times; C_phys &times; Penalty_burst &times; S_syntax</span>
                </div>
              </div>

              {/* Sliders Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
                {/* 1. Token Likelihood */}
                <div className="p-3 rounded-xl bg-[#060c18] border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">1. C_token:</span>
                    <strong className="text-cyan-300">{cgfpSimToken.toFixed(2)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="1.00"
                    step="0.01"
                    value={cgfpSimToken}
                    onChange={(e) => setCgfpSimToken(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">Markov character sequence prior</span>
                </div>

                {/* 2. Physical Channel Likelihood */}
                <div className="p-3 rounded-xl bg-[#060c18] border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">2. C_phys:</span>
                    <strong className="text-blue-300">{cgfpSimPhys.toFixed(2)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="1.00"
                    step="0.01"
                    value={cgfpSimPhys}
                    onChange={(e) => setCgfpSimPhys(Number(e.target.value))}
                    className="w-full accent-blue-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">Optical SNR &amp; distance decay</span>
                </div>

                {/* 3. Burst Occlusion Duration */}
                <div className="p-3 rounded-xl bg-[#060c18] border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">3. Burst (T_burst):</span>
                    <strong className="text-amber-300">{cgfpSimBurstMs} ms</strong>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="180"
                    step="5"
                    value={cgfpSimBurstMs}
                    onChange={(e) => setCgfpSimBurstMs(Number(e.target.value))}
                    className="w-full accent-amber-400 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-500 block">
                    Penalty = max(0.2, 1 - T/200) = {cgfpBurstPenalty.toFixed(2)}
                  </span>
                </div>

                {/* 4. Threshold Tau */}
                <div className="p-3 rounded-xl bg-[#060c18] border border-slate-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Gate Threshold (&#964;):</span>
                    <strong className="text-purple-300">{cgfpSimTau.toFixed(2)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="0.95"
                    step="0.05"
                    value={cgfpSimTau}
                    onChange={(e) => setCgfpSimTau(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate-500">&#964;* = 0.80 Optimal</span>
                    <button
                      onClick={() => setCgfpSimTau(0.80)}
                      className="text-cyan-400 hover:underline"
                    >
                      Reset &#964;*
                    </button>
                  </div>
                </div>
              </div>

              {/* Syntax Conformance Toggle & Live Decision Banner */}
              <div className="p-4 rounded-xl bg-[#060c18] border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={cgfpSimSyntaxValid}
                      onChange={(e) => setCgfpSimSyntaxValid(e.target.checked)}
                      className="w-4 h-4 accent-emerald-500 rounded"
                    />
                    <span className="text-slate-300">
                      S_syntax: Strict Frame Syntax Conformance (`DEVICE=XX;TEMP=...`)
                    </span>
                  </label>
                </div>

                {/* Real-time Verdict */}
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400">Computed Score:</span>
                  <span className="text-base font-extrabold text-cyan-300 font-mono">
                    C = {cgfpCalculatedScore.toFixed(3)}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-lg font-bold text-xs border ${
                      cgfpDecision === 'ACCEPT'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500 shadow-emerald-950/50 shadow-md'
                        : 'bg-amber-950 text-amber-300 border-amber-500 shadow-amber-950/50 shadow-md'
                    }`}
                  >
                    {cgfpDecision === 'ACCEPT' ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ACCEPT (Semantic Recovery &bull; Latency: 2.1 ms)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                        FALLBACK NACK (Trigger Exact ARQ &bull; Latency: 1320 ms)
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Pareto Frontier Table: Why tau = 0.80 is Optimal */}
            <div className="p-5 rounded-2xl border border-[#1b273f] bg-[#09101f] shadow-xl space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  CGFP Threshold (&#964;) Sensitivity &amp; Pareto Frontier Analysis
                </span>
                <span className="text-[11px] text-slate-400">
                  Paper Evaluation Benchmark &bull; 1000 Frame Simulated Sweep
                </span>
              </div>

              <div className="overflow-x-auto border border-slate-800 rounded-xl bg-[#060b17]">
                <table className="w-full text-left">
                  <thead className="bg-[#0b1222] text-slate-400 uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Threshold &#964;</th>
                      <th className="py-2.5 px-3 text-center">Acceptance Rate (%)</th>
                      <th className="py-2.5 px-3 text-center text-emerald-400">Saved Retransmissions (%)</th>
                      <th className="py-2.5 px-3 text-center text-rose-400">Undetected False Recovery (UFER)</th>
                      <th className="py-2.5 px-3 text-center text-cyan-300">Mean Latency (ms)</th>
                      <th className="py-2.5 px-3 text-right">Academic Trade-off Assessment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-[11px]">
                    <tr className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-bold text-slate-300">&#964; = 0.50 (Permissive)</td>
                      <td className="py-2 px-3 text-center">41.2%</td>
                      <td className="py-2 px-3 text-center text-emerald-400 font-bold">34.20%</td>
                      <td className="py-2 px-3 text-center text-rose-400 font-bold">12.40% (High Risk)</td>
                      <td className="py-2 px-3 text-center text-cyan-300">112.4 ms</td>
                      <td className="py-2 px-3 text-right text-rose-400">Unacceptable Hallucination Rate</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-bold text-slate-300">&#964; = 0.70 (Moderate)</td>
                      <td className="py-2 px-3 text-center">36.5%</td>
                      <td className="py-2 px-3 text-center text-emerald-400 font-bold">30.80%</td>
                      <td className="py-2 px-3 text-center text-amber-400 font-bold">4.20%</td>
                      <td className="py-2 px-3 text-center text-cyan-300">128.6 ms</td>
                      <td className="py-2 px-3 text-right text-amber-300">Marginal Cyber-Physical Safety</td>
                    </tr>
                    <tr className="bg-emerald-950/25 border-l-4 border-l-emerald-500 font-bold">
                      <td className="py-2.5 px-3 text-emerald-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        &#964;* = 0.80 (Paper Optimal)
                      </td>
                      <td className="py-2.5 px-3 text-center text-white">32.8%</td>
                      <td className="py-2.5 px-3 text-center text-emerald-400 text-sm">27.15%</td>
                      <td className="py-2.5 px-3 text-center text-emerald-400">1.20% (0.00% Hardware)</td>
                      <td className="py-2.5 px-3 text-center text-cyan-300">134.4 ms</td>
                      <td className="py-2.5 px-3 text-right text-emerald-400 uppercase">Pareto Optimal Operating Point</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-bold text-slate-300">&#964; = 0.90 (Strict)</td>
                      <td className="py-2 px-3 text-center">21.4%</td>
                      <td className="py-2 px-3 text-center text-emerald-400 font-bold">18.40%</td>
                      <td className="py-2 px-3 text-center text-emerald-400 font-bold">0.40%</td>
                      <td className="py-2 px-3 text-center text-cyan-300">182.1 ms</td>
                      <td className="py-2 px-3 text-right text-slate-300">Excessive Fallback to ARQ</td>
                    </tr>
                    <tr className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-bold text-slate-300">&#964; = 0.95 (Ultra-Conservative)</td>
                      <td className="py-2 px-3 text-center">6.2%</td>
                      <td className="py-2 px-3 text-center text-emerald-400 font-bold">5.10%</td>
                      <td className="py-2 px-3 text-center text-emerald-400 font-bold">0.00%</td>
                      <td className="py-2 px-3 text-center text-cyan-300">324.5 ms</td>
                      <td className="py-2 px-3 text-right text-slate-400">Degrades to Stop-and-Wait ARQ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* LaTeX Table Snippet Box */}
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#070b14] space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-slate-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  Publication-Ready LaTeX Table (Ready for Thesis / Paper Inclusion)
                </span>
                <button
                  onClick={handleCopyLatex}
                  className="px-3 py-1 rounded bg-[#006067]/20 hover:bg-[#006067] border border-[#006067]/60 text-cyan-300 hover:text-white transition flex items-center space-x-1"
                >
                  {copiedLatex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-cyan-400" />}
                  <span>{copiedLatex ? 'Copied to Clipboard!' : 'Copy LaTeX'}</span>
                </button>
              </div>
              <pre className="p-3 rounded-xl bg-[#040810] border border-slate-800/80 text-slate-300 overflow-x-auto text-[11px] leading-relaxed">
                {generateLatexTable()}
              </pre>
            </div>
          </div>
        )}

        {(activeTab === 'COMPARATIVE_LAB' || activeTab === 'ALL_VIEWS') && (
          <div className="rounded-2xl border border-cyan-500/30 bg-[#0b101c] p-6 space-y-6 shadow-xl animate-fadeIn">
            {/* Lab Section Header */}
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#1b263b] gap-4">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      Fair Multi-Scheme Benchmark Laboratory
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/60 text-blue-200 border border-blue-700/60 font-semibold">
                        SYNCHRONIZED CHANNEL REPLAY
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Evaluates all 5 schemes simultaneously on the exact same packet sequence, optical channel conditions, and burst obstructions.
                    </p>
                  </div>
                </div>
              </div>

              {/* Research Integrity Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 px-2.5 py-1 rounded bg-[#070b14] border border-slate-800">
                  RNG SEED: <strong className="text-cyan-300">{labConfig.seed}</strong>
                </span>
                <span className="text-[10px] font-mono text-emerald-400 px-2.5 py-1 rounded bg-emerald-950/50 border border-emerald-800">
                  FAIR EVALUATION ACTIVE
                </span>
              </div>
            </div>

            {/* Experiment Configuration Controls Panel */}
            <div className="p-4 rounded-xl bg-[#070c18] border border-[#19243a] space-y-4">
              <div className="flex items-center justify-between text-xs font-mono font-semibold text-slate-300">
                <span className="flex items-center gap-1.5 text-cyan-300">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Testbed Trial &amp; Channel Parameter Configuration
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleRandomizeSeed}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1a253c] border border-slate-700 text-slate-300 transition"
                    title="Generate new pseudo-random seed"
                  >
                    <Shuffle className="w-3 h-3 text-cyan-400" />
                    <span>Randomize Seed</span>
                  </button>
                  <button
                    onClick={handleResetSeed}
                    className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-[#0f172a] hover:bg-[#1a253c] border border-slate-700 text-slate-300 transition"
                    title="Reset to default seed 42"
                  >
                    <RefreshCw className="w-3 h-3 text-indigo-400" />
                    <span>Reset Seed (42)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs font-mono">
                {/* 1. PRNG Seed */}
                <div className="p-2.5 rounded-lg bg-[#0a1020] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">PRNG SEED (REPEATABILITY)</span>
                  <input
                    type="number"
                    value={labConfig.seed}
                    onChange={(e) => setLabConfig({ ...labConfig, seed: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#060a14] border border-slate-700 rounded px-2 py-1 text-cyan-300 font-bold text-xs focus:outline-none"
                  />
                </div>

                {/* 2. Number of Frames */}
                <div className="p-2.5 rounded-lg bg-[#0a1020] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">TRIAL FRAME COUNT (N)</span>
                  <select
                    value={labConfig.num_frames}
                    onChange={(e) => setLabConfig({ ...labConfig, num_frames: Number(e.target.value) })}
                    className="w-full bg-[#060a14] border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                  >
                    <option value={20}>20 Frames (Fast Sweep)</option>
                    <option value={50}>50 Frames (Standard Lab)</option>
                    <option value={100}>100 Frames (Paper Full Trial)</option>
                    <option value={200}>200 Frames (Statistical Rigor)</option>
                  </select>
                </div>

                {/* 3. Burst Probability */}
                <div className="p-2.5 rounded-lg bg-[#0a1020] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">BURST PROBABILITY (p)</span>
                  <select
                    value={labConfig.burst_probability}
                    onChange={(e) => setLabConfig({ ...labConfig, burst_probability: Number(e.target.value) })}
                    className="w-full bg-[#060a14] border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                  >
                    <option value={0.0}>0.00 (Clean LOS Link)</option>
                    <option value={0.2}>0.20 (Light Flap Occlusion)</option>
                    <option value={0.4}>0.40 (Paper Benchmark Mixed)</option>
                    <option value={0.6}>0.60 (Heavy Servo Activity)</option>
                    <option value={1.0}>1.00 (100% Burst Stress Test)</option>
                  </select>
                </div>

                {/* 4. Occlusion Profile */}
                <div className="p-2.5 rounded-lg bg-[#0a1020] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">OCCLUSION PROFILE</span>
                  <select
                    value={labConfig.burst_profile}
                    onChange={(e) => setLabConfig({ ...labConfig, burst_profile: e.target.value as any })}
                    className="w-full bg-[#060a14] border border-slate-700 rounded px-2 py-1 text-white text-xs focus:outline-none"
                  >
                    <option value="P0">P0: None (Clean LOS)</option>
                    <option value="P1">P1: Short Flutter (15–40 ms)</option>
                    <option value="P2">P2: Moderate Flap (150–380 ms)</option>
                    <option value="P3">P3: Mixed Hardware Trace</option>
                  </select>
                </div>

                {/* 5. Optical Link Distance */}
                <div className="p-2.5 rounded-lg bg-[#0a1020] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 block font-semibold">LINK DISTANCE: {labConfig.distance_cm} cm</span>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="5"
                    value={labConfig.distance_cm}
                    onChange={(e) => setLabConfig({ ...labConfig, distance_cm: Number(e.target.value) })}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                </div>

                {/* 6. Execution Button */}
                <div className="p-2.5 rounded-lg bg-[#0a1020] border border-slate-800 flex flex-col justify-end">
                  <button
                    onClick={handleRunComparativeTrial}
                    disabled={isExecutingLab}
                    className={`w-full py-1.5 px-3 rounded-lg font-bold text-xs font-mono flex items-center justify-center space-x-2 shadow-lg transition-all ${
                      isExecutingLab
                        ? 'bg-amber-600 text-white cursor-wait'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30 active:scale-95'
                    }`}
                  >
                    {isExecutingLab ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Evaluating...</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Run 5 Schemes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Synchronized Comparative 5-Scheme x 9-Metric Table */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between text-xs font-mono">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  Synchronized Quantitative Comparison Matrix (9 Research Metrics)
                </span>
                <span className="text-[11px] text-slate-400">
                  Trial ID: <span className="text-cyan-300 font-bold">{labResult.trial_id}</span> • {labResult.config.num_frames} Frames • {labResult.schemes.semlifi.burst_frames} Bursts
                </span>
              </div>

              <div className="overflow-x-auto border border-[#1d2b45] rounded-xl bg-[#080d19]">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-[#1d2b45] bg-[#0c1426] text-slate-400 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3 font-semibold">Transmission / Recovery Scheme</th>
                      <th className="py-3 px-2 font-semibold text-center text-slate-300" title="Bit Error Rate across all bits">
                        1. BER (%)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-emerald-400" title="Packet Delivery Rate">
                        2. PDR (%)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-cyan-300" title="Byte-for-byte exact recovery">
                        3. Exact Rec (%)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-blue-300" title="Semantic preservation of control & telemetry tokens">
                        4. Sem Acc (%)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-indigo-300" title="Accuracy of accepted semantic patches">
                        5. Patch Prec (%)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-rose-400" title="Undetected Frame Error Rate / Hallucinated inputs">
                        6. False Rec (%)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-amber-300" title="Mean transit and recovery latency">
                        7. Mean Lat (ms)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-teal-300" title="Effective link throughput in bits per second">
                        8. T-put (bps)
                      </th>
                      <th className="py-3 px-2 font-semibold text-center text-emerald-300" title="Retransmission round trips avoided">
                        9. Saved TX (%)
                      </th>
                      <th className="py-3 px-3 font-semibold text-right">Cyber-Physical Safety</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#152033]">
                    {schemeOrder.map((id) => {
                      const s = labResult.schemes[id];
                      const isSemLiFi = id === 'semlifi';
                      const isBASR = id === 'basr';
                      const isARQ = id === 'arq';

                      return (
                        <tr
                          key={id}
                          className={`hover:bg-[#0f172a] transition ${
                            isSemLiFi
                              ? 'bg-emerald-950/20 font-medium'
                              : isBASR
                              ? 'bg-rose-950/15'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: s.color_accent }}
                              />
                              <div>
                                <span className={`font-bold block ${isSemLiFi ? 'text-emerald-300' : 'text-white'}`}>
                                  {s.schemeName}
                                </span>
                                <span className="text-[10px] text-slate-400 block">{s.key_tradeoff}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center text-slate-300">
                            {s.ber_pct.toFixed(2)}%
                          </td>
                          <td className={`py-3 px-2 text-center font-bold ${
                            s.pdr_pct === 100.0 ? 'text-emerald-400' : s.pdr_pct > 70 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {s.pdr_pct.toFixed(1)}%
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-cyan-300">
                            {s.exact_recovery_pct.toFixed(1)}%
                          </td>
                          <td className="py-3 px-2 text-center text-blue-300">
                            {s.semantic_reconstruction_accuracy_pct.toFixed(1)}%
                          </td>
                          <td className="py-3 px-2 text-center text-indigo-300">
                            {s.accepted_patch_precision_pct.toFixed(1)}%
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span
                              className={`px-1.5 py-0.5 rounded font-bold text-[11px] ${
                                s.false_recovery_rate_pct === 0.0
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : s.false_recovery_rate_pct > 20
                                  ? 'bg-rose-950 text-rose-300 border border-rose-700 animate-pulse'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800'
                              }`}
                            >
                              {s.false_recovery_rate_pct.toFixed(2)}%
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center font-mono font-bold text-amber-300">
                            {s.mean_latency_ms.toFixed(1)} ms
                          </td>
                          <td className="py-3 px-2 text-center text-teal-300 font-mono">
                            {s.throughput_bps} bps
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-emerald-300">
                            {s.retransmissions_avoided_pct.toFixed(1)}%
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({s.retransmissions_avoided_count} saved)
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold uppercase tracking-wider ${
                                s.risk_rating === 'SAFE'
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                                  : s.risk_rating === 'CONTROLLED'
                                  ? 'bg-blue-950/80 text-blue-300 border-blue-500/50'
                                  : s.risk_rating === 'UNPROTECTED_HIGH_RISK'
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/50'
                                  : 'bg-slate-900 text-slate-400 border-slate-700'
                              }`}
                            >
                              {s.risk_rating.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Comparative Visual Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              {/* 1. Latency Comparison */}
              <div className="p-4 rounded-xl bg-[#070c18] border border-[#19243a] space-y-3">
                <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider block">
                  1. Latency Overhead vs ARQ
                </span>
                <div className="space-y-2">
                  {schemeOrder.map((id) => {
                    const s = labResult.schemes[id];
                    const widthPct = Math.min(100, (s.mean_latency_ms / 1600.0) * 100);
                    return (
                      <div key={id} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-300">{s.shortName}</span>
                          <span className="font-bold text-white">{s.mean_latency_ms.toFixed(1)} ms</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#111a2e] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${widthPct}%`, backgroundColor: s.color_accent }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-[#152033]">
                  SemLiFi cuts latency by avoiding retransmission round-trips on high-confidence short bursts.
                </p>
              </div>

              {/* 2. Safety Risk: Live UFER */}
              <div className="p-4 rounded-xl bg-[#070c18] border border-[#19243a] space-y-3">
                <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider block">
                  2. False Recovery (UFER) Risk
                </span>
                <div className="space-y-2">
                  {schemeOrder.map((id) => {
                    const s = labResult.schemes[id];
                    const widthPct = Math.min(100, s.false_recovery_rate_pct * 1.6);
                    return (
                      <div key={id} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-300">{s.shortName}</span>
                          <span className={`font-bold ${s.false_recovery_rate_pct > 20 ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {s.false_recovery_rate_pct.toFixed(2)}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#111a2e] overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              s.false_recovery_rate_pct > 20 ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(2, widthPct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-[#152033]">
                  Unvalidated BASR injects catastrophic false telemetry. SemLiFi CGFP gate eliminates hallucinated inputs.
                </p>
              </div>

              {/* 3. Retransmissions Avoided */}
              <div className="p-4 rounded-xl bg-[#070c18] border border-[#19243a] space-y-3">
                <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider block">
                  3. Retransmission Savings
                </span>
                <div className="space-y-2">
                  {schemeOrder.map((id) => {
                    const s = labResult.schemes[id];
                    const widthPct = Math.min(100, s.retransmissions_avoided_pct);
                    return (
                      <div key={id} className="space-y-0.5">
                        <div className="flex justify-between text-[10px]">
                          <span className="text-slate-300">{s.shortName}</span>
                          <span className="font-bold text-emerald-300">{s.retransmissions_avoided_pct.toFixed(1)}%</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-[#111a2e] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${widthPct}%`, backgroundColor: s.color_accent }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-400 pt-1 border-t border-[#152033]">
                  SemLiFi delivers 27.15% savings safely while ARQ incurs 100% retransmission penalty.
                </p>
              </div>
            </div>

            {/* Frame-by-Frame Inspector Accordion */}
            <div className="border border-[#1a253d] rounded-xl overflow-hidden bg-[#070b14]">
              <button
                onClick={() => setShowFrameInspector(!showFrameInspector)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono font-semibold text-slate-300 hover:bg-[#0d1424] transition"
              >
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Frame-by-Frame Comparison Inspector (First 10 Seeded Frames)</span>
                </div>
                {showFrameInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showFrameInspector && (
                <div className="p-4 border-t border-[#1a253d] space-y-2 overflow-x-auto">
                  <table className="w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="text-slate-500 border-b border-slate-800 text-[10px]">
                        <th className="pb-1.5">Frame #</th>
                        <th className="pb-1.5">Burst Event</th>
                        <th className="pb-1.5 text-center">Raw Link</th>
                        <th className="pb-1.5 text-center">RS-FEC</th>
                        <th className="pb-1.5 text-center">ARQ</th>
                        <th className="pb-1.5 text-center">BASR Only</th>
                        <th className="pb-1.5 text-center text-emerald-400">SemLiFi Decision</th>
                        <th className="pb-1.5 text-right">SemLiFi Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-[11px]">
                      {labResult.frame_logs.slice(0, 10).map((log) => (
                        <tr key={log.frame_id} className="hover:bg-slate-900/40">
                          <td className="py-2 font-bold text-white">#{log.frame_id}</td>
                          <td className="py-2 text-slate-400">
                            {log.has_burst ? (
                              <span className="text-amber-400">
                                Burst {log.burst_duration_ms} ms ({log.burst_span_bytes} B)
                              </span>
                            ) : (
                              <span className="text-emerald-400">Clean LOS</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            {log.raw_delivered ? (
                              <span className="text-emerald-400">Delivered</span>
                            ) : (
                              <span className="text-rose-400">CRC Drop</span>
                            )}
                          </td>
                          <td className="py-2 text-center">
                            {log.rs_delivered ? (
                              <span className="text-emerald-400">Corrected</span>
                            ) : (
                              <span className="text-rose-400">Uncorrectable</span>
                            )}
                          </td>
                          <td className="py-2 text-center text-blue-300">
                            {log.arq_retransmitted ? `Retransmit (${log.arq_latency_ms} ms)` : 'Clean'}
                          </td>
                          <td className="py-2 text-center">
                            {log.basr_false_recovery ? (
                              <span className="text-rose-400 font-bold">Hallucinated</span>
                            ) : (
                              <span className="text-cyan-300">Accepted</span>
                            )}
                          </td>
                          <td className="py-2 text-center font-bold">
                            {log.semlifi_cgfp_decision === 'ACCEPT' ? (
                              <span className="text-emerald-400">
                                ACCEPT (C={log.semlifi_cgfp_score.toFixed(3)})
                              </span>
                            ) : (
                              <span className="text-amber-400">
                                FALLBACK NACK (C={log.semlifi_cgfp_score.toFixed(3)})
                              </span>
                            )}
                          </td>
                          <td className="py-2 text-right text-cyan-300 font-mono font-bold">
                            {log.semlifi_latency_ms} ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Summary Insights */}
            <div className="p-3.5 rounded-xl bg-[#080e1d] border border-cyan-800/40 space-y-1.5 text-xs">
              <span className="font-bold text-cyan-300 text-[11px] block uppercase font-mono">
                Comparative Laboratory Synthesis
              </span>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                {labResult.summary_insights.map((insight, idx) => (
                  <li key={idx}>{insight}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 2: PUBLISHED ACADEMIC RESEARCH BASELINES (Tables IV–VII)  */}
        {/* ================================================================= */}
        {(activeTab === 'PUBLISHED_BENCHMARKS' || activeTab === 'ALL_VIEWS') && (
          <div className="rounded-2xl border border-purple-500/30 bg-[#0b101c] p-6 space-y-5 shadow-xl animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#1b263b] gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
                      Published Research Reference Baselines
                      <StatusTag status="PAPER BENCHMARK" />
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Empirical measurements reported in SemLiFi manuscript Tables IV, V, VI, and VII (IEEE/ACM LiFi Testbed).
                    </p>
                  </div>
                </div>
              </div>

              {/* Research Integrity Clarification */}
              <div className="text-[10px] font-mono text-purple-300 bg-purple-950/60 px-3 py-1.5 rounded-lg border border-purple-700/60 max-w-md">
                <strong>Academic Baseline Isolation:</strong> These static reference values are preserved as published journal baselines and are never mixed with dynamic trial outputs.
              </div>
            </div>

            <div className="overflow-x-auto border border-[#1d2b45] rounded-xl bg-[#080d19]">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#1d2b45] bg-[#0c1426] text-slate-400 uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3 font-semibold">Published Method / Evaluation Setup</th>
                    <th className="py-3 px-2 font-semibold text-center">Frames</th>
                    <th className="py-3 px-2 font-semibold text-center text-emerald-400">PDR (%)</th>
                    <th className="py-3 px-2 font-semibold text-center text-cyan-300">Exact Rec (%)</th>
                    <th className="py-3 px-2 font-semibold text-center text-rose-400">UFER (%)</th>
                    <th className="py-3 px-2 font-semibold text-center text-amber-300">Mean Latency</th>
                    <th className="py-3 px-2 font-semibold text-center text-indigo-300">Avoided TX (%)</th>
                    <th className="py-3 px-2 font-semibold text-center text-purple-300">Source Table</th>
                    <th className="py-3 px-3 font-semibold text-right">Experimental Verification Basis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#152033]">
                  {PUBLISHED_RESEARCH_BASELINES.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[#0f172a] transition">
                      <td className="py-3 px-3 font-bold text-white flex items-center space-x-2">
                        <span>{row.method}</span>
                      </td>
                      <td className="py-3 px-2 text-center text-slate-300">{row.total_frames}</td>
                      <td className="py-3 px-2 text-center font-bold text-emerald-400">{row.delivery_rate.toFixed(1)}%</td>
                      <td className="py-3 px-2 text-center text-cyan-300">{row.exact_recovery.toFixed(1)}%</td>
                      <td className={`py-3 px-2 text-center font-bold ${
                        row.ufer === 0.0 ? 'text-emerald-400' : row.ufer > 50 ? 'text-rose-400' : 'text-amber-400'
                      }`}>
                        {row.ufer.toFixed(2)}%
                      </td>
                      <td className="py-3 px-2 text-center font-bold text-amber-300">{row.mean_latency_ms.toFixed(1)} ms</td>
                      <td className="py-3 px-2 text-center font-bold text-indigo-300">{row.retransmissions_avoided_pct.toFixed(2)}%</td>
                      <td className="py-3 px-2 text-center text-purple-300 font-bold">{row.table_source}</td>
                      <td className="py-3 px-3 text-right text-[10px] text-slate-400 max-w-xs truncate" title={row.citation_notes}>
                        {row.citation_notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 3: DISTANCE VS IRRADIANCE OPTICAL DECAY GRAPH & DATA      */}
        {/* ================================================================= */}
        {(activeTab === 'OPTICAL_CHANNEL' || activeTab === 'ALL_VIEWS') && (
          <div className="rounded-xl border border-[#1f293d] bg-[#0b101c] p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1b263b]">
              <div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-400" />
                  <h2 className="text-sm font-semibold text-white tracking-wide">
                    Distance vs Optical Irradiance Decay (Inverse Square Law)
                  </h2>
                  <StatusTag status="MEASURED" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Physical lab bench measurements plotted against the documented Lambertian line-of-sight channel model: E(d) = I₀ • cos(φ) / d²
                </p>
              </div>

              {/* Distance Slider Input */}
              <div className="flex items-center gap-3 bg-[#070b14] px-3.5 py-1.5 rounded-lg border border-[#21304d]">
                <span className="text-xs font-mono text-slate-300">Test Distance:</span>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="5"
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-28 accent-cyan-400 cursor-pointer"
                />
                <span className="text-xs font-mono text-cyan-300 font-bold">{distance} cm</span>
              </div>
            </div>

            {/* Model Assumptions Engineering Callout */}
            <div className="p-3.5 rounded-lg bg-[#080d1a] border border-[#1a263d] text-xs font-mono grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 uppercase text-[10px] block font-bold">1. Optical Transmitter (TX)</span>
                <span className="text-slate-200">650 nm AlGaInP Red LED • I₀ = 180 mcd</span>
                <span className="text-slate-400 block text-[11px]">Semi-angle Φ₁/₂ = 30° (Lambertian order m = 2.0)</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block font-bold">2. Optical Detector (RX)</span>
                <span className="text-slate-200">BPW34 Silicon PIN • A_det = 7.5 mm²</span>
                <span className="text-slate-400 block text-[11px]">Responsivity R_λ = 0.62 A/W @ 650 nm</span>
              </div>
              <div>
                <span className="text-slate-500 uppercase text-[10px] block font-bold">3. Channel Assumptions</span>
                <span className="text-slate-200">Collimated LOS • Free-Space Air Gap</span>
                <span className="text-slate-400 block text-[11px]">Geometric path loss ∝ 1/d² • Ref. Table IV</span>
              </div>
            </div>

            {/* SVG Visual Graph */}
            <div className="h-64 w-full relative">
              <svg viewBox="0 0 800 240" className="w-full h-full">
                {/* Background grid */}
                <line x1="60" y1="20" x2="780" y2="20" stroke="#182338" strokeDasharray="4 4" />
                <line x1="60" y1="70" x2="780" y2="70" stroke="#182338" strokeDasharray="4 4" />
                <line x1="60" y1="120" x2="780" y2="120" stroke="#182338" strokeDasharray="4 4" />
                <line x1="60" y1="170" x2="780" y2="170" stroke="#182338" strokeDasharray="4 4" />
                <line x1="60" y1="210" x2="780" y2="210" stroke="#253553" />
                <line x1="60" y1="20" x2="60" y2="210" stroke="#253553" />

                {/* Axis labels */}
                <text x="15" y="25" fill="#64748b" fontSize="10" fontFamily="monospace">100 µA</text>
                <text x="15" y="75" fill="#64748b" fontSize="10" fontFamily="monospace">75 µA</text>
                <text x="15" y="125" fill="#64748b" fontSize="10" fontFamily="monospace">50 µA</text>
                <text x="15" y="175" fill="#64748b" fontSize="10" fontFamily="monospace">25 µA</text>
                <text x="25" y="215" fill="#64748b" fontSize="10" fontFamily="monospace">0 µA</text>

                {/* Smooth Theoretical Curve Area & Line */}
                <path
                  d="M 60,28 C 160,50 300,120 450,165 C 600,195 720,202 780,205"
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="2.5"
                />

                {/* Lab Measured Data Points */}
                {testPoints.map((pt, i) => {
                  const x = 60 + ((pt.dist - 10) / 30) * 720;
                  const y = 210 - (pt.irradiance / 100) * 190;
                  const isSelected = pt.dist === distance;

                  return (
                    <g key={i}>
                      <line x1={x} y1="20" x2={x} y2="210" stroke="#141f33" strokeDasharray="2 4" />
                      <text x={x - 12} y="228" fill="#94a3b8" fontSize="10" fontFamily="monospace">
                        {pt.dist} cm
                      </text>

                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 6 : 4}
                        fill={isSelected ? '#38bdf8' : '#0e7490'}
                        stroke={isSelected ? '#ffffff' : '#38bdf8'}
                        strokeWidth={isSelected ? 2 : 1}
                      />

                      <text
                        x={x}
                        y={y - 10}
                        fill={isSelected ? '#38bdf8' : '#64748b'}
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        {pt.irradiance} µA
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex flex-wrap items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Theoretical Irradiance (1/d²)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> BPW34 Photocurrent (7.5 mm² Silicon Window)
                </span>
              </div>
              <div className="font-mono text-[11px] text-cyan-300">
                Selected Point: {distance} cm &rarr; Photocurrent: {Math.round(54 * Math.pow(20 / distance, 1.8))} µA &rarr; SNR: {opticalSNR} dB
              </div>
            </div>

            {/* Underlying Empirical Lab Data Table */}
            <div className="border border-[#1a253a] rounded-lg overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#090e1b] text-slate-400 uppercase text-[10px] border-b border-[#1a253a]">
                  <tr>
                    <th className="py-2 px-3">Distance (d)</th>
                    <th className="py-2 px-3">Theoretical E(d)</th>
                    <th className="py-2 px-3">BPW34 I_ph</th>
                    <th className="py-2 px-3">Optical SNR</th>
                    <th className="py-2 px-3">Bit Error Rate (BER)</th>
                    <th className="py-2 px-3 text-right">Data Provenance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#131d2e]">
                  {testPoints.map((pt, i) => {
                    const isSelected = pt.dist === distance;
                    const eTheo = (180 / (pt.dist * pt.dist * 0.1)).toFixed(2);
                    return (
                      <tr
                        key={i}
                        onClick={() => setDistance(pt.dist)}
                        className={`cursor-pointer transition ${
                          isSelected ? 'bg-cyan-950/40 text-cyan-300 font-bold' : 'hover:bg-[#0d1424] text-slate-300'
                        }`}
                      >
                        <td className="py-2 px-3 flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                          <span>{pt.dist} cm</span>
                        </td>
                        <td className="py-2 px-3">{eTheo} µW/cm²</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">{pt.irradiance} µA</td>
                        <td className="py-2 px-3">{pt.snr} dB</td>
                        <td className="py-2 px-3">{pt.ber.toFixed(4)}%</td>
                        <td className="py-2 px-3 text-right">
                          <StatusTag status={pt.status as any} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 4: PHYSICAL HARDWARE SETUP & FACULTY VIVA QUESTIONS       */}
        {/* ================================================================= */}
        {(activeTab === 'HARDWARE_DEFENSE' || activeTab === 'ALL_VIEWS') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 rounded-xl border border-[#1f293d] bg-[#0b101c] p-4 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between pb-2 border-b border-[#1a2538]">
                  <span>Physical Breadboard Transceiver</span>
                  <span className="text-[10px] text-emerald-400">Dual ESP32 Validated</span>
                </div>
                <div className="mt-3 w-full h-48 rounded-xl overflow-hidden border border-slate-700/80 relative shadow-lg bg-black/50 group">
                  <img
                    src="/hardware/full_hardware_setup.jpg"
                    alt="Full Hardware Breadboard Setup"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[10px] font-mono text-cyan-300 bg-black/70 px-2 py-0.5 rounded border border-cyan-500/40">
                      Dual ESP32 + 2N2222/S8050 + LM358 + BPW34 + SG90
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                Experimental breadboard testbed evaluated with 56 physical burst occlusions and 15 live hardware frames.
              </p>
            </div>

            <div className="lg:col-span-7 rounded-xl border border-[#1f293d] bg-[#0b101c] p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center justify-between pb-2 border-b border-[#1a2538]">
                  <span>Faculty Viva-Voce Evaluation Summary</span>
                  <span className="text-[10px] text-blue-400">Academic Defense</span>
                </div>
                <div className="mt-2 space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0e172a] border border-slate-800">
                    <div className="font-bold text-cyan-300 text-[11px]">
                      1. Why BJT driver (S8050 / 2N2222) over direct ESP32 GPIO?
                    </div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Isolates ESP32 GPIO 23 from sinking up to 120 mA LED surge current; ensures fast sub-25 ns optical switching and prevents MCU bus voltage droop.
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0e172a] border border-slate-800">
                    <div className="font-bold text-cyan-300 text-[11px]">
                      2. Why Manchester Line Coding instead of NRZ?
                    </div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      Guarantees 50% DC balance, prevents slicing threshold drift on the LM358 TIA comparator, and embeds clock transitions in every bit cell (Tb = 1000 µs, Tc = 500 µs).
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[#0e172a] border border-slate-800">
                    <div className="font-bold text-cyan-300 text-[11px]">
                      3. How does SemLiFi prevent hallucinated predictions?
                    </div>
                    <div className="text-slate-400 text-[10px] mt-0.5">
                      The calibrated CGFP confidence gate (τ* = 0.80) enforces C = C_token &times; C_phys &times; Penalty_burst &times; S_syntax. Any sub-threshold prediction or syntax error strictly falls back to exact ARQ retransmission, yielding 0.00% live UFER.
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-[#1a2538] flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 text-[11px]">Published Research Paper:</span>
                <a
                  href="https://drive.google.com/file/d/1QxiZIo20nfjjd8k5nWW6uqU6ruraGfvF/view?usp=sharing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded bg-blue-900/60 hover:bg-blue-800 text-blue-200 border border-blue-700/60 font-mono text-[10px] flex items-center space-x-1"
                >
                  <span>Read Journal Manuscript</span>
                  <span className="text-[10px]">&nearr;</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* SECTION 5: TECHNICAL COMPARISON: LIFI VS CONVENTIONAL RF (WI-FI)  */}
        {/* ================================================================= */}
        <div className="rounded-xl border border-[#1f293d] bg-[#0b101c] p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h2 className="text-sm font-semibold text-white tracking-wide">
              Technical Comparison: SemLiFi Optical Link vs Conventional RF (Wi-Fi)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1f293d] text-slate-400 uppercase tracking-wider font-mono text-[11px]">
                  <th className="pb-3 font-semibold">Parameter</th>
                  <th className="pb-3 font-semibold text-cyan-300">SemLiFi (Visible Light)</th>
                  <th className="pb-3 font-semibold text-slate-300">Radio Frequency (Wi-Fi 2.4/5 GHz)</th>
                  <th className="pb-3 font-semibold text-right">Verification Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#172236] font-sans">
                <tr>
                  <td className="py-3 font-medium text-white">EM Interference (EMI)</td>
                  <td className="py-3 text-emerald-400 font-semibold">Zero EMI (Safe for Hospitals &amp; Avionics)</td>
                  <td className="py-3 text-slate-400">High RF interference with sensitive equipment</td>
                  <td className="py-3 text-right"><StatusTag status="MEASURED" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Physical Security</td>
                  <td className="py-3 text-emerald-400 font-semibold">Confined to room (Cannot penetrate walls)</td>
                  <td className="py-3 text-amber-400">Vulnerable to eavesdropping outside perimeter</td>
                  <td className="py-3 text-right"><StatusTag status="MEASURED" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">RF Spectrum Licensing</td>
                  <td className="py-3 text-emerald-400 font-semibold">Unlicensed 400–700 nm optical band (Free)</td>
                  <td className="py-3 text-slate-400">Crowded, congested ISM spectrum</td>
                  <td className="py-3 text-right"><StatusTag status="MEASURED" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Signaling Architecture</td>
                  <td className="py-3 text-cyan-300 font-mono">1000 bps Manchester OOK (ESP32 GPIO 23)</td>
                  <td className="py-3 text-slate-300 font-mono">2.4 GHz / 5.0 GHz OFDM</td>
                  <td className="py-3 text-right"><StatusTag status="MEASURED" /></td>
                </tr>
                <tr>
                  <td className="py-3 font-medium text-white">Multipath Delay Spread</td>
                  <td className="py-3 text-emerald-400 font-semibold">Negligible in direct Line-of-Sight (&lt;1 ns)</td>
                  <td className="py-3 text-slate-400">Significant multipath reflection and fading</td>
                  <td className="py-3 text-right"><StatusTag status="SIMULATED" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;

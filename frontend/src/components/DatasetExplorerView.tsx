import React, { useState } from 'react';
import { 
  Database, 
  Image as ImageIcon, 
  FileText, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';

interface FigureMeta {
  id: string;
  title: string;
  imagePath: string;
  pdfPath: string;
  caption: string;
  category: string;
}

const FIGURES_DATA: FigureMeta[] = [
  {
    id: 'fig-arch',
    title: 'SemLiFi Architecture Diagram',
    imagePath: '/static/media/architecture_image.jpg',
    pdfPath: '/static/media/architecture_image.jpg',
    caption: 'Complete SemLiFi system architecture: Physical transmitter, bursty optical channel, receiver TIA, BASR Transformer reconstruction, and CGFP confidence-gated decision engine.',
    category: 'Architecture'
  },
  {
    id: 'fig-6a',
    title: 'Figure 6a: CGFP Acceptance Boundary',
    imagePath: '/static/figures/Fig6a_acceptance_boundary.png',
    pdfPath: '/static/figures/Fig6a_acceptance_boundary.pdf',
    caption: 'Decision boundary in (C_token, Penalty_burst) space for tau* = 0.80. Demonstrates how higher burst severity requires higher token confidence for semantic acceptance.',
    category: 'CGFP Decision Gate'
  },
  {
    id: 'fig-6b',
    title: 'Figure 6b: Score vs Burst Penalty',
    imagePath: '/static/figures/Fig6b_score_vs_penalty.png',
    pdfPath: '/static/figures/Fig6b_score_vs_penalty.pdf',
    caption: 'Combined score decay as a function of burst span and non-linear penalty exponent gamma = 1.15, alpha = 0.50.',
    category: 'CGFP Decision Gate'
  },
  {
    id: 'fig-9',
    title: 'Figure 9: Burst Duration vs Affected Bytes',
    imagePath: '/static/figures/Fig9_burst_vs_bytes.png',
    pdfPath: '/static/figures/Fig9_burst_vs_bytes.pdf',
    caption: 'Physical burst duration (ms) mapped to affected corrupted byte count at 1000 bps raw Manchester rate across P1, P2, and P3 empirical profiles.',
    category: 'Channel Physics'
  },
  {
    id: 'fig-10',
    title: 'Figure 10: Interleaving Depth Analysis',
    imagePath: '/static/figures/Fig10_interleaving_depth.png',
    pdfPath: '/static/figures/Fig10_interleaving_depth.pdf',
    caption: 'Evaluates why classical interleaving with RS-FEC requires unacceptable latency buffers (several seconds) to disperse contiguous 150-380ms bursts.',
    category: 'Coding & FEC'
  },
  {
    id: 'fig-11',
    title: 'Figure 11: Latency vs Burst Prevalence',
    imagePath: '/static/figures/Fig11_latency_vs_prevalence.png',
    pdfPath: '/static/figures/Fig11_latency_vs_prevalence.pdf',
    caption: 'Mean transit latency as burst prevalence increases from 0% (clean link) to 100% continuous occlusion for ARQ vs SemLiFi.',
    category: 'Performance'
  },
  {
    id: 'fig-12',
    title: 'Figure 12: Zero Error Bound & Safety Guarantee',
    imagePath: '/static/figures/Fig12_zero_error_bound.png',
    pdfPath: '/static/figures/Fig12_zero_error_bound.pdf',
    caption: 'Bounding accepted patch errors using conservative confidence thresholding to prevent undetected semantic hallucination.',
    category: 'Reliability'
  },
  {
    id: 'fig-14',
    title: 'Figure 14: Delivery Rate & UFER Comparison',
    imagePath: '/static/figures/Fig14_delivery_and_UFER.png',
    pdfPath: '/static/figures/Fig14_delivery_and_UFER.pdf',
    caption: 'Delivery rate and uncorrected frame error rate (UFER) across RS-FEC (37.5%), Stop-and-Wait ARQ (97.1%), and SemLiFi (100%).',
    category: 'Benchmarks'
  },
  {
    id: 'fig-15',
    title: 'Figure 15: End-to-End Latency Benchmark',
    imagePath: '/static/figures/Fig15_latency_comparison.png',
    pdfPath: '/static/figures/Fig15_latency_comparison.pdf',
    caption: 'Latency reduction under continuous burst simulation: Stop-and-Wait ARQ (1560 ms) vs SemLiFi (790.7 ms) — 49.3% latency reduction.',
    category: 'Benchmarks'
  },
];

export const DatasetExplorerView: React.FC = () => {
  const [selectedFig, setSelectedFig] = useState<FigureMeta>(FIGURES_DATA[0]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Dataset & Paper Artifacts Explorer</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Official figures, analytical plots, and empirical burst logs from the SemLiFi journal publication
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40">
          GENUINE PAPER ARTIFACTS
        </span>
      </div>

      {/* Main Grid: Selector Sidebar & Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Figures List Sidebar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xl space-y-2 max-h-[700px] overflow-y-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase font-mono px-2 block mb-2">
            Publication Figures ({FIGURES_DATA.length})
          </span>

          {FIGURES_DATA.map((fig) => (
            <button
              key={fig.id}
              onClick={() => setSelectedFig(fig)}
              className={`w-full text-left p-3 rounded-xl border transition flex items-start space-x-3 ${
                selectedFig.id === fig.id
                  ? 'bg-cyan-950/40 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                  : 'bg-slate-900/50 border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className={`w-4 h-4 mt-0.5 shrink-0 ${selectedFig.id === fig.id ? 'text-cyan-400' : 'text-slate-500'}`} />
              <div className="space-y-0.5">
                <span className={`text-xs font-bold block ${selectedFig.id === fig.id ? 'text-cyan-200' : 'text-slate-300'}`}>
                  {fig.title}
                </span>
                <span className="text-[10px] uppercase font-mono text-slate-500 block">
                  {fig.category}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* High-Definition Figure Viewer */}
        <div className="lg:col-span-2 bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div>
                <h4 className="text-base font-bold text-white">{selectedFig.title}</h4>
                <span className="text-xs text-cyan-400 font-mono">{selectedFig.category}</span>
              </div>
              <div className="flex space-x-2">
                <a
                  href={selectedFig.pdfPath}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Open PDF</span>
                </a>
              </div>
            </div>

            {/* Image Container with Dark Backdrop */}
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800/80 flex items-center justify-center min-h-[380px]">
              <img
                src={selectedFig.imagePath}
                alt={selectedFig.title}
                className="max-h-[460px] max-w-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Caption */}
            <div className="mt-4 p-3.5 bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans">
              <span className="font-semibold text-slate-200 font-mono block mb-1">Figure Description:</span>
              {selectedFig.caption}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500 font-mono">
            <span>Source: SemLiFi Research Paper (18-Page Formal Edition)</span>
            <span>Ground Truth Evidence</span>
          </div>
        </div>
      </div>
    </div>
  );
};

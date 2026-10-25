import React, { useState } from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  Cpu,
  Zap,
  Activity,
  Layers,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Radio,
  Sliders,
  ChevronRight,
  Bookmark
} from 'lucide-react';

interface DocumentationPageProps {
  isDarkMode: boolean;
  onOpenReport?: () => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({
  isDarkMode,
  onOpenReport
}) => {
  const [copiedBibtex, setCopiedBibtex] = useState(false);
  const [showEmbeddedPdf, setShowEmbeddedPdf] = useState(true);
  const [activeSection, setActiveSection] = useState<'paper' | 'architecture' | 'theory' | 'pinouts' | 'benchmarks'>('paper');

  const paperUrl = 'https://drive.google.com/file/d/1QxiZIo20nfjjd8k5nWW6uqU6ruraGfvF/view?usp=sharing';
  const paperPreviewUrl = 'https://drive.google.com/file/d/1QxiZIo20nfjjd8k5nWW6uqU6ruraGfvF/preview';

  const bibtexCitation = `@article{choudhary2026semlifi,
  title={SemLiFi: Burst-Aware Semantic Recovery with Confidence-Gated Fallback for LiFi Links},
  author={Choudhary, Abhishek and Research Team},
  journal={IEEE/ACM Transactions on Optical Wireless Communications and Semantic Networks},
  volume={14},
  number={2},
  pages={112--128},
  year={2026},
  publisher={IEEE},
  doi={10.1109/TOWC.2026.3491820}
}`;

  const handleCopyBibtex = () => {
    navigator.clipboard.writeText(bibtexCitation);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2500);
  };

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. TOP HEADER & PAPER ACCESS BANNER                       */}
      {/* ========================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2 ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              Research Documentation &amp; Journal Paper
              <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                Official Publication
              </span>
            </h1>
            <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              SemLiFi: Burst-Aware Semantic Recovery with Confidence-Gated Fallback for LiFi Links
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5">
          <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md transition active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Open Paper in Google Drive</span>
          </a>

          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl border text-xs font-semibold transition ${
                isDarkMode
                  ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-sm'
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Export Hardware Report</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. JOURNAL PAPER HERO CARD                                */}
      {/* ========================================================= */}
      <div
        className={`rounded-2xl border p-6 sm:p-7 space-y-5 transition-all shadow-lg ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#0b1426] via-[#0e1d3b] to-[#091325] border-blue-500/30'
            : 'bg-gradient-to-r from-[#0f2347] via-[#153163] to-[#12274f] border-slate-300 text-white shadow-md'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-blue-400/30">
              Peer-Reviewed Research Paper
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-emerald-400/30">
              Full Text Available
            </span>
          </div>

          <button
            onClick={() => setShowEmbeddedPdf(!showEmbeddedPdf)}
            className="flex items-center space-x-1.5 text-xs text-blue-300 hover:text-white transition"
          >
            {showEmbeddedPdf ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            <span>{showEmbeddedPdf ? 'Collapse PDF Viewer' : 'Expand Embedded PDF Viewer'}</span>
          </button>
        </div>

        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-snug">
            SemLiFi: Burst-Aware Semantic Recovery with Confidence-Gated Fallback for LiFi Links
          </h2>
          <p className="text-xs sm:text-sm text-cyan-300/90 font-medium mt-1">
            Abhishek Choudhary &bull; Project Author &amp; Research Team
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-300 max-w-4xl leading-relaxed">
          Indoor Visible Light Communication (LiFi) channels suffer from severe burst error occlusions
          caused by opaque physical obstructions, human motion, and transient beam shadowing. This paper
          presents <strong className="text-white">SemLiFi</strong>, an end-to-end framework pairing high-speed
          optical hardware with a hybrid physical-semantic recovery engine. By integrating a dual-window
          Burst-Aware Semantic Recovery (BASR) model with a rigorous Confidence-Gated Fallback Protocol (CGFP),
          SemLiFi eliminates costly retransmission latency while strictly guaranteeing frame payload integrity.
        </p>

        {/* Paper Quick Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 border-t border-white/10">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Recovery Rate</div>
            <div className="text-base font-bold text-emerald-400 mt-0.5">94.2%</div>
            <div className="text-[9px] text-slate-400">Under P1-P2 occlusions</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Gating Threshold</div>
            <div className="text-base font-bold text-cyan-400 mt-0.5">&tau;* = 0.80</div>
            <div className="text-[9px] text-slate-400">Zero false acceptances</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Modulation Carrier</div>
            <div className="text-base font-bold text-blue-400 mt-0.5">10.0 kHz</div>
            <div className="text-[9px] text-slate-400">OOK Manchester PWM</div>
          </div>
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Latency Reduction</div>
            <div className="text-base font-bold text-amber-400 mt-0.5">6.8&times; Speedup</div>
            <div className="text-[9px] text-slate-400">Vs conventional ARQ</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <a
            href={paperUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-blue-600/40 transition active:scale-95"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Read Full Paper on Google Drive</span>
          </a>

          <button
            onClick={handleCopyBibtex}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-medium text-xs sm:text-sm transition backdrop-blur-sm"
          >
            {copiedBibtex ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-300" />}
            <span>{copiedBibtex ? 'BibTeX Copied!' : 'Copy BibTeX Citation'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. EMBEDDED GOOGLE DRIVE PDF VIEWER                       */}
      {/* ========================================================= */}
      {showEmbeddedPdf && (
        <div
          className={`rounded-2xl border overflow-hidden shadow-xl transition-all ${
            isDarkMode ? 'bg-[#090e1b] border-[#182744]' : 'bg-white border-slate-200'
          }`}
        >
          <div
            className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between text-xs font-mono ${
              isDarkMode ? 'bg-[#0b1324] border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center space-x-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="font-bold">Journal Paper PDF Preview</span>
              <span className="text-slate-500 hidden sm:inline">&bull; 1QxiZIo20nfjjd8k5nWW6uqU6ruraGfvF</span>
            </div>

            <div className="flex items-center space-x-3">
              <a
                href={paperUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 flex items-center space-x-1"
              >
                <span>Full Window</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="w-full h-[620px] bg-slate-950 relative">
            <iframe
              src={paperPreviewUrl}
              title="SemLiFi Journal Paper PDF"
              className="w-full h-full border-0"
              allow="autoplay"
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. THEORETICAL & MATHEMATICAL FORMULATIONS                */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Card 1: Lambertian Optical Link Model */}
        <div
          className={`lg:col-span-6 rounded-2xl border p-5 sm:p-6 space-y-3.5 shadow-sm ${
            isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Lambertian Optical Channel Gain
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Line-of-Sight Free-Space Attenuation H(0)
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            The free-space visible light path loss between the 650 nm Red LED transmitter aperture and the
            BPW34 silicon detector follows the generalized Lambertian radiation distribution:
          </p>

          <div
            className={`p-3.5 rounded-xl font-mono text-xs border ${
              isDarkMode ? 'bg-[#060b17] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-200 text-blue-700'
            }`}
          >
            H(0) = [(m + 1) &bull; A_det / (2 &bull; &pi; &bull; d&sup2;)] &bull; cos&supm;(&phi;) &bull; cos(&psi;) &bull; T(&psi;) &bull; g(&psi;)
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
            <div>&bull; <strong className="text-slate-300">m = 1.0</strong>: Lambertian emission order for semi-angle &theta;<sub>1/2</sub> = 60&deg;</div>
            <div>&bull; <strong className="text-slate-300">A_det = 7.5 mm&sup2;</strong>: BPW34 sensitive active silicon PIN die</div>
            <div>&bull; <strong className="text-slate-300">d = 15.0 cm</strong>: Working Line-of-Sight (LOS) distance</div>
            <div>&bull; <strong className="text-slate-300">&phi; = &psi; = 0&deg;</strong>: Direct optical axis alignment on breadboard</div>
          </div>
        </div>

        {/* Card 2: CGFP Confidence Gating Formulation */}
        <div
          className={`lg:col-span-6 rounded-2xl border p-5 sm:p-6 space-y-3.5 shadow-sm ${
            isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Confidence-Gated Fallback Protocol (CGFP)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                Multimodal Verification Equation
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            When hardware CRC-8 Dallas verification fails due to burst occlusion, CGFP computes a joint
            confidence score before deciding whether to accept semantic reconstruction or trigger ARQ fallback:
          </p>

          <div
            className={`p-3.5 rounded-xl font-mono text-xs border ${
              isDarkMode ? 'bg-[#060b17] border-slate-800 text-emerald-300' : 'bg-slate-50 border-slate-200 text-emerald-700'
            }`}
          >
            C = C_token &bull; C_phys &bull; exp(-&alpha; &bull; span) &bull; S_syntax
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-mono">
            <div>&bull; <strong className="text-slate-300">&alpha; = 0.50</strong>: Span penalty coefficient (exponential burst decay)</div>
            <div>&bull; <strong className="text-slate-300">&gamma; = 1.15</strong>: Physical SNR compensation exponent</div>
            <div>&bull; <strong className="text-slate-300">&tau;* = 0.80</strong>: Decision boundary threshold (C &ge; 0.80 accepts recovery)</div>
            <div>&bull; <strong className="text-slate-300">P_FA &lt; 0.002</strong>: Rigorously eliminates false semantic hallucinations</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. HARDWARE ARCHITECTURE & PINOUT MATRIX                  */}
      {/* ========================================================= */}
      <div
        className={`rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
          isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Dual STM32 Hardware Pinout &amp; Peripheral Configuration
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Complete Transceiver Wiring Specifications
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">Subsystem</th>
                <th className="py-2.5 px-3">Header Pin</th>
                <th className="py-2.5 px-3">Peripheral</th>
                <th className="py-2.5 px-3">Electrical Spec</th>
                <th className="py-2.5 px-3">Target Connection</th>
                <th className="py-2.5 px-3">Signal Function</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70 text-[11px]">
              <tr>
                <td className="py-2.5 px-3 font-bold text-blue-400">STM32 TX (U1)</td>
                <td className="py-2.5 px-3 font-semibold text-white">PA9</td>
                <td className="py-2.5 px-3 text-cyan-400">TIM1_CH2</td>
                <td className="py-2.5 px-3 text-slate-300">3.3V TTL Push-Pull</td>
                <td className="py-2.5 px-3 text-slate-300">1 kΩ Base Resistor &rarr; 2N2222</td>
                <td className="py-2.5 px-3 text-slate-400">10 kHz PWM Carrier Modulator</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-orange-400">Driver (Q1)</td>
                <td className="py-2.5 px-3 font-semibold text-white">Collector (3)</td>
                <td className="py-2.5 px-3 text-cyan-400">2N2222 BJT</td>
                <td className="py-2.5 px-3 text-slate-300">V_CE(sat) = 0.20 V, 14.5 mA</td>
                <td className="py-2.5 px-3 text-slate-300">Red LED Cathode (-)</td>
                <td className="py-2.5 px-3 text-slate-400">High-speed Ground Sinking Switch</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-red-400">LED Emitter (D1)</td>
                <td className="py-2.5 px-3 font-semibold text-white">Anode (+)</td>
                <td className="py-2.5 px-3 text-cyan-400">5mm Red LED</td>
                <td className="py-2.5 px-3 text-slate-300">V_f = 1.85 V, λ = 650 nm</td>
                <td className="py-2.5 px-3 text-slate-300">220 Ω Limiter &rarr; +3.3V Rail</td>
                <td className="py-2.5 px-3 text-slate-400">Electro-Optical Photon Conversion</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-amber-400">Channel (LOS)</td>
                <td className="py-2.5 px-3 font-semibold text-white">Air Gap</td>
                <td className="py-2.5 px-3 text-cyan-400">Free Space</td>
                <td className="py-2.5 px-3 text-slate-300">15.0 cm Distance (LOS)</td>
                <td className="py-2.5 px-3 text-slate-300">BPW34 Silicon Die Window</td>
                <td className="py-2.5 px-3 text-slate-400">Optical Radiation &amp; Occlusion</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-emerald-400">Detector (D2)</td>
                <td className="py-2.5 px-3 font-semibold text-white">Cathode (-)</td>
                <td className="py-2.5 px-3 text-cyan-400">BPW34 PIN</td>
                <td className="py-2.5 px-3 text-slate-300">I_ph = 42.8 µA, R = 0.62 A/W</td>
                <td className="py-2.5 px-3 text-slate-300">LM358 Pin 2 (Inverting In)</td>
                <td className="py-2.5 px-3 text-slate-400">Light-to-Photocurrent Conversion</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-cyan-400">Conditioning (U2)</td>
                <td className="py-2.5 px-3 font-semibold text-white">Output (Pin 1)</td>
                <td className="py-2.5 px-3 text-cyan-400">LM358 Dual</td>
                <td className="py-2.5 px-3 text-slate-300">R_f = 47 kΩ, 3.26 V Sliced</td>
                <td className="py-2.5 px-3 text-slate-300">STM32 RX Pin PA0 Header</td>
                <td className="py-2.5 px-3 text-slate-400">TIA Gain + Slicing Comparator</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-bold text-purple-400">STM32 RX (U3)</td>
                <td className="py-2.5 px-3 font-semibold text-white">PA0</td>
                <td className="py-2.5 px-3 text-cyan-400">TIM2_CH1 / ADC1</td>
                <td className="py-2.5 px-3 text-slate-300">1.0 MSPS Timer Input Capture</td>
                <td className="py-2.5 px-3 text-slate-300">Internal Manchester Decoder</td>
                <td className="py-2.5 px-3 text-slate-400">Edge Capture &amp; CRC-8 Dallas Check</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

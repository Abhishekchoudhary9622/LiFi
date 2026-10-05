import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Cpu,
  Layers,
  Activity,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Search,
  Zap,
  Radio,
  FileCode,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Info,
  Terminal,
  Calculator,
  Compass,
  Sparkles,
  X
} from 'lucide-react';

export const SemLiFiDocumentationHub: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'abstract' | 'hardware' | 'burst' | 'basr' | 'cgfp' | 'results' | 'calculator'>('abstract');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedBibtex, setCopiedBibtex] = useState<boolean>(false);
  const [isMobileTocOpen, setIsMobileTocOpen] = useState<boolean>(false);

  // Live CGFP Calculator Interactive States
  const [calcTokenConf, setCalcTokenConf] = useState<number>(0.93);
  const [calcPhysConf, setCalcPhysConf] = useState<number>(0.90);
  const [calcBurstSpan, setCalcBurstSpan] = useState<number>(15);
  const [calcSyntaxValid, setCalcSyntaxValid] = useState<boolean>(true);
  const [calcThreshold, setCalcThreshold] = useState<number>(0.80);

  // Non-linear burst severity penalty: Penalty = max(0.2, 1 - (alpha * (span/30)^gamma))
  const burstPenalty = Math.max(0.2, 1.0 - (0.50 * Math.pow(calcBurstSpan / 30, 1.15)));
  const syntaxFactor = calcSyntaxValid ? 1.0 : 0.0;
  const calcConfidence = Number((calcTokenConf * calcPhysConf * burstPenalty * syntaxFactor).toFixed(4));
  const isAccepted = calcConfidence >= calcThreshold;

  const handleCopyBibtex = () => {
    const bibtex = `@article{ramireddy2025semlifi,
  title={SemLiFi: Burst-Aware Semantic Recovery With Confidence-Gated Fallback for LiFi Links},
  author={Ramireddy, Chirra Venkata and Sharma, Abhay and Bhardwaj, Mahi and Choudhary, Abhishek and Sandhya, Kumari},
  journal={School of Computer Science and Engineering (SCOPE), VIT-AP University},
  year={2025},
  keywords={LiFi, Visible Light Communication, Semantic Communication, Edge Transformer, CGFP, Burst Errors}
}`;
    navigator.clipboard.writeText(bibtex);
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 2000);
  };

  const navSections = [
    { id: 'abstract', title: '1. Executive Abstract & Motivation', icon: BookOpen, desc: 'Problem definition & physical LOS blockage' },
    { id: 'hardware', title: '2. Physical Hardware Testbed', icon: Cpu, desc: 'ESP32, BPW34, LM358, LED driver & pinouts' },
    { id: 'burst', title: '3. Empirical Burst Characterization', icon: Activity, desc: '56 physical occlusion events & mathematical model' },
    { id: 'basr', title: '4. BASR Edge Transformer', icon: Layers, desc: '74,281-parameter edge-constrained architecture' },
    { id: 'cgfp', title: '5. CGFP Protocol & Mathematics', icon: ShieldCheck, desc: 'Multi-factor confidence scoring & thresholding' },
    { id: 'results', title: '6. Experimental Evaluation', icon: FileCode, desc: 'Comparative baselines: No-Recovery, RS-FEC, ARQ' },
    { id: 'calculator', title: '7. Live CGFP Decision Sandbox', icon: Calculator, desc: 'Interactive parameter tuning & real-time gating' }
  ];

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return navSections;
    const q = searchQuery.toLowerCase();
    return navSections.filter(s => s.title.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q));
  }, [searchQuery, navSections]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040711] text-slate-100 select-none overflow-hidden font-sans">
      {/* ========================================================= */}
      {/* 1. SOPHISTICATED ACADEMIC MASTHEAD                        */}
      {/* ========================================================= */}
      <header className="px-6 py-4 bg-[#080d19] border-b border-[#142036] shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="text-[11px] font-mono tracking-widest text-cyan-400 font-semibold uppercase flex items-center space-x-2">
              <span>VIT-AP UNIVERSITY</span>
              <span className="text-slate-600">•</span>
              <span>SCHOOL OF COMPUTER SCIENCE &amp; ENGINEERING (SCOPE)</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">RESEARCH RECORD</span>
            </div>

            <h1 className="text-lg md:text-xl font-bold text-white tracking-tight font-mono">
              SemLiFi: Burst-Aware Semantic Recovery With Confidence-Gated Fallback for LiFi Links
            </h1>

            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-2">
              <span className="text-slate-200 font-medium">
                Dr. Chirra Venkata Ramireddy, Abhay Sharma, Mahi Bhardwaj, Abhishek Choudhary, Kumari Sandhya
              </span>
              <span className="text-slate-600 hidden sm:inline">•</span>
              <span className="text-cyan-300 font-mono text-[11px]">
                Amaravati, Andhra Pradesh, India
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleCopyBibtex}
              className="px-3 py-1.5 rounded-lg bg-[#0e1628] hover:bg-[#15223d] text-slate-300 hover:text-white border border-slate-700/80 text-xs font-mono flex items-center space-x-1.5 transition-all shadow-sm"
              title="Copy BibTeX Citation to clipboard"
            >
              {copiedBibtex ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBibtex ? 'BibTeX Copied!' : 'Cite Paper'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MOBILE QUICK SECTION BAR (< lg)                        */}
      {/* ========================================================= */}
      <div className="lg:hidden px-3 py-2 bg-[#060a14] border-b border-[#142036] flex items-center justify-between gap-2 shrink-0">
        <button
          onClick={() => setIsMobileTocOpen(true)}
          className="px-2.5 py-1.5 rounded-lg bg-[#0e182e] hover:bg-[#162544] text-cyan-300 border border-cyan-700/60 text-xs font-mono font-bold flex items-center space-x-1.5 shrink-0"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Sections</span>
        </button>

        <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none text-[11px] font-mono">
          {navSections.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id as any)}
              className={`px-2 py-1 rounded-lg shrink-0 transition-all font-bold ${
                activeSection === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#0a101f] text-slate-400 hover:text-white'
              }`}
            >
              {s.title.split('.')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. DUAL-PANE BODY: SIDEBAR NAV + ARTICLE CANVAS           */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden max-w-7xl w-full mx-auto relative">
        {/* Mobile backdrop for Table of Contents */}
        {isMobileTocOpen && (
          <div
            onClick={() => setIsMobileTocOpen(false)}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          />
        )}

        {/* ------------------------------------------------------- */}
        {/* LEFT SIDEBAR: TABLE OF CONTENTS & QUICK SEARCH          */}
        {/* ------------------------------------------------------- */}
        <aside className={`
          fixed inset-y-0 left-0 z-50 w-[290px] bg-[#060a14] border-r border-[#142036] flex flex-col shadow-2xl transition-transform duration-200
          ${isMobileTocOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:w-[280px] xl:w-[320px] lg:z-10 lg:shadow-none overflow-hidden
        `}>
          {/* Search Box & Mobile Close */}
          <div className="p-3 border-b border-[#142036] flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search paper sections..."
                className="w-full bg-[#0a101f] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            <button
              onClick={() => setIsMobileTocOpen(false)}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section Navigation List */}
          <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
            {filteredSections.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSection(item.id as any);
                    setIsMobileTocOpen(false);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl transition-all flex items-start space-x-2.5 border ${
                    isActive
                      ? 'bg-[#0f1b33] border-cyan-500/70 text-white shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#090f1d]'
                  }`}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${isActive ? 'bg-cyan-500 text-black font-bold' : 'bg-[#0d1527] text-slate-400'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className={`text-xs font-mono font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                      {item.title}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {item.desc}
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-cyan-400 shrink-0 self-center" />}
                </button>
              );
            })}
          </nav>

          {/* Key Reference Stats Drawer */}
          <div className="p-3 border-t border-[#142036] bg-[#070b16] space-y-2 text-[10px] font-mono">
            <span className="text-slate-500 font-bold block uppercase tracking-wider">Testbed Reference Values</span>
            <div className="grid grid-cols-2 gap-1.5 text-slate-300">
              <div className="bg-[#0a101f] p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[9px]">RAW RATE</span>
                <strong className="text-cyan-300 text-xs">1000 bps</strong>
              </div>
              <div className="bg-[#0a101f] p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[9px]">GATE THRESHOLD</span>
                <strong className="text-emerald-300 text-xs">τ* = 0.80</strong>
              </div>
              <div className="bg-[#0a101f] p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[9px]">TRANSFORMER</span>
                <strong className="text-purple-300 text-xs">74,281 Params</strong>
              </div>
              <div className="bg-[#0a101f] p-1.5 rounded border border-slate-800">
                <span className="text-slate-500 block text-[9px]">PRECISION</span>
                <strong className="text-white text-xs">97.13 %</strong>
              </div>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------- */}
        {/* RIGHT MAIN ARTICLE CANVAS                               */}
        {/* ------------------------------------------------------- */}
        <main className="flex-1 bg-[#050813] overflow-y-auto p-5 lg:p-7 space-y-6">
          {/* SECTION 1: EXECUTIVE ABSTRACT & MOTIVATION */}
          {activeSection === 'abstract' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Section I &amp; II
                </span>
                <h2 className="text-xl font-bold text-white font-mono">
                  Executive Abstract &amp; Physical Link Motivation
                </h2>
                <p className="text-xs text-slate-400">
                  Visible Light Communication (VLC) / LiFi Line-of-Sight Blockage Characterization
                </p>
              </div>

              {/* Verbatim Abstract Card */}
              <div className="p-5 rounded-xl bg-[#090f1e] border border-[#162540] shadow-xl space-y-3">
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Research Manuscript Abstract</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans text-justify">
                  Visible light communication (VLC) and Light Fidelity (LiFi) links are highly sensitive to temporary line-of-sight blockage. Unlike independent bit errors, a physical obstruction can remove a contiguous interval of symbols, producing a burst loss whose duration and location depend on obstruction dynamics and link geometry. This paper presents <strong>SemLiFi</strong>, a cross-layer burst-recovery framework combining a physically implemented LiFi testbed, controlled optical occlusion, empirical burst characterization, Burst-Aware Semantic Reconstruction (BASR), and a Confidence-Gated Fallback Protocol (CGFP).
                </p>
                <p className="text-xs text-slate-300 leading-relaxed font-sans text-justify">
                  BASR reconstructs missing structured telemetry from surviving context and burst information, while CGFP routes each reconstruction either to semantic acceptance or to selective exact recovery. The prototype uses ESP32 transmit and receive nodes, on–off keying with Manchester coding, a high-intensity LED, a BPW34 photodiode, an LM358 transimpedance amplifier, CRC-8 validation, and an SG90 servo-controlled optical flap.
                </p>
              </div>

              {/* The Core Research Problem */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#080d19] border border-amber-900/60 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 font-mono uppercase">
                    1. Why Pure FEC (Reed-Solomon) Fails
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Classical forward error correction assumes random, memoryless noise. The evaluated <code>RS(33,25)</code> code corrects at most <strong>t = 4 symbol errors</strong>. A physical optical obstruction (e.g. human crossing or servo flap) erases <strong>10 to 25 contiguous bytes</strong> at once, completely exceeding algebraic FEC bounds.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#080d19] border border-blue-900/60 space-y-2">
                  <h4 className="text-xs font-bold text-blue-300 font-mono uppercase">
                    2. Why Pure ARQ Causes Severe Latency
                  </h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Automatic Repeat Request guarantees 100% exactness by retransmitting frames. However, during an optical blockage, repeated retransmission requests stall the link, inflating mean recovery latency to <strong>1560.0 ms</strong> and consuming excessive return bandwidth.
                  </p>
                </div>
              </div>

              {/* Cross Layer Architecture Diagram */}
              <div className="p-4 rounded-xl bg-[#070c18] border border-[#142036] space-y-3 font-mono text-xs">
                <span className="text-slate-400 font-bold block text-[11px] uppercase">
                  Figure 1: Cross-Layer Pipeline (Equation 9)
                </span>
                <div className="p-3 bg-[#03060c] rounded-lg border border-slate-800 text-cyan-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="p-2 rounded bg-blue-950 border border-blue-600 text-center">
                    <span className="text-[10px] text-blue-400 block font-bold">PHYSICAL LAYER</span>
                    <strong>Optical Link + Burst T_B</strong>
                  </div>
                  <span className="text-slate-500 font-bold">→</span>
                  <div className="p-2 rounded bg-purple-950 border border-purple-600 text-center">
                    <span className="text-[10px] text-purple-400 block font-bold">SEMANTIC LAYER</span>
                    <strong>BASR Transformer f(Y^-, Y^+, B)</strong>
                  </div>
                  <span className="text-slate-500 font-bold">→</span>
                  <div className="p-2 rounded bg-cyan-950 border border-cyan-600 text-center">
                    <span className="text-[10px] text-cyan-400 block font-bold">CONFIDENCE GATE</span>
                    <strong>CGFP (C ≥ 0.80 ?)</strong>
                  </div>
                  <span className="text-slate-500 font-bold">→</span>
                  <div className="p-2 rounded bg-emerald-950 border border-emerald-600 text-center">
                    <span className="text-[10px] text-emerald-400 block font-bold">DUAL ROUTING</span>
                    <strong>Accept / ARQ Fallback</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PHYSICAL HARDWARE TESTBED */}
          {activeSection === 'hardware' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Section III &amp; IV
                </span>
                <h2 className="text-xl font-bold text-white font-mono">
                  Physical Testbed &amp; Circuit Schematics (Table II)
                </h2>
                <p className="text-xs text-slate-400">
                  Dual-Breadboard Optical Setup with Microsecond Hardware Timers
                </p>
              </div>

              {/* Hardware Matrix Table */}
              <div className="rounded-xl border border-[#162540] bg-[#080d19] overflow-hidden shadow-xl">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#0b1324] text-slate-400 border-b border-[#162540] text-left">
                      <th className="p-3">Component / Subsystem</th>
                      <th className="p-3">Specification &amp; Hardware Pin</th>
                      <th className="p-3">Operational Role in SemLiFi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Transmitter Node (TX)</td>
                      <td className="p-3 font-mono">ESP32-WROOM-32D (GPIO 23)</td>
                      <td className="p-3 font-sans">Serializes structured telemetry with Dallas/Maxim CRC-8 (0x31)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Optical Emitter</td>
                      <td className="p-3 font-mono">High-Intensity White LED (10 mm)</td>
                      <td className="p-3 font-sans">Emits high radiant flux at λ = 650 nm across 15.0 cm free-space path</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Transistor Driver</td>
                      <td className="p-3 font-mono">S8050 NPN BJT (TO-92)</td>
                      <td className="p-3 font-sans">Isolates GPIO pin and switches 120 mA optical pulses with &lt; 25 ns rise time</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Physical Occluder</td>
                      <td className="p-3 font-mono">SG90 9g Micro Servo Motor</td>
                      <td className="p-3 font-sans">Sweeps an opaque physical flap to generate repeatable 15 - 380 ms bursts</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Photodetector</td>
                      <td className="p-3 font-mono">BPW34 Silicon PIN Photodiode</td>
                      <td className="p-3 font-sans">Reverse-biased detector with 7.5 mm² radiant area and 0.55 A/W responsivity</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Preamplifier (TIA)</td>
                      <td className="p-3 font-mono">LM358 Dual Operational Amplifier</td>
                      <td className="p-3 font-sans">Transimpedance circuit converts microamp photocurrent to 0.0 - 3.3V voltage</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Receiver Node (RX)</td>
                      <td className="p-3 font-mono">ESP32 ADC Input (GPIO 34)</td>
                      <td className="p-3 font-sans">Performs mid-bit sampling (450 - 550 µs window) with 50 count slicing threshold</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-cyan-300">Line Modulation</td>
                      <td className="p-3 font-mono">Manchester OOK (Tb = 1000 µs)</td>
                      <td className="p-3 font-sans">Guarantees mid-bit transitions for clock sync and immediate invalid-transition detection</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Dallas CRC-8 Verification Box */}
              <div className="p-4 rounded-xl bg-[#080d19] border border-[#162540] space-y-2">
                <span className="text-xs font-mono font-bold text-white uppercase flex items-center space-x-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Dallas/Maxim CRC-8 Polynomial Formulation</span>
                </span>
                <div className="p-2.5 bg-[#03060c] rounded-lg border border-slate-800 text-cyan-200 font-mono text-xs">
                  {"G(x) = x⁸ + x⁵ + x⁴ + 1  [Dallas/Maxim Poly: 0x31]"}
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  The CRC-8 byte is verified strictly at bit level. If CRC fails, the frame is marked as corrupted; semantic reconstruction is never certified by CRC alone.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 3: BURST CHARACTERIZATION */}
          {activeSection === 'burst' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Section IV-D
                </span>
                <h2 className="text-xl font-bold text-white font-mono">
                  Empirical Optical Burst Characterization
                </h2>
                <p className="text-xs text-slate-400">
                  56 Real-World Blockage Measurements Across Three Physical Profiles
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#080d19] border border-cyan-800/60 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-cyan-300 uppercase">PROFILE P1 (MILD)</span>
                  <div className="text-lg font-bold text-white font-mono">15 - 40 ms</div>
                  <p className="text-xs text-slate-300 font-sans">
                    Glancing edge occlusion. Affects 2 to 4 symbols. Easily reconstructed with high confidence.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#080d19] border border-amber-800/60 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-amber-300 uppercase">PROFILE P2 (LONG)</span>
                  <div className="text-lg font-bold text-white font-mono">150 - 380 ms</div>
                  <p className="text-xs text-slate-300 font-sans">
                    Nominal 250 ms blockage. Affects 15 to 25 symbols. Exceeds pure algebraic RS-FEC capability.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#080d19] border border-purple-800/60 space-y-2">
                  <span className="text-[10px] font-mono font-bold text-purple-300 uppercase">PROFILE P3 (MIXED)</span>
                  <div className="text-lg font-bold text-white font-mono">Randomized</div>
                  <p className="text-xs text-slate-300 font-sans">
                    Stochastic servo flutter. Used for disjoint 664/641 calibration/test evaluation splits.
                  </p>
                </div>
              </div>

              {/* Mathematical Burst Model Callout */}
              <div className="p-4 rounded-xl bg-[#080d19] border border-[#162540] space-y-2 font-mono text-xs">
                <span className="text-slate-400 font-bold block text-[11px] uppercase">
                  Equations (6) - (8): Physical Burst Formulation
                </span>
                <div className="p-3 bg-[#03060c] rounded-lg border border-slate-800 text-cyan-200 space-y-1 font-mono text-xs">
                  <div>{"T_B = t_e - t_s  [Physical burst duration in ms]"}</div>
                  <div>{"N_B ≈ T_B / T_b = T_B / 1000 µs  [Approximate lost bits count]"}</div>
                  <div>{"ρ_B = N_B / N_payload  [Normalized burst loss span]"}</div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: BASR EDGE TRANSFORMER */}
          {activeSection === 'basr' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Section V-B
                </span>
                <h2 className="text-xl font-bold text-white font-mono">
                  BASR Edge-Constrained Transformer Architecture
                </h2>
                <p className="text-xs text-slate-400">
                  Compact 74,281-Parameter Model Fitting Inside Microcontroller RAM
                </p>
              </div>

              {/* Hyperparameters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-[#080d19] border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">MODEL DIMENSION</span>
                  <strong className="text-white text-sm">d_model = 64</strong>
                </div>
                <div className="p-3 bg-[#080d19] border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">ATTENTION HEADS</span>
                  <strong className="text-cyan-300 text-sm">4 Heads</strong>
                </div>
                <div className="p-3 bg-[#080d19] border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">ENCODER LAYERS</span>
                  <strong className="text-purple-300 text-sm">2 Layers</strong>
                </div>
                <div className="p-3 bg-[#080d19] border border-slate-800 rounded-lg">
                  <span className="text-slate-500 block text-[10px]">FEED-FORWARD DIM</span>
                  <strong className="text-emerald-300 text-sm">d_ff = 96</strong>
                </div>
              </div>

              {/* 75,000 Budget Justification */}
              <div className="p-4 rounded-xl bg-[#090f1e] border border-purple-900/60 space-y-2">
                <h4 className="text-xs font-bold text-purple-300 font-mono uppercase">
                  Strict Edge Parameter Budget (&lt; 75,000 Parameters)
                </h4>
                <p className="text-xs text-slate-300 font-sans leading-relaxed">
                  Unlike cloud-based LLMs, BASR is constrained to embedded devices with limited SRAM. The reported model contains <strong>74,281 trainable parameters</strong> against a 75,000 parameter budget, representing <strong>99.04% utilization</strong>. It processes contextual prefix <code>Y^-</code> and suffix <code>Y^+</code> conditioned explicitly on corruption mask <code>B</code>.
                </p>
              </div>

              {/* Empirical Accuracy Table */}
              <div className="rounded-xl border border-[#162540] bg-[#080d19] overflow-hidden">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#0b1324] text-slate-400 border-b border-[#162540] text-left">
                      <th className="p-3">Field / Evaluation Metric</th>
                      <th className="p-3">Measured Accuracy</th>
                      <th className="p-3">Academic Significance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-bold text-white">Exact Full-String Reconstruction</td>
                      <td className="p-3 text-cyan-300 font-bold">42.63 ± 1.47 %</td>
                      <td className="p-3 font-sans">Character-exact string reproduction across all fields</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Motor State Field Accuracy</td>
                      <td className="p-3 text-emerald-300 font-bold">100.0 %</td>
                      <td className="p-3 font-sans">Critical actuator commands (MOTOR=ON / OFF) preserved with zero error</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-white">Temperature Field (Within ±0.5°C)</td>
                      <td className="p-3 text-purple-300 font-bold">96.8 %</td>
                      <td className="p-3 font-sans">Physical analog trends tracked without discontinuous spikes</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: CGFP PROTOCOL & MATHEMATICS */}
          {activeSection === 'cgfp' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Section VI
                </span>
                <h2 className="text-xl font-bold text-white font-mono">
                  Confidence-Gated Fallback Protocol (CGFP)
                </h2>
                <p className="text-xs text-slate-400">
                  Mathematical Multi-Factor Confidence Scoring &amp; Decision Logic
                </p>
              </div>

              {/* Master Equation Card */}
              <div className="p-5 rounded-xl bg-[#090f1e] border-2 border-emerald-500/50 shadow-xl space-y-2 font-mono">
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest block">
                  Equation (10): Unified Confidence Evaluation
                </span>
                <div className="text-base sm:text-lg text-white font-bold">
                  {"C = C_token · C_phys · Penalty_burst(span) · S_syntax"}
                </div>
              </div>

              {/* Four Factor Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 space-y-1.5">
                  <strong className="text-cyan-300 font-mono">1. Token Confidence (C_token):</strong>
                  <p className="text-slate-300 leading-relaxed">
                    Minimum softmax probability assigned by the Transformer to the generated sequence tokens.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 space-y-1.5">
                  <strong className="text-emerald-300 font-mono">2. Physical Channel SNR (C_phys):</strong>
                  <p className="text-slate-300 leading-relaxed">
                    Observed signal-to-noise ratio and baseline optical stability preceding the occlusion event.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 space-y-1.5">
                  <strong className="text-amber-300 font-mono">3. Non-Linear Burst Penalty:</strong>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {"Penalty = max(0.2, 1.0 - 0.50 × (span / 30)^1.15). Long burst spans reduce confidence."}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 space-y-1.5">
                  <strong className="text-rose-400 font-mono">{"4. Hard Syntax Gate (S_syntax ∈ {0, 1}):"}</strong>
                  <p className="text-slate-300 leading-relaxed">
                    Binary structure validator. If telemetry formatting violates syntax rules, S_syntax = 0, instantly forcing C = 0.00.
                  </p>
                </div>
              </div>

              {/* Decision Rule */}
              <div className="p-4 rounded-xl bg-[#080d19] border border-[#162540] space-y-2 font-mono text-xs">
                <span className="text-slate-400 font-bold block text-[11px] uppercase">
                  Equation (11): Calibrated Routing Rule (τ* = 0.80)
                </span>
                <div className="p-3 bg-[#03060c] rounded-lg border border-slate-800 text-cyan-200 space-y-1">
                  <div>{"Decision D = (C >= τ*) ? ACCEPT_SEMANTIC_PATCH : SELECTIVE_EXACT_FALLBACK"}</div>
                </div>
                <p className="text-xs text-slate-400 font-sans">
                  The calibrated operating point τ* = 0.80 achieves 97.13% precision, avoiding 27.15% of retransmissions while retaining a 0.00% live undetected error rate.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 6: EXPERIMENTAL RESULTS */}
          {activeSection === 'results' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Section VII
                </span>
                <h2 className="text-xl font-bold text-white font-mono">
                  Comparative Performance Evaluation (Table VII)
                </h2>
                <p className="text-xs text-slate-400">
                  Empirical Benchmark Against RS(33,25) FEC and Stop-and-Wait ARQ
                </p>
              </div>

              <div className="rounded-xl border border-[#162540] bg-[#080d19] overflow-hidden shadow-xl">
                <table className="w-full text-xs font-mono border-collapse">
                  <thead>
                    <tr className="bg-[#0b1324] text-slate-400 border-b border-[#162540] text-left">
                      <th className="p-3">Recovery Architecture</th>
                      <th className="p-3">Delivery Rate</th>
                      <th className="p-3">Mean Latency</th>
                      <th className="p-3">UFER Bound</th>
                      <th className="p-3">Retransmission Overhead</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    <tr>
                      <td className="p-3 font-bold text-slate-400">No Recovery (Lower Bound)</td>
                      <td className="p-3 text-rose-400">0.0 % (in burst)</td>
                      <td className="p-3">449.0 ms</td>
                      <td className="p-3 text-rose-400 font-bold">100.0 %</td>
                      <td className="p-3">0.0 %</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-300">Reed-Solomon RS(33,25)</td>
                      <td className="p-3 text-amber-300">37.5 %</td>
                      <td className="p-3">468.2 ms</td>
                      <td className="p-3 text-amber-300">62.5 %</td>
                      <td className="p-3">0.0 % (Forward-only)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-blue-300">Stop-and-Wait ARQ</td>
                      <td className="p-3 text-white">97.1 %</td>
                      <td className="p-3 text-rose-400 font-bold">1560.0 ms (Slow)</td>
                      <td className="p-3 text-emerald-400">0.00 %</td>
                      <td className="p-3 text-rose-300">100.0 % of corrupted</td>
                    </tr>
                    <tr className="bg-emerald-950/25 border-y-2 border-emerald-500/80">
                      <td className="p-3 font-bold text-emerald-300 flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>SemLiFi (BASR + CGFP)</span>
                      </td>
                      <td className="p-3 font-bold text-emerald-300">100.0 %</td>
                      <td className="p-3 font-bold text-emerald-300">790.7 ms (Continuous)</td>
                      <td className="p-3 font-bold text-emerald-300">0.00 % (Live HW)</td>
                      <td className="p-3 font-bold text-emerald-300">27.15 % AVOIDED</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 7: INTERACTIVE CGFP CALCULATOR */}
          {activeSection === 'calculator' && (
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                  Section VII-B
                </span>
                <h2 className="text-xl font-bold text-white font-mono flex items-center space-x-2">
                  <Calculator className="w-5 h-5 text-cyan-400" />
                  <span>Live CGFP Decision Gate Sandbox</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Simulate real-time routing decisions by tuning token probabilities, burst durations, and structural constraints.
                </p>
              </div>

              {/* Parameter Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
                {/* 1. Token Confidence */}
                <div className="p-4 bg-[#080d19] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">1. Token Confidence (C_token):</span>
                    <strong className="text-cyan-300">{calcTokenConf.toFixed(2)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.40"
                    max="1.00"
                    step="0.01"
                    value={calcTokenConf}
                    onChange={(e) => setCalcTokenConf(Number(e.target.value))}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.40 (Uncertain)</span>
                    <span>1.00 (Perfect Match)</span>
                  </div>
                </div>

                {/* 2. Channel SNR Confidence */}
                <div className="p-4 bg-[#080d19] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">2. Channel SNR (C_phys):</span>
                    <strong className="text-emerald-300">{calcPhysConf.toFixed(2)}</strong>
                  </div>
                  <input
                    type="range"
                    min="0.50"
                    max="1.00"
                    step="0.01"
                    value={calcPhysConf}
                    onChange={(e) => setCalcPhysConf(Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0.50 (Noisy / Occluded)</span>
                    <span>1.00 (Clean 28.4 dB)</span>
                  </div>
                </div>

                {/* 3. Burst Span */}
                <div className="p-4 bg-[#080d19] border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">3. Physical Burst Span (N_B):</span>
                    <strong className="text-amber-300">{calcBurstSpan} symbols</strong>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="40"
                    step="1"
                    value={calcBurstSpan}
                    onChange={(e) => setCalcBurstSpan(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>1 symbol (Penalty: 0.99)</span>
                    <span>Damping Factor: {burstPenalty.toFixed(3)}</span>
                    <span>40 symbols (Penalty: 0.20)</span>
                  </div>
                </div>

                {/* 4. Syntax Gate */}
                <div className="p-4 bg-[#080d19] border border-slate-800 rounded-xl flex flex-col justify-between">
                  <span className="text-slate-400">4. Structural Syntax Gate (S_syntax):</span>
                  <label className="flex items-center space-x-2.5 cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={calcSyntaxValid}
                      onChange={(e) => setCalcSyntaxValid(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                    <span className={`font-bold text-xs ${calcSyntaxValid ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {calcSyntaxValid ? 'Valid Telemetry Syntax (S_syntax = 1)' : 'Syntax Error Detected (S_syntax = 0)'}
                    </span>
                  </label>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    Hard safety veto: Invalid syntax immediately sets C = 0.00
                  </span>
                </div>
              </div>

              {/* Output Evaluation Card */}
              <div className="p-5 rounded-2xl bg-[#080d19] border-2 border-[#162540] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    EVALUATED CGFP MULTI-FACTOR SCORE:
                  </span>
                  <div className="text-xs font-mono">
                    <span className="text-slate-400 mr-1.5">Decision Threshold:</span>
                    <strong className="text-cyan-300">τ* = {calcThreshold.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="space-y-1 font-mono">
                    <div className="text-xs text-slate-400">Mathematical Evaluation:</div>
                    <div className="text-sm font-bold text-cyan-200">
                      C = {calcTokenConf.toFixed(2)} × {calcPhysConf.toFixed(2)} × {burstPenalty.toFixed(3)} × {syntaxFactor.toFixed(1)}
                    </div>
                    <div className="text-xl font-bold text-white mt-1">
                      Final Score: <span className={isAccepted ? 'text-emerald-400' : 'text-rose-400'}>{calcConfidence.toFixed(4)}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    {isAccepted ? (
                      <div className="inline-flex flex-col items-end">
                        <span className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500 text-emerald-300 font-mono font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-950/50">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>ACCEPT SEMANTIC PATCH</span>
                        </span>
                        <span className="text-[10px] text-emerald-400 font-mono mt-1.5">
                          Direct Delivery at 449.0 ms (Retransmission Avoided)
                        </span>
                      </div>
                    ) : (
                      <div className="inline-flex flex-col items-end">
                        <span className="px-4 py-2 rounded-xl bg-rose-950 border border-rose-500 text-rose-300 font-mono font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-rose-950/50">
                          <AlertTriangle className="w-4 h-4" />
                          <span>FALLBACK TO EXACT ARQ</span>
                        </span>
                        <span className="text-[10px] text-rose-400 font-mono mt-1.5">
                          {calcConfidence === 0
                            ? 'Hard Syntax Veto Triggered (S_syntax = 0)'
                            : `Confidence ${calcConfidence.toFixed(2)} < Threshold 0.80`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SemLiFiDocumentationHub;

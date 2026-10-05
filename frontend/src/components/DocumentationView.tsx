import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  HelpCircle, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  CheckCircle2, 
  Wrench,
  ChevronRight
} from 'lucide-react';

interface DocSection {
  id: number;
  title: string;
  category: string;
  content: string;
}

const DOCS: DocSection[] = [
  {
    id: 1,
    title: 'Project Overview',
    category: 'Introduction',
    content: 'SemLiFi is a cross-layer communications architecture combining physical burst-aware semantic reconstruction (BASR) with a confidence-gated fallback protocol (CGFP) for Visible Light Communication (LiFi) optical wireless links. It demonstrates how semantic intelligence can accelerate delivery without compromising reliability.'
  },
  {
    id: 2,
    title: 'Problem Statement',
    category: 'Introduction',
    content: 'Traditional Visible Light Communication links suffer severe degradation from temporary physical occlusions (moving people, objects, handheld movement, ambient light flicker). These occlusions cause contiguous burst losses lasting tens to hundreds of milliseconds, completely wiping out forward error correction (FEC) parity blocks and forcing slow, bandwidth-expensive ARQ retransmissions.'
  },
  {
    id: 3,
    title: 'Why LiFi Burst Loss Happens',
    category: 'Physics',
    content: 'Because visible light is an unguided, non-diffracting line-of-sight (LOS) medium with high directional attenuation, any physical obstacle intersecting the optical cone immediately extinguishes the received radiant flux. Unlike diffuse RF channels with multipath scattering, LiFi experiences sharp, contiguous erasures spanning hundreds of bits.'
  },
  {
    id: 4,
    title: 'Hardware Architecture',
    category: 'Hardware',
    content: 'The testbed consists of an ESP32 transmitter node driving a 2N2222 transistor optical driver and a high-intensity white LED; a line-of-sight free-space optical channel with an SG90 servo-actuated physical flap occluder; and a receiver comprising a BPW34 silicon PIN photodiode, an LM358-based transimpedance amplifier (TIA), and an ESP32 ADC sampling receiver at GPIO 34.'
  },
  {
    id: 5,
    title: 'Complete Breadboard Wiring & Audit',
    category: 'Hardware',
    content: 'Transmitter and receiver circuits are organized on dual 830-point solderless breadboards with dedicated power distribution rails. Documented connections include GPIO 23 to 2N2222 base, 2N2222 collector to LED cathode, BPW34 to LM358 inverting pin 2, and LM358 output to GPIO 34 ADC. Passive resistor/capacitor tie points are explicitly cataloged in the wiring database with verification audit trails.'
  },
  {
    id: 6,
    title: 'ESP32 Transmitter Node',
    category: 'Microcontroller',
    content: 'The transmitter node runs on an ESP32-WROOM-32D microcontroller operating at 240 MHz. Microsecond hardware timers modulate GPIO 23 to generate Manchester-encoded OOK symbol streams at a calibrated rate of 1000 bps with 1000 µs bit intervals.'
  },
  {
    id: 7,
    title: 'Transistor LED Driver',
    category: 'Circuits',
    content: 'Because microcontrollers cannot supply the high pulse currents (>100mA) required by high-intensity optical LEDs, a dedicated transistor switching stage isolates the MCU GPIO pin and switches high-current optical pulses with fast rise and fall times.'
  },
  {
    id: 8,
    title: '2N2222 NPN BJT',
    category: 'Components',
    content: 'The 2N2222 is an NPN silicon planar bipolar junction transistor in a TO-92 package. It operates as a saturated switch: driving base current turns the collector-emitter path ON with V_CE_sat < 0.3V, sinking current through the LED.'
  },
  {
    id: 9,
    title: 'High-Intensity LED Optical Emitter',
    category: 'Optoelectronics',
    content: 'Converts current pulses into visible photons with a Lambertian radiation pattern. At 1000 bps, optical emission transitions between nominal illumination (logic 1) and dark/cutoff (logic 0).'
  },
  {
    id: 10,
    title: 'Optical Channel & Line-of-Sight Path',
    category: 'Physics',
    content: 'Free-space distance between 20 cm and 50 cm. Optical irradiance decays with inverse square distance (E = I/d^2 * cos(theta)).'
  },
  {
    id: 11,
    title: 'SG90 Servo Actuator',
    category: 'Actuators',
    content: 'A 9g micro-servo operated via 50 Hz PWM. Sweeps an opaque occluder across the optical line-of-sight to create repeatable, controllable burst occlusion events.'
  },
  {
    id: 12,
    title: 'Optical Flap / Occluder',
    category: 'Actuators',
    content: 'An opaque physical barrier that intersects the optical beam, dropping photodiode irradiance below the receiver slicing threshold.'
  },
  {
    id: 13,
    title: 'BPW34 Silicon PIN Photodiode',
    category: 'Optoelectronics',
    content: 'A silicon PIN photodiode with a 7.5 mm^2 radiant sensitive area, fast 20ns rise time, and visible light responsivity ~0.55 A/W. Generates microamp photocurrent proportional to incident light.'
  },
  {
    id: 14,
    title: 'LM358 Transimpedance Amplifier (TIA)',
    category: 'Circuits',
    content: 'Converts photodiode photocurrent into a measurable analog voltage V_out = I_photo * Rf. Operates in single-supply mode with ground-sensing input stages.'
  },
  {
    id: 15,
    title: 'ESP32 Receiver Node',
    category: 'Microcontroller',
    content: 'Samples the LM358 analog voltage using internal 12-bit SAR ADC at GPIO 34 (ADC1_CH6). Executes the software OOK slicer, Manchester decoder, and CRC validation.'
  },
  {
    id: 16,
    title: 'ADC Sampling & Mid-Bit Window',
    category: 'Signal Processing',
    content: 'Sampling is performed in a mid-bit window of 450–550 µs into each bit period. This avoids transition transients and ensures stable signal slicing.'
  },
  {
    id: 17,
    title: 'On-Off Keying (OOK) Slicing',
    category: 'Modulation',
    content: 'An operating threshold of ~50 ADC counts separates illuminated optical pulses (~95–176 counts) from dark/blocked levels (~0–5 counts).'
  },
  {
    id: 18,
    title: 'Manchester Coding & Clock Recovery',
    category: 'Coding',
    content: 'Uses IEEE 802.3 convention: Bit 0 = Low-to-High (01), Bit 1 = High-to-Low (10). Transitions provide continuous clock synchronization and immediate burst violation detection.'
  },
  {
    id: 19,
    title: 'CRC-8 Dallas/Maxim Verification',
    category: 'Integrity',
    content: 'Frame integrity check uses polynomial x^8 + x^5 + x^4 + 1 (0x31). Dallas CRC-8 certifies exact bit-level transmission and detects frame erasures.'
  },
  {
    id: 20,
    title: 'Burst Detection & Gap Identification',
    category: 'Burst Processing',
    content: 'Identifies contiguous unavailable intervals TB from low ADC samples, Manchester transition violations, or CRC failures, and isolates surviving prefix/suffix context.'
  },
  {
    id: 21,
    title: 'Empirical Burst Dataset (56 Events)',
    category: 'Datasets',
    content: 'Documented physical occlusion dataset containing 56 empirical events across P1 (15–40 ms), P2 (150–380 ms), and P3 (mixed/randomized) profiles.'
  },
  {
    id: 22,
    title: 'BASR Neural Transformer Architecture',
    category: 'AI / BASR',
    content: 'Edge-constrained Transformer encoder with 74,281 trainable parameters, d_model=64, 4 attention heads, 2 encoder layers, and d_ff=96. Mean CPU inference latency is 2.79 ms.'
  },
  {
    id: 23,
    title: 'CGFP Confidence Scoring & Safety Gate',
    category: 'CGFP Gate',
    content: 'Combines token confidence, physical observation SNR, burst span penalty, and hard syntax validity: C = C_token * C_phys * Penalty_burst * S_syntax. Calibrated threshold τ* = 0.80.'
  },
  {
    id: 24,
    title: 'Selective Exact Fallback (ARQ)',
    category: 'Reliability',
    content: 'When CGFP score falls below 0.80, the receiver rejects the semantic prediction and issues a selective NACK over the return link, guaranteeing bit-level exact payload recovery.'
  },
  {
    id: 25,
    title: 'Simulation Lab Pipeline',
    category: 'Simulation',
    content: 'End-to-end digital twin executing 22 discrete physical, modulation, optical, and semantic steps for complete educational and research demonstrations.'
  },
  {
    id: 26,
    title: 'Experimental Methodology',
    category: 'Methodology',
    content: 'Evaluates recovery behavior across No Recovery, Reed-Solomon RS(33,25), Stop-and-Wait ARQ, pure BASR, and SemLiFi hybrid recovery.'
  },
  {
    id: 27,
    title: 'Reported Research Results',
    category: 'Results',
    content: 'Key paper findings: 49.3% latency reduction vs ARQ under burst simulation (790.7ms vs 1560ms), 27.15% retransmissions avoided, 97.13% patch precision, 0.78% patch error rate.'
  },
  {
    id: 28,
    title: 'Limitations & Evidence Boundaries',
    category: 'Discussion',
    content: 'The study operates within an edge-constrained 1000 bps envelope with structured telemetry. Performance under high mobility, intense ambient sunlight, or arbitrary encrypted binary streams requires future research.'
  },
  {
    id: 29,
    title: 'Future Work',
    category: 'Future Work',
    content: 'Planned extensions include multi-user LiFi uplink integration, adaptive optics alignment, dynamic vocabulary expansion, and hardware acceleration on tinyML microcontrollers.'
  },
  {
    id: 30,
    title: 'Hardware Troubleshooting & Diagnostic Logic',
    category: 'Troubleshooting',
    content: 'Comprehensive diagnostics: If ADC is always ~0 (check BPW34 orientation, LM358 power rail, optical alignment). If ADC is always high (check ambient saturation, threshold calibration). If CRC fails (check Manchester timing, burst status).'
  },
];

export const DocumentationView: React.FC = () => {
  const [selectedDoc, setSelectedDoc] = useState<DocSection>(DOCS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Troubleshooting Checklist State
  const [checklist, setChecklist] = useState<{ [key: string]: boolean }>({
    'ESP32 TX connected': false,
    'ESP32 RX connected': false,
    'Breadboard power connected': false,
    'Breadboard ground connected': false,
    'LED driver connected': false,
    '2N2222 connected': false,
    'LED connected': false,
    'BPW34 connected': false,
    'LM358 connected': false,
    'ADC connected': false,
    'SG90 connected': false,
    'Optical path aligned': false,
    'USB/power connected': false,
    'Serial communication working': false,
  });

  const toggleCheck = (item: string) => {
    setChecklist((prev) => ({ ...prev, [item]: !prev[item] }));
  };

  const filteredDocs = DOCS.filter(
    (d) =>
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">SemLiFi Technical Documentation & Diagnostics</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete 30-chapter research documentation, engineering guides, and hardware verification checklist
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
          30 Documented Chapters
        </span>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-xl space-y-3 max-h-[760px] overflow-y-auto">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search chapters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-1">
            {filteredDocs.map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDoc(d)}
                className={`w-full text-left px-3 py-2 rounded-lg border text-xs transition flex items-center justify-between ${
                  selectedDoc.id === d.id
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 font-bold'
                    : 'bg-slate-900/30 border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="truncate pr-2">
                  <span className="font-mono text-[10px] text-slate-500 mr-2">{d.id.toString().padStart(2, '0')}.</span>
                  <span>{d.title}</span>
                </div>
                <ChevronRight className="w-3 h-3 shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Selected Chapter Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
            <div className="border-b border-slate-800 pb-3">
              <span className="text-[10px] uppercase font-mono text-cyan-400 font-bold">
                Chapter {selectedDoc.id} • {selectedDoc.category}
              </span>
              <h3 className="text-xl font-bold text-white mt-1">{selectedDoc.title}</h3>
            </div>

            <div className="text-sm text-slate-300 leading-relaxed font-sans space-y-3">
              <p>{selectedDoc.content}</p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 text-xs text-slate-500 font-mono">
              Citation: SemLiFi Research Formal Journal Specification (2026)
            </div>
          </div>

          {/* Interactive Hardware Checklist (Section 20 & 21) */}
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <Wrench className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-semibold text-white">Physical Hardware Validation Checklist</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
              {Object.keys(checklist).map((item) => (
                <button
                  key={item}
                  onClick={() => toggleCheck(item)}
                  className={`flex items-center space-x-2.5 p-2 rounded-lg border text-left transition ${
                    checklist[item]
                      ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                      : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  {checklist[item] ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                  <span className="font-mono text-[11px] truncate">{item}</span>
                </button>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 italic pt-1">
              Do not automatically mark items without hardware verification evidence.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

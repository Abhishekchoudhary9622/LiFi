import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  X,
  Sparkles,
  CheckCircle2,
  Cpu,
  Zap,
  Radio,
  Eye,
  Activity,
  FileText,
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { DIGITAL_TWIN_COMPONENTS } from '../../model/digitalTwin';

interface PresentationStep {
  number: string;
  stepIndex: number;
  title: string;
  subtitle: string;
  componentId: string;
  photoUrl: string;
  description: string;
  technicalDetail: string;
  keyHighlight: string;
  badge: string;
  icon: any;
}

const PRESENTATION_STEPS: PresentationStep[] = [
  {
    number: '01',
    stepIndex: 1,
    title: 'DIGITAL DATA PAYLOAD',
    subtitle: 'Message Serialization & Framing',
    componentId: 'stm32_tx',
    photoUrl: '/hardware/stm32_board.jpg',
    description: 'The host system supplies alphanumeric data (e.g. "Hello SemLiFi! 🚀"). The transmission engine serializes the characters into an 8-bit binary stream with start-of-frame synchronization and CRC-8 integrity tags.',
    technicalDetail: 'Frame Format: [PREAMBLE: 0xAA] + [LEN: 1 Byte] + [PAYLOAD] + [CRC-8]',
    keyHighlight: 'Pure digital bit stream ready for high-frequency optical modulation.',
    badge: 'STAGE 1: ENCODING',
    icon: FileText
  },
  {
    number: '02',
    stepIndex: 2,
    title: 'STM32 TX TRANSMITTER',
    subtitle: 'Hardware Carrier Modulation',
    componentId: 'stm32_tx',
    photoUrl: '/hardware/stm32_board.jpg',
    description: 'The STM32F103C8 ARM Cortex-M3 processor (72 MHz) drives pin PA9 using hardware Timer 1 Channel 2, generating a jitter-free 10 kHz On-Off Keying (OOK) modulated square-wave carrier.',
    technicalDetail: 'PA9 configured in Alternate Function Push-Pull mode; TIM1_CH2 hardware PWM.',
    keyHighlight: 'Zero software latency and microsecond-level edge precision.',
    badge: 'STAGE 2: MODULATION',
    icon: Cpu
  },
  {
    number: '03',
    stepIndex: 3,
    title: 'TRANSMITTER LED & DRIVER',
    subtitle: 'Electro-Optical Transduction',
    componentId: 'led_tx',
    photoUrl: '/hardware/led_macro.jpg',
    description: 'The STM32 logic pin switches a 2N2222 NPN transistor into saturation, sinking 14.5 mA through the 220 Ω limiter into the 5 mm Red LED (650 nm wavelength), converting electrical bits into modulated radiant light flux.',
    technicalDetail: 'Transistor V_CE(sat) = 0.2V; LED forward drop = 1.85V; current limiter = 220 Ω.',
    keyHighlight: 'Instantaneous nanosecond optical switching without thermal distortion.',
    badge: 'STAGE 3: OPTICAL TX',
    icon: Zap
  },
  {
    number: '04',
    stepIndex: 4,
    title: 'OPTICAL LIGHT CHANNEL',
    subtitle: 'Free-Space Line-of-Sight Medium',
    componentId: 'optical_channel',
    photoUrl: '/hardware/full_hardware_setup.jpg',
    description: 'Modulated photons travel across the 15 cm – 35 cm free-space air gap at the speed of light (≈ 3 × 10⁸ m/s). Light is physically contained within the room, ensuring zero RF leakage and complete EMI immunity.',
    technicalDetail: 'Lambertian emission model: Optical irradiance attenuates following the 1/d² inverse-square law.',
    keyHighlight: 'Zero electromagnetic interference (safe in hospitals, aircraft, and hazardous areas).',
    badge: 'STAGE 4: AIR GAP',
    icon: Radio
  },
  {
    number: '05',
    stepIndex: 5,
    title: 'PHOTODIODE DETECTOR',
    subtitle: 'Photon Absorption & Photocurrent',
    componentId: 'photodiode_rx',
    photoUrl: '/hardware/photodiode_macro.jpg',
    description: 'The BPW34 silicon PIN photodiode (7.5 mm² active die area) absorbs the incident 650 nm photons in reverse-bias mode, producing a microampere photocurrent (≈ 42.8 µA peak) directly proportional to the received light flux.',
    technicalDetail: 'Responsivity R = 0.62 A/W at 650 nm; Reverse bias reduces junction capacitance for 20 ns rise time.',
    keyHighlight: 'High spectral sensitivity with ultra-low 2 nA dark noise current.',
    badge: 'STAGE 5: OPTICAL RX',
    icon: Eye
  },
  {
    number: '06',
    stepIndex: 6,
    title: 'SIGNAL CONDITIONING (LM358)',
    subtitle: 'Transimpedance Amplification & Slicing',
    componentId: 'signal_conditioning',
    photoUrl: '/hardware/lm358_amplifier.jpg',
    description: 'Stage 1 converts the weak photocurrent into a measurable voltage using a 47 kΩ transimpedance amplifier. Stage 2 slices the signal against a 1.65 V reference comparator, eliminating noise and restoring sharp 3.3 V logic edges.',
    technicalDetail: 'TIA Gain: V_out = I_ph × R_f (47 kΩ) + V_ref; Stage 2 Comparator output swing: 0.04 V to 3.26 V.',
    keyHighlight: 'Filters ambient fluorescent lamp ripple and generates crisp TTL square waves.',
    badge: 'STAGE 6: ANALOG FRONT-END',
    icon: Activity
  },
  {
    number: '07',
    stepIndex: 7,
    title: 'STM32 RX RECEIVER',
    subtitle: 'Input Capture Sampling & Decoding',
    componentId: 'stm32_rx',
    photoUrl: '/hardware/stm32_board.jpg',
    description: 'The receiver STM32F103C8 captures logic transitions on pin PA0 using hardware Timer 2 input capture DMA. It locks onto the carrier phase, extracts the serialized bitstream, and executes CRC-8 validation.',
    technicalDetail: '1.0 MSPS timer capture resolution; Double-buffered DMA circular packet queue.',
    keyHighlight: 'Autonomous hardware decoding with zero lost frames or CPU lockup.',
    badge: 'STAGE 7: DEMODULATION',
    icon: Cpu
  },
  {
    number: '08',
    stepIndex: 8,
    title: 'RECEIVED DATA OUTPUT',
    subtitle: 'Reconstructed Verified Information',
    componentId: 'stm32_rx',
    photoUrl: '/hardware/full_hardware_setup.jpg',
    description: 'The original payload "Hello SemLiFi! 🚀" is completely reconstructed, CRC verified with 100% fidelity, and routed to the host serial console or digital twin display.',
    technicalDetail: 'Packet Verification: CRC-8 Match (0x7F = 0x7F) • Bit Errors: 0 • BER: < 1.0 × 10⁻⁵',
    keyHighlight: '100% transmission success over Visible Light Communication.',
    badge: 'STAGE 8: SUCCESS',
    icon: CheckCircle2
  }
];

export const PresentationModePage: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(false);

  const step = PRESENTATION_STEPS[currentStepIndex];

  // Auto-play timer (5 seconds per slide)
  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % PRESENTATION_STEPS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [autoPlay]);

  const handleNext = () => {
    setCurrentStepIndex((prev) => Math.min(PRESENTATION_STEPS.length - 1, prev + 1));
  };

  const handlePrev = () => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#050811] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">
      {/* Top Presentation Bar */}
      <div className="px-8 py-4 border-b border-[#1b263b] bg-[#090e1c]/90 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs uppercase font-mono tracking-widest text-blue-400 font-semibold">
              FINAL ROUND PRESENTATION SYSTEM
            </div>
            <h1 className="text-sm font-bold text-white tracking-wide">
              HOW SEMLiFi WORKS: PHYSICAL END-TO-END DEMONSTRATION
            </h1>
          </div>
        </div>

        {/* Presentation Controls */}
        <div className="flex items-center gap-3">
          {/* Auto-Play Toggle */}
          <button
            onClick={() => setAutoPlay(!autoPlay)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition border ${
              autoPlay
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/40'
                : 'bg-[#0f172a] border-[#22324e] text-slate-300 hover:text-white'
            }`}
          >
            {autoPlay ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Pause Auto</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Auto Play (5s)</span>
              </>
            )}
          </button>

          {/* Exit Presentation */}
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit Presentation</span>
          </button>
        </div>
      </div>

      {/* Main Slide Body */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full p-8 gap-8 items-center justify-center overflow-hidden">
        {/* Left: Real Hardware Photograph with Step Focus Callout */}
        <div className="w-full lg:w-1/2 flex flex-col items-center">
          <div className="relative rounded-2xl overflow-hidden border-2 border-blue-500/40 shadow-2xl shadow-blue-950/60 w-full max-w-lg aspect-4/3 bg-[#0a0f1d] group">
            <img
              src={step.photoUrl}
              alt={step.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Stage badge on photo */}
            <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-blue-950/90 border border-blue-500/60 backdrop-blur-md text-xs font-mono text-blue-300 font-bold">
              {step.badge}
            </div>

            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-black/80 border border-slate-700 text-xs font-mono text-slate-300">
              PHYSICAL HARDWARE
            </div>

            {/* Bottom info strip on photo */}
            <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-[#090d18]/90 border border-[#1f2d48] backdrop-blur-md">
              <div className="text-[11px] font-mono text-cyan-400 font-semibold mb-0.5">
                VERIFIED HARDWARE NODE:
              </div>
              <div className="text-xs text-slate-200">
                {step.subtitle}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Technical Explanation, Viva Note & Engineering Architecture */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-5">
          {/* Step Pill */}
          <div className="flex items-center gap-3">
            <span className="text-4xl font-black font-mono text-blue-400 tracking-tighter">
              {step.number}
            </span>
            <div className="h-8 w-px bg-[#22324e]" />
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block">
                SEMLiFi PIPELINE STAGE
              </span>
              <span className="text-xs font-semibold text-cyan-300">
                {step.subtitle}
              </span>
            </div>
          </div>

          {/* Main Title */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {step.title}
          </h2>

          {/* Core Explanation Paragraph */}
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed bg-[#0b101c] p-4 rounded-xl border border-[#1d293d]">
            {step.description}
          </p>

          {/* Technical Viva Highlight Box */}
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Hardware Specification & Slicing</span>
            </div>
            <div className="text-xs font-mono text-slate-200 bg-[#070b14] p-2.5 rounded-lg border border-[#1e2c46]">
              {step.technicalDetail}
            </div>
            <div className="text-xs text-emerald-300 flex items-center gap-1.5 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>{step.keyHighlight}</span>
            </div>
          </div>

          {/* 8-Step Mini Progress Dots */}
          <div className="pt-2">
            <div className="flex items-center gap-2">
              {PRESENTATION_STEPS.map((s, idx) => (
                <button
                  key={s.number}
                  onClick={() => setCurrentStepIndex(idx)}
                  className={`h-2 flex-1 rounded-full transition-all ${
                    idx === currentStepIndex
                      ? 'bg-blue-500 shadow-md shadow-blue-500/50 scale-y-125'
                      : idx < currentStepIndex
                      ? 'bg-cyan-700/60'
                      : 'bg-[#1b263b]'
                  }`}
                  title={`Step ${s.number}: ${s.title}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation Dock */}
      <div className="px-8 py-4 border-t border-[#1b263b] bg-[#090e1c]/90 backdrop-blur-md flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0f172a] hover:bg-[#1a253c] disabled:opacity-30 disabled:pointer-events-none border border-[#233352] text-xs font-medium text-slate-200 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </button>

        {/* Active Stage Indicator */}
        <div className="text-xs font-mono text-slate-300">
          <span className="text-blue-400 font-bold">Step {currentStepIndex + 1}</span> of {PRESENTATION_STEPS.length}
        </div>

        <button
          onClick={handleNext}
          disabled={currentStepIndex === PRESENTATION_STEPS.length - 1}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:pointer-events-none text-white text-xs font-medium transition shadow-lg shadow-blue-900/40"
        >
          <span>Next Step</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

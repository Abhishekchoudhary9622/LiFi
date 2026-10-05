import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Radio,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Check,
  Copy,
  Sliders,
  Activity,
  Zap,
  Info,
  Layers,
  HelpCircle,
  FileCode,
  ArrowRight
} from 'lucide-react';

export interface MessageTransmissionStudioProps {
  projectName?: string;
  defaultMessage?: string;
}

export interface CharBitBreakdown {
  char: string;
  asciiDec: number;
  asciiHex: string;
  binary8: string;
  powersBreakdown: { power: number; bit: number; val: number }[];
}

export interface TransmissionBit {
  char: string;
  charIndex: number;
  bitIndexInByte: number;
  globalBitIndex: number;
  bitValue: 0 | 1;
  type: 'data' | 'start' | 'stop';
  label: string;
}

export const parseMessageToBits = (msg: string, useFraming: boolean): {
  breakdowns: CharBitBreakdown[];
  bits: TransmissionBit[];
} => {
  const breakdowns: CharBitBreakdown[] = [];
  const bits: TransmissionBit[] = [];
  let globalBitIdx = 0;

  for (let i = 0; i < msg.length; i++) {
    const ch = msg[i];
    const code = ch.charCodeAt(0);
    const hex = '0x' + code.toString(16).toUpperCase().padStart(2, '0');
    const binStr = code.toString(2).padStart(8, '0');

    const powers = [128, 64, 32, 16, 8, 4, 2, 1];
    const powersBreakdown = powers.map((p, idx) => {
      const bit = binStr[idx] === '1' ? 1 : 0;
      return { power: p, bit, val: bit * p };
    });

    breakdowns.push({
      char: ch,
      asciiDec: code,
      asciiHex: hex,
      binary8: binStr,
      powersBreakdown
    });

    if (useFraming) {
      bits.push({
        char: ch,
        charIndex: i,
        bitIndexInByte: 0,
        globalBitIndex: globalBitIdx++,
        bitValue: 0,
        type: 'start',
        label: `Start (0)`
      });
    }

    for (let b = 0; b < 8; b++) {
      const bitVal = (binStr[b] === '1' ? 1 : 0) as 0 | 1;
      bits.push({
        char: ch,
        charIndex: i,
        bitIndexInByte: useFraming ? b + 1 : b,
        globalBitIndex: globalBitIdx++,
        bitValue: bitVal,
        type: 'data',
        label: `Bit ${b} (${bitVal})`
      });
    }

    if (useFraming) {
      bits.push({
        char: ch,
        charIndex: i,
        bitIndexInByte: 9,
        globalBitIndex: globalBitIdx++,
        bitValue: 1,
        type: 'stop',
        label: `Stop (1)`
      });
    }
  }

  return { breakdowns, bits };
};

export const MessageTransmissionStudio: React.FC<MessageTransmissionStudioProps> = ({
  defaultMessage = 'HII'
}) => {
  const [messageInput, setMessageInput] = useState<string>(defaultMessage);
  const [useUartFraming, setUseUartFraming] = useState<boolean>(false);
  const [currentBitIdx, setCurrentBitIdx] = useState<number>(0);
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [transmissionSpeed, setTransmissionSpeed] = useState<number>(2); // bits per sec
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  // Audio tone generator
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playBitTone = (bitVal: 0 | 1) => {
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(bitVal === 1 ? 1200 : 450, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio not permitted
    }
  };

  const { breakdowns: charBreakdowns, bits: transmissionBits } = useMemo(() => {
    const text = messageInput.trim() || 'HII';
    return parseMessageToBits(text, useUartFraming);
  }, [messageInput, useUartFraming]);

  const activeBit = useMemo<TransmissionBit | null>(() => {
    if (!transmissionBits || transmissionBits.length === 0) return null;
    const idx = Math.min(Math.max(0, currentBitIdx), transmissionBits.length - 1);
    return transmissionBits[idx] || null;
  }, [transmissionBits, currentBitIdx]);

  const isCurrentBitOne = activeBit ? activeBit.bitValue === 1 : false;

  // Reconstructed string at receiver
  const reconstructedText = useMemo(() => {
    if (!transmissionBits || transmissionBits.length === 0) return '';
    let result = '';
    const bitsPerByte = useUartFraming ? 10 : 8;
    const completedBytes = Math.floor((currentBitIdx + 1) / bitsPerByte);
    for (let i = 0; i < Math.min(completedBytes, charBreakdowns.length); i++) {
      result += charBreakdowns[i].char;
    }
    return result;
  }, [currentBitIdx, useUartFraming, charBreakdowns, transmissionBits]);

  // Transmission Playback Loop
  useEffect(() => {
    if (!isTransmitting) return;

    const intervalMs = Math.max(80, Math.round(1000 / transmissionSpeed));
    const timer = setInterval(() => {
      setCurrentBitIdx(prev => {
        if (prev >= transmissionBits.length - 1) {
          setIsTransmitting(false);
          return prev;
        }
        const nextIdx = prev + 1;
        const bit = transmissionBits[nextIdx];
        if (bit) playBitTone(bit.bitValue);
        return nextIdx;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isTransmitting, transmissionSpeed, transmissionBits]);

  const handleStart = () => {
    if (currentBitIdx >= transmissionBits.length - 1) {
      setCurrentBitIdx(0);
    }
    setIsTransmitting(true);
    const bit = transmissionBits[0];
    if (bit) playBitTone(bit.bitValue);
  };

  const handleStep = (forward: boolean) => {
    setIsTransmitting(false);
    setCurrentBitIdx(prev => {
      const next = forward ? Math.min(transmissionBits.length - 1, prev + 1) : Math.max(0, prev - 1);
      const bit = transmissionBits[next];
      if (bit) playBitTone(bit.bitValue);
      return next;
    });
  };

  const handleReset = () => {
    setIsTransmitting(false);
    setCurrentBitIdx(0);
  };

  const handleCopySummary = () => {
    const text = `SemLiFi Message Transmission: "${messageInput}"\n` +
      charBreakdowns.map(b => `• '${b.char}': ASCII ${b.asciiDec} (${b.asciiHex}) = Binary ${b.binary8}`).join('\n') +
      `\n\nTotal Bits: ${transmissionBits.length}\nActive Bit #${currentBitIdx}: Value ${activeBit?.bitValue} (${isCurrentBitOne ? 'LED ON' : 'LED OFF'})\nDecoded: "${reconstructedText}"`;
    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#070b16] text-slate-100 overflow-y-auto p-4 lg:p-6 space-y-5 font-sans select-none">
      {/* ========================================================= */}
      {/* 1. TOP HEADER & TRANSMITTER CONSOLE CARD                  */}
      {/* ========================================================= */}
      <div className="bg-[#0b1324] border border-[#1a2b4a] rounded-2xl p-5 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center">
                <Radio className="w-4 h-4 text-cyan-400" />
              </div>
              <h1 className="text-base lg:text-lg font-bold text-white tracking-wide font-mono">
                Message Transmission &amp; Bit Simulation Studio
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Type any text to see how it is converted to ASCII, decomposed into binary bits, and physically pulsed as light.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySummary}
              className="px-3 py-1.5 rounded-lg bg-[#111c30] hover:bg-[#1a2a46] border border-cyan-800/40 text-cyan-300 text-xs font-mono flex items-center space-x-1.5 transition-all"
            >
              {copiedSummary ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSummary ? 'Copied!' : 'Copy Summary'}</span>
            </button>
          </div>
        </div>

        {/* Message Input & Quick Presets */}
        <div className="flex flex-wrap items-center justify-between gap-3 font-mono">
          <div className="flex items-center space-x-2">
            <span className="text-xs text-slate-300 font-bold">MESSAGE PAYLOAD:</span>
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value.toUpperCase());
                setCurrentBitIdx(0);
                setIsTransmitting(false);
              }}
              maxLength={24}
              placeholder="e.g. HII"
              className="w-36 sm:w-44 bg-[#080d19] border-2 border-cyan-500/80 rounded-xl px-3 py-1.5 text-white font-bold text-sm tracking-widest text-center focus:outline-none focus:border-cyan-400 shadow-inner"
            />

            <div className="flex flex-wrap items-center gap-1">
              {['HII', 'SEMLIFI', 'OK', 'SOS'].map((preset) => (
                <button
                  key={preset}
                  onClick={() => {
                    setMessageInput(preset);
                    setCurrentBitIdx(0);
                    setIsTransmitting(false);
                  }}
                  className={`px-2 py-0.5 rounded-lg text-xs font-bold border transition-all ${
                    messageInput === preset
                      ? 'bg-blue-600 text-white border-blue-400 shadow'
                      : 'bg-[#0f172a] text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Framing Mode Toggle */}
          <div className="flex items-center space-x-1 sm:space-x-1.5 bg-[#080d19] p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setUseUartFraming(false);
                setCurrentBitIdx(0);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] sm:text-xs ${!useUartFraming ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="hidden sm:inline">Raw 8-Bit Stream</span>
              <span className="sm:hidden">8-Bit Raw</span>
            </button>
            <button
              onClick={() => {
                setUseUartFraming(true);
                setCurrentBitIdx(0);
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] sm:text-xs ${useUartFraming ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              <span className="hidden sm:inline">UART 10-Bit Frame</span>
              <span className="sm:hidden">10-Bit UART</span>
            </button>
          </div>
        </div>

        {/* Playback Controls & Status Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080d1a] p-3 rounded-xl border border-[#16233a] font-mono text-xs">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleStep(false)}
              disabled={currentBitIdx <= 0}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#101b2e] hover:bg-[#182844] disabled:opacity-30 text-slate-300 border border-slate-700 flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Prev Bit</span>
            </button>

            {isTransmitting ? (
              <button
                onClick={() => setIsTransmitting(false)}
                className="px-3 sm:px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/30"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                onClick={handleStart}
                className="px-3 sm:px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/30"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Transmit</span>
              </button>
            )}

            <button
              onClick={() => handleStep(true)}
              disabled={currentBitIdx >= transmissionBits.length - 1}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#101b2e] hover:bg-[#182844] disabled:opacity-30 text-slate-300 border border-slate-700 flex items-center space-x-1"
            >
              <span className="hidden sm:inline">Next Bit</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleReset}
              className="p-1.5 hover:bg-[#182844] text-slate-400 hover:text-white rounded-lg border border-slate-700 ml-1"
              title="Reset to beginning"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Speed Selector */}
            <div className="hidden md:flex items-center space-x-1 ml-2 bg-[#0c1424] px-2 py-1 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-slate-400">Speed:</span>
              {[1, 2, 5, 10].map((s) => (
                <button
                  key={s}
                  onClick={() => setTransmissionSpeed(s)}
                  className={`px-1.5 py-0.5 rounded font-bold ${
                    transmissionSpeed === s ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {s} bps
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Active Bit Indicator */}
            <div className="flex items-center space-x-2 bg-[#0c1424] px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-slate-400">ACTIVE:</span>
              <span
                className={`px-2 py-0.5 rounded-full font-bold text-xs ${
                  isCurrentBitOne
                    ? 'bg-rose-950 text-rose-300 border border-rose-500 shadow-md shadow-rose-600/40 animate-pulse'
                    : 'bg-slate-800 text-slate-300 border border-slate-600'
                }`}
              >
                Bit #{currentBitIdx + 1}: <strong>{activeBit?.bitValue}</strong> ({isCurrentBitOne ? 'LED ON' : 'LED OFF'})
              </span>
            </div>

            {/* Decoded Output */}
            <div className="flex items-center space-x-2 bg-[#0c1424] px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-800 text-[11px]">
              <span className="text-slate-400">RX:</span>
              <strong className="text-emerald-300 font-bold text-sm tracking-wider">
                "{reconstructedText}"
              </strong>
              {reconstructedText === messageInput && (
                <Check className="w-4 h-4 text-emerald-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. CHARACTER-TO-BINARY MATHEMATICAL DECOMPOSITION         */}
      {/* ========================================================= */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-1.5">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Step 1: Character to ASCII &amp; Powers-of-2 Binary Breakdown</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {charBreakdowns.map((b, idx) => (
            <div
              key={idx}
              className="bg-[#0b1324] border border-[#1a2b4a] rounded-xl p-3.5 space-y-2.5 shadow-md"
            >
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-white font-bold text-sm flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    {b.char}
                  </span>
                  <span>Character '{b.char}'</span>
                </span>
                <span className="text-cyan-300 font-bold font-mono text-xs">
                  ASCII {b.asciiDec} ({b.asciiHex})
                </span>
              </div>

              <div className="font-mono text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">8-Bit Binary:</span>
                  <strong className="text-emerald-300 tracking-widest">{b.binary8}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Powers Calculation:</span>
                  <span className="text-amber-300">
                    {b.powersBreakdown.filter(p => p.bit === 1).map(p => p.power).join(' + ')} = {b.asciiDec}
                  </span>
                </div>
              </div>

              {/* Powers of 2 Grid */}
              <div className="grid grid-cols-8 gap-1 text-center font-mono text-[10px] pt-1 border-t border-slate-800">
                {b.powersBreakdown.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className={`p-1 rounded ${
                      p.bit === 1
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-600/70 font-bold shadow-sm'
                        : 'bg-[#060a14] text-slate-500'
                    }`}
                  >
                    <div className="text-[9px] text-slate-400">{p.power}</div>
                    <div className="text-xs font-bold">{p.bit}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. INTERACTIVE BITSTREAM SCRUBBER                         */}
      {/* ========================================================= */}
      <div className="bg-[#0b1324] border border-[#1a2b4a] rounded-xl p-4 shadow-md space-y-2">
        <div className="flex justify-between items-center text-xs font-mono border-b border-slate-800 pb-2">
          <span className="font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>Step 2: Serial Bitstream Transmission Timeline</span>
          </span>
          <span className="text-cyan-300 text-[11px]">
            Click any bit below to jump the simulation directly to it
          </span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto py-2 scrollbar-thin font-mono">
          {transmissionBits.map((bit, idx) => {
            const isCurrent = idx === currentBitIdx;
            const isPast = idx < currentBitIdx;
            const isBitOne = bit.bitValue === 1;

            return (
              <div
                key={idx}
                onClick={() => {
                  setIsTransmitting(false);
                  setCurrentBitIdx(idx);
                  playBitTone(bit.bitValue);
                }}
                className={`flex flex-col items-center cursor-pointer p-1.5 rounded-xl border transition-all shrink-0 w-11 ${
                  isCurrent
                    ? 'bg-cyan-950 border-cyan-400 scale-105 shadow-xl shadow-cyan-500/30'
                    : isPast
                    ? 'bg-[#0a1120] border-[#18263e] opacity-75'
                    : 'bg-[#060a14] border-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-[9px] text-slate-400 font-bold">
                  {bit.char}
                </span>

                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs my-1 ${
                    isCurrent
                      ? isBitOne
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/50 animate-pulse'
                        : 'bg-slate-700 text-slate-100'
                      : isBitOne
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/60'
                      : 'bg-[#0c1424] text-slate-500 border border-slate-800'
                  }`}
                >
                  {bit.bitValue}
                </div>

                <span className="text-[8px] text-slate-400">
                  #{idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================= */}
      {/* 4. REAL-TIME PHYSICAL HARDWARE REACTION AT ACTIVE BIT     */}
      {/* ========================================================= */}
      <div className="space-y-2">
        <h2 className="text-xs font-bold text-white font-mono uppercase tracking-wider flex items-center space-x-1.5">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span>Step 3: Physical Circuit State at Active Bit ({isCurrentBitOne ? 'Bit 1: Light Emitting' : 'Bit 0: Dark Idle'})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
          {/* Stage 1: Transmitter MCU */}
          <div className={`p-3 rounded-xl border ${isCurrentBitOne ? 'bg-blue-950/40 border-blue-500' : 'bg-[#080d19] border-slate-800'} space-y-1 shadow`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">1. STM32 / ESP32 TX</span>
            <strong className={`block text-xs ${isCurrentBitOne ? 'text-cyan-300' : 'text-slate-400'}`}>
              {isCurrentBitOne ? 'PWM 3.30V @ 10.0 kHz' : 'HOLD LOW: 0.00 V'}
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {isCurrentBitOne ? 'Hardware timer outputs continuous high-speed optical carrier pulses.' : 'Pin held low; optical carrier paused.'}
            </p>
          </div>

          {/* Stage 2: 2N2222 Transistor Driver */}
          <div className={`p-3 rounded-xl border ${isCurrentBitOne ? 'bg-purple-950/40 border-purple-500' : 'bg-[#080d19] border-slate-800'} space-y-1 shadow`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">2. 2N2222 Transistor</span>
            <strong className={`block text-xs ${isCurrentBitOne ? 'text-purple-300' : 'text-slate-400'}`}>
              {isCurrentBitOne ? 'SATURATION (ON) • Vce=0.2V' : 'CUTOFF (OFF) • Open Switch'}
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {isCurrentBitOne ? 'Base saturated (Vbe=0.7V); transistor easily sinks 14.2 mA LED current.' : 'Base current is zero; transistor acts as an open circuit.'}
            </p>
          </div>

          {/* Stage 3: High-Intensity LED */}
          <div className={`p-3 rounded-xl border ${isCurrentBitOne ? 'bg-rose-950/50 border-rose-500 animate-pulse' : 'bg-[#080d19] border-slate-800'} space-y-1 shadow`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">3. Red / IR Optical LED</span>
            <strong className={`block text-xs ${isCurrentBitOne ? 'text-rose-300' : 'text-slate-400'}`}>
              {isCurrentBitOne ? 'EMITTING LIGHT (18.5 mW)' : 'DARK / UNLIT (0.0 mW)'}
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {isCurrentBitOne ? 'Forward current flows through 220Ω limiter; emits 650nm optical photons.' : 'Zero current; LED remains dark.'}
            </p>
          </div>

          {/* Stage 4: Optical Channel */}
          <div className={`p-3 rounded-xl border ${isCurrentBitOne ? 'bg-amber-950/40 border-amber-500' : 'bg-[#080d19] border-slate-800'} space-y-1 shadow`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">4. Free-Space Air Gap (15 cm)</span>
            <strong className={`block text-xs ${isCurrentBitOne ? 'text-amber-300' : 'text-slate-400'}`}>
              {isCurrentBitOne ? 'PHOTONS IN FLIGHT (c ≈ 3×10⁸ m/s)' : 'DARK AMBIENT CHANNELS'}
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {isCurrentBitOne ? 'Lambertian photon wavefront propagates through room air at the speed of light.' : 'Only ambient room lighting present.'}
            </p>
          </div>

          {/* Stage 5: BPW34 Photodiode */}
          <div className={`p-3 rounded-xl border ${isCurrentBitOne ? 'bg-emerald-950/40 border-emerald-500' : 'bg-[#080d19] border-slate-800'} space-y-1 shadow`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">5. BPW34 PIN Photodiode</span>
            <strong className={`block text-xs ${isCurrentBitOne ? 'text-emerald-300' : 'text-slate-400'}`}>
              {isCurrentBitOne ? 'I_ph = 42.8 µA (Photocurrent)' : 'I_dark = 0.2 µA (Dark Level)'}
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {isCurrentBitOne ? 'Incident photons generate electron-hole pairs, producing reverse photocurrent.' : 'Silicon detector rests at dark baseline.'}
            </p>
          </div>

          {/* Stage 6: LM358 Pre-Amp */}
          <div className={`p-3 rounded-xl border ${isCurrentBitOne ? 'bg-cyan-950/40 border-cyan-500' : 'bg-[#080d19] border-slate-800'} space-y-1 shadow`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">6. LM358 Pre-Amp (TIA)</span>
            <strong className={`block text-xs ${isCurrentBitOne ? 'text-cyan-300' : 'text-slate-400'}`}>
              {isCurrentBitOne ? 'V_OUT = 2.14 V (Amplified)' : 'V_OUT = 0.05 V (Baseline)'}
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {isCurrentBitOne ? 'Transimpedance amplifier converts 42.8 µA across 50kΩ Rf to measurable volts.' : 'Output sits near system ground.'}
            </p>
          </div>

          {/* Stage 7: Receiver MCU ADC */}
          <div className={`p-3 rounded-xl border ${isCurrentBitOne ? 'bg-purple-950/40 border-purple-500' : 'bg-[#080d19] border-slate-800'} space-y-1 shadow`}>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">7. Receiver MCU (PA0 / GPIO 34)</span>
            <strong className={`block text-xs ${isCurrentBitOne ? 'text-purple-300' : 'text-slate-400'}`}>
              {isCurrentBitOne ? 'ADC: 2.14V > 1.65V -> LOGIC 1' : 'ADC: 0.05V < 1.65V -> LOGIC 0'}
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {isCurrentBitOne ? 'ADC samples high logic; bit 1 shifted into byte accumulator.' : 'ADC samples low logic; bit 0 shifted into byte accumulator.'}
            </p>
          </div>

          {/* Stage 8: Demodulated Text */}
          <div className="p-3 rounded-xl border border-emerald-700 bg-emerald-950/30 space-y-1 shadow">
            <span className="text-[10px] text-emerald-400 uppercase tracking-wider block">8. Reconstructed Output</span>
            <strong className="block text-emerald-300 text-sm">
              "{reconstructedText}"
            </strong>
            <p className="text-[10px] text-slate-400 leading-relaxed pt-1 border-t border-slate-800">
              {reconstructedText === messageInput ? 'Frame complete! 100% data integrity verified with CRC-8.' : `Decoding byte ${Math.floor(currentBitIdx / 8) + 1}...`}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 5. SERIAL UART RECEIVER TERMINAL LOG                      */}
      {/* ========================================================= */}
      <div className="bg-[#050811] border border-slate-800 rounded-xl p-4 shadow-lg space-y-2 font-mono text-xs">
        <div className="flex justify-between items-center border-b border-slate-800 pb-2">
          <span className="font-bold text-white flex items-center space-x-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            <span>Receiver Serial Terminal Console [115,200 baud]</span>
          </span>
          <span className="text-[10px] text-emerald-400">Carrier: 10.0 kHz • Sampling: 1 MSPS</span>
        </div>

        <div className="space-y-1 text-slate-300 text-[11px] pt-1">
          <div className="text-slate-500">&gt; SemLiFi Optical Demodulator Initialized.</div>
          <div className="text-cyan-300">&gt; Transmitter modulating carrier for message "{messageInput}"...</div>
          {charBreakdowns.slice(0, Math.floor((currentBitIdx + 1) / 8)).map((b, idx) => (
            <div key={idx} className="text-emerald-400">
              &gt; [BYTE RECV] Byte {idx + 1}: 0b{b.binary8} ({b.asciiHex}) ➔ Reconstructed Character '{b.char}'
            </div>
          ))}
          {reconstructedText === messageInput && (
            <div className="text-emerald-300 font-bold pt-1 border-t border-slate-800">
              &gt; [SUCCESS] PAYLOAD COMPLETE: "{reconstructedText}" [CRC-8 VALID • 0 BIT ERRORS]
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageTransmissionStudio;

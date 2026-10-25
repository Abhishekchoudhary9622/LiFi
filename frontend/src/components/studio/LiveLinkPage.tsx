import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Radio,
  CheckCircle2,
  Zap,
  ArrowRight,
  Activity,
  Layers,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Cpu,
  Eye
} from 'lucide-react';

interface LiveLinkPageProps {
  onNavigateToSignals?: () => void;
}

export const LiveLinkPage: React.FC<LiveLinkPageProps> = ({ onNavigateToSignals }) => {
  const [messageInput, setMessageInput] = useState<string>('Hello SemLiFi! 🚀');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [currentBitIndex, setCurrentBitIndex] = useState<number>(0);
  const [decodedMessage, setDecodedMessage] = useState<string>('');
  const [isTransmissionSuccess, setIsTransmissionSuccess] = useState<boolean>(false);
  const [transmissionSpeedMs, setTransmissionSpeedMs] = useState<number>(150); // ms per bit
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(false);

  // Audio Context Ref
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (freq = 900) => {
    if (!isSoundEnabled) return;
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
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      // Audio not permitted
    }
  };

  // Convert text to bits array
  const bitsStream = React.useMemo(() => {
    const text = messageInput.trim() || 'HII';
    const bits: { char: string; bit: 0 | 1; globalIndex: number }[] = [];
    let idx = 0;
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      const bin = code.toString(2).padStart(8, '0');
      for (let b = 0; b < 8; b++) {
        bits.push({
          char: text[i],
          bit: bin[b] === '1' ? 1 : 0,
          globalIndex: idx++
        });
      }
    }
    return bits;
  }, [messageInput]);

  // Transmission Loop
  useEffect(() => {
    if (!isTransmitting) return;

    if (currentBitIndex >= bitsStream.length) {
      setIsTransmitting(false);
      setIsTransmissionSuccess(true);
      setDecodedMessage(messageInput);
      playTone(1400);
      return;
    }

    const timer = setTimeout(() => {
      const curBit = bitsStream[currentBitIndex];
      playTone(curBit.bit === 1 ? 1100 : 450);

      // Partial decoding update per full byte (every 8 bits)
      const fullBytesCount = Math.floor((currentBitIndex + 1) / 8);
      if (fullBytesCount > 0) {
        setDecodedMessage(messageInput.slice(0, fullBytesCount));
      }

      setCurrentBitIndex(prev => prev + 1);
    }, transmissionSpeedMs);

    return () => clearTimeout(timer);
  }, [isTransmitting, currentBitIndex, bitsStream, transmissionSpeedMs, messageInput]);

  const handleStartTransmission = () => {
    setCurrentBitIndex(0);
    setDecodedMessage('');
    setIsTransmissionSuccess(false);
    setIsTransmitting(true);
    playTone(800);
  };

  const handleReset = () => {
    setIsTransmitting(false);
    setCurrentBitIndex(0);
    setDecodedMessage('');
    setIsTransmissionSuccess(false);
  };

  const activeBit = bitsStream[currentBitIndex] || bitsStream[0];
  const isCurrentBitOne = activeBit?.bit === 1;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#02050f] text-slate-100 font-sans select-none overflow-y-auto">
      {/* Top Header */}
      <div className="px-6 py-4 bg-[#050b18] border-b border-[#14233c] flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-extrabold text-white font-sans tracking-wide">
              Live Optical Transmission Link
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/50 text-cyan-300 font-mono font-bold animate-pulse">
              REAL-TIME SIMULATOR
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono -mt-0.5">
            End-to-End Serial Bitstream Serialization, Optical Beam Flight, &amp; Dual-Node Reconstruction
          </p>
        </div>

        {/* Sound Toggle */}
        <button
          onClick={() => setIsSoundEnabled(s => !s)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-mono flex items-center space-x-1.5 transition-all ${
            isSoundEnabled
              ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
              : 'bg-[#091122] text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          {isSoundEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          <span>Audio Carrier: {isSoundEnabled ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* ========================================================= */}
        {/* 1. MESSAGE INPUT & TRANSMIT CONTROLS                      */}
        {/* ========================================================= */}
        <div className="bg-[#060c1c] border border-[#182744] rounded-2xl p-5 shadow-2xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <span className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider flex items-center space-x-1.5">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>MESSAGE TO TRANSMIT</span>
            </span>

            {/* Quick Test Presets */}
            <div className="flex items-center space-x-1.5 text-xs font-mono">
              <span className="text-slate-500 text-[11px] mr-1">Presets:</span>
              {['Hello SemLiFi! 🚀', 'HII', 'OK', 'TEMP=24.5C'].map(preset => (
                <button
                  key={preset}
                  onClick={() => {
                    setMessageInput(preset);
                    handleReset();
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                    messageInput === preset
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-[#0e1930] text-slate-300 hover:text-white border border-slate-700'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => {
                setMessageInput(e.target.value);
                handleReset();
              }}
              placeholder="Enter message to transmit..."
              disabled={isTransmitting}
              className="flex-1 min-w-[240px] bg-[#030612] border border-[#1a2d4e] focus:border-cyan-400 rounded-xl px-4 py-2.5 text-sm font-mono text-white placeholder-slate-600 focus:outline-none transition-colors shadow-inner"
            />

            {isTransmitting ? (
              <button
                onClick={() => setIsTransmitting(false)}
                className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-sm flex items-center space-x-2 shadow-lg shadow-rose-600/30 transition-all"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </button>
            ) : (
              <button
                onClick={handleStartTransmission}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono font-bold text-sm flex items-center space-x-2 shadow-lg shadow-cyan-600/25 transition-all transform hover:-translate-y-0.5"
              >
                <Send className="w-4 h-4" />
                <span>TRANSMIT</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="p-2.5 rounded-xl bg-[#0e172a] hover:bg-[#162544] text-slate-400 hover:text-white border border-slate-700 transition-colors"
              title="Reset transmission"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. LARGE CENTER OPTICAL PULSE VISUALIZATION (THE WOW VIEW)*/}
        {/* ========================================================= */}
        <div className="bg-[#050b1a] border border-[#162746] rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          {/* Subtle ambient glow behind transmitter and receiver */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-64 h-64 bg-red-600/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-64 h-64 bg-cyan-600/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            {/* NODE 1: STM32 TX */}
            <div className={`w-full md:w-56 p-4 rounded-xl border transition-all text-center ${
              isTransmitting ? 'bg-blue-950/60 border-blue-500 shadow-xl shadow-blue-500/20' : 'bg-[#070e20] border-[#162540]'
            }`}>
              <div className="w-12 h-12 mx-auto rounded-xl bg-blue-900/60 border border-blue-500/50 flex items-center justify-center text-cyan-300 mb-2">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white font-mono">STM32 TX</h4>
              <span className="text-[10px] text-slate-400 font-mono block">Node 1: Transmitter</span>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <span className={`inline-flex items-center space-x-1 font-bold ${
                  isTransmitting ? 'text-blue-400' : 'text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isTransmitting ? 'bg-blue-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>{isTransmitting ? '● MODULATING PA9' : '● READY'}</span>
                </span>
              </div>
            </div>

            {/* TRANSMITTER LED (5mm RED) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-rose-400 font-bold mb-1">LED (TX)</span>
              <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-100 ${
                isTransmitting && isCurrentBitOne
                  ? 'bg-red-600 border-white shadow-2xl shadow-red-500 scale-110'
                  : 'bg-red-950/40 border-red-800/80 opacity-60'
              }`}>
                <Zap className={`w-7 h-7 ${isTransmitting && isCurrentBitOne ? 'text-white fill-white' : 'text-red-500'}`} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">650nm Red</span>
            </div>

            {/* =================================================== */}
            {/* OPTICAL AIR GAP & ANIMATED TRAVELLING BEAM PULSE    */}
            {/* =================================================== */}
            <div className="flex-1 w-full flex flex-col items-center px-2">
              <div className="w-full relative py-4">
                {/* Channel Guide Line */}
                <div className="h-[2px] w-full bg-[#1b2b48] relative">
                  {/* Dynamic Optical Photon Ray */}
                  {isTransmitting && (
                    <div
                      className={`absolute top-[-3px] h-[8px] rounded-full transition-all duration-75 ${
                        isCurrentBitOne
                          ? 'bg-gradient-to-r from-red-500 via-amber-300 to-red-500 shadow-lg shadow-red-500 animate-pulse w-full'
                          : 'bg-slate-700/40 w-full'
                      }`}
                    />
                  )}
                </div>

                {/* Flying Photon Packet Indicator */}
                {isTransmitting && isCurrentBitOne && (
                  <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-red-600 text-white font-mono font-bold text-xs shadow-xl shadow-red-600/80 flex items-center space-x-1 animate-bounce">
                    <Sparkles className="w-3 h-3 text-amber-200" />
                    <span>Photon Packet</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400">
                <span>Free-Space Optical Channel (15 cm)</span>
              </div>
            </div>

            {/* PHOTODIODE RECEIVER (BPW34) */}
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-emerald-400 font-bold mb-1">Photodiode (RX)</span>
              <div className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-all ${
                isTransmitting && isCurrentBitOne
                  ? 'bg-emerald-950 border-emerald-400 shadow-xl shadow-emerald-500/40'
                  : 'bg-[#08151e] border-[#103038] opacity-60'
              }`}>
                <Eye className={`w-6 h-6 ${isTransmitting && isCurrentBitOne ? 'text-emerald-300' : 'text-emerald-700'}`} />
              </div>
              <span className="text-[10px] font-mono text-slate-400 mt-1">BPW34</span>
            </div>

            {/* NODE 2: STM32 RX */}
            <div className={`w-full md:w-56 p-4 rounded-xl border transition-all text-center ${
              isTransmitting ? 'bg-indigo-950/60 border-indigo-500 shadow-xl shadow-indigo-500/20' : 'bg-[#070e20] border-[#162540]'
            }`}>
              <div className="w-12 h-12 mx-auto rounded-xl bg-indigo-900/60 border border-indigo-500/50 flex items-center justify-center text-indigo-300 mb-2">
                <Cpu className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white font-mono">STM32 RX</h4>
              <span className="text-[10px] text-slate-400 font-mono block">Node 2: Receiver</span>
              <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] font-mono">
                <span className={`inline-flex items-center space-x-1 font-bold ${
                  isTransmitting ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isTransmitting ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
                  <span>{isTransmitting ? '● SAMPLING PA0' : '● READY'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. TRANSMISSION STATUS & DECODED RECEIVED DATA            */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Transmission Real-time Telemetry */}
          <div className="bg-[#060c1a] border border-[#16243f] rounded-2xl p-4 font-mono text-xs space-y-3">
            <span className="text-slate-400 uppercase font-bold text-[11px] block border-b border-slate-800 pb-2">
              Transmission Telemetry
            </span>

            <div className="flex justify-between">
              <span className="text-slate-400">Total Stream Length:</span>
              <span className="text-cyan-300 font-bold">{bitsStream.length} Bits ({messageInput.length} Bytes)</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Current Progress:</span>
              <span className="text-white font-bold">{currentBitIndex} / {bitsStream.length} Bits</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-400">Active State:</span>
              <span className={`font-bold ${isTransmitting ? 'text-cyan-400 animate-pulse' : isTransmissionSuccess ? 'text-emerald-400' : 'text-slate-500'}`}>
                {isTransmitting ? 'TRANSMITTING IN PROGRESS...' : isTransmissionSuccess ? 'TRANSMISSION COMPLETE' : 'IDLE / READY'}
              </span>
            </div>

            {/* Serial Bit Scrubber Strip */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 block mb-1">Active Bit Buffer:</span>
              <div className="flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none">
                {bitsStream.slice(0, 32).map((b, idx) => {
                  const isCurrent = idx === currentBitIndex;
                  return (
                    <span
                      key={idx}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                        isCurrent
                          ? b.bit === 1
                            ? 'bg-red-600 text-white scale-125 shadow-md shadow-red-600'
                            : 'bg-slate-600 text-white scale-125'
                          : idx < currentBitIndex
                          ? 'bg-blue-950 text-blue-300 opacity-60'
                          : 'bg-[#0c1426] text-slate-500'
                      }`}
                    >
                      {b.bit}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Decoded Output Box (Matching Section 14) */}
          <div className="bg-[#060c1a] border border-[#16243f] rounded-2xl p-4 font-mono text-xs flex flex-col justify-between space-y-3">
            <div>
              <span className="text-slate-400 uppercase font-bold text-[11px] block border-b border-slate-800 pb-2">
                RECEIVED DATA (STM32 RX)
              </span>

              <div className="min-h-[60px] bg-[#02050e] border border-[#15233c] rounded-xl p-3 my-2 flex items-center">
                {decodedMessage ? (
                  <span className="text-base md:text-lg font-bold text-emerald-400 tracking-wide">
                    "{decodedMessage}"
                  </span>
                ) : (
                  <span className="text-slate-600 italic">
                    Awaiting incoming modulated optical packets...
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <span className="text-slate-400">Integrity Status:</span>
              {isTransmissionSuccess ? (
                <span className="text-emerald-400 font-bold text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>&bull; SUCCESS (CRC-8 VALID)</span>
                </span>
              ) : isTransmitting ? (
                <span className="text-cyan-400 font-bold text-xs flex items-center space-x-1 animate-pulse">
                  <span>RECEIVING &amp; DECODING...</span>
                </span>
              ) : (
                <span className="text-slate-500 font-bold text-xs">
                  STANDBY
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

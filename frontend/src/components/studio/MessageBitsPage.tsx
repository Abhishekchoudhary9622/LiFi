import React, { useState } from 'react';
import {
  Radio,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Send,
  Cpu,
  Layers,
  Copy,
  Check
} from 'lucide-react';

interface MessageBitsPageProps {
  isDarkMode: boolean;
  workingDistanceCm: number;
}

export const MessageBitsPage: React.FC<MessageBitsPageProps> = ({
  isDarkMode,
  workingDistanceCm
}) => {
  const [message, setMessage] = useState<string>('TEMP=27.4,HUM=61,MOTOR=ON');
  const [occlusionScenario, setOcclusionScenario] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [isTransmitting, setIsTransmitting] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Convert string to binary ASCII string
  const toBinary = (str: string) => {
    return str
      .split('')
      .map((c) => c.charCodeAt(0).toString(2).padStart(8, '0'))
      .join(' ');
  };

  const handleTransmit = () => {
    setIsTransmitting(true);
    setTimeout(() => {
      setIsTransmitting(false);
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(toBinary(message));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
          <Radio className="w-5 h-5" />
        </div>
        <div>
          <h1
            className={`text-xl sm:text-2xl font-bold tracking-tight ${
              isDarkMode ? 'text-white' : 'text-slate-900'
            }`}
          >
            Message &amp; Bits
          </h1>
          <p
            className={`text-xs mt-0.5 ${
              isDarkMode ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Encode telemetry strings, visualize Manchester bitstreams, and test burst occlusion recovery.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Transmitter Input */}
        <div
          className={`lg:col-span-6 rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
            isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold tracking-tight">Transmitter Payload</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold">
              UART Serial TX
            </span>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-500 font-medium">Input ASCII String:</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={`flex-1 px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none focus:border-blue-500 ${
                  isDarkMode
                    ? 'bg-[#060b17] border-slate-700 text-white'
                    : 'bg-slate-50 border-slate-300 text-slate-900'
                }`}
              />
              <button
                onClick={handleTransmit}
                disabled={isTransmitting}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isTransmitting ? 'Sending...' : 'Transmit'}</span>
              </button>
            </div>
          </div>

          {/* Occlusion Scenario Selector */}
          <div className="space-y-2 pt-2">
            <label className="text-xs text-slate-500 font-medium">
              Physical SG90 Flap Occlusion Scenario:
            </label>
            <div className="grid grid-cols-4 gap-2 text-xs font-semibold">
              {(['P0', 'P1', 'P2', 'P3'] as const).map((sc) => {
                const isSelected = occlusionScenario === sc;
                return (
                  <button
                    key={sc}
                    onClick={() => setOcclusionScenario(sc)}
                    className={`py-2 rounded-xl border text-center transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : isDarkMode
                        ? 'bg-[#0e172a] border-slate-700 text-slate-300 hover:bg-[#16233d]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <div>{sc}</div>
                    <div className="text-[10px] font-normal opacity-75">
                      {sc === 'P0' ? '0 ms' : sc === 'P1' ? '80 ms' : sc === 'P2' ? '250 ms' : '500 ms'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Binary Bitstream Preview */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Serialized Binary Output:</span>
              <button
                onClick={handleCopy}
                className="text-blue-600 dark:text-blue-400 font-semibold flex items-center space-x-1 hover:underline"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Bits'}</span>
              </button>
            </div>
            <div
              className={`p-3 rounded-xl border font-mono text-xs break-all leading-relaxed ${
                isDarkMode ? 'bg-[#060b17] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-200 text-blue-700'
              }`}
            >
              {toBinary(message)}
            </div>
          </div>
        </div>

        {/* Right Column: Semantic CGFP & BASR AI Receiver Decision */}
        <div
          className={`lg:col-span-6 rounded-2xl border p-5 sm:p-6 space-y-4 shadow-sm ${
            isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold tracking-tight">Receiver Pipeline &amp; Recovery</h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
              BASR AI Active
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426] flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  BASR Confidence Score
                </div>
                <div className="text-[11px] text-slate-400">
                  Semantic probability threshold = 0.80
                </div>
              </div>
              <div className="text-lg font-bold font-mono text-blue-600 dark:text-blue-400">
                {occlusionScenario === 'P0' ? '0.98' : occlusionScenario === 'P1' ? '0.86' : '0.73'}
              </div>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426] flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  CGFP ARQ Decision
                </div>
                <div className="text-[11px] text-slate-400">
                  Confidence vs Reliability policy
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono ${
                  occlusionScenario === 'P0' || occlusionScenario === 'P1'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                }`}
              >
                {occlusionScenario === 'P0' || occlusionScenario === 'P1' ? 'ACK_ACCEPT' : 'NACK_RETRY'}
              </span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0c1426] flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Decoded Output String
                </div>
                <div className="text-[11px] text-slate-400">
                  Parsed on STM32 RX USART
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {message}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

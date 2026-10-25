import React from 'react';
import {
  BookOpen,
  Download,
  ExternalLink,
  Cpu,
  Zap,
  Activity,
  Layers,
  FileText,
  CheckCircle2
} from 'lucide-react';

interface DocumentationPageProps {
  isDarkMode: boolean;
  onOpenReport?: () => void;
}

export const DocumentationPage: React.FC<DocumentationPageProps> = ({
  isDarkMode,
  onOpenReport
}) => {
  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1
              className={`text-xl sm:text-2xl font-bold tracking-tight ${
                isDarkMode ? 'text-white' : 'text-slate-900'
              }`}
            >
              System Documentation &amp; Research Paper
            </h1>
            <p
              className={`text-xs mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              SemLiFi: Fault-Tolerant Visible Light Communication with Dual STM32 Microcontrollers
            </p>
          </div>
        </div>

        {onOpenReport && (
          <button
            onClick={onOpenReport}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md"
          >
            <Download className="w-4 h-4" />
            <span>Generate Full Hardware Report</span>
          </button>
        )}
      </div>

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Section 1: Optical Channel Model */}
        <div
          className={`lg:col-span-6 rounded-2xl border p-5 sm:p-6 space-y-3 shadow-sm ${
            isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
          }`}
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Lambertian Optical Link Model</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            The optical channel DC channel gain H(0) between the 650 nm Red LED emitter and the BPW34
            PIN photodiode follows the generalized Lambertian radiant intensity distribution:
          </p>

          <div
            className={`p-3 rounded-xl font-mono text-xs border ${
              isDarkMode ? 'bg-[#060b17] border-slate-800 text-cyan-300' : 'bg-slate-50 border-slate-200 text-blue-700'
            }`}
          >
            H(0) = [(m + 1) * A_det / (2 * &pi; * d&sup2;)] * cos&supm;(&phi;) * cos(&psi;) * T(&psi;) * g(&psi;)
          </div>

          <div className="text-[11px] text-slate-400 space-y-1">
            <div>&bull; m = 1.0 (Lambertian order for semi-angle of half-power 60&deg;)</div>
            <div>&bull; A_det = 7.5 mm&sup2; (BPW34 active radiant detection surface)</div>
            <div>&bull; d = 15 cm (nominal calibrated testbed air gap distance)</div>
          </div>
        </div>

        {/* Section 2: Pin Configuration & Peripheral Map */}
        <div
          className={`lg:col-span-6 rounded-2xl border p-5 sm:p-6 space-y-3 shadow-sm ${
            isDarkMode ? 'bg-[#0c1220] border-[#1a2844]' : 'bg-white border-slate-200/90'
          }`}
        >
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-blue-500" />
            <span>STM32 Node Pinout Reference</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400">
                  <th className="py-2">Node</th>
                  <th className="py-2">Pin</th>
                  <th className="py-2">Peripheral</th>
                  <th className="py-2">Function</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                <tr>
                  <td className="py-2 font-semibold text-blue-600 dark:text-blue-400">STM32 TX</td>
                  <td className="py-2 font-mono">PA9</td>
                  <td className="py-2 font-mono">TIM1_CH2</td>
                  <td className="py-2 text-slate-500">10 kHz PWM Carrier Out</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-emerald-600 dark:text-emerald-400">STM32 RX</td>
                  <td className="py-2 font-mono">PA0</td>
                  <td className="py-2 font-mono">TIM2_CH1</td>
                  <td className="py-2 text-slate-500">Input Capture Edge Detect</td>
                </tr>
                <tr>
                  <td className="py-2 font-semibold text-emerald-600 dark:text-emerald-400">STM32 RX</td>
                  <td className="py-2 font-mono">PA1</td>
                  <td className="py-2 font-mono">ADC1_IN1</td>
                  <td className="py-2 text-slate-500">Analog Waveform Telemetry</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

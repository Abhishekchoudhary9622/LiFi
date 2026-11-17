import React from 'react';
import { X, Command, Keyboard, Zap, Layers, Cpu, Activity, Sliders, Radio } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

interface ShortcutCategory {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcuts: Array<{ keys: string[]; description: string }>;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  isDarkMode = true
}) => {
  if (!isOpen) return null;

  const categories: ShortcutCategory[] = [
    {
      title: 'Studio Module Navigation',
      icon: Layers,
      shortcuts: [
        { keys: ['1'], description: 'Switch to Dashboard Module' },
        { keys: ['2'], description: 'Switch to Circuit & Simulation Editor' },
        { keys: ['3'], description: 'Switch to Hardware Digital Twin' },
        { keys: ['4'], description: 'Switch to Message & Bits Transmission' },
        { keys: ['5'], description: 'Switch to 5-Channel DSO Waveforms' },
        { keys: ['6'], description: 'Switch to Experimental Benchmarks' },
        { keys: ['7'], description: 'Switch to Documentation & Viva Defense' }
      ]
    },
    {
      title: 'Interactive Circuit Editor',
      icon: Cpu,
      shortcuts: [
        { keys: ['V'], description: 'Activate Component Select & Move Tool' },
        { keys: ['W'], description: 'Activate Terminal Wire Routing Tool' },
        { keys: ['P'], description: 'Activate Multimeter Voltage/Current Probe' },
        { keys: ['Del', 'Bksp'], description: 'Delete Selected Wire or Component' },
        { keys: ['+'], description: 'Zoom In (+15%)' },
        { keys: ['-'], description: 'Zoom Out (-15%)' },
        { keys: ['0'], description: 'Reset Zoom to 100% and Center Canvas' },
        { keys: ['Esc'], description: 'Deselect / Cancel Active Wire Draft' }
      ]
    },
    {
      title: 'Hardware Twin & Waveform Controls',
      icon: Activity,
      shortcuts: [
        { keys: ['Space'], description: 'Toggle Simulation Play / Pause' },
        { keys: ['R'], description: 'Replay Signal Flow from Stage 1' },
        { keys: ['←'], description: 'Previous Pipeline Stage' },
        { keys: ['→'], description: 'Next Pipeline Stage' },
        { keys: ['C'], description: 'Toggle Dual Cursor Measurement HUD' }
      ]
    },
    {
      title: 'General & Telecommunications Testbed',
      icon: Sliders,
      shortcuts: [
        { keys: ['T'], description: 'Toggle Master Dark / Light Theme' },
        { keys: ['?'], description: 'Open / Close Keyboard Shortcuts Cheat Sheet' },
        { keys: ['Esc'], description: 'Close Open Modals and Drawers' }
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[85vh] ${
          isDarkMode
            ? 'bg-[#090f1e] border-cyan-500/40 text-slate-100 shadow-cyan-950/50'
            : 'bg-white border-slate-300 text-slate-800 shadow-xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-[#070b16] flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide font-mono flex items-center gap-2">
                Telecommunications Testbed Keyboard Accessibility
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700/60 font-semibold">
                  OPERATIONAL HUD
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                Single-key shortcuts for high-speed benchtop navigation and oscilloscope control.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-5 text-xs font-mono">
          {categories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <div key={idx} className="space-y-2">
                <div className="flex items-center space-x-2 text-cyan-300 font-bold text-[11px] uppercase tracking-wider pb-1 border-b border-slate-800/80">
                  <Icon className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{cat.title}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cat.shortcuts.map((sc, sIdx) => (
                    <div
                      key={sIdx}
                      className="p-2 rounded-lg bg-[#060a14] border border-slate-800/80 flex items-center justify-between"
                    >
                      <span className="text-slate-300 text-[11px] pr-2">{sc.description}</span>
                      <div className="flex items-center space-x-1 shrink-0">
                        {sc.keys.map((k, kIdx) => (
                          <kbd
                            key={kIdx}
                            className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#142038] text-cyan-200 border border-cyan-500/30 shadow-sm"
                          >
                            {k}
                          </kbd>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#070b16] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Press <kbd className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-200 border border-slate-700">?</kbd> anywhere to toggle this guide</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};


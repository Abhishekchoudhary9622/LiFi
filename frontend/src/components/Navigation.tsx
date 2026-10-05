import React from 'react';
import {
  LayoutDashboard,
  Cpu,
  GitFork,
  Radio,
  Activity,
  CheckCircle2,
  FileText,
  Sliders,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { ActiveSection, ValidationResult } from '../types/circuit';

interface NavigationProps {
  activeSection: ActiveSection;
  onSelectSection: (section: ActiveSection) => void;
  validation: ValidationResult;
  simulationRunning: boolean;
}

interface NavItem {
  id: ActiveSection;
  label: string;
  number: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSection,
  onSelectSection,
  validation,
  simulationRunning
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', number: '1', icon: LayoutDashboard },
    { id: 'build', label: 'Build', number: '2', icon: Cpu, badge: 'CORE', badgeColor: 'bg-cyan-950 text-cyan-400 border border-cyan-700' },
    { id: 'schematic', label: 'Schematic', number: '3', icon: GitFork },
    { id: 'lifi', label: 'LiFi', number: '4', icon: Radio, badge: simulationRunning ? 'OPTICAL ACTIVE' : undefined, badgeColor: 'bg-amber-950 text-amber-300 border border-amber-700 animate-pulse' },
    { id: 'monitor', label: 'Monitor', number: '5', icon: Activity },
    {
      id: 'validation',
      label: 'Test & Validation',
      number: '6',
      icon: validation.valid ? CheckCircle2 : AlertTriangle,
      badge: validation.valid ? 'VALID' : `${validation.rules.filter(r => r.status === 'error').length} ERR`,
      badgeColor: validation.valid ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
    },
    { id: 'report', label: 'Report', number: '7', icon: FileText },
    { id: 'settings', label: 'Settings', number: '8', icon: Sliders }
  ];

  return (
    <aside className="w-56 bg-[#0a0e17] border-r border-[#1f293d] flex flex-col justify-between select-none">
      {/* Top Nav List */}
      <div className="py-3 px-2 space-y-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Navigation Workspace
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded text-xs font-mono transition-all text-left group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/80 to-[#111827] text-cyan-300 border-l-2 border-cyan-400 font-semibold shadow-[inset_0_0_10px_rgba(6,182,212,0.15)]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#111827]/70'
              }`}
            >
              <div className="flex items-center space-x-2.5 truncate">
                <span className={`text-[10px] w-4 text-center font-mono ${isActive ? 'text-cyan-400 font-bold' : 'text-slate-400'}`}>
                  {item.number}
                </span>
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-tight ${item.badgeColor || 'bg-slate-800 text-slate-300'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Status Box */}
      <div className="p-3 border-t border-[#1f293d] bg-[#0c1220] space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-slate-400">Circuit Status:</span>
          <span className={validation.valid ? 'text-emerald-400 font-bold flex items-center' : 'text-rose-400 font-bold flex items-center'}>
            {validation.valid ? '✓ Valid' : '✕ Has Errors'}
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${validation.valid ? 'bg-emerald-500' : 'bg-rose-500'}`}
            style={{ width: `${validation.score}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>DRC Pass Rate</span>
          <span>{validation.score}%</span>
        </div>
      </div>
    </aside>
  );
};

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Cpu,
  Camera,
  Radio,
  Activity,
  BarChart3,
  BookOpen,
  Search,
  Sun,
  Moon,
  Zap,
  Menu,
  X,
  Sparkles,
  Settings
} from 'lucide-react';
import { DashboardPage } from './DashboardPage';
import { CircuitSimulationPage } from './CircuitSimulationPage';
import { HardwareTwinPage } from './HardwareTwinPage';
import { WaveformsResultsPage } from './WaveformsResultsPage';
import { MessageBitsPage } from './MessageBitsPage';
import { DocumentationPage } from './DocumentationPage';
import { ResultsPage } from './ResultsPage';
import { SemLiFiExecutionFlowModal } from '../SemLiFiExecutionFlowModal';

export type StudioTab =
  | 'dashboard'
  | 'circuit'
  | 'hardware'
  | 'message'
  | 'waveforms'
  | 'results'
  | 'documentation';

interface SemLiFiStudioShellProps {
  projectName?: string;
  onOpenReport?: () => void;
}

export const SemLiFiStudioShell: React.FC<SemLiFiStudioShellProps> = ({
  projectName = 'SemLiFi Virtual Lab',
  onOpenReport
}) => {
  // Navigation tab state (starts on 'dashboard' exactly like top-left screenshot)
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');

  // Master light/dark theme state (defaults to true = dark mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('semlifi_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('semlifi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('semlifi_theme', 'light');
    }
  }, [isDarkMode]);

  // Global simulation running state
  const [isSimulating, setIsSimulating] = useState<boolean>(true);

  // Selected hardware component in inspector
  const [selectedComponentId, setSelectedComponentId] = useState<string>('led_tx');

  // Simulation physics parameters
  const [workingDistanceCm, setWorkingDistanceCm] = useState<number>(15);
  const [ambientLux, setAmbientLux] = useState<number>(250);

  // Execution flow modal
  const [showFlowModal, setShowFlowModal] = useState<boolean>(false);

  // Mobile sidebar open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Global search input state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 7 Navigation Tabs matching user reference collage exactly
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'circuit', label: 'Circuit & Simulation', icon: Cpu },
    { id: 'hardware', label: 'Hardware Twin', icon: Camera },
    { id: 'message', label: 'Message & Bits', icon: Radio },
    { id: 'waveforms', label: 'Waveforms', icon: Activity },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'documentation', label: 'Documentation', icon: BookOpen }
  ];

  const handleToggleSimulation = () => {
    setIsSimulating((prev) => !prev);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setTimeout(() => {
      setIsSimulating(true);
    }, 200);
  };

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-200 ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* ========================================================= */}
      {/* 1. LEFT SIDEBAR (Dark Navy Bar Matching Screenshot)       */}
      {/* ========================================================= */}
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-60 lg:w-64 bg-[#0a1122] text-slate-300 flex-col justify-between shrink-0 border-r border-[#15233c] z-30 select-none">
        <div>
          {/* Logo Brand Header */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-5 flex items-center space-x-3 cursor-pointer group border-b border-[#14233c]"
          >
            {/* Stylized Cyan/Green Logo Emblem (matching reference icon) */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 p-0.5 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#0a1122] rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-cyan-400 fill-cyan-400" />
              </div>
            </div>

            <div>
              <div className="text-base font-extrabold text-white tracking-tight leading-tight">
                SemLiFi
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Virtual Lab</div>
            </div>
          </div>

          {/* Navigation Links List */}
          <nav className="p-3 space-y-1 mt-1">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as StudioTab)}
                  className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/35'
                      : 'text-slate-400 hover:text-white hover:bg-[#111c34]'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: System Online Status (Exact match to screenshot bottom) */}
        <div className="p-4 border-t border-[#14233c]">
          <div className="flex items-center space-x-2.5 px-3 py-2 rounded-xl bg-[#0e1933] border border-[#1b2d52]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
            <span className="text-xs font-mono font-medium text-emerald-400">
              System: Online
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/70 backdrop-blur-sm">
          <div className="w-64 bg-[#0a1122] h-full flex flex-col justify-between p-4 border-r border-[#15233c]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#14233c]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">SemLiFi</div>
                    <div className="text-[10px] text-slate-400">Virtual Lab</div>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1 mt-4">
                {navTabs.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as StudioTab);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white hover:bg-[#111c34]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-[#0e1933] border border-[#1b2d52]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-medium text-emerald-400">
                System: Online
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. MAIN APPLICATION CONTENT AREA                          */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* Top Header Bar (Search, Theme Toggle ☀️/🌙, Avatar AC) */}
        <header
          className={`h-14 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 z-20 transition-colors duration-200 ${
            isDarkMode
              ? 'bg-[#090e1b] border-[#15233c] text-white'
              : 'bg-white border-slate-200/90 shadow-sm text-slate-800'
          }`}
        >
          {/* Left: Mobile Menu Toggle & Breadcrumbs */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-lg md:hidden hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center space-x-2 text-xs">
              <span className="font-semibold text-slate-400">Virtual Lab</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* Right Header Tools (Search, Sun/Moon Theme Toggle, User Avatar) */}
          <div className="flex items-center space-x-3">
            {/* Search Input Box */}
            <div className="relative hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lab..."
                className={`pl-8 pr-3 py-1.5 rounded-xl text-xs border focus:outline-none transition-colors w-40 md:w-56 ${
                  isDarkMode
                    ? 'bg-[#0c1426] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Execution Flow Trigger */}
            <button
              onClick={() => setShowFlowModal(true)}
              className={`hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                isDarkMode
                  ? 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Flow Diagram</span>
            </button>

            {/* Sun / Moon Theme Toggle (Exact Match to screenshot top right) */}
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className={`p-2 rounded-xl border transition-all ${
                isDarkMode
                  ? 'bg-[#0f172a] hover:bg-[#1e293b] border-slate-700 text-cyan-400'
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-amber-500'
              }`}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Avatar Circle: "AC" (Abhishek Choudhary) */}
            <div
              className="w-8 h-8 rounded-full bg-blue-600 text-white text-xs font-bold font-mono flex items-center justify-center shadow-md cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
              title="Abhishek Choudhary (AC)"
            >
              AC
            </div>
          </div>
        </header>

        {/* Main View Router */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onNavigate={(tab) => setActiveTab(tab as StudioTab)}
              onStartSimulation={() => {
                setIsSimulating(true);
                setActiveTab('circuit');
              }}
              isSimulating={isSimulating}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'circuit' && (
            <CircuitSimulationPage
              isSimulating={isSimulating}
              onToggleSimulation={handleToggleSimulation}
              onResetSimulation={handleResetSimulation}
              selectedComponentId={selectedComponentId}
              onSelectComponent={(id) => setSelectedComponentId(id)}
              isDarkMode={isDarkMode}
              workingDistanceCm={workingDistanceCm}
              onDistanceChange={(d) => setWorkingDistanceCm(d)}
              ambientLux={ambientLux}
              onAmbientLuxChange={(lux) => setAmbientLux(lux)}
            />
          )}

          {activeTab === 'hardware' && (
            <HardwareTwinPage
              selectedComponentId={selectedComponentId}
              onSelectComponent={(id) => setSelectedComponentId(id)}
              isDarkMode={isDarkMode}
            />
          )}

          {activeTab === 'message' && (
            <MessageBitsPage
              isDarkMode={isDarkMode}
              workingDistanceCm={workingDistanceCm}
            />
          )}

          {activeTab === 'waveforms' && (
            <WaveformsResultsPage
              isSimulating={isSimulating}
              isDarkMode={isDarkMode}
              workingDistanceCm={workingDistanceCm}
              ambientLux={ambientLux}
              onOpenReport={onOpenReport}
            />
          )}

          {activeTab === 'results' && (
            <ResultsPage onOpenReport={onOpenReport} />
          )}

          {activeTab === 'documentation' && (
            <DocumentationPage
              isDarkMode={isDarkMode}
              onOpenReport={onOpenReport}
            />
          )}
        </main>
      </div>

      {/* Execution Flow Modal */}
      {showFlowModal && (
        <SemLiFiExecutionFlowModal
          isOpen={showFlowModal}
          onClose={() => setShowFlowModal(false)}
        />
      )}
    </div>
  );
};

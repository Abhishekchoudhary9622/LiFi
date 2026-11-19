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
  Settings,
  Usb,
  Keyboard,
  Bell,
  ChevronDown
} from 'lucide-react';
import { DashboardPage } from './DashboardPage';
import { CircuitSimulationPage } from './CircuitSimulationPage';
import { HardwareTwinPage } from './HardwareTwinPage';
import { DocumentationPage } from './DocumentationPage';
import { ResultsPage } from './ResultsPage';
import { TransmissionSignalAnalyzerPage } from './TransmissionSignalAnalyzerPage';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { SemLiFiExecutionFlowModal } from '../SemLiFiExecutionFlowModal';
import { SystemSettingsView } from '../SystemSettingsView';
import { api } from '../../services/api';
import { HardwareStatus } from '../../types/semlifi';
import {
  SharedExperimentResult,
  DEFAULT_SHARED_EXPERIMENT
} from '../../model/experimentModel';

export type StudioTab =
  | 'dashboard'
  | 'circuit'
  | 'hardware'
  | 'analyzer'
  | 'results'
  | 'documentation'
  | 'message'
  | 'waveforms';

interface SemLiFiStudioShellProps {
  projectName?: string;
  onOpenReport?: () => void;
}

export const SemLiFiStudioShell: React.FC<SemLiFiStudioShellProps> = ({
  projectName = 'SemLiFi Virtual Lab',
  onOpenReport
}) => {
  // Navigation tab state (starts on 'dashboard' overview)
  const [activeTab, setActiveTab] = useState<StudioTab>('dashboard');

  // Master light/dark theme state (Enforced Dark Mode default)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('semlifi_theme_v2');
    return saved !== 'light'; // Defaults to true (Dark Mode)
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('semlifi_theme_v2', 'dark');
      localStorage.setItem('semlifi_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('semlifi_theme_v2', 'light');
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

  // Shared Experiment Result Model (Task E: Data Consistency)
  const [activeExperiment, setActiveExperiment] = useState<SharedExperimentResult>(DEFAULT_SHARED_EXPERIMENT);
  const [experimentHistory, setExperimentHistory] = useState<SharedExperimentResult[]>([
    DEFAULT_SHARED_EXPERIMENT
  ]);

  const handleRunExperiment = (newExp: SharedExperimentResult) => {
    setActiveExperiment(newExp);
    setExperimentHistory((prev) => [newExp, ...prev.slice(0, 19)]);
  };

  // Execution flow modal
  const [showFlowModal, setShowFlowModal] = useState<boolean>(false);

  // Hardware HAL modal & connection state
  const [showHardwareModal, setShowHardwareModal] = useState<boolean>(false);
  const [hardwareStatus, setHardwareStatus] = useState<HardwareStatus | null>(null);

  const fetchHardwareStatus = async () => {
    try {
      const overview = await api.getDashboardOverview();
      setHardwareStatus(overview.hardware_status);
    } catch {
      setHardwareStatus({
        is_connected: false,
        mode: 'SIMULATION',
        port: null,
        baudrate: 115200,
        tx_node_status: 'SIMULATED',
        rx_node_status: 'SIMULATED',
        led_state: false,
        servo_angle_deg: 0,
        is_beam_blocked: false,
        current_adc_count: 135.0,
        operating_threshold: 50.0,
        signal_classification: 'LIGHT DETECTED',
        last_frame_id: 1,
        data_source: 'SIMULATION',
      });
    }
  };

  useEffect(() => {
    fetchHardwareStatus();
    const interval = setInterval(fetchHardwareStatus, 6000);
    return () => clearInterval(interval);
  }, []);

  // Mobile sidebar open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // Keyboard shortcuts cheat-sheet modal state (Part 7 Brief)
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Part 7 Keyboard Accessibility & Single-Key Module Switching
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Do not intercept keystrokes if typing inside an active input or textarea
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const key = e.key;
      // Single-key module switching:
      // key === '1' for Dashboard navigation
      // key === '2' for Circuit navigation
      // key === '3' for Hardware Twin navigation
      // key === '4' for Message & Bits navigation
      // key === '5' for Waveforms navigation
      // key === '6' for Results navigation
      // key === '7' for Documentation navigation
      if (key === '1') {
        setActiveTab('dashboard');
      } else if (key === '2') {
        setActiveTab('circuit');
      } else if (key === '3') {
        setActiveTab('hardware');
      } else if (key === '4') {
        setActiveTab('analyzer');
      } else if (key === '5') {
        setActiveTab('results');
      } else if (key === '6') {
        setActiveTab('documentation');
      } else if (key === '7') {
        setActiveTab('documentation');
      } else if (key === '?' || key === 'h' || key === 'H') {
        setShowShortcutsModal((prev) => !prev);
      } else if (key === 'Escape') {
        setShowShortcutsModal(false);
        setShowHardwareModal(false);
        setShowFlowModal(false);
        setMobileMenuOpen(false);
      } else if (key === 't' || key === 'T') {
        setIsDarkMode((prev) => !prev);
      } else if (key === ' ') {
        e.preventDefault();
        setIsSimulating((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Global search input state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Exactly 6 Sidebar Navigation Items as mandated by user prompt
  const navTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'circuit', label: 'Circuit & Simulation', icon: Cpu },
    { id: 'hardware', label: 'Hardware Twin', icon: Camera },
    { id: 'analyzer', label: 'Transmission & Signal Analysis', icon: Radio },
    { id: 'results', label: 'Results & Benchmarks', icon: BarChart3 },
    { id: 'documentation', label: 'Documentation & Research', icon: BookOpen }
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
      className={`flex h-screen w-screen overflow-hidden font-sans select-none transition-colors duration-150 ${isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
        }`}
    >
      {/* ========================================================= */}
      {/* 1. COMPACT DARK NAVY SIDEBAR (Matching Screenshot 2)      */}
      {/* ========================================================= */}
      <aside className="hidden md:flex w-60 lg:w-64 flex-col justify-between shrink-0 bg-[#0a1122] text-slate-300 border-r border-[#15233c] z-30 select-none shadow-xl">
        <div>
          {/* Logo Brand Header */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="px-5 py-4 flex items-center space-x-3 cursor-pointer group border-b border-[#14233c]"
          >
            {/* Cyan/Blue Stylized Logo Emblem */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 p-0.5 flex items-center justify-center shadow-md shadow-cyan-600/25 group-hover:scale-105 transition">
              <div className="w-full h-full rounded-[6px] bg-[#0a1122] flex items-center justify-center">
                <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
              </div>
            </div>

            <div>
              <div className="text-sm font-extrabold tracking-tight leading-tight text-white">
                SemLiFi
              </div>
              <div className="text-[11px] text-cyan-400 font-semibold">Virtual Lab</div>
            </div>
          </div>

          {/* Navigation Links List (Exactly 6 Items) */}
          <nav className="p-3 space-y-1 mt-1">
            {navTabs.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as StudioTab)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${isActive
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/35 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-[#111c34] font-medium'
                    }`}
                  title={`Switch to ${item.label} (Press ${index + 1})`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'
                        }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <kbd
                    className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${isActive
                      ? 'bg-cyan-700 text-cyan-100'
                      : 'bg-[#0e172e] text-slate-500'
                      }`}
                  >
                    {index + 1}
                  </kbd>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer: Settings, Shortcuts & User Profile Row */}
        <div className="p-3 border-t border-[#14233c] space-y-2">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowHardwareModal(true)}
              className="flex-1 flex items-center justify-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#0c152a] hover:bg-[#132040] border border-[#1b2d52] text-slate-300 text-xs font-medium transition"
              title="Hardware Abstraction Layer (HAL) &amp; COM Port Settings"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px]">Settings</span>
            </button>

            <button
              onClick={() => setShowShortcutsModal(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-[#0c152a] hover:bg-[#132040] border border-[#1b2d52] text-slate-300 text-xs font-mono transition"
              title="Keyboard Shortcuts Cheat Sheet (?)"
            >
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[11px]">Shortcuts</span>
              <kbd className="px-1 py-0.2 rounded text-[9px] font-bold bg-[#16274a] text-cyan-300 border border-cyan-800">
                ?
              </kbd>
            </button>
          </div>

          <div className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#0e1933] border border-[#1b2d52]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-medium text-emerald-400">
              System: Online
            </span>
          </div>

          {/* User Profile Menu Row */}
          <div className="pt-2 border-t border-[#14233c] flex items-center justify-between p-1 rounded-lg hover:bg-[#101b33] cursor-pointer transition">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold font-mono flex items-center justify-center shrink-0 shadow">
                AC
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold truncate text-white">
                  Abhishek Choudhary
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  Lead Researcher
                </div>
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          </div>
        </div>
      </aside>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-black/70 backdrop-blur-xs">
          <div className="w-64 bg-[#0a1122] h-full flex flex-col justify-between p-4 border-r border-[#15233c]">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#14233c]">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm">SemLiFi</div>
                    <div className="text-[10px] text-cyan-400">Virtual Lab</div>
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
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold ${isActive
                        ? 'bg-cyan-600 text-white'
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

            <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-[#0e1933] border border-[#1b2d52]">
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
        {/* Top Header Bar */}
        <header
          className={`h-13 px-4 sm:px-6 border-b flex items-center justify-between shrink-0 z-20 transition-colors duration-150 ${isDarkMode
            ? 'bg-[#090e1b] border-[#15233c] text-white'
            : 'bg-white border-slate-200/90 shadow-2xs text-slate-800'
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
              <span className="font-semibold text-slate-400">SemLiFi</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-bold text-blue-600 dark:text-cyan-400">
                {navTabs.find((t) => t.id === activeTab)?.label}
              </span>
            </div>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center space-x-2.5">
            {/* Search Input Box */}
            <div className="relative hidden md:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search lab..."
                className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none transition-colors w-44 lg:w-56 ${isDarkMode
                  ? 'bg-[#0c1426] border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-cyan-500'
                  }`}
              />
            </div>

            {/* Active Experiment Telemetry Pill */}
            {activeExperiment && (
              <div
                className={`hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-lg border text-[10px] font-mono ${isDarkMode
                  ? 'bg-[#0a1224] border-cyan-500/40 text-cyan-300'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-slate-400">EXP:</span>
                <span className="font-bold text-blue-600 dark:text-cyan-300">{activeExperiment.experiment_id}</span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span
                  className={`font-semibold ${activeExperiment.packet_delivery_status === 'DELIVERED_CLEAN'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : activeExperiment.packet_delivery_status === 'RECOVERED_SEMANTIC'
                      ? 'text-blue-600 dark:text-cyan-400'
                      : 'text-amber-600 dark:text-amber-400'
                    }`}
                >
                  {activeExperiment.packet_delivery_status}
                </span>
                <span className="text-slate-300 dark:text-slate-600">|</span>
                <span className="text-slate-500">{activeExperiment.latency_ms} ms</span>
              </div>
            )}

            {/* Hardware Status Badge & Serial COM Modal Trigger */}
            <button
              onClick={() => setShowHardwareModal(true)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${hardwareStatus?.is_connected
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 dark:bg-emerald-950/70 dark:border-emerald-500/60 dark:text-emerald-300'
                : isDarkMode
                  ? 'bg-cyan-950/60 border-cyan-800/60 text-cyan-300 hover:bg-cyan-900/60'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              title="Hardware Abstraction Layer (HAL) &amp; COM Port Settings"
            >
              <span
                className={`w-2 h-2 rounded-full ${hardwareStatus?.is_connected
                  ? 'bg-emerald-500 animate-pulse'
                  : 'bg-cyan-400'
                  }`}
              />
              <Usb className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-mono text-[11px]">
                {hardwareStatus?.is_connected
                  ? `LIVE ESP32 (${hardwareStatus.port || 'USB'})`
                  : 'SIMULATION (Twin)'}
              </span>
            </button>

            {/* Execution Flow Trigger */}
            <button
              onClick={() => setShowFlowModal(true)}
              className={`hidden lg:flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition ${isDarkMode
                ? 'bg-indigo-950/70 border-indigo-700/60 text-indigo-300 hover:bg-indigo-900'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-indigo-400" />
              <span>Flow Diagram</span>
            </button>

            {/* Notifications Icon */}
            <button
              className={`p-1.5 rounded-lg border transition ${isDarkMode
                ? 'bg-[#0f172a] hover:bg-[#1e293b] border-slate-700 text-slate-400'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                }`}
              title="Notifications"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>

            {/* Dark Engineering Mode Theme Toggle */}
            <button
              onClick={() => setIsDarkMode((prev) => !prev)}
              className="p-1.5 rounded-lg border bg-[#0f172a] hover:bg-[#1e293b] border-slate-700 text-cyan-400 flex items-center space-x-1.5 transition"
              title={isDarkMode ? 'Dark Engineering Mode (Default - Click to toggle)' : 'Switch to Dark Mode'}
            >
              <Moon className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline text-[10px] font-mono font-bold text-slate-300">
                {isDarkMode ? 'DARK' : 'LIGHT'}
              </span>
            </button>

            {/* User Avatar Circle */}
            <div
              className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold font-mono flex items-center justify-center shadow-xs cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
              title="Abhishek Choudhary"
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
              activeExperiment={activeExperiment}
              experimentHistory={experimentHistory}
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
              activeExperiment={activeExperiment}
            />
          )}

          {activeTab === 'hardware' && (
            <HardwareTwinPage
              selectedComponentId={selectedComponentId}
              onSelectComponent={(id) => setSelectedComponentId(id)}
              isDarkMode={isDarkMode}
              activeExperiment={activeExperiment}
            />
          )}

          {(activeTab === 'analyzer' || activeTab === 'message' || activeTab === 'waveforms') && (
            <TransmissionSignalAnalyzerPage
              isSimulating={isSimulating}
              isDarkMode={isDarkMode}
              workingDistanceCm={workingDistanceCm}
              ambientLux={ambientLux}
              activeExperiment={activeExperiment}
              onExperimentRun={handleRunExperiment}
              onOpenReport={onOpenReport}
            />
          )}

          {activeTab === 'results' && (
            <ResultsPage
              onOpenReport={onOpenReport}
              isDarkMode={isDarkMode}
              activeExperiment={activeExperiment}
            />
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

      {/* Hardware Settings & Serial Abstraction Modal */}
      {showHardwareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#0b0f19] border border-slate-200 dark:border-[#1f293d] rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-4 border-b border-slate-200 dark:border-[#1f293d] flex items-center justify-between bg-slate-50 dark:bg-[#0c1220]">
              <div className="flex items-center space-x-2">
                <Usb className="w-4 h-4 text-blue-600 dark:text-cyan-400" />
                <span className="font-bold text-slate-900 dark:text-white text-sm font-mono">
                  Hardware Abstraction Layer (HAL) &amp; Serial COM Configuration
                </span>
              </div>
              <button
                onClick={() => setShowHardwareModal(false)}
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-[#1e293b] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <SystemSettingsView
                status={hardwareStatus}
                onRefreshStatus={fetchHardwareStatus}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Cheat-Sheet Modal */}
      {showShortcutsModal && (
        <KeyboardShortcutsModal
          isOpen={showShortcutsModal}
          onClose={() => setShowShortcutsModal(false)}
          isDarkMode={isDarkMode}
        />
      )}
    </div>
  );
};

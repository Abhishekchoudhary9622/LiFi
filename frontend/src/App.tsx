import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  CircuitComponent,
  Wire,
  SimulationMetrics,
  LiFiChannelConfig,
  StarterCircuit
} from './types/circuit';
import { createDemoCircuit } from './circuit/demoCircuit';
import { SimulationEngine, DEFAULT_LIFI_CONFIG } from './circuit/engine';
import { validateCircuit } from './validation/ruleChecker';
import { FullHardwareSetupStudio } from './components/FullHardwareSetupStudio';
import { SemLiFiVirtualLab } from './components/SemLiFiVirtualLab';
import { SemLiFiCircuitsEditor } from './components/SemLiFiCircuitsEditor';
import { RealHardwareTwinLab } from './components/RealHardwareTwinLab';
import { GuidedBuildModal } from './components/GuidedBuildModal';
import { ReportView } from './components/ReportView';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  const [projectName, setProjectName] = useState<string>('SemLiFi Prototype');
  const [studioMode, setStudioMode] = useState<'hardware' | 'editor'>('hardware');

  // Preloaded working demo circuit: SemLiFi Basic Link
  const initialCircuit = useMemo(() => createDemoCircuit(), []);
  const [components, setComponents] = useState<CircuitComponent[]>(initialCircuit.components);
  const [wires, setWires] = useState<Wire[]>(initialCircuit.wires);

  // Undo / Redo stacks
  const [history, setHistory] = useState<{ components: CircuitComponent[]; wires: Wire[] }[]>([]);
  const [redoStack, setRedoStack] = useState<{ components: CircuitComponent[]; wires: Wire[] }[]>([]);

  // Simulation Engine & Metrics
  const engineRef = useRef<SimulationEngine>(new SimulationEngine(DEFAULT_LIFI_CONFIG));
  const [simulationRunning, setSimulationRunning] = useState<boolean>(true);
  const [simulationSpeed, setSimulationSpeed] = useState<number>(1.0);
  const [lifiConfig, setLifiConfig] = useState<LiFiChannelConfig>(DEFAULT_LIFI_CONFIG);

  const [metrics, setMetrics] = useState<SimulationMetrics>(() =>
    engineRef.current.step(initialCircuit.components, initialCircuit.wires, true)
  );

  // Modals
  const [showGuidedBuild, setShowGuidedBuild] = useState<boolean>(false);
  const [showReport, setShowReport] = useState<boolean>(false);

  // Automated Circuit Validation (DRC)
  const validation = useMemo(() => {
    return validateCircuit(components, wires);
  }, [components, wires]);

  // Push state to history
  const pushHistory = (newComponents: CircuitComponent[], newWires: Wire[]) => {
    setHistory((prev) => [...prev.slice(-20), { components, wires }]);
    setRedoStack([]);
  };

  const updateComponents = (newComponents: CircuitComponent[]) => {
    pushHistory(components, wires);
    setComponents(newComponents);
  };

  const updateWires = (newWires: Wire[]) => {
    pushHistory(components, wires);
    setWires(newWires);
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setRedoStack((prev) => [...prev, { components, wires }]);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setComponents(last.components);
    setWires(last.wires);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setHistory((prev) => [...prev, { components, wires }]);
    setRedoStack((prev) => prev.slice(0, prev.length - 1));
    setComponents(next.components);
    setWires(next.wires);
  };

  const [simulationState, setSimulationState] = useState<'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR'>('RUNNING');

  // Real-time Simulation Tick Loop
  useEffect(() => {
    if (simulationState !== 'RUNNING') return;
    const intervalMs = Math.max(30, Math.round(100 / simulationSpeed));
    const timer = setInterval(() => {
      setMetrics((prev) =>
        engineRef.current.step(components, wires, true, prev)
      );
    }, intervalMs);

    return () => clearInterval(timer);
  }, [components, wires, simulationState, simulationSpeed]);

  const handleRun = () => {
    setSimulationState('RUNNING');
    setSimulationRunning(true);
  };

  const handlePause = () => {
    setSimulationState('PAUSED');
    setSimulationRunning(false);
  };

  const handleStop = () => {
    setSimulationState('STOPPED');
    setSimulationRunning(false);
    setMetrics(engineRef.current.step(components, wires, false));
  };

  const handleStep = () => {
    setSimulationState('PAUSED');
    setSimulationRunning(false);
    setMetrics((prev) => engineRef.current.step(components, wires, true, prev));
  };

  const handleToggleSimulation = () => {
    if (simulationState === 'RUNNING') {
      handlePause();
    } else {
      handleRun();
    }
  };

  const handleResetSimulation = () => {
    handleStop();
  };

  // Project persistence handlers
  const handleSaveProject = () => {
    const projectData = {
      projectName,
      timestamp: Date.now(),
      components,
      wires,
      lifiConfig
    };
    try {
      localStorage.setItem('semlifi_circuits_saved', JSON.stringify(projectData));
      alert(`Circuit "${projectName}" saved successfully to LocalStorage!`);
    } catch (err) {
      console.error(err);
      alert('Failed to save circuit to local storage.');
    }
  };

  const handleExportProject = () => {
    const projectData = {
      format: 'SemLiFi-Circuits-v2',
      projectName,
      exportedAt: new Date().toISOString(),
      components,
      wires,
      lifiConfig
    };
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${projectName.toLowerCase().replace(/\s+/g, '_')}.semlificircuit`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportCircuit = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.semlificircuit';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target?.result as string);
            if (data.components && data.wires) {
              pushHistory(components, wires);
              setComponents(data.components);
              setWires(data.wires);
              if (data.projectName) setProjectName(data.projectName);
              if (data.lifiConfig) {
                setLifiConfig(data.lifiConfig);
                engineRef.current.setConfig(data.lifiConfig);
              }
              alert('Circuit netlist imported successfully!');
            }
          } catch (err) {
            alert('Failed to parse circuit JSON file.');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleNewCircuit = () => {
    if (confirm('Create new blank circuit? Current workspace changes will be cleared.')) {
      pushHistory(components, wires);
      setProjectName('Untitled Circuit');
      setComponents([]);
      setWires([]);
    }
  };

  const handleLoadStarter = (starter: StarterCircuit) => {
    pushHistory(components, wires);
    setProjectName(starter.title);
    setComponents(starter.components);
    setWires(starter.wires);
  };

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveProject();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [components, wires, projectName, history, redoStack]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b14] text-slate-100 font-sans">
      {/* Flagship SemLiFi Virtual Lab Studio */}
      <SemLiFiVirtualLab
        projectName={projectName}
        onOpenReport={() => setShowReport(true)}
      />

      {/* Guided Build Step-by-Step Tutorial Modal */}
      <GuidedBuildModal
        isOpen={showGuidedBuild}
        onClose={() => setShowGuidedBuild(false)}
        onRunSimulation={() => setSimulationRunning(true)}
      />

      {/* Report Generator Modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0b0f19] border border-[#1f293d] rounded-xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
            <div className="p-3 border-b border-[#1f293d] flex items-center justify-between bg-[#0c1220]">
              <span className="font-bold text-white text-xs font-mono">SemLiFi Hardware Project Report</span>
              <button
                onClick={() => setShowReport(false)}
                className="p-1 hover:bg-[#1e293b] text-slate-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ReportView
                projectName={projectName}
                components={components}
                wires={wires}
                metrics={metrics}
                validation={validation}
                config={lifiConfig}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

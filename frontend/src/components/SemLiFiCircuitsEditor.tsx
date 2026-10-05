import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  StepForward,
  RotateCw,
  Save,
  Download,
  Upload,
  Trash2,
  Copy,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Search,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  Radio,
  FileCode,
  Sliders,
  Sparkles,
  Info,
  ChevronDown,
  ChevronRight,
  Cpu,
  Layers,
  Eye,
  FileText,
  GraduationCap,
  GitFork,
  Compass,
  X,
  Minus,
  Settings,
  HelpCircle,
  FolderOpen,
  Check,
  Camera
} from 'lucide-react';
import {
  CircuitComponent,
  Wire,
  PinDefinition,
  BreadboardHole,
  SimulationMetrics,
  ValidationResult,
  ComponentCategory,
  StarterCircuit,
  ViewMode,
  SimulationState,
  VerificationStatus
} from '../types/circuit';
import { COMPONENT_CATALOG, ComponentTemplate, GUIDED_EXPLANATION_STEPS } from '../circuit/demoCircuit';
import { STARTER_CIRCUITS } from '../circuit/starters';
import {
  generateBreadboardModel,
  findClosestHole,
  getConnectedHoleIds,
  BreadboardGeometry,
  HOLE_PITCH
} from '../circuit/breadboardModel';
import { CircuitGraph } from '../circuit/netlist';

interface SemLiFiCircuitsEditorProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  components: CircuitComponent[];
  wires: Wire[];
  onUpdateComponents: (comps: CircuitComponent[]) => void;
  onUpdateWires: (wires: Wire[]) => void;
  metrics: SimulationMetrics;
  validation: ValidationResult;
  simulationState?: SimulationState;
  simulationRunning: boolean;
  onRun?: () => void;
  onPause?: () => void;
  onStop?: () => void;
  onStep?: () => void;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  simulationSpeed: number;
  onSetSimulationSpeed: (spd: number) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onSaveProject: () => void;
  onExportProject: () => void;
  onImportCircuit: () => void;
  onNewCircuit: () => void;
  onLoadStarter: (starter: StarterCircuit) => void;
  onOpenReport: () => void;
  onOpenGuidedBuild: () => void;
  onSwitchToHardware?: () => void;
}

export const SemLiFiCircuitsEditor: React.FC<SemLiFiCircuitsEditorProps> = ({
  projectName,
  onProjectNameChange,
  components,
  wires,
  onUpdateComponents,
  onUpdateWires,
  metrics,
  validation,
  simulationState = 'RUNNING',
  simulationRunning,
  onRun,
  onPause,
  onStop,
  onStep,
  onToggleSimulation,
  onResetSimulation,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  onSaveProject,
  onExportProject,
  onImportCircuit,
  onNewCircuit,
  onLoadStarter,
  onOpenReport,
  onSwitchToHardware
}) => {
  // -------------------------------------------------------------
  // VIEW MODES & PRESENTATION
  // -------------------------------------------------------------
  const [viewMode, setViewMode] = useState<ViewMode>('physical');
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [isTraceSignalActive, setIsTraceSignalActive] = useState<boolean>(false);
  const [isLibraryCollapsed, setIsLibraryCollapsed] = useState<boolean>(false);

  // Active Top Menu Dropdown
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  // Canvas Viewport Navigation
  const [zoom, setZoom] = useState<number>(0.92);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 25, y: 25 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToHoles, setSnapToHoles] = useState(true);

  // Selection States
  const [selectedCompId, setSelectedCompId] = useState<string | null>('MCU_1');
  const [selectedPin, setSelectedPin] = useState<{ compId: string; pinId: string } | null>(null);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [tracedPath, setTracedPath] = useState<string[] | null>(null);

  // Floating Engineering Instruments
  const [showOscilloscope, setShowOscilloscope] = useState<boolean>(false);
  const [showMultimeter, setShowMultimeter] = useState<boolean>(false);
  const [showLogicAnalyzer, setShowLogicAnalyzer] = useState<boolean>(false);
  const [showDRCWindow, setShowDRCWindow] = useState<boolean>(false);
  const [highlightedErrorId, setHighlightedErrorId] = useState<string | null>(null);

  // Modals & Education
  const [showDatasheetModal, setShowDatasheetModal] = useState<boolean>(false);
  const [showTeacherCard, setShowTeacherCard] = useState<boolean>(false);
  const [showPinMappingModal, setShowPinMappingModal] = useState<boolean>(false);
  const [guidedStepIndex, setGuidedStepIndex] = useState<number | null>(null);

  // Oscilloscope Controls State
  const [scopeRunning, setScopeRunning] = useState<boolean>(true);
  const [scopeTimeDiv, setScopeTimeDiv] = useState<string>('100 µs');
  const [scopeVoltDiv, setScopeVoltDiv] = useState<string>('1.0 V');
  const [scopeTrigger, setScopeTrigger] = useState<string>('AUTO');
  const [scopeChannel, setScopeChannel] = useState<'pwmTx' | 'ledCurrent' | 'opticalPower' | 'photodiodeOut' | 'amplifierOut' | 'adcInput'>('pwmTx');

  // Multimeter Probes State
  const [dmmMode, setDmmMode] = useState<'DCV' | 'DCA' | 'OHM' | 'CONT'>('DCV');
  const [dmmProbeRed, setDmmProbeRed] = useState<string>('MCU_1:pax_tx');
  const [dmmProbeBlack, setDmmProbeBlack] = useState<string>('MCU_1:gnd_1');

  // Hover States for Breadboard
  const [hoveredHole, setHoveredHole] = useState<BreadboardHole | null>(null);
  const [hoveredStripHoleIds, setHoveredStripHoleIds] = useState<string[]>([]);
  const [hoveredPin, setHoveredPin] = useState<{ compId: string; pinId: string } | null>(null);

  // Dragging Component
  const [draggedCompId, setDraggedCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive DuPont Wiring
  const [wiringStart, setWiringStart] = useState<{
    compId: string;
    pinId: string;
    x: number;
    y: number;
    isBreadboardHole?: boolean;
  } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeWireColor, setActiveWireColor] = useState<string>('#06b6d4');

  // Component Library Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [librarySection, setLibrarySection] = useState<'all' | 'power' | 'mcu' | 'passive' | 'semiconductor' | 'optical' | 'instruments'>('all');

  // Breadboard Geometry model
  const breadboard: BreadboardGeometry = useMemo(() => generateBreadboardModel(130, 90), []);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Electrical Nets (Derived from Circuit Graph)
  const electricalNets = useMemo(() => {
    return CircuitGraph.buildNets(components, wires, breadboard);
  }, [components, wires, breadboard]);

  const validationErrors = useMemo(() => {
    return validation.rules.filter(r => r.status === 'error');
  }, [validation]);

  // Selected Component & Wire
  const selectedComponent = useMemo(() => {
    return components.find(c => c.id === selectedCompId) || null;
  }, [components, selectedCompId]);

  const selectedWire = useMemo(() => {
    return wires.find(w => w.id === selectedWireId) || null;
  }, [wires, selectedWireId]);

  // Filtered Component Catalog
  const filteredCatalog = useMemo(() => {
    return COMPONENT_CATALOG.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (librarySection === 'all') return true;
      if (librarySection === 'power') return item.category === 'power';
      if (librarySection === 'mcu') return item.category === 'microcontrollers';
      if (librarySection === 'passive') return item.category === 'basic' || item.typeId === 'resistor' || item.typeId === 'capacitor';
      if (librarySection === 'semiconductor') return item.typeId === 'transistor_npn' || item.typeId === 'diode' || item.typeId === 'led';
      if (librarySection === 'optical') return item.category === 'lifi' || item.typeId === 'led' || item.typeId === 'photodiode';
      return true;
    });
  }, [searchQuery, librarySection]);

  // Canvas Coordinates from Mouse Event
  const getCanvasCoords = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom
    };
  };

  // Rotate Selected Component
  const handleRotateSelected = () => {
    if (!selectedCompId) return;
    onUpdateComponents(
      components.map(comp => {
        if (comp.id !== selectedCompId) return comp;
        const newRotation = ((comp.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...comp, rotation: newRotation };
      })
    );
  };

  // Delete Selected Component or Wire
  const handleDeleteSelected = () => {
    if (selectedCompId) {
      onUpdateComponents(components.filter(c => c.id !== selectedCompId));
      onUpdateWires(wires.filter(w => w.fromComponentId !== selectedCompId && w.toComponentId !== selectedCompId));
      setSelectedCompId(null);
      setSelectedPin(null);
    } else if (selectedWireId) {
      onUpdateWires(wires.filter(w => w.id !== selectedWireId));
      setSelectedWireId(null);
    }
  };

  // Duplicate Selected Component
  const handleDuplicateSelected = () => {
    if (!selectedComponent) return;
    const newId = `${selectedComponent.typeId.toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const duplicated: CircuitComponent = {
      ...selectedComponent,
      id: newId,
      name: `${selectedComponent.name} (Copy)`,
      x: selectedComponent.x + 30,
      y: selectedComponent.y + 30,
      pins: selectedComponent.pins.map(p => ({ ...p }))
    };
    onUpdateComponents([...components, duplicated]);
    setSelectedCompId(newId);
  };

  // Add Component from Library
  const handleAddComponent = (template: ComponentTemplate) => {
    const newId = `${template.typeId.toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const newComp: CircuitComponent = {
      id: newId,
      typeId: template.typeId,
      name: `${template.name} ${newId.split('_')[1]}`,
      category: template.category,
      x: 200 + (components.length * 30) % 200,
      y: 180 + (components.length * 20) % 150,
      rotation: 0,
      properties: { ...template.defaultProperties },
      educationalInfo: template.educationalInfo,
      pins: template.pins.map(p => ({ ...p }))
    };
    onUpdateComponents([...components, newComp]);
    setSelectedCompId(newId);
    setSelectedPin(null);
    setSelectedWireId(null);
  };

  // Pin Absolute Position calculation (handles rotation)
  const getPinAbsolutePos = (comp: CircuitComponent, pin: PinDefinition) => {
    let px = pin.x;
    let py = pin.y;
    if (comp.rotation === 90) {
      px = -pin.y;
      py = pin.x;
    } else if (comp.rotation === 180) {
      px = -pin.x;
      py = -pin.y;
    } else if (comp.rotation === 270) {
      px = pin.y;
      py = -pin.x;
    }
    return { x: comp.x + px, y: comp.y + py };
  };

  // Wire click to select
  const handleWireClick = (wire: Wire, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedWireId(wire.id);
    setSelectedCompId(null);
    setSelectedPin(null);
  };

  // Pin click (start/end wire or select pin)
  const handlePinClick = (comp: CircuitComponent, pin: PinDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    const pinPos = getPinAbsolutePos(comp, pin);

    if (!wiringStart) {
      setWiringStart({
        compId: comp.id,
        pinId: pin.id,
        x: pinPos.x,
        y: pinPos.y
      });
      setSelectedPin({ compId: comp.id, pinId: pin.id });
      setSelectedCompId(comp.id);
      setSelectedWireId(null);
    } else {
      if (wiringStart.compId === comp.id && wiringStart.pinId === pin.id) {
        setWiringStart(null);
        return;
      }
      const newWire: Wire = {
        id: `wire_${Date.now().toString().slice(-6)}`,
        fromComponentId: wiringStart.compId,
        fromPinId: wiringStart.pinId,
        toComponentId: comp.id,
        toPinId: pin.id,
        color: activeWireColor,
        active: simulationRunning,
        purpose: 'Circuit jumper interconnect'
      };
      onUpdateWires([...wires, newWire]);
      setWiringStart(null);
    }
  };

  // Breadboard hole click (wiring to breadboard hole)
  const handleHoleClick = (hole: BreadboardHole, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!wiringStart) {
      setWiringStart({
        compId: 'BREADBOARD',
        pinId: hole.id,
        x: hole.x,
        y: hole.y,
        isBreadboardHole: true
      });
    } else {
      const newWire: Wire = {
        id: `wire_${Date.now().toString().slice(-6)}`,
        fromComponentId: wiringStart.compId,
        fromPinId: wiringStart.pinId,
        toComponentId: 'BREADBOARD',
        toPinId: hole.id,
        color: activeWireColor,
        active: simulationRunning,
        purpose: `Interconnect to Breadboard Socket ${hole.id}`
      };
      onUpdateWires([...wires, newWire]);
      setWiringStart(null);
    }
  };

  // Mouse Move on Canvas
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    setCurrentMousePos(coords);

    if (isPanning) {
      setPan({ x: e.clientX - startPan.x, y: e.clientY - startPan.y });
      return;
    }

    if (draggedCompId) {
      let targetX = coords.x - dragOffset.x;
      let targetY = coords.y - dragOffset.y;

      const comp = components.find(c => c.id === draggedCompId);
      if (comp && snapToHoles) {
        const pin1 = comp.pins[0];
        if (pin1) {
          const testX = targetX + pin1.x;
          const testY = targetY + pin1.y;
          const nearHole = findClosestHole(testX, testY, breadboard.holes, 16);
          if (nearHole) {
            targetX = nearHole.x - pin1.x;
            targetY = nearHole.y - pin1.y;
            comp.mountedHoles = [{ pinId: pin1.id, holeId: nearHole.id }];
          }
        }
      }

      onUpdateComponents(
        components.map(c => (c.id === draggedCompId ? { ...c, x: targetX, y: targetY } : c))
      );
    }
  };

  const handleCanvasMouseUp = () => {
    setDraggedCompId(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    setActiveMenu(null);
    if (e.button === 1 || e.altKey || e.buttons === 4) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.target === svgRef.current) {
      setSelectedCompId(null);
      setSelectedPin(null);
      setSelectedWireId(null);
      setWiringStart(null);
      setTracedPath(null);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  // Wire path string generator
  const getWirePath = (wire: Wire) => {
    let startX = 0;
    let startY = 0;
    let endX = 0;
    let endY = 0;

    if (wire.fromComponentId === 'BREADBOARD') {
      const h = breadboard.holeMap.get(wire.fromPinId);
      if (h) { startX = h.x; startY = h.y; }
    } else {
      const c = components.find(comp => comp.id === wire.fromComponentId);
      if (c) {
        const p = c.pins.find(pin => pin.id === wire.fromPinId);
        if (p) {
          const pos = getPinAbsolutePos(c, p);
          startX = pos.x;
          startY = pos.y;
        }
      }
    }

    if (wire.toComponentId === 'BREADBOARD') {
      const h = breadboard.holeMap.get(wire.toPinId);
      if (h) { endX = h.x; endY = h.y; }
    } else {
      const c = components.find(comp => comp.id === wire.toComponentId);
      if (c) {
        const p = c.pins.find(pin => pin.id === wire.toPinId);
        if (p) {
          const pos = getPinAbsolutePos(c, p);
          endX = pos.x;
          endY = pos.y;
        }
      }
    }

    if (startX === 0 && endX === 0) return '';
    const dx = endX - startX;
    const dy = endY - startY;
    const sag = Math.min(50, Math.sqrt(dx * dx + dy * dy) * 0.2);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 + sag;
    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  };

  // Wire Colors Palette
  const wireColors = [
    { label: 'Cyan', color: '#06b6d4' },
    { label: 'Red (VCC)', color: '#ef4444' },
    { label: 'Black (GND)', color: '#1e293b' },
    { label: 'Green', color: '#10b981' },
    { label: 'Yellow', color: '#f59e0b' },
    { label: 'Blue', color: '#3b82f6' },
    { label: 'Orange', color: '#f97316' },
    { label: 'White', color: '#f8fafc' }
  ];

  // Signal Trace Trigger
  const handleTraceConnection = (pinId: string) => {
    const path = CircuitGraph.tracePath(pinId, components, wires);
    setTracedPath(path);
  };

  // Multimeter reading calculation
  const dmmReading = useMemo(() => {
    if (!simulationRunning && simulationState !== 'PAUSED') {
      return { value: '0.000', unit: dmmMode === 'DCV' ? 'V' : dmmMode === 'DCA' ? 'mA' : 'Ω' };
    }
    if (dmmMode === 'DCV') {
      const isRedVcc = dmmProbeRed.includes('3v3') || dmmProbeRed.includes('vcc');
      const isBlackGnd = dmmProbeBlack.includes('gnd');
      const isRedAdc = dmmProbeRed.includes('rx') || dmmProbeRed.includes('out');
      if (isRedVcc && isBlackGnd) return { value: '3.300', unit: 'V' };
      if (isRedAdc && isBlackGnd) return { value: metrics.adcSampleVoltage.toFixed(3), unit: 'V' };
      return { value: (3.28 + (Math.random() - 0.5) * 0.02).toFixed(3), unit: 'V' };
    } else if (dmmMode === 'DCA') {
      return { value: (metrics.ledCurrentMa || 18.5).toFixed(2), unit: 'mA' };
    } else if (dmmMode === 'OHM') {
      const res = components.find(c => c.typeId === 'resistor');
      const r = res ? (res.properties.resistance as number) || 220 : 220;
      return { value: r.toFixed(1), unit: 'Ω' };
    } else {
      return { value: 'SHORT', unit: 'BEEP' };
    }
  }, [dmmMode, dmmProbeRed, dmmProbeBlack, simulationRunning, simulationState, metrics, components]);

  return (
    <div className="flex-1 flex flex-col h-screen w-screen bg-[#070b14] font-mono text-slate-200 select-none overflow-hidden">
      {/* ======================================================== */}
      {/* 1. TOP TOOLBAR & STANDARD ENGINEERING MENUS               */}
      {/* ======================================================== */}
      <header className="h-10 bg-[#090e1a] border-b border-[#1a2333] flex items-center justify-between px-3 z-30 select-none text-xs">
        {/* Left: EDA Menu Bar */}
        <div className="flex items-center space-x-1">
          {/* Logo / Identifier */}
          <div className="flex items-center space-x-2 mr-3 pr-3 border-r border-[#1e293b]">
            <div className="w-5 h-5 rounded bg-cyan-600 flex items-center justify-center text-white font-bold text-[10px] shadow-[0_0_8px_rgba(6,182,212,0.4)]">
              SL
            </div>
            <span className="font-bold text-white tracking-wider text-xs">SemLiFi Studio</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              VSM
            </span>
          </div>

          {/* Menus: File, Edit, View, Simulation, Tools, Debug, Help */}
          {[
            {
              id: 'file',
              label: 'File',
              items: [
                { label: 'New Blank Circuit', action: onNewCircuit },
                { label: 'Open Circuit JSON...', action: onImportCircuit },
                { label: 'Save Project (Ctrl+S)', action: onSaveProject },
                { label: 'Export Circuit File...', action: onExportProject },
                { label: 'Generate Lab Report...', action: onOpenReport }
              ]
            },
            {
              id: 'edit',
              label: 'Edit',
              items: [
                { label: 'Undo (Ctrl+Z)', action: onUndo || (() => {}), disabled: !canUndo },
                { label: 'Redo (Ctrl+Y)', action: onRedo || (() => {}), disabled: !canRedo },
                { label: 'Rotate (R)', action: handleRotateSelected, disabled: !selectedCompId },
                { label: 'Duplicate (D)', action: handleDuplicateSelected, disabled: !selectedCompId },
                { label: 'Delete (Del)', action: handleDeleteSelected, disabled: !selectedCompId && !selectedWireId }
              ]
            },
            {
              id: 'view',
              label: 'View',
              items: [
                { label: 'Physical Workbench (F1)', action: () => setViewMode('physical') },
                { label: 'Schematic View (F2)', action: () => setViewMode('schematic') },
                { label: 'Signal Flow View (F3)', action: () => setViewMode('signal_flow') },
                { label: 'Reset Zoom & Fit (F)', action: () => { setZoom(0.92); setPan({ x: 25, y: 25 }); } },
                { label: 'Toggle Grid (G)', action: () => setShowGrid(g => !g) },
                { label: 'Toggle Snapping (S)', action: () => setSnapToHoles(s => !s) }
              ]
            },
            {
              id: 'simulation',
              label: 'Simulation',
              items: [
                { label: 'Run Simulation (F5)', action: onRun || onToggleSimulation },
                { label: 'Pause Simulation (F6)', action: onPause || onToggleSimulation },
                { label: 'Stop Simulation (F7)', action: onStop || onResetSimulation },
                { label: 'Single Step (F8)', action: onStep || onToggleSimulation },
                { label: 'Electrical Rule Check (DRC)', action: () => setShowDRCWindow(true) }
              ]
            },
            {
              id: 'tools',
              label: 'Tools',
              items: [
                { label: 'Digital Storage Oscilloscope', action: () => setShowOscilloscope(true) },
                { label: 'Digital Multimeter', action: () => setShowMultimeter(true) },
                { label: 'Digital Logic Analyzer', action: () => setShowLogicAnalyzer(true) },
                { label: 'Hardware Pin Mapping Matrix', action: () => setShowPinMappingModal(true) }
              ]
            },
            {
              id: 'debug',
              label: 'Debug',
              items: [
                { label: 'Trace Signal Path', action: () => setIsTraceSignalActive(t => !t) },
                { label: 'Inspect Microcontroller PA0 TX', action: () => setSelectedPin({ compId: 'MCU_1', pinId: 'pax_tx' }) },
                { label: 'Inspect Microcontroller PA1 ADC', action: () => setSelectedPin({ compId: 'MCU_1', pinId: 'pax_rx' }) }
              ]
            },
            {
              id: 'help',
              label: 'Help',
              items: [
                { label: 'Guided Hardware Walkthrough', action: () => setGuidedStepIndex(0) },
                { label: 'Component Datasheets', action: () => setShowDatasheetModal(true) },
                { label: 'About SemLiFi Hardware Model', action: () => alert('SemLiFi Hardware Digital Twin v2.0 - Built for Academic Prototype Presentation') }
              ]
            }
          ].map(menu => (
            <div key={menu.id} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === menu.id ? null : menu.id)}
                className={`px-2.5 py-1 rounded text-slate-300 hover:text-white hover:bg-[#1a2333] transition-colors ${
                  activeMenu === menu.id ? 'bg-[#1a2333] text-white' : ''
                }`}
              >
                {menu.label}
              </button>
              {activeMenu === menu.id && (
                <div className="absolute left-0 mt-1 w-52 bg-[#0e1626] border border-[#1f293d] rounded shadow-2xl py-1 z-50 text-xs">
                  {menu.items.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setActiveMenu(null);
                        item.action();
                      }}
                      disabled={(item as any).disabled}
                      className={`w-full text-left px-3 py-1.5 hover:bg-[#1e293b] flex items-center justify-between ${
                        (item as any).disabled ? 'opacity-40 cursor-not-allowed text-slate-500' : 'text-slate-200'
                      }`}
                    >
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Center: SIMULATION CONTROLS [RUN] [PAUSE] [STOP] [STEP] */}
        <div className="flex items-center space-x-2">
          {/* Simulation State Indicator Pill */}
          <div className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded bg-[#0e1626] border border-[#1f293d] text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                simulationState === 'RUNNING'
                  ? 'bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse'
                  : simulationState === 'PAUSED'
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                  : simulationState === 'ERROR'
                  ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]'
                  : 'bg-slate-500'
              }`}
            />
            <span className="font-bold tracking-wider text-slate-200">{simulationState}</span>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-1 bg-[#0b101c] p-0.5 rounded border border-[#1a2333]">
            <button
              onClick={onRun || onToggleSimulation}
              className={`px-2.5 py-1 rounded font-bold text-xs flex items-center space-x-1 transition-colors ${
                simulationState === 'RUNNING'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-slate-300 hover:text-white hover:bg-[#1a2333]'
              }`}
              title="Run Simulation (F5)"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>RUN</span>
            </button>

            <button
              onClick={onPause || onToggleSimulation}
              className={`px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors ${
                simulationState === 'PAUSED'
                  ? 'bg-amber-950 text-amber-300 border border-amber-600'
                  : 'text-slate-400 hover:text-white hover:bg-[#1a2333]'
              }`}
              title="Pause Simulation (F6)"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
              <span>PAUSE</span>
            </button>

            <button
              onClick={onStop || onResetSimulation}
              className={`px-2 py-1 rounded text-xs flex items-center space-x-1 transition-colors ${
                simulationState === 'STOPPED'
                  ? 'bg-slate-800 text-slate-200'
                  : 'text-slate-400 hover:text-rose-400 hover:bg-rose-950/40'
              }`}
              title="Stop Simulation (F7)"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP</span>
            </button>

            <button
              onClick={onStep || onToggleSimulation}
              className="px-2 py-1 rounded text-xs text-cyan-300 hover:bg-cyan-950 hover:text-cyan-200 flex items-center space-x-1"
              title="Single Simulation Step (F8)"
            >
              <StepForward className="w-3.5 h-3.5" />
              <span>STEP</span>
            </button>
          </div>

          <div className="w-px h-4 bg-[#1f293d]" />

          {/* VIEW SWITCHER: HARDWARE vs PHYSICAL vs SCHEMATIC vs SIGNAL FLOW */}
          <div className="flex items-center space-x-1 bg-[#0b101c] p-0.5 rounded border border-[#1a2333]">
            {onSwitchToHardware && (
              <button
                onClick={onSwitchToHardware}
                className="px-2 py-1 rounded font-bold text-xs flex items-center space-x-1 transition-colors text-cyan-400 hover:text-white hover:bg-cyan-950/60 border border-cyan-800/40"
                title="Return to Real Hardware Digital Twin View"
              >
                <Camera className="w-3.5 h-3.5 text-cyan-400" />
                <span>Hardware Twin</span>
              </button>
            )}
            <button
              onClick={() => setViewMode('physical')}
              className={`px-2 py-1 rounded font-bold text-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'physical'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Physical</span>
            </button>
            <button
              onClick={() => setViewMode('schematic')}
              className={`px-2 py-1 rounded font-bold text-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'schematic'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>Schematic</span>
            </button>
            <button
              onClick={() => setViewMode('signal_flow')}
              className={`px-2 py-1 rounded font-bold text-xs flex items-center space-x-1 transition-colors ${
                viewMode === 'signal_flow'
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-600'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Signal Flow</span>
            </button>
          </div>
        </div>

        {/* Right: TRACE SIGNAL & TEACHER PRESENTATION MODE */}
        <div className="flex items-center space-x-2">
          {/* TRACE HARDWARE SIGNAL */}
          <button
            onClick={() => setIsTraceSignalActive(t => !t)}
            className={`px-2.5 py-1 rounded text-xs font-bold transition-all flex items-center space-x-1 border ${
              isTraceSignalActive
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-[#111827] text-slate-300 border-[#1f293d] hover:bg-[#1a2333]'
            }`}
            title="Highlight active SemLiFi signal path across components"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>TRACE SIGNAL</span>
          </button>

          {/* TEACHER PRESENTATION MODE TOGGLE */}
          <button
            onClick={() => setIsPresentationMode(p => !p)}
            className={`px-3 py-1 rounded text-xs font-bold font-mono transition-all flex items-center space-x-1.5 border ${
              isPresentationMode
                ? 'bg-amber-950 text-amber-300 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)] animate-pulse'
                : 'bg-[#111827] text-slate-300 border-[#1f293d] hover:bg-[#1e293b]'
            }`}
            title="Toggle Teacher / Presentation Mode for explaining to teacher"
          >
            <GraduationCap className="w-4 h-4 text-amber-400" />
            <span>{isPresentationMode ? 'TEACHER MODE ACTIVE' : 'PRESENTATION MODE'}</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN ENGINEERING WORKSPACE                            */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ---------------------------------------------------- */}
        {/* LEFT COMPONENT & INSTRUMENT LIBRARY (EDA Tree)       */}
        {/* ---------------------------------------------------- */}
        {!isPresentationMode && (
          <aside
            className={`bg-[#080d17] border-r border-[#1a2333] flex flex-col z-20 shrink-0 select-none transition-all duration-200 ${
              isLibraryCollapsed ? 'w-10' : 'w-64'
            }`}
          >
            {/* Header */}
            <div className="p-2 border-b border-[#1a2333] flex items-center justify-between bg-[#0b101c]">
              {!isLibraryCollapsed && (
                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                  Component Library
                </span>
              )}
              <button
                onClick={() => setIsLibraryCollapsed(c => !c)}
                className="p-1 hover:bg-[#1a2333] rounded text-slate-400 hover:text-white ml-auto"
                title={isLibraryCollapsed ? 'Expand Library' : 'Collapse Library'}
              >
                {isLibraryCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
              </button>
            </div>

            {!isLibraryCollapsed && (
              <>
                {/* Search */}
                <div className="p-2 border-b border-[#1a2333]">
                  <div className="relative">
                    <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search components..."
                      className="w-full pl-6 pr-2 py-1 bg-[#101726] border border-[#1a2333] rounded text-[11px] text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                {/* Categories & Components List */}
                <div className="flex-1 overflow-y-auto p-1.5 space-y-3">
                  {/* POWER */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 flex items-center space-x-1">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>POWER</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {COMPONENT_CATALOG.filter(c => c.category === 'power').map(template => (
                        <div
                          key={template.typeId}
                          onClick={() => handleAddComponent(template)}
                          className="px-2 py-1.5 bg-[#0f1728] hover:bg-[#17233d] hover:border-cyan-600 border border-transparent rounded cursor-pointer transition-colors text-xs flex items-center justify-between group"
                        >
                          <span className="text-slate-200 group-hover:text-cyan-300">{template.name}</span>
                          <span className="text-[9px] text-cyan-400 opacity-0 group-hover:opacity-100">+ Place</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MICROCONTROLLERS */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 flex items-center space-x-1">
                      <Cpu className="w-3 h-3 text-blue-400" />
                      <span>MICROCONTROLLERS</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {COMPONENT_CATALOG.filter(c => c.category === 'microcontrollers').map(template => (
                        <div
                          key={template.typeId}
                          onClick={() => handleAddComponent(template)}
                          className="px-2 py-1.5 bg-[#0f1728] hover:bg-[#17233d] hover:border-cyan-600 border border-transparent rounded cursor-pointer transition-colors text-xs flex items-center justify-between group"
                        >
                          <span className="text-slate-200 group-hover:text-cyan-300">STM32F103C8T6 (Blue Pill)</span>
                          <span className="text-[9px] text-cyan-400 opacity-0 group-hover:opacity-100">+ Place</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PASSIVE */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 flex items-center space-x-1">
                      <Sliders className="w-3 h-3 text-emerald-400" />
                      <span>PASSIVE</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {COMPONENT_CATALOG.filter(c => c.typeId === 'resistor' || c.typeId === 'capacitor').map(template => (
                        <div
                          key={template.typeId}
                          onClick={() => handleAddComponent(template)}
                          className="px-2 py-1.5 bg-[#0f1728] hover:bg-[#17233d] hover:border-cyan-600 border border-transparent rounded cursor-pointer transition-colors text-xs flex items-center justify-between group"
                        >
                          <span className="text-slate-200 group-hover:text-cyan-300">{template.name}</span>
                          <span className="text-[9px] text-cyan-400 opacity-0 group-hover:opacity-100">+ Place</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* SEMICONDUCTOR */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 flex items-center space-x-1">
                      <Radio className="w-3 h-3 text-cyan-400" />
                      <span>SEMICONDUCTOR</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {COMPONENT_CATALOG.filter(c => c.typeId === 'transistor_npn' || c.typeId === 'diode' || (c.typeId === 'led' && c.name.includes('Indicator'))).map(template => (
                        <div
                          key={template.typeId}
                          onClick={() => handleAddComponent(template)}
                          className="px-2 py-1.5 bg-[#0f1728] hover:bg-[#17233d] hover:border-cyan-600 border border-transparent rounded cursor-pointer transition-colors text-xs flex items-center justify-between group"
                        >
                          <span className="text-slate-200 group-hover:text-cyan-300">{template.name}</span>
                          <span className="text-[9px] text-cyan-400 opacity-0 group-hover:opacity-100">+ Place</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* OPTICAL */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 flex items-center space-x-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      <span>OPTICAL</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {COMPONENT_CATALOG.filter(c => c.category === 'lifi' || c.typeId === 'photodiode' || (c.typeId === 'led' && !c.name.includes('Indicator'))).map(template => (
                        <div
                          key={template.typeId}
                          onClick={() => handleAddComponent(template)}
                          className="px-2 py-1.5 bg-[#0f1728] hover:bg-[#17233d] hover:border-cyan-600 border border-transparent rounded cursor-pointer transition-colors text-xs flex items-center justify-between group"
                        >
                          <span className="text-slate-200 group-hover:text-cyan-300">{template.name}</span>
                          <span className="text-[9px] text-cyan-400 opacity-0 group-hover:opacity-100">+ Place</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* INSTRUMENTS */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1.5 py-0.5 flex items-center space-x-1">
                      <Activity className="w-3 h-3 text-indigo-400" />
                      <span>INSTRUMENTS</span>
                    </div>
                    <div className="space-y-1 mt-1">
                      <button
                        onClick={() => setShowOscilloscope(s => !s)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors border ${
                          showOscilloscope
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                            : 'bg-[#0f1728] hover:bg-[#17233d] text-slate-200 border-transparent'
                        }`}
                      >
                        <span>Oscilloscope (DSO)</span>
                        <span className="text-[10px] text-cyan-400">{showOscilloscope ? 'OPEN' : 'LAUNCH'}</span>
                      </button>

                      <button
                        onClick={() => setShowMultimeter(m => !m)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors border ${
                          showMultimeter
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                            : 'bg-[#0f1728] hover:bg-[#17233d] text-slate-200 border-transparent'
                        }`}
                      >
                        <span>Multimeter (DMM)</span>
                        <span className="text-[10px] text-cyan-400">{showMultimeter ? 'OPEN' : 'LAUNCH'}</span>
                      </button>

                      <button
                        onClick={() => setShowLogicAnalyzer(l => !l)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors border ${
                          showLogicAnalyzer
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-600'
                            : 'bg-[#0f1728] hover:bg-[#17233d] text-slate-200 border-transparent'
                        }`}
                      >
                        <span>Logic Analyzer</span>
                        <span className="text-[10px] text-cyan-400">{showLogicAnalyzer ? 'OPEN' : 'LAUNCH'}</span>
                      </button>

                      <button
                        onClick={() => setShowDRCWindow(d => !d)}
                        className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors border ${
                          showDRCWindow
                            ? 'bg-amber-950 text-amber-300 border-amber-600'
                            : 'bg-[#0f1728] hover:bg-[#17233d] text-slate-200 border-transparent'
                        }`}
                      >
                        <span>Electrical Rule Check</span>
                        <span className="text-[10px] text-amber-400">{validationErrors.length} ERR</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </aside>
        )}

        {/* ---------------------------------------------------- */}
        {/* CENTER WORKSPACE: THE HERO CANVAS                    */}
        {/* ---------------------------------------------------- */}
        <div
          className="flex-1 h-full relative overflow-hidden bg-[#060a12]"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          {/* ESD Anti-Static Mat Background Grid */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-25"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #38bdf8 0.75px, transparent 0.75px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px, 24px 24px, 24px 24px',
                transform: `translate(${pan.x}px, ${pan.y}px)`
              }}
            />
          )}

          {/* Canvas Viewport Toolbar (Floating bottom-left) */}
          <div className="absolute bottom-3 left-3 z-10 flex items-center space-x-1 bg-[#0b101c]/90 border border-[#1a2333] rounded px-2 py-1 text-xs shadow-xl backdrop-blur-sm">
            <button onClick={() => setZoom(z => Math.max(0.4, z - 0.1))} className="p-1 text-slate-400 hover:text-white" title="Zoom Out (-)">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-cyan-400 w-10 text-center font-bold">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(2.5, z + 0.1))} className="p-1 text-slate-400 hover:text-white" title="Zoom In (+)">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => { setZoom(0.92); setPan({ x: 25, y: 25 }); }} className="p-1 text-slate-400 hover:text-white" title="Fit Canvas (F)">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-3 bg-[#1a2333]" />
            <button onClick={() => setShowGrid(g => !g)} className={`p-1 rounded ${showGrid ? 'text-cyan-400' : 'text-slate-500'}`} title="Toggle Grid (G)">
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleRotateSelected} disabled={!selectedCompId} className={`p-1 rounded ${selectedCompId ? 'text-cyan-400 hover:bg-slate-800' : 'text-slate-600'}`} title="Rotate (R)">
              <RotateCw className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDeleteSelected} disabled={!selectedCompId && !selectedWireId} className={`p-1 rounded ${selectedCompId || selectedWireId ? 'text-rose-400 hover:bg-rose-950/60' : 'text-slate-600'}`} title="Delete (Del)">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* VIEW MODE 1: PHYSICAL WORKBENCH (REAL BREADBOARD REPLICA) */}
          {viewMode === 'physical' && (
            <svg
              ref={svgRef}
              className="w-full h-full cursor-crosshair"
              onMouseDown={handleCanvasMouseDown}
            >
              <defs>
                <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
                {/* -------------------------------------------------- */}
                {/* A. SOLDERLESS BREADBOARD (30 ROWS)                 */}
                {/* -------------------------------------------------- */}
                <g id="breadboard-group">
                  {/* Outer Breadboard Plastic Casing */}
                  <rect
                    x={130}
                    y={70}
                    width={breadboard.width + 20}
                    height={breadboard.height + 40}
                    rx={8}
                    fill="#f8fafc"
                    stroke="#94a3b8"
                    strokeWidth={2}
                    className="shadow-2xl"
                  />

                  {/* Inner Surface */}
                  <rect
                    x={135}
                    y={75}
                    width={breadboard.width + 10}
                    height={breadboard.height + 30}
                    rx={6}
                    fill="#ffffff"
                    stroke="#e2e8f0"
                    strokeWidth={1}
                  />

                  {/* Center Divider / Gutter (0.3" IC Trench) */}
                  <rect
                    x={160}
                    y={206}
                    width={breadboard.width - 35}
                    height={16}
                    fill="#e2e8f0"
                    stroke="#cbd5e1"
                    strokeWidth={1}
                  />
                  <text
                    x={breadboard.width / 2 + 130}
                    y={218}
                    fill="#94a3b8"
                    fontSize={8}
                    textAnchor="middle"
                    className="font-mono font-bold tracking-widest pointer-events-none"
                  >
                    SEMLIFI HARDWARE TESTBED BREADBOARD (30 ROWS)
                  </text>

                  {/* Power Bus Lines (Top Red/Blue, Bottom Red/Blue) */}
                  <line x1={170} y1={86} x2={breadboard.width + 120} y2={86} stroke="#ef4444" strokeWidth={1.5} opacity={0.8} />
                  <line x1={170} y1={122} x2={breadboard.width + 120} y2={122} stroke="#3b82f6" strokeWidth={1.5} opacity={0.8} />
                  <line x1={170} y1={304} x2={breadboard.width + 120} y2={304} stroke="#ef4444" strokeWidth={1.5} opacity={0.8} />
                  <line x1={170} y1={340} x2={breadboard.width + 120} y2={340} stroke="#3b82f6" strokeWidth={1.5} opacity={0.8} />

                  {/* Row Numbers (1, 5, 10, 15, 20, 25, 30) */}
                  {Array.from({ length: 30 }).map((_, idx) => {
                    const rowNum = idx + 1;
                    const xPos = 175 + idx * HOLE_PITCH;
                    if (rowNum % 5 !== 0 && rowNum !== 1) return null;
                    return (
                      <g key={`bb_row_${rowNum}`}>
                        <text x={xPos} y={140} fontSize={8} fill="#64748b" textAnchor="middle" className="font-mono">{rowNum}</text>
                        <text x={xPos} y={294} fontSize={8} fill="#64748b" textAnchor="middle" className="font-mono">{rowNum}</text>
                      </g>
                    );
                  })}

                  {/* Column Letters (A-E top, F-J bottom) */}
                  {['a', 'b', 'c', 'd', 'e'].map((col, idx) => (
                    <text key={`col_top_${col}`} x={156} y={154 + idx * HOLE_PITCH} fontSize={8} fill="#64748b" textAnchor="middle" className="font-mono uppercase font-bold">{col}</text>
                  ))}
                  {['f', 'g', 'h', 'i', 'j'].map((col, idx) => (
                    <text key={`col_bot_${col}`} x={156} y={234 + idx * HOLE_PITCH} fontSize={8} fill="#64748b" textAnchor="middle" className="font-mono uppercase font-bold">{col}</text>
                  ))}

                  {/* Addressable Sockets with Bus Strip Highlight on Hover */}
                  {breadboard.holes.map((hole) => {
                    const isHovered = hoveredHole?.id === hole.id;
                    const isStripHighlighted = hoveredStripHoleIds.includes(hole.id);
                    const isPower = hole.col === '+';
                    const isGnd = hole.col === '-';

                    return (
                      <g
                        key={hole.id}
                        onClick={(e) => handleHoleClick(hole, e)}
                        onMouseEnter={() => {
                          setHoveredHole(hole);
                          setHoveredStripHoleIds(getConnectedHoleIds(hole.id, breadboard));
                        }}
                        onMouseLeave={() => {
                          setHoveredHole(null);
                          setHoveredStripHoleIds([]);
                        }}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={hole.x}
                          cy={hole.y}
                          r={isHovered ? 5.5 : isStripHighlighted ? 4.5 : 3.8}
                          fill={isHovered ? '#06b6d4' : isStripHighlighted ? '#38bdf8' : '#0f172a'}
                          stroke={isHovered || isStripHighlighted ? '#22d3ee' : isPower ? '#ef4444' : isGnd ? '#3b82f6' : '#94a3b8'}
                          strokeWidth={isHovered || isStripHighlighted ? 1.5 : 0.8}
                          className="transition-all"
                        />
                        <rect x={hole.x - 1.2} y={hole.y - 1.2} width={2.4} height={2.4} fill="#cbd5e1" rx={0.5} />
                      </g>
                    );
                  })}
                </g>

                {/* -------------------------------------------------- */}
                {/* B. JUMPER WIRES & FREE-SPACE OPTICAL BEAM          */}
                {/* -------------------------------------------------- */}
                {wires.map((wire) => {
                  const pathStr = getWirePath(wire);
                  const isSelected = selectedWireId === wire.id;
                  const isOptical = wire.signalType === 'optical';
                  const isHighlightedInError = highlightedErrorId === wire.id;
                  if (!pathStr) return null;

                  return (
                    <g
                      key={wire.id}
                      onClick={(e) => handleWireClick(wire, e)}
                      className="cursor-pointer group"
                    >
                      <path d={pathStr} fill="none" stroke="transparent" strokeWidth={14} />
                      {isSelected && (
                        <path d={pathStr} fill="none" stroke="#06b6d4" strokeWidth={6} strokeOpacity={0.6} filter="url(#glowEffect)" />
                      )}
                      {isHighlightedInError && (
                        <path d={pathStr} fill="none" stroke="#f43f5e" strokeWidth={6} strokeOpacity={0.8} filter="url(#glowEffect)" className="animate-pulse" />
                      )}
                      <path
                        d={pathStr}
                        fill="none"
                        stroke={wire.color}
                        strokeWidth={isOptical ? 3 : 2.5}
                        strokeDasharray={isOptical ? '6 4' : undefined}
                        strokeLinecap="round"
                      />
                      {simulationRunning && (
                        <path
                          d={pathStr}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth={1.8}
                          strokeDasharray="4 8"
                          strokeDashoffset={-metrics.timestamp % 100}
                          strokeOpacity={0.8}
                          className="animate-pulse"
                        />
                      )}
                    </g>
                  );
                })}

                {/* Temporary Wire Being Drawn */}
                {wiringStart && (
                  <path
                    d={`M ${wiringStart.x} ${wiringStart.y} L ${currentMousePos.x} ${currentMousePos.y}`}
                    fill="none"
                    stroke={activeWireColor}
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    className="animate-pulse"
                  />
                )}

                {/* -------------------------------------------------- */}
                {/* C. PHYSICAL DISCRETE COMPONENTS                    */}
                {/* -------------------------------------------------- */}
                {components.map((comp) => {
                  const isSelected = selectedCompId === comp.id;
                  const template = COMPONENT_CATALOG.find(t => t.typeId === comp.typeId);
                  const width = template?.defaultWidth || 80;
                  const height = template?.defaultHeight || 60;
                  const isHighlightedInGuidedTour = guidedStepIndex !== null &&
                    GUIDED_EXPLANATION_STEPS[guidedStepIndex]?.componentIds.includes(comp.id);
                  const isTraceHighlighted = isTraceSignalActive && (
                    comp.id === 'MCU_1' || comp.id === 'R_1' || comp.id === 'Q_1' ||
                    comp.id === 'LED_TX' || comp.id === 'PD_RX' || comp.id === 'AMP_1'
                  );

                  return (
                    <g
                      key={comp.id}
                      transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCompId(comp.id);
                        setSelectedPin(null);
                        setSelectedWireId(null);
                        if (isPresentationMode) setShowTeacherCard(true);
                      }}
                      onMouseDown={(e) => {
                        if (e.button === 0 && !wiringStart) {
                          e.stopPropagation();
                          setDraggedCompId(comp.id);
                          const coords = getCanvasCoords(e);
                          setDragOffset({ x: coords.x - comp.x, y: coords.y - comp.y });
                        }
                      }}
                      className="cursor-move group"
                    >
                      {/* Selection / Guided Tour / Signal Trace Glow */}
                      <rect
                        x={-6}
                        y={-6}
                        width={width + 12}
                        height={height + 12}
                        rx={8}
                        fill={isHighlightedInGuidedTour ? '#f59e0b20' : isTraceHighlighted ? '#06b6d420' : isSelected ? '#0a192f' : 'transparent'}
                        stroke={isHighlightedInGuidedTour ? '#f59e0b' : isTraceHighlighted ? '#22d3ee' : isSelected ? '#06b6d4' : 'transparent'}
                        strokeWidth={isHighlightedInGuidedTour || isTraceHighlighted ? 2.5 : 1.5}
                        filter={isSelected || isHighlightedInGuidedTour || isTraceHighlighted ? 'url(#glowEffect)' : undefined}
                      />

                      {/* 1. Resistor (Ceramic Cylinder with Color Bands) */}
                      {comp.typeId === 'resistor' && (
                        <g>
                          <rect x={14} y={6} width={56} height={16} rx={4} fill="#d97706" stroke="#b45309" strokeWidth={1} />
                          <line x1={0} y1={14} x2={14} y2={14} stroke="#94a3b8" strokeWidth={2.5} />
                          <line x1={70} y1={14} x2={84} y2={14} stroke="#94a3b8" strokeWidth={2.5} />
                          <rect x={24} y={6} width={4} height={16} fill="#dc2626" />
                          <rect x={34} y={6} width={4} height={16} fill="#dc2626" />
                          <rect x={44} y={6} width={4} height={16} fill="#78350f" />
                          <rect x={56} y={6} width={3} height={16} fill="#fbbf24" />
                        </g>
                      )}

                      {/* 2. 2N2222 NPN Transistor (TO-92 Semi-Cylindrical Package) */}
                      {comp.typeId === 'transistor_npn' && (
                        <g>
                          <line x1={12} y1={25} x2={12} y2={42} stroke="#94a3b8" strokeWidth={2} />
                          <line x1={32} y1={25} x2={32} y2={42} stroke="#94a3b8" strokeWidth={2} />
                          <line x1={52} y1={25} x2={52} y2={42} stroke="#94a3b8" strokeWidth={2} />
                          <path d="M 10 10 A 20 20 0 0 1 54 10 L 54 26 L 10 26 Z" fill="#0f172a" stroke="#475569" strokeWidth={1} />
                          <text x={32} y={20} fill="#cbd5e1" fontSize={6} textAnchor="middle" className="font-mono font-bold">2N2222</text>
                          <text x={12} y={48} fill="#94a3b8" fontSize={5} textAnchor="middle">B</text>
                          <text x={32} y={48} fill="#94a3b8" fontSize={5} textAnchor="middle">C</text>
                          <text x={52} y={48} fill="#94a3b8" fontSize={5} textAnchor="middle">E</text>
                        </g>
                      )}

                      {/* 3. LiFi LED Emitter (Translucent Dome with Optical Pulse Glow) */}
                      {comp.typeId === 'led' && (
                        <g>
                          <line x1={16} y1={25} x2={16} y2={48} stroke="#94a3b8" strokeWidth={2.5} />
                          <line x1={30} y1={25} x2={30} y2={48} stroke="#94a3b8" strokeWidth={2.5} />
                          <circle cx={23} cy={20} r={18} fill="#065f46" stroke="#10b981" strokeWidth={1.5} />
                          <circle
                            cx={23}
                            cy={20}
                            r={simulationRunning ? 14 : 9}
                            fill={simulationRunning ? '#34d399' : '#059669'}
                            className={simulationRunning ? 'animate-ping' : ''}
                          />
                          <text x={23} y={4} fill="#a7f3d0" fontSize={6} textAnchor="middle" className="font-mono font-bold">850nm</text>
                        </g>
                      )}

                      {/* 4. BPW34 Silicon PIN Photodiode Receiver */}
                      {comp.typeId === 'photodiode' && (
                        <g>
                          <rect x={0} y={0} width={width} height={height} rx={3} fill="#1e1b4b" stroke="#6366f1" strokeWidth={1.5} />
                          <rect x={26} y={20} width={30} height={30} fill="#312e81" stroke="#818cf8" strokeWidth={1} />
                          <line x1={26} y1={35} x2={56} y2={35} stroke="#a5b4fc" strokeWidth={0.5} opacity={0.6} />
                          <line x1={41} y1={20} x2={41} y2={50} stroke="#a5b4fc" strokeWidth={0.5} opacity={0.6} />
                          <text x={41} y={62} fill="#c7d2fe" fontSize={6} textAnchor="middle" className="font-mono">BPW34 PIN</text>
                        </g>
                      )}

                      {/* 5. LM358 DIP-8 Operational Amplifier */}
                      {comp.typeId === 'signal_amplifier' && (
                        <g>
                          <rect x={0} y={0} width={width} height={height} rx={3} fill="#0f172a" stroke="#334155" strokeWidth={1.5} />
                          <circle cx={14} cy={6} r={3} fill="#334155" />
                          <text x={width / 2} y={35} fill="#e2e8f0" fontSize={8} textAnchor="middle" className="font-mono font-bold">LM358P</text>
                          <text x={width / 2} y={46} fill="#64748b" fontSize={6} textAnchor="middle" className="font-mono">TIA PRE-AMP</text>
                        </g>
                      )}

                      {/* 6. STM32 Development Board (Blue Pill) */}
                      {comp.typeId === 'stm32' && (
                        <g>
                          <rect x={0} y={0} width={width} height={height} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1.5} />
                          <rect x={2} y={35} width={14} height={18} rx={1} fill="#94a3b8" stroke="#64748b" strokeWidth={0.5} />
                          <rect x={80} y={26} width={44} height={44} rx={2} fill="#0f172a" stroke="#475569" strokeWidth={1} />
                          <text x={102} y={48} fill="#cbd5e1" fontSize={8} textAnchor="middle" className="font-mono font-bold">ARM</text>
                          <text x={102} y={58} fill="#94a3b8" fontSize={6} textAnchor="middle" className="font-mono">F103C8</text>
                          <rect x={50} y={38} width={20} height={10} rx={3} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={0.5} />
                          <text x={100} y={15} fill="#93c5fd" fontSize={7} textAnchor="middle" className="font-mono font-bold">STM32F103C8T6</text>
                        </g>
                      )}

                      {/* 7. Bench DC Power Supply */}
                      {comp.typeId === 'power_3v3' && (
                        <g>
                          <rect x={0} y={0} width={width} height={height} rx={4} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />
                          <circle cx={22} cy={48} r={6} fill="#dc2626" stroke="#ef4444" strokeWidth={1} />
                          <circle cx={54} cy={48} r={6} fill="#0f172a" stroke="#475569" strokeWidth={1} />
                          <text x={38} y={24} fill="#fbbf24" fontSize={8} textAnchor="middle" className="font-mono font-bold">+3.3V DC</text>
                        </g>
                      )}

                      {/* Component Label */}
                      <text x={width / 2} y={-8} fill="#94a3b8" fontSize={9} textAnchor="middle" className="font-mono font-semibold">
                        {comp.name}
                      </text>

                      {/* Connection Pins */}
                      {comp.pins.map((pin) => {
                        const isHovered = hoveredPin?.compId === comp.id && hoveredPin?.pinId === pin.id;
                        const isPinSelected = selectedPin?.compId === comp.id && selectedPin?.pinId === pin.id;

                        return (
                          <g
                            key={pin.id}
                            transform={`translate(${pin.x}, ${pin.y})`}
                            onClick={(e) => handlePinClick(comp, pin, e)}
                            onMouseEnter={() => setHoveredPin({ compId: comp.id, pinId: pin.id })}
                            onMouseLeave={() => setHoveredPin(null)}
                            className="cursor-pointer"
                          >
                            <circle
                              cx={0}
                              cy={0}
                              r={isHovered || isPinSelected ? 6 : 4}
                              fill={
                                isPinSelected ? '#22d3ee' :
                                pin.type === 'power' ? '#ef4444' :
                                pin.type === 'ground' ? '#1e293b' :
                                pin.type === 'optical' ? '#f59e0b' : '#06b6d4'
                              }
                              stroke="#ffffff"
                              strokeWidth={isHovered || isPinSelected ? 2 : 1}
                              className="transition-all"
                            />
                            {isHovered && (
                              <text x={0} y={-10} fill="#22d3ee" fontSize={9} textAnchor="middle" className="font-mono font-bold">
                                {pin.name}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  );
                })}
              </g>
            </svg>
          )}

          {/* VIEW MODE 2: SYNCHRONIZED ANSI/IEEE SCHEMATIC VIEW */}
          {viewMode === 'schematic' && (
            <div className="w-full h-full p-8 overflow-auto flex items-center justify-center bg-[#070b14]">
              <div className="bg-[#0b101c] border border-[#1a2333] rounded-lg p-6 max-w-4xl w-full shadow-2xl">
                <div className="flex justify-between items-center mb-4 border-b border-[#1a2333] pb-3">
                  <div>
                    <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
                      <FileCode className="w-4 h-4 text-cyan-400" />
                      <span>Synchronized Circuit Schematic (ANSI / IEEE)</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Directly generated from the active physical digital twin netlist.
                    </p>
                  </div>
                  <button onClick={() => setViewMode('physical')} className="text-xs text-cyan-300 hover:underline">
                    ← Return to Physical Workbench
                  </button>
                </div>

                <div className="p-4 bg-[#050912] border border-[#1a2333] rounded font-mono text-xs space-y-4">
                  <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-2">
                    <span>ELECTRICAL NET</span>
                    <span>CONNECTED HARDWARE NODES</span>
                    <span>NOMINAL POTENTIAL</span>
                  </div>
                  {electricalNets.map(net => (
                    <div key={net.id} className="flex justify-between items-center py-1.5 border-b border-slate-800/50">
                      <span className="font-bold" style={{ color: net.color }}>{net.name}</span>
                      <span className="text-slate-300">{net.nodes.map(n => n.label).join(' ↔ ')}</span>
                      <span className="text-amber-400 font-bold">{net.voltage.toFixed(2)} V</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 3: HIGH-LEVEL SIGNAL FLOW VIEW */}
          {viewMode === 'signal_flow' && (
            <div className="w-full h-full p-8 overflow-auto flex items-center justify-center bg-[#070b14]">
              <div className="bg-[#0b101c] border border-[#1a2333] rounded-lg p-8 max-w-3xl w-full shadow-2xl text-center space-y-4">
                <h2 className="text-base font-bold text-white uppercase tracking-wider">
                  SemLiFi End-to-End Hardware Signal Flow
                </h2>
                <div className="flex flex-col items-center space-y-2 font-mono text-xs">
                  <div className="p-3 bg-[#111827] border border-cyan-500 rounded-lg w-80 text-cyan-300 font-bold">
                    DATA PAYLOAD (115.2 kbps UART/Telemetry)
                  </div>
                  <div className="text-cyan-400 font-bold">↓</div>
                  <div className="p-3 bg-[#111827] border border-blue-500 rounded-lg w-80 text-blue-300 font-bold">
                    STM32 CONTROLLER (PWM Timer2 OOK Modulator)
                  </div>
                  <div className="text-blue-400 font-bold">↓</div>
                  <div className="p-3 bg-[#111827] border border-amber-500 rounded-lg w-80 text-amber-300 font-bold">
                    2N2222 TRANSISTOR DRIVER + 850nm LiFi LED
                  </div>
                  <div className="text-amber-400 font-bold">↓ (Free-Space Optical Photons)</div>
                  <div className="p-3 bg-[#1e1b4b] border border-indigo-500 rounded-lg w-80 text-indigo-300 font-bold">
                    BPW34 SILICON PIN PHOTODIODE DETECTOR
                  </div>
                  <div className="text-indigo-400 font-bold">↓ (Microamp Photocurrent)</div>
                  <div className="p-3 bg-[#064e3b] border border-emerald-500 rounded-lg w-80 text-emerald-300 font-bold">
                    LM358 TIA PRE-AMPLIFIER (0–3.3V Analog Sensed)
                  </div>
                  <div className="text-emerald-400 font-bold">↓</div>
                  <div className="p-3 bg-[#111827] border border-cyan-500 rounded-lg w-80 text-cyan-300 font-bold">
                    STM32 12-BIT ADC SAMPLING & RECOVERED DATA
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Breadboard Hover Tooltip */}
          {hoveredHole && (
            <div
              className="absolute pointer-events-none bg-[#0e1626]/95 border border-cyan-500/80 rounded px-3 py-2 text-xs font-mono shadow-2xl z-40 text-slate-200"
              style={{
                left: Math.min(window.innerWidth - 300, (hoveredHole.x * zoom + pan.x + 15)),
                top: Math.max(10, (hoveredHole.y * zoom + pan.y - 45))
              }}
            >
              <div className="text-cyan-300 font-bold flex items-center space-x-2">
                <span>Breadboard Hole {hoveredHole.id}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700">ROW {hoveredHole.row}</span>
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                Connected Bus: <strong className="text-white">{hoveredStripHoleIds.join(' ')}</strong>
              </div>
              <div className="text-[10px] text-emerald-400 mt-0.5">
                Bus Potential: {simulationRunning ? '3.30 V (ESTIMATED)' : '0.00 V'}
              </div>
            </div>
          )}
        </div>

        {/* ---------------------------------------------------- */}
        {/* RIGHT SIDEBAR: COMPONENT / PIN / WIRE INSPECTOR      */}
        {/* ---------------------------------------------------- */}
        {!isPresentationMode && (selectedComponent || selectedPin || selectedWire) && (
          <aside className="w-80 bg-[#080d17] border-l border-[#1a2333] flex flex-col z-20 shrink-0 select-none overflow-y-auto">
            {/* Header */}
            <div className="p-2.5 border-b border-[#1a2333] flex items-center justify-between bg-[#0b101c]">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>{selectedWire ? 'Wire Inspector' : selectedPin ? 'Pin Inspector' : 'Component Inspector'}</span>
              </span>
              <button
                onClick={() => { setSelectedCompId(null); setSelectedPin(null); setSelectedWireId(null); }}
                className="p-1 hover:bg-[#1a2333] text-slate-400 hover:text-white rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 1. WIRE INSPECTOR */}
            {selectedWire ? (
              <div className="p-3 space-y-3">
                <div className="text-sm font-bold text-cyan-300 flex items-center justify-between">
                  <span>{selectedWire.id}</span>
                  <button onClick={handleDeleteSelected} className="p-1 hover:bg-rose-950/60 text-rose-400 rounded">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">Source:</span>
                    <strong className="text-white">{selectedWire.fromComponentId}:{selectedWire.fromPinId}</strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">Destination:</span>
                    <strong className="text-white">{selectedWire.toComponentId}:{selectedWire.toPinId}</strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">Signal:</span>
                    <strong className="text-emerald-400">{selectedWire.signalType || 'DIGITAL'}</strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">Voltage:</span>
                    <strong className="text-amber-400">{selectedWire.voltage ? `${selectedWire.voltage} V` : '3.28 V (ESTIMATED)'}</strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">Current:</span>
                    <strong className="text-cyan-400">18.5 mA (ESTIMATED)</strong>
                  </div>
                  <div className="p-2 bg-[#0e1626] rounded text-[11px] text-slate-300">
                    <strong>Purpose: </strong>{selectedWire.purpose || 'Jumper connection'}
                  </div>
                </div>
              </div>
            ) : selectedPin ? (
              /* 2. PIN INSPECTOR */
              (() => {
                const pinComp = components.find(c => c.id === selectedPin.compId);
                const pinDef = pinComp?.pins.find(p => p.id === selectedPin.pinId);
                const pinWires = wires.filter(
                  w => (w.fromComponentId === selectedPin.compId && w.fromPinId === selectedPin.pinId) ||
                       (w.toComponentId === selectedPin.compId && w.toPinId === selectedPin.pinId)
                );
                const connectedDestinations = pinWires.map(w => {
                  const isFrom = w.fromComponentId === selectedPin.compId && w.fromPinId === selectedPin.pinId;
                  const targetCompId = isFrom ? w.toComponentId : w.fromComponentId;
                  const targetPinId = isFrom ? w.toPinId : w.fromPinId;
                  if (targetCompId === 'BREADBOARD') return `Breadboard Socket ${targetPinId}`;
                  const tComp = components.find(c => c.id === targetCompId);
                  const tPin = tComp?.pins.find(p => p.id === targetPinId);
                  return `${tComp?.name || targetCompId} (${tPin?.name || targetPinId})`;
                });

                const pinVoltage = pinDef?.type === 'power' ? '3.30 V (ESTIMATED)' :
                  pinDef?.type === 'ground' ? '0.00 V' :
                  pinDef?.id.includes('tx') ? (simulationRunning ? '3.30 V / 0.00 V (PWM OOK)' : '0.00 V') :
                  pinDef?.id.includes('rx') ? `${metrics.adcSampleVoltage.toFixed(2)} V (ESTIMATED)` :
                  '3.28 V (ESTIMATED)';

                const pinSignal = pinDef?.id.includes('tx') ? 'PWM Modulation Signal (115.2 kbps)' :
                  pinDef?.id.includes('rx') ? 'Analog TIA Conditioned Signal (0–3.3V)' :
                  pinDef?.type === 'power' ? 'DC Power (+3.3V Rail)' :
                  pinDef?.type === 'ground' ? 'Ground Return (0V Rail)' :
                  'Analog / Digital Signal';

                return (
                  <div className="p-3 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#1f293d] pb-2">
                      <div>
                        <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">PIN INSPECTOR</div>
                        <div className="text-sm font-bold text-white font-mono">{pinComp?.name} • {pinDef?.name}</div>
                      </div>
                      <button
                        onClick={() => setSelectedPin(null)}
                        className="px-2 py-1 text-[10px] bg-[#0e1626] hover:bg-[#1e293b] text-slate-300 rounded border border-[#1f293d]"
                      >
                        ← Back
                      </button>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                        <span className="text-slate-400">PIN:</span>
                        <strong className="text-cyan-300 font-mono">{pinDef?.id.toUpperCase()} ({pinDef?.name})</strong>
                      </div>
                      <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                        <span className="text-slate-400">TYPE:</span>
                        <strong className="text-amber-300 font-mono uppercase">{pinDef?.type || 'GPIO'}</strong>
                      </div>
                      <div className="p-2 bg-[#0e1626] rounded space-y-1">
                        <span className="text-slate-400">CONNECTED TO:</span>
                        <div className="text-white font-mono font-bold text-[11px]">
                          {connectedDestinations.length > 0 ? connectedDestinations.join(', ') : 'Direct Component Lead'}
                        </div>
                      </div>
                      <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                        <span className="text-slate-400">SIGNAL:</span>
                        <strong className="text-emerald-400">{pinSignal}</strong>
                      </div>
                      <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                        <span className="text-slate-400">VOLTAGE:</span>
                        <strong className="text-amber-400 font-mono">{pinVoltage}</strong>
                      </div>
                      <div className="p-2 bg-[#0e1626] rounded text-[11px] text-slate-300 space-y-0.5">
                        <strong className="text-slate-400">PURPOSE: </strong>
                        <p>{pinDef?.purpose || pinDef?.description || 'Circuit pin connection'}</p>
                      </div>
                    </div>

                    {/* TRACE PATH BUTTON */}
                    <button
                      onClick={() => handleTraceConnection(pinDef?.id || '')}
                      className="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded text-xs shadow-lg flex items-center justify-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>TRACE CONNECTION PATH</span>
                    </button>
                  </div>
                );
              })()
            ) : selectedComponent ? (
              /* 3. COMPONENT INSPECTOR */
              <div className="p-3 space-y-4">
                <div>
                  <div className="text-sm font-bold text-cyan-300 flex items-center justify-between">
                    <span>{selectedComponent.name}</span>
                    <button onClick={handleDeleteSelected} className="p-1 hover:bg-rose-950/60 text-rose-400 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">TYPE: {selectedComponent.typeId.toUpperCase()}</div>
                </div>

                {/* Primary Specs & Simulation State */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">COMPONENT:</span>
                    <strong className="text-white">{selectedComponent.name}</strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">MODEL:</span>
                    <strong className="text-white font-mono">{selectedComponent.properties.model || 'Verified'}</strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">VALUE:</span>
                    <strong className="text-cyan-300 font-mono">
                      {selectedComponent.properties.resistance ? `${selectedComponent.properties.resistance} ${selectedComponent.properties.unit || 'Ω'}` :
                       selectedComponent.properties.wavelength ? `${selectedComponent.properties.wavelength} nm` :
                       selectedComponent.properties.feedbackResistance || 'Verified Standard'}
                    </strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">VOLTAGE:</span>
                    <strong className="text-amber-400 font-mono">
                      {selectedComponent.typeId === 'led' ? '2.05 V (ESTIMATED)' :
                       selectedComponent.typeId === 'transistor_npn' ? '0.72 V V_be (ESTIMATED)' :
                       selectedComponent.typeId === 'resistor' ? '1.25 V drop (ESTIMATED)' :
                       '3.30 V (ESTIMATED)'}
                    </strong>
                  </div>
                  <div className="flex justify-between bg-[#0e1626] p-2 rounded">
                    <span className="text-slate-400">CURRENT:</span>
                    <strong className="text-cyan-400 font-mono">
                      {selectedComponent.typeId === 'led' ? `${metrics.ledCurrentMa.toFixed(1)} mA (ESTIMATED)` :
                       selectedComponent.typeId === 'transistor_npn' ? `${metrics.transistorIcMa.toFixed(1)} mA I_c (ESTIMATED)` :
                       selectedComponent.typeId === 'photodiode' ? `${metrics.photodiodeCurrentUa.toFixed(1)} µA (ESTIMATED)` :
                       '18.5 mA (ESTIMATED)'}
                    </strong>
                  </div>
                </div>

                {/* Sockets Occupied */}
                {selectedComponent.mountedHoles && selectedComponent.mountedHoles.length > 0 && (
                  <div className="p-2.5 bg-[#0e1626] border border-[#1a2333] rounded text-xs space-y-1">
                    <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider">Breadboard Sockets Snapped</div>
                    {selectedComponent.mountedHoles.map(mh => (
                      <div key={mh.pinId} className="flex justify-between text-[11px]">
                        <span className="text-slate-400">{mh.pinId}:</span>
                        <strong className="text-white font-mono">Socket {mh.holeId}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {/* Component Pins list (Clickable to inspect pin) */}
                <div className="p-2.5 bg-[#0e1626] border border-[#1a2333] rounded text-xs space-y-1.5">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Component Pins (Click to Inspect)</div>
                  <div className="flex flex-wrap gap-1">
                    {selectedComponent.pins.map(pin => (
                      <button
                        key={pin.id}
                        onClick={() => setSelectedPin({ compId: selectedComponent.id, pinId: pin.id })}
                        className="px-2 py-1 bg-[#162135] hover:bg-cyan-950 hover:text-cyan-300 hover:border-cyan-600 border border-slate-700 rounded text-[10px] font-mono text-slate-300 transition-colors"
                      >
                        {pin.name} ({pin.type})
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action Buttons: Trace, Datasheet, Explain */}
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => handleTraceConnection(selectedComponent.pins[0]?.id || '')}
                    className="px-2 py-1.5 bg-cyan-950 text-cyan-300 hover:bg-cyan-900 border border-cyan-700 rounded text-xs font-bold text-center"
                    title="Highlight connection path on circuit"
                  >
                    TRACE
                  </button>
                  <button
                    onClick={() => setShowDatasheetModal(true)}
                    className="px-2 py-1.5 bg-[#0e1626] text-slate-200 hover:bg-[#1e293b] border border-[#1f293d] rounded text-xs font-bold text-center"
                    title="Open full component datasheet"
                  >
                    DATASHEET
                  </button>
                  <button
                    onClick={() => setShowTeacherCard(true)}
                    className="px-2 py-1.5 bg-amber-950 text-amber-300 hover:bg-amber-900 border border-amber-700 rounded text-xs font-bold text-center"
                    title="Open Teacher Explanation Card"
                  >
                    EXPLAIN
                  </button>
                </div>

                {/* Educational Learning Guide (The 4 core questions) */}
                {selectedComponent.educationalInfo && (
                  <div className="p-3 bg-[#0e1626] border border-cyan-900/50 rounded text-xs space-y-2.5">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">WHY IS THIS COMPONENT USED?</div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{selectedComponent.educationalInfo.whyIsItUsed}</p>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">WHAT DOES IT DO?</div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{selectedComponent.educationalInfo.whatDoesItDo}</p>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-400 font-bold">WHAT IS IT CONNECTED TO?</div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">{selectedComponent.educationalInfo.whereIsItConnected}</p>
                    </div>

                    <div>
                      <div className="text-[10px] text-cyan-400 font-bold">WHAT SIGNAL PASSES THROUGH IT?</div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                        {selectedComponent.typeId === 'resistor' ? 'Base drive current pulses (0V to 3.3V, ~11.8 mA)' :
                         selectedComponent.typeId === 'transistor_npn' ? 'Collector switched pulse current sinking through LED (~18 mA)' :
                         selectedComponent.typeId === 'led' ? '850nm Near-Infrared optical pulse stream' :
                         selectedComponent.typeId === 'photodiode' ? 'Microampere reverse photocurrent (0 to 18 µA)' :
                         selectedComponent.typeId === 'signal_amplifier' ? 'Conditioned analog voltage signal (0 to 3.3V) for ADC' :
                         'System power or data bus'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </aside>
        )}
      </div>

      {/* ======================================================== */}
      {/* 3. FLOATING ENGINEERING INSTRUMENTS                       */}
      {/* ======================================================== */}

      {/* A. DIGITAL STORAGE OSCILLOSCOPE (DSO) */}
      {showOscilloscope && (
        <div className="fixed bottom-12 right-6 z-50 w-96 bg-[#090e1a] border-2 border-cyan-600 rounded-lg shadow-2xl font-mono select-none overflow-hidden">
          {/* Header */}
          <div className="bg-[#0f1728] px-3 py-1.5 border-b border-[#1a2333] flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span>DSO-100MHz Digital Oscilloscope</span>
            </span>
            <div className="flex items-center space-x-1">
              <button onClick={() => setScopeRunning(r => !r)} className="px-1.5 py-0.5 bg-slate-800 text-cyan-300 rounded text-[10px]">
                {scopeRunning ? 'STOP' : 'RUN'}
              </button>
              <button onClick={() => setShowOscilloscope(false)} className="text-slate-400 hover:text-white p-0.5">✕</button>
            </div>
          </div>

          {/* CRT / Phosphor Display */}
          <div className="p-3 bg-[#03060a]">
            <div className="h-36 bg-[#040810] border border-cyan-900/80 rounded relative overflow-hidden">
              {/* Graticule 8x8 Grid */}
              <div
                className="absolute inset-0 opacity-20 pointer-events-none"
                style={{
                  backgroundImage: 'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
                  backgroundSize: '24px 18px'
                }}
              />

              {/* Live Waveform Polyline */}
              <svg className="w-full h-full">
                <polyline
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  points={metrics.channelWaveform
                    .map((pt, i) => {
                      const val = (pt as any)[scopeChannel] || 0;
                      const maxVal = scopeChannel === 'opticalPower' ? 5 : scopeChannel === 'ledCurrent' ? 25 : 3.5;
                      const y = 130 - (val / maxVal) * 110;
                      return `${(i / 39) * 360},${Math.max(10, Math.min(134, y))}`;
                    })
                    .join(' ')}
                />
              </svg>

              <div className="absolute top-1 left-2 text-[9px] text-cyan-400 font-bold">
                {scopeChannel.toUpperCase()} • {scopeTimeDiv}/div • {scopeVoltDiv}/div
              </div>
            </div>

            {/* Scope Knobs & Channel Selector */}
            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-slate-400 block mb-0.5">CHANNEL PROBE:</span>
                <select
                  value={scopeChannel}
                  onChange={(e) => setScopeChannel(e.target.value as any)}
                  className="w-full bg-[#101726] border border-[#1a2333] text-cyan-300 rounded px-1.5 py-1"
                >
                  <option value="pwmTx">CH1: MCU PA0 (TX PWM)</option>
                  <option value="ledCurrent">CH2: 2N2222 Collector (LED)</option>
                  <option value="opticalPower">CH3: Optical Radiant Flux</option>
                  <option value="photodiodeOut">CH4: BPW34 Photocurrent</option>
                  <option value="amplifierOut">CH5: LM358 TIA OUT</option>
                  <option value="adcInput">CH6: MCU PA1 ADC</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">TIME BASE:</span>
                <select
                  value={scopeTimeDiv}
                  onChange={(e) => setScopeTimeDiv(e.target.value)}
                  className="w-full bg-[#101726] border border-[#1a2333] text-white rounded px-1.5 py-1"
                >
                  <option value="50 µs">50 µs / div</option>
                  <option value="100 µs">100 µs / div</option>
                  <option value="200 µs">200 µs / div</option>
                  <option value="1 ms">1 ms / div</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. DIGITAL MULTIMETER (DMM) */}
      {showMultimeter && (
        <div className="fixed bottom-12 right-96 z-50 w-80 bg-[#090e1a] border-2 border-amber-500 rounded-lg shadow-2xl font-mono select-none overflow-hidden">
          <div className="bg-[#0f1728] px-3 py-1.5 border-b border-[#1a2333] flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>DMM-TrueRMS Digital Multimeter</span>
            </span>
            <button onClick={() => setShowMultimeter(false)} className="text-slate-400 hover:text-white p-0.5">✕</button>
          </div>

          <div className="p-3 bg-[#03060a] space-y-3">
            {/* LCD Display */}
            <div className="bg-[#1a2e1f] border border-emerald-800 rounded p-3 text-right">
              <span className="text-[10px] text-emerald-400 block tracking-widest uppercase">{dmmMode} MODE (ESTIMATED)</span>
              <span className="text-3xl font-bold text-emerald-300 tracking-wider">
                {dmmReading.value} <span className="text-sm font-normal text-emerald-400">{dmmReading.unit}</span>
              </span>
            </div>

            {/* Mode Selector Buttons */}
            <div className="grid grid-cols-4 gap-1 text-[11px]">
              {(['DCV', 'DCA', 'OHM', 'CONT'] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setDmmMode(mode)}
                  className={`py-1 rounded font-bold transition-colors ${
                    dmmMode === mode
                      ? 'bg-amber-600 text-black'
                      : 'bg-[#101726] text-slate-300 hover:bg-[#1a2333]'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Probes Node Selection */}
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div>
                <span className="text-rose-400 block mb-0.5">PROBE RED (+):</span>
                <select
                  value={dmmProbeRed}
                  onChange={(e) => setDmmProbeRed(e.target.value)}
                  className="w-full bg-[#101726] border border-[#1a2333] text-white rounded px-1.5 py-1"
                >
                  <option value="MCU_1:pax_tx">MCU PA0 (TX)</option>
                  <option value="MCU_1:pax_rx">MCU PA1 (ADC)</option>
                  <option value="MCU_1:vcc_3v3">+3.3V Power Rail</option>
                  <option value="R_1:pin1">Resistor R1 Pin 1</option>
                  <option value="Q_1:collector">2N2222 Collector</option>
                  <option value="AMP_1:out">LM358 OUT Pin</option>
                </select>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">PROBE BLACK (-):</span>
                <select
                  value={dmmProbeBlack}
                  onChange={(e) => setDmmProbeBlack(e.target.value)}
                  className="w-full bg-[#101726] border border-[#1a2333] text-white rounded px-1.5 py-1"
                >
                  <option value="MCU_1:gnd_1">System GND (0V)</option>
                  <option value="MCU_1:vcc_3v3">+3.3V Rail</option>
                  <option value="Q_1:emitter">2N2222 Emitter</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. DIGITAL LOGIC ANALYZER */}
      {showLogicAnalyzer && (
        <div className="fixed bottom-12 right-6 z-50 w-96 bg-[#090e1a] border-2 border-indigo-500 rounded-lg shadow-2xl font-mono select-none overflow-hidden">
          <div className="bg-[#0f1728] px-3 py-1.5 border-b border-[#1a2333] flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Logic Analyzer (4-Channel 115.2 kbps)</span>
            </span>
            <button onClick={() => setShowLogicAnalyzer(false)} className="text-slate-400 hover:text-white p-0.5">✕</button>
          </div>

          <div className="p-3 bg-[#03060a] space-y-2 text-xs">
            {[
              { label: 'MCU_TX (PA0)', val: metrics.logicAnalyzer.map(l => l.pa0) },
              { label: 'OPTICAL_RX', val: metrics.logicAnalyzer.map(l => l.bitOut) },
              { label: 'ADC_SAMPLING_CLK', val: metrics.logicAnalyzer.map(l => l.adcReady) },
              { label: 'RECOVERED_BIT', val: metrics.logicAnalyzer.map(l => l.bitOut) }
            ].map((trace, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span className="text-cyan-300 font-bold">{trace.label}</span>
                  <span>{trace.val[trace.val.length - 1] ? 'HIGH (3.3V)' : 'LOW (0V)'}</span>
                </div>
                <div className="h-5 bg-[#080d18] border border-slate-800 rounded flex items-center px-1">
                  <svg className="w-full h-full">
                    <polyline
                      fill="none"
                      stroke={idx === 0 ? '#06b6d4' : idx === 1 ? '#38bdf8' : idx === 2 ? '#a855f7' : '#10b981'}
                      strokeWidth={1.5}
                      points={trace.val
                        .map((v, i) => `${(i / (trace.val.length - 1 || 1)) * 340},${v ? 4 : 14}`)
                        .join(' ')}
                    />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. ELECTRICAL RULE CHECKER (DRC) WINDOW */}
      {showDRCWindow && (
        <div className="fixed bottom-12 right-6 z-50 w-96 bg-[#090e1a] border-2 border-amber-600 rounded-lg shadow-2xl font-mono select-none overflow-hidden">
          <div className="bg-[#0f1728] px-3 py-1.5 border-b border-[#1a2333] flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center space-x-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Electrical Rule Checker (DRC)</span>
            </span>
            <button onClick={() => setShowDRCWindow(false)} className="text-slate-400 hover:text-white p-0.5">✕</button>
          </div>

          <div className="p-3 bg-[#03060a] space-y-2 max-h-60 overflow-y-auto text-xs">
            {validation.valid ? (
              <div className="p-2.5 bg-emerald-950/40 border border-emerald-800 rounded text-emerald-300 flex items-center space-x-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>All electrical rules passed! 0 short circuits, 0 floating inputs.</span>
              </div>
            ) : (
              validationErrors.map((err, idx) => (
                <div
                  key={idx}
                  onClick={() => setHighlightedErrorId(err.relatedComponentIds?.[0] || null)}
                  className="p-2 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800 rounded cursor-pointer transition-colors"
                >
                  <div className="font-bold text-rose-300 flex items-center space-x-1">
                    <span>⚠</span>
                    <span>{err.title}</span>
                  </div>
                  <div className="text-[10px] text-slate-300 mt-0.5">{err.description}</div>
                  <div className="text-[9px] text-cyan-400 mt-1">Click to highlight on breadboard →</div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODALS (TEACHER CARD, DATASHEET, PIN MAPPING)          */}
      {/* ======================================================== */}

      {/* A. TEACHER PRESENTATION EXPLANATION CARD (REQUIREMENT #19) */}
      {showTeacherCard && selectedComponent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
          <div className="bg-[#0b101c] border-2 border-amber-500 rounded-lg max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1a2333] pb-2">
              <span className="font-bold text-amber-300 text-sm uppercase tracking-wider flex items-center space-x-1.5">
                <GraduationCap className="w-4 h-4" />
                <span>Teacher Explanation • {selectedComponent.name}</span>
              </span>
              <button onClick={() => setShowTeacherCard(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-2.5 bg-[#070b14] border border-[#1a2333] rounded">
                <span className="font-bold text-cyan-400 block mb-1">1. WHAT IT IS:</span>
                <p className="text-slate-200">{selectedComponent.educationalInfo?.whatIsIt}</p>
              </div>

              <div className="p-2.5 bg-[#070b14] border border-[#1a2333] rounded">
                <span className="font-bold text-cyan-400 block mb-1">2. WHAT IT DOES:</span>
                <p className="text-slate-200">{selectedComponent.educationalInfo?.whatDoesItDo}</p>
              </div>

              <div className="p-2.5 bg-[#070b14] border border-[#1a2333] rounded">
                <span className="font-bold text-cyan-400 block mb-1">3. WHY IS IT USED:</span>
                <p className="text-slate-200">{selectedComponent.educationalInfo?.whyIsItUsed}</p>
              </div>

              <div className="p-2.5 bg-[#070b14] border border-[#1a2333] rounded">
                <span className="font-bold text-cyan-400 block mb-1">4. WHAT IS IT CONNECTED TO:</span>
                <p className="text-slate-200">{selectedComponent.educationalInfo?.whereIsItConnected}</p>
              </div>

              <div className="p-2.5 bg-[#070b14] border border-[#1a2333] rounded">
                <span className="font-bold text-cyan-400 block mb-1">5. WHAT SIGNAL PASSES THROUGH IT:</span>
                <p className="text-emerald-400">
                  {selectedComponent.typeId === 'resistor' ? 'Base switching current pulse (11.8 mA) from STM32 PA0 to 2N2222 Base.' :
                   selectedComponent.typeId === 'transistor_npn' ? 'High-current collector switching loop sinking 18 mA forward current through 850nm LED.' :
                   selectedComponent.typeId === 'led' ? '850nm Near-Infrared optical pulse carrier transmitting modulated bits through air.' :
                   selectedComponent.typeId === 'photodiode' ? 'Microampere reverse photocurrent proportional to received photon flux.' :
                   selectedComponent.typeId === 'signal_amplifier' ? 'Conditioned analog voltage signal (0–3.3V) feeding STM32 PA1 ADC input.' :
                   'Regulated system power and ground reference rails.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowTeacherCard(false)}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-black font-bold rounded text-xs"
              >
                Close & Return to Hardware
              </button>
            </div>
          </div>
        </div>
      )}

      {/* B. HARDWARE PIN MAPPING MATRIX (REQUIREMENT #6 & #7) */}
      {showPinMappingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
          <div className="bg-[#0b101c] border border-[#1a2333] rounded-lg max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-[#1a2333] pb-2">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Physical Hardware Pin Mapping Matrix</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Verified benchtop connections mapped from your physical SemLiFi hardware prototype.
                </p>
              </div>
              <button onClick={() => setShowPinMappingModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <table className="w-full text-xs text-left border border-[#1a2333]">
              <thead className="bg-[#0f1728] text-slate-400">
                <tr>
                  <th className="p-2 border-b border-[#1a2333]">Virtual Net</th>
                  <th className="p-2 border-b border-[#1a2333]">STM32 Hardware Pin</th>
                  <th className="p-2 border-b border-[#1a2333]">Physical Bench Target</th>
                  <th className="p-2 border-b border-[#1a2333]">Verification Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1a2333]">
                <tr>
                  <td className="p-2 font-bold text-cyan-300">NET_PWM_TX</td>
                  <td className="p-2 text-white">PA0 (Timer 2 CH1 PWM)</td>
                  <td className="p-2 text-slate-300">Resistor R1 (220 Ω) → 2N2222 Base</td>
                  <td className="p-2 text-emerald-400 font-bold">VERIFIED</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-300">NET_ADC_IN</td>
                  <td className="p-2 text-white">PA1 (ADC1 Channel 1)</td>
                  <td className="p-2 text-slate-300">LM358 TIA OUT Pin (Row 26)</td>
                  <td className="p-2 text-emerald-400 font-bold">VERIFIED</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-300">NET_3V3</td>
                  <td className="p-2 text-white">Header Pin 3.3V</td>
                  <td className="p-2 text-slate-300">Breadboard Power Bus (+3.3V)</td>
                  <td className="p-2 text-emerald-400 font-bold">VERIFIED</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold text-cyan-300">NET_GND</td>
                  <td className="p-2 text-white">Header Pin GND</td>
                  <td className="p-2 text-slate-300">Breadboard Ground Bus (0V)</td>
                  <td className="p-2 text-emerald-400 font-bold">VERIFIED</td>
                </tr>
              </tbody>
            </table>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowPinMappingModal(false)}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* C. GUIDED WALKTHROUGH OVERLAY (REQUIREMENT #18) */}
      {guidedStepIndex !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#090e1a] border-2 border-cyan-500 rounded-xl max-w-xl w-full p-4 shadow-2xl font-mono select-none">
          <div className="flex justify-between items-center border-b border-[#1a2333] pb-2">
            <span className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
              <Compass className="w-4 h-4" />
              <span>STEP {guidedStepIndex + 1} OF {GUIDED_EXPLANATION_STEPS.length}: {GUIDED_EXPLANATION_STEPS[guidedStepIndex].title}</span>
            </span>
            <button onClick={() => setGuidedStepIndex(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
          <div className="py-2.5 text-xs text-slate-200 leading-relaxed">
            <p className="font-semibold text-white">{GUIDED_EXPLANATION_STEPS[guidedStepIndex].summary}</p>
            <p className="mt-1 text-slate-400 text-[11px]">{GUIDED_EXPLANATION_STEPS[guidedStepIndex].whatToSayToTeacher}</p>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#1a2333]">
            <button
              onClick={() => setGuidedStepIndex(s => (s !== null && s > 0 ? s - 1 : s))}
              disabled={guidedStepIndex === 0}
              className="px-3 py-1 bg-[#101726] hover:bg-[#1a2333] disabled:opacity-30 rounded text-xs"
            >
              ← Previous
            </button>
            <button
              onClick={() => {
                if (guidedStepIndex < GUIDED_EXPLANATION_STEPS.length - 1) {
                  setGuidedStepIndex(s => (s !== null ? s + 1 : 0));
                } else {
                  setGuidedStepIndex(null);
                }
              }}
              className="px-4 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded text-xs"
            >
              {guidedStepIndex === GUIDED_EXPLANATION_STEPS.length - 1 ? 'Finish Walkthrough' : 'Next Step →'}
            </button>
          </div>
        </div>
      )}

      {/* D. TRACED PATH OVERLAY */}
      {tracedPath && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono select-none">
          <div className="bg-[#0b101c] border-2 border-cyan-500 rounded-lg max-w-lg w-full p-6 shadow-2xl space-y-3">
            <div className="flex justify-between items-center border-b border-[#1a2333] pb-2">
              <span className="font-bold text-white text-xs uppercase tracking-wider flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Physical Signal Transmission Trace</span>
              </span>
              <button onClick={() => setTracedPath(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {tracedPath.map((step, idx) => (
                <div key={idx} className="p-2 bg-[#080d17] rounded text-xs text-slate-200 border border-[#1a2333] flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                    {idx + 1}
                  </span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SemLiFiCircuitsEditor;

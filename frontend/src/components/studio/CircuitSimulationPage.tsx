import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Cpu,
  MousePointer,
  PenTool,
  Type,
  Activity,
  Camera,
  ZoomIn,
  ZoomOut,
  Info,
  CheckCircle2,
  Sparkles,
  Zap,
  Sliders,
  SlidersHorizontal,
  X,
  AlertTriangle,
  Layers,
  Trash2,
  Download,
  Upload,
  Save,
  ShieldCheck,
  Plus,
  Move,
  Maximize2,
  Minimize2,
  Expand,
  Hand,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Lock,
  Unlock,
  Grid
} from 'lucide-react';
import {
  getCircuitComponentMetadata,
  normalizeComponentId,
  CircuitComponentMetadata
} from '../../model/circuitMetadata';
import {
  CanvasComponent,
  CanvasWire,
  CanvasPin,
  CATALOGUE_TEMPLATES,
  CANONICAL_GRID_POSITIONS,
  createDefaultCircuit,
  validateCircuitConnectivity,
  calculateProbeTelemetry,
  CircuitValidationReport,
  checkComponentOverlap,
  resolveNonOverlappingPosition,
  validateWireConnection
} from '../../model/circuitCanvasModel';
import { api } from '../../services/api';
import { SharedExperimentResult } from '../../model/experimentModel';

interface CanvasTextLabel {
  id: string;
  text: string;
  x: number;
  y: number;
}

interface ProbeReading {
  compId: string;
  nodeName: string;
  voltage: string;
  current: string;
  signalType: string;
  status: 'CALCULATED' | 'PAUSED' | 'UNSUPPORTED';
  explanation?: string;
  frequency?: string;
  formula?: string;
}

interface CircuitSimulationPageProps {
  isSimulating: boolean;
  onToggleSimulation: () => void;
  onResetSimulation: () => void;
  selectedComponentId: string;
  onSelectComponent: (id: string) => void;
  isDarkMode: boolean;
  workingDistanceCm: number;
  onDistanceChange: (d: number) => void;
  ambientLux: number;
  onAmbientLuxChange: (lux: number) => void;
  activeExperiment?: SharedExperimentResult;
}

export const CircuitSimulationPage: React.FC<CircuitSimulationPageProps> = ({
  isSimulating,
  onToggleSimulation,
  onResetSimulation,
  selectedComponentId,
  onSelectComponent,
  isDarkMode,
  workingDistanceCm,
  onDistanceChange,
  ambientLux,
  onAmbientLuxChange,
  activeExperiment
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeCanvasTool, setActiveCanvasTool] = useState<'select' | 'pan' | 'wire' | 'text' | 'probe' | 'camera'>('select');

  // Canvas Pan State
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Quick Pan function for navigation buttons
  const handlePanBy = useCallback((dx: number, dy: number) => {
    setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }, []);

  // Interactive Circuit Editor State (Components and Wires)
  const defaultCircuit = useMemo(() => createDefaultCircuit(), []);
  const [canvasComponents, setCanvasComponents] = useState<CanvasComponent[]>(defaultCircuit.components);
  const [canvasWires, setCanvasWires] = useState<CanvasWire[]>(defaultCircuit.wires);

  // Wire Interaction State
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [wireDraftStart, setWireDraftStart] = useState<{
    compId: string;
    pinId: string;
    pinName: string;
    x: number;
    y: number;
  } | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Component Dragging State
  const [draggingComp, setDraggingComp] = useState<{
    compId: string;
    startMouseX: number;
    startMouseY: number;
    startCompX: number;
    startCompY: number;
  } | null>(null);

  // Transistor Model Selection: S8050 (Paper Primary) vs 2N2222 (Benchtop Alternate)
  const [activeTransistorModel, setActiveTransistorModel] = useState<'s8050' | '2n2222'>('s8050');

  // Part 7 & Phase 2 UI/UX: Panel Resizing, Collapsing & Canvas Usability State
  const [isCatalogueCollapsed, setIsCatalogueCollapsed] = useState<boolean>(false);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(false);
  const [isFullscreenCanvas, setIsFullscreenCanvas] = useState<boolean>(false);
  const [inspectorWidth, setInspectorWidth] = useState<number>(280); // 280, 320, 380 px
  const [gridSnap, setGridSnap] = useState<number>(20); // 20px, 10px, or 0 (Off)
  const [isLayoutLocked, setIsLayoutLocked] = useState<boolean>(true); // Locked by default: clicks inspect without moving!

  // Validation DRC Drawer State
  const [showValidationDrawer, setShowValidationDrawer] = useState<boolean>(false);

  // Persistent Text Annotation State (Clean Subsystem Banners above rows)
  const [canvasLabels, setCanvasLabels] = useState<CanvasTextLabel[]>([
    { id: 'lbl_tx_domain', text: '01 — Transmitter Subsystem: Stages 01 to 05 (ESP32 TX 1000 bps)', x: 25, y: 15 },
    { id: 'lbl_rx_domain', text: '02 — Receiver Subsystem: Stages 06 to 09 (Optical Channel + BPW34 + LM358 + ESP32 RX)', x: 25, y: 215 }
  ]);
  const [servoAngle, setServoAngle] = useState<number>(0);
  const [labelInputModal, setLabelInputModal] = useState<{ isOpen: boolean; x: number; y: number; text: string }>({
    isOpen: false,
    x: 0,
    y: 0,
    text: ''
  });

  // Multimeter Probe HUD State
  const [activeProbeReading, setActiveProbeReading] = useState<ProbeReading | null>(null);

  // User Notification Feedback Banner
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'warning' | 'info' | 'error') => {
    setFeedbackToast({ message, type });
    const timer = setTimeout(() => {
      setFeedbackToast(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, []);

  // Fit-to-Screen handler: dynamically centers and scales all components inside the canvas bounding box
  const handleFitToScreen = useCallback(() => {
    if (!diagramFrameRef.current || canvasComponents.length === 0) return;
    const rect = diagramFrameRef.current.getBoundingClientRect();
    const padding = 70;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    canvasComponents.forEach((c) => {
      minX = Math.min(minX, c.x);
      minY = Math.min(minY, c.y);
      maxX = Math.max(maxX, c.x + c.width);
      maxY = Math.max(maxY, c.y + c.height);
    });

    const circuitWidth = Math.max(100, maxX - minX);
    const circuitHeight = Math.max(100, maxY - minY);

    const availW = Math.max(300, rect.width - padding * 2);
    const availH = Math.max(200, rect.height - padding * 2);

    const scaleX = availW / circuitWidth;
    const scaleY = availH / circuitHeight;
    const targetScale = Math.max(0.45, Math.min(1.25, Math.min(scaleX, scaleY)));
    const targetZoom = Math.round(targetScale * 100);

    const scaledW = circuitWidth * targetScale;
    const scaledH = circuitHeight * targetScale;
    const offsetX = Math.round((rect.width - scaledW) / 2 - minX * targetScale);
    const offsetY = Math.round((rect.height - scaledH) / 2 - minY * targetScale);

    setZoomLevel(targetZoom);
    setPanOffset({ x: offsetX, y: offsetY });
    showToast(`Fit to Screen: Zoom set to ${targetZoom}%`, 'info');
  }, [canvasComponents, showToast]);

  // Auto-align all 9 components into strict horizontal and vertical grid
  const handleAlignGrid = useCallback(() => {
    setCanvasComponents((prev) =>
      prev.map((c) => {
        const pos = CANONICAL_GRID_POSITIONS[c.id];
        return pos ? { ...c, x: pos.x, y: pos.y } : c;
      })
    );
    setCanvasLabels([
      { id: 'lbl_tx_domain', text: '01 — Transmitter Subsystem: Stages 01 to 05 (ESP32 TX 1000 bps)', x: 25, y: 15 },
      { id: 'lbl_rx_domain', text: '02 — Receiver Subsystem: Stages 06 to 09 (Optical Channel + BPW34 + LM358 + ESP32 RX)', x: 25, y: 215 }
    ]);
    showToast('Grid Auto-Aligned: All 9 components locked in horizontal & vertical lanes', 'success');
  }, [showToast]);

  const hasAutoFittedRef = useRef(false);
  useEffect(() => {
    // Enforce strict canonical non-overlapping grid positions on mount
    setCanvasComponents((prev) =>
      prev.map((c) => {
        const pos = CANONICAL_GRID_POSITIONS[c.id];
        return pos ? { ...c, x: pos.x, y: pos.y } : c;
      })
    );

    if (!hasAutoFittedRef.current && diagramFrameRef.current) {
      hasAutoFittedRef.current = true;
      const timer = setTimeout(() => {
        handleFitToScreen();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [handleFitToScreen]);

  // Accordion open states for component catalogue
  const [openCategories, setOpenCategories] = useState<{ [key: string]: boolean }>({
    mcu: true,
    optical: true,
    analog: true,
    drivers: true,
    passives: true
  });

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Diagram reference for snapshot export and canvas bounding
  const diagramFrameRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------------------------------------------------------
  // PRIORITY 2: TYPED COMPONENT METADATA RESOLUTION
  // -------------------------------------------------------------------------
  const selectedComp: CircuitComponentMetadata = useMemo(() => {
    return getCircuitComponentMetadata(selectedComponentId, workingDistanceCm, ambientLux, isSimulating, servoAngle);
  }, [selectedComponentId, workingDistanceCm, ambientLux, isSimulating, servoAngle]);

  // Real-time Electrical Connectivity Validation Report
  const validationReport: CircuitValidationReport = useMemo(() => {
    return validateCircuitConnectivity(canvasComponents, canvasWires);
  }, [canvasComponents, canvasWires]);

  // -------------------------------------------------------------------------
  // BACKEND API SYNC FOR OPTICAL PARAMETERS
  // -------------------------------------------------------------------------
  const [provenanceSource, setProvenanceSource] = useState<'SIMULATED PHYSICS' | 'BACKEND SIMULATION' | 'MEASURED HARDWARE DATA'>('SIMULATED PHYSICS');

  useEffect(() => {
    let isMounted = true;
    const syncWithBackend = async () => {
      try {
        const res = await api.controlOptical({
          distance_cm: workingDistanceCm,
          servo_angle_deg: servoAngle,
          led_state: isSimulating,
          simulate_occlusion: servoAngle > 0,
          occlusion_duration_ms: servoAngle === 30 ? 30 : servoAngle === 60 ? 250 : servoAngle === 90 ? 500 : 0
        });
        if (isMounted && res) {
          setProvenanceSource('BACKEND SIMULATION');
        }
      } catch {
        if (isMounted) {
          setProvenanceSource('SIMULATED PHYSICS');
        }
      }
    };

    syncWithBackend();
    return () => {
      isMounted = false;
    };
  }, [workingDistanceCm, isSimulating, servoAngle]);

  // Part 7 Keyboard Accessibility for Canvas Actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedWireId) {
          handleDeleteSelectedWire();
        }
      } else if (e.key === 'Escape') {
        if (isFullscreenCanvas) {
          setIsFullscreenCanvas(false);
          showToast('Exited full-screen workspace', 'info');
        } else if (wireDraftStart) {
          setWireDraftStart(null);
          showToast('Wire routing canceled', 'info');
        } else if (selectedWireId) {
          setSelectedWireId(null);
        } else if (labelInputModal.isOpen) {
          setLabelInputModal({ isOpen: false, x: 0, y: 0, text: '' });
        } else if (activeProbeReading) {
          setActiveProbeReading(null);
        } else if (activeCanvasTool !== 'select') {
          setActiveCanvasTool('select');
          showToast('Returned to Select Tool', 'info');
        }
        setShowValidationDrawer(false);
      } else if (e.key === 'v' || e.key === 'V') {
        setActiveCanvasTool('select');
      } else if (e.key === 'h' || e.key === 'H') {
        setActiveCanvasTool('pan');
        showToast('Hand Tool: Click and drag anywhere to pan view', 'info');
      } else if (e.key === 'w' || e.key === 'W') {
        setActiveCanvasTool('wire');
      } else if (e.key === 'p' || e.key === 'P') {
        setActiveCanvasTool('probe');
      } else if (e.key === 'ArrowLeft') {
        handlePanBy(60, 0);
      } else if (e.key === 'ArrowRight') {
        handlePanBy(-60, 0);
      } else if (e.key === 'ArrowUp') {
        handlePanBy(0, 60);
      } else if (e.key === 'ArrowDown') {
        handlePanBy(0, -60);
      } else if (e.key === '0') {
        setZoomLevel(100);
        setPanOffset({ x: 0, y: 0 });
        showToast('Canvas zoom and pan restored to 100%', 'info');
      } else if (e.key === 'f' || e.key === 'F') {
        if (e.shiftKey) {
          setIsFullscreenCanvas((v) => !v);
        } else {
          handleFitToScreen();
        }
      } else if (e.key === 'c' || e.key === 'C') {
        setIsCatalogueCollapsed((v) => !v);
      } else if (e.key === 'i' || e.key === 'I') {
        setIsInspectorCollapsed((v) => !v);
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((prev) => Math.min(250, prev + 15));
      } else if (e.key === '-' || e.key === '_') {
        setZoomLevel((prev) => Math.max(40, prev - 15));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWireId, isFullscreenCanvas, wireDraftStart, labelInputModal, activeProbeReading, activeCanvasTool, showToast, handleFitToScreen, handlePanBy]);

  // -------------------------------------------------------------------------
  // TOOLBAR HANDLERS
  // -------------------------------------------------------------------------
  const handleSelectTool = (tool: 'select' | 'pan' | 'wire' | 'text' | 'probe' | 'camera') => {
    setActiveCanvasTool(tool);
    setWireDraftStart(null);
    setSelectedWireId(null);

    if (tool === 'select') {
      showToast('Select Tool: Drag components to reposition, drag background to pan view', 'info');
    } else if (tool === 'pan') {
      showToast('Hand / Pan Tool: Drag anywhere on canvas to glide view left & right', 'info');
    } else if (tool === 'wire') {
      showToast('Wire Tool: Click starting pin terminal, then click destination pin', 'info');
    } else if (tool === 'text') {
      showToast('Text Tool: Click anywhere on canvas to place a schematic annotation', 'info');
    } else if (tool === 'probe') {
      showToast('Multimeter Probe: Click any terminal or component to measure voltage and current', 'info');
    } else if (tool === 'camera') {
      handleTakeSnapshot();
    }
  };

  // Zoom Controls: Zoom In, Zoom Out, Reset to 100%
  const handleZoomIn = () => setZoomLevel((z) => Math.min(160, z + 10));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(50, z - 10));
  const handleResetZoom = () => {
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
    showToast('Canvas zoom and pan restored to 100%', 'info');
  };

  // -------------------------------------------------------------------------
  // COMPONENT MOVEMENT AND POSITIONING
  // -------------------------------------------------------------------------
  const handleComponentMouseDown = (compId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeCanvasTool === 'probe') {
      handleProbeComponent(compId);
      return;
    }
    if (activeCanvasTool === 'select') {
      onSelectComponent(compId);
      // Strictly prevent movement when layout is locked (default: locked in grid)
      if (!isLayoutLocked) {
        const comp = canvasComponents.find((c) => c.id === compId);
        if (comp) {
          setDraggingComp({
            compId,
            startMouseX: e.clientX,
            startMouseY: e.clientY,
            startCompX: comp.x,
            startCompY: comp.y
          });
        }
      }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const currentX = (e.clientX - rect.left - panOffset.x) / scale;
    const currentY = (e.clientY - rect.top - panOffset.y) / scale;
    setMousePos({ x: currentX, y: currentY });

    if (draggingComp) {
      const dx = (e.clientX - draggingComp.startMouseX) / scale;
      const dy = (e.clientY - draggingComp.startMouseY) / scale;
      const rawX = Math.round(draggingComp.startCompX + dx);
      const rawY = Math.round(draggingComp.startCompY + dy);
      // Configurable Grid snapping (20px, 10px, or 0 = Off)
      const snappedX = gridSnap > 0 ? Math.max(10, Math.round(rawX / gridSnap) * gridSnap) : Math.max(10, rawX);
      const snappedY = gridSnap > 0 ? Math.max(10, Math.round(rawY / gridSnap) * gridSnap) : Math.max(10, rawY);

      setCanvasComponents((prev) =>
        prev.map((c) => (c.id === draggingComp.compId ? { ...c, x: snappedX, y: snappedY } : c))
      );
    } else if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset({ x: dx, y: dy });
    }
  };

  const handleCanvasMouseUp = () => {
    if (draggingComp) {
      const comp = canvasComponents.find((c) => c.id === draggingComp.compId);
      if (comp) {
        const overlap = checkComponentOverlap(comp.id, comp.x, comp.y, comp.width, comp.height, canvasComponents, 8);
        if (overlap.hasOverlap) {
          const resolved = resolveNonOverlappingPosition(comp.id, comp.x, comp.y, comp.width, comp.height, canvasComponents);
          setCanvasComponents((prev) =>
            prev.map((c) => (c.id === comp.id ? { ...c, x: resolved.x, y: resolved.y } : c))
          );
          showToast(`Component overlap prevented: repositioned ${comp.shortName} with safe clearance`, 'warning');
        }
      }
      setDraggingComp(null);
    }
    if (isPanning) setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 0 || e.button === 1) {
      if (activeCanvasTool === 'text') {
        const rect = e.currentTarget.getBoundingClientRect();
        const scale = zoomLevel / 100;
        const x = Math.round((e.clientX - rect.left - panOffset.x) / scale);
        const y = Math.round((e.clientY - rect.top - panOffset.y) / scale);
        setLabelInputModal({ isOpen: true, x, y, text: '' });
      } else {
        // Left-click on canvas background immediately starts smooth panning in both select and pan modes!
        setIsPanning(true);
        setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
        setSelectedWireId(null);
      }
    }
  };

  // Two-finger trackpad or mouse wheel smooth panning & zoom (supports Shift+Wheel horizontal glide)
  const handleCanvasWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 10 : -10;
      setZoomLevel((prev) => Math.max(40, Math.min(220, prev + zoomDelta)));
    } else {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      const dy = e.shiftKey ? 0 : e.deltaY;
      setPanOffset((prev) => ({
        x: prev.x - dx,
        y: prev.y - dy
      }));
    }
  };

  // Window-level mouse tracking for unbreakable canvas panning
  useEffect(() => {
    if (!isPanning) return;
    const handleWindowMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPanOffset({ x: dx, y: dy });
    };
    const handleWindowMouseUp = () => {
      setIsPanning(false);
    };
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [isPanning, panStart]);

  // Window-level mouse tracking for component dragging across entire viewport
  useEffect(() => {
    if (!draggingComp) return;
    const scale = zoomLevel / 100;
    const handleWindowCompMouseMove = (e: MouseEvent) => {
      const dx = (e.clientX - draggingComp.startMouseX) / scale;
      const dy = (e.clientY - draggingComp.startMouseY) / scale;
      const rawX = Math.round(draggingComp.startCompX + dx);
      const rawY = Math.round(draggingComp.startCompY + dy);
      const snappedX = gridSnap > 0 ? Math.max(10, Math.round(rawX / gridSnap) * gridSnap) : Math.max(10, rawX);
      const snappedY = gridSnap > 0 ? Math.max(10, Math.round(rawY / gridSnap) * gridSnap) : Math.max(10, rawY);

      setCanvasComponents((prev) =>
        prev.map((c) => (c.id === draggingComp.compId ? { ...c, x: snappedX, y: snappedY } : c))
      );
    };
    const handleWindowCompMouseUp = () => {
      const comp = canvasComponents.find((c) => c.id === draggingComp.compId);
      if (comp) {
        const overlap = checkComponentOverlap(comp.id, comp.x, comp.y, comp.width, comp.height, canvasComponents, 8);
        if (overlap.hasOverlap) {
          const resolved = resolveNonOverlappingPosition(comp.id, comp.x, comp.y, comp.width, comp.height, canvasComponents);
          setCanvasComponents((prev) =>
            prev.map((c) => (c.id === comp.id ? { ...c, x: resolved.x, y: resolved.y } : c))
          );
        }
      }
      setDraggingComp(null);
    };
    window.addEventListener('mousemove', handleWindowCompMouseMove);
    window.addEventListener('mouseup', handleWindowCompMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleWindowCompMouseMove);
      window.removeEventListener('mouseup', handleWindowCompMouseUp);
    };
  }, [draggingComp, zoomLevel, gridSnap, canvasComponents]);



  // -------------------------------------------------------------------------
  // INTERACTIVE WIRING (START, COMPLETE, DELETE)
  // -------------------------------------------------------------------------
  const handlePinClick = (comp: CanvasComponent, pin: CanvasPin, e: React.MouseEvent) => {
    e.stopPropagation();

    if (activeCanvasTool === 'probe') {
      handleProbePin(comp, pin);
      return;
    }

    if (!wireDraftStart) {
      // Start wire
      const pinAbsX = comp.x + pin.relX;
      const pinAbsY = comp.y + pin.relY;
      setWireDraftStart({
        compId: comp.id,
        pinId: pin.id,
        pinName: `${comp.shortName}.${pin.name}`,
        x: pinAbsX,
        y: pinAbsY
      });
      showToast(`Selected ${comp.shortName} &bull; ${pin.name}. Click destination terminal to connect.`, 'info');
    } else {
      // Complete wire
      if (wireDraftStart.compId === comp.id && wireDraftStart.pinId === pin.id) {
        showToast('Invalid Connection: Cannot wire a terminal pin to itself.', 'warning');
        return;
      }
      if (wireDraftStart.compId === comp.id) {
        showToast('Invalid Connection: Internal component loop detected.', 'warning');
        return;
      }

      // Check for duplicate wire
      const alreadyConnected = canvasWires.some(
        (w) =>
          (w.fromCompId === wireDraftStart.compId &&
            w.fromPinId === wireDraftStart.pinId &&
            w.toCompId === comp.id &&
            w.toPinId === pin.id) ||
          (w.fromCompId === comp.id &&
            w.fromPinId === pin.id &&
            w.toCompId === wireDraftStart.compId &&
            w.toPinId === wireDraftStart.pinId)
      );

      if (alreadyConnected) {
        showToast('These terminals are already connected.', 'info');
        setWireDraftStart(null);
        return;
      }

      // Validate electrical / optical connection rules
      const fromComp = canvasComponents.find((c) => c.id === wireDraftStart.compId);
      const fromPin = fromComp?.pins.find((p) => p.id === wireDraftStart.pinId);
      let wireType: 'ELECTRICAL' | 'OPTICAL' | 'POWER' | 'GROUND' = 'ELECTRICAL';
      let wireColor = '#06b6d4';

      if (fromComp && fromPin) {
        const val = validateWireConnection(fromComp, fromPin, comp, pin);
        if (!val.isValid) {
          showToast(val.reason || 'Invalid wire connection', 'warning');
          setWireDraftStart(null);
          return;
        }
        wireType = val.connectionType;
        wireColor = val.wireColor;
      } else {
        wireColor = pin.type === 'OPTICAL'
          ? '#f43f5e'
          : pin.type === 'POWER'
          ? '#ef4444'
          : pin.type === 'GROUND'
          ? '#64748b'
          : pin.type === 'OUT' && pin.net.includes('PWM')
          ? '#3b82f6'
          : '#06b6d4';
      }

      const newWire: CanvasWire = {
        id: `wire_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        fromCompId: wireDraftStart.compId,
        fromPinId: wireDraftStart.pinId,
        toCompId: comp.id,
        toPinId: pin.id,
        color: wireColor,
        label: `${wireDraftStart.pinName} ➔ ${pin.name}`,
        wireType
      };

      setCanvasWires((prev) => [...prev, newWire]);
      setWireDraftStart(null);
      showToast(`Wire connected: ${wireDraftStart.pinName} &harr; ${comp.shortName}.${pin.name}`, 'success');
    }
  };

  const handleDeleteSelectedWire = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (selectedWireId) {
      setCanvasWires((prev) => prev.filter((w) => w.id !== selectedWireId));
      setSelectedWireId(null);
      showToast('Wire deleted successfully', 'info');
    }
  };

  // -------------------------------------------------------------------------
  // DRAG AND DROP FROM CATALOGUE ONTO CANVAS
  // -------------------------------------------------------------------------
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const typeId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('componentTypeId');
    if (!typeId) return;

    const template = CATALOGUE_TEMPLATES.find((t) => t.typeId === typeId);
    if (!template) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scale = zoomLevel / 100;
    const dropX = Math.round((e.clientX - rect.left - panOffset.x) / scale - template.width / 2);
    const dropY = Math.round((e.clientY - rect.top - panOffset.y) / scale - template.height / 2);

    const targetX = Math.max(10, Math.round(dropX / 10) * 10);
    const targetY = Math.max(10, Math.round(dropY / 10) * 10);
    const safePos = resolveNonOverlappingPosition(`comp_${typeId}`, targetX, targetY, template.width, template.height, canvasComponents);

    const newComponent: CanvasComponent = {
      ...template,
      id: `comp_${typeId}_${Date.now()}`,
      x: safePos.x,
      y: safePos.y,
      transistorModel: template.typeId === 'transistor_driver' ? activeTransistorModel : undefined
    };

    setCanvasComponents((prev) => [...prev, newComponent]);
    onSelectComponent(newComponent.id);
    showToast(`Added ${template.shortName} to canvas`, 'success');
  };

  const handleAddTemplateToCanvas = (typeId: string) => {
    const template = CATALOGUE_TEMPLATES.find((t) => t.typeId === typeId);
    if (!template) return;

    const initialX = 350 + Math.round((Math.random() * 80) / 10) * 10;
    const initialY = 120 + Math.round((Math.random() * 80) / 10) * 10;
    const safePos = resolveNonOverlappingPosition(`comp_${typeId}`, initialX, initialY, template.width, template.height, canvasComponents);

    const newComponent: CanvasComponent = {
      ...template,
      id: `comp_${typeId}_${Date.now()}`,
      x: safePos.x,
      y: safePos.y,
      transistorModel: template.typeId === 'transistor_driver' ? activeTransistorModel : undefined
    };

    setCanvasComponents((prev) => [...prev, newComponent]);
    onSelectComponent(newComponent.id);
    showToast(`Added ${template.shortName} to canvas`, 'success');
  };

  // -------------------------------------------------------------------------
  // TRANSISTOR MODEL SWITCHER (S8050 vs 2N2222)
  // -------------------------------------------------------------------------
  const handleSetTransistorModel = (model: 's8050' | '2n2222') => {
    setActiveTransistorModel(model);
    setCanvasComponents((prev) =>
      prev.map((c) =>
        c.typeId === 'transistor_driver'
          ? {
              ...c,
              transistorModel: model,
              name: model === 's8050' ? 'S8050 NPN Transistor (Paper Primary Driver)' : '2N2222 NPN Transistor (Benchtop Alternate)',
              shortName: model === 's8050' ? 'S8050 Driver' : '2N2222 Driver'
            }
          : c
      )
    );
    showToast(
      model === 's8050'
        ? 'Configured S8050 NPN BJT (Paper Primary Specification: Ic=120mA, hFE≈200)'
        : 'Configured 2N2222 NPN BJT (Benchtop Alternate: Ic=800mA, hFE=100-300)',
      'success'
    );
  };

  // -------------------------------------------------------------------------
  // MULTIMETER PROBING INTERFACE
  // -------------------------------------------------------------------------
  const handleProbeComponent = (compId: string) => {
    const comp = canvasComponents.find((c) => c.id === compId || c.typeId === compId);
    const meta = getCircuitComponentMetadata(compId, workingDistanceCm, ambientLux, isSimulating, servoAngle);

    if (!comp) {
      setActiveProbeReading({
        compId: meta.id,
        nodeName: meta.name,
        voltage: isSimulating ? meta.voltageReading : '0.00 V (Indeterminate)',
        current: isSimulating ? meta.currentReading : '0.0 µA (De-energized)',
        signalType: meta.signalType,
        status: isSimulating ? 'CALCULATED' : 'PAUSED',
        explanation: `Calculated at air gap d = ${workingDistanceCm} cm, ambient = ${ambientLux} Lux, servo flap = ${servoAngle}° (${servoAngle === 0 ? 'Clear LOS' : servoAngle === 30 ? 'P1 30 ms' : servoAngle === 60 ? 'P2 250 ms' : 'P3 500 ms'}).`
      });
      showToast(`Probed ${meta.shortName}: ${meta.voltageReading}`, 'success');
      return;
    }

    const telemetry = calculateProbeTelemetry(comp, null, workingDistanceCm, ambientLux, servoAngle, isSimulating);
    setActiveProbeReading({
      compId: comp.id,
      nodeName: telemetry.nodeName,
      voltage: telemetry.voltage,
      current: telemetry.current,
      signalType: telemetry.signalType,
      frequency: telemetry.frequency,
      formula: telemetry.formula,
      status: telemetry.status,
      explanation: `Calculated at air gap d = ${workingDistanceCm} cm, ambient = ${ambientLux} Lux, servo flap = ${servoAngle}° (${servoAngle === 0 ? 'Clear LOS' : servoAngle === 30 ? 'P1 30 ms' : servoAngle === 60 ? 'P2 250 ms' : 'P3 500 ms'}).`
    });
    showToast(`Probed ${comp.shortName}: ${telemetry.voltage}`, 'success');
  };

  const handleProbePin = (comp: CanvasComponent, pin: CanvasPin) => {
    const telemetry = calculateProbeTelemetry(comp, pin, workingDistanceCm, ambientLux, servoAngle, isSimulating);
    setActiveProbeReading({
      compId: comp.id,
      nodeName: telemetry.nodeName,
      voltage: telemetry.voltage,
      current: telemetry.current,
      signalType: telemetry.signalType,
      frequency: telemetry.frequency,
      formula: telemetry.formula,
      status: telemetry.status,
      explanation: `Terminal ${pin.label} &bull; Calculated at air gap d = ${workingDistanceCm} cm, ambient = ${ambientLux} Lux, servo flap = ${servoAngle}°.`
    });
    showToast(`Probed Terminal ${pin.name}: ${telemetry.voltage}`, 'success');
  };

  // Keep active probe reactive to physics sliders and simulation toggle
  useEffect(() => {
    if (activeProbeReading && isSimulating) {
      const comp = canvasComponents.find((c) => c.id === activeProbeReading.compId || c.typeId === activeProbeReading.compId);
      const meta = getCircuitComponentMetadata(activeProbeReading.compId, workingDistanceCm, ambientLux, isSimulating, servoAngle);
      setActiveProbeReading((prev) =>
        prev
          ? {
              ...prev,
              voltage: comp ? calculateProbeTelemetry(comp, null, workingDistanceCm, ambientLux, servoAngle, isSimulating).voltage : meta.voltageReading,
              current: comp ? calculateProbeTelemetry(comp, null, workingDistanceCm, ambientLux, servoAngle, isSimulating).current : meta.currentReading,
              signalType: meta.signalType,
              explanation: `Calculated at air gap d = ${workingDistanceCm} cm, ambient = ${ambientLux} Lux, servo flap = ${servoAngle}° (${servoAngle === 0 ? 'Clear LOS' : servoAngle === 30 ? 'P1 30 ms' : servoAngle === 60 ? 'P2 250 ms' : 'P3 500 ms'}).`
            }
          : null
      );
    }
  }, [servoAngle, workingDistanceCm, ambientLux, isSimulating, canvasComponents]);

  // -------------------------------------------------------------------------
  // LOCAL CIRCUIT SAVE, LOAD, EXPORT & IMPORT
  // -------------------------------------------------------------------------
  const handleSaveCircuitLocally = () => {
    try {
      const data = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        components: canvasComponents,
        wires: canvasWires,
        labels: canvasLabels,
        transistorModel: activeTransistorModel
      };
      localStorage.setItem('semlifi_canvas_circuit', JSON.stringify(data));
      showToast('Circuit layout and wires saved to local browser storage!', 'success');
    } catch {
      showToast('Failed to save circuit to local storage', 'error');
    }
  };

  const handleLoadCircuitLocally = () => {
    try {
      const saved = localStorage.getItem('semlifi_canvas_circuit');
      if (!saved) {
        showToast('No saved circuit found in local storage', 'warning');
        return;
      }
      const parsed = JSON.parse(saved);
      if (parsed.components && parsed.wires) {
        setCanvasComponents(parsed.components);
        setCanvasWires(parsed.wires);
        if (parsed.labels) setCanvasLabels(parsed.labels);
        if (parsed.transistorModel) setActiveTransistorModel(parsed.transistorModel);
        setSelectedWireId(null);
        showToast('Saved circuit loaded successfully!', 'success');
      }
    } catch {
      showToast('Error parsing saved circuit data', 'error');
    }
  };

  const handleExportCircuitJson = () => {
    const data = {
      project: 'SemLiFi Optical Transceiver Circuit',
      topology: validationReport.detectedTopology,
      timestamp: new Date().toISOString(),
      components: canvasComponents,
      wires: canvasWires,
      labels: canvasLabels,
      validation: validationReport
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `semlifi_circuit_${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Circuit netlist exported as JSON successfully!', 'success');
  };

  const handleImportCircuitJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (parsed.components && Array.isArray(parsed.components)) {
          setCanvasComponents(parsed.components);
          if (parsed.wires && Array.isArray(parsed.wires)) setCanvasWires(parsed.wires);
          if (parsed.labels && Array.isArray(parsed.labels)) setCanvasLabels(parsed.labels);
          showToast('Imported circuit topology loaded into editor!', 'success');
        } else {
          showToast('Invalid circuit file structure: Missing components array', 'error');
        }
      } catch {
        showToast('Failed to parse circuit JSON file', 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToDefaultTopology = () => {
    const initial = createDefaultCircuit();
    setCanvasComponents(initial.components);
    setCanvasWires(initial.wires);
    setSelectedWireId(null);
    setWireDraftStart(null);
    setActiveProbeReading(null);
    setZoomLevel(100);
    setPanOffset({ x: 0, y: 0 });
    onDistanceChange(15);
    onAmbientLuxChange(250);
    onResetSimulation();
    showToast('Reset to default verified SemLiFi 7-stage hardware topology', 'info');
  };

  // -------------------------------------------------------------------------
  // TEXT ANNOTATION & SNAPSHOT HANDLERS
  // -------------------------------------------------------------------------
  const handleConfirmAddLabel = () => {
    if (!labelInputModal.text.trim()) {
      setLabelInputModal({ isOpen: false, x: 0, y: 0, text: '' });
      return;
    }
    const newLbl: CanvasTextLabel = {
      id: `lbl_${Date.now()}`,
      text: labelInputModal.text.trim(),
      x: labelInputModal.x,
      y: labelInputModal.y
    };
    setCanvasLabels((prev) => [...prev, newLbl]);
    setLabelInputModal({ isOpen: false, x: 0, y: 0, text: '' });
    showToast(`Placed schematic label: "${newLbl.text}"`, 'success');
  };

  const handleDeleteLabel = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCanvasLabels((prev) => prev.filter((l) => l.id !== id));
    showToast('Schematic label removed', 'info');
  };

  const handleTakeSnapshot = () => {
    try {
      const svgWidth = 1400;
      const svgHeight = 600;

      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}">
          <foreignObject width="100%" height="100%">
            <div xmlns="http://www.w3.org/1999/xhtml" style="background:#080d1a; color:#f8fafc; font-family:sans-serif; padding:24px; border:2px solid #1e293b; border-radius:16px;">
              <h2 style="font-size:18px; font-weight:bold; color:#38bdf8; margin:0 0 8px 0;">SemLiFi Optical Transceiver Circuit Editor</h2>
              <p style="font-size:12px; color:#94a3b8; margin:0 0 16px 0;">Topology: ${validationReport.detectedTopology} | Rate: 1000 bps Manchester OOK | Air Gap: ${workingDistanceCm} cm | Noise: ${ambientLux} Lux</p>
              <div style="font-family:monospace; font-size:12px; border:1px solid #334155; padding:12px; border-radius:8px; background:#0c1426;">
                Components: ${canvasComponents.length} | Wires: ${canvasWires.length} | DRC Score: ${validationReport.score}% (${validationReport.isValid ? 'PASS' : 'FAIL'})
              </div>
            </div>
          </foreignObject>
        </svg>
      `;

      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `semlifi_circuit_${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Circuit schematic snapshot downloaded successfully!', 'success');
    } catch {
      showToast('Failed to export circuit snapshot', 'error');
    }
  };

  // -------------------------------------------------------------------------
  // WIRE COORDINATE RESOLUTION HELPER
  // -------------------------------------------------------------------------
  const getPinAbsoluteCoords = useCallback(
    (compId: string, pinId: string): { x: number; y: number } | null => {
      const comp = canvasComponents.find((c) => c.id === compId);
      if (!comp) return null;
      const pin = comp.pins.find((p) => p.id === pinId);
      if (!pin) return null;
      return { x: comp.x + pin.relX, y: comp.y + pin.relY };
    },
    [canvasComponents]
  );

  return (
    <div
      className={`flex-1 flex flex-col min-h-0 font-sans select-none transition-colors duration-200 overflow-hidden ${
        isDarkMode ? 'bg-[#070b14] text-slate-100' : 'bg-[#f8fafc] text-slate-900'
      }`}
    >
      {/* Hidden File Input for JSON Netlist Import */}
      <input
        type="file"
        ref={fileInputRef}
        accept=".json"
        onChange={handleImportCircuitJson}
        className="hidden"
      />

      {/* ========================================================= */}
      {/* 1. TOP HEADER & SIMULATION CONTROLS                       */}
      {/* ========================================================= */}
      <div
        className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDarkMode ? 'bg-[#0b101d] border-[#1a2844]' : 'bg-white border-slate-200/90 shadow-sm'
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1
                className={`text-base sm:text-lg font-bold tracking-tight ${
                  isDarkMode ? 'text-white' : 'text-slate-900'
                }`}
              >
                Circuit &amp; Simulation
              </h1>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  provenanceSource === 'MEASURED HARDWARE DATA'
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 font-bold'
                    : provenanceSource === 'BACKEND SIMULATION'
                    ? 'bg-blue-500/15 text-blue-400 border-blue-500/30 font-bold'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-bold'
                }`}
              >
                {provenanceSource}
              </span>

              {/* DRC Status Pill */}
              <button
                onClick={() => setShowValidationDrawer((v) => !v)}
                className={`flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border transition ${
                  validationReport.isValid
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/25'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/40 hover:bg-rose-500/25 animate-pulse'
                }`}
                title="Toggle Electrical DRC Validation Drawer"
              >
                {validationReport.isValid ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-rose-400" />
                )}
                <span>DRC: {validationReport.score}% ({validationReport.isValid ? 'PASS' : 'FAIL'})</span>
              </button>

              {activeExperiment && (
                <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-bold">
                  EXP: {activeExperiment.experiment_id} ({activeExperiment.cgfp_decision})
                </span>
              )}
            </div>
            <p
              className={`text-xs -mt-0.5 ${
                isDarkMode ? 'text-slate-400' : 'text-slate-500'
              }`}
            >
              Interactive dual-ESP32 LiFi optical transceiver schematic editor with dynamic wiring &amp; live multimeter probing
            </p>
          </div>
        </div>

        {/* Action Buttons: Run/Pause, Reset Default, Save, Export */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleSimulation}
            className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-full text-xs font-bold shadow-md transition-all active:scale-95 ${
              isSimulating
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/30'
                : 'bg-[#006067] hover:bg-[#004f55] text-white shadow-[#006067]/30'
            }`}
            title={isSimulating ? 'Pause Active Simulation' : 'Run Optical Simulation'}
          >
            {isSimulating ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{isSimulating ? 'PAUSE' : 'SIMULATE'}</span>
          </button>

          <button
            onClick={handleResetToDefaultTopology}
            className={`p-2 rounded-xl border transition ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
            }`}
            title="Reset Canvas to Default Verified Hardware Topology"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handleSaveCircuitLocally}
            className={`p-2 rounded-xl border transition ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-cyan-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-cyan-600'
            }`}
            title="Save Circuit to Local Browser Storage"
          >
            <Save className="w-4 h-4" />
          </button>

          <button
            onClick={handleExportCircuitJson}
            className={`p-2 rounded-xl border transition ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-emerald-600'
            }`}
            title="Export Circuit Netlist (JSON)"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className={`p-2 rounded-xl border transition ${
              isDarkMode
                ? 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-purple-400'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-purple-600'
            }`}
            title="Import Circuit Netlist (JSON)"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* User Notification Toast */}
      {feedbackToast && (
        <div
          className={`px-4 py-2 border-b flex items-center justify-between text-xs font-mono transition-all z-20 ${
            feedbackToast.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
              : feedbackToast.type === 'warning'
              ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
              : feedbackToast.type === 'error'
              ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
              : 'bg-blue-950/90 text-blue-300 border-blue-500/40'
          }`}
        >
          <div className="flex items-center space-x-2">
            {feedbackToast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
            {feedbackToast.type === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            {feedbackToast.type === 'error' && <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
            {feedbackToast.type === 'info' && <Info className="w-3.5 h-3.5 text-blue-400" />}
            <span>{feedbackToast.message}</span>
          </div>
          <button onClick={() => setFeedbackToast(null)} className="hover:opacity-75">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. THREE-COLUMN WORKSPACE LAYOUT                          */}
      {/* ========================================================= */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ======================================================= */}
        {/* COLUMN A: COMPONENT CATALOGUE (Left Panel)              */}
        {/* ======================================================= */}
        {isCatalogueCollapsed ? (
          <div
            className={`w-12 border-r flex flex-col items-center py-3 shrink-0 transition-all ${
              isDarkMode ? 'bg-[#090f1e] border-[#172642]' : 'bg-white border-slate-200'
            }`}
          >
            <button
              onClick={() => setIsCatalogueCollapsed(false)}
              className="p-2 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition mb-3"
              title="Expand Component Catalogue (Press C)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="flex-1 flex flex-col items-center space-y-4">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180">
                PARTS ({CATALOGUE_TEMPLATES.length})
              </span>
              <div className="w-6 h-px bg-slate-800" />
              <button
                onClick={() => setIsCatalogueCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 transition"
                title="Microcontrollers (ESP32)"
              >
                <Cpu className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCatalogueCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800/60 transition"
                title="Drivers &amp; Transistors (S8050/2N2222)"
              >
                <Zap className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCatalogueCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 transition"
                title="Optical Transceivers (LED / BPW34)"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsCatalogueCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 transition"
                title="Analog Conditioning (LM358)"
              >
                <Activity className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`w-64 sm:w-72 border-r flex flex-col shrink-0 overflow-y-auto transition-all ${
              isDarkMode ? 'bg-[#090f1e] border-[#172642]' : 'bg-white border-slate-200'
            }`}
          >
            {/* Catalogue Header */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-400" />
                  <span>Component Catalogue</span>
                </span>
                <div className="flex items-center space-x-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {CATALOGUE_TEMPLATES.length} Parts
                  </span>
                  <button
                    onClick={() => setIsCatalogueCollapsed(true)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    title="Collapse Catalogue (Press C)"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search components or pins..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    isDarkMode
                      ? 'bg-[#0c1426] border-slate-700/80 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-2 font-mono">
                Drag parts onto canvas or click &apos;+&apos; to add.
              </p>
            </div>

            {/* Catalogue Items List */}
            <div className="p-3 space-y-2 flex-1 overflow-y-auto">
              {CATALOGUE_TEMPLATES.filter(
                (t) =>
                  t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.shortName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  t.category.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((template) => (
                <div
                  key={template.typeId}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('componentTypeId', template.typeId);
                    e.dataTransfer.setData('text/plain', template.typeId);
                  }}
                  onClick={() => onSelectComponent(template.typeId)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-grab active:cursor-grabbing transition group ${
                    normalizeComponentId(selectedComponentId) === template.typeId ||
                    selectedComponentId === template.typeId
                      ? 'bg-blue-500/15 border-blue-500/60 shadow-md ring-1 ring-blue-500/30'
                      : isDarkMode
                      ? 'bg-[#0c1426] border-slate-800 hover:border-slate-700'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <img
                      src={template.imageUrl}
                      alt={template.name}
                      className="w-8 h-8 rounded-lg object-cover border border-slate-700 shrink-0 shadow-sm"
                    />
                    <div className="truncate">
                      <div className="text-xs font-bold text-slate-200 truncate">{template.shortName}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{template.category}</div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddTemplateToCanvas(template.typeId);
                    }}
                    className="p-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white transition"
                    title="Add component to canvas"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* COLUMN B: INTERACTIVE CIRCUIT CANVAS (Center Area)      */}
        {/* ======================================================= */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
          {/* Canvas Toolbar (Select, Wire, Probe, Text, Snapshot, Zoom, DRC Toggle) */}
          <div
            className={`px-4 py-2 border-b flex items-center justify-between z-10 ${
              isDarkMode ? 'bg-[#09101f] border-[#182744]' : 'bg-white/95 border-slate-200/90 shadow-sm'
            }`}
          >
            {/* Left Tool Buttons */}
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => handleSelectTool('select')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'select'
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Select Tool (V key): Drag to move components, click to inspect"
              >
                <MousePointer className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectTool('pan')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'pan'
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Hand / Pan Tool (H key): Drag anywhere on canvas to glide view left & right"
              >
                <Hand className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectTool('wire')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'wire'
                    ? 'bg-cyan-600 text-white font-bold shadow animate-pulse'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Wire Tool: Draw wires between terminal pins"
              >
                <PenTool className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectTool('probe')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'probe'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Multimeter Voltage Probe: Measure live telemetry"
              >
                <Activity className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectTool('text')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'text'
                    ? 'bg-purple-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Text Tool: Place custom schematic annotations"
              >
                <Type className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleSelectTool('camera')}
                className={`p-1.5 rounded-lg transition ${
                  activeCanvasTool === 'camera'
                    ? 'bg-amber-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title="Snapshot Tool: Export schematic as SVG/PNG"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Wire Action Chip */}
            {selectedWireId && (
              <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-mono">
                <span>Selected Wire</span>
                <button
                  onClick={handleDeleteSelectedWire}
                  className="flex items-center space-x-1 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
                  title="Delete Selected Wire (or press Backspace/Delete)"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            )}

            {/* Grid Snapping, Layout Lock & Coordinate Readout HUD */}
            <div className="hidden md:flex items-center space-x-2 text-[10px] font-mono text-slate-400">
              <span className="text-slate-500">Grid Snap:</span>
              {[20, 10, 0].map((s) => (
                <button
                  key={s}
                  onClick={() => setGridSnap(s)}
                  className={`px-1.5 py-0.5 rounded font-bold border transition ${
                    gridSnap === s
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                  title={s === 0 ? 'Freeform placement (No snap)' : `Snap to ${s}px grid`}
                >
                  {s === 0 ? 'Off' : `${s}px`}
                </button>
              ))}

              {/* Layout Lock Toggle */}
              <button
                onClick={() => {
                  setIsLayoutLocked((prev) => {
                    const next = !prev;
                    showToast(next ? 'Layout Locked: Component positions fixed' : 'Layout Unlocked: Components can be dragged', 'info');
                    return next;
                  });
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition flex items-center space-x-1 border ${
                  isLayoutLocked
                    ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-sm'
                    : 'bg-amber-950/70 border-amber-500/60 text-amber-300'
                }`}
                title={isLayoutLocked ? 'Layout Locked: Components cannot move (Click to unlock)' : 'Layout Unlocked: Components draggable (Click to lock)'}
              >
                {isLayoutLocked ? <Lock className="w-3 h-3 text-emerald-400" /> : <Unlock className="w-3 h-3 text-amber-400" />}
                <span>{isLayoutLocked ? 'Locked' : 'Unlocked'}</span>
              </button>

              {/* Auto-Align Grid Button */}
              <button
                onClick={handleAlignGrid}
                className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-[10px] font-mono font-bold transition flex items-center space-x-1"
                title="Snap all 9 components into strict canonical horizontal & vertical rows"
              >
                <Grid className="w-3 h-3 text-cyan-400" />
                <span>Align Grid</span>
              </button>

              <div className="flex items-center space-x-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 text-[10px]">
                <span>X: {Math.round(mousePos.x)}</span>
                <span className="text-slate-600">|</span>
                <span>Y: {Math.round(mousePos.y)}</span>
              </div>
            </div>

            {/* Right Zoom Controls with Fit-to-Screen, Reset View (100%), Fullscreen and Panel Toggles */}
            <div className="flex items-center space-x-1.5 text-xs text-slate-500 font-mono">
              <button
                onClick={handleZoomOut}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Zoom Out (-15% or - key)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="font-bold w-11 text-center text-slate-700 dark:text-slate-300">
                {zoomLevel}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-slate-600 dark:hover:text-white"
                title="Zoom In (+15% or + key)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              {/* Quick Left / Right Canvas Gliding Controls */}
              <div className="flex items-center space-x-0.5 border-l border-slate-700/60 pl-1.5">
                <button
                  onClick={() => handlePanBy(120, 0)}
                  className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-cyan-400 transition"
                  title="Move Canvas Left (ArrowLeft)"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handlePanBy(-120, 0)}
                  className="p-1 rounded bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-cyan-400 transition"
                  title="Move Canvas Right (ArrowRight)"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fit to Screen Button */}
              <button
                onClick={handleFitToScreen}
                className="px-2 py-1 rounded bg-blue-600/20 hover:bg-blue-600 border border-blue-500/40 text-blue-300 hover:text-white text-[11px] font-bold transition flex items-center space-x-1"
                title="Fit entire circuit to viewport (F key)"
              >
                <Expand className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Fit Screen</span>
              </button>

              {/* Reset View Button */}
              <button
                onClick={handleResetZoom}
                className="px-2 py-1 rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-[11px] transition"
                title="Reset View to 100% and Center (0 key)"
              >
                Reset (100%)
              </button>

              {/* Fullscreen Workspace Toggle */}
              <button
                onClick={() => setIsFullscreenCanvas((v) => !v)}
                className={`px-2 py-1 rounded border text-[11px] font-bold transition flex items-center space-x-1 ${
                  isFullscreenCanvas
                    ? 'bg-purple-950 text-purple-300 border-purple-500 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isFullscreenCanvas ? 'Exit Fullscreen Workspace (Esc / Shift+F)' : 'Full-Screen Circuit Workspace (Shift+F)'}
              >
                {isFullscreenCanvas ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                <span className="hidden sm:inline">{isFullscreenCanvas ? 'Exit' : 'Fullscreen'}</span>
              </button>

              {/* Catalogue Toggle if Collapsed */}
              {isCatalogueCollapsed && (
                <button
                  onClick={() => setIsCatalogueCollapsed(false)}
                  className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-bold transition flex items-center space-x-1"
                  title="Open Component Catalogue (C key)"
                >
                  <Layers className="w-3 h-3 text-blue-400" />
                  <span className="hidden sm:inline">Catalogue</span>
                </button>
              )}

              {/* Inspector Toggle */}
              <button
                onClick={() => setIsInspectorCollapsed((v) => !v)}
                className={`px-2 py-1 rounded border text-[11px] font-bold transition flex items-center space-x-1 ${
                  isInspectorCollapsed
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isInspectorCollapsed ? 'Show Inspector Panel (I key)' : 'Collapse Inspector Panel (100% Canvas)'}
              >
                <Sliders className="w-3 h-3" />
                <span className="hidden sm:inline">{isInspectorCollapsed ? 'Show Panel' : 'Hide Panel'}</span>
              </button>
            </div>
          </div>

          {/* Connectivity DRC Validation Drawer (Expandable) */}
          {showValidationDrawer && (
            <div className="px-5 py-3 border-b bg-slate-900/95 border-slate-800 text-xs font-mono space-y-2 z-20 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white uppercase">Circuit DRC &amp; Electrical Rules Check</span>
                  <span className="text-slate-400">({validationReport.detectedTopology})</span>
                </div>
                <button onClick={() => setShowValidationDrawer(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                {validationReport.rules.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-2 rounded-lg border flex items-start space-x-2 ${
                      rule.status === 'PASS'
                        ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
                        : rule.status === 'WARN'
                        ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                        : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    <span className="mt-0.5">
                      {rule.status === 'PASS' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </span>
                    <div>
                      <div className="font-bold">{rule.name}</div>
                      <div className="text-[10px] text-slate-400">{rule.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Graphical Schematic Canvas Viewport */}
          <div
            ref={diagramFrameRef}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onWheel={handleCanvasWheel}
            className={`flex-1 relative overflow-hidden select-none ${
              isPanning
                ? 'cursor-grabbing'
                : activeCanvasTool === 'pan' || activeCanvasTool === 'select'
                ? 'cursor-grab'
                : 'cursor-default'
            } ${isDarkMode ? 'bg-[#070b14]' : 'bg-[#f1f5f9]'}`}
          >
            {/* Engineering Dot Matrix Grid Pattern Background */}
            <div
              className="absolute inset-0 pointer-events-none opacity-20"
              style={{
                backgroundImage: isDarkMode
                  ? 'radial-gradient(#38bdf8 1px, transparent 1px)'
                  : 'radial-gradient(#64748b 1px, transparent 1px)',
                backgroundSize: '24px 24px'
              }}
            />

            {/* Canvas Transformation Container (Pan + Zoom) */}
            <div
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel / 100})`,
                transformOrigin: '0 0',
                position: 'absolute',
                width: '1800px',
                height: '900px'
              }}
            >
              {/* SVG Wiring Layer */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                style={{ width: '1800px', height: '900px' }}
              >
                <defs>
                  {/* Glowing Filter for Selected Wire */}
                  <filter id="wire-glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#f59e0b" />
                  </filter>

                  {/* Directional Arrowhead Markers */}
                  <marker id="wire-arrow-cyan" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#06b6d4" />
                  </marker>
                  <marker id="wire-arrow-blue" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#3b82f6" />
                  </marker>
                  <marker id="wire-arrow-orange" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f97316" />
                  </marker>
                  <marker id="wire-arrow-optical" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#f43f5e" />
                  </marker>
                  <marker id="wire-arrow-power" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#ef4444" />
                  </marker>
                  <marker id="wire-arrow-ground" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#64748b" />
                  </marker>
                  <marker id="wire-arrow-emerald" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#10b981" />
                  </marker>
                  <marker id="wire-arrow-selected" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                    <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#fbbf24" />
                  </marker>
                </defs>

                {/* Render All Connected Wires with Directional Flow */}
                {canvasWires.map((wire) => {
                  const pt1 = getPinAbsoluteCoords(wire.fromCompId, wire.fromPinId);
                  const pt2 = getPinAbsoluteCoords(wire.toCompId, wire.toPinId);
                  if (!pt1 || !pt2) return null;

                  const isSelected = selectedWireId === wire.id;
                  const dx = Math.abs(pt2.x - pt1.x) * 0.5;
                  const d = `M ${pt1.x} ${pt1.y} C ${pt1.x + dx} ${pt1.y}, ${pt2.x - dx} ${pt2.y}, ${pt2.x} ${pt2.y}`;

                  const isOptical = wire.color === '#f43f5e' || wire.wireType === 'OPTICAL';
                  const markerId = isSelected
                    ? 'wire-arrow-selected'
                    : isOptical
                    ? 'wire-arrow-optical'
                    : wire.color === '#3b82f6'
                    ? 'wire-arrow-blue'
                    : wire.color === '#f97316'
                    ? 'wire-arrow-orange'
                    : wire.color === '#10b981'
                    ? 'wire-arrow-emerald'
                    : wire.color === '#ef4444'
                    ? 'wire-arrow-power'
                    : wire.color === '#64748b'
                    ? 'wire-arrow-ground'
                    : 'wire-arrow-cyan';

                  return (
                    <g key={wire.id} className="cursor-pointer pointer-events-auto" onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireId(wire.id);
                      showToast(`Selected wire: ${wire.label || 'Connection'}`, 'info');
                    }}>
                      {/* Invisible wider hit area for easy clicking */}
                      <path d={d} fill="none" stroke="transparent" strokeWidth="16" />

                      {/* Main Rendered Wire */}
                      <path
                        d={d}
                        fill="none"
                        stroke={isSelected ? '#fbbf24' : wire.color}
                        strokeWidth={isSelected ? '4' : '2.5'}
                        strokeDasharray={isOptical || isSimulating ? '6 3' : undefined}
                        className={isSimulating ? 'animate-pulse' : undefined}
                        filter={isSelected ? 'url(#wire-glow)' : undefined}
                        markerEnd={`url(#${markerId})`}
                      />

                      {/* Directional Flow Chevron at Midpoint */}
                      <g transform={`translate(${(pt1.x + pt2.x) / 2}, ${(pt1.y + pt2.y) / 2})`}>
                        <circle r="7" fill={isDarkMode ? '#0a101f' : '#ffffff'} stroke={isSelected ? '#fbbf24' : wire.color} strokeWidth="1.5" />
                        <path d="M -2.5 -3 L 2 0 L -2.5 3" fill="none" stroke={isSelected ? '#fbbf24' : wire.color} strokeWidth="1.5" strokeLinecap="round" />
                      </g>

                      {/* Terminating Connection Nodes */}
                      <circle cx={pt1.x} cy={pt1.y} r="3.5" fill={wire.color} />
                      <circle cx={pt2.x} cy={pt2.y} r="3.5" fill={wire.color} />
                    </g>
                  );
                })}

                {/* Dynamic Dragging Wire Draft */}
                {wireDraftStart && (
                  <path
                    d={`M ${wireDraftStart.x} ${wireDraftStart.y} C ${wireDraftStart.x + Math.abs(mousePos.x - wireDraftStart.x) * 0.5} ${wireDraftStart.y}, ${mousePos.x - Math.abs(mousePos.x - wireDraftStart.x) * 0.5} ${mousePos.y}, ${mousePos.x} ${mousePos.y}`}
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="4 4"
                    className="pointer-events-none"
                  />
                )}
              </svg>

              {/* Text Labels Layer */}
              {canvasLabels.map((lbl) => (
                <div
                  key={lbl.id}
                  style={{ left: `${lbl.x}px`, top: `${lbl.y}px` }}
                  className="absolute z-20 flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-purple-950/90 border border-purple-500/50 text-[10px] font-mono text-purple-200 shadow-md backdrop-blur-sm pointer-events-auto"
                >
                  <span>{lbl.text}</span>
                  <button
                    onClick={(e) => handleDeleteLabel(lbl.id, e)}
                    className="hover:text-rose-400 text-slate-400"
                    title="Delete Label"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}

              {/* Components Layer (Draggable Cards on Canvas) */}
              {canvasComponents.map((comp) => {
                const isSelected = selectedComponentId === comp.id || normalizeComponentId(selectedComponentId) === comp.typeId;
                const isOpticalChannel = comp.typeId === 'optical_channel';

                return (
                  <div
                    key={comp.id}
                    style={{
                      left: `${comp.x}px`,
                      top: `${comp.y}px`,
                      width: `${comp.width}px`
                    }}
                    onMouseDown={(e) => handleComponentMouseDown(comp.id, e)}
                    className={`absolute rounded-xl border p-2 flex flex-col justify-between transition-shadow select-none z-10 ${
                      isSelected
                        ? 'border-blue-500 ring-2 ring-blue-500/50 shadow-xl'
                        : isDarkMode
                        ? 'bg-[#0d162a] border-slate-700/80 hover:border-slate-500 shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-400 shadow-md'
                    }`}
                  >
                    {/* Component Header with Move Handle & Ordered STAGE Badge */}
                    {(() => {
                      const stageBadge =
                        comp.id === 'comp_esp32_tx' ? 'STAGE 01' :
                        comp.id === 'comp_r_base' ? 'STAGE 02' :
                        comp.id === 'comp_driver_bjt' ? 'STAGE 03' :
                        comp.id === 'comp_r_led' ? 'STAGE 04' :
                        comp.id === 'comp_led_tx' ? 'STAGE 05' :
                        comp.id === 'comp_optical_channel' ? 'STAGE 06' :
                        comp.id === 'comp_bpw34' ? 'STAGE 07' :
                        comp.id === 'comp_lm358' ? 'STAGE 08' :
                        comp.id === 'comp_esp32_rx' ? 'STAGE 09' : '';

                      return (
                        <div
                          title={isLayoutLocked ? 'Click to inspect component (Layout Locked)' : 'Drag to reposition component'}
                          className={`flex items-center justify-between pb-1.5 border-b ${isLayoutLocked ? 'cursor-pointer' : 'cursor-move'} ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}
                        >
                          <div className="flex items-center space-x-1 min-w-0">
                            {stageBadge && (
                              <span className="text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded bg-[#006067]/15 dark:bg-cyan-500/20 text-[#006067] dark:text-cyan-300 border border-[#006067]/30 dark:border-cyan-500/40 shrink-0">
                                {stageBadge}
                              </span>
                            )}
                            <span className={`text-[10px] font-bold truncate ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                              {comp.shortName}
                            </span>
                          </div>
                          <span
                            className="text-[8px] font-mono font-bold px-1 py-0.2 rounded border shrink-0"
                            style={{
                              color: comp.accentColor,
                              borderColor: `${comp.accentColor}50`,
                              backgroundColor: `${comp.accentColor}15`
                            }}
                          >
                            {comp.typeId.includes('stm32') ? 'ESP32' : comp.category.split(' ')[0]}
                          </span>
                        </div>
                      );
                    })()}

                    {/* Component Image / Optical Beam Representation */}
                    <div className="w-full h-16 rounded-lg overflow-hidden relative my-1.5 bg-black/50 border border-slate-700/60 flex items-center justify-center">
                      <img
                        src={comp.imageUrl}
                        alt={comp.name}
                        className="w-full h-full object-cover opacity-80"
                      />

                      {/* Special Optical Beam & SG90 Servo Flap Animation for Optical Channel */}
                      {isOpticalChannel && (
                        <div className="absolute inset-0">
                          {isSimulating && (
                            <svg className="w-full h-full pointer-events-none" viewBox="0 0 100 64">
                              {/* Modulated Optical Beam */}
                              <line
                                x1="0"
                                y1="34"
                                x2={servoAngle >= 60 ? "46" : "100"}
                                y2="34"
                                stroke={servoAngle === 0 ? "#ef4444" : servoAngle === 30 ? "#f59e0b" : "#f43f5e"}
                                strokeWidth={servoAngle === 0 ? "3" : "2"}
                                strokeDasharray={servoAngle === 30 ? "4 2" : undefined}
                                className="animate-pulse"
                              />
                              {servoAngle < 60 && servoAngle > 0 && (
                                <line
                                  x1="54"
                                  y1="34"
                                  x2="100"
                                  y2="34"
                                  stroke="#f59e0b"
                                  strokeWidth="1.5"
                                  strokeDasharray="2 2"
                                  opacity="0.6"
                                />
                              )}
                              {/* SG90 Servo Mechanical Flap Arm */}
                              <g transform={`rotate(${servoAngle - 90}, 50, 10)`} className="transition-transform duration-300">
                                <rect x="48" y="10" width="4" height="26" rx="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
                                <circle cx="50" cy="10" r="3.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
                                <circle cx="50" cy="10" r="1.5" fill="#38bdf8" />
                              </g>
                            </svg>
                          )}
                          <span className={`absolute top-1 right-1 px-1 py-0.5 rounded text-[7px] font-mono font-bold border ${
                            servoAngle === 0
                              ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500/40'
                              : servoAngle === 30
                              ? 'bg-blue-900/90 text-blue-200 border-blue-500/40'
                              : servoAngle === 60
                              ? 'bg-amber-900/90 text-amber-200 border-amber-500/40'
                              : 'bg-rose-900/90 text-rose-200 border-rose-500/40'
                          }`}>
                            {servoAngle === 0 ? 'LOS' : servoAngle === 30 ? 'P1' : servoAngle === 60 ? 'P2' : 'P3'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Component Pins Exposed as Interactive Terminals */}
                    <div className={`space-y-1 pt-1 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                      {comp.pins.map((pin) => (
                        <div
                          key={pin.id}
                          onClick={(e) => handlePinClick(comp, pin, e)}
                          className={`flex items-center justify-between px-1.5 py-0.5 rounded text-[9px] font-mono border cursor-pointer transition ${
                            wireDraftStart?.compId === comp.id && wireDraftStart?.pinId === pin.id
                              ? 'bg-cyan-500 text-black border-cyan-300 font-bold animate-pulse'
                              : isDarkMode
                              ? 'bg-slate-900/80 hover:bg-slate-800 border-slate-700/60 text-slate-300'
                              : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                          }`}
                          title={`Terminal ${pin.name} (${pin.type}): ${pin.label}`}
                        >
                          <span className="font-semibold">{pin.name}</span>
                          <span className={`text-[7px] uppercase ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{pin.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Multimeter Probe HUD Floating Panel */}
            {activeProbeReading && (
              <div className="absolute bottom-6 right-6 z-30 w-80 rounded-2xl bg-slate-900/95 border border-emerald-500/60 shadow-2xl p-4 backdrop-blur-md text-white font-mono text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                    <Activity className="w-4 h-4" />
                    <span>DIGITAL MULTIMETER PROBE</span>
                  </div>
                  <button onClick={() => setActiveProbeReading(null)} className="p-1 hover:text-rose-400 text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="py-2.5 space-y-1.5">
                  <div className="text-[10px] text-slate-400">PROBED NODE</div>
                  <div className="font-bold text-white text-sm">{activeProbeReading.nodeName}</div>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-slate-400">VOLTAGE / LEVEL:</span>
                    <span className="font-bold text-emerald-300">{activeProbeReading.voltage}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">CURRENT / FLOW:</span>
                    <span className="font-bold text-cyan-300">{activeProbeReading.current}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">SIGNAL TYPE:</span>
                    <span className="text-[10px] text-slate-200">{activeProbeReading.signalType}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">SERVO OCCLUSION:</span>
                    <span className={`font-bold ${
                      servoAngle === 0 ? 'text-emerald-400' : servoAngle === 30 ? 'text-blue-400' : servoAngle === 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {servoAngle}&deg; ({servoAngle === 0 ? 'Clear LOS' : servoAngle === 30 ? 'P1 30 ms' : servoAngle === 60 ? 'P2 250 ms' : 'P3 500 ms'})
                    </span>
                  </div>

                  {activeProbeReading.formula && (
                    <div className="pt-1 text-[9px] text-amber-300 font-mono">
                      Formula: {activeProbeReading.formula}
                    </div>
                  )}
                </div>

                <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] leading-relaxed text-slate-400">
                  {activeProbeReading.explanation}
                </div>
              </div>
            )}

            {/* Inline Label Modal for Canvas Text Tool */}
            {labelInputModal.isOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="w-80 rounded-2xl bg-slate-900 border border-purple-500/60 shadow-2xl p-4 text-white space-y-3">
                  <div className="flex items-center space-x-2 text-purple-400 font-bold text-xs">
                    <Type className="w-4 h-4" />
                    <span>Add Schematic Text Label</span>
                  </div>
                  <input
                    type="text"
                    autoFocus
                    value={labelInputModal.text}
                    onChange={(e) => setLabelInputModal((prev) => ({ ...prev, text: e.target.value }))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirmAddLabel();
                    }}
                    placeholder="Enter annotation label..."
                    className="w-full px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <div className="flex items-center justify-end space-x-2 text-xs">
                    <button
                      onClick={() => setLabelInputModal({ isOpen: false, x: 0, y: 0, text: '' })}
                      className="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleConfirmAddLabel}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                    >
                      Place Label
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Floating Re-Open Inspector Button when Collapsed */}
            {isInspectorCollapsed && (
              <button
                onClick={() => setIsInspectorCollapsed(false)}
                className="absolute top-4 right-4 z-30 flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#091224]/95 hover:bg-[#131f38] border border-cyan-500/50 text-cyan-300 text-xs font-mono font-bold shadow-xl transition active:scale-95"
                title="Expand Component Inspector"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Inspector ({inspectorWidth}px)</span>
              </button>
            )}

            {/* Floating Canvas Navigation & Gliding HUD (Cynbit / Figma style) */}
            <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end space-y-2 select-none pointer-events-auto">
              {/* Directional D-Pad Navigation Pill */}
              <div className="p-2 rounded-2xl bg-[#091122]/95 border border-cyan-500/30 shadow-2xl backdrop-blur-md flex flex-col items-center space-y-1">
                <button
                  onClick={() => handlePanBy(0, 80)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition active:scale-95"
                  title="Pan Canvas Up (ArrowUp)"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handlePanBy(120, 0)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition active:scale-95"
                    title="Glide Canvas Left (ArrowLeft)"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={handleFitToScreen}
                    className="px-2 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-600 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-bold transition active:scale-95"
                    title="Fit All Components to Viewport (F key)"
                  >
                    Fit
                  </button>
                  <button
                    onClick={() => handlePanBy(-120, 0)}
                    className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition active:scale-95"
                    title="Glide Canvas Right (ArrowRight)"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <button
                  onClick={() => handlePanBy(0, -80)}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-cyan-600 text-slate-300 hover:text-white transition active:scale-95"
                  title="Pan Canvas Down (ArrowDown)"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom & 1:1 Reset Controls Pill */}
              <div className="px-2.5 py-1.5 rounded-xl bg-[#091122]/95 border border-slate-700/80 shadow-xl backdrop-blur-md flex items-center space-x-1.5 text-xs font-mono text-slate-300">
                <button
                  onClick={handleZoomOut}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white active:scale-95"
                  title="Zoom Out (- key)"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-10 text-center font-bold text-cyan-400 text-[11px]">{zoomLevel}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white active:scale-95"
                  title="Zoom In (+ key)"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-3.5 bg-slate-700 mx-0.5" />
                <button
                  onClick={handleResetZoom}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                  title="Reset View to 100% (0 key)"
                >
                  1:1
                </button>
              </div>
            </div>

            {/* Bottom-Center Gliding Scrubber Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#091122]/90 border border-slate-700/80 shadow-2xl backdrop-blur-md text-[11px] font-mono text-slate-400 select-none pointer-events-auto">
              <button
                onClick={() => handlePanBy(150, 0)}
                className="p-1 rounded-full hover:bg-cyan-600/30 text-cyan-400 hover:text-white transition"
                title="Glide Left (Move Viewport Left)"
              >
                <ArrowLeft className="w-3 h-3" />
              </button>
              <span className="text-[10px] text-slate-400 px-1 font-semibold hidden sm:inline">Glide View</span>
              <input
                type="range"
                min="-500"
                max="500"
                value={panOffset.x}
                onChange={(e) => setPanOffset((prev) => ({ ...prev, x: Number(e.target.value) }))}
                className="w-24 sm:w-36 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                title="Drag to glide left or right across canvas"
              />
              <button
                onClick={() => handlePanBy(-150, 0)}
                className="p-1 rounded-full hover:bg-cyan-600/30 text-cyan-400 hover:text-white transition"
                title="Glide Right (Move Viewport Right)"
              >
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Empty Canvas State */}
            {canvasComponents.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
                <div className="p-6 rounded-2xl bg-[#0b1222]/95 border border-cyan-500/40 backdrop-blur-md max-w-md pointer-events-auto shadow-2xl space-y-3 font-mono">
                  <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/40 mx-auto flex items-center justify-center text-cyan-400">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Schematic Canvas Empty</h3>
                    <p className="text-xs text-slate-400 mt-1 font-sans">
                      No components currently on canvas. Drag items from the catalogue on the left or restore the default ESP32-to-ESP32 LiFi topology.
                    </p>
                  </div>
                  <button
                    onClick={handleResetToDefaultTopology}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-mono font-bold shadow-md transition active:scale-95"
                  >
                    Restore Default Circuit Topology
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Canvas Bottom: Communication Pipeline Bar (Verified Hardware Flow) */}
          <div
            className={`px-5 py-2.5 border-t shrink-0 ${
              isDarkMode ? 'bg-[#09101f] border-[#182744]' : 'bg-white border-slate-200/90 shadow-sm'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Communication Pipeline</span>
              </div>

              {/* Horizontal Pill Steps */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-medium font-mono">
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Message
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                  Manchester Encode
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2 py-0.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30">
                  LED Modulation
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  Optical Channel
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Amplification
                </span>
                <span className="text-slate-400">&rarr;</span>
                <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                  ADC &amp; Decode
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================= */}
        {/* COLUMN C: DYNAMIC PROPERTIES INSPECTOR (Right Panel)    */}
        {/* ======================================================= */}
        {!isInspectorCollapsed && (
          <div
            className={`border-l flex flex-col shrink-0 overflow-y-auto ${
              isDarkMode ? 'bg-[#090f1e] border-[#172642]' : 'bg-white border-slate-200'
            }`}
            style={{ width: `${inspectorWidth}px` }}
          >
            {/* Properties Header with Resizing Controls */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <h2 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Component Inspector
                </h2>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                  style={{
                    color: selectedComp.accentColor,
                    borderColor: `${selectedComp.accentColor}50`,
                    backgroundColor: `${selectedComp.accentColor}15`
                  }}
                >
                  {selectedComp.category}
                </span>
              </div>

              {/* Panel Resizing Pills and Collapse Button */}
              <div className="flex items-center space-x-1">
                <div className="flex items-center space-x-0.5 text-[9px] font-mono mr-1">
                  {[280, 320, 380].map((w) => (
                    <button
                      key={w}
                      onClick={() => setInspectorWidth(w)}
                      className={`px-1.5 py-0.5 rounded border transition ${
                        inspectorWidth === w
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title={`Set width to ${w}px`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setIsInspectorCollapsed(true)}
                  className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Collapse Inspector Panel"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

          <div className="p-4 space-y-4">
            {/* Component Image Banner */}
            <div className="space-y-3">
              <div className="w-full h-36 rounded-xl overflow-hidden border border-slate-700/80 relative shadow-lg bg-black/40 group">
                <img
                  src={selectedComp.imageUrl}
                  alt={selectedComp.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent flex items-end justify-between p-2.5 pointer-events-none">
                  <span className="text-[10px] font-mono text-emerald-300 bg-black/70 px-2 py-0.5 rounded border border-emerald-500/40">
                    Verified Hardware
                  </span>
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border"
                    style={{
                      color: selectedComp.accentColor,
                      borderColor: `${selectedComp.accentColor}50`,
                      backgroundColor: `${selectedComp.accentColor}25`
                    }}
                  >
                    {selectedComp.canonicalId}
                  </span>
                </div>
              </div>

              <div>
                <h3 className={`text-sm font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                  {selectedComp.name}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  {selectedComp.type}
                </span>
              </div>
            </div>

            {/* Explicit Transistor Model Selector (S8050 Paper Primary vs 2N2222 Benchtop Alternate) */}
            {(selectedComp.canonicalId.includes('transistor') || selectedComp.id.includes('transistor')) && (
              <div className="rounded-xl border p-3 text-xs space-y-2 bg-orange-950/30 border-orange-500/40">
                <div className="text-[10px] font-mono text-orange-400 font-bold uppercase border-b border-orange-800/40 pb-1 flex justify-between">
                  <span>Driver Transistor Model</span>
                  <span className="text-orange-300 font-mono">BJT Selection</span>
                </div>
                <div className="space-y-2 text-[11px]">
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transistor_config"
                      checked={activeTransistorModel === 's8050'}
                      onChange={() => handleSetTransistorModel('s8050')}
                      className="mt-0.5 accent-orange-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-white">S8050 NPN BJT (Paper Primary Spec)</div>
                      <div className="text-[10px] text-slate-400 font-mono">I_C = 120 mA, h_FE ≈ 200, f_T = 150 MHz</div>
                    </div>
                  </label>
                  <label className="flex items-start space-x-2 cursor-pointer">
                    <input
                      type="radio"
                      name="transistor_config"
                      checked={activeTransistorModel === '2n2222'}
                      onChange={() => handleSetTransistorModel('2n2222')}
                      className="mt-0.5 accent-orange-500 cursor-pointer"
                    />
                    <div>
                      <div className="font-bold text-white">2N2222 NPN BJT (Benchtop Alternate)</div>
                      <div className="text-[10px] text-slate-400 font-mono">I_C = 800 mA, h_FE = 100–300, f_T = 300 MHz</div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Specifications Table */}
            <div
              className={`rounded-xl border p-3 text-xs space-y-2.5 ${
                isDarkMode ? 'bg-[#0c1426] border-[#1a2b4b]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-800 pb-1 flex justify-between">
                <span>Verified Parameters</span>
                <span className="text-emerald-400">HAL Matched</span>
              </div>

              {selectedComp.properties.map((prop, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className="text-slate-400 dark:text-slate-500 text-[11px]">{prop.label}</span>
                  <span className={`font-mono font-bold text-[11px] ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                    {prop.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Pinout & Routed Nets */}
            <div
              className={`rounded-xl border p-3 text-xs space-y-2 ${
                isDarkMode ? 'bg-[#0c1426] border-[#1a2b4b]' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 font-bold uppercase border-b border-slate-800 pb-1">
                Pinout &amp; Routed Nets
              </div>
              {selectedComp.pins.map((pin) => (
                <div key={pin.id} className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300 font-semibold">{pin.name}</span>
                  <span className="text-slate-400 truncate max-w-[170px]" title={pin.label}>
                    {pin.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Educational Info Callout Box */}
            <div
              className="p-3 rounded-xl border text-xs space-y-1"
              style={{
                backgroundColor: `${selectedComp.accentColor}10`,
                borderColor: `${selectedComp.accentColor}30`
              }}
            >
              <div
                className="flex items-center space-x-1.5 font-bold"
                style={{ color: selectedComp.accentColor }}
              >
                <Info className="w-3.5 h-3.5" />
                <span>{selectedComp.infoTitle}</span>
              </div>
              <p className="text-[11px] leading-relaxed" style={{ color: isDarkMode ? '#cbd5e1' : '#334155' }}>
                {selectedComp.infoDescription}
              </p>
            </div>

            {/* Simulation Channel Knobs (Distance, Ambient Noise, SG90 Servo Flap) */}
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>Simulation Channel Knobs</span>
                <Sliders className="w-3.5 h-3.5" />
              </h4>

              {/* Working Distance Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Air Gap (Distance):</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {workingDistanceCm} cm
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  value={workingDistanceCm}
                  onChange={(e) => onDistanceChange(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>10 cm (Near)</span>
                  <span>40 cm (Far)</span>
                </div>
              </div>

              {/* Ambient Noise Slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Ambient Noise:</span>
                  <span className="font-bold text-cyan-600 dark:text-cyan-400">
                    {ambientLux} Lux
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="800"
                  step="50"
                  value={ambientLux}
                  onChange={(e) => onAmbientLuxChange(Number(e.target.value))}
                  className="w-full accent-cyan-600 cursor-pointer"
                />
                <div className="flex justify-between text-[9px] font-mono text-slate-500">
                  <span>50 Lux (Dark)</span>
                  <span>800 Lux (Bright)</span>
                </div>
              </div>

              {/* SG90 Servo Burst Occlusion Control */}
              <div className="space-y-1.5 pt-2 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400 flex items-center space-x-1">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>SG90 Servo Flap:</span>
                  </span>
                  <span className={`font-bold ${
                    servoAngle === 0 ? 'text-emerald-400' : servoAngle === 30 ? 'text-blue-400' : servoAngle === 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {servoAngle}&deg; ({servoAngle === 0 ? 'LOS' : servoAngle === 30 ? '30 ms' : servoAngle === 60 ? '250 ms' : '500 ms'})
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-[10px] font-mono">
                  {([0, 30, 60, 90] as const).map((angle) => (
                    <button
                      key={angle}
                      onClick={() => setServoAngle(angle)}
                      className={`py-1 rounded border text-center transition-all ${
                        servoAngle === angle
                          ? 'bg-amber-600 text-white border-amber-500 font-bold'
                          : isDarkMode
                          ? 'bg-slate-900/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                          : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {angle}&deg;
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[8px] font-mono text-slate-500">
                  <span>0&deg; Clear</span>
                  <span>30&deg; P1</span>
                  <span>60&deg; P2</span>
                  <span>90&deg; P3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

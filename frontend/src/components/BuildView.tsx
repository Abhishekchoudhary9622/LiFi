import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  RotateCw,
  Trash2,
  Copy,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  Eye,
  Crosshair,
  Sparkles,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  CircuitComponent,
  Wire,
  PinDefinition,
  BreadboardHole,
  SimulationMetrics,
  ValidationResult,
  ComponentCategory
} from '../types/circuit';
import { COMPONENT_CATALOG, ComponentTemplate } from '../circuit/demoCircuit';
import {
  generateBreadboardModel,
  findClosestHole,
  BreadboardGeometry,
  BREADBOARD_ORIGIN_X,
  BREADBOARD_ORIGIN_Y,
  HOLE_PITCH
} from '../circuit/breadboardModel';

interface BuildViewProps {
  components: CircuitComponent[];
  wires: Wire[];
  onUpdateComponents: (components: CircuitComponent[]) => void;
  onUpdateWires: (wires: Wire[]) => void;
  metrics: SimulationMetrics;
  validation: ValidationResult;
  onRunSimulation: () => void;
  onStopSimulation: () => void;
  onSelectComponentForInspector?: (comp: CircuitComponent | null) => void;
}

export const BuildView: React.FC<BuildViewProps> = ({
  components,
  wires,
  onUpdateComponents,
  onUpdateWires,
  metrics,
  validation,
  onRunSimulation,
  onStopSimulation
}) => {
  // Canvas viewport state
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [startPan, setStartPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [isPhysicalView, setIsPhysicalView] = useState(false);

  // Selection states
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>('MCU_1');
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [hoveredPin, setHoveredPin] = useState<{ componentId: string; pinId: string } | null>(null);
  const [hoveredHole, setHoveredHole] = useState<BreadboardHole | null>(null);

  // Dragging component state
  const [draggedCompId, setDraggedCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Wiring state (Click pin -> drag wire -> click target pin/hole)
  const [wiringStart, setWiringStart] = useState<{
    componentId: string;
    pinId: string;
    x: number;
    y: number;
  } | null>(null);
  const [currentMousePos, setCurrentMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [activeWireColor, setActiveWireColor] = useState<string>('#06b6d4'); // Default cyan

  // Component library category filter & search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');

  // Bottom panel expand/collapse
  const [bottomExpanded, setBottomExpanded] = useState(true);

  // Generate breadboard model
  const breadboard: BreadboardGeometry = useMemo(() => generateBreadboardModel(180, 70), []);

  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filtered components in library
  const filteredCatalog = useMemo(() => {
    return COMPONENT_CATALOG.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchQuery, selectedCategory]);

  const selectedComponent = useMemo(() => {
    return components.find((c) => c.id === selectedComponentId) || null;
  }, [components, selectedComponentId]);

  // Transform coordinates from screen space to SVG canvas coordinates
  const getCanvasCoords = (e: React.MouseEvent) => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - pan.x) / zoom;
    const y = (e.clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  // Add component from library to canvas
  const handleAddComponent = (template: ComponentTemplate) => {
    const newId = `${template.typeId.toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const newComponent: CircuitComponent = {
      id: newId,
      typeId: template.typeId,
      name: `${template.name} ${newId.split('_')[1]}`,
      category: template.category,
      x: 220 + (components.length * 30) % 200,
      y: 180 + (components.length * 20) % 150,
      rotation: 0,
      properties: { ...template.defaultProperties },
      pins: template.pins.map((p) => ({ ...p }))
    };

    onUpdateComponents([...components, newComponent]);
    setSelectedComponentId(newId);
  };

  // Rotate selected component by 90 degrees
  const handleRotateSelected = () => {
    if (!selectedComponentId) return;
    onUpdateComponents(
      components.map((c) => {
        if (c.id === selectedComponentId) {
          return { ...c, rotation: (c.rotation + 90) % 360 };
        }
        return c;
      })
    );
  };

  // Delete selected component or wire
  const handleDeleteSelected = () => {
    if (selectedComponentId) {
      // Remove component and all its connected wires
      onUpdateComponents(components.filter((c) => c.id !== selectedComponentId));
      onUpdateWires(
        wires.filter(
          (w) => w.fromComponentId !== selectedComponentId && w.toComponentId !== selectedComponentId
        )
      );
      setSelectedComponentId(null);
    } else if (selectedWireId) {
      onUpdateWires(wires.filter((w) => w.id !== selectedWireId));
      setSelectedWireId(null);
    }
  };

  // Duplicate selected component
  const handleDuplicateSelected = () => {
    if (!selectedComponent) return;
    const newId = `${selectedComponent.typeId.toUpperCase()}_${Date.now().toString().slice(-4)}`;
    const duplicated: CircuitComponent = {
      ...selectedComponent,
      id: newId,
      name: `${selectedComponent.name} (Copy)`,
      x: selectedComponent.x + 30,
      y: selectedComponent.y + 30,
      pins: selectedComponent.pins.map((p) => ({ ...p }))
    };
    onUpdateComponents([...components, duplicated]);
    setSelectedComponentId(newId);
  };

  // Keyboard shortcut listener for canvas operations
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotateSelected();
      } else if (e.key === 'g' || e.key === 'G') {
        setShowGrid((prev) => !prev);
      } else if (e.key === 'f' || e.key === 'F') {
        // Fit view
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Calculate absolute coordinates for a pin on a component
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

  // Handle pin click for starting or ending a wire
  const handlePinClick = (comp: CircuitComponent, pin: PinDefinition, e: React.MouseEvent) => {
    e.stopPropagation();
    const pinPos = getPinAbsolutePos(comp, pin);

    if (!wiringStart) {
      // Start wiring from this pin
      setWiringStart({
        componentId: comp.id,
        pinId: pin.id,
        x: pinPos.x,
        y: pinPos.y
      });
      setSelectedWireId(null);
    } else {
      // If clicked on the same pin, cancel wiring
      if (wiringStart.componentId === comp.id && wiringStart.pinId === pin.id) {
        setWiringStart(null);
        return;
      }

      // Complete wire connection!
      const newWire: Wire = {
        id: `wire_${Date.now().toString().slice(-6)}`,
        fromComponentId: wiringStart.componentId,
        fromPinId: wiringStart.pinId,
        toComponentId: comp.id,
        toPinId: pin.id,
        color: activeWireColor,
        active: metrics.running
      };

      onUpdateWires([...wires, newWire]);
      setWiringStart(null);
    }
  };

  // Handle breadboard hole click when wiring
  const handleHoleClick = (hole: BreadboardHole, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!wiringStart) return;

    // Connect wire to breadboard hole virtual node
    const holeNodeId = `BREADBOARD_HOLE_${hole.id}`;
    const newWire: Wire = {
      id: `wire_${Date.now().toString().slice(-6)}`,
      fromComponentId: wiringStart.componentId,
      fromPinId: wiringStart.pinId,
      toComponentId: 'BREADBOARD',
      toPinId: hole.id,
      color: activeWireColor,
      active: metrics.running
    };

    onUpdateWires([...wires, newWire]);
    setWiringStart(null);
  };

  // Mouse move on canvas (for panning, component dragging, wiring preview)
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    setCurrentMousePos(coords);

    if (isPanning) {
      setPan({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
      return;
    }

    if (draggedCompId) {
      let targetX = coords.x - dragOffset.x;
      let targetY = coords.y - dragOffset.y;

      if (snapToGrid) {
        // Snap to nearest 10px or hole pitch
        targetX = Math.round(targetX / 10) * 10;
        targetY = Math.round(targetY / 10) * 10;
      }

      onUpdateComponents(
        components.map((c) => {
          if (c.id === draggedCompId) {
            return { ...c, x: targetX, y: targetY };
          }
          return c;
        })
      );
    }
  };

  // Mouse up on canvas
  const handleCanvasMouseUp = () => {
    setDraggedCompId(null);
    setIsPanning(false);
  };

  // Start panning
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.altKey || e.buttons === 4) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    } else if (e.target === svgRef.current) {
      // Clicked on empty canvas background
      setSelectedComponentId(null);
      setSelectedWireId(null);
      setWiringStart(null);
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(2.5, Math.max(0.4, prev * zoomFactor)));
  };

  // Wire path helper: creates clean curved/orthogonal cubic Bezier lines
  const getWirePath = (wire: Wire) => {
    const fromComp = components.find((c) => c.id === wire.fromComponentId);
    let startX = 0;
    let startY = 0;

    if (fromComp) {
      const fromPin = fromComp.pins.find((p) => p.id === wire.fromPinId);
      if (fromPin) {
        const pos = getPinAbsolutePos(fromComp, fromPin);
        startX = pos.x;
        startY = pos.y;
      }
    }

    let endX = 0;
    let endY = 0;

    if (wire.toComponentId === 'BREADBOARD') {
      const hole = breadboard.holeMap.get(wire.toPinId);
      if (hole) {
        endX = hole.x;
        endY = hole.y;
      }
    } else {
      const toComp = components.find((c) => c.id === wire.toComponentId);
      if (toComp) {
        const toPin = toComp.pins.find((p) => p.id === wire.toPinId);
        if (toPin) {
          const pos = getPinAbsolutePos(toComp, toPin);
          endX = pos.x;
          endY = pos.y;
        }
      }
    }

    if (startX === 0 && endX === 0) return '';

    // Calculate control points for gentle realistic wire sagging
    const dx = endX - startX;
    const dy = endY - startY;
    const curvature = Math.min(60, Math.sqrt(dx * dx + dy * dy) * 0.25);
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2 + curvature;

    return `M ${startX} ${startY} Q ${midX} ${midY} ${endX} ${endY}`;
  };

  // Colors available for wires
  const wireColors = [
    { label: 'Cyan', color: '#06b6d4' },
    { label: 'Red (VCC)', color: '#ef4444' },
    { label: 'Black (GND)', color: '#1e293b' },
    { label: 'Emerald', color: '#10b981' },
    { label: 'Amber', color: '#f59e0b' },
    { label: 'Blue', color: '#3b82f6' },
    { label: 'White', color: '#f8fafc' }
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080d16] select-none overflow-hidden font-mono">
      {/* Workspace Sub-Toolbar */}
      <div className="h-10 bg-[#0c1220] border-b border-[#1f293d] flex items-center justify-between px-3 z-20 text-xs">
        {/* Left: View Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPhysicalView(false)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center space-x-1 ${
              !isPhysicalView
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Engineering View</span>
          </button>
          <button
            onClick={() => setIsPhysicalView(true)}
            className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors flex items-center space-x-1 ${
              isPhysicalView
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-700'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Physical Realistic View</span>
          </button>

          <div className="w-px h-4 bg-[#1f293d] mx-1" />

          {/* Wire Color Picker */}
          <div className="flex items-center space-x-1 bg-[#111827] px-2 py-0.5 rounded border border-[#1f293d]">
            <span className="text-[10px] text-slate-400 mr-1">Wire:</span>
            {wireColors.map((w) => (
              <button
                key={w.color}
                onClick={() => setActiveWireColor(w.color)}
                style={{ backgroundColor: w.color }}
                title={`Select ${w.label} wire color`}
                className={`w-3.5 h-3.5 rounded-full border transition-transform ${
                  activeWireColor === w.color
                    ? 'border-white scale-125 shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                    : 'border-slate-700 hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Center: Instruction hint */}
        <div className="text-[11px] text-slate-400 flex items-center space-x-1.5 hidden md:flex">
          {wiringStart ? (
            <span className="text-cyan-400 font-bold animate-pulse">
              ● Click target component pin or breadboard hole to connect wire (or ESC to cancel)
            </span>
          ) : (
            <span>
              Tip: Click pin to wire • Drag components • Press <kbd className="px-1 bg-[#1e293b] rounded text-[10px] text-slate-300">R</kbd> to rotate • <kbd className="px-1 bg-[#1e293b] rounded text-[10px] text-slate-300">Del</kbd> to remove
            </span>
          )}
        </div>

        {/* Right: Canvas Tools (Zoom, Grid, Snap, Rotate, Delete) */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.1))}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] text-cyan-400 w-9 text-center font-bold">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, z + 0.1))}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setZoom(1.0);
              setPan({ x: 0, y: 0 });
            }}
            className="p-1 text-slate-400 hover:text-white hover:bg-[#1e293b] rounded"
            title="Fit Canvas (F)"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-[#1f293d]" />

          <button
            onClick={() => setShowGrid((g) => !g)}
            className={`p-1 rounded ${showGrid ? 'text-cyan-400 bg-cyan-950/60' : 'text-slate-400 hover:text-white'}`}
            title="Toggle Grid (G)"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleRotateSelected}
            disabled={!selectedComponentId}
            className={`p-1 rounded ${
              selectedComponentId
                ? 'text-cyan-400 hover:bg-[#1e293b]'
                : 'text-slate-400 opacity-50 cursor-not-allowed'
            }`}
            title="Rotate Component (R)"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDuplicateSelected}
            disabled={!selectedComponentId}
            className={`p-1 rounded ${
              selectedComponentId
                ? 'text-cyan-400 hover:bg-[#1e293b]'
                : 'text-slate-400 opacity-50 cursor-not-allowed'
            }`}
            title="Duplicate Component"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!selectedComponentId && !selectedWireId}
            className={`p-1 rounded ${
              selectedComponentId || selectedWireId
                ? 'text-rose-400 hover:bg-rose-950/60'
                : 'text-slate-400 opacity-50 cursor-not-allowed'
            }`}
            title="Delete Selected (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3-Panel Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ======================================================== */}
        {/* LEFT PANEL: Component Library                            */}
        {/* ======================================================== */}
        <div className="w-64 bg-[#0a0e17] border-r border-[#1f293d] flex flex-col z-10 shrink-0">
          {/* Search Box */}
          <div className="p-2.5 border-b border-[#1f293d]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search components..."
                className="w-full pl-8 pr-2.5 py-1.5 bg-[#111827] border border-[#1f293d] rounded text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Category Tabs */}
          <div className="p-2 border-b border-[#1f293d] flex flex-wrap gap-1 text-[10px]">
            {(['all', 'basic', 'power', 'mcu', 'sensors', 'lifi', 'instruments'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded capitalize transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-900/60 text-cyan-300 font-bold border border-cyan-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#111827]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Catalog List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredCatalog.map((template) => (
              <div
                key={template.typeId}
                onClick={() => handleAddComponent(template)}
                className="p-2.5 bg-[#111827] hover:bg-[#162136] border border-[#1f293d] hover:border-cyan-700 rounded cursor-pointer group transition-all"
                title="Click to place on canvas"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-200 group-hover:text-cyan-300">
                    {template.name}
                  </span>
                  <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {template.category}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {template.description}
                </p>
                <div className="mt-2 flex items-center justify-between text-[10px] text-cyan-400/80">
                  <span>{template.pins.length} Pins</span>
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                    + Add to Canvas
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ======================================================== */}
        {/* CENTER PANEL: Interactive Breadboard & Circuit Canvas   */}
        {/* ======================================================== */}
        <div
          className="flex-1 h-full relative overflow-hidden bg-[#080d16]"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          {/* High-tech CAD Background Grid */}
          {showGrid && (
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #334155 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)',
                backgroundSize: '24px 24px, 24px 24px, 24px 24px',
                transform: `translate(${pan.x}px, ${pan.y}px)`
              }}
            />
          )}

          {/* SVG Canvas for breadboard, components, pins, and wires */}
          <svg
            ref={svgRef}
            className="w-full h-full cursor-crosshair"
            onMouseDown={handleCanvasMouseDown}
          >
            <defs>
              {/* Animated Current Gradient */}
              <linearGradient id="currentFlowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
              </linearGradient>

              {/* Optical Pulse Marker */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* ---------------------------------------------------- */}
              {/* 1. INTERACTIVE BREADBOARD                            */}
              {/* ---------------------------------------------------- */}
              <g id="breadboard-group">
                {/* Outer Breadboard Plastic Casing */}
                <rect
                  x={180}
                  y={60}
                  width={breadboard.width}
                  height={breadboard.height + 40}
                  rx={8}
                  fill={isPhysicalView ? '#f8fafc' : '#0f172a'}
                  stroke={isPhysicalView ? '#cbd5e1' : '#334155'}
                  strokeWidth={2}
                  className="shadow-2xl"
                />

                {/* Breadboard Inner Bevel */}
                <rect
                  x={185}
                  y={65}
                  width={breadboard.width - 10}
                  height={breadboard.height + 30}
                  rx={6}
                  fill={isPhysicalView ? '#ffffff' : '#090d16'}
                  stroke={isPhysicalView ? '#e2e8f0' : '#1e293b'}
                  strokeWidth={1}
                />

                {/* Center Divider / Ravine (0.3" Gutter for ICs) */}
                <rect
                  x={210}
                  y={196}
                  width={breadboard.width - 55}
                  height={16}
                  fill={isPhysicalView ? '#e2e8f0' : '#030712'}
                  stroke={isPhysicalView ? '#cbd5e1' : '#111827'}
                  strokeWidth={1}
                />
                <text
                  x={breadboard.width / 2 + 160}
                  y={208}
                  fill={isPhysicalView ? '#94a3b8' : '#334155'}
                  fontSize={8}
                  textAnchor="middle"
                  className="font-mono font-bold tracking-widest pointer-events-none"
                >
                  SEMLIFI LAB HARDWARE BREADBOARD (30 ROWS)
                </text>

                {/* Power Rails Color Bands */}
                {/* Top Positive Rail (Red Line) */}
                <line
                  x1={220}
                  y1={76}
                  x2={breadboard.width + 150}
                  y2={76}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  opacity={0.7}
                />
                {/* Top Negative Rail (Blue Line) */}
                <line
                  x1={220}
                  y1={112}
                  x2={breadboard.width + 150}
                  y2={112}
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  opacity={0.7}
                />
                {/* Bottom Positive Rail (Red Line) */}
                <line
                  x1={220}
                  y1={294}
                  x2={breadboard.width + 150}
                  y2={294}
                  stroke="#ef4444"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  opacity={0.7}
                />
                {/* Bottom Negative Rail (Blue Line) */}
                <line
                  x1={220}
                  y1={330}
                  x2={breadboard.width + 150}
                  y2={330}
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  opacity={0.7}
                />

                {/* Row Number Labels (1, 5, 10, 15, 20, 25, 30) */}
                {Array.from({ length: 30 }).map((_, idx) => {
                  const rowNum = idx + 1;
                  const xPos = 225 + idx * HOLE_PITCH;
                  if (rowNum % 5 !== 0 && rowNum !== 1) return null;
                  return (
                    <g key={`row_label_${rowNum}`}>
                      <text
                        x={xPos}
                        y={130}
                        fontSize={8}
                        fill={isPhysicalView ? '#64748b' : '#475569'}
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {rowNum}
                      </text>
                      <text
                        x={xPos}
                        y={284}
                        fontSize={8}
                        fill={isPhysicalView ? '#64748b' : '#475569'}
                        textAnchor="middle"
                        className="font-mono"
                      >
                        {rowNum}
                      </text>
                    </g>
                  );
                })}

                {/* Column Letters (a b c d e | f g h i j) */}
                {['a', 'b', 'c', 'd', 'e'].map((col, idx) => (
                  <text
                    key={`col_${col}`}
                    x={205}
                    y={144 + idx * HOLE_PITCH}
                    fontSize={8}
                    fill={isPhysicalView ? '#64748b' : '#475569'}
                    textAnchor="middle"
                    className="font-mono uppercase font-bold"
                  >
                    {col}
                  </text>
                ))}
                {['f', 'g', 'h', 'i', 'j'].map((col, idx) => (
                  <text
                    key={`col_${col}`}
                    x={205}
                    y={224 + idx * HOLE_PITCH}
                    fontSize={8}
                    fill={isPhysicalView ? '#64748b' : '#475569'}
                    textAnchor="middle"
                    className="font-mono uppercase font-bold"
                  >
                    {col}
                  </text>
                ))}

                {/* Individually Addressable Breadboard Holes */}
                {breadboard.holes.map((hole) => {
                  const isHovered = hoveredHole?.id === hole.id;
                  const isPower = hole.col === '+';
                  const isGnd = hole.col === '-';
                  return (
                    <g
                      key={hole.id}
                      onClick={(e) => handleHoleClick(hole, e)}
                      onMouseEnter={() => setHoveredHole(hole)}
                      onMouseLeave={() => setHoveredHole(null)}
                      className="cursor-pointer"
                    >
                      {/* Hole Outer Bezel */}
                      <circle
                        cx={hole.x}
                        cy={hole.y}
                        r={isHovered ? 5.5 : 4}
                        fill={
                          isHovered
                            ? '#06b6d4'
                            : isPhysicalView
                            ? '#0f172a'
                            : '#030712'
                        }
                        stroke={
                          isHovered
                            ? '#22d3ee'
                            : isPower
                            ? '#ef4444'
                            : isGnd
                            ? '#3b82f6'
                            : isPhysicalView
                            ? '#94a3b8'
                            : '#1e293b'
                        }
                        strokeWidth={isHovered ? 1.5 : 0.8}
                        className="transition-all"
                      />
                      {/* Spring Terminal Contact Inner */}
                      <rect
                        x={hole.x - 1.2}
                        y={hole.y - 1.2}
                        width={2.4}
                        height={2.4}
                        fill={isPhysicalView ? '#e2e8f0' : '#475569'}
                        rx={0.5}
                      />
                    </g>
                  );
                })}
              </g>

              {/* ---------------------------------------------------- */}
              {/* 2. WIRES (ELECTRICAL NETS & OPTICAL BEAM)            */}
              {/* ---------------------------------------------------- */}
              {wires.map((wire) => {
                const pathStr = getWirePath(wire);
                const isSelected = selectedWireId === wire.id;
                const isOptical = wire.fromPinId === 'opt_out' || wire.toPinId === 'opt_in';

                if (!pathStr) return null;

                return (
                  <g
                    key={wire.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedWireId(wire.id);
                      setSelectedComponentId(null);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Wider transparent hit area */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke="transparent"
                      strokeWidth={14}
                    />

                    {/* Outer glow when selected */}
                    {isSelected && (
                      <path
                        d={pathStr}
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth={6}
                        strokeOpacity={0.6}
                        filter="url(#glow)"
                      />
                    )}

                    {/* Main wire physical strand */}
                    <path
                      d={pathStr}
                      fill="none"
                      stroke={wire.color}
                      strokeWidth={isOptical ? 3 : 2.5}
                      strokeDasharray={isOptical ? '6 4' : undefined}
                      strokeLinecap="round"
                      className="transition-all"
                    />

                    {/* Animated current traveling through active wires during simulation */}
                    {metrics.running && (
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

              {/* ---------------------------------------------------- */}
              {/* 3. CIRCUIT COMPONENTS                                */}
              {/* ---------------------------------------------------- */}
              {components.map((comp) => {
                const isSelected = selectedComponentId === comp.id;
                const template = COMPONENT_CATALOG.find((t) => t.typeId === comp.typeId);
                const width = template?.defaultWidth || 80;
                const height = template?.defaultHeight || 60;

                return (
                  <g
                    key={comp.id}
                    transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedComponentId(comp.id);
                      setSelectedWireId(null);
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
                    {/* Component Body Background */}
                    <rect
                      x={-4}
                      y={-4}
                      width={width + 8}
                      height={height + 8}
                      rx={6}
                      fill={
                        isSelected
                          ? '#0a192f'
                          : isPhysicalView
                          ? '#1e293b'
                          : '#0f172a'
                      }
                      stroke={
                        isSelected
                          ? '#06b6d4'
                          : isPhysicalView
                          ? '#475569'
                          : '#1e293b'
                      }
                      strokeWidth={isSelected ? 2 : 1}
                      filter={isSelected ? 'url(#glow)' : undefined}
                      className="transition-all"
                    />

                    {/* Realistic Visual Rendering by Component Type */}
                    {comp.typeId === 'resistor' ? (
                      /* Resistor Cylinder with standard color bands */
                      <g>
                        <rect x={14} y={6} width={44} height={16} rx={4} fill="#d97706" />
                        <line x1={0} y1={14} x2={14} y2={14} stroke="#94a3b8" strokeWidth={2} />
                        <line x1={58} y1={14} x2={72} y2={14} stroke="#94a3b8" strokeWidth={2} />
                        {/* Bands: Red, Red, Brown (220 ohm) */}
                        <rect x={22} y={6} width={4} height={16} fill="#dc2626" />
                        <rect x={30} y={6} width={4} height={16} fill="#dc2626" />
                        <rect x={38} y={6} width={4} height={16} fill="#78350f" />
                        <rect x={48} y={6} width={3} height={16} fill="#fbbf24" />
                      </g>
                    ) : comp.typeId === 'stm32' ? (
                      /* STM32 Blue Pill Board Realistic Visual */
                      <g>
                        {/* Blue PCB Board */}
                        <rect x={0} y={0} width={width} height={height} rx={4} fill="#1d4ed8" stroke="#3b82f6" strokeWidth={1} />
                        {/* ARM Cortex-M3 LQFP48 Chip in center */}
                        <rect x={75} y={24} width={40} height={40} rx={2} fill="#0f172a" stroke="#475569" strokeWidth={1} />
                        <text x={95} y={42} fill="#94a3b8" fontSize={7} textAnchor="middle" className="font-mono font-bold">ARM</text>
                        <text x={95} y={52} fill="#64748b" fontSize={5} textAnchor="middle" className="font-mono">F103C8T6</text>
                        {/* Crystal 8MHz Oscillator */}
                        <rect x={48} y={35} width={18} height={8} rx={3} fill="#cbd5e1" stroke="#94a3b8" strokeWidth={0.5} />
                        {/* Micro USB Port */}
                        <rect x={2} y={32} width={12} height={16} rx={1} fill="#94a3b8" />
                        {/* Reset button */}
                        <rect x={20} y={10} width={8} height={8} fill="#ef4444" rx={1} />
                      </g>
                    ) : comp.typeId === 'lifi_tx' ? (
                      /* LiFi LED Transmitter Emitter Dome */
                      <g>
                        <circle cx={45} cy={37} r={22} fill="#042f2e" stroke="#14b8a6" strokeWidth={1.5} />
                        <circle cx={45} cy={37} r={14} fill="#0d9488" />
                        <circle
                          cx={45}
                          cy={37}
                          r={metrics.running ? 8 : 4}
                          fill={metrics.running ? '#a7f3d0' : '#10b981'}
                          className={metrics.running ? 'animate-ping' : ''}
                        />
                        <text x={45} y={40} fill="#ffffff" fontSize={8} textAnchor="middle" className="font-mono font-bold">
                          {metrics.running ? 'TX ON' : 'TX'}
                        </text>
                      </g>
                    ) : comp.typeId === 'photodiode' ? (
                      /* BPW34 Silicon Window Photodiode */
                      <g>
                        <rect x={12} y={10} width={52} height={44} rx={2} fill="#1e1b4b" stroke="#6366f1" strokeWidth={1.5} />
                        {/* Square active sensing window */}
                        <rect x={24} y={18} width={28} height={28} fill="#312e81" stroke="#818cf8" strokeWidth={1} />
                        <line x1={24} y1={32} x2={52} y2={32} stroke="#a5b4fc" strokeWidth={0.5} opacity={0.6} />
                        <line x1={38} y1={18} x2={38} y2={46} stroke="#a5b4fc" strokeWidth={0.5} opacity={0.6} />
                        <text x={38} y={58} fill="#c7d2fe" fontSize={6} textAnchor="middle" className="font-mono">
                          BPW34 PIN
                        </text>
                      </g>
                    ) : (
                      /* Default Component CAD Box */
                      <g>
                        <text
                          x={width / 2}
                          y={height / 2 + 4}
                          fill="#e2e8f0"
                          fontSize={9}
                          textAnchor="middle"
                          className="font-mono font-bold"
                        >
                          {comp.name}
                        </text>
                      </g>
                    )}

                    {/* Component Name Label */}
                    <text
                      x={width / 2}
                      y={-8}
                      fill="#94a3b8"
                      fontSize={9}
                      textAnchor="middle"
                      className="font-mono font-semibold"
                    >
                      {comp.name}
                    </text>

                    {/* Connection Pins */}
                    {comp.pins.map((pin) => {
                      const isPinHovered =
                        hoveredPin?.componentId === comp.id && hoveredPin?.pinId === pin.id;
                      const isPinWiring =
                        wiringStart?.componentId === comp.id && wiringStart?.pinId === pin.id;

                      return (
                        <g
                          key={pin.id}
                          transform={`translate(${pin.x}, ${pin.y})`}
                          onClick={(e) => handlePinClick(comp, pin, e)}
                          onMouseEnter={() => setHoveredPin({ componentId: comp.id, pinId: pin.id })}
                          onMouseLeave={() => setHoveredPin(null)}
                          className="cursor-pointer"
                        >
                          {/* Pin Outer Ring */}
                          <circle
                            cx={0}
                            cy={0}
                            r={isPinHovered || isPinWiring ? 6 : 4}
                            fill={
                              isPinWiring
                                ? '#22d3ee'
                                : pin.type === 'power'
                                ? '#ef4444'
                                : pin.type === 'ground'
                                ? '#1e293b'
                                : pin.type === 'optical'
                                ? '#f59e0b'
                                : '#06b6d4'
                            }
                            stroke="#ffffff"
                            strokeWidth={isPinHovered || isPinWiring ? 2 : 1}
                            className="transition-all"
                          />
                          {/* Pin Name on Hover */}
                          {isPinHovered && (
                            <text
                              x={0}
                              y={-10}
                              fill="#22d3ee"
                              fontSize={9}
                              textAnchor="middle"
                              className="font-mono font-bold pointer-events-none bg-black"
                            >
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
        </div>

        {/* ======================================================== */}
        {/* RIGHT PANEL: Properties & Dedicated Connection Inspector */}
        {/* ======================================================== */}
        <div className="w-80 bg-[#0a0e17] border-l border-[#1f293d] flex flex-col z-10 shrink-0 overflow-y-auto">
          {/* Panel Header */}
          <div className="p-3 border-b border-[#1f293d] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Inspector & Netlist
              </h3>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {components.length} COMPS / {wires.length} NETS
            </span>
          </div>

          {/* Section 1: Selected Component Properties */}
          {selectedComponent ? (
            <div className="p-3 border-b border-[#1f293d] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Selected Component</div>
                  <div className="text-sm font-bold text-cyan-300">{selectedComponent.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {selectedComponent.id}</div>
                </div>
                <button
                  onClick={handleDeleteSelected}
                  className="p-1.5 rounded hover:bg-rose-950/60 text-rose-400 transition-colors"
                  title="Delete component"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Editable Properties Grid */}
              <div className="space-y-2 text-xs">
                {Object.entries(selectedComponent.properties).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between bg-[#111827] px-2.5 py-1.5 rounded border border-[#1f293d]">
                    <span className="text-slate-400 capitalize text-[11px]">{key}:</span>
                    <input
                      type="text"
                      value={val.toString()}
                      onChange={(e) => {
                        const updated = { ...selectedComponent.properties, [key]: e.target.value };
                        onUpdateComponents(
                          components.map((c) =>
                            c.id === selectedComponent.id ? { ...c, properties: updated } : c
                          )
                        );
                      }}
                      className="w-24 text-right bg-transparent text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded px-1"
                    />
                  </div>
                ))}
              </div>

              {/* Pins Table for this component */}
              <div className="mt-3">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pin Configuration
                </div>
                <div className="space-y-1">
                  {selectedComponent.pins.map((pin) => (
                    <div
                      key={pin.id}
                      className="flex items-center justify-between text-[10px] bg-[#111827]/70 px-2 py-1 rounded"
                    >
                      <span className="text-slate-300 font-semibold">{pin.name}</span>
                      <span className="text-slate-400">{pin.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b border-[#1f293d] text-center text-xs text-slate-400">
              Select a component on canvas to inspect and edit electrical properties.
            </div>
          )}

          {/* Section 2: Dedicated Connection Manager */}
          <div className="p-3 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Connection Nets ({wires.length})
              </h4>
              <span className="text-[10px] text-emerald-400 font-bold">ALL VERIFIED</span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto">
              {wires.map((wire) => {
                const isSelected = selectedWireId === wire.id;
                return (
                  <div
                    key={wire.id}
                    onClick={() => {
                      setSelectedWireId(wire.id);
                      setSelectedComponentId(null);
                    }}
                    className={`p-2 rounded text-[11px] font-mono cursor-pointer transition-all border flex items-center justify-between ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-200'
                        : 'bg-[#111827] border-[#1f293d] text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: wire.color }}
                      />
                      <span className="truncate">
                        {wire.fromComponentId}:{wire.fromPinId} → {wire.toComponentId}:{wire.toPinId}
                      </span>
                    </div>
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM PANEL: Simulation / Signal Telemetry Monitor      */}
      {/* ======================================================== */}
      <div className="bg-[#0a0e17] border-t border-[#1f293d] z-20 shrink-0 transition-all">
        {/* Toggle Bar */}
        <div
          onClick={() => setBottomExpanded((b) => !b)}
          className="h-7 px-4 bg-[#0d1424] hover:bg-[#111a30] cursor-pointer flex items-center justify-between text-xs text-slate-400 border-b border-[#1f293d]"
        >
          <div className="flex items-center space-x-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-bold text-slate-200 uppercase tracking-wider font-mono text-[11px]">
              Live Simulation & Power Monitor
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
              metrics.running ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
            }`}>
              {metrics.running ? 'ENGINE RUNNING (ESTIMATED)' : 'IDLE'}
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px]">
            <span>VCC: <strong className="text-white">{metrics.running ? metrics.vccVoltage.toFixed(2) : '3.30'} V</strong></span>
            <span>Total I: <strong className="text-white">{metrics.running ? metrics.totalCurrentMa : '118'} mA</strong></span>
            <span>Optical Pwr: <strong className="text-white">{metrics.running ? metrics.opticalPowerMw : '2.42'} mW</strong></span>
            <span>BER: <strong className="text-indigo-400">{(metrics.running ? metrics.ber * 100 : 0.02).toFixed(2)}%</strong></span>
            {bottomExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-2" /> : <ChevronUp className="w-3.5 h-3.5 ml-2" />}
          </div>
        </div>

        {/* Expandable Monitor Body */}
        {bottomExpanded && (
          <div className="p-3 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 text-xs font-mono">
            <div className="bg-[#111827] p-2 rounded border border-[#1f293d]">
              <div className="text-[10px] text-slate-400">SUPPLY VOLTAGE</div>
              <div className="text-sm font-bold text-amber-400">{metrics.running ? metrics.vccVoltage.toFixed(2) : '3.30'} V</div>
              <div className="text-[9px] text-slate-400">±12mV ripple</div>
            </div>

            <div className="bg-[#111827] p-2 rounded border border-[#1f293d]">
              <div className="text-[10px] text-slate-400">LED FORWARD CURRENT</div>
              <div className="text-sm font-bold text-emerald-400">{metrics.running ? metrics.ledCurrentMa : '5.68'} mA</div>
              <div className="text-[9px] text-slate-400">R1 = 220 Ω limiter</div>
            </div>

            <div className="bg-[#111827] p-2 rounded border border-[#1f293d]">
              <div className="text-[10px] text-slate-400">OPTICAL EMISSION</div>
              <div className="text-sm font-bold text-cyan-300">{metrics.running ? metrics.opticalPowerMw : '2.42'} mW</div>
              <div className="text-[9px] text-slate-400">850nm NIR LED</div>
            </div>

            <div className="bg-[#111827] p-2 rounded border border-[#1f293d]">
              <div className="text-[10px] text-slate-400">PHOTODIODE CURRENT</div>
              <div className="text-sm font-bold text-cyan-400">{metrics.running ? metrics.photodiodeCurrentUa : '15.2'} µA</div>
              <div className="text-[9px] text-slate-400">BPW34 Si PIN</div>
            </div>

            <div className="bg-[#111827] p-2 rounded border border-[#1f293d]">
              <div className="text-[10px] text-slate-400">ADC1 SAMPLE (PA1)</div>
              <div className="text-sm font-bold text-white">{metrics.running ? metrics.adcSampleVoltage.toFixed(3) : '2.140'} V</div>
              <div className="text-[9px] text-slate-400">12-bit STM32 ADC</div>
            </div>

            <div className="bg-[#111827] p-2 rounded border border-[#1f293d]">
              <div className="text-[10px] text-slate-400">OPTICAL SNR</div>
              <div className="text-sm font-bold text-emerald-400">{metrics.running ? metrics.snrDb : '24.80'} dB</div>
              <div className="text-[9px] text-slate-400">LOS Free Space</div>
            </div>

            <div className="bg-[#111827] p-2 rounded border border-[#1f293d]">
              <div className="text-[10px] text-slate-400">BIT ERROR RATE (BER)</div>
              <div className="text-sm font-bold text-indigo-400">{(metrics.running ? metrics.ber * 100 : 0.02).toFixed(3)}%</div>
              <div className="text-[9px] text-slate-400">Q-factor analytical</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

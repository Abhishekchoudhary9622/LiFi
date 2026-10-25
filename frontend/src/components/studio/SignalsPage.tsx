import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Sliders,
  Maximize2,
  RefreshCw,
  Eye,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';
import { DIGITAL_TWIN_COMPONENTS, DigitalTwinComponent } from '../../model/digitalTwin';

interface ChannelConfig {
  id: string;
  name: string;
  shortLabel: string;
  color: string;
  glowColor: string;
  unit: string;
  vDiv: number; // Volts per division
  offset: number; // Vertical offset in divisions
  visible: boolean;
  componentId: string;
  sourcePin: string;
  measurements: {
    vpp: string;
    vmax: string;
    freq: string;
    duty: string;
  };
}

interface SignalsPageProps {
  onSelectComponent?: (comp: DigitalTwinComponent) => void;
  onNavigateToHardware?: () => void;
}

export const SignalsPage: React.FC<SignalsPageProps> = ({
  onSelectComponent,
  onNavigateToHardware
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [timeDiv, setTimeDiv] = useState<number>(100); // microseconds per division (50, 100, 200, 500)
  const [zoom, setZoom] = useState<number>(1.0);
  const [triggerLevel, setTriggerLevel] = useState<number>(1.65); // Volts
  const [selectedChannelId, setSelectedChannelId] = useState<string>('ch1');
  const [activeBitPattern, setActiveBitPattern] = useState<string>('10110010');

  // Channels setup
  const [channels, setChannels] = useState<ChannelConfig[]>([
    {
      id: 'ch1',
      name: 'CH1: STM32 TX Carrier (PWM)',
      shortLabel: 'CH1 TX PWM',
      color: '#3b82f6', // Electric blue
      glowColor: 'rgba(59, 130, 246, 0.4)',
      unit: 'V',
      vDiv: 1.0,
      offset: 2.2,
      visible: true,
      componentId: 'stm32_tx',
      sourcePin: 'PA9 (TIM1_CH2)',
      measurements: { vpp: '3.30 V', vmax: '3.30 V', freq: '10.0 kHz', duty: '50.0%' }
    },
    {
      id: 'ch2',
      name: 'CH2: Optical Intensity / Photocurrent',
      shortLabel: 'CH2 OPTICAL',
      color: '#ef4444', // Red (optical photon flux)
      glowColor: 'rgba(239, 68, 68, 0.4)',
      unit: 'mA / µA',
      vDiv: 0.5,
      offset: 0.8,
      visible: true,
      componentId: 'led_tx',
      sourcePin: 'LED & BPW34 Diode',
      measurements: { vpp: '42.8 µA', vmax: '44.0 µA', freq: '10.0 kHz', duty: '49.8%' }
    },
    {
      id: 'ch3',
      name: 'CH3: LM358 Conditioned Analog Waveform',
      shortLabel: 'CH3 CONDITIONED',
      color: '#06b6d4', // Cyan
      glowColor: 'rgba(6, 182, 212, 0.4)',
      unit: 'V',
      vDiv: 1.0,
      offset: -0.8,
      visible: true,
      componentId: 'signal_conditioning',
      sourcePin: 'LM358 Pin 1 (TIA Out)',
      measurements: { vpp: '2.40 V', vmax: '2.85 V', freq: '10.0 kHz', duty: '50.2%' }
    },
    {
      id: 'ch4',
      name: 'CH4: RX ADC / Sliced Digital Logic',
      shortLabel: 'CH4 RX LOGIC',
      color: '#10b981', // Green
      glowColor: 'rgba(16, 185, 129, 0.4)',
      unit: 'V',
      vDiv: 1.0,
      offset: -2.2,
      visible: true,
      componentId: 'stm32_rx',
      sourcePin: 'PA0 (Timer 2 Input Capture)',
      measurements: { vpp: '3.26 V', vmax: '3.26 V', freq: '10.0 kHz', duty: '50.0%' }
    }
  ]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === selectedChannelId) || channels[0],
    [channels, selectedChannelId]
  );

  const linkedComponent = useMemo(() => {
    return DIGITAL_TWIN_COMPONENTS.find((c) => c.id === activeChannel.componentId);
  }, [activeChannel]);

  const toggleChannelVisibility = (id: string) => {
    setChannels((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );
  };

  const updateChannelVDiv = (id: string, delta: number) => {
    setChannels((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const newVDiv = Math.max(0.2, Math.min(5.0, c.vDiv + delta));
          return { ...c, vDiv: Number(newVDiv.toFixed(1)) };
        }
        return c;
      })
    );
  };

  // Canvas Oscilloscope Renderer Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let phase = 0;

    const render = () => {
      // Resize to container CSS size
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      // Background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, width, height);

      // Oscilloscope Grid Lines (10 divisions horizontal, 8 divisions vertical)
      const numDivsX = 10;
      const numDivsY = 8;
      const dx = width / numDivsX;
      const dy = height / numDivsY;

      // Draw faint secondary grid lines
      ctx.strokeStyle = 'rgba(30, 58, 138, 0.15)';
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += dx / 5) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += dy / 5) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw major grid divisions
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= numDivsX; i++) {
        const x = i * dx;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Division tick marks
        for (let j = 0; j <= numDivsY; j++) {
          const y = j * dy;
          ctx.beginPath();
          ctx.moveTo(x - 3, y);
          ctx.lineTo(x + 3, y);
          ctx.stroke();
        }
      }

      for (let j = 0; j <= numDivsY; j++) {
        const y = j * dy;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center crosshairs
      const centerY = height / 2;
      const centerX = width / 2;
      ctx.strokeStyle = 'rgba(96, 165, 250, 0.45)';
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.moveTo(centerX, 0);
      ctx.lineTo(centerX, height);
      ctx.stroke();

      // Trigger line indicator
      const triggerY = centerY - (triggerLevel / 1.0) * (dy / 2);
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.35)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, triggerY);
      ctx.lineTo(width, triggerY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw trigger label
      ctx.fillStyle = '#eab308';
      ctx.font = '10px monospace';
      ctx.fillText(`TRIG: ${triggerLevel.toFixed(2)}V`, width - 90, triggerY - 4);

      if (isRunning) {
        phase += 0.04 * (100 / timeDiv) * zoom;
      }

      // Render Active Channels
      channels.forEach((ch) => {
        if (!ch.visible) return;

        ctx.strokeStyle = ch.color;
        ctx.shadowColor = ch.glowColor;
        ctx.shadowBlur = ch.id === selectedChannelId ? 10 : 4;
        ctx.lineWidth = ch.id === selectedChannelId ? 2.5 : 1.75;
        ctx.beginPath();

        const baselineY = centerY - ch.offset * dy;

        for (let px = 0; px < width; px++) {
          const t = (px / width) * 12 * zoom + phase;

          let val = 0;

          if (ch.id === 'ch1') {
            // TX Carrier PWM (10 kHz square wave modulated with payload bit)
            const carrierSquare = Math.sin(t * 3) >= 0 ? 1 : 0;
            const dataBit = Math.sin(t * 0.4) >= 0 ? 1 : 0;
            val = carrierSquare * dataBit;
          } else if (ch.id === 'ch2') {
            // Optical Intensity / Photocurrent (slight exponential rise/fall curve & analog attenuation)
            const carrierSquare = Math.sin(t * 3) >= 0 ? 1 : 0;
            const dataBit = Math.sin(t * 0.4) >= 0 ? 1 : 0;
            const target = carrierSquare * dataBit * 0.85;
            const noise = (Math.sin(t * 19) + Math.cos(t * 31)) * 0.03;
            val = target + noise;
          } else if (ch.id === 'ch3') {
            // LM358 Conditioned Analog (Filtered TIA output with slew rate rounding)
            const raw = Math.sin(t * 3) >= 0 ? 1 : 0;
            const dataBit = Math.sin(t * 0.4) >= 0 ? 1 : 0;
            const filtered = Math.tanh(Math.sin(t * 3) * 3) * 0.5 + 0.5;
            val = filtered * dataBit * 0.9;
          } else if (ch.id === 'ch4') {
            // RX ADC / Decoded Logic (Clean sliced square wave reconstructed)
            const carrierSquare = Math.sin(t * 3 - 0.2) >= 0 ? 1 : 0;
            const dataBit = Math.sin(t * 0.4 - 0.2) >= 0 ? 1 : 0;
            val = carrierSquare * dataBit;
          }

          // Scale voltage with channel vDiv
          const pixelY = baselineY - (val * (dy * 1.5)) / ch.vDiv;

          if (px === 0) {
            ctx.moveTo(px, pixelY);
          } else {
            ctx.lineTo(px, pixelY);
          }
        }

        ctx.stroke();
        ctx.shadowBlur = 0; // reset shadow
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, timeDiv, zoom, triggerLevel, channels, selectedChannelId]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070b14] overflow-hidden text-slate-100 font-sans">
      {/* Top Engineering Toolbar */}
      <div className="px-6 py-3 border-b border-[#1f293d] bg-[#0c1220]/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-wide text-white flex items-center gap-2">
              Digital Oscilloscope & Signal Analyzer
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-900/40 text-blue-300 border border-blue-700/50">
                4-Channel Mixed-Signal
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Real-time hardware waveform acquisition: Carrier PWM, Optical flux, LM358 TIA, and Reconstructed TTL logic.
            </p>
          </div>
        </div>

        {/* Global Scope Control Knobs */}
        <div className="flex items-center gap-2">
          {/* Time / Div Control */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f172a] border border-[#22324e]">
            <span className="text-[11px] font-mono text-slate-400">TIME/DIV:</span>
            <select
              value={timeDiv}
              onChange={(e) => setTimeDiv(Number(e.target.value))}
              className="bg-transparent text-xs font-mono text-cyan-400 focus:outline-none cursor-pointer"
            >
              <option value={50} className="bg-[#0f172a] text-slate-200">50 µs</option>
              <option value={100} className="bg-[#0f172a] text-slate-200">100 µs</option>
              <option value={200} className="bg-[#0f172a] text-slate-200">200 µs</option>
              <option value={500} className="bg-[#0f172a] text-slate-200">500 µs</option>
            </select>
          </div>

          {/* Zoom In / Out */}
          <div className="flex items-center rounded-lg bg-[#0f172a] border border-[#22324e] overflow-hidden">
            <button
              onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono px-2 text-slate-300">{zoom.toFixed(1)}x</span>
            <button
              onClick={() => setZoom((z) => Math.min(3.0, Number((z + 0.25).toFixed(2))))}
              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Run / Stop Freeze Button */}
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium tracking-wide transition border ${
              isRunning
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/50'
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>HOLD / FREEZE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>RUN SWEEP</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Scope Split Layout: Canvas Display + Right Channel & Hardware Inspector */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left / Center: Oscilloscope Canvas Screen & Measurement Strip */}
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* CRT / Graticule Display Container */}
          <div className="relative flex-1 rounded-xl border border-[#1f2f4e] shadow-2xl overflow-hidden bg-[#060a12] min-h-[360px]">
            <canvas ref={canvasRef} className="w-full h-full block cursor-crosshair" />

            {/* Top-Left Channel Status Badges on Canvas */}
            <div className="absolute top-3 left-4 flex flex-wrap gap-2 pointer-events-none">
              {channels.map((ch) => (
                <div
                  key={ch.id}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[11px] font-mono backdrop-blur-md transition ${
                    ch.visible ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{
                    backgroundColor: 'rgba(10, 16, 30, 0.75)',
                    borderColor: ch.color,
                    color: ch.color
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ch.color }}
                  />
                  <span>{ch.shortLabel}</span>
                  <span className="text-slate-400">({ch.vDiv}V/div)</span>
                </div>
              ))}
            </div>

            {/* Bottom Status Bar */}
            <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[11px] font-mono text-slate-400 pointer-events-none">
              <div>
                <span className="text-emerald-400 font-semibold">TRIG: AUTO</span> • TB: {timeDiv} µs/div • SMPL: 1.0 MSPS (DMA)
              </div>
              <div className="text-slate-400">
                ARM CORTEX-M3 HARDWARE CLOCK: <span className="text-blue-300">72.0 MHz</span>
              </div>
            </div>
          </div>

          {/* Channel Selector & Visibility Strip */}
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {channels.map((ch) => {
              const isSelected = ch.id === selectedChannelId;
              return (
                <div
                  key={ch.id}
                  onClick={() => {
                    setSelectedChannelId(ch.id);
                    const comp = DIGITAL_TWIN_COMPONENTS.find((c) => c.id === ch.componentId);
                    if (comp && onSelectComponent) onSelectComponent(comp);
                  }}
                  className={`p-3 rounded-lg border cursor-pointer transition flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#101b30] border-blue-500 shadow-lg shadow-blue-950/40'
                      : 'bg-[#0b101c] border-[#1d293d] hover:border-[#2e4060]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: ch.color }}
                      />
                      <span className="text-xs font-semibold text-white tracking-wide">
                        {ch.shortLabel}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleChannelVisibility(ch.id);
                      }}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        ch.visible
                          ? 'bg-blue-950/80 text-blue-300 border border-blue-700/60'
                          : 'bg-slate-900 text-slate-500 border border-slate-800'
                      }`}
                    >
                      {ch.visible ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                    <div>Vpp: <span className="text-slate-200">{ch.measurements.vpp}</span></div>
                    <div>Freq: <span className="text-slate-200">{ch.measurements.freq}</span></div>
                    <div>Duty: <span className="text-slate-200">{ch.measurements.duty}</span></div>
                    <div>V/Div: <span className="text-cyan-400">{ch.vDiv}V</span></div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-[#1b263b] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 truncate">{ch.sourcePin}</span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateChannelVDiv(ch.id, -0.2);
                        }}
                        className="px-1 text-[10px] bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                        title="Increase Sensitivity"
                      >
                        -
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateChannelVDiv(ch.id, 0.2);
                        }}
                        className="px-1 text-[10px] bg-slate-800 text-slate-300 rounded hover:bg-slate-700"
                        title="Decrease Sensitivity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Panel: Digital Twin Hardware Synchronization & Technical Analysis */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-[#1f293d] bg-[#090d18] flex flex-col p-4 overflow-y-auto">
          <div className="flex items-center justify-between pb-3 border-b border-[#1c283f] mb-4">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Hardware Trace Link
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-700/50">
              SYNCHRONIZED
            </span>
          </div>

          {linkedComponent ? (
            <div className="space-y-4">
              {/* Linked Physical Photo Card */}
              <div className="rounded-xl border border-[#21304d] bg-[#0d1424] overflow-hidden shadow-lg">
                <div className="h-32 bg-slate-900 relative">
                  <img
                    src={linkedComponent.physicalPhoto}
                    alt={linkedComponent.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-md text-[10px] font-mono text-cyan-300 border border-cyan-500/40">
                    REAL HARDWARE PHOTO
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-blue-950/90 text-[10px] font-mono text-blue-300 border border-blue-500/50">
                    {activeChannel.shortLabel}
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="text-sm font-semibold text-white tracking-wide">
                    {linkedComponent.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{linkedComponent.role}</p>

                  <div className="mt-3 p-2.5 rounded-lg bg-[#070b14] border border-[#1b263b] text-xs text-slate-300 leading-relaxed">
                    {linkedComponent.functionDescription}
                  </div>

                  <div className="mt-3 pt-3 border-t border-[#1b263b] flex items-center justify-between text-xs">
                    <span className="text-slate-400">Physical Pin / Node:</span>
                    <span className="font-mono text-cyan-300">{activeChannel.sourcePin}</span>
                  </div>
                </div>
              </div>

              {/* Hardware Spec Parameters Table */}
              <div className="rounded-xl border border-[#1f293d] bg-[#0c1220] p-3 space-y-2">
                <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider block">
                  Measured Electrical Specs
                </span>
                <div className="space-y-1.5">
                  {linkedComponent.specs.slice(0, 4).map((spec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-[11px] py-1 border-b border-[#182338] last:border-none"
                    >
                      <span className="text-slate-400">{spec.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-slate-200">{spec.value}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono">
                          {spec.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Navigation CTA to Hardware Twin */}
              {onNavigateToHardware && (
                <button
                  onClick={onNavigateToHardware}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium tracking-wide transition shadow-lg shadow-blue-900/30"
                >
                  <span>Inspect on Physical Breadboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-slate-500">
              Select a channel above to inspect its real hardware probe point.
            </div>
          )}

          {/* Quick Technical Viva Callout */}
          <div className="mt-auto pt-4">
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-500/20 text-xs text-blue-200 leading-relaxed">
              <div className="font-semibold text-blue-300 mb-1 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span>OOK Optical Modulation Note</span>
              </div>
              The 10 kHz square wave toggles the 2N2222 transistor into saturation (0.2V Vce), pulsing 14.5 mA forward current through the red LED without distorting rise-time edges.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Sun, 
  Moon, 
  Activity, 
  Sliders, 
  RotateCw, 
  AlertCircle, 
  CheckCircle2, 
  Zap,
  Gauge
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine,
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';

interface OpticalLinkViewProps {
  onServoChange?: (angle: number) => void;
}

export const OpticalLinkView: React.FC<OpticalLinkViewProps> = ({ onServoChange }) => {
  const [distanceCm, setDistanceCm] = useState(30);
  const [servoAngle, setServoAngle] = useState(0);
  const [ledState, setLedState] = useState(true);
  const [simOcclusion, setSimOcclusion] = useState(false);
  const [adcHistory, setAdcHistory] = useState<Array<{ time: number; adc: number; threshold: number }>>([]);
  const [currentAdc, setCurrentAdc] = useState(135.0);
  const [signalState, setSignalState] = useState('LIGHT DETECTED');

  // Periodically fetch live signal samples
  useEffect(() => {
    const fetchSignal = async () => {
      try {
        const res = await api.getSignalSamples(30);
        setCurrentAdc(res.current_adc);
        setSignalState(res.state);
        const mapped = res.samples.map((s: any, idx: number) => ({
          time: idx * 2,
          adc: s.adc_value,
          threshold: s.threshold,
        }));
        setAdcHistory(mapped);
      } catch (e) {
        console.error(e);
      }
    };

    fetchSignal();
    const interval = setInterval(fetchSignal, 500);
    return () => clearInterval(interval);
  }, []);

  const handleServoChange = async (angle: number) => {
    setServoAngle(angle);
    if (onServoChange) onServoChange(angle);
    try {
      const res = await api.controlOptical({
        distance_cm: distanceCm,
        servo_angle_deg: angle,
        led_state: ledState,
        simulate_occlusion: simOcclusion,
      });
      setCurrentAdc(res.adc_count);
      setSignalState(res.signal_state);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleLed = async () => {
    const next = !ledState;
    setLedState(next);
    try {
      const res = await api.controlOptical({
        distance_cm: distanceCm,
        servo_angle_deg: servoAngle,
        led_state: next,
        simulate_occlusion: simOcclusion,
      });
      setCurrentAdc(res.adc_count);
      setSignalState(res.signal_state);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <Radio className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h3 className="text-base font-bold text-white">Line-of-Sight Optical Link & Receiver Signal</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Free-space optical propagation between High-Intensity LED (TX) and BPW34 Photodiode / LM358 TIA (RX)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            SIMULATION PARAMETERS
          </span>
        </div>
      </div>

      {/* Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Column */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-5">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Optical Link Controls
          </h4>

          {/* LED Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-3">
              {ledState ? (
                <Sun className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              ) : (
                <Moon className="w-5 h-5 text-slate-500" />
              )}
              <div>
                <span className="text-sm font-semibold text-white block">Transmitter LED</span>
                <span className="text-xs text-slate-400">GPIO 23 switched drive</span>
              </div>
            </div>
            <button
              onClick={toggleLed}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                ledState ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {ledState ? 'EMITTING (ON)' : 'MUTED (OFF)'}
            </button>
          </div>

          {/* Servo Angle Slider */}
          <div className="space-y-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300">SG90 Servo Flap Angle</span>
              <span className="font-mono text-cyan-400 font-bold">{servoAngle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="180"
              value={servoAngle}
              onChange={(e) => handleServoChange(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0° (Clear)</span>
              <span className="text-rose-400">90° (Occluding)</span>
              <span>180° (Clear)</span>
            </div>
          </div>

          {/* Preset Obstruction Buttons */}
          <div className="space-y-2">
            <span className="text-xs text-slate-400 font-medium">Occlusion Profile Quick Presets:</span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleServoChange(0)}
                className={`py-2 px-2 rounded-lg text-xs font-medium border transition text-center ${
                  servoAngle === 0 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                Clear Link (0°)
              </button>
              <button
                onClick={() => handleServoChange(50)}
                className={`py-2 px-2 rounded-lg text-xs font-medium border transition text-center ${
                  servoAngle === 50 
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                P1 (Edge: 50°)
              </button>
              <button
                onClick={() => handleServoChange(90)}
                className={`py-2 px-2 rounded-lg text-xs font-medium border transition text-center ${
                  servoAngle === 90 
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                P2 (Full: 90°)
              </button>
            </div>
          </div>

          {/* Paper Reported Calibrations Callout */}
          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1.5 font-mono">
            <span className="text-cyan-300 font-bold block">Paper-Reported Calibration Reference:</span>
            <div className="flex justify-between">
              <span>Dark level:</span>
              <span className="text-slate-300">~0–5 ADC counts</span>
            </div>
            <div className="flex justify-between">
              <span>Illuminated:</span>
              <span className="text-slate-300">~95–176 ADC counts</span>
            </div>
            <div className="flex justify-between">
              <span>Decision Threshold:</span>
              <span className="text-amber-400 font-bold">~50 ADC counts</span>
            </div>
          </div>
        </div>

        {/* Real-Time Waveform & State Column */}
        <div className="lg:col-span-2 bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-slate-200">Real-Time Optical ADC Waveform (ESP32 GPIO 34)</h4>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-slate-400 font-mono">Current:</span>
                <span className="text-sm font-mono font-bold text-white">{currentAdc.toFixed(1)}</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                signalState === 'LIGHT DETECTED'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : signalState === 'BLOCKED'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {signalState}
              </span>
            </div>
          </div>

          {/* Recharts Live Waveform */}
          <div className="w-full h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={adcHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="time" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickFormatter={(v) => `${v}ms`}
                />
                <YAxis 
                  domain={[0, 200]} 
                  stroke="#64748b" 
                  fontSize={11} 
                  label={{ value: 'ADC Counts (0-180)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <ReferenceLine 
                  y={50} 
                  stroke="#f59e0b" 
                  strokeDasharray="4 4" 
                  label={{ value: 'Slicing Threshold (50)', fill: '#f59e0b', fontSize: 10, position: 'right' }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="adc" 
                  stroke="#38bdf8" 
                  strokeWidth={2.5} 
                  dot={false} 
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
              <span>Received ADC Counts</span>
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ml-3" />
              <span>Operating Threshold (~50 counts)</span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Mid-bit window: 450–550 µs</span>
          </div>
        </div>
      </div>
    </div>
  );
};

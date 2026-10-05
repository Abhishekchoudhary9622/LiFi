import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Usb, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  ShieldCheck,
  Cpu,
  Power
} from 'lucide-react';
import { HardwareStatus } from '../types/semlifi';
import { api } from '../services/api';

interface SystemSettingsViewProps {
  status: HardwareStatus | null;
  onRefreshStatus: () => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ status, onRefreshStatus }) => {
  const [ports, setPorts] = useState<any[]>([]);
  const [selectedPort, setSelectedPort] = useState<string>('');
  const [baudrate, setBaudrate] = useState<number>(115200);
  const [connecting, setConnecting] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [message, setMessage] = useState<string>('');

  const loadPorts = async () => {
    try {
      const data = await api.listPorts();
      setPorts(data);
      if (data.length > 0 && !selectedPort) {
        setSelectedPort(data[0].port);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPorts();
  }, []);

  const handleConnect = async () => {
    if (!selectedPort) return;
    setConnecting(true);
    setMessage('');
    try {
      const res = await api.connectHardware(selectedPort, baudrate);
      setMessage(res.message);
      onRefreshStatus();
    } catch (e: any) {
      setMessage(`Connection failed: ${e.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await api.disconnectHardware();
      setMessage('Hardware disconnected. Reverted to SIMULATION mode.');
      onRefreshStatus();
    } catch (e: any) {
      setMessage(`Error: ${e.message}`);
    }
  };

  const handleAutoDetect = async () => {
    setAutoDetecting(true);
    setMessage('');
    try {
      const res = await api.autoDetectHardware();
      if (res.detected) {
        setSelectedPort(res.port);
        setMessage(`Detected ESP32 on port ${res.port}. Connected: ${res.connected}`);
      } else {
        setMessage(res.message);
      }
      onRefreshStatus();
    } catch (e: any) {
      setMessage(`Auto-detect failed: ${e.message}`);
    } finally {
      setAutoDetecting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">System Settings & Physical Serial Abstraction Layer</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            PySerial hardware interface, ESP32 COM port discovery, and channel calibration parameters
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
            status?.is_connected
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
          }`}>
            {status?.mode || 'SIMULATION'}
          </span>
        </div>
      </div>

      {/* Safety Policy Box */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-white">Hardware Connection Honesty Guarantee</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          The software will <strong>NEVER</strong> report <code className="text-emerald-300">&quot;Hardware connected&quot;</code> or <code className="text-emerald-300">&quot;Measured&quot;</code> unless a physical handshake has been established with an ESP32 over serial. When running without an attached physical testbed, all readings are explicitly branded with the badge: <code className="text-amber-300 font-mono">SIMULATION</code>.
        </p>
      </div>

      {/* Serial Interface Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* COM Port Panel */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Usb className="w-4 h-4 text-cyan-400" />
              <h4 className="text-sm font-semibold text-white">ESP32 Serial Port Discovery</h4>
            </div>
            <button
              onClick={loadPorts}
              className="p-1 rounded text-slate-400 hover:text-white transition"
              title="Rescan COM Ports"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Select Available COM Port:</label>
              {ports.length > 0 ? (
                <select
                  value={selectedPort}
                  onChange={(e) => setSelectedPort(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none"
                >
                  {ports.map((p) => (
                    <option key={p.port} value={p.port}>
                      {p.port} — {p.description} {p.is_likely_esp32 ? '★ [ESP32 Candidate]' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-slate-500 font-mono">
                  No USB serial ports detected. Connect ESP32 via USB and click Rescan.
                </div>
              )}
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Baudrate:</label>
              <select
                value={baudrate}
                onChange={(e) => setBaudrate(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none"
              >
                <option value={115200}>115,200 baud (Standard SemLiFi Firmware)</option>
                <option value={9600}>9,600 baud</option>
                <option value={57600}>57,600 baud</option>
                <option value={230400}>230,400 baud</option>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={handleAutoDetect}
                disabled={autoDetecting}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition"
              >
                {autoDetecting ? 'Scanning Ports...' : 'Auto-Detect ESP32'}
              </button>

              {status?.is_connected ? (
                <button
                  onClick={handleDisconnect}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>Disconnect Hardware</span>
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting || ports.length === 0}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition shadow-lg disabled:opacity-50"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{connecting ? 'Connecting...' : 'Connect to Port'}</span>
                </button>
              )}
            </div>

            {message && (
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono text-amber-300">
                {message}
              </div>
            )}
          </div>
        </div>

        {/* Current State Diagnostic Box */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono border-b border-slate-800 pb-3">
            Hardware Abstraction Layer (HAL) State
          </h4>

          <div className="space-y-3 font-mono text-xs">
            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-slate-400">Current Operating Mode:</span>
              <span className="text-white font-bold">{status?.mode}</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-slate-400">Transmitter Node (TX):</span>
              <span className="text-emerald-400 font-bold">{status?.tx_node_status} (GPIO 23)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-slate-400">Receiver Node (RX):</span>
              <span className="text-emerald-400 font-bold">{status?.rx_node_status} (GPIO 34 ADC)</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-slate-400">Operating Slicing Threshold:</span>
              <span className="text-amber-400 font-bold">{status?.operating_threshold} counts</span>
            </div>
            <div className="flex justify-between p-2.5 bg-slate-900/60 rounded border border-slate-800">
              <span className="text-slate-400">Active COM Port:</span>
              <span className="text-cyan-300">{status?.port || 'None (Simulation Active)'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

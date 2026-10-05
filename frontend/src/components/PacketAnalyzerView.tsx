import React, { useState, useEffect } from 'react';
import { 
  Binary, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Code2, 
  Sparkles, 
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';
import { SemLiFiPacket } from '../types/semlifi';
import { api } from '../services/api';

export const PacketAnalyzerView: React.FC = () => {
  const [payloadText, setPayloadText] = useState('TEMP=27.4,HUM=61,MOTOR=ON');
  const [sequenceId, setSequenceId] = useState(1);
  const [packet, setPacket] = useState<SemLiFiPacket | null>(null);
  const [modulationData, setModulationData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const samplePayloads = [
    'TEMP=27.4,HUM=61,MOTOR=ON',
    'DEVICE=04,TEMP=26.8,STATUS=ACTIVE',
    'VOLT=3.72,CURR=0.42,STATE=OK',
    'TEMP=34.0,HUM=60,MOTOR=ON',
  ];

  const handleEncode = async () => {
    setLoading(true);
    try {
      const pkt = await api.encodePacket(payloadText, sequenceId);
      setPacket(pkt);
      const mod = await api.simulateModulation(payloadText, sequenceId);
      setModulationData(mod);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleEncode();
  }, [payloadText, sequenceId]);

  return (
    <div className="space-y-6">
      {/* Top Protocol Specification Banner */}
      <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Binary className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">SemLiFi Frame Layout & Manchester / OOK Analyzer</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Frame format: <code className="text-cyan-300 font-mono">[0xAA 0x55][LEN][SEQ][PAYLOAD][CRC8][\r\n]</code> | CRC Polynomial: Dallas/Maxim 0x31
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Raw Rate: 1000 bps
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
            Bit Period: 1000 µs
          </span>
        </div>
      </div>

      {/* Frame Field Breakdown Visualizer */}
      {packet && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Structured Frame Byte Segments
          </h4>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {/* Sync Word */}
            <div className="p-3 bg-blue-950/40 rounded-lg border border-blue-500/40 text-center">
              <span className="text-[10px] font-mono text-blue-400 font-bold block">SYNC WORD (2B)</span>
              <span className="text-sm font-mono font-extrabold text-blue-200 mt-1 block">0xAA 0x55</span>
              <span className="text-[10px] text-slate-500">Preamble Lock</span>
            </div>

            {/* LEN */}
            <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-500/40 text-center">
              <span className="text-[10px] font-mono text-indigo-400 font-bold block">LEN (1B)</span>
              <span className="text-sm font-mono font-extrabold text-indigo-200 mt-1 block">
                {packet.length} bytes
              </span>
              <span className="text-[10px] text-slate-500 font-mono">0x{packet.length.toString(16).padStart(2, '0').toUpperCase()}</span>
            </div>

            {/* SEQ ID */}
            <div className="p-3 bg-purple-950/40 rounded-lg border border-purple-500/40 text-center">
              <span className="text-[10px] font-mono text-purple-400 font-bold block">SEQ ID (1B)</span>
              <span className="text-sm font-mono font-extrabold text-purple-200 mt-1 block">
                #{packet.sequence_id}
              </span>
              <span className="text-[10px] text-slate-500">Selective ARQ</span>
            </div>

            {/* PAYLOAD */}
            <div className="md:col-span-2 p-3 bg-cyan-950/40 rounded-lg border border-cyan-500/40 text-center">
              <span className="text-[10px] font-mono text-cyan-400 font-bold block">PAYLOAD (VARIABLE)</span>
              <span className="text-xs font-mono font-semibold text-cyan-100 mt-1 block truncate">
                {packet.payload}
              </span>
              <span className="text-[10px] text-slate-500">Structured Telemetry</span>
            </div>

            {/* CRC-8 Dallas */}
            <div className={`p-3 rounded-lg border text-center ${
              packet.crc_valid 
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' 
                : 'bg-rose-950/40 border-rose-500/40 text-rose-200'
            }`}>
              <span className="text-[10px] font-mono font-bold block">CRC-8 (1B)</span>
              <span className="text-sm font-mono font-extrabold mt-1 block">
                0x{packet.crc.toString(16).padStart(2, '0').toUpperCase()}
              </span>
              <span className="text-[10px] font-mono">{packet.crc_valid ? 'VALID (MATCH)' : 'CRC ERROR'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Editor & Hex Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Transmitter Input Panel */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
            Transmitter Telemetry Input
          </h4>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Payload String (ASCII):</label>
            <input
              type="text"
              value={payloadText}
              onChange={(e) => setPayloadText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-32">
              <label className="text-xs text-slate-300 font-medium block mb-1">Sequence ID:</label>
              <input
                type="number"
                min="1"
                max="255"
                value={sequenceId}
                onChange={(e) => setSequenceId(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg font-mono text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              onClick={() => setSequenceId((prev) => (prev % 255) + 1)}
              className="mt-6 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 rounded-lg border border-slate-700 transition"
            >
              Increment SEQ
            </button>
          </div>

          <div className="space-y-2 pt-2">
            <span className="text-xs text-slate-400 font-medium block">Sample Research Payloads:</span>
            <div className="flex flex-wrap gap-2">
              {samplePayloads.map((samp) => (
                <button
                  key={samp}
                  onClick={() => setPayloadText(samp)}
                  className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-[11px] font-mono text-slate-300 rounded border border-slate-800 transition"
                >
                  {samp}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Raw Bytes & Hex Dump */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
              Raw Byte Stream & Hex Dump
            </h4>
            <span className="text-xs font-mono text-cyan-400">Total: {packet?.raw_bytes.length || 0} Bytes</span>
          </div>

          {packet && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs leading-relaxed text-amber-300 break-all select-all">
                {packet.raw_hex}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Dallas 0x31 CRC:</span>
                  <span className="text-emerald-400 font-bold">0x{packet.crc.toString(16).padStart(2, '0').toUpperCase()}</span>
                </div>
                <div className="p-2.5 bg-slate-900/60 rounded border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Terminator:</span>
                  <span className="text-slate-300 font-bold">\r \n (0x0D 0x0A)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Manchester & OOK Waveform Preview */}
      {modulationData && (
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                Manchester IEEE 802.3 Chips & OOK Modulated Waveform
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Bit &apos;0&apos; = Low-to-High (01) | Bit &apos;1&apos; = High-to-Low (10) | Chip duration: 500 µs (2 chips = 1000 µs bit)
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 bg-blue-500/10 text-blue-300 border border-blue-500/30 rounded">
              First 64 Chips Preview
            </span>
          </div>

          <div className="flex flex-wrap gap-1 p-3 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-xs">
            {modulationData.chips_preview.map((chip: number, idx: number) => (
              <span
                key={idx}
                className={`w-6 h-6 flex items-center justify-center rounded text-[11px] font-bold ${
                  chip === 1 
                    ? 'bg-amber-500 text-slate-950 shadow-sm' 
                    : 'bg-slate-800 text-slate-400'
                }`}
                title={`Chip #${idx}: ${chip} (${chip === 1 ? 'LED ON' : 'LED OFF'})`}
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

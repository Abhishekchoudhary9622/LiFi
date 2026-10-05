// SemLiFi Circuits - Real-Time Simulation Engine & Educational Hardware Physics
import { CircuitComponent, Wire, SimulationMetrics, SimulationEvent, LiFiChannelConfig } from '../types/circuit';

export const DEFAULT_LIFI_CONFIG: LiFiChannelConfig = {
  txPowerMw: 3.5,
  wavelengthNm: 850, // NIR LED
  modulation: 'OOK',
  dataRateKbps: 115.2,
  distanceM: 1.2,
  ambientLux: 250,
  opticalNoisePercent: 2.5,
  photodiodeResponsivity: 0.62, // A/W at 850nm (Si PIN)
  receiverGain: 82000, // Transimpedance Gain (V/A)
  channelBandwidthMhz: 10
};

export function generatePrbsStream(seed = 0x5a): string {
  let reg = seed & 0x7f;
  let result = '';
  for (let i = 0; i < 64; i++) {
    const bit = (reg & 1) ^ ((reg >> 1) & 1);
    result += (reg & 1).toString();
    reg = (reg >> 1) | (bit << 6);
  }
  return result;
}

export class SimulationEngine {
  private config: LiFiChannelConfig;
  private txStream: string;
  private tickCounter = 0;
  private eventHistory: SimulationEvent[] = [];

  constructor(initialConfig: LiFiChannelConfig = DEFAULT_LIFI_CONFIG) {
    this.config = { ...initialConfig };
    this.txStream = generatePrbsStream();
  }

  public setConfig(newConfig: Partial<LiFiChannelConfig>) {
    this.config = { ...this.config, ...newConfig };
  }

  public getConfig(): LiFiChannelConfig {
    return { ...this.config };
  }

  public step(
    components: CircuitComponent[],
    wires: Wire[],
    running: boolean,
    prevMetrics?: SimulationMetrics
  ): SimulationMetrics {
    this.tickCounter++;
    const elapsedSec = this.tickCounter * 0.1;
    const formatTime = (sec: number) => {
      const m = Math.floor(sec / 60).toString().padStart(2, '0');
      const s = (sec % 60).toFixed(2).padStart(5, '0');
      return `${m}:${s}`;
    };
    const timeStr = formatTime(elapsedSec);

    // 1. "What If?" Fault Analysis
    let whatIfWarning: string | null = null;
    const hasResistor = components.some(c => c.typeId === 'resistor');
    const hasGndWire = wires.some(w => w.fromPinId.includes('gnd') || w.toPinId.includes('gnd'));
    const hasOptLink = wires.some(w => w.fromPinId === 'opt_out' || w.toPinId === 'opt_in' || w.id === 'w_optical_channel');

    if (!hasResistor && components.some(c => c.typeId === 'led')) {
      whatIfWarning = 'WHAT CHANGED? Resistor R1 removed. Base current exceeds safe saturation limits. ⚠ Possible 2N2222/LED overcurrent!';
    } else if (!hasGndWire && wires.length > 2) {
      whatIfWarning = 'GROUND LOST: The circuit no longer has a common 0V return path. Current cannot flow.';
    } else if (!hasOptLink && components.some(c => c.typeId === 'led')) {
      whatIfWarning = 'OPTICAL LINK LOST: Free-space light beam disconnected or blocked. Photodiode receiving 0 optical power.';
    }

    if (!running || (whatIfWarning && whatIfWarning.includes('GROUND LOST'))) {
      return {
        running: false,
        timestamp: Date.now(),
        elapsedSec,
        vccVoltage: 0,
        totalCurrentMa: 0,
        totalPowerMw: 0,
        opticalPowerMw: 0,
        snrDb: 0,
        ber: 0,
        dataRateKbps: this.config.dataRateKbps,
        linkDistanceM: this.config.distanceM,
        ambientLightLux: this.config.ambientLux,
        opticalNoisePercent: this.config.opticalNoisePercent,
        ledForwardVoltage: 0,
        ledCurrentMa: 0,
        transistorIbMa: 0,
        transistorIcMa: 0,
        photodiodeCurrentUa: 0,
        adcSampleVoltage: 0,
        adcRaw12Bit: 0,
        txBits: '1011010011010110',
        rxBits: '1011010011010110',
        errorIndices: [],
        channelWaveform: prevMetrics?.channelWaveform || [],
        logicAnalyzer: prevMetrics?.logicAnalyzer || [],
        events: this.eventHistory.slice(-15),
        whatIfWarning
      };
    }

    // 2. Power Supply Voltage & Current Calculation
    const vccVoltage = 3.30 + Math.sin(this.tickCounter * 0.15) * 0.012;
    const resistor = components.find(c => c.typeId === 'resistor');
    const rVal = (resistor?.properties.resistance as number) || (hasResistor ? 220 : 15);
    const ledVf = 2.05;

    // Transistor 2N2222 drive calculations
    const vBe = 0.72;
    const transistorIbMa = Math.max(0, ((vccVoltage - vBe) / rVal) * 1000);
    const ledCurrentMa = Math.min(22.0, Math.max(0, transistorIbMa * 1.5 + 4.0));
    const transistorIcMa = ledCurrentMa;

    // 3. Optical Link Calculations (Lambertian Free-space propagation)
    const distance = Math.max(0.1, this.config.distanceM);
    const pathLoss = hasOptLink ? 1 / (distance * distance * 1.8 + 0.2) : 0.001;
    const opticalPowerMw = Number((this.config.txPowerMw * (ledCurrentMa / 20.0)).toFixed(2));
    const rxOpticalPowerUw = Math.max(0.01, opticalPowerMw * pathLoss * 15.0);

    const photodiodeCurrentUa = Number((rxOpticalPowerUw * this.config.photodiodeResponsivity).toFixed(2));
    const ambientNoisePowerUw = (this.config.ambientLux / 1000) * (this.config.opticalNoisePercent / 10);
    const noiseSigmaUa = Math.sqrt(photodiodeCurrentUa * 0.08 + ambientNoisePowerUw * 0.12 + 0.05);

    const transimpedanceVolts = (photodiodeCurrentUa * 1e-6 * this.config.receiverGain);
    const adcSampleVoltage = Number(Math.min(3.3, Math.max(0, transimpedanceVolts + (Math.random() - 0.5) * 0.08)).toFixed(3));
    const adcRaw12Bit = Math.round((adcSampleVoltage / 3.3) * 4095);

    // SNR and BER
    const snrLinear = Math.max(1.1, (photodiodeCurrentUa * photodiodeCurrentUa) / (noiseSigmaUa * noiseSigmaUa * 2.5));
    const snrDb = Number((10 * Math.log10(snrLinear)).toFixed(2));

    const qFactor = Math.sqrt(snrLinear) * 0.5;
    let berVal = 0.5 * Math.exp(-0.5 * qFactor * qFactor) / (Math.sqrt(2 * Math.PI) * Math.max(0.1, qFactor));
    if (isNaN(berVal) || berVal < 0.00001) berVal = 0.0002;
    if (berVal > 0.45 || !hasOptLink) berVal = 0.42;
    const ber = Number(berVal.toFixed(5));

    // 4. Live Bitstream comparison
    const streamLen = 20;
    const streamOffset = (this.tickCounter * 2) % (this.txStream.length - streamLen);
    const txBits = this.txStream.slice(streamOffset, streamOffset + streamLen);
    const errorIndices: number[] = [];
    let rxBits = '';

    for (let i = 0; i < txBits.length; i++) {
      const bit = txBits[i];
      if (Math.random() < ber * 6.0) {
        rxBits += bit === '1' ? '0' : '1';
        errorIndices.push(i);
      } else {
        rxBits += bit;
      }
    }

    // 5. Append Real-Time Simulation Events
    if (this.tickCounter % 3 === 0) {
      const currentBit = txBits[0];
      this.eventHistory.push({
        timestamp: timeStr,
        message: `PAx PWM ${currentBit === '1' ? 'HIGH (3.3V)' : 'LOW (0V)'} | 2N2222 I_c = ${ledCurrentMa.toFixed(1)} mA | Optical ${opticalPowerMw} mW`,
        level: 'info'
      });
      if (this.tickCounter % 6 === 0) {
        this.eventHistory.push({
          timestamp: timeStr,
          message: `BPW34 detected ${photodiodeCurrentUa} µA | LM358 OUT = ${adcSampleVoltage}V | ADC1 = ${adcRaw12Bit} | Bit Rx = ${rxBits[0]}`,
          level: 'success'
        });
      }
      if (this.eventHistory.length > 50) this.eventHistory.shift();
    }

    // 6. Waveforms (Oscilloscope Channels)
    const waveform = [];
    const logicWave = [];
    for (let i = 0; i < 40; i++) {
      const bitIdx = Math.floor((i + this.tickCounter * 4) / 4) % txBits.length;
      const bitVal = txBits[bitIdx] === '1' ? 1 : 0;
      const rxBitVal = rxBits[bitIdx] === '1' ? 1 : 0;

      waveform.push({
        time: i,
        pwmTx: bitVal ? 3.3 : 0.0,
        ledCurrent: bitVal ? Number((ledCurrentMa + (Math.random() - 0.5) * 0.3).toFixed(2)) : 0.05,
        opticalPower: bitVal ? opticalPowerMw : 0.05,
        photodiodeOut: bitVal ? Number((photodiodeCurrentUa * 0.1).toFixed(2)) : 0.02,
        amplifierOut: Math.max(0, Math.min(3.3, (rxBitVal ? adcSampleVoltage : 0.2) + (Math.random() - 0.5) * 0.05)),
        adcInput: Math.max(0, Math.min(3.3, (rxBitVal ? adcSampleVoltage : 0.2))),
        recoveredBit: rxBitVal,
        ch1: bitVal ? 3.3 : 0.0,
        ch2: bitVal ? Number((ledCurrentMa + (Math.random() - 0.5) * 0.3).toFixed(2)) : 0.05,
        ch3: bitVal ? Number((photodiodeCurrentUa * 0.1).toFixed(2)) : 0.02,
        ch4: Math.max(0, Math.min(3.3, (rxBitVal ? adcSampleVoltage : 0.2)))
      });

      logicWave.push({
        time: i,
        pa0: bitVal,
        adcReady: (i % 4 === 2) ? 1 : 0,
        bitOut: rxBitVal
      });
    }

    const totalCurrentMa = Number((112 + ledCurrentMa).toFixed(1));
    const totalPowerMw = Number((vccVoltage * totalCurrentMa).toFixed(1));

    return {
      running: true,
      timestamp: Date.now(),
      elapsedSec,
      vccVoltage: Number(vccVoltage.toFixed(2)),
      totalCurrentMa,
      totalPowerMw,
      opticalPowerMw,
      snrDb,
      ber,
      dataRateKbps: this.config.dataRateKbps,
      linkDistanceM: this.config.distanceM,
      ambientLightLux: this.config.ambientLux,
      opticalNoisePercent: this.config.opticalNoisePercent,
      ledForwardVoltage: ledVf,
      ledCurrentMa: Number(ledCurrentMa.toFixed(2)),
      transistorIbMa: Number(transistorIbMa.toFixed(2)),
      transistorIcMa: Number(transistorIcMa.toFixed(2)),
      photodiodeCurrentUa,
      adcSampleVoltage,
      adcRaw12Bit,
      txBits,
      rxBits,
      errorIndices,
      channelWaveform: waveform,
      logicAnalyzer: logicWave,
      events: this.eventHistory.slice(-15),
      whatIfWarning
    };
  }
}

// SemLiFi Circuits - Core Type Definitions & Digital Twin Data Model

export type ComponentCategory =
  | 'basic'
  | 'power'
  | 'breadboards'
  | 'microcontrollers'
  | 'mcu'
  | 'discrete'
  | 'input'
  | 'output'
  | 'sensors'
  | 'lifi'
  | 'instruments';

export type ViewMode = 'hardware' | 'physical' | 'schematic' | 'simulation' | 'waveforms' | 'presentation' | 'signal_flow';

export type SimulationState = 'STOPPED' | 'RUNNING' | 'PAUSED' | 'ERROR';

export type VerificationStatus = 'VERIFIED' | 'NOT VERIFIED' | 'ESTIMATED' | 'SIMULATION MODEL NOT IMPLEMENTED';

export interface PinDefinition {
  id: string;
  name: string;
  type: 'power' | 'ground' | 'gpio' | 'adc' | 'pwm' | 'uart' | 'passive' | 'optical' | 'signal' | 'base' | 'collector' | 'emitter';
  direction?: 'input' | 'output' | 'bidirectional' | 'passive';
  voltageRange?: string; // e.g. "0 - 3.3V"
  currentLimit?: string; // e.g. "25 mA"
  x: number; // offset relative to component origin in px
  y: number; // offset relative to component origin in px
  voltage?: number;
  description?: string;
  connectedHoleId?: string; // e.g., 'E15'
  netId?: string;
  purpose?: string;
  isPlaceholder?: boolean; // For unverified physical pins e.g. PAx
  mode?: 'INPUT' | 'OUTPUT' | 'ANALOG' | 'PWM' | 'UART' | 'SPI' | 'I2C' | 'TIMER' | 'PASSIVE';
  state?: 'HIGH' | 'LOW' | 'ANALOG' | 'FLOATING' | 'PWM';
  connectedNet?: string;
  verificationStatus?: VerificationStatus;
}

export interface EducationalInfo {
  whatIsIt: string;
  whatDoesItDo: string;
  whyIsItUsed: string;
  howDoesItWork: string;
  whereIsItConnected: string;
  whatHappensIfRemoved: string;
  formula?: string;
  datasheet?: {
    partNumber: string;
    manufacturer: string;
    maxVoltage: string;
    maxCurrent: string;
    operatingTemp: string;
    packageType: string;
    keyFeatures: string[];
  };
  teacherExplanation?: {
    summary: string;
    talkingPoints: string[];
    commonStudentQuestions: { q: string; a: string }[];
  };
}

export interface CircuitComponent {
  id: string;
  typeId: string;
  name: string;
  category: ComponentCategory;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  pins: PinDefinition[];
  properties: Record<string, any>;
  breadboardMounted?: boolean;
  mountedHoles?: { pinId: string; holeId: string }[];
  educationalInfo?: EducationalInfo;
  isPlaceholderWiring?: boolean;
}

export interface BreadboardHole {
  id: string; // e.g. 'A1', 'E15', 'F1', 'J30', 'TP_1', 'TN_1', 'BP_1', 'BN_1'
  row: number; // 1 to 30
  col: string; // '+', '-', 'a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', '+2', '-2'
  x: number;
  y: number;
  stripId: string; // e.g. 'STRIP_ROW_15_LEFT', 'STRIP_TOP_POS'
  connectedPinIds: string[];
  netId?: string;
  voltage?: number;
}

export interface Wire {
  id: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  color: string; // hex code
  active?: boolean;
  voltage?: number;
  current?: number;
  signalType?: 'power' | 'ground' | 'pwm' | 'analog' | 'optical' | 'digital';
  purpose?: string;
  isVerified?: boolean; // Physical connection verification flag
  waypoints?: { x: number; y: number }[];
}

export interface ElectricalNet {
  id: string;
  name: string;
  color: string;
  voltage: number;
  isPower?: boolean;
  isGround?: boolean;
  isOptical?: boolean;
  nodes: { componentId: string; pinId: string; label: string }[];
}

export interface SimulationEvent {
  timestamp: string; // e.g. "00:01.04"
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface SimulationMetrics {
  running: boolean;
  timestamp: number;
  elapsedSec: number;
  vccVoltage: number;
  totalCurrentMa: number;
  totalPowerMw: number;
  opticalPowerMw: number;
  snrDb: number;
  ber: number;
  dataRateKbps: number;
  linkDistanceM: number;
  ambientLightLux: number;
  opticalNoisePercent: number;
  ledForwardVoltage: number;
  ledCurrentMa: number;
  transistorIbMa: number;
  transistorIcMa: number;
  photodiodeCurrentUa: number;
  adcSampleVoltage: number;
  adcRaw12Bit: number; // 0 - 4095
  txBits: string;
  rxBits: string;
  errorIndices: number[];
  channelWaveform: {
    time: number;
    pwmTx: number;
    ledCurrent: number;
    opticalPower: number;
    photodiodeOut: number;
    amplifierOut: number;
    adcInput: number;
    recoveredBit: number;
    ch1: number;
    ch2: number;
    ch3: number;
    ch4: number;
  }[];
  logicAnalyzer: { time: number; pa0: number; adcReady: number; bitOut: number }[];
  events: SimulationEvent[];
  whatIfWarning?: string | null;
}

export interface LiFiChannelConfig {
  txPowerMw: number;
  wavelengthNm: number;
  modulation: 'OOK' | 'Manchester' | 'PWM' | 'PPM';
  dataRateKbps: number;
  distanceM: number;
  ambientLux: number;
  opticalNoisePercent: number;
  photodiodeResponsivity: number;
  receiverGain: number;
  channelBandwidthMhz: number;
}

export interface ValidationRule {
  id: string;
  title: string;
  description: string;
  status: 'pass' | 'warning' | 'error';
  recommendation?: string;
  relatedComponentIds?: string[];
  relatedPinIds?: string[];
}

export interface ValidationResult {
  valid: boolean;
  score: number;
  passedChecks: number;
  totalChecks: number;
  rules: ValidationRule[];
}

export interface HardwareMapping {
  virtualComponentId: string;
  virtualPinId: string;
  physicalComponent: string;
  physicalPin: string; // e.g. "PAx (Unconfirmed)" or "PA0"
  connectionDescription: string;
  status: 'verified' | 'placeholder' | 'mismatch';
}

export interface StarterCircuit {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  components: CircuitComponent[];
  wires: Wire[];
}

export interface GuidedExplanationStep {
  stepNumber: number;
  title: string;
  componentIds: string[];
  wireIds?: string[];
  pinIds?: string[];
  summary: string;
  technicalDetails: string;
  whatToSayToTeacher: string;
}

export type ActiveSection =
  | 'dashboard'
  | 'build'
  | 'schematic'
  | 'lifi'
  | 'monitor'
  | 'validation'
  | 'report'
  | 'settings';

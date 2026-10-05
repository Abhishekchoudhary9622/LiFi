import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  Square,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Settings,
  Sliders,
  Activity,
  Zap,
  Radio,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Layers,
  Search,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Info,
  Volume2,
  VolumeX,
  FileCode,
  Sparkles,
  ArrowRight,
  HelpCircle,
  X,
  Check,
  Copy,
  Camera,
  Move,
  Crosshair,
  Tag,
  BookOpen,
  Sun,
  Moon
} from 'lucide-react';
import { FullHardwareSetupStudio } from './FullHardwareSetupStudio';
import { MessageTransmissionStudio } from './MessageTransmissionStudio';
import { SemLiFiExecutionFlowModal } from './SemLiFiExecutionFlowModal';
import { SemLiFiDocumentationHub } from './SemLiFiDocumentationHub';

export interface SemLiFiVirtualLabProps {
  projectName?: string;
  onOpenReport?: () => void;
}

// ---------------------------------------------------------------------------
// DATA MODELS FOR COMPONENT LIBRARY & INSPECTOR
// ---------------------------------------------------------------------------
export interface ComponentLibraryItem {
  id: string;
  name: string;
  category: 'mcu' | 'optical' | 'drivers' | 'analog' | 'mechanical' | 'comm' | 'semantic' | 'wires';
  categoryLabel: string;
  type: string;
  description: string;
  operatingVoltage: string;
  gpioPins?: number;
  clockSpeed?: string;
  wifiBle?: string;
  thumbnail: string;
  specs: { label: string; value: string }[];
  commonPins: { pin: string; name: string; role: string; color: string }[];
  pinoutDiagram: {
    leftPins: { pin: string; role: string; color?: string }[];
    rightPins: { pin: string; role: string; color?: string }[];
  };
  datasheetSummary: {
    peakCurrent: string;
    powerConsumption: string;
    package: string;
    tempRange: string;
  };
}

export const COMPONENT_CATALOG: ComponentLibraryItem[] = [
  {
    id: 'esp32_devkit',
    name: 'ESP32 DevKit V1 (Transmitter)',
    category: 'mcu',
    categoryLabel: 'Microcontrollers',
    type: 'Microcontroller',
    description: 'Dual-core Tensilica Xtensa 32-bit LX6 MCU with integrated Wi-Fi, Bluetooth, and high-speed hardware PWM timers for optical carrier generation.',
    operatingVoltage: '3.3 V',
    gpioPins: 34,
    clockSpeed: '240 MHz',
    wifiBle: 'Yes (802.11 b/g/n & BLE 4.2)',
    thumbnail: '/hardware/esp32_3d.png',
    specs: [
      { label: 'CPU Architecture', value: 'Tensilica Xtensa 32-bit LX6 Dual-Core' },
      { label: 'Clock Frequency', value: '240 MHz Maximum' },
      { label: 'PWM Timers', value: '16 Independent Channels (LEDC Timer)' },
      { label: 'ADC Resolution', value: '12-bit SAR ADC (Up to 18 Channels)' },
      { label: 'SRAM / Flash', value: '520 KB SRAM / 4 MB SPI Flash' },
      { label: 'Operating Voltage', value: '3.0 V to 3.6 V DC' }
    ],
    commonPins: [
      { pin: '3V3', name: '3.3V Output', role: 'Regulated 3.3V DC power rail output', color: '#ef4444' },
      { pin: 'GND', name: 'Ground', role: 'System common reference ground', color: '#000000' },
      { pin: 'GPIO 23', name: 'LED Output (TX)', role: 'High-speed PWM optical carrier drive', color: '#3b82f6' },
      { pin: 'GPIO 34', name: 'ADC Input (RX)', role: 'Low-noise ADC channel 6 input from TIA', color: '#10b981' }
    ],
    pinoutDiagram: {
      leftPins: [
        { pin: '3V3', role: '3.3V VCC Out', color: '#ef4444' },
        { pin: 'EN', role: 'Reset / Enable' },
        { pin: 'VP', role: 'Sensor VP (GPIO36)' },
        { pin: 'VN', role: 'Sensor VN (GPIO39)' },
        { pin: 'GPIO 34', role: 'ADC1_CH6 (RX Input)', color: '#10b981' },
        { pin: 'GPIO 35', role: 'ADC1_CH7' },
        { pin: 'GPIO 32', role: 'Touch 9 / ADC1_CH4' },
        { pin: 'GPIO 33', role: 'Touch 8 / ADC1_CH5' },
        { pin: 'GPIO 25', role: 'DAC1 / ADC2_CH8' },
        { pin: 'GPIO 26', role: 'DAC2 / ADC2_CH9' },
        { pin: 'GPIO 27', role: 'Touch 7 / ADC2_CH7' },
        { pin: 'GPIO 14', role: 'HSPI_CLK' },
        { pin: 'GPIO 12', role: 'HSPI_MISO' },
        { pin: 'GND', role: 'System Ground', color: '#000000' },
        { pin: 'VIN', role: '5V USB Power In', color: '#f59e0b' }
      ],
      rightPins: [
        { pin: 'GND', role: 'System Ground', color: '#000000' },
        { pin: 'GPIO 23', role: 'PWM OOK TX Out', color: '#3b82f6' },
        { pin: 'GPIO 22', role: 'I2C SCL' },
        { pin: 'GPIO 01', role: 'UART0 TXD' },
        { pin: 'GPIO 03', role: 'UART0 RXD' },
        { pin: 'GPIO 21', role: 'I2C SDA' },
        { pin: 'GND', role: 'System Ground', color: '#000000' },
        { pin: 'GPIO 19', role: 'VSPI_MISO' },
        { pin: 'GPIO 18', role: 'VSPI_CLK' },
        { pin: 'GPIO 05', role: 'VSPI_CS' },
        { pin: 'GPIO 17', role: 'UART2 TXD' },
        { pin: 'GPIO 16', role: 'UART2 RXD' },
        { pin: 'GPIO 04', role: 'Touch 0' },
        { pin: 'GPIO 00', role: 'Boot Mode Pin' },
        { pin: '3V3', role: '3.3V Output', color: '#ef4444' }
      ]
    },
    datasheetSummary: {
      peakCurrent: '500 mA (Peak during TX bursts)',
      powerConsumption: '80 mA (Active CPU, Wi-Fi off)',
      package: 'DIP-30 / NodeMCU 25.4mm pitch',
      tempRange: '-40°C to +85°C Industrial'
    }
  },
  {
    id: 'led_high_intensity',
    name: 'High Intensity Optical LED',
    category: 'optical',
    categoryLabel: 'Optical Components',
    type: 'Optical Emitter',
    description: 'High-speed 650nm visible red optical transmitter LED with 20ns rise/fall times for high-throughput LiFi communication.',
    operatingVoltage: '1.95 V - 2.1 V',
    thumbnail: '/hardware/led_macro.jpg',
    specs: [
      { label: 'Peak Wavelength', value: '650 nm (Visible Red)' },
      { label: 'Forward Voltage (Vf)', value: '1.95 V Nominal' },
      { label: 'Max Forward Current', value: '30 mA Continuous' },
      { label: 'Optical Rise Time', value: '18 ns (High Speed)' },
      { label: 'Viewing Angle', value: '30° Semi-Collimated Beam' }
    ],
    commonPins: [
      { pin: 'Anode (+)', name: 'Long Lead', role: 'Connected to 220Ω Limiter Resistor', color: '#ef4444' },
      { pin: 'Cathode (-)', name: 'Short Lead', role: 'Connected to 2N2222 Collector Sink', color: '#3b82f6' }
    ],
    pinoutDiagram: {
      leftPins: [{ pin: 'Anode (+)', role: 'Positive Forward Drive (+1.95V)' }],
      rightPins: [{ pin: 'Cathode (-)', role: 'Switched to Ground via Transistor' }]
    },
    datasheetSummary: {
      peakCurrent: '100 mA (Pulse mode 10% duty)',
      powerConsumption: '65 mW at 20 mA drive',
      package: '5mm Clear Round Dome Epoxy',
      tempRange: '-30°C to +80°C'
    }
  },
  {
    id: 'bpw34_photodiode',
    name: 'BPW34 Silicon PIN Photodiode',
    category: 'optical',
    categoryLabel: 'Optical Components',
    type: 'Optical Detector',
    description: 'High-speed planar silicon PIN photodiode with high radiation sensitivity and tiny 25pF junction capacitance for wideband LiFi detection.',
    operatingVoltage: 'Reverse bias -3.3 V to -5.0 V',
    thumbnail: '/hardware/photodiode_macro.jpg',
    specs: [
      { label: 'Active Radiant Area', value: '7.5 mm² Silicon Window' },
      { label: 'Spectral Range', value: '430 nm - 1100 nm' },
      { label: 'Peak Responsivity', value: '0.62 A/W at 850 nm' },
      { label: 'Rise / Fall Time', value: '20 ns' },
      { label: 'Junction Capacitance', value: '25 pF (Reverse Biased)' }
    ],
    commonPins: [
      { pin: 'Anode (+)', name: 'Ground Ref', role: 'Connected to Common Ground Rail', color: '#000000' },
      { pin: 'Cathode (-)', name: 'Photocurrent', role: 'Connected to LM358 Inverting Input', color: '#10b981' }
    ],
    pinoutDiagram: {
      leftPins: [{ pin: 'Anode (+)', role: 'Ground Reference' }],
      rightPins: [{ pin: 'Cathode (-)', role: 'Reverse Photocurrent Output' }]
    },
    datasheetSummary: {
      peakCurrent: '100 µA at 1000 Lux illumination',
      powerConsumption: '< 1 mW passive detector',
      package: 'Top-view clear plastic DIP miniature',
      tempRange: '-40°C to +100°C'
    }
  },
  {
    id: 'bjt_2n2222',
    name: '2N2222 (NPN Transistor)',
    category: 'drivers',
    categoryLabel: 'Transistors & Drivers',
    type: 'BJT Current Driver',
    description: 'High-speed NPN bipolar switching transistor capable of driving up to 800mA for nanosecond optical LED modulation.',
    operatingVoltage: 'Up to 40 V Vce',
    thumbnail: '/hardware/resistor_macro.jpg',
    specs: [
      { label: 'Transistor Polarity', value: 'NPN Silicon Epitaxial' },
      { label: 'Max Collector Current', value: '800 mA Continuous' },
      { label: 'Current Gain (hFE)', value: '100 to 300' },
      { label: 'Transition Freq (fT)', value: '300 MHz High Speed' }
    ],
    commonPins: [
      { pin: 'Emitter (E)', name: 'Pin 1', role: 'Common Ground Return', color: '#000000' },
      { pin: 'Base (B)', name: 'Pin 2', role: 'Driven by MCU GPIO via 1kΩ Resistor', color: '#f59e0b' },
      { pin: 'Collector (C)', name: 'Pin 3', role: 'Connected to LED Cathode to sink current', color: '#3b82f6' }
    ],
    pinoutDiagram: {
      leftPins: [{ pin: 'Pin 1 (E)', role: 'Emitter (GND)' }, { pin: 'Pin 2 (B)', role: 'Base (GPIO Drive)' }],
      rightPins: [{ pin: 'Pin 3 (C)', role: 'Collector (LED Sink)' }]
    },
    datasheetSummary: {
      peakCurrent: '800 mA continuous',
      powerConsumption: '500 mW maximum rating',
      package: 'TO-92 Plastic 3-Lead',
      tempRange: '-55°C to +150°C'
    }
  },
  {
    id: 'lm358_opamp',
    name: 'LM358 (Op-Amp / TIA Module)',
    category: 'analog',
    categoryLabel: 'Analog Components',
    type: 'Signal Conditioning Amplifier',
    description: 'Dual low-power operational amplifier configured as a high-gain Transimpedance Amplifier (TIA) to convert microamp photocurrent into volts.',
    operatingVoltage: '3.0 V to 32 V Single Supply',
    thumbnail: '/hardware/photodiode_macro.jpg',
    specs: [
      { label: 'Amplifier Circuit', value: 'Transimpedance Amplifier (TIA)' },
      { label: 'Transimpedance Gain', value: 'Rf = 50 kΩ (Vout = 2.14 V)' },
      { label: 'Gain Bandwidth', value: '1.1 MHz Unity Gain' },
      { label: 'Slew Rate', value: '0.6 V/µs' }
    ],
    commonPins: [
      { pin: 'Pin 1 (OUT)', name: 'Output', role: 'Amplified signal to ESP32 GPIO 34 ADC', color: '#10b981' },
      { pin: 'Pin 2 (IN-)', name: 'Inverting Input', role: 'Photodiode Cathode photocurrent node', color: '#f59e0b' },
      { pin: 'Pin 4 (GND)', name: 'Ground', role: 'Common circuit ground', color: '#000000' },
      { pin: 'Pin 8 (VCC)', name: 'Power (+3.3V)', role: 'Positive power supply', color: '#ef4444' }
    ],
    pinoutDiagram: {
      leftPins: [
        { pin: 'Pin 1 (OUT1)', role: 'Analog Output 1' },
        { pin: 'Pin 2 (IN1-)', role: 'Inverting Input 1' },
        { pin: 'Pin 3 (IN1+)', role: 'Non-Inverting Input 1' },
        { pin: 'Pin 4 (GND)', role: 'Ground', color: '#000000' }
      ],
      rightPins: [
        { pin: 'Pin 8 (VCC)', role: '3.3V Power', color: '#ef4444' },
        { pin: 'Pin 7 (OUT2)', role: 'Analog Output 2' },
        { pin: 'Pin 6 (IN2-)', role: 'Inverting Input 2' },
        { pin: 'Pin 5 (IN2+)', role: 'Non-Inverting Input 2' }
      ]
    },
    datasheetSummary: {
      peakCurrent: '40 mA output sink/source',
      powerConsumption: '0.7 mA quiescent current',
      package: 'DIP-8 / SOIC-8 Dual Op-Amp',
      tempRange: '0°C to +70°C'
    }
  },
  {
    id: 'sg90_servo',
    name: 'SG90 Servo (Occlusion Blocker)',
    category: 'mechanical',
    categoryLabel: 'Mechanical Components',
    type: 'Mechanical Actuator',
    description: 'Precision 9g micro-servo holding a physical opaque occlusion blade to inject calibrated physical burst loss into the free-space optical channel.',
    operatingVoltage: '3.3 V - 5.0 V',
    thumbnail: '/hardware/multimeter.jpg',
    specs: [
      { label: 'Torque', value: '1.8 kg·cm at 4.8V' },
      { label: 'Operating Speed', value: '0.10 sec / 60 degrees' },
      { label: 'Occlusion Blade', value: 'Opaque Black Delrin 25mm Flap' },
      { label: 'Control Signal', value: '50 Hz PWM (1ms - 2ms Pulse)' }
    ],
    commonPins: [
      { pin: 'Brown Lead', name: 'Ground', role: 'Servo ground return', color: '#000000' },
      { pin: 'Red Lead', name: 'Power (+5V/3.3V)', role: 'Positive motor supply', color: '#ef4444' },
      { pin: 'Orange Lead', name: 'PWM Signal', role: 'Angle control pulse from controller', color: '#f59e0b' }
    ],
    pinoutDiagram: {
      leftPins: [{ pin: 'GND', role: 'Brown wire' }, { pin: 'VCC', role: 'Red wire (+5V)' }],
      rightPins: [{ pin: 'PWM', role: 'Orange wire (Pulse)' }]
    },
    datasheetSummary: {
      peakCurrent: '650 mA stall current',
      powerConsumption: '100 mA running',
      package: '9g Micro-servo with horn mount',
      tempRange: '-30°C to +60°C'
    }
  }
];

export const SemLiFiVirtualLab: React.FC<SemLiFiVirtualLabProps> = ({
  projectName = 'SemLiFi Virtual Lab',
  onOpenReport
}) => {
  // Navigation active tab: 'simulation' | 'hardwareTwin' | 'transmission' | 'waveforms' | 'results' | 'docs'
  const [activeNavTab, setActiveNavTab] = useState<'simulation' | 'hardwareTwin' | 'transmission' | 'waveforms' | 'results' | 'docs'>('simulation');

  // Mobile responsive views & tabs
  const [mobileCircuitTab, setMobileCircuitTab] = useState<'canvas' | 'parts' | 'params' | 'scope'>('canvas');
  const [mobileBottomTab, setMobileBottomTab] = useState<'waveforms' | 'console' | 'results'>('waveforms');

  // Selected Microcontroller Target Profile: 'esp32' | 'stm32'
  const [mcuProfile, setMcuProfile] = useState<'esp32' | 'stm32'>('esp32');

  // Theme: 'dark' | 'light'
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  // Selected Component in Library & Inspector
  const [selectedLibCompId, setSelectedLibCompId] = useState<string>('esp32_devkit');
  const selectedLibComp = useMemo(() => {
    return COMPONENT_CATALOG.find(c => c.id === selectedLibCompId) || COMPONENT_CATALOG[0];
  }, [selectedLibCompId]);

  // Inspector Card Visible State (in Build & Connect mode)
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(true);
  const [inspectorSubTab, setInspectorSubTab] = useState<'pinout' | 'datasheet'>('pinout');

  // Component search & category filter in library
  const [compSearchQuery, setCompSearchQuery] = useState<string>('');
  const [compCategoryFilter, setCompCategoryFilter] = useState<'all' | 'mcu' | 'optical' | 'analog'>('all');

  const filteredCatalog = useMemo(() => {
    return COMPONENT_CATALOG.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(compSearchQuery.toLowerCase()) ||
                          c.type.toLowerCase().includes(compSearchQuery.toLowerCase());
      const matchCat = compCategoryFilter === 'all' ||
                       (compCategoryFilter === 'mcu' && c.category === 'mcu') ||
                       (compCategoryFilter === 'optical' && c.category === 'optical') ||
                       (compCategoryFilter === 'analog' && c.category === 'analog');
      return matchSearch && matchCat;
    });
  }, [compSearchQuery, compCategoryFilter]);

  // ---------------------------------------------------------------------------
  // SIMULATION STATE ENGINE (Matching Image 1, 2, 3)
  // ---------------------------------------------------------------------------
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(0);
  const [bitRateBps, setBitRateBps] = useState<number>(1000);
  const [encodingType, setEncodingType] = useState<string>('Manchester');
  const [payloadText, setPayloadText] = useState<string>('TEMP=27.4,HUM=61,MOTOR=ON');
  const [simDuration, setSimDuration] = useState<number>(10);

  // Occlusion Control (SG90 Servo Flap)
  // Scenarios: P0 (Clean, 0ms), P1 (Mild, 80ms), P2 (Moderate, 250ms), P3 (Severe, 500ms)
  const [occlusionScenario, setOcclusionScenario] = useState<'P0' | 'P1' | 'P2' | 'P3'>('P2');
  const [occlusionDurationMs, setOcclusionDurationMs] = useState<number>(250);
  const [isOcclusionActive, setIsOcclusionActive] = useState<boolean>(false);

  // Semantic Communication Parameters (BASR & CGFP)
  const [basrConfidence, setBasrConfidence] = useState<number>(0.73);
  const [cgfpThreshold, setCgfpThreshold] = useState<number>(0.80);
  const [simDecision, setSimDecision] = useState<'NACK' | 'ACK_RECONSTRUCTED' | 'ACK_DIRECT'>('NACK');

  // Metrics counters
  const [totalFrames, setTotalFrames] = useState<number>(50);
  const [corruptedFrames, setCorruptedFrames] = useState<number>(12);
  const [reconstructedFrames, setReconstructedFrames] = useState<number>(5);
  const [retransmissions, setRetransmissions] = useState<number>(7);
  const [berDuringBurst, setBerDuringBurst] = useState<number>(0.42);
  const [endToEndLatencyMs, setEndToEndLatencyMs] = useState<number>(790.7);

  // Console Logs
  const [consoleLogs, setConsoleLogs] = useState<{ time: string; text: string; color: string }[]>([
    { time: '[00.000]', text: 'Simulation initialized. Ready.', color: 'text-slate-400' }
  ]);

  // Execution Flow Modal State (Image 3)
  const [isFlowModalOpen, setIsFlowModalOpen] = useState<boolean>(false);
  const [flowStepIdx, setFlowStepIdx] = useState<number>(11); // All steps completed by default
  const [copiedFlow, setCopiedFlow] = useState<boolean>(false);

  // Active waveform tab in build view
  const [activeWaveformTab, setActiveWaveformTab] = useState<'tx' | 'optical' | 'rx' | 'decoded'>('optical');

  // Simulation Parameters Right Tab (in Circuit view): 'general' | 'channel' | 'basr' | 'cgfp'
  const [simParamTab, setSimParamTab] = useState<'general' | 'channel' | 'basr' | 'cgfp'>('general');

  // Audio effects
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playChime = (freq = 1000) => {
    if (!isAudioEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') ctx.resume();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // Audio not permitted
    }
  };

  // Update burst duration when scenario changes
  useEffect(() => {
    if (occlusionScenario === 'P0') setOcclusionDurationMs(0);
    else if (occlusionScenario === 'P1') setOcclusionDurationMs(80);
    else if (occlusionScenario === 'P2') setOcclusionDurationMs(250);
    else if (occlusionScenario === 'P3') setOcclusionDurationMs(500);
  }, [occlusionScenario]);

  // Simulation Run Sequence Timer (matching Image 1, 2, 3)
  const simTimerRef = useRef<any>(null);

  const handleStartSimulation = () => {
    setIsSimulating(true);
    setSimTimeSeconds(0);
    setFlowStepIdx(0);

    // Initial log sequence
    setConsoleLogs([
      { time: '[00.000]', text: 'Simulation started...', color: 'text-slate-300' },
      { time: '[00.010]', text: `${mcuProfile === 'esp32' ? 'ESP32' : 'STM32'} TX: Sending payload "${payloadText}"`, color: 'text-cyan-300' },
      { time: '[00.012]', text: `${encodingType} encoding enabled (${bitRateBps} bps)`, color: 'text-emerald-300' },
      { time: '[00.015]', text: 'LED optical modulation active (650nm)', color: 'text-amber-300' }
    ]);

    playChime(800);

    // Step sequence
    setTimeout(() => {
      setFlowStepIdx(1); // Manchester encoding
      playChime(900);
    }, 400);

    setTimeout(() => {
      setFlowStepIdx(2); // LED modulation
      playChime(1000);
    }, 800);

    setTimeout(() => {
      setFlowStepIdx(3); // Optical channel
      playChime(1100);
    }, 1200);

    // Occlusion event at ~1.6s
    setTimeout(() => {
      if (occlusionDurationMs > 0) {
        setIsOcclusionActive(true);
        setFlowStepIdx(4); // 250 ms blockage
        playChime(400); // Low pitch occlusion warning

        setConsoleLogs(prev => [
          ...prev,
          { time: '[00.520]', text: `SG90 Servo: Occlusion started (${occlusionScenario})`, color: 'text-rose-400' },
          { time: '[00.520]', text: `Burst duration: ${occlusionDurationMs} ms`, color: 'text-rose-300' },
          { time: '[00.521]', text: 'Optical channel: Signal blocked by servo blade', color: 'text-rose-400' }
        ]);

        // End of occlusion
        setTimeout(() => {
          setIsOcclusionActive(false);
          setFlowStepIdx(5); // Burst detected

          setConsoleLogs(prev => [
            ...prev,
            { time: '[00.780]', text: 'Burst ended, optical signal restored', color: 'text-slate-300' },
            { time: '[00.781]', text: 'Manchester decoding in progress...', color: 'text-slate-400' },
            { time: '[00.782]', text: 'CRC-8 check: Frame corrupted', color: 'text-rose-400' },
            { time: '[00.783]', text: `Burst detected: ${occlusionDurationMs} ms loss`, color: 'text-rose-300' }
          ]);

          // BASR AI Reconstruction
          setTimeout(() => {
            setFlowStepIdx(6); // BASR reconstruction
            playChime(1200);

            setConsoleLogs(prev => [
              ...prev,
              { time: '[00.900]', text: 'BASR reconstruction started...', color: 'text-indigo-300' },
              { time: '[01.120]', text: `BASR confidence: ${basrConfidence.toFixed(2)}`, color: 'text-amber-300' },
              { time: '[01.121]', text: `CGFP threshold: ${cgfpThreshold.toFixed(2)}`, color: 'text-cyan-300' }
            ]);

            setTimeout(() => {
              setFlowStepIdx(7); // Confidence = 0.73
              setTimeout(() => {
                setFlowStepIdx(8); // 0.73 < 0.80

                // CGFP Decision evaluation
                if (basrConfidence < cgfpThreshold) {
                  setSimDecision('NACK');
                  setFlowStepIdx(9); // NACK

                  setConsoleLogs(prev => [
                    ...prev,
                    { time: '[01.122]', text: `Confidence < threshold -> NACK`, color: 'text-rose-400 font-bold' },
                    { time: '[01.123]', text: 'Requesting exact retransmission (ARQ)...', color: 'text-amber-300' }
                  ]);

                  setTimeout(() => {
                    setFlowStepIdx(10); // Exact retransmission
                    playChime(1400);

                    setConsoleLogs(prev => [
                      ...prev,
                      { time: '[01.250]', text: 'Retransmission received successfully', color: 'text-emerald-300' },
                      { time: '[01.251]', text: 'CRC-8 check: Valid', color: 'text-emerald-400' },
                      { time: '[01.252]', text: 'Payload recovered successfully', color: 'text-emerald-300 font-bold' }
                    ]);

                    setTimeout(() => {
                      setFlowStepIdx(11); // VALID PAYLOAD
                      setIsSimulating(false);
                      playChime(1600); // Success fanfare
                    }, 500);
                  }, 800);
                } else {
                  // Reconstructed without retransmitting!
                  setSimDecision('ACK_RECONSTRUCTED');
                  setFlowStepIdx(11); // Directly valid
                  setIsSimulating(false);

                  setConsoleLogs(prev => [
                    ...prev,
                    { time: '[01.122]', text: `Confidence >= threshold -> Reconstructed accepted!`, color: 'text-emerald-300 font-bold' },
                    { time: '[01.123]', text: 'Zero latency retransmission required!', color: 'text-cyan-300' }
                  ]);
                }
              }, 400);
            }, 400);
          }, 600);
        }, occlusionDurationMs * 2);
      } else {
        // Clean link
        setConsoleLogs(prev => [
          ...prev,
          { time: '[00.300]', text: 'Clean channel (P0): CRC-8 Valid • 0 Bit Errors', color: 'text-emerald-300' }
        ]);
        setIsSimulating(false);
      }
    }, 1600);
  };

  const handleStopSimulation = () => {
    setIsSimulating(false);
    setIsOcclusionActive(false);
    setConsoleLogs(prev => [
      ...prev,
      { time: '[--.---]', text: 'Simulation stopped by user.', color: 'text-slate-400' }
    ]);
  };

  const handleResetSimulation = () => {
    handleStopSimulation();
    setSimTimeSeconds(0);
    setFlowStepIdx(0);
    setConsoleLogs([
      { time: '[00.000]', text: 'Simulation reset. Ready.', color: 'text-slate-400' }
    ]);
  };

  const handleCopyFlow = () => {
    const text = `ESP32 TX\n↓\nManchester encoding\n↓\nLED modulation\n↓\nOptical channel\n↓\n${occlusionDurationMs} ms blockage\n↓\nBurst detected\n↓\nBASR reconstruction\n↓\nConfidence = ${basrConfidence}\n↓\n${basrConfidence} < ${cgfpThreshold}\n↓\nNACK\n↓\nExact retransmission\n↓\n✓ VALID PAYLOAD`;
    navigator.clipboard.writeText(text);
    setCopiedFlow(true);
    setTimeout(() => setCopiedFlow(false), 2000);
  };

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${isDarkMode ? 'bg-[#090e1a] text-slate-100' : 'bg-slate-50 text-slate-800'} font-sans select-none pb-14 md:pb-0`}>
      {/* ========================================================= */}
      {/* 1. TOP HEADER NAVIGATION (Matching Image 1 & Image 2)     */}
      {/* ========================================================= */}
      <header className={`h-[54px] sm:h-[56px] ${isDarkMode ? 'bg-[#0b1324] border-[#182642]' : 'bg-white border-slate-200'} border-b px-2.5 sm:px-4 flex items-center justify-between shrink-0 z-30 shadow-md gap-2`}>
        {/* Left Branding */}
        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1.5px] shadow-lg shadow-blue-500/25 shrink-0">
            <div className="w-full h-full bg-[#080f1e] rounded-[7px] flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm sm:text-base font-extrabold tracking-wide font-sans text-white whitespace-nowrap">
                SemLiFi<span className="hidden sm:inline"> Virtual Lab</span>
              </span>
              <span className="inline-flex md:hidden items-center space-x-1 text-[9px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
                <span className={`w-1 h-1 rounded-full ${isSimulating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{isSimulating ? 'LIVE' : 'IDLE'}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden md:block whitespace-nowrap">
              Design • Assemble • Simulate • Analyze
            </p>
          </div>
        </div>

        {/* Center: Desktop Mode Switcher Pills (hidden on mobile, bottom bar handles it) */}
        <nav className={`hidden md:flex items-center ${isDarkMode ? 'bg-[#070c18] border-[#16243f]' : 'bg-slate-100 border-slate-300'} p-1 rounded-xl border space-x-1 text-xs font-semibold shrink`}>
          <button
            onClick={() => setActiveNavTab('simulation')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeNavTab === 'simulation'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Circuit &amp; Simulation</span>
          </button>

          <button
            onClick={() => setActiveNavTab('hardwareTwin')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeNavTab === 'hardwareTwin'
                ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-md font-bold'
                : 'text-cyan-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5 shrink-0" />
            <span>Hardware Twin</span>
          </button>

          <button
            onClick={() => setActiveNavTab('transmission')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeNavTab === 'transmission'
                ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-md font-bold'
                : 'text-indigo-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5 shrink-0" />
            <span>Message &amp; Bits</span>
          </button>

          <button
            onClick={() => setActiveNavTab('waveforms')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeNavTab === 'waveforms'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 shrink-0" />
            <span>Waveforms</span>
          </button>

          <button
            onClick={() => setActiveNavTab('results')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeNavTab === 'results'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 shrink-0" />
            <span>Results</span>
          </button>

          <button
            onClick={() => setActiveNavTab('docs')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 shrink-0 ${
              activeNavTab === 'docs'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" />
            <span>Documentation</span>
          </button>
        </nav>

        {/* Mobile Header Right Actions (< md) */}
        <div className="flex md:hidden items-center space-x-1.5 shrink-0">
          {/* Quick Simulation Run/Pause */}
          <button
            onClick={() => {
              if (isSimulating) {
                setIsSimulating(false);
              } else {
                handleStartSimulation();
              }
            }}
            className={`px-2.5 py-1 rounded-lg font-mono font-bold text-xs flex items-center space-x-1 shadow transition-all ${
              isSimulating
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white'
            }`}
          >
            {isSimulating ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isSimulating ? 'Pause' : 'Simulate'}</span>
          </button>

          {/* Execution Flow Trigger */}
          <button
            onClick={() => setIsFlowModalOpen(true)}
            className="px-2 py-1 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-300 text-xs font-mono font-bold flex items-center space-x-1"
            title="Execution Flow"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>Flow</span>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(d => !d)}
            className="p-1.5 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-400 hover:text-white"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Desktop Right Tools (>= md): Execution Flow Modal Trigger, MCU Target, Audio, Settings */}
        <div className="hidden md:flex items-center space-x-1 sm:space-x-1.5 shrink-0">
          {/* Execution Flow Trigger (Matching Image 3) */}
          <button
            onClick={() => setIsFlowModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 text-xs font-mono font-bold flex items-center space-x-1 transition-all"
            title="View simulation step-by-step execution flowchart"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span className="hidden lg:inline">Execution Flow</span>
          </button>

          {/* Microcontroller Profile Selector */}
          <div className="flex items-center bg-[#070c18] rounded-lg border border-[#16243f] p-0.5 text-xs font-mono">
            <button
              onClick={() => setMcuProfile('esp32')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                mcuProfile === 'esp32'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ESP32
            </button>
            <button
              onClick={() => setMcuProfile('stm32')}
              className={`px-2 py-1 rounded text-[11px] font-bold transition-all ${
                mcuProfile === 'stm32'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              STM32
            </button>
          </div>

          {/* Audio Synthesizer Toggle */}
          <button
            onClick={() => {
              setIsAudioEnabled(a => !a);
              playChime(1000);
            }}
            className={`p-2 rounded-lg border text-xs transition-all ${
              isAudioEnabled
                ? 'bg-cyan-950 text-cyan-300 border-cyan-700'
                : 'bg-[#0f172a] text-slate-400 border-slate-700 hover:text-white'
            }`}
            title="Toggle Audio Feedback"
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(d => !d)}
            className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-400 hover:text-white transition-all"
            title="Toggle Light / Dark mode"
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
          </button>

          {/* Settings */}
          <button
            className="p-2 rounded-lg bg-[#0f172a] border border-slate-700 text-slate-400 hover:text-white transition-all"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>

          {/* Report Button */}
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-3 py-1.5 rounded-lg bg-[#111c30] hover:bg-[#1a2b4a] text-cyan-300 border border-cyan-800/40 text-xs font-mono font-bold transition-all hidden xl:block"
            >
              Report
            </button>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN WORKSPACE CONTAINER                               */}
      {/* ========================================================= */}
      {activeNavTab === 'hardwareTwin' ? (
        /* Real Hardware Digital Twin View */
        <div className="flex-1 min-h-0">
          <FullHardwareSetupStudio
            projectName={projectName}
            onOpenReport={onOpenReport}
            onNavigateToBits={() => setActiveNavTab('transmission')}
          />
        </div>
      ) : activeNavTab === 'transmission' ? (
        <div className="flex-1 min-h-0 overflow-y-auto bg-[#04060d]">
          <MessageTransmissionStudio defaultMessage="HII" />
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {/* ----------------------------------------------------- */}
          {/* LEFT PANEL: COMPONENT LIBRARY (Matching Image 1 & 2)  */}
          {/* ----------------------------------------------------- */}
          <aside className={`
            w-full lg:w-[240px] xl:w-[260px] ${isDarkMode ? 'bg-[#0b1324] border-[#182642]' : 'bg-white border-slate-200'} border-r flex flex-col shrink-0 overflow-hidden
            ${mobileCircuitTab === 'parts' ? 'flex flex-1' : 'hidden lg:flex'}
          `}>
            {/* Header */}
            <div className="p-3 border-b border-[#182642] flex items-center justify-between">
              <span className="text-xs font-bold text-white tracking-wide">
                Component Library
              </span>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-slate-400 font-mono">
                  {COMPONENT_CATALOG.length} Items
                </span>
                <button
                  onClick={() => setMobileCircuitTab('canvas')}
                  className="lg:hidden p-1 rounded text-slate-400 hover:text-white"
                  title="Close library and return to canvas"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-2 border-b border-[#182642] space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search components..."
                  value={compSearchQuery}
                  onChange={(e) => setCompSearchQuery(e.target.value)}
                  className="w-full bg-[#080d19] border border-[#1b2b4a] rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
              </div>

              {/* Quick Filter Pills */}
              <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5 text-[10px]">
                {(['all', 'mcu', 'optical', 'analog'] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCompCategoryFilter(cat)}
                    className={`px-2 py-0.5 rounded-full font-bold transition-all capitalize whitespace-nowrap ${
                      compCategoryFilter === cat
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-[#0d1629] text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat === 'all' ? 'All' : cat === 'mcu' ? 'Microcontrollers' : cat === 'optical' ? 'Optical' : 'Analog'}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Accordion Component List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-3 font-sans text-xs">
              {/* Microcontrollers Section */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <ChevronDown className="w-3 h-3" />
                  <span>Microcontrollers</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {filteredCatalog.filter(c => c.category === 'mcu').map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedLibCompId(comp.id);
                        setIsInspectorOpen(true);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        selectedLibCompId === comp.id
                          ? 'bg-blue-950/80 border-blue-500 shadow-md shadow-blue-500/20 text-white'
                          : 'bg-[#090f1e] border-[#182744] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={comp.thumbnail}
                        alt={comp.name}
                        className="w-12 h-10 object-contain rounded my-1"
                      />
                      <span className="text-[10px] font-bold leading-tight line-clamp-1">{comp.name.split(' ')[0]} {comp.name.split(' ')[1]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optical Components Section */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <ChevronDown className="w-3 h-3" />
                  <span>Optical Components</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {filteredCatalog.filter(c => c.category === 'optical').map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedLibCompId(comp.id);
                        setIsInspectorOpen(true);
                      }}
                      className={`p-1.5 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        selectedLibCompId === comp.id
                          ? 'bg-blue-950/80 border-blue-500 text-white'
                          : 'bg-[#090f1e] border-[#182744] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <img
                        src={comp.thumbnail}
                        alt={comp.name}
                        className="w-8 h-8 object-contain rounded my-1"
                      />
                      <span className="text-[9px] font-semibold leading-tight line-clamp-1">{comp.name.split(' ')[0]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transistors & Drivers */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <ChevronDown className="w-3 h-3" />
                  <span>Transistors &amp; Drivers</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {filteredCatalog.filter(c => c.category === 'drivers').map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedLibCompId(comp.id);
                        setIsInspectorOpen(true);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        selectedLibCompId === comp.id
                          ? 'bg-blue-950/80 border-blue-500 text-white'
                          : 'bg-[#090f1e] border-[#182744] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{comp.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Analog Components */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <ChevronDown className="w-3 h-3" />
                  <span>Analog Components</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {filteredCatalog.filter(c => c.category === 'analog').map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedLibCompId(comp.id);
                        setIsInspectorOpen(true);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        selectedLibCompId === comp.id
                          ? 'bg-blue-950/80 border-blue-500 text-white'
                          : 'bg-[#090f1e] border-[#182744] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{comp.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mechanical Components */}
              <div className="space-y-1">
                <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  <ChevronDown className="w-3 h-3" />
                  <span>Mechanical Components</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {filteredCatalog.filter(c => c.category === 'mechanical').map((comp) => (
                    <div
                      key={comp.id}
                      onClick={() => {
                        setSelectedLibCompId(comp.id);
                        setIsInspectorOpen(true);
                      }}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                        selectedLibCompId === comp.id
                          ? 'bg-blue-950/80 border-blue-500 text-white'
                          : 'bg-[#090f1e] border-[#182744] text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{comp.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ----------------------------------------------------- */}
          {/* CENTER VIEWPORT: [CIRCUIT & SIMULATION] / VIEWS      */}
          {/* ----------------------------------------------------- */}
          <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {activeNavTab === 'simulation' ? (
              /* ================================================= */
              /* VIEW: [CIRCUIT & SIMULATION]                      */
              /* ================================================= */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Mobile Segmented Mode Bar (< lg) */}
                <div className="lg:hidden flex items-center bg-[#070c18] border-b border-[#182642] p-1 gap-1 text-xs font-mono shrink-0 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setMobileCircuitTab('canvas')}
                    className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 font-bold whitespace-nowrap transition-all ${
                      mobileCircuitTab === 'canvas' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white bg-[#0e1628]'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Canvas</span>
                  </button>
                  <button
                    onClick={() => setMobileCircuitTab('parts')}
                    className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 font-bold whitespace-nowrap transition-all ${
                      mobileCircuitTab === 'parts' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white bg-[#0e1628]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Parts</span>
                  </button>
                  <button
                    onClick={() => setMobileCircuitTab('params')}
                    className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 font-bold whitespace-nowrap transition-all ${
                      mobileCircuitTab === 'params' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white bg-[#0e1628]'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Params</span>
                  </button>
                  <button
                    onClick={() => setMobileCircuitTab('scope')}
                    className={`flex-1 py-1.5 px-2 rounded-lg flex items-center justify-center space-x-1 font-bold whitespace-nowrap transition-all ${
                      mobileCircuitTab === 'scope' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white bg-[#0e1628]'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Scope &amp; Logs</span>
                  </button>
                </div>

                {/* Upper Main Area: Schematic & Parameters */}
                <div className="flex-1 flex min-h-0 relative">
                  {/* Schematic Canvas */}
                  <div className={`flex-1 flex-col min-h-0 bg-[#070b16] border-r border-[#182642] ${mobileCircuitTab === 'canvas' ? 'flex' : 'hidden lg:flex'}`}>
                    {/* Schematic Toolbar */}
                    <div className="p-2 px-3 bg-[#0d1527] border-b border-[#182642] flex flex-wrap items-center justify-between gap-1.5 text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-white whitespace-nowrap">Circuit Workspace</span>
                      </div>

                      <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-x-auto scrollbar-none">
                        <button className="px-2 py-0.5 rounded bg-blue-600 text-white font-bold text-[11px]">Select</button>
                        <button className="px-2 py-0.5 rounded bg-[#131f36] text-slate-300 text-[11px]">Wire</button>
                        <button className="px-2 py-0.5 rounded bg-[#131f36] text-slate-300 text-[11px]">Rotate</button>
                        <button className="px-2 py-0.5 rounded bg-[#131f36] text-slate-300 text-[11px]">Zoom In</button>
                        <button className="px-2 py-0.5 rounded bg-[#131f36] text-slate-300 text-[11px]">Reset</button>
                      </div>
                    </div>

                    {/* Visual Schematic Diagram (Exact layout from Image 2) */}
                    <div className="flex-1 relative overflow-auto p-3 sm:p-4 flex flex-col items-center justify-start lg:justify-center bg-[#050811] tech-grid">
                      <div className="lg:hidden text-[10px] text-cyan-400/80 font-mono mb-1 flex items-center space-x-1 self-start">
                        <Move className="w-3 h-3" />
                        <span>← Swipe horizontally to view full circuit schematic →</span>
                      </div>
                      <div className="min-w-[780px] max-w-[840px] w-full flex items-center justify-between space-x-2 py-3">
                        {/* 1. ESP32 TX */}
                        <div className="bg-[#0b1324] border-2 border-blue-500 rounded-xl p-3 text-center shadow-lg w-28">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-bold block mb-1">ESP32 (TX)</span>
                          <img src="/hardware/esp32_3d.png" alt="ESP32 TX" className="h-16 w-auto mx-auto object-contain my-1" />
                          <div className="text-[9px] font-mono text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                            <div>GPIO 23</div>
                            <div>3.3V / GND</div>
                          </div>
                        </div>

                        {/* Wire Connection Arrow */}
                        <ArrowRight className="w-4 h-4 text-blue-400" />

                        {/* 2. 2N2222 Driver */}
                        <div className="bg-[#0b1324] border border-purple-500 rounded-xl p-2.5 text-center shadow-lg w-24">
                          <span className="text-[9px] font-bold text-purple-300 block mb-1">2N2222 Driver</span>
                          <div className="w-10 h-10 mx-auto rounded bg-slate-800 flex items-center justify-center text-xs font-bold text-white">NPN</div>
                          <span className="text-[8px] text-slate-400 block mt-1">B, C, E Pins</span>
                        </div>

                        {/* Wire Connection Arrow */}
                        <ArrowRight className="w-4 h-4 text-yellow-400" />

                        {/* 3. LED Transmitter */}
                        <div className="bg-[#0b1324] border border-rose-500 rounded-xl p-2.5 text-center shadow-lg w-24">
                          <span className="text-[9px] font-bold text-rose-300 block mb-1">LED (TX)</span>
                          <img src="/hardware/led_macro.jpg" alt="LED" className="h-10 w-auto mx-auto object-contain rounded" />
                          <span className="text-[8px] text-slate-400 block mt-1">650nm Red</span>
                        </div>

                        {/* 4. Optical Channel Rays & SG90 Servo */}
                        <div className="flex-1 flex flex-col items-center justify-center px-2 py-1 bg-[#070d18] rounded-xl border border-dashed border-amber-500/60 relative">
                          <span className="text-[10px] font-bold text-amber-300 mb-1">Optical Channel (15 cm)</span>

                          {/* Optical Light Rays */}
                          <div className="w-full flex items-center justify-center my-1 space-x-1">
                            <div className="h-1.5 flex-1 bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400 rounded-full animate-pulse" />
                          </div>

                          {/* SG90 Servo Blocker */}
                          <div className="mt-1 bg-[#0b1324] border border-amber-600 rounded p-1.5 text-center w-full max-w-[170px]">
                            <span className="text-[9px] font-bold text-amber-400 block">SG90 Servo (Occlusion)</span>
                            <div className="flex justify-between items-center text-[8px] text-slate-400 mt-1">
                              <span>Scenario: <strong>{occlusionScenario}</strong></span>
                              <span>Burst: <strong>{occlusionDurationMs} ms</strong></span>
                            </div>
                          </div>
                        </div>

                        {/* 5. BPW34 Photodiode */}
                        <div className="bg-[#0b1324] border border-emerald-500 rounded-xl p-2.5 text-center shadow-lg w-24">
                          <span className="text-[9px] font-bold text-emerald-300 block mb-1">BPW34 (RX)</span>
                          <img src="/hardware/photodiode_macro.jpg" alt="Photodiode" className="h-10 w-auto mx-auto object-contain rounded" />
                          <span className="text-[8px] text-slate-400 block mt-1">7.5mm² PIN</span>
                        </div>

                        {/* Wire Connection Arrow */}
                        <ArrowRight className="w-4 h-4 text-emerald-400" />

                        {/* 6. LM358 TIA */}
                        <div className="bg-[#0b1324] border border-cyan-500 rounded-xl p-2.5 text-center shadow-lg w-24">
                          <span className="text-[9px] font-bold text-cyan-300 block mb-1">LM358 TIA</span>
                          <div className="w-10 h-10 mx-auto rounded bg-slate-800 flex items-center justify-center text-[10px] font-bold text-cyan-300">Op-Amp</div>
                          <span className="text-[8px] text-slate-400 block mt-1">Vout = 2.14V</span>
                        </div>

                        {/* Wire Connection Arrow */}
                        <ArrowRight className="w-4 h-4 text-purple-400" />

                        {/* 7. ESP32 RX */}
                        <div className="bg-[#0b1324] border-2 border-emerald-500 rounded-xl p-3 text-center shadow-lg w-28">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold block mb-1">ESP32 (RX)</span>
                          <img src="/hardware/esp32_3d.png" alt="ESP32 RX" className="h-16 w-auto mx-auto object-contain my-1" />
                          <div className="text-[9px] font-mono text-slate-400 space-y-0.5 pt-1 border-t border-slate-800">
                            <div>GPIO 34 (ADC)</div>
                            <div>3.3V / GND</div>
                          </div>
                        </div>
                      </div>

                      {/* Communication Protocol Pipeline (Exact blocks from Image 2) */}
                      <div className="w-full min-w-[780px] max-w-[840px] bg-[#080d19] border border-[#1b2b48] rounded-xl p-2.5 mt-2 shadow-lg">
                        <span className="text-[10px] font-bold text-cyan-300 block uppercase tracking-wider mb-2">
                          Communication Protocol &amp; Semantic Architecture Pipeline:
                        </span>

                        <div className="flex items-center justify-between text-[10px] font-mono overflow-x-auto space-x-1 py-1">
                          {[
                            { name: 'Manchester Encoder', step: 1 },
                            { name: 'Optical Modulation', step: 2 },
                            { name: 'Optical Channel', step: 3 },
                            { name: 'Manchester Decoder', step: 5 },
                            { name: 'CRC-8 Check', step: 6 },
                            { name: 'Burst Detection', step: 6 },
                            { name: 'BASR Reconstruction', step: 7 },
                            { name: 'CGFP Filter', step: 8 },
                            { name: 'Selective NACK', step: 9 }
                          ].map((block, bIdx, arr) => (
                            <React.Fragment key={bIdx}>
                              <div
                                className={`px-2 py-1.5 rounded-lg border text-center transition-all whitespace-nowrap ${
                                  flowStepIdx >= block.step
                                    ? 'bg-blue-950 text-cyan-300 border-cyan-500 font-bold shadow-md shadow-cyan-500/20'
                                    : 'bg-[#0b1324] text-slate-400 border-slate-800'
                                }`}
                              >
                                {block.name}
                              </div>
                              {bIdx < arr.length - 1 && (
                                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Panel: Simulation Parameters (Matching Image 2 right) */}
                  <div className={`w-full lg:w-[300px] xl:w-[320px] bg-[#0a1020] flex-col shrink-0 p-3 space-y-3 font-sans text-xs ${mobileCircuitTab === 'params' ? 'flex flex-1' : 'hidden lg:flex'} overflow-y-auto`}>
                    <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                      <span className="font-bold text-white text-xs uppercase tracking-wider">
                        Simulation Parameters
                      </span>
                      {/* Mobile back to canvas button */}
                      <button
                        onClick={() => setMobileCircuitTab('canvas')}
                        className="lg:hidden px-2 py-0.5 rounded bg-blue-900/60 text-cyan-300 border border-cyan-700/60 text-[10px] font-mono flex items-center space-x-1"
                      >
                        <span>← Back to Circuit</span>
                      </button>
                    </div>

                    {/* Sub-Tabs: General, Channel, BASR, CGFP */}
                    <div className="flex border border-slate-800 rounded-lg p-0.5 text-[10px] font-mono bg-[#060a14]">
                      <button
                        onClick={() => setSimParamTab('general')}
                        className={`flex-1 py-1 rounded font-bold ${simParamTab === 'general' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        General
                      </button>
                      <button
                        onClick={() => setSimParamTab('channel')}
                        className={`flex-1 py-1 rounded font-bold ${simParamTab === 'channel' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        Channel
                      </button>
                      <button
                        onClick={() => setSimParamTab('basr')}
                        className={`flex-1 py-1 rounded font-bold ${simParamTab === 'basr' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        BASR
                      </button>
                      <button
                        onClick={() => setSimParamTab('cgfp')}
                        className={`flex-1 py-1 rounded font-bold ${simParamTab === 'cgfp' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
                      >
                        CGFP
                      </button>
                    </div>

                    {/* Form Controls */}
                    <div className="space-y-2.5 text-xs font-mono">
                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1">Bit Rate (bps):</label>
                        <input
                          type="number"
                          value={bitRateBps}
                          onChange={(e) => setBitRateBps(Number(e.target.value))}
                          className="w-full bg-[#070c18] border border-slate-700 rounded-lg p-1.5 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1">Encoding:</label>
                        <select
                          value={encodingType}
                          onChange={(e) => setEncodingType(e.target.value)}
                          className="w-full bg-[#070c18] border border-slate-700 rounded-lg p-1.5 text-white"
                        >
                          <option value="Manchester">Manchester (DC Balanced)</option>
                          <option value="OOK">OOK Carrier (10 kHz)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1">Payload Content:</label>
                        <input
                          type="text"
                          value={payloadText}
                          onChange={(e) => setPayloadText(e.target.value)}
                          className="w-full bg-[#070c18] border border-slate-700 rounded-lg p-1.5 text-cyan-300 font-bold"
                        />
                      </div>

                      {/* CGFP Threshold Slider */}
                      <div>
                        <div className="flex justify-between text-[11px] mb-1">
                          <span className="text-slate-400">CGFP Threshold:</span>
                          <strong className="text-cyan-400">{cgfpThreshold.toFixed(2)}</strong>
                        </div>
                        <input
                          type="range"
                          min="0.50"
                          max="0.95"
                          step="0.01"
                          value={cgfpThreshold}
                          onChange={(e) => setCgfpThreshold(Number(e.target.value))}
                          className="w-full accent-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Simulation Action Buttons */}
                    <div className="space-y-2 pt-2 border-t border-slate-800">
                      {isSimulating ? (
                        <button
                          onClick={handleStopSimulation}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold flex items-center justify-center space-x-1 shadow-lg shadow-rose-600/30"
                        >
                          <Square className="w-4 h-4 fill-current" />
                          <span>Stop</span>
                        </button>
                      ) : (
                        <button
                          onClick={handleStartSimulation}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center justify-center space-x-1 shadow-lg shadow-emerald-600/30"
                        >
                          <Play className="w-4 h-4 fill-current" />
                          <span>Start Simulation</span>
                        </button>
                      )}

                      <button
                        onClick={handleResetSimulation}
                        className="w-full py-1.5 bg-[#121c2e] hover:bg-[#1a2944] text-slate-300 rounded-lg font-bold flex items-center justify-center space-x-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: 4 Waveforms, Console, Results & Metrics (Matching Image 2) */}
                <div className={`border-t border-[#182642] bg-[#070b16] font-mono text-xs overflow-hidden ${
                  mobileCircuitTab === 'scope'
                    ? 'flex flex-col flex-1 overflow-y-auto'
                    : 'hidden lg:grid lg:grid-cols-3 lg:divide-x lg:divide-[#182642] lg:h-[230px] lg:shrink-0'
                }`}>
                  {/* Mobile Tab Switcher on < lg */}
                  <div className="lg:hidden flex border-b border-[#182642] bg-[#090f1e] text-[11px] font-mono shrink-0">
                    <button
                      onClick={() => setMobileBottomTab('waveforms')}
                      className={`flex-1 py-1.5 text-center font-bold transition-all flex items-center justify-center space-x-1 ${
                        mobileBottomTab === 'waveforms'
                          ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-950/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Activity className="w-3 h-3" />
                      <span>Waveforms</span>
                    </button>
                    <button
                      onClick={() => setMobileBottomTab('console')}
                      className={`flex-1 py-1.5 text-center font-bold transition-all flex items-center justify-center space-x-1 ${
                        mobileBottomTab === 'console'
                          ? 'text-emerald-300 border-b-2 border-emerald-400 bg-emerald-950/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <FileCode className="w-3 h-3" />
                      <span>Console</span>
                    </button>
                    <button
                      onClick={() => setMobileBottomTab('results')}
                      className={`flex-1 py-1.5 text-center font-bold transition-all flex items-center justify-center space-x-1 ${
                        mobileBottomTab === 'results'
                          ? 'text-amber-300 border-b-2 border-amber-400 bg-amber-950/40'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Results &amp; Metrics</span>
                    </button>
                  </div>

                  {/* Bottom Col 1: Signal Waveforms (4 Synchronized Traces) */}
                  <div className={`p-3 flex-col justify-between overflow-hidden flex-1 ${mobileBottomTab === 'waveforms' ? 'flex' : 'hidden md:flex'}`}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center space-x-1">
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Signal Waveforms (4 Channels)</span>
                    </span>

                    <div className="flex-1 space-y-1.5 pt-1 overflow-y-auto">
                      {/* Trace 1: TX Data Bits (Blue) */}
                      <div>
                        <div className="flex justify-between text-[9px] text-blue-300 font-bold mb-0.5">
                          <span>1. TX Data (Bits)</span>
                          <span>1000 bps</span>
                        </div>
                        <div className="h-6 bg-[#04060d] border border-blue-900/60 rounded px-1 flex items-center">
                          <svg className="w-full h-4" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path d="M 0,16 L 15,16 L 15,4 L 30,4 L 30,16 L 45,16 L 45,4 L 60,4 L 60,16 L 75,16 L 75,4 L 100,4" stroke="#38bdf8" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>

                      {/* Trace 2: Manchester Encoded (Green) */}
                      <div>
                        <div className="flex justify-between text-[9px] text-emerald-300 font-bold mb-0.5">
                          <span>2. Manchester Encoded</span>
                          <span>DC Balanced</span>
                        </div>
                        <div className="h-6 bg-[#04060d] border border-emerald-900/60 rounded px-1 flex items-center">
                          <svg className="w-full h-4" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path d="M 0,16 L 8,16 L 8,4 L 16,4 L 16,16 L 24,16 L 24,4 L 32,4 L 32,16 L 40,16 L 40,4 L 48,4 L 48,16 L 60,16 L 60,4 L 100,4" stroke="#34d399" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>

                      {/* Trace 3: LED Optical Signal (Yellow with Occlusion Red shaded block) */}
                      <div>
                        <div className="flex justify-between text-[9px] text-amber-300 font-bold mb-0.5">
                          <span>3. LED Optical Signal</span>
                          <span className="text-red-400">Occlusion Burst (250 ms)</span>
                        </div>
                        <div className="h-6 bg-[#04060d] border border-amber-900/60 rounded px-1 flex items-center relative overflow-hidden">
                          <div className="absolute top-0 bottom-0 bg-red-950/60 border-x border-red-500" style={{ left: '40%', width: '25%' }} />
                          <svg className="w-full h-4 relative z-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path d="M 0,16 L 15,16 L 15,4 L 30,4 L 30,16 L 40,16 L 40,18 L 65,18 L 65,16 L 75,16 L 75,4 L 100,4" stroke="#facc15" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>

                      {/* Trace 4: Received Signal ADC (Red) */}
                      <div>
                        <div className="flex justify-between text-[9px] text-rose-300 font-bold mb-0.5">
                          <span>4. Received Signal (ADC)</span>
                          <span>Filtered 0-3.3V</span>
                        </div>
                        <div className="h-6 bg-[#04060d] border border-rose-900/60 rounded px-1 flex items-center">
                          <svg className="w-full h-4" viewBox="0 0 100 20" preserveAspectRatio="none">
                            <path d="M 0,14 L 10,14 L 15,6 L 25,6 L 30,14 L 40,14 L 42,18 L 50,19 L 60,18 L 65,14 L 70,6 L 85,6 L 90,14 L 100,14" stroke="#f43f5e" strokeWidth="2" fill="none" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Col 2: Simulation Console (Matching Image 2 center) */}
                  <div className={`p-3 flex-col justify-between bg-[#050811] flex-1 ${mobileBottomTab === 'console' ? 'flex' : 'hidden md:flex'}`}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center space-x-1">
                      <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Simulation Console</span>
                    </span>

                    <div className="flex-1 overflow-y-auto space-y-0.5 text-[10px] font-mono p-1 bg-black/60 rounded border border-slate-900 mt-1 min-h-[100px]">
                      {consoleLogs.map((log, idx) => (
                        <div key={idx} className="leading-tight">
                          <span className="text-slate-500">{log.time} </span>
                          <span className={log.color}>{log.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bottom Col 3: Results & Metrics Panel (Matching Image 2 right) */}
                  <div className={`p-3 flex-col justify-between space-y-2 bg-[#090e1a] flex-1 ${mobileBottomTab === 'results' ? 'flex' : 'hidden md:flex'}`}>
                    <span className="text-xs font-bold text-white uppercase tracking-wider border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span>Results &amp; Metrics</span>
                      <span className="text-[10px] text-emerald-400 font-mono">IEEE 802.15.7</span>
                    </span>

                    {/* BASR Confidence vs CGFP Threshold & Decision */}
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-[#0b1324] p-1.5 rounded-lg border border-amber-600/50">
                        <span className="text-[9px] text-slate-400 block">BASR Confidence</span>
                        <strong className="text-amber-400 text-sm font-bold">{basrConfidence.toFixed(2)}</strong>
                      </div>

                      <div className="bg-[#0b1324] p-1.5 rounded-lg border border-blue-600/50">
                        <span className="text-[9px] text-slate-400 block">CGFP Threshold</span>
                        <strong className="text-blue-400 text-sm font-bold">{cgfpThreshold.toFixed(2)}</strong>
                      </div>

                      <div className="bg-[#0b1324] p-1.5 rounded-lg border border-rose-600/50 flex flex-col justify-center">
                        <span className="text-[9px] text-slate-400 block">Decision</span>
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-700">
                          {simDecision === 'NACK' ? 'NACK (Retransmit)' : 'ACK (Accepted)'}
                        </span>
                      </div>
                    </div>

                    {/* Frame Counters */}
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                      <div className="bg-[#060a14] p-1 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[8px]">Total</span>
                        <strong className="text-white font-bold">{totalFrames}</strong>
                      </div>
                      <div className="bg-[#060a14] p-1 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[8px]">Corrupted</span>
                        <strong className="text-rose-400 font-bold">{corruptedFrames}</strong>
                      </div>
                      <div className="bg-[#060a14] p-1 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[8px]">Reconstructed</span>
                        <strong className="text-emerald-400 font-bold">{reconstructedFrames}</strong>
                      </div>
                      <div className="bg-[#060a14] p-1 rounded border border-slate-800">
                        <span className="text-slate-500 block text-[8px]">Retransmit</span>
                        <strong className="text-amber-400 font-bold">{retransmissions}</strong>
                      </div>
                    </div>

                    {/* Received Payload Confirmation */}
                    <div className="bg-[#0b1828] border border-emerald-800/60 p-1.5 rounded-lg text-[10px] flex items-center justify-between">
                      <div className="truncate">
                        <span className="text-slate-400 block text-[8px]">Received Payload:</span>
                        <strong className="text-emerald-300">{payloadText}</strong>
                      </div>
                      <span className="text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-700 shrink-0 ml-1">
                        ✔ Valid
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeNavTab === 'waveforms' ? (
              /* Full-screen Deep Waveforms Studio */
              <div className="flex-1 p-4 bg-[#050811] flex flex-col space-y-4 overflow-y-auto font-mono">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    <span>Deep Multi-Channel Optical Oscilloscope</span>
                  </h2>
                  <div className="text-xs text-slate-400">Timebase: 100 µs/div • V/div: 1.0 V</div>
                </div>

                <div className="bg-[#020408] border border-cyan-800/60 rounded-xl p-4 tech-grid space-y-4">
                  <div>
                    <span className="text-xs text-blue-400 font-bold block mb-1">CH1: Transmitter Data Bits (1000 bps)</span>
                    <div className="h-16 bg-black/60 rounded border border-blue-900 p-2">
                      <svg className="w-full h-full" viewBox="0 0 500 40" preserveAspectRatio="none">
                        <path d="M 0,35 L 50,35 L 50,5 L 100,5 L 100,35 L 150,35 L 150,5 L 200,5 L 200,35 L 250,35 L 250,5 L 300,5 L 300,35 L 500,35" stroke="#38bdf8" strokeWidth="2.5" fill="none" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-emerald-400 font-bold block mb-1">CH2: Manchester Encoded Clock-Data Transitions</span>
                    <div className="h-16 bg-black/60 rounded border border-emerald-900 p-2">
                      <svg className="w-full h-full" viewBox="0 0 500 40" preserveAspectRatio="none">
                        <path d="M 0,35 L 25,35 L 25,5 L 50,5 L 50,35 L 75,35 L 75,5 L 100,5 L 100,35 L 125,35 L 125,5 L 150,5 L 150,35 L 500,35" stroke="#34d399" strokeWidth="2.5" fill="none" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-amber-400 font-bold block mb-1">CH3: Optical Radiance with {occlusionDurationMs}ms Occlusion Dropout</span>
                    <div className="h-16 bg-black/60 rounded border border-amber-900 p-2 relative overflow-hidden">
                      <div className="absolute top-0 bottom-0 bg-red-950/60 border-x-2 border-red-500" style={{ left: '40%', width: '25%' }} />
                      <svg className="w-full h-full relative z-10" viewBox="0 0 500 40" preserveAspectRatio="none">
                        <path d="M 0,35 L 50,35 L 50,5 L 100,5 L 100,35 L 150,35 L 200,38 L 325,38 L 350,35 L 400,35 L 400,5 L 500,5" stroke="#facc15" strokeWidth="2.5" fill="none" />
                      </svg>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs text-rose-400 font-bold block mb-1">CH4: LM358 Output Voltage (ADC Input Pin)</span>
                    <div className="h-16 bg-black/60 rounded border border-rose-900 p-2">
                      <svg className="w-full h-full" viewBox="0 0 500 40" preserveAspectRatio="none">
                        <path d="M 0,32 L 40,32 L 50,8 L 90,8 L 100,32 L 150,32 L 200,36 L 325,36 L 350,32 L 400,32 L 410,8 L 500,8" stroke="#f43f5e" strokeWidth="2.5" fill="none" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeNavTab === 'results' ? (
              /* Results & Academic Metrics Tab */
              <div className="flex-1 p-6 bg-[#060a14] overflow-y-auto space-y-4 font-mono text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <h2 className="text-base font-bold text-white">SemLiFi Academic Performance &amp; Evaluation</h2>
                  <span className="text-cyan-400">Scenario {occlusionScenario} Benchmark</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-[#0b1324] border border-cyan-800/60 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Optical SNR</span>
                    <strong className="text-xl text-cyan-300 font-bold">28.4 dB</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-emerald-800/60 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Effective Throughput</span>
                    <strong className="text-xl text-emerald-300 font-bold">96.8 %</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-amber-800/60 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">End-to-End Latency</span>
                    <strong className="text-xl text-amber-300 font-bold">{endToEndLatencyMs} ms</strong>
                  </div>
                  <div className="bg-[#0b1324] border border-rose-800/60 rounded-xl p-3">
                    <span className="text-slate-400 block text-[11px]">Burst Loss Handled</span>
                    <strong className="text-xl text-rose-300 font-bold">{occlusionDurationMs} ms</strong>
                  </div>
                </div>
              </div>
            ) : (
              /* Comprehensive Research Paper & Laboratory Documentation Hub */
              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                <SemLiFiDocumentationHub />
              </div>
            )}
          </main>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. STEP-BY-STEP EXECUTION FLOW MODAL                      */}
      {/* ========================================================= */}
      <SemLiFiExecutionFlowModal
        isOpen={isFlowModalOpen}
        onClose={() => setIsFlowModalOpen(false)}
        onStartSimulation={handleStartSimulation}
      />

      {/* ========================================================= */}
      {/* 4. MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on < md) */}
      {/* ========================================================= */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#080d19]/95 backdrop-blur-xl border-t border-[#182642] py-1.5 px-2 flex justify-around items-center safe-area-bottom shadow-2xl">
        <button
          onClick={() => setActiveNavTab('simulation')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-0.5 rounded-lg transition-all ${
            activeNavTab === 'simulation'
              ? 'text-cyan-400 font-bold bg-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 shrink-0" />
          <span className="text-[10px] tracking-tight">Circuit</span>
        </button>

        <button
          onClick={() => setActiveNavTab('hardwareTwin')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-0.5 rounded-lg transition-all ${
            activeNavTab === 'hardwareTwin'
              ? 'text-cyan-400 font-bold bg-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Camera className="w-4 h-4 shrink-0" />
          <span className="text-[10px] tracking-tight">Twin</span>
        </button>

        <button
          onClick={() => setActiveNavTab('transmission')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-0.5 rounded-lg transition-all ${
            activeNavTab === 'transmission'
              ? 'text-indigo-400 font-bold bg-indigo-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio className="w-4 h-4 shrink-0" />
          <span className="text-[10px] tracking-tight">Bits</span>
        </button>

        <button
          onClick={() => setActiveNavTab('waveforms')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-0.5 rounded-lg transition-all ${
            activeNavTab === 'waveforms'
              ? 'text-cyan-400 font-bold bg-cyan-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 shrink-0" />
          <span className="text-[10px] tracking-tight">Scopes</span>
        </button>

        <button
          onClick={() => setActiveNavTab('docs')}
          className={`flex-1 py-1 flex flex-col items-center justify-center space-y-0.5 rounded-lg transition-all ${
            activeNavTab === 'docs'
              ? 'text-blue-400 font-bold bg-blue-950/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 shrink-0" />
          <span className="text-[10px] tracking-tight">Docs</span>
        </button>
      </nav>
    </div>
  );
};

export default SemLiFiVirtualLab;

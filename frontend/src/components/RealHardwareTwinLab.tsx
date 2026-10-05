import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Camera,
  Play,
  Square,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Settings,
  Sliders,
  Activity,
  Zap,
  Radio,
  Eye,
  CheckCircle2,
  Lightbulb,
  Cpu,
  Layers,
  Search,
  ExternalLink,
  ChevronRight,
  Info,
  Volume2,
  FileCode,
  Sparkles,
  ArrowRight,
  Gauge,
  HelpCircle,
  X,
  Share2,
  Download,
  Check
} from 'lucide-react';

export interface RealHardwareTwinLabProps {
  projectName?: string;
  onOpenReport?: () => void;
  onOpenGuidedBuild?: () => void;
  onSwitchToSimulation?: () => void;
  onSwitchToSchematic?: () => void;
}

// -------------------------------------------------------------
// PHYSICAL WIRING & NETLIST DATA MODEL
// -------------------------------------------------------------
export interface PhysicalWireConnection {
  id: string;
  wireName: string;
  wireColor: string;
  wireColorHex: string;
  fromComp: string;
  fromPin: string;
  fromHole: string;
  toComp: string;
  toPin: string;
  toHole: string;
  signalType: string;
  voltage: string;
  current: string;
  purpose: string;
  professorExplanation: string;
  // SVG curved path coordinates on the real photo (percentage 0-100)
  path: {
    x1: number;
    y1: number;
    cx1: number;
    cy1: number;
    cx2: number;
    cy2: number;
    x2: number;
    y2: number;
  };
}

export const PHYSICAL_WIRING_NETLIST: PhysicalWireConnection[] = [
  {
    id: 'wire_pwm_tx',
    wireName: 'PWM Modulator Output',
    wireColor: 'Orange DuPont',
    wireColorHex: '#f97316',
    fromComp: 'STM32 Blue Pill',
    fromPin: 'Pin PA0 (Timer2_CH1)',
    fromHole: 'MCU Header Pin 11',
    toComp: 'Resistor R1 (220 Ω)',
    toPin: 'Input Lead',
    toHole: 'Breadboard Row 23, Col E',
    signalType: 'High-Speed OOK PWM',
    voltage: '0.00 V / 3.30 V',
    current: '14.2 mA',
    purpose: 'Carries the 10 kHz square-wave modulated transmission payload from microcontroller to optical driver.',
    professorExplanation: 'PA0 is driven by hardware Timer2 Channel 1 PWM. Hardware timer execution ensures zero jitter and frees up the Cortex-M3 CPU core for packet encoding.',
    path: { x1: 35.0, y1: 46.5, cx1: 39.0, cy1: 43.0, cx2: 41.5, cy2: 44.5, x2: 44.0, y2: 46.0 }
  },
  {
    id: 'wire_resistor_led',
    wireName: 'Current-Limited LED Drive',
    wireColor: 'Resistor Lead (Axial)',
    wireColorHex: '#eab308',
    fromComp: 'Resistor R1 (220 Ω)',
    fromPin: 'Output Lead',
    fromHole: 'Breadboard Row 28, Col D',
    toComp: 'LED (TX) Transmitter',
    toPin: 'Anode Lead (+)',
    toHole: 'Breadboard Row 28, Col E',
    signalType: 'Current-Limited PWM',
    voltage: '1.95 V (Forward Bias)',
    current: '14.2 mA',
    purpose: 'Safely limits LED forward current to protect the LED and the STM32 GPIO pad from over-current damage.',
    professorExplanation: 'Calculated via Ohm’s Law: R = (Vcc - Vf) / Iled = (3.3V - 1.95V) / 0.014A = 96 Ω minimum. A 220 Ω resistor was selected for safety margin and high LED switching longevity.',
    path: { x1: 44.0, y1: 46.0, cx1: 46.0, cy1: 42.0, cx2: 47.0, cy2: 38.0, x2: 48.0, y2: 34.0 }
  },
  {
    id: 'wire_led_cathode_gnd',
    wireName: 'Transmitter Ground Return',
    wireColor: 'Blue DuPont',
    wireColorHex: '#3b82f6',
    fromComp: 'LED (TX) Transmitter',
    fromPin: 'Cathode Lead (-)',
    fromHole: 'Breadboard Row 29, Col E',
    toComp: 'Ground Bus Rail',
    toPin: 'Common Ground Return',
    toHole: 'Breadboard Blue Rail (- Bus)',
    signalType: 'Ground Reference',
    voltage: '0.00 V',
    current: '14.2 mA',
    purpose: 'Completes the optical emitter current circuit loop to common ground.',
    professorExplanation: 'Provides the low-impedance ground path. In transistor-boosted models, this line connects to the Collector of a 2N2222 NPN transistor for fast current sinking.',
    path: { x1: 48.5, y1: 35.5, cx1: 48.0, cy1: 43.0, cx2: 47.0, cy2: 50.0, x2: 46.5, y2: 56.0 }
  },
  {
    id: 'wire_mcu_gnd',
    wireName: 'MCU System Ground Tie',
    wireColor: 'Black DuPont',
    wireColorHex: '#475569',
    fromComp: 'STM32 Blue Pill',
    fromPin: 'Pin GND',
    fromHole: 'MCU Header Pin 19',
    toComp: 'Ground Bus Rail',
    toPin: 'Common System GND',
    toHole: 'Breadboard Blue Rail (- Bus)',
    signalType: 'Ground Reference',
    voltage: '0.00 V',
    current: 'System Return',
    purpose: 'Bonds microcontroller digital ground to the breadboard analog and optical ground plane.',
    professorExplanation: 'Essential common ground reference prevents ground loops and eliminates potential differences between microcontroller logic and photodiode detection.',
    path: { x1: 34.0, y1: 51.0, cx1: 36.0, cy1: 54.0, cx2: 38.0, cy2: 56.5, x2: 41.0, y2: 58.0 }
  },
  {
    id: 'wire_mcu_3v3',
    wireName: 'MCU +3.3V Power Bus Feed',
    wireColor: 'Red DuPont',
    wireColorHex: '#ef4444',
    fromComp: 'STM32 Blue Pill',
    fromPin: 'Pin 3.3V (Onboard LDO)',
    fromHole: 'MCU Header Pin 18',
    toComp: 'Positive Power Rail',
    toPin: 'VCC Power Bus',
    toHole: 'Breadboard Red Rail (+ Bus)',
    signalType: 'Regulated DC Power',
    voltage: '+3.30 V Steady',
    current: '45.0 mA total',
    purpose: 'Distributes regulated +3.3V from the STM32 onboard RT9193 low-dropout regulator to power the receiver amplifier.',
    professorExplanation: 'Powers the LM358 operational amplifier and reverse-biases the receiver photodiode for high-speed photoconductive operation.',
    path: { x1: 34.0, y1: 43.0, cx1: 36.5, cy1: 38.0, cx2: 38.5, cy2: 34.0, x2: 41.0, y2: 31.5 }
  },
  {
    id: 'wire_optical_link',
    wireName: 'Free-Space Optical Beam',
    wireColor: 'Dashed Red Photons',
    wireColorHex: '#f43f5e',
    fromComp: 'LED (TX) Transmitter',
    fromPin: 'Optical Lens Surface',
    fromHole: 'Free-Space Air Gap (15 cm)',
    toComp: 'Photodiode (RX)',
    toPin: 'Silicon PIN Window',
    toHole: 'Free-Space Air Gap (15 cm)',
    signalType: 'Optical Radiation (850nm / 630nm)',
    voltage: '3.32 mW/cm²',
    current: '42.8 µA (Photocurrent)',
    purpose: 'Wireless LiFi channel transmitting modulated light through line-of-sight free space.',
    professorExplanation: 'The physical LiFi channel. Optical pulses propagate across air according to Lambertian emission: Irradiance E = (m+1)/(2π d²) * cos^m(θ). Immune to radio frequency (RF) electromagnetic interference.',
    path: { x1: 49.5, y1: 32.5, cx1: 52.0, cy1: 35.0, cx2: 54.0, cy2: 38.5, x2: 56.5, y2: 43.0 }
  },
  {
    id: 'wire_photodiode_anode',
    wireName: 'Photodiode Ground Tie',
    wireColor: 'Green/Black DuPont',
    wireColorHex: '#10b981',
    fromComp: 'Photodiode (RX)',
    fromPin: 'Anode Lead (+)',
    fromHole: 'Breadboard Row 45, Col B',
    toComp: 'Ground Bus Rail',
    toPin: 'Common Ground Return',
    toHole: 'Breadboard Blue Rail (- Bus)',
    signalType: 'Photoconductive Ground',
    voltage: '0.00 V',
    current: '42.8 µA',
    purpose: 'Connects the photodiode anode to ground for reverse-biased photoconductive mode.',
    professorExplanation: 'Reverse-biasing the BPW34 drastically reduces its junction capacitance from ~70 pF to ~25 pF, speeding up rise time to < 20 ns for reliable 10 kHz - 100 kHz LiFi demodulation.',
    path: { x1: 56.5, y1: 46.5, cx1: 56.0, cy1: 50.0, cx2: 55.0, cy2: 53.5, x2: 53.5, y2: 56.5 }
  },
  {
    id: 'wire_photodiode_lm358',
    wireName: 'Photocurrent to TIA Pre-Amp',
    wireColor: 'Yellow DuPont',
    wireColorHex: '#facc15',
    fromComp: 'Photodiode (RX)',
    fromPin: 'Cathode Lead (-)',
    fromHole: 'Breadboard Row 46, Col B',
    toComp: 'LM358 Op-Amp',
    toPin: 'Pin 2 (Inverting Input)',
    toHole: 'Breadboard Row 50, Col B',
    signalType: 'Microamp Optical Current',
    voltage: '2.14 V (Amplified Output)',
    current: '42.8 µA',
    purpose: 'Feeds weak optical photocurrent into the LM358 transimpedance amplifier.',
    professorExplanation: 'The LM358 converts minute microamp-level photocurrent into a clean 0–3.3V analog voltage using feedback resistor Rf: Vout = Iph * Rf.',
    path: { x1: 57.5, y1: 45.0, cx1: 57.0, cy1: 47.0, cx2: 54.0, cy2: 48.0, x2: 52.0, y2: 49.0 }
  },
  {
    id: 'wire_lm358_adc',
    wireName: 'Amplified Signal to STM32 ADC',
    wireColor: 'Green DuPont',
    wireColorHex: '#22c55e',
    fromComp: 'LM358 Op-Amp',
    fromPin: 'Pin 1 (Output)',
    fromHole: 'Breadboard Row 50, Col A',
    toComp: 'STM32 Blue Pill',
    toPin: 'Pin PA1 (ADC1_IN1)',
    toHole: 'MCU Header Pin 12',
    signalType: 'Conditioned Analog / Binary',
    voltage: '0.20 V – 2.45 V',
    current: '1.2 mA Sensed',
    purpose: 'Carries recovered optical waveform back into STM32 ADC for digitization and software decoding.',
    professorExplanation: 'STM32 internal 12-bit Successive Approximation ADC samples this node at 1 MSPS. Firmware compares threshold to reconstruct transmitted UART/telemetry packet bytes.',
    path: { x1: 52.0, y1: 49.0, cx1: 46.0, cy1: 52.0, cx2: 39.0, cy2: 51.0, x2: 35.0, y2: 48.0 }
  },
  {
    id: 'wire_multimeter_red',
    wireName: 'Multimeter Red Probe (+)',
    wireColor: 'Red Heavy Test Lead',
    wireColorHex: '#ef4444',
    fromComp: 'Fluke 179 Multimeter',
    fromPin: 'V/Ω Input Banana Jack',
    fromHole: 'Benchtop DMM Front Panel',
    toComp: 'Resistor R1 / LED Anode',
    toPin: 'Transmitter Test Node',
    toHole: 'Breadboard Row 28, Col C',
    signalType: 'DC Voltage Probing',
    voltage: '3.32 V DC',
    current: '< 0.1 µA (High Z)',
    purpose: 'Provides live verification of forward voltage potential at the LED anode test point.',
    professorExplanation: 'Internal 10 MΩ input impedance of the True RMS multimeter ensures zero circuit loading while proving continuous 3.32V power rail integrity.',
    path: { x1: 34.5, y1: 30.0, cx1: 38.0, cy1: 34.0, cx2: 42.0, cy2: 40.0, x2: 46.0, y2: 45.0 }
  },
  {
    id: 'wire_multimeter_black',
    wireName: 'Multimeter Black Probe (-)',
    wireColor: 'Black Heavy Test Lead',
    wireColorHex: '#1e293b',
    fromComp: 'Fluke 179 Multimeter',
    fromPin: 'COM Common Jack',
    fromHole: 'Benchtop DMM Front Panel',
    toComp: 'Ground Bus Rail',
    toPin: 'Common Ground Return',
    toHole: 'Breadboard Blue Rail (- Bus)',
    signalType: 'Ground Reference',
    voltage: '0.00 V',
    current: 'Reference',
    purpose: 'Establishes common zero-volt reference for the digital multimeter measurement.',
    professorExplanation: 'Connects to breadboard common ground bus to complete the Kelvin differential voltage sensing loop.',
    path: { x1: 35.5, y1: 33.0, cx1: 37.0, cy1: 42.0, cx2: 39.0, cy2: 50.0, x2: 42.0, y2: 58.0 }
  }
];

// Interactive detected components from the user's real hardware testbed
interface DetectedHardwareComponent {
  id: string;
  name: string;
  subtitle: string;
  category: 'mcu' | 'resistor' | 'led' | 'photodiode' | 'transistor' | 'wire' | 'instrument';
  badge: string;
  badgeColor: string;
  type: string;
  role: string;
  connectedTo: string;
  seriesResistor: string;
  status: string;
  specs: { label: string; value: string }[];
  signalInfo: {
    inputSignal: string;
    voltage: string;
    opticalOutput: string;
  };
  macroImage: string;
  thumbnail: string;
  // Bounding box coordinates on the real photo (percentage 0-100)
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
    labelX: number;
    labelY: number;
    color: string;
  };
  // Detailed Physical Pin Connections Table
  pinoutTable: {
    pinName: string;
    pinType: string;
    connectedTo: string;
    breadboardLocation: string;
    wireColorBadge: string;
    wireColorHex: string;
    functionDesc: string;
  }[];
}

const HARDWARE_COMPONENTS: DetectedHardwareComponent[] = [
  {
    id: 'led_tx',
    name: 'LED (TX)',
    subtitle: 'LiFi Transmitter',
    category: 'led',
    badge: 'Transmitter',
    badgeColor: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
    type: 'Red LED (LiFi, 5mm Clear Dome)',
    role: 'Optical Transmitter (850nm / 630nm OOK)',
    connectedTo: 'STM32 (PWM Output PA0) via 220 Ω Resistor',
    seriesResistor: '220 Ω (Current Limiting)',
    status: 'ON (Simulated)',
    specs: [
      { label: 'Wavelength', value: '630 nm (Visible Red) / 850 nm' },
      { label: 'Forward Voltage (Vf)', value: '1.95 V Nominal' },
      { label: 'Forward Current (If)', value: '14.2 mA' },
      { label: 'Rise / Fall Time', value: '< 18 ns Fast Switching' }
    ],
    signalInfo: {
      inputSignal: 'PWM (10.0 kHz)',
      voltage: '1.95 V (Anode)',
      opticalOutput: 'Modulated Photons (10 kHz)'
    },
    macroImage: '/hardware/led_macro.jpg',
    thumbnail: '/hardware/led_macro.jpg',
    bounds: {
      x: 46.5,
      y: 29.0,
      width: 6.5,
      height: 9.5,
      labelX: 47.0,
      labelY: 26.0,
      color: '#ef4444' // red
    },
    pinoutTable: [
      {
        pinName: 'Anode Lead (+)',
        pinType: 'Input',
        connectedTo: 'Resistor R1 (220 Ω) Output Lead',
        breadboardLocation: 'Row 28, Column E',
        wireColorBadge: 'Yellow / Gold Resistor',
        wireColorHex: '#eab308',
        functionDesc: 'Receives current-limited 1.95V PWM signal from STM32 PA0 to excite optical photon emission.'
      },
      {
        pinName: 'Cathode Lead (-)',
        pinType: 'Output',
        connectedTo: 'Breadboard Common Ground Rail (- Bus)',
        breadboardLocation: 'Row 29, Column E',
        wireColorBadge: 'Blue DuPont Wire',
        wireColorHex: '#3b82f6',
        functionDesc: 'Provides ground return reference back to STM32 GND plane to complete the current loop.'
      },
      {
        pinName: 'Optical Surface',
        pinType: 'Wireless Optical',
        connectedTo: 'BPW34 Photodiode Active Area',
        breadboardLocation: 'Free-Space Air Gap (15 cm)',
        wireColorBadge: 'Red Laser / Optical Beam',
        wireColorHex: '#f43f5e',
        functionDesc: 'Transmits high-speed optical photon pulses wireless across the line-of-sight channel.'
      }
    ]
  },
  {
    id: 'resistor_220',
    name: 'Resistor',
    subtitle: '220 Ω (Detected)',
    category: 'resistor',
    badge: 'Passive',
    badgeColor: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
    type: 'Metal Film Resistor 1/4W 5%',
    role: 'Current Limiter for Transmitter LED',
    connectedTo: 'STM32 PA0 ↔ LED Anode',
    seriesResistor: '220 Ω (Measured: 219.4 Ω)',
    status: 'PASSING (14.2 mA)',
    specs: [
      { label: 'Resistance', value: '220 Ω ± 5%' },
      { label: 'Power Rating', value: '250 mW' },
      { label: 'Color Bands', value: 'Red · Red · Brown · Gold' },
      { label: 'Voltage Drop', value: '1.35 V (Vcc - Vf)' }
    ],
    signalInfo: {
      inputSignal: 'PWM Pulses',
      voltage: '1.35 V Drop',
      opticalOutput: 'N/A'
    },
    macroImage: '/hardware/resistor_macro.jpg',
    thumbnail: '/hardware/resistor_macro.jpg',
    bounds: {
      x: 43.0,
      y: 45.0,
      width: 7.0,
      height: 6.5,
      labelX: 43.5,
      labelY: 42.0,
      color: '#f59e0b' // yellow / amber
    },
    pinoutTable: [
      {
        pinName: 'Lead 1 (Input)',
        pinType: 'PWM Input',
        connectedTo: 'STM32 Pin PA0 (Timer2_CH1)',
        breadboardLocation: 'Row 23, Column E',
        wireColorBadge: 'Orange DuPont Wire',
        wireColorHex: '#f97316',
        functionDesc: 'Accepts high-frequency 0-3.3V PWM drive signal from microcontroller.'
      },
      {
        pinName: 'Lead 2 (Output)',
        pinType: 'Limited Current',
        connectedTo: 'LED (TX) Anode Lead (+)',
        breadboardLocation: 'Row 28, Column D',
        wireColorBadge: 'Resistor Body Bridge',
        wireColorHex: '#eab308',
        functionDesc: 'Spans between Row 23 and Row 28 to safely drop 1.35V and restrict current to 14.2 mA.'
      }
    ]
  },
  {
    id: 'photodiode_rx',
    name: 'Photodiode (RX)',
    subtitle: 'Light Receiver',
    category: 'photodiode',
    badge: 'Receiver',
    badgeColor: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
    type: 'BPW34 Silicon PIN Photodiode',
    role: 'Free-Space Optical Photon Detector',
    connectedTo: 'LM358 Inverting Input / PA1 ADC',
    seriesResistor: '10 kΩ Transimpedance Gain',
    status: 'ACTIVE (Detecting)',
    specs: [
      { label: 'Active Area', value: '7.5 mm² Silicon PIN' },
      { label: 'Spectral Range', value: '430 nm – 1100 nm' },
      { label: 'Peak Sensitivity', value: '850 nm (0.62 A/W)' },
      { label: 'Response Time', value: '20 ns (tr / tf)' }
    ],
    signalInfo: {
      inputSignal: 'Optical Photons (Free-Space)',
      voltage: '2.14 V (Amplified)',
      opticalOutput: 'Analog Photocurrent (42.8 µA)'
    },
    macroImage: '/hardware/photodiode_macro.jpg',
    thumbnail: '/hardware/photodiode_macro.jpg',
    bounds: {
      x: 55.0,
      y: 41.5,
      width: 5.5,
      height: 8.0,
      labelX: 53.5,
      labelY: 38.5,
      color: '#10b981' // green
    },
    pinoutTable: [
      {
        pinName: 'Anode Lead (+)',
        pinType: 'Ground Reference',
        connectedTo: 'Breadboard Common Ground Rail (- Bus)',
        breadboardLocation: 'Row 45, Column B',
        wireColorBadge: 'Green/Black DuPont Wire',
        wireColorHex: '#10b981',
        functionDesc: 'Connected to Ground to configure photodiode in reverse-biased photoconductive mode.'
      },
      {
        pinName: 'Cathode Lead (-)',
        pinType: 'Photocurrent Output',
        connectedTo: 'LM358 Pin 2 (Inverting Input / 10kΩ TIA Resistor)',
        breadboardLocation: 'Row 46, Column B',
        wireColorBadge: 'Yellow DuPont Wire',
        wireColorHex: '#facc15',
        functionDesc: 'Discharges 42.8 µA photocurrent into transimpedance amplifier to generate voltage.'
      },
      {
        pinName: 'Window Surface',
        pinType: 'Optical Sensing',
        connectedTo: 'Direct Line-of-Sight with Red LED (TX)',
        breadboardLocation: 'Free-Space Air Gap (15 cm)',
        wireColorBadge: 'Dashed Red Photons',
        wireColorHex: '#f43f5e',
        functionDesc: 'Converts incoming photon flux into electron-hole pairs across the depletion region.'
      }
    ]
  },
  {
    id: 'stm32_mcu',
    name: 'STM32',
    subtitle: 'Microcontroller',
    category: 'mcu',
    badge: 'Controller',
    badgeColor: 'bg-blue-950/80 border-blue-500/60 text-blue-300',
    type: 'STM32F103C8T6 (Blue Pill ARM Cortex-M3)',
    role: 'PWM Transmitter & ADC Data Receiver',
    connectedTo: 'USB 5V / 3.3V LDO to Breadboard Rails',
    seriesResistor: 'N/A',
    status: 'RUNNING (Clock 72 MHz)',
    specs: [
      { label: 'Core', value: 'ARM Cortex-M3 32-bit' },
      { label: 'Clock Speed', value: '72 MHz SysTick' },
      { label: 'Timer PWM', value: 'Timer2 CH1 (PA0)' },
      { label: 'ADC Sensed', value: 'ADC1 Channel 1 (PA1)' }
    ],
    signalInfo: {
      inputSignal: 'Internal Firmware Loop',
      voltage: '3.30 V Logic',
      opticalOutput: 'PA0 High-Speed PWM'
    },
    macroImage: '/hardware/stm32_board.jpg',
    thumbnail: '/hardware/stm32_board.jpg',
    bounds: {
      x: 32.5,
      y: 41.0,
      width: 6.0,
      height: 12.0,
      labelX: 32.5,
      labelY: 37.5,
      color: '#3b82f6' // blue
    },
    pinoutTable: [
      {
        pinName: 'Pin PA0 (Pin 11)',
        pinType: 'PWM Output',
        connectedTo: 'Resistor R1 (220 Ω) Input',
        breadboardLocation: 'Breadboard Row 23, Column E',
        wireColorBadge: 'Orange DuPont Wire',
        wireColorHex: '#f97316',
        functionDesc: 'Timer2_CH1 PWM output drives the LiFi transmitter at 10 kHz with configurable duty cycle.'
      },
      {
        pinName: 'Pin PA1 (Pin 12)',
        pinType: 'ADC Input',
        connectedTo: 'LM358 Pin 1 (Amplifier Output)',
        breadboardLocation: 'Breadboard Row 50, Column A',
        wireColorBadge: 'Green DuPont Wire',
        wireColorHex: '#22c55e',
        functionDesc: 'ADC1_IN1 analog input samples recovered optical waveform at 1 MSPS with 12-bit resolution.'
      },
      {
        pinName: 'Pin 3.3V (Pin 18)',
        pinType: 'Power Output',
        connectedTo: 'Breadboard Red Positive Rail (+ Bus Rail)',
        breadboardLocation: 'Breadboard Power Rail (+)',
        wireColorBadge: 'Red DuPont Wire',
        wireColorHex: '#ef4444',
        functionDesc: 'Supplies regulated +3.3V from onboard LDO to power LM358 and reverse-bias photodiode.'
      },
      {
        pinName: 'Pin GND (Pin 19)',
        pinType: 'Ground Reference',
        connectedTo: 'Breadboard Blue Ground Rail (- Bus Rail)',
        breadboardLocation: 'Breadboard Ground Rail (-)',
        wireColorBadge: 'Black DuPont Wire',
        wireColorHex: '#475569',
        functionDesc: 'Ties microcontroller logic ground to breadboard ground rail for common zero-volt reference.'
      }
    ]
  },
  {
    id: 'transistor_2n2222',
    name: 'Transistor',
    subtitle: 'NPN (2N2222)',
    category: 'transistor',
    badge: 'Driver',
    badgeColor: 'bg-purple-950/80 border-purple-500/60 text-purple-300',
    type: '2N2222 NPN Silicon BJT (TO-92)',
    role: 'Fast LED Modulator Switching Driver',
    connectedTo: 'Base: PA0 via 1kΩ | Collector: LED Cathode',
    seriesResistor: '1 kΩ Base Drive',
    status: 'SATURATION/CUTOFF MOD',
    specs: [
      { label: 'Vceo', value: '40 V Max' },
      { label: 'Ic Max', value: '800 mA continuous' },
      { label: 'hFE Gain', value: '100 – 300' },
      { label: 'fT Bandwidth', value: '300 MHz' }
    ],
    signalInfo: {
      inputSignal: 'Base PWM Drive',
      voltage: 'Vce(sat) = 0.2 V',
      opticalOutput: 'Switched LED Loop'
    },
    macroImage: '/hardware/resistor_macro.jpg',
    thumbnail: '/hardware/resistor_macro.jpg',
    bounds: {
      x: 41.5,
      y: 38.0,
      width: 4.0,
      height: 5.5,
      labelX: 40.0,
      labelY: 35.0,
      color: '#a855f7' // purple
    },
    pinoutTable: [
      {
        pinName: 'Base (B)',
        pinType: 'Control Input',
        connectedTo: 'STM32 Pin PA0 via 1 kΩ base resistor',
        breadboardLocation: 'Row 31, Column C',
        wireColorBadge: 'Yellow Wire',
        wireColorHex: '#facc15',
        functionDesc: 'Switches the transistor between Cutoff (0V) and Saturation (3.3V) state.'
      },
      {
        pinName: 'Collector (C)',
        pinType: 'Current Sink',
        connectedTo: 'LED (TX) Cathode',
        breadboardLocation: 'Row 31, Column D',
        wireColorBadge: 'Blue Wire',
        wireColorHex: '#3b82f6',
        functionDesc: 'Sinks forward current from the LED to quickly turn optical pulses on and off.'
      },
      {
        pinName: 'Emitter (E)',
        pinType: 'Ground Reference',
        connectedTo: 'Breadboard Common Ground Rail (- Bus)',
        breadboardLocation: 'Row 31, Column E',
        wireColorBadge: 'Black Wire',
        wireColorHex: '#475569',
        functionDesc: 'Connected directly to circuit ground plane.'
      }
    ]
  },
  {
    id: 'multimeter_dmm',
    name: 'Multimeter',
    subtitle: 'Fluke 179 True RMS',
    category: 'instrument',
    badge: 'Test Probe',
    badgeColor: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
    type: 'Digital Benchtop/Handheld Multimeter',
    role: 'Node Voltage & Continuity Verification',
    connectedTo: 'Probing LED Anode vs Ground',
    seriesResistor: '10 MΩ Input Impedance',
    status: '3.32 V DC (Steady)',
    specs: [
      { label: 'Display Count', value: '6000 Counts True RMS' },
      { label: 'DC Voltage Accuracy', value: '± 0.09%' },
      { label: 'Probing Point', value: 'STM32 PA0 Output Rail' },
      { label: 'Sampling Rate', value: '4 readings / sec' }
    ],
    signalInfo: {
      inputSignal: 'Probed DC Node',
      voltage: '3.32 V DC',
      opticalOutput: 'N/A'
    },
    macroImage: '/hardware/multimeter.jpg',
    thumbnail: '/hardware/multimeter.jpg',
    bounds: {
      x: 30.5,
      y: 22.0,
      width: 9.0,
      height: 14.0,
      labelX: 30.5,
      labelY: 18.0,
      color: '#eab308' // yellow
    },
    pinoutTable: [
      {
        pinName: 'Red Probe Lead (+)',
        pinType: 'Voltage Input',
        connectedTo: 'Resistor R1 / LED Anode Node',
        breadboardLocation: 'Breadboard Row 28, Column C',
        wireColorBadge: 'Red Test Lead Cable',
        wireColorHex: '#ef4444',
        functionDesc: 'Probes live forward voltage potential (measures 3.32 V steady).'
      },
      {
        pinName: 'Black Probe Lead (-)',
        pinType: 'COM Reference',
        connectedTo: 'Breadboard Blue Ground Rail (- Bus Rail)',
        breadboardLocation: 'Breadboard Ground Rail (-)',
        wireColorBadge: 'Black Test Lead Cable',
        wireColorHex: '#0f172a',
        functionDesc: 'Clipped to common system ground to establish zero-volt reference plane.'
      }
    ]
  }
];

export const RealHardwareTwinLab: React.FC<RealHardwareTwinLabProps> = ({
  projectName = 'SemLiFi Real Hardware & Circuit Simulation',
  onOpenReport,
  onOpenGuidedBuild,
  onSwitchToSimulation,
  onSwitchToSchematic
}) => {
  // Navigation View Selection
  const [activeView, setActiveView] = useState<'hardware' | 'schematic' | 'simulation' | 'waveforms' | 'presentation'>('hardware');

  // Simulation Running State
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // Selected Component (default: LED (TX))
  const [selectedCompId, setSelectedCompId] = useState<string>('led_tx');
  const selectedComp = useMemo(() => {
    return HARDWARE_COMPONENTS.find(c => c.id === selectedCompId) || HARDWARE_COMPONENTS[0];
  }, [selectedCompId]);

  // Selected Wire Highlight
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [hoveredWireId, setHoveredWireId] = useState<string | null>(null);

  // Wire Visibility Toggle on Photo
  const [showWireTraces, setShowWireTraces] = useState<boolean>(true);
  const [showPinoutOverlay, setShowPinoutOverlay] = useState<boolean>(true);

  // Bottom Left Panel Tabs: 'schematic' vs 'connectionsTable'
  const [bottomLeftTab, setBottomLeftTab] = useState<'schematic' | 'connectionsTable'>('schematic');

  // Professor Explanation Modal
  const [showProfessorModal, setShowProfessorModal] = useState<boolean>(false);

  // Search filter in component library
  const [searchTerm, setSearchTerm] = useState<string>('');
  const filteredComponents = useMemo(() => {
    if (!searchTerm) return HARDWARE_COMPONENTS;
    return HARDWARE_COMPONENTS.filter(c =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.type.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Simulation Controls Parameters
  const [pwmFrequency, setPwmFrequency] = useState<number>(10.0); // kHz
  const [pwmDutyCycle, setPwmDutyCycle] = useState<number>(50); // %
  const [supplyVoltage, setSupplyVoltage] = useState<number>(3.3); // V

  // Right-bottom sub-tab: 'optical' vs 'multimeter'
  const [rightBottomTab, setRightBottomTab] = useState<'optical' | 'multimeter'>('optical');
  const [dmmSubTab, setDmmSubTab] = useState<'Voltage' | 'Current' | 'Resistance' | 'Frequency'>('Voltage');

  // Waveform canvas settings
  const [scopePaused, setScopePaused] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Optical photons animation frame
  const [photonTick, setPhotonTick] = useState<number>(0);
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setPhotonTick(prev => (prev + 1) % 100);
    }, 40);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Hardware View Zoom/Pan
  const [photoZoom, setPhotoZoom] = useState<number>(1.0);
  const [photoPan, setPhotoPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Real-time Oscilloscope Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Dark oscilloscope CRT background
      ctx.fillStyle = '#060a12';
      ctx.fillRect(0, 0, w, h);

      // Oscilloscope Grid Lines
      ctx.strokeStyle = '#121e33';
      ctx.lineWidth = 1;
      const cols = 10;
      const rows = 6;

      for (let i = 0; i <= cols; i++) {
        const x = (w / cols) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      for (let j = 0; j <= rows; j++) {
        const y = (h / rows) * j;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Center crosshairs with tick dots
      ctx.strokeStyle = '#1c2d47';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, h / 2);
      ctx.lineTo(w, h / 2);
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, h);
      ctx.stroke();

      if (isRunning && !scopePaused) {
        offset = (offset + (pwmFrequency / 10.0) * 3) % (w / 2);
      }

      // Calculate waveform wave period
      const period = (w / 5) * (10 / Math.max(2, pwmFrequency));
      const dutyFraction = pwmDutyCycle / 100;

      // -------------------------------------------------------------
      // CHANNEL 1: PWM (LED Input) - YELLOW (#eab308)
      // High: 3.3V, Low: 0V
      // -------------------------------------------------------------
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const ch1BaseY = h * 0.45;
      const ch1Amp = h * 0.32;

      for (let x = 0; x < w; x++) {
        const phase = ((x + offset) % period) / period;
        const isHigh = phase < dutyFraction;
        const y = isHigh ? ch1BaseY - ch1Amp : ch1BaseY;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // -------------------------------------------------------------
      // CHANNEL 2: Photodiode Output - GREEN (#22c55e)
      // Realistic filtered response with rise/fall RC curve & optical noise
      // -------------------------------------------------------------
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#22c55e';
      ctx.shadowBlur = 6;
      ctx.beginPath();

      const ch2BaseY = h * 0.88;
      const ch2Amp = h * 0.25;

      for (let x = 0; x < w; x++) {
        const phase = ((x + offset) % period) / period;
        let vNormalized = 0;

        if (phase < dutyFraction) {
          const tNorm = phase / dutyFraction;
          vNormalized = 1 - Math.exp(-tNorm * 4.2);
        } else {
          const tNorm = (phase - dutyFraction) / (1 - dutyFraction);
          vNormalized = Math.exp(-tNorm * 3.8);
        }

        const noise = (Math.sin(x * 1.5 + offset) * 0.015) + (Math.cos(x * 0.8) * 0.01);
        const y = ch2BaseY - ((vNormalized + noise) * ch2Amp);

        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      ctx.shadowBlur = 0;

      if (isRunning && !scopePaused) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isRunning, scopePaused, pwmFrequency, pwmDutyCycle]);

  // Stepper handlers for simulation controls
  const handleFreqChange = (delta: number) => {
    setPwmFrequency(prev => Math.max(1, Math.min(100, Math.round((prev + delta) * 10) / 10)));
  };

  const handleDutyChange = (delta: number) => {
    setPwmDutyCycle(prev => Math.max(10, Math.min(90, prev + delta)));
  };

  const handleVoltageChange = (delta: number) => {
    setSupplyVoltage(prev => Math.max(1.8, Math.min(5.0, Math.round((prev + delta) * 10) / 10)));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#070b14] text-slate-100 font-sans select-none">
      {/* ========================================================= */}
      {/* 1. TOP HEADER NAVIGATION BAR                              */}
      {/* ========================================================= */}
      <header className="h-[52px] bg-[#0c1220] border-b border-[#1b253b] px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 via-cyan-500 to-emerald-400 p-[1.5px] shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#080f1e] rounded-[7px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-white tracking-wide font-mono">SemLiFi</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800 font-mono">
                REAL HARDWARE DIGITAL TWIN
              </span>
            </div>
            <p className="text-[11px] text-slate-400 -mt-0.5">Physical Breadboard Wiring &amp; Circuit Simulation</p>
          </div>
        </div>

        {/* Center: Navigation View Tabs */}
        <div className="flex items-center bg-[#070b14] p-1 rounded-xl border border-[#1b253b] space-x-1 shadow-inner">
          <button
            onClick={() => setActiveView('hardware')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeView === 'hardware'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Hardware View</span>
          </button>

          <button
            onClick={() => {
              setActiveView('schematic');
              if (onSwitchToSchematic) onSwitchToSchematic();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeView === 'schematic'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Schematic View</span>
          </button>

          <button
            onClick={() => {
              setActiveView('simulation');
              if (onSwitchToSimulation) onSwitchToSimulation();
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeView === 'simulation'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Simulation View</span>
          </button>

          <button
            onClick={() => setActiveView('waveforms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              activeView === 'waveforms'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                : 'text-slate-400 hover:text-white hover:bg-[#131b2e]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Waveforms</span>
          </button>

          <button
            onClick={() => setShowProfessorModal(true)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-600/50 flex items-center space-x-1.5 transition-all shadow-md shadow-amber-900/20"
            title="Complete Wiring Connections Guide for Professor"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
            <span>Professor Wiring Guide</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-600/90 hover:bg-rose-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-rose-600/25 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={() => setIsRunning(true)}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center space-x-1.5 shadow-md shadow-emerald-600/25 transition-all animate-pulse"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Simulation</span>
            </button>
          )}

          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-2.5 py-1.5 rounded-lg bg-[#151f33] hover:bg-[#1f2d47] text-cyan-300 border border-cyan-800/40 text-xs font-mono transition-all"
              title="Generate IEEE Project Report"
            >
              Report
            </button>
          )}

          <button
            onClick={() => {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }}
            className="p-2 rounded-lg bg-[#151f33] hover:bg-[#1f2d47] text-slate-300 border border-slate-700/50 transition-all"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN 6-PANEL WORKBENCH DASHBOARD                       */}
      {/* ========================================================= */}
      <main className="flex-1 p-3 grid grid-cols-12 grid-rows-12 gap-3 min-h-0 overflow-hidden">
        {/* ------------------------------------------------------- */}
        {/* PANEL 1: LEFT SIDEBAR (COMPONENTS & VIEWS)              */}
        {/* Columns: 1 to 3 (w ~250px) | Rows: 1 to 12              */}
        {/* ------------------------------------------------------- */}
        <aside className="col-span-2 row-span-12 flex flex-col gap-3 min-h-0">
          {/* Card 1: Components List */}
          <div className="flex-1 bg-[#0c1220] border border-[#1b253b] rounded-xl flex flex-col min-h-0 shadow-lg overflow-hidden">
            <div className="p-3 border-b border-[#1b253b] bg-[#0f172a]/60">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white tracking-wide">Components</span>
                <span className="text-[10px] text-cyan-400 font-mono font-semibold">6 CONNECTED</span>
              </div>
              <div className="relative mt-2">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search component..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#080d17] border border-[#1e2a42] rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* List of hardware components with real photo thumbnails */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredComponents.map((comp) => {
                const isSelected = selectedCompId === comp.id;
                return (
                  <button
                    key={comp.id}
                    onClick={() => {
                      setSelectedCompId(comp.id);
                      setSelectedWireId(null);
                    }}
                    className={`w-full text-left p-2 rounded-lg transition-all flex items-center space-x-2.5 border ${
                      isSelected
                        ? 'bg-blue-950/60 border-blue-500 shadow-md shadow-blue-500/10'
                        : 'bg-[#090e1a] border-[#162033] hover:bg-[#131c30] hover:border-slate-700'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative">
                      <img
                        src={comp.thumbnail}
                        alt={comp.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 border-2 border-cyan-400 rounded-md pointer-events-none" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {comp.name}
                        </span>
                        {comp.id === 'led_tx' && isRunning && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{comp.subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 2: Views Switcher */}
          <div className="h-44 bg-[#0c1220] border border-[#1b253b] rounded-xl flex flex-col p-2.5 shadow-lg shrink-0">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase px-2 mb-1.5">Views</span>
            <div className="flex flex-col space-y-1">
              <button
                onClick={() => setActiveView('hardware')}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'hardware'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-[#131c30]'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Real Hardware</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('schematic');
                  if (onSwitchToSchematic) onSwitchToSchematic();
                }}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'schematic'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-[#131c30]'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Schematic</span>
              </button>

              <button
                onClick={() => {
                  setActiveView('simulation');
                  if (onSwitchToSimulation) onSwitchToSimulation();
                }}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'simulation'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-[#131c30]'
                }`}
              >
                <Play className="w-3.5 h-3.5" />
                <span>Live Simulation</span>
              </button>

              <button
                onClick={() => setActiveView('waveforms')}
                className={`flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  activeView === 'waveforms'
                    ? 'bg-blue-600 text-white font-semibold shadow'
                    : 'text-slate-300 hover:bg-[#131c30]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Waveforms</span>
              </button>
            </div>
          </div>
        </aside>

        {/* ------------------------------------------------------- */}
        {/* PANEL 2: CENTER TOP: REAL HARDWARE VIEW (LIVE TWIN)     */}
        {/* Columns: 3 to 9 | Rows: 1 to 7                          */}
        {/* ------------------------------------------------------- */}
        <section className="col-span-7 row-span-7 bg-[#0c1220] border border-[#1b253b] rounded-xl flex flex-col shadow-lg overflow-hidden relative">
          {/* Header */}
          <div className="p-2 px-3 border-b border-[#1b253b] bg-[#0f172a]/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white tracking-wide">Real Hardware View</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/90 text-emerald-300 border border-emerald-800 font-mono">
                Live Breadboard Wiring
              </span>
            </div>

            {/* Viewport Action Tools */}
            <div className="flex items-center space-x-2">
              {/* Wiring Traces Toggle Button */}
              <button
                onClick={() => setShowWireTraces(w => !w)}
                className={`px-2 py-0.5 text-[11px] font-mono rounded flex items-center space-x-1 border transition-all ${
                  showWireTraces
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-600 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                    : 'bg-[#151f33] text-slate-400 border-slate-700'
                }`}
                title="Toggle Physical Jumper Wire Traces on Hardware"
              >
                <span>Wires: {showWireTraces ? 'ON' : 'OFF'}</span>
              </button>

              <button
                onClick={() => setPhotoZoom(prev => Math.min(2.0, prev + 0.15))}
                className="p-1 hover:bg-[#1c273e] text-slate-300 rounded"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPhotoZoom(prev => Math.max(0.7, prev - 0.15))}
                className="p-1 hover:bg-[#1c273e] text-slate-300 rounded"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { setPhotoZoom(1.0); setPhotoPan({ x: 0, y: 0 }); }}
                className="px-2 py-0.5 text-[11px] bg-[#162238] hover:bg-[#1e2f4d] text-cyan-300 border border-cyan-800/40 rounded flex items-center space-x-1"
                title="Reset View"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset View</span>
              </button>
            </div>
          </div>

          {/* Photo Canvas with Augmented Reality (AR) Overlays & Physical Wires */}
          <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
            <div
              className="relative w-full h-full transition-transform duration-100"
              style={{
                transform: `scale(${photoZoom}) translate(${photoPan.x}px, ${photoPan.y}px)`
              }}
            >
              {/* Real Photograph of the physical circuit */}
              <img
                src="/hardware/media_1791198828270.jpg"
                alt="SemLiFi Real Hardware Setup"
                className="w-full h-full object-cover pointer-events-none"
              />

              {/* SVG Overlay for Interactive Physical Jumper Wires & Glowing Labels */}
              <svg className="absolute inset-0 w-full h-full pointer-events-auto">
                <defs>
                  {/* Glowing Filter for bounding boxes and wires */}
                  <filter id="arGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Pulsing Radial Gradient for LED emission */}
                  <radialGradient id="ledEmission" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="40%" stopColor="#f43f5e" stopOpacity="0.6" />
                    <stop offset="80%" stopColor="#e11d48" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#991b1b" stopOpacity="0" />
                  </radialGradient>
                </defs>

                {/* ------------------------------------------------------------- */}
                {/* PHYSICAL JUMPER WIRES DRAWN OVER THE PHOTOGRAPH               */}
                {/* ------------------------------------------------------------- */}
                {showWireTraces && PHYSICAL_WIRING_NETLIST.map((wire) => {
                  const isWireSelected = selectedWireId === wire.id;
                  const isWireHovered = hoveredWireId === wire.id;
                  const p = wire.path;
                  const pathString = `M ${p.x1} ${p.y1} C ${p.cx1} ${p.cy1}, ${p.cx2} ${p.cy2}, ${p.x2} ${p.y2}`;

                  return (
                    <g
                      key={wire.id}
                      onClick={() => {
                        setSelectedWireId(wire.id);
                        setBottomLeftTab('connectionsTable');
                      }}
                      onMouseEnter={() => setHoveredWireId(wire.id)}
                      onMouseLeave={() => setHoveredWireId(null)}
                      className="cursor-pointer group"
                    >
                      {/* Outer shadow / glow path */}
                      <path
                        d={pathString}
                        fill="none"
                        stroke={wire.wireColorHex}
                        strokeWidth={isWireSelected || isWireHovered ? 6 : 4}
                        strokeOpacity={isWireSelected || isWireHovered ? 0.9 : 0.5}
                        strokeDasharray={wire.id === 'wire_optical_link' ? '4 4' : undefined}
                        filter="url(#arGlow)"
                      />

                      {/* Core wire path */}
                      <path
                        d={pathString}
                        fill="none"
                        stroke={wire.id === 'wire_optical_link' ? '#f43f5e' : '#ffffff'}
                        strokeWidth={isWireSelected || isWireHovered ? 2.5 : 1.8}
                        strokeDasharray={wire.id === 'wire_optical_link' ? '4 4' : undefined}
                      />

                      {/* Moving signal particle along wire when running */}
                      {isRunning && (
                        <circle
                          r={isWireSelected || isWireHovered ? 3.5 : 2.5}
                          fill={wire.wireColorHex}
                          filter="url(#arGlow)"
                        >
                          <animateMotion
                            path={pathString}
                            dur={wire.id === 'wire_optical_link' ? '0.8s' : '1.4s'}
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}

                      {/* Tooltip on Hover */}
                      {isWireHovered && (
                        <foreignObject
                          x={`${(p.x1 + p.x2) / 2 - 80}`}
                          y={`${(p.y1 + p.y2) / 2 - 35}`}
                          width={190}
                          height={50}
                          className="overflow-visible pointer-events-none z-50"
                        >
                          <div className="bg-[#0b1220]/95 border border-cyan-400 rounded-lg p-1.5 shadow-2xl text-[10px] font-mono text-slate-100">
                            <div className="font-bold text-cyan-300 flex items-center space-x-1">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: wire.wireColorHex }} />
                              <span>{wire.wireName}</span>
                            </div>
                            <div className="text-[9px] text-slate-300 truncate">
                              {wire.fromPin} ➔ {wire.toPin}
                            </div>
                            <div className="text-[9px] text-emerald-400">{wire.voltage} ({wire.signalType})</div>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}

                {/* ------------------------------------------------------------- */}
                {/* INTERACTIVE COMPONENT BOUNDING BOXES & LABELS                 */}
                {/* ------------------------------------------------------------- */}
                {HARDWARE_COMPONENTS.map((comp) => {
                  const isSelected = selectedCompId === comp.id;
                  const b = comp.bounds;

                  return (
                    <g
                      key={comp.id}
                      onClick={() => {
                        setSelectedCompId(comp.id);
                        setSelectedWireId(null);
                      }}
                      className="cursor-pointer group"
                    >
                      {/* Special Pulsing Optical Radiation for LED when running */}
                      {comp.id === 'led_tx' && isRunning && (
                        <circle
                          cx={`${b.x + b.width / 2}%`}
                          cy={`${b.y + b.height / 2}%`}
                          r={30}
                          fill="url(#ledEmission)"
                          className="animate-pulse"
                        />
                      )}

                      {/* AR Bounding Box Rectangle */}
                      <rect
                        x={`${b.x}%`}
                        y={`${b.y}%`}
                        width={`${b.width}%`}
                        height={`${b.height}%`}
                        rx={4}
                        fill={isSelected ? `${b.color}25` : `${b.color}10`}
                        stroke={b.color}
                        strokeWidth={isSelected ? 2.5 : 1.5}
                        strokeDasharray={isSelected ? undefined : '3 2'}
                        filter={isSelected ? 'url(#arGlow)' : undefined}
                        className="transition-all"
                      />

                      {/* AR Pill Label */}
                      <g transform={`translate(0, 0)`}>
                        <foreignObject
                          x={`${b.labelX}%`}
                          y={`${b.labelY}%`}
                          width={150}
                          height={28}
                          className="overflow-visible pointer-events-none"
                        >
                          <div
                            className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold shadow-lg transition-all ${
                              isSelected
                                ? 'bg-black/95 text-white border-2'
                                : 'bg-black/80 text-slate-200 border'
                            }`}
                            style={{ borderColor: b.color }}
                          >
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.color }} />
                            <span>{comp.name}</span>
                          </div>
                        </foreignObject>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* PANEL 3: RIGHT TOP: COMPONENT DETAILS & PIN CONNECTIONS */}
        {/* Columns: 10 to 12 (w ~320px) | Rows: 1 to 6             */}
        {/* ------------------------------------------------------- */}
        <section className="col-span-3 row-span-6 bg-[#0c1220] border border-[#1b253b] rounded-xl flex flex-col shadow-lg overflow-hidden">
          {/* Header */}
          <div className="p-2 px-3 border-b border-[#1b253b] bg-[#0f172a]/80 flex items-center justify-between shrink-0">
            <span className="text-xs font-bold text-white tracking-wide">Component Details &amp; Pinout</span>
            <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer" />
          </div>

          <div className="flex-1 p-2.5 overflow-y-auto space-y-2.5">
            {/* Top row: Macro Image + Title & Badge */}
            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-900 border border-slate-700 shrink-0 relative shadow-inner">
                <img
                  src={selectedComp.macroImage}
                  alt={selectedComp.name}
                  className="w-full h-full object-cover"
                />
                {selectedComp.id === 'led_tx' && isRunning && (
                  <div className="absolute inset-0 bg-red-500/20 mix-blend-screen animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="text-sm font-bold text-white truncate font-mono">{selectedComp.name}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-semibold ${selectedComp.badgeColor}`}>
                    {selectedComp.badge}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 truncate">{selectedComp.subtitle}</p>
                <div className="mt-1 text-[11px] font-mono text-emerald-400 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Status: {selectedComp.status}</span>
                </div>
              </div>
            </div>

            {/* Signal Information Card with Glowing Lightbulb */}
            <div className="bg-gradient-to-r from-[#091529] to-[#0d1a33] border border-cyan-900/60 rounded-lg p-2 flex items-center justify-between shadow-inner">
              <div className="space-y-1 text-xs font-mono">
                <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                  <Activity className="w-3 h-3 text-cyan-400" />
                  <span>Signal Information</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="text-slate-400">Input Signal:</span>
                  <span className="text-white font-bold">{selectedComp.signalInfo.inputSignal}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="text-slate-400">Voltage:</span>
                  <span className="text-amber-400 font-bold">{selectedComp.signalInfo.voltage}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-300">
                  <span className="text-slate-400">Output:</span>
                  <span className="text-emerald-400 font-bold">{selectedComp.signalInfo.opticalOutput}</span>
                </div>
              </div>

              {/* Glowing Bulb Icon */}
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Lightbulb
                  className={`w-5 h-5 transition-all ${
                    isRunning ? 'text-amber-400 fill-amber-400/80 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]' : 'text-slate-600'
                  }`}
                />
              </div>
            </div>

            {/* PHYSICAL CONNECTIONS & BREADBOARD PINOUT TABLE */}
            <div className="bg-[#080d17] border border-[#182338] rounded-lg p-2 space-y-2">
              <div className="flex justify-between items-center border-b border-[#182338] pb-1">
                <span className="text-[11px] font-bold text-cyan-300 font-mono uppercase tracking-wider flex items-center space-x-1">
                  <Layers className="w-3 h-3 text-cyan-400" />
                  <span>Physical Pin Connections</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">BREADBOARD HOLES</span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                {selectedComp.pinoutTable.map((p, idx) => (
                  <div key={idx} className="bg-[#0c1322] border border-[#1a2942] rounded-lg p-2 space-y-1">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.wireColorHex }} />
                        <span className="font-bold text-white text-[11px]">{p.pinName}</span>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {p.breadboardLocation}
                      </span>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-300">
                      <span className="text-slate-400">Connects to:</span>
                      <strong className="text-cyan-300 truncate max-w-[170px]" title={p.connectedTo}>{p.connectedTo}</strong>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Wire Color:</span>
                      <span className="text-amber-300 font-semibold">{p.wireColorBadge}</span>
                    </div>

                    <p className="text-[9px] text-slate-400 italic pt-0.5 border-t border-slate-800">
                      {p.functionDesc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* PANEL 4: RIGHT BOTTOM: OPTICAL VIZ / MULTIMETER VIEW    */}
        {/* Columns: 10 to 12 | Rows: 7 to 12                       */}
        {/* ------------------------------------------------------- */}
        <section className="col-span-3 row-span-6 bg-[#0c1220] border border-[#1b253b] rounded-xl flex flex-col shadow-lg overflow-hidden">
          {/* Header with Sub-tabs */}
          <div className="p-2 px-3 border-b border-[#1b253b] bg-[#0f172a]/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1 bg-[#080d17] p-0.5 rounded-lg border border-[#1e2a42]">
              <button
                onClick={() => setRightBottomTab('optical')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  rightBottomTab === 'optical'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Optical Beam
              </button>
              <button
                onClick={() => setRightBottomTab('multimeter')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                  rightBottomTab === 'multimeter'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Multimeter View
              </button>
            </div>
            <Maximize2 className="w-3.5 h-3.5 text-slate-400 hover:text-white cursor-pointer" />
          </div>

          {/* TAB 1: LIVE OPTICAL VISUALIZATION */}
          {rightBottomTab === 'optical' && (
            <div className="flex-1 p-3 flex flex-col justify-between overflow-hidden bg-black/40">
              <span className="text-[11px] font-bold text-slate-300 font-mono flex items-center space-x-1.5">
                <Radio className="w-3 h-3 text-rose-400" />
                <span>Live Optical Visualization (LED → Photodiode)</span>
              </span>

              {/* Free-space transmission visual */}
              <div className="flex-1 my-2 rounded-lg bg-[#070b14] border border-[#182338] relative flex items-center justify-between px-6 overflow-hidden">
                <div
                  className="absolute inset-0 opacity-15 pointer-events-none"
                  style={{
                    backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)',
                    backgroundSize: '16px 16px'
                  }}
                />

                {/* Left: LED Transmitter Dome */}
                <div className="flex flex-col items-center space-y-1 relative z-10">
                  <div className="w-14 h-14 rounded-full bg-slate-900 border-2 border-rose-500 overflow-hidden relative shadow-lg shadow-rose-500/20">
                    <img src="/hardware/led_macro.jpg" alt="LED" className="w-full h-full object-cover" />
                    {isRunning && (
                      <div className="absolute inset-0 bg-rose-500/30 mix-blend-screen animate-ping" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-rose-400">LED (TX)</span>
                </div>

                {/* Center: Free-Space Optical Photons Travelling */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
                  <div className="w-full flex items-center justify-between relative py-2">
                    <div className="w-full h-0.5 bg-rose-950 border-b border-rose-500/40" />
                    {isRunning && (
                      <div className="absolute inset-0 flex items-center justify-around pointer-events-none">
                        {[0, 1, 2, 3].map((idx) => {
                          const shift = ((photonTick + idx * 25) % 100);
                          return (
                            <div
                              key={idx}
                              className="absolute w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]"
                              style={{ left: `${shift}%` }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1">Air Gap: 15 cm</span>
                </div>

                {/* Right: Photodiode Receiver */}
                <div className="flex flex-col items-center space-y-1 relative z-10">
                  <div className="w-14 h-14 rounded-md bg-slate-900 border-2 border-emerald-500 overflow-hidden relative shadow-lg shadow-emerald-500/20">
                    <img src="/hardware/photodiode_macro.jpg" alt="Photodiode" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400">Photodiode (RX)</span>
                </div>
              </div>

              {/* Channel Telemetry */}
              <div className="p-2 rounded bg-[#090e1a] border border-[#162033] flex justify-between items-center text-[10px] font-mono text-slate-300">
                <span>Modulation: <strong className="text-white">OOK (10 kHz)</strong></span>
                <span>Photocurrent: <strong className="text-emerald-400">42.8 µA</strong></span>
                <span>SNR: <strong className="text-cyan-400">28.4 dB</strong></span>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE MEASUREMENT (MULTIMETER VIEW) */}
          {rightBottomTab === 'multimeter' && (
            <div className="flex-1 p-2.5 flex flex-col justify-between overflow-hidden bg-black/40">
              <div className="flex items-center space-x-1 bg-[#080d17] p-1 rounded-lg border border-[#1e2a42] text-[10px] font-mono">
                {(['Voltage', 'Current', 'Resistance', 'Frequency'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => setDmmSubTab(mode)}
                    className={`flex-1 py-0.5 rounded text-center font-bold transition-all ${
                      dmmSubTab === mode
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <div className="my-2 bg-[#1a2333] border-2 border-[#334155] rounded-xl p-3 flex flex-col items-center justify-center shadow-2xl relative">
                <div className="w-full bg-[#9dae93] border border-[#788a6e] rounded-lg p-2.5 flex flex-col shadow-inner">
                  <div className="flex justify-between items-center text-[9px] font-mono text-slate-800 font-bold">
                    <span>FLUKE 179 TRUE RMS</span>
                    <span>AUTO DC</span>
                  </div>
                  <div className="text-center my-1">
                    <span className="text-3xl font-mono font-black text-slate-950 tracking-wider">
                      {dmmSubTab === 'Voltage' ? (supplyVoltage > 0 ? (supplyVoltage + 0.02).toFixed(2) : '0.00') :
                       dmmSubTab === 'Current' ? '14.2' :
                       dmmSubTab === 'Resistance' ? '219.4' :
                       `${pwmFrequency.toFixed(1)}k`}
                    </span>
                    <span className="text-sm font-mono font-bold text-slate-800 ml-1.5">
                      {dmmSubTab === 'Voltage' ? 'V' :
                       dmmSubTab === 'Current' ? 'mA' :
                       dmmSubTab === 'Resistance' ? 'Ω' :
                       'Hz'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-700/30 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-700 h-full rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (supplyVoltage / 5.0) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-400 flex justify-between bg-[#080d17] p-2 rounded border border-[#182338]">
                <span>Probe Red (+): <strong className="text-rose-400">STM32 PA0</strong></span>
                <span>Probe Black (-): <strong className="text-slate-300">GND Rail</strong></span>
              </div>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- */}
        {/* PANEL 5: BOTTOM LEFT: SCHEMATIC OR COMPLETE PINOUT TABLE */}
        {/* Columns: 3 to 7 | Rows: 8 to 12                         */}
        {/* ------------------------------------------------------- */}
        <section className="col-span-5 row-span-5 bg-[#0c1220] border border-[#1b253b] rounded-xl flex flex-col shadow-lg overflow-hidden">
          {/* Header with Switcher Tabs */}
          <div className="p-2 px-3 border-b border-[#1b253b] bg-[#0f172a]/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-1 bg-[#080d17] p-0.5 rounded-lg border border-[#1e2a42]">
              <button
                onClick={() => setBottomLeftTab('schematic')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  bottomLeftTab === 'schematic'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Schematic &amp; Controls</span>
              </button>

              <button
                onClick={() => setBottomLeftTab('connectionsTable')}
                className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                  bottomLeftTab === 'connectionsTable'
                    ? 'bg-blue-600 text-white font-bold'
                    : 'text-amber-300 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Complete Breadboard Wiring Table</span>
              </button>
            </div>

            <button
              onClick={() => setShowProfessorModal(true)}
              className="text-[11px] text-amber-400 hover:underline flex items-center space-x-1 font-mono"
            >
              <span>Viva Guide</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* TAB 1: SCHEMATIC & SIMULATION CONTROLS */}
          {bottomLeftTab === 'schematic' && (
            <div className="flex-1 p-3 grid grid-cols-2 gap-3 min-h-0 overflow-hidden">
              {/* Left: Electronic Schematic Diagram */}
              <div className="bg-[#070b14] border border-[#182338] rounded-lg p-2 relative flex flex-col justify-between overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 font-mono">ANSI / IEEE Topology</span>

                <svg className="w-full h-full flex-1 my-1" viewBox="0 0 280 140">
                  <rect x="10" y="30" width="55" height="70" rx="3" fill="#0f1f3d" stroke="#3b82f6" strokeWidth="1.5" />
                  <text x="37" y="55" fill="#93c5fd" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">STM32</text>
                  <text x="37" y="68" fill="#60a5fa" fontSize="6" textAnchor="middle" fontFamily="monospace">PA0 (PWM)</text>
                  <text x="37" y="85" fill="#34d399" fontSize="6" textAnchor="middle" fontFamily="monospace">ADC (PA1)</text>

                  <line x1="65" y1="65" x2="85" y2="65" stroke="#94a3b8" strokeWidth="1.5" />

                  <rect x="85" y="58" width="30" height="14" rx="2" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="100" y="68" fill="#fbbf24" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">220 Ω</text>

                  <line x1="115" y1="65" x2="135" y2="65" stroke="#94a3b8" strokeWidth="1.5" />

                  <polygon points="135,55 135,75 150,65" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
                  <line x1="150" y1="55" x2="150" y2="75" stroke="#ef4444" strokeWidth="1.5" />
                  <line x1="145" y1="52" x2="155" y2="42" stroke="#ef4444" strokeWidth="1" />
                  <line x1="150" y1="56" x2="160" y2="46" stroke="#ef4444" strokeWidth="1" />
                  <text x="142" y="87" fill="#fca5a5" fontSize="6" textAnchor="middle" fontFamily="monospace">LED (TX)</text>

                  <line x1="155" y1="65" x2="185" y2="65" stroke="#ef4444" strokeWidth="1" strokeDasharray="2 2" />

                  <polygon points="200,55 200,75 185,65" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
                  <line x1="185" y1="55" x2="185" y2="75" stroke="#10b981" strokeWidth="1.5" />
                  <line x1="175" y1="42" x2="185" y2="52" stroke="#10b981" strokeWidth="1" />
                  <line x1="180" y1="46" x2="190" y2="56" stroke="#10b981" strokeWidth="1" />
                  <text x="192" y="87" fill="#6ee7b7" fontSize="6" textAnchor="middle" fontFamily="monospace">PD (RX)</text>

                  <line x1="200" y1="65" x2="220" y2="65" stroke="#94a3b8" strokeWidth="1.5" />

                  <polygon points="220,45 220,85 255,65" fill="#132338" stroke="#38bdf8" strokeWidth="1.5" />
                  <text x="232" y="67" fill="#7dd3fc" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="monospace">LM358</text>

                  <line x1="255" y1="65" x2="275" y2="65" stroke="#34d399" strokeWidth="1.5" />
                  <line x1="275" y1="65" x2="275" y2="120" stroke="#34d399" strokeWidth="1.5" />
                  <line x1="275" y1="120" x2="37" y2="120" stroke="#34d399" strokeWidth="1.5" />
                  <line x1="37" y1="120" x2="37" y2="100" stroke="#34d399" strokeWidth="1.5" />

                  {isRunning && (
                    <circle
                      cx={65 + ((photonTick % 30) / 30) * 70}
                      cy="65"
                      r="2"
                      fill="#38bdf8"
                    />
                  )}
                </svg>
              </div>

              {/* Right: Simulation Controls Form */}
              <div className="bg-[#070b14] border border-[#182338] rounded-lg p-2.5 flex flex-col justify-between font-mono text-xs">
                <span className="text-[11px] font-bold text-slate-300">Simulation Controls</span>

                <div className="space-y-2.5 my-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">PWM Frequency:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleFreqChange(-1.0)}
                        className="w-5 h-5 rounded bg-[#162238] hover:bg-[#20304f] text-slate-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-16 text-center text-cyan-300 font-bold bg-[#0c1424] px-1 py-0.5 rounded border border-[#1e2d47]">
                        {pwmFrequency.toFixed(1)} kHz
                      </span>
                      <button
                        onClick={() => handleFreqChange(1.0)}
                        className="w-5 h-5 rounded bg-[#162238] hover:bg-[#20304f] text-slate-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">PWM Duty Cycle:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleDutyChange(-5)}
                        className="w-5 h-5 rounded bg-[#162238] hover:bg-[#20304f] text-slate-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-16 text-center text-amber-300 font-bold bg-[#0c1424] px-1 py-0.5 rounded border border-[#1e2d47]">
                        {pwmDutyCycle} %
                      </span>
                      <button
                        onClick={() => handleDutyChange(5)}
                        className="w-5 h-5 rounded bg-[#162238] hover:bg-[#20304f] text-slate-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-[11px]">Supply Voltage:</span>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleVoltageChange(-0.1)}
                        className="w-5 h-5 rounded bg-[#162238] hover:bg-[#20304f] text-slate-200 flex items-center justify-center font-bold"
                      >
                        -
                      </button>
                      <span className="w-16 text-center text-emerald-300 font-bold bg-[#0c1424] px-1 py-0.5 rounded border border-[#1e2d47]">
                        {supplyVoltage.toFixed(1)} V
                      </span>
                      <button
                        onClick={() => handleVoltageChange(0.1)}
                        className="w-5 h-5 rounded bg-[#162238] hover:bg-[#20304f] text-slate-200 flex items-center justify-center font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => setIsRunning(true)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                      isRunning
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-emerald-900/60 hover:bg-emerald-700 text-emerald-200 border border-emerald-600/50'
                    }`}
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Run</span>
                  </button>
                  <button
                    onClick={() => setIsRunning(false)}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-all ${
                      !isRunning
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                        : 'bg-[#182338] hover:bg-[#233352] text-slate-300'
                    }`}
                  >
                    <Square className="w-3 h-3 fill-current" />
                    <span>Stop</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETE PHYSICAL BREADBOARD WIRING NETLIST TABLE */}
          {bottomLeftTab === 'connectionsTable' && (
            <div className="flex-1 p-2 overflow-y-auto font-mono text-[10px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#1f2d47] text-slate-400 bg-[#090e1a]">
                    <th className="p-1.5">WIRE</th>
                    <th className="p-1.5">FROM NODE</th>
                    <th className="p-1.5">TO NODE</th>
                    <th className="p-1.5">SIGNAL</th>
                    <th className="p-1.5">VOLTAGE</th>
                    <th className="p-1.5">ROLE IN LIFI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141e30]">
                  {PHYSICAL_WIRING_NETLIST.map((w) => {
                    const isSelected = selectedWireId === w.id;
                    return (
                      <tr
                        key={w.id}
                        onClick={() => setSelectedWireId(w.id)}
                        className={`hover:bg-[#121c30] cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-950/70 border-l-2 border-cyan-400' : ''
                        }`}
                      >
                        <td className="p-1.5">
                          <span
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold text-black"
                            style={{ backgroundColor: w.wireColorHex }}
                          >
                            {w.wireColor}
                          </span>
                        </td>
                        <td className="p-1.5 text-white">
                          <div>{w.fromComp}</div>
                          <div className="text-[9px] text-cyan-400">{w.fromPin} ({w.fromHole})</div>
                        </td>
                        <td className="p-1.5 text-white">
                          <div>{w.toComp}</div>
                          <div className="text-[9px] text-emerald-400">{w.toPin} ({w.toHole})</div>
                        </td>
                        <td className="p-1.5 text-slate-300">{w.signalType}</td>
                        <td className="p-1.5 text-amber-400 font-bold">{w.voltage}</td>
                        <td className="p-1.5 text-slate-400 max-w-[140px] truncate" title={w.purpose}>
                          {w.purpose}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ------------------------------------------------------- */}
        {/* PANEL 6: BOTTOM RIGHT: LIVE WAVEFORMS (OSCILLOSCOPE)    */}
        {/* Columns: 8 to 12 | Rows: 8 to 12                        */}
        {/* ------------------------------------------------------- */}
        <section className="col-span-5 row-span-5 bg-[#0c1220] border border-[#1b253b] rounded-xl flex flex-col shadow-lg overflow-hidden">
          {/* Header with Channel Badges */}
          <div className="p-2 px-3 border-b border-[#1b253b] bg-[#0f172a]/80 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white tracking-wide">Live Waveforms</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-950/80 border border-yellow-500/60 text-yellow-300 font-mono">
                ■ PWM (LED Input)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 font-mono">
                ■ Photodiode Output
              </span>
            </div>

            {/* Scope Control Tools */}
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-300">
              <span className="text-slate-400">Time Base: <strong className="text-white">500 µs/div</strong></span>
              <button
                onClick={() => setScopePaused(prev => !prev)}
                className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center space-x-1 ${
                  scopePaused ? 'bg-amber-600 text-white' : 'bg-[#162238] hover:bg-[#20304f] text-slate-300'
                }`}
              >
                {scopePaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                <span>{scopePaused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>
          </div>

          {/* Oscilloscope Canvas & Axis Markers */}
          <div className="flex-1 relative bg-[#060a12] p-2 flex flex-col justify-between overflow-hidden">
            <div className="absolute left-3 top-3 bottom-6 flex flex-col justify-between text-[9px] font-mono text-slate-500 pointer-events-none z-10">
              <span className="text-amber-400 font-bold">3.3 V</span>
              <span className="text-emerald-400 font-bold">2.0 V</span>
              <span className="text-slate-500">0.0 V</span>
            </div>

            <canvas
              ref={canvasRef}
              width={640}
              height={180}
              className="w-full h-full rounded border border-[#16253d]"
            />

            <div className="flex justify-between px-6 pt-1 text-[9px] font-mono text-slate-400">
              <span>0 ms</span>
              <span>0.5 ms</span>
              <span>1.0 ms</span>
              <span>1.5 ms</span>
              <span>2.0 ms</span>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================= */}
      {/* 3. PROFESSOR VIVA & COMPLETE WIRING GUIDE MODAL           */}
      {/* ========================================================= */}
      {showProfessorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="bg-[#0b101c] border border-[#1f293d] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-[#1f293d] flex items-center justify-between bg-[#0e1526]">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                    SemLiFi Hardware Prototype: Professor &amp; Viva Explanation Guide
                  </h2>
                  <p className="text-[11px] text-slate-400">
                    Step-by-step physical breadboard connection logic, formulas, and viva questions.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProfessorModal(false)}
                className="p-1.5 hover:bg-[#1a2333] text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs text-slate-200">
              {/* Card 1: The Core Hardware Architecture */}
              <div className="bg-[#0e1627] border border-cyan-900/50 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wide flex items-center space-x-2">
                  <Cpu className="w-4 h-4 text-cyan-400" />
                  <span>1. How the Circuit is Physically Connected (The 5 Main Stages)</span>
                </h3>
                <div className="grid grid-cols-5 gap-2 text-center text-[11px] pt-1">
                  <div className="p-2 bg-[#090e1a] border border-blue-500/40 rounded-lg">
                    <strong className="text-blue-400 block">Stage 1: MCU</strong>
                    <span className="text-[10px] text-slate-400">STM32 Timer2_CH1 PWM (Pin PA0)</span>
                  </div>
                  <div className="p-2 bg-[#090e1a] border border-amber-500/40 rounded-lg">
                    <strong className="text-amber-400 block">Stage 2: Limiter</strong>
                    <span className="text-[10px] text-slate-400">220 Ω Resistor (Row 23 ➔ Row 28)</span>
                  </div>
                  <div className="p-2 bg-[#090e1a] border border-rose-500/40 rounded-lg">
                    <strong className="text-rose-400 block">Stage 3: Optical TX</strong>
                    <span className="text-[10px] text-slate-400">5mm Red LED (Row 28 ➔ Row 29 GND)</span>
                  </div>
                  <div className="p-2 bg-[#090e1a] border border-emerald-500/40 rounded-lg">
                    <strong className="text-emerald-400 block">Stage 4: Optical RX</strong>
                    <span className="text-[10px] text-slate-400">BPW34 Silicon PIN (Row 45 ➔ 46)</span>
                  </div>
                  <div className="p-2 bg-[#090e1a] border border-purple-500/40 rounded-lg">
                    <strong className="text-purple-400 block">Stage 5: Receiver</strong>
                    <span className="text-[10px] text-slate-400">LM358 TIA Pre-amp ➔ Pin PA1 ADC</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Essential Professor / Viva Questions */}
              <div className="bg-[#0e1627] border border-amber-900/50 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-bold text-amber-300 uppercase tracking-wide flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-amber-400" />
                  <span>2. Crucial Questions Your Professor Will Ask &amp; Exact Answers</span>
                </h3>

                <div className="space-y-2.5">
                  <div className="p-2.5 bg-[#090e1a] rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-1">
                      Q1: "Why did you use a 220 Ω resistor in series with the LED?"
                    </strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      <strong>Answer:</strong> The STM32 GPIO outputs +3.3V logic. The red LED has a forward voltage drop Vf ≈ 1.95V. Without a series resistor, excessive current would flow and destroy both the LED and the STM32 pin. By Ohm's law:
                      <br />
                      <code className="text-cyan-300 font-bold">I = (Vcc - Vf) / R = (3.3V - 1.95V) / 220 Ω = 1.35V / 220 Ω ≈ 6.1 mA – 14.2 mA peak.</code>
                      <br />
                      This keeps the current well within the safe 20 mA maximum GPIO rating of the STM32F103C8T6.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090e1a] rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-1">
                      Q2: "Why is the BPW34 photodiode connected in reverse bias?"
                    </strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      <strong>Answer:</strong> Operating the BPW34 in reverse-biased photoconductive mode creates a wider depletion region, decreasing the junction capacitance from 70 pF down to ~25 pF. This dramatically shortens the rise/fall time to under 20 ns, enabling high switching speeds (10 kHz to 100 kHz) without signal distortion.
                    </p>
                  </div>

                  <div className="p-2.5 bg-[#090e1a] rounded-lg border border-slate-800">
                    <strong className="text-amber-400 block mb-1">
                      Q3: "How does the receiver eliminate DC ambient room lighting (50/60 Hz fluorescent noise)?"
                    </strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      <strong>Answer:</strong> Room lights operate at DC or low-frequency (50/60 Hz or 100/120 Hz flicker). Our transmitter modulates data using a high-frequency 10 kHz OOK carrier wave. A high-pass RC filter at the input of the LM358 blocks the DC ambient light offset while passing the 10 kHz LiFi pulses directly into the comparator.
                    </p>
                  </div>
                </div>
              </div>

              {/* Card 3: Summary Wiring Netlist */}
              <div className="bg-[#0e1627] border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wide">
                  3. Color-Coded DuPont Wiring Summary
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="p-2 bg-[#090e1a] rounded border border-slate-800">
                    <strong className="text-orange-400">Orange Wire:</strong> STM32 PA0 ➔ Breadboard Row 23 (PWM Modulator Drive)
                  </div>
                  <div className="p-2 bg-[#090e1a] rounded border border-slate-800">
                    <strong className="text-yellow-400">Resistor R1:</strong> Breadboard Row 23 ➔ Breadboard Row 28 (220 Ω Limiter)
                  </div>
                  <div className="p-2 bg-[#090e1a] rounded border border-slate-800">
                    <strong className="text-blue-400">Blue Wire:</strong> LED Cathode (Row 29) ➔ Blue Ground Rail (- Bus)
                  </div>
                  <div className="p-2 bg-[#090e1a] rounded border border-slate-800">
                    <strong className="text-red-400">Red Wire:</strong> STM32 3.3V Pin ➔ Red Positive Rail (+ Bus Rail)
                  </div>
                  <div className="p-2 bg-[#090e1a] rounded border border-slate-800">
                    <strong className="text-slate-400">Black Wire:</strong> STM32 GND Pin ➔ Blue Ground Rail (- Bus Rail)
                  </div>
                  <div className="p-2 bg-[#090e1a] rounded border border-slate-800">
                    <strong className="text-emerald-400">Green Wire:</strong> LM358 Output (Row 50) ➔ STM32 Pin PA1 (ADC Sensed)
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#1f293d] flex justify-end bg-[#0c1220]">
              <button
                onClick={() => setShowProfessorModal(false)}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealHardwareTwinLab;

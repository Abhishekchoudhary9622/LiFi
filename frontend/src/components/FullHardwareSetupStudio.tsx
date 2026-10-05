import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Zap,
  Play,
  Square,
  Pause,
  Maximize2,
  Minimize2,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Layers,
  Activity,
  Cpu,
  Radio,
  Sliders,
  HelpCircle,
  X,
  RotateCcw,
  Camera,
  ZoomIn,
  ZoomOut,
  Check,
  Copy,
  Eye,
  EyeOff,
  Search,
  Volume2,
  VolumeX,
  Move,
  Crosshair,
  Tag,
  BookOpen
} from 'lucide-react';

export interface FullHardwareSetupStudioProps {
  projectName?: string;
  onOpenReport?: () => void;
  onOpenGuidedBuild?: () => void;
  onNavigateToBits?: () => void;
}

// ---------------------------------------------------------------------------
// DATA MODEL MATCHING THE EXACT HARDWARE SETUP DIAGRAM
// ---------------------------------------------------------------------------
export interface HardwareComponentItem {
  id: string;
  name: string;
  shortName: string;
  subtitle: string;
  category: 'mcu_tx' | 'resistor' | 'led' | 'transistor' | 'optical' | 'photodiode' | 'amplifier' | 'mcu_rx' | 'power';
  badge: string;
  badgeColor: string;
  flowStep: number;
  flowColor: string;
  box: {
    x: number;
    y: number;
    width: number;
    height: number;
    label: string;
    color: string;
  };
  center: { x: number; y: number };
  pinoutCallout: {
    title: string;
    pins: { name: string; wireColor: string; role: string; voltage: string }[];
  };
  specs: { label: string; value: string }[];
  connectionsExplanation: {
    step: string;
    from: string;
    to: string;
    why: string;
  }[];
  liveProbe: {
    voltage: string;
    currentOrPower: string;
    frequency: string;
    logicState: 'HIGH' | 'LOW' | 'ANALOG' | 'PULSING';
  };
  professorExplanation: string;
  vivaQuestion: {
    question: string;
    answer: string;
  };
  whatIfDisconnected: string;
}

export const HARDWARE_COMPONENTS: HardwareComponentItem[] = [
  {
    id: 'stm32_tx',
    name: 'STM32F103C8 (Transmitter - TX)',
    shortName: 'STM32 TX (PA9)',
    subtitle: 'ARM Cortex-M3 32-bit Microcontroller',
    category: 'mcu_tx',
    badge: 'Transmitter MCU',
    badgeColor: 'bg-blue-950/80 border-blue-500/60 text-blue-300',
    flowStep: 1,
    flowColor: '#3b82f6',
    box: {
      x: 75,
      y: 235,
      width: 215,
      height: 255,
      label: 'STM32F103C8 (Transmitter - TX)',
      color: '#3b82f6'
    },
    center: { x: 182, y: 362 },
    pinoutCallout: {
      title: 'STM32F103C8 Pinout (Transmitter - TX)',
      pins: [
        { name: 'PA9 (PWM Output)', wireColor: 'Yellow / Orange Wire', role: 'Outputs 10.0 kHz high-speed OOK carrier', voltage: '0.00 V / 3.30 V' },
        { name: '3.3V (VCC Out)', wireColor: 'Red Wire', role: 'Powers breadboard positive rail from onboard LDO', voltage: '+3.30 V DC' },
        { name: 'GND (Ground)', wireColor: 'Black Wire', role: 'Common ground return tied to breadboard negative bus', voltage: '0.00 V (Ref)' }
      ]
    },
    specs: [
      { label: 'Processor Architecture', value: 'ARM Cortex-M3 32-bit RISC' },
      { label: 'System Clock Speed', value: '72 MHz SysTick PLL' },
      { label: 'PWM Output Pin', value: 'PA9 (Timer1 Channel 2 / USART1 TX)' },
      { label: 'Carrier Frequency', value: '10.0 kHz (OOK Modulated)' },
      { label: 'Logic Voltage Level', value: '3.3 V CMOS Logic' },
      { label: 'Flash / SRAM', value: '64 KB Flash, 20 KB SRAM' }
    ],
    connectionsExplanation: [
      {
        step: 'Pin PA9 (PWM Out)',
        from: 'STM32 Pin PA9 (Header Pin)',
        to: 'Base of 2N2222 Transistor via 1 kΩ base resistor & 220 Ω limiter',
        why: 'Hardware timer outputs continuous high-speed optical carrier pulses without blocking CPU software execution.'
      },
      {
        step: 'Pin 3.3V',
        from: 'STM32 Pin 3.3V',
        to: 'Breadboard Red Positive Rail (+ Bus)',
        why: 'Powers active circuitry across the breadboard from the onboard RT9193 voltage regulator.'
      },
      {
        step: 'Pin GND',
        from: 'STM32 Pin GND',
        to: 'Breadboard Blue Ground Rail (- Bus)',
        why: 'Ties digital and analog ground together to prevent floating reference noise.'
      }
    ],
    liveProbe: {
      voltage: '3.30 V (Square Wave)',
      currentOrPower: '8.4 mA',
      frequency: '10.0 kHz (OOK)',
      logicState: 'PULSING'
    },
    professorExplanation: 'The transmitter MCU runs the SemLiFi firmware. It takes payload bytes, packetizes them with frame headers and burst check bits, and modulates Pin PA9 at 10 kHz.',
    vivaQuestion: {
      question: 'Why is Pin PA9 selected for the PWM output?',
      answer: 'Pin PA9 is mapped to internal hardware Timer1 Channel 2 (and USART1_TX), allowing deterministic nanosecond-precise square-wave generation directly in hardware.'
    },
    whatIfDisconnected: 'The entire transmission halts. The LED turns off and zero light pulses reach the receiver.'
  },
  {
    id: 'resistor_220',
    name: '220 Ω Resistor (LED Current Limit)',
    shortName: '220 Ω Limiter',
    subtitle: 'Through-Hole Metal Film Resistor',
    category: 'resistor',
    badge: 'Current Limiter',
    badgeColor: 'bg-amber-950/80 border-amber-500/60 text-amber-300',
    flowStep: 2,
    flowColor: '#eab308',
    box: {
      x: 440,
      y: 150,
      width: 105,
      height: 70,
      label: '220 Ω Resistor',
      color: '#f59e0b'
    },
    center: { x: 492, y: 185 },
    pinoutCallout: {
      title: '220 Ω Series Resistor (R1)',
      pins: [
        { name: 'Lead 1 (Input)', wireColor: 'Connected to PA9 PWM', role: 'Receives switched drive current', voltage: '3.30 V' },
        { name: 'Lead 2 (Output)', wireColor: 'Direct to LED Anode', role: 'Drops 1.35 V to limit current', voltage: '1.95 V (Vf)' }
      ]
    },
    specs: [
      { label: 'Resistance Value', value: '220 Ω ± 5%' },
      { label: 'Power Dissipation', value: '250 mW (1/4 W Rating)' },
      { label: 'Color Bands', value: 'Red (2) · Red (2) · Brown (×10) · Gold (±5%)' },
      { label: 'Voltage Drop (Vr)', value: '1.35 V (Vsupply - Vf = 3.3V - 1.95V)' },
      { label: 'Peak LED Current', value: '14.2 mA (Safe for 20mA LED rating)' }
    ],
    connectionsExplanation: [
      {
        step: 'Series Current Limiter',
        from: 'PWM Driver Node (Row 23)',
        to: 'Red LED Anode (+ Lead) at Row 28',
        why: 'Prevents thermal runaway and burnout of the LED junction by maintaining safe forward current.'
      }
    ],
    liveProbe: {
      voltage: '1.35 V (Drop)',
      currentOrPower: '14.2 mA',
      frequency: '10.0 kHz',
      logicState: 'ANALOG'
    },
    professorExplanation: 'Calculated via Ohm’s Law: R = (Vcc - Vf) / I_led = (3.3V - 1.95V) / 0.014A ≈ 96 Ω minimum. 220 Ω provides robust thermal margin and ensures thousands of operating hours.',
    vivaQuestion: {
      question: 'What happens if you replace the 220 Ω resistor with a simple jumper wire?',
      answer: 'The LED would draw excessive current (> 100 mA), causing immediate overheating and catastrophic burnout of the LED and the driver within milliseconds.'
    },
    whatIfDisconnected: 'An open circuit is created; the LED cannot illuminate.'
  },
  {
    id: 'led_tx',
    name: 'IR / Red LED (Transmitter)',
    shortName: 'Red LED (TX)',
    subtitle: '5mm High-Efficiency Optical Emitter',
    category: 'led',
    badge: 'Optical Emitter',
    badgeColor: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
    flowStep: 3,
    flowColor: '#ef4444',
    box: {
      x: 350,
      y: 65,
      width: 145,
      height: 255,
      label: 'IR / Red LED (Transmitter)',
      color: '#ef4444'
    },
    center: { x: 422, y: 192 },
    pinoutCallout: {
      title: 'IR / Red LED (Transmitter) Pinout',
      pins: [
        { name: 'Anode (+) [Long Leg]', wireColor: 'Resistor Bridge', role: 'Connects to 220 Ω resistor output', voltage: '1.95 V' },
        { name: 'Cathode (-) [Short Leg]', wireColor: 'Blue Wire', role: 'Connects to Collector of 2N2222 Transistor', voltage: '0.20 V (Vce_sat)' },
        { name: 'Optical Lens Dome', wireColor: 'Free-Space Photons', role: 'Radiates 630nm/850nm beam toward photodiode', voltage: 'Radiant Power' }
      ]
    },
    specs: [
      { label: 'Peak Emission Wavelength', value: '630 nm (Visible Red) / 850 nm (Near-IR)' },
      { label: 'Forward Voltage (Vf)', value: '1.95 V Nominal' },
      { label: 'Operating Current (If)', value: '14.2 mA' },
      { label: 'Optical Rise / Fall Time', value: '< 18 ns (Nanosecond Fast Switching)' },
      { label: 'Viewing Half-Angle', value: '30° Semi-Collimated Beam' }
    ],
    connectionsExplanation: [
      {
        step: 'Anode (+)',
        from: 'Output of 220 Ω Resistor',
        to: 'Breadboard Row 28',
        why: 'Receives the positive forward current drive.'
      },
      {
        step: 'Cathode (-)',
        from: 'Breadboard Row 29',
        to: 'Collector of 2N2222 Transistor',
        why: 'Switched to ground by the transistor driver to rapidly modulate optical pulses.'
      }
    ],
    liveProbe: {
      voltage: '1.95 V (Forward)',
      currentOrPower: '18.5 mW Radiant Flux',
      frequency: '10.0 kHz (Optical Pulse)',
      logicState: 'PULSING'
    },
    professorExplanation: 'The LED is the physical electro-optical transducer in the LiFi transmitter. When forward-biased, electron-hole recombination in the semiconductor bandgap emits photons.',
    vivaQuestion: {
      question: 'Why is an optical LED used instead of RF radio frequency?',
      answer: 'Light communication has terahertz of unlicensed bandwidth, zero electromagnetic interference (EMI) with sensitive medical or aviation electronics, and is confined to the room for physical security.'
    },
    whatIfDisconnected: 'No optical carrier is radiated into the free-space link.'
  },
  {
    id: 'transistor_2n2222',
    name: '2N2222 (NPN Transistor) (LED Driver)',
    shortName: '2N2222 Driver',
    subtitle: 'High-Speed BJT Current Driver & Buffer',
    category: 'transistor',
    badge: 'LED Driver',
    badgeColor: 'bg-purple-950/80 border-purple-500/60 text-purple-300',
    flowStep: 2,
    flowColor: '#a855f7',
    box: {
      x: 390,
      y: 370,
      width: 260,
      height: 125,
      label: '2N2222 (NPN Transistor) [LED Driver]',
      color: '#a855f7'
    },
    center: { x: 520, y: 432 },
    pinoutCallout: {
      title: '2N2222 NPN Transistor Pinout (Front View)',
      pins: [
        { name: 'E - Emitter [Pin 1]', wireColor: 'Black Wire', role: 'Tied to Breadboard Ground Rail (- Bus)', voltage: '0.00 V' },
        { name: 'B - Base [Pin 2]', wireColor: 'Yellow Wire', role: 'Driven by STM32 PA9 via 1 kΩ base resistor', voltage: '0.70 V (Vbe_on)' },
        { name: 'C - Collector [Pin 3]', wireColor: 'Blue Wire', role: 'Connected to LED Cathode to sink current', voltage: '0.20 V (Vce_sat)' }
      ]
    },
    specs: [
      { label: 'Transistor Type', value: 'NPN Silicon BJT (TO-92 Package)' },
      { label: 'Collector Current (Ic Max)', value: '800 mA Continuous' },
      { label: 'DC Current Gain (hFE)', value: '100 – 300' },
      { label: 'Transition Frequency (fT)', value: '300 MHz High-Speed Switching' },
      { label: 'Vce Saturation Voltage', value: '0.2 V at Saturation' }
    ],
    connectionsExplanation: [
      {
        step: 'Base (B) Control',
        from: 'STM32 Pin PA9 through 1 kΩ Base Resistor',
        to: 'Center Pin of 2N2222',
        why: 'A small base current (~1.5 mA) saturates the transistor, turning it on.'
      },
      {
        step: 'Collector (C) Sink',
        from: 'LED Cathode Lead',
        to: 'Right Pin of 2N2222',
        why: 'Sinks forward current from the LED to complete the circuit loop.'
      },
      {
        step: 'Emitter (E) Ground',
        from: 'Left Pin of 2N2222',
        to: 'Breadboard Ground Rail',
        why: 'Provides the common low-resistance return path to ground.'
      }
    ],
    liveProbe: {
      voltage: 'Vbe: 0.70V | Vce: 0.20V',
      currentOrPower: 'Ic: 14.2 mA | Ib: 1.5 mA',
      frequency: '10.0 kHz Switching',
      logicState: 'PULSING'
    },
    professorExplanation: 'Acts as an open-collector electronic switch. The STM32 GPIO pin only needs to supply a tiny base current (~1 mA), protecting the microcontroller while the transistor easily sinks the full LED current.',
    vivaQuestion: {
      question: 'In which region does the 2N2222 operate in this circuit?',
      answer: 'It switches strictly between the Cutoff region (transistor OFF, Vce = Vcc, LED off) and the Saturation region (transistor fully ON, Vce ≈ 0.2V, LED on).'
    },
    whatIfDisconnected: 'The LED current path is broken; the LED will not illuminate.'
  },
  {
    id: 'optical_link',
    name: 'Optical Link (Infrared / Visible Light)',
    shortName: 'Optical Channel',
    subtitle: 'Free-Space Wireless Optical Channel',
    category: 'optical',
    badge: 'Wireless Channel',
    badgeColor: 'bg-rose-950/80 border-rose-500/60 text-rose-300',
    flowStep: 4,
    flowColor: '#f43f5e',
    box: {
      x: 450,
      y: 230,
      width: 160,
      height: 55,
      label: 'Optical Link (Free Space)',
      color: '#f43f5e'
    },
    center: { x: 530, y: 257 },
    pinoutCallout: {
      title: 'Free-Space Optical Channel Characteristics',
      pins: [
        { name: 'Transmitter Origin', wireColor: 'Line of Sight', role: 'Red LED 5mm Dome', voltage: 'Modulated Photons' },
        { name: 'Air Gap Distance', wireColor: 'Wireless', role: '15.0 cm Line-of-Sight Path', voltage: '1/d² Attenuation' },
        { name: 'Receiver Aperture', wireColor: 'Silicon Window', role: 'BPW34 Sensitive Active Area', voltage: 'Photocurrent Target' }
      ]
    },
    specs: [
      { label: 'Transmission Medium', value: 'Free-Space Air (Room Environment)' },
      { label: 'Channel Distance', value: '15.0 cm (Collimated Path)' },
      { label: 'Transmission Speed', value: 'c ≈ 3 × 10⁸ m/s (Speed of Light)' },
      { label: 'Channel Interference', value: '0 dB Radio Frequency Interference' },
      { label: 'Link SNR', value: '28.4 dB at 15 cm Distance' }
    ],
    connectionsExplanation: [
      {
        step: 'Free-Space Propagation',
        from: 'LED Emitter Lens',
        to: 'BPW34 Photodiode Active Surface',
        why: 'Photons travel unguided through air following Lambertian radiation pattern.'
      }
    ],
    liveProbe: {
      voltage: 'Optical Link: Active',
      currentOrPower: 'Path Loss: -18.2 dB',
      frequency: '340 Lux Incident',
      logicState: 'PULSING'
    },
    professorExplanation: 'This is the physical LiFi link. Photons carry data through free space according to Lambertian emission: E = (m+1)/(2π d²) * cos^m(θ). It provides high security because light cannot pass through opaque walls.',
    vivaQuestion: {
      question: 'How does distance affect the received LiFi optical power?',
      answer: 'Optical irradiance decreases with the inverse square of distance: P_rx ∝ P_tx / d². At 15 cm, the signal is strong (> 28 dB SNR). At greater distances, lens collimators or higher LED drive power are used.'
    },
    whatIfDisconnected: 'Placing an opaque hand or card in the air gap blocks the beam, causing immediate burst loss and triggering SemLiFi’s confidence-gated fallback protocol.'
  },
  {
    id: 'photodiode_rx',
    name: 'Photodiode (Receiver)',
    shortName: 'Photodiode (RX)',
    subtitle: 'BPW34 Silicon PIN Photodiode Detector',
    category: 'photodiode',
    badge: 'Light Receiver',
    badgeColor: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
    flowStep: 5,
    flowColor: '#10b981',
    box: {
      x: 610,
      y: 75,
      width: 105,
      height: 255,
      label: 'Photodiode (Receiver)',
      color: '#10b981'
    },
    center: { x: 662, y: 202 },
    pinoutCallout: {
      title: 'BPW34 Photodiode Pinout (Receiver)',
      pins: [
        { name: 'Anode (+) Lead', wireColor: 'Green/Black Wire', role: 'Tied to Ground Rail for reverse bias', voltage: '0.00 V' },
        { name: 'Cathode (-) Lead', wireColor: 'Yellow Wire', role: 'Connects to LM358 Inverting Pin & 10 kΩ resistor', voltage: 'Photocurrent Output' },
        { name: 'Silicon Sensor Window', wireColor: 'Active Surface', role: 'Converts incident photons into electron-hole pairs', voltage: '7.5 mm² Area' }
      ]
    },
    specs: [
      { label: 'Active Radiant Area', value: '7.5 mm² Silicon PIN' },
      { label: 'Spectral Sensitivity Range', value: '430 nm – 1100 nm (Visible to Near-IR)' },
      { label: 'Peak Responsivity', value: '0.62 A/W at 850 nm' },
      { label: 'Junction Capacitance (Cj)', value: '25 pF (Reverse-Biased Mode)' },
      { label: 'Response Time (tr / tf)', value: '20 ns (Fast Demodulation)' }
    ],
    connectionsExplanation: [
      {
        step: 'Anode (+)',
        from: 'Breadboard Row 45',
        to: 'Common Ground Rail (- Bus)',
        why: 'Connected to ground to establish reverse-biased photoconductive operation.'
      },
      {
        step: 'Cathode (-)',
        from: 'Breadboard Row 46',
        to: 'LM358 Pin 2 (Inverting Input)',
        why: 'Feeds light-induced microamp photocurrent into the transimpedance amplifier.'
      }
    ],
    liveProbe: {
      voltage: 'Reverse Bias: -3.30 V',
      currentOrPower: 'I_photo: 42.8 µA',
      frequency: '10.0 kHz Optical',
      logicState: 'ANALOG'
    },
    professorExplanation: 'The photodiode operates in photoconductive mode. Incident photons generate electron-hole pairs in the depletion region, producing a reverse photocurrent proportional to light intensity.',
    vivaQuestion: {
      question: 'Why use a PIN photodiode instead of a standard PN photodiode?',
      answer: 'The intrinsic (I) layer between the P and N regions creates a wider depletion zone, drastically reducing junction capacitance (Cj = 25 pF), which allows high-frequency LiFi switching up to hundreds of kilohertz.'
    },
    whatIfDisconnected: 'The receiver has no transducer; zero electrical signal reaches the amplifier.'
  },
  {
    id: 'lm358_amplifier',
    name: 'Signal Conditioning (Transimpedance Amplifier)',
    shortName: 'LM358 Pre-Amp',
    subtitle: 'LM358 Op-Amp with 10 kΩ Feedback & 1 kΩ Input Resistors',
    category: 'amplifier',
    badge: 'TIA Pre-Amp',
    badgeColor: 'bg-cyan-950/80 border-cyan-500/60 text-cyan-300',
    flowStep: 6,
    flowColor: '#06b6d4',
    box: {
      x: 805,
      y: 55,
      width: 185,
      height: 255,
      label: 'Signal Conditioning (LM358 TIA)',
      color: '#06b6d4'
    },
    center: { x: 897, y: 182 },
    pinoutCallout: {
      title: 'LM358 Signal Conditioning Circuit',
      pins: [
        { name: '10 kΩ (Feedback Resistor)', wireColor: 'Resistor Bridge', role: 'Connects Pin 1 to Pin 2; sets transimpedance gain', voltage: 'Rf = 10 kΩ' },
        { name: '1 kΩ (Input Resistor)', wireColor: 'Resistor Bridge', role: 'Input current-limiting & filter stage', voltage: 'Rin = 1 kΩ' },
        { name: 'Pin 8 (VCC)', wireColor: 'Red Wire', role: 'Connected to +3.3V Power Rail', voltage: '+3.30 V' },
        { name: 'Pin 4 (GND)', wireColor: 'Black Wire', role: 'Connected to Common Ground Rail', voltage: '0.00 V' },
        { name: 'Pin 1 (Output)', wireColor: 'Purple / Green Wire', role: 'Carries amplified 0–3.3V waveform to STM32 RX Pin PA0', voltage: '0.00 V – 3.30 V' }
      ]
    },
    specs: [
      { label: 'Operational Amplifier IC', value: 'LM358 DIP-8 Dual General Purpose' },
      { label: 'Circuit Topology', value: 'Transimpedance Amplifier (TIA) + Comparator' },
      { label: 'Transimpedance Gain', value: 'Vout = Iph × Rf = 42.8 µA × 50 kΩ ≈ 2.14 V' },
      { label: 'Supply Voltage', value: '3.3 V Single Supply (Rail-to-Rail)' },
      { label: 'Slew Rate', value: '0.6 V/µs' }
    ],
    connectionsExplanation: [
      {
        step: 'Photocurrent Amplification',
        from: 'Photodiode Cathode',
        to: 'LM358 Inverting Pin 2',
        why: 'Converts tiny microamp photocurrent (42.8 µA) into a measurable voltage.'
      },
      {
        step: 'Output to Microcontroller',
        from: 'LM358 Output Pin 1',
        to: 'STM32 (RX) Pin PA0 (ADC Input)',
        why: 'Feeds conditioned full-scale 0–3.3V signal into ADC for digital sampling.'
      }
    ],
    liveProbe: {
      voltage: 'V_out: 2.14 V Peak',
      currentOrPower: 'Gain: 50,000 V/A',
      frequency: 'Bandwidth: 1.1 MHz',
      logicState: 'PULSING'
    },
    professorExplanation: 'The raw photocurrent from the photodiode is on the order of microamperes, far too small for microcontroller ADC pins to read reliably. The LM358 converts this current into volts with a 10 kΩ feedback resistor.',
    vivaQuestion: {
      question: 'What is the role of the 10 kΩ feedback resistor?',
      answer: 'It defines the transimpedance gain: V_out = I_photodiode × R_feedback. Increasing Rf increases voltage sensitivity, while decreasing Rf increases frequency bandwidth.'
    },
    whatIfDisconnected: 'The microamp signal is lost; the receiver MCU sees zero input voltage.'
  },
  {
    id: 'stm32_rx',
    name: 'STM32F103C8 (Receiver - RX)',
    shortName: 'STM32 RX (PA0)',
    subtitle: 'ARM Cortex-M3 32-bit Microcontroller',
    category: 'mcu_rx',
    badge: 'Receiver MCU',
    badgeColor: 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300',
    flowStep: 7,
    flowColor: '#8b5cf6',
    box: {
      x: 710,
      y: 355,
      width: 280,
      height: 155,
      label: 'STM32F103C8 (Receiver - RX)',
      color: '#10b981'
    },
    center: { x: 850, y: 432 },
    pinoutCallout: {
      title: 'STM32F103C8 Pinout (Receiver - RX)',
      pins: [
        { name: 'PA0 (ADC Input)', wireColor: 'Purple Wire', role: 'Samples amplified analog/digital signal from LM358', voltage: '0.00 V – 3.30 V' },
        { name: '3.3V (VCC In)', wireColor: 'Red Wire', role: 'Powers MCU from shared positive power rail', voltage: '+3.30 V' },
        { name: 'GND (Ground)', wireColor: 'Black Wire', role: 'Shared system ground plane reference', voltage: '0.00 V (Ref)' }
      ]
    },
    specs: [
      { label: 'Processor Architecture', value: 'ARM Cortex-M3 32-bit' },
      { label: 'ADC Resolution', value: '12-bit Successive Approximation (0–4095 levels)' },
      { label: 'ADC Step Voltage', value: '3.3 V / 4096 ≈ 0.8 mV per LSB' },
      { label: 'ADC Sampling Rate', value: '1 MSPS Maximum Conversion' },
      { label: 'Demodulation Algorithm', value: 'SemLiFi Dynamic Threshold Demodulator' }
    ],
    connectionsExplanation: [
      {
        step: 'Pin PA0 (ADC In)',
        from: 'LM358 Pin 1 Output',
        to: 'STM32 Pin PA0 (ADC1_IN0)',
        why: 'Digitizes the incoming optical waveform to detect High (1) vs Low (0) bitstates.'
      },
      {
        step: 'Pin 3.3V & GND',
        from: 'Breadboard Power Rails',
        to: 'STM32 3.3V and GND pins',
        why: 'Powers the receiver microcontroller and provides shared ground plane.'
      }
    ],
    liveProbe: {
      voltage: 'ADC: 2656 / 4095 (2.14 V)',
      currentOrPower: 'BER: 0.000% (Clean)',
      frequency: 'Demod: 115.2 kbps',
      logicState: 'HIGH'
    },
    professorExplanation: 'The receiver MCU samples Pin PA0 using its 12-bit ADC. Firmware performs burst error detection and applies SemLiFi confidence gating to decide whether to accept data or trigger fallback recovery.',
    vivaQuestion: {
      question: 'How does the receiver microcontroller convert the analog light back into data bytes?',
      answer: 'The ADC samples the signal at 1 MSPS. Firmware compares the sample against a dynamic threshold (midpoint of High and Low levels). A transition state machine decodes the 10 kHz OOK pulses into UART bytes.'
    },
    whatIfDisconnected: 'The optical data is converted into voltage by the LM358, but never digitized or processed into text/telemetry.'
  },
  {
    id: 'power_supply',
    name: '3.3V Power Supply (from USB / Bench Supply)',
    shortName: '3.3V Power Rail',
    subtitle: 'Regulated DC Power & Breadboard Power Rails',
    category: 'power',
    badge: 'Power Supply',
    badgeColor: 'bg-red-950/80 border-red-500/60 text-red-300',
    flowStep: 1,
    flowColor: '#ef4444',
    box: {
      x: 15,
      y: 15,
      width: 175,
      height: 100,
      label: '3.3V Power Supply',
      color: '#ef4444'
    },
    center: { x: 102, y: 65 },
    pinoutCallout: {
      title: '3.3V Power Supply Distribution',
      pins: [
        { name: 'Red +3.3V Rail', wireColor: 'Thick Red Banana Leads', role: 'Distributes regulated +3.3V power to both transmitter and receiver circuits', voltage: '+3.30 V DC' },
        { name: 'Black GND Rail', wireColor: 'Thick Black Banana Leads', role: 'Single-point common ground bus for all components', voltage: '0.00 V' }
      ]
    },
    specs: [
      { label: 'Nominal DC Voltage', value: '3.30 V Regulated' },
      { label: 'Max Current Rating', value: '1.0 A Continuous' },
      { label: 'Power Source', value: 'USB 5V LDO / Laboratory Bench Supply' },
      { label: 'Voltage Ripple', value: '< 10 mV Peak-to-Peak' }
    ],
    connectionsExplanation: [
      {
        step: 'VCC Power Bus',
        from: '3.3V Bench Supply / USB Regulator',
        to: 'Top Red Breadboard Rail (+ Bus)',
        why: 'Supplies power to STM32 TX, STM32 RX, LM358, and LED drive.'
      },
      {
        step: 'Common Ground',
        from: 'Ground Terminal',
        to: 'Bottom Blue Breadboard Rail (- Bus)',
        why: 'Establishes zero-volt reference plane across entire system.'
      }
    ],
    liveProbe: {
      voltage: '+3.30 V DC (Regulated)',
      currentOrPower: 'Total Load: 82.5 mA',
      frequency: 'Ripple: < 8 mVp-p',
      logicState: 'HIGH'
    },
    professorExplanation: 'A clean, low-noise power supply is essential for optical receivers to prevent power rail ripple from appearing as optical noise at the sensitive transimpedance input.',
    vivaQuestion: {
      question: 'Why is a common ground connection essential between the transmitter and receiver sections on the breadboard?',
      answer: 'Without a shared ground reference, floating potentials between the two sides cause ADC measurement errors, false bit triggers, and unstable comparator switching.'
    },
    whatIfDisconnected: 'All components lose power and the system turns completely off.'
  }
];

export const FullHardwareSetupStudio: React.FC<FullHardwareSetupStudioProps> = ({
  projectName = 'SemLiFi Real Hardware Setup',
  onOpenReport,
  onOpenGuidedBuild,
  onNavigateToBits
}) => {
  // Selected component
  const [selectedCompId, setSelectedCompId] = useState<string>('led_tx');
  const selectedComp = useMemo(() => {
    return HARDWARE_COMPONENTS.find(c => c.id === selectedCompId) || HARDWARE_COMPONENTS[0];
  }, [selectedCompId]);

  // Hovered component for interactive tooltip
  const [hoveredCompId, setHoveredCompId] = useState<string | null>(null);
  const hoveredComp = useMemo(() => {
    return HARDWARE_COMPONENTS.find(c => c.id === hoveredCompId) || null;
  }, [hoveredCompId]);

  // Active Inspector Tab: 'connections' | 'specs' | 'viva' | 'probe'
  const [activeTab, setActiveTab] = useState<'connections' | 'specs' | 'viva' | 'probe'>('connections');

  // Simulation Running State
  const [isRunning, setIsRunning] = useState<boolean>(true);

  // SIDEBAR DISPLAY MODE: 'docked' | 'floating' | 'hidden'
  const [sidebarMode, setSidebarMode] = useState<'docked' | 'floating' | 'hidden'>('docked');

  // Floating HUD minimized state
  const [isHudMinimized, setIsHudMinimized] = useState<boolean>(false);

  // Component Tags Overlay Toggle
  const [showTags, setShowTags] = useState<boolean>(true);

  // Viva Quiz Flashcard Reveal State
  const [isVivaAnswerRevealed, setIsVivaAnswerRevealed] = useState<boolean>(true);

  // Audio Carrier Synthesizer Sound
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Copy Feedback state
  const [copiedPin, setCopiedPin] = useState<boolean>(false);

  // Auto-tour signal flow loop state
  const [isAutoTouring, setIsAutoTouring] = useState<boolean>(false);

  // Search filter
  const [searchFilter, setSearchFilter] = useState<string>('');

  const filteredComponents = useMemo(() => {
    if (!searchFilter.trim()) return HARDWARE_COMPONENTS;
    const q = searchFilter.toLowerCase();
    return HARDWARE_COMPONENTS.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.subtitle.toLowerCase().includes(q) ||
      c.badge.toLowerCase().includes(q) ||
      c.shortName.toLowerCase().includes(q)
    );
  }, [searchFilter]);

  // Web Audio carrier pulse sound generator
  const triggerAudioChime = (freq = 980) => {
    if (!isAudioEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
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
      // Audio not permitted without interaction
    }
  };

  // Focus component (select component cleanly without viewport jumps)
  const focusComponent = (compId: string) => {
    const comp = HARDWARE_COMPONENTS.find(c => c.id === compId);
    if (!comp) return;
    setSelectedCompId(compId);
    triggerAudioChime(1200);
  };

  // Auto-tour interval effect
  useEffect(() => {
    if (!isAutoTouring) return;
    const order = ['stm32_tx', 'transistor_2n2222', 'led_tx', 'optical_link', 'photodiode_rx', 'lm358_amplifier', 'stm32_rx'];
    const interval = setInterval(() => {
      setSelectedCompId(prev => {
        const curIdx = order.indexOf(prev);
        const nextIdx = (curIdx + 1) % order.length;
        const nextId = order[nextIdx];
        triggerAudioChime(800 + nextIdx * 100);
        return nextId;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isAutoTouring, isAudioEnabled]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const order = HARDWARE_COMPONENTS.map(c => c.id);
        const idx = order.indexOf(selectedCompId);
        const next = order[(idx + 1) % order.length];
        setSelectedCompId(next);
        triggerAudioChime(1000);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const order = HARDWARE_COMPONENTS.map(c => c.id);
        const idx = order.indexOf(selectedCompId);
        const prev = order[(idx - 1 + order.length) % order.length];
        setSelectedCompId(prev);
        triggerAudioChime(900);
      } else if (e.key.toLowerCase() === 'f') {
        setSidebarMode(m => m === 'hidden' ? 'docked' : 'hidden');
      } else if (e.key.toLowerCase() === 't') {
        setShowTags(t => !t);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCompId, isAudioEnabled]);

  const handleCopyPinout = () => {
    const text = `${selectedComp.name}\n${selectedComp.pinoutCallout.title}\n` +
      selectedComp.pinoutCallout.pins.map(p => `• ${p.name}: ${p.role} (${p.voltage})`).join('\n') +
      `\n\nLive Probe:\nVoltage: ${selectedComp.liveProbe.voltage}\nFrequency: ${selectedComp.liveProbe.frequency}\nPower: ${selectedComp.liveProbe.currentOrPower}` +
      `\n\nProfessor Explanation:\n${selectedComp.professorExplanation}`;

    navigator.clipboard.writeText(text);
    setCopiedPin(true);
    setTimeout(() => setCopiedPin(false), 1800);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#04060d] text-slate-100 font-sans select-none">
      {/* ========================================================= */}
      {/* 1. TOP HEADER NAVIGATION & TELEMETRY BAR                  */}
      {/* ========================================================= */}
      <header className="h-[54px] bg-[#080d19] border-b border-[#16233a] px-3 lg:px-4 flex items-center justify-between shrink-0 z-30 shadow-xl backdrop-blur-md">
        {/* Left Branding */}
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-500 p-[1.5px] shadow-lg shadow-cyan-500/25">
            <div className="w-full h-full bg-[#070c17] rounded-[7px] flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400 fill-cyan-400/20" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-extrabold text-white tracking-wide font-mono">SemLiFi</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800 font-mono font-bold tracking-tight">
                DIGITAL TWIN
              </span>
              <span className="hidden md:inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-mono">
                <span className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
                <span>{isRunning ? 'OPTICAL CARRIER ACTIVE' : 'CARRIER PAUSED'}</span>
              </span>
            </div>
            <p className="text-[10px] text-slate-400 -mt-0.5 hidden sm:block">Physical Hardware Breadboard Setup &amp; Digital Twin</p>
          </div>
        </div>

        {/* Center: Circuit Flow Interactive Sequence */}
        <div className="hidden xl:flex items-center bg-[#050914] p-1 rounded-xl border border-[#162238] space-x-1 shadow-inner text-[11px] font-mono">
          <span className="text-slate-400 px-1.5 font-bold text-[10px] uppercase tracking-wider">FLOW:</span>
          {[
            { step: 1, label: '1. STM32 TX', color: '#3b82f6', compId: 'stm32_tx' },
            { step: 2, label: '2. 2N2222', color: '#a855f7', compId: 'transistor_2n2222' },
            { step: 3, label: '3. Red LED (TX)', color: '#ef4444', compId: 'led_tx' },
            { step: 4, label: '4. Optical Link', color: '#f43f5e', compId: 'optical_link' },
            { step: 5, label: '5. Photodiode (RX)', color: '#10b981', compId: 'photodiode_rx' },
            { step: 6, label: '6. LM358 Pre-Amp', color: '#06b6d4', compId: 'lm358_amplifier' },
            { step: 7, label: '7. STM32 RX', color: '#8b5cf6', compId: 'stm32_rx' }
          ].map((item, idx, arr) => (
            <React.Fragment key={item.step}>
              <button
                onClick={() => focusComponent(item.compId)}
                className={`px-2 py-1 rounded-lg transition-all flex items-center space-x-1.5 ${
                  selectedCompId === item.compId
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-[#101726]'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
              {idx < arr.length - 1 && (
                <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          ))}

          {/* Auto Step Tour Button */}
          <button
            onClick={() => setIsAutoTouring(a => !a)}
            className={`ml-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1 border ${
              isAutoTouring
                ? 'bg-amber-950 text-amber-300 border-amber-500 animate-pulse'
                : 'bg-[#10192a] text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Auto-step through the circuit signal flow"
          >
            {isAutoTouring ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            <span>{isAutoTouring ? 'Touring...' : 'Auto-Flow'}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Link to Dedicated Message & Bits Page */}
          {onNavigateToBits && (
            <button
              onClick={onNavigateToBits}
              className="px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center space-x-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold shadow-md shadow-blue-500/20"
              title="Open Dedicated Message & Bits Simulation Page"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
              <span className="hidden sm:inline">Simulate Message "HII"</span>
              <span className="sm:hidden">Bits</span>
              <ArrowRight className="w-3 h-3 text-cyan-300 shrink-0" />
            </button>
          )}

          {/* Audio Synthesizer Tone Toggle */}
          <button
            onClick={() => {
              setIsAudioEnabled(a => !a);
              triggerAudioChime(1000);
            }}
            className={`p-1.5 sm:px-2 sm:py-1.5 rounded-lg text-xs font-mono border transition-all flex items-center space-x-1 ${
              isAudioEnabled
                ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/80 shadow-md shadow-cyan-500/20'
                : 'bg-[#0e1524] text-slate-400 border-[#1c2940] hover:text-slate-200'
            }`}
            title="Toggle LiFi Optical Carrier Audio Beeps"
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{isAudioEnabled ? 'Sound ON' : 'Mute'}</span>
          </button>

          {/* Report Button */}
          {onOpenReport && (
            <button
              onClick={onOpenReport}
              className="px-2.5 py-1.5 rounded-lg bg-[#0e1628] hover:bg-[#17233c] text-cyan-300 border border-cyan-800/40 text-xs font-mono transition-all hidden lg:block"
              title="Generate IEEE Project Report"
            >
              Report
            </button>
          )}

          {/* Layout Mode Selector (Docked / HUD / Hidden) */}
          <div className="hidden sm:flex items-center bg-[#070c18] rounded-lg border border-[#18253d] p-0.5 text-xs font-mono">
            <button
              onClick={() => setSidebarMode('docked')}
              className={`px-2 py-1 rounded text-[11px] transition-all ${
                sidebarMode === 'docked'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Docked Sidebar Layout"
            >
              Docked
            </button>
            <button
              onClick={() => {
                setSidebarMode('floating');
                setIsHudMinimized(false);
              }}
              className={`px-2 py-1 rounded text-[11px] transition-all ${
                sidebarMode === 'floating'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Floating Glass HUD (Hardware covers 100% of screen)"
            >
              HUD
            </button>
            <button
              onClick={() => setSidebarMode(m => m === 'hidden' ? 'docked' : 'hidden')}
              className={`p-1 rounded text-[11px] transition-all ${
                sidebarMode === 'hidden'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Toggle Full Canvas"
            >
              {sidebarMode === 'hidden' ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MAIN WORKBENCH: ZERO-GUTTER FULL-COVER HARDWARE CANVAS */}
      {/* ========================================================= */}
      <main className="flex-1 flex min-h-0 overflow-hidden bg-[#03060c] relative">
        {/* ------------------------------------------------------- */}
        {/* CENTER STAGE: HARDWARE SETUP (COVERS 100% OF AVAILABLE) */}
        {/* ------------------------------------------------------- */}
        <section className="flex-1 flex flex-col min-h-0 overflow-hidden relative select-none">
          {/* Sub-Header Floating Control Overlay Bar */}
          <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-20 flex flex-wrap items-center gap-1.5 bg-[#080d19]/90 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl border border-[#17243c] shadow-xl text-xs font-mono max-w-[calc(100vw-16px)]">
            <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="font-bold text-white tracking-wide text-[10px] sm:text-[11px]">
              Hardware Twin
            </span>

            <div className="h-3 w-[1px] bg-slate-700 hidden sm:block" />

            {/* Show / Hide Component Tags */}
            <button
              onClick={() => setShowTags(t => !t)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-mono transition-all flex items-center space-x-1 border ${
                showTags
                  ? 'bg-indigo-950 text-indigo-300 border-indigo-600 font-bold'
                  : 'bg-[#0f172a] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Toggle Component Labels on Hardware Diagram (Key T)"
            >
              <Tag className="w-3 h-3" />
              <span>Labels {showTags ? 'ON' : 'OFF'}</span>
            </button>

            {/* Signal Flow Auto-Tour */}
            <button
              onClick={() => setIsAutoTouring(t => !t)}
              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] font-mono transition-all flex items-center space-x-1 border ${
                isAutoTouring
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-600 font-bold'
                  : 'bg-[#0f172a] text-slate-400 border-slate-700 hover:text-white'
              }`}
              title="Step automatically through the 7 signal stages"
            >
              <Sparkles className="w-3 h-3" />
              <span className="hidden sm:inline">Signal Flow</span>
              <span>{isAutoTouring ? 'Touring' : 'Flow'}</span>
            </button>

            {/* Mobile Inspector Toggle */}
            <button
              onClick={() => setSidebarMode(m => m === 'hidden' ? 'docked' : 'hidden')}
              className="lg:hidden px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all flex items-center space-x-1 border bg-blue-900/60 text-cyan-300 border-cyan-500/60 font-bold"
              title="Toggle Component Inspector Drawer"
            >
              <Sliders className="w-3 h-3" />
              <span>Inspect</span>
            </button>
          </div>

          {/* HARDWARE IMAGE CANVAS - EXPANDS TO COVER THE WHOLE AVAILABLE SIZE (CLEAN, FIXED & CENTERED) */}
          <div className="flex-1 relative overflow-hidden bg-[#03060c] flex items-center justify-center p-2">
            <div className="relative w-full h-full flex items-center justify-center">
              {/* SVG Canvas mapping the 1024 x 682 hardware setup */}
              <svg
                viewBox="0 0 1024 682"
                preserveAspectRatio="xMidYMid meet"
                className="w-full h-full max-w-full max-h-full block shadow-2xl rounded-lg"
              >
                <defs>
                  {/* Glowing Filter for selected component (smooth cyan glow) */}
                  <filter id="focusGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Intense Red Glow for LED and Optical Link */}
                  <filter id="redBeamGlow" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="7" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>

                  {/* Radial Gradient for LED optical burst */}
                  <radialGradient id="ledPulseGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                    <stop offset="35%" stopColor="#ef4444" stopOpacity="0.9" />
                    <stop offset="70%" stopColor="#dc2626" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0" />
                  </radialGradient>

                  {/* Linear Gradient for Optical Cone across air gap */}
                  <linearGradient id="beamConeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                    <stop offset="50%" stopColor="#f43f5e" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.7" />
                  </linearGradient>
                </defs>

                {/* Embedded pristine high-res hardware photo */}
                <image
                  href="/hardware/full_hardware_setup.jpg"
                  x="0"
                  y="0"
                  width="1024"
                  height="682"
                  preserveAspectRatio="xMidYMid meet"
                />

                {/* ======================================================= */}
                {/* DYNAMIC OPTICAL BEAM SIMULATION ACROSS PHYSICAL AIR GAP */}
                {/* ======================================================= */}
                {isRunning ? (
                  <g className="transition-all duration-150">
                    {/* 1. Collimated Optical Beam Cone between LED (422, 192) and Photodiode (662, 202) */}
                    <polygon
                      points="422,175 662,170 662,234 422,209"
                      fill="url(#beamConeGradient)"
                      opacity="0.65"
                    />

                    {/* 2. Core High-Intensity Laser / Photon Ray */}
                    <line
                      x1="422"
                      y1="192"
                      x2="662"
                      y2="202"
                      stroke="#ff2222"
                      strokeWidth="6"
                      strokeLinecap="round"
                      filter="url(#redBeamGlow)"
                    />
                    <line
                      x1="422"
                      y1="192"
                      x2="662"
                      y2="202"
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* 3. Transmitter LED Intense Glowing Aura */}
                    <circle
                      cx="422"
                      cy="192"
                      r="46"
                      fill="url(#ledPulseGlow)"
                      className="animate-pulse"
                    />
                    <circle
                      cx="422"
                      cy="192"
                      r="16"
                      fill="#ffffff"
                      filter="url(#focusGlow)"
                    />

                    {/* 4. Receiver Photodiode Active Detection Spot */}
                    <circle
                      cx="662"
                      cy="202"
                      r="32"
                      fill="rgba(16, 185, 129, 0.45)"
                      filter="url(#focusGlow)"
                    />
                    <circle
                      cx="662"
                      cy="202"
                      r="10"
                      fill="#34d399"
                      filter="url(#focusGlow)"
                    />

                    {/* 5. Live State Badges right on physical breadboard */}
                    <g className="pointer-events-none">
                      <rect
                        x="370"
                        y="245"
                        width="110"
                        height="20"
                        rx="10"
                        fill="rgba(239, 68, 68, 0.9)"
                      />
                      <text
                        x="425"
                        y="259"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        LED: 10 kHz OOK
                      </text>

                      <rect
                        x="610"
                        y="245"
                        width="120"
                        height="20"
                        rx="10"
                        fill="rgba(16, 185, 129, 0.9)"
                      />
                      <text
                        x="670"
                        y="259"
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        I_ph: 42.8 µA (ACTIVE)
                      </text>
                    </g>
                  </g>
                ) : (
                  /* Idle: LED is dark */
                  <g className="pointer-events-none opacity-80">
                    <rect
                      x="370"
                      y="245"
                      width="110"
                      height="20"
                      rx="10"
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <text
                      x="425"
                      y="259"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      LED: IDLE (OFF)
                    </text>

                    <rect
                      x="610"
                      y="245"
                      width="120"
                      height="20"
                      rx="10"
                      fill="rgba(15, 23, 42, 0.85)"
                      stroke="#475569"
                      strokeWidth="1"
                    />
                    <text
                      x="670"
                      y="259"
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      I_ph: 0.2 µA (DARK)
                    </text>
                  </g>
                )}

                {/* Interactive Component Hotspots - Clean Solid Glowing Outlines (ZERO dotted lines) */}
                {HARDWARE_COMPONENTS.map((comp) => {
                  const isSelected = selectedCompId === comp.id;
                  const isHovered = hoveredCompId === comp.id;
                  const b = comp.box;

                  return (
                    <g
                      key={comp.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        focusComponent(comp.id);
                      }}
                      onMouseEnter={() => setHoveredCompId(comp.id)}
                      onMouseLeave={() => setHoveredCompId(null)}
                      className="cursor-pointer group"
                    >
                      <rect
                        x={b.x}
                        y={b.y}
                        width={b.width}
                        height={b.height}
                        rx={10}
                        fill={isSelected ? `${b.color}28` : isHovered ? `${b.color}15` : 'transparent'}
                        stroke={isSelected ? '#38bdf8' : isHovered ? '#67e8f9' : 'transparent'}
                        strokeWidth={isSelected ? 4 : isHovered ? 2.5 : 0}
                        filter={isSelected ? 'url(#focusGlow)' : undefined}
                        className="transition-all duration-150"
                      />

                      {/* Optional Floating Component Label Tags on Image */}
                      {showTags && (
                        <g className="pointer-events-none transition-opacity duration-200">
                          <rect
                            x={comp.center.x - 55}
                            y={comp.center.y - 13}
                            width={110}
                            height={24}
                            rx={12}
                            fill={isSelected ? 'rgba(8, 20, 44, 0.95)' : 'rgba(5, 10, 20, 0.82)'}
                            stroke={isSelected ? '#38bdf8' : 'rgba(75, 85, 99, 0.6)'}
                            strokeWidth={isSelected ? 1.8 : 1}
                          />
                          <text
                            x={comp.center.x}
                            y={comp.center.y + 3}
                            textAnchor="middle"
                            fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                            fontSize={10}
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {comp.shortName}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Hover Tooltip (Appears when hovering a component) */}
            {hoveredComp && (
              <div
                className="absolute pointer-events-none z-30 bg-[#080e1b]/95 backdrop-blur-md border border-cyan-500/70 p-2.5 rounded-xl shadow-2xl text-xs font-mono space-y-1 transition-opacity animate-in fade-in"
                style={{
                  bottom: '80px',
                  left: '20px',
                  maxWidth: '320px'
                }}
              >
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredComp.box.color }} />
                  <strong className="text-white font-bold">{hoveredComp.name}</strong>
                </div>
                <p className="text-[11px] text-cyan-300">{hoveredComp.subtitle}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Role: {hoveredComp.pinoutCallout.pins[0]?.role?.slice(0, 35)}...</span>
                  <span className="text-emerald-400 font-bold ml-2">Click to inspect</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="h-[44px] px-3 lg:px-4 bg-[#060a14] border-t border-[#162238] flex items-center justify-between text-xs font-mono shrink-0 z-20 shadow-lg">
            <div className="flex items-center space-x-3 overflow-x-auto scrollbar-none">
              <span className="text-slate-400 flex items-center space-x-1.5 shrink-0">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>INSPECTING:</span>
                <strong className="text-cyan-300">{selectedComp.name}</strong>
              </span>

              <span className="text-slate-700 hidden sm:inline">|</span>

              <div className="hidden md:flex items-center space-x-3 text-[11px]">
                <span className="text-emerald-400">
                  CARRIER: <strong className="text-white">10.0 kHz OOK</strong>
                </span>
                <span className="text-amber-400">
                  AIR GAP: <strong className="text-white">15.0 cm</strong>
                </span>
                <span className="text-purple-400">
                  SNR: <strong className="text-white">28.4 dB</strong>
                </span>
                <span className="text-cyan-400">
                  PROBE: <strong className="text-white">{selectedComp.liveProbe.voltage}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onNavigateToBits && (
                <button
                  onClick={onNavigateToBits}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs font-mono flex items-center space-x-1.5 shadow-md shadow-blue-500/25 transition-all"
                  title="Switch to the dedicated Message & Bits Transmission page"
                >
                  <Radio className="w-3.5 h-3.5 text-cyan-200" />
                  <span>Message &amp; Bits Simulation ("HII")</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                </button>
              )}

              {sidebarMode === 'hidden' && (
                <button
                  onClick={() => setSidebarMode('docked')}
                  className="px-2.5 py-1 rounded bg-[#0f172a] hover:bg-[#1a263f] text-cyan-300 border border-cyan-800/40 text-xs font-bold font-mono flex items-center space-x-1 transition-all"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Inspector</span>
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------- */}
        {/* COMPONENT INSPECTOR: DOCKED SIDEBAR OR FLOATING HUD     */}
        {/* ------------------------------------------------------- */}
        {sidebarMode !== 'hidden' && (
          <>
            {/* Mobile backdrop overlay */}
            <div
              onClick={() => setSidebarMode('hidden')}
              className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
            />
            <aside
              className={`
                fixed inset-x-0 bottom-0 z-40 max-h-[75vh] bg-[#070c18]/98 backdrop-blur-2xl border-t border-cyan-500/50 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden
                lg:static lg:inset-auto lg:z-20 lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-l lg:border-[#16233a]
                ${
                  sidebarMode === 'docked'
                    ? 'lg:w-[380px] xl:w-[420px]'
                    : `lg:fixed lg:top-16 lg:right-4 lg:z-40 lg:bg-[#070c18]/95 lg:backdrop-blur-xl lg:border lg:border-cyan-500/40 lg:rounded-2xl lg:shadow-2xl ${
                        isHudMinimized ? 'lg:w-[260px] lg:h-[52px]' : 'lg:w-[390px] lg:max-h-[82vh]'
                      }`
                }
              `}
            >
              {/* Drag Handle on mobile */}
              <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto my-1.5 lg:hidden shrink-0" />

              {/* Inspector Header */}
              <div className="p-2.5 px-3 border-b border-[#16233a] bg-[#0b1222] flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Component Inspector
                </span>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleCopyPinout}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#111c2e] hover:bg-[#1a2842] text-cyan-300 border border-cyan-800/40 flex items-center space-x-1 transition-all"
                  title="Copy formatted connection details to clipboard"
                >
                  {copiedPin ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPin ? 'Copied!' : 'Copy'}</span>
                </button>

                {sidebarMode === 'floating' && (
                  <button
                    onClick={() => setIsHudMinimized(m => !m)}
                    className="p-1 hover:bg-[#1a263d] rounded text-slate-400 hover:text-white"
                    title={isHudMinimized ? 'Expand HUD' : 'Minimize HUD'}
                  >
                    {isHudMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                  </button>
                )}

                <button
                  onClick={() => setSidebarMode('hidden')}
                  className="p-1 hover:bg-[#1a263d] rounded text-slate-400 hover:text-white"
                  title="Hide sidebar"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* If HUD is not minimized, render full tabs and body */}
            {!isHudMinimized && (
              <>
                {/* Quick Search and Component Selector Chips */}
                <div className="p-2 border-b border-[#16233a] bg-[#050914] space-y-1.5 shrink-0">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search hardware components..."
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      className="w-full bg-[#0b1222] border border-[#1a2842] rounded-lg pl-8 pr-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>

                  {/* Component Chips Carousel */}
                  <div className="flex items-center space-x-1 overflow-x-auto scrollbar-none py-0.5">
                    {filteredComponents.map((comp) => {
                      const isSelected = selectedCompId === comp.id;
                      return (
                        <button
                          key={comp.id}
                          onClick={() => focusComponent(comp.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all flex items-center space-x-1 border shrink-0 ${
                            isSelected
                              ? 'bg-blue-600 text-white font-bold border-blue-400 shadow-md shadow-blue-600/30'
                              : 'bg-[#0b1222] text-slate-300 border-[#17243c] hover:bg-[#131f36]'
                          }`}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: comp.box.color }} />
                          <span>{comp.shortName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Inspector Navigation Tabs */}
                <div className="flex border-b border-[#16233a] bg-[#080d19] text-xs font-mono shrink-0 overflow-x-auto scrollbar-none">
                  <button
                    onClick={() => setActiveTab('connections')}
                    className={`flex-1 py-2 px-2 text-center font-bold border-b-2 transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                      activeTab === 'connections'
                        ? 'border-cyan-400 text-cyan-300 bg-[#0e192f]'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Pins</span>
                  </button>


                  <button
                    onClick={() => setActiveTab('specs')}
                    className={`flex-1 py-2 px-2 text-center font-bold border-b-2 transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                      activeTab === 'specs'
                        ? 'border-cyan-400 text-cyan-300 bg-[#0e192f]'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Specs</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('probe')}
                    className={`flex-1 py-2 px-2 text-center font-bold border-b-2 transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                      activeTab === 'probe'
                        ? 'border-emerald-400 text-emerald-300 bg-[#0c1f24]'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Probe</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('viva')}
                    className={`flex-1 py-2 px-2 text-center font-bold border-b-2 transition-all flex items-center justify-center space-x-1 whitespace-nowrap ${
                      activeTab === 'viva'
                        ? 'border-amber-400 text-amber-300 bg-[#1f1a14]'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Viva</span>
                  </button>
                </div>

                {/* Main Scrollable Inspector Body */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 font-mono text-xs">
                  {/* Component Title Card */}
                  <div className="bg-[#0a1120] border border-[#17253f] rounded-xl p-3 shadow-inner">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${selectedComp.badgeColor}`}>
                        {selectedComp.badge}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center space-x-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>ACTIVE</span>
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-white">{selectedComp.name}</h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">{selectedComp.subtitle}</p>
                  </div>



                  {/* TAB 1: PINOUT & BREADBOARD CONNECTIONS */}
                  {activeTab === 'connections' && (
                    <div className="space-y-2.5">
                      <div className="bg-[#0a1120] border border-[#17253f] rounded-xl p-3 space-y-2">
                        <div className="flex justify-between items-center border-b border-slate-800 pb-1.5">
                          <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5">
                            <Layers className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Exact Hardware Pins</span>
                          </span>
                          <span className="text-[10px] text-amber-400">BREADBOARD PINS</span>
                        </div>

                        <div className="space-y-2">
                          {selectedComp.pinoutCallout.pins.map((pin, idx) => (
                            <div key={idx} className="bg-[#0e172a] border border-[#1b2b48] rounded-lg p-2.5 space-y-1">
                              <div className="flex justify-between items-center">
                                <strong className="text-white text-[11px] flex items-center space-x-1.5">
                                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                  <span>{pin.name}</span>
                                </strong>
                                <span className="text-[10px] text-amber-300 font-bold bg-[#14223a] px-1.5 py-0.5 rounded border border-slate-700">
                                  {pin.voltage}
                                </span>
                              </div>

                              <div className="text-[10px] text-slate-300">
                                <span className="text-slate-400">Wire / Trace: </span>
                                <strong className="text-emerald-300">{pin.wireColor}</strong>
                              </div>

                              <p className="text-[10px] text-slate-400 leading-relaxed pt-0.5 border-t border-slate-800">
                                {pin.role}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Why It Is Connected */}
                      <div className="bg-[#0a1120] border border-[#17253f] rounded-xl p-3 space-y-1.5">
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-1">
                          <Info className="w-3.5 h-3.5 text-amber-400" />
                          <span>Why It Is Connected This Way</span>
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                          {selectedComp.professorExplanation}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: SPECIFICATIONS */}
                  {activeTab === 'specs' && (
                    <div className="bg-[#0a1120] border border-[#17253f] rounded-xl p-3 space-y-2 shadow-inner">
                      <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center space-x-1.5 border-b border-slate-800 pb-1.5">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Electrical Specifications</span>
                      </span>

                      <div className="divide-y divide-slate-800/70 text-[11px]">
                        {selectedComp.specs.map((s, idx) => (
                          <div key={idx} className="flex justify-between py-1.5">
                            <span className="text-slate-400">{s.label}:</span>
                            <strong className="text-white text-right ml-2">{s.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE SIGNAL PROBE */}
                  {activeTab === 'probe' && (
                    <div className="space-y-2.5">
                      <div className="bg-gradient-to-br from-[#0c1e28] to-[#08121c] border border-emerald-800/60 rounded-xl p-3 space-y-2 shadow-inner">
                        <div className="flex justify-between items-center border-b border-emerald-900/40 pb-1.5">
                          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center space-x-1.5">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Virtual Logic Probe</span>
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                            {selectedComp.liveProbe.logicState}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                          <div className="bg-[#061017] p-2 rounded-lg border border-emerald-900/40">
                            <span className="text-slate-400 block text-[10px]">Voltage Level</span>
                            <strong className="text-emerald-300 text-xs">{selectedComp.liveProbe.voltage}</strong>
                          </div>

                          <div className="bg-[#061017] p-2 rounded-lg border border-emerald-900/40">
                            <span className="text-slate-400 block text-[10px]">Current / Power</span>
                            <strong className="text-cyan-300 text-xs">{selectedComp.liveProbe.currentOrPower}</strong>
                          </div>

                          <div className="bg-[#061017] p-2 rounded-lg border border-emerald-900/40 col-span-2">
                            <span className="text-slate-400 block text-[10px]">Modulation / Frequency</span>
                            <strong className="text-amber-300 text-xs">{selectedComp.liveProbe.frequency}</strong>
                          </div>
                        </div>

                        {/* Interactive Audio Test Tone */}
                        <div className="pt-2 border-t border-emerald-900/40 flex justify-between items-center">
                          <span className="text-[10px] text-slate-400">Acoustic Carrier Probe:</span>
                          <button
                            onClick={() => triggerAudioChime(1000)}
                            className="px-2 py-1 rounded bg-emerald-900/50 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700 text-[10px] font-bold flex items-center space-x-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>Ping Probe</span>
                          </button>
                        </div>
                      </div>

                      <div className="bg-[#0a1120] border border-[#17253f] rounded-xl p-3 space-y-1.5">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block border-b border-slate-800 pb-1">
                          Signal Path Trace
                        </span>
                        <p className="text-[11px] text-slate-400 leading-relaxed pt-0.5">
                          Signal enters from <strong className="text-white">{selectedComp.connectionsExplanation[0]?.from || 'System Input'}</strong> and outputs to <strong className="text-white">{selectedComp.connectionsExplanation[0]?.to || 'System Load'}</strong>.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: PROFESSOR VIVA Q&A */}
                  {activeTab === 'viva' && (
                    <div className="space-y-2.5">
                      <div className="bg-gradient-to-br from-[#141224] to-[#0c0d1c] border border-amber-900/60 rounded-xl p-3 space-y-2 shadow-inner">
                        <div className="flex justify-between items-center border-b border-amber-900/40 pb-1.5">
                          <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center space-x-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Professor Exam Question</span>
                          </span>
                          <button
                            onClick={() => setIsVivaAnswerRevealed(r => !r)}
                            className="text-[10px] text-cyan-300 hover:underline"
                          >
                            {isVivaAnswerRevealed ? 'Hide Answer' : 'Reveal Answer'}
                          </button>
                        </div>

                        <div className="p-2.5 rounded bg-[#060814] border border-slate-800 text-[11px] space-y-2">
                          <strong className="text-amber-300 block">
                            Q: {selectedComp.vivaQuestion.question}
                          </strong>

                          {isVivaAnswerRevealed ? (
                            <p className="text-slate-200 leading-relaxed border-t border-slate-800 pt-2">
                              <strong className="text-emerald-400">Ans: </strong>
                              {selectedComp.vivaQuestion.answer}
                            </p>
                          ) : (
                            <button
                              onClick={() => setIsVivaAnswerRevealed(true)}
                              className="w-full py-1.5 bg-[#12192e] hover:bg-[#1a2544] text-cyan-300 rounded border border-cyan-800/40 text-[11px] font-bold"
                            >
                              Click to Reveal Professor Answer
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="bg-[#0a1120] border border-rose-900/50 rounded-xl p-3 space-y-1.5">
                        <span className="text-xs font-bold text-rose-300 uppercase tracking-wider border-b border-slate-800 pb-1 block">
                          What Happens If Disconnected?
                        </span>
                        <p className="text-[11px] text-slate-300 leading-relaxed pt-0.5">
                          {selectedComp.whatIfDisconnected}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </aside>
        </>
      )}
    </main>
    </div>
  );
};

export default FullHardwareSetupStudio;

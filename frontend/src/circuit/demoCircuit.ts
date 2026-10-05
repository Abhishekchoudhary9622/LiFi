// SemLiFi Circuits - Physical Hardware Digital Twin Component Catalog & Verified Demo Circuit
import { CircuitComponent, Wire, ComponentCategory, EducationalInfo, GuidedExplanationStep } from '../types/circuit';

export interface ComponentTemplate {
  typeId: string;
  name: string;
  category: ComponentCategory;
  description: string;
  defaultWidth: number;
  defaultHeight: number;
  defaultProperties: Record<string, any>;
  educationalInfo: EducationalInfo;
  pins: {
    id: string;
    name: string;
    type: 'power' | 'ground' | 'gpio' | 'adc' | 'pwm' | 'uart' | 'passive' | 'optical' | 'signal' | 'base' | 'collector' | 'emitter';
    direction?: 'input' | 'output' | 'bidirectional' | 'passive';
    voltageRange?: string;
    x: number;
    y: number;
    description?: string;
    purpose?: string;
    isPlaceholder?: boolean;
  }[];
}

export const COMPONENT_CATALOG: ComponentTemplate[] = [
  // 1. Resistor
  {
    typeId: 'resistor',
    name: 'Resistor',
    category: 'basic',
    description: 'Current limiting / biasing resistor with standard color bands (220 Ω, 0.25W, 5%)',
    defaultWidth: 84,
    defaultHeight: 28,
    defaultProperties: {
      resistance: 220,
      unit: 'Ω',
      tolerance: '±5%',
      powerRating: '0.25 W',
      purpose: 'Current limiting'
    },
    educationalInfo: {
      whatIsIt: 'A passive two-terminal discrete resistor implementing Ohm\'s law (V = I * R).',
      whatDoesItDo: 'Limits current flow to safe operational levels for semiconductors and provides base bias.',
      whyIsItUsed: 'Prevents excessive current from burning out the transmitter LED and limits base current into the 2N2222 switching transistor.',
      howDoesItWork: 'Dissipates excess voltage as thermal energy through a carbon-film or metal-oxide resistive element.',
      whereIsItConnected: 'Connected in series between the microcontroller modulation pin and the transmitter drive stage.',
      whatHappensIfRemoved: 'WHAT CHANGED? If R1 is shorted or removed, current exceeds 40 mA, risking permanent damage to the LED and driver transistor.',
      formula: 'I = (V_cc - V_be) / R_b = (3.3V - 0.7V) / 220 Ω ≈ 11.8 mA',
      datasheet: {
        partNumber: 'CFR-25JR-52-220R',
        manufacturer: 'Yageo / Standard EIA',
        maxVoltage: '250 V',
        maxCurrent: '33 mA (at 0.25W)',
        operatingTemp: '-55°C to +155°C',
        packageType: 'Axial Lead / Through-Hole',
        keyFeatures: ['Standard 4-band color code (Red-Red-Brown-Gold)', 'Flame retardant coating', 'High pulse endurance']
      },
      teacherExplanation: {
        summary: 'Current-limiting resistor protecting the optical emitter from overcurrent damage.',
        talkingPoints: [
          'Calculated using Ohm\'s law: I = (V_source - V_drop) / R.',
          'Maintains forward LED current well within the 20 mA continuous rating.',
          'If omitted, thermal runaway occurs in the semiconductor junction.'
        ],
        commonStudentQuestions: [
          { q: 'Why not use a 10k resistor?', a: 'A 10k resistor would limit current to ~0.1 mA, producing negligible optical output.' }
        ]
      }
    },
    pins: [
      { id: 'pin1', name: 'Pin 1', type: 'passive', direction: 'passive', x: 0, y: 14, description: 'Terminal 1', purpose: 'Input from controller pin' },
      { id: 'pin2', name: 'Pin 2', type: 'passive', direction: 'passive', x: 84, y: 14, description: 'Terminal 2', purpose: 'Output to transistor base / LED' }
    ]
  },

  // 2. 2N2222 NPN Transistor Driver
  {
    typeId: 'transistor_npn',
    name: '2N2222 NPN Transistor',
    category: 'discrete',
    description: 'High-speed NPN bipolar junction transistor (BJT) in TO-92 package used as optical switch driver',
    defaultWidth: 64,
    defaultHeight: 48,
    defaultProperties: {
      model: '2N2222A',
      vceSat: '0.3 V',
      hfe: '100 - 300',
      icMax: '800 mA',
      purpose: 'High-speed optical LED driver switch'
    },
    educationalInfo: {
      whatIsIt: 'A ubiquitous NPN bipolar junction transistor (BJT) housed in a semi-cylindrical TO-92 epoxy package.',
      whatDoesItDo: 'Operates as a high-speed saturated switch to sink current through the optical LED.',
      whyIsItUsed: 'Microcontroller GPIO pins cannot sink or source high continuous currents directly without voltage droop.',
      howDoesItWork: 'A small base current (I_b) allows a much larger collector current (I_c = beta * I_b) to flow when saturated.',
      whereIsItConnected: 'Base to resistor R1; Collector to LED cathode; Emitter to circuit ground (0V).',
      whatHappensIfRemoved: 'The optical LED cannot be switched on, breaking the optical communication carrier.',
      formula: 'I_c(sat) = (V_cc - V_f - V_ce(sat)) / R_load',
      datasheet: {
        partNumber: '2N2222A',
        manufacturer: 'ON Semiconductor / ST',
        maxVoltage: 'V_ceo = 40 V, V_cbo = 75 V',
        maxCurrent: 'I_c = 800 mA continuous',
        operatingTemp: '-65°C to +150°C',
        packageType: 'TO-92 (Through-Hole)',
        keyFeatures: ['Gain bandwidth product f_T = 300 MHz', 'Low saturation voltage V_ce(sat) < 0.3V', 'Turn-on time < 10 ns']
      },
      teacherExplanation: {
        summary: 'Discrete NPN switching stage isolating MCU digital logic from the higher-current optical emitter.',
        talkingPoints: [
          'High f_T bandwidth (300 MHz) enables crisp sub-microsecond optical pulse edges.',
          'Operates in saturation (switch closed) and cutoff (switch open) modes.',
          'Prevents GPIO pin voltage sag during heavy illumination bursts.'
        ],
        commonStudentQuestions: [
          { q: 'Can we use a MOSFET instead?', a: 'Yes, a 2N7002 or BS170 N-channel MOSFET could also be used, with zero steady-state gate current.' }
        ]
      }
    },
    pins: [
      { id: 'base', name: 'Base (B)', type: 'base', direction: 'input', x: 12, y: 38, description: 'Base Control Lead', purpose: 'Receives switching modulation from R1' },
      { id: 'collector', name: 'Collector (C)', type: 'collector', direction: 'passive', x: 32, y: 38, description: 'Collector Lead', purpose: 'Sinks current from LED cathode' },
      { id: 'emitter', name: 'Emitter (E)', type: 'emitter', direction: 'passive', x: 52, y: 38, description: 'Emitter Lead', purpose: 'Connects directly to 0V ground' }
    ]
  },

  // 3. LED / Optical Emitter
  {
    typeId: 'led',
    name: 'LiFi LED / Light Source',
    category: 'lifi',
    description: 'High-intensity optical emitter (850nm NIR / White Phosphor) with flat cathode notch',
    defaultWidth: 46,
    defaultHeight: 56,
    defaultProperties: {
      color: '#10b981',
      wavelengthNm: 850,
      opticalPowerMw: 3.5,
      forwardVoltage: 2.05,
      purpose: 'Optical signal emitter'
    },
    educationalInfo: {
      whatIsIt: 'A semiconductor optical source converting electrical current into modulated photon emissions.',
      whatDoesItDo: 'Emits light intensity pulses corresponding to binary data stream transitions (1 = ON, 0 = OFF).',
      whyIsItUsed: 'Forms the physical transmitting transducer that broadcasts the SemLiFi optical link through free space.',
      howDoesItWork: 'Electroluminescence occurs when forward-biased electron-hole pairs recombine at the PN junction.',
      whereIsItConnected: 'Anode connects to +3.3V power bus; Cathode connects to collector of 2N2222 driver transistor.',
      whatHappensIfRemoved: 'No optical carrier travels across free space; receiver photodetector sees only ambient room light.',
      formula: 'P_opt = eta * I_f * (h * c / lambda)',
      datasheet: {
        partNumber: 'IR333-A / High-Speed NIR',
        manufacturer: 'Everlight / Vishay',
        maxVoltage: 'Reverse Voltage V_r = 5 V',
        maxCurrent: 'Forward Current I_f = 50 mA',
        operatingTemp: '-40°C to +85°C',
        packageType: '5mm Radial Through-Hole (T-1 3/4)',
        keyFeatures: ['Peak wavelength 850 nm', 'Viewing angle 20° to 40°', 'Radiant intensity 35 mW/sr']
      },
      teacherExplanation: {
        summary: 'Optical emitter transducing microcontroller electrical digital pulses into photon packets.',
        talkingPoints: [
          'High radiant intensity allows line-of-sight propagation across benchtop distance (1–2 meters).',
          'Fast rise/fall switching speed (< 15 ns) easily supports 115.2 kbps modulation.',
          'Driven in common-emitter configuration for clean sharp transitions.'
        ],
        commonStudentQuestions: [
          { q: 'Why is near-infrared (850nm) preferred over visible light here?', a: '850nm matches the peak responsivity of silicon photodiodes and is invisible to human eyes.' }
        ]
      }
    },
    pins: [
      { id: 'anode', name: 'Anode (+)', type: 'passive', direction: 'input', x: 16, y: 48, description: 'Long Lead (+)', purpose: 'Connects to +3.3V power rail' },
      { id: 'cathode', name: 'Cathode (-)', type: 'ground', direction: 'passive', x: 30, y: 48, description: 'Short Lead / Flat Notch (-)', purpose: 'Connects to transistor collector' }
    ]
  },

  // 4. Photodetector / Photodiode (BPW34)
  {
    typeId: 'photodiode',
    name: 'Photodiode (BPW34)',
    category: 'sensors',
    description: 'Silicon PIN Photodiode with 7.5 mm² active light sensitive aperture window',
    defaultWidth: 80,
    defaultHeight: 68,
    defaultProperties: {
      model: 'BPW34',
      activeAreaMm2: 7.5,
      responsivityAW: 0.62,
      darkCurrentNa: 2.0,
      bandwidthMhz: 100,
      reverseBiasV: 3.3,
      purpose: 'Optical light detection & photocurrent generation'
    },
    educationalInfo: {
      whatIsIt: 'A high-speed planar silicon PIN photodiode with miniature clear plastic molding.',
      whatDoesItDo: 'Absorbs incident optical photons and generates an electrical photocurrent proportional to optical power.',
      whyIsItUsed: 'Serves as the physical optical receiver capturing modulated light transmitted across free space.',
      howDoesItWork: 'Operates in photoconductive mode under reverse bias, rapidly sweeping photogenerated carriers across the intrinsic region.',
      whereIsItConnected: 'Cathode connects to +3.3V (reverse bias); Anode connects to transimpedance amplifier inverting input.',
      whatHappensIfRemoved: 'The optical link is severed; the receiver circuitry produces 0V and cannot reconstruct any transmitted bits.',
      formula: 'I_pd = R(lambda) * P_opt = 0.62 A/W * P_opt',
      datasheet: {
        partNumber: 'BPW34',
        manufacturer: 'Vishay Semiconductors',
        maxVoltage: 'Reverse Voltage V_R = 60 V',
        maxCurrent: 'Photocurrent I_p = 50 uA at E_e = 1 mW/cm²',
        operatingTemp: '-40°C to +100°C',
        packageType: 'DIL Plastic Surface/Through-Hole',
        keyFeatures: ['Large radiant sensitive area (7.5 mm²)', 'Fast response time (t_r = 20 ns)', 'Wide angle of half sensitivity phi = ±65°']
      },
      teacherExplanation: {
        summary: 'PIN photodetector converting free-space photon flux into tiny microampere photocurrents.',
        talkingPoints: [
          'Reverse biasing at 3.3V significantly lowers internal junction capacitance (down to ~25 pF).',
          'Linear response across several orders of magnitude of optical power.',
          'Sensitivity peaks between 820 nm and 940 nm, matching the 850 nm emitter.'
        ],
        commonStudentQuestions: [
          { q: 'Why not use an LDR?', a: 'LDRs (Cadmium Sulfide) have millisecond response times and are far too slow for digital LiFi.' }
        ]
      }
    },
    pins: [
      { id: 'cathode', name: 'Cathode (Bias +)', type: 'power', direction: 'input', x: 14, y: 22, description: 'Reverse Bias Cathode (+3.3V)', purpose: 'Reverse biasing terminal' },
      { id: 'anode', name: 'Anode (Signal Out)', type: 'signal', direction: 'output', x: 14, y: 52, description: 'Photocurrent Output Lead', purpose: 'Carries microamp photocurrent to TIA' },
      { id: 'opt_in', name: 'Aperture Window', type: 'optical', direction: 'input', x: 66, y: 36, description: 'Light Sensitive Window', purpose: 'Receives photon pulses through air' }
    ]
  },

  // 5. Signal Conditioning / LM358 Transimpedance Amplifier (TIA)
  {
    typeId: 'signal_amplifier',
    name: 'LM358 TIA Amplifier Stage',
    category: 'discrete',
    description: 'Dual low-power operational amplifier in DIP-8 package configured as transimpedance pre-amp',
    defaultWidth: 92,
    defaultHeight: 70,
    defaultProperties: {
      model: 'LM358P / Op-Amp',
      feedbackResistance: '82 kΩ',
      gainVPerA: 82000,
      cutoffFrequency: '2 MHz',
      purpose: 'Current-to-voltage conversion & signal conditioning'
    },
    educationalInfo: {
      whatIsIt: 'A precision dual operational amplifier configured as a high-gain transimpedance amplifier (TIA).',
      whatDoesItDo: 'Amplifies and converts nanoamp/microamp photocurrent from the photodiode into a 0 to 3.3V analog voltage.',
      whyIsItUsed: 'Microcontroller ADC inputs cannot measure low currents directly; signal conditioning provides low-impedance voltage output.',
      howDoesItWork: 'The inverting input acts as a virtual ground; feedback resistor R_f establishes gain: V_out = I_pd * R_f.',
      whereIsItConnected: 'IN- connects to photodiode anode; OUT connects to microcontroller ADC input; VCC to 3.3V; GND to 0V.',
      whatHappensIfRemoved: 'Microcontroller ADC reads 0V; photocurrent is too weak to trigger logic thresholds.',
      formula: 'V_out = I_pd * R_feedback = 15.2 uA * 82 kΩ ≈ 1.25 V',
      datasheet: {
        partNumber: 'LM358P / LMV358',
        manufacturer: 'Texas Instruments / ST',
        maxVoltage: 'Supply Voltage V_cc = 32 V (single supply)',
        maxCurrent: 'Output Current = 40 mA',
        operatingTemp: '0°C to +70°C',
        packageType: 'DIP-8 (Through-Hole)',
        keyFeatures: ['Wide unity-gain bandwidth 1 MHz', 'Low input bias current 20 nA', 'Rail-to-rail single supply capability']
      },
      teacherExplanation: {
        summary: 'Transimpedance amplifier converting raw photodiode current into conditioned voltage for sampling.',
        talkingPoints: [
          'Feedback resistance (82 kΩ) sets the optical-to-electrical conversion transimpedance gain.',
          'Provides an active low-pass filtering effect to suppress high-frequency ambient noise.',
          'Provides a low-impedance analog signal suitable for direct connection to the ADC.'
        ],
        commonStudentQuestions: [
          { q: 'Why is an op-amp needed instead of just a resistor to ground?', a: 'A passive resistor creates an RC low-pass pole with the photodiode capacitance, severely degrading bandwidth.' }
        ]
      }
    },
    pins: [
      { id: 'vcc', name: 'VCC (+)', type: 'power', direction: 'input', x: 12, y: 16, description: 'Power Terminal (+3.3V)' },
      { id: 'in', name: 'IN- (Inverting)', type: 'signal', direction: 'input', x: 12, y: 50, description: 'Inverting Input', purpose: 'Receives photodiode anode photocurrent' },
      { id: 'gnd', name: 'GND (0V)', type: 'ground', direction: 'passive', x: 80, y: 16, description: 'Ground Terminal' },
      { id: 'out', name: 'OUT (Analog)', type: 'signal', direction: 'output', x: 80, y: 50, description: 'Conditioned Output', purpose: 'Drives microcontroller ADC pin' }
    ]
  },

  // 6. Microcontroller / Development Board (STM32 / ESP32)
  {
    typeId: 'stm32',
    name: 'Microcontroller (STM32 / ESP32)',
    category: 'microcontrollers',
    description: 'ARM Cortex-M3 72MHz / Tensilica development board with configurable physical pin mapping',
    defaultWidth: 200,
    defaultHeight: 96,
    defaultProperties: {
      model: 'STM32F103C8 / ESP32-WROOM',
      clockFrequency: '72 MHz / 240 MHz',
      operatingVoltage: 3.3,
      verifiedPins: 'Configurable in Physical Mapping layer',
      purpose: 'Optical modulation generation & ADC symbol demodulation'
    },
    educationalInfo: {
      whatIsIt: 'A 32-bit embedded microcontroller development board executing the SemLiFi firmware.',
      whatDoesItDo: 'Runs the software modulation loop, generates hardware PWM transmitter pulses, and samples incoming optical signals with its 12-bit ADC.',
      whyIsItUsed: 'Serves as the central digital engine for both physical optical transmission and algorithmic burst recovery.',
      howDoesItWork: 'Internal timers pulse the TX pin at the configured baud rate; ADC DMA captures analog samples for threshold slicing.',
      whereIsItConnected: 'VCC to 3.3V power; GND to common ground; TX pin to driver stage; RX ADC pin to amplifier output.',
      whatHappensIfRemoved: 'The entire hardware testbed goes dead; no modulation is emitted and no packets are processed.',
      formula: 'T_bit = 1 / BaudRate; ADC_counts = (V_in / 3.3V) * 4095',
      datasheet: {
        partNumber: 'STM32F103C8T6 / Blue Pill',
        manufacturer: 'STMicroelectronics',
        maxVoltage: 'Operating Voltage 2.0V to 3.6V (3.3V nominal)',
        maxCurrent: 'Maximum current sink/source per GPIO = 25 mA',
        operatingTemp: '-40°C to +85°C',
        packageType: 'LQFP48 on Breakout PCB',
        keyFeatures: ['ARM 32-bit Cortex-M3 CPU at 72 MHz', '64 Kbytes of Flash memory', '12-bit, 1 µs A/D converter (up to 16 channels)']
      },
      teacherExplanation: {
        summary: 'Embedded brain executing the packet framing, Manchester/OOK encoding, and digital symbol slicing.',
        talkingPoints: [
          'Directly controls optical burst transmission and samples optical reception.',
          'Physical pin connections can be verified and mapped using the dedicated Hardware Mapping inspector.',
          'Demonstrates real hardware-in-the-loop embedded engineering.'
        ],
        commonStudentQuestions: [
          { q: 'Is PA0 fixed on the hardware?', a: 'No, any timer-capable PWM pin (PA0, PA1, PA8, PB0, etc.) can be configured and mapped.' }
        ]
      }
    },
    pins: [
      { id: 'vcc_3v3', name: '3.3V', type: 'power', direction: 'input', voltageRange: '3.0 - 3.6V', x: 12, y: 20, description: '+3.3V Supply In', purpose: 'Power rail input' },
      { id: 'gnd_1', name: 'GND', type: 'ground', direction: 'passive', x: 12, y: 38, description: 'Digital Ground', purpose: '0V reference return' },
      { id: 'pax_tx', name: 'PAx (TX PWM)', type: 'pwm', direction: 'output', voltageRange: '0 - 3.3V', x: 12, y: 56, description: 'Configurable TX Pin (Default PA0 / GPIO23)', purpose: 'Modulation output to transmitter stage', isPlaceholder: true },
      { id: 'pax_rx', name: 'PAx (RX ADC)', type: 'adc', direction: 'input', voltageRange: '0 - 3.3V', x: 12, y: 74, description: 'Configurable RX Pin (Default PA1 / GPIO34)', purpose: 'Analog input from TIA amplifier', isPlaceholder: true },
      { id: 'pa2', name: 'PA2 (UART TX)', type: 'uart', direction: 'output', x: 188, y: 20, description: 'USART2 Telemetry Output' },
      { id: 'pa3', name: 'PA3 (UART RX)', type: 'uart', direction: 'input', x: 188, y: 38, description: 'USART2 Telemetry Input' },
      { id: 'pa4', name: 'PA4 (GPIO)', type: 'gpio', direction: 'bidirectional', x: 188, y: 56, description: 'General Purpose IO' },
      { id: 'gnd_2', name: 'GND_2', type: 'ground', direction: 'passive', x: 188, y: 74, description: 'Secondary Ground' }
    ]
  },

  // 7. Power Supply Module
  {
    typeId: 'power_3v3',
    name: '3.3V Power Source',
    category: 'power',
    description: 'Benchtop DC linear regulated power source (+3.3V, 800mA limit) with red/black binding posts',
    defaultWidth: 76,
    defaultHeight: 56,
    defaultProperties: {
      voltage: 3.3,
      currentLimit: 800,
      unit: 'V'
    },
    educationalInfo: {
      whatIsIt: 'A regulated DC benchtop laboratory power supply providing stable 3.30V rail potential.',
      whatDoesItDo: 'Powers all active integrated circuits, discrete transistors, and biasing stages.',
      whyIsItUsed: 'Ensures noise-free regulated operating potential within embedded component ratings.',
      howDoesItWork: 'Step-down regulation with high ripple rejection maintaining fixed potential.',
      whereIsItConnected: 'Red post connects to breadboard positive power rail; Black post to ground rail.',
      whatHappensIfRemoved: 'Circuit unpowered; all node voltages collapse to 0V.'
    },
    pins: [
      { id: 'vcc', name: '+3.3V', type: 'power', direction: 'output', x: 22, y: 48, description: 'Positive Terminal (+3.3V)', purpose: 'Ties to breadboard red power rail' },
      { id: 'gnd', name: 'GND (0V)', type: 'ground', direction: 'output', x: 54, y: 48, description: 'Common Ground (0V)', purpose: 'Ties to breadboard blue ground rail' }
    ]
  },

  // 8. Ground Reference Terminal
  {
    typeId: 'ground_terminal',
    name: 'Ground Reference (GND)',
    category: 'power',
    description: 'System common 0V ground reference node',
    defaultWidth: 48,
    defaultHeight: 48,
    defaultProperties: { voltage: 0, status: 'VERIFIED' },
    educationalInfo: {
      whatIsIt: 'Common reference potential (0V) for the entire hardware circuit.',
      whatDoesItDo: 'Provides return path for currents from all active stages.',
      whyIsItUsed: 'Essential for closed current loops and reference level.',
      howDoesItWork: 'Tied to bench power supply black binding post.',
      whereIsItConnected: 'Ties to breadboard blue ground rails.',
      whatHappensIfRemoved: 'Ground return lost; circuit stops working.'
    },
    pins: [
      { id: 'gnd', name: 'GND', type: 'ground', direction: 'passive', x: 24, y: 12, description: 'Ground Node' }
    ]
  },

  // 9. Passive Capacitor
  {
    typeId: 'capacitor',
    name: 'Ceramic Capacitor (100 nF)',
    category: 'discrete',
    description: '100 nF ceramic bypass capacitor for rail decoupling and high-frequency noise suppression',
    defaultWidth: 48,
    defaultHeight: 40,
    defaultProperties: { capacitance: '100 nF', dielectric: 'X7R', voltageRating: '50 V', status: 'VERIFIED' },
    educationalInfo: {
      whatIsIt: 'A multi-layer ceramic capacitor (MLCC).',
      whatDoesItDo: 'Filters high-frequency switching transients and stabilizes rail voltage.',
      whyIsItUsed: 'Prevents optical transmitter switching noise from polluting the sensitive receiver TIA.',
      howDoesItWork: 'Low impedance at high frequencies shunts noise spikes to ground.',
      whereIsItConnected: 'Placed in parallel between +3.3V rail and GND near active ICs.',
      whatHappensIfRemoved: 'Higher noise floor on TIA and potential bit errors during optical bursts.'
    },
    pins: [
      { id: 'pin1', name: 'Pin 1 (+)', type: 'passive', direction: 'passive', x: 12, y: 32 },
      { id: 'pin2', name: 'Pin 2 (-)', type: 'passive', direction: 'passive', x: 36, y: 32 }
    ]
  },

  // 10. Switching Diode (1N4148)
  {
    typeId: 'diode',
    name: 'Switching Diode (1N4148)',
    category: 'discrete',
    description: 'High-speed silicon switching diode for reverse polarity protection',
    defaultWidth: 56,
    defaultHeight: 36,
    defaultProperties: { model: '1N4148', forwardVoltage: '0.7 V', maxCurrent: '200 mA', status: 'VERIFIED' },
    educationalInfo: {
      whatIsIt: 'High-speed small-signal silicon planar epitaxial diode.',
      whatDoesItDo: 'Conducts current in one direction only (anode to cathode).',
      whyIsItUsed: 'Protects sensitive semiconductor gates against inductive flyback or accidental reverse voltage.',
      howDoesItWork: 'P-N junction conducts when forward biased past 0.7V.',
      whereIsItConnected: 'In series or clamp across power lines.',
      whatHappensIfRemoved: 'Reverse voltage transients could damage the microcontroller or op-amp.'
    },
    pins: [
      { id: 'anode', name: 'Anode (+)', type: 'passive', direction: 'passive', x: 8, y: 18 },
      { id: 'cathode', name: 'Cathode (-)', type: 'passive', direction: 'passive', x: 48, y: 18 }
    ]
  },

  // 11. Optical Channel Link Object
  {
    typeId: 'optical_channel',
    name: 'Free-Space Optical Channel Link',
    category: 'lifi',
    description: 'Line-of-sight wireless optical air gap link with Lambertian path loss and ambient noise',
    defaultWidth: 160,
    defaultHeight: 48,
    defaultProperties: {
      distanceM: 1.2,
      alignmentPercent: 98,
      opticalPowerMw: 3.5,
      attenuationDb: 4.8,
      ambientLux: 250,
      receiverSensitivityUa: 0.62,
      polarization: 'NOT IMPLEMENTED',
      atmosphericScintillation: 'NOT IMPLEMENTED'
    },
    educationalInfo: {
      whatIsIt: 'The physical free-space transmission medium between the optical emitter and photodetector.',
      whatDoesItDo: 'Propagates modulated photons from the 850nm NIR LED across air to the BPW34 photodiode.',
      whyIsItUsed: 'The defining core channel of Visible Light Communication (VLC) and LiFi.',
      howDoesItWork: 'Follows inverse-square geometric spreading (Lambertian radiant intensity profile).',
      whereIsItConnected: 'Positioned in the optical line-of-sight between LED output and photodiode aperture.',
      whatHappensIfRemoved: 'Complete link loss; no photons reach the receiver.'
    },
    pins: [
      { id: 'opt_in', name: 'TX Aperture', type: 'optical', direction: 'input', x: 10, y: 24 },
      { id: 'opt_out', name: 'RX Aperture', type: 'optical', direction: 'output', x: 150, y: 24 }
    ]
  },

  // 12. Solderless Breadboard
  {
    typeId: 'breadboard_half',
    name: 'Solderless Breadboard (30 Rows)',
    category: 'breadboards',
    description: 'Standard 400-point prototyping breadboard with addressable 5-hole terminal strips and power buses',
    defaultWidth: 640,
    defaultHeight: 280,
    defaultProperties: {
      rows: 30,
      tiePoints: 400
    },
    educationalInfo: {
      whatIsIt: 'A physical prototyping base with internal nickel-silver spring clips.',
      whatDoesItDo: 'Electrically interconnects component pins inserted into the same 5-hole row or longitudinal power bus.',
      whyIsItUsed: 'Permits rapid solder-free assembly, modification, and physical verification of the SemLiFi circuit.',
      howDoesItWork: 'Row holes A-E share one internal bus; holes F-J share another; center gutter provides 0.3" IC spacing.',
      whereIsItConnected: 'Forms the physical chassis and substrate for all discrete prototype components.',
      whatHappensIfRemoved: 'Components must be soldered or wire-wrapped point-to-point.'
    },
    pins: []
  }
];

// Preloaded SemLiFi Physical Hardware Replica
export function createDemoCircuit(): { components: CircuitComponent[]; wires: Wire[] } {
  const components: CircuitComponent[] = [
    // 1. Power Supply
    {
      id: 'PWR_1',
      typeId: 'power_3v3',
      name: '3.3V DC Source',
      category: 'power',
      x: 70,
      y: 30,
      rotation: 0,
      properties: { voltage: 3.3, currentLimit: 800, unit: 'V' },
      pins: [
        { id: 'vcc', name: '+3.3V', type: 'power', direction: 'output', x: 22, y: 48 },
        { id: 'gnd', name: 'GND', type: 'ground', direction: 'output', x: 54, y: 48 }
      ]
    },

    // 2. STM32 / Microcontroller with placeholder customizable pins
    {
      id: 'MCU_1',
      typeId: 'stm32',
      name: 'Microcontroller (STM32)',
      category: 'microcontrollers',
      x: 60,
      y: 170,
      rotation: 0,
      properties: {
        model: 'STM32F103C8 / ESP32',
        clockFrequency: '72 MHz',
        operatingVoltage: 3.3,
        txPinLabel: 'PAx (Verified Physical Pin: PA0)',
        rxPinLabel: 'PAx (Verified Physical Pin: PA1)'
      },
      pins: [
        { id: 'vcc_3v3', name: '3.3V', type: 'power', direction: 'input', x: 12, y: 20 },
        { id: 'gnd_1', name: 'GND', type: 'ground', direction: 'passive', x: 12, y: 38 },
        { id: 'pax_tx', name: 'PAx (TX PWM)', type: 'pwm', direction: 'output', x: 12, y: 56, isPlaceholder: true, purpose: 'Transmitter modulation drive' },
        { id: 'pax_rx', name: 'PAx (RX ADC)', type: 'adc', direction: 'input', x: 12, y: 74, isPlaceholder: true, purpose: 'Receiver optical analog sampling' },
        { id: 'pa2', name: 'PA2 (UART TX)', type: 'uart', direction: 'output', x: 188, y: 20 },
        { id: 'pa3', name: 'PA3 (UART RX)', type: 'uart', direction: 'input', x: 188, y: 38 },
        { id: 'pa4', name: 'PA4 (GPIO)', type: 'gpio', direction: 'bidirectional', x: 188, y: 56 },
        { id: 'gnd_2', name: 'GND_2', type: 'ground', direction: 'passive', x: 188, y: 74 }
      ]
    },

    // 3. Resistor R1 (220 Ω) Base Limiting Resistor mounted into Breadboard Row 14 & Row 18
    {
      id: 'R_1',
      typeId: 'resistor',
      name: 'R1 (220 Ω Base Limiter)',
      category: 'basic',
      x: 320,
      y: 200,
      rotation: 0,
      properties: { resistance: 220, unit: 'Ω', tolerance: '±5%', powerRating: '0.25 W', purpose: 'Transistor base current limiter' },
      mountedHoles: [
        { pinId: 'pin1', holeId: 'E14' },
        { pinId: 'pin2', holeId: 'E18' }
      ],
      pins: [
        { id: 'pin1', name: 'Pin 1', type: 'passive', direction: 'passive', x: 0, y: 14, connectedHoleId: 'E14' },
        { id: 'pin2', name: 'Pin 2', type: 'passive', direction: 'passive', x: 84, y: 14, connectedHoleId: 'E18' }
      ]
    },

    // 4. 2N2222 NPN Transistor Driver mounted into Breadboard Row 18, 19, 20
    {
      id: 'Q_1',
      typeId: 'transistor_npn',
      name: '2N2222 Driver Switch',
      category: 'discrete',
      x: 440,
      y: 200,
      rotation: 0,
      properties: { model: '2N2222A', vceSat: '0.3V', hfe: '150', purpose: 'Optical LED cathode sink switch' },
      mountedHoles: [
        { pinId: 'base', holeId: 'D18' },
        { pinId: 'collector', holeId: 'D19' },
        { pinId: 'emitter', holeId: 'D20' }
      ],
      pins: [
        { id: 'base', name: 'Base (B)', type: 'base', direction: 'input', x: 12, y: 38, connectedHoleId: 'D18' },
        { id: 'collector', name: 'Collector (C)', type: 'collector', direction: 'passive', x: 32, y: 38, connectedHoleId: 'D19' },
        { id: 'emitter', name: 'Emitter (E)', type: 'emitter', direction: 'passive', x: 52, y: 38, connectedHoleId: 'D20' }
      ]
    },

    // 5. LiFi LED Transmitter Emitter mounted into Breadboard Row 19 & Top Power Rail
    {
      id: 'LED_1',
      typeId: 'led',
      name: 'LiFi LED Transmitter (850nm)',
      category: 'lifi',
      x: 490,
      y: 110,
      rotation: 0,
      properties: { color: '#10b981', wavelengthNm: 850, opticalPowerMw: 3.5, forwardVoltage: 2.05, purpose: 'High-speed optical photon transmitter' },
      mountedHoles: [
        { pinId: 'anode', holeId: 'TP_19' },
        { pinId: 'cathode', holeId: 'C19' }
      ],
      pins: [
        { id: 'anode', name: 'Anode (+)', type: 'passive', direction: 'input', x: 16, y: 48, connectedHoleId: 'TP_19' },
        { id: 'cathode', name: 'Cathode (-)', type: 'ground', direction: 'passive', x: 30, y: 48, connectedHoleId: 'C19' }
      ]
    },

    // 6. BPW34 PIN Photodiode Receiver mounted into Breadboard Row 25
    {
      id: 'PD_1',
      typeId: 'photodiode',
      name: 'BPW34 Photodiode Receiver',
      category: 'sensors',
      x: 680,
      y: 110,
      rotation: 0,
      properties: { model: 'BPW34', responsivityAW: 0.62, activeAreaMm2: 7.5, purpose: 'Reverse-biased photocurrent detector' },
      mountedHoles: [
        { pinId: 'cathode', holeId: 'TP_25' },
        { pinId: 'anode', holeId: 'C25' }
      ],
      pins: [
        { id: 'cathode', name: 'Cathode (Bias +)', type: 'power', direction: 'input', x: 14, y: 22, connectedHoleId: 'TP_25' },
        { id: 'anode', name: 'Anode (Signal Out)', type: 'signal', direction: 'output', x: 14, y: 52, connectedHoleId: 'C25' },
        { id: 'opt_in', name: 'Aperture Window', type: 'optical', direction: 'input', x: 66, y: 36 }
      ]
    },

    // 7. LM358 Signal Conditioning TIA Op-Amp mounted into Breadboard Row 25 & 26
    {
      id: 'AMP_1',
      typeId: 'signal_amplifier',
      name: 'LM358 TIA Pre-Amplifier',
      category: 'discrete',
      x: 770,
      y: 190,
      rotation: 0,
      properties: { model: 'LM358P', feedbackResistance: '82 kΩ', gainVPerA: 82000, purpose: 'Photocurrent-to-voltage conversion' },
      mountedHoles: [
        { pinId: 'in', holeId: 'E25' },
        { pinId: 'out', holeId: 'E26' }
      ],
      pins: [
        { id: 'vcc', name: 'VCC (+)', type: 'power', direction: 'input', x: 12, y: 16 },
        { id: 'in', name: 'IN- (Inverting)', type: 'signal', direction: 'input', x: 12, y: 50, connectedHoleId: 'E25' },
        { id: 'gnd', name: 'GND (0V)', type: 'ground', direction: 'passive', x: 80, y: 16 },
        { id: 'out', name: 'OUT (Analog)', type: 'signal', direction: 'output', x: 80, y: 50, connectedHoleId: 'E26' }
      ]
    }
  ];

  const wires: Wire[] = [
    // 1. Power Supply VCC -> Breadboard Top Positive Rail
    {
      id: 'w_pwr_rail',
      fromComponentId: 'PWR_1',
      fromPinId: 'vcc',
      toComponentId: 'BREADBOARD',
      toPinId: 'TP_1',
      color: '#ef4444',
      signalType: 'power',
      purpose: 'Energizes +3.3V breadboard power bus rail',
      active: true,
      voltage: 3.3,
      isVerified: true
    },
    // 2. Power Supply GND -> Breadboard Top Negative Rail
    {
      id: 'w_gnd_rail',
      fromComponentId: 'PWR_1',
      fromPinId: 'gnd',
      toComponentId: 'BREADBOARD',
      toPinId: 'TN_1',
      color: '#1e293b',
      signalType: 'ground',
      purpose: 'Establishes 0V common ground return bus',
      active: true,
      voltage: 0.0,
      isVerified: true
    },
    // 3. Breadboard Rail -> STM32 VCC
    {
      id: 'w_mcu_vcc',
      fromComponentId: 'BREADBOARD',
      fromPinId: 'TP_4',
      toComponentId: 'MCU_1',
      toPinId: 'vcc_3v3',
      color: '#ef4444',
      signalType: 'power',
      purpose: 'Supplies regulated 3.3V to ARM processor',
      active: true,
      voltage: 3.3,
      isVerified: true
    },
    // 4. Breadboard Ground -> STM32 GND
    {
      id: 'w_mcu_gnd',
      fromComponentId: 'BREADBOARD',
      fromPinId: 'TN_4',
      toComponentId: 'MCU_1',
      toPinId: 'gnd_1',
      color: '#1e293b',
      signalType: 'ground',
      purpose: 'Provides digital 0V reference to microcontroller',
      active: true,
      voltage: 0.0,
      isVerified: true
    },
    // 5. STM32 TX (PAx) -> Breadboard Row 14 (Resistor R1 Pin 1)
    {
      id: 'w_pax_r1',
      fromComponentId: 'MCU_1',
      fromPinId: 'pax_tx',
      toComponentId: 'R_1',
      toPinId: 'pin1',
      color: '#06b6d4',
      signalType: 'pwm',
      purpose: 'Carries modulated PWM switching pulses to R1',
      active: true,
      voltage: 3.28,
      isVerified: true
    },
    // 6. Resistor R1 Pin 2 (Row 18) -> Transistor Base (Row 18)
    {
      id: 'w_r1_base',
      fromComponentId: 'R_1',
      fromPinId: 'pin2',
      toComponentId: 'Q_1',
      toPinId: 'base',
      color: '#06b6d4',
      signalType: 'pwm',
      purpose: 'Supplies base switching current into 2N2222 transistor',
      active: true,
      voltage: 0.72,
      isVerified: true
    },
    // 7. Transistor Collector (Row 19) -> LED Cathode (Row 19)
    {
      id: 'w_q1_led',
      fromComponentId: 'Q_1',
      fromPinId: 'collector',
      toComponentId: 'LED_1',
      toPinId: 'cathode',
      color: '#f59e0b',
      signalType: 'digital',
      purpose: 'Sinks forward current through LED when transistor saturates',
      active: true,
      voltage: 0.28,
      isVerified: true
    },
    // 8. Transistor Emitter (Row 20) -> Breadboard Ground Rail
    {
      id: 'w_q1_gnd',
      fromComponentId: 'Q_1',
      fromPinId: 'emitter',
      toComponentId: 'BREADBOARD',
      toPinId: 'TN_20',
      color: '#1e293b',
      signalType: 'ground',
      purpose: 'Emitter ground return path',
      active: true,
      voltage: 0.0,
      isVerified: true
    },
    // 9. FREE-SPACE OPTICAL CHANNEL (Light beam traveling across free air)
    {
      id: 'w_optical_channel',
      fromComponentId: 'LED_1',
      fromPinId: 'anode',
      toComponentId: 'PD_1',
      toPinId: 'opt_in',
      color: '#eab308',
      signalType: 'optical',
      purpose: 'Free-space near-infrared (850nm) photon propagation link',
      active: true,
      isVerified: true
    },
    // 10. Photodiode Anode (Row 25) -> LM358 Amplifier IN- (Row 25)
    {
      id: 'w_pd_amp',
      fromComponentId: 'PD_1',
      fromPinId: 'anode',
      toComponentId: 'AMP_1',
      toPinId: 'in',
      color: '#3b82f6',
      signalType: 'analog',
      purpose: 'Transfers microamp photocurrent to transimpedance pre-amp',
      active: true,
      voltage: 0.05,
      isVerified: true
    },
    // 11. LM358 Power VCC & GND
    {
      id: 'w_amp_vcc',
      fromComponentId: 'BREADBOARD',
      fromPinId: 'TP_26',
      toComponentId: 'AMP_1',
      toPinId: 'vcc',
      color: '#ef4444',
      signalType: 'power',
      purpose: 'Supplies 3.3V rail to operational amplifier',
      active: true,
      voltage: 3.3,
      isVerified: true
    },
    {
      id: 'w_amp_gnd',
      fromComponentId: 'BREADBOARD',
      fromPinId: 'TN_26',
      toComponentId: 'AMP_1',
      toPinId: 'gnd',
      color: '#1e293b',
      signalType: 'ground',
      purpose: 'Op-amp ground reference',
      active: true,
      voltage: 0.0,
      isVerified: true
    },
    // 12. LM358 OUT (Row 26) -> STM32 RX (PAx ADC)
    {
      id: 'w_amp_adc',
      fromComponentId: 'AMP_1',
      fromPinId: 'out',
      toComponentId: 'MCU_1',
      toPinId: 'pax_rx',
      color: '#10b981',
      signalType: 'analog',
      purpose: 'Feeds amplified 0-3.3V optical signal into MCU ADC',
      active: true,
      voltage: 2.14,
      isVerified: true
    }
  ];

  return { components, wires };
}

// Guided Explanation Steps for Teacher / Student Presentation Walkthrough
export const GUIDED_EXPLANATION_STEPS: GuidedExplanationStep[] = [
  {
    stepNumber: 1,
    title: '1. Power Supply & Reference Rails',
    componentIds: ['PWR_1'],
    wireIds: ['w_pwr_rail', 'w_gnd_rail'],
    summary: 'The circuit is powered by a regulated 3.3V DC linear power source distributing power along the top breadboard rails.',
    technicalDetails: 'VCC (+3.3V) and GND (0V) provide steady operational potential. Decoupling ensures stable voltage without switching ripple.',
    whatToSayToTeacher: 'Sir/Ma\'am, here is our 3.3V DC power supply. It powers both the microcontroller logic and the transmitter/receiver stages via common rails.'
  },
  {
    stepNumber: 2,
    title: '2. Microcontroller Controller Stage',
    componentIds: ['MCU_1'],
    pinIds: ['MCU_1:vcc_3v3', 'MCU_1:gnd_1'],
    summary: 'The 32-bit microcontroller executes the SemLiFi protocol firmware at 72 MHz.',
    technicalDetails: 'Timer 2 generates the hardware PWM / Manchester encoded modulation. The internal 12-bit ADC samples incoming optical bursts.',
    whatToSayToTeacher: 'This is our 32-bit microcontroller development board. It runs our transmitter and receiver firmware, encoding packets and analyzing received data.'
  },
  {
    stepNumber: 3,
    title: '3. Transmit Modulator & Driver Stage',
    componentIds: ['R_1', 'Q_1'],
    wireIds: ['w_pax_r1', 'w_r1_base'],
    summary: 'The digital modulation signal passes through base resistor R1 into a 2N2222 high-speed NPN transistor driver.',
    technicalDetails: 'R1 (220 Ω) limits the base current. The 2N2222 acts as a saturated common-emitter switch to sink high optical current without overloading the MCU pin.',
    whatToSayToTeacher: 'Rather than driving the LED directly from a GPIO pin, we pass the signal through resistor R1 into a 2N2222 transistor switch for high-current pulse control.'
  },
  {
    stepNumber: 4,
    title: '4. Optical Emitter & Free-Space Channel',
    componentIds: ['LED_1'],
    wireIds: ['w_q1_led', 'w_optical_channel'],
    summary: 'The 850nm near-infrared LED pulses light packets across free space to the optical receiver.',
    technicalDetails: 'Electroluminescence emits photons proportional to forward current. Free-space optical path loss follows Lambertian 1/d² geometric attenuation.',
    whatToSayToTeacher: 'This is our optical transmitter. Light travels as near-infrared optical pulses through free air to the photodetector, avoiding RF interference.'
  },
  {
    stepNumber: 5,
    title: '5. Photodiode Receiver Detector',
    componentIds: ['PD_1'],
    pinIds: ['PD_1:cathode', 'PD_1:anode'],
    summary: 'A BPW34 silicon PIN photodiode collects the optical pulses and converts them into photocurrent.',
    technicalDetails: 'Reverse-biased at 3.3V in photoconductive mode to minimize junction capacitance and maximize optical bandwidth (responsivity 0.62 A/W).',
    whatToSayToTeacher: 'Here is our BPW34 PIN photodiode. When the optical pulses strike its silicon window, it generates a proportional microampere photocurrent.'
  },
  {
    stepNumber: 6,
    title: '6. Signal Conditioning / TIA Amplifier',
    componentIds: ['AMP_1'],
    wireIds: ['w_pd_amp', 'w_amp_vcc', 'w_amp_gnd'],
    summary: 'An LM358 operational amplifier in transimpedance (TIA) mode converts microamps into a 0–3.3V analog voltage.',
    technicalDetails: 'Uses an 82 kΩ feedback resistor. Active bandpass filtering strips DC ambient office illumination noise while preserving pulse edges.',
    whatToSayToTeacher: 'Because the photodiode current is in microamps, our LM358 op-amp converts it into a conditioned 0-to-3.3V voltage swing.'
  },
  {
    stepNumber: 7,
    title: '7. Microcontroller ADC Sampling',
    componentIds: ['MCU_1'],
    wireIds: ['w_amp_adc'],
    pinIds: ['MCU_1:pax_rx'],
    summary: 'The conditioned analog output enters the microcontroller ADC pin for digital threshold slicing.',
    technicalDetails: 'The 12-bit ADC samples at the mid-bit window (450–550 µs) and reconstructs high and low logic bits with dynamic thresholding.',
    whatToSayToTeacher: 'The analog signal enters our microcontroller ADC pin where our software slices the waveform and decodes the bits.'
  },
  {
    stepNumber: 8,
    title: '8. Recovered Data & Burst Reconstruction',
    componentIds: ['MCU_1'],
    summary: 'The received bitstream is validated against CRC-8 checksums and processed by the SemLiFi recovery algorithm.',
    technicalDetails: 'If an optical occlusion occurs (person walking past), the confidence-gated fallback protocol (CGFP) detects the gap and executes semantic repair.',
    whatToSayToTeacher: 'Finally, the microcontroller recovers the original data packets. If bursts are lost due to light blockages, our SemLiFi algorithm detects and repairs them.'
  }
];

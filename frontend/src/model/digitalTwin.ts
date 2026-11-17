export type ComponentCategory = 'transmitter' | 'optical' | 'receiver' | 'driver' | 'conditioning' | 'passive';
export type VerificationStatus = 'MEASURED' | 'SIMULATED' | 'ESTIMATED' | 'NOT VERIFIED';

export interface HardwareComponentSpec {
  label: string;
  value: string;
  status: VerificationStatus;
}

export interface DigitalTwinComponent {
  id: string;
  name: string;
  shortName: string;
  type: string;
  role: string;
  badge: 'TX' | 'RX' | 'CHANNEL' | 'DRIVER' | 'ANALOG' | 'PASSIVE';
  badgeColor: string;
  category: ComponentCategory;
  physicalPhoto: string;
  normalizedPosition: { x: number; y: number }; // Relative coordinates (0.0 to 1.0) on full_hardware_setup.jpg
  box: { width: number; height: number };
  specs: HardwareComponentSpec[];
  connections: string;
  functionDescription: string;
  whyUsed: string;
  vivaNote: string;
  flowStep: number; // 1 to 8
  schematicNodeId: string;
}

export interface DigitalTwinConnection {
  id: string;
  fromId: string;
  toId: string;
  type: 'ELECTRICAL' | 'OPTICAL';
  signalName: string;
  description: string;
  verified: boolean;
}

export const DIGITAL_TWIN_COMPONENTS: DigitalTwinComponent[] = [
  {
    id: 'stm32_tx',
    name: 'ESP32 TX (Transmitter MCU)',
    shortName: 'ESP32 TX',
    type: 'ESP32-WROOM-32D',
    role: 'Telemetry Packetizer & Manchester Modulator',
    badge: 'TX',
    badgeColor: 'bg-blue-900/80 text-blue-300 border-blue-500',
    category: 'transmitter',
    physicalPhoto: '/hardware/esp32_3d.png',
    normalizedPosition: { x: 0.22, y: 0.60 },
    box: { width: 0.12, height: 0.16 },
    specs: [
      { label: 'Core Architecture', value: 'Xtensa Dual-Core LX6 @ 240 MHz', status: 'MEASURED' },
      { label: 'Carrier Pin', value: 'GPIO 23 (OOK + Manchester Drive)', status: 'MEASURED' },
      { label: 'Operating Voltage', value: '3.30 V DC Regulated', status: 'MEASURED' },
      { label: 'Modulation Scheme', value: 'Manchester OOK (1000 bps / 1000 µs)', status: 'MEASURED' },
      { label: 'Integrity Check', value: 'Dallas/Maxim CRC-8 (0x31)', status: 'MEASURED' }
    ],
    connections: 'ESP32 TX (GPIO 23) → 1 kΩ Base Resistor → S8050 / 2N2222 Transistor Base',
    functionDescription: 'Executes packet framing, sequence numbering, Dallas CRC-8 computation, Manchester line encoding, and drives GPIO 23 with microsecond hardware timer interrupts.',
    whyUsed: 'Provides 240 MHz dual-core processing, hardware microsecond timers, and clean GPIO switching at low cost.',
    vivaNote: 'GPIO 23 is driven in push-pull mode at 1000 bps (500 µs chip period for Manchester transitions).',
    flowStep: 2,
    schematicNodeId: 'U1_ESP32_TX'
  },
  {
    id: 'transistor_2n2222',
    name: 'S8050 / 2N2222 NPN Transistor (LED Driver)',
    shortName: 'S8050 / 2N2222 Driver',
    type: 'TO-92 NPN Bipolar Junction Transistor (Paper: S8050; Alt: 2N2222)',
    role: 'High-Speed LED Current Sinking Switch (S8050 Paper / 2N2222 Lab)',
    badge: 'DRIVER',
    badgeColor: 'bg-purple-900/80 text-purple-300 border-purple-500',
    category: 'driver',
    physicalPhoto: '/hardware/transistor_2n2222.jpg',
    normalizedPosition: { x: 0.31, y: 0.62 },
    box: { width: 0.05, height: 0.08 },
    specs: [
      { label: 'Paper Primary Model', value: 'S8050 NPN BJT (Ic = 120 mA, hFE ≈ 200, fT = 150 MHz)', status: 'MEASURED' },
      { label: 'Benchtop Alternate Model', value: '2N2222 NPN BJT (Ic = 800 mA, hFE ≈ 100-300, fT = 300 MHz)', status: 'MEASURED' },
      { label: 'V_CE(sat)', value: '0.20 V in Deep Saturation', status: 'MEASURED' },
      { label: 'V_BE(on)', value: '0.72 V Base-Emitter', status: 'MEASURED' },
      { label: 'Base Resistor (R_B)', value: '1 kΩ Base Resistor to ESP32 GPIO 23', status: 'MEASURED' },
      { label: 'Collector Current', value: '14.5 mA Switched Current', status: 'MEASURED' }
    ],
    connections: 'Base ← ESP32 GPIO 23 (via 1 kΩ); Collector ← LED Cathode; Emitter → GND',
    functionDescription: 'Amplifies low-current ESP32 GPIO signal into sufficient sinking current to drive the 5mm transmitter LED at full radiance. Research paper specifies S8050; lab benchtop hardware supports 2N2222 as verified alternate.',
    whyUsed: 'Protects the ESP32 GPIO from sinking excessive current (exceeding pin limits) while maintaining crisp nanosecond switching edges.',
    vivaNote: 'Paper specifies S8050; lab prototype uses 2N2222 as verified alternate. Operates strictly in Cut-off (logic 0) and Saturation (logic 1) regions as a digital optical switch.',
    flowStep: 2,
    schematicNodeId: 'Q1_S8050_2N2222'
  },
  {
    id: 'resistor_220',
    name: '220 Ω Current-Limiting Resistor',
    shortName: 'Resistor (220 Ω)',
    type: 'Carbon Film 1/4W 5% Resistor',
    role: 'Transmitter LED Current Limiter',
    badge: 'PASSIVE',
    badgeColor: 'bg-amber-900/80 text-amber-300 border-amber-500',
    category: 'passive',
    physicalPhoto: '/hardware/resistor_macro.jpg',
    normalizedPosition: { x: 0.33, y: 0.52 },
    box: { width: 0.05, height: 0.06 },
    specs: [
      { label: 'Nominal Resistance', value: '220 Ω ±5%', status: 'MEASURED' },
      { label: 'Power Rating', value: '0.25 W (1/4 Watt)', status: 'MEASURED' },
      { label: 'Measured Voltage Drop', value: '1.28 V across resistor', status: 'MEASURED' },
      { label: 'Power Dissipation', value: '7.4 mW Safe Operation', status: 'ESTIMATED' }
    ],
    connections: '+3.3V Rail → 220 Ω Resistor → LED Anode',
    functionDescription: 'Sets forward current to approximately 14-15 mA: I = (3.3V - V_f - V_ce) / 220Ω = (3.3 - 1.85 - 0.2) / 220 ≈ 14.5 mA.',
    whyUsed: 'Guarantees the red LED operates within its optimum radiant intensity zone without thermal breakdown.',
    vivaNote: 'Calculated using Ohm\'s Law taking both LED diode forward drop and transistor saturation voltage into account.',
    flowStep: 3,
    schematicNodeId: 'R1_220R'
  },
  {
    id: 'led_tx',
    name: 'LED (Transmitter)',
    shortName: 'LED (TX)',
    type: '5 mm High-Radiance Red LED',
    role: 'Optical Emitter (Light Transmitter)',
    badge: 'TX',
    badgeColor: 'bg-rose-900/80 text-rose-300 border-rose-500',
    category: 'transmitter',
    physicalPhoto: '/hardware/led_macro.jpg',
    normalizedPosition: { x: 0.34, y: 0.44 },
    box: { width: 0.06, height: 0.10 },
    specs: [
      { label: 'Peak Emission Wavelength', value: '650 nm (Visible Red)', status: 'MEASURED' },
      { label: 'Forward Voltage (V_f)', value: '1.85 V at 15 mA', status: 'MEASURED' },
      { label: 'Forward Current (I_f)', value: '14.5 mA Active', status: 'MEASURED' },
      { label: 'Viewing Angle (2θ_1/2)', value: '30° Semi-collimated', status: 'ESTIMATED' },
      { label: 'Modulation Bandwidth', value: '> 100 kHz OOK', status: 'MEASURED' }
    ],
    connections: 'Anode ← 220 Ω Resistor; Cathode → 2N2222 Collector',
    functionDescription: 'Converts modulated electrical square wave into proportional optical radiant flux traveling across the free-space air gap.',
    whyUsed: 'Provides instant optical rise-time (<50ns) and clear visual verification for demonstration and safety.',
    vivaNote: 'Lambertian radiation pattern models light dispersion across the transmission distance.',
    flowStep: 3,
    schematicNodeId: 'D1_LED_RED'
  },
  {
    id: 'optical_channel',
    name: 'Optical Light Channel (Air Gap)',
    shortName: 'Optical Link',
    type: 'Free-Space Line-of-Sight Optical Path',
    role: 'Wireless Optical Transmission Medium',
    badge: 'CHANNEL',
    badgeColor: 'bg-cyan-900/80 text-cyan-300 border-cyan-500',
    category: 'optical',
    physicalPhoto: '/hardware/full_hardware_setup.jpg',
    normalizedPosition: { x: 0.385, y: 0.46 },
    box: { width: 0.08, height: 0.06 },
    specs: [
      { label: 'Channel Medium', value: 'Free-Space Atmospheric Air', status: 'MEASURED' },
      { label: 'Working Distance', value: '15.0 cm to 35.0 cm LOS', status: 'MEASURED' },
      { label: 'Path Loss Attenuation', value: '∝ 1 / d² (Inverse-Square)', status: 'SIMULATED' },
      { label: 'Ambient Noise Rejection', value: 'Optical Bandpass + AC Filter', status: 'MEASURED' },
      { label: 'Propagation Delay', value: '≈ 0.5 ns (Speed of Light)', status: 'SIMULATED' }
    ],
    connections: 'LED Optical Aperture ── Free-Space Beam ──→ Photodiode Active Surface',
    functionDescription: 'Transfers modulated optical flux across the physical air gap without generating radio-frequency emissions or electromagnetic interference.',
    whyUsed: 'Core medium of Visible Light Communication (LiFi); immune to RF jamming and secure within physical room confines.',
    vivaNote: 'Inverse square law governs irradiance: E = (I * cosθ) / d².',
    flowStep: 4,
    schematicNodeId: 'CHANNEL_LOS'
  },
  {
    id: 'photodiode_rx',
    name: 'Photodiode (Receiver)',
    shortName: 'Photodiode (RX)',
    type: 'BPW34 Silicon PIN Photodiode',
    role: 'Optical-to-Electrical Transducer',
    badge: 'RX',
    badgeColor: 'bg-emerald-900/80 text-emerald-300 border-emerald-500',
    category: 'receiver',
    physicalPhoto: '/hardware/photodiode_macro.jpg',
    normalizedPosition: { x: 0.43, y: 0.47 },
    box: { width: 0.06, height: 0.09 },
    specs: [
      { label: 'Active Radiant Area', value: '7.5 mm² Sensitive Die', status: 'MEASURED' },
      { label: 'Spectral Sensitivity Range', value: '430 nm – 1100 nm', status: 'MEASURED' },
      { label: 'Peak Sensitivity', value: '0.62 A/W @ 650 nm', status: 'MEASURED' },
      { label: 'Generated Photocurrent', value: '42.8 µA under LED peak', status: 'MEASURED' },
      { label: 'Dark Current (I_R)', value: '2.0 nA (Clean Base)', status: 'MEASURED' }
    ],
    connections: 'Cathode → +3.3V (Reverse Bias); Anode → LM358 Inverting Input',
    functionDescription: 'Absorbs incident photons and generates proportional reverse photocurrent via photovoltaic/photoconductive carrier generation.',
    whyUsed: 'Fast 20 ns rise time and large 7.5mm² active collection surface ensures strong optical SNR over breadboard distances.',
    vivaNote: 'Reverse biasing reduces junction capacitance, drastically increasing detection bandwidth.',
    flowStep: 5,
    schematicNodeId: 'D2_BPW34'
  },
  {
    id: 'signal_conditioning',
    name: 'Signal Conditioning (LM358)',
    shortName: 'Signal Conditioning',
    type: 'LM358 Dual Operational Amplifier',
    role: 'Transimpedance Amp & Voltage Comparator',
    badge: 'ANALOG',
    badgeColor: 'bg-teal-900/80 text-teal-300 border-teal-500',
    category: 'conditioning',
    physicalPhoto: '/hardware/lm358_amplifier.jpg',
    normalizedPosition: { x: 0.54, y: 0.50 },
    box: { width: 0.07, height: 0.10 },
    specs: [
      { label: 'Op-Amp Topology', value: 'Dual Op-Amp (TIA + Comparator)', status: 'MEASURED' },
      { label: 'Stage 1: TIA Gain', value: '47 kΩ Transimpedance Gain', status: 'MEASURED' },
      { label: 'Stage 2: Slicing Level', value: '1.65 V Potentiometer Threshold', status: 'MEASURED' },
      { label: 'Output Swing', value: '0.04 V (Low) to 3.26 V (High)', status: 'MEASURED' },
      { label: 'Slew Rate', value: '0.5 V/µs Clean Transitions', status: 'MEASURED' }
    ],
    connections: 'Input ← Photodiode Anode; Output → ESP32 RX (GPIO 34 / ADC1_CH6)',
    functionDescription: 'Converts microampere photocurrent into voltage (Stage 1 TIA), then slices against reference threshold to yield a measurable analog logic swing for the ESP32 ADC.',
    whyUsed: 'Raw photocurrent is too weak for direct microcontroller reading; signal conditioning reconstructs measurable voltage levels for ADC sampling.',
    vivaNote: 'Single-supply operation down to ground rail enables clean conversion of low-level photocurrent.',
    flowStep: 6,
    schematicNodeId: 'U2_LM358'
  },
  {
    id: 'stm32_rx',
    name: 'ESP32 RX (Receiver MCU)',
    shortName: 'ESP32 RX',
    type: 'ESP32-WROOM-32D',
    role: 'ADC Mid-bit Sampler & Burst Detector',
    badge: 'RX',
    badgeColor: 'bg-blue-900/80 text-blue-300 border-blue-500',
    category: 'receiver',
    physicalPhoto: '/hardware/esp32_3d.png',
    normalizedPosition: { x: 0.63, y: 0.60 },
    box: { width: 0.12, height: 0.16 },
    specs: [
      { label: 'Core Architecture', value: 'Xtensa Dual-Core LX6 @ 240 MHz', status: 'MEASURED' },
      { label: 'Input ADC Pin', value: 'GPIO 34 (ADC1_CH6, Input-Only)', status: 'MEASURED' },
      { label: 'Operating Threshold', value: '50 ADC Counts (Dark 0-5, Illum 95-176)', status: 'MEASURED' },
      { label: 'Sampling Window', value: 'Mid-bit 450–550 µs Window', status: 'MEASURED' },
      { label: 'Packet Integrity', value: 'Dallas CRC-8 + Manchester Check', status: 'MEASURED' }
    ],
    connections: 'ESP32 RX (GPIO 34) ← LM358 Stage 1/2 TIA Output; USB ← PC Host',
    functionDescription: 'Samples conditioned optical analog voltage on GPIO 34 within a 450-550 µs mid-bit window, slices logic at ~50 counts, decodes Manchester symbols, validates Dallas CRC-8, and detects physical burst losses.',
    whyUsed: 'Integrated 12-bit SAR ADC, microsecond hardware timers, and sufficient memory to buffer telemetry frames and feed the BASR model.',
    vivaNote: 'Mid-bit sampling eliminates edge-jitter false triggers caused by transition rise/fall transients.',
    flowStep: 7,
    schematicNodeId: 'U3_ESP32_RX'
  }
];

export const DIGITAL_TWIN_CONNECTIONS: DigitalTwinConnection[] = [
  {
    id: 'conn_stm_driver',
    fromId: 'stm32_tx',
    toId: 'transistor_2n2222',
    type: 'ELECTRICAL',
    signalName: 'Manchester OOK Signal (GPIO 23, 1000 bps)',
    description: 'Electrical logic trace from ESP32 GPIO 23 through 1kΩ base resistor to 2N2222 transistor base.',
    verified: true
  },
  {
    id: 'conn_driver_led',
    fromId: 'transistor_2n2222',
    toId: 'led_tx',
    type: 'ELECTRICAL',
    signalName: 'Switched LED Sinking Current (14.5 mA)',
    description: 'Collector-emitter saturated path sinking current through 220Ω limiter into the red LED cathode.',
    verified: true
  },
  {
    id: 'conn_resistor_led',
    fromId: 'resistor_220',
    toId: 'led_tx',
    type: 'ELECTRICAL',
    signalName: '+3.3V Regulated Anode Supply',
    description: 'Current limiting supply from 3.3V breadboard rail through 220Ω resistor to LED anode.',
    verified: true
  },
  {
    id: 'conn_optical_beam',
    fromId: 'led_tx',
    toId: 'photodiode_rx',
    type: 'OPTICAL',
    signalName: 'Modulated Optical Flux (650 nm Photons)',
    description: 'Free-space line-of-sight optical carrier traveling across 15-35 cm air gap to BPW34 photodiode.',
    verified: true
  },
  {
    id: 'conn_pd_amp',
    fromId: 'photodiode_rx',
    toId: 'signal_conditioning',
    type: 'ELECTRICAL',
    signalName: 'Photocurrent I_ph (42.8 µA AC Signal)',
    description: 'High-speed photocurrent into LM358 inverting transimpedance amplifier terminal.',
    verified: true
  },
  {
    id: 'conn_amp_rx',
    fromId: 'signal_conditioning',
    toId: 'stm32_rx',
    type: 'ELECTRICAL',
    signalName: 'Conditioned Analog Voltage (GPIO 34 ADC)',
    description: 'Conditioned analog optical signal from LM358 output routed to ESP32 GPIO 34 ADC input.',
    verified: true
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    name: 'DATA',
    title: 'Payload Encoding',
    desc: 'Digital telemetry string framed with sequence ID, length, and Dallas CRC-8.',
    icon: 'FileText',
    color: '#38bdf8'
  },
  {
    step: '02',
    name: 'ESP32 TX',
    title: 'Manchester Line Coding',
    desc: 'Encodes bits into Manchester transitions (1000 µs symbol period) driving GPIO 23.',
    icon: 'Cpu',
    color: '#3b82f6'
  },
  {
    step: '03',
    name: 'LED',
    title: 'Optical Conversion',
    desc: 'Converts modulated electrical current pulses into visible optical photons.',
    icon: 'Zap',
    color: '#ef4444'
  },
  {
    step: '04',
    name: 'OPTICAL LINK',
    title: 'Free-Space Air Gap',
    desc: 'Photons propagate across line-of-sight path subject to SG90 servo occlusion.',
    icon: 'Radio',
    color: '#f43f5e'
  },
  {
    step: '05',
    name: 'PHOTODIODE',
    title: 'Photon Detection',
    desc: 'BPW34 silicon PIN photodiode converts incident photons into microamp photocurrent.',
    icon: 'Eye',
    color: '#10b981'
  },
  {
    step: '06',
    name: 'SIGNAL CONDITIONING',
    title: 'LM358 TIA Amplification',
    desc: 'Converts microamp photocurrent into 0-3.3V analog swing for the ESP32 ADC.',
    icon: 'Activity',
    color: '#06b6d4'
  },
  {
    step: '07',
    name: 'ESP32 RX',
    title: 'Mid-bit Slicing & BASR',
    desc: 'Samples mid-bit on GPIO 34, checks CRC-8, detects bursts, and triggers BASR + CGFP.',
    icon: 'CheckCircle2',
    color: '#8b5cf6'
  }
];

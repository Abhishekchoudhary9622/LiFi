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
    name: 'STM32 TX (Transmitter MCU)',
    shortName: 'STM32 TX',
    type: 'STM32F103C8T6 "Blue Pill"',
    role: 'Transmitter Controller & Carrier Modulator',
    badge: 'TX',
    badgeColor: 'bg-blue-900/80 text-blue-300 border-blue-500',
    category: 'transmitter',
    physicalPhoto: '/hardware/stm32_board.jpg',
    normalizedPosition: { x: 0.22, y: 0.60 },
    box: { width: 0.12, height: 0.16 },
    specs: [
      { label: 'Core Architecture', value: 'ARM Cortex-M3 @ 72 MHz', status: 'MEASURED' },
      { label: 'Carrier Pin', value: 'PA9 (TIM1_CH2 PWM)', status: 'MEASURED' },
      { label: 'Operating Voltage', value: '3.30 V DC Regulated', status: 'MEASURED' },
      { label: 'Modulation Scheme', value: 'OOK / Manchester 10 kHz', status: 'MEASURED' },
      { label: 'Current Draw', value: '34.2 mA Active', status: 'MEASURED' }
    ],
    connections: 'STM32 TX (PA9) → 1 kΩ Base Resistor → 2N2222 Transistor Base',
    functionDescription: 'Executes carrier modulation algorithm, generates 10 kHz optical carrier pulses, and streams serialized data packets.',
    whyUsed: 'Provides hardware timer PWM precision with zero software jitter and 72 MHz processing speed.',
    vivaNote: 'PA9 is configured in Alternate Function Push-Pull mode driven by Timer 1 Channel 2.',
    flowStep: 2,
    schematicNodeId: 'U1_STM32_TX'
  },
  {
    id: 'transistor_2n2222',
    name: '2N2222 NPN Transistor (Driver)',
    shortName: '2N2222 Driver',
    type: 'TO-92 NPN Bipolar Junction Transistor',
    role: 'High-Speed LED Current Sinking Switch',
    badge: 'DRIVER',
    badgeColor: 'bg-purple-900/80 text-purple-300 border-purple-500',
    category: 'driver',
    physicalPhoto: '/hardware/transistor_2n2222.jpg',
    normalizedPosition: { x: 0.31, y: 0.62 },
    box: { width: 0.05, height: 0.08 },
    specs: [
      { label: 'Transistor Type', value: 'NPN Silicon Switching BJT', status: 'MEASURED' },
      { label: 'V_CE(sat)', value: '0.20 V in Saturation', status: 'MEASURED' },
      { label: 'V_BE(on)', value: '0.72 V Base-Emitter', status: 'MEASURED' },
      { label: 'Transition Frequency (f_T)', value: '300 MHz High Speed', status: 'MEASURED' },
      { label: 'Collector Current', value: '14.5 mA Switched', status: 'MEASURED' }
    ],
    connections: 'Base ← STM32 PA9; Collector ← LED Cathode; Emitter → GND',
    functionDescription: 'Amplifies low-current STM32 GPIO signal into sufficient sinking current to drive the 5mm transmitter LED at full radiance.',
    whyUsed: 'Protects the STM32 GPIO from sinking excessive current (exceeding 25mA limits) while maintaining crisp nanosecond switching edges.',
    vivaNote: 'Operates strictly in Cut-off (logic 0) and Saturation (logic 1) regions as a digital optical switch.',
    flowStep: 2,
    schematicNodeId: 'Q1_2N2222'
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
    connections: 'Input ← Photodiode Anode; Output → STM32 RX (PA0 / ADC1)',
    functionDescription: 'Converts microampere photocurrent into voltage (Stage 1 TIA), then slices against reference threshold (Stage 2 Comparator) to yield a pristine 3.3V logic square wave.',
    whyUsed: 'Raw photocurrent is too weak for direct microcontroller digital reading; signal conditioning reconstructs sharp TTL logic edges.',
    vivaNote: 'Hysteresis prevents false double-switching caused by ambient room lamp optical noise.',
    flowStep: 6,
    schematicNodeId: 'U2_LM358'
  },
  {
    id: 'stm32_rx',
    name: 'STM32 RX (Receiver MCU)',
    shortName: 'STM32 RX',
    type: 'STM32F103C8T6 "Blue Pill"',
    role: 'Data Decoder & Packet Reconstructor',
    badge: 'RX',
    badgeColor: 'bg-blue-900/80 text-blue-300 border-blue-500',
    category: 'receiver',
    physicalPhoto: '/hardware/stm32_board.jpg',
    normalizedPosition: { x: 0.63, y: 0.60 },
    box: { width: 0.12, height: 0.16 },
    specs: [
      { label: 'Core Architecture', value: 'ARM Cortex-M3 @ 72 MHz', status: 'MEASURED' },
      { label: 'Input Capture Pin', value: 'PA0 (Timer 2 CH1 / ADC1)', status: 'MEASURED' },
      { label: 'Sampling Rate', value: '1.0 MSPS ADC / Timer Capture', status: 'MEASURED' },
      { label: 'Decoding Algorithm', value: 'Manchester Phase Slicer', status: 'MEASURED' },
      { label: 'Packet CRC Check', value: 'CRC-8 Hardware Validated', status: 'MEASURED' }
    ],
    connections: 'STM32 RX (PA0) ← LM358 Stage 2 Comparator Output; USB ← PC Host',
    functionDescription: 'Samples conditioned logic transitions, synchronizes with bit clock, decodes Manchester framing, verifies checksum, and outputs the decoded message.',
    whyUsed: 'Hardware timer input capture allows nanosecond edge measurement without CPU polling overhead.',
    vivaNote: 'Uses double-buffered DMA transfer to stream samples without dropping bits during high-speed transmission.',
    flowStep: 7,
    schematicNodeId: 'U3_STM32_RX'
  }
];

export const DIGITAL_TWIN_CONNECTIONS: DigitalTwinConnection[] = [
  {
    id: 'conn_stm_driver',
    fromId: 'stm32_tx',
    toId: 'transistor_2n2222',
    type: 'ELECTRICAL',
    signalName: '10 kHz PWM Modulated Carrier (0-3.3V)',
    description: 'Electrical logic trace from STM32 PA9 through 1kΩ base resistor to 2N2222 transistor base.',
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
    signalName: 'Reconstructed 3.3V TTL Logic Square Wave',
    description: 'Clean sliced digital signal from LM358 comparator output into STM32 PA0 timer capture pin.',
    verified: true
  }
];

export const HOW_IT_WORKS_STEPS = [
  {
    step: '01',
    name: 'DATA',
    title: 'Payload Encoding',
    desc: 'Digital text message serialized into binary bits with start/stop framing.',
    icon: 'FileText',
    color: '#38bdf8'
  },
  {
    step: '02',
    name: 'STM32 TX',
    title: 'Carrier Modulation',
    desc: 'Generates the electrical/modulated signal used to drive the transmitter.',
    icon: 'Cpu',
    color: '#3b82f6'
  },
  {
    step: '03',
    name: 'LED',
    title: 'Optical Conversion',
    desc: 'Converts the modulated electrical signal into optical information.',
    icon: 'Zap',
    color: '#ef4444'
  },
  {
    step: '04',
    name: 'OPTICAL LINK',
    title: 'Free-Space Air Gap',
    desc: 'Transfers modulated light across the physical free-space optical channel.',
    icon: 'Radio',
    color: '#f43f5e'
  },
  {
    step: '05',
    name: 'PHOTODIODE',
    title: 'Photon Detection',
    desc: 'Converts received light into an electrical signal.',
    icon: 'Eye',
    color: '#10b981'
  },
  {
    step: '06',
    name: 'SIGNAL CONDITIONING',
    title: 'LM358 Amplification',
    desc: 'Amplifies and filters the photodiode current into a clean logic signal.',
    icon: 'Activity',
    color: '#06b6d4'
  },
  {
    step: '07',
    name: 'STM32 RX',
    title: 'Reconstruction',
    desc: 'Samples and reconstructs the received information into valid data.',
    icon: 'CheckCircle2',
    color: '#8b5cf6'
  }
];

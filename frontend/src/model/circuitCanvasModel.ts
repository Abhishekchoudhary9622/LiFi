/**
 * SemLiFi Modular Circuit Canvas & Electrical Simulation Model
 * Implements Part 1: Interactive Circuit Editor, Pin Topologies, Connectivity Validation & Physics Telemetry.
 */

export interface CanvasPin {
  id: string;
  name: string;
  label: string;
  relX: number; // Offset from component top-left in px
  relY: number; // Offset from component top-left in px
  type: 'IN' | 'OUT' | 'POWER' | 'GROUND' | 'OPTICAL' | 'BIDIR';
  net: string;
}

export interface CanvasComponent {
  id: string;
  typeId: string;
  name: string;
  shortName: string;
  category: 'Microcontrollers' | 'Transistors & Drivers' | 'Passive Components' | 'Optical Emitters' | 'Optical Channel' | 'Optical Detectors' | 'Analog Conditioning';
  x: number;
  y: number;
  width: number;
  height: number;
  accentColor: string;
  imageUrl: string;
  transistorModel?: 's8050' | '2n2222';
  pins: CanvasPin[];
  customProperties?: Record<string, string | number>;
}

export interface CanvasWire {
  id: string;
  fromCompId: string;
  fromPinId: string;
  toCompId: string;
  toPinId: string;
  color: string;
  label?: string;
  wireType?: 'ELECTRICAL' | 'OPTICAL' | 'POWER' | 'GROUND';
}

export interface CircuitValidationRule {
  id: string;
  name: string;
  description: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  detail: string;
}

export interface CircuitValidationReport {
  isValid: boolean;
  score: number; // 0 to 100
  passedCount: number;
  totalCount: number;
  rules: CircuitValidationRule[];
  detectedTopology: string;
}

/**
 * Checks if a component bounding box collides or overlaps with any existing components
 */
export function checkComponentOverlap(
  targetId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  components: CanvasComponent[],
  clearance: number = 8
): { hasOverlap: boolean; overlappingWith?: CanvasComponent } {
  for (const comp of components) {
    if (comp.id === targetId) continue;
    const isSeparated =
      x + width + clearance <= comp.x ||
      x >= comp.x + comp.width + clearance ||
      y + height + clearance <= comp.y ||
      y >= comp.y + comp.height + clearance;
    if (!isSeparated) {
      return { hasOverlap: true, overlappingWith: comp };
    }
  }
  return { hasOverlap: false };
}

/**
 * Resolves non-overlapping coordinates if a collision occurs
 */
export function resolveNonOverlappingPosition(
  targetId: string,
  x: number,
  y: number,
  width: number,
  height: number,
  components: CanvasComponent[]
): { x: number; y: number } {
  let candidateX = x;
  let candidateY = y;
  let collision = checkComponentOverlap(targetId, candidateX, candidateY, width, height, components);

  if (!collision.hasOverlap) return { x: candidateX, y: candidateY };

  // Offset downwards or rightwards in increments of 30px
  let attempts = 0;
  while (collision.hasOverlap && attempts < 15) {
    attempts++;
    candidateY += 40;
    if (candidateY > 600) {
      candidateY = 80;
      candidateX += 60;
    }
    collision = checkComponentOverlap(targetId, candidateX, candidateY, width, height, components);
  }

  return { x: candidateX, y: candidateY };
}

/**
 * Validates electrical and optical feasibility of connecting two terminal pins
 */
export function validateWireConnection(
  fromComp: CanvasComponent,
  fromPin: CanvasPin,
  toComp: CanvasComponent,
  toPin: CanvasPin
): { isValid: boolean; reason?: string; connectionType: 'ELECTRICAL' | 'OPTICAL' | 'POWER' | 'GROUND'; wireColor: string } {
  if (fromComp.id === toComp.id) {
    return {
      isValid: false,
      reason: 'Invalid Connection: Cannot wire a component terminal to itself or create internal component short-loops.',
      connectionType: 'ELECTRICAL',
      wireColor: '#64748b'
    };
  }

  // Optical beam isolation
  if (fromPin.type === 'OPTICAL' && toPin.type !== 'OPTICAL') {
    return {
      isValid: false,
      reason: `Incompatible Net: Optical radiant beam pin (${fromPin.name}) cannot connect to electrical conductor (${toPin.name}). Must route through Free-Space Channel or into Photodiode Aperture.`,
      connectionType: 'OPTICAL',
      wireColor: '#f43f5e'
    };
  }
  if (toPin.type === 'OPTICAL' && fromPin.type !== 'OPTICAL') {
    return {
      isValid: false,
      reason: `Incompatible Net: Electrical conductor (${fromPin.name}) cannot inject electrical current directly into an optical aperture (${toPin.name}).`,
      connectionType: 'OPTICAL',
      wireColor: '#f43f5e'
    };
  }

  // Dangerous Power-to-Ground short circuit
  if ((fromPin.type === 'POWER' && toPin.type === 'GROUND') || (fromPin.type === 'GROUND' && toPin.type === 'POWER')) {
    return {
      isValid: false,
      reason: 'Deadly Short Circuit: Direct connection between +3.3V Power Rail and GND will trigger over-current shutdown.',
      connectionType: 'POWER',
      wireColor: '#ef4444'
    };
  }

  // Dual output bus contention
  if (fromPin.type === 'OUT' && toPin.type === 'OUT') {
    return {
      isValid: false,
      reason: 'Bus Contention: Connecting two OUTPUT pins directly causes electrical contention and high current sinking.',
      connectionType: 'ELECTRICAL',
      wireColor: '#eab308'
    };
  }

  let connectionType: 'ELECTRICAL' | 'OPTICAL' | 'POWER' | 'GROUND' = 'ELECTRICAL';
  let wireColor = '#06b6d4';

  if (fromPin.type === 'OPTICAL' || toPin.type === 'OPTICAL') {
    connectionType = 'OPTICAL';
    wireColor = '#f43f5e';
  } else if (fromPin.type === 'POWER' || toPin.type === 'POWER') {
    connectionType = 'POWER';
    wireColor = '#ef4444';
  } else if (fromPin.type === 'GROUND' || toPin.type === 'GROUND') {
    connectionType = 'GROUND';
    wireColor = '#64748b';
  } else if (fromPin.net.includes('PWM') || toPin.net.includes('PWM') || fromPin.net.includes('TX')) {
    wireColor = '#3b82f6';
  } else if (fromPin.net.includes('BASE') || toPin.net.includes('BASE') || fromPin.net.includes('LED_CATHODE') || toPin.net.includes('LED_CATHODE')) {
    wireColor = '#f97316';
  } else if (fromPin.net.includes('TIA') || toPin.net.includes('TIA')) {
    wireColor = '#10b981';
  }

  return { isValid: true, connectionType, wireColor };
}

/**
 * Catalogue of draggable circuit components
 */
export const CATALOGUE_TEMPLATES: Omit<CanvasComponent, 'id' | 'x' | 'y'>[] = [
  // 1. ESP32 Transmitter
  {
    typeId: 'stm32_tx',
    name: 'ESP32 Transmitter MCU (ESP32-WROOM-32D)',
    shortName: 'ESP32 (TX)',
    category: 'Microcontrollers',
    width: 125,
    height: 170,
    accentColor: '#3b82f6',
    imageUrl: '/hardware/esp32_3d.png',
    pins: [
      { id: 'vcc', name: '3.3V', label: '+3.3V Power Out', relX: 125, relY: 40, type: 'POWER', net: 'NET_VCC_3V3' },
      { id: 'gpio23', name: 'GPIO 23', label: 'ESP32 TX (GPIO 23 OOK)', relX: 125, relY: 80, type: 'OUT', net: 'NET_TX_PWM' },
      { id: 'gnd', name: 'GND', label: 'GND Return', relX: 125, relY: 130, type: 'GROUND', net: 'GND' }
    ]
  },

  // 2. Base Resistor (1 kΩ)
  {
    typeId: 'resistor_1k',
    name: '1 kΩ Base Resistor (R_B)',
    shortName: '1 kΩ Resistor',
    category: 'Passive Components',
    width: 105,
    height: 135,
    accentColor: '#eab308',
    imageUrl: '/hardware/resistor_macro.jpg',
    pins: [
      { id: 'p1', name: 'Lead 1', label: 'From GPIO 23', relX: 0, relY: 45, type: 'IN', net: 'NET_TX_PWM' },
      { id: 'p2', name: 'Lead 2', label: 'To BJT Base', relX: 105, relY: 45, type: 'OUT', net: 'NET_BJT_BASE' }
    ]
  },

  // 3. LED Driver Transistor (S8050 Paper Primary / 2N2222 Benchtop Alternate)
  {
    typeId: 'transistor_driver',
    name: 'S8050 / 2N2222 NPN Transistor (LED Driver)',
    shortName: 'BJT Driver (S8050/2N2222)',
    category: 'Transistors & Drivers',
    width: 115,
    height: 155,
    accentColor: '#f97316',
    imageUrl: '/hardware/transistor_2n2222.jpg',
    transistorModel: 's8050',
    pins: [
      { id: 'base', name: 'Base (B)', label: 'Base (Pin 2 ← 1kΩ)', relX: 0, relY: 75, type: 'IN', net: 'NET_BJT_BASE' },
      { id: 'collector', name: 'Collector (C)', label: 'Collector (Pin 3 ← LED Cathode)', relX: 58, relY: 0, type: 'IN', net: 'NET_LED_CATHODE' },
      { id: 'emitter', name: 'Emitter (E)', label: 'Emitter (Pin 1 → GND)', relX: 58, relY: 155, type: 'GROUND', net: 'GND' }
    ]
  },

  // 4. Current-Limiting Resistor (220 Ω)
  {
    typeId: 'resistor_220',
    name: '220 Ω Current-Limiting Resistor (R_L)',
    shortName: '220 Ω Resistor',
    category: 'Passive Components',
    width: 105,
    height: 135,
    accentColor: '#eab308',
    imageUrl: '/hardware/resistor_macro.jpg',
    pins: [
      { id: 'p1', name: 'Lead 1', label: '+3.3V Rail', relX: 0, relY: 45, type: 'POWER', net: 'NET_VCC_3V3' },
      { id: 'p2', name: 'Lead 2', label: 'To LED Anode', relX: 105, relY: 45, type: 'OUT', net: 'NET_LED_ANODE' }
    ]
  },

  // 5. Red LED (650 nm Emitter)
  {
    typeId: 'led_tx',
    name: 'High-Radiance Red LED (650 nm Transceiver)',
    shortName: 'Red LED (650 nm)',
    category: 'Optical Emitters',
    width: 115,
    height: 155,
    accentColor: '#ef4444',
    imageUrl: '/hardware/led_macro.jpg',
    pins: [
      { id: 'anode', name: 'Anode (+)', label: 'Anode (+ Lead ← 220Ω)', relX: 0, relY: 45, type: 'IN', net: 'NET_LED_ANODE' },
      { id: 'cathode', name: 'Cathode (-)', label: 'Cathode (- Lead → BJT Collector)', relX: 0, relY: 105, type: 'OUT', net: 'NET_LED_CATHODE' },
      { id: 'beam_out', name: 'Optical Beam', label: '650 nm Radiant Photons', relX: 115, relY: 75, type: 'OPTICAL', net: 'NET_OPT_BEAM' }
    ]
  },

  // 6. Free-Space Optical Channel (Air Gap with SG90 Servo)
  {
    typeId: 'optical_channel',
    name: 'Free-Space Optical Channel (Air Gap & SG90 Servo)',
    shortName: 'Optical Air Gap',
    category: 'Optical Channel',
    width: 125,
    height: 155,
    accentColor: '#f59e0b',
    imageUrl: '/hardware/optical_setup_3d.jpg',
    pins: [
      { id: 'beam_in', name: 'Beam In', label: 'Optical Emitter Aperture', relX: 0, relY: 75, type: 'OPTICAL', net: 'NET_OPT_BEAM' },
      { id: 'beam_out', name: 'Beam Out', label: 'Attenuated Propagating Beam', relX: 125, relY: 75, type: 'OPTICAL', net: 'NET_OPT_ATTENUATED' }
    ]
  },

  // 7. BPW34 PIN Photodiode
  {
    typeId: 'bpw34_photodiode',
    name: 'BPW34 Silicon PIN Photodiode (Radiant Area 7.5 mm²)',
    shortName: 'BPW34 Photodiode',
    category: 'Optical Detectors',
    width: 105,
    height: 155,
    accentColor: '#10b981',
    imageUrl: '/hardware/bpw34_macro.jpg',
    pins: [
      { id: 'aperture', name: 'Aperture', label: 'Light-Collecting Window', relX: 0, relY: 75, type: 'OPTICAL', net: 'NET_OPT_ATTENUATED' },
      { id: 'cathode', name: 'Cathode (K)', label: 'Cathode (+ Bias Rail)', relX: 105, relY: 45, type: 'POWER', net: 'NET_VCC_3V3' },
      { id: 'anode', name: 'Anode (A)', label: 'Anode (Photocurrent Out)', relX: 105, relY: 105, type: 'OUT', net: 'NET_TIA_IN' }
    ]
  },

  // 8. LM358 Dual Op-Amp (TIA + Comparator Slicer)
  {
    typeId: 'lm358_amplifier',
    name: 'LM358 Dual Op-Amp (Stage 1 TIA + Stage 2 Slicer)',
    shortName: 'LM358 TIA / Slicer',
    category: 'Analog Conditioning',
    width: 115,
    height: 170,
    accentColor: '#06b6d4',
    imageUrl: '/hardware/lm358_amplifier.jpg',
    pins: [
      { id: 'vcc', name: 'VCC (Pin 8)', label: '+3.3V Supply', relX: 58, relY: 0, type: 'POWER', net: 'NET_VCC_3V3' },
      { id: 'in_neg', name: 'In- (Pin 2)', label: 'Inverting TIA Input', relX: 0, relY: 55, type: 'IN', net: 'NET_TIA_IN' },
      { id: 'in_pos', name: 'In+ (Pin 3)', label: 'Non-Inverting Ref (Vref)', relX: 0, relY: 105, type: 'IN', net: 'NET_VREF' },
      { id: 'amp_out', name: 'Out (Pin 1)', label: 'Conditioned Sliced TTL Output', relX: 115, relY: 80, type: 'OUT', net: 'NET_RX_CAPTURE' },
      { id: 'gnd', name: 'GND (Pin 4)', label: 'Ground Rail', relX: 58, relY: 170, type: 'GROUND', net: 'GND' }
    ]
  },

  // 9. ESP32 Receiver MCU
  {
    typeId: 'stm32_rx',
    name: 'ESP32 Receiver MCU (ESP32-WROOM-32D)',
    shortName: 'ESP32 (RX)',
    category: 'Microcontrollers',
    width: 125,
    height: 170,
    accentColor: '#8b5cf6',
    imageUrl: '/hardware/esp32_3d.png',
    pins: [
      { id: 'vcc', name: '3.3V', label: '+3.3V Supply', relX: 0, relY: 40, type: 'POWER', net: 'NET_VCC_3V3' },
      { id: 'gpio34', name: 'GPIO 34', label: 'ADC1_CH6 Mid-Bit Sampling', relX: 0, relY: 80, type: 'IN', net: 'NET_RX_CAPTURE' },
      { id: 'gnd', name: 'GND', label: 'Ground Rail', relX: 0, relY: 130, type: 'GROUND', net: 'GND' }
    ]
  }
];

/**
 * Strict horizontal & vertical grid positions for all 9 components.
 * Guarantees zero overlaps, perfect alignment, and full visibility.
 * Row 1 (Transmitter chain): y = 45 (Stages 01 -> 05)
 * Row 2 (Receiver chain):    y = 300 (Stages 06 -> 09)
 * Columns:
 *  Col 1: x = 25  (Stage 01 above Stage 06)
 *  Col 2: x = 175 (Stage 02 above Stage 07)
 *  Col 3: x = 305 (Stage 03 above Stage 08)
 *  Col 4: x = 445 (Stage 04)
 *  Col 5: x = 575 (Stage 05 above Stage 09)
 */
export const CANONICAL_GRID_POSITIONS: Record<string, { x: number; y: number }> = {
  comp_esp32_tx: { x: 25, y: 45 },
  comp_r_base: { x: 175, y: 45 },
  comp_driver_bjt: { x: 305, y: 45 },
  comp_r_led: { x: 445, y: 45 },
  comp_led_tx: { x: 575, y: 45 },
  comp_optical_channel: { x: 25, y: 300 },
  comp_bpw34: { x: 175, y: 300 },
  comp_lm358: { x: 305, y: 300 },
  comp_esp32_rx: { x: 575, y: 300 }
};

/**
 * Single-line continuous horizontal pipeline (Stages 01 to 09 in a single straight row)
 */
export const CANONICAL_GRID_SINGLE_LINE: Record<string, { x: number; y: number }> = {
  comp_esp32_tx: { x: 25, y: 60 },
  comp_r_base: { x: 175, y: 60 },
  comp_driver_bjt: { x: 305, y: 60 },
  comp_r_led: { x: 445, y: 60 },
  comp_led_tx: { x: 575, y: 60 },
  comp_optical_channel: { x: 715, y: 60 },
  comp_bpw34: { x: 865, y: 60 },
  comp_lm358: { x: 995, y: 60 },
  comp_esp32_rx: { x: 1135, y: 60 }
};

/**
 * Creates the verified canonical default hardware topology for SemLiFi:
 * ESP32 TX GPIO 23 -> 1kΩ R_B -> S8050 Driver -> Red LED (via 220Ω R_L) -> Optical Channel -> BPW34 -> LM358 -> ESP32 RX GPIO 34.
 */
export function createDefaultCircuit(): { components: CanvasComponent[]; wires: CanvasWire[] } {
  const components: CanvasComponent[] = [
    // STAGE 01: ESP32 TX (Row 1, Col 1)
    {
      ...CATALOGUE_TEMPLATES[0],
      id: 'comp_esp32_tx',
      x: CANONICAL_GRID_POSITIONS.comp_esp32_tx.x,
      y: CANONICAL_GRID_POSITIONS.comp_esp32_tx.y
    },
    // STAGE 02: 1kΩ Base Resistor (Row 1, Col 2)
    {
      ...CATALOGUE_TEMPLATES[1],
      id: 'comp_r_base',
      x: CANONICAL_GRID_POSITIONS.comp_r_base.x,
      y: CANONICAL_GRID_POSITIONS.comp_r_base.y
    },
    // STAGE 03: S8050 NPN Driver Transistor (Row 1, Col 3)
    {
      ...CATALOGUE_TEMPLATES[2],
      id: 'comp_driver_bjt',
      x: CANONICAL_GRID_POSITIONS.comp_driver_bjt.x,
      y: CANONICAL_GRID_POSITIONS.comp_driver_bjt.y,
      transistorModel: 's8050'
    },
    // STAGE 04: 220Ω Limiting Resistor (Row 1, Col 4)
    {
      ...CATALOGUE_TEMPLATES[3],
      id: 'comp_r_led',
      x: CANONICAL_GRID_POSITIONS.comp_r_led.x,
      y: CANONICAL_GRID_POSITIONS.comp_r_led.y
    },
    // STAGE 05: Red LED 650nm Optical Emitter (Row 1, Col 5)
    {
      ...CATALOGUE_TEMPLATES[4],
      id: 'comp_led_tx',
      x: CANONICAL_GRID_POSITIONS.comp_led_tx.x,
      y: CANONICAL_GRID_POSITIONS.comp_led_tx.y
    },
    // STAGE 06: Free-Space Optical Channel & SG90 Servo (Row 2, Col 1)
    {
      ...CATALOGUE_TEMPLATES[5],
      id: 'comp_optical_channel',
      x: CANONICAL_GRID_POSITIONS.comp_optical_channel.x,
      y: CANONICAL_GRID_POSITIONS.comp_optical_channel.y
    },
    // STAGE 07: BPW34 Silicon PIN Photodiode (Row 2, Col 2)
    {
      ...CATALOGUE_TEMPLATES[6],
      id: 'comp_bpw34',
      x: CANONICAL_GRID_POSITIONS.comp_bpw34.x,
      y: CANONICAL_GRID_POSITIONS.comp_bpw34.y
    },
    // STAGE 08: LM358 TIA & Comparator Slicer (Row 2, Col 3)
    {
      ...CATALOGUE_TEMPLATES[7],
      id: 'comp_lm358',
      x: CANONICAL_GRID_POSITIONS.comp_lm358.x,
      y: CANONICAL_GRID_POSITIONS.comp_lm358.y
    },
    // STAGE 09: ESP32 RX Microcontroller (Row 2, Col 5)
    {
      ...CATALOGUE_TEMPLATES[8],
      id: 'comp_esp32_rx',
      x: CANONICAL_GRID_POSITIONS.comp_esp32_rx.x,
      y: CANONICAL_GRID_POSITIONS.comp_esp32_rx.y
    }
  ];

  const wires: CanvasWire[] = [
    {
      id: 'wire_tx_to_rbase',
      fromCompId: 'comp_esp32_tx',
      fromPinId: 'gpio23',
      toCompId: 'comp_r_base',
      toPinId: 'p1',
      color: '#3b82f6',
      label: 'GPIO 23 OOK Out',
      wireType: 'ELECTRICAL'
    },
    {
      id: 'wire_rbase_to_bjt',
      fromCompId: 'comp_r_base',
      fromPinId: 'p2',
      toCompId: 'comp_driver_bjt',
      toPinId: 'base',
      color: '#f97316',
      label: 'Base Current Drive',
      wireType: 'ELECTRICAL'
    },
    {
      id: 'wire_bjt_emitter_gnd',
      fromCompId: 'comp_driver_bjt',
      fromPinId: 'emitter',
      toCompId: 'comp_esp32_tx',
      toPinId: 'gnd',
      color: '#64748b',
      label: 'Emitter Ground Return',
      wireType: 'GROUND'
    },
    {
      id: 'wire_vcc_to_rled',
      fromCompId: 'comp_esp32_tx',
      fromPinId: 'vcc',
      toCompId: 'comp_r_led',
      toPinId: 'p1',
      color: '#ef4444',
      label: '+3.3V Power Rail',
      wireType: 'POWER'
    },
    {
      id: 'wire_rled_to_anode',
      fromCompId: 'comp_r_led',
      fromPinId: 'p2',
      toCompId: 'comp_led_tx',
      toPinId: 'anode',
      color: '#ef4444',
      label: 'LED Forward Anode',
      wireType: 'POWER'
    },
    {
      id: 'wire_cathode_to_bjt',
      fromCompId: 'comp_led_tx',
      fromPinId: 'cathode',
      toCompId: 'comp_driver_bjt',
      toPinId: 'collector',
      color: '#f97316',
      label: 'Collector Current Sinking',
      wireType: 'ELECTRICAL'
    },
    {
      id: 'wire_led_to_channel',
      fromCompId: 'comp_led_tx',
      fromPinId: 'beam_out',
      toCompId: 'comp_optical_channel',
      toPinId: 'beam_in',
      color: '#f43f5e',
      label: '650 nm Radiant Photons',
      wireType: 'OPTICAL'
    },
    {
      id: 'wire_channel_to_bpw34',
      fromCompId: 'comp_optical_channel',
      fromPinId: 'beam_out',
      toCompId: 'comp_bpw34',
      toPinId: 'aperture',
      color: '#f43f5e',
      label: 'Optical Free-Space Link',
      wireType: 'OPTICAL'
    },
    {
      id: 'wire_bpw34_to_tia',
      fromCompId: 'comp_bpw34',
      fromPinId: 'anode',
      toCompId: 'comp_lm358',
      toPinId: 'in_neg',
      color: '#10b981',
      label: 'Photocurrent I_ph',
      wireType: 'ELECTRICAL'
    },
    {
      id: 'wire_tia_to_rx',
      fromCompId: 'comp_lm358',
      fromPinId: 'amp_out',
      toCompId: 'comp_esp32_rx',
      toPinId: 'gpio34',
      color: '#06b6d4',
      label: 'Conditioned TTL Signal',
      wireType: 'ELECTRICAL'
    },
    {
      id: 'wire_lm358_gnd',
      fromCompId: 'comp_lm358',
      fromPinId: 'gnd',
      toCompId: 'comp_esp32_rx',
      toPinId: 'gnd',
      color: '#64748b',
      label: 'Common Ground',
      wireType: 'GROUND'
    }
  ];

  return { components, wires };
}

/**
 * Validates the electrical and optical connectivity of the canvas graph
 */
export function validateCircuitConnectivity(
  components: CanvasComponent[],
  wires: CanvasWire[]
): CircuitValidationReport {
  const rules: CircuitValidationRule[] = [];

  // Helper to check if two pins are connected by a wire
  const isConnected = (c1: string, p1: string, c2: string, p2: string): boolean => {
    return wires.some(
      (w) =>
        (w.fromCompId === c1 && w.fromPinId === p1 && w.toCompId === c2 && w.toPinId === p2) ||
        (w.fromCompId === c2 && w.fromPinId === p2 && w.toCompId === c1 && w.toPinId === p1)
    );
  };

  // Helper to check if pin has any connection
  const hasConnection = (c: string, p: string): boolean => {
    return wires.some(
      (w) => (w.fromCompId === c && w.fromPinId === p) || (w.toCompId === c && w.toPinId === p)
    );
  };

  const hasTxMcu = components.some((c) => c.typeId === 'stm32_tx');
  const hasDriver = components.some((c) => c.typeId === 'transistor_driver');
  const hasLed = components.some((c) => c.typeId === 'led_tx');
  const hasOptChannel = components.some((c) => c.typeId === 'optical_channel');
  const hasBpw34 = components.some((c) => c.typeId === 'bpw34_photodiode');
  const hasLm358 = components.some((c) => c.typeId === 'lm358_amplifier');
  const hasRxMcu = components.some((c) => c.typeId === 'stm32_rx');

  // Rule 1: TX MCU Modulation Output
  const txComp = components.find((c) => c.typeId === 'stm32_tx');
  if (!txComp) {
    rules.push({
      id: 'rule_tx_present',
      name: 'Transmitter MCU Present',
      description: 'ESP32 transmitter must be placed to generate 1000 bps Manchester OOK.',
      status: 'FAIL',
      detail: 'Missing ESP32 TX module on canvas.'
    });
  } else if (!hasConnection(txComp.id, 'gpio23')) {
    rules.push({
      id: 'rule_tx_connected',
      name: 'ESP32 TX Modulation Output Connected',
      description: 'GPIO 23 must be connected to drive the LED switching stage.',
      status: 'FAIL',
      detail: 'GPIO 23 pin is floating. Connect it to the base resistor or driver stage.'
    });
  } else {
    rules.push({
      id: 'rule_tx_connected',
      name: 'ESP32 TX Modulation Output Connected',
      description: 'GPIO 23 actively drives downstream transmitter circuitry.',
      status: 'PASS',
      detail: 'GPIO 23 pin is properly connected.'
    });
  }

  // Rule 2: Driver Transistor Base Drive
  const driverComp = components.find((c) => c.typeId === 'transistor_driver');
  if (!driverComp) {
    rules.push({
      id: 'rule_driver_present',
      name: 'LED Switching Transistor Present',
      description: 'A dedicated BJT driver (S8050 / 2N2222) is required to sink LED current without loading MCU GPIO.',
      status: 'WARN',
      detail: 'No driver transistor found. LED may experience direct GPIO current limitations.'
    });
  } else {
    const baseConnected = hasConnection(driverComp.id, 'base');
    const emitterConnected = hasConnection(driverComp.id, 'emitter');
    const collectorConnected = hasConnection(driverComp.id, 'collector');

    if (!baseConnected) {
      rules.push({
        id: 'rule_driver_base',
        name: 'Transistor Base Drive Path',
        description: 'BJT base terminal must be driven via a current-limiting resistor.',
        status: 'FAIL',
        detail: 'Transistor Base is unconnected. Transistor cannot switch into saturation.'
      });
    } else if (!emitterConnected) {
      rules.push({
        id: 'rule_driver_emitter',
        name: 'Transistor Emitter Ground Return',
        description: 'BJT emitter must return to common ground for common-emitter sinking operation.',
        status: 'FAIL',
        detail: 'Emitter terminal is open. Complete the return path to common circuit GND.'
      });
    } else {
      rules.push({
        id: 'rule_driver_base',
        name: 'Transistor Driver Sinking Network',
        description: `BJT (${driverComp.transistorModel === '2n2222' ? '2N2222' : 'S8050'}) is properly biased for saturation switching.`,
        status: 'PASS',
        detail: 'Base and Emitter loops verified.'
      });
    }
  }

  // Rule 3: Optical Link Continuity
  const ledComp = components.find((c) => c.typeId === 'led_tx');
  const optComp = components.find((c) => c.typeId === 'optical_channel');
  const rxComp = components.find((c) => c.typeId === 'bpw34_photodiode');

  if (ledComp && optComp && rxComp) {
    const ledToChannel = isConnected(ledComp.id, 'beam_out', optComp.id, 'beam_in');
    const channelToRx = isConnected(optComp.id, 'beam_out', rxComp.id, 'aperture');

    if (ledToChannel && channelToRx) {
      rules.push({
        id: 'rule_optical_path',
        name: 'Free-Space Optical Channel Continuity',
        description: 'Continuous line-of-sight optical link from Red LED through air gap to BPW34 photodiode.',
        status: 'PASS',
        detail: 'End-to-end electro-optical line-of-sight confirmed.'
      });
    } else {
      rules.push({
        id: 'rule_optical_path',
        name: 'Free-Space Optical Channel Continuity',
        description: 'Optical beam is interrupted or unaligned in free space.',
        status: 'FAIL',
        detail: 'Missing optical wire between LED, air gap channel, and photodiode aperture.'
      });
    }
  } else {
    rules.push({
      id: 'rule_optical_path',
      name: 'Free-Space Optical Channel Continuity',
      description: 'Requires LED, Optical Air Gap, and BPW34 photodiode.',
      status: 'WARN',
      detail: 'Optical transceiver components incomplete on canvas.'
    });
  }

  // Rule 4: Receiver Conditioning to ESP32 RX
  const ampComp = components.find((c) => c.typeId === 'lm358_amplifier');
  const rxMcuComp = components.find((c) => c.typeId === 'stm32_rx');

  if (ampComp && rxMcuComp) {
    const ampConnectedToRx = hasConnection(ampComp.id, 'amp_out') && hasConnection(rxMcuComp.id, 'gpio34');
    if (ampConnectedToRx) {
      rules.push({
        id: 'rule_rx_conditioning',
        name: 'Receiver Slicing & ADC Sampling Network',
        description: 'LM358 conditioned TTL waveform routed directly to ESP32 GPIO 34 (ADC1_CH6).',
        status: 'PASS',
        detail: 'Receiver analog front-end properly wired to sampling MCU.'
      });
    } else {
      rules.push({
        id: 'rule_rx_conditioning',
        name: 'Receiver Slicing & ADC Sampling Network',
        description: 'LM358 sliced output must connect to ESP32 RX GPIO 34.',
        status: 'FAIL',
        detail: 'Signal path broken between LM358 Pin 1 and ESP32 GPIO 34.'
      });
    }
  } else if (rxMcuComp) {
    rules.push({
      id: 'rule_rx_conditioning',
      name: 'Receiver Slicing & ADC Sampling Network',
      description: 'LM358 pre-amplifier stage recommended for microsecond slicing threshold (~50 ADC counts).',
      status: 'WARN',
      detail: 'LM358 pre-amplifier stage missing; direct photodiode sampling may lack slicing SNR.'
    });
  }

  // Calculate score and summary
  const passedCount = rules.filter((r) => r.status === 'PASS').length;
  const totalCount = rules.length;
  const score = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const isValid = rules.every((r) => r.status !== 'FAIL');

  let detectedTopology = 'Incomplete Circuit';
  if (hasTxMcu && hasDriver && hasLed && hasOptChannel && hasBpw34 && hasLm358 && hasRxMcu) {
    detectedTopology = 'Complete SemLiFi 7-Stage Transceiver Link';
  } else if (hasTxMcu && hasLed) {
    detectedTopology = 'Transmitter-Only Subsystem';
  } else if (hasBpw34 && hasRxMcu) {
    detectedTopology = 'Receiver-Only Subsystem';
  }

  return {
    isValid,
    score,
    passedCount,
    totalCount,
    rules,
    detectedTopology
  };
}

/**
 * Calculates physics-accurate educational multimeter telemetry for any probed pin or component
 */
export function calculateProbeTelemetry(
  component: CanvasComponent,
  pin: CanvasPin | null,
  workingDistanceCm: number,
  ambientLux: number,
  servoAngle: number,
  isSimulating: boolean
): {
  nodeName: string;
  voltage: string;
  current: string;
  signalType: string;
  frequency: string;
  formula: string;
  status: 'CALCULATED' | 'PAUSED' | 'UNSUPPORTED';
} {
  if (!isSimulating) {
    return {
      nodeName: pin ? `${component.shortName} &bull; ${pin.name}` : component.name,
      voltage: '0.00 V (De-energized)',
      current: '0.0 µA (Cut-off)',
      signalType: 'Static DC Ground',
      frequency: '0 Hz',
      formula: 'Circuit simulation is paused. Telemetry is 0V.',
      status: 'PAUSED'
    };
  }

  const servoTransmission = servoAngle === 0 ? 1.0 : servoAngle === 30 ? 0.60 : servoAngle === 60 ? 0.05 : 0.0;
  const distRatio = 15 / Math.max(1, workingDistanceCm);
  const radiantIntensityMcd = 180;
  const irradianceUwPerCm2 = ((radiantIntensityMcd / (workingDistanceCm * workingDistanceCm)) * 225) * servoTransmission;
  const photocurrentUa = Math.max(0.2, (irradianceUwPerCm2 * 0.0075 * 0.62 * 1000) * distRatio);

  switch (component.typeId) {
    case 'stm32_tx':
      return {
        nodeName: pin ? `ESP32 TX &bull; ${pin.name}` : 'ESP32 Transmitter MCU (GPIO 23)',
        voltage: '3.30 V TTL (Square Wave)',
        current: '2.58 mA Peak Base Drive',
        signalType: 'Manchester OOK Digital Carrier',
        frequency: '1000 bps (500 µs Chips)',
        formula: 'V_out = 3.3V, T_bit = 1000 µs, T_chip = 500 µs',
        status: 'CALCULATED'
      };

    case 'resistor_1k':
      return {
        nodeName: '1 kΩ Base Resistor (R_B)',
        voltage: '2.58 V Drop across leads',
        current: '2.58 mA Constant Base Drive',
        signalType: 'Linear Current Limiting',
        frequency: '1000 bps Switched',
        formula: 'I_B = (V_GPIO - V_BE) / R_B = (3.3 - 0.72) / 1000 = 2.58 mA',
        status: 'CALCULATED'
      };

    case 'transistor_driver':
      const isS8050 = component.transistorModel !== '2n2222';
      return {
        nodeName: isS8050 ? 'S8050 NPN Transistor (Paper Primary Driver)' : '2N2222 NPN Transistor (Benchtop Alternate)',
        voltage: 'V_CE(sat) = 0.20 V, V_BE(on) = 0.72 V',
        current: 'I_C = 14.5 mA (Switched Current)',
        signalType: 'Sinking Ground Switch (Saturation)',
        frequency: '1000 bps (Sub-25ns Switching)',
        formula: isS8050
          ? 'S8050 Spec: I_C(max)=120mA, h_FE≈200, V_CE(sat)<0.2V'
          : '2N2222 Alt: I_C(max)=800mA, h_FE=100-300, V_CE(sat)<0.2V',
        status: 'CALCULATED'
      };

    case 'resistor_220':
      return {
        nodeName: '220 Ω Current-Limiting Resistor (R_L)',
        voltage: '1.15 V Drop across leads',
        current: '14.5 mA Sinking Current',
        signalType: 'Linear DC Drop',
        frequency: '1000 bps Switched',
        formula: 'V_R = I_LED * R = 0.0145 * 220 = 1.15 V',
        status: 'CALCULATED'
      };

    case 'led_tx':
      return {
        nodeName: 'Red LED Emitter (650 nm AlGaAs)',
        voltage: 'Forward Drop V_f = 1.95 V',
        current: 'I_f = 14.5 mA Radiant Flow',
        signalType: '650 nm Modulated Radiant Photons',
        frequency: '1000 bps Optical Pulses',
        formula: 'I_f = (V_CC - V_f - V_CE) / R_L = (3.3 - 1.95 - 0.20) / 220 ≈ 14.5 mA',
        status: 'CALCULATED'
      };

    case 'optical_channel':
      return {
        nodeName: `Optical Air Gap (d = ${workingDistanceCm} cm, Flap = ${servoAngle}°)`,
        voltage: `${irradianceUwPerCm2.toFixed(1)} µW/cm² Optical Irradiance`,
        current: `${(irradianceUwPerCm2 * 0.075).toFixed(2)} µW Received Power`,
        signalType: 'Atmospheric Free-Space Propagation',
        frequency: servoAngle >= 60 ? '0 bps (Beam Severed)' : '1000 bps',
        formula: 'E(d) = (I_0 * cos^2(phi)) / d^2 * T(theta); T(0°)=1.0, T(30°)=0.6, T(60°)=0.05, T(90°)=0.0',
        status: 'CALCULATED'
      };

    case 'bpw34_photodiode':
      return {
        nodeName: 'BPW34 Silicon PIN Photodiode (7.5 mm²)',
        voltage: 'Reverse Bias V_R = 3.30 V',
        current: `I_ph = ${photocurrentUa.toFixed(1)} µA Photocurrent`,
        signalType: 'Optical-to-Electrical Current Conversion',
        frequency: servoAngle >= 60 ? '0 bps (Loss Floor)' : '1000 bps',
        formula: 'I_ph = R_lambda * E(d) * A_det = 0.62 A/W * E * 7.5 mm²',
        status: 'CALCULATED'
      };

    case 'lm358_amplifier':
      const tOut = Math.max(0.04, Math.min(3.26, 0.05 + photocurrentUa * 0.065));
      return {
        nodeName: 'LM358 Dual Op-Amp (TIA + Comparator)',
        voltage: `Pin 1 Out = ${tOut.toFixed(2)} V (TTL Logic)`,
        current: '8.2 mA Operating Current Draw',
        signalType: 'High-Gain Transimpedance Amplification & 1.0V Slicing',
        frequency: servoAngle >= 60 ? '0 bps (Floor)' : '1000 bps',
        formula: 'V_out = I_ph * R_f (Stage 1 TIA) -> Sliced at ~50 ADC Counts (Stage 2)',
        status: 'CALCULATED'
      };

    case 'stm32_rx':
      return {
        nodeName: 'ESP32 Receiver MCU (GPIO 34 ADC1_CH6)',
        voltage: servoAngle >= 60 ? '0.04 V (Floor)' : '3.26 V (Sampled Bit)',
        current: '120 µA ADC Samping Buffer',
        signalType: 'Hardware Timer Mid-Bit Sampling',
        frequency: servoAngle >= 60 ? '0 bps (Burst Loss)' : '1000 bps',
        formula: 'ADC_Count = (V_in / 3.3V) * 4095; Mid-bit sample window at 500 µs',
        status: 'CALCULATED'
      };

    default:
      return {
        nodeName: component.name,
        voltage: '3.30 V DC',
        current: '10.0 mA',
        signalType: 'General Circuit Node',
        frequency: 'DC',
        formula: 'V = I * R',
        status: 'CALCULATED'
      };
  }
}


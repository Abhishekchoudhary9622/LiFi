// SemLiFi Circuits - Starter Circuits Library
import { StarterCircuit, CircuitComponent, Wire } from '../types/circuit';
import { createDemoCircuit } from './demoCircuit';

export const STARTER_CIRCUITS: StarterCircuit[] = [
  // Starter 1: Basic LED
  {
    id: 'starter_1_basic_led',
    title: 'Starter 1: Basic LED',
    description: 'Simple 3.3V battery wired to an indicator LED.',
    difficulty: 'Beginner',
    components: [
      {
        id: 'BAT_1',
        typeId: 'power_3v3',
        name: '3.3V DC Source',
        category: 'power',
        x: 180,
        y: 180,
        rotation: 0,
        properties: { voltage: 3.3, currentLimit: 500 },
        pins: [
          { id: 'vcc', name: '3.3V', type: 'power', x: 20, y: 48 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 50, y: 48 }
        ]
      },
      {
        id: 'LED_1',
        typeId: 'led',
        name: 'Green LED',
        category: 'basic',
        x: 340,
        y: 180,
        rotation: 0,
        properties: { color: '#10b981', forwardVoltage: 2.1, currentRating: 20 },
        pins: [
          { id: 'anode', name: 'A (+)', type: 'passive', x: 10, y: 40 },
          { id: 'cathode', name: 'K (-)', type: 'ground', x: 26, y: 40 }
        ]
      }
    ],
    wires: [
      { id: 'w1', fromComponentId: 'BAT_1', fromPinId: 'vcc', toComponentId: 'LED_1', toPinId: 'anode', color: '#ef4444', active: true },
      { id: 'w2', fromComponentId: 'BAT_1', fromPinId: 'gnd', toComponentId: 'LED_1', toPinId: 'cathode', color: '#1e293b', active: true }
    ]
  },

  // Starter 2: LED + Resistor
  {
    id: 'starter_2_led_resistor',
    title: 'Starter 2: LED + Resistor',
    description: '3.3V supply with a 220 Ω current limiting resistor protecting the LED.',
    difficulty: 'Beginner',
    components: [
      {
        id: 'BAT_1',
        typeId: 'power_3v3',
        name: '3.3V DC Source',
        category: 'power',
        x: 180,
        y: 180,
        rotation: 0,
        properties: { voltage: 3.3, currentLimit: 500 },
        pins: [
          { id: 'vcc', name: '3.3V', type: 'power', x: 20, y: 48 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 50, y: 48 }
        ]
      },
      {
        id: 'R_1',
        typeId: 'resistor',
        name: 'R1 (220 Ω)',
        category: 'basic',
        x: 290,
        y: 190,
        rotation: 0,
        properties: { resistance: 220, tolerance: '5%', powerRating: '0.25 W' },
        pins: [
          { id: 'pin1', name: 'Pin 1', type: 'passive', x: 0, y: 14 },
          { id: 'pin2', name: 'Pin 2', type: 'passive', x: 72, y: 14 }
        ]
      },
      {
        id: 'LED_1',
        typeId: 'led',
        name: 'Green LED',
        category: 'basic',
        x: 420,
        y: 180,
        rotation: 0,
        properties: { color: '#10b981', forwardVoltage: 2.1, currentRating: 20 },
        pins: [
          { id: 'anode', name: 'A (+)', type: 'passive', x: 10, y: 40 },
          { id: 'cathode', name: 'K (-)', type: 'ground', x: 26, y: 40 }
        ]
      }
    ],
    wires: [
      { id: 'w1', fromComponentId: 'BAT_1', fromPinId: 'vcc', toComponentId: 'R_1', toPinId: 'pin1', color: '#ef4444', active: true },
      { id: 'w2', fromComponentId: 'R_1', fromPinId: 'pin2', toComponentId: 'LED_1', toPinId: 'anode', color: '#06b6d4', active: true },
      { id: 'w3', fromComponentId: 'BAT_1', fromPinId: 'gnd', toComponentId: 'LED_1', toPinId: 'cathode', color: '#1e293b', active: true }
    ]
  },

  // Starter 3: STM32 + LED
  {
    id: 'starter_3_stm32_led',
    title: 'Starter 3: STM32 + LED',
    description: 'STM32 MCU driving an indicator LED from GPIO PA0 with hardware PWM.',
    difficulty: 'Intermediate',
    components: [
      {
        id: 'PWR_1',
        typeId: 'power_3v3',
        name: '3.3V Supply',
        category: 'power',
        x: 80,
        y: 100,
        rotation: 0,
        properties: { voltage: 3.3 },
        pins: [
          { id: 'vcc', name: '3.3V', type: 'power', x: 20, y: 48 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 50, y: 48 }
        ]
      },
      {
        id: 'MCU_1',
        typeId: 'stm32',
        name: 'STM32F103C8',
        category: 'microcontrollers',
        x: 180,
        y: 180,
        rotation: 0,
        properties: { model: 'STM32F103C8T6', clock: '72 MHz' },
        pins: [
          { id: 'vcc_3v3', name: '3.3V', type: 'power', x: 12, y: 18 },
          { id: 'gnd_1', name: 'GND', type: 'ground', x: 12, y: 34 },
          { id: 'pa0', name: 'PA0 (PWM)', type: 'pwm', x: 12, y: 50 }
        ]
      },
      {
        id: 'R_1',
        typeId: 'resistor',
        name: 'R1 (220 Ω)',
        category: 'basic',
        x: 400,
        y: 220,
        rotation: 0,
        properties: { resistance: 220 },
        pins: [
          { id: 'pin1', name: 'Pin 1', type: 'passive', x: 0, y: 14 },
          { id: 'pin2', name: 'Pin 2', type: 'passive', x: 72, y: 14 }
        ]
      },
      {
        id: 'LED_1',
        typeId: 'led',
        name: 'LED',
        category: 'basic',
        x: 520,
        y: 200,
        rotation: 0,
        properties: { color: '#10b981' },
        pins: [
          { id: 'anode', name: 'A (+)', type: 'passive', x: 10, y: 40 },
          { id: 'cathode', name: 'K (-)', type: 'ground', x: 26, y: 40 }
        ]
      }
    ],
    wires: [
      { id: 'w1', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'MCU_1', toPinId: 'vcc_3v3', color: '#ef4444', active: true },
      { id: 'w2', fromComponentId: 'PWR_1', fromPinId: 'gnd', toComponentId: 'MCU_1', toPinId: 'gnd_1', color: '#1e293b', active: true },
      { id: 'w3', fromComponentId: 'MCU_1', fromPinId: 'pa0', toComponentId: 'R_1', toPinId: 'pin1', color: '#06b6d4', active: true },
      { id: 'w4', fromComponentId: 'R_1', fromPinId: 'pin2', toComponentId: 'LED_1', toPinId: 'anode', color: '#06b6d4', active: true },
      { id: 'w5', fromComponentId: 'PWR_1', fromPinId: 'gnd', toComponentId: 'LED_1', toPinId: 'cathode', color: '#1e293b', active: true }
    ]
  },

  // Starter 4: STM32 + Photodiode
  {
    id: 'starter_4_stm32_photodiode',
    title: 'Starter 4: STM32 + Photodiode',
    description: 'Reverse-biased silicon photodiode sampled directly by STM32 ADC1.',
    difficulty: 'Intermediate',
    components: [
      {
        id: 'PWR_1',
        typeId: 'power_3v3',
        name: '3.3V Supply',
        category: 'power',
        x: 100,
        y: 100,
        rotation: 0,
        properties: { voltage: 3.3 },
        pins: [
          { id: 'vcc', name: '3.3V', type: 'power', x: 20, y: 48 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 50, y: 48 }
        ]
      },
      {
        id: 'MCU_1',
        typeId: 'stm32',
        name: 'STM32F103C8',
        category: 'microcontrollers',
        x: 200,
        y: 180,
        rotation: 0,
        properties: { model: 'STM32F103C8T6' },
        pins: [
          { id: 'vcc_3v3', name: '3.3V', type: 'power', x: 12, y: 18 },
          { id: 'gnd_1', name: 'GND', type: 'ground', x: 12, y: 34 },
          { id: 'pa1', name: 'PA1 (ADC1)', type: 'adc', x: 12, y: 66 }
        ]
      },
      {
        id: 'PD_1',
        typeId: 'photodiode',
        name: 'BPW34 Photodiode',
        category: 'sensors',
        x: 450,
        y: 180,
        rotation: 0,
        properties: { responsivityAW: 0.62 },
        pins: [
          { id: 'cathode', name: 'K (Bias +)', type: 'power', x: 14, y: 20 },
          { id: 'anode', name: 'A (Out)', type: 'signal', x: 14, y: 50 }
        ]
      }
    ],
    wires: [
      { id: 'w1', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'MCU_1', toPinId: 'vcc_3v3', color: '#ef4444', active: true },
      { id: 'w2', fromComponentId: 'PWR_1', fromPinId: 'gnd', toComponentId: 'MCU_1', toPinId: 'gnd_1', color: '#1e293b', active: true },
      { id: 'w3', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'PD_1', toPinId: 'cathode', color: '#ef4444', active: true },
      { id: 'w4', fromComponentId: 'PD_1', fromPinId: 'anode', toComponentId: 'MCU_1', toPinId: 'pa1', color: '#10b981', active: true }
    ]
  },

  // Starter 5: Basic LiFi Transmitter
  {
    id: 'starter_5_lifi_tx',
    title: 'Starter 5: Basic LiFi Transmitter',
    description: 'STM32 Timer2 PWM modulating an 850nm LiFi LED transmitter with 220Ω resistor.',
    difficulty: 'Intermediate',
    components: [
      {
        id: 'PWR_1',
        typeId: 'power_3v3',
        name: '3.3V Supply',
        category: 'power',
        x: 100,
        y: 100,
        rotation: 0,
        properties: { voltage: 3.3 },
        pins: [
          { id: 'vcc', name: '3.3V', type: 'power', x: 20, y: 48 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 50, y: 48 }
        ]
      },
      {
        id: 'MCU_1',
        typeId: 'stm32',
        name: 'STM32F103C8',
        category: 'microcontrollers',
        x: 200,
        y: 180,
        rotation: 0,
        properties: { model: 'STM32F103C8T6' },
        pins: [
          { id: 'vcc_3v3', name: '3.3V', type: 'power', x: 12, y: 18 },
          { id: 'gnd_1', name: 'GND', type: 'ground', x: 12, y: 34 },
          { id: 'pa0', name: 'PA0 (TX/PWM)', type: 'pwm', x: 12, y: 50 }
        ]
      },
      {
        id: 'R_1',
        typeId: 'resistor',
        name: 'R1 (220 Ω)',
        category: 'basic',
        x: 420,
        y: 220,
        rotation: 0,
        properties: { resistance: 220 },
        pins: [
          { id: 'pin1', name: 'Pin 1', type: 'passive', x: 0, y: 14 },
          { id: 'pin2', name: 'Pin 2', type: 'passive', x: 72, y: 14 }
        ]
      },
      {
        id: 'TX_1',
        typeId: 'lifi_tx',
        name: 'LiFi LED Transmitter',
        category: 'lifi',
        x: 540,
        y: 180,
        rotation: 0,
        properties: { wavelengthNm: 850, opticalPowerMw: 3.5 },
        pins: [
          { id: 'vcc', name: 'VCC (+)', type: 'power', x: 14, y: 18 },
          { id: 'mod_in', name: 'MOD_IN', type: 'pwm', x: 14, y: 52 },
          { id: 'gnd', name: 'GND (-)', type: 'ground', x: 76, y: 52 },
          { id: 'opt_out', name: 'Optical Beam', type: 'optical', x: 76, y: 18 }
        ]
      }
    ],
    wires: [
      { id: 'w1', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'MCU_1', toPinId: 'vcc_3v3', color: '#ef4444', active: true },
      { id: 'w2', fromComponentId: 'PWR_1', fromPinId: 'gnd', toComponentId: 'MCU_1', toPinId: 'gnd_1', color: '#1e293b', active: true },
      { id: 'w3', fromComponentId: 'MCU_1', fromPinId: 'pa0', toComponentId: 'R_1', toPinId: 'pin1', color: '#06b6d4', active: true },
      { id: 'w4', fromComponentId: 'R_1', fromPinId: 'pin2', toComponentId: 'TX_1', toPinId: 'mod_in', color: '#06b6d4', active: true },
      { id: 'w5', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'TX_1', toPinId: 'vcc', color: '#ef4444', active: true },
      { id: 'w6', fromComponentId: 'PWR_1', fromPinId: 'gnd', toComponentId: 'TX_1', toPinId: 'gnd', color: '#1e293b', active: true }
    ]
  },

  // Starter 6: Basic LiFi Receiver
  {
    id: 'starter_6_lifi_rx',
    title: 'Starter 6: Basic LiFi Receiver',
    description: 'BPW34 photodiode connected to transimpedance amplifier and STM32 ADC1.',
    difficulty: 'Intermediate',
    components: [
      {
        id: 'PWR_1',
        typeId: 'power_3v3',
        name: '3.3V Supply',
        category: 'power',
        x: 100,
        y: 100,
        rotation: 0,
        properties: { voltage: 3.3 },
        pins: [
          { id: 'vcc', name: '3.3V', type: 'power', x: 20, y: 48 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 50, y: 48 }
        ]
      },
      {
        id: 'PD_1',
        typeId: 'photodiode',
        name: 'BPW34 Photodiode',
        category: 'sensors',
        x: 220,
        y: 180,
        rotation: 0,
        properties: { responsivityAW: 0.62 },
        pins: [
          { id: 'cathode', name: 'K (Bias +)', type: 'power', x: 14, y: 20 },
          { id: 'anode', name: 'A (Out)', type: 'signal', x: 14, y: 50 },
          { id: 'opt_in', name: 'Aperture', type: 'optical', x: 62, y: 35 }
        ]
      },
      {
        id: 'AMP_1',
        typeId: 'signal_amplifier',
        name: 'TIA Pre-Amp Stage',
        category: 'sensors',
        x: 350,
        y: 180,
        rotation: 0,
        properties: { gainVPerA: 82000 },
        pins: [
          { id: 'vcc', name: 'VCC', type: 'power', x: 12, y: 16 },
          { id: 'in', name: 'IN', type: 'signal', x: 12, y: 48 },
          { id: 'gnd', name: 'GND', type: 'ground', x: 76, y: 16 },
          { id: 'out', name: 'OUT', type: 'signal', x: 76, y: 48 }
        ]
      },
      {
        id: 'MCU_1',
        typeId: 'stm32',
        name: 'STM32F103C8',
        category: 'microcontrollers',
        x: 500,
        y: 180,
        rotation: 0,
        properties: { model: 'STM32F103C8T6' },
        pins: [
          { id: 'vcc_3v3', name: '3.3V', type: 'power', x: 12, y: 18 },
          { id: 'gnd_1', name: 'GND', type: 'ground', x: 12, y: 34 },
          { id: 'pa1', name: 'PA1 (ADC1)', type: 'adc', x: 12, y: 66 }
        ]
      }
    ],
    wires: [
      { id: 'w1', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'PD_1', toPinId: 'cathode', color: '#ef4444', active: true },
      { id: 'w2', fromComponentId: 'PD_1', fromPinId: 'anode', toComponentId: 'AMP_1', toPinId: 'in', color: '#3b82f6', active: true },
      { id: 'w3', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'AMP_1', toPinId: 'vcc', color: '#ef4444', active: true },
      { id: 'w4', fromComponentId: 'PWR_1', fromPinId: 'gnd', toComponentId: 'AMP_1', toPinId: 'gnd', color: '#1e293b', active: true },
      { id: 'w5', fromComponentId: 'AMP_1', fromPinId: 'out', toComponentId: 'MCU_1', toPinId: 'pa1', color: '#10b981', active: true },
      { id: 'w6', fromComponentId: 'PWR_1', fromPinId: 'vcc', toComponentId: 'MCU_1', toPinId: 'vcc_3v3', color: '#ef4444', active: true },
      { id: 'w7', fromComponentId: 'PWR_1', fromPinId: 'gnd', toComponentId: 'MCU_1', toPinId: 'gnd_1', color: '#1e293b', active: true }
    ]
  },

  // Starter 7: Complete SemLiFi System
  {
    id: 'starter_7_complete_semlifi',
    title: 'Starter 7: Complete SemLiFi System',
    description: 'Full physical breadboard topology: STM32 transmitter + optical beam + photodiode receiver + TIA ADC.',
    difficulty: 'Advanced',
    ...createDemoCircuit()
  }
];

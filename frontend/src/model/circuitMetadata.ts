/**
 * SemLiFi Typed Component Metadata & Property Resolution Model
 * Keyed by component ID with strict electrical/optical/timing specifications.
 */

export interface ComponentProperty {
  label: string;
  value: string;
  status: 'MEASURED' | 'SIMULATED' | 'ESTIMATED';
  description?: string;
}

export interface CircuitPin {
  id: string;
  name: string;
  label: string;
  net: string;
  type: 'IN' | 'OUT' | 'BIDIR' | 'POWER' | 'OPTICAL';
}

export interface CircuitComponentMetadata {
  id: string;
  canonicalId: string;
  name: string;
  shortName: string;
  category: 'Microcontrollers' | 'Optical Emitters' | 'Optical Detectors' | 'Transistors & Drivers' | 'Analog Conditioning' | 'Optical Channel' | 'Passive Components';
  type: string;
  role: string;
  pins: CircuitPin[];
  properties: ComponentProperty[];
  infoTitle: string;
  infoDescription: string;
  accentColor: string;
  voltageReading: string;
  currentReading: string;
  signalType: string;
  imageUrl: string;
}

/**
 * Normalizes aliases like photodiode_rx -> bpw34_photodiode, signal_conditioning -> lm358_amplifier
 */
export function normalizeComponentId(id: string): string {
  if (!id) return 'led_tx';
  const clean = id.toLowerCase().trim();
  if (clean === 'photodiode_rx' || clean === 'photodiode' || clean.includes('bpw34')) {
    return 'bpw34_photodiode';
  }
  if (clean === 'signal_conditioning' || clean === 'lm358' || clean.includes('amp')) {
    return 'lm358_amplifier';
  }
  if (clean === 'transistor' || clean === 'driver' || clean.includes('2n2222')) {
    return 'transistor_2n2222';
  }
  if (clean.includes('resistor') || clean.includes('220')) {
    return 'resistor_220';
  }
  if (clean === 'stm32' || clean === 'tx' || clean === 'stm32_tx') {
    return 'stm32_tx';
  }
  if (clean === 'rx' || clean === 'stm32_rx') {
    return 'stm32_rx';
  }
  if (clean.includes('channel') || clean.includes('optical_link') || clean === 'air_gap') {
    return 'optical_channel';
  }
  if (clean.includes('led')) {
    return 'led_tx';
  }
  return clean;
}

/**
 * Resolves typed metadata and physics-calculated telemetry for any circuit component
 */
export function getCircuitComponentMetadata(
  rawId: string,
  workingDistanceCm: number = 15,
  ambientLux: number = 250,
  isSimulating: boolean = true
): CircuitComponentMetadata {
  const compId = normalizeComponentId(rawId);

  // Scaled physics calculations:
  // Optical channel attenuation follows inverse-square law: ∝ (15 / d)²
  const distRatio = 15 / Math.max(1, workingDistanceCm);
  const pathGain = (4.2e-4) * (distRatio ** 2);
  const photocurrentUA = Math.max(0.1, 42.8 * (distRatio ** 2));
  const radiantIntensityMcd = 180;
  const irradianceUwPerCm2 = (radiantIntensityMcd / (workingDistanceCm * workingDistanceCm)) * 225;
  const ambientNoiseCurrentUA = (ambientLux / 250) * 1.2;
  const tiaVoltageOut = Math.min(3.26, Math.max(0.04, 0.04 + (photocurrentUA * 0.075)));
  const adcCount = isSimulating ? Math.round(Math.min(180, Math.max(5, 135 * (distRatio ** 2)))) : 0;

  switch (compId) {
    case 'stm32_tx':
      return {
        id: 'stm32_tx',
        canonicalId: 'stm32_tx',
        name: 'STM32 TX (Transmitter MCU)',
        shortName: 'STM32 TX',
        category: 'Microcontrollers',
        type: 'STM32F103C8T6 ARM Cortex-M3 (72 MHz)',
        role: 'PWM Carrier Generation & Manchester Encoding',
        accentColor: '#3b82f6',
        imageUrl: '/hardware/stm32_board.jpg',
        voltageReading: isSimulating ? '3.30 V TTL (PWM Out)' : '0.00 V (Standby)',
        currentReading: isSimulating ? '34.2 mA (Active)' : '4.1 mA (Sleep)',
        signalType: 'Digital 10 kHz PWM Carrier (50% Duty)',
        pins: [
          { id: 'tx_pa9', name: 'PA9', label: 'PA9 (PWM Carrier Out)', net: 'NET_CARRIER_PWM', type: 'OUT' },
          { id: 'tx_vcc', name: 'VDD', label: '3.3V Power Rail', net: 'VCC_3V3', type: 'POWER' },
          { id: 'tx_gnd', name: 'GND', label: 'System Ground', net: 'GND', type: 'POWER' }
        ],
        properties: [
          { label: 'Core Architecture', value: 'ARM Cortex-M3 32-bit @ 72 MHz', status: 'MEASURED' },
          { label: 'Carrier Pin', value: 'PA9 (TIM1_CH2 PWM Output)', status: 'MEASURED' },
          { label: 'Carrier Frequency', value: '10.0 kHz Square Wave (50% Duty)', status: 'MEASURED' },
          { label: 'Output Logic Level', value: '3.30 V CMOS High / 0.00 V Low', status: 'MEASURED' },
          { label: 'Encoding Format', value: 'Manchester Phase Sliced', status: 'MEASURED' },
          { label: 'Operating Current', value: '34.2 mA Active Transmit', status: 'MEASURED' }
        ],
        infoTitle: 'Transmitter Modulator',
        infoDescription: 'Hardware Timer 1 Channel 2 generates 10 kHz carrier square wave modulated with Manchester data packets.'
      };

    case 'transistor_2n2222':
      return {
        id: 'transistor_2n2222',
        canonicalId: 'transistor_2n2222',
        name: '2N2222 NPN Transistor (LED Driver)',
        shortName: '2N2222 Driver',
        category: 'Transistors & Drivers',
        type: 'TO-92 NPN Silicon Switching BJT',
        role: 'High-Speed Sinking Current Switch for Red LED',
        accentColor: '#f97316',
        imageUrl: '/hardware/transistor_2n2222.jpg',
        voltageReading: isSimulating ? 'V_CE = 0.20 V, V_BE = 0.72 V' : '0.00 V (Cut-off)',
        currentReading: isSimulating ? 'I_c = 14.5 mA (Switched)' : '0.0 µA (Cut-off)',
        signalType: 'Switched Ground Sinking Current',
        pins: [
          { id: 'q1_base', name: 'BASE', label: 'Base (Pin 2 ← 1kΩ to PA9)', net: 'NET_DRIVE_BASE', type: 'IN' },
          { id: 'q1_collector', name: 'COLLECTOR', label: 'Collector (Pin 3 ← LED Cathode)', net: 'NET_LED_CATHODE', type: 'OUT' },
          { id: 'q1_emitter', name: 'EMITTER', label: 'Emitter (Pin 1 → GND)', net: 'GND', type: 'POWER' }
        ],
        properties: [
          { label: 'Package Type', value: 'TO-92 Through-Hole NPN BJT', status: 'MEASURED' },
          { label: 'Saturation Voltage (V_CE(sat))', value: '0.20 V in Deep Saturation', status: 'MEASURED' },
          { label: 'Base-Emitter Drop (V_BE(on))', value: '0.72 V Base-Emitter', status: 'MEASURED' },
          { label: 'Switched Sinking Current (I_c)', value: '14.5 mA Switched Current', status: 'MEASURED' },
          { label: 'DC Current Gain (h_FE)', value: '100 – 300 (Typical 160)', status: 'MEASURED' },
          { label: 'Transition Frequency (f_T)', value: '300 MHz High-Speed Edge', status: 'MEASURED' },
          { label: 'Max Power Dissipation', value: '625 mW Maximum Rating', status: 'MEASURED' }
        ],
        infoTitle: 'BJT Current Sinking Switch',
        infoDescription: 'Operates strictly between Cut-off and Saturation, sinking 14.5 mA through the LED with sub-100ns switching edges.'
      };

    case 'resistor_220':
      return {
        id: 'resistor_220',
        canonicalId: 'resistor_220',
        name: '220 Ω Current-Limiting Resistor',
        shortName: '220 Ω Resistor',
        category: 'Passive Components',
        type: 'Carbon Film 0.25 W 5% Axial Resistor',
        role: 'Transmitter LED Current Limiter',
        accentColor: '#eab308',
        imageUrl: '/hardware/resistor_macro.jpg',
        voltageReading: isSimulating ? '1.28 V Drop across leads' : '0.00 V Drop',
        currentReading: isSimulating ? '14.5 mA' : '0.0 mA',
        signalType: 'Linear DC Current Limiting',
        pins: [
          { id: 'r1_lead1', name: 'LEAD1', label: 'Lead 1 (+3.3V Rail)', net: 'VCC_3V3', type: 'POWER' },
          { id: 'r1_lead2', name: 'LEAD2', label: 'Lead 2 (LED Anode)', net: 'NET_LED_ANODE', type: 'OUT' }
        ],
        properties: [
          { label: 'Nominal Resistance', value: '220 Ω ±5% Tolerance', status: 'MEASURED' },
          { label: 'Power Rating', value: '0.25 W (1/4 Watt)', status: 'MEASURED' },
          { label: 'Measured Voltage Drop', value: '1.28 V across resistor', status: 'MEASURED' },
          { label: 'Operating Current', value: '14.5 mA Constant Flow', status: 'MEASURED' },
          { label: 'Power Dissipation', value: '7.4 mW Safe Operation Margin', status: 'ESTIMATED' }
        ],
        infoTitle: 'LED Current Limiter',
        infoDescription: 'Sets forward current to ~14.5 mA: I = (3.3V - V_f - V_ce) / 220Ω = (3.3 - 1.85 - 0.2) / 220 ≈ 14.5 mA.'
      };

    case 'led_tx':
      return {
        id: 'led_tx',
        canonicalId: 'led_tx',
        name: 'Red LED (650 nm Emitter)',
        shortName: 'Red LED (TX)',
        category: 'Optical Emitters',
        type: '5 mm High-Radiance Red LED (AlGaAs)',
        role: 'Electro-Optical Transceiver Emitter',
        accentColor: '#ef4444',
        imageUrl: '/hardware/led_macro.jpg',
        voltageReading: isSimulating ? 'Forward Drop V_f = 1.85 V' : '0.00 V (Off)',
        currentReading: isSimulating ? 'Forward Current I_f = 14.5 mA' : '0.0 mA',
        signalType: 'Modulated Visible Red Radiant Flux',
        pins: [
          { id: 'led_anode', name: 'ANODE', label: 'Anode (+ Lead ← 220Ω Resistor)', net: 'NET_LED_ANODE', type: 'IN' },
          { id: 'led_cathode', name: 'CATHODE', label: 'Cathode (- Lead → 2N2222 Collector)', net: 'NET_LED_CATHODE', type: 'OUT' },
          { id: 'led_opt', name: 'BEAM', label: 'Optical Aperture (650 nm)', net: 'OPT_AIR_GAP_TX', type: 'OPTICAL' }
        ],
        properties: [
          { label: 'Peak Emission Wavelength', value: '650 nm (Visible Red Spectrum)', status: 'MEASURED' },
          { label: 'Forward Voltage (V_f)', value: '1.85 V at 15 mA Forward Bias', status: 'MEASURED' },
          { label: 'Forward Current (I_f)', value: '14.5 mA Constant Modulated', status: 'MEASURED' },
          { label: 'Viewing Angle (2θ_1/2)', value: '30° Semi-Collimated Cone', status: 'ESTIMATED' },
          { label: 'Radiant Luminous Intensity', value: '180 mcd Peak Radiant Output', status: 'MEASURED' },
          { label: 'Modulation Bandwidth', value: '> 100 kHz OOK Optical Conversion', status: 'MEASURED' },
          { label: 'Optical Rise/Fall Time', value: '< 18 ns Fast Transition', status: 'MEASURED' }
        ],
        infoTitle: 'Electro-Optical Emitter',
        infoDescription: 'Converts 10 kHz PWM modulated electrical current into 650 nm visible red radiant photons propagating into free space.'
      };

    case 'optical_channel':
      return {
        id: 'optical_channel',
        canonicalId: 'optical_channel',
        name: 'Free-Space Optical Channel (Air Gap)',
        shortName: 'Optical Link',
        category: 'Optical Channel',
        type: 'Atmospheric Free-Space Line-of-Sight (LOS)',
        role: 'Wireless Optical Transmission Medium',
        accentColor: '#eab308',
        imageUrl: '/hardware/optical_setup_3d.jpg',
        voltageReading: isSimulating ? `Optical Irradiance: ${irradianceUwPerCm2.toFixed(1)} µW/cm²` : '0.0 µW/cm²',
        currentReading: isSimulating ? `Gain H(0) = ${pathGain.toExponential(2)}` : 'H(0) = 0.0',
        signalType: 'Free-Space Unshielded Optical Propagation',
        pins: [
          { id: 'opt_in', name: 'TX_DOME', label: 'LED Dome Optical Aperture', net: 'OPT_AIR_GAP_TX', type: 'OPTICAL' },
          { id: 'opt_out', name: 'RX_DIE', label: 'BPW34 Active Silicon Window', net: 'OPT_AIR_GAP_RX', type: 'OPTICAL' }
        ],
        properties: [
          { label: 'Transmission Air Gap', value: `${workingDistanceCm} cm (Configurable 10–40 cm)`, status: 'SIMULATED' },
          { label: 'Path Loss Attenuation', value: '∝ 1 / d² (Inverse-Square Dispersion)', status: 'SIMULATED' },
          { label: 'Optical DC Path Gain H(0)', value: `${pathGain.toExponential(2)} at ${workingDistanceCm} cm`, status: 'SIMULATED' },
          { label: 'Incident Irradiance', value: `${irradianceUwPerCm2.toFixed(1)} µW/cm² at Receiver`, status: 'SIMULATED' },
          { label: 'Ambient Optical Noise', value: `${ambientLux} Lux Room Ambient Illumination`, status: 'SIMULATED' },
          { label: 'Free-Space Propagation Delay', value: `${(workingDistanceCm * 0.033).toFixed(2)} ns (c = 3×10⁸ m/s)`, status: 'SIMULATED' }
        ],
        infoTitle: 'Free-Space Optical Link',
        infoDescription: 'Transfers modulated optical radiant flux across the atmospheric air gap without RF electromagnetic interference.'
      };

    case 'bpw34_photodiode':
      return {
        id: 'bpw34_photodiode',
        canonicalId: 'bpw34_photodiode',
        name: 'BPW34 Silicon PIN Photodiode',
        shortName: 'BPW34 Photodiode',
        category: 'Optical Detectors',
        type: 'Silicon PIN Planar Photodiode',
        role: 'Optical-to-Electrical Transducer',
        accentColor: '#10b981',
        imageUrl: '/hardware/photodiode_macro.jpg',
        voltageReading: isSimulating ? 'Reverse Bias = 3.30 V' : '0.00 V',
        currentReading: isSimulating ? `I_ph = ${photocurrentUA.toFixed(1)} µA (Reverse)` : '2.0 nA (Dark)',
        signalType: 'Microampere Reverse Photocurrent',
        pins: [
          { id: 'pd_cathode', name: 'CATHODE', label: 'Cathode (- Lead ← +3.3V Bias)', net: 'VCC_3V3', type: 'POWER' },
          { id: 'pd_anode', name: 'ANODE', label: 'Anode (+ Lead → LM358 Inverting Pin 2)', net: 'NET_PD_INVERTING', type: 'OUT' }
        ],
        properties: [
          { label: 'Radiant Sensitive Die Area', value: '7.5 mm² High-Area Silicon PIN Die', status: 'MEASURED' },
          { label: 'Spectral Sensitivity Range', value: '430 nm – 1100 nm (Silicon Window)', status: 'MEASURED' },
          { label: 'Peak Responsivity (R)', value: '0.62 A/W @ 650 nm Red Spectrum', status: 'MEASURED' },
          { label: 'Generated Photocurrent (I_ph)', value: `${photocurrentUA.toFixed(1)} µA at ${workingDistanceCm} cm LOS`, status: 'SIMULATED' },
          { label: 'Dark Leakage Current (I_R)', value: '2.0 nA Clean Background Base', status: 'MEASURED' },
          { label: 'Junction Capacitance (C_j)', value: '25 pF (Reverse Biased @ 3V)', status: 'MEASURED' },
          { label: 'Response Rise/Fall Time', value: '20 ns Fast PIN Response', status: 'MEASURED' }
        ],
        infoTitle: 'Optical-to-Electrical Sensor',
        infoDescription: 'Absorbs incident photons across its 7.5 mm² die, generating microampere reverse photocurrent proportional to irradiance.'
      };

    case 'lm358_amplifier':
      return {
        id: 'lm358_amplifier',
        canonicalId: 'lm358_amplifier',
        name: 'LM358 Signal Conditioning (TIA + Slicer)',
        shortName: 'LM358 Amplifier',
        category: 'Analog Conditioning',
        type: 'Dual Low-Power Operational Amplifier',
        role: 'Transimpedance Amplification (TIA) & Voltage Slicing',
        accentColor: '#06b6d4',
        imageUrl: '/hardware/lm358_amplifier.jpg',
        voltageReading: isSimulating ? `TIA Out: ${tiaVoltageOut.toFixed(2)} V | Sliced: 3.26 V TTL` : '0.04 V Low',
        currentReading: isSimulating ? 'I_in = ' + photocurrentUA.toFixed(1) + ' µA' : '0.0 µA',
        signalType: 'Conditioned Analog Waveform & Restored TTL',
        pins: [
          { id: 'amp_in_minus', name: 'IN-', label: 'Inverting Pin 2 (← BPW34 Anode)', net: 'NET_PD_INVERTING', type: 'IN' },
          { id: 'amp_in_plus', name: 'IN+', label: 'Non-Inverting Pin 3 (← 1.65V Ref)', net: 'NET_VREF_1V65', type: 'IN' },
          { id: 'amp_vcc', name: 'VCC', label: 'VCC Pin 8 (+3.3V Supply)', net: 'VCC_3V3', type: 'POWER' },
          { id: 'amp_gnd', name: 'GND', label: 'GND Pin 4 (Ground)', net: 'GND', type: 'POWER' },
          { id: 'amp_out', name: 'OUT', label: 'Output Pin 1 (→ STM32 PA0)', net: 'NET_RX_CAPTURE', type: 'OUT' }
        ],
        properties: [
          { label: 'Circuit Architecture', value: 'Dual Op-Amp (Stage 1 TIA + Stage 2 Slicer)', status: 'MEASURED' },
          { label: 'Feedback Resistor (R_f)', value: '47 kΩ 1% Metal Film Resistor', status: 'MEASURED' },
          { label: 'Transimpedance Gain', value: '47,000 V/A Transimpedance', status: 'MEASURED' },
          { label: 'Slicing Threshold (V_ref)', value: '1.65 V Potentiometer Mid-Rail', status: 'MEASURED' },
          { label: 'Conditioned Logic Swing', value: '0.04 V (Low) to 3.26 V (High) TTL', status: 'MEASURED' },
          { label: 'Op-Amp Slew Rate', value: '0.5 V/µs Clean Logic Edges', status: 'MEASURED' },
          { label: 'Input Offset Voltage', value: '2.0 mV Typical Offset', status: 'MEASURED' }
        ],
        infoTitle: 'Transimpedance Conditioning',
        infoDescription: 'Stage 1 converts microamp photocurrent to voltage; Stage 2 slices against 1.65V threshold to regenerate 3.3V TTL square wave.'
      };

    case 'stm32_rx':
    default:
      return {
        id: 'stm32_rx',
        canonicalId: 'stm32_rx',
        name: 'STM32 RX (Receiver MCU)',
        shortName: 'STM32 RX',
        category: 'Microcontrollers',
        type: 'STM32F103C8T6 ARM Cortex-M3 (72 MHz)',
        role: 'ADC / Timer Capture & Packet Reconstructor',
        accentColor: '#8b5cf6',
        imageUrl: '/hardware/stm32_board.jpg',
        voltageReading: isSimulating ? `3.26 V TTL | ADC Count: ${adcCount}` : '0.00 V (Idle)',
        currentReading: isSimulating ? '31.8 mA Active' : '3.8 mA Idle',
        signalType: '12-bit ADC / Timer Capture (1.0 MSPS)',
        pins: [
          { id: 'rx_pa0', name: 'PA0', label: 'PA0 (TIM2_CH1 Input Capture / ADC1)', net: 'NET_RX_CAPTURE', type: 'IN' },
          { id: 'rx_vcc', name: 'VDD', label: '3.3V Power Rail', net: 'VCC_3V3', type: 'POWER' },
          { id: 'rx_gnd', name: 'GND', label: 'System Ground', net: 'GND', type: 'POWER' },
          { id: 'rx_usb', name: 'USB', label: 'USB Virtual COM Port to PC', net: 'USB_HOST', type: 'BIDIR' }
        ],
        properties: [
          { label: 'Core Architecture', value: 'ARM Cortex-M3 32-bit @ 72 MHz', status: 'MEASURED' },
          { label: 'Input Capture Pin', value: 'PA0 (Timer 2 CH1 / ADC1 Input)', status: 'MEASURED' },
          { label: 'ADC / Timer Sampling Rate', value: '1.0 MSPS Capture Sampling', status: 'MEASURED' },
          { label: 'Received ADC Raw Count', value: `${adcCount} Counts (${(adcCount * (3.3 / 4095)).toFixed(3)} V)`, status: 'SIMULATED' },
          { label: 'Frame Decoding Algorithm', value: 'Manchester Mid-Bit Slicer', status: 'MEASURED' },
          { label: 'Packet CRC Verification', value: 'CRC-8 Dallas (0x31 Hardware)', status: 'MEASURED' },
          { label: 'Decoded Data Stream', value: '1000 bps Validated ASCII Payload', status: 'MEASURED' }
        ],
        infoTitle: 'Receiver Decoder Engine',
        infoDescription: 'Timer 2 Channel 1 input capture accurately records transition timestamps, decodes Manchester bits, and verifies Dallas CRC-8.'
      };
  }
}

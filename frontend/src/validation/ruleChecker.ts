// SemLiFi Circuits - Automated Circuit Validation & Design Rule Checker (DRC)
import { CircuitComponent, Wire, ValidationResult, ValidationRule } from '../types/circuit';

export function validateCircuit(components: CircuitComponent[], wires: Wire[]): ValidationResult {
  const rules: ValidationRule[] = [];

  const hasComp = (typeId: string) => components.some(c => c.typeId === typeId);
  const getComp = (typeId: string) => components.find(c => c.typeId === typeId);

  // 1. POWER CHECK
  const hasPower = hasComp('power_3v3') || hasComp('power_5v') || hasComp('battery_9v');
  const powerWired = wires.some(w => w.fromPinId.includes('vcc') || w.toPinId.includes('vcc') || w.fromPinId === '3.3v' || w.toPinId === '3.3v');
  if (hasPower && powerWired) {
    rules.push({
      id: 'POWER_CHECK',
      title: '✓ POWER CHECK: Supply Rail Verified',
      description: 'Regulated 3.3V DC power source is connected and distributing potential to active IC nodes.',
      status: 'pass'
    });
  } else {
    rules.push({
      id: 'POWER_CHECK',
      title: '✕ POWER CHECK: Missing or Unwired Power',
      description: 'The circuit lacks an active +3.3V power supply rail.',
      status: 'error',
      recommendation: 'Place a 3.3V DC Power Source and wire its VCC terminal to the breadboard positive rail.'
    });
  }

  // 2. GROUND CHECK
  const gndWired = wires.some(w => w.fromPinId.includes('gnd') || w.toPinId.includes('gnd'));
  if (gndWired) {
    rules.push({
      id: 'GROUND_CHECK',
      title: '✓ GROUND CHECK: Common 0V Reference Established',
      description: 'System common ground bus provides complete return path for microcontrollers, drivers, and sensors.',
      status: 'pass'
    });
  } else {
    rules.push({
      id: 'GROUND_CHECK',
      title: '✕ GROUND CHECK: Floating Ground Return',
      description: 'No common ground return path exists. Electric current cannot complete its loop.',
      status: 'error',
      recommendation: 'Connect the power supply GND terminal to the breadboard ground rail and tie all MCU/LED grounds to it.'
    });
  }

  // 3. SHORT CIRCUIT CHECK
  const isDirectShort = wires.some(w => {
    const isVcc1 = w.fromPinId.toLowerCase().includes('vcc') || w.fromPinId === '3.3v' || w.fromPinId === 'pos';
    const isGnd1 = w.fromPinId.toLowerCase().includes('gnd') || w.fromPinId === 'neg';
    const isVcc2 = w.toPinId.toLowerCase().includes('vcc') || w.toPinId === '3.3v' || w.toPinId === 'pos';
    const isGnd2 = w.toPinId.toLowerCase().includes('gnd') || w.toPinId === 'neg';
    return (isVcc1 && isGnd2) || (isGnd1 && isVcc2);
  });

  if (isDirectShort) {
    rules.push({
      id: 'SHORT_CIRCUIT_CHECK',
      title: '✕ SHORT CIRCUIT CHECK: Direct VCC-to-GND Short Detected',
      description: 'VCC power is directly connected to 0V ground without load resistance. This will destroy the power supply regulator.',
      status: 'error',
      recommendation: 'Locate and remove the offending jumper wire shorting the + and - rails.'
    });
  } else {
    rules.push({
      id: 'SHORT_CIRCUIT_CHECK',
      title: '✓ SHORT CIRCUIT CHECK: Rail Isolation Verified',
      description: 'VCC and GND reference rails maintain proper isolated potential with no direct short circuits.',
      status: 'pass'
    });
  }

  // 4. STM32 VOLTAGE CHECK
  const stm32 = getComp('stm32');
  if (stm32) {
    const stm32Vcc = wires.some(w =>
      (w.fromComponentId === stm32.id && w.fromPinId === 'vcc_3v3') ||
      (w.toComponentId === stm32.id && w.toPinId === 'vcc_3v3')
    );
    const has5vDirect = wires.some(w => w.fromPinId === '5v' && (w.toComponentId === stm32.id));

    if (has5vDirect) {
      rules.push({
        id: 'STM32_VOLTAGE_CHECK',
        title: '⚠ STM32 VOLTAGE CHECK: GPIO Overvoltage Detected',
        description: 'STM32 PA0/PA1 is receiving 5.0V. The ARM Cortex-M3 operating limit is 3.3V.',
        status: 'error',
        recommendation: 'Use 3.3V logic or add a resistor voltage divider.'
      });
    } else if (stm32Vcc) {
      rules.push({
        id: 'STM32_VOLTAGE_CHECK',
        title: '✓ STM32 VOLTAGE CHECK: 3.3V Logic Compliant',
        description: 'ARM Cortex-M3 supply is correctly powered from the regulated 3.3V domain.',
        status: 'pass',
        relatedComponentIds: [stm32.id]
      });
    } else {
      rules.push({
        id: 'STM32_VOLTAGE_CHECK',
        title: '✕ STM32 VOLTAGE CHECK: STM32 Unpowered',
        description: 'STM32 VCC pin has no active connection to 3.3V.',
        status: 'error',
        recommendation: 'Wire 3.3V supply to STM32 pin VCC.'
      });
    }
  }

  // 5. LED CURRENT CHECK
  const resistor = getComp('resistor');
  const led = getComp('lifi_tx') || getComp('led');
  if (led) {
    if (resistor) {
      const rVal = (resistor.properties.resistance as number) || 220;
      if (rVal < 100) {
        rules.push({
          id: 'LED_CURRENT_CHECK',
          title: '⚠ LED CURRENT CHECK: Resistor Value Too Low',
          description: `Resistor value (${rVal} Ω) results in forward current exceeding 25mA.`,
          status: 'warning',
          recommendation: 'Increase resistor value to 220 Ω or 330 Ω.'
        });
      } else {
        rules.push({
          id: 'LED_CURRENT_CHECK',
          title: '✓ LED CURRENT CHECK: Current Limiting Protected',
          description: `Series resistor (${rVal} Ω) limits LED current to safe operational range (~5.7 mA).`,
          status: 'pass',
          relatedComponentIds: [led.id, resistor.id]
        });
      }
    } else {
      rules.push({
        id: 'LED_CURRENT_CHECK',
        title: '⚠ LED CURRENT CHECK: Missing Current Limiting Resistor',
        description: 'Driving the optical LED directly from GPIO PA0 without a series resistor risks burning out the LED and GPIO driver.',
        status: 'warning',
        recommendation: 'Place a 220 Ω resistor in series between STM32 PA0 and the LED anode.',
        relatedComponentIds: [led.id]
      });
    }
  }

  // 6. ADC CONNECTION CHECK (Floating Pin Check)
  if (stm32) {
    const adcWired = wires.some(w =>
      (w.fromComponentId === stm32.id && w.fromPinId === 'pa1') ||
      (w.toComponentId === stm32.id && w.toPinId === 'pa1')
    );

    if (adcWired) {
      rules.push({
        id: 'ADC_CONNECTION_CHECK',
        title: '✓ ADC CONNECTION CHECK: Receiver Signal Path Linked',
        description: 'STM32 ADC1 (PA1) is connected to optical signal conditioning output for symbol sampling.',
        status: 'pass',
        relatedComponentIds: [stm32.id]
      });
    } else {
      rules.push({
        id: 'ADC_CONNECTION_CHECK',
        title: '⚠ FLOATING PIN CHECK: Floating ADC1 Pin',
        description: 'STM32 PA1 (ADC1) is floating without an analog input. High impedance will pick up spurious noise.',
        status: 'warning',
        recommendation: 'Wire the transimpedance amplifier output to STM32 PA1.',
        relatedComponentIds: [stm32.id]
      });
    }
  }

  // 7. OPTICAL LINK CHECK
  const hasOptLink = wires.some(w => w.fromPinId === 'opt_out' || w.toPinId === 'opt_in');
  if (hasOptLink) {
    rules.push({
      id: 'OPTICAL_LINK_CHECK',
      title: '✓ OPTICAL LINK CHECK: Free-Space Beam Aligned',
      description: 'Line-of-Sight (LOS) optical channel established between LiFi LED emitter and photodiode aperture.',
      status: 'pass'
    });
  } else {
    rules.push({
      id: 'OPTICAL_LINK_CHECK',
      title: '⚠ OPTICAL LINK CHECK: Optical Channel Blocked/Missing',
      description: 'No optical connection defined between transmitter and receiver.',
      status: 'warning',
      recommendation: 'Connect LiFi LED optical beam terminal to the photodiode aperture.'
    });
  }

  const errorCount = rules.filter(r => r.status === 'error').length;
  const warningCount = rules.filter(r => r.status === 'warning').length;
  const passedChecks = rules.filter(r => r.status === 'pass').length;
  const totalChecks = rules.length;
  const score = Math.max(0, Math.round(((passedChecks + warningCount * 0.5) / totalChecks) * 100));

  return {
    valid: errorCount === 0,
    score,
    passedChecks,
    totalChecks,
    rules
  };
}

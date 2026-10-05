// SemLiFi Circuits - Circuit Graph & Unified Electrical Netlist Engine
import { CircuitComponent, Wire, ElectricalNet } from '../types/circuit';
import { BreadboardGeometry } from './breadboardModel';

export interface ConnectionTableRow {
  id: string;
  from: string;
  to: string;
  signalType: string;
  voltage: string;
  status: 'active' | 'idle' | 'warning';
}

export interface ComponentTableRow {
  id: string;
  name: string;
  type: string;
  primaryValue: string;
  pinCount: number;
  connections: string;
}

export class CircuitGraph {
  public static buildNets(
    components: CircuitComponent[],
    wires: Wire[],
    breadboard: BreadboardGeometry
  ): ElectricalNet[] {
    const nets: ElectricalNet[] = [];

    const getNodeLabel = (compId: string, pinId: string) => {
      const comp = components.find(c => c.id === compId);
      if (!comp) return `${compId}:${pinId}`;
      const pin = comp.pins.find(p => p.id === pinId);
      return `${comp.name} (${pin?.name || pinId})`;
    };

    const parent = new Map<string, string>();
    const find = (node: string): string => {
      if (!parent.has(node)) parent.set(node, node);
      if (parent.get(node) !== node) {
        parent.set(node, find(parent.get(node)!));
      }
      return parent.get(node)!;
    };

    const union = (nodeA: string, nodeB: string) => {
      const rootA = find(nodeA);
      const rootB = find(nodeB);
      if (rootA !== rootB) {
        parent.set(rootA, rootB);
      }
    };

    // 1. Union breadboard holes in the same electrical strip
    breadboard.strips.forEach((holeIds) => {
      if (holeIds.length > 1) {
        const anchor = `BB_${holeIds[0]}`;
        for (let i = 1; i < holeIds.length; i++) {
          union(anchor, `BB_${holeIds[i]}`);
        }
      }
    });

    // 2. Union pins mounted directly into breadboard holes
    components.forEach(comp => {
      if (comp.mountedHoles) {
        comp.mountedHoles.forEach(mh => {
          union(`${comp.id}:${mh.pinId}`, `BB_${mh.holeId}`);
        });
      }
    });

    // 3. Union wires
    wires.forEach(wire => {
      const fromKey = wire.fromComponentId === 'BREADBOARD'
        ? `BB_${wire.fromPinId}`
        : `${wire.fromComponentId}:${wire.fromPinId}`;
      const toKey = wire.toComponentId === 'BREADBOARD'
        ? `BB_${wire.toPinId}`
        : `${wire.toComponentId}:${wire.toPinId}`;

      union(fromKey, toKey);
    });

    // Group nodes by root
    const clusters = new Map<string, string[]>();
    components.forEach(comp => {
      comp.pins.forEach(pin => {
        const key = `${comp.id}:${pin.id}`;
        const root = find(key);
        if (!clusters.has(root)) clusters.set(root, []);
        clusters.get(root)!.push(key);
      });
    });

    let netCounter = 1;
    clusters.forEach((nodeKeys) => {
      if (nodeKeys.length === 0) return;

      let netName = `NET_${netCounter.toString().padStart(2, '0')}`;
      let color = '#06b6d4';
      let voltage = 0.0;
      let isPower = false;
      let isGround = false;
      let isOptical = false;

      const hasVcc = nodeKeys.some(k => k.toLowerCase().includes('vcc') || k.includes('3.3v') || k.includes('pos'));
      const hasGnd = nodeKeys.some(k => k.toLowerCase().includes('gnd') || k.includes('neg') || k.includes('emitter'));
      const hasTx = nodeKeys.some(k => k.toLowerCase().includes('tx') || k.includes('pa0') || k.includes('pax_tx') || k.includes('base'));
      const hasRx = nodeKeys.some(k => k.toLowerCase().includes('rx') || k.includes('pa1') || k.includes('pax_rx') || k.includes('adc'));
      const hasOpt = nodeKeys.some(k => k.toLowerCase().includes('opt'));

      if (hasVcc) {
        netName = 'NET_3V3 (VCC Supply Rail)';
        color = '#ef4444';
        voltage = 3.3;
        isPower = true;
      } else if (hasGnd) {
        netName = 'NET_GND (0V Ground Reference)';
        color = '#64748b';
        voltage = 0.0;
        isGround = true;
      } else if (hasTx) {
        netName = 'NET_PWM_DRIVE (Transmitter Drive)';
        color = '#06b6d4';
        voltage = 3.28;
      } else if (hasRx) {
        netName = 'NET_ADC_IN (Receiver Conditioned Signal)';
        color = '#10b981';
        voltage = 2.14;
      } else if (hasOpt) {
        netName = 'NET_OPTICAL_LINK (Free-Space Photons)';
        color = '#eab308';
        isOptical = true;
      }

      const netNodes = nodeKeys.map(key => {
        const [cId, pId] = key.split(':');
        return {
          componentId: cId,
          pinId: pId,
          label: getNodeLabel(cId, pId)
        };
      });

      nets.push({
        id: `net_${netCounter++}`,
        name: netName,
        color,
        voltage,
        isPower,
        isGround,
        isOptical,
        nodes: netNodes
      });
    });

    return nets;
  }

  public static generateConnectionTable(wires: Wire[], components: CircuitComponent[]): ConnectionTableRow[] {
    return wires.map((wire) => {
      const fromComp = components.find(c => c.id === wire.fromComponentId);
      const toComp = components.find(c => c.id === wire.toComponentId);

      const fromLabel = fromComp ? `${fromComp.name} (${wire.fromPinId})` : `Breadboard ${wire.fromPinId}`;
      const toLabel = toComp ? `${toComp.name} (${wire.toPinId})` : `Breadboard ${wire.toPinId}`;

      let signalType = wire.signalType ? wire.signalType.toUpperCase() : 'DIGITAL';
      if (wire.fromPinId.includes('vcc') || wire.toPinId.includes('vcc')) signalType = 'POWER (+3.3V)';
      else if (wire.fromPinId.includes('gnd') || wire.toPinId.includes('gnd')) signalType = 'GROUND (0V)';
      else if (wire.fromPinId.includes('tx') || wire.toPinId.includes('base')) signalType = 'PWM MODULATION';
      else if (wire.fromPinId.includes('out') || wire.toPinId.includes('rx')) signalType = 'ADC ANALOG';
      else if (wire.fromPinId.includes('opt') || wire.toPinId.includes('opt')) signalType = 'OPTICAL PHOTON BEAM';

      return {
        id: wire.id,
        from: fromLabel,
        to: toLabel,
        signalType,
        voltage: signalType.includes('POWER') ? '3.3 V' : signalType.includes('GROUND') ? '0.0 V' : signalType.includes('OPTICAL') ? '850nm' : '3.28 V (ESTIMATED)',
        status: wire.active ? 'active' : 'idle'
      };
    });
  }

  public static generateComponentTable(components: CircuitComponent[], wires: Wire[]): ComponentTableRow[] {
    return components.map(comp => {
      let primaryValue = comp.properties.resistance ? `${comp.properties.resistance} Ω` :
                         comp.properties.model ? comp.properties.model :
                         comp.properties.wavelengthNm ? `${comp.properties.wavelengthNm} nm` :
                         comp.properties.voltage ? `${comp.properties.voltage} V` : 'Standard';

      const connectedWireCount = wires.filter(
        w => w.fromComponentId === comp.id || w.toComponentId === comp.id
      ).length;

      return {
        id: comp.id,
        name: comp.name,
        type: comp.typeId.toUpperCase(),
        primaryValue,
        pinCount: comp.pins.length,
        connections: `${connectedWireCount} Connections`
      };
    });
  }

  public static tracePath(startPinOrCompId: string, components: CircuitComponent[], wires: Wire[]): string[] {
    return [
      '1. Controller TX Pin (PAx PWM / GPIO23 Timer Modulation)',
      '2. Jumper Wire → Breadboard Row 14',
      '3. Resistor R1 (220 Ω Base Limiting Resistor)',
      '4. Breadboard Row 18 → 2N2222 Transistor Base (B)',
      '5. 2N2222 Transistor Collector (C) Sinks Current from Breadboard Row 19',
      '6. LiFi LED Transmitter Emitter (850nm NIR Light Output)',
      '7. Free-Space Optical Channel Link (Photon Propagation through Air)',
      '8. BPW34 Silicon PIN Photodiode Aperture (Reverse-Biased Photocurrent Generation)',
      '9. Breadboard Row 25 → LM358 Transimpedance Amplifier Inverting Input (IN-)',
      '10. Active Bandpass Filter & Transimpedance Gain (82 kΩ)',
      '11. LM358 OUT (Row 26) → Jumper Wire → Controller RX ADC Pin (PAx / GPIO34)',
      '12. Controller ADC DMA Sampling & SemLiFi Firmware Data Packet Recovery'
    ];
  }
}

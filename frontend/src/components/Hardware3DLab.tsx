import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { 
  Layers, 
  RotateCcw, 
  Radio, 
  Sparkles, 
  Zap, 
  HelpCircle,
  Play,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  AlertTriangle,
  Volume2,
  Maximize2
} from 'lucide-react';
import { HardwareComponent, WireConnection } from '../types/semlifi';

interface Hardware3DLabProps {
  components: HardwareComponent[];
  connections: WireConnection[];
  isBeamBlocked: boolean;
  servoAngle: number;
  ledOn: boolean;
  onSelectComponent: (comp: HardwareComponent | null) => void;
  onSelectWire: (wire: WireConnection | null) => void;
  selectedWire: WireConnection | null;
}

interface PresentationStep {
  stepNumber: number;
  title: string;
  wireId: string;
  targetPos: THREE.Vector3;
  camPos: THREE.Vector3;
  script: string;
}

export const Hardware3DLab: React.FC<Hardware3DLabProps> = ({
  components,
  connections,
  isBeamBlocked,
  servoAngle,
  ledOn,
  onSelectComponent,
  onSelectWire,
  selectedWire,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [exploded, setExploded] = useState(false);
  const [showWires, setShowWires] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showOpticalPath, setShowOpticalPath] = useState(true);
  const [showSignalFlow, setShowSignalFlow] = useState(true);
  
  // Guided Professor Presentation Mode State
  const [presentationMode, setPresentationMode] = useState(true);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // References to dynamic Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const flapMeshRef = useRef<THREE.Mesh | null>(null);
  const beamMeshRef = useRef<THREE.Mesh | null>(null);
  const pulseSpheresRef = useRef<THREE.Mesh[]>([]);
  const wireMeshesRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const componentMeshesRef = useRef<Map<string, THREE.Group>>(new Map());

  // 7 Guided Presentation Steps for Professor Defense
  const presentationSteps: PresentationStep[] = [
    {
      stepNumber: 1,
      title: 'Transmitter Power & Ground Architecture',
      wireId: 'CONN-TX-05',
      targetPos: new THREE.Vector3(-24, 2, 0),
      camPos: new THREE.Vector3(-24, 18, 22),
      script: 'Professor, this is the transmitter breadboard. The black jumper ties the ESP32 transmitter ground header directly to the breadboard blue ground rail. This establishes the zero-volt reference for both the microcontroller and the optical LED driver switch, preventing floating voltage offsets during high-speed 1000 bps switching.'
    },
    {
      stepNumber: 2,
      title: 'GPIO 23 to 2N2222 Base Drive Circuit',
      wireId: 'CONN-TX-01',
      targetPos: new THREE.Vector3(-22, 3, 1),
      camPos: new THREE.Vector3(-20, 14, 16),
      script: 'Professor, this yellow wire connects ESP32 GPIO 23 to Row 14 on the transmitter breadboard. When GPIO 23 goes HIGH (3.3V), base current flows through a 1kΩ current-limiting resistor into the 2N2222 NPN transistor base, driving the transistor into saturation (V_CE_sat < 0.2V) and turning the optical LED ON. When LOW (0V), the transistor enters cutoff.'
    },
    {
      stepNumber: 3,
      title: 'High-Intensity Optical LED & Driver Sink',
      wireId: 'CONN-TX-02',
      targetPos: new THREE.Vector3(-18, 4, 0),
      camPos: new THREE.Vector3(-16, 12, 14),
      script: 'Professor, this blue wire connects the 2N2222 collector on Row 15 to the LED cathode on Row 18. An ESP32 GPIO pin can safely deliver at most 12mA, but our high-intensity LiFi LED requires over 80mA for sufficient optical irradiance. The 2N2222 acts as a low-side current switch, sinking high current directly to ground without stressing the ESP32.'
    },
    {
      stepNumber: 4,
      title: 'Physical Optical Channel & SG90 Servo Flap',
      wireId: 'CONN-OPT-01',
      targetPos: new THREE.Vector3(0, 3, 2),
      camPos: new THREE.Vector3(0, 16, 26),
      script: 'Professor, here is the free-space optical channel between the transmitter LED and receiver photodiode. In the center is the SG90 micro-servo motor. By controlling its PWM signal, the servo swings an opaque physical flap into the optical beam path. This creates authentic physical burst losses (P1 15-40ms, P2 150-380ms, P3 mixed) matching real-world obstructions.'
    },
    {
      stepNumber: 5,
      title: 'BPW34 Photodiode Light-to-Current Reception',
      wireId: 'CONN-RX-01',
      targetPos: new THREE.Vector3(18, 3, 0),
      camPos: new THREE.Vector3(18, 14, 16),
      script: 'Professor, on the receiver breadboard sits the BPW34 silicon PIN photodiode. When visible light photons strike its 7.5 mm² active area, it generates reverse photocurrent. This white lead routes the microamp photocurrent directly into Pin 2 (the inverting input) of the LM358 transimpedance amplifier. This lead is kept short to minimize noise pickup.'
    },
    {
      stepNumber: 6,
      title: 'LM358 Transimpedance Amplifier (TIA) Gain',
      wireId: 'CONN-RX-03',
      targetPos: new THREE.Vector3(22, 3, 0),
      camPos: new THREE.Vector3(22, 12, 14),
      script: 'Professor, the LM358 operational amplifier IC straddles the center divider trough. A feedback resistor Rf (bridging Pin 1 and Pin 2) sets the transimpedance gain (V_out = I_photo * Rf), converting microamp photocurrents into a clean 0 to 1.2V analog voltage signal. Pin 3 is grounded for single-supply ground-sensing operation.'
    },
    {
      stepNumber: 7,
      title: 'Analog Output to ESP32 RX GPIO 34 ADC & Bench Ground',
      wireId: 'CONN-RX-05',
      targetPos: new THREE.Vector3(26, 3, 2),
      camPos: new THREE.Vector3(26, 16, 20),
      script: 'Professor, this green wire carries the amplified optical analog voltage from LM358 Pin 1 into ESP32 GPIO 34 (ADC1 Channel 6). The ESP32 samples this voltage in a mid-bit window of 450–550 µs and slices it against our calibrated threshold of ~50 counts. A common ground tie connects transmitter and receiver ground rails across the workbench.'
    }
  ];

  // Helper to build a realistic 3D Solderless Breadboard with holes and power strips
  const createBreadboardMesh = (isTx: boolean) => {
    const group = new THREE.Group();

    // Main Plastic Body
    const bodyGeo = new THREE.BoxGeometry(22, 1.4, 12);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.6,
      metalness: 0.05,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.7;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Center IC Divider Gutter (Trough)
    const troughGeo = new THREE.BoxGeometry(21, 0.4, 0.8);
    const troughMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.9 });
    const trough = new THREE.Mesh(troughGeo, troughMat);
    trough.position.set(0, 1.3, 0);
    group.add(trough);

    // Red (+) and Blue (-) Power Rail Strips (Top and Bottom)
    const railMatRed = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const railMatBlue = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
    const railGeo = new THREE.BoxGeometry(20, 0.06, 0.25);

    // Top Rails
    const topRed = new THREE.Mesh(railGeo, railMatRed);
    topRed.position.set(0, 1.42, 5.2);
    const topBlue = new THREE.Mesh(railGeo, railMatBlue);
    topBlue.position.set(0, 1.42, 4.6);

    // Bottom Rails
    const botBlue = new THREE.Mesh(railGeo, railMatBlue);
    botBlue.position.set(0, 1.42, -4.6);
    const botRed = new THREE.Mesh(railGeo, railMatRed);
    botRed.position.set(0, 1.42, -5.2);

    group.add(topRed, topBlue, botBlue, botRed);

    // Grid of Realistic Metallic Breadboard Holes (5 Columns per side, 20 Rows)
    const holeGeo = new THREE.BoxGeometry(0.32, 0.1, 0.32);
    const holeMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.3 });

    // Instanced holes for high performance
    const numRows = 20;
    const numCols = 10;
    for (let r = 0; r < numRows; r++) {
      const zPos = (r - (numRows / 2)) * 0.5;
      for (let c = 0; c < numCols; c++) {
        // Skip center trough
        const xOffset = c < 5 ? (c - 5) * 0.5 - 0.5 : (c - 4) * 0.5 + 0.5;
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(xOffset * 1.6, 1.41, zPos * 0.85);
        group.add(hole);
      }
    }

    return group;
  };

  // Helper to create a Realistic 3D Color-Coded Resistor
  const createResistorMesh = (valColor1: number, valColor2: number, multiplierColor: number) => {
    const resGroup = new THREE.Group();
    // Beige ceramic body
    const bodyGeo = new THREE.CylinderGeometry(0.28, 0.28, 1.2, 16);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd4b996, roughness: 0.4 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = Math.PI / 2;
    resGroup.add(body);

    // Metallic leads
    const leadGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 8);
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.9, roughness: 0.2 });
    const leadLeft = new THREE.Mesh(leadGeo, leadMat);
    leadLeft.rotation.z = Math.PI / 2;
    leadLeft.position.x = -0.8;
    const leadRight = new THREE.Mesh(leadGeo, leadMat);
    leadRight.rotation.z = Math.PI / 2;
    leadRight.position.x = 0.8;
    resGroup.add(leadLeft, leadRight);

    // Color bands
    const bandGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.1, 16);
    const band1 = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: valColor1 }));
    band1.rotation.z = Math.PI / 2;
    band1.position.x = -0.35;
    const band2 = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: valColor2 }));
    band2.rotation.z = Math.PI / 2;
    band2.position.x = -0.15;
    const band3 = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: multiplierColor }));
    band3.rotation.z = Math.PI / 2;
    band3.position.x = 0.1;
    const bandGold = new THREE.Mesh(bandGeo, new THREE.MeshBasicMaterial({ color: 0xd4af37 }));
    bandGold.rotation.z = Math.PI / 2;
    bandGold.position.x = 0.35;
    resGroup.add(band1, band2, band3, bandGold);

    return resGroup;
  };

  // Helper to create a Realistic 3D Jumper Wire with silver terminal pins
  const createPhysicalWire = (
    curve: THREE.Curve<THREE.Vector3>,
    colorHex: number,
    wireId: string
  ) => {
    const wireGroup = new THREE.Group();
    const tubeGeo = new THREE.TubeGeometry(curve, 36, 0.14, 8, false);
    const isSelected = selectedWire?.connection_id === wireId;

    const tubeMat = new THREE.MeshStandardMaterial({
      color: isSelected ? 0x06b6d4 : colorHex,
      roughness: 0.4,
      metalness: 0.1,
      emissive: isSelected ? 0x0891b2 : 0x000000,
      emissiveIntensity: isSelected ? 0.8 : 0.0,
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    tubeMesh.castShadow = true;
    (tubeMesh as any).wireId = wireId;
    wireGroup.add(tubeMesh);
    wireMeshesRef.current.set(wireId, tubeMesh);

    // Silver Terminal Pins at start and end
    const pinGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    const pinMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });

    const startPt = curve.getPoint(0);
    const pinStart = new THREE.Mesh(pinGeo, pinMat);
    pinStart.position.copy(startPt);
    pinStart.position.y -= 0.2;

    const endPt = curve.getPoint(1);
    const pinEnd = new THREE.Mesh(pinGeo, pinMat);
    pinEnd.position.copy(endPt);
    pinEnd.position.y -= 0.2;

    wireGroup.add(pinStart, pinEnd);
    return wireGroup;
  };

  // Setup Three.js Scene
  useEffect(() => {
    if (!mountRef.current) return;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0e17);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 36, 68);
    cameraRef.current = camera;

    // WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mountRef.current.appendChild(renderer.domElement);

    // Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.02;
    controls.minDistance = 10;
    controls.maxDistance = 160;
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.3);
    dirLight.position.set(25, 55, 35);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    const blueFill = new THREE.DirectionalLight(0x38bdf8, 0.6);
    blueFill.position.set(-35, 25, -25);
    scene.add(blueFill);

    // Workbench Mat
    const benchGeo = new THREE.BoxGeometry(94, 1.2, 54);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.85,
      metalness: 0.25,
    });
    const bench = new THREE.Mesh(benchGeo, benchMat);
    bench.position.set(0, -0.6, 0);
    bench.receiveShadow = true;
    scene.add(bench);

    // Grid Overlay
    const grid = new THREE.GridHelper(90, 45, 0x1e293d, 0x0f172a);
    grid.position.y = 0.02;
    scene.add(grid);

    const compMap = new Map<string, THREE.Group>();

    // -------------------------------------------------------------
    // 1. TRANSMITTER BREADBOARD & COMPONENTS (X = -26)
    // -------------------------------------------------------------
    const txGroup = new THREE.Group();
    txGroup.position.set(-26, 0, 0);

    const txBreadboard = createBreadboardMesh(true);
    txGroup.add(txBreadboard);

    // ESP32 TX Microcontroller Board (Plugs into left side of TX Breadboard)
    const espTxGroup = new THREE.Group();
    const espPcbMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.35 });
    const espTxPcb = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 13), espPcbMat);
    espTxPcb.position.set(-5, 2.2, 0);
    espTxPcb.castShadow = true;

    // Metal RF Shield Can
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0xd1d5db, metalness: 0.95, roughness: 0.15 });
    const shieldMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 5.5), shieldMat);
    shieldMesh.position.set(-5, 2.5, -2.5);

    // Header Pins entering breadboard holes
    const headerMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.5 });
    const headerLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 12), headerMat);
    headerLeft.position.set(-7.5, 1.5, 0);
    const headerRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 12), headerMat);
    headerRight.position.set(-2.5, 1.5, 0);

    espTxGroup.add(espTxPcb, shieldMesh, headerLeft, headerRight);
    compMap.set('comp-esp32-tx', espTxGroup);
    txGroup.add(espTxGroup);

    // 2N2222 NPN Transistor Driver (Plugs into Row 13-14-15 on TX Breadboard)
    const transGroup = new THREE.Group();
    const to92Mat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.2 });
    // TO-92 half-cylinder
    const to92Head = new THREE.Mesh(
      new THREE.CylinderGeometry(0.45, 0.45, 1.0, 16, 1, false, 0, Math.PI),
      to92Mat
    );
    to92Head.position.set(2, 2.4, 1);

    // 3 Silver Leads (Emitter, Base, Collector)
    const leadMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    for (let l = -1; l <= 1; l++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), leadMat);
      leg.position.set(2, 1.7, 1 + l * 0.35);
      transGroup.add(leg);
    }
    transGroup.add(to92Head);
    compMap.set('comp-2n2222', transGroup);
    txGroup.add(transGroup);

    // 1kΩ Base Resistor (R_base: Brown-Black-Red-Gold)
    const rBase = createResistorMesh(0x8b4513, 0x000000, 0xef4444);
    rBase.position.set(-0.2, 1.9, 1);
    txGroup.add(rBase);

    // High-Intensity Optical LED (Plugs into Row 18)
    const ledGroup = new THREE.Group();
    const ledMat = new THREE.MeshPhysicalMaterial({
      color: 0xfef08a,
      transmission: 0.8,
      opacity: 0.9,
      transparent: true,
      roughness: 0.1,
      emissive: ledOn ? 0xfef08a : 0x222222,
      emissiveIntensity: ledOn ? 1.6 : 0.05,
    });
    // 5mm Domed Optical LED
    const ledCyl = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 1.5, 16), ledMat);
    ledCyl.rotation.z = -Math.PI / 2;
    ledCyl.position.set(8.5, 3.2, 0);

    const ledDome = new THREE.Mesh(new THREE.SphereGeometry(0.7, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), ledMat);
    ledDome.rotation.z = -Math.PI / 2;
    ledDome.position.set(9.25, 3.2, 0);

    // LED Leads bent into Row 18
    const ledLead1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), leadMat);
    ledLead1.position.set(7.8, 2.2, 0.3);
    const ledLead2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), leadMat);
    ledLead2.position.set(7.8, 2.2, -0.3);

    ledGroup.add(ledCyl, ledDome, ledLead1, ledLead2);
    compMap.set('comp-high-intensity-led', ledGroup);
    txGroup.add(ledGroup);

    compMap.set('comp-tx-breadboard', txGroup);
    scene.add(txGroup);

    // -------------------------------------------------------------
    // 2. RECEIVER BREADBOARD & COMPONENTS (X = +26)
    // -------------------------------------------------------------
    const rxGroup = new THREE.Group();
    rxGroup.position.set(26, 0, 0);

    const rxBreadboard = createBreadboardMesh(false);
    rxGroup.add(rxBreadboard);

    // BPW34 PIN Photodiode (Plugs into Row 7 & 8 on RX Breadboard)
    const bpwGroup = new THREE.Group();
    const bpwBodyMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e1b4b,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
    });
    const bpwMesh = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.5, 1.3), bpwBodyMat);
    bpwMesh.position.set(-8.5, 3.2, 0);

    // Rectangular silicon active area (7.5 mm²)
    const siliconMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, metalness: 0.7, roughness: 0.1 });
    const siliconChip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.2, 1.0), siliconMat);
    siliconChip.position.set(-8.7, 3.2, 0);

    // Photodiode leads entering breadboard holes
    const bpwLead1 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), leadMat);
    bpwLead1.position.set(-8.3, 2.2, 0.3);
    const bpwLead2 = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 8), leadMat);
    bpwLead2.position.set(-8.3, 2.2, -0.3);

    bpwGroup.add(bpwMesh, siliconChip, bpwLead1, bpwLead2);
    compMap.set('comp-bpw34', bpwGroup);
    rxGroup.add(bpwGroup);

    // LM358 Dual Op-Amp IC (DIP-8 Package straddling center divider trough)
    const lmGroup = new THREE.Group();
    const dipBodyMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.3 });
    const dipBody = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.9, 1.8), dipBodyMat);
    dipBody.position.set(-1.5, 2.3, 0);

    // Pin 1 Index Notch
    const notchGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.9, 8, 1, false, 0, Math.PI);
    const notch = new THREE.Mesh(notchGeo, new THREE.MeshBasicMaterial({ color: 0x374151 }));
    notch.position.set(-2.9, 2.3, 0);
    notch.rotation.y = Math.PI / 2;

    // 8 Silver Metallic DIP Leads (Pins 1-4 and Pins 5-8)
    for (let p = 0; p < 4; p++) {
      const zOffset = (p - 1.5) * 0.55;
      // Pins 1-4 (Left side)
      const pinL = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), leadMat);
      pinL.position.set(-1.5 + zOffset, 1.7, 1.0);
      lmGroup.add(pinL);
      // Pins 5-8 (Right side)
      const pinR = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), leadMat);
      pinR.position.set(-1.5 - zOffset, 1.7, -1.0);
      lmGroup.add(pinR);
    }
    lmGroup.add(dipBody, notch);
    compMap.set('comp-lm358', lmGroup);
    rxGroup.add(lmGroup);

    // Feedback Resistor Rf (~1MΩ: Brown-Black-Green-Gold) bridging Pin 1 and Pin 2
    const rFeedback = createResistorMesh(0x8b4513, 0x000000, 0x22c55e);
    rFeedback.position.set(-4.5, 2.0, 0.5);
    rxGroup.add(rFeedback);

    // ESP32 RX Receiver Node (Plugs into right side of RX Breadboard)
    const espRxGroup = new THREE.Group();
    const espRxPcb = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.4, 13), espPcbMat);
    espRxPcb.position.set(5, 2.2, 0);
    espRxPcb.castShadow = true;

    const shieldRxMesh = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.5, 5.5), shieldMat);
    shieldRxMesh.position.set(5, 2.5, -2.5);

    const headerRxLeft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 12), headerMat);
    headerRxLeft.position.set(2.5, 1.5, 0);
    const headerRxRight = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.0, 12), headerMat);
    headerRxRight.position.set(7.5, 1.5, 0);

    espRxGroup.add(espRxPcb, shieldRxMesh, headerRxLeft, headerRxRight);
    compMap.set('comp-esp32-rx', espRxGroup);
    rxGroup.add(espRxGroup);

    compMap.set('comp-rx-breadboard', rxGroup);
    scene.add(rxGroup);

    // -------------------------------------------------------------
    // 3. OPTICAL CHANNEL & SG90 SERVO MECHANISM (Center X = 0)
    // -------------------------------------------------------------
    const servoGroup = new THREE.Group();
    servoGroup.position.set(0, 0, 4.5);

    // SG90 Blue Casing
    const sg90Mat = new THREE.MeshPhysicalMaterial({
      color: 0x0284c7,
      transparent: true,
      opacity: 0.85,
      roughness: 0.3,
    });
    const sg90Body = new THREE.Mesh(new THREE.BoxGeometry(3.6, 4.2, 2.0), sg90Mat);
    sg90Body.position.y = 2.1;
    servoGroup.add(sg90Body);

    // Servo Pivot & Flap
    const pivot = new THREE.Group();
    pivot.position.set(0, 4.3, 0);

    const hornMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const horn = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 3.2), hornMat);
    horn.position.set(0, 0, -1.2);
    pivot.add(horn);

    const flapMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9 });
    const flap = new THREE.Mesh(new THREE.BoxGeometry(0.35, 4.8, 6.0), flapMat);
    flap.position.set(0, -1.5, -3.2); // Extends directly into optical line of sight
    pivot.add(flap);
    flapMeshRef.current = flap;

    servoGroup.add(pivot);
    compMap.set('comp-sg90-servo', servoGroup);
    scene.add(servoGroup);

    // Visible Light Optical Beam Cone (LED -> BPW34)
    const beamLength = 34.5;
    const beamGeo = new THREE.CylinderGeometry(1.6, 0.8, beamLength, 32, 1, true);
    beamGeo.rotateZ(Math.PI / 2);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: ledOn ? (isBeamBlocked ? 0.06 : 0.35) : 0.0,
      side: THREE.DoubleSide,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 3.2, 0);
    beamMeshRef.current = beam;
    scene.add(beam);

    // Traveling Optical Photons / Signal Pulses
    const pulses: THREE.Mesh[] = [];
    for (let i = 0; i < 6; i++) {
      const pGeo = new THREE.SphereGeometry(0.35, 16, 16);
      const pMat = new THREE.MeshBasicMaterial({ color: 0xfef08a, transparent: true, opacity: 0.85 });
      const pMesh = new THREE.Mesh(pGeo, pMat);
      pMesh.position.set(-17 + i * 6.5, 3.2, 0);
      scene.add(pMesh);
      pulses.push(pMesh);
    }
    pulseSpheresRef.current = pulses;

    // -------------------------------------------------------------
    // 4. EVERY PHYSICAL JUMPER WIRE RENDERED IN 3D
    // -------------------------------------------------------------
    const wiresContainer = new THREE.Group();

    // 1. CONN-TX-01 (Yellow): ESP32 TX GPIO 23 -> 2N2222 Base Row 14
    const curveTx01 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-31, 2.5, 2.5),
      new THREE.Vector3(-28, 7.5, 4.0),
      new THREE.Vector3(-26, 6.5, 2.5),
      new THREE.Vector3(-24, 2.0, 1.0)
    );
    wiresContainer.add(createPhysicalWire(curveTx01, 0xeab308, 'CONN-TX-01'));

    // 2. CONN-TX-02 (Blue): 2N2222 Collector Row 15 -> LED Cathode Row 18
    const curveTx02 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-24, 2.2, 1.35),
      new THREE.Vector3(-22, 5.0, 1.8),
      new THREE.Vector3(-20, 5.0, 0.8),
      new THREE.Vector3(-18.2, 3.0, 0.3)
    );
    wiresContainer.add(createPhysicalWire(curveTx02, 0x3b82f6, 'CONN-TX-02'));

    // 3. CONN-TX-03 (Black): 2N2222 Emitter Row 13 -> GND Rail (-)
    const curveTx03 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-24, 2.2, 0.65),
      new THREE.Vector3(-24, 4.0, -1.5),
      new THREE.Vector3(-25, 3.5, -3.5),
      new THREE.Vector3(-26, 1.8, -4.6)
    );
    wiresContainer.add(createPhysicalWire(curveTx03, 0x1f2937, 'CONN-TX-03'));

    // 4. CONN-TX-04 (Red): VCC Rail (+) -> LED Anode Row 18
    const curveTx04 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-20, 1.8, 5.2),
      new THREE.Vector3(-19, 4.5, 3.5),
      new THREE.Vector3(-18.5, 4.5, 1.5),
      new THREE.Vector3(-18.2, 3.0, -0.3)
    );
    wiresContainer.add(createPhysicalWire(curveTx04, 0xef4444, 'CONN-TX-04'));

    // 5. CONN-TX-05 (Black): ESP32 TX GND -> GND Rail (-)
    const curveTx05 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-31, 2.5, -4.5),
      new THREE.Vector3(-30, 5.0, -4.6),
      new THREE.Vector3(-28, 4.0, -4.6),
      new THREE.Vector3(-26, 1.8, -4.6)
    );
    wiresContainer.add(createPhysicalWire(curveTx05, 0x1f2937, 'CONN-TX-05'));

    // 6. CONN-OPT-01, 02, 03: SG90 Ribbon Cable (Orange, Red, Brown)
    const curveServoSignal = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0, 2.5, 5.5),
      new THREE.Vector3(-4, 4.0, 7.0),
      new THREE.Vector3(-10, 3.5, 7.0),
      new THREE.Vector3(-16, 2.0, 4.0)
    );
    wiresContainer.add(createPhysicalWire(curveServoSignal, 0xf97316, 'CONN-OPT-01'));

    const curveServoPower = new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.3, 2.5, 5.5),
      new THREE.Vector3(-4, 3.8, 7.3),
      new THREE.Vector3(-10, 3.3, 7.3),
      new THREE.Vector3(-16, 1.8, 5.2)
    );
    wiresContainer.add(createPhysicalWire(curveServoPower, 0xef4444, 'CONN-OPT-02'));

    const curveServoGnd = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.3, 2.5, 5.5),
      new THREE.Vector3(-4, 3.6, 7.6),
      new THREE.Vector3(-10, 3.1, 7.6),
      new THREE.Vector3(-16, 1.8, -4.6)
    );
    wiresContainer.add(createPhysicalWire(curveServoGnd, 0x78350f, 'CONN-OPT-03'));

    // 7. CONN-RX-01 (White): BPW34 Anode Row 8 -> LM358 Pin 2 (Inverting Input)
    const curveRx01 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(17.7, 3.0, 0.3),
      new THREE.Vector3(20, 5.5, 1.5),
      new THREE.Vector3(22, 5.0, 1.2),
      new THREE.Vector3(24.5, 2.5, 1.0)
    );
    wiresContainer.add(createPhysicalWire(curveRx01, 0xf8fafc, 'CONN-RX-01'));

    // 8. CONN-RX-02 (Black): BPW34 Cathode Row 7 -> RX Ground Rail (-)
    const curveRx02 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(17.7, 3.0, -0.3),
      new THREE.Vector3(19, 4.5, -2.5),
      new THREE.Vector3(22, 3.5, -4.0),
      new THREE.Vector3(25, 1.8, -4.6)
    );
    wiresContainer.add(createPhysicalWire(curveRx02, 0x1f2937, 'CONN-RX-02'));

    // 9. CONN-RX-05 (Green): LM358 Pin 1 (Output) -> ESP32 RX GPIO 34 (ADC)
    const curveRx05 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(24.0, 2.5, 1.0),
      new THREE.Vector3(26, 7.5, 3.5),
      new THREE.Vector3(29, 6.5, 4.0),
      new THREE.Vector3(31, 2.5, 2.5)
    );
    wiresContainer.add(createPhysicalWire(curveRx05, 0x22c55e, 'CONN-RX-05'));

    // 10. CONN-RX-06 (Red): LM358 Pin 8 (VCC) -> RX Power Rail (+)
    const curveRx06 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(24.0, 2.5, -1.0),
      new THREE.Vector3(24, 4.5, -3.0),
      new THREE.Vector3(25, 3.5, -4.8),
      new THREE.Vector3(26, 1.8, -5.2)
    );
    wiresContainer.add(createPhysicalWire(curveRx06, 0xef4444, 'CONN-RX-06'));

    // 11. CONN-RX-07 (Black): LM358 Pin 4 (GND) -> RX Ground Rail (-)
    const curveRx07 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(25.5, 2.5, 1.0),
      new THREE.Vector3(25.5, 4.0, 3.0),
      new THREE.Vector3(25.8, 3.0, 4.2),
      new THREE.Vector3(26, 1.8, 4.6)
    );
    wiresContainer.add(createPhysicalWire(curveRx07, 0x1f2937, 'CONN-RX-07'));

    // 12. CONN-RX-08 (Black): ESP32 RX GND -> RX Ground Rail (-)
    const curveRx08 = new THREE.CubicBezierCurve3(
      new THREE.Vector3(31, 2.5, -4.5),
      new THREE.Vector3(29, 4.5, -4.6),
      new THREE.Vector3(27, 3.5, -4.6),
      new THREE.Vector3(26, 1.8, -4.6)
    );
    wiresContainer.add(createPhysicalWire(curveRx08, 0x1f2937, 'CONN-RX-08'));

    // 13. CONN-BENCH-01 (Long Black Bench Ground Tie across workbench)
    const curveBenchGnd = new THREE.CubicBezierCurve3(
      new THREE.Vector3(-26, 1.8, -4.6),
      new THREE.Vector3(-15, 3.0, -8.0),
      new THREE.Vector3(15, 3.0, -8.0),
      new THREE.Vector3(26, 1.8, -4.6)
    );
    wiresContainer.add(createPhysicalWire(curveBenchGnd, 0x111827, 'CONN-BENCH-01'));

    scene.add(wiresContainer);
    componentMeshesRef.current = compMap;

    // Raycaster for clicking wires and components
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check wire click
      const wireMeshes = Array.from(wireMeshesRef.current.values());
      const wireIntersects = raycaster.intersectObjects(wireMeshes, true);
      if (wireIntersects.length > 0) {
        const clickedMesh = wireIntersects[0].object as any;
        const wId = clickedMesh.wireId;
        const foundWire = connections.find((c) => c.connection_id === wId) || null;
        if (foundWire) {
          onSelectWire(foundWire);
          return;
        }
      }

      // Check component click
      for (const [compId, grp] of compMap.entries()) {
        const intersects = raycaster.intersectObjects(grp.children, true);
        if (intersects.length > 0) {
          const found = components.find((c) => c.id === compId) || null;
          onSelectComponent(found);
          return;
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // Animation Loop
    let animId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      controls.update();

      // Optical beam dynamic intensity
      if (beamMeshRef.current) {
        if (!ledOn) {
          (beamMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0;
        } else if (isBeamBlocked) {
          (beamMeshRef.current.material as THREE.MeshBasicMaterial).opacity = 0.05;
        } else {
          const osc = Math.sin(clock.getElapsedTime() * 8) * 0.08 + 0.35;
          (beamMeshRef.current.material as THREE.MeshBasicMaterial).opacity = osc;
        }
      }

      // Traveling optical photon pulses along LOS
      pulseSpheresRef.current.forEach((p) => {
        if (!ledOn || isBeamBlocked || !showSignalFlow) {
          p.visible = false;
        } else {
          p.visible = true;
          p.position.x += delta * 24.0;
          if (p.position.x > 17.5) {
            p.position.x = -17.5;
          }
        }
      });

      // Update servo flap rotation
      if (flapMeshRef.current) {
        const targetRot = (servoAngle * Math.PI) / 180;
        flapMeshRef.current.rotation.y = THREE.MathUtils.lerp(
          flapMeshRef.current.rotation.y,
          targetRot,
          0.1
        );
      }

      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      if (!mountRef.current) return;
      const w = mountRef.current.clientWidth;
      const h = mountRef.current.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [ledOn, isBeamBlocked]);

  // Update wire highlighting when selectedWire changes
  useEffect(() => {
    wireMeshesRef.current.forEach((mesh, wId) => {
      const isSelected = selectedWire?.connection_id === wId;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (isSelected) {
        mat.color.setHex(0x06b6d4);
        mat.emissive.setHex(0x0891b2);
        mat.emissiveIntensity = 0.9;
      } else {
        // Revert to original color
        const conn = connections.find((c) => c.connection_id === wId);
        const col = conn?.wire_color === 'Yellow' ? 0xeab308 :
                    conn?.wire_color === 'Blue' ? 0x3b82f6 :
                    conn?.wire_color === 'Red' ? 0xef4444 :
                    conn?.wire_color === 'Green' ? 0x22c55e :
                    conn?.wire_color === 'Orange' ? 0xf97316 :
                    conn?.wire_color === 'White' ? 0xf8fafc :
                    conn?.wire_color === 'Brown' ? 0x78350f : 0x1f2937;
        mat.color.setHex(col);
        mat.emissive.setHex(0x000000);
        mat.emissiveIntensity = 0;
      }
    });
  }, [selectedWire]);

  // Exploded View Assembly
  useEffect(() => {
    const compMap = componentMeshesRef.current;
    if (!compMap) return;

    const espTx = compMap.get('comp-esp32-tx');
    const led = compMap.get('comp-high-intensity-led');
    const servo = compMap.get('comp-sg90-servo');
    const bpw = compMap.get('comp-bpw34');
    const lm = compMap.get('comp-lm358');
    const espRx = compMap.get('comp-esp32-rx');

    if (exploded) {
      if (espTx) espTx.position.y = 8;
      if (led) led.position.x = 12;
      if (servo) servo.position.y = 9;
      if (bpw) bpw.position.x = -12;
      if (lm) lm.position.y = 6;
      if (espRx) espRx.position.y = 8;
    } else {
      if (espTx) espTx.position.y = 0;
      if (led) led.position.x = 0;
      if (servo) servo.position.y = 0;
      if (bpw) bpw.position.x = 0;
      if (lm) lm.position.y = 0;
      if (espRx) espRx.position.y = 0;
    }
  }, [exploded]);

  const toggleSpeech = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  // Animate Camera to Step in Professor Presentation Mode
  const goToPresentationStep = (idx: number) => {
    const step = presentationSteps[idx];
    if (!step || !cameraRef.current || !controlsRef.current) return;
    setCurrentStepIdx(idx);
    setPresentationMode(true);
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // Find and select the corresponding wire
    const targetWire = connections.find((c) => c.connection_id === step.wireId) || null;
    onSelectWire(targetWire);

    // Animate camera and controls target
    controlsRef.current.target.copy(step.targetPos);
    cameraRef.current.position.copy(step.camPos);
    controlsRef.current.update();
  };

  const nextStep = () => {
    if (currentStepIdx < presentationSteps.length - 1) {
      goToPresentationStep(currentStepIdx + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIdx > 0) {
      goToPresentationStep(currentStepIdx - 1);
    }
  };

  const resetCamera = () => {
    if (isSpeaking && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 36, 68);
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      onSelectWire(null);
      setPresentationMode(false);
    }
  };

  const activeStep = presentationSteps[currentStepIdx];
  const activeStepWire = connections.find((c) => c.connection_id === activeStep?.wireId) || null;

  return (
    <div className="space-y-4">
      {/* Quick Defense Steps Navigation Ribbon */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
        <span className="text-[11px] font-mono text-amber-400 font-bold px-2 flex items-center space-x-1.5 shrink-0">
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>CIRCUIT DEFENSE STEPS:</span>
        </span>
        <div className="flex flex-wrap items-center gap-1.5 flex-1">
          {presentationSteps.map((step, idx) => (
            <button
              key={step.wireId}
              onClick={() => goToPresentationStep(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition flex items-center space-x-1.5 ${
                currentStepIdx === idx && presentationMode
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-950/40 text-[10px] flex items-center justify-center font-bold">
                {step.stepNumber}
              </span>
              <span>{step.title.split(' ')[0]} {step.title.split(' ')[1] || ''}</span>
            </button>
          ))}
        </div>
        <button
          onClick={resetCamera}
          className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 ml-auto shrink-0"
        >
          Full Testbed View
        </button>
      </div>

      {/* 3D Canvas Box */}
      <div className="relative w-full h-[650px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
        <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Top Left Title & Live Mode */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/70 shadow-xl">
          <div className="w-3 h-3 rounded-full bg-cyan-400 animate-pulse" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">3D PHYSICAL WIRING LAB</h3>
            <p className="text-[11px] text-slate-400 font-mono">Real Breadboard Sockets, IC Pins &amp; Jumper Tubes</p>
          </div>
          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            CLICK ANY WIRE
          </span>
        </div>

        {/* Top Right Quick Toggles */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70">
          <button
            onClick={() => {
              const next = !presentationMode;
              setPresentationMode(next);
              if (next) goToPresentationStep(0);
              else resetCamera();
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow ${
              presentationMode
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-amber-500/20'
                : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{presentationMode ? 'Exit Walkthrough' : 'Professor Walkthrough Mode'}</span>
          </button>

          <button
            onClick={() => setExploded(!exploded)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              exploded ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="Explode Components into 10 Layers"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{exploded ? 'Collapse' : 'Explode'}</span>
          </button>

          <button
            onClick={resetCamera}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Reset Camera View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Bottom Floating Visual Toggles */}
        <div className="absolute bottom-4 left-6 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/70 shadow-2xl">
          <button
            onClick={() => setShowOpticalPath(!showOpticalPath)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              showOpticalPath ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Beam Cone</span>
          </button>

          <button
            onClick={() => setShowSignalFlow(!showSignalFlow)}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
              showSignalFlow ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Optical Pulses</span>
          </button>
        </div>

        {/* Bottom Right Live Hardware Status */}
        <div className="absolute bottom-4 right-6 z-10 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/70 text-xs font-mono space-y-1">
          <div className="flex items-center justify-between space-x-4">
            <span className="text-slate-400">Optical Emitter:</span>
            <span className={ledOn ? 'text-amber-400 font-bold' : 'text-slate-500'}>
              {ledOn ? '1000 bps OOK' : 'DARK'}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span className="text-slate-400">SG90 Occluder:</span>
            <span className={isBeamBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {isBeamBlocked ? `OCCLUDED (${servoAngle}°)` : `CLEAR (${servoAngle}°)`}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- PROFESSOR PRESENTATION WALKTHROUGH PANEL ---------------- */}
      {presentationMode && activeStep && (
        <div className="p-6 bg-slate-950 rounded-2xl border-2 border-amber-500/60 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold font-mono bg-amber-500 text-slate-950">
                STEP {activeStep.stepNumber} OF {presentationSteps.length}
              </span>
              <h4 className="text-base font-bold text-white tracking-wide">{activeStep.title}</h4>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => toggleSpeech(activeStep.script)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                  isSpeaking
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse'
                    : 'bg-slate-900 text-cyan-300 border-slate-700 hover:bg-slate-800'
                }`}
                title="Browser Text-to-Speech"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{isSpeaking ? 'Stop Audio' : 'Speak Aloud (TTS)'}</span>
              </button>
              <button
                onClick={prevStep}
                disabled={currentStepIdx === 0}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:bg-slate-800 disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
              <button
                onClick={nextStep}
                disabled={currentStepIdx === presentationSteps.length - 1}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 disabled:opacity-40 shadow-lg"
              >
                <span>Next Connection</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Script Box */}
          <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono font-bold uppercase">
              <Volume2 className="w-4 h-4" />
              <span>What to explain to your professor:</span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed font-sans font-medium">
              &quot;{activeStep.script}&quot;
            </p>
          </div>

          {/* Real Breadboard Hole and Hardware Verification Details for Active Step */}
          {activeStepWire && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs font-mono">
              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Breadboard Start Hole:</span>
                <span className="text-white font-bold block">{activeStepWire.source_pin}</span>
                <span className="text-cyan-300 block">{activeStepWire.source_location}</span>
                <span className="text-[11px] text-amber-300 block font-bold">
                  Hole: {activeStepWire.source_breadboard_hole || 'Header Pin'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Breadboard End Hole:</span>
                <span className="text-white font-bold block">{activeStepWire.destination_pin}</span>
                <span className="text-cyan-300 block">{activeStepWire.destination_location}</span>
                <span className="text-[11px] text-amber-300 block font-bold">
                  Hole: {activeStepWire.destination_breadboard_hole || 'Component Socket'}
                </span>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold">Physical Wire & Signal:</span>
                <span className="text-amber-400 font-bold block">{activeStepWire.signal_type}</span>
                <span className="text-slate-300 block">{activeStepWire.wire_color} ({activeStepWire.wire_type})</span>
                <span className="text-[11px] text-slate-400 block">{activeStepWire.voltage_if_verified || 'Verified Testbed Net'}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---------------- CLICKED WIRE DEEP-DIVE INSPECTION ---------------- */}
      {selectedWire && (
        <div className="p-6 bg-slate-950 rounded-2xl border border-cyan-500/40 shadow-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center space-x-2 font-mono">
                <span className="text-xs font-bold text-cyan-400">{selectedWire.connection_id}</span>
                <span className="text-slate-500">•</span>
                <span className="text-xs text-white font-bold">{selectedWire.wire_name || 'Physical Connection'}</span>
              </div>
              <h4 className="text-base font-bold text-white mt-1">
                {selectedWire.source_component} &rarr; {selectedWire.destination_component}
              </h4>
            </div>

            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold border ${
              selectedWire.status === 'DOCUMENTED HARDWARE'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : selectedWire.status === 'VERIFIED HARDWARE'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
            }`}>
              {selectedWire.status}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            {/* Origin */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Start Origin:</span>
              <span className="text-white font-bold block">{selectedWire.source_pin}</span>
              <span className="text-cyan-300 block">{selectedWire.source_location}</span>
              {selectedWire.source_breadboard_hole && (
                <span className="text-[11px] text-amber-300 block font-bold">
                  Hole: {selectedWire.source_breadboard_hole}
                </span>
              )}
            </div>

            {/* Destination */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Destination Socket:</span>
              <span className="text-white font-bold block">{selectedWire.destination_pin}</span>
              <span className="text-cyan-300 block">{selectedWire.destination_location}</span>
              {selectedWire.destination_breadboard_hole && (
                <span className="text-[11px] text-amber-300 block font-bold">
                  Hole: {selectedWire.destination_breadboard_hole}
                </span>
              )}
            </div>

            {/* Signal & Type */}
            <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Signal &amp; Wire:</span>
              <span className="text-amber-400 font-bold block">{selectedWire.signal_type}</span>
              <span className="text-slate-300 block">{selectedWire.wire_color} ({selectedWire.wire_type})</span>
              <span className="text-[11px] text-slate-400 block">{selectedWire.voltage_if_verified || '0-3.3V Logic'}</span>
            </div>
          </div>

          {/* Professor Script for this Wire */}
          {selectedWire.professor_explanation && (
            <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans space-y-1">
              <span className="text-cyan-400 font-bold font-mono block">
                How to explain this connection to your professor:
              </span>
              <p>{selectedWire.professor_explanation}</p>
            </div>
          )}

          <div className="pt-2 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Citation: {selectedWire.verification_source}</span>
            <button
              onClick={() => onSelectWire(null)}
              className="text-cyan-400 hover:underline"
            >
              Clear Wire Selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

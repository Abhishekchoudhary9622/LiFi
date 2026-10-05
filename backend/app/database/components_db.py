"""
SemLiFi Hardware Component Library Database.
Covers all 15 hardware elements of the physical testbed with in-depth engineering explanations.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel

class HardwareComponent(BaseModel):
    id: str
    name: str
    type: str                     # "Microcontroller", "Optoelectronic", "Discrete Semiconductor", "Amplifier IC", "Actuator", "Interconnect", "Passive"
    purpose: str
    inputs: str
    outputs: str
    connections: List[str]
    why_used: str
    how_it_works: str
    simulation_behavior: str
    datasheet_reference: str
    verification_status: str       # "DOCUMENTED HARDWARE" | "VERIFIED HARDWARE" | "SIMULATED" | "UNVERIFIED"
    layer_index: int              # For 3D exploded view (1 to 10)
    color: str

COMPONENTS_DATABASE: List[HardwareComponent] = [
    HardwareComponent(
        id="comp-esp32-tx",
        name="ESP32 Transmitter Node",
        type="Microcontroller",
        purpose="Performs telemetry packetization, sequence ID generation, CRC-8 Dallas/Maxim computation, Manchester encoding, and drives GPIO 23 for OOK modulation.",
        inputs="Telemetry strings, application telemetry stream, USB 5V.",
        outputs="GPIO 23 digital square-wave at 1000 bps (1000 µs bit period) Manchester-coded OOK.",
        connections=["GPIO 23 -> 2N2222 Base", "GND -> TX Breadboard GND Bus", "USB -> 5V Power / Serial Console"],
        why_used="Provides high-precision microsecond hardware timers, versatile GPIOs, and dual-core processing at low cost.",
        how_it_works="The firmware encodes bytes into Manchester bit-halves (500 µs chip time) and toggles GPIO 23 with microsecond timer interrupts.",
        simulation_behavior="Emulates packet generation, sequence increments, Dallas/Maxim CRC-8 calculation, and chip-level serialization.",
        datasheet_reference="Espressif ESP32-WROOM-32D Datasheet, 240 MHz Xtensa LX6 dual-core",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=1,
        color="#3b82f6"
    ),
    HardwareComponent(
        id="comp-tx-breadboard",
        name="Transmitter Solderless Breadboard",
        type="Prototyping Platform",
        purpose="Provides solderless electrical tie points, distribution power rails (+ and -), and mounting for the LED driver circuit.",
        inputs="Jumper wire leads and component legs.",
        outputs="Interconnected electrical nodes along rows and power rails.",
        connections=["TX Bus (+) -> LED Anode", "TX Bus (-) -> 2N2222 Emitter & ESP32 GND"],
        why_used="Enables non-destructive circuit prototyping, debugging, and transparent visual inspection of optical transmitter stages.",
        how_it_works="Internal spring clips join groups of 5 tie-points across terminal strips with continuous horizontal power buses.",
        simulation_behavior="Models electrical node continuity, contact resistance (ideal 0.05Ω), and parasitic capacitance.",
        datasheet_reference="Standard 830-point solderless breadboard with dual power rails",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=2,
        color="#e2e8f0"
    ),
    HardwareComponent(
        id="comp-2n2222",
        name="2N2222 NPN BJT Transistor Driver",
        type="Discrete Semiconductor",
        purpose="Acts as an optical current switch to sink high currents (>100mA) through the high-intensity LED without exceeding the ESP32 GPIO 12mA current limit.",
        inputs="Base current from ESP32 GPIO 23 via base resistor.",
        outputs="Collector switched current to ground.",
        connections=["Base -> GPIO 23 via base resistor", "Collector -> LED Cathode", "Emitter -> GND Rail"],
        why_used="ESP32 GPIO pins can supply at most ~12-20mA; high-intensity LiFi LEDs require high pulse currents to achieve sufficient optical irradiance at the photodiode.",
        how_it_works="When GPIO 23 is HIGH (3.3V), base-emitter junction conducts, driving the transistor into saturation (V_CE_sat ~0.2V) and turning ON the LED. When LOW, transistor is in cutoff.",
        simulation_behavior="Models saturation switching delay (~15ns), forward beta h_FE (~100-300), and V_CE drop.",
        datasheet_reference="Fairchild / ON Semi 2N2222A NPN Silicon Planar Transistor (TO-92)",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=3,
        color="#1e293b"
    ),
    HardwareComponent(
        id="comp-led-driver-circuit",
        name="Transistor LED Driver Circuit",
        type="Discrete Semiconductor / Driver",
        purpose="Provides current stabilization and fast on/off switching for the optical transmitter emitter.",
        inputs="3.3V logic level from ESP32 GPIO 23.",
        outputs="Pulsed current through optical emitter.",
        connections=["Base resistor to GPIO 23", "Collector to LED Cathode", "Emitter to GND"],
        why_used="Essential interface between digital CMOS logic and physical optical power emission.",
        how_it_works="Translates low-power digital voltage transitions into fast optical pulse trains.",
        simulation_behavior="Generates simulated optical power output P_opt(t) proportional to collector current.",
        datasheet_reference="SemLiFi Paper Section IV-A: 'transistor-based LED driver'",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=3,
        color="#64748b"
    ),
    HardwareComponent(
        id="comp-high-intensity-led",
        name="High-Intensity Visible Light LED",
        type="Optoelectronic Emitter",
        purpose="Converts electrical current pulses into visible photons (optical beam) directed along the line-of-sight path toward the receiver photodiode.",
        inputs="Switched collector current from 2N2222 driver.",
        outputs="Lambertian visible light optical beam (~450-650nm, white/visible spectrum).",
        connections=["Anode (+) -> VCC Rail", "Cathode (-) -> 2N2222 Collector"],
        why_used="Forms the visible light communication (LiFi) optical transmission medium without requiring RF radiation.",
        how_it_works="Direct bandgap semiconductor recombination produces photons proportional to injected forward current I_F.",
        simulation_behavior="Simulates optical pulse emission with Lambertian radiant intensity distribution I(theta) = I_0 * cos^m(theta).",
        datasheet_reference="SemLiFi Paper Section IV-A: 'high-intensity LED, GPIO 23, OOK'",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=4,
        color="#fbbf24"
    ),
    HardwareComponent(
        id="comp-optical-channel",
        name="Line-of-Sight Optical Channel",
        type="Propagation Medium",
        purpose="Free-space line-of-sight (LOS) propagation medium through which optical pulses travel from transmitter LED to photodiode receiver.",
        inputs="Transmitted optical flux from high-intensity LED.",
        outputs="Attenuated optical irradiance E_e (W/m^2) arriving at the photodiode active area.",
        connections=["Free space path between TX LED and RX BPW34 (~20-50 cm bench distance)"],
        why_used="The defining physical medium of optical wireless communication (OWC / LiFi).",
        how_it_works="Photons travel along LOS path with inverse-square geometric attenuation and cosine incidence angles.",
        simulation_behavior="Calculates path loss H_LOS = (A_det / d^2) * R(phi) * T(psi) * g(psi) * cos(psi).",
        datasheet_reference="SemLiFi Paper Section IV-A: 'Line-of-Sight Optical Link'",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=5,
        color="#38bdf8"
    ),
    HardwareComponent(
        id="comp-sg90-servo",
        name="SG90 Micro Servo Motor",
        type="Actuator",
        purpose="Drives an opaque physical occluder/flap into the optical beam path to produce repeatable, empirical contiguous burst losses.",
        inputs="50 Hz PWM signal (1.0ms - 2.0ms pulse width), 5V DC power.",
        outputs="Rotary mechanical motion (0° to 180° swing of the optical flap).",
        connections=["Signal (Orange) -> Controller PWM", "VCC (Red) -> +5V Rail", "GND (Brown) -> GND Rail"],
        why_used="Replaces uncontrolled, erratic manual hand waving with consistent, calibrated burst durations (P1 15-40ms, P2 150-380ms, P3 mixed).",
        how_it_works="Internal potentiometer and error amplifier control a DC motor and reduction geartrain to track target angular position.",
        simulation_behavior="Simulates angular trajectory theta(t) with mechanical slew rate limit (~0.10s / 60 degrees).",
        datasheet_reference="TowerPro SG90 9g Micro Servo Specifications",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=6,
        color="#0284c7"
    ),
    HardwareComponent(
        id="comp-optical-flap",
        name="Optical Flap / Occluder",
        type="Mechanical Obstruction",
        purpose="Physically blocks visible light photons between LED and photodiode to generate real physical burst loss events.",
        inputs="Mechanical angular deflection from SG90 servo horn.",
        outputs="Contiguous shadow / blockage of optical line-of-sight.",
        connections=["Mounted directly on SG90 servo horn"],
        why_used="Creates authentic optical burst erasure in the physical layer rather than injecting synthetic software bit flips.",
        how_it_works="Opaque material cuts the beam waist, dropping received optical power below detection threshold.",
        simulation_behavior="Modulates channel availability A(t) in {0, 1} based on flap intersection with beam cone.",
        datasheet_reference="SemLiFi Paper Section IV-A: 'SG90 servo-controlled flap is positioned between optical transmitter and receiver'",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=6,
        color="#475569"
    ),
    HardwareComponent(
        id="comp-bpw34",
        name="BPW34 Silicon PIN Photodiode",
        type="Optoelectronic Detector",
        purpose="Detects incoming visible optical pulses and converts optical photons into minute electrical photocurrents.",
        inputs="Incident optical irradiance (430nm - 1100nm peak sensitivity ~850-900nm, visible response).",
        outputs="Reverse photocurrent I_photo (nanoamps to microamps scale).",
        connections=["Anode (+) -> LM358 Inverting Input Pin 2", "Cathode (-) -> Bias / Virtual Ground"],
        why_used="Large active radiant sensitive area (7.5 mm^2), high speed (t_r = 20ns), miniature DIP/SMD package ideal for educational and testbed LiFi receivers.",
        how_it_works="Photons with energy greater than silicon bandgap create electron-hole pairs in the intrinsic depletion region, swept by internal electric field.",
        simulation_behavior="Models responsivity R_lambda (~0.55 A/W at visible/NIR), dark current (~2nA), and junction capacitance (~25pF).",
        datasheet_reference="Vishay Semiconductors BPW34 Silicon PIN Photodiode Datasheet",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=7,
        color="#9333ea"
    ),
    HardwareComponent(
        id="comp-lm358",
        name="LM358 Operational Amplifier (TIA)",
        type="Amplifier IC",
        purpose="Converts the low-level microamp photocurrent from BPW34 into a clean, measurable analog voltage signal (0V to ~1.2V) for the ESP32 ADC.",
        inputs="Photocurrent into inverting pin 2; reference bias on pin 3; VCC pin 8, GND pin 4.",
        outputs="Amplified output voltage on Pin 1 (OUT1) routed to ESP32 GPIO 34.",
        connections=["Pin 1 (OUT1) -> ESP32 GPIO 34", "Pin 2 (IN1-) -> BPW34 Anode", "Pin 4 -> GND", "Pin 8 -> VCC"],
        why_used="Standard, accessible dual op-amp capable of single-supply operation down to ground rail (V_EE = 0V).",
        how_it_works="Feedback resistor Rf forces output voltage V_out = -I_photo * Rf + V_ref, translating current to voltage.",
        simulation_behavior="Calculates output voltage with op-amp slew rate (0.5 V/µs), gain-bandwidth product (1 MHz), and rail saturation limits.",
        datasheet_reference="Texas Instruments LM358 Low-Power Dual Operational Amplifier Datasheet",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=8,
        color="#a855f7"
    ),
    HardwareComponent(
        id="comp-rx-breadboard",
        name="Receiver Solderless Breadboard",
        type="Prototyping Platform",
        purpose="Provides mounting and tie points for BPW34 photodiode, LM358 TIA IC, feedback loop components, and ADC routing.",
        inputs="Analog signal leads, power jumpers, and ground ties.",
        outputs="Conditioned analog optical voltage fed into ESP32 receiver.",
        connections=["RX Bus (+) -> LM358 VCC", "RX Bus (-) -> Common Ground", "Row 6 -> ESP32 GPIO 34"],
        why_used="Facilitates tidy organization of sensitive low-noise analog optical front-end circuitry.",
        how_it_works="Spring clips maintain low-impedance contact between photodiode leads and op-amp inputs.",
        simulation_behavior="Models breadboard stray capacitance (~2-5pF between adjacent rows).",
        datasheet_reference="Standard 830-point solderless breadboard",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=9,
        color="#cbd5e1"
    ),
    HardwareComponent(
        id="comp-esp32-rx",
        name="ESP32 Receiver Node",
        type="Microcontroller",
        purpose="Samples optical analog voltage on GPIO 34 (ADC1_CH6) with mid-bit window, slices signal at ~50 counts, decodes Manchester, parses frames, and runs burst detection.",
        inputs="Analog voltage signal from LM358 Pin 1 on GPIO 34.",
        outputs="Decoded frame stream, burst metadata, CRC-8 validation, and selective NACK requests.",
        connections=["GPIO 34 -> LM358 Pin 1", "GND -> RX Breadboard GND Bus", "USB -> Serial Console / Backend"],
        why_used="Features on-board 12-bit SAR ADC, microsecond hardware timers, and sufficient memory to buffer and process frames.",
        how_it_works="Samples ADC in a 450-550 µs mid-bit window to avoid transition edges; slices logic 1 if ADC >= 50, else logic 0.",
        simulation_behavior="Simulates 12-bit ADC quantization, 0-4095 range scaled to documented 0-176 counts, and mid-bit window jitter.",
        datasheet_reference="SemLiFi Paper Section IV-A: 'followed by an ESP32 ADC input identified as GPIO 34' & Table II",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=10,
        color="#2563eb"
    ),
    HardwareComponent(
        id="comp-resistors-passives",
        name="Passive Resistors & Feedback Components",
        type="Passive",
        purpose="Includes 2N2222 base resistor (R_base), LED current limiter (R_LED), and LM358 transimpedance feedback network (R_f, C_f).",
        inputs="Current / Voltage signals.",
        outputs="Scaled current / voltage according to Ohm's Law (V = IR).",
        connections=["R_base in series with GPIO 23", "R_f across LM358 pins 1 & 2", "R_LED in series with LED"],
        why_used="Essential for circuit biasing, current regulation, and stable transimpedance gain.",
        how_it_works="Resistive elements dissipate excess voltage and convert current to voltage.",
        simulation_behavior="R_f ~ 500kΩ gives ~100-180 ADC counts under full illumination.",
        datasheet_reference="Connection not verified — requires hardware schematic/photo for exact resistor values.",
        verification_status="UNVERIFIED",
        layer_index=3,
        color="#78716c"
    ),
    HardwareComponent(
        id="comp-power-rails",
        name="DC Power Distribution Rails",
        type="Power Distribution",
        purpose="Distributes clean DC power (+5V, +3.3V) and common reference ground across both breadboards.",
        inputs="USB 5V supply from PC / Bench power supply.",
        outputs="Regulated 3.3V and 5.0V buses.",
        connections=["Red Bus -> VCC (+)", "Blue Bus -> GND (-)"],
        why_used="Maintains consistent supply voltages and prevents ground loops between optical transmitter and receiver.",
        how_it_works="Conductive copper rails bridge all columns on breadboard edges.",
        simulation_behavior="Models steady DC voltage with minimal ripple (<20mV).",
        datasheet_reference="Standard testbed bench power distribution",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=2,
        color="#dc2626"
    ),
    HardwareComponent(
        id="comp-jumper-wires",
        name="Dupont Jumper Wires",
        type="Interconnect",
        purpose="Routes signals, power, and ground between ESP32 headers, breadboard tie-points, and actuators.",
        inputs="Male / female header pins.",
        outputs="Direct electrical connection.",
        connections=["24 AWG multi-strand jumper wires (Yellow, Green, Red, Black, Blue, Orange, White)"],
        why_used="Standard prototyping wiring providing flexibility and modularity.",
        how_it_works="Copper conductor wrapped in PVC insulation connects points A and B.",
        simulation_behavior="Models ideal wire conductors with visual color-coding in 3D and 2D views.",
        datasheet_reference="Standard 24 AWG Dupont jumper wire specifications",
        verification_status="DOCUMENTED HARDWARE",
        layer_index=2,
        color="#eab308"
    ),
]

def get_all_hardware_components() -> List[HardwareComponent]:
    return COMPONENTS_DATABASE

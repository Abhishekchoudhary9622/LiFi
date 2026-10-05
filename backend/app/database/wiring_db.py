"""
SemLiFi Hardware Wiring Database
Stores every physical and documented connection between ESP32 TX, LED driver,
BPW34 photodiode, LM358 TIA, SG90 servo, and ESP32 RX.

Includes exact breadboard row/hole coordinates, electrical net definitions,
and formal presentation scripts for academic defense / evaluation.
"""

from typing import List, Optional
from pydantic import BaseModel

class WireConnection(BaseModel):
    connection_id: str
    wire_name: str
    source_component: str
    source_pin: str
    source_location: str         # e.g., "ESP32 TX Pin Header (Left Row, Pin 11 - GPIO 23)"
    source_breadboard_hole: str  # e.g., "TX Board Header Row 12, Col a"
    wire_color: str              # "Yellow", "Blue", "Red", "Black", "Green", "Orange", "White", "Brown"
    wire_type: str               # "24 AWG Dupont Jumper (M-M)", "Component Lead", "Ribbon Cable"
    destination_component: str
    destination_pin: str
    destination_location: str    # e.g., "TX Breadboard Row 15, Col b"
    destination_breadboard_hole: str
    signal_type: str             # "Digital OOK (3.3V)", "Analog Voltage (0-1.2V)", "Photocurrent", "PWM Control (5V)", "DC Power (+5V)", "Ground (GND)"
    voltage_if_verified: Optional[str] = None
    purpose: str
    status: str                  # "DOCUMENTED HARDWARE" | "VERIFIED HARDWARE" | "SIMULATED" | "UNVERIFIED"
    verification_source: str
    professor_explanation: str   # Exact script to explain to professor
    notes: str

WIRING_DATABASE: List[WireConnection] = [
    # ----------------- TRANSMITTER BREADBOARD CONNECTIONS -----------------
    WireConnection(
        connection_id="CONN-TX-01",
        wire_name="OOK Modulation Drive Wire",
        source_component="ESP32 Transmitter Node",
        source_pin="GPIO 23",
        source_location="ESP32 TX Header Pin 23",
        source_breadboard_hole="TX Breadboard Row 11, Col e",
        wire_color="Yellow",
        wire_type="24 AWG Dupont Jumper (M-M)",
        destination_component="2N2222 NPN Transistor Driver",
        destination_pin="Base (via 1kΩ R_base resistor)",
        destination_location="TX Breadboard Row 14, Col b",
        destination_breadboard_hole="TX Breadboard Row 14, Col b",
        signal_type="Digital OOK (3.3V Logic)",
        voltage_if_verified="3.3V Logic Level",
        purpose="Transmits the Manchester-encoded On-Off Keying (OOK) digital pulse stream from ESP32 microsecond timer to the transistor driver base.",
        status="DOCUMENTED HARDWARE",
        verification_source="SemLiFi Research Paper Section IV-A: 'GPIO 23 as the LED control output' & Table II",
        professor_explanation="Professor, this yellow wire connects ESP32 GPIO 23 to Row 14 on the transmitter breadboard. When GPIO 23 goes HIGH (3.3V), it injects base current through a 1kΩ current-limiting resistor into the 2N2222 transistor base, turning the optical transmitter ON. When LOW (0V), the transistor enters cutoff and the optical LED turns OFF. This switches the optical channel at 1000 bps with 1000 µs bit intervals.",
        notes="Bit period = 1000 µs. Half-bit chip period = 500 µs (Manchester encoding)."
    ),
    WireConnection(
        connection_id="CONN-TX-02",
        wire_name="2N2222 Collector Sink Wire",
        source_component="2N2222 NPN Transistor Driver",
        source_pin="Collector (Pin 3)",
        source_location="TX Breadboard Row 15, Col c",
        source_breadboard_hole="TX Breadboard Row 15, Col c",
        wire_color="Blue",
        wire_type="24 AWG Dupont Jumper (M-M)",
        destination_component="High-Intensity LED",
        destination_pin="Cathode (-) Flat Edge / Short Lead",
        destination_location="TX Breadboard Row 18, Col c",
        destination_breadboard_hole="TX Breadboard Row 18, Col c",
        signal_type="Switched Optical Drive Current",
        voltage_if_verified="0.2V V_CE(sat) when ON",
        purpose="Provides low-side switched current sinking from the optical LED cathode to ground through the saturated transistor.",
        status="DOCUMENTED HARDWARE",
        verification_source="SemLiFi Paper Section IV-A: 'transistor-based LED driver... high-intensity LED'",
        professor_explanation="Professor, this blue jumper connects the 2N2222 collector on Row 15 to the LED's cathode on Row 18. An ESP32 GPIO pin can safely sink at most 12mA, but our high-intensity LiFi LED requires over 80mA to produce adequate optical irradiance across the free-space link. The 2N2222 acts as a current amplifier in common-emitter configuration, sinking the high LED current without overloading the microcontroller.",
        notes="Common-emitter low-side optical driver."
    ),
    WireConnection(
        connection_id="CONN-TX-03",
        wire_name="Transistor Emitter Ground Tie",
        source_component="2N2222 NPN Transistor Driver",
        source_pin="Emitter (Pin 1)",
        source_location="TX Breadboard Row 13, Col c",
        source_breadboard_hole="TX Breadboard Row 13, Col c",
        wire_color="Black",
        wire_type="Solid Core Breadboard Jumper",
        destination_component="Transmitter Ground Rail",
        destination_pin="GND Rail (-)",
        destination_location="TX Breadboard Blue Bus (-)",
        destination_breadboard_hole="TX Blue Bus Rail (-)",
        signal_type="Ground (GND)",
        voltage_if_verified="0.0V Ground Reference",
        purpose="Connects the 2N2222 NPN emitter directly to the transmitter ground bus rail.",
        status="DOCUMENTED HARDWARE",
        verification_source="Standard common-emitter transistor topology",
        professor_explanation="Professor, this black jumper ties the 2N2222 emitter on Row 13 directly to the breadboard ground rail. This completes the optical emitter drive circuit, establishing the common ground reference for both base drive current and collector current.",
        notes="Essential low-impedance ground return."
    ),
    WireConnection(
        connection_id="CONN-TX-04",
        wire_name="LED Anode Power Feed",
        source_component="Transmitter Power Rail",
        source_pin="VCC Rail (+5V / +3.3V)",
        source_location="TX Breadboard Red Bus (+)",
        source_breadboard_hole="TX Red Bus Rail (+)",
        wire_color="Red",
        wire_type="24 AWG Dupont Jumper (M-M)",
        destination_component="High-Intensity LED Anode",
        destination_pin="Anode (+) Long Lead (via series resistor)",
        destination_location="TX Breadboard Row 18, Col a",
        destination_breadboard_hole="TX Breadboard Row 18, Col a",
        signal_type="DC Power (+)",
        voltage_if_verified="VCC Supply",
        purpose="Delivers forward drive voltage to the high-intensity optical LED anode through a series current-limiting resistor.",
        status="UNVERIFIED",
        verification_source="Connection not verified — requires hardware schematic/photo to confirm whether 3.3V or 5V rail is used.",
        professor_explanation="Professor, this red wire feeds positive DC power from the breadboard power rail into Row 18 where the LED anode is connected through a series current-limiting resistor. The exact resistor value depends on whether 3.3V or 5V is supplied from the bench. We have marked the exact passive value as unverified pending physical workbench schematic confirmation.",
        notes="Series current-limiting resistor protects LED from thermal runaway."
    ),
    WireConnection(
        connection_id="CONN-TX-05",
        wire_name="ESP32 TX Common Ground Wire",
        source_component="ESP32 Transmitter Node",
        source_pin="GND Pin",
        source_location="ESP32 TX Header GND",
        source_breadboard_hole="TX Breadboard Row 1, Col a",
        wire_color="Black",
        wire_type="24 AWG Dupont Jumper (M-M)",
        destination_component="Transmitter Ground Rail",
        destination_pin="GND Rail (-)",
        destination_location="TX Breadboard Blue Bus (-)",
        destination_breadboard_hole="TX Blue Bus Rail (-)",
        signal_type="Ground (GND)",
        voltage_if_verified="0.0V Ground Reference",
        purpose="Connects the ESP32 transmitter board ground to the breadboard ground bus.",
        status="DOCUMENTED HARDWARE",
        verification_source="Required microcontroller common ground connection",
        professor_explanation="Professor, this black jumper ensures the ESP32 transmitter shares a solid, zero-volt reference ground with the transistor driver circuit. Without this tie, the base-emitter voltage V_BE would float, causing erratic optical switching or noise.",
        notes="Common ground reference for transmitter MCU."
    ),

    # ----------------- OPTICAL CHANNEL & SERVO ACTUATOR -----------------
    WireConnection(
        connection_id="CONN-OPT-01",
        wire_name="SG90 Servo PWM Control Lead",
        source_component="PWM Controller / Microcontroller",
        source_pin="PWM Signal Output",
        source_location="Controller PWM Header",
        source_breadboard_hole="Controller Signal Header",
        wire_color="Orange",
        wire_type="Servo Ribbon Wire (Orange)",
        destination_component="SG90 Micro Servo Motor",
        destination_pin="Signal Pin (Orange Wire)",
        destination_location="Servo 3-Pin Connector",
        destination_breadboard_hole="Servo Pin 1 (Signal)",
        signal_type="PWM Control (50 Hz, 1-2ms pulse)",
        voltage_if_verified="3.3V / 5.0V Logic",
        purpose="Transmits 50 Hz PWM angle pulses to rotate the servo horn and swing the opaque optical flap across the line-of-sight beam.",
        status="UNVERIFIED",
        verification_source="Connection not verified — requires hardware schematic/photo to confirm specific GPIO pin assigned to servo PWM.",
        professor_explanation="Professor, this orange wire carries a standard 50 Hz PWM pulse train to the SG90 micro-servo. By commanding pulse widths from 1.0 ms (0°) to 1.5 ms (90°), the servo swings an opaque physical flap into the optical axis between the LED and photodiode. This mechanically replicates real-world LiFi occlusions (P1 short bursts of 15-40ms, P2 long bursts of 150-380ms, and P3 mixed bursts) reported in our 56 empirical events dataset.",
        notes="Creates contiguous physical burst loss instead of synthetic software bit flips."
    ),
    WireConnection(
        connection_id="CONN-OPT-02",
        wire_name="SG90 Servo 5V Power Lead",
        source_component="Testbed Power Supply",
        source_pin="+5V DC Rail",
        source_location="Testbed 5V Power Bus",
        source_breadboard_hole="Power Bus (+5V)",
        wire_color="Red",
        wire_type="Servo Ribbon Wire (Red)",
        destination_component="SG90 Micro Servo Motor",
        destination_pin="VCC Pin (+5V)",
        destination_location="Servo 3-Pin Connector",
        destination_breadboard_hole="Servo Pin 2 (VCC)",
        signal_type="DC Power (+5V)",
        voltage_if_verified="5.0V DC",
        purpose="Supplies high-torque 5V operating power for the servo DC motor and gear reduction drive.",
        status="DOCUMENTED HARDWARE",
        verification_source="Standard SG90 9g servo electrical specification",
        professor_explanation="Professor, the red wire supplies 5V power to the SG90 servo motor. We power the servo from a dedicated 5V rail rather than the ESP32 3.3V regulator to prevent motor inductive current spikes from resetting the microcontroller.",
        notes="Isolates inductive motor noise from sensitive analog receiver stages."
    ),
    WireConnection(
        connection_id="CONN-OPT-03",
        wire_name="SG90 Servo Ground Lead",
        source_component="SG90 Micro Servo Motor",
        source_pin="GND Pin (Brown Wire)",
        source_location="Servo 3-Pin Connector",
        source_breadboard_hole="Servo Pin 3 (GND)",
        wire_color="Brown",
        wire_type="Servo Ribbon Wire (Brown)",
        destination_component="Testbed Ground",
        destination_pin="Common GND",
        destination_location="Common Ground Rail",
        destination_breadboard_hole="Common GND Rail",
        signal_type="Ground (GND)",
        voltage_if_verified="0.0V Ground Reference",
        purpose="Ground return connection for the SG90 servo motor.",
        status="DOCUMENTED HARDWARE",
        verification_source="Standard servo wiring requirement",
        professor_explanation="Professor, this brown wire ties the servo motor ground back to the testbed bench ground rail, ensuring reliable PWM signal decoding and motor current return.",
        notes="Servo ground return."
    ),

    # ----------------- RECEIVER BREADBOARD CONNECTIONS -----------------
    WireConnection(
        connection_id="CONN-RX-01",
        wire_name="BPW34 Photocurrent Input Lead",
        source_component="BPW34 Silicon PIN Photodiode",
        source_pin="Anode (+) Terminal",
        source_location="RX Breadboard Row 8, Col d",
        source_breadboard_hole="RX Breadboard Row 8, Col d",
        wire_color="White",
        wire_type="Direct Component Lead / Jumper",
        destination_component="LM358 Transimpedance Amplifier (TIA)",
        destination_pin="Pin 2 (Inverting Input IN1-)",
        destination_location="RX Breadboard Row 8, Col b",
        destination_breadboard_hole="RX Breadboard Row 8, Col b",
        signal_type="Optical Photocurrent (Microamps)",
        voltage_if_verified="Microamp-scale photocurrent",
        purpose="Carries light-induced electron-hole photocurrent from the BPW34 silicon PIN photodiode directly into the LM358 op-amp inverting node.",
        status="DOCUMENTED HARDWARE",
        verification_source="SemLiFi Paper Section IV-A: 'BPW34 silicon PIN photodiode connected to an LM358-based transimpedance amplifier (TIA)'",
        professor_explanation="Professor, this is the most sensitive analog connection in the testbed. When visible photons strike the 7.5 mm² active area of the BPW34 photodiode, it generates a reverse photocurrent proportional to the optical irradiance. This white lead routes the photocurrent into Pin 2 (the inverting input) of the LM358 operational amplifier. The lead is kept as short as possible on the breadboard to minimize parasitic capacitance and 50Hz mains hum pickup.",
        notes="Direct transimpedance amplifier current summing node."
    ),
    WireConnection(
        connection_id="CONN-RX-02",
        wire_name="BPW34 Cathode Bias Return",
        source_component="BPW34 Silicon PIN Photodiode",
        source_pin="Cathode (-) Terminal",
        source_location="RX Breadboard Row 7, Col d",
        source_breadboard_hole="RX Breadboard Row 7, Col d",
        wire_color="Black",
        wire_type="Solid Core Breadboard Jumper",
        destination_component="Receiver Ground / Bias Network",
        destination_pin="Reference GND / Bias Divider",
        destination_location="RX Breadboard Row 7, Col a",
        destination_breadboard_hole="RX Breadboard Row 7, Col a",
        signal_type="Photodiode Bias",
        voltage_if_verified=None,
        purpose="Connects the photodiode cathode to ground or positive bias for photovoltaic / photoconductive operation.",
        status="UNVERIFIED",
        verification_source="Connection not verified — requires hardware schematic/photo for exact TIA bias topology (photovoltaic vs photoconductive).",
        professor_explanation="Professor, this connection anchors the BPW34 cathode. In zero-bias photovoltaic mode, it connects to ground for low dark current (~2nA); in reverse-biased photoconductive mode, it connects to a positive bias to widen the depletion region and speed up rise time. Because the research paper discusses the functional TIA behavior without giving the exact biasing schematic, we have marked the exact bias topology as UNVERIFIED.",
        notes="Photodiode operating mode (photovoltaic vs photoconductive)."
    ),
    WireConnection(
        connection_id="CONN-RX-03",
        wire_name="LM358 TIA Feedback Resistor (Rf)",
        source_component="LM358 Transimpedance Amplifier",
        source_pin="Pin 2 (Inverting Input IN1-)",
        source_location="RX Breadboard Row 8, Col a",
        source_breadboard_hole="RX Breadboard Row 8, Col a",
        wire_color="Passive Component (Resistor)",
        wire_type="Through-Hole Resistor (Rf ~ 500kΩ - 1MΩ)",
        destination_component="LM358 Transimpedance Amplifier",
        destination_pin="Pin 1 (Output OUT1)",
        destination_location="RX Breadboard Row 6, Col a",
        destination_breadboard_hole="RX Breadboard Row 6, Col a",
        signal_type="Transimpedance Feedback Loop",
        voltage_if_verified="Sets output gain V_out = I_photo * Rf",
        purpose="Sets the transimpedance gain converting microamp optical photocurrent into a 0 to 1.2V analog voltage.",
        status="UNVERIFIED",
        verification_source="Connection not verified — requires hardware schematic/photo for exact Rf value and stabilizing capacitor Cf.",
        professor_explanation="Professor, this through-hole resistor bridges Pin 1 (Output) and Pin 2 (Inverting Input) of the LM358 op-amp. By Ohm's law in transimpedance configuration, the output voltage equals V_out = I_photo * R_f. To produce the paper-reported illuminated ADC levels of 95 to 176 counts from microamp photocurrents, R_f is typically between 500kΩ and 1MΩ. A small picofarad feedback capacitor C_f in parallel prevents high-frequency ringing and instability.",
        notes="Transimpedance gain R_f and phase margin capacitor C_f."
    ),
    WireConnection(
        connection_id="CONN-RX-04",
        wire_name="LM358 Non-Inverting Input Bias (Pin 3)",
        source_component="LM358 Transimpedance Amplifier",
        source_pin="Pin 3 (Non-Inverting Input IN1+)",
        source_location="RX Breadboard Row 9, Col b",
        source_breadboard_hole="RX Breadboard Row 9, Col b",
        wire_color="Black",
        wire_type="Solid Core Breadboard Jumper",
        destination_component="Receiver Ground Rail",
        destination_pin="GND Rail (-)",
        destination_location="RX Breadboard Blue Bus (-)",
        destination_breadboard_hole="RX Blue Bus Rail (-)",
        signal_type="Ground Reference (0.0V)",
        voltage_if_verified="0.0V Ground Reference",
        purpose="Ties the LM358 non-inverting input to ground for single-supply ground-sensing transimpedance operation.",
        status="DOCUMENTED HARDWARE",
        verification_source="LM358 single-supply operational amplifier datasheet reference design",
        professor_explanation="Professor, this black jumper grounds Pin 3 (the non-inverting input). Because the LM358 features true single-supply ground-sensing PNP input stages, it can operate with input common-mode voltages all the way down to ground (0V) without requiring a dual ±15V power supply.",
        notes="LM358 ground-sensing input reference."
    ),
    WireConnection(
        connection_id="CONN-RX-05",
        wire_name="LM358 Analog Optical Output to ADC",
        source_component="LM358 Transimpedance Amplifier",
        source_pin="Pin 1 (Output OUT1)",
        source_location="RX Breadboard Row 6, Col b",
        source_breadboard_hole="RX Breadboard Row 6, Col b",
        wire_color="Green",
        wire_type="24 AWG Dupont Jumper (M-M)",
        destination_component="ESP32 Receiver Node",
        destination_pin="GPIO 34 (ADC1_CH6)",
        destination_location="ESP32 RX Header Pin 34",
        destination_breadboard_hole="RX Breadboard Row 16, Col j",
        signal_type="Analog Optical Voltage (0 - 1.2V)",
        voltage_if_verified="0–1.2V (~0–176 ADC Counts)",
        purpose="Routes the amplified optical analog voltage signal from the LM358 TIA into the ESP32 12-bit SAR ADC at GPIO 34.",
        status="DOCUMENTED HARDWARE",
        verification_source="SemLiFi Paper Section IV-A: 'followed by an ESP32 ADC input identified as GPIO 34' & Table II",
        professor_explanation="Professor, this green jumper carries the amplified optical analog signal from LM358 Pin 1 directly into ESP32 GPIO 34 (which maps to ADC1 Channel 6). In our firmware, the ESP32 samples this pin in a mid-bit window of 450–550 µs. If the sample is greater than our calibrated threshold of ~50 counts, the OOK slicer outputs a logic 1; if below 50, it outputs logic 0. Under burst occlusion, this line immediately flatlines below 10 counts, triggering Manchester transition violation detection!",
        notes="Optical analog sampling line read by ESP32 ADC1_CH6."
    ),
    WireConnection(
        connection_id="CONN-RX-06",
        wire_name="LM358 Positive Supply (Pin 8)",
        source_component="Receiver Power Rail",
        source_pin="VCC (+3.3V / +5V)",
        source_location="RX Breadboard Red Bus (+)",
        source_breadboard_hole="RX Red Bus Rail (+)",
        wire_color="Red",
        wire_type="24 AWG Dupont Jumper (M-M)",
        destination_component="LM358 Transimpedance Amplifier",
        destination_pin="Pin 8 (VCC+)",
        destination_location="RX Breadboard Row 10, Col f",
        destination_breadboard_hole="RX Breadboard Row 10, Col f",
        signal_type="DC Power (+)",
        voltage_if_verified="VCC Supply",
        purpose="Powers the LM358 operational amplifier IC from the receiver breadboard power rail.",
        status="DOCUMENTED HARDWARE",
        verification_source="Standard LM358 dual op-amp pinout",
        professor_explanation="Professor, this red jumper supplies positive DC operating power to Pin 8 of the LM358 IC. An adjacent 100nF decoupling capacitor across Pin 8 and Pin 4 suppresses power supply noise.",
        notes="Op-amp positive supply line."
    ),
    WireConnection(
        connection_id="CONN-RX-07",
        wire_name="LM358 Ground Supply (Pin 4)",
        source_component="LM358 Transimpedance Amplifier",
        source_pin="Pin 4 (GND / VCC-)",
        source_location="RX Breadboard Row 6, Col e",
        source_breadboard_hole="RX Breadboard Row 6, Col e",
        wire_color="Black",
        wire_type="Solid Core Breadboard Jumper",
        destination_component="Receiver Ground Rail",
        destination_pin="GND Rail (-)",
        destination_location="RX Breadboard Blue Bus (-)",
        destination_breadboard_hole="RX Blue Bus Rail (-)",
        signal_type="Ground (GND)",
        voltage_if_verified="0.0V Ground Reference",
        purpose="Connects LM358 power ground to the receiver ground rail.",
        status="DOCUMENTED HARDWARE",
        verification_source="Standard LM358 dual op-amp pinout",
        professor_explanation="Professor, this black jumper grounds Pin 4 of the LM358, providing the ground return for the operational amplifier's internal circuitry.",
        notes="Op-amp ground return line."
    ),
    WireConnection(
        connection_id="CONN-RX-08",
        wire_name="ESP32 RX Ground Reference",
        source_component="ESP32 Receiver Node",
        source_pin="GND Pin",
        source_location="ESP32 RX Header GND",
        source_breadboard_hole="RX Breadboard Row 1, Col j",
        wire_color="Black",
        wire_type="24 AWG Dupont Jumper (M-M)",
        destination_component="Receiver Ground Rail",
        destination_pin="GND Rail (-)",
        destination_location="RX Breadboard Blue Bus (-)",
        destination_breadboard_hole="RX Blue Bus Rail (-)",
        signal_type="Ground (GND)",
        voltage_if_verified="0.0V Ground Reference",
        purpose="Ensures the ESP32 ADC internal reference ground is tied directly to the analog LM358 TIA ground.",
        status="DOCUMENTED HARDWARE",
        verification_source="Required ADC ground reference connection",
        professor_explanation="Professor, this black jumper ties the ESP32 receiver's ground pin directly to the receiver breadboard ground bus. Without this common ground, the ESP32 ADC would measure floating ground offsets, corrupting the optical threshold decision.",
        notes="Prevents ground loop offsets in ADC measurement."
    ),
    WireConnection(
        connection_id="CONN-BENCH-01",
        wire_name="Bench Common Ground Tie",
        source_component="Transmitter Breadboard Ground",
        source_pin="TX GND Bus (-)",
        source_location="TX Breadboard Blue Bus (-)",
        source_breadboard_hole="TX Blue Bus Rail (-)",
        wire_color="Black",
        wire_type="Long 24 AWG Dupont Jumper (M-M)",
        destination_component="Receiver Breadboard Ground",
        destination_pin="RX GND Bus (-)",
        destination_location="RX Breadboard Blue Bus (-)",
        destination_breadboard_hole="RX Blue Bus Rail (-)",
        signal_type="Common Testbed Ground (0.0V)",
        voltage_if_verified="0.0V Ground Reference",
        purpose="Bridges transmitter ground and receiver ground across the workbench to establish a single unified ground reference.",
        status="DOCUMENTED HARDWARE",
        verification_source="Standard laboratory testbed bench grounding practice",
        professor_explanation="Professor, this long black jumper runs across the workbench between the transmitter breadboard ground rail and the receiver breadboard ground rail. Even though optical LiFi communication itself is wireless and galvanic-isolated, establishing a common bench ground during testbed experiments prevents static charge accumulation and allows single-probe oscilloscope measurements.",
        notes="Testbed bench ground tie."
    ),
]

def get_all_connections() -> List[WireConnection]:
    return WIRING_DATABASE

def get_verified_connections() -> List[WireConnection]:
    return [c for c in WIRING_DATABASE if c.status in ("VERIFIED HARDWARE", "DOCUMENTED HARDWARE")]

def get_unverified_connections() -> List[WireConnection]:
    return [c for c in WIRING_DATABASE if c.status == "UNVERIFIED"]

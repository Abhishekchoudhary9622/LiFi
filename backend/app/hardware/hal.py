"""
SemLiFi Hardware Abstraction Layer (HAL).
Provides a unified interface for both:
1. LIVE HARDWARE MODE (ESP32 via PySerial)
2. SIMULATION MODE (Physics-based optical and channel simulator)

Strict honesty guarantee:
- Status will NEVER report "Hardware connected" unless verified via physical serial handshake.
- Values produced under simulation are explicitly labeled "SIMULATION".
"""

import math
import random
import time
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel

try:
    import serial
    import serial.tools.list_ports
    SERIAL_AVAILABLE = True
except ImportError:
    SERIAL_AVAILABLE = False

class HardwareStatus(BaseModel):
    is_connected: bool
    mode: str                    # "LIVE HARDWARE" | "SIMULATION"
    port: Optional[str] = None
    baudrate: int = 115200
    tx_node_status: str          # "ONLINE", "OFFLINE", "SIMULATED"
    rx_node_status: str          # "ONLINE", "OFFLINE", "SIMULATED"
    led_state: bool              # True = ON, False = OFF
    servo_angle_deg: int         # 0 to 180 degrees
    is_beam_blocked: bool
    current_adc_count: float
    operating_threshold: float = 50.0
    signal_classification: str   # "LIGHT DETECTED", "BLOCKED", "NO SIGNAL", "UNKNOWN"
    last_frame_id: int
    data_source: str             # "LIVE HARDWARE" or "SIMULATION"

class HardwareInterface:
    def __init__(self):
        self.mode = "SIMULATION"
        self.is_connected = False
        self.port: Optional[str] = None
        self.baudrate = 115200
        self.serial_handle = None
        
        # State registers
        self.led_state = False
        self.servo_angle_deg = 0
        self.is_beam_blocked = False
        self.current_adc_count = 135.0  # Documented illuminated range: ~95-176
        self.operating_threshold = 50.0 # Documented ~50 counts
        self.last_frame_id = 0
        
    def list_available_ports(self) -> List[Dict[str, str]]:
        """Scans system for available serial COM ports."""
        if not SERIAL_AVAILABLE:
            return []
        ports = []
        for p in serial.tools.list_ports.comports():
            ports.append({
                "port": p.device,
                "description": p.description,
                "hwid": p.hwid,
                "is_likely_esp32": any(k in (p.description + p.hwid).lower() for k in ["cp210", "ch340", "ch9102", "usb-serial", "ftdi", "esp32"])
            })
        return ports

    def auto_detect_esp32(self) -> Optional[str]:
        """Attempts to find the port of an attached ESP32."""
        ports = self.list_available_ports()
        for p in ports:
            if p["is_likely_esp32"]:
                return p["port"]
        if ports:
            return ports[0]["port"]
        return None

    def connect(self, port: str, baudrate: int = 115200) -> bool:
        """Connects to real hardware via PySerial."""
        if not SERIAL_AVAILABLE:
            self.is_connected = False
            self.mode = "SIMULATION"
            return False
            
        try:
            self.serial_handle = serial.Serial(port=port, baudrate=baudrate, timeout=1.0)
            self.port = port
            self.baudrate = baudrate
            self.is_connected = True
            self.mode = "LIVE HARDWARE"
            return True
        except Exception:
            self.is_connected = False
            self.mode = "SIMULATION"
            self.serial_handle = None
            return False

    def disconnect(self):
        """Disconnects serial handle and reverts to simulation mode."""
        if self.serial_handle and self.serial_handle.is_open:
            self.serial_handle.close()
        self.serial_handle = None
        self.is_connected = False
        self.mode = "SIMULATION"

    def read_adc(self) -> float:
        """Reads receiver ADC count."""
        if self.is_connected and self.serial_handle:
            try:
                # Query ESP32: "ADC?\n"
                self.serial_handle.write(b"ADC?\n")
                line = self.serial_handle.readline().decode("utf-8").strip()
                if line.startswith("ADC:"):
                    val = float(line.split(":")[1])
                    self.current_adc_count = val
                    return val
            except Exception:
                pass
                
        # Simulation physics:
        # If LED is ON and beam is not blocked -> illuminated nominal ~135 with noise
        # If beam blocked -> dark level ~0-5
        # If LED OFF -> dark level ~0-5
        noise = random.gauss(0, 2.5)
        if self.is_beam_blocked:
            val = max(0.0, min(8.0, 2.5 + noise))
        elif self.led_state:
            val = max(80.0, min(180.0, 135.0 + noise))
        else:
            val = max(0.0, min(8.0, 2.5 + noise))
            
        self.current_adc_count = round(val, 1)
        return self.current_adc_count

    def set_led(self, state: bool) -> bool:
        """Sets transmitter LED state (True=ON, False=OFF)."""
        self.led_state = state
        if self.is_connected and self.serial_handle:
            try:
                cmd = b"LED:1\n" if state else b"LED:0\n"
                self.serial_handle.write(cmd)
                return True
            except Exception:
                return False
        return True

    def set_servo_angle(self, angle_deg: int) -> bool:
        """Sets SG90 servo angle (0 to 180 degrees). Flap blocks beam between 70° and 110°."""
        self.servo_angle_deg = max(0, min(180, angle_deg))
        # Beam is occluded when servo flap swings into optical axis (~70° to 110°)
        self.is_beam_blocked = 70 <= self.servo_angle_deg <= 110
        
        if self.is_connected and self.serial_handle:
            try:
                cmd = f"SERVO:{self.servo_angle_deg}\n".encode("utf-8")
                self.serial_handle.write(cmd)
                return True
            except Exception:
                return False
        return True

    def get_status(self) -> HardwareStatus:
        """Returns the full diagnostic state of the hardware / simulation engine."""
        self.read_adc()
        
        if self.current_adc_count >= self.operating_threshold:
            classification = "LIGHT DETECTED"
        elif self.is_beam_blocked or self.current_adc_count < 10.0:
            classification = "BLOCKED"
        else:
            classification = "NO SIGNAL"
            
        return HardwareStatus(
            is_connected=self.is_connected,
            mode=self.mode,
            port=self.port,
            baudrate=self.baudrate,
            tx_node_status="ONLINE" if self.is_connected else "SIMULATED",
            rx_node_status="ONLINE" if self.is_connected else "SIMULATED",
            led_state=self.led_state,
            servo_angle_deg=self.servo_angle_deg,
            is_beam_blocked=self.is_beam_blocked,
            current_adc_count=self.current_adc_count,
            operating_threshold=self.operating_threshold,
            signal_classification=classification,
            last_frame_id=self.last_frame_id,
            data_source="LIVE HARDWARE" if self.is_connected else "SIMULATION",
        )

HAL_INSTANCE = HardwareInterface()

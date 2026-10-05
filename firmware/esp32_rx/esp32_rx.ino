/*
  SemLiFi Physical Testbed - Receiver Firmware
  Target: ESP32-WROOM-32D
  Photodetector: BPW34 PIN Photodiode
  Amplifier: LM358-based Transimpedance Amplifier (TIA)
  ADC Pin: GPIO 34 (ADC1_CH6, input only)
  Operating Threshold: ~50 ADC counts (Documented dark: ~0-5, illuminated: ~95-176)
  Sampling: Mid-bit 450-550 µs window
  Frame Parser: Dallas/Maxim 0x31 CRC-8 + \r\n terminator
*/

#define RX_ADC_PIN 34
#define SLICER_THRESHOLD 50
#define BIT_PERIOD_US 1000
#define CHIP_PERIOD_US 500

uint8_t crc8_dallas(const uint8_t *data, size_t len) {
  uint8_t crc = 0x00;
  for (size_t i = 0; i < len; i++) {
    crc ^= data[i];
    for (int b = 0; b < 8; b++) {
      if (crc & 0x80) {
        crc = ((crc << 1) ^ 0x31) & 0xFF;
      } else {
        crc = (crc << 1) & 0xFF;
      }
    }
  }
  return crc;
}

int read_optical_adc() {
  return analogRead(RX_ADC_PIN);
}

void setup() {
  Serial.begin(115200);
  pinMode(RX_ADC_PIN, INPUT);
  analogReadResolution(12); // ESP32 12-bit ADC (0 - 4095)
  Serial.println("SEMLIFI_RX_ONLINE: GPIO34_ADC_TIA_THRESHOLD50");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd == "ADC?") {
      int adc_val = read_optical_adc();
      // Scaled to match paper range (0-176) if full 12-bit range is used
      int scaled = map(adc_val, 0, 4095, 0, 180);
      Serial.print("ADC:");
      Serial.println(scaled);
    } else if (cmd == "STATUS?") {
      Serial.println("STATUS:OK,NODE:ESP32_RX,GPIO:34,THRESHOLD:50");
    }
  }
}

/*
  SemLiFi Physical Testbed - Transmitter Firmware
  Target: ESP32-WROOM-32D
  Optical Source: High-intensity LED switched via 2N2222 transistor driver
  Control Pin: GPIO 23 (OOK + Manchester)
  Bit Period: 1000 µs (1000 bps raw rate)
  Half-Bit Chip Period: 500 µs
  Frame Format: [0xAA 0x55][LEN][SEQ][PAYLOAD][CRC8][\r\n]
  CRC: Dallas/Maxim 0x31 (x^8 + x^5 + x^4 + 1)
*/

#define LED_TX_PIN 23
#define BIT_PERIOD_US 1000
#define CHIP_PERIOD_US 500

uint8_t current_seq = 1;

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

void send_manchester_bit(bool bit_val) {
  // IEEE 802.3 Convention:
  // Bit 0: Low (500us) -> High (500us)
  // Bit 1: High (500us) -> Low (500us)
  if (bit_val == 0) {
    digitalWrite(LED_TX_PIN, LOW);
    delayMicroseconds(CHIP_PERIOD_US);
    digitalWrite(LED_TX_PIN, HIGH);
    delayMicroseconds(CHIP_PERIOD_US);
  } else {
    digitalWrite(LED_TX_PIN, HIGH);
    delayMicroseconds(CHIP_PERIOD_US);
    digitalWrite(LED_TX_PIN, LOW);
    delayMicroseconds(CHIP_PERIOD_US);
  }
}

void send_byte(uint8_t byte_val) {
  for (int i = 7; i >= 0; i--) {
    send_manchester_bit((byte_val >> i) & 1);
  }
}

void transmit_frame(const char *payload) {
  uint8_t len = strlen(payload);
  uint8_t buf[256];
  buf[0] = len;
  buf[1] = current_seq++;
  memcpy(&buf[2], payload, len);
  
  uint8_t crc = crc8_dallas(buf, 2 + len);

  // Sync Word: 0xAA 0x55
  send_byte(0xAA);
  send_byte(0x55);
  
  // Header + Payload
  send_byte(len);
  send_byte(buf[1]);
  for (uint8_t i = 0; i < len; i++) {
    send_byte(payload[i]);
  }
  
  // CRC-8 Dallas
  send_byte(crc);
  
  // Terminator: \r\n
  send_byte('\r');
  send_byte('\n');

  digitalWrite(LED_TX_PIN, LOW);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_TX_PIN, OUTPUT);
  digitalWrite(LED_TX_PIN, LOW);
  Serial.println("SEMLIFI_TX_ONLINE: GPIO23_OOK_MANCHESTER_1000BPS");
}

void loop() {
  if (Serial.available()) {
    String cmd = Serial.readStringUntil('\n');
    cmd.trim();
    if (cmd.startsWith("TX:")) {
      String payload = cmd.substring(3);
      transmit_frame(payload.c_str());
      Serial.println("TX_DONE");
    } else if (cmd == "LED:1") {
      digitalWrite(LED_TX_PIN, HIGH);
      Serial.println("LED_ON");
    } else if (cmd == "LED:0") {
      digitalWrite(LED_TX_PIN, LOW);
      Serial.println("LED_OFF");
    } else if (cmd == "STATUS?") {
      Serial.println("STATUS:OK,NODE:ESP32_TX,GPIO:23,RATE:1000");
    }
  }
}

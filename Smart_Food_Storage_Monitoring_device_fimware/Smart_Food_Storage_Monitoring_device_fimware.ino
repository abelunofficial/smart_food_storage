#define BLYNK_TEMPLATE_ID "TMPL2WltkPYXA"
#define BLYNK_TEMPLATE_NAME "Temperature Display"
#define BLYNK_AUTH_TOKEN "ayPjQjgCj6-RUBwNQR-OkVmK1I9vqmjy"
#define BLYNK_PRINT Serial

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>

char ssid[] = "Asterisk";
char pass[] = "62205844";

#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define RELAY_PIN 14
#define BUZZER 25
#define SERVO_PIN 27
#define FAN_PIN 2            // NEW: fan relay IN pin

#define RELAY_ON  HIGH
#define RELAY_OFF LOW

// NEW: fan relay logic. If your fan relay module turns ON when the pin
// goes LOW (active-low module), swap these two values.
#define FAN_ON  HIGH
#define FAN_OFF LOW

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 20, 4);
Servo ventServo;
BlynkTimer timer;

// ===== ALARM STATE =====
bool alarmActive = false;
bool buzzerState = false;
unsigned long lastBuzzerToggle = 0;
#define BUZZER_INTERVAL 300  // ms between HIGH/LOW — change for faster/slower

// ===== FAN STATE (NEW) =====
bool fanOn = false;

float calculateRisk(float t, float h, int g) {
  float risk = 0;
  if (t > 25) risk += (t - 25) * 2;
  if (h > 60) risk += (h - 60) * 1.5;
  if (g > 1500) risk += (g - 1500) * 0.02;
  if (risk > 100) risk = 100;
  return risk;
}

// ===== NEW: apply fan state to the relay =====
void setFan(bool on) {
  fanOn = on;
  digitalWrite(FAN_PIN, on ? FAN_ON : FAN_OFF);
  Serial.print("Fan: "); Serial.println(on ? "ON" : "OFF");
}

// ===== NEW: Blynk switch on V4 ("Fan") =====
BLYNK_WRITE(V4) {
  setFan(param.asInt() == 1);
}

// ===== NEW: when Blynk (re)connects, restore the switch state =====
BLYNK_CONNECTED() {
  Blynk.syncVirtual(V4);
}

// ===== ALARM TICK — called every loop() =====
void handleAlarm() {
  if (!alarmActive) {
    digitalWrite(BUZZER, LOW);  // Make sure buzzer is off when not alarming
    buzzerState = false;
    return;
  }

  unsigned long now = millis();
  if (now - lastBuzzerToggle >= BUZZER_INTERVAL) {
    buzzerState = !buzzerState;                  // Flip HIGH → LOW → HIGH → LOW
    digitalWrite(BUZZER, buzzerState ? HIGH : LOW);
    lastBuzzerToggle = now;
  }
}

void sendData() {
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  int   gas  = analogRead(MQ135_PIN);

  if (isnan(temp) || isnan(hum)) {
    Serial.println("DHT read failed, skipping cycle");
    lcd.setCursor(0, 3);
    lcd.print("SENSOR ERROR!  ");
    return;
  }

  float risk = calculateRisk(temp, hum, gas);

  Blynk.virtualWrite(V0, temp);
  Blynk.virtualWrite(V1, hum);
  Blynk.virtualWrite(V2, gas);
  Blynk.virtualWrite(V5, risk);

  lcd.setCursor(0, 0);
  lcd.print("T:"); lcd.print(temp, 1); lcd.print("C   ");
  lcd.setCursor(10, 0);
  lcd.print("H:"); lcd.print(hum, 1); lcd.print("%  ");
  lcd.setCursor(0, 1);
  lcd.print("Gas:"); lcd.print(gas); lcd.print("     ");
  lcd.setCursor(0, 2);
  lcd.print("Risk:"); lcd.print(risk, 1); lcd.print("     ");

  if (risk > 60) {
    digitalWrite(RELAY_PIN, RELAY_ON);
    ventServo.write(90);
    alarmActive = true;          // ← Start blinking alarm
    Blynk.virtualWrite(V3, "DANGER!");
    lcd.setCursor(0, 3);
    lcd.print("HIGH RISK!!!   ");
    Blynk.logEvent("alert", "High spoilage risk!");

  } else if (risk > 30) {
    digitalWrite(RELAY_PIN, RELAY_ON);
    ventServo.write(60);
    alarmActive = false;         // ← Stop alarm
    Blynk.virtualWrite(V3, "MODERATE");
    lcd.setCursor(0, 3);
    lcd.print("MODERATE       ");

  } else {
    digitalWrite(RELAY_PIN, RELAY_OFF);
    ventServo.write(0);
    alarmActive = false;         // ← Stop alarm
    Blynk.virtualWrite(V3, "SAFE");
    lcd.setCursor(0, 3);
    lcd.print("SAFE           ");
  }

  Serial.print("Temp: "); Serial.print(temp);
  Serial.print(" | Hum: ");  Serial.print(hum);
  Serial.print(" | Gas: ");  Serial.print(gas);
  Serial.print(" | Risk: "); Serial.print(risk);
  Serial.print(" | Fan: ");  Serial.print(fanOn ? "ON" : "OFF");
  Serial.print(" | Alarm: "); Serial.println(alarmActive ? "ON" : "OFF");
}
#define BLYNK_TEMPLATE_ID "TMPL2WltkPYXA"
#define BLYNK_TEMPLATE_NAME "Temperature Display"
#define BLYNK_AUTH_TOKEN "ayPjQjgCj6-RUBwNQR-OkVmK1I9vqmjy"
#define BLYNK_PRINT Serial

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ESP32Servo.h>

char ssid[] = "Asterisk";
char pass[] = "62205844";

#define DHTPIN 4
#define DHTTYPE DHT22
#define MQ135_PIN 34
#define RELAY_PIN 14
#define BUZZER 25
#define SERVO_PIN 27
#define FAN_PIN 2            // NEW: fan relay IN pin

#define RELAY_ON  HIGH
#define RELAY_OFF LOW

// NEW: fan relay logic. If your fan relay module turns ON when the pin
// goes LOW (active-low module), swap these two values.
#define FAN_ON  HIGH
#define FAN_OFF LOW

DHT dht(DHTPIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 20, 4);
Servo ventServo;
BlynkTimer timer;

// ===== ALARM STATE =====
bool alarmActive = false;
bool buzzerState = false;
unsigned long lastBuzzerToggle = 0;
#define BUZZER_INTERVAL 300  // ms between HIGH/LOW — change for faster/slower

// ===== FAN STATE (NEW) =====
bool fanOn = false;

float calculateRisk(float t, float h, int g) {
  float risk = 0;
  if (t > 25) risk += (t - 25) * 2;
  if (h > 60) risk += (h - 60) * 1.5;
  if (g > 1500) risk += (g - 1500) * 0.02;
  if (risk > 100) risk = 100;
  return risk;
}

// ===== NEW: apply fan state to the relay =====
void setFan(bool on) {
  fanOn = on;
  digitalWrite(FAN_PIN, on ? FAN_ON : FAN_OFF);
  Serial.print("Fan: "); Serial.println(on ? "ON" : "OFF");
}

// ===== NEW: Blynk switch on V4 ("Fan") =====
BLYNK_WRITE(V4) {
  setFan(param.asInt() == 1);
}

// ===== NEW: when Blynk (re)connects, restore the switch state =====
BLYNK_CONNECTED() {
  Blynk.syncVirtual(V4);
}

// ===== ALARM TICK — called every loop() =====
void handleAlarm() {
  if (!alarmActive) {
    digitalWrite(BUZZER, LOW);  // Make sure buzzer is off when not alarming
    buzzerState = false;
    return;
  }

  unsigned long now = millis();
  if (now - lastBuzzerToggle >= BUZZER_INTERVAL) {
    buzzerState = !buzzerState;                  // Flip HIGH → LOW → HIGH → LOW
    digitalWrite(BUZZER, buzzerState ? HIGH : LOW);
    lastBuzzerToggle = now;
  }
}

void sendData() {
  float temp = dht.readTemperature();
  float hum  = dht.readHumidity();
  int   gas  = analogRead(MQ135_PIN);

  if (isnan(temp) || isnan(hum)) {
    Serial.println("DHT read failed, skipping cycle");
    lcd.setCursor(0, 3);
    lcd.print("SENSOR ERROR!  ");
    return;
  }

  float risk = calculateRisk(temp, hum, gas);

  Blynk.virtualWrite(V0, temp);
  Blynk.virtualWrite(V1, hum);
  Blynk.virtualWrite(V2, gas);
  Blynk.virtualWrite(V5, risk);

  lcd.setCursor(0, 0);
  lcd.print("T:"); lcd.print(temp, 1); lcd.print("C   ");
  lcd.setCursor(10, 0);
  lcd.print("H:"); lcd.print(hum, 1); lcd.print("%  ");
  lcd.setCursor(0, 1);
  lcd.print("Gas:"); lcd.print(gas); lcd.print("     ");
  lcd.setCursor(0, 2);
  lcd.print("Risk:"); lcd.print(risk, 1); lcd.print("     ");

  if (risk > 60) {
    digitalWrite(RELAY_PIN, RELAY_ON);
    ventServo.write(90);
    alarmActive = true;          // ← Start blinking alarm
    Blynk.virtualWrite(V3, "DANGER!");
    lcd.setCursor(0, 3);
    lcd.print("HIGH RISK!!!   ");
    Blynk.logEvent("alert", "High spoilage risk!");

  } else if (risk > 30) {
    digitalWrite(RELAY_PIN, RELAY_ON);
    ventServo.write(60);
    alarmActive = false;         // ← Stop alarm
    Blynk.virtualWrite(V3, "MODERATE");
    lcd.setCursor(0, 3);
    lcd.print("MODERATE       ");

  } else {
    digitalWrite(RELAY_PIN, RELAY_OFF);
    ventServo.write(0);
    alarmActive = false;         // ← Stop alarm
    Blynk.virtualWrite(V3, "SAFE");
    lcd.setCursor(0, 3);
    lcd.print("SAFE           ");
  }

  Serial.print("Temp: "); Serial.print(temp);
  Serial.print(" | Hum: ");  Serial.print(hum);
  Serial.print(" | Gas: ");  Serial.print(gas);
  Serial.print(" | Risk: "); Serial.print(risk);
  Serial.print(" | Fan: ");  Serial.print(fanOn ? "ON" : "OFF");
  Serial.print(" | Alarm: "); Serial.println(alarmActive ? "ON" : "OFF");
}void setup() {
  Serial.begin(115200);

  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);              // NEW
  digitalWrite(RELAY_PIN, RELAY_OFF);
  digitalWrite(BUZZER, LOW);
  digitalWrite(FAN_PIN, FAN_OFF);        // NEW: fan starts OFF until Blynk syncs

  dht.begin();

  lcd.init();
  lcd.backlight();
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Connecting...");

  ventServo.attach(SERVO_PIN);
  ventServo.write(0);

  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);

  lcd.clear();
  timer.setInterval(2000L, sendData);
}

void loop() {
  Blynk.run();
  timer.run();
  handleAlarm();   // ← Runs every loop tick, non-blocking
}
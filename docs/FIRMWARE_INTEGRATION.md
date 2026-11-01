# Firmware Integration Specification

This document details the interface between the **ESP32 Edge Microcontroller Node** and the **Smart Food Storage Monitoring Dashboard** via the **Blynk IoT Platform**.

---

## 1. Virtual Pin Mapping (ESP32 ↔ Blynk Cloud)

The ESP32 firmware transmits data across dedicated virtual datastreams using the Blynk C++ library (`BlynkSimpleEsp32.h`):

| Virtual Pin | Datastream Name | Data Type | Physical Sensor / Origin | Value Range / Units | Description |
|---|---|---|---|---|---|
| **V0** | Temperature | Double / Float | DHT22 (GPIO 4) | -40.0 to +80.0 °C | Ambient chamber temperature. |
| **V1** | Humidity | Double / Float | DHT22 (GPIO 4) | 0.0 to 100.0 % RH | Ambient relative humidity percentage. |
| **V2** | Spoilage Gas | Integer | MQ135 (GPIO 34 ADC) | 0 to 4095 ADC counts | Uncalibrated raw analog voltage reading. |
| **V3** | Condition Status | String | Firmware Evaluation | `SAFE`, `MODERATE`, `DANGER!` | Discrete storage condition classification. |
| **V4** | Fan Actuator | Integer | None (Reserved) | 0 / 1 (Not Implemented) | Not implemented in firmware (no `BLYNK_WRITE(V4)`). |
| **V5** | Firmware Risk Score | Double / Float | Firmware Calculation | 0.0 to 100.0 | Primary composite spoilage risk index. |

> [!IMPORTANT]
> **MQ135 Gas Readings are Raw ADC Values**:
> Virtual Pin V2 carries raw 12-bit analog-to-digital converter (ADC) counts (0–4095) directly from GPIO 34. The MQ135 is not factory-calibrated against reference gas concentrations; **do not convert, label, or display V2 readings as "ppm" (parts-per-million)**.

---

## 2. Firmware Risk Calculation Formula

The ESP32 microcontroller executes an on-device mathematical risk evaluation model in its 2-second telemetry cycle (`Smart_Food_Storage_Monitoring_device_fimware.ino`):

```cpp
float calculateRisk(float t, float h, int g) {
  float risk = 0;
  if (t > 25) risk += (t - 25) * 2;
  if (h > 60) risk += (h - 60) * 1.5;
  if (g > 1500) risk += (g - 1500) * 0.02;
  if (risk > 100) risk = 100;
  return risk;
}
```

### Mathematical Breakdown

$$\text{Temperature Contribution} = \max\bigl(0,\,(T - 25) \times 2.0\bigr)$$

$$\text{Humidity Contribution} = \max\bigl(0,\,(H - 60) \times 1.5\bigr)$$

$$\text{Gas Contribution} = \max\bigl(0,\,(G - 1500) \times 0.02\bigr)$$

$$\text{Total Composite Risk} = \min\bigl(100.0,\,\text{Temp Contribution} + \text{Humidity Contribution} + \text{Gas Contribution}\bigr)$$

### Classification Thresholds

| Classification | Score Boundary | Firmware State String (V3) | Description |
|---|---|---|---|
| **SAFE** | $\text{Risk} \le 30.0$ | `SAFE` | Environmental conditions are optimal for food preservation. |
| **MODERATE** | $30.0 < \text{Risk} \le 60.0$ | `MODERATE` | Elevated temperature, humidity, or gas levels; active intervention recommended. |
| **DANGER** | $\text{Risk} > 60.0$ | `DANGER!` | Critical preservation hazard; spoilage acceleration imminent. |

> [!NOTE]
> Virtual Pin **V5** is the primary source of truth for the live risk score. The dashboard computes an auxiliary local score via `src/utils/riskCalculator.ts` exclusively for cross-checking data consistency. If V5 is unconfigured in the Blynk template, the dashboard explicitly surfaces this diagnostic state rather than silently masking it.

---

## 3. Automatic Equipment Actuator Behavior

The ESP32 firmware autonomously commands three hardware peripherals based on the evaluated risk level. These commands are executed locally at the edge:

| Condition Status | Risk Range | Relay (Cooling Fan) | Vent Servo Position | Buzzer Alarm State |
|---|---|---|---|---|
| **SAFE** | $\le 30.0$ | `LOW` (De-energized / OFF) | `0°` (Closed vent) | Silent (`LOW` / OFF) |
| **MODERATE** | $> 30.0$ and $\le 60.0$ | `HIGH` (Energized / ON) | `60°` (Partial vent) | Silent (`LOW` / OFF) |
| **DANGER!** | $> 60.0$ | `HIGH` (Energized / ON) | `90°` (Full vent) | Active (Pulsing every 300 ms) |

### Physical Feedback Limitation

- The hardware circuit operates in an **open-loop configuration**.
- The ESP32 does not possess limit switches, current sensors, or tachometer feedback on the fan or servo.
- The dashboard displays **commanded states** (firmware output signals), not physically confirmed actuator positions.

---

## 4. Connection Handling & Firmware Loop

- **Transmission Rate**: The firmware configures a BlynkTimer to publish sensor telemetry every **2,000 ms** (2 seconds).
- **Wi-Fi Connectivity**: If Wi-Fi drops, the ESP32 continues running its main loop, updating its local 20x4 I2C LCD screen, but stops streaming to Blynk Cloud until reconnected.
- **Sensor Fault Handling**: If `dht.readTemperature()` or `dht.readHumidity()` returns `isnan()`, the cycle is aborted, `"SENSOR ERROR!"` is printed to the LCD, and no virtual pin writes are performed for that cycle.

---

## 5. Known Firmware Limitations

1. **No Actuator Readback**: No hardware feedback to confirm whether the fan relay actually engaged or the vent servo successfully rotated.
2. **Virtual Pin V4 Unused**: The firmware does not include `BLYNK_WRITE(V4)` handlers. Actuator control is purely autonomous at the edge; remote manual overrides from the dashboard are not supported by the current firmware.
3. **No Sensor Diagnostics Over Blynk**: When the DHT22 fails, the firmware prints to serial and LCD but does not publish a diagnostic error flag over a virtual pin; the Blynk datastream simply ceases updating.
4. **No Device Metadata Stream**: The firmware does not transmit IP addresses, MAC addresses, Wi-Fi RSSI signal strengths, or uptime counters to Blynk.

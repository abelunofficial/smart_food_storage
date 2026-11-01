/**
 * Smart Food Storage Monitoring Dashboard - Centralized Mock Telemetry Data
 *
 * Provides realistic demonstration values matching the physical ESP32 firmware:
 *   - V0: Temperature in Celsius (DHT22 on GPIO 4)
 *   - V1: Relative humidity percentage (DHT22 on GPIO 4)
 *   - V2: Gas sensor raw analog reading (MQ135 on GPIO 34, 0–4095 ADC)
 *   - V3: Storage condition status (SAFE | MODERATE | DANGER!)
 *   - V4: Manual Fan Relay switch (GPIO 2, Active-HIGH via BLYNK_WRITE(V4))
 *   - V5: Risk score calculated via updated firmware formula:
 *         (T>25?(T-25)*2:0) + (H>60?(H-60)*1.5:0) + (G>1500?(G-1500)*0.02:0), capped at 100
 *
 * Hardware Actuators:
 *   - Automatic Relay (GPIO 14, Active-HIGH):
 *       SAFE (risk <= 30): OFF (LOW)
 *       MODERATE (30 < risk <= 60): ON (HIGH)
 *       DANGER (risk > 60): ON (HIGH)
 *   - Manual Fan Relay (GPIO 2, Active-HIGH, Virtual Pin V4):
 *       Operator-commanded via Blynk V4 (1 = ON, 0 = OFF). Independent of automatic relay.
 *   - Intake Vent Servo (GPIO 27): 0° (SAFE), 60° (MODERATE), 90° (DANGER)
 *   - Audible Alarm Buzzer (GPIO 25): Silent (SAFE/MODERATE), 300ms Pulsing Tone (DANGER)
 *
 * All mock data is clearly marked with `isMock: true` and `dataSource: 'mock'`.
 * Diagnostic fields not published by the firmware (IP, Wi-Fi RSSI, uptime) are null.
 */

import type {
  SensorReading,
  DeviceStatus,
  StorageCondition,
  RiskAssessment,
  AlertEvent,
  HistoricalReading,
  EquipmentCommandState,
  FanControlState,
  StorageDashboardSnapshot,
} from '../types';

import { calculateRiskScore, classifyRisk } from '../utils/index.ts';

const NOW = new Date();

// Baseline Demonstration Sensor Readings (Demo Storage Unit)
export const MOCK_SENSOR_READING: SensorReading = {
  temperature: 4.5, // V0: 4.5 °C (Optimal refrigeration window: 2-6°C)
  humidity: 62.0, // V1: 62.0 % RH (Optimal shelf-life humidity: 60-70%)
  mq135Raw: 1120, // V2: 1120 ADC count (0 - 4095 uncalibrated analog reading)
  timestamp: NOW.toISOString(),
  isMock: true,
  dataSource: 'mock',
  isStale: false,
};

// Mathematically calculated from MOCK_SENSOR_READING using the exact updated firmware formula:
// tempContrib = 4.5 > 25 ? (4.5 - 25) * 2 : 0 = 0
// humContrib  = 62.0 > 60 ? (62.0 - 60) * 1.5 : 0 = 3.0
// gasContrib  = 1120 > 1500 ? (1120 - 1500) * 0.02 : 0 = 0
// total risk = 3.0 / 100 (SAFE <= 30)
const baselineScore = calculateRiskScore(
  MOCK_SENSOR_READING.temperature,
  MOCK_SENSOR_READING.humidity,
  MOCK_SENSOR_READING.mq135Raw,
);

export const MOCK_RISK_ASSESSMENT: RiskAssessment = {
  score: baselineScore, // 3.0 / 100
  level: classifyRisk(baselineScore), // SAFE (<= 30)
  evaluatedAt: NOW.toISOString(),
  isMock: true,
  scoreSource: 'mock',
  v5Status: 'mock',
  locallyCalculatedScore: baselineScore,
  isConsistencyMismatch: false,
};

// V3 status values strictly match firmware: SAFE | MODERATE | DANGER!
export const MOCK_STORAGE_CONDITION: StorageCondition = {
  status: 'SAFE', // V3: Firmware storage condition status (risk <= 30)
  summary: 'Chamber conditions evaluated as SAFE by firmware virtual pin V3.',
  evaluatedAt: NOW.toISOString(),
  isMock: true,
};

export const MOCK_DEVICE_STATUS: DeviceStatus = {
  deviceType: 'ESP32',
  connectionState: 'online',
  isHardwareConnected: false, // Simulated demo environment operates without physical hardware
  lastHeartbeat: NOW.toISOString(),
  isMock: true,
  dataSource: 'mock',
  // Diagnostic parameters not published by current firmware:
  ipAddress: null,
  wifiSignalStrengthRssi: null,
  firmwareVersion: null,
  uptimeSeconds: null,
};

// Actuator states in baseline SAFE condition:
// - Automatic Relay (GPIO 14): OFF (SAFE <= 30)
// - Manual Fan Relay (GPIO 2, V4): OFF (default operator command)
// - Vent Servo (GPIO 27): 0° (Closed)
// - Buzzer (GPIO 25): OFF (Silent)
export const MOCK_EQUIPMENT_STATE: EquipmentCommandState = {
  automaticRelay: 'off',
  manualFanCommand: 'off',
  manualFanPhysicalFeedback: 'unavailable',
  fanRelay: 'off',
  servoPosition: '0°',
  buzzer: 'off',
  physicalFeedback: 'unavailable', // Physical feedback unavailable in firmware
  lastCommandAt: new Date(NOW.getTime() - 1000 * 60 * 30).toISOString(),
  isMock: true,
  dataSource: 'mock',
  requestedCommand: 'off',
  physicalState: 'unavailable',
};

export const MOCK_FAN_STATE: FanControlState = MOCK_EQUIPMENT_STATE;

// Explicitly identified demonstration activity (firmware does not stream an incident feed)
export const MOCK_ALERT_EVENTS: AlertEvent[] = [
  {
    id: 'demo-001',
    timestamp: new Date(NOW.getTime() - 1000 * 60 * 30).toISOString(),
    severity: 'info',
    parameter: 'system',
    title: 'Demonstration Baseline Initialized',
    message: 'Demonstration environment initialized with baseline telemetry.',
    acknowledged: true,
  },
];

/**
 * Generates 24 hours of demonstration trend points.
 * All risk scores are strictly derived via calculateRiskScore().
 * Note: These are simulated demonstration readings; the firmware streams live V0-V3, V5 pins.
 */
export function generateMockHistoricalReadings(): HistoricalReading[] {
  const readings: HistoricalReading[] = [];
  const baseTime = NOW.getTime();

  for (let i = 23; i >= 0; i--) {
    const time = new Date(baseTime - i * 3600 * 1000);
    const hour = time.getHours();

    // Subtle sinusoidal diurnal variations
    const tempNoise = Math.sin((hour / 24) * Math.PI * 2) * 0.5;
    const humidityNoise = Math.cos((hour / 24) * Math.PI * 2) * 2.5;
    const gasNoise = Math.sin(((hour + 4) / 24) * Math.PI * 2) * 120;

    const temperature = Number((4.3 + tempNoise).toFixed(1));
    const humidity = Number((62.5 + humidityNoise).toFixed(1));
    const mq135Raw = Math.round(1100 + gasNoise);

    // Exact updated firmware risk calculation for every single data point
    const riskScore = calculateRiskScore(temperature, humidity, mq135Raw);
    // In firmware, relay turns ON during MODERATE (>30) and DANGER (>60)
    const fanRelayActive = riskScore > 30;

    readings.push({
      id: `hist-${time.getTime()}`,
      timestamp: time.toISOString(),
      temperature,
      humidity,
      mq135Raw,
      riskScore,
      fanRelayActive,
      requestedFanActive: fanRelayActive,
      isMock: true,
    });
  }

  return readings;
}

export const MOCK_HISTORICAL_READINGS: HistoricalReading[] = generateMockHistoricalReadings();

export const MOCK_DASHBOARD_SNAPSHOT: StorageDashboardSnapshot = {
  sensorReading: MOCK_SENSOR_READING,
  deviceStatus: MOCK_DEVICE_STATUS,
  storageCondition: MOCK_STORAGE_CONDITION,
  riskAssessment: MOCK_RISK_ASSESSMENT,
  fanControlState: MOCK_FAN_STATE,
  historicalReadings: MOCK_HISTORICAL_READINGS,
  recentAlerts: MOCK_ALERT_EVENTS,
  isMock: true,
};

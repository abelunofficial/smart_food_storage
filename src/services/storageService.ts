/**
 * Smart Food Storage Monitoring Dashboard - Storage Service Interface & Implementations
 *
 * Defines the contract for fetching storage telemetry, device health, risk analysis,
 * automated equipment states, and manual fan actuator control via Blynk V4.
 *
 * Hardware Pin Mapping from latest firmware:
 * - V0: Temperature (DHT22 on GPIO 4, Double °C)
 * - V1: Humidity (DHT22 on GPIO 4, Double % RH)
 * - V2: Gas Raw ADC (MQ135 on GPIO 34, Integer 0–4095)
 * - V3: Storage Condition (String: SAFE, MODERATE, DANGER!)
 * - V4: Manual Fan Switch (Integer 0/1, controls GPIO 2 relay via BLYNK_WRITE(V4))
 * - V5: Risk score (Double, 0–100)
 *
 * Actuators & Relays:
 * - Automatic Ventilation Relay (GPIO 14, Active-HIGH):
 *   SAFE (risk <= 30): OFF (LOW)
 *   MODERATE (30-60): ON (HIGH)
 *   DANGER (> 60): ON (HIGH)
 * - Manual Fan Relay (GPIO 2, Active-HIGH):
 *   V4 = 1: ON (HIGH)
 *   V4 = 0: OFF (LOW)
 *   Controlled independently from GPIO 14.
 * - Intake Vent Servo (GPIO 27, PWM): 0° in SAFE, 60° in MODERATE, 90° in DANGER.
 * - Alarm Buzzer (GPIO 25, Active-HIGH): 300ms toggling tone in DANGER. Silent in SAFE/MODERATE.
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
  TelemetryTimeRange,
  StorageConditionStatus,
  FanCommand,
  CommandedRelayState,
  CommandedServoPosition,
  CommandedBuzzerState,
} from '../types';

import {
  MOCK_SENSOR_READING,
  MOCK_DEVICE_STATUS,
  MOCK_STORAGE_CONDITION,
  MOCK_RISK_ASSESSMENT,
  MOCK_ALERT_EVENTS,
  MOCK_HISTORICAL_READINGS,
  MOCK_DASHBOARD_SNAPSHOT,
} from '../data/index.ts';

import {
  getBlynkConfig,
  testPinConnection,
  checkHardwareConnected,
  writePinV4,
} from './blynkService.ts';
import { calculateRiskScore, classifyRisk } from '../utils/index.ts';

/**
 * Derives the complete equipment state representing both independent relays and peripheral actuators.
 */
export function deriveEquipmentState(
  condition: StorageConditionStatus,
  manualFanCommand: FanCommand = 'off',
  isLive = false,
  lastCommandAt = new Date().toISOString(),
): EquipmentCommandState {
  let automaticRelay: CommandedRelayState = 'off';
  let servoPosition: CommandedServoPosition = '0°';
  let buzzer: CommandedBuzzerState = 'off';

  if (condition === 'SAFE') {
    automaticRelay = 'off'; // GPIO 14: LOW (Standby)
    servoPosition = '0°';   // GPIO 27: Closed (0°)
    buzzer = 'off';         // GPIO 25: Silent (LOW)
  } else if (condition === 'MODERATE') {
    automaticRelay = 'on';  // GPIO 14: HIGH (Active ventilation)
    servoPosition = '60°';  // GPIO 27: 60-degree intake ventilation
    buzzer = 'off';         // GPIO 25: Silent (LOW)
  } else if (condition === 'DANGER!') {
    automaticRelay = 'on';  // GPIO 14: HIGH (Active ventilation)
    servoPosition = '90°';  // GPIO 27: Full 90-degree emergency exhaust
    buzzer = 'active';      // GPIO 25: 300ms toggling alarm tone
  } else {
    automaticRelay = 'off';
    servoPosition = '0°';
    buzzer = 'off';
  }

  return {
    automaticRelay,
    manualFanCommand,
    manualFanPhysicalFeedback: 'unavailable',
    servoPosition,
    buzzer,
    lastCommandAt,
    isMock: !isLive,
    dataSource: isLive ? 'blynk_live' : 'mock',
    // Backward compatibility aliases
    fanRelay: automaticRelay,
    requestedCommand: manualFanCommand,
    physicalState: 'unavailable',
    physicalFeedback: 'unavailable',
  };
}

export interface StorageDataService {
  getCurrentReading(): Promise<SensorReading>;
  getDeviceStatus(): Promise<DeviceStatus>;
  getStorageCondition(): Promise<StorageCondition>;
  getRiskAssessment(): Promise<RiskAssessment>;
  getRecentAlerts(): Promise<AlertEvent[]>;
  getHistoricalReadings(range?: TelemetryTimeRange): Promise<HistoricalReading[]>;
  getFanState(): Promise<FanControlState>;
  getEquipmentState?(): Promise<EquipmentCommandState>;
  setFanControl(command: Partial<FanControlState>): Promise<FanControlState>;
  getDashboardSnapshot(): Promise<StorageDashboardSnapshot>;
  isLive(): boolean;
}

export class MockStorageService implements StorageDataService {
  private manualFanCommand: FanCommand = 'off';

  isLive(): boolean {
    return false;
  }

  async getCurrentReading(): Promise<SensorReading> {
    // Simulated demonstration telemetry generated client-side with browser fetch timestamp.
    return {
      ...MOCK_SENSOR_READING,
      timestamp: new Date().toISOString(),
      isStale: false,
    };
  }

  async getDeviceStatus(): Promise<DeviceStatus> {
    return {
      ...MOCK_DEVICE_STATUS,
      lastHeartbeat: new Date().toISOString(),
    };
  }

  async getStorageCondition(): Promise<StorageCondition> {
    return {
      ...MOCK_STORAGE_CONDITION,
      evaluatedAt: new Date().toISOString(),
    };
  }

  async getRiskAssessment(): Promise<RiskAssessment> {
    return {
      ...MOCK_RISK_ASSESSMENT,
      evaluatedAt: new Date().toISOString(),
    };
  }

  async getRecentAlerts(): Promise<AlertEvent[]> {
    return [...MOCK_ALERT_EVENTS];
  }

  async getHistoricalReadings(range: TelemetryTimeRange = '24h'): Promise<HistoricalReading[]> {
    if (range === '1h') {
      return MOCK_HISTORICAL_READINGS.slice(-2);
    }
    if (range === '6h') {
      return MOCK_HISTORICAL_READINGS.slice(-6);
    }
    return [...MOCK_HISTORICAL_READINGS];
  }

  async getFanState(): Promise<FanControlState> {
    return deriveEquipmentState(MOCK_STORAGE_CONDITION.status, this.manualFanCommand, false);
  }

  async getEquipmentState(): Promise<EquipmentCommandState> {
    return this.getFanState();
  }

  async setFanControl(command: Partial<FanControlState>): Promise<FanControlState> {
    const newCmd = command.manualFanCommand || command.requestedCommand || 'off';
    this.manualFanCommand = newCmd;
    return deriveEquipmentState(MOCK_STORAGE_CONDITION.status, newCmd, false);
  }

  async getDashboardSnapshot(): Promise<StorageDashboardSnapshot> {
    return {
      ...MOCK_DASHBOARD_SNAPSHOT,
      fanControlState: await this.getFanState(),
    };
  }
}

/**
 * Live Read/Write Blynk IoT Storage Service
 *
 * Implements live telemetry ingestion and V4 manual fan actuation:
 * - V0: Temperature (DHT22, GPIO 4)
 * - V1: Humidity (DHT22, GPIO 4)
 * - V2: MQ135 raw ADC (GPIO 34)
 * - V3: Storage condition (SAFE, MODERATE, DANGER!)
 * - V4: Manual fan relay command (GPIO 2, 0 = OFF, 1 = ON)
 * - V5: Primary live risk score (Double, 0-100)
 */
export class BlynkStorageService implements StorageDataService {
  private mockService = new MockStorageService();
  private lastSnapshotCache: { data: StorageDashboardSnapshot; fetchedAt: number } | null = null;
  private lastReadingCache: SensorReading | null = null;
  private lastKnownManualFanCommand: FanCommand = 'off';
  private readonly CACHE_TTL_MS = 2500;

  isLive(): boolean {
    const config = getBlynkConfig();
    return Boolean(config.token && config.token.trim().length > 0);
  }

  async getCurrentReading(): Promise<SensorReading> {
    if (!this.isLive()) {
      return this.mockService.getCurrentReading();
    }

    const isHardwareOnline = await checkHardwareConnected();
    if (!isHardwareOnline) {
      if (this.lastReadingCache) {
        return {
          ...this.lastReadingCache,
          isStale: true,
          // STRICT RULE: Retain original timestamp of cached reading
        };
      }
      return {
        ...MOCK_SENSOR_READING,
        isStale: true,
      };
    }

    try {
      const [v0Res, v1Res, v2Res] = await Promise.all([
        testPinConnection('v0'),
        testPinConnection('v1'),
        testPinConnection('v2'),
      ]);

      if (v0Res.success && v1Res.success && v2Res.success) {
        // NOTE: Blynk's scalar /get endpoint delivers raw text values without hardware measurement
        // timestamps. The timestamp below is a browser-side ingestion/fetch timestamp created upon
        // completing the HTTP response; it is NOT an ESP32 measurement timestamp and does not prove
        // that edge hardware generated a new observation between polls.
        const reading: SensorReading = {
          temperature: v0Res.data as number,
          humidity: v1Res.data as number,
          mq135Raw: v2Res.data as number,
          timestamp: new Date().toISOString(),
          isMock: false,
          dataSource: 'blynk_live',
          isStale: false,
        };
        this.lastReadingCache = reading;
        return reading;
      }

      if (this.lastReadingCache) {
        return {
          ...this.lastReadingCache,
          isStale: true,
        };
      }

      return {
        ...MOCK_SENSOR_READING,
        isStale: true,
      };
    } catch {
      if (this.lastReadingCache) {
        return {
          ...this.lastReadingCache,
          isStale: true,
        };
      }
      return {
        ...MOCK_SENSOR_READING,
        isStale: true,
      };
    }
  }

  async getStorageCondition(): Promise<StorageCondition> {
    if (!this.isLive()) {
      return this.mockService.getStorageCondition();
    }

    const v3Res = await testPinConnection('v3');
    if (!v3Res.success) {
      return {
        status: 'UNAVAILABLE',
        summary: 'Storage condition is currently unavailable from edge hardware.',
        evaluatedAt: new Date().toISOString(),
        isMock: false,
      };
    }

    const status = v3Res.data as StorageConditionStatus;
    const summaries: Record<StorageConditionStatus, string> = {
      SAFE: 'Chamber conditions are within safe preservation parameters (Risk <= 30).',
      MODERATE: 'Chamber conditions show elevated spoilage factors (Risk 31–60).',
      'DANGER!': 'Critical conditions detected! Active buzzer alarm triggered (Risk > 60).',
      UNAVAILABLE: 'Storage condition is currently unavailable from edge hardware.',
    };

    return {
      status,
      summary: summaries[status] || `Storage status: ${status}`,
      evaluatedAt: new Date().toISOString(),
      isMock: false,
    };
  }

  async getRiskAssessment(): Promise<RiskAssessment> {
    if (!this.isLive()) {
      return this.mockService.getRiskAssessment();
    }

    const [v5Res, v0Res, v1Res, v2Res] = await Promise.all([
      testPinConnection('v5'),
      testPinConnection('v0'),
      testPinConnection('v1'),
      testPinConnection('v2'),
    ]);

    let locallyCalculatedScore: number | undefined;
    if (v0Res.success && v1Res.success && v2Res.success) {
      locallyCalculatedScore = calculateRiskScore(
        v0Res.data as number,
        v1Res.data as number,
        v2Res.data as number,
      );
    }

    if (v5Res.success) {
      const v5Score = v5Res.data as number;
      const level = classifyRisk(v5Score);
      const isMismatch =
        locallyCalculatedScore !== undefined
          ? Math.abs(v5Score - locallyCalculatedScore) > 2.0
          : false;

      return {
        score: v5Score,
        level,
        evaluatedAt: new Date().toISOString(),
        isMock: false,
        scoreSource: 'blynk_v5',
        v5Status: 'operational',
        locallyCalculatedScore,
        isConsistencyMismatch: isMismatch,
      };
    }

    const isUnconfigured =
      Boolean(v5Res.isPinUnconfigured) ||
      (v5Res.rawText?.toLowerCase().includes("doesn't exist") ?? false) ||
      (v5Res.error?.toLowerCase().includes("doesn't exist") ?? false);

    const fallbackLevel =
      locallyCalculatedScore !== undefined ? classifyRisk(locallyCalculatedScore) : 'SAFE';

    return {
      score: null, // STRICT RULE: Do not silently substitute local risk if V5 is missing/unavailable!
      level: fallbackLevel,
      evaluatedAt: new Date().toISOString(),
      isMock: false,
      scoreSource: 'locally_calculated',
      v5Status: isUnconfigured ? 'unconfigured' : 'error',
      v5ErrorMessage: isUnconfigured
        ? "Requested pin doesn't exist in the product Temperature Display. V5 datastream is unconfigured in Blynk Console."
        : v5Res.error || 'Failed to query Virtual Pin V5 from Blynk Cloud.',
      locallyCalculatedScore,
      isConsistencyMismatch: false,
    };
  }

  async getDeviceStatus(): Promise<DeviceStatus> {
    if (!this.isLive()) {
      return this.mockService.getDeviceStatus();
    }

    const isConnected = await checkHardwareConnected();

    return {
      deviceType: 'ESP32',
      connectionState: isConnected ? 'online' : 'offline',
      isHardwareConnected: isConnected,
      lastHeartbeat: new Date().toISOString(),
      isMock: false,
      dataSource: 'blynk_live',
      ipAddress: null,
      wifiSignalStrengthRssi: null,
      firmwareVersion: null,
      uptimeSeconds: null,
    };
  }

  async getRecentAlerts(): Promise<AlertEvent[]> {
    return this.mockService.getRecentAlerts();
  }

  async getHistoricalReadings(range: TelemetryTimeRange = '24h'): Promise<HistoricalReading[]> {
    return this.mockService.getHistoricalReadings(range);
  }

  async getFanState(): Promise<FanControlState> {
    return this.getEquipmentState();
  }

  async getEquipmentState(): Promise<EquipmentCommandState> {
    if (!this.isLive()) {
      return this.mockService.getFanState();
    }

    const [condition, v4Res] = await Promise.all([
      this.getStorageCondition(),
      testPinConnection('v4'),
    ]);

    if (v4Res.success && (v4Res.data === 'on' || v4Res.data === 'off')) {
      this.lastKnownManualFanCommand = v4Res.data as FanCommand;
    }

    return deriveEquipmentState(condition.status, this.lastKnownManualFanCommand, true);
  }

  async setFanControl(command: Partial<FanControlState>): Promise<FanControlState> {
    if (!this.isLive()) {
      return this.mockService.setFanControl(command);
    }

    const newCmd = command.manualFanCommand || command.requestedCommand || 'off';
    
    // Dispatch write to Virtual Pin V4 on Blynk Cloud
    const writeResult = await writePinV4(newCmd);
    if (!writeResult.success) {
      throw new Error(`Failed to update manual fan state on Virtual Pin V4: ${writeResult.error}`);
    }

    this.lastKnownManualFanCommand = newCmd;
    const condition = await this.getStorageCondition();
    return deriveEquipmentState(condition.status, newCmd, true);
  }

  async getDashboardSnapshot(): Promise<StorageDashboardSnapshot> {
    if (!this.isLive()) {
      return this.mockService.getDashboardSnapshot();
    }

    const now = Date.now();
    if (this.lastSnapshotCache && now - this.lastSnapshotCache.fetchedAt < this.CACHE_TTL_MS) {
      return this.lastSnapshotCache.data;
    }

    try {
      const [
        sensorReading,
        deviceStatus,
        storageCondition,
        riskAssessment,
        fanControlState,
        historicalReadings,
        recentAlerts,
      ] = await Promise.all([
        this.getCurrentReading(),
        this.getDeviceStatus(),
        this.getStorageCondition(),
        this.getRiskAssessment(),
        this.getFanState(),
        this.getHistoricalReadings('24h'),
        this.getRecentAlerts(),
      ]);

      const snapshot: StorageDashboardSnapshot = {
        sensorReading,
        deviceStatus,
        storageCondition,
        riskAssessment,
        fanControlState,
        historicalReadings,
        recentAlerts,
        isMock: sensorReading.isMock,
      };

      this.lastSnapshotCache = { data: snapshot, fetchedAt: now };
      return snapshot;
    } catch {
      if (this.lastSnapshotCache) {
        return this.lastSnapshotCache.data;
      }
      return this.mockService.getDashboardSnapshot();
    }
  }
}

export const storageService: StorageDataService = new BlynkStorageService();

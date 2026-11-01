/**
 * Smart Food Storage Monitoring Dashboard - Experimental Spoilage Types
 *
 * Domain types for experimental gas-based food spoilage monitoring:
 * - Food batch management (categories, storage start date, notes)
 * - Fresh-food baseline calibration (multi-sample collection, robust statistics)
 * - Relative gas deviation calculation: D = (|G - B| / B) * 100
 * - Configurable experimental warning thresholds and interface states
 *
 * STRICT SENSOR DISCLAIMER:
 * The MQ135 sensor on GPIO 34 (Virtual Pin V2) provides an uncalibrated raw analog
 * voltage reading (0-4095 ADC). It does not measure gas concentration in ppm,
 * cannot identify individual volatile organic compounds, and is NOT a certified
 * food safety detector. All deviation metrics are experimental monitoring signals.
 */

export type FoodCategory =
  | 'fruits'
  | 'vegetables'
  | 'grains'
  | 'meat'
  | 'fish'
  | 'mixed'
  | 'other';

export const FOOD_CATEGORY_LABELS: Record<FoodCategory, string> = {
  fruits: 'Fruits',
  vegetables: 'Vegetables',
  grains: 'Grains & Cereals',
  meat: 'Meat',
  fish: 'Fish & Seafood',
  mixed: 'Mixed Foods',
  other: 'Other Food Item',
};

export type BatchMonitoringStatus = 'active' | 'archived';

export type GasDeviationDirection = 'increased' | 'decreased' | 'unchanged' | 'unknown';

export type SensorConditioningStatus = 'unknown' | 'preheating' | 'conditioned';

export type BaselineCalibrationStatus =
  | 'uncalibrated'
  | 'calibrating'
  | 'calibrated'
  | 'failed';

/**
 * 7 strict interface warning states required by Section 6:
 * 1. Baseline established
 * 2. Within configured range (provisional demonstration band)
 * 3. Change detected
 * 4. Significant change
 * 5. Insufficient data
 * 6. Sensor data stale
 * 7. Calibration required
 */
export type ExperimentalWarningStatus =
  | 'baseline_established'
  | 'within_range'
  | 'change_detected'
  | 'significant_change'
  | 'insufficient_data'
  | 'sensor_stale'
  | 'calibration_required';

export interface PreviousBaselineRecord {
  baseline: number;
  calibratedAt: string;
  sampleCount: number;
}

export interface FoodBatch {
  id: string; // Unique identifier (e.g. batch-1730460000000-xyz)
  name: string; // Friendly label (e.g. "Honeycrisp Apples - Row A")
  categories: FoodCategory[]; // Multiple food categories allowed
  storageStartDate: string; // ISO 8601 storage start date
  notes?: string; // Optional operator remarks
  baselineStatus: BaselineCalibrationStatus;
  baselineReading: number | null; // Fresh-food baseline raw ADC reading (0-4095)
  baselineCalibrationTimestamp: string | null; // ISO 8601 timestamp
  baselineSampleCount?: number; // Number of readings averaged
  monitoringStatus: BatchMonitoringStatus;
  warningThreshold: number; // e.g. 15.0% provisional relative deviation
  significantChangeThreshold: number; // e.g. 30.0% provisional relative deviation
  isThresholdValidated: boolean; // False until experimentally calibrated
  previousBaselines?: PreviousBaselineRecord[]; // History of recalibrations
  isDemo?: boolean; // Explicit flag: true only for demonstration batches
  createdAt: string;
  updatedAt: string;
}

export interface GasDeviationAssessment {
  currentRawGas: number | null; // G: current representative ADC reading
  baseline: number | null; // B: confirmed fresh-food baseline ADC reading
  absoluteDifference: number | null; // |G - B|
  signedDifference: number | null; // G - B (+ for increase, - for decrease)
  relativeDeviationPercent: number | null; // D = (|G - B| / B) * 100
  direction: GasDeviationDirection; // 'increased' | 'decreased' | 'unchanged' | 'unknown'
  status: ExperimentalWarningStatus;
  statusLabel: string;
  evaluatedAt: string; // ISO 8601 timestamp of latest valid reading
  isStale: boolean;
  warningThreshold: number;
  significantChangeThreshold: number;
  summaryMessage: string;
  isDemo?: boolean;
}

export interface GasHistoricalPoint {
  id: string;
  timestamp: string; // ISO 8601
  rawGas: number; // V2: MQ135 raw ADC reading (0-4095)
  temperature?: number; // V0 (°C)
  humidity?: number; // V1 (% RH)
  deviationPercent?: number | null; // Calculated relative deviation if baseline exists
  signedDifference?: number | null; // G - B
  direction?: GasDeviationDirection;
  isStale?: boolean;
  batchId?: string;
  isDemo?: boolean;
}

export interface CalibrationSample {
  adc: number;
  timestamp: string; // Telemetry ingestion timestamp
  isMock?: boolean;
}

export interface CalibrationSession {
  batchId: string;
  samples: number[];
  sampleRecords?: CalibrationSample[];
  requiredSamples: number; // Default: 5 samples
  toleranceADC: number; // Stability window: max - min <= tolerance (default 50)
  isStable: boolean;
  calculatedBaseline: number | null;
  status: 'idle' | 'collecting' | 'ready_to_confirm' | 'confirmed' | 'cancelled' | 'error';
  errorMessage?: string;
  startedAt?: string;
}


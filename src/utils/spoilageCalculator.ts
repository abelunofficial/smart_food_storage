/**
 * Smart Food Storage Monitoring Dashboard - Experimental Spoilage Calculation Utility
 *
 * Implements mathematical algorithms for relative gas deviation monitoring:
 *   D = (|G - B| / B) * 100
 *
 * Where:
 *   G = Current representative gas sensor reading (MQ135 raw ADC, 0-4095)
 *   B = Confirmed fresh-food baseline (MQ135 raw ADC, 0-4095)
 *   D = Absolute relative gas deviation percentage
 *
 * STRICT SENSOR CONSTRAINTS:
 * - The MQ135 is an uncalibrated cross-sensitive analog sensor.
 * - Raw ADC values are NEVER called ppm or converted to gas concentration.
 * - Deviation D represents change from baseline, NOT "food spoilage percentage".
 * - Higher or lower ADC values do not confirm food spoilage without empirical chemical assay.
 */

import type {
  FoodBatch,
  ExperimentalWarningStatus,
  GasDeviationAssessment,
} from '../types/spoilage.ts';

/**
 * Calculates the statistical median of a sample array.
 * Provides a robust central tendency metric resistant to single-reading spikes.
 */
export function calculateMedian(values: number[]): number | null {
  if (!values || values.length === 0) return null;
  const filtered = values.filter((v) => Number.isFinite(v) && v >= 0 && v <= 4095);
  if (filtered.length === 0) return null;

  const sorted = [...filtered].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 !== 0) {
    return sorted[mid];
  }
  return Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(1));
}

/**
 * Checks whether a sequence of ADC samples satisfies the stability tolerance window.
 * 
 * @param samples Array of raw ADC samples collected during calibration
 * @param toleranceADC Maximum permitted spread (max - min) in ADC counts (default: 50)
 */
export function checkSampleStability(
  samples: number[],
  toleranceADC = 50,
): { isStable: boolean; spread: number } {
  if (!samples || samples.length < 2) {
    return { isStable: false, spread: 0 };
  }
  const min = Math.min(...samples);
  const max = Math.max(...samples);
  const spread = max - min;
  return {
    isStable: spread <= toleranceADC,
    spread,
  };
}

export interface GasDeviationCalculation {
  absoluteDiff: number;
  signedDiff: number;
  relativeDeviationPercent: number;
  direction: 'increased' | 'decreased' | 'unchanged';
}

/**
 * Computes the absolute and relative deviation between current gas reading and baseline,
 * preserving both absolute magnitude and signed directional change (increased/decreased/unchanged).
 * 
 * Formula:
 *   D = (|G - B| / B) * 100
 *   signedDiff = G - B
 *
 * Safety Guards:
 * - Rejects non-finite, negative, or > 4095 ADC counts.
 * - Rejects baseline <= 0 to eliminate division by zero.
 */
export function calculateGasDeviation(
  currentGas: number | null | undefined,
  baseline: number | null | undefined,
): GasDeviationCalculation | null {
  if (
    currentGas === null ||
    currentGas === undefined ||
    !Number.isFinite(currentGas) ||
    currentGas < 0 ||
    currentGas > 4095
  ) {
    return null;
  }

  if (
    baseline === null ||
    baseline === undefined ||
    !Number.isFinite(baseline) ||
    baseline <= 0 ||
    baseline > 4095
  ) {
    return null;
  }

  const signedDiff = currentGas - baseline;
  const absoluteDiff = Math.abs(signedDiff);
  const relativePercent = Number(((absoluteDiff / baseline) * 100).toFixed(1));

  let direction: 'increased' | 'decreased' | 'unchanged' = 'unchanged';
  if (signedDiff > 0) {
    direction = 'increased';
  } else if (signedDiff < 0) {
    direction = 'decreased';
  }

  return {
    absoluteDiff,
    signedDiff,
    relativeDeviationPercent: relativePercent,
    direction,
  };
}

/**
 * Classifies the experimental warning state according to Section 6 interface states.
 */
export function classifyWarningStatus(
  batch: FoodBatch | null | undefined,
  currentGas: number | null | undefined,
  isStale = false,
): ExperimentalWarningStatus {
  if (isStale) {
    return 'sensor_stale';
  }

  if (!batch || batch.baselineStatus !== 'calibrated' || batch.baselineReading === null) {
    return 'calibration_required';
  }

  if (
    currentGas === null ||
    currentGas === undefined ||
    !Number.isFinite(currentGas) ||
    currentGas < 0 ||
    currentGas > 4095
  ) {
    return 'insufficient_data';
  }

  const deviation = calculateGasDeviation(currentGas, batch.baselineReading);
  if (!deviation) {
    return 'insufficient_data';
  }

  const { relativeDeviationPercent } = deviation;
  const warningThresh = batch.warningThreshold || 15.0;
  const significantThresh = batch.significantChangeThreshold || 30.0;

  if (relativeDeviationPercent >= significantThresh) {
    return 'significant_change';
  }

  if (relativeDeviationPercent >= warningThresh) {
    return 'change_detected';
  }

  return 'within_range';
}

export interface StatusMetadata {
  label: string;
  badgeClass: string;
  textClass: string;
  summary: string;
}

export function getWarningStatusMetadata(status: ExperimentalWarningStatus): StatusMetadata {
  switch (status) {
    case 'within_range':
      return {
        label: 'Within Provisional Range',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        textClass: 'text-emerald-700',
        summary: 'Current gas reading is within the provisional baseline tolerance band (±15%). This relative metric does not certify food freshness or food safety.',
      };
    case 'change_detected':
      return {
        label: 'Change Detected',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        textClass: 'text-amber-800',
        summary: 'Sensor reading deviates from fresh-food baseline beyond provisional warning threshold. Does not independently prove spoilage; inspect chamber.',
      };
    case 'significant_change':
      return {
        label: 'Significant Change',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-300',
        textClass: 'text-rose-800',
        summary: 'Significant deviation from provisional baseline detected. Recommended physical inspection of food goods. Not a certified spoilage assay.',
      };
    case 'baseline_established':
      return {
        label: 'Baseline Established',
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
        textClass: 'text-blue-700',
        summary: 'Fresh-food baseline recorded for this batch. Monitoring relative atmospheric alterations from this initial reference.',
      };
    case 'calibration_required':
      return {
        label: 'Calibration Required',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        textClass: 'text-slate-700',
        summary: 'No active baseline calibrated for this batch. Complete baseline calibration with fresh food loaded to track relative atmosphere shifts.',
      };
    case 'sensor_stale':
      return {
        label: 'Sensor Data Stale',
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
        textClass: 'text-amber-700',
        summary: 'Live gas telemetry is currently interrupted. Displaying cached measurement.',
      };
    case 'insufficient_data':
    default:
      return {
        label: 'Insufficient Data',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
        textClass: 'text-slate-600',
        summary: 'Awaiting sufficient valid ADC readings from Virtual Pin V2 to compute deviation.',
      };
  }
}

/**
 * Produces a complete experimental gas deviation assessment.
 */
export function evaluateGasDeviation(
  batch: FoodBatch | null | undefined,
  currentGas: number | null | undefined,
  timestamp: string,
  isStale = false,
): GasDeviationAssessment {
  const status = classifyWarningStatus(batch, currentGas, isStale);
  const metadata = getWarningStatusMetadata(status);

  const baseline = batch?.baselineStatus === 'calibrated' ? batch.baselineReading : null;
  const deviation = calculateGasDeviation(currentGas, baseline);

  return {
    currentRawGas: currentGas ?? null,
    baseline: baseline ?? null,
    absoluteDifference: deviation ? deviation.absoluteDiff : null,
    signedDifference: deviation ? deviation.signedDiff : null,
    relativeDeviationPercent: deviation ? deviation.relativeDeviationPercent : null,
    direction: deviation ? deviation.direction : 'unknown',
    status,
    statusLabel: metadata.label,
    evaluatedAt: timestamp,
    isStale,
    warningThreshold: batch?.warningThreshold ?? 15.0,
    significantChangeThreshold: batch?.significantChangeThreshold ?? 30.0,
    summaryMessage: metadata.summary,
    isDemo: Boolean(batch?.isDemo),
  };
}


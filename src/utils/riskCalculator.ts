/**
 * Smart Food Storage Monitoring Dashboard - Risk Calculation Utility
 *
 * Implements the exact risk formula published by the latest ESP32 hardware firmware:
 *   const temperatureContribution = temperature > 25 ? (temperature - 25) * 2 : 0;
 *   const humidityContribution = humidity > 60 ? (humidity - 60) * 1.5 : 0;
 *   const gasContribution = gasRaw > 1500 ? (gasRaw - 1500) * 0.02 : 0;
 *   const riskScore = Math.min(100, temperatureContribution + humidityContribution + gasContribution);
 *
 * Exact Decimal Classifications:
 *   - SAFE: risk <= 30
 *   - MODERATE: risk > 30 and <= 60
 *   - DANGER: risk > 60
 */

import type { StorageConditionStatus } from '../types';

export type RiskLevel = 'SAFE' | 'MODERATE' | 'DANGER';

export const RISK_THRESHOLDS = {
  SAFE_MAX: 30,
  MODERATE_MAX: 60,
} as const;

export interface RiskBreakdown {
  tempContribution: number;
  humidityContribution: number;
  gasContribution: number;
  totalScore: number;
  level: RiskLevel;
}

/**
 * Calculates environmental risk score according to the latest firmware mathematical model.
 * 
 * @param temperature Temperature in degrees Celsius (°C)
 * @param humidity Relative humidity percentage (% RH, 0-100)
 * @param gasRaw MQ135 raw analog ADC reading (0-4095)
 * @returns Clamped risk score between 0.0 and 100.0 (rounded to 1 decimal place)
 */
export function calculateRiskScore(temperature: number, humidity: number, gasRaw: number): number {
  const temperatureContribution = temperature > 25 ? (temperature - 25) * 2 : 0;
  const humidityContribution = humidity > 60 ? (humidity - 60) * 1.5 : 0;
  const gasContribution = gasRaw > 1500 ? (gasRaw - 1500) * 0.02 : 0;

  const rawScore = temperatureContribution + humidityContribution + gasContribution;
  const clamped = Math.min(100, Math.max(0, rawScore));

  return Number(clamped.toFixed(1));
}

/**
 * Computes individual parameter contributions to the total risk score.
 */
export function calculateRiskBreakdown(temperature: number, humidity: number, gasRaw: number): RiskBreakdown {
  const tempContribution = Number((temperature > 25 ? (temperature - 25) * 2 : 0).toFixed(1));
  const humidityContribution = Number((humidity > 60 ? (humidity - 60) * 1.5 : 0).toFixed(1));
  const gasContribution = Number((gasRaw > 1500 ? (gasRaw - 1500) * 0.02 : 0).toFixed(2));
  const totalScore = calculateRiskScore(temperature, humidity, gasRaw);
  const level = classifyRisk(totalScore);

  return {
    tempContribution,
    humidityContribution,
    gasContribution,
    totalScore,
    level,
  };
}

/**
 * Classifies a risk score into the firmware's discrete risk levels.
 * Boundaries:
 *   - SAFE: score <= 30
 *   - MODERATE: score > 30 and <= 60
 *   - DANGER: score > 60
 */
export function classifyRisk(score: number): RiskLevel {
  if (score <= RISK_THRESHOLDS.SAFE_MAX) {
    return 'SAFE';
  }
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) {
    return 'MODERATE';
  }
  return 'DANGER';
}

/**
 * Classifies a risk score into the firmware's discrete storage condition status (Pin V3 alignment).
 * Exact boundaries:
 *   - SAFE: score <= 30
 *   - MODERATE: score > 30 and <= 60
 *   - DANGER!: score > 60
 */
export function classifyStorageCondition(score: number): StorageConditionStatus {
  if (score <= RISK_THRESHOLDS.SAFE_MAX) {
    return 'SAFE';
  }
  if (score <= RISK_THRESHOLDS.MODERATE_MAX) {
    return 'MODERATE';
  }
  return 'DANGER!';
}

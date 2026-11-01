/**
 * Smart Food Storage Monitoring Dashboard - Food Spoilage Persistence Service
 *
 * Implements client-side batch registration, fresh-food baseline management,
 * and lightweight frontend gas history persistence via browser localStorage.
 *
 * CONSTRAINTS:
 * - Purely frontend-only (no backend / database dependencies).
 * - Safe error handling against missing or corrupted localStorage data.
 * - Never stores or touches Blynk credentials.
 * - Explains clearly that data is stored in the local browser session.
 */

import type {
  FoodBatch,
  FoodCategory,
  GasHistoricalPoint,
  CalibrationSession,
  CalibrationSample,
  GasDeviationDirection,
} from '../types/spoilage.ts';

import {
  calculateMedian,
  checkSampleStability,
} from '../utils/spoilageCalculator.ts';

const STORAGE_KEY_BATCHES = 'sfs_food_batches_v1';
const STORAGE_KEY_ACTIVE_BATCH_ID = 'sfs_active_batch_id_v1';
const STORAGE_KEY_GAS_HISTORY = 'sfs_gas_history_v1';
const MAX_HISTORY_POINTS = 100;

export interface CreateBatchInput {
  name: string;
  categories: FoodCategory[];
  storageStartDate?: string;
  notes?: string;
  warningThreshold?: number;
  significantChangeThreshold?: number;
}

class SpoilageService {
  private activeCalibrationSession: CalibrationSession | null = null;

  /**
   * Safe getter for window.localStorage
   */
  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage;
    } catch {
      return null;
    }
  }

  /**
   * Loads all food batches from localStorage with resilient fallback.
   * STRICT BEHAVIOR: Returns empty array [] when storage is empty.
   * Does NOT automatically invent fictitious demo batches.
   */
  getBatches(): FoodBatch[] {
    const storage = this.getStorage();
    if (!storage) return [];

    try {
      const raw = storage.getItem(STORAGE_KEY_BATCHES);
      if (!raw) return [];

      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed as FoodBatch[];
      }
      return [];
    } catch (err) {
      console.warn('Failed to parse food batches from localStorage, returning empty array', err);
      return [];
    }
  }

  /**
   * Explicit DEMO Mode: Creates an isolated, visibly tagged demonstration batch.
   * Only called when the operator explicitly clicks "Load Demonstration Batch".
   */
  loadDemoBatch(): FoodBatch {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 3600 * 1000);

    const demoBatch: FoodBatch = {
      id: 'batch-demo-001',
      name: '[DEMO] Honeycrisp Apples (Demonstration Batch)',
      categories: ['fruits'],
      storageStartDate: twoDaysAgo.toISOString().split('T')[0],
      notes: 'Demonstration batch for testing interface workflows only. Not connected to physical food items.',
      baselineStatus: 'calibrated',
      baselineReading: 1120, // Baseline matching safe demo reading
      baselineCalibrationTimestamp: twoDaysAgo.toISOString(),
      baselineSampleCount: 5,
      monitoringStatus: 'active',
      warningThreshold: 15.0,
      significantChangeThreshold: 30.0,
      isThresholdValidated: false,
      previousBaselines: [],
      isDemo: true,
      createdAt: twoDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString(),
    };

    const current = this.getBatches();
    const existingIndex = current.findIndex((b) => b.id === demoBatch.id);
    let updated: FoodBatch[];
    if (existingIndex >= 0) {
      updated = [...current];
      updated[existingIndex] = demoBatch;
    } else {
      updated = [demoBatch, ...current];
    }

    this.saveBatches(updated);
    this.setActiveBatchId(demoBatch.id);
    return demoBatch;
  }

  /**
   * Persists batches to localStorage.
   */
  private saveBatches(batches: FoodBatch[]): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY_BATCHES, JSON.stringify(batches));
    } catch (err) {
      console.error('Failed to write food batches to localStorage', err);
    }
  }

  /**
   * Returns the currently selected active batch, or null if none active.
   */
  getActiveBatch(): FoodBatch | null {
    const batches = this.getBatches();
    const storage = this.getStorage();
    const activeId = storage ? storage.getItem(STORAGE_KEY_ACTIVE_BATCH_ID) : null;

    if (activeId) {
      const found = batches.find((b) => b.id === activeId && b.monitoringStatus === 'active');
      if (found) return found;
    }

    // Fallback: first active batch
    const firstActive = batches.find((b) => b.monitoringStatus === 'active');
    if (firstActive) {
      this.setActiveBatchId(firstActive.id);
      return firstActive;
    }

    return null;
  }

  /**
   * Sets the active batch ID.
   */
  setActiveBatchId(id: string): void {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(STORAGE_KEY_ACTIVE_BATCH_ID, id);
    } catch (err) {
      console.error('Failed to set active batch ID', err);
    }
  }

  /**
   * Creates and registers a new food batch.
   * NOTE: Each new batch starts with baselineStatus: 'uncalibrated' to prevent accidental reuse of prior baselines.
   */
  createBatch(input: CreateBatchInput): FoodBatch {
    const batches = this.getBatches();
    const now = new Date().toISOString();

    const newBatch: FoodBatch = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      name: input.name.trim() || `Batch #${batches.length + 1}`,
      categories: input.categories && input.categories.length > 0 ? input.categories : ['other'],
      storageStartDate: input.storageStartDate || now.split('T')[0],
      notes: input.notes?.trim() || '',
      baselineStatus: 'uncalibrated',
      baselineReading: null, // STRICT RULE: Do not automatically reuse previous batch's baseline!
      baselineCalibrationTimestamp: null,
      monitoringStatus: 'active',
      warningThreshold: input.warningThreshold ?? 15.0,
      significantChangeThreshold: input.significantChangeThreshold ?? 30.0,
      isThresholdValidated: false,
      previousBaselines: [],
      createdAt: now,
      updatedAt: now,
    };

    const updated = [newBatch, ...batches];
    this.saveBatches(updated);
    this.setActiveBatchId(newBatch.id);
    return newBatch;
  }

  /**
   * Updates an existing batch.
   */
  updateBatch(id: string, updates: Partial<FoodBatch>): FoodBatch {
    const batches = this.getBatches();
    let updatedBatch: FoodBatch | null = null;

    const nextBatches = batches.map((b) => {
      if (b.id === id) {
        updatedBatch = {
          ...b,
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        return updatedBatch;
      }
      return b;
    });

    if (!updatedBatch) {
      throw new Error(`Batch with ID "${id}" not found.`);
    }

    this.saveBatches(nextBatches);
    return updatedBatch;
  }

  /**
   * Archives a batch (stops active monitoring).
   */
  archiveBatch(id: string): FoodBatch {
    const updated = this.updateBatch(id, { monitoringStatus: 'archived' });
    const active = this.getActiveBatch();
    if (active && active.id === id) {
      const remaining = this.getBatches().filter((b) => b.id !== id && b.monitoringStatus === 'active');
      if (remaining.length > 0) {
        this.setActiveBatchId(remaining[0].id);
      }
    }
    return updated;
  }

  /**
   * Deletes a batch permanently from local browser storage.
   * Also purges all historical gas telemetry associated with this batch,
   * while preserving historical data for all other batches.
   */
  deleteBatch(id: string): void {
    const batches = this.getBatches();
    const nextBatches = batches.filter((b) => b.id !== id);
    this.saveBatches(nextBatches);

    // Purge historical telemetry points belonging to the deleted batch
    this.clearGasHistory(id);

    const storage = this.getStorage();
    if (storage && storage.getItem(STORAGE_KEY_ACTIVE_BATCH_ID) === id) {
      const nextActive = nextBatches.find((b) => b.monitoringStatus === 'active');
      if (nextActive) {
        this.setActiveBatchId(nextActive.id);
      } else {
        storage.removeItem(STORAGE_KEY_ACTIVE_BATCH_ID);
      }
    }
  }

  /**
   * Saves a confirmed fresh-food baseline for the given batch.
   * Preserves previous calibration record when recalibrating.
   */
  saveConfirmedBaseline(batchId: string, baseline: number, sampleCount: number): FoodBatch {
    const batches = this.getBatches();
    const target = batches.find((b) => b.id === batchId);
    if (!target) throw new Error(`Batch with ID "${batchId}" not found`);

    const now = new Date().toISOString();
    const previous = [...(target.previousBaselines || [])];

    if (target.baselineReading !== null && target.baselineCalibrationTimestamp) {
      previous.unshift({
        baseline: target.baselineReading,
        calibratedAt: target.baselineCalibrationTimestamp,
        sampleCount: target.baselineSampleCount || 1,
      });
    }

    const updated = this.updateBatch(batchId, {
      baselineStatus: 'calibrated',
      baselineReading: Number(baseline.toFixed(1)),
      baselineCalibrationTimestamp: now,
      baselineSampleCount: sampleCount,
      isThresholdValidated: true,
      previousBaselines: previous,
    });

    this.activeCalibrationSession = null;
    return updated;
  }

  /**
   * Updates warning & significant change thresholds with strict validation.
   */
  updateThresholds(batchId: string, warningThreshold: number, significantChangeThreshold: number): FoodBatch {
    if (!Number.isFinite(warningThreshold) || warningThreshold <= 0) {
      throw new Error('Warning threshold must be a positive number greater than 0%.');
    }
    if (!Number.isFinite(significantChangeThreshold) || significantChangeThreshold <= 0) {
      throw new Error('Significant change threshold must be a positive number greater than 0%.');
    }
    if (warningThreshold >= significantChangeThreshold) {
      throw new Error('Warning threshold must be strictly less than the significant change threshold.');
    }

    return this.updateBatch(batchId, {
      warningThreshold: Number(warningThreshold.toFixed(1)),
      significantChangeThreshold: Number(significantChangeThreshold.toFixed(1)),
    });
  }

  // ---------------------------------------------------------------------------
  // CALIBRATION WORKFLOW STATE MANAGEMENT
  // ---------------------------------------------------------------------------

  startCalibrationSession(batchId: string, requiredSamples = 5, toleranceADC = 50): CalibrationSession {
    this.activeCalibrationSession = {
      batchId,
      samples: [],
      sampleRecords: [],
      requiredSamples,
      toleranceADC,
      isStable: false,
      calculatedBaseline: null,
      status: 'collecting',
      startedAt: new Date().toISOString(),
    };
    return { ...this.activeCalibrationSession };
  }

  addCalibrationSample(rawGas: number, observationTimestamp?: string, isMock?: boolean): CalibrationSession {
    if (!this.activeCalibrationSession || this.activeCalibrationSession.status !== 'collecting') {
      throw new Error('No active calibration session in progress');
    }

    if (!Number.isFinite(rawGas) || rawGas < 0 || rawGas > 4095) {
      this.activeCalibrationSession.status = 'error';
      this.activeCalibrationSession.errorMessage = `Invalid raw ADC sample received: ${rawGas}`;
      return { ...this.activeCalibrationSession };
    }

    // Deduplication guard: if observationTimestamp is provided and already recorded, do not count the same observation twice
    if (
      observationTimestamp &&
      this.activeCalibrationSession.sampleRecords &&
      this.activeCalibrationSession.sampleRecords.some((rec) => rec.timestamp === observationTimestamp)
    ) {
      return { ...this.activeCalibrationSession };
    }

    const timestamp = observationTimestamp || new Date().toISOString();
    const newRecord: CalibrationSample = {
      adc: rawGas,
      timestamp,
      isMock,
    };

    const nextRecords = [...(this.activeCalibrationSession.sampleRecords || []), newRecord];
    const nextSamples = [...this.activeCalibrationSession.samples, rawGas];
    const { isStable } = checkSampleStability(nextSamples, this.activeCalibrationSession.toleranceADC);
    const median = calculateMedian(nextSamples);

    const isReady = nextSamples.length >= this.activeCalibrationSession.requiredSamples;

    this.activeCalibrationSession = {
      ...this.activeCalibrationSession,
      samples: nextSamples,
      sampleRecords: nextRecords,
      isStable,
      calculatedBaseline: median,
      status: isReady ? 'ready_to_confirm' : 'collecting',
    };

    return { ...this.activeCalibrationSession };
  }

  getCalibrationSession(): CalibrationSession | null {
    return this.activeCalibrationSession ? { ...this.activeCalibrationSession } : null;
  }

  cancelCalibration(): void {
    if (this.activeCalibrationSession) {
      this.activeCalibrationSession = {
        ...this.activeCalibrationSession,
        status: 'cancelled',
      };
    }
    this.activeCalibrationSession = null;
  }

  // ---------------------------------------------------------------------------
  // LIGHTWEIGHT HISTORICAL GAS MONITORING PERSISTENCE
  // ---------------------------------------------------------------------------

  getGasHistory(batchId?: string): GasHistoricalPoint[] {
    const storage = this.getStorage();
    if (!storage) return [];

    try {
      const raw = storage.getItem(STORAGE_KEY_GAS_HISTORY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      const list = parsed as GasHistoricalPoint[];
      if (batchId) {
        return list.filter((p) => p.batchId === batchId);
      }
      return list;
    } catch (err) {
      console.warn('Failed to parse gas history from localStorage', err);
      return [];
    }
  }

  recordGasReading(
    rawGas: number,
    temperature?: number,
    humidity?: number,
    isStale = false,
    batchId?: string,
    telemetryTimestamp?: string,
    isDemo?: boolean,
  ): void {
    if (!Number.isFinite(rawGas) || rawGas < 0 || rawGas > 4095) return;
    if (isStale) return; // Strict rule: Stale repeated cached telemetry is not recorded as a new live history point
    const storage = this.getStorage();
    if (!storage) return;

    try {
      const history = this.getGasHistory();
      const last = history[history.length - 1];

      // Exact observation deduplication: if the exact telemetry timestamp is already recorded, do not duplicate
      if (last && telemetryTimestamp && last.timestamp === telemetryTimestamp) {
        return;
      }

      const activeBatch = this.getActiveBatch();
      const effectiveBatchId = batchId || activeBatch?.id;
      let deviationPercent: number | null = null;
      let signedDifference: number | null = null;
      let direction: GasDeviationDirection = 'unknown';

      if (activeBatch && activeBatch.baselineStatus === 'calibrated' && activeBatch.baselineReading !== null) {
        signedDifference = rawGas - activeBatch.baselineReading;
        deviationPercent = Number(((Math.abs(signedDifference) / activeBatch.baselineReading) * 100).toFixed(1));
        if (signedDifference > 0) direction = 'increased';
        else if (signedDifference < 0) direction = 'decreased';
        else direction = 'unchanged';
      }

      const effectiveTimestamp = telemetryTimestamp || new Date().toISOString();

      const newPoint: GasHistoricalPoint = {
        id: `gp-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        timestamp: effectiveTimestamp,
        rawGas,
        temperature,
        humidity,
        deviationPercent,
        signedDifference,
        direction,
        isStale,
        batchId: effectiveBatchId,
        isDemo: isDemo ?? activeBatch?.isDemo ?? false,
      };

      const updated = [...history.slice(-(MAX_HISTORY_POINTS - 1)), newPoint];
      storage.setItem(STORAGE_KEY_GAS_HISTORY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to record gas history point', err);
    }
  }

  clearGasHistory(batchId?: string): void {
    const storage = this.getStorage();
    if (!storage) return;

    if (batchId) {
      const history = this.getGasHistory();
      const filtered = history.filter((p) => p.batchId !== batchId);
      storage.setItem(STORAGE_KEY_GAS_HISTORY, JSON.stringify(filtered));
    } else {
      storage.removeItem(STORAGE_KEY_GAS_HISTORY);
    }
  }
}

export const spoilageService = new SpoilageService();

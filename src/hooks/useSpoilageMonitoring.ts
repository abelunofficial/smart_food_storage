import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  FoodBatch,
  GasDeviationAssessment,
  GasHistoricalPoint,
  CalibrationSession,
} from '../types/spoilage.ts';
import type { SensorReading } from '../types/storage.ts';
import {
  spoilageService,
  type CreateBatchInput,
} from '../services/spoilageService.ts';
import { evaluateGasDeviation } from '../utils/spoilageCalculator.ts';

interface UseSpoilageMonitoringOptions {
  currentReading?: SensorReading | null;
}

export function useSpoilageMonitoring(options: UseSpoilageMonitoringOptions = {}) {
  const { currentReading } = options;

  const [batches, setBatches] = useState<FoodBatch[]>(() => spoilageService.getBatches());
  const [activeBatch, setActiveBatchState] = useState<FoodBatch | null>(() => spoilageService.getActiveBatch());
  const [history, setHistory] = useState<GasHistoricalPoint[]>(() => {
    const initialActive = spoilageService.getActiveBatch();
    return initialActive ? spoilageService.getGasHistory(initialActive.id) : [];
  });
  const [calibrationSession, setCalibrationSession] = useState<CalibrationSession | null>(() =>
    spoilageService.getCalibrationSession()
  );

  // Reload state from service - ensures history is strictly isolated to loaded active batch
  const reloadState = useCallback(() => {
    const loadedBatches = spoilageService.getBatches();
    const loadedActive = spoilageService.getActiveBatch();
    const loadedHistory = loadedActive ? spoilageService.getGasHistory(loadedActive.id) : [];
    const loadedSession = spoilageService.getCalibrationSession();
    setBatches(loadedBatches);
    setActiveBatchState(loadedActive);
    setHistory(loadedHistory);
    setCalibrationSession(loadedSession);
  }, []);

  // Record reading to history when new valid telemetry arrives, enforcing strict provenance boundaries
  useEffect(() => {
    if (!currentReading || !Number.isFinite(currentReading.mq135Raw)) return;
    if (!activeBatch) return;

    const isLiveTelemetry = !currentReading.isMock;
    const isDemoBatch = Boolean(activeBatch.isDemo);

    // Provenance Boundary 1: Real batches must never record mock/simulated telemetry
    if (!isDemoBatch && !isLiveTelemetry) {
      console.info(
        `[Telemetry Provenance] Skipped recording mock/simulated reading for real batch "${activeBatch.name}" (ID: ${activeBatch.id}). Real batches only record verified live hardware telemetry.`
      );
      return;
    }

    // Provenance Boundary 2: Demo batches must never record live hardware telemetry
    if (isDemoBatch && isLiveTelemetry) {
      console.info(
        `[Telemetry Provenance] Skipped recording live hardware reading for demonstration batch "${activeBatch.name}" (ID: ${activeBatch.id}). Demo batches only record demonstration telemetry.`
      );
      return;
    }

    spoilageService.recordGasReading(
      currentReading.mq135Raw,
      currentReading.temperature,
      currentReading.humidity,
      Boolean(currentReading.isStale),
      activeBatch.id,
      currentReading.timestamp,
      isDemoBatch
    );

    queueMicrotask(() => {
      setHistory(spoilageService.getGasHistory(activeBatch.id));
    });
  }, [
    currentReading,
    activeBatch,
  ]);

  // Compute live deviation assessment
  const assessment: GasDeviationAssessment = useMemo(() => {
    const rawGas = currentReading ? currentReading.mq135Raw : null;
    const timestamp = currentReading ? currentReading.timestamp : '';
    const isStale = currentReading ? Boolean(currentReading.isStale) : false;
    return evaluateGasDeviation(activeBatch, rawGas, timestamp, isStale);
  }, [activeBatch, currentReading]);

  // Batch actions
  const selectBatch = useCallback((batchId: string) => {
    spoilageService.setActiveBatchId(batchId);
    reloadState();
  }, [reloadState]);

  const createBatch = useCallback((input: CreateBatchInput) => {
    const created = spoilageService.createBatch(input);
    reloadState();
    return created;
  }, [reloadState]);

  const archiveBatch = useCallback((batchId: string) => {
    const archived = spoilageService.archiveBatch(batchId);
    reloadState();
    return archived;
  }, [reloadState]);

  const deleteBatch = useCallback((batchId: string) => {
    spoilageService.deleteBatch(batchId);
    reloadState();
  }, [reloadState]);

  const loadDemoBatch = useCallback(() => {
    const demo = spoilageService.loadDemoBatch();
    reloadState();
    return demo;
  }, [reloadState]);

  const updateThresholds = useCallback((batchId: string, warning: number, significant: number) => {
    const updated = spoilageService.updateThresholds(batchId, warning, significant);
    reloadState();
    return updated;
  }, [reloadState]);

  // Calibration actions
  const startCalibration = useCallback((batchId: string, requiredSamples = 5, toleranceADC = 50) => {
    const session = spoilageService.startCalibrationSession(batchId, requiredSamples, toleranceADC);
    setCalibrationSession(session);
    return session;
  }, []);

  const addCalibrationSample = useCallback((sampleADC: number) => {
    const session = spoilageService.addCalibrationSample(sampleADC);
    setCalibrationSession(session);
    return session;
  }, []);

  const confirmCalibration = useCallback((batchId: string, baselineReading: number, sampleCount: number) => {
    const updated = spoilageService.saveConfirmedBaseline(batchId, baselineReading, sampleCount);
    reloadState();
    return updated;
  }, [reloadState]);

  const cancelCalibration = useCallback(() => {
    spoilageService.cancelCalibration();
    setCalibrationSession(null);
  }, []);

  return {
    batches,
    activeBatch,
    assessment,
    history,
    calibrationSession,
    selectBatch,
    createBatch,
    archiveBatch,
    deleteBatch,
    loadDemoBatch,
    updateThresholds,
    startCalibration,
    addCalibrationSample,
    confirmCalibration,
    cancelCalibration,
    reloadState,
  };
}

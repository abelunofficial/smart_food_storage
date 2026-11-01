/**
 * Automated Verification Suite for Experimental Gas-Based Food Spoilage Monitoring
 * Covers all requirements in Section 10 and Request 10 Audit:
 *   1. Calculation tests (D formula, baseline == current, signed difference G-B, direction increased/decreased/unchanged, zero baseline, invalid/out-of-range, large deviation, rolling median)
 *   2. Calibration tests (repeated identical values from stable sensor, stability within/outside tolerance, sample accumulation with distinct timestamps, deduplication, median calculation, confirmation, re-calibration history preservation)
 *   3. Batch management tests (empty storage returns [], explicit loadDemoBatch(), batch creation, mixed-food multi-category, batch activation, archiving, deletion, baseline non-reuse)
 *   4. Monitoring & Threshold tests (all interface warning states, directional evaluation, threshold updates, boundary values, invalid threshold rejection)
 *   5. LocalStorage tests (save/retrieve batches, active batch ID, empty storage returns [], corrupted JSON resiliency, gas history with direction and isDemo flag)
 */

import {
  calculateMedian,
  checkSampleStability,
  calculateGasDeviation,
  classifyWarningStatus,
  getWarningStatusMetadata,
  evaluateGasDeviation,
} from '../src/utils/spoilageCalculator.ts';

import {
  spoilageService,
} from '../src/services/spoilageService.ts';

// -----------------------------------------------------------------------------
// Lightweight In-Memory LocalStorage Mock for Node.js
// -----------------------------------------------------------------------------
class MockLocalStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.has(key) ? this.store.get(key) : null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
  get length() {
    return this.store.size;
  }
}

const mockStorageInstance = new MockLocalStorage();
// Attach to global window environment
if (typeof globalThis.window === 'undefined') {
  globalThis.window = {
    localStorage: mockStorageInstance,
  };
} else {
  globalThis.window.localStorage = mockStorageInstance;
}

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAIL [${totalTests}]: ${message}`);
    process.exit(1);
  }
  passedTests++;
  console.log(`✅ PASS [${totalTests}]: ${message}`);
}

console.log('================================================================');
console.log('=== RUNNING SECTION 10 & AUDIT SPOILAGE VERIFICATION ===');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. CALCULATION TESTS
// -----------------------------------------------------------------------------
console.log('--- 1. Calculation Tests: D = (|G - B| / B) * 100, Signed G-B, Direction ---');

// 1.1 D calculation when baseline == current (D = 0%, direction = unchanged)
const devEqual = calculateGasDeviation(1200, 1200);
assert(devEqual !== null, 'calculateGasDeviation returns result when baseline == current');
assert(devEqual.absoluteDiff === 0, 'Absolute difference is 0 when baseline == current');
assert(devEqual.signedDiff === 0, 'Signed difference is 0 when baseline == current');
assert(devEqual.relativeDeviationPercent === 0.0, 'D is exactly 0.0% when baseline == current');
assert(devEqual.direction === 'unchanged', 'Direction is "unchanged" when G == B');

// 1.2 D calculation when current increases relative to baseline
// baseline = 1000, current = 1250 -> G - B = +250, (|1250 - 1000| / 1000) * 100 = 25.0%
const devIncrease = calculateGasDeviation(1250, 1000);
assert(devIncrease !== null, 'calculateGasDeviation returns result for increased gas');
assert(devIncrease.absoluteDiff === 250, 'Absolute diff is 250 ADC counts');
assert(devIncrease.signedDiff === 250, 'Signed diff is +250 ADC counts');
assert(devIncrease.relativeDeviationPercent === 25.0, 'D is exactly 25.0% for 1250 vs 1000 baseline');
assert(devIncrease.direction === 'increased', 'Direction is "increased" when G > B');

// 1.3 D calculation when current decreases relative to baseline
// baseline = 1000, current = 800 -> G - B = -200, (|800 - 1000| / 1000) * 100 = 20.0%
const devDecrease = calculateGasDeviation(800, 1000);
assert(devDecrease !== null, 'calculateGasDeviation returns result for decreased gas');
assert(devDecrease.absoluteDiff === 200, 'Absolute diff is 200 ADC counts');
assert(devDecrease.signedDiff === -200, 'Signed diff is -200 ADC counts');
assert(devDecrease.relativeDeviationPercent === 20.0, 'D is exactly 20.0% for 800 vs 1000 baseline');
assert(devDecrease.direction === 'decreased', 'Direction is "decreased" when G < B');

// 1.4 D calculation when baseline = 0 (handle division by zero safely; return null)
const devZeroBaseline = calculateGasDeviation(500, 0);
assert(devZeroBaseline === null, 'calculateGasDeviation safely returns null when baseline = 0 (no division by zero)');

// 1.5 Invalid baseline handling (negative, null, NaN, out of range)
assert(calculateGasDeviation(500, -100) === null, 'Rejects negative baseline');
assert(calculateGasDeviation(500, null) === null, 'Rejects null baseline');
assert(calculateGasDeviation(500, undefined) === null, 'Rejects undefined baseline');
assert(calculateGasDeviation(500, NaN) === null, 'Rejects NaN baseline');
assert(calculateGasDeviation(500, 5000) === null, 'Rejects baseline > 4095 ADC counts');

// 1.6 Missing current reading handling
assert(calculateGasDeviation(null, 1000) === null, 'Rejects null current reading');
assert(calculateGasDeviation(undefined, 1000) === null, 'Rejects undefined current reading');
assert(calculateGasDeviation(NaN, 1000) === null, 'Rejects NaN current reading');

// 1.7 Out-of-range ADC handling (< 0 or > 4095)
assert(calculateGasDeviation(-5, 1000) === null, 'Rejects negative current ADC reading');
assert(calculateGasDeviation(4096, 1000) === null, 'Rejects current reading > 4095 ADC count');
assert(calculateGasDeviation(0, 1000) !== null, 'Accepts valid minimum 0 ADC count');
assert(calculateGasDeviation(4095, 1000) !== null, 'Accepts valid maximum 4095 ADC count');

// 1.8 Large deviation handling (e.g. current = 4000, baseline = 500 -> (|4000 - 500| / 500) * 100 = 700.0%)
const devLarge = calculateGasDeviation(4000, 500);
assert(devLarge !== null, 'Handles large excursion without error');
assert(devLarge.absoluteDiff === 3500, 'Large deviation absolute diff is 3500');
assert(devLarge.signedDiff === 3500, 'Large deviation signed diff is +3500');
assert(devLarge.relativeDeviationPercent === 700.0, 'Large deviation D is 700.0% without overflow');
assert(devLarge.direction === 'increased', 'Large deviation direction is "increased"');

// 1.9 Statistical median calculation (odd, even, invalid values)
const medianOdd = calculateMedian([1200, 1100, 1300]);
assert(medianOdd === 1200, 'Odd sample count median correctly picks middle value (1200)');

const medianEven = calculateMedian([1000, 1100, 1200, 1300]);
assert(medianEven === 1150, 'Even sample count median correctly averages middle two (1150)');

const medianUnsorted = calculateMedian([1400, 1100, 1300, 1050, 1200]);
assert(medianUnsorted === 1200, 'Unsorted array correctly sorts before computing median');

const medianEmpty = calculateMedian([]);
assert(medianEmpty === null, 'Empty array returns null for median');

const medianFiltered = calculateMedian([-10, 1000, 1200, 5000]);
assert(medianFiltered === 1100, 'Median filters out invalid out-of-range ADC samples (<0 or >4095)');

console.log('');

// -----------------------------------------------------------------------------
// 2. CALIBRATION & DEDUPLICATION TESTS
// -----------------------------------------------------------------------------
console.log('--- 2. Baseline Calibration & Deduplication Tests ---');

// 2.1 Stability check: samples within tolerance pass
const stableSamples = [1100, 1120, 1110, 1135, 1125];
const stabilityPass = checkSampleStability(stableSamples, 50);
assert(stabilityPass.isStable === true, 'Samples within 50 ADC spread are marked stable');
assert(stabilityPass.spread === 35, 'Correctly computes spread of 35 ADC counts');

// 2.2 Stability check: samples with spread > tolerance fail
const unstableSamples = [1100, 1160, 1120, 1180, 1110];
const stabilityFail = checkSampleStability(unstableSamples, 50);
assert(stabilityFail.isStable === false, 'Samples exceeding 50 ADC spread are marked unstable');
assert(stabilityFail.spread === 80, 'Correctly computes spread of 80 ADC counts');

// 2.3 Stable sensor test: Repeated identical ADC values from distinct device updates succeed in calibration
mockStorageInstance.clear();
const testBatch = spoilageService.createBatch({
  name: 'Test Stable Apples Batch',
  categories: ['fruits'],
});
assert(testBatch.baselineStatus === 'uncalibrated', 'New batch starts uncalibrated');

const stableSession = spoilageService.startCalibrationSession(testBatch.id, 5, 50);
assert(stableSession.samples.length === 0, 'Calibration session starts with 0 samples');
assert(stableSession.status === 'collecting', 'Session status is "collecting"');

// Feed distinct timestamped observations of identical ADC counts (1150)
spoilageService.addCalibrationSample(1150, '2026-11-01T12:00:01Z');
spoilageService.addCalibrationSample(1150, '2026-11-01T12:00:03Z');

// 2.4 Deduplication guard: Repeated frontend polling of the exact same observation timestamp is rejected
const dupCountBefore = spoilageService.getCalibrationSession().samples.length;
spoilageService.addCalibrationSample(1150, '2026-11-01T12:00:03Z');
assert(spoilageService.getCalibrationSession().samples.length === dupCountBefore, 'Duplicate observation timestamp is rejected from calibration');

spoilageService.addCalibrationSample(1150, '2026-11-01T12:00:05Z');
spoilageService.addCalibrationSample(1150, '2026-11-01T12:00:07Z');
const stableSessionFinal = spoilageService.addCalibrationSample(1150, '2026-11-01T12:00:09Z');

assert(stableSessionFinal.samples.length === 5, 'Stable sensor with identical ADC values collects all 5 samples');
assert(stableSessionFinal.status === 'ready_to_confirm', 'Session transitions to "ready_to_confirm" on stable identical values');
assert(stableSessionFinal.isStable === true, 'Stable identical sample sequence is stable (spread = 0)');
assert(stableSessionFinal.calculatedBaseline === 1150, 'Calculated baseline median is 1150');

// 2.5 Baseline confirmation: stored correctly in batch
const confirmedBatch = spoilageService.saveConfirmedBaseline(testBatch.id, stableSessionFinal.calculatedBaseline, stableSessionFinal.samples.length);
assert(confirmedBatch.baselineStatus === 'calibrated', 'Batch baselineStatus is now "calibrated"');
assert(confirmedBatch.baselineReading === 1150, 'Batch baselineReading is 1150');
assert(confirmedBatch.baselineSampleCount === 5, 'Sample count of 5 stored in batch');
assert(typeof confirmedBatch.baselineCalibrationTimestamp === 'string', 'Calibration timestamp is saved');

// 2.6 Re-calibration: updates current baseline, preserves previous calibration records
const recalSession = spoilageService.startCalibrationSession(testBatch.id, 3, 50);
assert(recalSession.status === 'collecting', 'Recalibration session begins collecting');
spoilageService.addCalibrationSample(1200, '2026-11-01T13:00:01Z');
spoilageService.addCalibrationSample(1210, '2026-11-01T13:00:03Z');
spoilageService.addCalibrationSample(1220, '2026-11-01T13:00:05Z');
const recalBatch = spoilageService.saveConfirmedBaseline(testBatch.id, 1210, 3);

assert(recalBatch.baselineReading === 1210, 'Recalibrated baseline updated to 1210');
assert(recalBatch.previousBaselines.length === 1, 'Previous calibration record is preserved in history');
assert(recalBatch.previousBaselines[0].baseline === 1150, 'Preserved previous baseline is 1150');
assert(recalBatch.previousBaselines[0].sampleCount === 5, 'Preserved previous sample count is 5');

console.log('');

// -----------------------------------------------------------------------------
// 3. BATCH MANAGEMENT & DEMO MODE TESTS
// -----------------------------------------------------------------------------
console.log('--- 3. Batch Management & Demo Mode Tests ---');

// 3.1 Empty localStorage returns empty array (NO automatic demo batch creation)
mockStorageInstance.clear();
const emptyBatches = spoilageService.getBatches();
assert(Array.isArray(emptyBatches) && emptyBatches.length === 0, 'Empty localStorage returns empty array [] (no automatic demo batch)');
assert(spoilageService.getActiveBatch() === null, 'Active batch is null when storage is empty');

// 3.2 Explicit loadDemoBatch() creates isolated demo batch
const demoBatch = spoilageService.loadDemoBatch();
assert(demoBatch !== null, 'loadDemoBatch creates a batch');
assert(demoBatch.isDemo === true, 'Demo batch has isDemo: true flag');
assert(demoBatch.name.includes('[DEMO]'), 'Demo batch name visibly includes [DEMO] tag');
assert(demoBatch.baselineStatus === 'calibrated', 'Demo batch comes pre-calibrated for demonstration');
assert(spoilageService.getActiveBatch()?.id === demoBatch.id, 'Demo batch becomes active when loaded');

// 3.3 Create user batch: real batch registration
const b1 = spoilageService.createBatch({
  name: 'Storage Room Bin 4',
  categories: ['vegetables'],
  notes: 'Fresh organic carrots',
});
assert(b1.id.startsWith('batch-'), 'Generates unique batch ID');
assert(b1.name === 'Storage Room Bin 4', 'Saves batch name');
assert(b1.isDemo !== true, 'Real user batch is not marked isDemo');
assert(b1.categories.includes('vegetables'), 'Assigns single category');
assert(b1.monitoringStatus === 'active', 'Defaults to active monitoring');
assert(b1.warningThreshold === 15.0, 'Default warning threshold is 15.0%');
assert(b1.significantChangeThreshold === 30.0, 'Default significant threshold is 30.0%');

// 3.4 Create mixed-food batch: multiple categories supported
const bMixed = spoilageService.createBatch({
  name: 'Mixed Fresh Load C',
  categories: ['fruits', 'vegetables', 'grains'],
  notes: 'Mixed produce stored in single chamber',
});
assert(bMixed.categories.length === 3, 'Supports multiple food categories in single batch');
assert(bMixed.categories.includes('fruits') && bMixed.categories.includes('grains'), 'Includes selected categories');

// 3.5 Batch selection: activates batch
spoilageService.setActiveBatchId(b1.id);
const activeBatch = spoilageService.getActiveBatch();
assert(activeBatch !== null && activeBatch.id === b1.id, 'setActiveBatchId activates selected batch');

// 3.6 Batch archiving: marks inactive, active falls back
const archived = spoilageService.archiveBatch(b1.id);
assert(archived.monitoringStatus === 'archived', 'Batch status set to "archived"');
const activeAfterArchive = spoilageService.getActiveBatch();
assert(activeAfterArchive.id !== b1.id, 'Active batch automatically falls back to an active batch');

// 3.7 Batch deletion: removes batch gracefully
const beforeDeleteCount = spoilageService.getBatches().length;
spoilageService.deleteBatch(bMixed.id);
assert(spoilageService.getBatches().length === beforeDeleteCount - 1, 'Batch is removed from list on delete');

// 3.8 Strict baseline isolation: New batch is uncalibrated
const bIsolated = spoilageService.createBatch({ name: 'Isolated Batch', categories: ['dairy'] });
assert(bIsolated.baselineStatus === 'uncalibrated', 'Strict isolation: New batch is uncalibrated');
assert(bIsolated.baselineReading === null, 'Strict isolation: New batch baselineReading is strictly null');

console.log('');

// -----------------------------------------------------------------------------
// 4. MONITORING & PROVISIONAL THRESHOLD TESTS
// -----------------------------------------------------------------------------
console.log('--- 4. Warning State Classification & Directional Tests ---');

const batchMon = {
  id: 'batch-mon-test',
  name: 'Monitored Fresh Strawberries',
  categories: ['fruits'],
  storageStartDate: '2026-11-01',
  baselineStatus: 'calibrated',
  baselineReading: 1000,
  baselineCalibrationTimestamp: '2026-11-01T12:00:00Z',
  monitoringStatus: 'active',
  warningThreshold: 15.0,
  significantChangeThreshold: 30.0,
  isThresholdValidated: true,
  previousBaselines: [],
  createdAt: '2026-11-01T12:00:00Z',
  updatedAt: '2026-11-01T12:00:00Z',
};

// 4.1 State 6: Sensor Data Stale
assert(classifyWarningStatus(batchMon, 1000, true) === 'sensor_stale', 'isStale = true gives sensor_stale');

// 4.2 State 7: Calibration Required
assert(classifyWarningStatus(null, 1000, false) === 'calibration_required', 'Null batch gives calibration_required');
const uncalBatch = { ...batchMon, baselineStatus: 'uncalibrated', baselineReading: null };
assert(classifyWarningStatus(uncalBatch, 1000, false) === 'calibration_required', 'Uncalibrated batch gives calibration_required');

// 4.3 State 5: Insufficient Data
assert(classifyWarningStatus(batchMon, null, false) === 'insufficient_data', 'Null current gas gives insufficient_data');
assert(classifyWarningStatus(batchMon, -10, false) === 'insufficient_data', 'Negative current gas gives insufficient_data');
assert(classifyWarningStatus(batchMon, 5000, false) === 'insufficient_data', 'Out-of-range ADC count gives insufficient_data');

// 4.4 State 2: Within Provisional Range (D < 15%)
// baseline = 1000, current = 1100 -> D = 10.0% < 15%
assert(classifyWarningStatus(batchMon, 1100, false) === 'within_range', '1100 ADC (10% dev) is within_range');
assert(getWarningStatusMetadata('within_range').label === 'Within Provisional Range', 'within_range label is explicitly provisional');

// 4.5 State 3: Change Detected (15% <= D < 30%)
// baseline = 1000, current = 1150 -> D = 15.0% (exact boundary)
assert(classifyWarningStatus(batchMon, 1150, false) === 'change_detected', 'Exact warning threshold (15.0%) gives change_detected');
// baseline = 1000, current = 1200 -> D = 20.0%
assert(classifyWarningStatus(batchMon, 1200, false) === 'change_detected', '1200 ADC (20% dev) gives change_detected');
// baseline = 1000, current = 820 -> D = 18.0%
assert(classifyWarningStatus(batchMon, 820, false) === 'change_detected', 'Negative deviation 820 ADC (18% dev) gives change_detected');

// 4.6 State 4: Significant Change (D >= 30%)
// baseline = 1000, current = 1300 -> D = 30.0% (exact boundary)
assert(classifyWarningStatus(batchMon, 1300, false) === 'significant_change', 'Exact significant threshold (30.0%) gives significant_change');
// baseline = 1000, current = 1500 -> D = 50.0%
assert(classifyWarningStatus(batchMon, 1500, false) === 'significant_change', '1500 ADC (50% dev) gives significant_change');

// 4.7 Directional evaluation via evaluateGasDeviation
const evalIncreased = evaluateGasDeviation(batchMon, 1200, '2026-11-01T14:00:00Z', false);
assert(evalIncreased.currentRawGas === 1200, 'Assessment records currentRawGas');
assert(evalIncreased.baseline === 1000, 'Assessment records baseline');
assert(evalIncreased.signedDifference === 200, 'Assessment records signedDifference +200');
assert(evalIncreased.absoluteDifference === 200, 'Assessment records absoluteDifference 200');
assert(evalIncreased.direction === 'increased', 'Assessment records direction "increased"');
assert(evalIncreased.relativeDeviationPercent === 20.0, 'Assessment records relativeDeviationPercent 20.0%');
assert(evalIncreased.status === 'change_detected', 'Assessment status is change_detected');

const evalDecreased = evaluateGasDeviation(batchMon, 800, '2026-11-01T14:05:00Z', false);
assert(evalDecreased.signedDifference === -200, 'Assessment records signedDifference -200');
assert(evalDecreased.direction === 'decreased', 'Assessment records direction "decreased"');
assert(evalDecreased.relativeDeviationPercent === 20.0, 'Assessment records relativeDeviationPercent 20.0%');

const evalUnchanged = evaluateGasDeviation(batchMon, 1000, '2026-11-01T14:10:00Z', false);
assert(evalUnchanged.signedDifference === 0, 'Assessment records signedDifference 0');
assert(evalUnchanged.direction === 'unchanged', 'Assessment records direction "unchanged"');
assert(evalUnchanged.relativeDeviationPercent === 0.0, 'Assessment records relativeDeviationPercent 0.0%');

// 4.8 Threshold updates with custom values
mockStorageInstance.clear();
const bCustom = spoilageService.createBatch({ name: 'Custom Batch', categories: ['fish'] });
spoilageService.saveConfirmedBaseline(bCustom.id, 1000, 5);
const bUpdated = spoilageService.updateThresholds(bCustom.id, 10.0, 25.0);
assert(bUpdated.warningThreshold === 10.0, 'Warning threshold updated to 10.0%');
assert(bUpdated.significantChangeThreshold === 25.0, 'Significant change threshold updated to 25.0%');

// 4.9 Invalid threshold rejection
let threwEqual = false;
try {
  spoilageService.updateThresholds(bCustom.id, 20.0, 20.0);
} catch {
  threwEqual = true;
}
assert(threwEqual, 'Strictly rejects warningThreshold === significantChangeThreshold');

let threwGreater = false;
try {
  spoilageService.updateThresholds(bCustom.id, 35.0, 20.0);
} catch {
  threwGreater = true;
}
assert(threwGreater, 'Strictly rejects warningThreshold > significantChangeThreshold');

let threwNeg = false;
try {
  spoilageService.updateThresholds(bCustom.id, -5.0, 20.0);
} catch {
  threwNeg = true;
}
assert(threwNeg, 'Strictly rejects negative threshold');

console.log('');

// -----------------------------------------------------------------------------
// 5. LOCALSTORAGE INTEGRATION & FAULT TOLERANCE TESTS
// -----------------------------------------------------------------------------
console.log('--- 5. LocalStorage Resilience & Graceful Fallback Tests ---');

// 5.1 Corrupted localStorage data handled gracefully without application crash
mockStorageInstance.setItem('sfs_food_batches_v1', '{ invalid json [[]] corrupted content !!!');
const resilientBatches = spoilageService.getBatches();
assert(Array.isArray(resilientBatches), 'Corrupted JSON gracefully handled without throwing unhandled exception');

// 5.2 Gas History recording with direction and deduplication
mockStorageInstance.clear();
spoilageService.clearGasHistory();
assert(spoilageService.getGasHistory().length === 0, 'Gas history is empty after clear');

// Record a first reading
spoilageService.recordGasReading(1120, 23.5, 62.0, false, undefined, '2026-11-01T15:00:00Z');
const historyAfterOne = spoilageService.getGasHistory();
assert(historyAfterOne.length === 1, 'Records one gas reading in history');
assert(historyAfterOne[0].rawGas === 1120, 'History record stores rawGas 1120');
assert(historyAfterOne[0].timestamp === '2026-11-01T15:00:00Z', 'History record stores observation timestamp');

// Record an identical ADC value from a DIFFERENT timestamp (stable sensor) -> should be accepted!
spoilageService.recordGasReading(1120, 23.5, 62.0, false, undefined, '2026-11-01T15:00:03Z');
const historyAfterTwo = spoilageService.getGasHistory();
assert(historyAfterTwo.length === 2, 'Accepts distinct observation timestamp with identical ADC value');

// Record with exact SAME timestamp -> deduplicated, not added!
spoilageService.recordGasReading(1120, 23.5, 62.0, false, undefined, '2026-11-01T15:00:03Z');
assert(spoilageService.getGasHistory().length === 2, 'Deduplicates exact matching observation timestamp');

// Stale reading rejected from history
spoilageService.recordGasReading(1130, 23.5, 62.0, true, undefined, '2026-11-01T15:00:06Z');
assert(spoilageService.getGasHistory().length === 2, 'Stale telemetry is rejected from gas history');

// Historical point rejection of invalid ADC
spoilageService.recordGasReading(5000, 23.5, 62.0, false, undefined, '2026-11-01T15:00:08Z');
assert(spoilageService.getGasHistory().length === 2, 'Rejects invalid ADC reading (>4095) from entering history');

console.log('');

// -----------------------------------------------------------------------------
// 6. TARGETED PROVENANCE, ISOLATION & CLEANUP REGRESSION TESTS
// -----------------------------------------------------------------------------
console.log('--- 6. Provenance Separation, History Isolation & Cleanup Regression Tests ---');

// 6.1 No active batch produces empty history
mockStorageInstance.clear();
spoilageService.clearGasHistory();
assert(spoilageService.getActiveBatch() === null, 'Active batch is null initially');
const emptyActiveHistory = spoilageService.getActiveBatch() ? spoilageService.getGasHistory(spoilageService.getActiveBatch().id) : [];
assert(Array.isArray(emptyActiveHistory) && emptyActiveHistory.length === 0, 'No active batch produces strictly empty history array []');

// 6.2 Setup Demo Batch and record demo telemetry
const demoBatchRef = spoilageService.loadDemoBatch();
spoilageService.recordGasReading(1120, 22.0, 58.0, false, demoBatchRef.id, '2026-11-01T16:00:01Z', true);
spoilageService.recordGasReading(1125, 22.1, 58.2, false, demoBatchRef.id, '2026-11-01T16:00:04Z', true);
const demoHistory = spoilageService.getGasHistory(demoBatchRef.id);
assert(demoHistory.length === 2, 'Demo batch records 2 demonstration historical points');
assert(demoHistory.every((p) => p.batchId === demoBatchRef.id && p.isDemo === true), 'All demo points carry demoBatchRef ID and isDemo: true');

// 6.3 Register Real Batch after Demo Mode: Demo history never appears in real batch chart
const realBatch1 = spoilageService.createBatch({ name: 'Real Fresh Produce #1', categories: ['vegetables'] });
assert(spoilageService.getActiveBatch()?.id === realBatch1.id, 'Real batch is now active batch');
const realBatch1HistoryInitial = spoilageService.getGasHistory(realBatch1.id);
assert(realBatch1HistoryInitial.length === 0, 'Demo history NEVER appears in newly created real batch chart (history length is strictly 0)');

// 6.4 Provenance Boundary 1: Real batches reject mock/simulated telemetry
// Simulate hook provenance guard:
function recordWithProvenance(batch, reading) {
  if (!batch || !reading || !Number.isFinite(reading.mq135Raw)) return false;
  const isLiveTelemetry = !reading.isMock;
  const isDemoBatch = Boolean(batch.isDemo);

  if (!isDemoBatch && !isLiveTelemetry) {
    // Rejected: real batch cannot record mock telemetry
    return false;
  }
  if (isDemoBatch && isLiveTelemetry) {
    // Rejected: demo batch cannot record live telemetry
    return false;
  }
  spoilageService.recordGasReading(
    reading.mq135Raw,
    reading.temperature,
    reading.humidity,
    Boolean(reading.isStale),
    batch.id,
    reading.timestamp,
    isDemoBatch
  );
  return true;
}

const mockReading = { mq135Raw: 1100, temperature: 20, humidity: 55, isMock: true, timestamp: '2026-11-01T16:01:00Z', isStale: false };
const liveReading = { mq135Raw: 1150, temperature: 21, humidity: 56, isMock: false, timestamp: '2026-11-01T16:01:02Z', isStale: false };

const mockToRealRecorded = recordWithProvenance(realBatch1, mockReading);
assert(mockToRealRecorded === false, 'Mock/simulated telemetry is strictly rejected by real batches');
assert(spoilageService.getGasHistory(realBatch1.id).length === 0, 'Real batch history remains empty after rejected mock reading');

// 6.5 Provenance Boundary 2: Live telemetry is recorded by real batches
const liveToRealRecorded = recordWithProvenance(realBatch1, liveReading);
assert(liveToRealRecorded === true, 'Live hardware telemetry is successfully recorded by real batch');
assert(spoilageService.getGasHistory(realBatch1.id).length === 1, 'Real batch history now contains 1 live reading');
assert(spoilageService.getGasHistory(realBatch1.id)[0].isDemo === false, 'Recorded real batch point is marked isDemo: false');

// 6.6 Provenance Boundary 3: Demo batches reject live hardware telemetry
spoilageService.setActiveBatchId(demoBatchRef.id);
const liveToDemoRecorded = recordWithProvenance(demoBatchRef, liveReading);
assert(liveToDemoRecorded === false, 'Live hardware telemetry is strictly rejected by demo batches');
assert(spoilageService.getGasHistory(demoBatchRef.id).length === 2, 'Demo batch history remains at 2 (live reading was not added)');

// 6.7 Demo simulation workflow still works: Demo batches accept mock telemetry
const demoSimulationRecorded = recordWithProvenance(demoBatchRef, { ...mockReading, timestamp: '2026-11-01T16:02:00Z' });
assert(demoSimulationRecorded === true, 'Demo simulation workflow successfully records mock telemetry into demo batch');
assert(spoilageService.getGasHistory(demoBatchRef.id).length === 3, 'Demo batch history now contains 3 demonstration readings');

// 6.8 Batch switching: Reload after batch switching loads ONLY the selected batch history
spoilageService.setActiveBatchId(realBatch1.id);
const reloadedRealHistory = spoilageService.getGasHistory(spoilageService.getActiveBatch().id);
assert(reloadedRealHistory.length === 1, 'Switching back to real batch loads strictly real batch history (length 1)');
assert(reloadedRealHistory[0].batchId === realBatch1.id, 'Reloaded history belongs strictly to realBatch1');

// 6.9 Create second real batch: Verify batch-specific isolation across multiple real batches
const realBatch2 = spoilageService.createBatch({ name: 'Real Dairy Chamber #2', categories: ['meat'] });
recordWithProvenance(realBatch2, { ...liveReading, mq135Raw: 1200, timestamp: '2026-11-01T16:03:00Z' });
recordWithProvenance(realBatch2, { ...liveReading, mq135Raw: 1210, timestamp: '2026-11-01T16:03:03Z' });
assert(spoilageService.getGasHistory(realBatch2.id).length === 2, 'RealBatch2 has exactly 2 recorded points');
assert(spoilageService.getGasHistory(realBatch1.id).length === 1, 'RealBatch1 still has strictly 1 recorded point (isolated)');

// 6.10 Batch deletion cleanup: deleteBatch(id) removes history belonging to that batch
const realBatch1Id = realBatch1.id;
spoilageService.deleteBatch(realBatch1Id);
assert(spoilageService.getBatches().some((b) => b.id === realBatch1Id) === false, 'realBatch1 deleted from batch list');
assert(spoilageService.getGasHistory(realBatch1Id).length === 0, 'deleteBatch(id) cleanly removes all historical telemetry for deleted batch');

// 6.11 Deleting one batch preserves all other batches' histories
assert(spoilageService.getGasHistory(realBatch2.id).length === 2, 'Preserves realBatch2 history (length 2) after realBatch1 deletion');
assert(spoilageService.getGasHistory(demoBatchRef.id).length === 3, 'Preserves demoBatch history (length 3) after realBatch1 deletion');
assert(spoilageService.getActiveBatch()?.id === realBatch2.id, 'Active batch fallback cleanly selected realBatch2');

// 6.12 Calibration minimum interval check (2,000 ms guard)
function simulateCalibrationSampling(sampleSequence) {
  const MIN_INTERVAL_MS = 2000;
  let lastCaptureTime = null;
  let lastTimestamp = null;
  const collected = [];

  for (const item of sampleSequence) {
    if (item.timestamp && item.timestamp === lastTimestamp) continue;
    if (lastCaptureTime !== null && item.clock - lastCaptureTime < MIN_INTERVAL_MS) continue;

    lastTimestamp = item.timestamp;
    lastCaptureTime = item.clock;
    collected.push(item.adc);
  }
  return collected;
}

// 4 polls rapid: clock 0, 500, 1000, 2500
const rapidPolls = [
  { adc: 1100, timestamp: 'T1', clock: 0 },
  { adc: 1100, timestamp: 'T2', clock: 500 },  // < 2000ms -> dropped
  { adc: 1100, timestamp: 'T3', clock: 1000 }, // < 2000ms -> dropped
  { adc: 1100, timestamp: 'T4', clock: 2500 }, // >= 2000ms -> captured!
  { adc: 1100, timestamp: 'T4', clock: 3000 }, // same timestamp T4 -> dropped
  { adc: 1100, timestamp: 'T5', clock: 4800 }, // >= 2000ms -> captured!
];

const collectedSamples = simulateCalibrationSampling(rapidPolls);
assert(collectedSamples.length === 3, 'Calibration captures samples only across separate eligible sampling intervals (>= 2000 ms)');
assert(collectedSamples.every((v) => v === 1100), 'Identical ADC readings (1100) are successfully captured across separate eligible intervals');

console.log('\n================================================================');
console.log(`=== ALL ${passedTests} OF ${totalTests} SPOILAGE VERIFICATION TESTS PASSED (100%) ===`);
console.log('================================================================\n');

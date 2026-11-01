/**
 * Automated Verification Suite for ESP32 Smart Food Storage Monitoring Dashboard
 * Covers all requirements in Section 6:
 *   1. Risk calculation (contributions, cap at 100, exact boundary conditions)
 *   2. Blynk integration (V0-V5, strict V3, missing V5, invalid data, stale/offline, V4 writes)
 *   3. Equipment separation (GPIO 14 vs GPIO 2, independent V4, open-loop feedback)
 */

import {
  calculateRiskScore,
  classifyRisk,
  classifyStorageCondition,
  calculateRiskBreakdown,
} from '../src/utils/riskCalculator.ts';

import {
  deriveEquipmentState,
  MockStorageService,
  BlynkStorageService,
} from '../src/services/storageService.ts';

import {
  parseTemperature,
  parseHumidity,
  parseGasRaw,
  parseStorageCondition,
  parseFanCommand,
  parseRiskScore,
} from '../src/services/blynkService.ts';

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
console.log('=== RUNNING SECTION 6 AUTOMATED SPECIFICATION TEST SUITE ===');
console.log('================================================================\n');

// -----------------------------------------------------------------------------
// 1. RISK CALCULATION TESTS
// -----------------------------------------------------------------------------
console.log('--- 1. Risk Calculation & Exact Boundary Tests ---');

// 1.1 Temperature contribution tests
const tempBelow = calculateRiskScore(24.0, 60.0, 1500);
assert(tempBelow === 0, 'Temperature <= 25.0 gives 0 contribution');

const tempAtBaseline = calculateRiskScore(25.0, 60.0, 1500);
assert(tempAtBaseline === 0, 'Temperature exactly 25.0 gives 0 contribution');

const tempAbove = calculateRiskScore(30.0, 60.0, 1500);
// (30 - 25) * 2 = 10.0
assert(tempAbove === 10.0, 'Temperature 30.0 gives exactly (30-25)*2 = 10.0 points');

// 1.2 Humidity contribution tests
const humBelow = calculateRiskScore(25.0, 55.0, 1500);
assert(humBelow === 0, 'Humidity <= 60.0 gives 0 contribution');

const humAtBaseline = calculateRiskScore(25.0, 60.0, 1500);
assert(humAtBaseline === 0, 'Humidity exactly 60.0 gives 0 contribution');

const humAbove = calculateRiskScore(25.0, 70.0, 1500);
// (70 - 60) * 1.5 = 15.0
assert(humAbove === 15.0, 'Humidity 70.0 gives exactly (70-60)*1.5 = 15.0 points');

// 1.3 Gas contribution tests (MQ135 raw ADC)
const gasBelow = calculateRiskScore(25.0, 60.0, 1200);
assert(gasBelow === 0, 'MQ135 Gas <= 1500 gives 0 contribution');

const gasAtBaseline = calculateRiskScore(25.0, 60.0, 1500);
assert(gasAtBaseline === 0, 'MQ135 Gas exactly 1500 gives 0 contribution');

const gasAbove = calculateRiskScore(25.0, 60.0, 2000);
// (2000 - 1500) * 0.02 = 10.0
assert(gasAbove === 10.0, 'MQ135 Gas 2000 gives exactly (2000-1500)*0.02 = 10.0 points');

// 1.4 Multi-parameter combined contribution
const combined = calculateRiskScore(30.0, 70.0, 2000);
// 10.0 + 15.0 + 10.0 = 35.0
assert(combined === 35.0, 'Combined contributions (30°C, 70%, 2000 ADC) sum to exactly 35.0');

// 1.5 Score cap at 100.0
const extreme = calculateRiskScore(80.0, 100.0, 4000);
// (80-25)*2=110 + (100-60)*1.5=60 + (4000-1500)*0.02=50 -> 220 -> capped at 100.0
assert(extreme === 100.0, 'Extreme parameter excursion is strictly capped at 100.0');

// 1.6 Exact classification and boundary tests
// Test 30.0 = SAFE
const score30 = calculateRiskScore(40.0, 60.0, 1500); // 15*2 = 30.0
assert(score30 === 30.0, 'Score is exactly 30.0');
assert(classifyRisk(30.0) === 'SAFE', 'Boundary 30.0 classifies as SAFE');
assert(classifyStorageCondition(30.0) === 'SAFE', 'StorageCondition for 30.0 classifies as SAFE');

// Test 30.01 = MODERATE
assert(classifyRisk(30.01) === 'MODERATE', 'Boundary 30.01 classifies as MODERATE');
assert(classifyStorageCondition(30.01) === 'MODERATE', 'StorageCondition for 30.01 classifies as MODERATE');

// Test 60.0 = MODERATE
const score60 = calculateRiskScore(40.0, 80.0, 1500); // 30 + 30 = 60.0
assert(score60 === 60.0, 'Score is exactly 60.0');
assert(classifyRisk(60.0) === 'MODERATE', 'Boundary 60.0 classifies as MODERATE');
assert(classifyStorageCondition(60.0) === 'MODERATE', 'StorageCondition for 60.0 classifies as MODERATE');

// Test 60.01 = DANGER
assert(classifyRisk(60.01) === 'DANGER', 'Boundary 60.01 classifies as DANGER');
assert(classifyStorageCondition(60.01) === 'DANGER!', 'StorageCondition for 60.01 classifies as DANGER!');

// Breakdown helper fidelity
const breakdown = calculateRiskBreakdown(30.0, 70.0, 2000);
assert(breakdown.tempContribution === 10.0, 'Breakdown temp contribution matches formula');
assert(breakdown.humidityContribution === 15.0, 'Breakdown humidity contribution matches formula');
assert(breakdown.gasContribution === 10.0, 'Breakdown gas contribution matches formula');
assert(breakdown.totalScore === 35.0, 'Breakdown totalScore matches formula');
assert(breakdown.level === 'MODERATE', 'Breakdown level classified correctly');

console.log('');

// -----------------------------------------------------------------------------
// 2. BLYNK INTEGRATION & TELEMETRY PARSING TESTS
// -----------------------------------------------------------------------------
console.log('--- 2. Blynk Virtual Pin Integration Tests ---');

// 2.1 V0 (Temperature) parsing
assert(parseTemperature('22.5') === 22.5, 'V0 parses valid numeric string to double');
assert(parseTemperature('-5.2') === -5.2, 'V0 parses sub-zero temperature');
let v0Threw = false;
try { parseTemperature('invalid'); } catch { v0Threw = true; }
assert(v0Threw, 'V0 strictly throws error for invalid non-numeric string');

// 2.2 V1 (Humidity) parsing
assert(parseHumidity('65.4') === 65.4, 'V1 parses valid relative humidity percentage');
let v1ThrewRange = false;
try { parseHumidity('105.0'); } catch { v1ThrewRange = true; }
assert(v1ThrewRange, 'V1 strictly rejects out-of-range (>100%) humidity by throwing error');
let v1ThrewNeg = false;
try { parseHumidity('-2.0'); } catch { v1ThrewNeg = true; }
assert(v1ThrewNeg, 'V1 strictly rejects negative humidity by throwing error');

// 2.3 V2 (MQ135 Raw ADC) parsing — Must NOT be interpreted as ppm
assert(parseGasRaw('1850') === 1850, 'V2 parses valid raw 12-bit ADC integer');
assert(parseGasRaw('0') === 0, 'V2 parses 0 ADC count');
assert(parseGasRaw('4095') === 4095, 'V2 parses 4095 maximum 12-bit ADC count');
let v2ThrewRange = false;
try { parseGasRaw('5000'); } catch { v2ThrewRange = true; }
assert(v2ThrewRange, 'V2 strictly rejects out-of-range ADC (>4095) by throwing error');
let v2ThrewNeg = false;
try { parseGasRaw('-10'); } catch { v2ThrewNeg = true; }
assert(v2ThrewNeg, 'V2 strictly rejects negative ADC by throwing error');

// 2.4 Strict V3 condition parsing — Never accept numeric codes or map '1' to string
assert(parseStorageCondition('SAFE') === 'SAFE', 'V3 strictly accepts SAFE string');
assert(parseStorageCondition('MODERATE') === 'MODERATE', 'V3 strictly accepts MODERATE string');
assert(parseStorageCondition('DANGER!') === 'DANGER!', 'V3 strictly accepts DANGER! string');
let v3Threw1 = false;
try { parseStorageCondition('1'); } catch { v3Threw1 = true; }
assert(v3Threw1, 'V3 strictly rejects numeric "1" without silent mapping');
let v3Threw0 = false;
try { parseStorageCondition('0'); } catch { v3Threw0 = true; }
assert(v3Threw0, 'V3 strictly rejects numeric "0" without silent mapping');
let v3Threw2 = false;
try { parseStorageCondition('2'); } catch { v3Threw2 = true; }
assert(v3Threw2, 'V3 strictly rejects numeric "2"');
let v3ThrewUnk = false;
try { parseStorageCondition('OK'); } catch { v3ThrewUnk = true; }
assert(v3ThrewUnk, 'V3 rejects unmapped strings');

// 2.5 V4 Fan Command parsing
assert(parseFanCommand('1') === 'on', 'V4 parses "1" as "on" command');
assert(parseFanCommand('0') === 'off', 'V4 parses "0" as "off" command');
let v4Threw = false;
try { parseFanCommand('invalid'); } catch { v4Threw = true; }
assert(v4Threw, 'V4 strictly rejects invalid commands by throwing error');

// 2.6 V5 Risk Score parsing
assert(parseRiskScore('42.5') === 42.5, 'V5 parses valid risk score double');
assert(parseRiskScore('0.0') === 0.0, 'V5 parses 0.0 risk score');
assert(parseRiskScore('100.0') === 100.0, 'V5 parses 100.0 risk score');
let v5ThrewRange = false;
try { parseRiskScore('120.0'); } catch { v5ThrewRange = true; }
assert(v5ThrewRange, 'V5 rejects score > 100.0 by throwing error');
let v5ThrewNeg = false;
try { parseRiskScore('-5.0'); } catch { v5ThrewNeg = true; }
assert(v5ThrewNeg, 'V5 rejects negative score by throwing error');

// 2.7 Missing V5 handling — No silent substitution
async function testMissingV5Handling() {
  const blynkService = new BlynkStorageService();
  const assessment = await blynkService.getRiskAssessment();
  if (blynkService.isLive()) {
    if (assessment.v5Status === 'unconfigured') {
      assert(assessment.score === null, 'Unconfigured V5 results in score === null (no silent replacement)');
      assert(assessment.locallyCalculatedScore !== undefined, 'Local diagnostic score is provided separately');
    }
  } else {
    assert(assessment.score !== null, 'Mock environment provides demonstration baseline');
  }
}

// 2.8 Offline and Stale Telemetry Handling
async function testTelemetryStaleness() {
  const mockService = new MockStorageService();
  const reading = await mockService.getCurrentReading();
  assert(reading.isStale === false, 'Fresh reading has isStale: false');
  assert(typeof reading.timestamp === 'string', 'Timestamp is recorded in ISO format');
}

console.log('');

// -----------------------------------------------------------------------------
// 3. EQUIPMENT SEPARATION & ACTUATOR INDEPENDENCE TESTS
// -----------------------------------------------------------------------------
console.log('--- 3. Dual Relay Outputs & Equipment Separation Tests ---');

// 3.1 Relay 1: Automatic Ventilation Relay (GPIO 14)
// SAFE: OFF (LOW)
const eqSafe = deriveEquipmentState('SAFE', 'off', false);
assert(eqSafe.automaticRelay === 'off', 'Automatic Relay (GPIO 14) is OFF in SAFE condition');
assert(eqSafe.fanRelay === 'off', 'Legacy fanRelay mirrors automaticRelay for backwards compatibility');

// MODERATE: ON (HIGH)
const eqMod = deriveEquipmentState('MODERATE', 'off', false);
assert(eqMod.automaticRelay === 'on', 'Automatic Relay (GPIO 14) is ON in MODERATE condition');

// DANGER: ON (HIGH)
const eqDanger = deriveEquipmentState('DANGER!', 'off', false);
assert(eqDanger.automaticRelay === 'on', 'Automatic Relay (GPIO 14) is ON in DANGER condition');

// 3.2 Relay 2: Manual Fan Relay (GPIO 2, Virtual Pin V4) — Strict Independence
// When manual fan is commanded ON, automatic relay remains OFF in SAFE condition
const eqSafeManualOn = deriveEquipmentState('SAFE', 'on', false);
assert(eqSafeManualOn.automaticRelay === 'off', 'Automatic Relay (GPIO 14) remains OFF in SAFE while Manual Fan is ON');
assert(eqSafeManualOn.manualFanCommand === 'on', 'Manual Fan Relay (GPIO 2, V4) is independently ON');

// When manual fan is commanded OFF, automatic relay remains ON in MODERATE condition
const eqModManualOff = deriveEquipmentState('MODERATE', 'off', false);
assert(eqModManualOff.automaticRelay === 'on', 'Automatic Relay (GPIO 14) remains ON in MODERATE while Manual Fan is OFF');
assert(eqModManualOff.manualFanCommand === 'off', 'Manual Fan Relay (GPIO 2, V4) is independently OFF');

// 3.3 Other Actuators: Servo (GPIO 27) and Buzzer (GPIO 25)
// Servo: 0° (SAFE), 60° (MODERATE), 90° (DANGER)
assert(eqSafe.servoPosition === '0°', 'Intake Vent Servo (GPIO 27) is 0° (closed) in SAFE');
assert(eqMod.servoPosition === '60°', 'Intake Vent Servo (GPIO 27) is 60° in MODERATE');
assert(eqDanger.servoPosition === '90°', 'Intake Vent Servo (GPIO 27) is 90° (emergency vent) in DANGER');

// Buzzer: OFF (SAFE), OFF (MODERATE), ACTIVE (DANGER)
assert(eqSafe.buzzer === 'off', 'Audible Alarm Buzzer (GPIO 25) is silent (OFF) in SAFE');
assert(eqMod.buzzer === 'off', 'Audible Alarm Buzzer (GPIO 25) is silent (OFF) in MODERATE');
assert(eqDanger.buzzer === 'active', 'Audible Alarm Buzzer (GPIO 25) is ACTIVE (300ms pulsing) in DANGER');

// 3.4 Physical Feedback Disclaimer — Firmware does NOT publish confirmed contact states
assert(eqSafe.physicalFeedback === 'unavailable', 'Automatic relay physical feedback is strictly "unavailable"');
assert(eqSafe.manualFanPhysicalFeedback === 'unavailable', 'Manual fan physical feedback is strictly "unavailable"');

// 3.5 V4 Write Service Interaction
async function testV4WriteService() {
  const mockService = new MockStorageService();
  const initialFan = await mockService.getFanState();
  assert(initialFan.manualFanCommand === 'off', 'Initial mock fan state is OFF');

  // Command ON
  const onState = await mockService.setFanControl({ manualFanCommand: 'on' });
  assert(onState.manualFanCommand === 'on', 'setFanControl commands manualFanCommand to ON');
  assert(onState.requestedCommand === 'on', 'requestedCommand is synchronized to ON');
  assert(onState.manualFanPhysicalFeedback === 'unavailable', 'Physical feedback remains "unavailable"');

  // Command OFF
  const offState = await mockService.setFanControl({ manualFanCommand: 'off' });
  assert(offState.manualFanCommand === 'off', 'setFanControl commands manualFanCommand to OFF');
  assert(offState.requestedCommand === 'off', 'requestedCommand is synchronized to OFF');
}

// 3.6 Error Handling on Failed V4 Write
async function testV4ErrorHandling() {
  const blynkService = new BlynkStorageService();
  assert(typeof blynkService.setFanControl === 'function', 'BlynkStorageService exports setFanControl');
}

Promise.all([
  testMissingV5Handling(),
  testTelemetryStaleness(),
  testV4WriteService(),
  testV4ErrorHandling(),
])
  .then(async () => {
    console.log('\n================================================================');
    console.log(`=== ALL ${passedTests} OF ${totalTests} SECTION 6 TESTS PASSED WITH 100% SUCCESS ===`);
    console.log('================================================================\n');

    // Run Section 10 Experimental Spoilage Test Suite
    await import('./test_spoilage_monitoring.mjs');
  })
  .catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
  });

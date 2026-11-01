# Testing and Quality Assurance Guide

## 1. Automated Testing Framework Status

> [!NOTE]
> **Current Repository Test Setup Status**:
> As of repository version 0.1.0, an automated unit test runner (such as Vitest or Jest) is **not installed or configured** in `package.json`. Invoking `npm test` will return `npm ERR! Missing script: "test"`.
> 
> Code verification is currently performed via:
> - **Linter**: `npm run lint` (uses Oxlint to inspect TypeScript code quality and unused symbols).
> - **Type Checking & Production Build**: `npm run build` (invokes `tsc -b && vite build` for strict TypeScript compiler checking and client asset bundling).

---

## 2. Risk Calculation Boundary Test Cases

When validating `src/utils/riskCalculator.ts` or implementing future automated unit test suites, use the following canonical boundary test fixtures based on the firmware formula:

Formula:
- $\text{Temp Contrib} = \max(0, (T - 25) \times 2)$
- $\text{Hum Contrib} = \max(0, (H - 60) \times 1.5)$
- $\text{Gas Contrib} = \max(0, (G - 1500) \times 0.02)$
- $\text{Total Score} = \min(100, \text{Sum})$

| Test ID | Input ($T$, $H$, $G$) | Expected Temp Contrib | Expected Hum Contrib | Expected Gas Contrib | Expected Total Score | Expected Classification | Expected Condition String |
|---|---|---|---|---|---|---|---|
| **TC-01** | `T=20.0, H=50.0, G=1000` | `0.0` | `0.0` | `0.0` | `0.0` | `SAFE` | `SAFE` |
| **TC-02** | `T=25.0, H=60.0, G=1500` | `0.0` | `0.0` | `0.0` | `0.0` | `SAFE` | `SAFE` |
| **TC-03** | `T=35.0, H=60.0, G=1500` | `20.0` | `0.0` | `0.0` | `20.0` | `SAFE` | `SAFE` |
| **TC-04** | `T=40.0, H=60.0, G=1500` | `30.0` | `0.0` | `0.0` | `30.0` | `SAFE` (Boundary) | `SAFE` |
| **TC-05** | `T=40.1, H=60.0, G=1500` | `30.2` | `0.0` | `0.0` | `30.2` | `MODERATE` (Threshold) | `MODERATE` |
| **TC-06** | `T=40.0, H=80.0, G=1500` | `30.0` | `30.0` | `0.0` | `60.0` | `MODERATE` (Boundary) | `MODERATE` |
| **TC-07** | `T=40.1, H=80.0, G=1500` | `30.2` | `30.0` | `0.0` | `60.2` | `DANGER` (Threshold) | `DANGER!` |
| **TC-08** | `T=50.0, H=90.0, G=3500` | `50.0` | `45.0` | `40.0` | `100.0` (Clamped) | `DANGER` | `DANGER!` |

---

## 3. Disconnected Device Scenarios

Test how the dashboard reacts when connectivity is interrupted or credentials are absent:

1. **No Token Configured (`VITE_BLYNK_AUTH_TOKEN=""`)**:
   - `storageService.isLive()` returns `false`.
   - The application automatically loads mock fixtures from `src/data/mockStorageData.ts`.
   - Header displays the amber "Demonstration Mode" badge.
   - All interactive controls function in mock simulation.
2. **Invalid Token or Network Failure**:
   - `fetchPinRaw` catches HTTP 400/401/403 or network errors.
   - Hardware connection check (`checkHardwareConnected`) returns `false`.
   - The header connection indicator displays "Offline" or "Disconnected".
   - Overview page gracefully renders the error banner with a manual "Retry Connection" action.
3. **Stale Data Preservation**:
   - If a fetch fails after previously succeeding, the service returns cached readings with `isStale: true` rather than crashing the interface.

---

## 4. Missing V5 and Invalid V3 Scenarios

1. **Missing / Unconfigured Virtual Pin V5**:
   - When the Blynk product template does not have datastream V5 configured, Blynk API returns HTTP 400 (`"Requested pin doesn't exist"`).
   - `blynkService.ts` detects `isPinUnconfigured: true`.
   - `storageService.ts` sets `riskAssessment.score: null` and `v5Status: 'unconfigured'`.
   - The UI displays an informative alert banner: *"Datastream V5 is unconfigured in Blynk Console"*.
   - **Crucial Rule**: The dashboard never silently substitutes locally computed risk as live hardware risk.
2. **Invalid / Numeric Pin V3 Response**:
   - If Virtual Pin V3 returns `"1"`, `"0"`, or another numeric value instead of `"SAFE"`, `"MODERATE"`, or `"DANGER!"`, `parseStorageCondition` throws an explicit error.
   - Condition status is set to `UNAVAILABLE` and the anomaly is logged.

---

## 5. Responsive Browser Validation

The light-themed UI (`bg-slate-50`) must be validated across the following viewports:

- **Mobile Viewports (< 640px)**:
  - Sidebar collapses to mobile drawer or hides behind hamburger navigation.
  - Metric cards stack in a single column (`grid-cols-1`).
  - No horizontal scrolling occurs on tables or charts.
- **Tablet Viewports (640px – 1024px)**:
  - Metrics display in two-column layout (`grid-cols-2`).
  - Charts reflow dynamically without clipping axis labels.
- **Desktop Viewports (>= 1024px)**:
  - Persistent left sidebar navigation (`w-64`).
  - Metric grids render across 4 columns (`grid-cols-4`).
  - Environmental and Risk trend charts render side-by-side (`grid-cols-2`).

---

## 6. Known Unverified Hardware Tests

The following tests cannot be automated in the frontend repository and require physical bench testing:

1. **Physical Relay Activation**: Confirming that pin 14 physically switches fan power when risk crosses 30.
2. **Servo Physical Deflection**: Verifying that pin 27 rotates the physical damper linkage to 0°, 60°, and 90°.
3. **Buzzer Audible Pulse**: Verifying that pin 25 produces an audible 300 ms pulse alarm when risk exceeds 60.
4. **MQ135 Gas Exposure**: Verifying hardware response to ethanol or VOC vapor under bench conditions.

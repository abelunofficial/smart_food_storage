# Smart Food Storage Monitoring Dashboard — Permanent Agent & Engineering Guidelines

This document outlines the mandatory operational constraints and architectural rules for all AI agents and engineers working on the Smart Food Storage Monitoring Dashboard codebase.

## 1. Permanent Project Constraints

1. **Use React functional components and TypeScript:**
   - All components must be written as React functional components with explicit TypeScript typings for props and state.
   - Avoid `any` types; prefer strict, comprehensive interface definitions.

2. **Visual Direction is LIGHT:**
   - The design direction for this application is LIGHT.
   - Use neutral light backgrounds (`bg-slate-50`), crisp white or near-white surface containers (`bg-white`), subtle borders (`border-slate-200`), and dark, high-contrast readable typography (`text-slate-900`, `text-slate-800`, `text-slate-600`).
   - Do not invert or introduce dark mode layouts without explicit instruction.

3. **Strict Hardware Pin Alignment (ESP32 Firmware V0–V4 & Local Risk Calculation):**
   - The hardware firmware publishes:
     - **V0**: Temperature in Celsius.
     - **V1**: Relative humidity percentage.
     - **V2**: MQ135 raw analog reading (0–4095 ADC).
     - **V3**: Storage condition status (exact values: `SAFE`, `MODERATE`, `DANGER!`).
     - **V4**: Manual fan control input (requested command; physical feedback is unavailable in firmware).
     - Note: **V5** is not currently configured in the Blynk product; risk score must be calculated locally using the firmware formula.
   - Never use misleading "ppm" units or claim calibrated gas concentration for the MQ135 sensor; it is an uncalibrated raw analog ADC reading.
   - Do not present requested fan commands as confirmed physical states.

4. **Exact Risk Formula Compliance:**
   - Must use the exact firmware formula:
     `risk = (temperature / 40) * 40 + (humidity / 100) * 30 + (gasRaw / 4095) * 30`
   - Clamped between `0` and `100`.
   - Classification:
     - **SAFE**: `risk <= 50`
     - **MODERATE**: `risk > 50` and `<= 63`
     - **DANGER**: `risk > 63`
   - All mock and live calculations must strictly adhere to this formula.

5. **Do Not Invent Hardware Telemetry:**
   - The hardware is a standard ESP32.
   - Never invent: ESP32-S3 identifiers, firmware versions, IP addresses, Wi-Fi signal strengths (RSSI), or uptime values unless published by future firmware revisions.
   - Keep diagnostic fields clearly marked unavailable or null when not provided.

6. **Prefer reusable components:**
   - Decompose complex UI into modular, composable, single-responsibility components in `src/components/common/` and domain-specific subdirectories.

7. **Keep API logic separate from UI:**
   - UI components must never make raw HTTP requests or directly touch external APIs.
   - All network calls, payload transformations, and external integrations (such as Blynk IoT API) must reside exclusively inside `src/services/`.

8. **Keep mock data centralized:**
   - All mock readings, test fixtures, and simulated telemetry must be centralized under `src/data/`.
   - Mock historical data must be clearly identified as simulated demonstration data (`isMock: true`).
   - Never embed hardcoded mock data directly inside UI components.

9. **Use clear naming conventions:**
   - PascalCase for React components and TypeScript types/interfaces (`SensorReading`, `StorageCondition`).
   - camelCase for functions, variables, hooks, and service instances (`calculateRiskScore`, `storageService`).
   - Descriptive identifiers representing physical IoT concepts (`mq135Raw`, `fanControlState`).

10. **Avoid unnecessary dependencies:**
    - Rely on the standard stack: React, Vite, TypeScript, Tailwind CSS, Recharts, and Lucide React.
    - Do not install heavy component frameworks or redundant packages without explicit authorization.

11. **Maintain responsive design:**
    - Ensure the layout functions seamlessly across desktop, tablet, and mobile displays without horizontal overflow.

12. **Never modify ESP32 firmware:**
    - This project is strictly a frontend monitoring application. ESP32 firmware and hardware configurations are external and immutable from this repository.

13. **Do not expose credentials in source code:**
    - Never hardcode API keys, auth tokens, device credentials, or sensitive URLs in source files.
    - Use `.env.example` templates and load configuration via `import.meta.env`.

14. **Do not implement future phases without approval:**
    - Follow phase boundaries strictly. Stop and seek user review and sign-off at the conclusion of each phase before advancing.

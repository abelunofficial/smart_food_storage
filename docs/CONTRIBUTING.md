# Contributing Guidelines

Thank you for contributing to the **Smart Food Storage Monitoring Dashboard**. To maintain high code quality, architectural consistency, and security, all contributors must adhere to the following standards.

---

## 1. Development Workflow

1. **Prerequisites**:
   - Node.js (version 20 LTS or higher recommended)
   - npm (version 10 or higher)
2. **Setup**:
   - Clone the repository.
   - Install dependencies: `npm install`
   - Copy environment template: `cp .env.example .env.local`
   - Start the development server: `npm run dev`
3. **Local Testing & Verification**:
   - Check linting: `npm run lint`
   - Check TypeScript compilation and build: `npm run build`

---

## 2. Code Quality & Architectural Rules

All contributions must follow the permanent engineering rules:

1. **React Functional Components & Strict TypeScript**:
   - Write all UI components as React functional components (`React.FC<Props>`).
   - Use strict TypeScript typings; avoid `any`.
   - Explicitly model IoT domain types in `src/types/`.
2. **Visual Direction is LIGHT**:
   - The user interface is strictly LIGHT-themed.
   - Use neutral light backgrounds (`bg-slate-50`), crisp white surface cards (`bg-white`), subtle borders (`border-slate-200`), and dark high-contrast typography (`text-slate-900`, `text-slate-700`).
   - Do not introduce dark mode themes or dark backgrounds.
3. **Strict Hardware Pin Alignment**:
   - V0: Temperature (°C).
   - V1: Relative humidity (% RH).
   - V2: MQ135 raw analog ADC reading (0–4095; never use ppm).
   - V3: Storage condition string (`SAFE`, `MODERATE`, `DANGER!`).
   - V4: Fan actuator (reserved/not implemented in firmware).
   - V5: Firmware-calculated risk score (0–100).
4. **Exact Risk Formula Adherence**:
   - Do not alter the firmware risk formula or classification boundaries (`SAFE <= 30`, `MODERATE > 30 and <= 60`, `DANGER > 60`).
5. **No Direct API Calls in UI Components**:
   - Components must never make raw HTTP/fetch calls.
   - All network and API logic must reside in `src/services/`.
6. **Centralized Mock Data**:
   - All mock fixtures must reside in `src/data/mockStorageData.ts`.
   - Never embed hardcoded mock data directly into component files.
7. **Never Commit Secrets**:
   - Never commit `.env.local`, API keys, Wi-Fi passwords, or Blynk authentication tokens.

---

## 3. Branch & Commit Conventions

### Branch Naming Conventions:
- `feature/description` — New capabilities or views (e.g., `feature/telemetry-export`)
- `fix/description` — Bug fixes or interface corrections (e.g., `fix/card-layout-overflow`)
- `docs/description` — Documentation improvements (e.g., `docs/update-api-guide`)
- `refactor/description` — Code improvements without changing functionality

### Commit Message Guidelines:
Follow the Conventional Commits specification:
```
<type>(<scope>): <short description>

[optional body explaining context and rationale]
```

Examples:
- `feat(monitoring): add real-time gauge animation for DHT22 readings`
- `fix(blynkService): reject numeric storage condition codes from pin V3`
- `docs(readme): document virtual pin mapping and risk formula`

---

## 4. Pull Request (PR) Expectations

Before submitting a Pull Request:
1. Ensure `npm run lint` passes with 0 errors.
2. Ensure `npm run build` succeeds cleanly without TypeScript errors.
3. Verify responsive layout across mobile, tablet, and desktop viewports.
4. Confirm that no secrets, tokens, or local `.env` files are tracked in git commits.
5. Provide a clear PR description detailing the changes, reasoning, and test steps performed.

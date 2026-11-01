# Deployment & Hosting Guide

This guide covers building and deploying the **Smart Food Storage Monitoring Dashboard** to hosting platforms such as **Vercel**, along with critical credential security considerations for production environments.

---

## 1. Production Build Procedure

The project uses Vite 8 and TypeScript for building static client assets:

```bash
# 1. Install exact dependencies
npm ci

# 2. Run linter inspection
npm run lint

# 3. Compile TypeScript and generate production bundle
npm run build
```

The compiled output is located in `dist/` and consists of static HTML, CSS, JavaScript, and asset files ready for static hosting.

To preview the built production site locally:

```bash
npm run preview
```

---

## 2. Vercel Deployment Procedure

The application is structured as a single-page React application (SPA) and deploys directly to Vercel.

### Step-by-Step Instructions:

1. **Connect Repository**:
   - Log into the [Vercel Dashboard](https://vercel.com).
   - Click **Add New Project** and import the GitHub repository.

2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Configure Environment Variables**:
   In the Vercel project settings, add the following under **Environment Variables**:
   - `VITE_BLYNK_SERVER` = `blynk.cloud` (or regional server)
   - `VITE_BLYNK_AUTH_TOKEN` = `your_blynk_auth_token_here`

4. **SPA Rewrite Rule (`vercel.json`)**:
   If client-side routing is expanded, ensure `vercel.json` contains SPA route rewrites:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

---

## 3. Blynk Credential Security & Client Exposure Warning

> [!CAUTION]
> **VITE_ Environment Variables Are Embedded in Client Bundles**:
> Any environment variable prefixed with `VITE_` is statically injected into the public JavaScript bundle during the build step (`npm run build`). Anyone visiting the public website can inspect `VITE_BLYNK_AUTH_TOKEN` via browser developer tools (Network / Sources tabs).

### Security Implications:
- **Public Deployments**: Deploying this frontend directly to a public URL with a real Blynk authentication token exposes your device's Blynk API. An unauthorized party who retrieves this token could read device telemetry or trigger rate limits.
- **Appropriate Contexts**: Direct client-side `VITE_` configuration is intended for **private internal networks, password-protected evaluation staging, or local development**.

### Production Architecture Recommendation:
For an enterprise or public-facing production deployment:
1. Do **not** query Blynk Cloud directly from the browser with `VITE_BLYNK_AUTH_TOKEN`.
2. Implement a lightweight backend proxy (e.g., Vercel Serverless Function, Express, or Next.js API route).
3. Store the Blynk token securely as a server-side secret (`BLYNK_AUTH_TOKEN`, without the `VITE_` prefix).
4. The proxy queries Blynk Cloud and serves sanitized telemetry to the frontend via authenticated endpoints.

---

## 4. Production Limitations & Recommendations

1. **Browser CORS Policies**:
   - Certain browsers or network firewalls may block cross-origin requests to `https://blynk.cloud/external/api/...`. A serverless proxy solves this by eliminating cross-origin client calls.
2. **Rate Limiting**:
   - The Blynk Cloud API enforces rate limits on external API calls. The dashboard uses internal in-flight request deduplication and 1.5s–2.5s caching to minimize query frequency.
3. **Telemetry History Persistence**:
   - Live historical charts currently display mock demonstration time-series points because Blynk's free-tier external REST API does not provide bulk historical array exports without a persistent telemetry database (e.g. InfluxDB, PostgreSQL).

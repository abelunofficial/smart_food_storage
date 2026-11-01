import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  RefreshCw,
  Clock,
  Radio,
  Layers,
  Sliders,
  AlertTriangle,
  Info,
  Gauge,
  Calculator,
  Thermometer,
  Activity,
  ChevronDown,
  CheckCircle2,
  Wrench,
} from 'lucide-react';
import type { DeviceStatus } from '../types';
import { storageService } from '../services';

export const DeviceInfoPage: React.FC = () => {
  const [device, setDevice] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    storageService
      .getDeviceStatus()
      .then((status) => {
        if (isMounted) {
          setDevice(status);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load device information', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshDeviceInfo = useCallback(async () => {
    try {
      setLoading(true);
      const status = await storageService.getDeviceStatus();
      setDevice(status);
    } catch (err) {
      console.error('Failed to refresh device info', err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading && !device) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Reading hardware architecture specifications...</p>
      </div>
    );
  }

  const lastSyncTime = device?.lastHeartbeat
    ? new Date(device.lastHeartbeat).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const isLiveFeed = device?.dataSource === 'blynk_live';

  const virtualPinMappings = [
    {
      pin: 'V0',
      name: 'Temperature',
      type: 'Double',
      unit: '°C',
      sensor: 'DHT22 Digital Sensor',
      status: 'Active',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      pin: 'V1',
      name: 'Relative Humidity',
      type: 'Double',
      unit: '% RH',
      sensor: 'DHT22 Digital Sensor',
      status: 'Active',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      pin: 'V2',
      name: 'Air Quality / Spoilage Gas',
      type: 'Integer',
      unit: 'Raw ADC (0–4095)',
      sensor: 'MQ135 Analog Transducer (Uncalibrated)',
      status: 'Active',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      pin: 'V3',
      name: 'Storage Condition Status',
      type: 'String',
      unit: 'SAFE / MODERATE / DANGER!',
      sensor: 'Firmware Condition Evaluator',
      status: 'Active',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      pin: 'V4',
      name: 'Manual Fan Relay Switch',
      type: 'Integer (0 / 1)',
      unit: '0 = OFF, 1 = ON',
      sensor: 'GPIO 2 Relay (BLYNK_WRITE(V4))',
      status: 'Active (Read/Write)',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      pin: 'V5',
      name: 'Calculated Risk Score',
      type: 'Double (0–100)',
      unit: 'Composite Risk Index',
      sensor: 'ESP32 Firmware Calculated Risk',
      status: 'Firmware Published',
      statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50"></span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Device Information &amp; Architecture
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Microcontroller specifications, network connectivity, and engineering documentation
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isLiveFeed ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            {isLiveFeed ? 'Connected to Blynk Cloud' : 'Demonstration Mode'}
          </span>

          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            Last Check: {lastSyncTime}
          </span>

          <button
            type="button"
            onClick={refreshDeviceInfo}
            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh device status"
            aria-label="Refresh device status"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Core Platform Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Microcontroller */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Microcontroller
            </span>
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">ESP32</div>
          <span className="text-xs text-slate-500 mt-1 block">Standard dual-core Xtensa edge controller</span>
        </div>

        {/* IoT Platform */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Cloud Service
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <Radio className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">Blynk IoT</div>
          <span className="text-xs text-slate-500 mt-1 block">HTTPS REST API read-only data ingestion</span>
        </div>

        {/* Local Display */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Local Display
            </span>
            <div className="p-1.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/60">
              <Gauge className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">20x4 LCD</div>
          <span className="text-xs text-slate-500 mt-1 block">On-site I2C alphanumeric chamber screen</span>
        </div>

        {/* Connection State */}
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Operational State
            </span>
            <div className="p-1.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-200/60">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-slate-900">
            {isLiveFeed ? 'Online / Live' : 'Active Demo'}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            {isLiveFeed ? 'Receiving live sensor telemetry' : 'Displaying demonstration data'}
          </span>
        </div>
      </div>

      {/* 2. System Hardware Profile */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Storage Unit System Profile
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Operating environment and communication specifications
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Sample Interval
            </span>
            <div className="text-base font-bold text-slate-900 mt-1">~2.0 Seconds</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">ESP32 sensor loop execution cycle</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Network Protocol
            </span>
            <div className="text-base font-bold text-slate-900 mt-1">2.4 GHz Wi-Fi</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">802.11 b/g/n wireless connectivity</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Bus Interface
            </span>
            <div className="text-base font-bold text-slate-900 mt-1">I2C / 1-Wire / ADC</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Dedicated physical sensor interfaces</span>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Operating Power
            </span>
            <div className="text-base font-bold text-slate-900 mt-1">5.0V DC / 3.3V Logic</div>
            <span className="text-[11px] text-slate-500 mt-0.5 block">Regulated chamber power supply</span>
          </div>
        </div>
      </div>

      {/* 3. Collapsible Technical Details & Engineering Reference */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
            <Wrench className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Technical Details &amp; Engineering Reference
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              In-depth sensor transducer specs, pin mappings, mathematical equations, and electrical interfacing
            </p>
          </div>
        </div>

        {/* Accordion Item 1: Hardware Sensor Specifications */}
        <details className="group border border-slate-200 rounded-lg overflow-hidden bg-slate-50/30">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-900 select-none">
            <div className="flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Hardware Sensor Specifications &amp; Transducer Calibration</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
          </summary>

          <div className="p-4 pt-2 border-t border-slate-200 bg-white space-y-4 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* DHT22 Digital Sensor */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5 text-sky-700">
                    <Thermometer className="w-3.5 h-3.5" />
                    DHT22 Digital Temperature &amp; Humidity
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-sky-100 text-sky-800">
                    Pins V0 &amp; V1
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Utilizes a capacitive humidity sensing element and high-precision thermistor coupled with an internal 8-bit microcontroller. Delivers a factory-calibrated digital signal over a dedicated single-wire serial bus.
                </p>
                <div className="pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-600 space-y-1">
                  <div>Temperature Range: -40°C to +80°C (Accuracy: ±0.5°C)</div>
                  <div>Humidity Range: 0% to 100% RH (Accuracy: ±2% to 5% RH)</div>
                  <div>Resolution: 0.1°C / 0.1% RH</div>
                </div>
              </div>

              {/* MQ135 Air Quality Sensor */}
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span className="flex items-center gap-1.5 text-purple-700">
                    <Activity className="w-3.5 h-3.5" />
                    MQ135 Gas / Air Quality Sensor
                  </span>
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Pin V2
                  </span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Tin Dioxide (SnO2) sensitive layer with variable resistance in the presence of organic decomposition byproducts (NH3, alcohol, smoke). Directly sampled by the ESP32 12-bit Analog-to-Digital Converter (ADC).
                </p>
                <div className="pt-2 border-t border-slate-200/60 font-mono text-[11px] text-slate-600 space-y-1">
                  <div>ADC Resolution: 12-bit (0–4095 raw count)</div>
                  <div>Calibration State: Uncalibrated raw analog voltage</div>
                  <div>Measurement Unit: Relative raw ADC counts (Not calibrated to volumetric ppm)</div>
                  <div>Transducer Conditioning: Unknown (Firmware publishes no uptime/heater run-time)</div>
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-950 space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Winsen MQ135 Manufacturer Conditioning &amp; Integrity Requirements</span>
              </div>
              <div className="leading-relaxed space-y-1">
                <div>• <strong>Initial Conditioning / Burn-In:</strong> The Winsen MQ135 manufacturer manual specifies an initial preheating period exceeding 48 hours under standard test conditions to stabilize the sensitive tin-dioxide chemical lattice.</div>
                <div>• <strong>Power Interruption Recovery:</strong> If the sensor has already completed the initial 48-hour burn-in, a brief power cut requires 2–5 minutes of heater recovery for thermal equilibrium. 2–5 minutes is NOT sufficient initial conditioning.</div>
                <div>• <strong>Conditioning State Unknown:</strong> Because the ESP32 firmware publishes no sensor uptime or heater run-time telemetry, physical transducer conditioning history is strictly <em>Unknown (Unverified)</em>.</div>
                <div>• <strong>No Uncalibrated PPM:</strong> In accordance with permanent project constraints, raw ADC readings are never presented as parts-per-million (ppm) gas concentrations.</div>
              </div>
            </div>

            {/* Experimental Food Spoilage Monitoring Reference */}
            <div className="p-3.5 rounded-lg bg-purple-50/50 border border-purple-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-purple-950">
                <span className="flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-700" />
                  Experimental Gas Deviation Methodology (Blynk V2 / GPIO 34)
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Relative Metric
                </span>
              </div>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                The experimental food spoilage monitoring system tracks relative chamber atmosphere alterations using the formula:
                <code className="mx-1 px-1.5 py-0.5 rounded bg-white border border-purple-200 font-mono text-[11px] text-purple-900">
                  D = (|G - B| / B) * 100
                </code>
                where <strong className="text-slate-800">G</strong> is the current raw ADC reading and <strong className="text-slate-800">B</strong> is a confirmed fresh-food baseline established across a multi-sample median sequence. The system also records signed change <code className="mx-1 px-1 py-0.5 rounded bg-white border border-purple-200 font-mono text-[11px]">G - B</code> and direction (increased, decreased, or unchanged).
              </p>
              <div className="pt-2 border-t border-purple-200/60 text-[11px] text-slate-600 space-y-1">
                <div>• <strong>Hardware Interface:</strong> ESP32 GPIO 34 (Analog Input), sampled continuously into Virtual Pin V2.</div>
                <div>• <strong>Directional Assessment:</strong> Gas level shifts may occur in either direction as organic matter decomposes or environment changes; neither direction independently proves food spoilage.</div>
                <div>• <strong>Provisional Thresholds:</strong> Warning (15%) and Significant Change (30%) are unvalidated demonstration settings, not certified food safety criteria.</div>
                <div>• <strong>Cross-Sensitivity Limitation:</strong> The MQ135 responds to multiple volatile gases (NH3, alcohol, sulfides) without chemical discrimination.</div>
                <div>• <strong>Calibration Requirement:</strong> A fresh baseline must be calibrated for each batch after loading fresh food into the chamber. Baselines are preserved per-batch in local browser storage.</div>
                <div>• <strong>Scientific Classification Disclaimer:</strong> Relative deviation D is an auxiliary research indicator and is never claimed to be a certified food safety determination or a spoilage percentage.</div>
              </div>
            </div>
          </div>
        </details>

        {/* Accordion Item 2: Virtual Pin Mapping Table */}
        <details className="group border border-slate-200 rounded-lg overflow-hidden bg-slate-50/30">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-900 select-none">
            <div className="flex items-center gap-2.5">
              <Layers className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Blynk IoT Virtual Pin Datastream Mapping (V0–V5)</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
          </summary>

          <div className="p-4 pt-2 border-t border-slate-200 bg-white space-y-3 text-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3 rounded-l">Pin</th>
                    <th className="py-2.5 px-3">Parameter</th>
                    <th className="py-2.5 px-3">Data Type</th>
                    <th className="py-2.5 px-3">Units / Range</th>
                    <th className="py-2.5 px-3">Hardware Association</th>
                    <th className="py-2.5 px-3 rounded-r">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {virtualPinMappings.map((row) => (
                    <tr key={row.pin} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                        {row.pin}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800">
                        {row.name}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {row.type}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        {row.unit}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {row.sensor}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold border ${row.statusClass}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
              <strong>Datastream V5 Notice:</strong> The ESP32 firmware writes calculated risk scores to Virtual Pin V5 every 2 seconds via <code>Blynk.virtualWrite(V5, risk)</code>. When V5 is unconfigured in the cloud template, the client dashboard evaluates the identical firmware formula locally for continuous safety verification.
            </div>
          </div>
        </details>

        {/* Accordion Item 3: Mathematical Risk Calculation Model */}
        {/* Accordion Item 3: Exact Risk Formula & Spoilage Model */}
        <details className="group border border-slate-200 rounded-lg overflow-hidden bg-slate-50/30">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-900 select-none">
            <div className="flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Exact Risk Formula &amp; Spoilage Classification Model</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
          </summary>

          <div className="p-4 pt-2 border-t border-slate-200 bg-white space-y-3 text-xs">
            <p className="text-slate-600 text-xs leading-relaxed">
              The ESP32 firmware calculates an overall food degradation risk index on every measurement loop by evaluating temperature, humidity, and gas sensor additions above safe preservation baselines:
            </p>

            <div className="p-3.5 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto shadow-inner">
              <div className="text-slate-400 text-[10px] mb-1 font-sans font-medium uppercase tracking-wider">
                Firmware Algorithm (Clamped 0.0 to 100.0)
              </div>
              <div className="text-emerald-400 font-semibold whitespace-pre">
                {'float tempContrib = (temperature > 25.0) ? (temperature - 25.0) * 2.0 : 0.0;\nfloat humContrib  = (humidity > 60.0) ? (humidity - 60.0) * 1.5 : 0.0;\nfloat gasContrib  = (gasRaw > 1500) ? (gasRaw - 1500) * 0.02 : 0.0;\nfloat risk = min(100.0, tempContrib + humContrib + gasContrib);'}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-sky-800 block">Temperature Factor</span>
                <span className="text-sm font-bold text-slate-900">Baseline 25.0°C</span>
                <p className="text-[11px] text-slate-500 mt-1">2.0 points per °C above 25°C. Safe below 25°C.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-blue-800 block">Humidity Factor</span>
                <span className="text-sm font-bold text-slate-900">Baseline 60.0%</span>
                <p className="text-[11px] text-slate-500 mt-1">1.5 points per % RH above 60%. Safe below 60%.</p>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="font-semibold text-purple-800 block">Gas Sensor (Raw ADC)</span>
                <span className="text-sm font-bold text-slate-900">Baseline 1500 ADC</span>
                <p className="text-[11px] text-slate-500 mt-1">0.02 points per ADC count above 1500 (0–4095 range).</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <strong>Exact Classification Thresholds:</strong>
              <div className="font-mono text-slate-700 mt-1 space-y-0.5">
                <div>• SAFE: score ≤ 30.0</div>
                <div>• MODERATE: score &gt; 30.0 and score ≤ 60.0</div>
                <div>• DANGER!: score &gt; 60.0</div>
              </div>
            </div>
          </div>
        </details>

        {/* Accordion Item 4: Actuator Hardware Interfacing */}
        <details className="group border border-slate-200 rounded-lg overflow-hidden bg-slate-50/30">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-900 select-none">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Actuator Interfacing &amp; Electrical Logic</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
          </summary>

          <div className="p-4 pt-2 border-t border-slate-200 bg-white space-y-3 text-xs">
            <div className="space-y-3">
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 block">Automatic Ventilation Relay (GPIO Pin 14 — Active-HIGH)</span>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Controlled via an Active-HIGH relay channel (<code>#define RELAY_PIN 14</code>, <code>#define RELAY_ON HIGH</code>, <code>#define RELAY_OFF LOW</code>). Setting relay HIGH engages automatic ventilation; setting relay LOW disengages it. Firmware automatic logic: relay is OFF (LOW) during SAFE conditions (risk ≤ 30), and ON (HIGH) during MODERATE (30 &lt; risk ≤ 60) and DANGER (risk &gt; 60). Physical contact feedback is unavailable in firmware.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 block">Manual Operator Fan Relay (GPIO Pin 2 — Active-HIGH, Virtual Pin V4)</span>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Auxiliary ventilation relay (<code>#define FAN_PIN 2</code>, <code>#define FAN_ON HIGH</code>, <code>#define FAN_OFF LOW</code>) switched remotely by operator commands via Blynk Virtual Pin V4 (<code>BLYNK_WRITE(V4) &#123; setFan(param.asInt() == 1); &#125;</code>). Synchronized on initial connection (<code>BLYNK_CONNECTED() &#123; Blynk.syncVirtual(V4); &#125;</code>). Operates independently from the automatic ventilation relay on GPIO 14. Physical tachometer feedback is unavailable in firmware.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 block">Intake Damper Vent Servo (GPIO Pin 27 PWM)</span>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Driven by ESP32 PWM timer via the ESP32Servo library (<code>#define SERVO_PIN 27</code>) at 50Hz. Firmware commands discrete aperture angles based on risk: 0° in SAFE (closed), 60° in MODERATE (intake circulation), and 90° in DANGER (emergency vent). Standard open-loop actuator without angle feedback.
                </p>
              </div>

              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 block">Piezoelectric Warning Buzzer (GPIO Pin 25)</span>
                <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                  Driven directly via GPIO output (<code>#define BUZZER 25</code>). Programmed to execute a non-blocking 300 ms toggling tone (<code>millis() - lastBuzzerToggle &gt;= 300</code>) during DANGER conditions (risk &gt; 60.0). Silent during SAFE and MODERATE conditions. Open-loop transducer without audio microphone feedback.
                </p>
              </div>
            </div>
          </div>
        </details>

        {/* Accordion Item 5: Alert Delivery & Diagnostic Limitations */}
        <details className="group border border-slate-200 rounded-lg overflow-hidden bg-slate-50/30">
          <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors font-semibold text-xs text-slate-900 select-none">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Diagnostic Limitations &amp; Architecture Boundaries</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition-transform duration-200" />
          </summary>

          <div className="p-4 pt-2 border-t border-slate-200 bg-white space-y-3 text-xs">
            <p className="text-slate-600 text-xs leading-relaxed">
              To maintain strict engineering integrity, the following diagnostic fields are explicitly designated as unsupported because the physical ESP32 firmware does not publish network or diagnostic metrics:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">IP Address</span>
                <span className="text-[11px] font-mono text-slate-600">Unavailable (Not reported)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Wi-Fi RSSI</span>
                <span className="text-[11px] font-mono text-slate-600">Unavailable (Not reported)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Firmware Version</span>
                <span className="text-[11px] font-mono text-slate-600">Unavailable (Not reported)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Uptime Counter</span>
                <span className="text-[11px] font-mono text-slate-600">Unavailable (Not reported)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Actuator Feedback</span>
                <span className="text-[11px] font-mono text-slate-600">Unavailable (Open loop)</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] uppercase font-semibold text-slate-500 block">Cellular / SMS</span>
                <span className="text-[11px] font-mono text-slate-600">Unsupported (Wi-Fi only)</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 leading-relaxed">
              <strong>Blynk Cloud Event Notification:</strong> Firmware executes <code>Blynk.logEvent(&quot;alert&quot;, &quot;High spoilage risk!&quot;)</code> when calculated risk score crosses 60.0. Cloud push and email alerts require that the <code>&quot;alert&quot;</code> event code be configured in the Blynk Web Console Template Events settings.
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

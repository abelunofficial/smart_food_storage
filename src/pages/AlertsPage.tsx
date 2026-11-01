import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  RefreshCw,
  Clock,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Info,
  Thermometer,
  Droplets,
  Activity,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import type {
  SensorReading,
  StorageCondition,
  RiskAssessment,
  AlertEvent,
} from '../types';
import { storageService } from '../services';

export const AlertsPage: React.FC = () => {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [condition, setCondition] = useState<StorageCondition | null>(null);
  const [risk, setRisk] = useState<RiskAssessment | null>(null);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      storageService.getCurrentReading(),
      storageService.getStorageCondition(),
      storageService.getRiskAssessment(),
      storageService.getRecentAlerts(),
    ])
      .then(([currentReading, currentCondition, currentRisk, currentAlerts]) => {
        if (isMounted) {
          setReading(currentReading);
          setCondition(currentCondition);
          setRisk(currentRisk);
          setAlerts(currentAlerts);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load alerts telemetry', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      setLoading(true);
      const [currentReading, currentCondition, currentRisk, currentAlerts] =
        await Promise.all([
          storageService.getCurrentReading(),
          storageService.getStorageCondition(),
          storageService.getRiskAssessment(),
          storageService.getRecentAlerts(),
        ]);
      setReading(currentReading);
      setCondition(currentCondition);
      setRisk(currentRisk);
      setAlerts(currentAlerts);
    } catch (err) {
      console.error('Failed to refresh alerts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading && (!reading || !condition || !risk)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Loading condition alerts stream...</p>
      </div>
    );
  }

  const lastSyncTime = reading
    ? new Date(reading.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const conditionStatus = condition ? condition.status : 'SAFE';
  const isSafe = conditionStatus === 'SAFE';
  const isModerate = conditionStatus === 'MODERATE';
  const isDanger = conditionStatus === 'DANGER!';

  const conditionConfig = {
    SAFE: {
      theme: 'border-emerald-200 bg-emerald-50/40 text-emerald-900',
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      headline: 'Chamber Environment Normal',
      description:
        'All food preservation parameters remain within safe operational boundaries. Degradation risk is minimal.',
    },
    MODERATE: {
      theme: 'border-amber-200 bg-amber-50/40 text-amber-900',
      badge: 'bg-amber-100 text-amber-800 border-amber-300',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      headline: 'Elevated Risk Excursion',
      description:
        'Environmental parameters indicate elevated temperature, humidity, or airborne spoilage factor levels. Active inspection recommended.',
    },
    'DANGER!': {
      theme: 'border-rose-200 bg-rose-50/40 text-rose-900',
      badge: 'bg-rose-100 text-rose-800 border-rose-300',
      icon: AlertOctagon,
      iconColor: 'text-rose-600',
      headline: 'Critical Spoilage Danger',
      description:
        'Chamber conditions have crossed the critical preservation threshold. Rapid food spoilage likely without immediate operator intervention.',
    },
    UNAVAILABLE: {
      theme: 'border-slate-200 bg-slate-50/40 text-slate-900',
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      icon: Info,
      iconColor: 'text-slate-600',
      headline: 'Condition Telemetry Pending',
      description:
        'Condition telemetry is awaiting connection to edge hardware. Monitor live sensor readings below.',
    },
  }[conditionStatus] ?? {
    theme: 'border-slate-200 bg-white text-slate-900',
    badge: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: ShieldCheck,
    iconColor: 'text-slate-600',
    headline: 'Condition Monitored',
    description: 'Storage parameters are monitored continuously.',
  };

  const ConditionIcon = conditionConfig.icon;

  return (
    <div className="space-y-6">
      {/* Top Header & Refresh Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-50"></span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Food Storage Condition Alerts
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time spoilage warning detection, threshold monitoring, and incident activity
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Active Monitoring
          </span>

          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            Last Check: {lastSyncTime}
          </span>

          <button
            type="button"
            onClick={refreshAlerts}
            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh alerts"
            aria-label="Refresh alerts"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Current Storage Condition Banner */}
      <div className={`rounded-xl border p-5 sm:p-6 bg-white shadow-xs ${conditionConfig.theme}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/60">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs ${conditionConfig.iconColor}`}>
              <ConditionIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
                Current Storage Condition
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
                {conditionConfig.headline}
              </h3>
            </div>
          </div>

          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border uppercase self-start sm:self-center ${conditionConfig.badge}`}>
            {conditionStatus}
          </span>
        </div>

        <p className="text-xs text-slate-600 my-4 leading-relaxed">
          {conditionConfig.description}
        </p>

        {/* Associated Environmental Telemetry Stream Grid */}
        {reading && risk && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 pt-2">
            {/* Temperature */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
                <span className="flex items-center gap-1 text-sky-700">
                  <Thermometer className="w-3.5 h-3.5" />
                  Temperature
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Live</span>
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {reading.temperature.toFixed(1)}°C
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Target: 2.0°C–6.0°C</span>
            </div>

            {/* Humidity */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
                <span className="flex items-center gap-1 text-blue-700">
                  <Droplets className="w-3.5 h-3.5" />
                  Humidity
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Live</span>
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {reading.humidity.toFixed(1)}% RH
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Target: 60%–70% RH</span>
            </div>

            {/* Air Quality (Gas Raw ADC) */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
                <span className="flex items-center gap-1 text-purple-700">
                  <Activity className="w-3.5 h-3.5" />
                  Gas Sensor (Raw)
                </span>
                <span className="text-[10px] text-slate-400 font-medium">ADC</span>
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {reading.mq135Raw}{' '}
                <span className="text-xs font-normal text-slate-500">ADC</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">Baseline: 1500 ADC counts</span>
            </div>

            {/* Risk Index */}
            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
                <span className="flex items-center gap-1 text-emerald-700">
                  <Cpu className="w-3.5 h-3.5" />
                  Risk Index
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Composite</span>
              </div>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {risk.score !== null ? (
                  <>
                    {risk.score.toFixed(1)}{' '}
                    <span className="text-xs font-normal text-slate-500">/ 100</span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-amber-700">
                    Unavailable
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {risk.score !== null
                  ? 'Safe threshold: ≤ 30.0'
                  : `Sensor check: ${risk.locallyCalculatedScore?.toFixed(1) ?? 'N/A'}`}
              </span>
            </div>
          </div>
        )}

        {/* Classification Threshold Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-5 mt-4 border-t border-slate-100">
          <div
            className={`p-2.5 rounded-lg border text-xs ${
              isSafe ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span>≤ 30: SAFE</span>
              {isSafe && <span className="text-[10px] font-bold text-emerald-700 uppercase">Active</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Normal storage environment.</p>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs ${
              isModerate ? 'bg-amber-50 border-amber-300 text-amber-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span>&gt; 30 and ≤ 60: MODERATE</span>
              {isModerate && <span className="text-[10px] font-bold text-amber-700 uppercase">Active</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Elevated environmental risk; ventilation active.</p>
          </div>

          <div
            className={`p-2.5 rounded-lg border text-xs ${
              isDanger ? 'bg-rose-50 border-rose-300 text-rose-950 font-medium' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <div className="flex items-center justify-between font-semibold">
              <span>&gt; 60: DANGER!</span>
              {isDanger && <span className="text-[10px] font-bold text-rose-700 uppercase">Active</span>}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Critical threshold; buzzer alarm &amp; cloud alert active.</p>
          </div>
        </div>
      </div>

      {/* 2. Incident Activity Log */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Incident Activity Log
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Timestamped environmental incident history
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200">
            {alerts.length} Logged Events
          </span>
        </div>

        <div className="divide-y divide-slate-100 mt-2">
          {alerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No incidents recorded. All parameters normal.
            </div>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="py-3.5 flex items-start gap-3">
                <div className="p-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 shrink-0 mt-0.5">
                  <Info className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-semibold text-slate-900">
                      {alert.title}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                    {alert.message}
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-slate-400">
                    Parameter: {alert.parameter}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Notification Channels Overview */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
          <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Notification Channels
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active alert notification methods for storage facility operators
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
          {/* On-Site Audible Alarm */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">
                Local Chamber Buzzer (Pin 25)
              </span>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                <strong>Status: Armed.</strong> Sounds automatically on-site when calculated risk crosses into DANGER! (&gt; 60). Executes an autonomous 300 ms toggling alarm tone. Silent during SAFE and MODERATE conditions.
              </p>
            </div>
          </div>

          {/* Chamber Door LCD Display */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">
                On-Site Door Character Display (20x4 I2C)
              </span>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                <strong>Status: Active.</strong> Displays instantaneous chamber temperature, humidity, and condition label directly on the chamber exterior.
              </p>
            </div>
          </div>

          {/* Cloud Push Alerts */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">
                Blynk Cloud Event Notification
              </span>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                <strong>Status: Firmware Dispatched.</strong> Firmware executes <code>Blynk.logEvent(&quot;alert&quot;, &quot;High spoilage risk!&quot;)</code> when risk &gt; 60. Notification delivery channels and rate limits depend on Blynk Console event setup.
              </p>
            </div>
          </div>

          {/* Web Dashboard Visual Alerts */}
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 block">
                Visual Dashboard Warning Banners
              </span>
              <p className="text-slate-600 text-[11px] mt-1 leading-relaxed">
                <strong>Status: Active.</strong> High-visibility banners and status indicators appear instantaneously on operator screens.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

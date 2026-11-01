import React from 'react';
import { RefreshCw, Clock, AlertCircle, WifiOff } from 'lucide-react';
import { useStorageOverview } from '../hooks';
import {
  ConditionSummaryCard,
  MetricCardsGrid,
  EquipmentSummaryCard,
  RecentActivityCard,
  ExperimentalSpoilageSummaryCard,
} from '../components/dashboard';
import {
  EnvironmentalTrendChart,
  RiskTrendChart,
} from '../components/charts';

interface OverviewPageProps {
  onNavigateToAnalytics?: () => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigateToAnalytics }) => {
  const { snapshot, loading, error, refresh } = useStorageOverview();

  if (loading && !snapshot) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Loading storage telemetry...</p>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-900 max-w-xl mx-auto my-8">
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <span>Failed to load telemetry data</span>
        </div>
        <p className="text-xs text-red-700 mt-1">{error?.message ?? 'Unknown service error'}</p>
        <button
          type="button"
          onClick={() => refresh()}
          className="mt-3 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const lastSyncTime = new Date(snapshot.sensorReading.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="space-y-6">
      {/* Top Facility Header & Sync Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${snapshot.deviceStatus.connectionState === 'offline' ? 'bg-rose-500 ring-4 ring-rose-50' : 'bg-emerald-500 ring-4 ring-emerald-50'}`}></span>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Primary Food Storage Chamber
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time environmental monitoring, automated climate controls, and storage environment monitoring
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center text-xs text-slate-500">
          {snapshot.deviceStatus.connectionState === 'offline' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              <WifiOff className="w-3 h-3 text-rose-600" />
              Offline
            </span>
          )}
          {snapshot.sensorReading.isStale && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Cached Sample
            </span>
          )}
          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2 py-1 rounded border border-slate-200">
            <Clock className="w-3 h-3 text-slate-400" />
            Last Synced: {lastSyncTime}
          </span>
          <button
            type="button"
            onClick={() => refresh()}
            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh telemetry snapshot"
            aria-label="Refresh telemetry snapshot"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Offline Hardware Notice Banner */}
      {snapshot.deviceStatus.connectionState === 'offline' && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Hardware Disconnected:</strong> Physical ESP32 microcontroller is offline.
              {snapshot.sensorReading.isStale && ' Telemetry displayed is cached from the last successful transmission.'}
            </span>
          </div>
          <span className="font-semibold text-[11px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded shrink-0">
            Hardware Offline
          </span>
        </div>
      )}

      {/* Stale / Cached Data Banner */}
      {snapshot.sensorReading.isStale && snapshot.deviceStatus.connectionState !== 'offline' && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cached Telemetry:</strong> Telemetry retained from sample at{' '}
              <span className="font-mono">{new Date(snapshot.sensorReading.timestamp).toLocaleTimeString()}</span>.
            </span>
          </div>
          <span className="font-semibold text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded shrink-0">
            Data Stale
          </span>
        </div>
      )}

      {/* Section A: Storage Condition Summary */}
      <ConditionSummaryCard
        condition={snapshot.storageCondition}
        risk={snapshot.riskAssessment}
      />

      {/* Section B: Environmental Metric Cards (V0, V1, V2, Local Risk Calc) */}
      <MetricCardsGrid
        reading={snapshot.sensorReading}
        risk={snapshot.riskAssessment}
      />

      {/* Section C: Experimental Food Spoilage Monitoring Summary */}
      <ExperimentalSpoilageSummaryCard
        reading={snapshot.sensorReading}
        onNavigateToAnalytics={onNavigateToAnalytics}
      />

      {/* Sections D & E: 24h Trend Charts (Environmental & Risk) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EnvironmentalTrendChart data={snapshot.historicalReadings} />
        <RiskTrendChart data={snapshot.historicalReadings} />
      </div>

      {/* Sections E & F: Equipment Summary (V4) & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <EquipmentSummaryCard fanState={snapshot.fanControlState} />
        <RecentActivityCard alerts={snapshot.recentAlerts} />
      </div>
    </div>
  );
};


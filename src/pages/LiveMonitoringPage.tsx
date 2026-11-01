import React, { useState, useEffect, useCallback } from 'react';
import { Thermometer, Droplets, Activity, Clock, RefreshCw, WifiOff } from 'lucide-react';
import type { SensorReading, HistoricalReading, TelemetryTimeRange } from '../types';
import { storageService } from '../services';
import {
  SensorCard,
  HistoricalTelemetryChart,
} from '../components/monitoring';

export const LiveMonitoringPage: React.FC = () => {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalReading[]>([]);
  const [timeRange, setTimeRange] = useState<TelemetryTimeRange>('24h');
  const [loading, setLoading] = useState<boolean>(true);
  const [chartLoading, setChartLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      storageService.getCurrentReading(),
      storageService.getHistoricalReadings(timeRange),
    ])
      .then(([currentReading, history]) => {
        if (isMounted) {
          setReading(currentReading);
          setHistoricalData(history);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load telemetry', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [timeRange]);

  const refreshLiveTelemetry = useCallback(async () => {
    try {
      setLoading(true);
      const [currentReading, history] = await Promise.all([
        storageService.getCurrentReading(),
        storageService.getHistoricalReadings(timeRange),
      ]);
      setReading(currentReading);
      setHistoricalData(history);
    } catch (err) {
      console.error('Failed to refresh telemetry', err);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  const handleTimeRangeChange = async (newRange: TelemetryTimeRange) => {
    setTimeRange(newRange);
    try {
      setChartLoading(true);
      const data = await storageService.getHistoricalReadings(newRange);
      setHistoricalData(data);
    } catch (err) {
      console.error('Failed to change time range', err);
    } finally {
      setChartLoading(false);
    }
  };

  if (loading && !reading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Loading live telemetry stream...</p>
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

  const isStale = reading?.isStale;

  return (
    <div className="space-y-6">
      {/* Top Header & Data Freshness Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isStale ? 'bg-amber-500 ring-4 ring-amber-50' : 'bg-blue-600 ring-4 ring-blue-50'}`}></span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Sensor Telemetry Stream
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time environmental sensor data stream and 24-hour historical telemetry
          </p>
        </div>

        {/* Data Freshness & Telemetry Source */}
        <div className="flex items-center gap-2.5 self-start sm:self-center text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                reading?.dataSource === 'blynk_live' ? (isStale ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse') : 'bg-amber-500'
              }`}
            ></span>
            {reading?.dataSource === 'blynk_live' ? (isStale ? 'Blynk (Cached)' : 'Live Cloud Feed') : 'Demonstration Feed'}
          </span>

          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            Last Reading: {lastSyncTime}
          </span>

          <button
            type="button"
            onClick={refreshLiveTelemetry}
            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh sensor stream"
            aria-label="Refresh sensor stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Stale / Offline Notification Banner */}
      {isStale && (
        <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Cached Telemetry:</strong> Displaying retained sensor sample from{' '}
              <span className="font-mono">{lastSyncTime}</span>. Hardware is awaiting new transmission.
            </span>
          </div>
          <span className="font-semibold text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded shrink-0">
            Data Stale
          </span>
        </div>
      )}

      {/* Section A: Current Sensor Readings */}
      {reading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Temperature */}
          <SensorCard
            name="Chamber Temperature"
            value={reading.temperature.toFixed(1)}
            unit="°C"
            icon={Thermometer}
            accentColor="text-sky-700 bg-sky-50 border-sky-200"
            description="Ambient air temperature inside storage chamber. Risk threshold baseline: 25.0°C."
            badge={isStale ? 'Cached' : 'Live'}
          />

          {/* Humidity */}
          <SensorCard
            name="Relative Humidity"
            value={reading.humidity.toFixed(1)}
            unit="% RH"
            icon={Droplets}
            accentColor="text-blue-700 bg-blue-50 border-blue-200"
            description="Relative humidity moisture level inside storage chamber. Risk threshold baseline: 60.0%."
            badge={isStale ? 'Cached' : 'Live'}
          />

          {/* Gas Sensor (Raw ADC) */}
          <SensorCard
            name="Gas Sensor Reading (Raw)"
            value={reading.mq135Raw}
            unit="ADC"
            icon={Activity}
            accentColor="text-purple-700 bg-purple-50 border-purple-200"
            description="MQ135 raw analog ADC reading (0–4095). Spoilage baseline threshold: 1500 ADC."
            badge={isStale ? 'Cached' : 'Live'}
          />
        </div>
      )}

      {/* Section B: Historical Telemetry Chart with Time Range Selection */}
      <HistoricalTelemetryChart
        data={historicalData}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
        loading={chartLoading}
      />
    </div>
  );
};

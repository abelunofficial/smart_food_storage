import React from 'react';
import { Thermometer, Droplets, Activity, ShieldCheck } from 'lucide-react';
import type { SensorReading, RiskAssessment } from '../../types';
import { MetricCard } from './MetricCard';

interface MetricCardsGridProps {
  reading: SensorReading;
  risk: RiskAssessment;
}

export const MetricCardsGrid: React.FC<MetricCardsGridProps> = ({
  reading,
  risk,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Temperature */}
      <MetricCard
        name="Temperature"
        value={reading.temperature.toFixed(1)}
        unit="°C"
        badge={reading.isStale ? 'Cached' : 'Live'}
        icon={Thermometer}
        accentColor="text-sky-700 bg-sky-50 border-sky-200"
        description="Preservation target window: 2.0°C – 6.0°C. Baseline threshold: 25.0°C."
      />

      {/* 2. Humidity */}
      <MetricCard
        name="Relative Humidity"
        value={reading.humidity.toFixed(1)}
        unit="% RH"
        badge={reading.isStale ? 'Cached' : 'Live'}
        icon={Droplets}
        accentColor="text-blue-700 bg-blue-50 border-blue-200"
        description="Preservation moisture target: 60.0% – 70.0% RH. Baseline threshold: 60.0%."
      />

      {/* 3. Gas Sensor (Raw ADC) */}
      <MetricCard
        name="Gas Sensor (Raw ADC)"
        value={reading.mq135Raw}
        unit="ADC"
        badge={reading.isStale ? 'Cached' : 'Live'}
        icon={Activity}
        accentColor="text-purple-700 bg-purple-50 border-purple-200"
        description="MQ135 raw analog reading (0–4095 ADC). Firmware formula threshold: 1500 ADC. Uncalibrated gas reading does not prove food spoilage."
      />

      {/* 4. Firmware Risk (V5) & Local Diagnostic Risk Score */}
      <MetricCard
        name="Firmware Risk (V5)"
        value={risk.score !== null ? risk.score.toFixed(1) : 'Unavailable'}
        unit={risk.score !== null ? '/ 100' : ''}
        badge={
          risk.score !== null
            ? (risk.scoreSource === 'blynk_v5' ? 'Live Telemetry' : 'Calculated')
            : 'Unavailable'
        }
        icon={ShieldCheck}
        accentColor={
          risk.score === null
            ? 'text-slate-600 bg-slate-50 border-slate-200'
            : risk.level === 'SAFE'
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-amber-700 bg-amber-50 border-amber-200'
        }
        description={
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700">Local Diagnostic Risk Score:</span>
              <span className="font-mono font-bold text-slate-900">
                {risk.locallyCalculatedScore !== undefined
                  ? `${risk.locallyCalculatedScore.toFixed(1)} / 100`
                  : 'N/A'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              {risk.score !== null
                ? 'Published via Virtual Pin V5.'
                : 'Firmware V5: Awaiting cloud datastream setup.'}{' '}
              Raw sensor readings do not prove food freshness or spoilage.
            </p>
          </div>
        }
      />
    </div>
  );
};

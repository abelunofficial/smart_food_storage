import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Clock, ShieldAlert } from 'lucide-react';
import type {
  SensorReading,
  StorageCondition,
  HistoricalReading,
  RiskAssessment,
} from '../types';
import { storageService } from '../services';
import { calculateRiskBreakdown } from '../utils';
import {
  CurrentRiskCard,
  RiskContributionCard,
  HistoricalRiskChart,
  RiskDataSourceBanner,
  ExperimentalSpoilageSection,
} from '../components/analytics';

export const RiskAnalyticsPage: React.FC = () => {
  const [reading, setReading] = useState<SensorReading | null>(null);
  const [condition, setCondition] = useState<StorageCondition | null>(null);
  const [riskAssessment, setRiskAssessment] = useState<RiskAssessment | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalReading[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      storageService.getCurrentReading(),
      storageService.getStorageCondition(),
      storageService.getRiskAssessment(),
      storageService.getHistoricalReadings('24h'),
    ])
      .then(([currentReading, currentCondition, currentRisk, history]) => {
        if (isMounted) {
          setReading(currentReading);
          setCondition(currentCondition);
          setRiskAssessment(currentRisk);
          setHistoricalData(history);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load risk analytics data', err);
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const refreshAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      const [currentReading, currentCondition, currentRisk, history] = await Promise.all([
        storageService.getCurrentReading(),
        storageService.getStorageCondition(),
        storageService.getRiskAssessment(),
        storageService.getHistoricalReadings('24h'),
      ]);
      setReading(currentReading);
      setCondition(currentCondition);
      setRiskAssessment(currentRisk);
      setHistoricalData(history);
    } catch (err) {
      console.error('Failed to refresh risk analytics data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading && (!reading || !condition)) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium text-slate-600">Calculating risk metrics...</p>
      </div>
    );
  }

  // Calculate breakdown from current sensor reading
  const breakdown = reading
    ? calculateRiskBreakdown(reading.temperature, reading.humidity, reading.mq135Raw)
    : {
        tempContribution: 0,
        humidityContribution: 0,
        gasContribution: 0,
        totalScore: 0,
        level: 'SAFE' as const,
      };

  const lastSyncTime = reading
    ? new Date(reading.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const conditionStatus = condition ? condition.status : 'SAFE';

  return (
    <div className="space-y-6">
      {/* Top Header & Data Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></span>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Food Spoilage Risk Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous preservation risk assessment and environmental component breakdown
          </p>
        </div>

        {/* Data Freshness and Calculation Source Badge */}
        <div className="flex items-center gap-2.5 self-start sm:self-center text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
            <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
            Active Evaluation
          </span>

          <span className="inline-flex items-center gap-1 font-mono text-[11px] bg-white px-2.5 py-1 rounded border border-slate-200 text-slate-600">
            <Clock className="w-3 h-3 text-slate-400" />
            Evaluated: {lastSyncTime}
          </span>

          <button
            type="button"
            onClick={refreshAnalyticsData}
            className="p-1 rounded hover:bg-slate-200/60 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh risk assessment"
            aria-label="Refresh risk assessment"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Current Risk Assessment */}
      <CurrentRiskCard
        score={breakdown.totalScore}
        conditionStatus={conditionStatus}
        breakdown={breakdown}
        riskAssessment={riskAssessment}
      />

      {/* 2. Component Breakdown (Current contributions: Temp, Humidity, Air Quality) */}
      {reading && (
        <RiskContributionCard
          reading={reading}
          breakdown={breakdown}
        />
      )}

      {/* 3. 24-Hour Historical Risk Chart with Threshold Reference Lines */}
      <HistoricalRiskChart data={historicalData} />

      {/* 4. Dedicated Section: Experimental Food Spoilage Monitoring */}
      {reading && <ExperimentalSpoilageSection reading={reading} />}

      {/* 5. Data Source Transparency Notice */}
      <RiskDataSourceBanner riskAssessment={riskAssessment} />
    </div>
  );
};

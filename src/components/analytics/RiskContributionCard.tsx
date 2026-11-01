import React from 'react';
import { Layers, Thermometer, Droplets, Activity } from 'lucide-react';
import type { SensorReading } from '../../types';
import type { RiskBreakdown } from '../../utils/riskCalculator';

interface RiskContributionCardProps {
  reading: SensorReading;
  breakdown: RiskBreakdown;
}

export const RiskContributionCard: React.FC<RiskContributionCardProps> = ({
  reading,
  breakdown,
}) => {
  const { tempContribution, humidityContribution, gasContribution, totalScore } = breakdown;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200/60">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Parameter Risk Breakdown
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual factor additions calculated via ESP32 piecewise risk equation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center text-xs bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700">
          <span className="text-slate-400">Total Score:</span>
          <span className="font-bold text-slate-900">{totalScore.toFixed(1)} / 100</span>
        </div>
      </div>

      {/* Stacked Composition Bar */}
      <div className="py-5">
        <div className="flex items-center justify-between text-xs font-medium text-slate-600 mb-2">
          <span>Factor Proportions in Total Score</span>
          <span className="text-slate-500">
            {tempContribution} + {humidityContribution} + {gasContribution} = {totalScore.toFixed(1)} pts
          </span>
        </div>

        <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
          {/* Temperature Segment */}
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${Math.min(100, tempContribution)}%` }}
            title={`Temperature: ${tempContribution} pts`}
          />
          {/* Humidity Segment */}
          <div
            className="h-full bg-blue-600 transition-all duration-300"
            style={{ width: `${Math.min(100, humidityContribution)}%` }}
            title={`Humidity: ${humidityContribution} pts`}
          />
          {/* Air Quality Segment */}
          <div
            className="h-full bg-purple-500 transition-all duration-300"
            style={{ width: `${Math.min(100, gasContribution)}%` }}
            title={`Gas Sensor: ${gasContribution} pts`}
          />
          {/* Remaining Headroom to 100 */}
          <div
            className="h-full bg-slate-100 transition-all duration-300"
            style={{ width: `${Math.max(0, 100 - totalScore)}%` }}
            title={`Safety Buffer: ${(100 - totalScore).toFixed(1)} pts`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-600 mt-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span>Temperature: <strong>{tempContribution}</strong> pts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span>Humidity: <strong>{humidityContribution}</strong> pts</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
            <span>Gas (Raw ADC): <strong>{gasContribution}</strong> pts</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200"></span>
            <span>Safety Margin: <strong>{(100 - totalScore).toFixed(1)}</strong> pts</span>
          </div>
        </div>
      </div>

      {/* Detailed Component Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Temperature Card */}
        <div className="p-4 rounded-xl border border-sky-100 bg-sky-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sky-800 text-xs font-bold">
                <Thermometer className="w-3.5 h-3.5" />
                <span>Temperature Factor</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">Baseline 25°C</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{reading.temperature.toFixed(1)}°C</span>
              <span className="text-xs text-slate-500">reading</span>
            </div>

            <div className="mt-3 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span>Formula:</span>
                <span className="font-mono text-slate-700">(T &gt; 25) ? (T - 25) * 2 : 0</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-slate-100">
                <span>Contribution:</span>
                <span className="text-sky-700">{tempContribution} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-blue-800 text-xs font-bold">
                <Droplets className="w-3.5 h-3.5" />
                <span>Humidity Factor</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">Baseline 60%</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{reading.humidity.toFixed(1)}%</span>
              <span className="text-xs text-slate-500">reading</span>
            </div>

            <div className="mt-3 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span>Formula:</span>
                <span className="font-mono text-slate-700">(H &gt; 60) ? (H - 60) * 1.5 : 0</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-slate-100">
                <span>Contribution:</span>
                <span className="text-blue-700">{humidityContribution} pts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Air Quality (Gas Raw ADC) Card */}
        <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-purple-800 text-xs font-bold">
                <Activity className="w-3.5 h-3.5" />
                <span>Gas Sensor (Raw ADC)</span>
              </div>
              <span className="text-[11px] font-medium text-slate-500">Baseline 1500 ADC</span>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{reading.mq135Raw}</span>
              <span className="text-xs text-slate-500">ADC counts</span>
            </div>

            <div className="mt-3 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span>Formula:</span>
                <span className="font-mono text-slate-700">(G &gt; 1500) ? (G - 1500) * 0.02 : 0</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t border-slate-100">
                <span>Contribution:</span>
                <span className="text-purple-700">{gasContribution} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

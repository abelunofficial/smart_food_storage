import React from 'react';
import {
  FlaskConical,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
} from 'lucide-react';
import type { SensorReading } from '../../types/storage.ts';
import { FOOD_CATEGORY_LABELS } from '../../types/spoilage.ts';
import { useSpoilageMonitoring } from '../../hooks/useSpoilageMonitoring.ts';
import { getWarningStatusMetadata } from '../../utils/spoilageCalculator.ts';

interface ExperimentalSpoilageSummaryCardProps {
  reading: SensorReading;
  onNavigateToAnalytics?: () => void;
}

export const ExperimentalSpoilageSummaryCard: React.FC<ExperimentalSpoilageSummaryCardProps> = ({
  reading,
  onNavigateToAnalytics,
}) => {
  const { batches, activeBatch, assessment, loadDemoBatch } = useSpoilageMonitoring({
    currentReading: reading,
  });
  const statusMeta = getWarningStatusMetadata(assessment.status);

  const formattedTime = assessment.evaluatedAt
    ? new Date(assessment.evaluatedAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const hasCalibratedBaseline = Boolean(
    activeBatch && activeBatch.baselineStatus === 'calibrated' && activeBatch.baselineReading !== null
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-200/70">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Experimental Food Spoilage Monitoring
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                  Experimental
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Relative gas deviation (D) from fresh-food baseline using MQ135 sensor
              </p>
            </div>
          </div>

          {onNavigateToAnalytics && (
            <button
              type="button"
              onClick={onNavigateToAnalytics}
              className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
            >
              <span>Manage Batches</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content depending on active batch & calibration status */}
        {!activeBatch ? (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center space-y-2.5 my-2">
            <Layers className="w-6 h-6 text-slate-400 mx-auto" />
            <div>
              <span className="text-xs font-bold text-slate-800 block">No Food Storage Batch Configured</span>
              <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                Register a food batch and calibrate a fresh-food baseline in Risk Analytics to start experimental gas deviation monitoring.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 flex-wrap pt-1">
              {onNavigateToAnalytics && (
                <button
                  type="button"
                  onClick={onNavigateToAnalytics}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register First Batch</span>
                </button>
              )}
              {batches.length === 0 && (
                <button
                  type="button"
                  onClick={loadDemoBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Demo [DEMO]</span>
                </button>
              )}
            </div>
          </div>
        ) : !hasCalibratedBaseline ? (
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-amber-900 space-y-2 my-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Active Batch: {activeBatch.name}</span>
                {activeBatch.isDemo && !activeBatch.name.startsWith('[DEMO]') && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    [DEMO]
                  </span>
                )}
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
                Baseline Required
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Food batch registered on {activeBatch.storageStartDate}. Fresh-food baseline calibration is pending. Load fresh food and perform baseline calibration to enable gas deviation tracking.
            </p>
            {onNavigateToAnalytics && (
              <button
                type="button"
                onClick={onNavigateToAnalytics}
                className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Calibrate Baseline Now</span>
              </button>
            )}
          </div>
        ) : (
          /* Active Monitoring Display */
          <div className="space-y-3 my-2">
            {/* Batch Info & Status Header */}
            <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Active Monitored Batch
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-sm font-bold text-slate-900">
                    {activeBatch.name}
                  </span>
                  {activeBatch.isDemo && !activeBatch.name.startsWith('[DEMO]') && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300">
                      [DEMO]
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {activeBatch.categories.map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] font-medium px-2 py-0.5 rounded bg-white text-slate-600 border border-slate-200"
                    >
                      {FOOD_CATEGORY_LABELS[cat] || cat}
                    </span>
                  ))}
                  <span className="text-[11px] text-slate-400">• Stored {activeBatch.storageStartDate}</span>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Monitoring State
                </span>
                <span
                  className={`mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusMeta.badgeClass}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {statusMeta.label}
                </span>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Current Gas (V2)
                </span>
                <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                  {assessment.currentRawGas ?? '--'}
                </div>
                <span className="text-[10px] text-slate-400">Raw ADC (0–4095)</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Fresh Baseline (B)
                </span>
                <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                  {assessment.baseline ?? '--'}
                </div>
                <span className="text-[10px] text-slate-400">Calibrated ADC</span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                    Gas Shift (G - B)
                  </span>
                  {assessment.direction === 'increased' && (
                    <TrendingUp className="w-3 h-3 text-amber-600" />
                  )}
                  {assessment.direction === 'decreased' && (
                    <TrendingDown className="w-3 h-3 text-sky-600" />
                  )}
                  {assessment.direction === 'unchanged' && (
                    <Minus className="w-3 h-3 text-slate-400" />
                  )}
                </div>
                <div className="text-base font-bold text-slate-900 mt-0.5 font-mono">
                  {assessment.signedDifference !== null
                    ? `${assessment.signedDifference > 0 ? '+' : ''}${assessment.signedDifference}`
                    : '--'}
                </div>
                <span className="text-[10px] text-slate-400">
                  |G - B| = {assessment.absoluteDifference !== null ? `±${assessment.absoluteDifference}` : '--'}
                </span>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-purple-50/50">
                <span className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider block">
                  Gas Deviation (D)
                </span>
                <div className="text-base font-bold text-purple-900 mt-0.5 font-mono">
                  {assessment.relativeDeviationPercent !== null ? `${assessment.relativeDeviationPercent}%` : '--'}
                </div>
                <span className="text-[10px] text-purple-600 font-medium">
                  {statusMeta.label}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimed physical feedback & scientific honesty footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Latest Reading: {formattedTime}</span>
        </div>
        <p className="text-[11px] text-slate-400 italic">
          *Provisional relative indicator. Not a certified food spoilage assay.
        </p>
      </div>
    </div>
  );
};

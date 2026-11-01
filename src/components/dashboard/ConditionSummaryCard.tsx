import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info } from 'lucide-react';
import type { StorageCondition, RiskAssessment } from '../../types';
import { StatusBadge } from '../common';

interface ConditionSummaryCardProps {
  condition: StorageCondition;
  risk: RiskAssessment;
}

export const ConditionSummaryCard: React.FC<ConditionSummaryCardProps> = ({
  condition,
  risk,
}) => {
  const statusConfig = {
    SAFE: {
      border: 'border-emerald-200',
      bg: 'bg-emerald-50/40',
      text: 'text-emerald-800',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      barColor: 'bg-emerald-500',
      headline: 'Normal Food Preservation State',
    },
    MODERATE: {
      border: 'border-amber-200',
      bg: 'bg-amber-50/40',
      text: 'text-amber-800',
      icon: AlertTriangle,
      iconColor: 'text-amber-600',
      barColor: 'bg-amber-500',
      headline: 'Elevated Risk — Ventilation Active',
    },
    'DANGER!': {
      border: 'border-red-200',
      bg: 'bg-red-50/40',
      text: 'text-red-800',
      icon: AlertOctagon,
      iconColor: 'text-red-600',
      barColor: 'bg-red-500',
      headline: 'Critical Storage Hazard — Alarm Active',
    },
    UNAVAILABLE: {
      border: 'border-slate-200',
      bg: 'bg-slate-50/40',
      text: 'text-slate-800',
      icon: Info,
      iconColor: 'text-slate-600',
      barColor: 'bg-slate-400',
      headline: 'Storage Condition Status Pending',
    },
  }[condition.status] ?? {
    border: 'border-slate-200',
    bg: 'bg-white',
    text: 'text-slate-800',
    icon: ShieldCheck,
    iconColor: 'text-slate-600',
    barColor: 'bg-blue-600',
    headline: 'Condition Monitored',
  };

  const IconComponent = statusConfig.icon;
  const displayScore = risk.score !== null ? risk.score : risk.locallyCalculatedScore ?? null;
  const clampedPercentage = displayScore !== null ? Math.min(100, Math.max(0, displayScore)) : 0;

  const scoreSourceLabel =
    risk.scoreSource === 'blynk_v5'
      ? 'Live Hardware Telemetry'
      : risk.v5Status === 'unconfigured'
      ? 'Awaiting Cloud Pin Setup'
      : 'Sensor Formula Calculation';

  return (
    <section
      aria-labelledby="storage-condition-heading"
      className={`rounded-xl border ${statusConfig.border} ${statusConfig.bg} bg-white p-5 sm:p-6 shadow-xs transition-colors`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className={`p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs ${statusConfig.iconColor}`}>
            <IconComponent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Overall Storage Condition
              </span>
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                Active Assessment
              </span>
            </div>
            <h2 id="storage-condition-heading" className="text-lg sm:text-xl font-bold text-slate-900 mt-0.5">
              {statusConfig.headline}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <StatusBadge variant={condition.status} size="md" />
          <div className="text-right">
            {risk.score !== null ? (
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                {risk.score.toFixed(1)}
                <span className="text-xs font-medium text-slate-500 ml-1">/ 100</span>
              </div>
            ) : (
              <div className="text-xl font-extrabold text-amber-700 tracking-tight leading-none">
                Unavailable
              </div>
            )}
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block mt-0.5">
              Risk Index ({scoreSourceLabel})
            </span>
          </div>
        </div>
      </div>

      {/* V5 Notice (Compact & User-Friendly) */}
      {risk.v5Status === 'unconfigured' && (
        <div className="mt-4 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Cloud Risk Stream is awaiting configuration in the IoT console.{' '}
              {risk.locallyCalculatedScore !== undefined && (
                <span>Local Diagnostic Risk Score: <strong>{risk.locallyCalculatedScore.toFixed(1)} / 100</strong> (Environmental: {risk.level}).</span>
              )}
            </span>
          </div>
          <span className="text-[11px] font-medium text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded">
            Local Formula Active
          </span>
        </div>
      )}

      {/* Risk Consistency Notice */}
      {risk.isConsistencyMismatch && risk.score !== null && risk.locallyCalculatedScore !== undefined && (
        <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5">
          <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-blue-950">Consistency Verification:</span>{' '}
            Hardware stream published {risk.score.toFixed(1)}, while formula computed {risk.locallyCalculatedScore.toFixed(1)}.
          </div>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Risk meter bar */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-slate-700">Preservation Risk Meter</span>
            <span className="font-mono text-[11px] text-slate-500">
              Safe: ≤ 30 | Moderate: &gt; 30 &amp; ≤ 60 | Danger: &gt; 60
            </span>
          </div>
          
          <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex border border-slate-200/80 relative">
            {/* Visual reference threshold markers */}
            <div className="absolute top-0 bottom-0 left-[30%] w-px bg-slate-300 z-10" title="Safe boundary (30)" />
            <div className="absolute top-0 bottom-0 left-[60%] w-px bg-slate-400 z-10" title="Moderate boundary (60)" />
            
            <div
              className={`h-full ${risk.score === null ? 'bg-amber-400/80' : statusConfig.barColor} transition-all duration-500 rounded-full`}
              style={{ width: `${clampedPercentage}%` }}
              role="progressbar"
              aria-valuenow={displayScore ?? 0}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>

        {/* Condition explanation summary */}
        <div className="md:col-span-1 text-xs text-slate-600 bg-white/80 p-3 rounded-lg border border-slate-200/60 leading-relaxed">
          <span className="font-semibold text-slate-800 block mb-0.5">Status Overview:</span>
          {condition.summary}
        </div>
      </div>
    </section>
  );
};

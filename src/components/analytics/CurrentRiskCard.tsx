import React from 'react';
import { ShieldCheck, AlertTriangle, AlertOctagon, Info, Cpu, Radio } from 'lucide-react';
import type { StorageConditionStatus, RiskAssessment } from '../../types';
import type { RiskBreakdown } from '../../utils/riskCalculator';
import { classifyStorageCondition } from '../../utils/riskCalculator';

interface CurrentRiskCardProps {
  score: number;
  conditionStatus: StorageConditionStatus;
  breakdown: RiskBreakdown;
  riskAssessment?: RiskAssessment | null;
}

export const CurrentRiskCard: React.FC<CurrentRiskCardProps> = ({
  score: localFormulaScore,
  conditionStatus,
  riskAssessment,
}) => {
  // Determine if V5 hardware telemetry is available and primary
  const isV5Operational = riskAssessment?.scoreSource === 'blynk_v5' && riskAssessment.score !== null;
  const isV5Unconfigured = riskAssessment?.v5Status === 'unconfigured';
  
  // The primary score to display: V5 hardware score if operational, otherwise local formula score
  const primaryScore = isV5Operational ? (riskAssessment.score as number) : localFormulaScore;

  // Determine classification based on exact firmware thresholds:
  // SAFE: <= 30, MODERATE: > 30 and <= 60, DANGER: > 60
  const isSafe = primaryScore <= 30;
  const isModerate = primaryScore > 30 && primaryScore <= 60;

  const scoreClassification: StorageConditionStatus = classifyStorageCondition(primaryScore);

  // Mismatch check: firmware Pin V3 vs primary score classification
  const isClassificationMismatch = conditionStatus !== scoreClassification;

  // Consistency check between V5 hardware and local formula calculation
  const hasFormulaV5Discrepancy =
    isV5Operational && Math.abs(primaryScore - localFormulaScore) > 2.0;

  // 1. Storage condition badge configuration
  const v3BadgeConfig = {
    SAFE: {
      theme: 'text-emerald-700 bg-emerald-50 border-emerald-200',
      icon: ShieldCheck,
    },
    MODERATE: {
      theme: 'text-amber-700 bg-amber-50 border-amber-200',
      icon: AlertTriangle,
    },
    'DANGER!': {
      theme: 'text-rose-700 bg-rose-50 border-rose-200',
      icon: AlertOctagon,
    },
    UNAVAILABLE: {
      theme: 'text-slate-700 bg-slate-50 border-slate-300',
      icon: Info,
    },
  }[conditionStatus] ?? {
    theme: 'text-slate-700 bg-slate-50 border-slate-200',
    icon: ShieldCheck,
  };

  const V3StatusIcon = v3BadgeConfig.icon;

  // 2. Score presentation configuration
  const scoreConfig = isSafe
    ? {
        label: 'SAFE',
        scoreColor: 'text-emerald-600',
        badgeBg: 'bg-emerald-600',
        pointerBorder: 'border-t-emerald-600',
        description:
          'Current storage environment is within optimal preservation limits (score ≤ 30). Spoilage risk is minimal.',
      }
    : isModerate
    ? {
        label: 'MODERATE',
        scoreColor: 'text-amber-600',
        badgeBg: 'bg-amber-600',
        pointerBorder: 'border-t-amber-600',
        description:
          'Environmental parameters indicate elevated spoilage risk (> 30 and ≤ 60). Active fan and vent response active.',
      }
    : {
        label: 'DANGER!',
        scoreColor: 'text-rose-600',
        badgeBg: 'bg-rose-600',
        pointerBorder: 'border-t-rose-600',
        description:
          'Critical storage thresholds exceeded (> 60). High spoilage hazard. Audible buzzer alarm and emergency vent triggered.',
      };

  const clampedPosition = Math.min(100, Math.max(0, primaryScore));

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Live Environmental Assessment
            </span>
            {isV5Operational ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                <Radio className="w-3 h-3 text-blue-600 animate-pulse" />
                Live Cloud Feed
              </span>
            ) : isV5Unconfigured ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                Local Risk Formula Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <Cpu className="w-3 h-3 text-slate-500" />
                Calculated Score
              </span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Current Spoilage Risk Score
          </h2>
        </div>

        {/* Condition Status Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-sm ${v3BadgeConfig.theme}`}
          >
            <V3StatusIcon className="w-4 h-4" />
            <span>Condition: {conditionStatus}</span>
          </div>
        </div>
      </div>

      {/* V5 Notice (Compact) */}
      {isV5Unconfigured && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-3 flex-wrap"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Cloud Risk Datastream is pending setup in the IoT console.{' '}
              Displaying local sensor formula calculation: <strong className="font-semibold">{localFormulaScore.toFixed(1)} / 100</strong> ({scoreClassification}).
            </span>
          </div>
          <span className="text-[11px] font-medium text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
            Local Formula Active
          </span>
        </div>
      )}

      {/* Consistency verification banner */}
      {hasFormulaV5Discrepancy && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 text-xs flex items-center gap-2.5"
        >
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <p className="text-blue-800">
            Hardware feed streams <strong className="font-mono">{primaryScore.toFixed(1)}</strong>, while local
            formula calculated <strong className="font-mono">{localFormulaScore.toFixed(1)}</strong> from live inputs.
            Live feed is prioritized.
          </p>
        </div>
      )}

      {/* Classification Discrepancy Warning if score disagrees with condition status */}
      {isClassificationMismatch && (
        <div
          role="alert"
          className="mt-4 p-3.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5"
        >
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div className="font-semibold text-amber-950">
              Condition &amp; Risk Classification Difference
            </div>
            <p className="text-amber-800 leading-relaxed">
              Storage condition status reports{' '}
              <strong className="font-semibold">{conditionStatus}</strong>, while current risk score indicates{' '}
              <strong className="font-semibold">{scoreClassification}</strong> ({primaryScore.toFixed(1)} / 100).
              Both independent metrics are preserved.
            </p>
          </div>
        </div>
      )}

      {/* Main Score & Visual Risk Scale */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center py-6">
        {/* Score Display (4 cols) */}
        <div className="lg:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left bg-slate-50/70 rounded-xl p-5 border border-slate-100">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {isV5Operational ? 'Live Risk Index' : 'Calculated Risk Index'}
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-5xl sm:text-6xl font-extrabold tracking-tight ${scoreConfig.scoreColor}`}>
              {primaryScore.toFixed(1)}
            </span>
            <span className="text-lg font-medium text-slate-400">/ 100</span>
          </div>
          <p className="text-xs text-slate-600 mt-3 leading-relaxed">
            {scoreConfig.description}
          </p>
          {isV5Operational && (
            <div className="mt-2.5 pt-2 border-t border-slate-200/60 w-full text-[11px] text-slate-500 flex items-center justify-between">
              <span>Local Formula Check:</span>
              <span className="font-mono font-medium text-slate-700">{localFormulaScore.toFixed(1)} / 100</span>
            </div>
          )}
        </div>

        {/* Visual Risk Scale (8 cols) */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-4">
          <div className="flex items-center justify-between text-xs font-medium text-slate-600">
            <span>Visual Risk Scale (0–100)</span>
            <span className="font-mono text-slate-500">Current: {primaryScore.toFixed(1)}</span>
          </div>

          {/* Continuous Multi-band Scale with Needle */}
          <div className="relative pt-6 pb-2">
            {/* Value Pointer Indicator */}
            <div
              className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-300"
              style={{ left: `${clampedPosition}%` }}
            >
              <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded shadow-xs text-white ${scoreConfig.badgeBg}`}>
                {primaryScore.toFixed(1)}
              </span>
              <div
                className={`w-0 h-0 border-x-4 border-x-transparent border-t-4 ${scoreConfig.pointerBorder}`}
              />
            </div>

            {/* Gradient / Discrete Threshold Track */}
            <div className="h-4 w-full rounded-full bg-slate-100 overflow-hidden flex border border-slate-200">
              {/* Safe Zone (0 - 30%) */}
              <div
                className="h-full bg-emerald-500/80 transition-all"
                style={{ width: '30%' }}
                title="Safe Zone (0 - 30)"
              />
              {/* Moderate Zone (30 - 60%) -> 30% width */}
              <div
                className="h-full bg-amber-500/85 transition-all"
                style={{ width: '30%' }}
                title="Moderate Zone (> 30 and <= 60)"
              />
              {/* Danger Zone (60 - 100%) -> 40% width */}
              <div
                className="h-full bg-rose-500/85 transition-all"
                style={{ width: '40%' }}
                title="Danger Zone (> 60)"
              />
            </div>

            {/* Scale Tick Labels */}
            <div className="relative w-full h-4 text-[11px] text-slate-400 font-mono mt-1.5">
              <span className="absolute left-0">0</span>
              <span className="absolute left-[30%] -translate-x-1/2 flex flex-col items-center">
                <span className="text-amber-700 font-semibold">30</span>
              </span>
              <span className="absolute left-[60%] -translate-x-1/2 flex flex-col items-center">
                <span className="text-rose-700 font-semibold">60</span>
              </span>
              <span className="absolute right-0">100</span>
            </div>
          </div>

          {/* Classification Tiers Legend with Exact Boundaries */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
            <div
              className={`p-2.5 rounded-lg border text-xs transition-colors ${
                isSafe
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-900 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>≤ 30: SAFE</span>
                {isSafe && <span className="text-[10px] font-bold text-emerald-700 uppercase">Active</span>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Normal storage conditions; low degradation risk.</p>
            </div>

            <div
              className={`p-2.5 rounded-lg border text-xs transition-colors ${
                isModerate
                  ? 'bg-amber-50/80 border-amber-300 text-amber-900 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>&gt; 30 and ≤ 60: MODERATE</span>
                {isModerate && <span className="text-[10px] font-bold text-amber-700 uppercase">Active</span>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Elevated environmental parameters; ventilation active.</p>
            </div>

            <div
              className={`p-2.5 rounded-lg border text-xs transition-colors ${
                primaryScore > 60
                  ? 'bg-rose-50/80 border-rose-300 text-rose-900 shadow-2xs'
                  : 'bg-slate-50/60 border-slate-200 text-slate-600'
              }`}
            >
              <div className="flex items-center justify-between font-semibold">
                <span>&gt; 60: DANGER!</span>
                {primaryScore > 60 && <span className="text-[10px] font-bold text-rose-700 uppercase">Active</span>}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Critical threshold exceeded; emergency alarm active.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

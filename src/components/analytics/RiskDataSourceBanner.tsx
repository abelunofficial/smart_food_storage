import React from 'react';
import { Database, Cpu, CheckCircle2, AlertTriangle, Radio } from 'lucide-react';
import type { RiskAssessment } from '../../types';

interface RiskDataSourceBannerProps {
  riskAssessment?: RiskAssessment | null;
}

export const RiskDataSourceBanner: React.FC<RiskDataSourceBannerProps> = ({
  riskAssessment,
}) => {
  const isV5Operational = riskAssessment?.scoreSource === 'blynk_v5';
  const isV5Unconfigured = riskAssessment?.v5Status === 'unconfigured';

  return (
    <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 sm:p-5 text-xs text-slate-600">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="p-1.5 rounded-md bg-blue-100 text-blue-700 shrink-0 mt-0.5">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="space-y-1">
            <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span>Telemetry &amp; Risk Calculation Data Sources</span>
              <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                ESP32 Alignment
              </span>
            </div>
            <p className="leading-relaxed text-slate-600">
              <strong>Risk Score Source:</strong>{' '}
              {isV5Operational ? (
                <>
                  Risk score is retrieved directly from firmware <span className="font-semibold text-slate-900">Virtual Pin V5</span> published every 2 seconds by the ESP32. Client-side formula is evaluated concurrently for consistency verification.
                </>
              ) : isV5Unconfigured ? (
                <>
                  Firmware publishes the score to <span className="font-semibold text-slate-900">Virtual Pin V5</span> every two seconds; however, the V5 datastream is unconfigured in the Blynk product template (<em>Temperature Display</em>). Client executes the physical microcontroller equation as a consistency check.
                </>
              ) : (
                <>
                  Risk score is <span className="font-semibold text-slate-900">calculated locally using the ESP32 firmware formula</span>.
                  Firmware publishes the score to Virtual Pin V5 every two seconds; however, in demo mode or when unverified, client executes the physical microcontroller equation.
                </>
              )}
            </p>
            <p className="leading-relaxed text-slate-600">
              <strong>Condition Status Source:</strong> Storage condition status is retrieved directly from firmware Virtual Pin <strong>V3</strong> (<code>SAFE</code>, <code>MODERATE</code>, or <code>DANGER!</code>).
            </p>
          </div>
        </div>

        {/* Pin Mapping Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-1.5 shrink-0 min-w-[210px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">V0, V1, V2:</span>
            <span className="font-semibold text-slate-800">Sensors</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 font-mono text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">V3:</span>
            <span className="font-semibold text-slate-800">Condition</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 font-mono text-[11px]">
            {isV5Operational ? (
              <>
                <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                <span className="text-slate-500">V5:</span>
                <span className="font-semibold text-blue-700">Hardware Live</span>
              </>
            ) : isV5Unconfigured ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-slate-500">V5:</span>
                <span className="font-semibold text-amber-700">Unconfigured</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500">V5:</span>
                <span className="font-semibold text-slate-600">Unverified</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-white border border-slate-200 font-mono text-[11px]">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-slate-500">Formula:</span>
            <span className="font-semibold text-blue-800">
              {isV5Operational ? 'Consistency Check' : 'Local Calc'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


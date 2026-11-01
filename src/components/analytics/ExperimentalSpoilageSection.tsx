import React, { useState } from 'react';
import {
  FlaskConical,
  Sparkles,
  Plus,
  Archive,
  Settings,
  Info,
  Calendar,
  Tag,
  AlertCircle,
  ChevronDown,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  AlertTriangle,
} from 'lucide-react';
import type { SensorReading } from '../../types/storage.ts';
import { FOOD_CATEGORY_LABELS } from '../../types/spoilage.ts';
import { useSpoilageMonitoring } from '../../hooks/useSpoilageMonitoring.ts';
import { getWarningStatusMetadata } from '../../utils/spoilageCalculator.ts';
import { GasHistoricalChart } from './GasHistoricalChart.tsx';
import { BatchRegistrationModal } from './BatchRegistrationModal.tsx';
import { BaselineCalibrationModal } from './BaselineCalibrationModal.tsx';

interface ExperimentalSpoilageSectionProps {
  reading: SensorReading;
}

export const ExperimentalSpoilageSection: React.FC<ExperimentalSpoilageSectionProps> = ({
  reading,
}) => {
  const {
    batches,
    activeBatch,
    assessment,
    history,
    selectBatch,
    createBatch,
    archiveBatch,
    loadDemoBatch,
    confirmCalibration,
    updateThresholds,
  } = useSpoilageMonitoring({ currentReading: reading });

  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isCalibrateModalOpen, setIsCalibrateModalOpen] = useState(false);
  const [showThresholdConfig, setShowThresholdConfig] = useState(false);
  const [warningInput, setWarningInput] = useState<number>(activeBatch?.warningThreshold ?? 15.0);
  const [significantInput, setSignificantInput] = useState<number>(
    activeBatch?.significantChangeThreshold ?? 30.0
  );
  const [thresholdError, setThresholdError] = useState<string | null>(null);

  const statusMeta = getWarningStatusMetadata(assessment.status);
  const hasCalibratedBaseline = Boolean(
    activeBatch && activeBatch.baselineStatus === 'calibrated' && activeBatch.baselineReading !== null
  );

  const handleSaveThresholds = () => {
    if (!activeBatch) return;
    setThresholdError(null);
    try {
      updateThresholds(activeBatch.id, warningInput, significantInput);
      setShowThresholdConfig(false);
    } catch (err) {
      setThresholdError(err instanceof Error ? err.message : 'Invalid threshold settings');
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs space-y-6">
      {/* 1. Section Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Experimental Food Spoilage Monitoring
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                MQ135 Gas Deviation
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                Unvalidated Research Tool
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Empirical tracking of chamber atmosphere alterations relative to a fresh-food baseline (D = (|G - B| / B) × 100)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center flex-wrap">
          <button
            type="button"
            onClick={() => setIsRegisterModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 text-blue-600" />
            <span>New Batch</span>
          </button>

          {batches.length === 0 && (
            <button
              type="button"
              onClick={loadDemoBatch}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold text-xs transition-colors shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Load Demo Batch [DEMO]</span>
            </button>
          )}

          {activeBatch && (
            <button
              type="button"
              onClick={() => setIsCalibrateModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{hasCalibratedBaseline ? 'Recalibrate Baseline' : 'Calibrate Fresh Baseline'}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Empty State when No Food Batches Exist */}
      {batches.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center mx-auto">
            <Package className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-sm font-bold text-slate-900">No Food Storage Batches Registered</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Baseline calibration and relative gas deviation monitoring require registering a food storage batch. Once a batch is registered, you can calibrate its fresh-food baseline to monitor atmospheric shifts.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsRegisterModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Food Batch</span>
            </button>
            <button
              type="button"
              onClick={loadDemoBatch}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors shadow-2xs"
            >
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Load Demonstration Batch [DEMO]</span>
            </button>
          </div>
          <p className="text-[11px] text-slate-400 italic">
            *Live sensor telemetry is never silently associated with fictitious batches. Demonstration data is strictly isolated.
          </p>
        </div>
      ) : (
        <>
          {/* Active Batch Bar & Selector */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Selected Food Batch:
                </span>
                {activeBatch ? (
                  <span className="font-bold text-sm text-slate-900">{activeBatch.name}</span>
                ) : (
                  <span className="text-xs text-slate-400 italic">No batch selected</span>
                )}
                {activeBatch?.isDemo && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                    [DEMO BATCH]
                  </span>
                )}
                {activeBatch?.monitoringStatus === 'archived' && (
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded bg-slate-200 text-slate-700">
                    Archived
                  </span>
                )}
              </div>

              {activeBatch && (
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Stored: {activeBatch.storageStartDate}</span>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1">
                    <Tag className="w-3 h-3 text-slate-400" />
                    <span>
                      {activeBatch.categories
                        .map((cat) => FOOD_CATEGORY_LABELS[cat] || cat)
                        .join(', ')}
                    </span>
                  </span>
                  {activeBatch.notes && (
                    <>
                      <span>•</span>
                      <span className="italic text-slate-400 truncate max-w-xs">{activeBatch.notes}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Batch Dropdown Selector */}
            <div className="flex items-center gap-2">
              <select
                value={activeBatch?.id ?? ''}
                onChange={(e) => selectBatch(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
              >
                {batches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.isDemo && !b.name.startsWith('[DEMO]') ? '[DEMO] ' : ''}{b.name} ({b.categories.join(', ')})
                  </option>
                ))}
              </select>

              {activeBatch && activeBatch.monitoringStatus === 'active' && (
                <button
                  type="button"
                  onClick={() => archiveBatch(activeBatch.id)}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                  title="Archive active batch"
                >
                  <Archive className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Demo Batch Notice Banner if Active Batch is Demo */}
          {activeBatch?.isDemo && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Demonstration Batch Active:</strong> This batch contains simulated demonstration parameters ([DEMO]) for interface evaluation. It is strictly isolated from physical batch records.
              </span>
            </div>
          )}

          {/* 3. Operational State & Deviation Alert Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${statusMeta.badgeClass}`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs uppercase tracking-wider">{statusMeta.label}</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">{statusMeta.summary}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <button
                type="button"
                onClick={() => setShowThresholdConfig(!showThresholdConfig)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 hover:bg-white text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Configure Thresholds</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${showThresholdConfig ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* 4. Threshold Configuration Sub-panel */}
          {showThresholdConfig && activeBatch && (
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">
                  Provisional Demonstration Thresholds for {activeBatch.name}
                </span>
                <span className="text-[10px] text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Unvalidated Empirical Settings
                </span>
              </div>

              <div className="p-2.5 rounded-lg bg-white border border-slate-200 text-[11px] text-slate-600 leading-relaxed">
                <strong>Provisional Demonstration Disclaimer:</strong> Warning (15%) and Significant Change (30%) are provisional demonstration defaults, not scientifically validated food spoilage thresholds. They have not been established through controlled laboratory experiments, do not represent food-specific spoilage limits, and do not prove freshness or food safety.
              </div>

              {thresholdError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{thresholdError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    Warning Threshold (W %)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="1"
                      max="100"
                      value={warningInput}
                      onChange={(e) => setWarningInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                    <span className="absolute right-3 top-1.5 text-slate-400 font-mono">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Triggers &quot;Change Detected&quot; warning when deviation D ≥ W%.
                  </span>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">
                    Significant Change Threshold (S %)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="2"
                      max="200"
                      value={significantInput}
                      onChange={(e) => setSignificantInput(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                    />
                    <span className="absolute right-3 top-1.5 text-slate-400 font-mono">%</span>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Triggers &quot;Significant Change&quot; state when deviation D ≥ S%.
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowThresholdConfig(false)}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-100 transition-colors text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveThresholds}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors text-xs shadow-2xs"
                >
                  Save Thresholds
                </button>
              </div>
            </div>
          )}

          {/* 5. Four-Card Telemetry Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Current Gas (G) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Current Gas (V2)
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">
                {assessment.currentRawGas ?? '--'}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>Raw 12-bit ADC</span>
                <span className="font-mono">0–4095 counts</span>
              </div>
            </div>

            {/* Card 2: Fresh Baseline (B) */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Fresh-Food Baseline (B)
              </span>
              <div className="text-2xl font-bold font-mono text-emerald-700 mt-1">
                {assessment.baseline !== null ? `${assessment.baseline}` : 'Uncalibrated'}
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                <span>{hasCalibratedBaseline ? 'Calibrated Reference' : 'Calibration Pending'}</span>
                {activeBatch?.baselineCalibrationTimestamp && (
                  <span className="font-mono text-[10px]">
                    {new Date(activeBatch.baselineCalibrationTimestamp).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>

            {/* Card 3: Signed Difference (G - B) & Direction */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Gas Shift &amp; Direction
                </span>
                {assessment.direction === 'increased' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                    <TrendingUp className="w-3 h-3" />
                    <span>Increased</span>
                  </span>
                )}
                {assessment.direction === 'decreased' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                    <TrendingDown className="w-3 h-3" />
                    <span>Decreased</span>
                  </span>
                )}
                {assessment.direction === 'unchanged' && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                    <Minus className="w-3 h-3" />
                    <span>Unchanged</span>
                  </span>
                )}
              </div>

              <div className="text-2xl font-bold font-mono text-slate-900 mt-1 flex items-baseline gap-1.5">
                <span>
                  {assessment.signedDifference !== null
                    ? `${assessment.signedDifference > 0 ? '+' : ''}${assessment.signedDifference}`
                    : '--'}
                </span>
                <span className="text-xs font-normal text-slate-500 font-sans">counts</span>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                <span>|G - B| = {assessment.absoluteDifference !== null ? assessment.absoluteDifference : '--'}</span>
                <span className="italic text-slate-400">*Not proof of spoilage</span>
              </div>
            </div>

            {/* Card 4: Relative Gas Deviation (D) */}
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200">
              <span className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider block">
                Relative Gas Deviation (D)
              </span>
              <div className="text-2xl font-bold font-mono text-purple-950 mt-1">
                {assessment.relativeDeviationPercent !== null
                  ? `${assessment.relativeDeviationPercent}%`
                  : 'Not Calibrated'}
              </div>
              <div className="flex items-center justify-between text-[11px] text-purple-700 mt-1">
                <span>D = (|G - B| / B) × 100</span>
                <span className="font-mono font-semibold">{statusMeta.label}</span>
              </div>
            </div>
          </div>

          {/* 6. Historical Gas Trend vs Baseline Chart */}
          <GasHistoricalChart
            data={history}
            baseline={assessment.baseline}
            warningThresholdPercent={activeBatch?.warningThreshold ?? 15}
          />
        </>
      )}

      {/* 7. Strict Technical Honesty & Sensor Boundaries Notice */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <Info className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Technical Transparency &amp; Scientific Limitations of MQ135</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] leading-relaxed pt-1">
          <div>
            <strong className="text-slate-800">Winsen MQ135 Manufacturer Preheat Specification:</strong>{' '}
            The Winsen MQ135 manufacturer manual specifies an initial preheating / burn-in period exceeding 48 hours under standard test conditions before electrical characteristics stabilize. A 2–5 minute warm-up period only establishes heater coil thermal equilibrium after brief power interruptions and is physically insufficient for initial chemical conditioning. Because the ESP32 firmware publishes no sensor uptime or heater run-time telemetry, transducer conditioning history is classified as <em>Unknown (Unverified)</em>.
          </div>
          <div>
            <strong className="text-slate-800">Cross-Sensitivity &amp; Independent from V5 Risk Score:</strong>{' '}
            The MQ135 is an uncalibrated tin-dioxide (SnO₂) analog transducer sensitive to various volatile compounds (NH₃, ethanol, sulfides, smoke). It cannot isolate individual food VOCs. Neither an increase nor a decrease independently proves spoilage. This experimental feature does NOT alter or substitute the firmware Virtual Pin V5 mathematical risk score.
          </div>
        </div>
      </div>

      {/* Modals */}
      <BatchRegistrationModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        onSubmit={createBatch}
      />

      {activeBatch && (
        <BaselineCalibrationModal
          isOpen={isCalibrateModalOpen}
          onClose={() => setIsCalibrateModalOpen(false)}
          batch={activeBatch}
          currentReading={reading}
          onConfirmBaseline={confirmCalibration}
        />
      )}
    </div>
  );
};

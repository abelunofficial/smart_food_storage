import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Info,
} from 'lucide-react';
import type { FoodBatch } from '../../types/spoilage.ts';
import type { SensorReading } from '../../types/storage.ts';
import { calculateMedian, checkSampleStability } from '../../utils/spoilageCalculator.ts';

interface BaselineCalibrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  batch: FoodBatch;
  currentReading: SensorReading | null;
  onConfirmBaseline: (batchId: string, baseline: number, sampleCount: number) => void;
}

export const BaselineCalibrationModal: React.FC<BaselineCalibrationModalProps> = ({
  isOpen,
  onClose,
  batch,
  currentReading,
  onConfirmBaseline,
}) => {
  const [sampleRecords, setSampleRecords] = useState<{ adc: number; timestamp: string }[]>([]);
  const [requiredSamples, setRequiredSamples] = useState<number>(5);
  const [toleranceADC, setToleranceADC] = useState<number>(50);
  const [isCollecting, setIsCollecting] = useState<boolean>(true);
  const [confirmOverwrite, setConfirmOverwrite] = useState<boolean>(false);
  const lastSampledTimestampRef = React.useRef<string | null>(null);
  const lastSampleCaptureTimeRef = React.useRef<number>(0);
  const MIN_SAMPLE_INTERVAL_MS = 2000;

  const samples = sampleRecords.map((r) => r.adc);

  // Automated sample collection: captures readings across eligible sampling intervals (>= 2000 ms).
  // Note: currentReading.timestamp is a browser fetch timestamp, not an ESP32 hardware timestamp.
  // Blynk's scalar /get endpoint delivers the latest value without hardware timestamps or sequence
  // counters. The 2,000 ms interval aligns with the ESP32 timer, though it cannot independently
  // prove edge hardware generated a new observation between polls. Identical ADC counts are accepted
  // across separate eligible intervals.
  useEffect(() => {
    if (!isOpen || !isCollecting) return;
    if (!currentReading) return;
    if (currentReading.isStale) return; // Strict: Stale/cached telemetry is rejected from calibration
    if (
      !Number.isFinite(currentReading.mq135Raw) ||
      currentReading.mq135Raw < 0 ||
      currentReading.mq135Raw > 4095
    ) {
      return;
    }

    // Protection against repeated processing of the exact same frontend React reading reference
    if (currentReading.timestamp && currentReading.timestamp === lastSampledTimestampRef.current) {
      return;
    }

    // Enforce minimum 2,000 ms interval between automated sample captures
    const now = Date.now();
    if (lastSampleCaptureTimeRef.current > 0 && now - lastSampleCaptureTimeRef.current < MIN_SAMPLE_INTERVAL_MS) {
      return;
    }

    lastSampledTimestampRef.current = currentReading.timestamp;
    lastSampleCaptureTimeRef.current = now;

    setSampleRecords((prev) => {
      if (prev.length >= requiredSamples) {
        setIsCollecting(false);
        return prev;
      }

      // Check if this exact observation timestamp is already present
      if (currentReading.timestamp && prev.some((r) => r.timestamp === currentReading.timestamp)) {
        return prev;
      }

      // Eligible sampling interval: identical ADC counts are explicitly accepted!
      const next = [
        ...prev,
        {
          adc: currentReading.mq135Raw,
          timestamp: currentReading.timestamp || new Date().toISOString(),
        },
      ];

      if (next.length >= requiredSamples) {
        setIsCollecting(false);
      }
      return next;
    });
  }, [
    isOpen,
    isCollecting,
    currentReading,
    requiredSamples,
  ]);

  if (!isOpen) return null;

  const currentGas = currentReading?.mq135Raw ?? null;
  const isStale = currentReading?.isStale ?? false;
  const medianBaseline = calculateMedian(samples);
  const { isStable, spread } = checkSampleStability(samples, toleranceADC);
  const isComplete = samples.length >= requiredSamples;

  const handleManualAddSample = () => {
    if (
      currentGas !== null &&
      !isStale &&
      currentGas >= 0 &&
      currentGas <= 4095 &&
      currentReading
    ) {
      setSampleRecords((prev) => {
        if (prev.length >= requiredSamples) return prev;
        if (currentReading.timestamp && prev.some((r) => r.timestamp === currentReading.timestamp)) {
          return prev; // Already recorded this observation
        }
        lastSampledTimestampRef.current = currentReading.timestamp;
        const next = [
          ...prev,
          {
            adc: currentGas,
            timestamp: currentReading.timestamp || new Date().toISOString(),
          },
        ];
        if (next.length >= requiredSamples) setIsCollecting(false);
        return next;
      });
    }
  };

  const handleReset = () => {
    setSampleRecords([]);
    lastSampledTimestampRef.current = null;
    lastSampleCaptureTimeRef.current = 0;
    setIsCollecting(true);
  };

  const handleSave = () => {
    if (!medianBaseline || !isStable || samples.length < 2) return;

    if (batch.baselineReading !== null && !confirmOverwrite) {
      setConfirmOverwrite(true);
      return;
    }

    onConfirmBaseline(batch.id, medianBaseline, samples.length);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Fresh-Food Baseline Calibration
              </h3>
              <p className="text-xs text-slate-500">
                Calibrating baseline for: <strong className="text-slate-800">{batch.name}</strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* MQ135 Transducer Conditioning & Warm-Up Prerequisite */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center justify-between font-bold text-xs">
              <span className="flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                MQ135 Conditioning &amp; Warm-Up Standards (Winsen Manual)
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300">
                Conditioning History: Unknown
              </span>
            </div>
            <div className="text-[11px] text-amber-900/90 leading-relaxed space-y-1">
              <div>• <strong>Initial Conditioning / Burn-In:</strong> Winsen manufacturer specifications require ≥48 hours of continuous preheating under standard conditions for new or unpowered sensors to achieve chemical lattice equilibrium.</div>
              <div>• <strong>Power Interruption Recovery:</strong> If the sensor was already preheated for ≥48 hours, brief power loss requires 2–5 minutes of heater recovery before readings re-stabilize. 2–5 minutes is NOT sufficient initial conditioning.</div>
              <div>• <strong>Current Reading Stability:</strong> Checked live via sample spread (max - min ≤ {toleranceADC} ADC). Stability indicates short-term thermal equilibrium, not full chemical calibration.</div>
              <div>• <strong>Calibration Eligibility:</strong> Baseline calibration is only meaningful if the sensor has completed the required 48-hour burn-in. Because the ESP32 firmware does not publish uptime or heater run-time history, physical conditioning history is displayed as <em>Unknown (Unverified)</em>.</div>
            </div>
          </div>

          {/* Prerequisite Notice */}
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-blue-950">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Chamber Loading Protocol</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Execute baseline calibration immediately after loading fresh food into the chamber and sealing the doors. The system monitors relative deviations from this initial representative reading.
            </p>
          </div>

          {/* Telemetry Timing & Ingestion Limitation Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Telemetry Timing &amp; Ingestion Limitation Notice</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Blynk&apos;s scalar datastream endpoint returns the latest reported value without hardware measurement timestamps. Timestamps displayed here reflect client fetch arrival times. The calibration sequence enforces a minimum 2,000 ms interval between automated samples (matching the ESP32 timer cycle), though this interval cannot guarantee that edge hardware updated between polls. Identical ADC counts are accepted across separate eligible intervals.
            </p>
          </div>

          {/* Previous baseline warning if recalibrating */}
          {batch.baselineReading !== null && (
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Existing Baseline: {batch.baselineReading} ADC</span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Calibrated on {new Date(batch.baselineCalibrationTimestamp!).toLocaleDateString()}. Recalibrating will archive this record in history and set a new baseline reference.
                </p>
              </div>
            </div>
          )}

          {/* Current Live Reading Status */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Instantaneous Gas Sensor (V2)
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xl font-bold font-mono text-slate-900">
                  {currentGas ?? '--'}
                </span>
                <span className="text-xs text-slate-500">Raw ADC Counts</span>
              </div>
            </div>

            <div className="text-right">
              {isStale ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  Stale Telemetry
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Fresh Stream
                </span>
              )}
            </div>
          </div>

          {/* Sample Collection Sequence Progress */}
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isCollecting ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span className="font-bold text-slate-900">
                  {isComplete
                    ? 'Sampling Sequence Completed'
                    : `Sampling Progress: ${samples.length} of ${requiredSamples}`}
                </span>
              </div>

              <button
                type="button"
                onClick={handleReset}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restart</span>
              </button>
            </div>

            {/* Samples Pill Row with Timestamps */}
            <div className="flex items-center gap-2 flex-wrap min-h-8">
              {sampleRecords.map((rec, idx) => (
                <div
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 flex items-center gap-1.5"
                  title={`Observation: ${rec.adc} ADC at ${rec.timestamp}`}
                >
                  <span className="font-bold text-slate-500">#{idx + 1}:</span>
                  <span className="font-semibold text-emerald-700">{rec.adc}</span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    ({new Date(rec.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })})
                  </span>
                </div>
              ))}
              {samples.length < requiredSamples && isCollecting && (
                <span className="text-[11px] text-slate-400 italic">
                  Awaiting next sampling interval ({samples.length + 1} of {requiredSamples})...
                </span>
              )}
            </div>

            {/* Manual Sample Add Button for fallback */}
            {samples.length < requiredSamples && (
              <button
                type="button"
                disabled={isStale || currentGas === null}
                onClick={handleManualAddSample}
                className="w-full py-1.5 px-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors disabled:opacity-50"
              >
                Capture Current Reading Now ({currentGas ?? '--'})
              </button>
            )}

            {/* Stability & Median Indicator */}
            {samples.length >= 2 && (
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Calculated Median Baseline (B)
                  </span>
                  <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                    {medianBaseline ?? '--'} ADC
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Reading Spread vs. Stability Window
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-bold font-mono text-slate-900">
                      ±{spread} ADC
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        isStable
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {isStable ? 'Stable' : 'High Variance'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Configurable Stability Window & Sample Count */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
            <span className="font-semibold text-slate-700 block text-xs">
              Calibration Parameters (Operator Configurable)
            </span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">
                  Required Samples (Sequence Size)
                </label>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={requiredSamples}
                  onChange={(e) => setRequiredSamples(Math.max(3, Number(e.target.value)))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">
                  Stability Tolerance (Max Spread)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="10"
                    max="300"
                    value={toleranceADC}
                    onChange={(e) => setToleranceADC(Math.max(10, Number(e.target.value)))}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono text-xs"
                  />
                  <span className="absolute right-2.5 top-1.5 text-slate-400 font-mono text-[10px]">
                    ADC
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              MQ135 sensors require sufficient thermal warm-up. If the sensor has recently powered on, variance will remain high until heater stabilization.
            </p>
          </div>

          {/* Confirmation Prompt if Overwriting */}
          {confirmOverwrite && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Confirm Overwriting Existing Baseline</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                This batch already has a baseline of {batch.baselineReading} ADC. Are you sure you want to replace it with the new baseline of <strong>{medianBaseline} ADC</strong>?
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={!medianBaseline || !isStable || samples.length < 2 || isStale}
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {confirmOverwrite
                ? `Confirm New Baseline (${medianBaseline} ADC)`
                : `Save Baseline (${medianBaseline ?? '--'} ADC)`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

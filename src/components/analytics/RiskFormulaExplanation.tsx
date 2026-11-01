import React from 'react';
import { Calculator, AlertCircle, Thermometer, Droplets, Activity } from 'lucide-react';

export const RiskFormulaExplanation: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200/60">
          <Calculator className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            ESP32 Firmware Risk Formula
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Mathematical model executed on the physical microcontroller firmware
          </p>
        </div>
      </div>

      {/* Exact Formula Display */}
      <div className="my-5 p-4 rounded-lg bg-slate-900 text-slate-100 font-mono text-xs sm:text-sm overflow-x-auto shadow-inner">
        <div className="text-slate-400 text-[11px] mb-1 font-sans font-medium uppercase tracking-wider">
          Microcontroller Algorithm (V0–V2 Inputs clamped to 0–100)
        </div>
        <div className="py-1 text-emerald-400 font-semibold whitespace-pre">
          {'risk = (temperature / 40) * 40\n     + (humidity / 100) * 30\n     + (gasRaw / 4095) * 30'}
        </div>
      </div>

      {/* Component Contributions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
        {/* Temperature Contribution */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-sky-700 mb-2">
            <Thermometer className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-tight">Temperature Component</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            Max 40 <span className="text-xs font-normal text-slate-500">points</span>
          </div>
          <div className="text-xs font-mono text-slate-600 mt-1 bg-white px-2 py-1 rounded border border-slate-200 inline-block">
            (temperature / 40) × 40
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Directly scales with temperature in degrees Celsius (°C) from DHT22 (Pin V0), normalized against a 40°C threshold.
          </p>
        </div>

        {/* Humidity Contribution */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-blue-700 mb-2">
            <Droplets className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-tight">Humidity Component</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            Max 30 <span className="text-xs font-normal text-slate-500">points</span>
          </div>
          <div className="text-xs font-mono text-slate-600 mt-1 bg-white px-2 py-1 rounded border border-slate-200 inline-block">
            (humidity / 100) × 30
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Scales linearly with relative humidity percentage (% RH) from DHT22 (Pin V1), contributing up to 30 points at 100% RH.
          </p>
        </div>

        {/* Gas Sensor Contribution */}
        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 text-purple-700 mb-2">
            <Activity className="w-4 h-4" />
            <span className="font-semibold text-xs tracking-tight">Gas Sensor Component</span>
          </div>
          <div className="text-lg font-bold text-slate-900">
            Max 30 <span className="text-xs font-normal text-slate-500">points</span>
          </div>
          <div className="text-xs font-mono text-slate-600 mt-1 bg-white px-2 py-1 rounded border border-slate-200 inline-block">
            (gasRaw / 4095) × 30
          </div>
          <p className="text-xs text-slate-600 mt-2 leading-relaxed">
            Scales with uncalibrated raw analog 12-bit ADC voltage readings (0–4095) from the MQ135 sensor (Pin V2).
          </p>
        </div>
      </div>

      {/* Mandatory Engineering & Scientific Disclaimer */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg bg-amber-50/80 border border-amber-200/90 text-amber-900 text-xs">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold">Mathematical Weighting Disclaimer:</strong>{' '}
          The coefficients (40 points for temperature, 30 points for humidity, 30 points for gas analog reading) are heuristic mathematical weights defined in the ESP32 hardware firmware. They provide an operational index for monitoring storage conditions and are <strong>not</strong> scientifically validated food-safety probabilities or microbiological pathogen models.
        </div>
      </div>
    </div>
  );
};


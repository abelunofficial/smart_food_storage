import React from 'react';
import { Info, Cpu, Gauge } from 'lucide-react';

export const SensorInfoPanel: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-slate-100">
        <Info className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-bold text-slate-900 tracking-tight">
          Hardware Sensor Specifications & Measurement Notes
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
        {/* DHT22 Module */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Gauge className="w-4 h-4 text-sky-600 shrink-0" />
            <span>DHT22 Digital Sensor (Pins V0 & V1)</span>
          </div>
          <p className="text-slate-600">
            Measures ambient chamber temperature (°C) and relative humidity (% RH) using a capacitive humidity sensing element and thermistor with calibrated digital signal output.
          </p>
          <div className="text-[11px] text-slate-500 font-mono pt-1">
            Ranges: -40°C to 80°C (±0.5°C) | 0–100% RH (±2–5% RH)
          </div>
        </div>

        {/* MQ135 Module */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/70 space-y-1.5">
          <div className="flex items-center gap-2 font-semibold text-slate-800">
            <Cpu className="w-4 h-4 text-purple-600 shrink-0" />
            <span>MQ135 Gas Sensor (Pin V2)</span>
          </div>
          <p className="text-slate-600">
            Provides an uncalibrated raw analog reading (0–4095 ADC) connected to the ESP32 ADC pin. The sensor is sensitive to broad airborne gases (e.g. NH3, alcohol, smoke), but is <strong className="font-semibold text-slate-700">not calibrated to a physical volumetric concentration unit</strong> in the current firmware.
          </p>
          <div className="text-[11px] text-slate-500 font-mono pt-1">
            Range: 0–4095 ADC Raw Count (Uncalibrated Analog Voltage)
          </div>
        </div>
      </div>

      <div className="mt-3.5 pt-2.5 border-t border-slate-100 text-[11px] text-slate-500">
        * Note: Raw analog telemetry reflects environmental resistance changes and does not constitute a certified volumetric gas concentration or guaranteed food safety determination.
      </div>
    </div>
  );
};

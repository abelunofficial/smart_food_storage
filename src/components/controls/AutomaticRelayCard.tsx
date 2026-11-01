import React from 'react';
import { ToggleLeft, Cpu, Info, CheckCircle2 } from 'lucide-react';
import type { EquipmentCommandState } from '../../types';

interface AutomaticRelayCardProps {
  equipmentState: EquipmentCommandState;
}

export const AutomaticRelayCard: React.FC<AutomaticRelayCardProps> = ({ equipmentState }) => {
  const isRelayOn = equipmentState.automaticRelay === 'on';

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                isRelayOn
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <ToggleLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Automatic Ventilation Relay
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  GPIO Pin 14
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Firmware-switched automatic chamber ventilation &amp; air circulation relay
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 self-start sm:self-center">
            <Cpu className="w-3.5 h-3.5 text-blue-600" />
            Strictly Automatic
          </span>
        </div>

        {/* Operational Status Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          {/* Commanded State Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Firmware Commanded State
              </span>
              <div className="flex items-center gap-2.5 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    isRelayOn
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200/90 text-slate-700 border border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isRelayOn ? 'bg-emerald-600' : 'bg-slate-500'}`}
                  />
                  {equipmentState.automaticRelay.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500">
                  {isRelayOn ? 'Relay Energized (HIGH)' : 'Relay De-energized (LOW)'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Relay polarity is Active-HIGH (<code>#define RELAY_ON HIGH</code>). Commanded strictly by ESP32 firmware logic based on evaluated risk.
            </p>
          </div>

          {/* Physical Confirmation Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Physical Feedback Status
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-200/70 border border-slate-300/80">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Unavailable
                </span>
                <span className="text-xs text-slate-500">Open loop circuit</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Relay contact state feedback is unavailable in firmware. Displayed state reflects firmware GPIO signal level, not physical contact confirmation.
            </p>
          </div>
        </div>

        {/* Firmware Logic Matrix */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Autonomous Logic Matrix (Every ~2 Seconds)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] pt-1">
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="font-semibold text-emerald-800 block">SAFE (Risk ≤ 30):</span>
              <span className="text-slate-600">Relay OFF (LOW) — Standby</span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="font-semibold text-amber-800 block">MODERATE (30 &lt; Risk ≤ 60):</span>
              <span className="text-slate-600">Relay ON (HIGH) — Ventilation</span>
            </div>
            <div className="p-2.5 rounded bg-white border border-slate-200">
              <span className="font-semibold text-rose-800 block">DANGER (Risk &gt; 60):</span>
              <span className="text-slate-600">Relay ON (HIGH) — Max Ventilation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Independent from manual fan relay (GPIO 2)</span>
        </div>
        <span className="font-mono">GPIO 14</span>
      </div>
    </div>
  );
};


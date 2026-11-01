import React from 'react';
import { Volume2, ShieldAlert, BellRing } from 'lucide-react';
import type { EquipmentCommandState } from '../../types';

interface BuzzerControlCardProps {
  equipmentState: EquipmentCommandState;
}

export const BuzzerControlCard: React.FC<BuzzerControlCardProps> = ({ equipmentState }) => {
  const isBuzzerActive = equipmentState.buzzer === 'active';

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${isBuzzerActive ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' : 'bg-purple-50 text-purple-700 border-purple-200'}`}>
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Audible Alarm Buzzer
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                  GPIO Pin 25
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Chamber acoustic warning transducer for on-site personnel
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-center">
            <BellRing className="w-3.5 h-3.5" />
            Automatic Logic
          </span>
        </div>

        {/* Operational Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          {/* Commanded State Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Commanded State
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${
                  isBuzzerActive
                    ? 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse'
                    : 'bg-slate-200/90 text-slate-700 border-slate-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${isBuzzerActive ? 'bg-rose-600' : 'bg-slate-500'}`} />
                {equipmentState.buzzer.toUpperCase()}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {isBuzzerActive ? '300ms Pulsing Tone' : 'Silent (Standby)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Activated automatically by firmware only during DANGER condition (risk &gt; 60). Silent in SAFE and MODERATE.
            </p>
          </div>

          {/* Physical Feedback Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Physical Feedback Status
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-slate-600 bg-slate-200/70 border border-slate-300/80">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                Unavailable
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Piezoelectric transducer driven by open-loop GPIO without acoustic microphone feedback.
            </p>
          </div>
        </div>

        {/* Trigger Criteria Note */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
            <span>Autonomous Local Alarm Logic</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            When risk exceeds 60, the firmware executes a non-blocking 300 ms toggling loop (<code>millis() - lastBuzzerToggle &gt;= 300</code>) to generate an audible alert. In addition, the firmware logs a cloud event (<code>Blynk.logEvent(&quot;alert&quot;)</code>).
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Hardware Interface: ESP32 Pin 25 (Digital GPIO)</span>
        <span className="font-mono">Autonomous Local Alarm</span>
      </div>
    </div>
  );
};

import React from 'react';
import { ToggleLeft, Fan, Wind, Volume2, Info, Sliders } from 'lucide-react';
import type { EquipmentCommandState } from '../../types';

interface EquipmentSummaryCardProps {
  fanState: EquipmentCommandState;
}

export const EquipmentSummaryCard: React.FC<EquipmentSummaryCardProps> = ({ fanState }) => {
  const isAutoRelayOn = fanState.automaticRelay === 'on';
  const isManualFanOn = (fanState.manualFanCommand || fanState.requestedCommand || 'off') === 'on';
  const isBuzzerActive = fanState.buzzer === 'active';

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/70">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Equipment Summary
              </h3>
              <p className="text-xs text-slate-500">
                Automated ventilation, manual operator fan, servo, and alarm
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            4 Actuators
          </span>
        </div>

        {/* Equipment Items Grid */}
        <div className="space-y-2.5">
          {/* 1. Automatic Relay (GPIO 14) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <ToggleLeft className={`w-4 h-4 ${isAutoRelayOn ? 'text-emerald-600' : 'text-slate-500'}`} />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Automatic Relay (Pin 14)
                </span>
                <span className="text-[11px] text-slate-500">Firmware Auto Ventilation</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  isAutoRelayOn
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200/80 text-slate-700 border border-slate-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isAutoRelayOn ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                {fanState.automaticRelay?.toUpperCase() || (isAutoRelayOn ? 'ON' : 'OFF')}
              </span>
            </div>
          </div>

          {/* 2. Manual Fan Relay (GPIO 2, V4) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <Fan className={`w-4 h-4 ${isManualFanOn ? 'animate-spin text-blue-600' : 'text-slate-500'}`} style={{ animationDuration: '3s' }} />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Manual Fan Relay (Pin 2, V4)
                </span>
                <span className="text-[11px] text-slate-500">Operator Controlled Switch</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  isManualFanOn
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-slate-200/80 text-slate-700 border border-slate-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isManualFanOn ? 'bg-emerald-600' : 'bg-slate-500'}`} />
                {isManualFanOn ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          {/* 3. Vent Servo (GPIO 27) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <Wind className="w-4 h-4 text-sky-600" />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Intake Vent Servo (Pin 27)
                </span>
                <span className="text-[11px] text-slate-500">PWM Damper Aperture</span>
              </div>
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
                {fanState.servoPosition} Angle
              </span>
            </div>
          </div>

          {/* 4. Alarm Buzzer (GPIO 25) */}
          <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600">
                <Volume2 className={`w-4 h-4 ${isBuzzerActive ? 'text-rose-600 animate-pulse' : 'text-slate-500'}`} />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-900 block">
                  Alarm Buzzer (Pin 25)
                </span>
                <span className="text-[11px] text-slate-500">300ms Pulsing Warning Tone</span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                  isBuzzerActive
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                    : 'bg-slate-200/80 text-slate-700 border border-slate-300'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isBuzzerActive ? 'bg-rose-600' : 'bg-slate-500'}`} />
                {fanState.buzzer.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Disclaimed physical feedback note */}
      <div className="mt-4 p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-slate-600 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <strong>Operating Notice:</strong> Actuators operate in open loop. Physical confirmation is unavailable in firmware. Commanded states reflect firmware &amp; cloud signals.
        </p>
      </div>
    </div>
  );
};

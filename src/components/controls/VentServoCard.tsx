import React from 'react';
import { Wind, Cpu, Info } from 'lucide-react';
import type { EquipmentCommandState } from '../../types';

interface VentServoCardProps {
  equipmentState: EquipmentCommandState;
}

export const VentServoCard: React.FC<VentServoCardProps> = ({ equipmentState }) => {
  const servoAngle = equipmentState.servoPosition;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Intake Ventilation Servo
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">
                  GPIO Pin 27 (PWM)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Servo-actuated air damper regulating chamber air intake aperture
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 self-start sm:self-center">
            <Cpu className="w-3.5 h-3.5" />
            Automatic Logic
          </span>
        </div>

        {/* Operational Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          {/* Commanded Angle Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Commanded Angle
            </span>
            <div className="flex items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-300">
                {servoAngle} Aperture
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {servoAngle === '0°' ? 'Closed' : servoAngle === '60°' ? '60° Intake' : '90° Max Vent'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Positioned automatically by firmware: 0° in SAFE, 60° in MODERATE, 90° in DANGER.
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
              Standard 3-wire hobby servo operating in open-loop PWM mode without an angle encoder or feedback line.
            </p>
          </div>
        </div>

        {/* Technical Explanation Note */}
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-xs text-slate-600 space-y-2">
          <div className="flex items-center gap-1.5 font-semibold text-slate-800">
            <Info className="w-4 h-4 text-sky-600 shrink-0" />
            <span>Strictly Automatic Operation</span>
          </div>
          <p className="leading-relaxed text-slate-600">
            The ESP32 firmware dynamically positions the intake vent based on calculated food spoilage risk. Manual positioning inputs are omitted in firmware to prevent thermal regulation loss.
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <span>Hardware Interface: ESP32 Pin 27 (ESP32Servo PWM)</span>
        <span className="font-mono">Open-Loop Actuator</span>
      </div>
    </div>
  );
};

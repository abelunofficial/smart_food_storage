import React from 'react';
import { Sliders, ToggleLeft, Fan, Wind, Volume2, Monitor } from 'lucide-react';
import type { EquipmentCommandState } from '../../types';

interface EquipmentSummaryTableProps {
  equipmentState: EquipmentCommandState;
}

export const EquipmentSummaryTable: React.FC<EquipmentSummaryTableProps> = ({ equipmentState }) => {
  const isAutoRelayOn = equipmentState.automaticRelay === 'on';
  const isManualFanOn = (equipmentState.manualFanCommand || equipmentState.requestedCommand || 'off') === 'on';
  const isBuzzerActive = equipmentState.buzzer === 'active';

  const equipmentRows = [
    {
      name: 'Automatic Ventilation Relay',
      pin: 'GPIO 14',
      icon: ToggleLeft,
      type: 'Active-HIGH Relay',
      operationMode: 'Strictly Automatic (Firmware)',
      commandState: isAutoRelayOn ? 'ON (HIGH)' : 'OFF (LOW)',
      commandBadge: isAutoRelayOn ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-700 border-slate-300',
      physicalFeedback: 'Unavailable',
    },
    {
      name: 'Manual Fan Relay',
      pin: 'GPIO 2 (V4)',
      icon: Fan,
      type: 'Active-HIGH Relay',
      operationMode: 'Operator Manual (Blynk V4)',
      commandState: isManualFanOn ? 'ON (HIGH)' : 'OFF (LOW)',
      commandBadge: isManualFanOn ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-slate-200 text-slate-700 border-slate-300',
      physicalFeedback: 'Unavailable',
    },
    {
      name: 'Intake Vent Servo',
      pin: 'GPIO 27',
      icon: Wind,
      type: 'PWM Position Servo',
      operationMode: 'Strictly Automatic (Firmware)',
      commandState: `${equipmentState.servoPosition} Angle`,
      commandBadge: 'bg-sky-100 text-sky-800 border-sky-300',
      physicalFeedback: 'Unavailable',
    },
    {
      name: 'Audible Alarm Buzzer',
      pin: 'GPIO 25',
      icon: Volume2,
      type: 'Piezo Buzzer (300ms tone)',
      operationMode: 'Automatic (> 60 Risk)',
      commandState: isBuzzerActive ? 'ACTIVE (Pulsing)' : 'OFF (Silent)',
      commandBadge: isBuzzerActive ? 'bg-rose-100 text-rose-800 border-rose-300' : 'bg-slate-200 text-slate-700 border-slate-300',
      physicalFeedback: 'Unavailable',
    },
    {
      name: 'Chamber Door LCD',
      pin: 'I2C 0x27',
      icon: Monitor,
      type: '20x4 Alphanumeric LCD',
      operationMode: 'Continuous Stream',
      commandState: 'ACTIVE',
      commandBadge: 'bg-slate-100 text-slate-800 border-slate-200',
      physicalFeedback: 'Unavailable',
    },
  ];

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
        <div className="p-2 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
          <Sliders className="w-4 h-4" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">
            Equipment &amp; Subsystem Overview
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational status, control authority, and feedback availability across chamber hardware
          </p>
        </div>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-left text-xs text-slate-600">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              <th className="py-3 px-4 rounded-l-lg">Equipment</th>
              <th className="py-3 px-4">Pin / Interface</th>
              <th className="py-3 px-4">Subsystem Type</th>
              <th className="py-3 px-4">Operation Mode</th>
              <th className="py-3 px-4">Command State</th>
              <th className="py-3 px-4 rounded-r-lg">Physical Feedback</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {equipmentRows.map((row) => {
              const Icon = row.icon;
              return (
                <tr key={row.name} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5 font-semibold text-slate-900">
                      <Icon className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{row.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                    {row.pin}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">
                    {row.type}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                      {row.operationMode}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full font-bold uppercase text-[10px] border ${row.commandBadge}`}
                    >
                      {row.commandState}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                      {row.physicalFeedback}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

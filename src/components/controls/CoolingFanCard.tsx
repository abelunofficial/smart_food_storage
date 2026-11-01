import React from 'react';
import { Fan, Power, Loader2, AlertCircle, Clock, Info, CheckCircle2 } from 'lucide-react';
import type { EquipmentCommandState, FanCommand } from '../../types';

interface CoolingFanCardProps {
  equipmentState: EquipmentCommandState;
  onCommandChange?: (command: FanCommand) => Promise<void>;
  isUpdating?: boolean;
  commandError?: string | null;
  isDeviceConnected?: boolean;
}

export const CoolingFanCard: React.FC<CoolingFanCardProps> = ({
  equipmentState,
  onCommandChange,
  isUpdating = false,
  commandError = null,
  isDeviceConnected = true,
}) => {
  // Use manualFanCommand as authoritative, fallback to requestedCommand
  const currentCommand: FanCommand = equipmentState.manualFanCommand || equipmentState.requestedCommand || 'off';
  const isCommandOn = currentCommand === 'on';

  const formattedCommandTime = equipmentState.lastCommandAt
    ? new Date(equipmentState.lastCommandAt).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '--:--:--';

  const handleToggle = (targetCommand: FanCommand) => {
    if (onCommandChange && !isUpdating && isDeviceConnected && targetCommand !== currentCommand) {
      onCommandChange(targetCommand);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
      <div>
        {/* Card Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border transition-colors ${
                isCommandOn
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              <Fan className={`w-5 h-5 ${isCommandOn ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  Manual Fan Relay (Virtual Pin V4)
                </h3>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  GPIO Pin 2
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  Blynk V4
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Operator-commanded auxiliary fan relay switched via Blynk Cloud Virtual Pin V4
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center text-xs text-slate-500 font-mono">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Last Command: {formattedCommandTime}</span>
          </div>
        </div>

        {/* Operational Status Boxes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5">
          {/* Commanded State Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                Requested Fan Command (V4)
              </span>
              <div className="flex items-center gap-2.5 mt-2">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    isCommandOn
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200/90 text-slate-700 border border-slate-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${isCommandOn ? 'bg-emerald-600' : 'bg-slate-500'}`}
                  />
                  {currentCommand.toUpperCase()}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {isCommandOn ? 'V4 = 1 (Relay HIGH)' : 'V4 = 0 (Relay LOW)'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Relay polarity is Active-HIGH (<code>#define FAN_ON HIGH</code>). Driven by <code>BLYNK_WRITE(V4)</code> on ESP32 GPIO 2.
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
                <span className="text-xs text-slate-500">Open loop hardware</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Tachometer or auxiliary contact feedback is unavailable in firmware. Displayed state represents the commanded cloud signal, not verified physical rotation.
            </p>
          </div>
        </div>

        {/* Interactive Manual Control Section */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Power className="w-4 h-4 text-blue-600" />
              <span>Operator Manual Actuation Controls</span>
            </div>
            {isUpdating && (
              <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-medium">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Writing to V4...
              </span>
            )}
          </div>

          {/* Error Message if present */}
          {commandError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>Command Error:</strong> {commandError}
              </div>
            </div>
          )}

          {/* Disconnection Warning if offline */}
          {!isDeviceConnected && (
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Controls Disabled:</strong> ESP32 is offline or disconnected. Manual commands cannot reach Virtual Pin V4 until connectivity is restored.
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              disabled={isUpdating || !isDeviceConnected || isCommandOn}
              onClick={() => handleToggle('on')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs transition-all ${
                isCommandOn
                  ? 'bg-emerald-600 text-white shadow-xs cursor-default ring-2 ring-emerald-500/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isUpdating && !isCommandOn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>Turn Fan ON (V4 = 1)</span>
            </button>

            <button
              type="button"
              disabled={isUpdating || !isDeviceConnected || !isCommandOn}
              onClick={() => handleToggle('off')}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs transition-all ${
                !isCommandOn
                  ? 'bg-slate-800 text-white shadow-xs cursor-default ring-2 ring-slate-700/20'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {isUpdating && isCommandOn ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Power className="w-4 h-4" />
              )}
              <span>Turn Fan OFF (V4 = 0)</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>State synchronized automatically on reconnection via <code>BLYNK_CONNECTED() &#123; Blynk.syncVirtual(V4); &#125;</code></span>
          </div>
        </div>
      </div>

      {/* Distinction from GPIO 14 Relay Notice */}
      <div className="mt-5 p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900 text-xs flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-blue-950">Relay Independence Notice:</strong>{' '}
          This manual fan relay operates on <strong>ESP32 GPIO 2</strong> and is switched exclusively by operator commands on Virtual Pin V4.
          It operates <strong>completely independently</strong> from the automatic ventilation relay on <strong>ESP32 GPIO 14</strong>, which is commanded autonomously by firmware spoilage risk calculations.
        </div>
      </div>
    </div>
  );
};

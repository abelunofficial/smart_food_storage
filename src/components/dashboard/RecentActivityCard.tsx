import React from 'react';
import { Bell, CheckCircle2, Info, AlertTriangle, AlertOctagon } from 'lucide-react';
import type { AlertEvent } from '../../types';

interface RecentActivityCardProps {
  alerts: AlertEvent[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ alerts }) => {
  const getSeverityBadge = (severity: AlertEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return {
          icon: AlertOctagon,
          classes: 'bg-red-50 text-red-700 border-red-200',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          classes: 'bg-amber-50 text-amber-700 border-amber-200',
        };
      case 'info':
      default:
        return {
          icon: Info,
          classes: 'bg-blue-50 text-blue-700 border-blue-200',
        };
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/70">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Recent Activity
              </h3>
              <p className="text-xs text-slate-500">
                Demonstration system activity log
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
            {alerts.length > 0 ? 'Demonstration Activity' : '0 Logged'}
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-slate-200/80">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-semibold text-slate-800">No Active Alerts</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              All environmental telemetry points remain within normal thresholds.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((event) => {
              const { icon: SeverityIcon, classes } = getSeverityBadge(event.severity);
              const formattedTime = new Date(event.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={event.id}
                  className="p-3 rounded-lg border border-slate-200/80 bg-slate-50/40 hover:bg-slate-50 transition-colors flex items-start gap-3"
                >
                  <div className={`p-1.5 rounded-md border shrink-0 mt-0.5 ${classes}`}>
                    <SeverityIcon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-slate-900 truncate">
                        {event.title}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {formattedTime}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {event.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>* Demonstration activity (firmware does not publish incident events)</span>
        <span className="font-mono">Demo Fixture</span>
      </div>
    </div>
  );
};

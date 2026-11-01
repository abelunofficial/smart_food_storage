import React from 'react';
import type { ComponentType } from 'react';

interface MetricCardProps {
  name: string;
  value: string | number;
  unit: string;
  badge?: string;
  description: React.ReactNode;
  icon: ComponentType<{ className?: string }>;
  accentColor?: string;
  valueSuffix?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  name,
  value,
  unit,
  badge,
  description,
  icon: Icon,
  accentColor = 'text-blue-600 bg-blue-50 border-blue-200',
  valueSuffix,
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {name}
          </span>
          <div className="flex items-center gap-1.5">
            {badge && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/60">
                {badge}
              </span>
            )}
            <div className={`p-1.5 rounded-lg border ${accentColor} shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 my-1">
          <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </span>
          <span className="text-sm font-semibold text-slate-500">
            {unit}
          </span>
          {valueSuffix && (
            <span className="text-xs text-slate-400 font-medium">
              {valueSuffix}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="text-xs text-slate-500 leading-normal">
          {description}
        </div>
      </div>
    </div>
  );
};

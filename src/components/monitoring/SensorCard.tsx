import React from 'react';
import type { ComponentType } from 'react';

interface SensorCardProps {
  name: string;
  value: string | number;
  unit: string;
  valueSuffix?: string;
  icon: ComponentType<{ className?: string }>;
  accentColor: string;
  description: string;
  badge?: string;
}

export const SensorCard: React.FC<SensorCardProps> = ({
  name,
  value,
  unit,
  valueSuffix,
  icon: Icon,
  accentColor,
  description,
  badge = 'Live',
}) => {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-colors">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            {name}
          </span>

          <div className="flex items-center gap-2">
            {badge && (
              <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                {badge}
              </span>
            )}
            <div className={`p-2 rounded-lg border ${accentColor} shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 my-2">
          <span className="text-3xl font-extrabold tracking-tight text-slate-900">
            {value}
          </span>
          <span className="text-base font-semibold text-slate-500">
            {unit}
          </span>
          {valueSuffix && (
            <span className="text-xs text-slate-400 ml-1">
              {valueSuffix}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-600 leading-normal">
          {description}
        </p>
      </div>
    </div>
  );
};

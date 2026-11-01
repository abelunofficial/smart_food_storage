import React from 'react';
import type { ComponentType } from 'react';
import { Layers } from 'lucide-react';

interface PagePlaceholderProps {
  title: string;
  description: string;
  icon?: ComponentType<{ className?: string }>;
  tag?: string;
}

export const PagePlaceholder: React.FC<PagePlaceholderProps> = ({
  title,
  description,
  icon: Icon = Layers,
  tag = 'Phase 2 Foundation',
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-8 sm:p-12 shadow-xs text-center max-w-2xl mx-auto my-6 sm:my-10">
      <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 mb-5 shadow-2xs">
        <Icon className="w-7 h-7" />
      </div>
      
      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-medium tracking-wide uppercase mb-3">
        {tag}
      </div>

      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>

      <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed max-w-lg mx-auto">
        {description}
      </p>

      <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span className="w-2 h-2 rounded-full bg-slate-300"></span>
        <span>Section structure established · Detailed telemetry scheduled for Phase 3</span>
      </div>
    </div>
  );
};


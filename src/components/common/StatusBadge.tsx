import React from 'react';

export type BadgeVariant = 'SAFE' | 'MODERATE' | 'DANGER!' | 'UNAVAILABLE' | 'demo' | 'neutral' | 'info';

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
  className?: string;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string; defaultLabel: string }> = {
  SAFE: {
    container: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    defaultLabel: 'SAFE',
  },
  MODERATE: {
    container: 'bg-amber-50 text-amber-800 border-amber-200',
    dot: 'bg-amber-500',
    defaultLabel: 'MODERATE',
  },
  'DANGER!': {
    container: 'bg-red-50 text-red-800 border-red-200',
    dot: 'bg-red-500',
    defaultLabel: 'DANGER!',
  },
  UNAVAILABLE: {
    container: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-400',
    defaultLabel: 'UNAVAILABLE',
  },
  demo: {
    container: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    defaultLabel: 'Demo',
  },
  neutral: {
    container: 'bg-slate-100 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
    defaultLabel: 'Status',
  },
  info: {
    container: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-600',
    defaultLabel: 'Info',
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  size = 'md',
  showDot = true,
  className = '',
}) => {
  const config = variantStyles[variant] || variantStyles.neutral;
  const displayText = label ?? config.defaultLabel;

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-[11px] font-medium'
      : 'px-2.5 py-1 text-xs font-semibold';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase ${sizeClasses} ${config.container} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`}
          aria-hidden="true"
        />
      )}
      <span>{displayText}</span>
    </span>
  );
};


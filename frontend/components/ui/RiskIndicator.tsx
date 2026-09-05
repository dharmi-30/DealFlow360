import * as React from 'react';
import { cn } from '@/lib/utils';
import { ShieldCheck, ShieldAlert, AlertTriangle, Flame } from 'lucide-react';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface RiskConfig {
  label: string;
  className: string;
  barColor: string;
  icon: React.ElementType;
}

const RISK_CONFIGS: Record<RiskLevel, RiskConfig> = {
  low: {
    label: 'Low Risk',
    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    barColor: 'bg-emerald-500',
    icon: ShieldCheck,
  },
  medium: {
    label: 'Medium Risk',
    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    barColor: 'bg-amber-500',
    icon: ShieldAlert,
  },
  high: {
    label: 'High Risk',
    className: 'bg-orange-500/10 text-orange-400 ring-orange-500/20',
    barColor: 'bg-orange-500',
    icon: AlertTriangle,
  },
  critical: {
    label: 'Critical Risk',
    className: 'bg-red-500/10 text-red-400 ring-red-500/20',
    barColor: 'bg-red-500',
    icon: Flame,
  },
};

export interface RiskIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  level: RiskLevel;
  variant?: 'badge' | 'bar' | 'compact';
  showLabel?: boolean;
}

export function RiskIndicator({
  level,
  variant = 'badge',
  showLabel = true,
  className,
  ...props
}: RiskIndicatorProps) {
  const config = RISK_CONFIGS[level] ?? RISK_CONFIGS.low;
  const Icon = config.icon;

  if (variant === 'compact') {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)} {...props}>
        <span className={cn('h-2 w-2 rounded-full', config.barColor)} />
        {showLabel && <span className="text-xs font-medium text-slate-300">{config.label}</span>}
      </div>
    );
  }

  if (variant === 'bar') {
    const barsCount = level === 'low' ? 1 : level === 'medium' ? 2 : level === 'high' ? 3 : 4;
    return (
      <div className={cn('inline-flex items-center gap-2', className)} {...props}>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4].map((bar) => (
            <span
              key={bar}
              className={cn(
                'h-3.5 w-1 rounded-full transition-colors',
                bar <= barsCount ? config.barColor : 'bg-white/10'
              )}
            />
          ))}
        </div>
        {showLabel && <span className="text-xs font-medium text-slate-300">{config.label}</span>}
      </div>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset select-none',
        config.className,
        className
      )}
      {...props}
    >
      <Icon className="h-3 w-3 shrink-0" />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

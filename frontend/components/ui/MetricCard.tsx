import * as React from 'react';
import { cn, formatCurrency } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { GlassCard } from './GlassCard';

export interface MetricCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  isCurrency?: boolean;
  change?: number; // percentage change, e.g. +12.5 or -3.2
  changeLabel?: string; // e.g. "vs last month"
  icon?: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  accentColor?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'danger';
}

const accentIconStyle = {
  cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  violet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  amber: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  danger: 'text-red-400 bg-red-500/10 border-red-500/20',
};

export function MetricCard({
  title,
  value,
  isCurrency = false,
  change,
  changeLabel = 'vs last period',
  icon: Icon,
  trend,
  accentColor = 'cyan',
  className,
  ...props
}: MetricCardProps) {
  const formattedValue = typeof value === 'number' && isCurrency ? formatCurrency(value) : value;
  const isPositive = change !== undefined ? change > 0 : trend === 'up';
  const isNegative = change !== undefined ? change < 0 : trend === 'down';

  return (
    <GlassCard hoverable className={cn('p-4 lg:p-5 flex flex-col justify-between space-y-3', className)} {...props}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</span>
        {Icon && (
          <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg border shrink-0', accentIconStyle[accentColor])}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline justify-between gap-2 pt-1">
        <span className="text-2xl font-extrabold tracking-tight text-slate-100">{formattedValue}</span>

        {(change !== undefined || trend) && (
          <div className="flex items-center gap-1 text-xs shrink-0">
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[11px]',
                isPositive && 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
                isNegative && 'bg-red-500/10 text-red-400 border border-red-500/20',
                !isPositive && !isNegative && 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
              )}
            >
              {isPositive && <TrendingUp className="h-3 w-3" />}
              {isNegative && <TrendingDown className="h-3 w-3" />}
              {!isPositive && !isNegative && <Minus className="h-3 w-3" />}
              {change !== undefined && `${change > 0 ? '+' : ''}${change}%`}
            </span>
          </div>
        )}
      </div>
    </GlassCard>
  );
}

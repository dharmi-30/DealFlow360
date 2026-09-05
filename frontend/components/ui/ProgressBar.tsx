import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 - 100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'cyan' | 'violet' | 'emerald' | 'amber' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const variantMap = {
  cyan: 'bg-cyan-500',
  violet: 'bg-violet-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  danger: 'bg-red-500',
};

const sizeMap = {
  sm: 'h-1.5',
  md: 'h-2.5',
  lg: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  variant = 'cyan',
  size = 'md',
  className,
  ...props
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('flex flex-col gap-1.5 w-full', className)} {...props}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between text-xs">
          {label && <span className="font-medium text-slate-300">{label}</span>}
          {showPercentage && <span className="font-semibold text-slate-400">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-white/10 p-0.5', sizeMap[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-300', variantMap[variant])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

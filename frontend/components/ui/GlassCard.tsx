import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  activeBorder?: boolean;
}

const intensityMap = {
  light: 'bg-white/[0.02] backdrop-blur-sm border-white/[0.05]',
  medium: 'bg-white/[0.04] backdrop-blur-md border-white/[0.08]',
  heavy: 'bg-white/[0.07] backdrop-blur-lg border-white/[0.12]',
};

export function GlassCard({
  className,
  hoverable = false,
  intensity = 'medium',
  activeBorder = false,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border transition-all duration-200',
        intensityMap[intensity],
        hoverable &&
          'hover:bg-white/[0.07] hover:border-white/[0.15] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/30',
        activeBorder && 'border-cyan-500/30 ring-1 ring-cyan-500/20',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

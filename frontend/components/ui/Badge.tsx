import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-white/5 text-slate-300 ring-white/10',
        primary:
          'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
        success:
          'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
        warning:
          'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        danger:
          'bg-red-500/10 text-red-400 ring-red-500/20',
        violet:
          'bg-violet-500/10 text-violet-400 ring-violet-500/20',
        outline:
          'bg-transparent text-slate-400 ring-slate-700',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0f1e] disabled:pointer-events-none disabled:opacity-40 select-none',
  {
    variants: {
      variant: {
        default:
          'bg-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/10 active:bg-white/5 border border-white/5',
        primary:
          'bg-cyan-500 text-[#0a0f1e] hover:bg-cyan-400 active:bg-cyan-600 shadow-sm shadow-cyan-500/20',
        ghost:
          'text-slate-400 hover:text-slate-200 hover:bg-white/5 active:bg-white/10',
        outline:
          'border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:bg-white/5 hover:border-slate-600',
        danger:
          'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20',
      },
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-9 w-9 text-base',
        lg: 'h-11 w-11 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {
  icon?: React.ReactNode;
  loading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant, size, icon, loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled ?? loading}
        className={cn(iconButtonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          icon || children
        )}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

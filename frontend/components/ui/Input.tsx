import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  /** Icon shown on left side (Lucide component) */
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-slate-400"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-500">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-200 placeholder:text-slate-600',
              'transition-colors duration-150',
              'focus:border-cyan-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-cyan-500/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              leftIcon && 'pl-9',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

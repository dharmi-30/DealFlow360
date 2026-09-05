import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options?: SelectOption[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={selectId} className="text-xs font-medium text-slate-400">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'h-9 w-full appearance-none rounded-lg border border-white/10 bg-[#0d1426] px-3 py-1.5 pr-8 text-sm text-slate-200',
              'transition-colors duration-150',
              'focus:border-cyan-500/50 focus:bg-[#111827] focus:outline-none focus:ring-1 focus:ring-cyan-500/30',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/30',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled className="bg-[#0d1426] text-slate-500">
                {placeholder}
              </option>
            )}
            {options
              ? options.map((opt) => (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    className="bg-[#0d1426] text-slate-200"
                  >
                    {opt.label}
                  </option>
                ))
              : children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

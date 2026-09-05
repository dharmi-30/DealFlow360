import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value = '', onChange, onClear, placeholder = 'Search...', ...props }, ref) => {
    return (
      <div className="relative w-full">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            'h-9 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-8 text-sm text-slate-200 placeholder:text-slate-500',
            'transition-colors duration-150',
            'focus:border-cyan-500/50 focus:bg-white/[0.07] focus:outline-none focus:ring-1 focus:ring-cyan-500/30',
            className
          )}
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange?.('');
              onClear?.();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-300"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';

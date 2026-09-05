'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  disabled?: boolean;
  danger?: boolean;
  onClick?: () => void;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown({ trigger, items, align = 'right', className }: DropdownProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 mt-1 min-w-[180px] rounded-lg border border-white/10 bg-[#0d1426] p-1.5 shadow-xl shadow-black/60 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick?.();
                  setIsOpen(false);
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs font-medium transition-colors select-none',
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'text-slate-300 hover:bg-white/5 hover:text-slate-100',
                  item.disabled && 'opacity-40 pointer-events-none'
                )}
              >
                {Icon && <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

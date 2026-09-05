'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  id: string;
  label: string;
  count?: number;
  disabled?: boolean;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'underline' | 'pills';
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, variant = 'underline', className }: TabsProps) {
  if (variant === 'pills') {
    return (
      <div className={cn('flex items-center gap-1 rounded-lg bg-white/5 p-1 border border-white/5', className)}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => onChange(tab.id)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all select-none',
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400 shadow-sm ring-1 ring-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5',
                tab.disabled && 'opacity-40 pointer-events-none'
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={cn(
                    'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                    isActive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/10 text-slate-400'
                  )}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center border-b border-white/[0.08]', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            disabled={tab.disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative flex items-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors select-none',
              isActive ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200',
              tab.disabled && 'opacity-40 pointer-events-none'
            )}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.2 text-[10px] font-semibold',
                  isActive ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/10 text-slate-400'
                )}
              >
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-sm bg-cyan-400" />
            )}
          </button>
        );
      })}
    </div>
  );
}

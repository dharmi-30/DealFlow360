import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, description, action, className, ...props }: SectionHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between mb-3', className)} {...props}>
      <div>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>
        {description && <p className="text-xs text-slate-400">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

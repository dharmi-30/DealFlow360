import * as React from 'react';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({ label = 'Loading...', size = 'md', className, ...props }: LoadingStateProps) {
  return (
    <div
      className={cn('flex min-h-[160px] w-full flex-col items-center justify-center gap-3 p-6 text-center', className)}
      {...props}
    >
      <Spinner size={size} />
      {label && <p className="text-xs text-slate-400">{label}</p>}
    </div>
  );
}

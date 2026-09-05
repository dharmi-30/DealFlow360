import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Card root ─────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Add a subtle hover lift effect */
  hoverable?: boolean;
}

export function Card({ className, hoverable, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-white/[0.06] bg-white/[0.03] backdrop-blur-sm',
        hoverable &&
          'transition-all duration-200 hover:border-white/[0.10] hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/20',
        className
      )}
      {...props}
    />
  );
}

// ── Card header ────────────────────────────────────────────────────────────────
export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1 p-5 pb-0', className)}
      {...props}
    />
  );
}

// ── Card title ─────────────────────────────────────────────────────────────────
export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-sm font-semibold text-slate-200 leading-none tracking-tight', className)}
      {...props}
    />
  );
}

// ── Card description ───────────────────────────────────────────────────────────
export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-slate-500', className)}
      {...props}
    />
  );
}

// ── Card content ───────────────────────────────────────────────────────────────
export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props} />
  );
}

// ── Card footer ────────────────────────────────────────────────────────────────
export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center p-5 pt-0', className)}
      {...props}
    />
  );
}

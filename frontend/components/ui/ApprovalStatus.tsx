import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';

export type ApprovalState = 'approved' | 'pending' | 'rejected' | 'changes_requested';

export interface ApprovalStep {
  role: string;
  approverName?: string;
  status: ApprovalState;
  timestamp?: string;
}

export interface ApprovalStatusProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: ApprovalStep[];
  currentStepIndex?: number;
}

const STATUS_ICONS: Record<ApprovalState, { icon: React.ElementType; color: string; bg: string }> = {
  approved: { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
  pending: { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
  rejected: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
  changes_requested: { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
};

export function ApprovalStatus({ steps, className, ...props }: ApprovalStatusProps) {
  return (
    <div className={cn('flex flex-col gap-3 w-full', className)} {...props}>
      <div className="relative flex items-center justify-between">
        {/* Connecting line */}
        <div className="absolute left-4 right-4 top-4 -z-0 h-0.5 bg-white/10" />

        {steps.map((step, idx) => {
          const config = STATUS_ICONS[step.status] ?? STATUS_ICONS.pending;
          const Icon = config.icon;

          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5 text-center">
              <div
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full border bg-[#0a0f1e] transition-all',
                  config.bg
                )}
              >
                <Icon className={cn('h-4 w-4', config.color)} />
              </div>
              <div className="flex flex-col items-center">
                <span className="text-xs font-semibold text-slate-200">{step.role}</span>
                {step.approverName && <span className="text-[11px] text-slate-400">{step.approverName}</span>}
                {step.timestamp && <span className="text-[10px] text-slate-500">{step.timestamp}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

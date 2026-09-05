import * as React from 'react';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, AlertCircle, XCircle, FileEdit, ArrowLeftRight, MinusCircle } from 'lucide-react';

export type StatusType =
  | 'draft'
  | 'pending'
  | 'pending_approval'
  | 'approved'
  | 'negotiation'
  | 'sent'
  | 'accepted'
  | 'confirmed'
  | 'rejected'
  | 'cancelled'
  | 'expired';

interface StatusConfig {
  label: string;
  className: string;
  icon: React.ElementType;
}

const STATUS_CONFIGS: Record<StatusType, StatusConfig> = {
  draft: {
    label: 'Draft',
    className: 'bg-slate-500/10 text-slate-400 ring-slate-500/20',
    icon: FileEdit,
  },
  pending: {
    label: 'Pending',
    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    icon: Clock,
  },
  pending_approval: {
    label: 'Pending Approval',
    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    className: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    icon: CheckCircle2,
  },
  negotiation: {
    label: 'Negotiation',
    className: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
    icon: ArrowLeftRight,
  },
  sent: {
    label: 'Sent to Client',
    className: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
    icon: Clock,
  },
  accepted: {
    label: 'Confirmed',
    className: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
    icon: CheckCircle2,
  },
  confirmed: {
    label: 'Confirmed',
    className: 'bg-cyan-500/10 text-cyan-400 ring-cyan-500/20',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-500/10 text-red-400 ring-red-500/20',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-slate-600/10 text-slate-500 ring-slate-600/20',
    icon: XCircle,
  },
  expired: {
    label: 'Expired',
    className: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    icon: MinusCircle,
  },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusType;
  showIcon?: boolean;
  customLabel?: string;
}

export function StatusBadge({ status, showIcon = true, customLabel, className, ...props }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status] ?? STATUS_CONFIGS.draft;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset transition-colors select-none',
        config.className,
        className
      )}
      {...props}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{customLabel || config.label}</span>
    </span>
  );
}

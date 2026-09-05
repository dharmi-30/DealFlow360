import * as React from 'react';
import { cn, getInitials } from '@/lib/utils';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  status?: 'online' | 'offline' | 'busy';
}

const sizeMap = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
};

const statusMap = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-500',
  busy: 'bg-red-500',
};

export function Avatar({ name, src, size = 'md', status, className, ...props }: AvatarProps) {
  return (
    <div className="relative inline-block">
      <div
        className={cn(
          'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-cyan-500/10 font-semibold text-cyan-300 ring-1 ring-cyan-500/30 select-none',
          sizeMap[size],
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={name} className="h-full w-full object-cover" />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={cn(
            'absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#0a0f1e]',
            statusMap[status]
          )}
        />
      )}
    </div>
  );
}

export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  users: { name: string; src?: string }[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
}

export function AvatarGroup({ users, max = 3, size = 'sm', className, ...props }: AvatarGroupProps) {
  const visibleUsers = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn('flex items-center -space-x-2 overflow-hidden', className)} {...props}>
      {visibleUsers.map((user, idx) => (
        <Avatar key={idx} name={user.name} src={user.src} size={size} className="ring-2 ring-[#0a0f1e]" />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex shrink-0 items-center justify-center rounded-full bg-slate-800 font-medium text-slate-300 ring-2 ring-[#0a0f1e]',
            sizeMap[size]
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

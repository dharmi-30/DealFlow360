'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  position?: 'right' | 'left';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 'max-w-xs',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  position = 'right',
  size = 'md',
}: DrawerProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed inset-y-0 flex max-w-full',
          position === 'right' ? 'right-0' : 'left-0'
        )}
      >
        <div
          className={cn(
            'relative flex w-screen flex-col border-white/10 bg-[#0d1426] shadow-2xl shadow-black/80',
            position === 'right' ? 'border-l' : 'border-r',
            sizeMap[size]
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
            <div>
              {title && typeof title === 'string' ? (
                <h2 className="text-base font-semibold text-slate-100">{title}</h2>
              ) : (
                title
              )}
              {description && <p className="mt-0.5 text-xs text-slate-400">{description}</p>}
            </div>
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              aria-label="Close drawer"
              icon={<X className="h-4 w-4" />}
            />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="flex items-center justify-end gap-3 border-t border-white/[0.06] bg-white/[0.01] p-4">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

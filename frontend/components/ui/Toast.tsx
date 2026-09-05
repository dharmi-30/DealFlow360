'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = React.useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration ?? 4000;
      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const success = React.useCallback((title: string, message?: string) => addToast({ type: 'success', title, message }), [addToast]);
  const error = React.useCallback((title: string, message?: string) => addToast({ type: 'error', title, message }), [addToast]);
  const info = React.useCallback((title: string, message?: string) => addToast({ type: 'info', title, message }), [addToast]);
  const warning = React.useCallback((title: string, message?: string) => addToast({ type: 'warning', title, message }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const TOAST_ICONS: Record<ToastType, { icon: React.ElementType; color: string; border: string }> = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', border: 'border-emerald-500/30' },
  error: { icon: XCircle, color: 'text-red-400', border: 'border-red-500/30' },
  warning: { icon: AlertCircle, color: 'text-amber-400', border: 'border-amber-500/30' },
  info: { icon: Info, color: 'text-cyan-400', border: 'border-cyan-500/30' },
};

function ToastContainer({ toasts, onRemove }: { toasts: ToastItem[]; onRemove: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const config = TOAST_ICONS[toast.type];
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 rounded-lg border bg-[#0d1426] p-4 shadow-xl shadow-black/60 backdrop-blur-md transition-all animate-in slide-in-from-bottom-3 duration-200',
              config.border
            )}
          >
            <Icon className={cn('h-5 w-5 shrink-0 mt-0.5', config.color)} />
            <div className="flex-1">
              <h4 className="text-xs font-semibold text-slate-100">{toast.title}</h4>
              {toast.message && <p className="mt-0.5 text-[11px] text-slate-400">{toast.message}</p>}
            </div>
            <button
              onClick={() => onRemove(toast.id)}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}

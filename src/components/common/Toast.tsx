import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '380px',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          style={{
            backgroundColor: '#0f172a',
            color: '#ffffff',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '12px 16px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}
        >
          {toast.type === 'success' && <CheckCircle2 size={18} style={{ color: '#22c55e', flexShrink: 0 }} />}
          {toast.type === 'error' && <AlertCircle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />}
          {toast.type === 'info' && <Info size={18} style={{ color: '#3b82f6', flexShrink: 0 }} />}

          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{toast.title}</div>
            {toast.message && (
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
                {toast.message}
              </div>
            )}
          </div>

          <button
            onClick={() => onDismiss(toast.id)}
            style={{ color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

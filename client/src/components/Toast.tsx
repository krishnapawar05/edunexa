import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 9999,
        maxWidth: '360px',
      }}
    >
      {toasts.map((toast) => {
        let border = 'var(--border-default)';
        let bg = 'var(--bg-surface)';
        let icon = <Info size={18} style={{ color: 'var(--info-solid)' }} />;

        if (toast.type === 'success') {
          border = 'var(--success-border)';
          bg = 'var(--success-bg)';
          icon = <CheckCircle2 size={18} style={{ color: 'var(--success-solid)' }} />;
        } else if (toast.type === 'warning') {
          border = 'var(--warning-border)';
          bg = 'var(--warning-bg)';
          icon = <AlertTriangle size={18} style={{ color: 'var(--warning-solid)' }} />;
        } else if (toast.type === 'error') {
          border = 'var(--danger-border)';
          bg = 'var(--danger-bg)';
          icon = <AlertCircle size={18} style={{ color: 'var(--danger-solid)' }} />;
        }

        return (
          <div
            key={toast.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: bg,
              border: `1px solid ${border}`,
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              color: 'var(--text-primary)',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <div style={{ marginTop: '2px' }}>{icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{toast.title}</div>
              {toast.description && (
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '2px',
              }}
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

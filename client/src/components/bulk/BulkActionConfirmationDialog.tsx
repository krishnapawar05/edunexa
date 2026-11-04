import React from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';

export interface BulkActionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  count: number;
  entityName?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const BulkActionConfirmationDialog: React.FC<BulkActionConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  count,
  entityName = 'records',
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={isLoading ? () => {} : onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            backgroundColor:
              variant === 'danger'
                ? 'var(--danger-50, #fef2f2)'
                : variant === 'warning'
                ? 'rgba(245, 158, 11, 0.1)'
                : 'var(--primary-50, #f0fdf4)',
            border:
              variant === 'danger'
                ? '1px solid var(--danger-200, #fecaca)'
                : variant === 'warning'
                ? '1px solid rgba(245, 158, 11, 0.3)'
                : '1px solid var(--primary-200, #bbf7d0)',
            padding: '14px 16px',
            borderRadius: '8px',
          }}
        >
          <AlertTriangle
            size={22}
            style={{
              color:
                variant === 'danger'
                  ? 'var(--danger-600, #dc2626)'
                  : variant === 'warning'
                  ? '#d97706'
                  : 'var(--primary-600, #16a34a)',
              flexShrink: 0,
              marginTop: '2px',
            }}
          />
          <div>
            <div
              style={{
                fontSize: '0.92rem',
                fontWeight: 700,
                color:
                  variant === 'danger'
                    ? 'var(--danger-900, #7f1d1d)'
                    : variant === 'warning'
                    ? '#78350f'
                    : 'var(--primary-900, #14532d)',
                marginBottom: '4px',
              }}
            >
              Affecting {count} selected {count === 1 ? 'record' : entityName}
            </div>
            <div
              style={{
                fontSize: '0.84rem',
                color: 'var(--text-secondary, #475569)',
                lineHeight: 1.5,
              }}
            >
              {message}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border-default, #e2e8f0)',
          }}
        >
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
          >
            {cancelLabel}
          </Button>

          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            disabled={isLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              fontSize: '0.84rem',
              fontWeight: 700,
            }}
          >
            {isLoading && <Loader2 size={15} className="animate-spin" />}
            <span>{confirmLabel}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};


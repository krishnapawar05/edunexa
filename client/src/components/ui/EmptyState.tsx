import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-8) var(--space-4)',
        textAlign: 'center',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-md)',
        border: '1px dashed var(--border-default)',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          backgroundColor: 'var(--bg-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          marginBottom: 'var(--space-3)',
        }}
      >
        {icon || <FileQuestion size={24} />}
      </div>
      <h4 style={{ margin: '0 0 4px', fontSize: '0.98rem', color: 'var(--text-primary)' }}>{title}</h4>
      <p style={{ margin: '0 0 var(--space-4)', fontSize: '0.84rem', color: 'var(--text-muted)', maxWidth: '360px' }}>
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
};

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  items: Array<{ label: string; href?: string }>;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ items }) => {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
        marginBottom: 'var(--space-2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Home size={13} style={{ color: 'var(--text-muted)' }} />
        <span>Workspace</span>
      </div>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <ChevronRight size={12} style={{ opacity: 0.6 }} />
          <span
            style={{
              fontWeight: idx === items.length - 1 ? 600 : 400,
              color: idx === items.length - 1 ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </nav>
  );
};

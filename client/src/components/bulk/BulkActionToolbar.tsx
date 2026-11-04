import React from 'react';
import { CheckSquare, X, Loader2 } from 'lucide-react';
import { BulkSelectionState } from './useBulkSelection.js';

export interface BulkActionItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline';
  disabled?: boolean;
  tooltip?: string;
  loading?: boolean;
  isDestructive?: boolean;
}

export interface BulkActionToolbarProps {
  selection: BulkSelectionState;
  actions: BulkActionItem[];
  totalMatchingCount?: number;
  currentPageIds?: string[];
  entityName?: string; // e.g. "students", "staff", "applications"
  className?: string;
  style?: React.CSSProperties;
}

export const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selection,
  actions,
  totalMatchingCount,
  currentPageIds = [],
  entityName = 'records',
  className = '',
  style,
}) => {
  const { selectedCount, clearSelection, isAllMatching, selectAllMatching } = selection;

  if (selectedCount === 0) {
    return null;
  }

  const showSelectAllMatching =
    totalMatchingCount !== undefined &&
    totalMatchingCount > currentPageIds.length &&
    currentPageIds.length > 0 &&
    currentPageIds.every((id) => selection.isSelected(id)) &&
    !isAllMatching;

  return (
    <div
      role="toolbar"
      aria-label="Bulk actions toolbar"
      className={`ed-bulk-toolbar ${className}`}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        padding: '12px 18px',
        backgroundColor: 'var(--primary-900, #14532d)',
        color: '#ffffff',
        borderRadius: 'var(--radius-lg, 10px)',
        border: '1px solid var(--primary-700, #15803d)',
        boxShadow: 'var(--shadow-md, 0 4px 12px rgba(0, 0, 0, 0.15))',
        marginBottom: '16px',
        animation: 'fadeIn 0.15s ease-in-out',
        ...style,
      }}
    >
      {/* Selection Summary Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '0.84rem',
            fontWeight: 700,
            letterSpacing: '0.2px',
          }}
        >
          <CheckSquare size={16} style={{ color: '#4ade80' }} />
          <span>
            {selectedCount} {isAllMatching ? `(all matching ${entityName})` : selectedCount === 1 ? 'record' : 'records'}{' '}
            selected
          </span>
        </div>

        {showSelectAllMatching && (
          <button
            type="button"
            onClick={() => selectAllMatching()}
            style={{
              background: 'none',
              border: 'none',
              color: '#86efac',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: 0,
            }}
          >
            Select all {totalMatchingCount} matching {entityName}
          </button>
        )}

        <button
          type="button"
          onClick={clearSelection}
          title="Deselect all records"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            background: 'transparent',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#e2e8f0',
            borderRadius: '5px',
            padding: '3px 8px',
            fontSize: '0.78rem',
            cursor: 'pointer',
            transition: 'background-color 0.1s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <X size={13} />
          <span>Clear Selection</span>
        </button>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        {actions.map((act) => {
          let btnBg = 'rgba(255, 255, 255, 0.12)';
          let btnColor = '#ffffff';
          let btnBorder = '1px solid rgba(255, 255, 255, 0.2)';

          if (act.variant === 'primary') {
            btnBg = 'var(--primary-500, #22c55e)';
            btnColor = '#0f172a';
            btnBorder = '1px solid var(--primary-400, #4ade80)';
          } else if (act.variant === 'danger') {
            btnBg = 'rgba(239, 68, 68, 0.25)';
            btnColor = '#fca5a5';
            btnBorder = '1px solid rgba(239, 68, 68, 0.5)';
          } else if (act.variant === 'warning') {
            btnBg = 'rgba(245, 158, 11, 0.25)';
            btnColor = '#fde68a';
            btnBorder = '1px solid rgba(245, 158, 11, 0.5)';
          }

          return (
            <button
              key={act.id}
              type="button"
              onClick={act.onClick}
              disabled={act.disabled || act.loading}
              title={act.tooltip || act.label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                backgroundColor: act.disabled ? 'rgba(255, 255, 255, 0.05)' : btnBg,
                color: act.disabled ? 'rgba(255, 255, 255, 0.4)' : btnColor,
                border: btnBorder,
                borderRadius: '6px',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: act.disabled || act.loading ? 'not-allowed' : 'pointer',
                opacity: act.disabled ? 0.6 : 1,
                transition: 'all 0.12s ease',
              }}
            >
              {act.loading ? <Loader2 size={14} className="animate-spin" /> : act.icon}
              <span>{act.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};


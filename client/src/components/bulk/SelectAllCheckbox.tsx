import React, { useRef, useEffect } from 'react';
import { BulkSelectionState } from './useBulkSelection.js';

export interface SelectAllCheckboxProps {
  pageIds: string[];
  selection: BulkSelectionState;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const SelectAllCheckbox: React.FC<SelectAllCheckboxProps> = ({
  pageIds,
  selection,
  title = 'Select all records on current page',
  className = '',
  style,
}) => {
  const checkboxRef = useRef<HTMLInputElement>(null);
  const isAll = selection.isAllSelected(pageIds);
  const isPart = selection.isPartiallySelected(pageIds);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = isPart;
    }
  }, [isPart]);

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <input
        ref={checkboxRef}
        type="checkbox"
        checked={isAll}
        onChange={() => selection.togglePage(pageIds)}
        disabled={pageIds.length === 0}
        title={title}
        aria-label={title}
        className={`ed-checkbox ${className}`}
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--primary-600, #166534)',
          cursor: pageIds.length === 0 ? 'not-allowed' : 'pointer',
          borderRadius: '4px',
          ...style,
        }}
      />
    </div>
  );
};


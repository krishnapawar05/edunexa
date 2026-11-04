import React from 'react';

export interface RowCheckboxProps {
  id: string;
  checked: boolean;
  onToggle: (id: string) => void;
  title?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const RowCheckbox: React.FC<RowCheckboxProps> = ({
  id,
  checked,
  onToggle,
  title = 'Select row',
  className = '',
  style,
}) => {
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(id)}
        title={title}
        aria-label={title}
        className={`ed-checkbox ${className}`}
        style={{
          width: '16px',
          height: '16px',
          accentColor: 'var(--primary-600, #166534)',
          cursor: 'pointer',
          borderRadius: '4px',
          ...style,
        }}
      />
    </div>
  );
};


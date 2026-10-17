import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}) => {
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderTop: '1px solid var(--border-default)',
        fontSize: '0.82rem',
        color: 'var(--text-secondary)',
        backgroundColor: 'var(--bg-surface)',
      }}
    >
      <div>
        Showing <span style={{ fontWeight: 600 }}>{startItem}</span> to{' '}
        <span style={{ fontWeight: 600 }}>{endItem}</span> of{' '}
        <span style={{ fontWeight: 600 }}>{totalItems}</span> records
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="ed-btn ed-btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
          aria-label="Previous page"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span style={{ fontWeight: 500, margin: '0 4px' }}>
          Page {currentPage} of {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="ed-btn ed-btn-secondary"
          style={{ padding: '4px 8px', fontSize: '0.78rem' }}
          aria-label="Next page"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

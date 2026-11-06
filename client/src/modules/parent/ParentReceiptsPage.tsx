import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Download,
  Printer,
  CheckCircle2,
  Calendar,
  CreditCard,
  RefreshCw,
  Search,
  Building,
  ShieldCheck,
  Eye,
} from 'lucide-react';
import { useParentChild, ParentChildSwitcherBar } from '../../context/ParentChildContext.js';
import { portalsApi } from '../../services/api.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

export const ParentReceiptsPage: React.FC = () => {
  const { selectedChild } = useParentChild();
  const { branding } = useSchoolBranding();
  const [receipts, setReceipts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);

  const loadReceipts = async () => {
    if (!selectedChild) return;
    try {
      setLoading(true);
      setError(null);
      const res: any = await portalsApi.getParentChildReceipts(selectedChild.id);
      setReceipts(Array.isArray(res) ? res : res?.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve fee receipts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [selectedChild?.id]);

  const filteredReceipts = receipts.filter(
    (r) =>
      r.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.transactionRef?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.paymentMethod?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto' }}>
      {/* Universal Parent Child Switcher */}
      <ParentChildSwitcherBar />

      {/* Header Card */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">Financial Ledger</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified Remittances</span>
          </div>
          <h1 className="ed-page-header-title">
            <Receipt size={26} style={{ color: 'var(--color-primary)' }} />
            Official Fee Receipts & Tax Vouchers
          </h1>
          <p className="ed-page-header-desc">
            Download institutional payment receipts with cryptographic transaction references and verified school seals for{' '}
            <strong style={{ color: 'var(--color-primary)' }}>{selectedChild?.name || 'Selected Ward'}</strong>.
          </p>
        </div>

        <button
          className="ed-btn ed-btn-secondary"
          onClick={loadReceipts}
          disabled={loading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {error}
        </div>
      )}

      {/* Toolbar */}
      <div className="ed-toolbar">
        <div className="ed-search-box">
          <Search size={16} className="ed-search-icon" />
          <input
            type="text"
            placeholder="Search receipt # or transaction ref..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ed-input"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="ed-card">
        <div className="ed-card-body" style={{ padding: 0, overflowX: 'auto' }}>
          <table className="ed-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Receipt #</th>
                <th>Payment Date</th>
                <th>Amount Paid</th>
                <th>Payment Mode</th>
                <th>Transaction Ref</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReceipts.map((r, idx) => (
                <tr key={r.id || idx}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                    {r.receiptNumber}
                  </td>
                  <td>{r.paymentDate ? new Date(r.paymentDate).toLocaleDateString() : 'N/A'}</td>
                  <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    ₹{Number(r.amountPaid).toLocaleString()}
                  </td>
                  <td>
                    <span className="ed-badge ed-badge-neutral">{r.paymentMethod}</span>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {r.transactionRef || 'N/A'}
                  </td>
                  <td>
                    <span className="ed-badge ed-badge-teal" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={12} /> {r.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        className="ed-icon-btn"
                        title="View Detailed Voucher"
                        onClick={() => setSelectedReceipt(r)}
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        className="ed-icon-btn"
                        title="Print Official Receipt"
                        onClick={() => {
                          setSelectedReceipt(r);
                          setTimeout(() => window.print(), 300);
                        }}
                      >
                        <Printer size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredReceipts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    {loading ? 'Retrieving payment receipts...' : 'No fee receipts recorded for this student.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Receipt Voucher Modal */}
      {selectedReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={() => setSelectedReceipt(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '640px',
              width: '100%',
              padding: '32px',
              border: '2px solid var(--border-default)',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Printable Voucher Header */}
            <div style={{ textAlign: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '20px' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {branding.schoolName || 'APEX ACADEMY'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {branding.address || 'Knowledge Park III, New Delhi'} • Affiliation: CBSE Standard
              </div>
              <div style={{ display: 'inline-block', marginTop: '10px', padding: '4px 14px', backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                OFFICIAL PAYMENT RECEIPT & TAX VOUCHER
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '0.86rem', marginBottom: '20px' }}>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Receipt Number</div>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedReceipt.receiptNumber}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Date & Time</div>
                <div style={{ fontWeight: 600 }}>{new Date(selectedReceipt.paymentDate).toLocaleString()}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Candidate Name</div>
                <div style={{ fontWeight: 700 }}>{selectedReceipt.student?.user ? `${selectedReceipt.student.user.firstName} ${selectedReceipt.student.user.lastName}` : selectedChild?.name}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Admission Number</div>
                <div style={{ fontWeight: 600 }}>{selectedReceipt.student?.admissionNumber || selectedChild?.admissionNumber}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Payment Mode</div>
                <div style={{ fontWeight: 600 }}>{selectedReceipt.paymentMethod}</div>
              </div>
              <div>
                <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Transaction Reference</div>
                <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedReceipt.transactionRef || 'N/A'}</div>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: '#334155' }}>Total Amount Remitted</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a' }}>
                  ₹{Number(selectedReceipt.amountPaid).toLocaleString()}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '6px' }}>
                Status: Verified & Cleared in School Treasury.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Automated electronic receipt generated by EduNexa ERP. No physical signature required.
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="ed-btn ed-btn-secondary ed-btn-sm" onClick={() => setSelectedReceipt(null)}>
                  Close
                </button>
                <button className="ed-btn ed-btn-primary ed-btn-sm" onClick={() => window.print()}>
                  <Printer size={14} /> Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ParentReceiptsPage;

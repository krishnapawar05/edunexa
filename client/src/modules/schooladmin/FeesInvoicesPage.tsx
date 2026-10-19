import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus,
  DollarSign,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { operationsApi } from '../../services/api.js';

interface FeeInvoiceItem {
  id: string;
  invoiceNumber: string;
  studentName: string;
  admissionNumber: string;
  feeHead: string;
  amountDue: number;
  amountPaid: number;
  outstanding: number;
  dueDate: string;
  status: 'PAID' | 'PARTIALLY_PAID' | 'UNPAID' | 'OVERDUE';
}

export const FeesInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<FeeInvoiceItem[]>([]);
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals & Action States
  const [paymentInvoice, setPaymentInvoice] = useState<FeeInvoiceItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [concessionInvoice, setConcessionInvoice] = useState<FeeInvoiceItem | null>(null);
  const [concessionAmount, setConcessionAmount] = useState<number>(500);
  const [concessionReason, setConcessionReason] = useState('Merit scholarship waiver.');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadFeeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, invoicesRes] = await Promise.all([
        operationsApi.getFeeSummary(),
        operationsApi.listFeeInvoices({ status: statusFilter !== 'ALL' ? statusFilter : undefined }),
      ]);

      setSummary(summaryRes);

      const rawInvoices = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes as any)?.items || [];
      const items: FeeInvoiceItem[] = rawInvoices.map((inv: any) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        studentName: inv.student
          ? `${inv.student.membership.user.firstName} ${inv.student.membership.user.lastName}`
          : 'Apex Student',
        admissionNumber: inv.student?.admissionNumber || 'ADM-2026-XXXX',
        feeHead: inv.feeStructure?.feeHead || 'Term Tuition & Technology Fee',
        amountDue: inv.amountDue,
        amountPaid: inv.amountPaid || 0,
        outstanding: Math.max(0, inv.amountDue - (inv.amountPaid || 0)),
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : '2026-11-30',
        status: inv.status,
      }));

      setInvoices(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load fee structures and invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [statusFilter]);

  // Record Payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    setIsSubmitting(true);
    try {
      const res = await operationsApi.recordFeePayment({
        invoiceId: paymentInvoice.id,
        amount: Number(paymentAmount),
        paymentMethod,
        transactionReference: `SIM-TXN-${Date.now().toString().slice(-6)}`,
      });

      showToast(`Payment of ₹${paymentAmount.toLocaleString()} recorded for ${paymentInvoice.invoiceNumber}! Receipt: ${res.receiptNumber || 'Generated'}`);
      setPaymentInvoice(null);
      loadFeeData();
    } catch (err: any) {
      showToast(err.message || 'Payment processing failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apply Concession
  const handleApplyConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concessionInvoice) return;

    setIsSubmitting(true);
    try {
      await operationsApi.applyFeeConcession({
        invoiceId: concessionInvoice.id,
        concessionAmount: Number(concessionAmount),
        reason: concessionReason,
      });

      showToast(`Concession of ₹${concessionAmount.toLocaleString()} applied to ${concessionInvoice.invoiceNumber}.`);
      setConcessionInvoice(null);
      loadFeeData();
    } catch (err: any) {
      showToast(err.message || 'Failed to apply concession.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Export CSV Ledger
  const handleExportCsv = async () => {
    try {
      const csv = await operationsApi.exportFeeCsv();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `edunexa_fee_ledger_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Fee ledger exported to CSV successfully.');
    } catch (err: any) {
      showToast(err.message || 'CSV export failed.');
    }
  };

  // Filtered List
  const filteredInvoices = invoices.filter((inv) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      inv.studentName.toLowerCase().includes(q) ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.admissionNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Fees, Invoices & Financial Ledger
            </h1>
            <Badge variant="success">Audited Ledger</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Student invoice balances, payment collections, concessions, and institutional revenue tracking.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={loadFeeData}
            disabled={loading}
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="ed-btn ed-btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Invoiced
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            ₹{(summary?.totalInvoiced ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Current Academic Session
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Total Collected
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            ₹{(summary?.totalCollected ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '4px' }}>
            Collection Rate: {summary?.collectionRatePercentage ?? 0}%
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Outstanding Balance
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            ₹{(summary?.totalOutstanding ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Pending collections
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Concessions Granted
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#8b5cf6', marginTop: '4px' }}>
            ₹{(summary?.totalConcessions ?? 0).toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Scholarships & adjustments
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-default)',
        }}
      >
        <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by student, invoice number, or admission no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="ed-input"
            style={{ paddingLeft: '36px', width: '100%' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="ed-input"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
          >
            <option value="ALL">All Invoices</option>
            <option value="UNPAID">Unpaid</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--danger-50)',
            border: '1px solid var(--danger-200)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-800)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={20} />
          <div>{error}</div>
        </div>
      )}

      {/* Invoices Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Invoice No.</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Student</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Fee Head</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Amount Due</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Outstanding</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Status</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Loading financial records from PostgreSQL...
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No fee invoices found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    style={{ borderBottom: '1px solid var(--border-default)', transition: 'background-color 0.1s ease' }}
                  >
                    <td style={{ padding: '12px 16px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {inv.invoiceNumber}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{inv.studentName}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{inv.admissionNumber}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-primary)' }}>
                      {inv.feeHead}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                      ₹{inv.amountDue.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: inv.outstanding > 0 ? '#ef4444' : '#10b981' }}>
                      ₹{inv.outstanding.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <Badge
                        variant={
                          inv.status === 'PAID'
                            ? 'success'
                            : inv.status === 'PARTIALLY_PAID'
                            ? 'warning'
                            : 'danger'
                        }
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {inv.outstanding > 0 && (
                          <button
                            onClick={() => {
                              setPaymentInvoice(inv);
                              setPaymentAmount(inv.outstanding);
                            }}
                            className="ed-btn ed-btn-sm ed-btn-primary"
                            title="Collect Fee Payment"
                          >
                            <CreditCard size={13} />
                            <span>Pay</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setConcessionInvoice(inv);
                            setConcessionAmount(Math.min(500, inv.outstanding || 500));
                          }}
                          className="ed-btn ed-btn-sm ed-btn-secondary"
                          title="Apply Concession or Scholarship Adjustment"
                        >
                          <span>Adjust</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment (Clearly Labeled Simulated Gateway) */}
      {paymentInvoice && (
        <Modal
          isOpen={Boolean(paymentInvoice)}
          onClose={() => setPaymentInvoice(null)}
          title={`Collect Fee Payment: ${paymentInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div
              style={{
                padding: 'var(--space-3) var(--space-4)',
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Student & Outstanding Balance</div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {paymentInvoice.studentName} — ₹{paymentInvoice.outstanding.toLocaleString()} Pending
              </div>
              <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                (Simulated Payment Processing Gateway — Validated in PostgreSQL)
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Payment Amount (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                max={paymentInvoice.outstanding}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(Number(e.target.value))}
                className="ed-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Payment Method *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="ed-input"
              >
                <option value="UPI">UPI Instant (Simulated)</option>
                <option value="BANK_TRANSFER">Direct Bank Transfer / NEFT</option>
                <option value="CARD">Credit / Debit Card</option>
                <option value="CASH">Institutional Cash Counter</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setPaymentInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Confirm Payment'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal: Apply Fee Concession */}
      {concessionInvoice && (
        <Modal
          isOpen={Boolean(concessionInvoice)}
          onClose={() => setConcessionInvoice(null)}
          title={`Apply Concession: ${concessionInvoice.invoiceNumber}`}
        >
          <form onSubmit={handleApplyConcession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Concession Amount (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={concessionAmount}
                onChange={(e) => setConcessionAmount(Number(e.target.value))}
                className="ed-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>
                Concession Reason & Audit Rationale *
              </label>
              <textarea
                required
                rows={3}
                value={concessionReason}
                onChange={(e) => setConcessionReason(e.target.value)}
                className="ed-input"
                placeholder="Specify merit scholarship, sibling waiver, or staff child discount..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Button type="button" variant="secondary" onClick={() => setConcessionInvoice(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Applying...' : 'Apply Concession'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Receipt,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { operationsApi, coreApi, getStoredUser } from '../../services/api.js';

export const StudentFeesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Payment Modal State
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('ONLINE_CARD');
  const [paying, setPaying] = useState<boolean>(false);
  const [paySuccess, setPaySuccess] = useState<any | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  const loadFeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const [studentProfile, invoiceList] = await Promise.all([
        coreApi.getStudentById(currentStudentId),
        operationsApi.listFeeInvoices({ studentProfileId: currentStudentId }),
      ]);

      setStudent(studentProfile);
      setInvoices(invoiceList || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve fee invoices from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, []);

  const totalInvoiced = invoices.reduce((sum, inv) => sum + (inv.amountDue || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (inv.amountPaid || 0), 0);
  const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);

  const openPayModal = (inv: any) => {
    setSelectedInvoice(inv);
    const balance = Math.max(0, (inv.amountDue || 0) - (inv.amountPaid || 0));
    setPayAmount(balance.toString());
    setPaySuccess(null);
    setPayError(null);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError('Please enter a valid positive payment amount.');
      return;
    }

    try {
      setPaying(true);
      setPayError(null);

      const res = await operationsApi.recordFeePayment({
        invoiceId: selectedInvoice.id,
        amount: amountNum,
        paymentMethod: paymentMethod,
        transactionReference: `SIM-TXN-${Date.now().toString().slice(-6)}`,
      });

      setPaySuccess(res);
      await loadFeeData();
    } catch (err: any) {
      setPayError(err.message || 'Failed to record simulated payment to PostgreSQL ledger.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
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
            <CreditCard size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Fee Invoices & Payment Ledger
            </h2>
            <span
              className={`ed-badge ${totalOutstanding === 0 ? 'ed-badge-success' : 'ed-badge-warning'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {totalOutstanding === 0 ? 'ALL INVOICES SETTLED' : 'OUTSTANDING DUES'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Institutional tuition fees, laboratory charges, and audited payment transaction receipts.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadFeeData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Ledger
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg, #fef2f2)',
            border: '1px solid var(--danger-border, #fecaca)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text, #dc2626)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Financial Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Total Billed Fees</span>
          <span className="value" style={{ color: 'var(--text-primary)' }}>
            ${totalInvoiced.toFixed(2)}
          </span>
          <span className="subtitle">Annual Academic Session</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Total Amount Paid</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>
            ${totalPaid.toFixed(2)}
          </span>
          <span className="subtitle">Settled with verified receipts</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Outstanding Balance</span>
          <span className="value" style={{ color: totalOutstanding > 0 ? 'var(--danger-solid)' : 'var(--success-solid)' }}>
            ${totalOutstanding.toFixed(2)}
          </span>
          <span className="subtitle">{totalOutstanding === 0 ? 'Zero outstanding liability' : 'Payment due before exams'}</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Invoice Count</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>
            {invoices.length} Invoices
          </span>
          <span className="subtitle">Audited in PostgreSQL</span>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="ed-card">
        <div className="ed-card-header">
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Student Invoice History</span>
          <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.70rem' }}>
            PRD Mode: Simulated Payment Gateway
          </span>
        </div>

        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
              <div>Loading financial records from PostgreSQL...</div>
            </div>
          ) : invoices.length > 0 ? (
            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Fee Head / Description</th>
                    <th>Due Date</th>
                    <th>Amount Due</th>
                    <th>Amount Paid</th>
                    <th>Balance Due</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => {
                    const balance = Math.max(0, (inv.amountDue || 0) - (inv.amountPaid || 0));
                    const isPaid = inv.status === 'PAID' || balance === 0;

                    return (
                      <tr key={inv.id}>
                        <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                          {inv.invoiceNumber || inv.id.slice(0, 8)}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{inv.feeStructureHead || 'Tuition & Academic Services'}</div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Class: {inv.className || 'Grade 10'}</div>
                        </td>
                        <td style={{ fontSize: '0.84rem' }}>
                          {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : 'End of Month'}
                        </td>
                        <td style={{ fontWeight: 600 }}>${(inv.amountDue || 0).toFixed(2)}</td>
                        <td style={{ color: 'var(--success-solid)', fontWeight: 600 }}>${(inv.amountPaid || 0).toFixed(2)}</td>
                        <td style={{ color: balance > 0 ? 'var(--danger-solid)' : 'var(--text-muted)', fontWeight: 700 }}>
                          ${balance.toFixed(2)}
                        </td>
                        <td>
                          <span
                            className={`ed-badge ${isPaid ? 'ed-badge-success' : balance < inv.amountDue ? 'ed-badge-warning' : 'ed-badge-danger'}`}
                          >
                            {isPaid ? 'PAID' : balance < inv.amountDue ? 'PARTIAL' : 'UNPAID'}
                          </span>
                        </td>
                        <td>
                          {!isPaid ? (
                            <button
                              className="ed-btn ed-btn-sm ed-btn-primary"
                              onClick={() => openPayModal(inv)}
                            >
                              Pay Now (Simulated)
                            </button>
                          ) : (
                            <button
                              className="ed-btn ed-btn-sm ed-btn-secondary"
                              onClick={() => window.print()}
                              title="Print payment receipt"
                            >
                              <Receipt size={13} /> Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Receipt size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                No Fee Invoices Found
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                There are no active or historical invoices recorded for this student account.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simulated Payment Modal */}
      {selectedInvoice && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: 'var(--space-4)',
          }}
        >
          <div
            className="ed-card ed-modal-container"
            style={{
              width: '100%',
              maxWidth: '520px',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="ed-card-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <span className="ed-badge ed-badge-warning" style={{ marginBottom: '4px', fontSize: '0.68rem' }}>
                  SIMULATED PAYMENT
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Settle Invoice: {selectedInvoice.invoiceNumber}
                </h3>
              </div>
              <button className="ed-btn-icon" onClick={() => setSelectedInvoice(null)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body">
              {paySuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success-bg)',
                      border: '2px solid var(--success-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto var(--space-3)',
                      color: 'var(--success-text)',
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                    Payment Processed Successfully!
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    Your simulated payment has been recorded in the database ledger with full audit trail.
                  </p>

                  <div
                    style={{
                      margin: 'var(--space-4) auto',
                      padding: '12px 14px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      fontSize: '0.82rem',
                      textAlign: 'left',
                    }}
                  >
                    <div><strong>Reference:</strong> {paySuccess.receiptNumber || paySuccess.transactionReference || 'SIM-TXN-REC'}</div>
                    <div><strong>Amount Paid:</strong> ${parseFloat(payAmount).toFixed(2)}</div>
                    <div><strong>Status:</strong> Cleared in PostgreSQL</div>
                  </div>

                  <button
                    className="ed-btn ed-btn-primary"
                    onClick={() => setSelectedInvoice(null)}
                  >
                    Close & View Updated Ledger
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSimulatePayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {payError && (
                    <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.82rem' }}>
                      {payError}
                    </div>
                  )}

                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.84rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div><strong>Fee Description:</strong> {selectedInvoice.feeStructureHead}</div>
                    <div><strong>Total Due:</strong> ${(selectedInvoice.amountDue || 0).toFixed(2)}</div>
                    <div><strong>Outstanding Balance:</strong> ${Math.max(0, (selectedInvoice.amountDue || 0) - (selectedInvoice.amountPaid || 0)).toFixed(2)}</div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Payment Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="ed-input"
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Simulated Payment Method
                    </label>
                    <select
                      className="ed-input"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="ONLINE_CARD">Online Credit/Debit Card (Simulated)</option>
                      <option value="NET_BANKING">Institutional Net Banking (Simulated)</option>
                      <option value="UPI">UPI Direct Instant (Simulated)</option>
                    </select>
                  </div>

                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
                    Notice: In accordance with EduNexa development protocols, this simulates payment execution without billing real cards, recording genuine atomic mutations in PostgreSQL.
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="ed-btn ed-btn-secondary"
                      onClick={() => setSelectedInvoice(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={paying}
                      className="ed-btn ed-btn-primary"
                    >
                      {paying ? 'Processing...' : 'Authorize Payment'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentFeesPage;

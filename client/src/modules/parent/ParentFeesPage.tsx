import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Users,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  Printer,
  X,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { coreApi, operationsApi } from '../../services/api.js';
import { downloadFeeReceiptPdf, downloadFeeInvoicePdf } from '../../services/pdfGenerator.js';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

interface Ward {
  id: string;
  studentProfileId: string;
  admissionNumber: string;
  name: string;
  grade: string;
  className: string;
  sectionName: string;
  rollNumber: number;
}

export const ParentFeesPage: React.FC = () => {
  const [children, setChildren] = useState<Ward[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [errorChildren, setErrorChildren] = useState<string | null>(null);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Payment Modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('ONLINE');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  // Receipt Modal
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<any>(null);

  const loadChildren = async () => {
    try {
      setLoadingChildren(true);
      setErrorChildren(null);
      const res = await coreApi.getParentChildren();
      const mapped = (res || []).map((c: any) => ({
        id: c.id || c.studentProfileId,
        studentProfileId: c.studentProfileId || c.id,
        admissionNumber: c.admissionNumber,
        name: c.name || `${c.firstName} ${c.lastName}`.trim(),
        grade: c.grade || `${c.className}-${c.sectionName}`,
        className: c.className,
        sectionName: c.sectionName,
        rollNumber: c.rollNumber || 1,
      }));
      setChildren(mapped);
      if (mapped.length > 0) {
        loadInvoices(mapped[0].id);
      }
    } catch (err: any) {
      setErrorChildren(err.message || 'Failed to retrieve registered children records.');
    } finally {
      setLoadingChildren(false);
    }
  };

  const loadInvoices = async (childId: string) => {
    try {
      setLoadingInvoices(true);
      setInvoiceError(null);
      const data = await operationsApi.listFeeInvoices({ studentProfileId: childId });
      setInvoices(data || []);
    } catch (err: any) {
      console.warn('Fee invoices error:', err);
      setInvoices([]);
      setInvoiceError(err.message || 'Failed to retrieve fee invoice records from database.');
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleSelectChild = (idx: number) => {
    setSelectedChildIndex(idx);
    setPaymentSuccess(null);
    if (children[idx]) {
      loadInvoices(children[idx].id);
    }
  };

  const selectedChild = children[selectedChildIndex];

  // Aggregated calculations from real database invoice records
  let totalInvoiced = 0;
  let totalPaid = 0;
  let totalOutstanding = 0;

  for (const inv of invoices) {
    totalInvoiced += inv.amountDue || 0;
    totalPaid += inv.amountPaid || 0;
    totalOutstanding += Math.max(0, (inv.amountDue || 0) - (inv.amountPaid || 0) - (inv.discountApplied || 0));
  }

  // All payment transactions extracted from real invoice payments
  const allPayments: any[] = [];
  for (const inv of invoices) {
    if (inv.payments && Array.isArray(inv.payments)) {
      for (const p of inv.payments) {
        allPayments.push({
          ...p,
          invoiceNumber: inv.invoiceNumber,
          feeStructureHead: inv.feeStructureHead,
          studentName: inv.studentName,
          studentProfileId: inv.studentProfileId,
          className: inv.className,
        });
      }
    }
  }

  const handleOpenPayment = (inv: any) => {
    const due = Math.max(0, inv.amountDue - inv.amountPaid - (inv.discountApplied || 0));
    setSelectedInvoice(inv);
    setPaymentAmount(due);
    setPaymentMethod('ONLINE');
    setTransactionRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPaymentSuccess(null);
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setSubmittingPayment(true);
      setPaymentError(null);

      await operationsApi.recordFeePayment({
        invoiceId: selectedInvoice.id,
        amountPaid: Number(paymentAmount),
        paymentMethod,
        transactionRef,
        notes: `Parent online fee remittance via gateway reference ${transactionRef}`,
      });

      setPaymentSuccess(`Payment of ₹ ${Number(paymentAmount).toLocaleString()} committed successfully!`);
      if (selectedChild) {
        loadInvoices(selectedChild.id);
      }
      setTimeout(() => {
        setShowPaymentModal(false);
      }, 1800);
    } catch (err: any) {
      setPaymentError(err.message || 'Payment transaction failed. Please check the amount and try again.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleOpenReceipt = (receipt: any) => {
    setActiveReceipt(receipt);
    setShowReceiptModal(true);
  };

  return (
    <div className="ed-page">
      <Breadcrumbs
        items={[
          { label: 'Parent Portal', href: '/parent' },
          { label: 'Fee Payments & Invoices' },
        ]}
      />

      {/* Header */}
      <div className="ed-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CreditCard size={24} style={{ color: 'var(--primary-600)' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Fee Invoices, Receipts & Online Payments
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Certified institutional fee ledger, term invoices, and direct atomic fee settlement records.
            </p>
          </div>

          <button
            className="ed-btn ed-btn-secondary"
            onClick={() => selectedChild && loadInvoices(selectedChild.id)}
            disabled={loadingInvoices || !selectedChild}
          >
            <RefreshCw size={14} className={loadingInvoices ? 'animate-spin' : ''} /> Reload Ledger
          </button>
        </div>

        {/* Child Selector Tabs */}
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            SELECT WARD:
          </span>
          {loadingChildren ? (
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Loading wards...</span>
          ) : children.length === 0 ? (
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No registered children linked</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {children.map((child, idx) => (
                <button
                  key={child.id}
                  onClick={() => handleSelectChild(idx)}
                  className={`ed-btn ed-btn-sm ${selectedChildIndex === idx ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Users size={13} />
                  <span>{child.name}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.74rem' }}>({child.grade})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {errorChildren && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
          <AlertTriangle size={16} />
          <span>{errorChildren}</span>
        </div>
      )}

      {selectedChild && (
        <>
          {/* Key Financial Metrics Overview */}
          <div className="ed-grid-4" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="ed-metric-tile">
              <span className="label">Total Invoiced</span>
              <span className="value" style={{ color: 'var(--primary-700)' }}>
                ₹ {totalInvoiced.toLocaleString()}
              </span>
              <span className="subtitle">All Academic Term Dues</span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Remitted Fees</span>
              <span className="value" style={{ color: 'var(--teal-accent)' }}>
                ₹ {totalPaid.toLocaleString()}
              </span>
              <span className="subtitle">
                <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> Reconciled Receipts
              </span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Outstanding Balance</span>
              <span className="value" style={{ color: totalOutstanding > 0 ? 'var(--warning-solid)' : 'var(--success-solid)' }}>
                ₹ {totalOutstanding.toLocaleString()}
              </span>
              <span className="subtitle">
                {totalOutstanding > 0 ? 'Due for immediate settlement' : 'Account fully settled'}
              </span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Ledger Standing</span>
              <span className="value" style={{ fontSize: '1rem', color: totalOutstanding === 0 ? 'var(--success-text)' : 'var(--warning-text)' }}>
                {totalOutstanding === 0 ? 'Current • Clear' : 'Pending Payment'}
              </span>
              <span className="subtitle">Academic Year 2026–2027</span>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="ed-card" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="ed-card-header">
              <div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  Institutional Term Invoices
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {selectedChild.name} • Admission: {selectedChild.admissionNumber}
                </p>
              </div>
            </div>

            {loadingInvoices ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>Retrieving fee invoices from database...</p>
              </div>
            ) : invoices.length > 0 ? (
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Fee Component</th>
                      <th>Class</th>
                      <th>Due Date</th>
                      <th>Amount Due</th>
                      <th>Amount Paid</th>
                      <th>Balance Due</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      const balance = Math.max(0, inv.amountDue - inv.amountPaid - (inv.discountApplied || 0));
                      let badge = <span className="ed-badge ed-badge-success">PAID</span>;
                      if (inv.status === 'PARTIALLY_PAID') {
                        badge = <span className="ed-badge ed-badge-warning">PARTIAL</span>;
                      } else if (inv.status === 'UNPAID') {
                        badge = <span className="ed-badge ed-badge-danger">UNPAID</span>;
                      } else if (inv.status === 'OVERDUE') {
                        badge = <span className="ed-badge ed-badge-danger">OVERDUE</span>;
                      }

                      return (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>
                            {inv.invoiceNumber}
                          </td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {inv.feeStructureHead}
                          </td>
                          <td>{inv.className}</td>
                          <td>{inv.dueDate}</td>
                          <td style={{ fontWeight: 700 }}>₹ {inv.amountDue.toLocaleString()}</td>
                          <td style={{ fontWeight: 600, color: 'var(--success-text)' }}>
                            ₹ {inv.amountPaid.toLocaleString()}
                          </td>
                          <td style={{ fontWeight: 800, color: balance > 0 ? 'var(--danger-text)' : 'var(--text-muted)' }}>
                            ₹ {balance.toLocaleString()}
                          </td>
                          <td>{badge}</td>
                          <td>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              {balance > 0 ? (
                                <button
                                  className="ed-btn ed-btn-sm ed-btn-primary"
                                  onClick={() => handleOpenPayment(inv)}
                                >
                                  Pay Now
                                </button>
                              ) : (
                                <button
                                  className="ed-btn ed-btn-sm ed-btn-secondary"
                                  onClick={() => {
                                    if (inv.payments && inv.payments.length > 0) {
                                      handleOpenReceipt({
                                        ...inv.payments[0],
                                        invoiceNumber: inv.invoiceNumber,
                                        feeStructureHead: inv.feeStructureHead,
                                        studentName: inv.studentName || selectedChild?.name,
                                        studentProfileId: inv.studentProfileId || selectedChild?.admissionNumber,
                                        className: inv.className || selectedChild?.grade,
                                      });
                                    }
                                  }}
                                  disabled={!inv.payments || inv.payments.length === 0}
                                >
                                  <Receipt size={13} /> Receipt
                                </button>
                              )}
                              <button
                                className="ed-btn ed-btn-sm ed-btn-secondary"
                                title="Download Official Invoice PDF"
                                onClick={() => {
                                  downloadFeeInvoicePdf({
                                    schoolName: 'Apex Academy of Sciences & Arts',
                                    invoiceNumber: inv.invoiceNumber,
                                    dueDate: inv.dueDate,
                                    studentName: inv.studentName || selectedChild?.name || 'Aarav Sharma',
                                    admissionNumber: inv.studentProfileId || selectedChild?.admissionNumber || 'ADM-2026-0042',
                                    className: inv.className || selectedChild?.grade || 'Grade 10-A',
                                    feeHead: inv.feeStructureHead || 'Secondary Tuition & Academic Development',
                                    amountDue: inv.amountDue,
                                    amountPaid: inv.amountPaid,
                                    balanceDue: balance,
                                    status: inv.status,
                                  });
                                }}
                              >
                                <Download size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CreditCard size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  No Fee Invoices Found
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                  There are no active or historical invoices generated for this student. Invoices are billed per academic session.
                </p>
              </div>
            )}
          </div>

          {/* Payment Receipts History */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  Official Payment Transaction Ledger & Receipts
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Persisted transaction receipts for tax compliance and audit verification
                </p>
              </div>
            </div>

            {allPayments.length > 0 ? (
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Payment Date</th>
                      <th>Invoice Reference</th>
                      <th>Fee Component</th>
                      <th>Remitted Amount</th>
                      <th>Payment Method</th>
                      <th>Transaction Ref</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPayments.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>
                          {p.receiptNumber}
                        </td>
                        <td>{p.date}</td>
                        <td style={{ fontWeight: 600 }}>{p.invoiceNumber}</td>
                        <td>{p.feeStructureHead}</td>
                        <td style={{ fontWeight: 800, color: 'var(--success-text)' }}>
                          ₹ {Number(p.amountPaid).toLocaleString()}
                        </td>
                        <td>
                          <span className="ed-badge ed-badge-neutral">{p.paymentMethod}</span>
                        </td>
                        <td style={{ fontSize: '0.82rem', fontFamily: 'monospace' }}>
                          {p.transactionRef || 'DIRECT'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              className="ed-btn ed-btn-sm ed-btn-secondary"
                              title="View receipt details"
                              onClick={() => handleOpenReceipt(p)}
                            >
                              View
                            </button>
                            <button
                              className="ed-btn ed-btn-sm ed-btn-primary"
                              title="Download official PDF receipt"
                              onClick={() => {
                                downloadFeeReceiptPdf({
                                  schoolName: 'Apex Academy of Sciences & Arts',
                                  receiptNumber: p.receiptNumber,
                                  invoiceNumber: p.invoiceNumber,
                                  date: p.date || new Date().toISOString().split('T')[0],
                                  studentName: p.studentName || selectedChild?.name || 'Aarav Sharma',
                                  admissionNumber: p.studentProfileId || selectedChild?.admissionNumber || 'ADM-2026-0042',
                                  className: p.className || selectedChild?.grade || 'Grade 10-A',
                                  feeHead: p.feeStructureHead || 'Secondary Tuition & Academic Development',
                                  amountPaid: Number(p.amountPaid),
                                  paymentMethod: p.paymentMethod || 'UPI',
                                  transactionRef: p.transactionRef || 'DIRECT',
                                  balanceRemaining: 0,
                                });
                              }}
                            >
                              <Download size={13} /> PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '36px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Receipt size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontWeight: 500 }}>No payment receipts recorded yet for this student.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="ed-modal-overlay" onClick={() => !submittingPayment && setShowPaymentModal(false)}>
          <div
            className="ed-modal-content"
            style={{ maxWidth: '480px', width: '100%', padding: 'var(--space-6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                  Online Fee Payment
                </h3>
              </div>
              <button
                className="ed-btn ed-btn-sm ed-btn-secondary"
                disabled={submittingPayment}
                onClick={() => setShowPaymentModal(false)}
              >
                <X size={14} />
              </button>
            </div>

            {paymentSuccess ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success-solid)', margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', fontWeight: 800, color: 'var(--text-primary)' }}>Payment Successful</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{paymentSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment}>
                {paymentError && (
                  <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.84rem', marginBottom: '16px' }}>
                    {paymentError}
                  </div>
                )}

                <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</div>
                  <div><strong>Component:</strong> {selectedInvoice.feeStructureHead}</div>
                  <div><strong>Student:</strong> {selectedChild?.name} ({selectedChild?.admissionNumber})</div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Remittance Amount (₹)
                  </label>
                  <input
                    type="number"
                    className="ed-input"
                    style={{ width: '100%', fontSize: '1.05rem', fontWeight: 700 }}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    max={selectedInvoice.amountDue - selectedInvoice.amountPaid}
                    min={1}
                    required
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Payment Method
                  </label>
                  <select
                    className="ed-input"
                    style={{ width: '100%' }}
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="ONLINE">Unified Payments Interface (UPI)</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="NET_BANKING">Net Banking (NEFT / RTGS)</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>
                    Transaction Reference
                  </label>
                  <input
                    type="text"
                    className="ed-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="ed-btn ed-btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px' }}
                  disabled={submittingPayment || paymentAmount <= 0}
                >
                  {submittingPayment ? 'Processing Remittance...' : `Confirm & Pay ₹ ${paymentAmount.toLocaleString()}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Official Receipt Modal */}
      {showReceiptModal && activeReceipt && (
        <div className="ed-modal-overlay" onClick={() => setShowReceiptModal(false)}>
          <div
            className="ed-modal-content"
            style={{ maxWidth: '580px', width: '100%', padding: 'var(--space-6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-default)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                  Apex Academy of Sciences & Arts
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Official Fee Payment Receipt • Accounts Department
                </p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="ed-btn ed-btn-sm ed-btn-primary"
                  onClick={() => {
                    downloadFeeReceiptPdf({
                      schoolName: 'Apex Academy of Sciences & Arts',
                      receiptNumber: activeReceipt.receiptNumber,
                      invoiceNumber: activeReceipt.invoiceNumber,
                      date: activeReceipt.date || new Date().toISOString().split('T')[0],
                      studentName: activeReceipt.studentName || selectedChild?.name || 'Aarav Sharma',
                      admissionNumber: activeReceipt.studentProfileId || selectedChild?.admissionNumber || 'ADM-2026-0042',
                      className: activeReceipt.className || selectedChild?.grade || 'Grade 10-A',
                      feeHead: activeReceipt.feeStructureHead || 'Secondary Tuition & Academic Development',
                      amountPaid: Number(activeReceipt.amountPaid),
                      paymentMethod: activeReceipt.paymentMethod || 'UPI',
                      transactionRef: activeReceipt.transactionRef || 'DIRECT',
                      balanceRemaining: 0,
                    });
                  }}
                >
                  <Download size={13} /> Download PDF
                </button>
                <button className="ed-btn ed-btn-sm ed-btn-secondary" onClick={() => window.print()}>
                  <Printer size={13} /> Print
                </button>
                <button className="ed-btn ed-btn-sm ed-btn-secondary" onClick={() => setShowReceiptModal(false)}>
                  <X size={13} /> Close
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div><strong>Receipt Number:</strong><br /><span style={{ color: 'var(--primary-700)', fontWeight: 700 }}>{activeReceipt.receiptNumber}</span></div>
              <div><strong>Payment Date:</strong><br />{activeReceipt.date}</div>
              <div><strong>Invoice Reference:</strong><br />{activeReceipt.invoiceNumber}</div>
              <div><strong>Fee Component:</strong><br />{activeReceipt.feeStructureHead}</div>
              <div><strong>Student Name:</strong><br />{activeReceipt.studentName || selectedChild?.name}</div>
              <div><strong>Admission No:</strong><br />{activeReceipt.studentProfileId || selectedChild?.admissionNumber}</div>
              <div><strong>Payment Mode:</strong><br />{activeReceipt.paymentMethod}</div>
              <div><strong>Transaction Ref:</strong><br /><span style={{ fontFamily: 'monospace' }}>{activeReceipt.transactionRef || 'N/A'}</span></div>
            </div>

            <div style={{ border: '2px solid var(--success-border)', backgroundColor: 'var(--success-bg)', borderRadius: 'var(--radius-sm)', padding: '16px', textAlign: 'center', marginBottom: '20px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--success-text)', fontWeight: 600 }}>TOTAL RECEIVED & CLEARED</span>
              <h2 style={{ margin: '4px 0 0', fontSize: '1.8rem', fontWeight: 900, color: 'var(--success-text)' }}>
                ₹ {Number(activeReceipt.amountPaid).toLocaleString()}
              </h2>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-default)', paddingTop: '14px' }}>
              <div>Authorized Institution Ledger Receipt</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ShieldCheck size={14} style={{ color: 'var(--success-solid)' }} /> Digitally Certified
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

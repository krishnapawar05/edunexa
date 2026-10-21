import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Printer,
  CheckCircle2,
  AlertTriangle,
  History,
  Tag,
  Download,
  Calendar,
  User,
  GraduationCap,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { operationsApi, coreApi } from '../../services/api.js';
import { downloadFeeReceiptPdf, downloadFeeInvoicePdf } from '../../services/pdfGenerator.js';

interface InvoiceRecord {
  id: string;
  invoiceNumber: string;
  studentName: string;
  studentProfileId: string;
  actualStudentProfileId?: string;
  className: string;
  feeStructureHead: string;
  amountDue: number;
  amountPaid: number;
  discountApplied: number;
  dueDate: string;
  status: 'PAID' | 'PARTIALLY_PAID' | 'OVERDUE' | 'UNPAID';
  payments: Array<{
    id: string;
    receiptNumber: string;
    amountPaid: number;
    paymentMethod: string;
    transactionRef?: string;
    date: string;
    notes?: string;
    isSimulated: boolean;
  }>;
  auditTrail: Array<{
    action: string;
    amount?: number;
    authorizedByUserId?: string;
    reason?: string;
    timestamp: string;
  }>;
}

export const AccountsInvoicesPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [invoices, setInvoices] = useState<InvoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Modals state
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<InvoiceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [paymentTxRef, setPaymentTxRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // New Invoice Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [invoiceFeeHead, setInvoiceFeeHead] = useState('Quarter Tuition Fee');
  const [invoiceAmountDue, setInvoiceAmountDue] = useState<number>(25000);
  const [invoiceDueDate, setInvoiceDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [isSubmittingInvoice, setIsSubmittingInvoice] = useState(false);

  // Concession Modal
  const [concessionInvoice, setConcessionInvoice] = useState<InvoiceRecord | null>(null);
  const [concessionAmount, setConcessionAmount] = useState<number>(5000);
  const [concessionReason, setConcessionReason] = useState('');
  const [isSubmittingConcession, setIsSubmittingConcession] = useState(false);

  // Audit / History Modal
  const [historyInvoice, setHistoryInvoice] = useState<InvoiceRecord | null>(null);

  // Printable Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<{
    receiptNo: string;
    studentName: string;
    admissionNo: string;
    invoiceNo: string;
    amount: number;
    method: string;
    date: string;
    isSimulated: boolean;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadInvoices = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await operationsApi.listFeeInvoices();
      if (data) {
        setInvoices(data as InvoiceRecord[]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load fee invoices from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const data = await coreApi.listStudents();
      if (Array.isArray(data)) {
        setEnrolledStudents(data);
      }
    } catch (err) {
      console.warn('Student list loading notice:', err);
    }
  };

  useEffect(() => {
    loadInvoices();
    loadStudents();
  }, []);

  const openPaymentModal = (inv: InvoiceRecord) => {
    setPaymentModalInvoice(inv);
    const balance = Math.max(0, inv.amountDue - inv.amountPaid - inv.discountApplied);
    setPaymentAmount(balance);
    setPaymentTxRef(`TXN-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNotes('');
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalInvoice) return;

    const remaining = paymentModalInvoice.amountDue - paymentModalInvoice.amountPaid - paymentModalInvoice.discountApplied;
    if (paymentAmount <= 0 || paymentAmount > remaining) {
      showToast(`Invalid payment amount. Must be between ₹1 and ₹${remaining.toLocaleString('en-IN')}`);
      return;
    }

    try {
      setIsSubmittingPayment(true);
      const res = await operationsApi.recordFeePayment({
        invoiceId: paymentModalInvoice.id,
        amountPaid: paymentAmount,
        paymentMethod,
        transactionRef: paymentTxRef || `REF-${Date.now()}`,
        notes: paymentNotes,
        isSimulated: true,
      });

      const confirmedReceiptNo = res.data?.receiptNumber || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

      setActiveReceipt({
        receiptNo: confirmedReceiptNo,
        studentName: paymentModalInvoice.studentName,
        admissionNo: paymentModalInvoice.studentProfileId,
        invoiceNo: paymentModalInvoice.invoiceNumber,
        amount: paymentAmount,
        method: paymentMethod,
        date: new Date().toLocaleDateString('en-GB'),
        isSimulated: true,
      });

      setPaymentModalInvoice(null);
      showToast(`Payment of ₹${paymentAmount.toLocaleString('en-IN')} confirmed. Receipt #${confirmedReceiptNo} generated.`);
      await loadInvoices();
    } catch (err: any) {
      showToast('Payment recording failed: ' + err.message);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) {
      showToast('Please select a student.');
      return;
    }

    try {
      setIsSubmittingInvoice(true);
      await operationsApi.createFeeInvoice({
        studentProfileId: selectedStudentId,
        feeHead: invoiceFeeHead,
        amountDue: invoiceAmountDue,
        dueDate: invoiceDueDate,
      });

      setIsCreateModalOpen(false);
      showToast(`Fee invoice successfully generated and persisted in PostgreSQL.`);
      await loadInvoices();
    } catch (err: any) {
      showToast('Failed to create invoice: ' + err.message);
    } finally {
      setIsSubmittingInvoice(false);
    }
  };

  const handleApplyConcession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!concessionInvoice) return;

    try {
      setIsSubmittingConcession(true);
      await operationsApi.applyFeeConcession({
        invoiceId: concessionInvoice.id,
        concessionAmount,
        reason: concessionReason,
      });

      setConcessionInvoice(null);
      showToast(`Concession of ₹${concessionAmount.toLocaleString('en-IN')} recorded in audit trail.`);
      await loadInvoices();
    } catch (err: any) {
      showToast('Concession failed: ' + err.message);
    } finally {
      setIsSubmittingConcession(false);
    }
  };

  // Distinct classes for filter
  const classesList = Array.from(new Set(invoices.map((i) => i.className).filter(Boolean)));

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.studentProfileId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PAID' && i.status === 'PAID') ||
      (statusFilter === 'PARTIAL' && i.status === 'PARTIALLY_PAID') ||
      (statusFilter === 'OVERDUE' && (i.status === 'OVERDUE' || (i.status === 'UNPAID' && new Date(i.dueDate) < new Date()))) ||
      (statusFilter === 'UNPAID' && i.status === 'UNPAID');

    const matchesClass = classFilter === 'ALL' || i.className === classFilter;

    return matchesSearch && matchesStatus && matchesClass;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 9999,
            fontSize: '0.86rem',
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2>Student Invoices & Fee Ledger</h2>
            <Badge variant="teal">{invoices.length} Invoices in DB</Badge>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0' }}>
            Manage student billings, record payments, apply merit concessions, and view audit trails for {branding.shortName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadInvoices}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Generate Fee Invoice
          </Button>
        </div>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.86rem' }}>
          {errorMsg}
        </div>
      )}

      {/* Invoices Table Card */}
      <div className="ed-card" style={{ padding: 0 }}>
        {/* Filter Controls Bar */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-default)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '260px' }}>
            <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                placeholder="Search invoice #, student name, admission #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="ed-input"
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ed-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Statuses</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="OVERDUE">Overdue / Arrears</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            {classesList.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Class:</span>
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className="ed-select"
                  style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
                >
                  <option value="ALL">All Classes</option>
                  {classesList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <span>Loading student fee invoices from PostgreSQL...</span>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Receipt size={36} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
              <p style={{ fontWeight: 600 }}>No Invoices Found</p>
              <p style={{ fontSize: '0.82rem' }}>No fee records match the specified search or filters.</p>
            </div>
          ) : (
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Student & Admission</th>
                  <th>Class</th>
                  <th>Fee Head</th>
                  <th>Due Date</th>
                  <th>Invoiced (₹)</th>
                  <th>Paid (₹)</th>
                  <th>Balance (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const balance = Math.max(0, inv.amountDue - inv.amountPaid - inv.discountApplied);
                  const isOverdue = inv.status !== 'PAID' && new Date(inv.dueDate) < new Date();

                  return (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {inv.invoiceNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.studentName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{inv.studentProfileId}</div>
                      </td>
                      <td>{inv.className}</td>
                      <td style={{ fontSize: '0.82rem' }}>{inv.feeStructureHead}</td>
                      <td style={{ fontSize: '0.80rem', color: isOverdue ? 'var(--danger-solid)' : 'var(--text-secondary)' }}>
                        {inv.dueDate}
                      </td>
                      <td style={{ fontWeight: 600 }}>₹{inv.amountDue.toLocaleString('en-IN')}</td>
                      <td style={{ color: 'var(--success-solid)', fontWeight: 600 }}>
                        ₹{inv.amountPaid.toLocaleString('en-IN')}
                      </td>
                      <td style={{ fontWeight: 700, color: balance > 0 ? 'var(--danger-solid)' : 'var(--text-muted)' }}>
                        ₹{balance.toLocaleString('en-IN')}
                      </td>
                      <td>
                        {inv.status === 'PAID' && <Badge variant="success">Paid in Full</Badge>}
                        {inv.status === 'PARTIALLY_PAID' && <Badge variant="warning">Partially Paid</Badge>}
                        {inv.status === 'UNPAID' && !isOverdue && <Badge variant="neutral">Unpaid</Badge>}
                        {(inv.status === 'OVERDUE' || isOverdue) && inv.status !== 'PAID' && (
                          <Badge variant="danger">Overdue</Badge>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          {balance > 0 ? (
                            <button
                              onClick={() => openPaymentModal(inv)}
                              className="ed-btn ed-btn-primary"
                              style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                            >
                              Record Payment
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                const latestPayment = inv.payments?.[0];
                                setActiveReceipt({
                                  receiptNo: latestPayment?.receiptNumber || `REC-${inv.invoiceNumber.replace('INV-', '')}`,
                                  studentName: inv.studentName,
                                  admissionNo: inv.studentProfileId,
                                  invoiceNo: inv.invoiceNumber,
                                  amount: inv.amountDue,
                                  method: latestPayment?.paymentMethod || 'Institutional Clearing',
                                  date: latestPayment?.date || inv.dueDate,
                                  isSimulated: true,
                                });
                              }}
                              className="ed-btn ed-btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '3px' }}
                            >
                              <Receipt size={12} /> Receipt
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setConcessionInvoice(inv);
                              setConcessionAmount(Math.min(5000, balance || 1000));
                              setConcessionReason('');
                            }}
                            title="Apply fee concession or scholarship"
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '4px 6px', fontSize: '0.74rem' }}
                            disabled={balance === 0}
                          >
                            <Tag size={12} />
                          </button>

                          <button
                            onClick={() => setHistoryInvoice(inv)}
                            title="View audit trail and payment history"
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '4px 6px', fontSize: '0.74rem' }}
                          >
                            <History size={12} />
                          </button>

                          <button
                            onClick={() => {
                              downloadFeeInvoicePdf({
                                schoolName: branding.schoolName || 'Apex Academy of Sciences & Arts',
                                invoiceNumber: inv.invoiceNumber,
                                dueDate: inv.dueDate,
                                studentName: inv.studentName,
                                admissionNumber: inv.studentProfileId,
                                className: inv.className,
                                feeHead: inv.feeStructureHead,
                                amountDue: inv.amountDue,
                                amountPaid: inv.amountPaid,
                                balanceDue: balance,
                                status: inv.status,
                              });
                            }}
                            title="Download Official Invoice PDF"
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '4px 6px', fontSize: '0.74rem' }}
                          >
                            <Download size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal: Record Fee Payment */}
      <Modal
        isOpen={!!paymentModalInvoice}
        onClose={() => setPaymentModalInvoice(null)}
        title="Record Fee Payment & Issue Receipt"
        subtitle={`Invoice: ${paymentModalInvoice?.invoiceNumber} • Student: ${paymentModalInvoice?.studentName}`}
      >
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Total Invoiced:</span>
              <span style={{ fontWeight: 600 }}>₹{paymentModalInvoice?.amountDue.toLocaleString('en-IN')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
              <span>Already Paid:</span>
              <span style={{ color: 'var(--success-solid)', fontWeight: 600 }}>
                ₹{paymentModalInvoice?.amountPaid.toLocaleString('en-IN')}
              </span>
            </div>
            {paymentModalInvoice && paymentModalInvoice.discountApplied > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
                <span>Concession / Scholarship:</span>
                <span style={{ color: 'var(--primary-700)', fontWeight: 600 }}>
                  ₹{paymentModalInvoice.discountApplied.toLocaleString('en-IN')}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.90rem', marginTop: '6px', fontWeight: 700 }}>
              <span>Remaining Balance:</span>
              <span style={{ color: 'var(--danger-solid)' }}>
                ₹{paymentModalInvoice ? (paymentModalInvoice.amountDue - paymentModalInvoice.amountPaid - paymentModalInvoice.discountApplied).toLocaleString('en-IN') : 0}
              </span>
            </div>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Payment Amount (₹)</label>
            <input
              type="number"
              className="ed-input"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(Number(e.target.value))}
              max={paymentModalInvoice ? paymentModalInvoice.amountDue - paymentModalInvoice.amountPaid - paymentModalInvoice.discountApplied : 0}
              min={1}
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Payment Method</label>
            <select
              className="ed-select"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="NET_BANKING">Net Banking / IMPS Direct</option>
              <option value="CASH">Institutional Cash Counter</option>
              <option value="CHEQUE">Bank Draft / Cheque</option>
              <option value="CREDIT_CARD">Credit / Debit Card</option>
            </select>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Transaction / Bank Reference</label>
            <input
              type="text"
              className="ed-input"
              value={paymentTxRef}
              onChange={(e) => setPaymentTxRef(e.target.value)}
              placeholder="e.g. UPI-SIM-98214 or CSH-001"
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Audited Notes (Optional)</label>
            <input
              type="text"
              className="ed-input"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
              placeholder="e.g. Paid at Accounts Bureau counter"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setPaymentModalInvoice(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingPayment}>
              {isSubmittingPayment ? 'Recording to DB...' : 'Record Payment & Issue Receipt'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Generate New Fee Invoice */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Generate Official Student Fee Invoice"
        subtitle="Issue and persist an official tuition billing record in PostgreSQL"
      >
        <form onSubmit={handleCreateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Enrolled Student</label>
            <select
              className="ed-select"
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              required
            >
              <option value="">Select Enrolled Student...</option>
              {enrolledStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName} ({s.admissionNumber || s.className || 'Student'})
                </option>
              ))}
            </select>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Fee Head / Billing Category</label>
            <select
              className="ed-select"
              value={invoiceFeeHead}
              onChange={(e) => setInvoiceFeeHead(e.target.value)}
              required
            >
              <option value="Quarter Tuition Fee">Quarter Tuition Fee</option>
              <option value="Science & Robotics Laboratory Facility">Science & Robotics Laboratory Facility</option>
              <option value="ICT & AI Computer Science Lab">ICT & AI Computer Science Lab</option>
              <option value="Sports & Physical Development Head">Sports & Physical Development Head</option>
              <option value="Annual Library & Resources">Annual Library & Resources</option>
              <option value="Board Examination & Practical Registration">Board Examination & Practical Registration</option>
            </select>
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Amount Due (₹)</label>
            <input
              type="number"
              className="ed-input"
              value={invoiceAmountDue}
              onChange={(e) => setInvoiceAmountDue(Number(e.target.value))}
              min={100}
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Due Date</label>
            <input
              type="date"
              className="ed-input"
              value={invoiceDueDate}
              onChange={(e) => setInvoiceDueDate(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingInvoice}>
              {isSubmittingInvoice ? 'Generating Invoice...' : 'Generate & Persist Invoice'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Apply Fee Concession */}
      <Modal
        isOpen={!!concessionInvoice}
        onClose={() => setConcessionInvoice(null)}
        title="Apply Fee Concession or Scholarship"
        subtitle={`Invoice: ${concessionInvoice?.invoiceNumber} • Student: ${concessionInvoice?.studentName}`}
      >
        <form onSubmit={handleApplyConcession} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Concession Amount (₹)</label>
            <input
              type="number"
              className="ed-input"
              value={concessionAmount}
              onChange={(e) => setConcessionAmount(Number(e.target.value))}
              max={concessionInvoice ? concessionInvoice.amountDue - concessionInvoice.amountPaid - concessionInvoice.discountApplied : 0}
              min={1}
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Mandatory Auditable Rationale</label>
            <textarea
              className="ed-input"
              rows={3}
              value={concessionReason}
              onChange={(e) => setConcessionReason(e.target.value)}
              placeholder="e.g. Merit scholarship awarded by Academic Council for state rank"
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setConcessionInvoice(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmittingConcession}>
              {isSubmittingConcession ? 'Applying...' : 'Apply Audited Concession'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Payment History & Audit Trail */}
      {historyInvoice && (
        <Modal
          isOpen={!!historyInvoice}
          onClose={() => setHistoryInvoice(null)}
          title="Payment History & Financial Audit Trail"
          subtitle={`Invoice: ${historyInvoice.invoiceNumber} • Student: ${historyInvoice.studentName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <h5 style={{ margin: '0 0 var(--space-2)' }}>Recorded Payments</h5>
              {(!historyInvoice.payments || historyInvoice.payments.length === 0) ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No payments recorded for this invoice yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {historyInvoice.payments.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '10px 14px',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.84rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600 }}>{p.receiptNumber} ({p.paymentMethod})</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Ref: {p.transactionRef || 'N/A'} • {p.date}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, color: 'var(--success-solid)' }}>
                        ₹{p.amountPaid.toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h5 style={{ margin: '0 0 var(--space-2)' }}>Audit Trail Ledger</h5>
              {(!historyInvoice.auditTrail || historyInvoice.auditTrail.length === 0) ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No audit events logged.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {historyInvoice.auditTrail.map((a, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '8px 12px',
                        borderLeft: '3px solid var(--primary-600)',
                        backgroundColor: 'var(--bg-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.80rem',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                        <span>{a.action}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>{new Date(a.timestamp).toLocaleString()}</span>
                      </div>
                      {a.reason && <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>{a.reason}</div>}
                      {a.amount && <div style={{ color: 'var(--primary-700)', fontWeight: 600 }}>Amount: ₹{a.amount.toLocaleString('en-IN')}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button variant="secondary" onClick={() => setHistoryInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Official Printable Fee Receipt */}
      {activeReceipt && (
        <Modal
          isOpen={!!activeReceipt}
          onClose={() => setActiveReceipt(null)}
          title="Official Fee Receipt"
          subtitle={`Receipt: ${activeReceipt.receiptNo}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div style={{ textAlign: 'center', padding: '16px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <CheckCircle2 size={36} style={{ color: 'var(--success-solid)', margin: '0 auto 8px' }} />
              <div style={{ fontWeight: 800, fontSize: '1.4rem', color: 'var(--primary-800)' }}>
                ₹{activeReceipt.amount.toLocaleString('en-IN')}.00
              </div>
              <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Payment Confirmed & Verified</div>
            </div>

            <div style={{ fontSize: '0.84rem', lineHeight: 1.8 }}>
              <div><strong>Receipt Number:</strong> {activeReceipt.receiptNo}</div>
              <div><strong>Invoice Reference:</strong> {activeReceipt.invoiceNo}</div>
              <div><strong>Student Name:</strong> {activeReceipt.studentName}</div>
              <div><strong>Admission No:</strong> {activeReceipt.admissionNo}</div>
              <div><strong>Payment Method:</strong> {activeReceipt.method}</div>
              <div><strong>Date of Clearing:</strong> {activeReceipt.date}</div>
              <div><strong>Institutional Seal:</strong> {branding.schoolName} Accounts Bureau</div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-3)' }}>
              <Button variant="secondary" onClick={() => setActiveReceipt(null)}>
                Close
              </Button>
              <Button
                variant="secondary"
                icon={<Download size={14} />}
                onClick={() => {
                  downloadFeeReceiptPdf({
                    schoolName: branding.schoolName || 'Apex Academy of Sciences & Arts',
                    receiptNumber: activeReceipt.receiptNo,
                    invoiceNumber: activeReceipt.invoiceNo,
                    date: activeReceipt.date,
                    studentName: activeReceipt.studentName,
                    admissionNumber: activeReceipt.admissionNo,
                    className: 'Secondary Wing',
                    feeHead: 'Tuition & Academic Development',
                    amountPaid: activeReceipt.amount,
                    paymentMethod: activeReceipt.method,
                    transactionRef: 'ACCOUNTS-OFFICE-CLEARING',
                    balanceRemaining: 0,
                  });
                }}
              >
                Download PDF
              </Button>
              <Button variant="primary" icon={<Printer size={14} />} onClick={() => window.print()}>
                Print Official Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

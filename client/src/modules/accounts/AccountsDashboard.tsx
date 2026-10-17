import React, { useState } from 'react';
import {
  CreditCard,
  Receipt,
  Search,
  Filter,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Printer,
  Download,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { Tabs } from '../../components/ui/Tabs.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

interface InvoiceRecord {
  id: string;
  invoiceNo: string;
  studentName: string;
  admissionNo: string;
  classGrade: string;
  term: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: 'PAID' | 'PARTIAL' | 'OVERDUE';
}

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-01',
    invoiceNo: 'INV-2026-0412',
    studentName: 'Aarav Sharma',
    admissionNo: 'ADM-2026-0042',
    classGrade: 'Grade 10-A',
    term: 'Term 2 (Oct–Dec 2026)',
    totalAmount: 45000,
    paidAmount: 45000,
    dueDate: '2026-10-15',
    status: 'PAID',
  },
  {
    id: 'inv-02',
    invoiceNo: 'INV-2026-0413',
    studentName: 'Ananya Deshmukh',
    admissionNo: 'ADM-2026-0089',
    classGrade: 'Grade 10-A',
    term: 'Term 2 (Oct–Dec 2026)',
    totalAmount: 45000,
    paidAmount: 20000,
    dueDate: '2026-10-15',
    status: 'PARTIAL',
  },
  {
    id: 'inv-03',
    invoiceNo: 'INV-2026-0414',
    studentName: 'Rohan Verma',
    admissionNo: 'ADM-2026-0104',
    classGrade: 'Grade 9-B',
    term: 'Term 2 (Oct–Dec 2026)',
    totalAmount: 42000,
    paidAmount: 0,
    dueDate: '2026-10-10',
    status: 'OVERDUE',
  },
  {
    id: 'inv-04',
    invoiceNo: 'INV-2026-0415',
    studentName: 'Maya Sharma',
    admissionNo: 'ADM-2026-0112',
    classGrade: 'Grade 7-B',
    term: 'Term 2 (Oct–Dec 2026)',
    totalAmount: 38000,
    paidAmount: 38000,
    dueDate: '2026-10-15',
    status: 'PAID',
  },
  {
    id: 'inv-05',
    invoiceNo: 'INV-2026-0416',
    studentName: 'Ishaan Gupta',
    admissionNo: 'ADM-2026-0155',
    classGrade: 'Grade 11-A',
    term: 'Term 2 (Oct–Dec 2026)',
    totalAmount: 52000,
    paidAmount: 26000,
    dueDate: '2026-10-20',
    status: 'PARTIAL',
  },
];

export const AccountsDashboard: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [activeTab, setActiveTab] = useState<'invoices' | 'structures' | 'reconciliation'>('invoices');
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Payment Recording State
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [recentReceipt, setRecentReceipt] = useState<{
    receiptNo: string;
    studentName: string;
    amount: number;
    method: string;
    date: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleOpenPayment = (inv: InvoiceRecord) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.totalAmount - inv.paidAmount);
  };

  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const receiptNo = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newPaid = selectedInvoice.paidAmount + paymentAmount;
    const newStatus = newPaid >= selectedInvoice.totalAmount ? 'PAID' : 'PARTIAL';

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === selectedInvoice.id
          ? { ...i, paidAmount: newPaid, status: newStatus }
          : i
      )
    );

    setRecentReceipt({
      receiptNo,
      studentName: selectedInvoice.studentName,
      amount: paymentAmount,
      method: paymentMethod,
      date: new Date().toLocaleDateString('en-GB'),
    });

    setSelectedInvoice(null);
    showToast(`Payment of ₹${paymentAmount.toLocaleString()} recorded. Receipt ${receiptNo} generated.`);
  };

  const filteredInvoices = invoices.filter((i) => {
    const matchesSearch =
      i.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.admissionNo.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || i.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalInvoiced = invoices.reduce((acc, i) => acc + i.totalAmount, 0);
  const totalCollected = invoices.reduce((acc, i) => acc + i.paidAmount, 0);
  const totalOutstanding = totalInvoiced - totalCollected;

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

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2>Institutional Accounts & Fee Ledger</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Fee schedules, student invoicing, payment reconciliation, and sequential receipt generation for {branding.shortName}.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            icon={<Download size={15} />}
            onClick={() => showToast('Fee ledger exported to institutional CSV format.')}
          >
            Export Ledger
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => showToast('Batch invoicing engine opened for Term 3 (Jan–Mar 2027).')}
          >
            Generate Term Invoices
          </Button>
        </div>
      </div>

      {/* Operational Metric Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Total Invoiced (Term 2)</span>
          <span className="value">₹{(totalInvoiced * 12).toLocaleString()}</span>
          <span className="subtitle">Across 620 enrolled students</span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Realized Revenue</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>
            ₹{(totalCollected * 12).toLocaleString()}
          </span>
          <span className="subtitle">
            <CheckCircle2 size={13} /> {Math.round((totalCollected / totalInvoiced) * 100)}% realization rate
          </span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Outstanding Dues</span>
          <span className="value" style={{ color: 'var(--warning-solid)' }}>
            ₹{(totalOutstanding * 12).toLocaleString()}
          </span>
          <span className="subtitle">
            <Clock size={13} /> 18 overdue accounts
          </span>
        </div>
        <div className="ed-metric-tile">
          <span className="label">Payment Gateways</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>
            Online
          </span>
          <span className="subtitle">UPI, Net Banking & NEFT active</span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        activeTab={activeTab}
        onChange={(tab) => setActiveTab(tab as any)}
        tabs={[
          { id: 'invoices', label: 'Student Invoices & Fee Ledger', icon: <CreditCard size={15} />, badge: invoices.length },
          { id: 'structures', label: 'Approved Fee Structures', icon: <FileSpreadsheet size={15} /> },
          { id: 'reconciliation', label: 'Bank Reconciliations', icon: <Receipt size={15} /> },
        ]}
      />

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="ed-card" style={{ padding: 0 }}>
          {/* Filter Bar */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flex: 1, minWidth: '240px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={14} style={{ color: 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="ed-select"
                style={{ width: 'auto', padding: '5px 10px', fontSize: '0.82rem' }}
              >
                <option value="ALL">All Invoices</option>
                <option value="PAID">Paid in Full</option>
                <option value="PARTIAL">Partially Paid</option>
                <option value="OVERDUE">Overdue / Arrears</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Invoice No</th>
                  <th>Student</th>
                  <th>Grade</th>
                  <th>Term</th>
                  <th>Invoiced (₹)</th>
                  <th>Paid (₹)</th>
                  <th>Balance Due (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((inv) => {
                  const balance = inv.totalAmount - inv.paidAmount;
                  return (
                    <tr key={inv.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {inv.invoiceNo}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{inv.studentName}</div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{inv.admissionNo}</div>
                      </td>
                      <td>{inv.classGrade}</td>
                      <td style={{ fontSize: '0.80rem' }}>{inv.term}</td>
                      <td style={{ fontWeight: 600 }}>₹{inv.totalAmount.toLocaleString()}</td>
                      <td style={{ color: 'var(--success-solid)', fontWeight: 500 }}>
                        ₹{inv.paidAmount.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 600, color: balance > 0 ? 'var(--danger-solid)' : 'var(--text-muted)' }}>
                        ₹{balance.toLocaleString()}
                      </td>
                      <td>
                        {inv.status === 'PAID' && <Badge variant="success">Paid in Full</Badge>}
                        {inv.status === 'PARTIAL' && <Badge variant="warning">Partial</Badge>}
                        {inv.status === 'OVERDUE' && <Badge variant="danger">Overdue</Badge>}
                      </td>
                      <td>
                        {balance > 0 ? (
                          <button
                            onClick={() => handleOpenPayment(inv)}
                            className="ed-btn ed-btn-primary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem' }}
                          >
                            Record Payment
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setRecentReceipt({
                                receiptNo: `REC-2026-PAID`,
                                studentName: inv.studentName,
                                amount: inv.totalAmount,
                                method: 'Net Banking',
                                date: '2026-10-12',
                              });
                            }}
                            className="ed-btn ed-btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.76rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Receipt size={12} /> View Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Approved Fee Structures */}
      {activeTab === 'structures' && (
        <div className="ed-grid-3">
          <div className="ed-card">
            <h4 style={{ margin: '0 0 var(--space-2)' }}>Primary Wing (Grades 1–5)</h4>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: 'var(--space-2)' }}>
              ₹28,000 <span style={{ fontSize: '0.80rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ Quarter</span>
            </div>
            <ul style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>Tuition & Pedagogical Activity: ₹18,000</li>
              <li>Robotics & Digital Lab: ₹4,000</li>
              <li>Sports & Physical Training: ₹3,500</li>
              <li>Annual Library & Resources: ₹2,500</li>
            </ul>
          </div>

          <div className="ed-card">
            <h4 style={{ margin: '0 0 var(--space-2)' }}>Middle Wing (Grades 6–8)</h4>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: 'var(--space-2)' }}>
              ₹38,000 <span style={{ fontSize: '0.80rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ Quarter</span>
            </div>
            <ul style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>Tuition & Scientific Lab: ₹24,000</li>
              <li>Computer Science & AI Lab: ₹6,000</li>
              <li>Athletics & Co-Curricular: ₹4,500</li>
              <li>Term Assessments & Examination: ₹3,500</li>
            </ul>
          </div>

          <div className="ed-card">
            <h4 style={{ margin: '0 0 var(--space-2)' }}>Senior Secondary (Grades 9–12)</h4>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary-700)', marginBottom: 'var(--space-2)' }}>
              ₹45,000 <span style={{ fontSize: '0.80rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ Quarter</span>
            </div>
            <ul style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', paddingLeft: '20px', lineHeight: 1.6 }}>
              <li>Physics, Chem & Bio Research Lab: ₹28,000</li>
              <li>Competitive Exam Coaching & AI Tutor: ₹8,000</li>
              <li>Board Examination & Practical Fee: ₹5,000</li>
              <li>Library & Career Counseling: ₹4,000</li>
            </ul>
          </div>
        </div>
      )}

      {/* Tab 3: Bank Reconciliations */}
      {activeTab === 'reconciliation' && (
        <div className="ed-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-4)' }}>
            <div>
              <h4 style={{ margin: 0 }}>Automated Gateway Reconciliation Feed</h4>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Real-time bank settlement sync with ICICI & HDFC institutional clearing accounts.
              </p>
            </div>
            <Badge variant="success">All Settled (0 Discrepancies)</Badge>
          </div>
          <div style={{ padding: 'var(--space-4)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
            Last sync completed 14 minutes ago. 142 digital transactions matched with bank statement.
          </div>
        </div>
      )}

      {/* Modal: Record Fee Payment */}
      <Modal
        isOpen={!!selectedInvoice}
        onClose={() => setSelectedInvoice(null)}
        title="Record Fee Payment & Issue Receipt"
        subtitle={`Invoice: ${selectedInvoice?.invoiceNo} • Student: ${selectedInvoice?.studentName}`}
      >
        <form onSubmit={handleRecordPayment} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <span>Total Invoiced:</span>
              <span style={{ fontWeight: 600 }}>₹{selectedInvoice?.totalAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '4px' }}>
              <span>Previously Paid:</span>
              <span style={{ color: 'var(--success-solid)', fontWeight: 600 }}>₹{selectedInvoice?.paidAmount.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.90rem', marginTop: '4px', fontWeight: 700 }}>
              <span>Remaining Balance:</span>
              <span style={{ color: 'var(--danger-solid)' }}>
                ₹{selectedInvoice ? (selectedInvoice.totalAmount - selectedInvoice.paidAmount).toLocaleString() : 0}
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
              max={selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.paidAmount : 0}
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
              <option value="Net Banking">Net Banking / IMPS</option>
              <option value="NEFT">Bank Wire / NEFT Transfer</option>
              <option value="Credit/Debit Card">Credit / Debit Card</option>
              <option value="Cash / Cheque">Institutional Cash Counter / Cheque</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
            <Button variant="secondary" type="button" onClick={() => setSelectedInvoice(null)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Confirm & Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: View Receipt */}
      <Modal
        isOpen={!!recentReceipt}
        onClose={() => setRecentReceipt(null)}
        title="Official Payment Receipt"
        subtitle={branding.schoolName}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              padding: 'var(--space-5)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-subtle)',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.84rem',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>{branding.schoolName}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{branding.address}</div>
              <div style={{ fontWeight: 700, marginTop: '4px', color: 'var(--primary-700)' }}>
                FEE PAYMENT RECEIPT #{recentReceipt?.receiptNo}
              </div>
            </div>

            <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: 'var(--space-2)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Date of Issue:</span>
                <span>{recentReceipt?.date}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Student Name:</span>
                <span>{recentReceipt?.studentName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Payment Mode:</span>
                <span>{recentReceipt?.method}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.92rem', marginTop: '6px' }}>
                <span>Amount Realized:</span>
                <span style={{ color: 'var(--success-solid)' }}>₹{recentReceipt?.amount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button
              variant="secondary"
              icon={<Printer size={14} />}
              onClick={() => {
                showToast('Receipt queued for institutional printing.');
                setRecentReceipt(null);
              }}
            >
              Print Receipt
            </Button>
            <Button variant="primary" onClick={() => setRecentReceipt(null)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

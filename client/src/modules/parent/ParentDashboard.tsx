import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Award,
  CalendarCheck,
  CreditCard,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Download,
  ArrowRight,
  Receipt,
  X,
  Check,
  Loader2,
  RefreshCw,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';
import {
  coreApi,
  academicApi,
  operationsApi,
} from '../../services/api.js';

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

export const ParentDashboard: React.FC = () => {
  const [children, setChildren] = useState<Ward[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [errorChildren, setErrorChildren] = useState<string | null>(null);

  // Active Child Academic & Fee Data from PostgreSQL
  const [reportCard, setReportCard] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [loadingChildData, setLoadingChildData] = useState(false);

  // Fee Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState('ONLINE');
  const [paymentTxnRef, setPaymentTxnRef] = useState('');

  // Report Card Modal State
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  // Load students linked to parent via authorized PostgreSQL endpoint
  const loadChildren = async () => {
    try {
      setLoadingChildren(true);
      setErrorChildren(null);

      const res = await coreApi.getParentChildren();
      const mappedChildren: Ward[] = (res || []).map((s: any) => ({
        id: s.id || s.studentProfileId,
        studentProfileId: s.studentProfileId || s.id,
        name: s.name || `${s.firstName} ${s.lastName}`.trim(),
        grade: s.grade || `${s.className}-${s.sectionName}`,
        className: s.className || 'Grade 10',
        sectionName: s.sectionName || 'A',
        admissionNumber: s.admissionNumber,
        rollNumber: s.rollNumber || 1,
      }));

      setChildren(mappedChildren);
      if (mappedChildren.length > 0) {
        loadChildDetails(mappedChildren[0].id);
      }
    } catch (err: any) {
      setErrorChildren(err.message || 'Failed to load linked student records.');
    } finally {
      setLoadingChildren(false);
    }
  };

  const loadChildDetails = async (childId: string) => {
    try {
      setLoadingChildData(true);

      const [rcRes, attRes, invsRes, evtsRes, noticesRes] = await Promise.allSettled([
        academicApi.getReportCard(childId),
        academicApi.getStudentAttendanceSummary(childId),
        operationsApi.listFeeInvoices({ studentProfileId: childId }),
        operationsApi.listEvents(),
        operationsApi.listNotices(),
      ]);

      if (rcRes.status === 'fulfilled') setReportCard(rcRes.value);
      else setReportCard(null);

      if (attRes.status === 'fulfilled') setAttendanceSummary(attRes.value);
      else setAttendanceSummary(null);

      if (invsRes.status === 'fulfilled') setInvoices(invsRes.value || []);
      else setInvoices([]);

      if (evtsRes.status === 'fulfilled') setUpcomingEvents((evtsRes.value || []).slice(0, 3));
      if (noticesRes.status === 'fulfilled') setRecentNotices((noticesRes.value || []).slice(0, 3));
    } finally {
      setLoadingChildData(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleSelectChild = (idx: number) => {
    setSelectedChildIndex(idx);
    setPaymentSuccess(false);
    if (children[idx]) {
      loadChildDetails(children[idx].id);
    }
  };

  const activeChild = children[selectedChildIndex] || null;

  // Real calculations
  const pendingInvoice = invoices.find((inv) => inv.status !== 'PAID');
  const outstandingAmount = invoices.reduce((acc, inv) => {
    return acc + Math.max(0, inv.amountDue - inv.amountPaid - (inv.discountApplied || 0));
  }, 0);

  const termScore = reportCard?.overallPercentage ? `${reportCard.overallPercentage}%` : 'Pending Publication';
  const attendancePercent =
    attendanceSummary && attendanceSummary.totalWorkingDays > 0
      ? `${attendanceSummary.attendancePercentage}%`
      : 'Not recorded';

  const handleOpenPaymentModal = (invoice: any) => {
    const due = Math.max(0, invoice.amountDue - invoice.amountPaid - (invoice.discountApplied || 0));
    setSelectedInvoice(invoice);
    setPaymentAmount(due);
    setPaymentTxnRef(`TXN-${Date.now().toString().slice(-6)}`);
    setPaymentSuccess(false);
    setPaymentError(null);
    setShowPaymentModal(true);
  };

  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoice) return;
    try {
      setPaymentSubmitting(true);
      setPaymentError(null);

      await operationsApi.recordFeePayment({
        invoiceId: selectedInvoice.id,
        amountPaid: Number(paymentAmount),
        paymentMethod: paymentMode,
        transactionRef: paymentTxnRef,
        notes: `Parent fee remittance via gateway reference ${paymentTxnRef}`,
      });

      setPaymentSuccess(true);
      if (activeChild) {
        const updatedInvoices = await operationsApi.listFeeInvoices({ studentProfileId: activeChild.id });
        setInvoices(updatedInvoices || []);
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Payment transaction failed. Please retry.');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="ed-page">
      <Breadcrumbs items={[{ label: 'Parent Portal' }, { label: 'Academic Overview' }]} />

      {/* Header and Child Switcher */}
      <div className="ed-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Parent & Guardian Portal
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Real-time academic performance, attendance compliance, and fee management ledger.
            </p>
          </div>

          {/* Child Selector Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <button
              className="ed-btn ed-btn-secondary"
              onClick={loadChildren}
              disabled={loadingChildren}
              title="Refresh Ward Data"
            >
              <RefreshCw size={14} className={loadingChildren ? 'animate-spin' : ''} />
            </button>

            <div
              style={{
                display: 'flex',
                backgroundColor: 'var(--bg-subtle)',
                padding: '4px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-default)',
                gap: '4px',
              }}
            >
              {loadingChildren ? (
                <span style={{ fontSize: '0.8rem', padding: '4px 10px', color: 'var(--text-muted)' }}>
                  Loading wards...
                </span>
              ) : children.length === 0 ? (
                <span style={{ fontSize: '0.8rem', padding: '4px 10px', color: 'var(--text-muted)' }}>
                  No registered children
                </span>
              ) : (
                children.map((child, idx) => (
                  <button
                    key={child.id}
                    onClick={() => handleSelectChild(idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 14px',
                      border: 'none',
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: selectedChildIndex === idx ? '#ffffff' : 'transparent',
                      boxShadow: selectedChildIndex === idx ? 'var(--shadow-xs)' : 'none',
                      cursor: 'pointer',
                      fontWeight: selectedChildIndex === idx ? 700 : 500,
                      color: selectedChildIndex === idx ? 'var(--primary-700)' : 'var(--text-secondary)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <Users size={14} />
                    <span>{child.name}</span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({child.grade})</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {errorChildren && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-6)' }}>
          <AlertTriangle size={16} />
          <span>{errorChildren}</span>
        </div>
      )}

      {!loadingChildren && children.length === 0 && !errorChildren && (
        <div className="ed-card" style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Users size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
          <h3 style={{ margin: '0 0 8px', fontWeight: 800, color: 'var(--text-primary)' }}>
            No Wards Linked to this Account
          </h3>
          <p style={{ margin: 0, fontSize: '0.9rem', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
            No registered student records are currently associated with your guardian membership in this school. If your ward is actively enrolled, please contact the school administration to link their student account.
          </p>
        </div>
      )}

      {activeChild && (
        <>
          {/* Child Metrics Overview */}
          <div className="ed-grid-4" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="ed-metric-tile">
              <span className="label">Term Aggregate</span>
              <span className="value" style={{ color: 'var(--primary-700)' }}>{termScore}</span>
              <span className="subtitle">
                <Link to="/parent/results" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
                  View Full Report Card →
                </Link>
              </span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Attendance Rate</span>
              <span className="value" style={{ color: 'var(--teal-accent)' }}>{attendancePercent}</span>
              <span className="subtitle">
                <Link to="/parent/attendance" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
                  {attendanceSummary?.totalWorkingDays ? `${attendanceSummary.presentDays} of ${attendanceSummary.totalWorkingDays} sessions →` : 'View Records →'}
                </Link>
              </span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Outstanding Fees</span>
              <span
                className="value"
                style={{ color: outstandingAmount > 0 ? 'var(--warning-solid)' : 'var(--success-solid)' }}
              >
                {outstandingAmount > 0 ? `₹ ${outstandingAmount.toLocaleString()}` : 'Settled'}
              </span>
              <span className="subtitle">
                <Link to="/parent/fees" style={{ color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
                  {outstandingAmount > 0 ? 'Pay Outstanding Invoices →' : 'View Fee Receipts →'}
                </Link>
              </span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Registered Ward</span>
              <span className="value" style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {activeChild.name}
              </span>
              <span className="subtitle">
                {activeChild.admissionNumber} • {activeChild.grade}
              </span>
            </div>
          </div>

          {/* Main Grid: Subject-wise Academic Ledger & Fee Invoice Panel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--space-6)', marginBottom: 'var(--space-6)' }}>
            {/* Academic Marks Summary */}
            <div className="ed-card">
              <div className="ed-card-header">
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                    {activeChild.name} — Published Assessment Results
                  </span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Academic Session 2026–2027 • Admission #{activeChild.admissionNumber}
                  </p>
                </div>
                {reportCard && reportCard.subjects && reportCard.subjects.length > 0 && (
                  <button
                    className="ed-btn ed-btn-sm ed-btn-secondary"
                    onClick={() => setShowReportCardModal(true)}
                  >
                    <Download size={13} /> Official Report Card
                  </button>
                )}
              </div>

              <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
                {loadingChildData ? (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                    <span>Loading examination results...</span>
                  </div>
                ) : reportCard && reportCard.subjects && reportCard.subjects.length > 0 ? (
                  <table className="ed-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Marks Obtained</th>
                        <th>Max Marks</th>
                        <th>Awarded Grade</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCard.subjects.map((m: any, i: number) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{m.subjectName}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{m.marksObtained}</td>
                          <td>{m.maxMarks}</td>
                          <td>
                            <span className={`ed-badge ${m.grade === 'A1' || m.grade === 'A2' ? 'ed-badge-success' : 'ed-badge-neutral'}`}>
                              {m.grade}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                            {m.teacherRemarks || 'Satisfactory'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Award size={32} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ fontWeight: 600, margin: '0 0 4px' }}>No Published Marks Yet</p>
                    <span style={{ fontSize: '0.78rem' }}>Formal exam marks have not been published for this student.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Fee Dues & Invoices Quick Card */}
            <div className="ed-card">
              <div className="ed-card-header">
                <div>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Fee Invoices & Dues</span>
                  <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Financial Ledger Standing
                  </p>
                </div>
                <Link to="/parent/fees" className="ed-btn ed-btn-sm ed-btn-secondary" style={{ textDecoration: 'none' }}>
                  All Invoices
                </Link>
              </div>

              <div style={{ padding: 'var(--space-4)' }}>
                {invoices.length > 0 ? (
                  invoices.map((inv) => {
                    const balance = Math.max(0, inv.amountDue - inv.amountPaid - (inv.discountApplied || 0));
                    return (
                      <div
                        key={inv.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px',
                          border: '1px solid var(--border-default)',
                          borderRadius: 'var(--radius-sm)',
                          marginBottom: '10px',
                          backgroundColor: inv.status === 'PAID' ? 'var(--bg-subtle)' : '#fffbeb',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.88rem' }}>{inv.invoiceNumber}</span>
                            <span className={`ed-badge ${inv.status === 'PAID' ? 'ed-badge-success' : 'ed-badge-warning'}`}>
                              {inv.status}
                            </span>
                          </div>
                          <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {inv.feeStructureHead} • Due {inv.dueDate}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>₹ {inv.amountDue.toLocaleString()}</span>
                          {balance > 0 ? (
                            <button
                              className="ed-btn ed-btn-sm ed-btn-primary"
                              style={{ display: 'block', marginTop: '4px' }}
                              onClick={() => handleOpenPaymentModal(inv)}
                            >
                              Pay ₹{balance.toLocaleString()}
                            </button>
                          ) : (
                            <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--success-text)', fontWeight: 600 }}>
                              Cleared
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CreditCard size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: '0.84rem' }}>No fee invoices recorded</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Grid: Institutional Events & Notices */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-6)' }}>
            {/* School Events */}
            <div className="ed-card">
              <div className="ed-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Calendar size={18} style={{ color: 'var(--primary-600)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Upcoming Institutional Events</span>
                </div>
                <Link to="/parent/notices" style={{ fontSize: '0.78rem', color: 'var(--primary-600)', textDecoration: 'none' }}>
                  Calendar →
                </Link>
              </div>

              <div style={{ padding: 'var(--space-4)' }}>
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((evt) => (
                    <div
                      key={evt.id}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border-default)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '0.86rem', display: 'block' }}>{evt.title}</strong>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {evt.venue ? ` • ${evt.venue}` : ''}
                        </span>
                      </div>
                      <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>
                        {evt.audience}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                    No upcoming events scheduled
                  </p>
                )}
              </div>
            </div>

            {/* Recent School Notices */}
            <div className="ed-card">
              <div className="ed-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Bell size={18} style={{ color: 'var(--primary-600)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Recent School Circulars</span>
                </div>
                <Link to="/parent/notices" style={{ fontSize: '0.78rem', color: 'var(--primary-600)', textDecoration: 'none' }}>
                  View All →
                </Link>
              </div>

              <div style={{ padding: 'var(--space-4)' }}>
                {recentNotices.length > 0 ? (
                  recentNotices.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '10px 12px',
                        borderBottom: '1px solid var(--border-default)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        {n.isUrgent && <span className="ed-badge ed-badge-danger" style={{ fontSize: '0.68rem' }}>URGENT</span>}
                        <strong style={{ fontSize: '0.86rem' }}>{n.title}</strong>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                    No recent circulars published
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fee Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="ed-modal-overlay" onClick={() => !paymentSubmitting && setShowPaymentModal(false)}>
          <div className="ed-modal-content" style={{ maxWidth: '480px', width: '100%', padding: 'var(--space-6)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-default)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={20} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Fee Settlement</h3>
              </div>
              <button className="ed-btn ed-btn-sm ed-btn-secondary" disabled={paymentSubmitting} onClick={() => setShowPaymentModal(false)}>
                <X size={14} />
              </button>
            </div>

            {paymentSuccess ? (
              <div style={{ padding: '24px', textAlign: 'center' }}>
                <CheckCircle2 size={48} style={{ color: 'var(--success-solid)', margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', fontWeight: 800 }}>Payment Processed Successfully</h4>
                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                  Your remittance for {selectedInvoice.invoiceNumber} has been reconciled in the student ledger.
                </p>
              </div>
            ) : (
              <form onSubmit={handleProcessPayment}>
                {paymentError && (
                  <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.84rem', marginBottom: '16px' }}>
                    {paymentError}
                  </div>
                )}

                <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', fontSize: '0.85rem' }}>
                  <div><strong>Invoice:</strong> {selectedInvoice.invoiceNumber}</div>
                  <div><strong>Component:</strong> {selectedInvoice.feeStructureHead}</div>
                  <div><strong>Student:</strong> {activeChild?.name} ({activeChild?.admissionNumber})</div>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Amount (₹)</label>
                  <input
                    type="number"
                    className="ed-input"
                    style={{ width: '100%', fontWeight: 700 }}
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    max={selectedInvoice.amountDue - selectedInvoice.amountPaid}
                    min={1}
                    required
                  />
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Payment Method</label>
                  <select className="ed-input" style={{ width: '100%' }} value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
                    <option value="ONLINE">Unified Payments Interface (UPI)</option>
                    <option value="CARD">Debit / Credit Card</option>
                    <option value="NET_BANKING">Net Banking</option>
                  </select>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, marginBottom: '6px' }}>Transaction Ref</label>
                  <input type="text" className="ed-input" style={{ width: '100%', fontFamily: 'monospace' }} value={paymentTxnRef} onChange={(e) => setPaymentTxnRef(e.target.value)} required />
                </div>

                <button type="submit" className="ed-btn ed-btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={paymentSubmitting}>
                  {paymentSubmitting ? 'Remitting Payment...' : `Confirm & Settle ₹ ${paymentAmount.toLocaleString()}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Official Report Card Modal */}
      {showReportCardModal && reportCard && (
        <div className="ed-modal-overlay" onClick={() => setShowReportCardModal(false)}>
          <div className="ed-modal-content" style={{ maxWidth: '780px', width: '100%', padding: 'var(--space-6)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                  Apex Academy of Sciences & Arts
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Affiliated to CBSE, New Delhi • Official Academic Progress Report 2026–2027
                </p>
              </div>
              <button className="ed-btn ed-btn-sm ed-btn-secondary" onClick={() => setShowReportCardModal(false)}>
                <X size={14} /> Close
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div><strong>Student Name:</strong><br />{activeChild?.name}</div>
              <div><strong>Admission No:</strong><br />{activeChild?.admissionNumber}</div>
              <div><strong>Class & Section:</strong><br />{activeChild?.grade}</div>
              <div><strong>Roll Number:</strong><br />#{activeChild?.rollNumber}</div>
            </div>

            <table className="ed-table" style={{ marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Obtained</th>
                  <th>Maximum</th>
                  <th>Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(reportCard.subjects || []).map((s: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{s.subjectName}</td>
                    <td style={{ fontWeight: 700 }}>{s.marksObtained}</td>
                    <td>{s.maxMarks}</td>
                    <td><span className="ed-badge ed-badge-success">{s.grade || 'A'}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{s.teacherRemarks || 'Satisfactory'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

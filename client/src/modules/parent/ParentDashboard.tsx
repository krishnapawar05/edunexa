import React, { useState } from 'react';
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
} from 'lucide-react';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

export const ParentDashboard: React.FC = () => {
  const children = [
    {
      id: 'child-01',
      name: 'Aarav Sharma',
      grade: 'Grade 10-A',
      admissionNo: 'ADM-2026-0042',
      rollNo: 1,
      attendance: '96.4%',
      currentTermGPA: '9.4 / 10.0',
      feeDue: 0,
      feeStatus: 'PAID',
      recentMarks: [
        { subject: 'Physics Core', marks: '94 / 100', grade: 'A+' },
        { subject: 'Mathematics (Advanced)', marks: '96 / 100', grade: 'A+' },
        { subject: 'Chemistry', marks: '88 / 100', grade: 'A' },
        { subject: 'English Literature', marks: '85 / 100', grade: 'A' },
      ],
      upcomingExam: 'Half-Yearly Examination (Starts Nov 10, 2026)',
    },
    {
      id: 'child-02',
      name: 'Maya Sharma',
      grade: 'Grade 7-B',
      admissionNo: 'ADM-2026-0118',
      rollNo: 14,
      attendance: '92.1%',
      currentTermGPA: '8.8 / 10.0',
      feeDue: 14500,
      feeStatus: 'DUE',
      recentMarks: [
        { subject: 'General Science', marks: '86 / 100', grade: 'A' },
        { subject: 'Mathematics', marks: '90 / 100', grade: 'A+' },
        { subject: 'Social Studies', marks: '82 / 100', grade: 'B+' },
        { subject: 'English Language', marks: '88 / 100', grade: 'A' },
      ],
      upcomingExam: 'Unit Test 2 (Starts Oct 28, 2026)',
    },
  ];

  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  const activeChild = children[selectedChildIndex];

  const handleSimulatedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentSuccess(true);
    setTimeout(() => {
      // simulate settlement
      activeChild.feeDue = 0;
      activeChild.feeStatus = 'PAID';
    }, 1200);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Breadcrumbs & Header */}
      <div>
        <Breadcrumbs items={[{ label: 'Parent Portal' }, { label: 'Academic & Fee Dashboard' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <div>
            <h2>Parent & Guardian Academic Overview</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Authorized guardian portal • Sunil & Kavita Sharma
            </p>
          </div>

          {/* Sibling / Child Profile Switcher */}
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
            {children.map((child, idx) => (
              <button
                key={child.id}
                onClick={() => {
                  setSelectedChildIndex(idx);
                  setPaymentSuccess(false);
                }}
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
            ))}
          </div>
        </div>
      </div>

      {/* Child Metrics Overview */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Current Term Score</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>{activeChild.currentTermGPA}</span>
          <span className="subtitle">Published Board Grade Point</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Attendance Rate</span>
          <span className="value" style={{ color: 'var(--teal-accent)' }}>{activeChild.attendance}</span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> Satisfies 85% requirement
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Fee Ledger Status</span>
          <span
            className="value"
            style={{ color: activeChild.feeDue > 0 ? 'var(--warning-solid)' : 'var(--success-solid)' }}
          >
            {activeChild.feeDue > 0 ? `₹ ${activeChild.feeDue.toLocaleString()}` : 'Settled'}
          </span>
          <span className="subtitle">
            {activeChild.feeDue > 0 ? 'Term 2 Tuition Due' : 'All invoices cleared'}
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Next Milestone</span>
          <span className="value" style={{ fontSize: '1.15rem', color: 'var(--text-primary)' }}>Oct 28</span>
          <span className="subtitle">{activeChild.upcomingExam.slice(0, 30)}...</span>
        </div>
      </div>

      {/* Main Grid: Subject-wise Academic Ledger & Fee Invoice Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--space-6)' }}>
        {/* Academic Marks Summary */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                {activeChild.name} — Published Assessment Results
              </span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Academic Session 2026–2027 • {activeChild.admissionNo}
              </p>
            </div>
            <button
              className="ed-btn ed-btn-sm ed-btn-secondary"
              onClick={() => setShowReportCardModal(true)}
            >
              <Download size={13} /> Official Report Card
            </button>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks Obtained</th>
                  <th>Awarded Grade</th>
                  <th>Assessment Type</th>
                </tr>
              </thead>
              <tbody>
                {activeChild.recentMarks.map((m, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{m.subject}</td>
                    <td style={{ fontWeight: 700 }}>{m.marks}</td>
                    <td>
                      <span className="ed-badge ed-badge-success">{m.grade}</span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Mid-Term Assessment</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Fee Payment & Notices Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Fee Card */}
          <div className="ed-card ed-card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CreditCard size={16} style={{ color: 'var(--primary-600)' }} />
                <span>Term Tuition Account</span>
              </div>
              <span className={`ed-badge ${activeChild.feeDue > 0 ? 'ed-badge-warning' : 'ed-badge-success'}`}>
                {activeChild.feeStatus}
              </span>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {activeChild.feeDue > 0
                ? `Invoice #INV-2026-0814 for ₹ ${activeChild.feeDue.toLocaleString()} is due on November 05, 2026.`
                : 'All term fees and laboratory dues are currently settled. Receipt #REC-2026-0042 is on file.'}
            </p>

            <div style={{ marginTop: 'var(--space-4)' }}>
              {activeChild.feeDue > 0 ? (
                <button
                  className="ed-btn ed-btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => setShowPaymentModal(true)}
                >
                  Pay Invoice (Simulated Gateway)
                </button>
              ) : (
                <button
                  className="ed-btn ed-btn-secondary"
                  style={{ width: '100%' }}
                  onClick={() => alert('Downloading official fee receipt #REC-2026-0042...')}
                >
                  <Receipt size={14} /> Download Payment Receipt
                </button>
              )}
            </div>
          </div>

          {/* Teacher Feedback Note */}
          <div className="ed-card ed-card-body">
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={15} style={{ color: 'var(--teal-accent)' }} />
              <span>Teacher Academic Note</span>
            </div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.5, color: 'var(--text-secondary)' }}>
              "{activeChild.name} demonstrates keen aptitude in analytical problem solving. We recommend encouraging participation in the upcoming Inter-School Olympiad."
            </p>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              — Dr. Julian Thorne (Physics Department)
            </div>
          </div>
        </div>
      </div>

      {/* Simulated Fee Payment Modal */}
      {showPaymentModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div className="ed-card" style={{ width: '100%', maxWidth: '460px', backgroundColor: '#ffffff' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.05rem' }}>Simulated Fee Payment Checkout</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Invoice #INV-2026-0814 • {activeChild.name} ({activeChild.admissionNo})
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowPaymentModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body">
              {paymentSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
                  <CheckCircle2 size={44} style={{ color: 'var(--success-solid)', margin: '0 auto var(--space-2)' }} />
                  <h4>Payment Simulated Successfully!</h4>
                  <p style={{ fontSize: '0.84rem', marginTop: '6px' }}>
                    Receipt #REC-2026-0914 generated. Ledger updated to Paid.
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    In accordance with PRD §14, this test payment was simulated without storing raw card credentials.
                  </p>
                  <button
                    className="ed-btn ed-btn-primary"
                    style={{ marginTop: 'var(--space-4)' }}
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSimulatedPayment}>
                  <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                      <span>Tuition Fee (Term 2):</span>
                      <strong style={{ fontFamily: 'var(--font-mono)' }}>₹ 14,500.00</strong>
                    </div>
                  </div>

                  <div className="ed-input-group">
                    <label className="ed-label">Payment Mode</label>
                    <select className="ed-select">
                      <option>Online UPI / NetBanking (Simulated)</option>
                      <option>Bank Direct NEFT Transfer</option>
                      <option>Institutional Scholarship Adjustment</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                    <button
                      type="button"
                      className="ed-btn ed-btn-secondary"
                      onClick={() => setShowPaymentModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="ed-btn ed-btn-primary">
                      Confirm Simulated Payment
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Term Report Card Modal for Linked Child */}
      {showReportCardModal && (
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
            className="ed-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="ed-card-header" style={{ borderBottom: '2px solid var(--primary-700)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-800)', fontWeight: 800 }}>
                  Apex Academy of Sciences & Arts
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Affiliated to Central Board of Secondary Education • Academic Session 2026–2027
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowReportCardModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                }}
              >
                <div><strong>Student Name:</strong> {activeChild.name}</div>
                <div><strong>Admission Number:</strong> {activeChild.admissionNo}</div>
                <div><strong>Class & Section:</strong> {activeChild.grade} (Roll #{activeChild.rollNo})</div>
                <div><strong>Attendance Standing:</strong> {activeChild.attendance} (Satisfies promotion criteria)</div>
              </div>

              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Max Marks</th>
                      <th>Pass Marks</th>
                      <th>Marks Scored</th>
                      <th>Grade</th>
                      <th>Term Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeChild.recentMarks.map((m, i) => (
                      <tr key={i}>
                        <td style={{ fontWeight: 600 }}>{m.subject}</td>
                        <td>100</td>
                        <td>35</td>
                        <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{m.marks.split(' / ')[0]}</td>
                        <td><span className="ed-badge ed-badge-success">{m.grade}</span></td>
                        <td>30% (Mid-Term)</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--primary-50, #f0fdfa)',
                  border: '1px solid var(--primary-200, #99f6e4)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>CUMULATIVE BOARD SCORE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                    {activeChild.currentTermGPA} • Grade A1
                  </div>
                </div>

                <div>
                  <span className="ed-badge ed-badge-success" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                    PROMOTED TO NEXT GRADE
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="ed-btn ed-btn-secondary"
                  onClick={() => setShowReportCardModal(false)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="ed-btn ed-btn-primary"
                  onClick={() => window.print()}
                >
                  <Award size={15} /> Print / Save Verified PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

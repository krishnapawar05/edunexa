import React, { useState } from 'react';
import {
  IdCard,
  QrCode,
  Award,
  Calendar,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
} from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Active Quiz Countdown Simulation
  const [quizTimer, setQuizTimer] = useState('28m 42s');

  const studentData = {
    name: 'Aarav Sharma',
    admissionNumber: 'ADM-2026-0042',
    class: 'Grade 10',
    section: 'A',
    rollNumber: 1,
    bloodGroup: 'O+ (Authorized)',
    schoolName: 'Apex Academy of Sciences & Arts',
    session: '2026–2027',
    attendance: '96.4%',
    gpa: '9.4 / 10.0',
    verificationToken: 'v-tok-8f2c-49a1-9b7e-e214',
  };

  const handleAiAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setTimeout(() => {
      setAiLoading(false);
      if (aiQuestion.toLowerCase().includes('exam') || aiQuestion.toLowerCase().includes('cheat')) {
        setAiAnswer(
          "I am configured strictly to explain fundamental learning concepts and provide guided practice. I do not provide direct solutions to live examinations or tests. How can I explain the underlying concept instead?"
        );
      } else {
        setAiAnswer(
          `According to the curriculum: ${aiQuestion.trim()} is governed by core scientific principles. In Faraday's law, any change in the magnetic environment of a coil of wire will cause a voltage (emf) to be 'induced' in the coil. Would you like a step-by-step example problem?`
        );
      }
    }, 600);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Title */}
      <div>
        <h2>Student Academic Portal</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Welcome back, {studentData.name} • {studentData.class}-{studentData.section} ({studentData.admissionNumber})
        </p>
      </div>

      {/* Operational Metrics */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Cumulative Performance</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>{studentData.gpa}</span>
          <span className="subtitle">Ranked #2 in Grade 10</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Attendance Record</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>{studentData.attendance}</span>
          <span className="subtitle">102 out of 106 school days</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Pending Quiz</span>
          <span className="value" style={{ color: 'var(--warning-solid)' }}>1 Active</span>
          <span className="subtitle">Physics: Electromagnetic Induction</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Virtual ID Card</span>
          <span className="value">Active</span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> Secure Token Verified
          </span>
        </div>
      </div>

      {/* Main Grid: Virtual ID Card & Academic Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-6)' }}>
        {/* Virtual ID Card Preview Card (ISO Standard CR80 aesthetic) */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Virtual ID Card (ISO CR80)</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Cryptographically verifiable QR token</p>
            </div>
            <button
              className="ed-btn ed-btn-sm ed-btn-secondary"
              onClick={() => setShowQrModal(true)}
            >
              <QrCode size={14} /> Scan / Verify
            </button>
          </div>

          <div className="ed-card-body">
            {/* The ID Card Surface */}
            <div
              style={{
                borderRadius: 'var(--radius-md)',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                padding: 'var(--space-4)',
                boxShadow: 'var(--shadow-md)',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid #334155',
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.12)', paddingBottom: '8px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '24px', backgroundColor: 'var(--primary-600)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    A
                  </div>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, letterSpacing: '-0.01em' }}>
                    Apex Academy of Sciences
                  </span>
                </div>
                <span className="ed-badge ed-badge-success" style={{ fontSize: '0.66rem' }}>STUDENT</span>
              </div>

              {/* Card Body with Avatar and Details */}
              <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '74px',
                    height: '88px',
                    backgroundColor: '#1e293b',
                    border: '2px solid #475569',
                    borderRadius: 'var(--radius-xs)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                  }}
                >
                  <Award size={28} style={{ color: '#60a5fa', marginBottom: '4px' }} />
                  <span>PHOTO</span>
                </div>

                <div style={{ flex: 1, fontSize: '0.8rem' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                    {studentData.name}
                  </div>
                  <div style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {studentData.admissionNumber}
                  </div>
                  <div style={{ marginTop: '6px', color: '#cbd5e1', fontSize: '0.76rem' }}>
                    Class: <strong style={{ color: '#ffffff' }}>{studentData.class} - {studentData.section}</strong> (Roll #{studentData.rollNumber})
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                    Blood Group: {studentData.bloodGroup}
                  </div>
                </div>

                {/* Minimal QR representation */}
                <div
                  onClick={() => setShowQrModal(true)}
                  style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#ffffff',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <QrCode size={48} style={{ color: '#0f172a' }} />
                  <span style={{ fontSize: '0.55rem', color: '#334155', fontWeight: 700 }}>VERIFY</span>
                </div>
              </div>

              {/* Card Footer */}
              <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8' }}>
                <span>Session: {studentData.session}</span>
                <span>Valid Thru: April 2027</span>
              </div>
            </div>

            <div style={{ marginTop: 'var(--space-3)', display: 'flex', gap: 'var(--space-2)' }}>
              <button
                className="ed-btn ed-btn-sm ed-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => window.print()}
              >
                Print Official Card
              </button>
              <button
                className="ed-btn ed-btn-sm ed-btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowQrModal(true)}
              >
                Verify QR Token
              </button>
            </div>
          </div>
        </div>

        {/* Academic Performance & Active Quiz */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Active Quiz Card */}
          <div className="ed-card" style={{ borderLeft: '4px solid var(--warning-solid)' }}>
            <div className="ed-card-header">
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Active Assessment: Electromagnetic Induction</span>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Assigned by Dr. Thorne • Physics Grade 10-A</p>
              </div>
              <span className="ed-badge ed-badge-warning">Closes Today 17:00</span>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  Questions: <strong>20 MCQs & Short Concepts</strong> • Negative Marking: <strong>-0.25</strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Server enforced duration: <strong>45 minutes</strong> (Browser clock tampering blocked)
                </div>
              </div>
              <button
                className="ed-btn ed-btn-primary"
                onClick={() => alert('Starting secure assessment session with server-side timer...')}
              >
                Take Assessment
              </button>
            </div>
          </div>

          {/* AI Learning Assistant Drawer */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Personalized Learning Assistant</span>
              </div>
              <span className="ed-badge ed-badge-info">Curriculum Aligned</span>
            </div>
            <div className="ed-card-body">
              <form onSubmit={handleAiAsk} style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  className="ed-input"
                  placeholder="Ask a question about physics, math, or study concepts..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="ed-btn ed-btn-primary"
                  style={{ minWidth: '90px' }}
                >
                  {aiLoading ? 'Thinking...' : 'Explain'}
                </button>
              </form>

              {aiAnswer && (
                <div
                  style={{
                    marginTop: 'var(--space-3)',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--primary-700)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Sparkles size={13} /> Explanation & Concept Breakdown:
                  </div>
                  {aiAnswer}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Verification Simulation Modal */}
      {showQrModal && (
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
          <div className="ed-card" style={{ width: '100%', maxWidth: '440px', backgroundColor: '#ffffff' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.05rem' }}>ID Verification Endpoint Preview</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Public verification page at /verify-id/{studentData.verificationToken}
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowQrModal(false)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body" style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '120px',
                  height: '120px',
                  margin: '0 auto var(--space-4)',
                  padding: '8px',
                  backgroundColor: '#ffffff',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <QrCode size={100} style={{ color: '#0f172a' }} />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-pill)', color: 'var(--success-text)', fontSize: '0.78rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
                <CheckCircle2 size={14} /> Legitimate Active Institutional Card
              </div>

              <div style={{ textAlign: 'left', backgroundColor: 'var(--bg-subtle)', padding: '10px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div><strong>Full Name:</strong> {studentData.name}</div>
                <div><strong>Institution:</strong> {studentData.schoolName}</div>
                <div><strong>Role:</strong> Student (Grade 10)</div>
                <div><strong>Card Number:</strong> {studentData.admissionNumber}</div>
                <div><strong>Token Expiry:</strong> Active (Revocable)</div>
              </div>

              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 'var(--space-3)' }}>
                Security Notice: In accordance with B2World PRD §6, this verification view omits contact numbers, marks, fee details, and parent information to prevent privacy leaks.
              </p>

              <button
                className="ed-btn ed-btn-primary"
                style={{ marginTop: 'var(--space-4)', width: '100%' }}
                onClick={() => setShowQrModal(false)}
              >
                Close Verification Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

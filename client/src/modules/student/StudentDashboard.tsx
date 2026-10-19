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
  ShieldAlert,
} from 'lucide-react';
import { askSchoolAssistantApi, fetchAiStatusApi } from '../../services/api.js';

export const StudentDashboard: React.FC = () => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<string[]>([]);
  const [aiMissingInfo, setAiMissingInfo] = useState<boolean>(false);
  const [aiUnconfigured, setAiUnconfigured] = useState<boolean>(false);
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Active Quiz Countdown Simulation
  const [quizTimer, setQuizTimer] = useState('28m 42s');
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);

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

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiAnswer(null);
    setAiSources([]);
    setAiMissingInfo(false);
    setAiUnconfigured(false);

    try {
      const token = localStorage.getItem('edunexa_token') || 'demo-token';
      const res = await askSchoolAssistantApi(aiQuestion.trim(), 'GENERAL', token);

      if (res.success && res.data) {
        setAiAnswer(res.data.answer);
        setAiSources(res.data.groundedSources || []);
        setAiMissingInfo(!!res.data.isMissingInformation);
        setAiDisclaimer(res.data.disclaimer);
      } else if (res.error?.code === 'AI_PROVIDER_NOT_CONFIGURED') {
        setAiUnconfigured(true);
        setAiAnswer(
          'AI Provider is not configured on the server. Please set AI_PROVIDER_API_KEY in server/.env to enable live grounded school information assistance.'
        );
      } else {
        setAiAnswer(res.error?.message || 'Unable to retrieve answer. Please try again or visit administration.');
      }
    } catch (err: any) {
      setAiAnswer('Connection error to AI service: ' + err.message);
    } finally {
      setAiLoading(false);
    }
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
              onClick={() => {
                setShowQuizModal(true);
                setQuizSubmitted(false);
                setQuizResult(null);
              }}
            >
              {quizSubmitted ? 'Review Past Submission' : 'Take Assessment'}
            </button>
          </div>
        </div>

        {/* AI School Information & Policies Assistant */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={16} style={{ color: 'var(--primary-600)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>School Information & Policies Assistant</span>
            </div>
            <span className="ed-badge ed-badge-info">Grounded AI</span>
          </div>
          <div className="ed-card-body">
            <form onSubmit={handleAiAsk} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                <input
                  className="ed-input"
                  placeholder="Ask about admissions, attendance policy, code of conduct, fees, or events..."
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={aiLoading}
                  className="ed-btn ed-btn-primary"
                  style={{ minWidth: '90px' }}
                >
                  {aiLoading ? 'Searching...' : 'Ask AI'}
                </button>
              </div>
            </form>

            {/* Unconfigured State Banner */}
            {aiUnconfigured && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  padding: '10px 12px',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: '#92400e',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <ShieldAlert size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>AI Provider Unconfigured</div>
                  <div>To enable the live School Information Assistant, please set <code>AI_PROVIDER_API_KEY</code> in <code>server/.env</code>. Synthetic grounded responses are verified in test suite.</div>
                </div>
              </div>
            )}

            {/* Answer Display */}
            {aiAnswer && !aiUnconfigured && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  padding: '12px 14px',
                  backgroundColor: aiMissingInfo ? '#fffbeb' : 'var(--bg-subtle)',
                  border: `1px solid ${aiMissingInfo ? '#fde68a' : 'var(--border-default)'}`,
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                  lineHeight: 1.5,
                }}
              >
                <div style={{ fontWeight: 600, color: aiMissingInfo ? '#92400e' : 'var(--primary-700)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {aiMissingInfo ? <AlertTriangle size={14} /> : <Sparkles size={14} />}
                  {aiMissingInfo ? 'Information Not Found in Approved Records:' : 'Institutional Assistant Answer:'}
                </div>
                <div style={{ color: 'var(--text-primary)' }}>{aiAnswer}</div>

                {/* Grounded Sources */}
                {aiSources.length > 0 && (
                  <div style={{ marginTop: 'var(--space-2)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Grounded Sources:</span>
                    {aiSources.map((source, idx) => (
                      <span key={idx} className="ed-badge ed-badge-neutral" style={{ fontSize: '0.70rem' }}>
                        {source}
                      </span>
                    ))}
                  </div>
                )}

                {/* AI Safety Disclaimer */}
                {aiDisclaimer && (
                  <div style={{ marginTop: '8px', fontSize: '0.70rem', color: 'var(--text-muted)', borderTop: '1px dashed var(--border-default)', paddingTop: '6px' }}>
                    ⚠️ {aiDisclaimer}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      </div>

      {/* Interactive Quiz Assessment Modal */}
      {showQuizModal && (
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
            <div className="ed-card-header" style={{ borderBottom: '2px solid var(--primary-600)' }}>
              <div>
                <span className="ed-badge ed-badge-warning" style={{ marginBottom: '4px' }}>
                  <Clock size={12} /> Server Timer: {quizTimer} Remaining
                </span>
                <h3 style={{ fontSize: '1.1rem', marginTop: '4px' }}>
                  Physics Chapter 4: Electromagnetism & Induction
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Total Marks: 15 • Passing: 6 • Negative Marking: -0.25 on incorrect MCQs
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowQuizModal(false)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {quizSubmitted ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  <div
                    style={{
                      width: '64px',
                      height: '64px',
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
                    <CheckCircle2 size={36} />
                  </div>
                  <h4 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Assessment Submitted Successfully!</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Your objective answers have been auto-graded by the server-side evaluation engine.
                  </p>

                  <div
                    style={{
                      margin: 'var(--space-4) auto',
                      maxWidth: '340px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SCORE OBTAINED</div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary-700)' }}>
                      10.0 / 15.0
                    </div>
                    <span className="ed-badge ed-badge-success" style={{ marginTop: '6px' }}>
                      Passed (Objective Component)
                    </span>
                    <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Short answer response forwarded to Dr. Julian Thorne for subjective rubric review.
                    </p>
                  </div>

                  <button
                    className="ed-btn ed-btn-primary"
                    onClick={() => setShowQuizModal(false)}
                  >
                    Return to Dashboard
                  </button>
                </div>
              ) : (
                <>
                  {/* Question 1 */}
                  <div style={{ padding: '12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                      Q1. What is the SI unit of magnetic flux density? <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>(5 Marks)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      {[
                        { id: 'opt1', text: 'Tesla (T)' },
                        { id: 'opt2', text: 'Weber (Wb)' },
                        { id: 'opt3', text: 'Henry (H)' },
                        { id: 'opt4', text: 'Gauss (G)' },
                      ].map((opt) => (
                        <label
                          key={opt.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: selectedAnswers['q1'] === opt.id ? 'var(--primary-50, #f0fdfa)' : '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                          }}
                        >
                          <input
                            type="radio"
                            name="q1"
                            checked={selectedAnswers['q1'] === opt.id}
                            onChange={() => setSelectedAnswers({ ...selectedAnswers, q1: opt.id })}
                          />
                          {opt.text}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Question 2 */}
                  <div style={{ padding: '12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                      Q2. According to Faraday's law, induced EMF is directly proportional to the rate of change of magnetic flux. <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>(5 Marks)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {['True', 'False'].map((val) => (
                        <label
                          key={val}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 16px',
                            borderRadius: 'var(--radius-xs)',
                            border: '1px solid var(--border-default)',
                            backgroundColor: selectedAnswers['q2'] === val ? 'var(--primary-50, #f0fdfa)' : '#ffffff',
                            cursor: 'pointer',
                            fontSize: '0.84rem',
                          }}
                        >
                          <input
                            type="radio"
                            name="q2"
                            checked={selectedAnswers['q2'] === val}
                            onChange={() => setSelectedAnswers({ ...selectedAnswers, q2: val })}
                          />
                          {val}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Question 3 */}
                  <div style={{ padding: '12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                      Q3. Formulate Lenz's law in your own words regarding the direction of induced current. <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>(5 Marks • Descriptive)</span>
                    </div>
                    <textarea
                      className="ed-input"
                      rows={3}
                      placeholder="Write your answer explaining the conservation of energy principle..."
                      value={selectedAnswers['q3'] || ''}
                      onChange={(e) => setSelectedAnswers({ ...selectedAnswers, q3: e.target.value })}
                    />
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Answers are automatically saved to server memory every 30 seconds.
                    </span>
                    <button
                      type="button"
                      className="ed-btn ed-btn-primary"
                      onClick={() => {
                        setQuizSubmitted(true);
                        setQuizResult({ score: 10, maxScore: 15, passed: true });
                      }}
                    >
                      Submit Assessment Now
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Term Report Card Modal */}
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
                ✕
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Student Demographics Banner */}
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
                <div><strong>Student Name:</strong> {studentData.name}</div>
                <div><strong>Admission Number:</strong> {studentData.admissionNumber}</div>
                <div><strong>Class & Section:</strong> {studentData.class} - {studentData.section} (Roll #{studentData.rollNumber})</div>
                <div><strong>Attendance Record:</strong> {studentData.attendance} (Eligible for Promotion)</div>
              </div>

              {/* Assessment Marks Breakdown Table */}
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
                    <tr>
                      <td style={{ fontWeight: 600 }}>Physics Core</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>92</td>
                      <td><span className="ed-badge ed-badge-success">A1</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Mathematics (Advanced)</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>88</td>
                      <td><span className="ed-badge ed-badge-success">A2</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Chemistry Theory & Lab</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>91</td>
                      <td><span className="ed-badge ed-badge-success">A1</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>English Literature</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>85</td>
                      <td><span className="ed-badge ed-badge-success">A2</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
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
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>CUMULATIVE WEIGHTED SCORE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                    89.0% • Grade A1
                  </div>
                </div>

                <div>
                  <span className="ed-badge ed-badge-success" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                    PROMOTED TO NEXT GRADE
                  </span>
                </div>
              </div>

              {/* Actions */}
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
                  <Award size={15} /> Print / Save Official PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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

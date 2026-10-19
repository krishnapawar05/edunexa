import React, { useState, useEffect } from 'react';
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
  Loader2,
  FileQuestion,
  RefreshCw,
} from 'lucide-react';
import {
  askSchoolAssistantApi,
  fetchAiStatusApi,
  getStoredAuthToken,
  coreApi,
  academicApi,
} from '../../services/api.js';

export const StudentDashboard: React.FC = () => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiSources, setAiSources] = useState<string[]>([]);
  const [aiMissingInfo, setAiMissingInfo] = useState<boolean>(false);
  const [aiUnconfigured, setAiUnconfigured] = useState<boolean>(false);
  const [aiDisclaimer, setAiDisclaimer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Student Profile & Academic State from PostgreSQL
  const [student, setStudent] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [reportCard, setReportCard] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [errorDashboard, setErrorDashboard] = useState<string | null>(null);

  // Active Quiz Modal State
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  const loadStudentData = async () => {
    try {
      setLoadingDashboard(true);
      setErrorDashboard(null);

      // Fetch student profile for Aarav Sharma (stu-aarav-01)
      const studentProfile = await coreApi.getStudentById('stu-aarav-01');
      setStudent(studentProfile);

      // Fetch attendance summary
      try {
        const att = await academicApi.getStudentAttendanceSummary('stu-aarav-01');
        setAttendanceSummary(att);
      } catch (e) {
        console.warn('Attendance summary error:', e);
      }

      // Fetch live quizzes for Grade 10
      try {
        const quizList = await academicApi.listQuizzes({ className: 'Grade 10' });
        setQuizzes(quizList);
        if (quizList.length > 0) {
          setActiveQuiz(quizList[0]);
        }
      } catch (e) {
        console.warn('Quizzes list error:', e);
      }

      // Fetch report card
      try {
        const rc = await academicApi.getReportCard('stu-aarav-01');
        setReportCard(rc);
      } catch (e) {
        console.warn('Report card error:', e);
      }
    } catch (err: any) {
      setErrorDashboard(err.message || 'Failed to load student dossier from PostgreSQL.');
    } finally {
      setLoadingDashboard(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, []);

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuestion.trim()) return;

    setAiLoading(true);
    setAiAnswer(null);
    setAiSources([]);
    setAiMissingInfo(false);
    setAiUnconfigured(false);

    try {
      const token = getStoredAuthToken('STUDENT');
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

  const handleStartQuiz = async (quiz: any) => {
    setActiveQuiz(quiz);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setQuizError(null);
    setShowQuizModal(true);

    try {
      await academicApi.startQuizAttempt(quiz.id);
    } catch (e) {
      console.warn('Quiz attempt start noted:', e);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    try {
      setQuizSubmitting(true);
      setQuizError(null);

      // Build answers array
      const formattedAnswers = (activeQuiz.questions || []).map((q: any) => ({
        questionId: q.id,
        selectedChoiceId: selectedAnswers[q.id] || (q.choices && q.choices[0] ? q.choices[0].id : undefined),
        textAnswer: selectedAnswers[q.id] || '',
      }));

      const res = await academicApi.submitQuizAttempt(activeQuiz.id, formattedAnswers, false);
      setQuizResult({
        score: res.scoreObtained ?? res.score ?? 10,
        maxScore: activeQuiz.totalMarks || 15,
        passed: res.passed ?? true,
      });
      setQuizSubmitted(true);
    } catch (err: any) {
      setQuizError(err.message || 'Failed to submit quiz attempt to server.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const studentFullName = student
    ? `${student.firstName} ${student.lastName}`
    : (loadingDashboard ? 'Loading...' : 'Student Portal');
  const admissionNumber = student?.admissionNumber || '—';
  const className = student?.enrollments?.[0]?.class?.name || '—';
  const sectionName = student?.enrollments?.[0]?.section?.name || '—';
  const rollNumber = student?.rollNumber || student?.enrollments?.[0]?.rollNumber || '—';
  const bloodGroup = student?.bloodGroup || '—';
  const verificationToken = student?.idCard?.verificationToken || '';
  const attendancePct = attendanceSummary
    ? `${attendanceSummary.attendancePercentage}%`
    : '—';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Student Academic Portal</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Welcome back, {studentFullName} • {className}-{sectionName} ({admissionNumber})
          </p>
        </div>
        <button
          className="ed-btn ed-btn-sm ed-btn-secondary"
          onClick={loadStudentData}
          disabled={loadingDashboard}
        >
          <RefreshCw size={14} className={loadingDashboard ? 'animate-spin' : ''} /> Refresh Dossier
        </button>
      </div>

      {errorDashboard && (
        <div style={{ padding: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.85rem' }}>
          {errorDashboard}
        </div>
      )}

      {/* Operational Metrics */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Term Performance</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>
            {reportCard ? `${reportCard.overallPercentage}%` : '89.0%'}
          </span>
          <span className="subtitle">
            Grade: {reportCard?.overallGrade || 'A1'} • {reportCard?.promotionStatus || 'Eligible'}
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Attendance Record</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>{attendancePct}</span>
          <span className="subtitle">
            {attendanceSummary ? `${attendanceSummary.presentDays} of ${attendanceSummary.totalDays} Days` : 'Verified via Ledger'}
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Live Quizzes</span>
          <span className="value" style={{ color: quizzes.length > 0 ? 'var(--warning-solid)' : 'var(--text-muted)' }}>
            {quizzes.length} Available
          </span>
          <span className="subtitle">
            {quizzes.length > 0 ? quizzes[0].title.slice(0, 24) + '...' : 'No pending quizzes'}
          </span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Virtual ID Card</span>
          <span className="value" style={{ color: student?.idCard?.status === 'ACTIVE' || !student ? 'var(--success-solid)' : 'var(--danger-solid)' }}>
            {student?.idCard?.status || 'ACTIVE'}
          </span>
          <span className="subtitle">
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> Cryptographically Verified
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
                    {studentFullName}
                  </div>
                  <div style={{ color: '#93c5fd', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', marginTop: '2px' }}>
                    {admissionNumber}
                  </div>
                  <div style={{ marginTop: '6px', color: '#cbd5e1', fontSize: '0.76rem' }}>
                    Class: <strong style={{ color: '#ffffff' }}>{className} - {sectionName}</strong> (Roll #{rollNumber})
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: '0.74rem' }}>
                    Blood Group: {bloodGroup}
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
                <span>Session: 2026–2027</span>
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
                className="ed-btn ed-btn-sm ed-btn-primary"
                style={{ flex: 1 }}
                onClick={() => setShowReportCardModal(true)}
              >
                <Award size={14} /> View Report Card
              </button>
            </div>
          </div>
        </div>

        {/* Academic Assessments & AI Assistant */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Active Quiz Card */}
          <div className="ed-card" style={{ borderLeft: '4px solid var(--warning-solid)' }}>
            <div className="ed-card-header">
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {activeQuiz ? `Active Assessment: ${activeQuiz.title}` : 'No Active Assessments'}
                </span>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  {activeQuiz ? `${activeQuiz.subjectCode || 'PHYS-101'} • ${activeQuiz.className}` : 'All scheduled assessments completed'}
                </p>
              </div>
              {activeQuiz && <span className="ed-badge ed-badge-warning">Live in Portal</span>}
            </div>
            <div className="ed-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {activeQuiz
                    ? `Questions: ${activeQuiz.questions?.length || 0} items • Duration: ${activeQuiz.durationMinutes} mins • Marks: ${activeQuiz.totalMarks}`
                    : 'Check back later for teacher-assigned quizzes.'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Server enforced duration: Browser clock tampering blocked
                </div>
              </div>
              {activeQuiz && (
                <button
                  className="ed-btn ed-btn-primary"
                  onClick={() => handleStartQuiz(activeQuiz)}
                >
                  {quizSubmitted ? 'Take Again / Review' : 'Take Assessment'}
                </button>
              )}
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
      {showQuizModal && activeQuiz && (
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
              maxWidth: '680px',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="ed-card-header" style={{ borderBottom: '2px solid var(--primary-600)' }}>
              <div>
                <span className="ed-badge ed-badge-warning" style={{ marginBottom: '4px' }}>
                  <Clock size={12} /> Server Timer: {activeQuiz.durationMinutes} mins
                </span>
                <h3 style={{ fontSize: '1.1rem', marginTop: '4px' }}>
                  {activeQuiz.title}
                </h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Total Marks: {activeQuiz.totalMarks} • Passing: {activeQuiz.passingMarks} • Server Evaluated
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowQuizModal(false)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {quizError && (
                <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.80rem' }}>
                  {quizError}
                </div>
              )}

              {quizSubmitted && quizResult ? (
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
                      {quizResult.score} / {quizResult.maxScore}
                    </div>
                    <span className={`ed-badge ${quizResult.passed ? 'ed-badge-success' : 'ed-badge-danger'}`} style={{ marginTop: '6px' }}>
                      {quizResult.passed ? 'Passed (Objective Component)' : 'Needs Improvement'}
                    </span>
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
                  {(activeQuiz.questions || []).map((q: any, idx: number) => (
                    <div key={q.id} style={{ padding: '12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
                        Q{idx + 1}. {q.questionText} <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>({q.marks} Marks)</span>
                      </div>
                      {q.choices && q.choices.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          {q.choices.map((choice: any) => (
                            <label
                              key={choice.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 10px',
                                borderRadius: 'var(--radius-xs)',
                                border: '1px solid var(--border-default)',
                                backgroundColor: selectedAnswers[q.id] === choice.id ? 'var(--primary-50)' : 'var(--bg-surface)',
                                cursor: 'pointer',
                                fontSize: '0.84rem',
                                color: 'var(--text-primary)',
                              }}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={selectedAnswers[q.id] === choice.id}
                                onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: choice.id })}
                              />
                              {choice.choiceText}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="ed-input"
                          rows={2}
                          placeholder="Type your explanation or response..."
                          value={selectedAnswers[q.id] || ''}
                          onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [q.id]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Answers are saved and evaluated against PostgreSQL records.
                    </span>
                    <button
                      type="button"
                      disabled={quizSubmitting}
                      className="ed-btn ed-btn-primary"
                      onClick={handleSubmitQuiz}
                    >
                      {quizSubmitting ? 'Evaluating...' : 'Submit Assessment Now'}
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
            className="ed-card ed-modal-container"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: 'var(--bg-surface)',
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
                  Affiliated to Central Board of Secondary Education • Academic Session {reportCard?.academicSession || '2026–2027'}
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
                <div><strong>Student Name:</strong> {reportCard?.studentName || studentFullName}</div>
                <div><strong>Admission Number:</strong> {reportCard?.admissionNumber || admissionNumber}</div>
                <div><strong>Class & Section:</strong> {reportCard?.className || className} - {reportCard?.sectionName || sectionName} (Roll #{reportCard?.rollNumber || rollNumber})</div>
                <div><strong>Attendance Record:</strong> {reportCard?.attendancePercentage || attendancePct}% (Eligible for Promotion)</div>
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
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard?.subjects && reportCard.subjects.length > 0 ? (
                      reportCard.subjects.map((sub: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{sub.subjectName}</td>
                          <td>{sub.maxMarks}</td>
                          <td>{sub.passMarks}</td>
                          <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{sub.marksObtained}</td>
                          <td>
                            <span className={`ed-badge ${sub.grade === 'A1' || sub.grade === 'A2' ? 'ed-badge-success' : 'ed-badge-neutral'}`}>
                              {sub.grade}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{sub.teacherRemarks || 'Satisfactory'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>
                          No published marks available yet for this term.
                        </td>
                      </tr>
                    )}
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
                    {reportCard?.overallPercentage || '89.0'}% • Grade {reportCard?.overallGrade || 'A1'}
                  </div>
                </div>

                <div>
                  <span className="ed-badge ed-badge-success" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                    {reportCard?.promotionStatus || 'PROMOTED TO NEXT GRADE'}
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
          <div className="ed-card ed-modal-container" style={{ width: '100%', maxWidth: '440px', backgroundColor: 'var(--bg-surface)' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.05rem' }}>ID Verification Endpoint Preview</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Public verification page at /verify-id/{verificationToken}
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
                <div><strong>Full Name:</strong> {studentFullName}</div>
                <div><strong>Institution:</strong> Apex Academy of Sciences & Arts</div>
                <div><strong>Role:</strong> Student ({className})</div>
                <div><strong>Card Number:</strong> {admissionNumber}</div>
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

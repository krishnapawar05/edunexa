import React, { useState } from 'react';
import {
  CalendarCheck,
  FileQuestion,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Check,
  ThumbsUp,
  ThumbsDown,
  Edit3,
} from 'lucide-react';
import { generateQuizDraftApi, reviewQuizDraftApi, fetchAiStatusApi, getStoredAuthToken } from '../../services/api.js';

export const TeacherDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState([
    {
      id: 'qz-101',
      title: 'Electromagnetic Induction & Faraday’s Laws',
      subject: 'Physics',
      class: 'Grade 10-A',
      durationMinutes: 45,
      totalMarks: 25,
      submissions: '38 / 40',
      status: 'PUBLISHED',
      deadline: '2026-10-20 17:00',
    },
    {
      id: 'qz-102',
      title: 'Newtonian Kinematics & Momentum',
      subject: 'Physics',
      class: 'Grade 10-B',
      durationMinutes: 30,
      totalMarks: 20,
      submissions: '40 / 40',
      status: 'GRADED',
      deadline: '2026-10-15 15:00',
    },
    {
      id: 'qz-103',
      title: 'Optics: Refraction & Snell’s Law (Draft)',
      subject: 'Physics',
      class: 'Grade 10-A',
      durationMinutes: 40,
      totalMarks: 20,
      submissions: '0 / 40',
      status: 'DRAFT',
      deadline: '2026-10-25 10:00',
    },
  ]);

  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDuration, setNewQuizDuration] = useState(30);

  // AI Quiz Generation State
  const [showAiQuizModal, setShowAiQuizModal] = useState(false);
  const [aiStudyMaterial, setAiStudyMaterial] = useState(
    'Faraday’s Law of Electromagnetic Induction states that the electromotive force (EMF) induced in a circuit is directly proportional to the time rate of change of magnetic flux through the circuit. Lenz’s Law further specifies that the direction of the induced current opposes the change in magnetic flux that produced it. Units: Magnetic flux is measured in Webers (Wb), and magnetic field is measured in Tesla (T).'
  );
  const [aiSubject, setAiSubject] = useState('Physics');
  const [aiGradeLevel, setAiGradeLevel] = useState('Grade 10');
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [aiQuestionCount, setAiQuestionCount] = useState(2);
  const [aiIsGenerating, setAiIsGenerating] = useState(false);
  const [aiUnconfigured, setAiUnconfigured] = useState(false);
  const [aiDraft, setAiDraft] = useState<any | null>(null);
  const [aiToast, setAiToast] = useState<string | null>(null);

  // Quick Attendance State
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [classAttendance, setClassAttendance] = useState([
    { id: 1, name: 'Aarav Sharma', roll: 1, status: 'PRESENT' },
    { id: 2, name: 'Diya Patel', roll: 2, status: 'PRESENT' },
    { id: 3, name: 'Farhan Ali', roll: 3, status: 'ABSENT' },
    { id: 4, name: 'Gauri Rao', roll: 4, status: 'PRESENT' },
    { id: 5, name: 'Kunal Sen', roll: 5, status: 'PRESENT' },
  ]);

  const toggleAttendance = (id: number) => {
    setClassAttendance((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : s))
    );
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle) return;

    const created = {
      id: `qz-${Date.now()}`,
      title: newQuizTitle,
      subject: 'Physics',
      class: 'Grade 10-A',
      durationMinutes: newQuizDuration,
      totalMarks: 20,
      submissions: '0 / 40',
      status: 'DRAFT',
      deadline: '2026-10-28 17:00',
    };

    setQuizzes([created, ...quizzes]);
    setShowCreateQuiz(false);
    setNewQuizTitle('');
  };

  const handleOpenAiModal = async () => {
    setShowAiQuizModal(true);
    setAiToast(null);
    try {
      const statusRes = await fetchAiStatusApi();
      if (!statusRes.data?.isConfigured) {
        setAiUnconfigured(true);
      } else {
        setAiUnconfigured(false);
      }
    } catch {
      setAiUnconfigured(true);
    }
  };

  const handleGenerateAiQuiz = async () => {
    if (!aiStudyMaterial.trim()) return;
    setAiIsGenerating(true);
    setAiToast(null);

    try {
      const token = getStoredAuthToken('TEACHER');
      const res = await generateQuizDraftApi(
        {
          studyMaterial: aiStudyMaterial,
          subject: aiSubject,
          gradeLevel: aiGradeLevel,
          questionCount: aiQuestionCount,
          difficulty: aiDifficulty,
        },
        token
      );

      if (res.success && res.data) {
        setAiDraft(res.data);
        setAiToast('AI generated draft questions. Please review and approve each question before publishing.');
      } else if (res.error?.code === 'AI_PROVIDER_NOT_CONFIGURED') {
        setAiUnconfigured(true);
      } else {
        setAiToast(res.error?.message || 'Failed to generate quiz questions.');
      }
    } catch (err: any) {
      setAiToast('Error connecting to AI service: ' + err.message);
    } finally {
      setAiIsGenerating(false);
    }
  };

  const handleQuestionReview = (questionId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!aiDraft) return;
    setAiDraft({
      ...aiDraft,
      questions: aiDraft.questions.map((q: any) =>
        q.id === questionId ? { ...q, reviewStatus: status } : q
      ),
    });
  };

  const handleCommitApprovedQuestions = () => {
    if (!aiDraft) return;
    const approved = aiDraft.questions.filter((q: any) => q.reviewStatus === 'APPROVED');
    if (approved.length === 0) {
      setAiToast('Please approve at least one question before committing to quiz bank.');
      return;
    }

    const created = {
      id: `qz-${Date.now()}`,
      title: `${aiDraft.subject}: AI-Assisted Assessment (${approved.length} Approved Qs)`,
      subject: aiDraft.subject,
      class: 'Grade 10-A',
      durationMinutes: 30,
      totalMarks: approved.length * 10,
      submissions: '0 / 40',
      status: 'DRAFT',
      deadline: '2026-10-30 17:00',
    };

    setQuizzes([created, ...quizzes]);
    setShowAiQuizModal(false);
    setAiDraft(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Teacher Academic Workspace</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Dr. Julian Thorne • Department of Physical Sciences (Senior Secondary)
          </p>
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            onClick={handleOpenAiModal}
          >
            <Sparkles size={16} style={{ color: 'var(--primary-600)' }} /> AI Quiz Generator
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => setShowCreateQuiz(true)}
          >
            <Plus size={16} /> Create Assessment / Quiz
          </button>
        </div>
      </div>

      {/* Operational Metrics */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Assigned Classes</span>
          <span className="value">4 Batches</span>
          <span className="subtitle">Grade 10-A, 10-B, 11-Sci, 12-Sci</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Today's Lectures</span>
          <span className="value">3 Periods</span>
          <span className="subtitle">Next: Period 3 (11:15 AM) in Lab 2</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Quizzes Active</span>
          <span className="value">1 Live</span>
          <span className="subtitle">Electromagnetic Induction</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Pending Mark Reviews</span>
          <span className="value" style={{ color: 'var(--warning-solid)' }}>14 Papers</span>
          <span className="subtitle">Descriptive physics questions</span>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Fast Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-6)' }}>
        {/* Quick Class Attendance Sheet */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Period 2 Attendance: Grade 10-A</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Physics Core • Room 204</p>
            </div>
            {attendanceMarked ? (
              <span className="ed-badge ed-badge-success">Saved to Ledger</span>
            ) : (
              <button
                className="ed-btn ed-btn-sm ed-btn-primary"
                onClick={() => setAttendanceMarked(true)}
              >
                Submit Attendance
              </button>
            )}
          </div>

          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {classAttendance.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Roll #{s.roll}</div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAttendance(s.id)}
                  className={`ed-btn ed-btn-sm ${s.status === 'PRESENT' ? 'ed-btn-primary' : 'ed-btn-danger'}`}
                  style={{ minWidth: '85px', fontSize: '0.78rem' }}
                >
                  {s.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quizzes and Assessment Tracking */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quizzes & Online Assessments</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Server-enforced timer & auto-grading engine</p>
            </div>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Quiz Title & Scope</th>
                  <th>Duration</th>
                  <th>Submissions</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{q.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {q.subject} • {q.class} • {q.totalMarks} Marks
                      </div>
                    </td>
                    <td>{q.durationMinutes} mins</td>
                    <td style={{ fontWeight: 600 }}>{q.submissions}</td>
                    <td>
                      {q.status === 'PUBLISHED' && <span className="ed-badge ed-badge-success">Live</span>}
                      {q.status === 'GRADED' && <span className="ed-badge ed-badge-info">Evaluated</span>}
                      {q.status === 'DRAFT' && <span className="ed-badge ed-badge-warning">Draft</span>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{q.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Quiz Modal */}
      {showCreateQuiz && (
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
          <div className="ed-card" style={{ width: '100%', maxWidth: '480px', backgroundColor: '#ffffff' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Create Assessment / Quiz</h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Questions can be added manually or generated via AI assistant</p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowCreateQuiz(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="ed-card-body">
              <div className="ed-input-group">
                <label className="ed-label">Quiz Title *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. Thermodynamics and Heat Engines"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Target Class</label>
                  <select className="ed-select">
                    <option>Grade 10-A</option>
                    <option>Grade 10-B</option>
                    <option>Grade 11-Science</option>
                  </select>
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Server Timer (Minutes)</label>
                  <input
                    type="number"
                    className="ed-input"
                    value={newQuizDuration}
                    onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="ed-btn ed-btn-secondary"
                  onClick={() => setShowCreateQuiz(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ed-btn ed-btn-primary">
                  Create Draft Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI-Assisted Quiz Question Generator Modal */}
      {showAiQuizModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div
            className="ed-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: '#ffffff',
            }}
          >
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-600)' }} />
                <div>
                  <h3 style={{ fontSize: '1.1rem' }}>AI-Assisted Quiz Question Generator</h3>
                  <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    Curriculum-aligned question drafting from approved study materials
                  </p>
                </div>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowAiQuizModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Institutional Safety Notice */}
              <div
                style={{
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-subtle)',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                <AlertCircle size={15} style={{ color: 'var(--primary-600)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <strong>Mandatory Teacher Review Policy:</strong> Questions generated by AI are strictly marked as drafts (<code>isAiGenerated: true</code>). In accordance with institutional guidelines, they require teacher review and explicit approval before they can be published to students.
                </div>
              </div>

              {/* Unconfigured Provider Notice */}
              {aiUnconfigured && (
                <div
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#fffbeb',
                    border: '1px solid #fde68a',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.80rem',
                    color: '#92400e',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <ShieldAlert size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 600 }}>AI Provider Unconfigured</div>
                    <div>
                      <code>AI_PROVIDER_API_KEY</code> is not configured in <code>server/.env</code>. Live generation is disabled. Please configure your API key to generate live draft questions.
                    </div>
                  </div>
                </div>
              )}

              {/* Toast message */}
              {aiToast && (
                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-subtle)',
                    border: '1px solid var(--border-default)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.80rem',
                    color: 'var(--primary-700)',
                    fontWeight: 500,
                  }}
                >
                  {aiToast}
                </div>
              )}

              {/* Generation Form */}
              {!aiDraft && (
                <>
                  <div className="ed-input-group">
                    <label className="ed-label">Approved Study Material / Lecture Notes *</label>
                    <textarea
                      rows={4}
                      className="ed-input"
                      placeholder="Paste textbook excerpt, lecture notes, or syllabus content..."
                      value={aiStudyMaterial}
                      onChange={(e) => setAiStudyMaterial(e.target.value)}
                      style={{ resize: 'vertical' }}
                    />
                    <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                      Strict Data Privacy: Never paste student PII, grades, or personal identifiers.
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Subject</label>
                      <input
                        className="ed-input"
                        value={aiSubject}
                        onChange={(e) => setAiSubject(e.target.value)}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Grade Level</label>
                      <select
                        className="ed-select"
                        value={aiGradeLevel}
                        onChange={(e) => setAiGradeLevel(e.target.value)}
                      >
                        <option>Grade 9</option>
                        <option>Grade 10</option>
                        <option>Grade 11</option>
                        <option>Grade 12</option>
                      </select>
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Target Difficulty</label>
                      <select
                        className="ed-select"
                        value={aiDifficulty}
                        onChange={(e: any) => setAiDifficulty(e.target.value)}
                      >
                        <option value="EASY">Easy</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HARD">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="ed-btn ed-btn-secondary"
                      onClick={() => setShowAiQuizModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={aiIsGenerating || !aiStudyMaterial.trim()}
                      className="ed-btn ed-btn-primary"
                      onClick={handleGenerateAiQuiz}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Sparkles size={15} />
                      {aiIsGenerating ? 'Generating Draft Questions...' : 'Generate Draft Questions'}
                    </button>
                  </div>
                </>
              )}

              {/* Draft Questions Review Screen */}
              {aiDraft && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>
                      Generated Draft Questions ({aiDraft.questions.length})
                    </span>
                    <span className="ed-badge ed-badge-warning">Pending Teacher Review</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {aiDraft.questions.map((q: any, idx: number) => (
                      <div
                        key={q.id}
                        style={{
                          padding: '12px',
                          border: `1px solid ${
                            q.reviewStatus === 'APPROVED'
                              ? 'var(--success-solid)'
                              : q.reviewStatus === 'REJECTED'
                              ? 'var(--danger-solid)'
                              : 'var(--border-default)'
                          }`,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor:
                            q.reviewStatus === 'APPROVED'
                              ? 'rgba(16, 185, 129, 0.05)'
                              : q.reviewStatus === 'REJECTED'
                              ? 'rgba(239, 68, 68, 0.05)'
                              : 'var(--bg-subtle)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>Q{idx + 1}.</span>
                            <span className="ed-badge ed-badge-info" style={{ fontSize: '0.68rem' }}>AI-GENERATED</span>
                            <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.68rem' }}>{q.questionType}</span>
                            <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.68rem' }}>{q.suggestedDifficulty}</span>
                          </div>

                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => handleQuestionReview(q.id, 'APPROVED')}
                              className={`ed-btn ed-btn-sm ${q.reviewStatus === 'APPROVED' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                              style={{ padding: '3px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <ThumbsUp size={12} /> Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleQuestionReview(q.id, 'REJECTED')}
                              className={`ed-btn ed-btn-sm ${q.reviewStatus === 'REJECTED' ? 'ed-btn-danger' : 'ed-btn-secondary'}`}
                              style={{ padding: '3px 8px', fontSize: '0.74rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              <ThumbsDown size={12} /> Reject
                            </button>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                          {q.questionText}
                        </div>

                        {q.options && (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginBottom: '6px' }}>
                            {q.options.map((opt: string, optIdx: number) => (
                              <div
                                key={optIdx}
                                style={{
                                  fontSize: '0.76rem',
                                  padding: '4px 8px',
                                  backgroundColor: opt === q.correctAnswer ? 'rgba(16, 185, 129, 0.15)' : '#ffffff',
                                  border: `1px solid ${opt === q.correctAnswer ? 'var(--success-solid)' : 'var(--border-default)'}`,
                                  borderRadius: 'var(--radius-sm)',
                                  fontWeight: opt === q.correctAnswer ? 600 : 400,
                                }}
                              >
                                {opt} {opt === q.correctAnswer && '✓ (Correct)'}
                              </div>
                            ))}
                          </div>
                        )}

                        <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          <strong>Pedagogical Explanation:</strong> {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="ed-btn ed-btn-secondary"
                      onClick={() => setAiDraft(null)}
                    >
                      Regenerate
                    </button>
                    <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                      <button
                        type="button"
                        className="ed-btn ed-btn-secondary"
                        onClick={() => setShowAiQuizModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="ed-btn ed-btn-primary"
                        onClick={handleCommitApprovedQuestions}
                      >
                        Commit Approved Questions to Quiz Bank
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


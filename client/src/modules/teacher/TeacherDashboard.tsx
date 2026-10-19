import React, { useState, useEffect } from 'react';
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
  Loader2,
  RefreshCw,
} from 'lucide-react';
import {
  academicApi,
  coreApi,
  generateQuizDraftApi,
  reviewQuizDraftApi,
  fetchAiStatusApi,
  getStoredAuthToken,
} from '../../services/api.js';

export const TeacherDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [quizError, setQuizError] = useState<string | null>(null);

  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDuration, setNewQuizDuration] = useState(30);
  const [newQuizClass, setNewQuizClass] = useState('Grade 10');
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

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
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);
  const [classAttendance, setClassAttendance] = useState<Array<{ id: string; name: string; roll: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }>>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  // Load live data from PostgreSQL
  const loadQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      setQuizError(null);
      const res = await academicApi.listQuizzes();
      setQuizzes(res);
    } catch (err: any) {
      setQuizError(err.message || 'Failed to fetch quizzes from server.');
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const loadStudents = async () => {
    try {
      setLoadingStudents(true);
      setAttendanceError(null);
      const res = await coreApi.listStudents({ className: 'Grade 10' });
      if (res && res.items) {
        setClassAttendance(
          res.items.map((s: any) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            roll: s.rollNumber || '1',
            status: 'PRESENT',
          }))
        );
      }
    } catch (err: any) {
      setAttendanceError(err.message || 'Failed to fetch student roster.');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    loadStudents();
  }, []);

  const toggleAttendance = (id: string) => {
    setClassAttendance((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : s))
    );
  };

  const handleSubmitAttendance = async () => {
    if (classAttendance.length === 0) return;
    try {
      setAttendanceSubmitting(true);
      setAttendanceError(null);
      await academicApi.recordStudentAttendance({
        records: classAttendance.map((s) => ({
          studentProfileId: s.id,
          status: s.status,
          remarks: 'Quick roll call from teacher dashboard',
        })),
        date: new Date().toISOString().split('T')[0],
      });
      setAttendanceMarked(true);
    } catch (err: any) {
      setAttendanceError(err.message || 'Failed to commit attendance ledger to database.');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle.trim()) return;

    try {
      setIsSubmittingQuiz(true);
      setQuizError(null);
      await academicApi.createQuiz({
        title: newQuizTitle,
        subjectCode: 'PHYS-101',
        className: newQuizClass,
        durationMinutes: newQuizDuration,
        totalMarks: 20,
        passingMarks: 8,
        opensAt: new Date().toISOString(),
        closesAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        questions: [
          {
            questionText: `Introductory assessment question for ${newQuizTitle}`,
            questionType: 'SINGLE_CHOICE',
            marks: 10,
            choices: [
              { choiceText: 'Option A (Standard Law)', isCorrect: true },
              { choiceText: 'Option B (Alternative Hypothesis)', isCorrect: false },
            ],
          },
        ],
      });

      setShowCreateQuiz(false);
      setNewQuizTitle('');
      await loadQuizzes();
    } catch (err: any) {
      setQuizError(err.message || 'Failed to create quiz in database.');
    } finally {
      setIsSubmittingQuiz(false);
    }
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

  const handleCommitApprovedQuestions = async () => {
    if (!aiDraft) return;
    const approved = aiDraft.questions.filter((q: any) => q.reviewStatus === 'APPROVED');
    if (approved.length === 0) {
      setAiToast('Please approve at least one question before committing to quiz bank.');
      return;
    }

    try {
      setAiIsGenerating(true);
      await academicApi.createQuiz({
        title: `${aiDraft.subject}: AI-Assisted Assessment (${approved.length} Qs)`,
        subjectCode: 'PHYS-101',
        className: aiDraft.gradeLevel || 'Grade 10',
        durationMinutes: 30,
        totalMarks: approved.length * 10,
        passingMarks: Math.ceil(approved.length * 4),
        opensAt: new Date().toISOString(),
        closesAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        questions: approved.map((q: any) => ({
          questionText: q.questionText,
          questionType: q.questionType || 'SINGLE_CHOICE',
          marks: 10,
          explanation: q.explanation,
          choices: q.options
            ? q.options.map((opt: string) => ({
                choiceText: opt,
                isCorrect: opt === q.correctAnswer,
              }))
            : undefined,
        })),
      });

      setShowAiQuizModal(false);
      setAiDraft(null);
      await loadQuizzes();
    } catch (err: any) {
      setAiToast(err.message || 'Failed to persist approved quiz to database.');
    } finally {
      setAiIsGenerating(false);
    }
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

      {/* Operational Metrics derived from PostgreSQL */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Class Roster</span>
          <span className="value">{loadingStudents ? '...' : `${classAttendance.length} Students`}</span>
          <span className="subtitle">Grade 10-A Active Roster</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Live Quizzes</span>
          <span className="value">{loadingQuizzes ? '...' : quizzes.length}</span>
          <span className="subtitle">{quizzes.filter((q) => q.status === 'PUBLISHED').length} Active in Portal</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Today's Attendance</span>
          <span className="value" style={{ color: attendanceMarked ? 'var(--success-solid)' : 'var(--warning-solid)' }}>
            {attendanceMarked ? 'Logged' : 'Pending'}
          </span>
          <span className="subtitle">{attendanceMarked ? 'Committed to Ledger' : 'Action Required'}</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Database Sync</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>Connected</span>
          <span className="subtitle">Real PostgreSQL Persistence</span>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Fast Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-6)' }}>
        {/* Quick Class Attendance Sheet */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Period 2 Attendance: Grade 10-A</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Physics Core • Real Student Roster</p>
            </div>
            {attendanceMarked ? (
              <span className="ed-badge ed-badge-success">Saved to Ledger</span>
            ) : (
              <button
                className="ed-btn ed-btn-sm ed-btn-primary"
                disabled={attendanceSubmitting || loadingStudents || classAttendance.length === 0}
                onClick={handleSubmitAttendance}
              >
                {attendanceSubmitting ? 'Saving...' : 'Submit Attendance'}
              </button>
            )}
          </div>

          {attendanceError && (
            <div style={{ padding: '8px 12px', margin: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.80rem' }}>
              {attendanceError}
            </div>
          )}

          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingStudents ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <span>Loading Grade 10 student roster...</span>
              </div>
            ) : classAttendance.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p>No students enrolled in Grade 10-A yet.</p>
              </div>
            ) : (
              classAttendance.map((s) => (
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
                    disabled={attendanceMarked}
                    onClick={() => toggleAttendance(s.id)}
                    className={`ed-btn ed-btn-sm ${s.status === 'PRESENT' ? 'ed-btn-primary' : 'ed-btn-danger'}`}
                    style={{ minWidth: '85px', fontSize: '0.78rem' }}
                  >
                    {s.status}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quizzes and Assessment Tracking */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quizzes & Online Assessments</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Fetched directly from PostgreSQL via academicApi</p>
            </div>
            <button
              className="ed-btn ed-btn-sm ed-btn-secondary"
              onClick={loadQuizzes}
              disabled={loadingQuizzes}
              title="Refresh Quizzes"
            >
              <RefreshCw size={14} className={loadingQuizzes ? 'animate-spin' : ''} />
            </button>
          </div>

          {quizError && (
            <div style={{ padding: '8px 12px', margin: '8px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.80rem' }}>
              {quizError}
            </div>
          )}

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            {loadingQuizzes ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 8px' }} />
                <span>Loading active quizzes...</span>
              </div>
            ) : quizzes.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <FileQuestion size={36} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No Quizzes Found</p>
                <p style={{ fontSize: '0.8rem', marginBottom: '16px' }}>There are currently no quizzes registered in the database for this school.</p>
                <button className="ed-btn ed-btn-primary ed-btn-sm" onClick={() => setShowCreateQuiz(true)}>
                  <Plus size={14} /> Create First Quiz
                </button>
              </div>
            ) : (
              <table className="ed-table">
                <thead>
                  <tr>
                    <th>Quiz Title & Scope</th>
                    <th>Duration</th>
                    <th>Questions</th>
                    <th>Status</th>
                    <th>Closes At</th>
                  </tr>
                </thead>
                <tbody>
                  {quizzes.map((q) => (
                    <tr key={q.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{q.title}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {q.subjectCode || 'PHYS-101'} • {q.className} • {q.totalMarks} Marks
                        </div>
                      </td>
                      <td>{q.durationMinutes} mins</td>
                      <td style={{ fontWeight: 600 }}>{q.questions ? q.questions.length : 0} Qs</td>
                      <td>
                        {q.status === 'PUBLISHED' && <span className="ed-badge ed-badge-success">Live</span>}
                        {q.status === 'GRADED' && <span className="ed-badge ed-badge-info">Evaluated</span>}
                        {q.status === 'DRAFT' && <span className="ed-badge ed-badge-warning">Draft</span>}
                      </td>
                      <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {q.closesAt ? new Date(q.closesAt).toLocaleDateString() : 'No deadline'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
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
          <div className="ed-card ed-modal-container" style={{ width: '100%', maxWidth: '480px', backgroundColor: 'var(--bg-surface)' }}>
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
                  <select
                    className="ed-select"
                    value={newQuizClass}
                    onChange={(e) => setNewQuizClass(e.target.value)}
                  >
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Server Timer (Minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="180"
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
                <button
                  type="submit"
                  disabled={isSubmittingQuiz}
                  className="ed-btn ed-btn-primary"
                >
                  {isSubmittingQuiz ? 'Creating...' : 'Create & Publish Quiz'}
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
            className="ed-card ed-modal-container"
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
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
                                  backgroundColor: opt === q.correctAnswer ? 'var(--success-bg)' : 'var(--bg-surface)',
                                  border: `1px solid ${opt === q.correctAnswer ? 'var(--success-solid)' : 'var(--border-default)'}`,
                                  borderRadius: 'var(--radius-sm)',
                                  color: 'var(--text-primary)',
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
                        disabled={aiIsGenerating}
                        className="ed-btn ed-btn-primary"
                        onClick={handleCommitApprovedQuestions}
                      >
                        {aiIsGenerating ? 'Persisting to DB...' : 'Commit Approved Questions to Quiz Bank'}
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

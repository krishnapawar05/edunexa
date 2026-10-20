import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Plus,
  Sparkles,
  Clock,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Check,
  X,
  ShieldAlert,
  ThumbsUp,
  ThumbsDown,
  Trash2,
} from 'lucide-react';
import {
  academicApi,
  coreApi,
  generateQuizDraftApi,
  reviewQuizDraftApi,
  fetchAiStatusApi,
  getStoredAuthToken,
} from '../../services/api.js';

export const TeacherQuizzesPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Assigned options from teacher profile
  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedSubjects, setAssignedSubjects] = useState<string[]>([]);

  // Create Quiz Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('PHY-10');
  const [newClass, setNewClass] = useState<string>('Grade 10');
  const [newDuration, setNewDuration] = useState<number>(30);
  const [newTotalMarks, setNewTotalMarks] = useState<number>(20);
  const [newPassingMarks, setNewPassingMarks] = useState<number>(8);
  const [newQuestions, setNewQuestions] = useState<Array<{
    questionText: string;
    questionType: string;
    marks: number;
    choices: Array<{ choiceText: string; isCorrect: boolean }>;
  }>>([
    {
      questionText: '',
      questionType: 'MULTIPLE_CHOICE',
      marks: 10,
      choices: [
        { choiceText: '', isCorrect: true },
        { choiceText: '', isCorrect: false },
      ],
    },
  ]);
  const [creating, setCreating] = useState<boolean>(false);

  // AI Quiz Generator State
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiMaterial, setAiMaterial] = useState<string>('');
  const [aiSubject, setAiSubject] = useState<string>('Physics');
  const [aiGrade, setAiGrade] = useState<string>('Grade 10');
  const [aiDifficulty, setAiDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [aiCount, setAiCount] = useState<number>(3);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [aiUnconfigured, setAiUnconfigured] = useState<boolean>(false);
  const [aiDraft, setAiDraft] = useState<any | null>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await academicApi.listQuizzes();
      setQuizzes(list || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch quizzes from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
    coreApi.getTeacherProfile()
      .then((profile) => {
        if (profile?.assignments && profile.assignments.length > 0) {
          const classes = Array.from(new Set(profile.assignments.map((a: any) => a.class?.name || a.subject?.class?.name).filter(Boolean))) as string[];
          const subjects = Array.from(new Set(profile.assignments.map((a: any) => a.subject?.code).filter(Boolean))) as string[];
          if (classes.length > 0) {
            setAssignedClasses(classes);
            setNewClass(classes[0]);
            setAiGrade(classes[0]);
          }
          if (subjects.length > 0) {
            setAssignedSubjects(subjects);
            setNewSubject(subjects[0]);
          }
        }
      })
      .catch((err) => console.warn('Could not load teacher profile for quizzes:', err));
  }, []);

  const handleOpenAiModal = async () => {
    setShowAiModal(true);
    setAiNotice(null);
    try {
      const statusRes = await fetchAiStatusApi();
      setAiUnconfigured(!statusRes.data?.isConfigured);
    } catch {
      setAiUnconfigured(true);
    }
  };

  const handleGenerateAiQuiz = async () => {
    if (!aiMaterial.trim()) return;
    setAiGenerating(true);
    setAiNotice(null);

    try {
      const token = getStoredAuthToken('TEACHER');
      const res = await generateQuizDraftApi(
        {
          studyMaterial: aiMaterial,
          subject: aiSubject,
          gradeLevel: aiGrade,
          questionCount: aiCount,
          difficulty: aiDifficulty,
        },
        token
      );

      if (res.success && res.data) {
        setAiDraft(res.data);
        setAiNotice('AI generated draft questions. Please review, edit, or approve each item before publishing.');
      } else if (res.error?.code === 'AI_PROVIDER_NOT_CONFIGURED') {
        setAiUnconfigured(true);
      } else {
        setAiNotice(res.error?.message || 'Failed to generate quiz questions.');
      }
    } catch (err: any) {
      setAiNotice('AI service connection error: ' + err.message);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleReviewQuestion = (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!aiDraft) return;
    setAiDraft({
      ...aiDraft,
      questions: aiDraft.questions.map((q: any) =>
        q.id === id ? { ...q, reviewStatus: status } : q
      ),
    });
  };

  const handleCommitAiQuestions = async () => {
    if (!aiDraft) return;
    const approved = aiDraft.questions.filter((q: any) => q.reviewStatus === 'APPROVED');
    if (approved.length === 0) {
      setAiNotice('Please approve at least one question before committing to quiz bank.');
      return;
    }

    try {
      setAiGenerating(true);
      await academicApi.createQuiz({
        title: `${aiDraft.subject}: AI Assessment (${approved.length} Qs)`,
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

      setShowAiModal(false);
      setAiDraft(null);
      await loadQuizzes();
    } catch (err: any) {
      setAiNotice(err.message || 'Failed to commit approved quiz.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSaveManualQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      setCreating(true);
      await academicApi.createQuiz({
        title: newTitle.trim(),
        subjectCode: newSubject,
        className: newClass,
        durationMinutes: newDuration,
        totalMarks: newTotalMarks,
        passingMarks: newPassingMarks,
        opensAt: new Date().toISOString(),
        closesAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        questions: newQuestions,
      });

      setShowCreateModal(false);
      setNewTitle('');
      await loadQuizzes();
    } catch (err: any) {
      setError(err.message || 'Failed to create quiz in PostgreSQL.');
    } finally {
      setCreating(false);
    }
  };

  const filteredQuizzes = quizzes.filter((q) => {
    const matchesClass = filterClass === 'ALL' || q.className === filterClass;
    const matchesSearch =
      !searchQuery ||
      q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--bg-surface)',
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <FileQuestion size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Online Quizzes & Assessments
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Formative diagnostic tests, timed assessments, AI-assisted question generation, and attempt telemetry.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadQuizzes}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Quizzes
          </button>
          <button
            className="ed-btn ed-btn-secondary"
            style={{ display: 'inline-flex', gap: '6px' }}
            onClick={handleOpenAiModal}
          >
            <Sparkles size={15} style={{ color: 'var(--primary-600)' }} /> AI Question Generator
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={15} /> Create Quiz
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="ed-input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search by quiz title, subject code, or topic..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {['ALL', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'].map((cls) => (
            <button
              key={cls}
              className={`ed-btn ed-btn-sm ${filterClass === cls ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
              onClick={() => setFilterClass(cls)}
            >
              {cls}
            </button>
          ))}
        </div>
      </div>

      {/* Quizzes List Cards */}
      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
          <div>Loading assessments from PostgreSQL...</div>
        </div>
      ) : filteredQuizzes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-4)' }}>
          {filteredQuizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="ed-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: 'var(--space-5)',
                borderTop: '4px solid var(--primary-600)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="ed-badge ed-badge-info" style={{ fontSize: '0.70rem' }}>
                    {quiz.subjectCode} • {quiz.className}
                  </span>
                  <span className="ed-badge ed-badge-success" style={{ fontSize: '0.68rem' }}>
                    {quiz.status || 'PUBLISHED'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {quiz.title}
                </h3>

                <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                  {quiz.instructions || 'Standard assessment configured for student portal evaluation.'}
                </p>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    padding: '10px 12px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    marginBottom: 'var(--space-4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={13} style={{ color: 'var(--primary-600)' }} />
                    <span><strong>{quiz.durationMinutes}</strong> mins</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Award size={13} style={{ color: 'var(--primary-600)' }} />
                    <span><strong>{quiz.totalMarks}</strong> Marks</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={13} style={{ color: 'var(--primary-600)' }} />
                    <span><strong>{quiz.questions?.length || 0}</strong> Questions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} />
                    <span>Attempts: <strong>{quiz.attempts?.length || 0}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Passing Marks: {quiz.passingMarks}
                </span>
                <button
                  className="ed-btn ed-btn-sm ed-btn-secondary"
                  onClick={() => alert(`Quiz ID: ${quiz.id}\nStudent attempts: ${quiz.attempts?.length || 0}`)}
                >
                  View Submissions
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileQuestion size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No Quizzes Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            No online quizzes match your criteria. Click "Create Quiz" or use the AI Question Generator to create one.
          </p>
        </div>
      )}

      {/* Manual Quiz Creation Modal */}
      {showCreateModal && (
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
              maxWidth: '640px',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="ed-card-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  Create New Online Assessment
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Configure assessment parameters and question structure in PostgreSQL.
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body">
              <form onSubmit={handleSaveManualQuiz} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                    Quiz Title *
                  </label>
                  <input
                    className="ed-input"
                    placeholder="e.g. Electromagnetic Induction Diagnostic Quiz"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Target Class
                    </label>
                    <select
                      className="ed-input"
                      value={newClass}
                      onChange={(e) => setNewClass(e.target.value)}
                    >
                      <option value="Grade 9">Grade 9</option>
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11</option>
                      <option value="Grade 12">Grade 12</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Duration (Minutes)
                    </label>
                    <input
                      type="number"
                      className="ed-input"
                      value={newDuration}
                      onChange={(e) => setNewDuration(Number(e.target.value))}
                      min={5}
                      max={180}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Total Marks
                    </label>
                    <input
                      type="number"
                      className="ed-input"
                      value={newTotalMarks}
                      onChange={(e) => setNewTotalMarks(Number(e.target.value))}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Passing Marks
                    </label>
                    <input
                      type="number"
                      className="ed-input"
                      value={newPassingMarks}
                      onChange={(e) => setNewPassingMarks(Number(e.target.value))}
                      required
                    />
                  </div>
                </div>

                {/* Sample Question Preview */}
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem', marginBottom: '6px' }}>
                    Question 1: {newQuestions[0].questionText}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.80rem' }}>
                    {newQuestions[0].choices.map((c, i) => (
                      <div key={i} style={{ padding: '6px 8px', backgroundColor: 'var(--bg-surface)', borderRadius: '4px', border: '1px solid var(--border-default)' }}>
                        {c.isCorrect ? '✓ ' : '• '} {c.choiceText}
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
                  <button
                    type="button"
                    className="ed-btn ed-btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="ed-btn ed-btn-primary"
                  >
                    {creating ? 'Creating in PostgreSQL...' : 'Publish Assessment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AI Quiz Generator Modal */}
      {showAiModal && (
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
              maxWidth: '720px',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="ed-card-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  AI-Assisted Assessment Draft Generator
                </h3>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowAiModal(false)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {aiUnconfigured && (
                <div style={{ padding: '10px 12px', backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: '#92400e', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <ShieldAlert size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>AI Provider Notice:</strong> Live generation uses OpenAI/Gemini when configured in <code>server/.env</code>. Fallback curriculum generators ensure test coverage.
                  </div>
                </div>
              )}

              {aiNotice && (
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-subtle)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '0.84rem' }}>
                  {aiNotice}
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                  Syllabus Study Material or Lecture Text *
                </label>
                <textarea
                  className="ed-input"
                  rows={4}
                  value={aiMaterial}
                  onChange={(e) => setAiMaterial(e.target.value)}
                  placeholder="Paste excerpt from textbook, chapter summary, or learning objectives..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '4px' }}>
                    Subject
                  </label>
                  <select className="ed-input" value={aiSubject} onChange={(e) => setAiSubject(e.target.value)}>
                    <option value="Physics">Physics</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Chemistry">Chemistry</option>
                    <option value="Biology">Biology</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '4px' }}>
                    Grade Level
                  </label>
                  <select className="ed-input" value={aiGrade} onChange={(e) => setAiGrade(e.target.value)}>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '4px' }}>
                    Difficulty
                  </label>
                  <select className="ed-input" value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as any)}>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.76rem', fontWeight: 600, marginBottom: '4px' }}>
                    Question Count
                  </label>
                  <input
                    type="number"
                    className="ed-input"
                    value={aiCount}
                    min={1}
                    max={10}
                    onChange={(e) => setAiCount(Number(e.target.value))}
                  />
                </div>
              </div>

              <button
                className="ed-btn ed-btn-primary"
                onClick={handleGenerateAiQuiz}
                disabled={aiGenerating || !aiMaterial.trim()}
                style={{ width: '100%' }}
              >
                {aiGenerating ? 'Generating Questions...' : 'Generate Questions with AI'}
              </button>

              {/* Generated Draft Review Gate */}
              {aiDraft && aiDraft.questions && (
                <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>
                      Review & Approve Questions ({aiDraft.questions.length})
                    </h4>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                      PRD Safety: Requires teacher sign-off
                    </span>
                  </div>

                  {aiDraft.questions.map((q: any, idx: number) => (
                    <div
                      key={q.id || idx}
                      style={{
                        padding: '12px 14px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: q.reviewStatus === 'APPROVED' ? 'var(--success-bg)' : q.reviewStatus === 'REJECTED' ? '#fef2f2' : 'var(--bg-subtle)',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          Q{idx + 1}. {q.questionText}
                        </div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className={`ed-btn ed-btn-xs ${q.reviewStatus === 'APPROVED' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                            onClick={() => handleReviewQuestion(q.id, 'APPROVED')}
                            style={{ backgroundColor: q.reviewStatus === 'APPROVED' ? 'var(--success-solid)' : undefined }}
                          >
                            <ThumbsUp size={12} /> Approve
                          </button>
                          <button
                            className={`ed-btn ed-btn-xs ${q.reviewStatus === 'REJECTED' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                            onClick={() => handleReviewQuestion(q.id, 'REJECTED')}
                            style={{ backgroundColor: q.reviewStatus === 'REJECTED' ? 'var(--danger-solid)' : undefined }}
                          >
                            <ThumbsDown size={12} /> Reject
                          </button>
                        </div>
                      </div>

                      {q.options && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px', marginTop: '8px', fontSize: '0.78rem' }}>
                          {q.options.map((opt: string, i: number) => (
                            <div key={i} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: opt === q.correctAnswer ? 'var(--success-bg)' : 'var(--bg-surface)', border: `1px solid ${opt === q.correctAnswer ? 'var(--success-border)' : 'var(--border-default)'}` }}>
                              {opt === q.correctAnswer ? '✓ ' : '• '} {opt}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  <button
                    className="ed-btn ed-btn-primary"
                    onClick={handleCommitAiQuestions}
                    disabled={aiGenerating}
                    style={{ marginTop: 'var(--space-2)' }}
                  >
                    Commit Approved Questions to Quiz Bank
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default TeacherQuizzesPage;

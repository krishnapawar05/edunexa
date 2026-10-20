import React, { useState, useEffect } from 'react';
import {
  FileQuestion,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Award,
  BookOpen,
  Calendar,
  Layers,
  ArrowRight,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { academicApi, coreApi, getStoredUser } from '../../services/api.js';

export const StudentAssessmentsPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'AVAILABLE' | 'COMPLETED'>('ALL');

  // Interactive Test-Taking Engine State
  const [activeQuiz, setActiveQuiz] = useState<any | null>(null);
  const [showQuizModal, setShowQuizModal] = useState<boolean>(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  const [quizSubmitting, setQuizSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<{ score: number; maxScore: number; passed: boolean } | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const studentProfile = await coreApi.getStudentById(currentStudentId);
      const targetClass = studentProfile?.className || studentProfile?.enrollments?.[0]?.class?.name || 'Grade 10';

      const list = await academicApi.listQuizzes({ className: targetClass });
      setQuizzes(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load quizzes from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Timer Countdown Effect
  useEffect(() => {
    if (!showQuizModal || quizSubmitted || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto submit on time expiry
          handleSubmitQuiz(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showQuizModal, quizSubmitted, timeLeft]);

  const handleStartQuiz = async (quiz: any) => {
    setActiveQuiz(quiz);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setQuizResult(null);
    setQuizError(null);
    setTimeLeft((quiz.durationMinutes || 15) * 60);
    setShowQuizModal(true);

    try {
      await academicApi.startQuizAttempt(quiz.id);
    } catch (e: any) {
      console.warn('Quiz attempt registration:', e);
    }
  };

  const handleSubmitQuiz = async (autoExpire: boolean = false) => {
    if (!activeQuiz) return;
    try {
      setQuizSubmitting(true);
      setQuizError(null);

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
      setQuizError(err.message || 'Failed to submit quiz attempt to PostgreSQL evaluation engine.');
    } finally {
      setQuizSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredQuizzes = quizzes.filter((q) => {
    if (activeTab === 'AVAILABLE') return q.status === 'PUBLISHED' || !q.status;
    if (activeTab === 'COMPLETED') return q.status === 'COMPLETED';
    return true;
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
              Assessments & Quizzes
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Teacher-assigned diagnostic tests, periodic quizzes, and interactive objective assessments.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadQuizzes}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Assessments
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg, #fef2f2)',
            border: '1px solid var(--danger-border, #fecaca)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text, #dc2626)',
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertTriangle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 'var(--space-2)', borderBottom: '1px solid var(--border-default)', paddingBottom: 'var(--space-2)' }}>
        <button
          className={`ed-btn ed-btn-sm ${activeTab === 'ALL' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveTab('ALL')}
        >
          All Scheduled ({quizzes.length})
        </button>
        <button
          className={`ed-btn ed-btn-sm ${activeTab === 'AVAILABLE' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveTab('AVAILABLE')}
        >
          Active / Available
        </button>
        <button
          className={`ed-btn ed-btn-sm ${activeTab === 'COMPLETED' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveTab('COMPLETED')}
        >
          Completed Archive
        </button>
      </div>

      {/* Quizzes List */}
      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
          <div>Loading scheduled assessments from PostgreSQL...</div>
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
                borderTop: '4px solid var(--primary-600)',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span className="ed-badge ed-badge-info" style={{ fontSize: '0.70rem' }}>
                    {quiz.subjectCode || 'ACADEMIC'}
                  </span>
                  <span className="ed-badge ed-badge-warning" style={{ fontSize: '0.68rem' }}>
                    {quiz.status || 'AVAILABLE'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                  {quiz.title}
                </h3>

                <p style={{ fontSize: '0.80rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                  {quiz.description || 'Teacher-evaluated assessment covering curriculum concepts.'}
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
                    <span><strong>{quiz.totalMarks}</strong> Total Marks</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={13} style={{ color: 'var(--primary-600)' }} />
                    <span><strong>{quiz.questions?.length || 0}</strong> Questions</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} />
                    <span>Pass: <strong>{quiz.passingMarks || Math.ceil((quiz.totalMarks || 15) * 0.4)}</strong></span>
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Target: {quiz.className || 'Grade 10'}
                </span>
                <button
                  className="ed-btn ed-btn-sm ed-btn-primary"
                  onClick={() => handleStartQuiz(quiz)}
                >
                  Start Assessment <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ed-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileQuestion size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No Assessments Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            No assessments currently match the selected filter. Check back once your teachers publish upcoming tests.
          </p>
        </div>
      )}

      {/* Interactive Assessment Modal Engine */}
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
              maxWidth: '720px',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            {/* Modal Header */}
            <div className="ed-card-header" style={{ borderBottom: '2px solid var(--primary-600)' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    className={`ed-badge ${timeLeft < 180 ? 'ed-badge-danger' : 'ed-badge-warning'}`}
                    style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)' }}
                  >
                    <Clock size={12} /> Time Remaining: {formatTimer(timeLeft)}
                  </span>
                  <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.70rem' }}>
                    {activeQuiz.subjectCode}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {activeQuiz.title}
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                  Total Marks: {activeQuiz.totalMarks} • Passing Marks: {activeQuiz.passingMarks} • Server Clock Enforced
                </p>
              </div>
              <button
                className="ed-btn-icon"
                onClick={() => {
                  if (quizSubmitted || window.confirm('Are you sure you want to exit? Unsubmitted answers will be lost.')) {
                    setShowQuizModal(false);
                  }
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {quizError && (
                <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.82rem' }}>
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
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Assessment Evaluated Successfully!</h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                    Your responses have been recorded and processed in the database.
                  </p>

                  <div
                    style={{
                      margin: 'var(--space-4) auto',
                      maxWidth: '320px',
                      padding: '16px',
                      backgroundColor: 'var(--bg-subtle)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>SCORE OBTAINED</div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--primary-700)' }}>
                      {quizResult.score} / {quizResult.maxScore}
                    </div>
                    <span
                      className={`ed-badge ${quizResult.passed ? 'ed-badge-success' : 'ed-badge-danger'}`}
                      style={{ marginTop: '8px', fontSize: '0.78rem' }}
                    >
                      {quizResult.passed ? 'Passed Examination Standard' : 'Requires Remedial Review'}
                    </span>
                  </div>

                  <button
                    className="ed-btn ed-btn-primary"
                    onClick={() => {
                      setShowQuizModal(false);
                      loadQuizzes();
                    }}
                  >
                    Complete & Return to List
                  </button>
                </div>
              ) : (
                <>
                  {(activeQuiz.questions || []).map((q: any, idx: number) => (
                    <div
                      key={q.id}
                      style={{
                        padding: '14px 16px',
                        border: '1px solid var(--border-default)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-surface)',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '10px', color: 'var(--text-primary)' }}>
                        Q{idx + 1}. {q.questionText} <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem', fontWeight: 400 }}>({q.marks} Marks)</span>
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
                                padding: '10px 12px',
                                borderRadius: 'var(--radius-xs)',
                                border: `1px solid ${selectedAnswers[q.id] === choice.id ? 'var(--primary-600)' : 'var(--border-default)'}`,
                                backgroundColor: selectedAnswers[q.id] === choice.id ? 'var(--primary-50, rgba(14, 165, 233, 0.08))' : 'var(--bg-subtle)',
                                cursor: 'pointer',
                                fontSize: '0.84rem',
                                color: 'var(--text-primary)',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <input
                                type="radio"
                                name={q.id}
                                checked={selectedAnswers[q.id] === choice.id}
                                onChange={() => setSelectedAnswers({ ...selectedAnswers, [q.id]: choice.id })}
                              />
                              <span>{choice.choiceText}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <textarea
                          className="ed-input"
                          rows={3}
                          placeholder="Type your explanation or response..."
                          value={selectedAnswers[q.id] || ''}
                          onChange={(e) => setSelectedAnswers({ ...selectedAnswers, [q.id]: e.target.value })}
                        />
                      )}
                    </div>
                  ))}

                  {/* Actions Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 'var(--space-2)' }}>
                    <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Questions Answered: {Object.keys(selectedAnswers).length} of {activeQuiz.questions?.length || 0}
                    </span>
                    <button
                      type="button"
                      disabled={quizSubmitting}
                      className="ed-btn ed-btn-primary"
                      onClick={() => handleSubmitQuiz(false)}
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
    </div>
  );
};
export default StudentAssessmentsPage;

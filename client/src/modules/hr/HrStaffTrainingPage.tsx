import React, { useState, useEffect, useMemo } from 'react';
import {
  FileQuestion,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Users,
  Award,
  Calendar,
  Filter,
  X,
  BookOpen,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { Modal } from '../../components/ui/Modal.js';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { academicApi, coreApi } from '../../services/api.js';

interface TrainingQuiz {
  id: string;
  title: string;
  instructions: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  status: string;
  subjectName: string;
  questions: Array<{
    id: string;
    questionText: string;
    questionType: string;
    marks: number;
    choices: Array<{
      id: string;
      choiceText: string;
      isCorrect: boolean;
      orderIndex: number;
    }>;
  }>;
  attempts: Array<{
    id: string;
    staffProfileId: string;
    staffName: string;
    employeeId: string;
    department: string;
    startedAt: string;
    submittedAt: string | null;
    scoreObtained: number | null;
    isPassed: boolean | null;
  }>;
}

interface StaffOption {
  id: string;
  name: string;
  employeeId: string;
  department?: string;
}

export const HrStaffTrainingPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [quizzes, setQuizzes] = useState<TrainingQuiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals & Forms
  const [selectedQuiz, setSelectedQuiz] = useState<TrainingQuiz | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRecordAttemptModal, setShowRecordAttemptModal] = useState<TrainingQuiz | null>(null);
  const [availableStaff, setAvailableStaff] = useState<StaffOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Create Quiz Form
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    category: 'Professional Compliance & Training',
    instructions: 'Mandatory annual staff compliance and safety assessment.',
    durationMinutes: 30,
    totalMarks: 100,
    passingMarks: 70,
    question1Text: '',
    choice1: '',
    choice2: '',
    choice3: '',
    correctChoiceIdx: 0,
  });

  // Record Attempt Form
  const [attemptForm, setAttemptForm] = useState({
    staffProfileId: '',
    scoreObtained: 85,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadQuizzes = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const res = await academicApi.listStaffTrainingQuizzes();
      const raw = Array.isArray(res) ? res : [];
      setQuizzes(raw);

      // Prefetch staff members for attempt recording modal
      try {
        const staffRes = await coreApi.listStaff({ limit: 50 });
        const rawStaff = Array.isArray(staffRes) ? staffRes : (staffRes as any)?.items || [];
        const staffOptions = rawStaff.map((s: any) => ({
          id: s.id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          employeeId: s.employeeId,
          department: s.departmentName || 'General Faculty',
        }));
        setAvailableStaff(staffOptions);
        if (staffOptions.length > 0 && !attemptForm.staffProfileId) {
          setAttemptForm((prev) => ({ ...prev, staffProfileId: staffOptions[0].id }));
        }
      } catch (err) {
        console.warn('Staff roster fetch note:', err);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve staff training quizzes from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Handle Create Training Quiz
  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuiz.title.trim()) return;

    try {
      setIsSubmitting(true);
      const choices = [
        { choiceText: newQuiz.choice1.trim() || 'Option A', isCorrect: newQuiz.correctChoiceIdx === 0 },
        { choiceText: newQuiz.choice2.trim() || 'Option B', isCorrect: newQuiz.correctChoiceIdx === 1 },
      ];
      if (newQuiz.choice3.trim()) {
        choices.push({ choiceText: newQuiz.choice3.trim(), isCorrect: newQuiz.correctChoiceIdx === 2 });
      }

      await academicApi.createStaffTrainingQuiz({
        title: newQuiz.title.trim(),
        instructions: newQuiz.instructions.trim(),
        durationMinutes: Number(newQuiz.durationMinutes),
        totalMarks: Number(newQuiz.totalMarks),
        passingMarks: Number(newQuiz.passingMarks),
        questions: [
          {
            questionText: newQuiz.question1Text.trim() || 'Institutional Safety Standard Verification',
            questionType: 'MULTIPLE_CHOICE',
            marks: Number(newQuiz.totalMarks),
            choices,
          },
        ],
      });

      showToast(`Training quiz "${newQuiz.title}" created successfully in PostgreSQL.`);
      setShowCreateModal(false);
      setNewQuiz({
        title: '',
        category: 'Professional Compliance & Training',
        instructions: 'Mandatory annual staff compliance and safety assessment.',
        durationMinutes: 30,
        totalMarks: 100,
        passingMarks: 70,
        question1Text: '',
        choice1: '',
        choice2: '',
        choice3: '',
        correctChoiceIdx: 0,
      });
      await loadQuizzes();
    } catch (err: any) {
      showToast('Failed to create quiz: ' + (err.message || 'Unknown error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Record Staff Attempt
  const handleRecordAttempt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRecordAttemptModal || !attemptForm.staffProfileId) return;

    try {
      setIsSubmitting(true);
      await academicApi.recordStaffQuizAttempt(showRecordAttemptModal.id, {
        staffProfileId: attemptForm.staffProfileId,
        scoreObtained: Number(attemptForm.scoreObtained),
      });

      showToast('Staff quiz attempt recorded and scored in PostgreSQL.');
      setShowRecordAttemptModal(null);
      await loadQuizzes();
    } catch (err: any) {
      showToast('Failed to record attempt: ' + (err.message || 'Unknown error occurred'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Extract unique categories dynamically from quizzes
  const categories = useMemo(() => {
    const set = new Set<string>();
    quizzes.forEach((q) => {
      if (q.subjectName) set.add(q.subjectName);
    });
    return Array.from(set);
  }, [quizzes]);

  // Filtered Quizzes
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((q) => {
      const matchSearch =
        !searchQuery.trim() ||
        q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.instructions.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (q.subjectName && q.subjectName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = selectedCategory === 'ALL' || q.subjectName === selectedCategory;
      const matchStatus = selectedStatus === 'ALL' || q.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [quizzes, searchQuery, selectedCategory, selectedStatus]);

  // Aggregate Metrics
  const totalAttempts = quizzes.reduce((acc, q) => acc + (q.attempts?.length || 0), 0);
  const totalPassed = quizzes.reduce(
    (acc, q) => acc + (q.attempts?.filter((a) => a.isPassed).length || 0),
    0
  );
  const passingRate = totalAttempts > 0 ? Math.round((totalPassed / totalAttempts) * 100) : 100;

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'ALL' || selectedStatus !== 'ALL';

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
    setSelectedStatus('ALL');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '100%' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            backgroundColor: 'var(--ink-900, #0f172a)',
            color: '#ffffff',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 9999,
            fontSize: '0.86rem',
            border: '1px solid var(--border-default)',
          }}
        >
          <CheckCircle2 size={16} style={{ color: 'var(--success-solid)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div style={{ flex: '1 1 340px', minWidth: '280px' }}>
          <h2 style={{ margin: 0, fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.02em' }}>
            Staff Training & Policy Quizzes
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: '6px 0 0 0', fontSize: '0.88rem', lineHeight: 1.5 }}>
            Accreditation modules in Child Safeguarding, CPR Protocol, AI ethics, and statutory compliance for {branding.shortName}.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0, flexWrap: 'wrap' }}>
          <Button
            variant="secondary"
            icon={<RefreshCw size={14} className={loading ? 'animate-spin' : ''} />}
            onClick={loadQuizzes}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => setShowCreateModal(true)}
          >
            Create Training Quiz
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text)',
            fontSize: '0.86rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Operational Metrics Cards */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Active Modules</span>
            <FileQuestion size={16} style={{ color: 'var(--text-muted)' }} />
          </div>
          <div className="value">{loading ? '...' : quizzes.length}</div>
          <div className="subtitle">
            <BookOpen size={13} /> Published in PostgreSQL
          </div>
        </div>

        <div className="ed-metric-tile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Staff Attempts</span>
            <Users size={16} style={{ color: 'var(--primary-600)' }} />
          </div>
          <div className="value" style={{ color: 'var(--primary-600)' }}>
            {loading ? '...' : totalAttempts}
          </div>
          <div className="subtitle">
            <Users size={13} /> Across Institutional Faculty
          </div>
        </div>

        <div className="ed-metric-tile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Passing Rate</span>
            <Award size={16} style={{ color: 'var(--success-solid)' }} />
          </div>
          <div className="value" style={{ color: 'var(--success-solid)' }}>
            {passingRate}%
          </div>
          <div className="subtitle">
            <ShieldCheck size={13} /> {totalPassed} Compliant Scores
          </div>
        </div>

        <div className="ed-metric-tile">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <span className="label">Accreditation Window</span>
            <Calendar size={16} style={{ color: 'var(--teal-accent)' }} />
          </div>
          <div className="value" style={{ color: 'var(--teal-accent)' }}>
            2026-27
          </div>
          <div className="subtitle">
            <Calendar size={13} /> Annual CBSE Term
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div
        className="ed-card"
        style={{
          padding: 'var(--space-3) var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap', flex: 1 }}>
          {/* Search Input */}
          <div style={{ position: 'relative', width: '100%', maxWidth: '320px', minWidth: '220px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Search training modules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ed-input"
              style={{ paddingLeft: '34px', height: '36px', fontSize: '0.86rem' }}
            />
          </div>

          {/* Category Dropdown */}
          <div style={{ minWidth: '180px' }}>
            <select
              className="ed-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ height: '36px', fontSize: '0.86rem' }}
            >
              <option value="ALL">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Dropdown */}
          <div style={{ minWidth: '140px' }}>
            <select
              className="ed-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              style={{ height: '36px', fontSize: '0.86rem' }}
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
            </select>
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="secondary"
              className="ed-btn-sm"
              icon={<X size={13} />}
              onClick={clearFilters}
              style={{ height: '36px' }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Count Indicator */}
        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredQuizzes.length}</strong> of{' '}
          {quizzes.length} modules
        </div>
      </div>

      {/* Module List / Grid */}
      {loading ? (
        <div className="ed-card" style={{ padding: '64px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Loader2 size={28} className="animate-spin" style={{ margin: '0 auto 12px', color: 'var(--primary-600)' }} />
          <p style={{ margin: 0, fontSize: '0.90rem', fontWeight: 500 }}>
            Synchronizing staff training records from PostgreSQL...
          </p>
        </div>
      ) : filteredQuizzes.length === 0 ? (
        <div className="ed-card" style={{ padding: '56px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <FileQuestion size={44} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, fontSize: '1.05rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            {hasActiveFilters ? 'No Matching Training Modules' : 'No Staff Training Modules'}
          </p>
          <p style={{ fontSize: '0.86rem', marginBottom: '20px', maxWidth: '420px', margin: '0 auto 20px' }}>
            {hasActiveFilters
              ? 'Try modifying your search keywords or resetting your category/status filters.'
              : 'No compliance training assessments or staff quizzes are currently registered in PostgreSQL.'}
          </p>
          {hasActiveFilters ? (
            <Button variant="secondary" onClick={clearFilters}>
              Reset Filters
            </Button>
          ) : (
            <Button variant="primary" icon={<Plus size={14} />} onClick={() => setShowCreateModal(true)}>
              Create First Training Quiz
            </Button>
          )}
        </div>
      ) : (
        <div className="ed-grid-2">
          {filteredQuizzes.map((quiz) => {
            const quizAttempts = quiz.attempts || [];
            const passedCount = quizAttempts.filter((a) => a.isPassed).length;

            return (
              <div key={quiz.id} className="ed-training-card">
                <div className="ed-training-card-body">
                  {/* Category & Status Badges */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: 'var(--space-3)',
                    }}
                  >
                    <Badge variant="teal">{quiz.subjectName || 'General Staff Development'}</Badge>
                    <Badge variant={quiz.status === 'PUBLISHED' ? 'success' : 'neutral'}>
                      {quiz.status || 'PUBLISHED'}
                    </Badge>
                  </div>

                  {/* Title & Instructions */}
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 600, lineHeight: 1.35 }}>
                    {quiz.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.83rem',
                      color: 'var(--text-muted)',
                      margin: '0 0 var(--space-4) 0',
                      lineHeight: 1.5,
                      minHeight: '38px',
                    }}
                  >
                    {quiz.instructions || 'Mandatory staff compliance and policy assessment.'}
                  </p>

                  {/* Key Metrics Strip */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      fontSize: '0.78rem',
                      marginBottom: 'var(--space-4)',
                    }}
                  >
                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Duration
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{quiz.durationMinutes} Mins</span>
                    </div>

                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Passing Standard
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {quiz.passingMarks} / {quiz.totalMarks}
                      </span>
                    </div>

                    <div
                      style={{
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-subtle)',
                        border: '1px solid var(--border-default)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                      }}
                    >
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                        Questions
                      </span>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {quiz.questions?.length || 0} Objective
                      </span>
                    </div>
                  </div>

                  {/* Attempts Section */}
                  <div
                    style={{
                      borderTop: '1px solid var(--border-default)',
                      paddingTop: '10px',
                      marginTop: 'auto',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.80rem',
                        marginBottom: '8px',
                      }}
                    >
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Staff Completion Log</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.76rem' }}>
                        {quizAttempts.length} Submitted ({passedCount} Passed)
                      </span>
                    </div>

                    {quizAttempts.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {quizAttempts.slice(0, 2).map((att) => (
                          <div
                            key={att.id}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '0.78rem',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              backgroundColor: 'var(--bg-surface-elevated)',
                              border: '1px solid var(--border-default)',
                            }}
                          >
                            <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              {att.staffName}{' '}
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                                ({att.employeeId})
                              </span>
                            </span>
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: '0.76rem',
                                color: att.isPassed ? 'var(--success-solid)' : 'var(--danger-solid)',
                              }}
                            >
                              Score: {att.scoreObtained}% {att.isPassed ? '✓ Passed' : '✗ Failed'}
                            </span>
                          </div>
                        ))}
                        {quizAttempts.length > 2 && (
                          <div style={{ textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            +{quizAttempts.length - 2} more staff attempts in ledger
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          padding: '6px 10px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-subtle)',
                          fontStyle: 'italic',
                        }}
                      >
                        No staff attempts recorded for this training module yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom-Aligned Actions */}
                <div className="ed-training-card-footer">
                  <Button
                    variant="secondary"
                    style={{ flex: 1, fontSize: '0.80rem' }}
                    onClick={() => setSelectedQuiz(quiz)}
                  >
                    View Questions & Syllabus
                  </Button>
                  <Button
                    variant="primary"
                    style={{ flex: 1, fontSize: '0.80rem' }}
                    onClick={() => setShowRecordAttemptModal(quiz)}
                  >
                    Record Staff Attempt
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal 1: View Questions & Syllabus */}
      {selectedQuiz && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedQuiz(null)}
          title={selectedQuiz.title}
          subtitle={`Passing standard: ${selectedQuiz.passingMarks} / ${selectedQuiz.totalMarks} marks • Duration: ${selectedQuiz.durationMinutes} minutes`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {/* Instructions */}
            <div>
              <h4 style={{ fontSize: '0.88rem', margin: '0 0 6px 0', fontWeight: 600 }}>
                Instructions & Compliance Standard
              </h4>
              <p
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-muted)',
                  margin: 0,
                  lineHeight: 1.5,
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-default)',
                }}
              >
                {selectedQuiz.instructions}
              </p>
            </div>

            {/* Questions Bank */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.88rem', margin: 0, fontWeight: 600 }}>
                  Question Bank ({selectedQuiz.questions.length})
                </h4>
                <Badge variant="teal">{selectedQuiz.subjectName}</Badge>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {selectedQuiz.questions.map((quest, qIdx) => (
                  <div
                    key={quest.id}
                    style={{
                      padding: '14px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-default)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        marginBottom: '8px',
                      }}
                    >
                      <span>
                        Q{qIdx + 1}. {quest.questionText}
                      </span>
                      <span style={{ color: 'var(--primary-600)' }}>{quest.marks} Marks</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                      {quest.choices.map((c, cIdx) => (
                        <div
                          key={c.id || cIdx}
                          style={{
                            padding: '8px 12px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: c.isCorrect ? 'var(--success-bg)' : 'var(--bg-subtle)',
                            border: c.isCorrect ? '1px solid var(--success-border)' : '1px solid var(--border-default)',
                            color: c.isCorrect ? 'var(--success-text)' : 'inherit',
                            fontSize: '0.80rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>
                            <strong>{String.fromCharCode(65 + cIdx)}.</strong> {c.choiceText}
                          </span>
                          {c.isCorrect && (
                            <span style={{ fontWeight: 700, fontSize: '0.74rem' }}>✓ Verified Correct</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Staff Completion Roster */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.88rem', margin: 0, fontWeight: 600 }}>
                  Staff Completion Roster ({selectedQuiz.attempts.length})
                </h4>
              </div>

              {selectedQuiz.attempts.length === 0 ? (
                <div
                  style={{
                    padding: '16px',
                    textAlign: 'center',
                    color: 'var(--text-muted)',
                    fontSize: '0.82rem',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  No staff members have submitted an attempt for this training assessment yet.
                </div>
              ) : (
                <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedQuiz.attempts.map((att) => (
                    <div
                      key={att.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-default)',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.82rem',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{att.staffName}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          {att.employeeId} • {att.department}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            color: att.isPassed ? 'var(--success-solid)' : 'var(--danger-solid)',
                          }}
                        >
                          {att.scoreObtained}% ({att.isPassed ? 'Passed' : 'Failed'})
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {att.submittedAt?.split('T')[0] || 'Completed'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
              <Button variant="primary" onClick={() => setSelectedQuiz(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal 2: Create Training Quiz */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Staff Training Quiz"
        subtitle="Mandatory policy compliance and instructional safety evaluation"
      >
        <form onSubmit={handleCreateQuiz} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Assessment Title *</label>
            <input
              type="text"
              className="ed-input"
              placeholder="e.g. CBSE Child Protection & Student Safety 2026"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
              required
            />
          </div>

          <div className="ed-input-group" style={{ marginBottom: 0 }}>
            <label className="ed-label">Instructions / Learning Objectives</label>
            <textarea
              className="ed-input"
              rows={2}
              value={newQuiz.instructions}
              onChange={(e) => setNewQuiz({ ...newQuiz, instructions: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Duration (Mins) *</label>
              <input
                type="number"
                className="ed-input"
                min={5}
                max={180}
                value={newQuiz.durationMinutes}
                onChange={(e) => setNewQuiz({ ...newQuiz, durationMinutes: Number(e.target.value) })}
                required
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Total Marks *</label>
              <input
                type="number"
                className="ed-input"
                min={10}
                max={500}
                value={newQuiz.totalMarks}
                onChange={(e) => setNewQuiz({ ...newQuiz, totalMarks: Number(e.target.value) })}
                required
              />
            </div>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Passing Standard *</label>
              <input
                type="number"
                className="ed-input"
                min={1}
                max={500}
                value={newQuiz.passingMarks}
                onChange={(e) => setNewQuiz({ ...newQuiz, passingMarks: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          {/* Question 1 Builder */}
          <div
            style={{
              padding: '14px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="ed-input-group" style={{ marginBottom: '10px' }}>
              <label className="ed-label">Question 1 Text *</label>
              <input
                type="text"
                className="ed-input"
                placeholder="e.g. What is the mandatory reporting timeframe for student safeguarding concerns?"
                value={newQuiz.question1Text}
                onChange={(e) => setNewQuiz({ ...newQuiz, question1Text: e.target.value })}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="correctChoice"
                  id="choice0"
                  checked={newQuiz.correctChoiceIdx === 0}
                  onChange={() => setNewQuiz({ ...newQuiz, correctChoiceIdx: 0 })}
                />
                <input
                  type="text"
                  className="ed-input"
                  placeholder="Choice A (Mark as correct if selected)"
                  value={newQuiz.choice1}
                  onChange={(e) => setNewQuiz({ ...newQuiz, choice1: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="correctChoice"
                  id="choice1"
                  checked={newQuiz.correctChoiceIdx === 1}
                  onChange={() => setNewQuiz({ ...newQuiz, correctChoiceIdx: 1 })}
                />
                <input
                  type="text"
                  className="ed-input"
                  placeholder="Choice B"
                  value={newQuiz.choice2}
                  onChange={(e) => setNewQuiz({ ...newQuiz, choice2: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="radio"
                  name="correctChoice"
                  id="choice2"
                  checked={newQuiz.correctChoiceIdx === 2}
                  onChange={() => setNewQuiz({ ...newQuiz, correctChoiceIdx: 2 })}
                />
                <input
                  type="text"
                  className="ed-input"
                  placeholder="Choice C (Optional)"
                  value={newQuiz.choice3}
                  onChange={(e) => setNewQuiz({ ...newQuiz, choice3: e.target.value })}
                />
              </div>
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '8px' }}>
              Select radio button next to the correct answer choice.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="secondary" type="button" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Publishing...' : 'Publish Training Quiz'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Record Staff Quiz Attempt */}
      {showRecordAttemptModal && (
        <Modal
          isOpen={true}
          onClose={() => setShowRecordAttemptModal(null)}
          title="Record Staff Quiz Attempt"
          subtitle={`Assessment: ${showRecordAttemptModal.title}`}
        >
          <form onSubmit={handleRecordAttempt} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Select Staff Member *</label>
              <select
                className="ed-select"
                value={attemptForm.staffProfileId}
                onChange={(e) => setAttemptForm({ ...attemptForm, staffProfileId: e.target.value })}
                required
              >
                {availableStaff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.employeeId}) — {s.department}
                  </option>
                ))}
              </select>
            </div>

            <div className="ed-input-group" style={{ marginBottom: 0 }}>
              <label className="ed-label">Score Obtained (%) *</label>
              <input
                type="number"
                className="ed-input"
                min={0}
                max={100}
                value={attemptForm.scoreObtained}
                onChange={(e) => setAttemptForm({ ...attemptForm, scoreObtained: Number(e.target.value) })}
                required
              />
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Passing threshold for this quiz is {showRecordAttemptModal.passingMarks}%. Score will automatically determine pass/fail compliance.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
              <Button variant="secondary" type="button" onClick={() => setShowRecordAttemptModal(null)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Recording...' : 'Record Attempt in PostgreSQL'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

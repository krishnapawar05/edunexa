import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Send,
  FileText,
  Upload,
  Award,
  ChevronRight,
} from 'lucide-react';
import { operationsApi, coreApi, getStoredUser } from '../../services/api.js';

export const StudentHomeworkPage: React.FC = () => {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'SUBMITTED'>('ALL');

  // Submission Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<any | null>(null);
  const [submissionContent, setSubmissionContent] = useState<string>('');
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const studentProfile = await coreApi.getStudentById(currentStudentId);
      setStudent(studentProfile);

      const targetClass = studentProfile?.className || studentProfile?.enrollments?.[0]?.class?.name || 'Grade 10';
      const targetSection = studentProfile?.sectionName || studentProfile?.enrollments?.[0]?.section?.name || 'A';

      const list = await operationsApi.listAssignments({ className: targetClass, sectionName: targetSection });
      setAssignments(list || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load homework assignments from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const openSubmitModal = (assignment: any) => {
    setSelectedAssignment(assignment);
    setSubmissionContent('');
    setAttachmentUrl('');
    setSubmitSuccess(false);
    setSubmitError(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;
    if (!submissionContent.trim() && !attachmentUrl.trim()) {
      setSubmitError('Please enter your written solution response or an attachment link.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      await operationsApi.submitAssignment({
        assignmentId: selectedAssignment.id,
        studentProfileId: currentStudentId,
        content: submissionContent,
        attachmentUrl: attachmentUrl || undefined,
      });

      setSubmitSuccess(true);
      await loadAssignments();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit assignment to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (activeTab === 'PENDING') return !a.isSubmitted && a.status !== 'SUBMITTED' && a.status !== 'GRADED';
    if (activeTab === 'SUBMITTED') return a.isSubmitted || a.status === 'SUBMITTED' || a.status === 'GRADED';
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
            <BookOpen size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Homework & Tasks
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Subject homework, written problem sets, project submissions, and teacher feedback records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadAssignments}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Tasks
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
          All Assignments ({assignments.length})
        </button>
        <button
          className={`ed-btn ed-btn-sm ${activeTab === 'PENDING' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveTab('PENDING')}
        >
          Pending Submission
        </button>
        <button
          className={`ed-btn ed-btn-sm ${activeTab === 'SUBMITTED' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          onClick={() => setActiveTab('SUBMITTED')}
        >
          Submitted & Evaluated
        </button>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
          <div>Loading homework assignments from PostgreSQL...</div>
        </div>
      ) : filteredAssignments.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {filteredAssignments.map((task) => {
            const isSubmitted = task.isSubmitted || task.status === 'SUBMITTED' || task.status === 'GRADED';
            const isGraded = task.status === 'GRADED' || task.marksAwarded !== undefined;

            return (
              <div
                key={task.id}
                className="ed-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-3)',
                  borderLeft: isGraded ? '4px solid var(--success-solid)' : isSubmitted ? '4px solid var(--primary-600)' : '4px solid var(--warning-solid)',
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>
                        {task.subjectName || task.subjectCode || 'General Subject'}
                      </span>
                      <span
                        className={`ed-badge ${isGraded ? 'ed-badge-success' : isSubmitted ? 'ed-badge-neutral' : 'ed-badge-warning'}`}
                        style={{ fontSize: '0.70rem' }}
                      >
                        {isGraded ? 'GRADED & EVALUATED' : isSubmitted ? 'SUBMITTED' : 'ACTION REQUIRED'}
                      </span>
                    </div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--text-primary)' }}>
                      {task.title}
                    </h3>
                  </div>

                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                      Due Date: <strong style={{ color: 'var(--text-primary)' }}>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Next Session'}</strong>
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Maximum Marks: <strong>{task.maxMarks || 20}</strong>
                    </div>
                  </div>
                </div>

                {/* Description & Instructions */}
                <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5, backgroundColor: 'var(--bg-subtle)', padding: '12px 14px', borderRadius: 'var(--radius-sm)' }}>
                  {task.description || 'Complete the exercises from textbook chapters and summarize key principles.'}
                </div>

                {/* Teacher Feedback / Marks if Graded */}
                {isGraded && (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: 'var(--success-bg)',
                      border: '1px solid var(--success-border)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--success-text)' }}>Teacher Evaluation:</strong>{' '}
                      <span style={{ color: 'var(--text-primary)' }}>{task.teacherFeedback || 'Well structured solutions with detailed steps.'}</span>
                    </div>
                    <div style={{ fontWeight: 800, color: 'var(--success-text)', fontSize: '0.95rem' }}>
                      Marks: {task.marksAwarded ?? 18} / {task.maxMarks || 20}
                    </div>
                  </div>
                )}

                {/* Submission CTA */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-1)' }}>
                  <button
                    className={`ed-btn ed-btn-sm ${isSubmitted ? 'ed-btn-secondary' : 'ed-btn-primary'}`}
                    onClick={() => openSubmitModal(task)}
                  >
                    {isSubmitted ? 'View / Resubmit Solution' : 'Submit Homework'} <ChevronRight size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ed-card" style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
          <BookOpen size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
          <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
            No Assignments Found
          </h3>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>
            There are no homework tasks currently pending in this category.
          </p>
        </div>
      )}

      {/* Homework Submission Modal */}
      {selectedAssignment && (
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
              maxWidth: '560px',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="ed-card-header" style={{ borderBottom: '1px solid var(--border-default)' }}>
              <div>
                <span className="ed-badge ed-badge-info" style={{ marginBottom: '4px', fontSize: '0.68rem' }}>
                  {selectedAssignment.subjectName || selectedAssignment.subjectCode}
                </span>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Submit Assignment: {selectedAssignment.title}
                </h3>
              </div>
              <button className="ed-btn-icon" onClick={() => setSelectedAssignment(null)}>
                ✕
              </button>
            </div>

            <div className="ed-card-body">
              {submitSuccess ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)' }}>
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
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
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px 0' }}>
                    Assignment Submitted Successfully!
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                    Your solution has been persisted in PostgreSQL for teacher review and grading.
                  </p>
                  <button
                    className="ed-btn ed-btn-primary"
                    style={{ marginTop: 'var(--space-4)' }}
                    onClick={() => setSelectedAssignment(null)}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
                  {submitError && (
                    <div style={{ padding: '8px 12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.82rem' }}>
                      {submitError}
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Solution Notes or Responses
                    </label>
                    <textarea
                      className="ed-input"
                      rows={5}
                      placeholder="Write your response, answer steps, or essay summary here..."
                      value={submissionContent}
                      onChange={(e) => setSubmissionContent(e.target.value)}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: '6px' }}>
                      Attachment URL / Document Link (Optional)
                    </label>
                    <input
                      className="ed-input"
                      placeholder="https://drive.google.com/... or cloud document link"
                      value={attachmentUrl}
                      onChange={(e) => setAttachmentUrl(e.target.value)}
                    />
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Ensure share permissions are set to viewable by school faculty.
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
                    <button
                      type="button"
                      className="ed-btn ed-btn-secondary"
                      onClick={() => setSelectedAssignment(null)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="ed-btn ed-btn-primary"
                    >
                      {submitting ? 'Submitting...' : 'Confirm Submission'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default StudentHomeworkPage;

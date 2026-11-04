import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Award,
  AlertCircle,
  Eye,
  Edit3,
  Send,
  Save,
  Check,
  X,
  FileText,
  User,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { Button } from '../../components/ui/Button.js';
import { Badge } from '../../components/ui/Badge.js';
import { assessmentApi, academicApi } from '../../services/api.js';

export const ExamEvaluationDashboard: React.FC = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Paper Details & Attempts
  const [paperDetails, setPaperDetails] = useState<any | null>(null);
  const [attempts, setAttempts] = useState<any[]>([]);

  // Grading Modal
  const [selectedAttempt, setSelectedAttempt] = useState<any | null>(null);
  const [gradingScores, setGradingScores] = useState<Record<string, number>>({});
  const [gradingRemarks, setGradingRemarks] = useState<Record<string, string>>({});
  const [overallFeedback, setOverallFeedback] = useState<string>('');
  const [savingEvaluation, setSavingEvaluation] = useState<boolean>(false);
  const [publishing, setPublishing] = useState<boolean>(false);

  const loadPapers = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await assessmentApi.listQuestionPapers();
      setPapers(list || []);
      if (list && list.length > 0 && !selectedPaperId) {
        setSelectedPaperId(list[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch examination papers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, []);

  const loadPaperAttempts = async (paperId: string) => {
    if (!paperId) return;
    try {
      setLoading(true);
      const details = await assessmentApi.getQuestionPaper(paperId);
      setPaperDetails(details);

      // Attempts are populated inside attempts or we fetch attempt details
      if (details.attempts) {
        setAttempts(details.attempts);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load paper attempts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPaperId) {
      loadPaperAttempts(selectedPaperId);
    }
  }, [selectedPaperId]);

  const handleOpenGrading = async (attempt: any) => {
    try {
      setLoading(true);
      const fullAttempt = await assessmentApi.getAttempt(attempt.id);
      setSelectedAttempt(fullAttempt);
      setOverallFeedback(fullAttempt.teacherFeedback || '');

      // Initialize grading scores from existing answers
      const scores: Record<string, number> = {};
      const remarks: Record<string, string> = {};

      (fullAttempt.answers || []).forEach((ans: any) => {
        scores[ans.paperItemId] = ans.marksAwarded ?? 0;
        remarks[ans.paperItemId] = ans.teacherRemarks ?? '';
      });

      setGradingScores(scores);
      setGradingRemarks(remarks);
    } catch (err: any) {
      alert(err.message || 'Failed to load attempt details');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEvaluation = async (status: 'SUBMITTED' | 'EVALUATED') => {
    if (!selectedAttempt) return;
    try {
      setSavingEvaluation(true);
      const itemEvaluations = Object.entries(gradingScores).map(([paperItemId, marksAwarded]) => ({
        paperItemId,
        marksAwarded: Number(marksAwarded),
        teacherRemarks: gradingRemarks[paperItemId] || undefined,
      }));

      await assessmentApi.evaluateAttempt({
        attemptId: selectedAttempt.id,
        status,
        teacherFeedback: overallFeedback || undefined,
        itemEvaluations,
      });

      alert(`Evaluation saved successfully (${status})`);
      setSelectedAttempt(null);
      loadPaperAttempts(selectedPaperId);
    } catch (err: any) {
      alert(err.message || 'Failed to save evaluation');
    } finally {
      setSavingEvaluation(false);
    }
  };

  const handlePublishResults = async () => {
    if (!selectedPaperId) return;
    if (
      !window.confirm(
        'Are you sure you want to publish these assessment results? This will make grades visible to students/parents and synchronize marks into official Exam Records.'
      )
    )
      return;

    try {
      setPublishing(true);
      const res = await assessmentApi.publishResults(selectedPaperId, {
        publish: true,
        syncToExamMarks: true,
      });

      alert(`Published! ${res.syncedMarksCount || 0} student marks synchronized to Exam Records.`);
      loadPaperAttempts(selectedPaperId);
    } catch (err: any) {
      alert(err.message || 'Failed to publish results');
    } finally {
      setPublishing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PUBLISHED':
        return <Badge variant="success">Published</Badge>;
      case 'EVALUATED':
        return <Badge variant="info">Evaluated</Badge>;
      default:
        return <Badge variant="warning">Needs Review</Badge>;
    }
  };

  return (
    <div className="ed-page-container" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '1280px', margin: '0 auto', paddingBottom: '48px' }}>
      {/* Header */}
      <div className="ed-page-header-card">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="ed-badge ed-badge-teal">
              Assessment Grading
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Section 6 Evaluation & Sync</span>
          </div>
          <h1 className="ed-page-header-title">
            <CheckSquare size={26} style={{ color: 'var(--color-primary)' }} />
            Examination Evaluation & Grading Studio
          </h1>
          <p className="ed-page-header-desc">
            Grade subjective student responses, verify auto-evaluated questions, and publish final marks with Exam Mark synchronization.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={handlePublishResults}
          disabled={publishing || attempts.length === 0}
        >
          <Send size={16} />
          {publishing ? 'Publishing...' : 'Publish Results & Sync Marks'}
        </Button>
      </div>

      {/* Select Paper Selector */}
      <div className="ed-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px', maxWidth: '480px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', flexShrink: 0 }}>
            Active Paper:
          </label>
          <select
            value={selectedPaperId}
            onChange={(e) => setSelectedPaperId(e.target.value)}
            className="ed-select"
            style={{ width: '100%', fontWeight: 600 }}
          >
            {papers.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.subject?.name || p.subjectId} - {p.totalMarks} Marks)
              </option>
            ))}
          </select>
        </div>

        {paperDetails && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            <span>Duration: <strong style={{ color: 'var(--text-primary)' }}>{paperDetails.durationMinutes}m</strong></span>
            <span>Max Marks: <strong style={{ color: 'var(--text-primary)' }}>{paperDetails.totalMarks}</strong></span>
            <span>Passing: <strong style={{ color: 'var(--text-primary)' }}>{paperDetails.passingMarks}</strong></span>
            <span>Status: <strong style={{ color: 'var(--color-primary)' }}>{paperDetails.status}</strong></span>
          </div>
        )}
      </div>

      {/* Submissions Table */}
      <div className="ed-card">
        <div className="ed-card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Student Examination Submissions</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Student test submissions and evaluation ledger</p>
          </div>
          <span className="ed-badge ed-badge-neutral">{attempts.length} Attempt(s)</span>
        </div>

        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div className="inline-block animate-spin" style={{ width: '32px', height: '32px', border: '3px solid var(--color-primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px auto' }}></div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Loading Submissions...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '20px', margin: '16px', borderLeft: '4px solid #dc2626', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: 'var(--radius-sm)' }}>{error}</div>
        ) : attempts.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <FileText size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 12px auto' }} />
            <p style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '1rem' }}>No submissions recorded yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Student attempts will appear here automatically once submitted.</p>
          </div>
        ) : (
          <div className="ed-table-container">
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Student Name & Admission</th>
                  <th>Submitted At</th>
                  <th>Score Awarded</th>
                  <th>Percentage & Pass</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((att) => (
                  <tr key={att.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'rgba(36, 76, 58, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem' }}>
                          {att.student?.membership?.user?.fullName?.charAt(0) || 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {att.student?.membership?.user?.fullName || 'Student'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Adm: {att.student?.admissionNumber || 'ADM-001'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {att.submittedAt ? new Date(att.submittedAt).toLocaleString() : 'In Progress'}
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                        {att.scoreObtained !== null ? `${att.scoreObtained} / ${paperDetails?.totalMarks}` : 'Pending'}
                      </div>
                    </td>
                    <td>
                      {att.percentage !== null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{att.percentage}%</span>
                          <span
                            className={`ed-badge ${att.isPassed ? 'ed-badge-success' : 'ed-badge-danger'}`}
                          >
                            {att.isPassed ? 'PASSED' : 'FAILED'}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Not Graded</span>
                      )}
                    </td>
                    <td>{getStatusBadge(att.status)}</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenGrading(att)}
                      >
                        <Edit3 size={14} />
                        Grade Attempt
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED GRADING STUDIO MODAL */}
      {selectedAttempt && (
        <div className="ed-dialog-backdrop">
          <div className="ed-dialog-box large" style={{ maxHeight: '92vh' }}>
            {/* Header */}
            <div className="ed-dialog-header">
              <div>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Grading: {selectedAttempt.student?.membership?.user?.fullName}
                </h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Paper: {selectedAttempt.questionPaper?.title} | Admission: {selectedAttempt.student?.admissionNumber}
                </div>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="ed-btn-icon"
              >
                <X size={18} />
              </button>
            </div>

            {/* Questions to Grade */}
            <div className="ed-dialog-body" style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {(selectedAttempt.questionPaper?.items || []).map((item: any, idx: number) => {
                const answer = (selectedAttempt.answers || []).find((a: any) => a.paperItemId === item.id);
                const isAuto = answer?.isAutoEvaluated;

                return (
                  <div
                    key={item.id}
                    style={{ padding: '16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="ed-badge ed-badge-neutral" style={{ fontFamily: 'monospace' }}>
                            Q{idx + 1}
                          </span>
                          <span className="ed-badge ed-badge-teal">
                            {item.questionType?.replace(/_/g, ' ')}
                          </span>
                          {isAuto && (
                            <span className="ed-badge ed-badge-success" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <Check size={12} /> Auto-Graded
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.45 }}>{item.questionText}</div>
                      </div>

                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>Max Marks: {item.marks}</span>
                      </div>
                    </div>

                    {/* Student's Answer */}
                    <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--text-secondary)' }}>Student Response:</span>
                      <div style={{ fontFamily: 'monospace', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                        {answer?.studentAnswer ? (
                          answer.studentAnswer.selectedChoiceIds ? (
                            <span>Selected Choice ID(s): {answer.studentAnswer.selectedChoiceIds.join(', ')}</span>
                          ) : answer.studentAnswer.blankAnswers ? (
                            <span>Blanks: {answer.studentAnswer.blankAnswers.join(', ')}</span>
                          ) : answer.studentAnswer.matchedPairs ? (
                            <span>
                              Matched: {answer.studentAnswer.matchedPairs.map((p: any) => `[${p.leftIndex} -> ${p.rightIndex}]`).join(', ')}
                            </span>
                          ) : answer.studentAnswer.numericalValue !== undefined ? (
                            <span>Value: {answer.studentAnswer.numericalValue}</span>
                          ) : (
                            <p style={{ whiteSpace: 'pre-line' }}>{answer.studentAnswer.textAnswer || 'No text answer'}</p>
                          )
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>No answer provided by candidate.</span>
                        )}
                      </div>
                    </div>

                    {/* Expected Key / Rubric if available */}
                    {item.metadata?.sampleAnswer && (
                      <div style={{ fontSize: '0.8rem', color: '#15803d', backgroundColor: '#f0fdf4', padding: '10px 14px', borderRadius: 'var(--radius-sm)', border: '1px solid #bbf7d0' }}>
                        <strong>Model Sample Answer: </strong>
                        {item.metadata.sampleAnswer}
                      </div>
                    )}

                    {/* Marks Input & Teacher Remarks */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', paddingTop: '8px', borderTop: '1px solid var(--border-default)' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                          Marks Awarded (0 - {item.marks})
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={item.marks}
                          value={gradingScores[item.id] ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setGradingScores({
                              ...gradingScores,
                              [item.id]: Math.min(Math.max(0, val), item.marks),
                            });
                          }}
                          className="ed-input"
                          style={{ width: '100%', fontWeight: 700 }}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question Remarks</label>
                        <input
                          type="text"
                          placeholder="e.g. Excellent formula derivation, minor calculation oversight"
                          value={gradingRemarks[item.id] ?? ''}
                          onChange={(e) =>
                            setGradingRemarks({
                              ...gradingRemarks,
                              [item.id]: e.target.value,
                            })
                          }
                          className="ed-input"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Overall Feedback */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Overall Teacher Feedback</label>
                <textarea
                  rows={3}
                  value={overallFeedback}
                  onChange={(e) => setOverallFeedback(e.target.value)}
                  placeholder="Comprehensive feedback, areas of improvement, and encouraging remarks..."
                  className="ed-textarea"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="ed-dialog-footer" style={{ justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Total Score Awarded:{' '}
                <span style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                  {Object.values(gradingScores).reduce((sum, v) => sum + (Number(v) || 0), 0)} / {selectedAttempt.questionPaper?.totalMarks}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAttempt(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="secondary"
                  disabled={savingEvaluation}
                  onClick={() => handleSaveEvaluation('SUBMITTED')}
                >
                  Save Draft
                </Button>
                <Button
                  variant="primary"
                  disabled={savingEvaluation}
                  onClick={() => handleSaveEvaluation('EVALUATED')}
                >
                  {savingEvaluation ? 'Saving...' : 'Finalize & Mark Evaluated'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Filter,
  Calendar,
  Clock,
  User,
  AlertCircle,
  Loader2,
  RefreshCw,
  Edit3,
  CheckCircle2,
  X,
  FileSpreadsheet,
  Award,
  Layers,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { academicApi } from '../../services/api.js';

interface AuditItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  timestamp: string;
  details: any;
}

export const ExamMarksAuditPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const queryScheduleId = searchParams.get('scheduleId') || '';

  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string>(queryScheduleId);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('ALL');

  // Mark Correction Modal
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [examMarksList, setExamMarksList] = useState<any[]>([]);
  const [loadingMarks, setLoadingMarks] = useState(false);
  const [correctionTargetMarkId, setCorrectionTargetMarkId] = useState('');
  const [newMarksObtained, setNewMarksObtained] = useState<number | ''>('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Load schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const list = await academicApi.listExamSchedules();
        setExamSchedules(Array.isArray(list) ? list : []);
      } catch (err: any) {
        console.warn('Failed to load schedules for audit filter:', err);
      }
    };
    fetchSchedules();
  }, []);

  // Load audit logs from PostgreSQL
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      const logs = await academicApi.getExamAuditLogs(selectedScheduleId || undefined);
      setAuditLogs(Array.isArray(logs) ? logs : []);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve examination audit records from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [selectedScheduleId]);

  // Open Mark Correction Modal
  const openCorrectionDialog = async () => {
    setShowCorrectionModal(true);
    setCorrectionError(null);
    setCorrectionTargetMarkId('');
    setNewMarksObtained('');
    setCorrectionReason('');

    if (selectedScheduleId) {
      try {
        setLoadingMarks(true);
        const marks = await academicApi.getExamMarks(selectedScheduleId);
        setExamMarksList(Array.isArray(marks) ? marks : []);
        if (marks.length > 0) {
          setCorrectionTargetMarkId(marks[0].id);
          setNewMarksObtained(marks[0].marksObtained ?? 0);
        }
      } catch (err: any) {
        setCorrectionError('Failed to load marks for selected assessment.');
      } finally {
        setLoadingMarks(false);
      }
    }
  };

  const handleSelectExamForCorrection = async (scheduleId: string) => {
    try {
      setLoadingMarks(true);
      setCorrectionTargetMarkId('');
      const marks = await academicApi.getExamMarks(scheduleId);
      setExamMarksList(Array.isArray(marks) ? marks : []);
      if (marks.length > 0) {
        setCorrectionTargetMarkId(marks[0].id);
        setNewMarksObtained(marks[0].marksObtained ?? 0);
      }
    } catch (err: any) {
      setCorrectionError('Failed to load marks for this assessment.');
    } finally {
      setLoadingMarks(false);
    }
  };

  const submitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setCorrectionError(null);

    if (!correctionTargetMarkId) {
      setCorrectionError('Please select a student record to correct.');
      return;
    }
    if (newMarksObtained === '' || Number(newMarksObtained) < 0) {
      setCorrectionError('Please specify valid new marks.');
      return;
    }
    if (!correctionReason.trim() || correctionReason.trim().length < 5) {
      setCorrectionError('A mandatory rationale (min 5 characters) is required for forensic auditing.');
      return;
    }

    try {
      setIsSubmittingCorrection(true);
      await academicApi.correctExamMark({
        markId: correctionTargetMarkId,
        newMarksObtained: Number(newMarksObtained),
        reason: correctionReason.trim(),
      });

      setSuccessToast('Examination mark corrected and forensically audited in PostgreSQL.');
      setShowCorrectionModal(false);
      await loadAuditLogs();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setCorrectionError(err.message || 'Mark correction failed.');
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Filter logs
  const filteredLogs = auditLogs.filter((item) => {
    const matchesSearch =
      item.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      JSON.stringify(item.details || {}).toLowerCase().includes(searchTerm.toLowerCase());

    const matchesAction = selectedAction === 'ALL' || item.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'EXAM_MARK_CORRECTED':
        return <Badge variant="warning">Mark Corrected</Badge>;
      case 'EXAM_RESULTS_PUBLISHED':
        return <Badge variant="success">Results Published</Badge>;
      case 'EXAM_MARKS_SUBMITTED':
        return <Badge variant="info">Batch Marks Submitted</Badge>;
      case 'EXAM_SCHEDULE_CREATED':
        return <Badge variant="neutral">Schedule Created</Badge>;
      case 'EXAM_SCHEDULE_UPDATED':
        return <Badge variant="neutral">Schedule Updated</Badge>;
      case 'EXAM_GRADING_SCHEME_UPDATED':
        return <Badge variant="info">Grading Scheme Updated</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '100%' }}>
      {/* Toast */}
      {successToast && (
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--success-bg, rgba(16, 185, 129, 0.1))',
            border: '1px solid var(--success-border, rgba(16, 185, 129, 0.3))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--success-text, #059669)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 500 }}>
            <CheckCircle2 size={16} />
            {successToast}
          </div>
          <button
            onClick={() => setSuccessToast(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <ShieldCheck style={{ color: 'var(--primary-600)' }} size={26} />
            Marks Entry Audit & Forensic Ledger
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Tamper-evident audit trail for examination creation, batch marks submissions, amendments, and result releases.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadAuditLogs} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
          <Button variant="primary" onClick={openCorrectionDialog}>
            <Edit3 size={15} style={{ marginRight: '6px' }} />
            Authorize Mark Correction
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '12px 16px',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search by actor, action, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            value={selectedScheduleId}
            onChange={(e) => setSelectedScheduleId(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="">All Examinations</option>
            {examSchedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className})
              </option>
            ))}
          </select>

          <select
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
            style={{
              padding: '8px 12px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="EXAM_MARK_CORRECTED">Mark Corrected</option>
            <option value="EXAM_MARKS_SUBMITTED">Marks Submitted</option>
            <option value="EXAM_RESULTS_PUBLISHED">Results Published</option>
            <option value="EXAM_SCHEDULE_CREATED">Schedule Created</option>
            <option value="EXAM_SCHEDULE_UPDATED">Schedule Updated</option>
            <option value="EXAM_GRADING_SCHEME_UPDATED">Grading Scheme Updated</option>
          </select>
        </div>
      </div>

      {/* Error state */}
      {errorMsg && (
        <div
          style={{
            padding: '16px',
            backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
            border: '1px solid var(--danger-border, rgba(239, 68, 68, 0.3))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text, #dc2626)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <AlertCircle size={20} />
          <span style={{ fontSize: '14px', fontWeight: 500 }}>{errorMsg}</span>
        </div>
      )}

      {/* Audit Log Table */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <p style={{ margin: 0, fontSize: '14px' }}>Loading examination audit records from PostgreSQL...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ShieldCheck size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              No audit events recorded
            </h3>
            <p style={{ margin: 0, fontSize: '13px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              {searchTerm || selectedAction !== 'ALL' || selectedScheduleId
                ? 'No audit records match the current filters.'
                : 'No assessment audit events have been logged yet. Future marks entries, updates, and publications will be recorded automatically.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderBottom: '1px solid var(--border-primary)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                  }}
                >
                  <th style={{ padding: '12px 16px', width: '180px' }}>TIMESTAMP</th>
                  <th style={{ padding: '12px 16px', width: '200px' }}>ACTOR</th>
                  <th style={{ padding: '12px 16px', width: '170px' }}>ACTION</th>
                  <th style={{ padding: '12px 16px', width: '130px' }}>ENTITY</th>
                  <th style={{ padding: '12px 16px' }}>AUDIT DETAILS & RATIONALE</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleString();
                  const d = log.details || {};
                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid var(--border-primary)',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                          <Clock size={13} style={{ color: 'var(--text-muted)' }} />
                          {dateStr}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{log.userName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {log.userRole} | {log.userEmail}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>{getActionBadge(log.action)}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {log.entityType}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {log.action === 'EXAM_MARK_CORRECTED' ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              Score changed from {d.previousMarks ?? '—'} ({d.previousGrade}) to{' '}
                              <span style={{ color: 'var(--primary-600)' }}>
                                {d.newMarks ?? '—'} ({d.newGrade})
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                              <strong>Reason:</strong> {d.reason || 'No reason provided'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Assessment: {d.examName}
                            </div>
                          </div>
                        ) : log.action === 'EXAM_MARKS_SUBMITTED' ? (
                          <div>
                            <div style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
                              Batch marks submitted for {d.studentCount || 0} enrolled students
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Exam ID: {d.examScheduleId}
                            </div>
                          </div>
                        ) : log.action === 'EXAM_RESULTS_PUBLISHED' ? (
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--success-text, #059669)' }}>
                              {d.published ? 'Results released to students & parents' : 'Results unsealed / unpublished'}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                              Assessment: {d.examName}
                            </div>
                          </div>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {JSON.stringify(d)}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Mark Correction Modal */}
      {showCorrectionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '540px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Authorize Single-Mark Correction
              </h2>
              <button
                onClick={() => setShowCorrectionModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              All mark corrections are immutably logged to the institutional PostgreSQL ledger alongside your user ID,
              previous score, new score, and required administrative rationale.
            </p>

            {correctionError && (
              <div
                style={{
                  padding: '10px 14px',
                  backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
                  border: '1px solid var(--danger-border, rgba(239, 68, 68, 0.3))',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-text, #dc2626)',
                  fontSize: '13px',
                  marginBottom: '16px',
                }}
              >
                {correctionError}
              </div>
            )}

            <form onSubmit={submitCorrection} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  SELECT ASSESSMENT *
                </label>
                <select
                  value={selectedScheduleId}
                  onChange={(e) => {
                    setSelectedScheduleId(e.target.value);
                    handleSelectExamForCorrection(e.target.value);
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                >
                  <option value="">-- Choose Exam Schedule --</option>
                  {examSchedules.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.className})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  STUDENT RECORD TO AMEND *
                </label>
                {loadingMarks ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 0' }}>
                    Loading student marks...
                  </div>
                ) : examMarksList.length === 0 ? (
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', padding: '6px 0' }}>
                    No mark entries found for this examination. Select an exam with entered marks.
                  </div>
                ) : (
                  <select
                    value={correctionTargetMarkId}
                    onChange={(e) => {
                      setCorrectionTargetMarkId(e.target.value);
                      const target = examMarksList.find((m) => m.id === e.target.value);
                      if (target) {
                        setNewMarksObtained(target.marksObtained ?? 0);
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-primary)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '13px',
                    }}
                  >
                    {examMarksList.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.studentName} ({m.admissionNumber}) - Current: {m.marksObtained ?? 'None'} ({m.grade})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  NEW MARKS OBTAINED *
                </label>
                <input
                  type="number"
                  min={0}
                  max={1000}
                  required
                  value={newMarksObtained}
                  onChange={(e) => setNewMarksObtained(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="e.g. 88"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  MANDATORY AUDIT RATIONALE / REASON *
                </label>
                <textarea
                  required
                  rows={3}
                  value={correctionReason}
                  onChange={(e) => setCorrectionReason(e.target.value)}
                  placeholder="e.g. Retotalling error verified by Physics Department Head; question 4 marks omitted in initial tally."
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-input)',
                    border: '1px solid var(--border-primary)',
                    borderRadius: 'var(--radius-md)',
                    color: 'var(--text-primary)',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button variant="secondary" type="button" onClick={() => setShowCorrectionModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSubmittingCorrection || !correctionTargetMarkId}
                >
                  {isSubmittingCorrection ? (
                    <>
                      <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} />
                      Auditing...
                    </>
                  ) : (
                    'Record Correction'
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

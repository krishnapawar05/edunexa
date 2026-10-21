import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Search,
  Filter,
  Eye,
  Award,
  Calendar,
  FileSpreadsheet,
  AlertCircle,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { academicApi, coreApi } from '../../services/api.js';

interface ExamReadinessItem {
  id: string;
  name: string;
  className: string;
  subjectCode: string;
  examDate: string;
  maxMarks: number;
  passMarks: number;
  status: string;
  totalStudents: number;
  marksEnteredCount: number;
  pendingCount: number;
  isReadyToPublish: boolean;
  marks: any[];
}

export const ExamPublishResultsPage: React.FC = () => {
  const navigate = useNavigate();

  const [examItems, setExamItems] = useState<ExamReadinessItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Confirmation Modal
  const [confirmModalData, setConfirmModalData] = useState<{
    exam: ExamReadinessItem;
    publish: boolean;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Report Card Preview
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [reportCardData, setReportCardData] = useState<any>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);

  const loadAssessments = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Fetch live schedules
      const schedules = await academicApi.listExamSchedules();
      const rawList = Array.isArray(schedules) ? schedules : [];

      // 2. Fetch marks and calculate readiness for each schedule
      const readinessList: ExamReadinessItem[] = await Promise.all(
        rawList.map(async (s: any) => {
          let marks: any[] = [];
          try {
            marks = await academicApi.getExamMarks(s.id);
          } catch (err) {
            console.warn(`Marks fetch notice for exam ${s.id}:`, err);
          }

          // Count marks that are entered, absent, or exempt
          const enteredCount = marks.filter(
            (m: any) => (m.marksObtained !== null && m.marksObtained !== undefined) || m.isAbsent || m.isExempt
          ).length;

          // Approximate or actual enrolled student roster count
          const totalCount = Math.max(marks.length, enteredCount);
          const pendingCount = Math.max(0, totalCount - enteredCount);

          return {
            id: s.id,
            name: s.name,
            className: s.className,
            subjectCode: s.subjectCode,
            examDate: s.examDate,
            maxMarks: s.maxMarks,
            passMarks: s.passMarks,
            status: s.status,
            totalStudents: totalCount,
            marksEnteredCount: enteredCount,
            pendingCount,
            isReadyToPublish: totalCount > 0 && pendingCount === 0,
            marks,
          };
        })
      );

      setExamItems(readinessList);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load assessment publication status from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
  }, []);

  const handleTogglePublish = async () => {
    if (!confirmModalData) return;

    const { exam, publish } = confirmModalData;
    try {
      setIsProcessing(true);
      await academicApi.publishExamResults(exam.id, publish);

      setSuccessToast(
        publish
          ? `Examination '${exam.name}' has been successfully published to students and guardians.`
          : `Examination '${exam.name}' has been unsealed / unpublished.`
      );

      setConfirmModalData(null);
      await loadAssessments();
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Publication operation failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const openPreview = async (studentId: string) => {
    try {
      setPreviewStudentId(studentId);
      setLoadingReportCard(true);
      const res = await academicApi.getStudentReportCard(studentId);
      setReportCardData(res);
    } catch (err: any) {
      setReportCardData({ error: err.message || 'Report card preview unavailable.' });
    } finally {
      setLoadingReportCard(false);
    }
  };

  // Filter items
  const filteredItems = examItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subjectCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.className.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL'
        ? true
        : statusFilter === 'PUBLISHED'
        ? item.status === 'PUBLISHED'
        : statusFilter === 'READY'
        ? item.isReadyToPublish && item.status !== 'PUBLISHED'
        : item.status !== 'PUBLISHED' && !item.isReadyToPublish;

    return matchesSearch && matchesStatus;
  });

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
            <CheckCircle2 style={{ color: 'var(--primary-600)' }} size={26} />
            Publish Examination Results & Report Cards
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Review assessment completeness, seal official student scores, and release report cards to student and guardian portals in PostgreSQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Button variant="secondary" onClick={loadAssessments} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} style={{ marginRight: '6px' }} />
            Refresh
          </Button>
          <Button variant="secondary" onClick={() => navigate('/examinations/marks-audit')}>
            <ShieldCheck size={15} style={{ marginRight: '6px' }} />
            View Audit Log
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>TOTAL ASSESSMENTS</span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {examItems.length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--success-text, #059669)' }}>
            PUBLISHED TO PORTALS
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--success-text, #059669)', marginTop: '4px' }}>
            {examItems.filter((i) => i.status === 'PUBLISHED').length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--info-text, #0284c7)' }}>
            READY FOR RELEASE
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--info-text, #0284c7)', marginTop: '4px' }}>
            {examItems.filter((i) => i.isReadyToPublish && i.status !== 'PUBLISHED').length}
          </div>
        </div>
        <div
          style={{
            backgroundColor: 'var(--bg-card)',
            border: '1px solid var(--border-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: 'var(--space-4)',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--warning-text, #d97706)' }}>
            INCOMPLETE MARKS
          </span>
          <div style={{ fontSize: '26px', fontWeight: 700, color: 'var(--warning-text, #d97706)', marginTop: '4px' }}>
            {examItems.filter((i) => !i.isReadyToPublish && i.status !== 'PUBLISHED').length}
          </div>
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
            placeholder="Search by assessment name or subject..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
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
            <option value="ALL">All Publication States</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="READY">Ready to Publish</option>
            <option value="INCOMPLETE">Pending / Incomplete</option>
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

      {/* Readiness Ledger Table */}
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
            <p style={{ margin: 0, fontSize: '14px' }}>Loading assessment marks and publication readiness from PostgreSQL...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              No assessment records match filter
            </h3>
            <p style={{ margin: 0, fontSize: '13px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              Ensure examination schedules have been created and student marks recorded.
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
                  <th style={{ padding: '12px 16px' }}>ASSESSMENT</th>
                  <th style={{ padding: '12px 16px' }}>CLASS / SUBJECT</th>
                  <th style={{ padding: '12px 16px' }}>EXAM DATE</th>
                  <th style={{ padding: '12px 16px' }}>MARKS READINESS</th>
                  <th style={{ padding: '12px 16px' }}>CURRENT STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>PUBLISH CONTROLS</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => {
                  const isPublished = item.status === 'PUBLISHED';
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid var(--border-primary)',
                        transition: 'background-color 0.15s',
                      }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Max: {item.maxMarks} marks (Pass: {item.passMarks})
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{item.className}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Code: {item.subjectCode}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                          {item.examDate}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontWeight: 600, color: item.pendingCount === 0 ? 'var(--success-text, #059669)' : 'var(--warning-text, #d97706)' }}>
                          {item.marksEnteredCount} of {item.totalStudents} recorded
                        </div>
                        {item.pendingCount > 0 ? (
                          <div style={{ fontSize: '11px', color: 'var(--danger-text, #dc2626)', marginTop: '2px' }}>
                            {item.pendingCount} student(s) missing marks
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: 'var(--success-text, #059669)', marginTop: '2px' }}>
                            Complete & Verified
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {isPublished ? (
                          <Badge variant="success">
                            <Lock size={12} style={{ marginRight: '4px' }} />
                            Published
                          </Badge>
                        ) : item.isReadyToPublish ? (
                          <Badge variant="info">Ready to Publish</Badge>
                        ) : (
                          <Badge variant="warning">Incomplete</Badge>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center' }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate(`/examinations/marks?scheduleId=${item.id}`)}
                            title="Inspect Marks"
                          >
                            <Award size={13} style={{ marginRight: '4px' }} />
                            Marks
                          </Button>

                          {isPublished ? (
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => setConfirmModalData({ exam: item, publish: false })}
                              title="Unseal / Unpublish Results"
                            >
                              <Unlock size={13} style={{ marginRight: '4px' }} />
                              Unpublish
                            </Button>
                          ) : (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => setConfirmModalData({ exam: item, publish: true })}
                              disabled={!item.isReadyToPublish}
                              title={item.isReadyToPublish ? 'Publish Results to Portals' : 'Complete marks entry before publishing'}
                            >
                              <CheckCircle2 size={13} style={{ marginRight: '4px' }} />
                              Publish Results
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Publish / Unpublish Confirmation Modal */}
      {confirmModalData && (
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
              maxWidth: '500px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                color: confirmModalData.publish ? 'var(--primary-600)' : 'var(--danger-text, #dc2626)',
              }}
            >
              {confirmModalData.publish ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                {confirmModalData.publish ? 'Confirm Examination Publication' : 'Unseal & Unpublish Results'}
              </h2>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {confirmModalData.publish ? (
                <>
                  You are about to publish official results for <strong>{confirmModalData.exam.name}</strong> (
                  {confirmModalData.exam.className}). Student marks will be immutably sealed and made visible to
                  students and parents across their EduNexa portal views.
                </>
              ) : (
                <>
                  Are you sure you want to unpublish <strong>{confirmModalData.exam.name}</strong>? Results will be
                  temporarily withdrawn from student/parent portal visibility and reverted to editable status.
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <Button variant="secondary" onClick={() => setConfirmModalData(null)} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                variant={confirmModalData.publish ? 'primary' : 'danger'}
                onClick={handleTogglePublish}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={14} className="animate-spin" style={{ marginRight: '6px' }} />
                    Persisting to DB...
                  </>
                ) : confirmModalData.publish ? (
                  'Publish Now'
                ) : (
                  'Unpublish'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

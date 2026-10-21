import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Award,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  Download,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Clock,
  Eye,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { academicApi, coreApi } from '../../services/api.js';

interface StudentMarkRow {
  studentId: string;
  admissionNo: string;
  name: string;
  rollNo: number;
  marksObtained: number | '';
  isAbsent: boolean;
  isExempt: boolean;
  teacherRemarks: string;
}

export const ExamMarksEntryPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryScheduleId = searchParams.get('scheduleId') || '';

  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>(queryScheduleId);
  const [selectedExam, setSelectedExam] = useState<any>(null);

  const [studentsMarks, setStudentsMarks] = useState<StudentMarkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Student Report Card Preview Modal
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(null);
  const [reportCardData, setReportCardData] = useState<any>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);

  // Fetch all schedules
  const loadSchedules = async () => {
    try {
      const schedules = await academicApi.listExamSchedules();
      const list = Array.isArray(schedules) ? schedules : [];
      setExamSchedules(list);

      if (list.length > 0) {
        const targetId = queryScheduleId && list.find((s) => s.id === queryScheduleId)
          ? queryScheduleId
          : list[0].id;
        setSelectedExamId(targetId);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to retrieve examination schedules.');
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  // When selectedExamId changes, load exam marks and class roster
  useEffect(() => {
    if (!selectedExamId || examSchedules.length === 0) return;

    const currentSchedule = examSchedules.find((s) => s.id === selectedExamId);
    setSelectedExam(currentSchedule || null);

    const loadRosterAndMarks = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);

        const className = currentSchedule?.className || 'Grade 10';

        // 1. Fetch real students for this class from PostgreSQL
        const studentsRes = await coreApi.listStudents({ className, limit: 100 });
        const studentItems: any[] = Array.isArray(studentsRes)
          ? studentsRes
          : (studentsRes as any)?.items || [];

        // 2. Fetch existing marks for this exam from PostgreSQL
        let existingMarks: any[] = [];
        try {
          existingMarks = await academicApi.getExamMarks(selectedExamId);
        } catch (err) {
          console.warn('Existing marks fetch notice:', err);
        }

        // Map real students to mark rows
        const rows: StudentMarkRow[] = studentItems.map((s: any, idx: number) => {
          const markRecord = existingMarks.find(
            (m: any) => m.studentProfileId === s.id || m.admissionNumber === s.admissionNumber
          );
          return {
            studentId: s.id,
            admissionNo: s.admissionNumber || `ADM-${s.id.slice(0, 8)}`,
            name: `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Enrolled Student',
            rollNo: Number(s.rollNumber || idx + 1),
            marksObtained:
              markRecord && markRecord.marksObtained !== null && markRecord.marksObtained !== undefined
                ? markRecord.marksObtained
                : '',
            isAbsent: markRecord ? Boolean(markRecord.isAbsent) : false,
            isExempt: markRecord ? Boolean(markRecord.isExempt) : false,
            teacherRemarks: markRecord?.teacherRemarks || '',
          };
        });

        setStudentsMarks(rows);
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load enrolled student marks from PostgreSQL.');
      } finally {
        setLoading(false);
      }
    };

    loadRosterAndMarks();
  }, [selectedExamId, examSchedules]);

  const maxMarks = selectedExam?.maxMarks || 100;
  const passMarks = selectedExam?.passMarks || 40;
  const isLocked = selectedExam?.status === 'PUBLISHED';

  // Dynamic Grade Calculation based on scheme
  const calculateGrade = (marks: number | '', isAbsent: boolean, isExempt: boolean) => {
    if (isExempt) return { grade: 'EX', label: 'Exempt', color: 'var(--info-text, #0284c7)' };
    if (isAbsent) return { grade: 'AB', label: 'Absent', color: 'var(--danger-text, #dc2626)' };
    if (marks === '') return { grade: '—', label: 'Pending', color: 'var(--text-muted)' };

    const percentage = (Number(marks) / maxMarks) * 100;
    if (percentage >= 91) return { grade: 'A1', label: 'Outstanding', color: 'var(--success-text, #059669)' };
    if (percentage >= 81) return { grade: 'A2', label: 'Excellent', color: 'var(--success-text, #10b981)' };
    if (percentage >= 71) return { grade: 'B1', label: 'Very Good', color: 'var(--primary-600, #4f46e5)' };
    if (percentage >= 61) return { grade: 'B2', label: 'Good', color: 'var(--primary-500, #6366f1)' };
    if (percentage >= 51) return { grade: 'C1', label: 'Above Average', color: 'var(--warning-text, #d97706)' };
    if (percentage >= 41) return { grade: 'C2', label: 'Average', color: 'var(--warning-text, #f59e0b)' };
    if (percentage >= 33) return { grade: 'D', label: 'Marginal Pass', color: 'var(--warning-text, #b45309)' };
    return { grade: 'E', label: 'Needs Remedial', color: 'var(--danger-text, #dc2626)' };
  };

  const handleMarkChange = (index: number, val: string) => {
    if (isLocked) return;
    const num = val === '' ? '' : Math.min(maxMarks, Math.max(0, Number(val)));
    setStudentsMarks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, marksObtained: num, isAbsent: false, isExempt: false } : row))
    );
  };

  const toggleAbsent = (index: number) => {
    if (isLocked) return;
    setStudentsMarks((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, isAbsent: !row.isAbsent, marksObtained: !row.isAbsent ? '' : row.marksObtained, isExempt: false }
          : row
      )
    );
  };

  const toggleExempt = (index: number) => {
    if (isLocked) return;
    setStudentsMarks((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, isExempt: !row.isExempt, marksObtained: !row.isExempt ? '' : row.marksObtained, isAbsent: false }
          : row
      )
    );
  };

  const handleRemarksChange = (index: number, val: string) => {
    if (isLocked) return;
    setStudentsMarks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, teacherRemarks: val } : row))
    );
  };

  // Metrics from actual state
  const totalStudents = studentsMarks.length;
  const gradedRows = studentsMarks.filter((s) => s.marksObtained !== '' || s.isAbsent || s.isExempt);
  const gradedCount = gradedRows.length;
  const progressPercent = totalStudents > 0 ? Math.round((gradedCount / totalStudents) * 100) : 0;

  const validMarkScores = studentsMarks
    .filter((s) => s.marksObtained !== '' && !s.isAbsent && !s.isExempt)
    .map((s) => Number(s.marksObtained));

  const classAverage =
    validMarkScores.length > 0
      ? (validMarkScores.reduce((acc, curr) => acc + curr, 0) / validMarkScores.length).toFixed(1)
      : '—';

  const highestMark = validMarkScores.length > 0 ? Math.max(...validMarkScores) : '—';
  const lowestMark = validMarkScores.length > 0 ? Math.min(...validMarkScores) : '—';

  // Save Marks to PostgreSQL
  const handleSaveMarks = async (markAsSubmitted: boolean) => {
    if (isLocked) return;

    try {
      setIsSaving(true);
      setErrorMsg(null);

      const payloadMarks = studentsMarks.map((row) => ({
        studentProfileId: row.studentId,
        marksObtained:
          row.isAbsent || row.isExempt || row.marksObtained === ''
            ? undefined
            : Number(row.marksObtained),
        isAbsent: row.isAbsent,
        isExempt: row.isExempt,
        teacherRemarks: row.teacherRemarks || undefined,
      }));

      await academicApi.submitExamMarksBatch({
        examScheduleId: selectedExamId,
        marks: payloadMarks,
      });

      if (markAsSubmitted) {
        await academicApi.updateExamSchedule(selectedExamId, { status: 'MARKS_SUBMITTED' });
        setSelectedExam((prev: any) => (prev ? { ...prev, status: 'MARKS_SUBMITTED' } : null));
        setSuccessToast('All student marks submitted and sealed to PostgreSQL.');
      } else {
        setSuccessToast('Draft marks successfully persisted to PostgreSQL.');
      }

      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save marks to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // Preview Student Report Card
  const openReportCardPreview = async (studentId: string) => {
    try {
      setPreviewStudentId(studentId);
      setLoadingReportCard(true);
      const res = await academicApi.getStudentReportCard(studentId);
      setReportCardData(res);
    } catch (err: any) {
      setReportCardData({ error: err.message || 'Report card not yet generated.' });
    } finally {
      setLoadingReportCard(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', maxWidth: '100%' }}>
      {/* Toast Notification */}
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
            <Award style={{ color: 'var(--primary-600)' }} size={26} />
            Marks Entry & Grade Calculation
          </h1>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            Enter, audit, and compute institutional grades against configured boundaries in PostgreSQL.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Button
            variant="secondary"
            onClick={() => navigate('/examinations/marks-audit')}
          >
            <History size={15} style={{ marginRight: '6px' }} />
            Audit Log
          </Button>

          <Button
            variant="secondary"
            onClick={() => handleSaveMarks(false)}
            disabled={isSaving || isLocked || totalStudents === 0}
          >
            <Save size={15} style={{ marginRight: '6px' }} />
            Save Draft
          </Button>

          <Button
            variant="primary"
            onClick={() => handleSaveMarks(true)}
            disabled={isSaving || isLocked || totalStudents === 0}
          >
            {isSaving ? (
              <>
                <Loader2 size={15} className="animate-spin" style={{ marginRight: '6px' }} />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 size={15} style={{ marginRight: '6px' }} />
                Submit & Seal Marks
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selector & Exam Details Ribbon */}
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 320px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            SELECT ASSESSMENT:
          </label>
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            style={{
              padding: '8px 14px',
              backgroundColor: 'var(--bg-input)',
              border: '1px solid var(--border-primary)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '13px',
              fontWeight: 500,
              flex: 1,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {examSchedules.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.className} - {s.subjectCode}) [{s.status}]
              </option>
            ))}
          </select>
        </div>

        {selectedExam && (
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Class: <strong style={{ color: 'var(--text-primary)' }}>{selectedExam.className}</strong>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Subject: <strong style={{ color: 'var(--text-primary)' }}>{selectedExam.subjectCode}</strong>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Max Marks: <strong style={{ color: 'var(--text-primary)' }}>{maxMarks}</strong> (Pass: {passMarks})
            </div>
            {isLocked && (
              <Badge variant="success">
                <Lock size={12} style={{ marginRight: '4px' }} />
                Published & Locked
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Live Analytics Tiles */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>ROSTER SIZE</span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {totalStudents} students
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
            MARKS RECORDED
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--info-text, #0284c7)', marginTop: '4px' }}>
            {gradedCount} / {totalStudents} ({progressPercent}%)
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
            CLASS AVERAGE
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--success-text, #059669)', marginTop: '4px' }}>
            {classAverage} / {maxMarks}
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
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>HIGH / LOW SCORE</span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {highestMark} / {lowestMark}
          </div>
        </div>
      </div>

      {/* Notice if exam is locked */}
      {isLocked && (
        <div
          style={{
            padding: '14px 18px',
            backgroundColor: 'var(--warning-bg, rgba(245, 158, 11, 0.1))',
            border: '1px solid var(--warning-border, rgba(245, 158, 11, 0.3))',
            borderRadius: 'var(--radius-md)',
            color: 'var(--warning-text, #d97706)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <Lock size={16} />
          <span>
            <strong>Assessment Published:</strong> These examination results have been published to students and parents.
            Marks entry is locked to protect transcript integrity. Single-mark amendments must be processed through the Marks Audit flow.
          </span>
        </div>
      )}

      {/* Error banner */}
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

      {/* Students Marks Table */}
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
            <p style={{ margin: 0, fontSize: '14px' }}>Loading enrolled students & saved marks from PostgreSQL...</p>
          </div>
        ) : studentsMarks.length === 0 ? (
          <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileSpreadsheet size={40} style={{ opacity: 0.4, margin: '0 auto 12px auto' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              No enrolled students found
            </h3>
            <p style={{ margin: 0, fontSize: '13px', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
              No student profiles are enrolled in {selectedExam?.className || 'this class'}. Ensure students exist in the directory.
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
                  <th style={{ padding: '12px 16px', width: '70px' }}>ROLL</th>
                  <th style={{ padding: '12px 16px' }}>STUDENT NAME</th>
                  <th style={{ padding: '12px 16px' }}>ADMISSION NO</th>
                  <th style={{ padding: '12px 16px', width: '140px' }}>MARKS (/{maxMarks})</th>
                  <th style={{ padding: '12px 16px', width: '100px' }}>STATUS</th>
                  <th style={{ padding: '12px 16px', width: '130px' }}>CALC GRADE</th>
                  <th style={{ padding: '12px 16px' }}>TEACHER REMARKS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>REPORT</th>
                </tr>
              </thead>
              <tbody>
                {studentsMarks.map((row, idx) => {
                  const gradeInfo = calculateGrade(row.marksObtained, row.isAbsent, row.isExempt);
                  return (
                    <tr
                      key={row.studentId}
                      style={{
                        borderBottom: '1px solid var(--border-primary)',
                        backgroundColor: row.isAbsent ? 'rgba(239, 68, 68, 0.04)' : undefined,
                      }}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {row.rollNo}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '12px' }}>
                        {row.admissionNo}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="number"
                          min={0}
                          max={maxMarks}
                          disabled={isLocked || row.isAbsent || row.isExempt}
                          value={row.marksObtained}
                          onChange={(e) => handleMarkChange(idx, e.target.value)}
                          placeholder="—"
                          style={{
                            width: '80px',
                            padding: '6px 8px',
                            textAlign: 'center',
                            fontWeight: 600,
                            backgroundColor: row.isAbsent || row.isExempt ? 'var(--bg-surface)' : 'var(--bg-input)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '13px',
                            outline: 'none',
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => toggleAbsent(idx)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid',
                              borderColor: row.isAbsent ? 'var(--danger-border, #ef4444)' : 'var(--border-primary)',
                              backgroundColor: row.isAbsent ? 'var(--danger-bg, #fee2e2)' : 'transparent',
                              color: row.isAbsent ? 'var(--danger-text, #b91c1c)' : 'var(--text-secondary)',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                            }}
                          >
                            AB
                          </button>
                          <button
                            type="button"
                            disabled={isLocked}
                            onClick={() => toggleExempt(idx)}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              fontWeight: 600,
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid',
                              borderColor: row.isExempt ? 'var(--info-border, #0284c7)' : 'var(--border-primary)',
                              backgroundColor: row.isExempt ? 'var(--info-bg, #e0f2fe)' : 'transparent',
                              color: row.isExempt ? 'var(--info-text, #0369a1)' : 'var(--text-secondary)',
                              cursor: isLocked ? 'not-allowed' : 'pointer',
                            }}
                          >
                            EX
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontSize: '14px',
                              fontWeight: 700,
                              color: gradeInfo.color,
                            }}
                          >
                            {gradeInfo.grade}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            ({gradeInfo.label})
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <input
                          type="text"
                          disabled={isLocked}
                          value={row.teacherRemarks}
                          onChange={(e) => handleRemarksChange(idx, e.target.value)}
                          placeholder="Optional feedback..."
                          style={{
                            width: '100%',
                            minWidth: '160px',
                            padding: '6px 10px',
                            backgroundColor: 'var(--bg-input)',
                            border: '1px solid var(--border-primary)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--text-primary)',
                            fontSize: '12px',
                            outline: 'none',
                          }}
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openReportCardPreview(row.studentId)}
                          title="Preview Student Report Card"
                        >
                          <Eye size={13} style={{ marginRight: '4px' }} />
                          Preview
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Card Preview Modal */}
      {previewStudentId && (
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
              maxWidth: '620px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
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
                Official Academic Report Card Preview
              </h2>
              <button
                onClick={() => setPreviewStudentId(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {loadingReportCard ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                <span>Generating report card from PostgreSQL...</span>
              </div>
            ) : reportCardData?.error ? (
              <div
                style={{
                  padding: '14px',
                  backgroundColor: 'var(--danger-bg, rgba(239, 68, 68, 0.1))',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--danger-text, #dc2626)',
                  fontSize: '13px',
                }}
              >
                {reportCardData.error}
              </div>
            ) : reportCardData ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '13px' }}>
                <div
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-primary)',
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>
                    {reportCardData.studentName}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Admission: {reportCardData.admissionNumber} | Class: {reportCardData.className}
                  </div>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Session: {reportCardData.academicSession}
                  </div>
                </div>

                <div style={{ border: '1px solid var(--border-primary)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: 'var(--bg-surface)', borderBottom: '1px solid var(--border-primary)', fontWeight: 600 }}>
                        <th style={{ padding: '8px 12px' }}>Subject</th>
                        <th style={{ padding: '8px 12px' }}>Exam Type</th>
                        <th style={{ padding: '8px 12px' }}>Marks</th>
                        <th style={{ padding: '8px 12px' }}>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportCardData.subjectResults?.map((res: any, i: number) => (
                        <tr key={i} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 500 }}>{res.subjectName}</td>
                          <td style={{ padding: '8px 12px', color: 'var(--text-secondary)' }}>{res.examType}</td>
                          <td style={{ padding: '8px 12px' }}>
                            {res.isAbsent ? 'Absent' : res.isExempt ? 'Exempt' : `${res.marksObtained} / ${res.maxMarks}`}
                          </td>
                          <td style={{ padding: '8px 12px', fontWeight: 700, color: 'var(--primary-600)' }}>
                            {res.grade}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-surface)',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                  }}
                >
                  <span>Overall Percentage: {reportCardData.overallPercentage?.toFixed(1) || '—'}%</span>
                  <span>Overall Grade: <strong style={{ color: 'var(--primary-600)' }}>{reportCardData.overallGrade || '—'}</strong></span>
                </div>
              </div>
            ) : null}

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setPreviewStudentId(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

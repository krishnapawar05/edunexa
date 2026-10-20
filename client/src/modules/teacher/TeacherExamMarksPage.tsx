import React, { useState, useEffect } from 'react';
import {
  Award,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
  Search,
  AlertTriangle,
  X,
  FileText,
  Save,
  Send,
  HelpCircle,
  TrendingUp,
  UserCheck,
  Check,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import {
  academicApi,
  coreApi,
  getStoredUser,
} from '../../services/api.js';

interface ExamSchedule {
  id: string;
  name: string;
  subjectCode: string;
  className: string;
  examType: string;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  maxMarks: number;
  passMarks: number;
  weightagePercent: number;
  status: string;
}

interface StudentEntry {
  studentProfileId: string;
  name: string;
  rollNumber: string;
  marksObtained: number | '' | null;
  isAbsent: boolean;
  isExempt: boolean;
  teacherRemarks: string;
}

export const TeacherExamMarksPage: React.FC = () => {
  const [examSchedules, setExamSchedules] = useState<ExamSchedule[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10');
  const [students, setStudents] = useState<StudentEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // New Exam Schedule Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingExam, setCreatingExam] = useState(false);
  const [newExamName, setNewExamName] = useState('');
  const [newSubjectCode, setNewSubjectCode] = useState('PHY-10');
  const [newClassName, setNewClassName] = useState('Grade 10');
  const [newExamType, setNewExamType] = useState<'UNIT_TEST' | 'MID_TERM' | 'FINAL_TERM' | 'PRACTICAL'>('UNIT_TEST');
  const [newExamDate, setNewExamDate] = useState(new Date().toISOString().split('T')[0]);
  const [newStartTime, setNewStartTime] = useState('09:30 AM');
  const [newDuration, setNewDuration] = useState(90);
  const [newMaxMarks, setNewMaxMarks] = useState(50);
  const [newPassMarks, setNewPassMarks] = useState(18);
  const [newWeightage, setNewWeightage] = useState(20);

  const user = getStoredUser();

  const loadExamSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await academicApi.listExamSchedules({ className: selectedClass });
      const items: ExamSchedule[] = res || [];
      setExamSchedules(items);
      if (items.length > 0 && !selectedExamId) {
        setSelectedExamId(items[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load examination schedules from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamSchedules();
  }, [selectedClass]);

  const loadClassRoster = async () => {
    if (!selectedExamId) return;
    try {
      setLoadingStudents(true);
      setError(null);
      const [res, existingMarks] = await Promise.all([
        coreApi.listStudents({ className: selectedClass, limit: 100 }),
        academicApi.getExamMarks(selectedExamId).catch(() => []),
      ]);
      const items = res?.items || [];
      const marksList = Array.isArray(existingMarks) ? existingMarks : [];
      setStudents(
        items.map((s: any) => {
          const m = marksList.find((x: any) => x.studentProfileId === s.id);
          return {
            studentProfileId: s.id,
            name: `${s.firstName} ${s.lastName}`,
            rollNumber: s.rollNumber || s.admissionNumber || '—',
            marksObtained: m && m.marksObtained !== undefined ? m.marksObtained : '',
            isAbsent: m ? Boolean(m.isAbsent) : false,
            isExempt: false,
            teacherRemarks: m?.teacherRemarks || '',
          };
        })
      );
    } catch (err: any) {
      setError(err.message || 'Failed to load student roster for evaluation.');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadClassRoster();
  }, [selectedExamId, selectedClass]);

  const selectedExam = examSchedules.find((e) => e.id === selectedExamId);

  const calculateGrade = (marks: number | '' | null, maxMarks: number) => {
    if (marks === '' || marks === null || isNaN(marks)) return '—';
    const pct = (marks / maxMarks) * 100;
    if (pct >= 90) return 'A+';
    if (pct >= 80) return 'A';
    if (pct >= 70) return 'B';
    if (pct >= 60) return 'C';
    if (pct >= 50) return 'D';
    if (pct >= 35) return 'E';
    return 'F';
  };

  const updateStudentMark = (id: string, value: string) => {
    const num = value === '' ? '' : parseFloat(value);
    if (typeof num === 'number' && selectedExam && num > selectedExam.maxMarks) return;
    setStudents((prev) =>
      prev.map((s) =>
        s.studentProfileId === id
          ? {
              ...s,
              marksObtained: num,
              isAbsent: false,
              isExempt: false,
            }
          : s
      )
    );
  };

  const toggleAbsent = (id: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.studentProfileId === id
          ? {
              ...s,
              isAbsent: !s.isAbsent,
              isExempt: false,
              marksObtained: !s.isAbsent ? null : '',
            }
          : s
      )
    );
  };

  const toggleExempt = (id: string) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.studentProfileId === id
          ? {
              ...s,
              isExempt: !s.isExempt,
              isAbsent: false,
              marksObtained: !s.isExempt ? null : '',
            }
          : s
      )
    );
  };

  const updateRemarks = (id: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentProfileId === id ? { ...s, teacherRemarks: remarks } : s))
    );
  };

  const handleBatchSubmit = async (isDraft: boolean) => {
    if (!selectedExam) return;

    // Filter students who have at least an entry, absent, or exempt
    const evaluatedMarks = students.map((s) => {
      let marksVal: number | undefined = undefined;
      if (!s.isAbsent && !s.isExempt && typeof s.marksObtained === 'number') {
        marksVal = s.marksObtained;
      }
      return {
        studentProfileId: s.studentProfileId,
        marksObtained: marksVal ?? 0,
        isAbsent: s.isAbsent,
        isExempt: s.isExempt,
        teacherRemarks: s.teacherRemarks || (isDraft ? 'Draft mark entry' : 'Final mark entry'),
      };
    });

    if (evaluatedMarks.length === 0) {
      setError('Please provide at least one student evaluation or absent record.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await academicApi.submitExamMarksBatch({
        examScheduleId: selectedExam.id,
        marks: evaluatedMarks,
      });

      setSuccessToast(
        isDraft
          ? 'Marks saved as draft successfully in PostgreSQL.'
          : 'Marks batch submitted successfully! Results locked for moderation.'
      );
      setTimeout(() => setSuccessToast(null), 4000);
      loadExamSchedules();
    } catch (err: any) {
      setError(err.message || 'Failed to persist exam marks to database.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName.trim()) return;

    try {
      setCreatingExam(true);
      setError(null);
      await academicApi.createExamSchedule({
        academicSession: 'Academic Year 2026–2027',
        className: newClassName,
        subjectCode: newSubjectCode,
        name: newExamName,
        examType: newExamType,
        examDate: newExamDate,
        startTime: newStartTime,
        durationMinutes: Number(newDuration),
        maxMarks: Number(newMaxMarks),
        passMarks: Number(newPassMarks),
        weightagePercent: Number(newWeightage),
      });

      setShowCreateModal(false);
      setSuccessToast(`Exam schedule "${newExamName}" created and persisted.`);
      setTimeout(() => setSuccessToast(null), 4000);
      setNewExamName('');
      loadExamSchedules();
    } catch (err: any) {
      setError(err.message || 'Failed to create exam schedule.');
    } finally {
      setCreatingExam(false);
    }
  };

  // Stats
  const evaluatedCount = students.filter(
    (s) => (typeof s.marksObtained === 'number' && s.marksObtained >= 0) || s.isAbsent || s.isExempt
  ).length;
  const absentCount = students.filter((s) => s.isAbsent).length;
  const validMarks = students
    .map((s) => s.marksObtained)
    .filter((m): m is number => typeof m === 'number');
  const avgMarks = validMarks.length > 0 ? (validMarks.reduce((a, b) => a + b, 0) / validMarks.length).toFixed(1) : '—';
  const highestMark = validMarks.length > 0 ? Math.max(...validMarks) : '—';

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Toast Notification */}
      {successToast && (
        <div
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            backgroundColor: 'var(--surface-primary)',
            color: 'var(--success-600, #16a34a)',
            padding: 'var(--space-4) var(--space-6)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--success-500, #22c55e)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
            zIndex: 9999,
            animation: 'fadeIn 0.2s ease-in',
          }}
        >
          <CheckCircle2 size={20} />
          <span style={{ fontWeight: 600 }}>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-1)',
            }}
          >
            Exam Marks & Evaluation
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Enter subject marks, record absences, review class performance, and submit marks to PostgreSQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
          <button
            onClick={() => {
              loadExamSchedules();
              loadClassRoster();
            }}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--surface-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: 'var(--space-2) var(--space-4)',
              backgroundColor: 'var(--brand-primary)',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              color: '#ffffff',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.875rem',
            }}
          >
            <Plus size={16} />
            Schedule Examination
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid var(--danger-500, #ef4444)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-600, #dc2626)',
            marginBottom: 'var(--space-6)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={20} />
          <span style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* KPI Overview */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Available Exams</span>
            <Award size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {examSchedules.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            In {selectedClass} Session
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Roster Size</span>
            <UserCheck size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {students.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {evaluatedCount} evaluated / marked
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Class Average</span>
            <TrendingUp size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {avgMarks}{selectedExam ? ` / ${selectedExam.maxMarks}` : ''}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Highest recorded: {highestMark}
          </div>
        </div>

        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--surface-primary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Absentees</span>
            <AlertTriangle size={18} color="#eab308" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {absentCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Marked as absent (AB)
          </div>
        </div>
      </div>

      {/* Exam & Class Selection Bar */}
      <div
        style={{
          padding: 'var(--space-4)',
          backgroundColor: 'var(--surface-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              ACADEMIC CLASS
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 9">Grade 9</option>
              <option value="Grade 11">Grade 11</option>
              <option value="Grade 12">Grade 12</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              EXAMINATION SCHEDULE
            </label>
            <select
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              disabled={examSchedules.length === 0}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 600,
                minWidth: '280px',
              }}
            >
              {examSchedules.length === 0 ? (
                <option value="">No exam schedules found</option>
              ) : (
                examSchedules.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.name} — {ex.subjectCode} ({ex.examDate})
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedExam && (
            <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', marginTop: '16px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  color: '#3b82f6',
                  fontWeight: 600,
                }}
              >
                Max: {selectedExam.maxMarks} pts
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  color: '#16a34a',
                  fontWeight: 600,
                }}
              >
                Pass: {selectedExam.passMarks} pts
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  color: '#9333ea',
                  fontWeight: 600,
                }}
              >
                Status: {selectedExam.status}
              </span>
            </div>
          )}
        </div>

        {/* Student Search */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-secondary)',
            }}
          />
          <input
            type="text"
            placeholder="Search roster..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: 'var(--space-2) var(--space-3) var(--space-2) 34px',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Marks Entry Table */}
      <div
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-4)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>
              {selectedExam ? selectedExam.name : 'Select an Examination'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {selectedExam
                ? `${selectedExam.subjectCode} • ${selectedExam.className} • ${selectedExam.examDate} at ${selectedExam.startTime} (${selectedExam.durationMinutes} min)`
                : 'No exam selected'}
            </span>
          </div>

          {selectedExam && (
            <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
              <button
                onClick={() => handleBatchSubmit(true)}
                disabled={submitting || loadingStudents || students.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  backgroundColor: 'var(--surface-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                <Save size={16} />
                Save Draft
              </button>

              <button
                onClick={() => handleBatchSubmit(false)}
                disabled={submitting || loadingStudents || students.length === 0}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  padding: 'var(--space-2) var(--space-4)',
                  backgroundColor: 'var(--brand-primary)',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                }}
              >
                <Send size={16} />
                {submitting ? 'Submitting to PostgreSQL...' : 'Final Submit Marks'}
              </button>
            </div>
          )}
        </div>

        {loadingStudents ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="spin" style={{ margin: '0 auto var(--space-2)' }} />
            <p>Loading class roster from database...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <HelpCircle size={32} style={{ margin: '0 auto var(--space-3)', opacity: 0.5 }} />
            <p style={{ fontWeight: 600, fontSize: '1rem' }}>No student records found</p>
            <p style={{ fontSize: '0.85rem' }}>Verify class assignment or select a different examination schedule.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', width: '60px' }}>Roll</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Student Name</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', width: '180px' }}>
                    Marks Obtained (Max: {selectedExam?.maxMarks || 100})
                  </th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', width: '100px' }}>Attendance</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', width: '90px' }}>Grade</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Teacher Feedback & Remarks</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => {
                  const currentGrade = st.isAbsent
                    ? 'AB'
                    : st.isExempt
                    ? 'EX'
                    : calculateGrade(st.marksObtained, selectedExam?.maxMarks || 100);

                  return (
                    <tr
                      key={st.studentProfileId}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        backgroundColor: st.isAbsent
                          ? 'rgba(239, 68, 68, 0.03)'
                          : st.isExempt
                          ? 'rgba(234, 179, 8, 0.03)'
                          : 'transparent',
                      }}
                    >
                      <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                        {st.rollNumber}
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{st.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{st.studentProfileId}</div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                          <input
                            type="number"
                            min="0"
                            max={selectedExam?.maxMarks || 100}
                            step="0.5"
                            value={st.marksObtained ?? ''}
                            disabled={st.isAbsent || st.isExempt}
                            onChange={(e) => updateStudentMark(st.studentProfileId, e.target.value)}
                            placeholder={st.isAbsent ? 'ABSENT' : st.isExempt ? 'EXEMPT' : '0.0'}
                            style={{
                              width: '90px',
                              padding: '6px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              backgroundColor: st.isAbsent || st.isExempt ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                              color: 'var(--text-primary)',
                              fontSize: '0.875rem',
                              fontWeight: 700,
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            / {selectedExam?.maxMarks || 100}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => toggleAbsent(st.studentProfileId)}
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: 'var(--radius-sm)',
                              border: st.isAbsent ? '1px solid #ef4444' : '1px solid var(--border-color)',
                              backgroundColor: st.isAbsent ? 'rgba(239, 68, 68, 0.15)' : 'var(--bg-primary)',
                              color: st.isAbsent ? '#ef4444' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            AB
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleExempt(st.studentProfileId)}
                            style={{
                              padding: '3px 8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              borderRadius: 'var(--radius-sm)',
                              border: st.isExempt ? '1px solid #eab308' : '1px solid var(--border-color)',
                              backgroundColor: st.isExempt ? 'rgba(234, 179, 8, 0.15)' : 'var(--bg-primary)',
                              color: st.isExempt ? '#eab308' : 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                          >
                            EX
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 'var(--radius-sm)',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            backgroundColor:
                              currentGrade === 'A+' || currentGrade === 'A'
                                ? 'rgba(34, 197, 94, 0.1)'
                                : currentGrade === 'B' || currentGrade === 'C'
                                ? 'rgba(59, 130, 246, 0.1)'
                                : currentGrade === 'AB'
                                ? 'rgba(239, 68, 68, 0.1)'
                                : 'rgba(148, 163, 184, 0.1)',
                            color:
                              currentGrade === 'A+' || currentGrade === 'A'
                                ? '#16a34a'
                                : currentGrade === 'B' || currentGrade === 'C'
                                ? '#3b82f6'
                                : currentGrade === 'AB'
                                ? '#ef4444'
                                : 'var(--text-secondary)',
                          }}
                        >
                          {currentGrade}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                        <input
                          type="text"
                          value={st.teacherRemarks}
                          onChange={(e) => updateRemarks(st.studentProfileId, e.target.value)}
                          placeholder="Optional performance comments..."
                          style={{
                            width: '100%',
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border-color)',
                            backgroundColor: 'var(--bg-primary)',
                            color: 'var(--text-primary)',
                            fontSize: '0.8rem',
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Exam Modal */}
      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-primary)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              width: '100%',
              maxWidth: '600px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-2xl)',
            }}
          >
            <div
              style={{
                padding: 'var(--space-4) var(--space-6)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Create Examination Schedule</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateExam} style={{ padding: 'var(--space-6)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newExamName}
                    onChange={(e) => setNewExamName(e.target.value)}
                    placeholder="e.g. Physics Mid-Term Examination 2026"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSubjectCode}
                    onChange={(e) => setNewSubjectCode(e.target.value)}
                    placeholder="e.g. PHY-10"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Target Class *
                  </label>
                  <select
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="Grade 10">Grade 10</option>
                    <option value="Grade 9">Grade 9</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Exam Type *
                  </label>
                  <select
                    value={newExamType}
                    onChange={(e) => setNewExamType(e.target.value as any)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <option value="UNIT_TEST">Unit Test</option>
                    <option value="MID_TERM">Mid Term</option>
                    <option value="FINAL_TERM">Final Term</option>
                    <option value="PRACTICAL">Practical Lab</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Exam Date (YYYY-MM-DD) *
                  </label>
                  <input
                    type="date"
                    required
                    value={newExamDate}
                    onChange={(e) => setNewExamDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Start Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    placeholder="e.g. 09:30 AM"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Duration (Minutes) *
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="360"
                    required
                    value={newDuration}
                    onChange={(e) => setNewDuration(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Maximum Marks *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="500"
                    required
                    value={newMaxMarks}
                    onChange={(e) => setNewMaxMarks(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Passing Marks *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={newMaxMarks}
                    required
                    value={newPassMarks}
                    onChange={(e) => setNewPassMarks(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px' }}>
                    Weightage % (1–100) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newWeightage}
                    onChange={(e) => setNewWeightage(Number(e.target.value))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      backgroundColor: 'var(--bg-primary)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'transparent',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingExam}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--brand-primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {creatingExam ? 'Saving to DB...' : 'Create Examination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

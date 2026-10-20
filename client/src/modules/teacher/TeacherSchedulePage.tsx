import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck,
  FileQuestion,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Users,
  Calendar,
  Layers,
  ClipboardList,
  Bell,
  ArrowRight,
  ChevronRight,
  User,
} from 'lucide-react';
import {
  academicApi,
  coreApi,
  operationsApi,
  getStoredUser,
} from '../../services/api.js';

export const TeacherSchedulePage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [examSchedules, setExamSchedules] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Attendance State
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);
  const [quickAttendance, setQuickAttendance] = useState<Array<{ id: string; name: string; roll: string; status: 'PRESENT' | 'ABSENT' | 'LATE' }>>([]);

  const user = getStoredUser();
  const teacherName = user ? `${user.firstName} ${user.lastName}` : 'Dr. Julian Thorne';

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [quizRes, stuRes, ttRes, asgRes, examRes, notRes] = await Promise.allSettled([
        academicApi.listQuizzes({ className: 'Grade 10' }),
        coreApi.listStudents({ className: 'Grade 10', limit: 50 }),
        operationsApi.getTimetable({ className: 'Grade 10', sectionName: 'A' }),
        operationsApi.listAssignments({ className: 'Grade 10' }),
        academicApi.listExamSchedules({ className: 'Grade 10' }),
        operationsApi.listNotices(),
      ]);

      if (quizRes.status === 'fulfilled') setQuizzes(quizRes.value || []);
      if (stuRes.status === 'fulfilled') {
        const items = stuRes.value?.items || [];
        setStudents(items);
        setQuickAttendance(
          items.map((s: any) => ({
            id: s.id,
            name: `${s.firstName} ${s.lastName}`,
            roll: s.rollNumber || '1',
            status: 'PRESENT',
          }))
        );
      }
      if (ttRes.status === 'fulfilled') setTimetable(ttRes.value || []);
      if (asgRes.status === 'fulfilled') setAssignments(asgRes.value || []);
      if (examRes.status === 'fulfilled') setExamSchedules(examRes.value || []);
      if (notRes.status === 'fulfilled') setNotices(notRes.value || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load teacher workspace data from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleStatus = (id: string) => {
    setQuickAttendance((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : s))
    );
  };

  const handleQuickSubmitAttendance = async () => {
    if (quickAttendance.length === 0) return;
    try {
      setAttendanceSubmitting(true);
      setError(null);
      await academicApi.recordStudentAttendance({
        records: quickAttendance.map((s) => ({
          studentProfileId: s.id,
          status: s.status,
          remarks: 'Daily section roll call by faculty',
        })),
        date: new Date().toISOString().split('T')[0],
      });
      setAttendanceMarked(true);
    } catch (err: any) {
      setError(err.message || 'Failed to submit attendance to database.');
    } finally {
      setAttendanceSubmitting(false);
    }
  };

  // Resolve today's timetable periods
  const DAY_INDEX_MAP: Record<number, string> = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    7: 'SUNDAY',
  };

  const resolveSlotDay = (t: any): string => {
    if (typeof t?.dayOfWeek === 'number') return DAY_INDEX_MAP[t.dayOfWeek] || 'MONDAY';
    if (typeof t?.dayOfWeek === 'string') return t.dayOfWeek.toUpperCase();
    if (typeof t?.day === 'string') return t.day.toUpperCase();
    if (typeof t?.day === 'number') return DAY_INDEX_MAP[t.day] || 'MONDAY';
    return '';
  };

  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDay = days[new Date().getDay()];
  const todayClasses = timetable
    .filter((t) => resolveSlotDay(t) === todayDay)
    .sort((a, b) => (a.periodNumber || 0) - (b.periodNumber || 0) || (a.startTime || '').localeCompare(b.startTime || ''));

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, var(--primary-600), var(--primary-800))',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.4rem',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {teacherName[0]}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {teacherName}
              </h2>
              <span className="ed-badge ed-badge-success" style={{ fontSize: '0.72rem' }}>
                SENIOR FACULTY
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Department of Physical Sciences • Grade 10-A (Physics Core) • Academic Year 2026–2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Dossier
          </button>
          <Link to="/teacher/quizzes" className="ed-btn ed-btn-primary">
            <Plus size={15} /> Create Quiz / Assessment
          </Link>
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

      {/* Operational Metric KPI Tiles */}
      <div className="ed-grid-4">
        <Link to="/teacher/classes" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Assigned Class Roster</span>
              <Users size={16} style={{ color: 'var(--primary-600)' }} />
            </div>
            <span className="value">{loading ? '...' : `${students.length} Students`}</span>
            <span className="subtitle">Grade 10 Section A (Active)</span>
          </div>
        </Link>

        <Link to="/teacher/quizzes" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Online Quizzes</span>
              <FileQuestion size={16} style={{ color: 'var(--warning-solid)' }} />
            </div>
            <span className="value" style={{ color: 'var(--warning-solid)' }}>
              {loading ? '...' : `${quizzes.length} Assessments`}
            </span>
            <span className="subtitle">{quizzes.filter((q) => q.status === 'PUBLISHED').length} Live in Portal</span>
          </div>
        </Link>

        <Link to="/teacher/attendance" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Daily Roll Call</span>
              <CalendarCheck size={16} style={{ color: attendanceMarked ? 'var(--success-solid)' : 'var(--warning-solid)' }} />
            </div>
            <span className="value" style={{ color: attendanceMarked ? 'var(--success-solid)' : 'var(--warning-solid)' }}>
              {attendanceMarked ? 'Committed' : 'Pending'}
            </span>
            <span className="subtitle">{attendanceMarked ? 'Recorded in PostgreSQL' : 'Action Required for Today'}</span>
          </div>
        </Link>

        <Link to="/teacher/homework" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Homework Tasks</span>
              <ClipboardList size={16} style={{ color: 'var(--primary-700)' }} />
            </div>
            <span className="value" style={{ color: 'var(--primary-700)' }}>
              {loading ? '...' : assignments.length}
            </span>
            <span className="subtitle">Active Course Assignments</span>
          </div>
        </Link>
      </div>

      {/* Main Grid: Left (Class Timetable & Roster Attendance) & Right (Assessments & Homework) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Quick Attendance & Today's Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Quick Roll Call Card */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quick Roll Call: Grade 10-A</span>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Physics Core • Click to toggle Absent/Present</p>
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                {attendanceMarked ? (
                  <span className="ed-badge ed-badge-success">Saved to Ledger</span>
                ) : (
                  <button
                    className="ed-btn ed-btn-sm ed-btn-primary"
                    disabled={attendanceSubmitting || quickAttendance.length === 0}
                    onClick={handleQuickSubmitAttendance}
                  >
                    {attendanceSubmitting ? 'Saving...' : 'Submit Attendance'}
                  </button>
                )}
                <Link to="/teacher/attendance" className="ed-btn ed-btn-sm ed-btn-secondary">
                  Full Roster <ChevronRight size={13} />
                </Link>
              </div>
            </div>

            <div className="ed-card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading student roster...
                </div>
              ) : quickAttendance.length > 0 ? (
                <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                  {quickAttendance.slice(0, 6).map((student, idx) => (
                    <div
                      key={student.id}
                      onClick={() => !attendanceMarked && toggleStatus(student.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 16px',
                        borderBottom: idx === Math.min(quickAttendance.length, 6) - 1 ? 'none' : '1px solid var(--border-default)',
                        cursor: attendanceMarked ? 'default' : 'pointer',
                        backgroundColor: student.status === 'ABSENT' ? 'var(--danger-bg, rgba(239, 68, 68, 0.08))' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            backgroundColor: student.status === 'PRESENT' ? 'var(--success-bg)' : 'var(--danger-bg)',
                            color: student.status === 'PRESENT' ? 'var(--success-text)' : 'var(--danger-text)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.74rem',
                            fontWeight: 700,
                          }}
                        >
                          {student.roll}
                        </div>
                        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                          {student.name}
                        </span>
                      </div>
                      <span
                        className={`ed-badge ${student.status === 'PRESENT' ? 'ed-badge-success' : 'ed-badge-danger'}`}
                        style={{ fontSize: '0.72rem' }}
                      >
                        {student.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No students found in Grade 10-A.
                </div>
              )}
            </div>
          </div>

          {/* Today's Schedule Card */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Clock size={16} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Today's Teaching Schedule ({todayDay})
                </span>
              </div>
              <Link to="/teacher/timetable" className="ed-btn ed-btn-sm ed-btn-secondary">
                Weekly Timetable <ChevronRight size={13} />
              </Link>
            </div>
            <div className="ed-card-body" style={{ padding: 0 }}>
              {todayClasses.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {todayClasses.map((slot, idx) => (
                    <div
                      key={slot.id || idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 16px',
                        borderBottom: idx === todayClasses.length - 1 ? 'none' : '1px solid var(--border-default)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-subtle)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.74rem',
                            color: 'var(--primary-700)',
                          }}
                        >
                          P{slot.periodNumber || idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {slot.subjectName || slot.subjectCode || 'Physics Core'}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                            {slot.className || 'Grade 10'}-{slot.sectionName || 'A'} • Room {slot.roomNumber || '101'}
                          </div>
                        </div>
                      </div>
                      <span className="ed-badge ed-badge-neutral" style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem' }}>
                        {slot.startTime || '09:00'} – {slot.endTime || '09:45'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={28} style={{ opacity: 0.4, margin: '0 auto var(--space-2)' }} />
                  <p style={{ margin: 0, fontSize: '0.86rem' }}>No periods scheduled for today ({todayDay}).</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Quizzes, Exams & Homework */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Active Quizzes Card */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileQuestion size={16} style={{ color: 'var(--warning-solid)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Active Assessments & Quizzes</span>
              </div>
              <Link to="/teacher/quizzes" className="ed-btn ed-btn-sm ed-btn-secondary">
                Quiz Bank ({quizzes.length})
              </Link>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {quizzes.slice(0, 2).map((quiz) => (
                <div
                  key={quiz.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    backgroundColor: 'var(--bg-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.90rem', color: 'var(--text-primary)' }}>
                      {quiz.title}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {quiz.subjectCode} • {quiz.questions?.length || 0} Questions • Duration: {quiz.durationMinutes} mins • {quiz.totalMarks} Marks
                    </div>
                  </div>
                  <Link to="/teacher/quizzes" className="ed-btn ed-btn-sm ed-btn-secondary">
                    Manage
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Exam Marks Entry Banner */}
          <div
            style={{
              padding: 'var(--space-5)',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.12))',
              border: '1px solid rgba(14, 165, 233, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={20} style={{ color: 'var(--primary-600)' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Term Examination Marks Entry
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Enter and validate student subject marks, mark absentees, and commit grades directly to PostgreSQL for CBSE board report cards.
            </p>
            <div>
              <Link to="/teacher/exams/marks" className="ed-btn ed-btn-primary" style={{ display: 'inline-flex', gap: '6px' }}>
                <Award size={14} /> Open Marks Entry Console
              </Link>
            </div>
          </div>

          {/* Pending Homework Tasks */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <BookOpen size={16} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Homework & Assignments</span>
              </div>
              <Link to="/teacher/homework" className="ed-btn ed-btn-sm ed-btn-secondary">
                View All ({assignments.length})
              </Link>
            </div>
            <div className="ed-card-body" style={{ padding: 0 }}>
              {assignments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {assignments.slice(0, 3).map((asg, idx) => (
                    <div
                      key={asg.id || idx}
                      style={{
                        padding: '12px 16px',
                        borderBottom: idx === Math.min(assignments.length, 3) - 1 ? 'none' : '1px solid var(--border-default)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {asg.title}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Due: {asg.dueDate ? new Date(asg.dueDate).toLocaleDateString() : 'Next Week'} • Max {asg.maxMarks || 20} Marks
                        </div>
                      </div>
                      <Link to="/teacher/homework" className="ed-btn ed-btn-sm ed-btn-secondary">
                        Submissions
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.84rem' }}>
                  No assignments created yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TeacherSchedulePage;

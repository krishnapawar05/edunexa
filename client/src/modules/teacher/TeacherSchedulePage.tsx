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

interface TeacherProfileData {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  designation: string;
  department: string;
  joiningDate: string;
  status: string;
  schoolId: string;
  schoolName: string;
  idCardNumber: string | null;
  assignments: Array<{
    id: string;
    subjectId: string;
    subjectCode: string;
    subjectName: string;
    classId: string;
    className: string;
    sections: Array<{ id: string; name: string; capacity: number }>;
    isLeadTeacher: boolean;
  }>;
  assignedClasses: string[];
  assignedSubjects: string[];
}

export const TeacherSchedulePage: React.FC = () => {
  const [profile, setProfile] = useState<TeacherProfileData | null>(null);
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

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Fetch real teacher profile from PostgreSQL
      let prof: TeacherProfileData | null = null;
      try {
        prof = await coreApi.getTeacherProfile();
        setProfile(prof);
      } catch (e: any) {
        console.warn('Teacher profile fetch note:', e);
      }

      const primaryClass = prof?.assignedClasses?.[0] || 'Grade 10';
      const primarySection = prof?.assignments?.[0]?.sections?.[0]?.name || 'A';

      // 2. Load live data from PostgreSQL scoped to teacher's assignments
      const [quizRes, stuRes, ttRes, asgRes, examRes, notRes] = await Promise.allSettled([
        academicApi.listQuizzes({ className: primaryClass }),
        coreApi.listStudents({ className: primaryClass, limit: 50 }),
        operationsApi.getTimetable({ className: primaryClass, sectionName: primarySection }),
        operationsApi.listAssignments({ className: primaryClass }),
        academicApi.listExamSchedules({ className: primaryClass }),
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

  const teacherFullName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : user
    ? `${user.firstName} ${user.lastName}`
    : 'Faculty Member';

  const assignedClassesLabel = profile?.assignedClasses?.length
    ? profile.assignedClasses.join(', ')
    : 'Class Responsibilities Pending';

  const assignedSubjectsLabel = profile?.assignedSubjects?.length
    ? profile.assignedSubjects.join(', ')
    : 'Subjects Pending';

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
            {teacherFullName[0] || 'T'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {teacherFullName}
              </h2>
              <span className="ed-badge ed-badge-success" style={{ fontSize: '0.72rem' }}>
                {profile?.designation?.toUpperCase() || 'FACULTY'}
              </span>
              {profile?.employeeId && (
                <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.72rem' }}>
                  {profile.employeeId}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {profile?.department || 'Academic Department'} • {assignedClassesLabel} ({assignedSubjectsLabel}) • {profile?.schoolName || 'Apex Academy'}
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
            <Plus size={14} /> New Quiz
          </Link>
          <Link to="/teacher/attendance" className="ed-btn ed-btn-secondary">
            <CalendarCheck size={14} /> Full Roll Call
          </Link>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: 'var(--space-4)',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.9rem' }}>{error}</span>
        </div>
      )}

      {/* KPI Overview Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Today's Classes</span>
            <Clock size={18} style={{ color: 'var(--primary-600)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--text-primary)' }}>
            {todayClasses.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {todayClasses.length > 0 ? `Next period: ${todayClasses[0].startTime}` : 'No remaining periods today'}
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Active Quizzes</span>
            <FileQuestion size={18} style={{ color: 'var(--warning-600, #d97706)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--text-primary)' }}>
            {quizzes.filter((q) => q.status === 'PUBLISHED').length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            {quizzes.length} total quizzes in bank
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Student Roster</span>
            <Users size={18} style={{ color: 'var(--info-600, #0284c7)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--text-primary)' }}>
            {students.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            In primary assigned section
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Exams Scheduled</span>
            <Award size={18} style={{ color: 'var(--success-600, #16a34a)' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)', color: 'var(--text-primary)' }}>
            {examSchedules.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Marks entry workflows ready
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow Area */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 'var(--space-6)',
        }}
      >
        {/* Left Column: Today's Teaching Schedule */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Today's Teaching Schedule ({todayDay})
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Real-time timetable slots from PostgreSQL
              </p>
            </div>
            <Link to="/teacher/timetable" style={{ fontSize: '0.825rem', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
              Full Week →
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading schedule from PostgreSQL...</p>
            </div>
          ) : todayClasses.length === 0 ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-primary)',
                borderRadius: 'var(--radius-md)',
                border: '1px dashed var(--border-default)',
              }}
            >
              <Calendar size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ fontWeight: 600, margin: '0 0 4px', color: 'var(--text-primary)' }}>No classes scheduled for today</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                Check your weekly timetable or prepare study materials for upcoming periods.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {todayClasses.map((cls, idx) => (
                <div
                  key={cls.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-default)',
                    borderLeft: '4px solid var(--primary-600)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        color: 'var(--primary-600)',
                        border: '1px solid var(--border-default)',
                      }}
                    >
                      P{cls.periodNumber || idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                        {cls.subjectCode} — {cls.subjectName || 'Lecture & Lab'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        Room: {cls.roomNumber || 'Room 101'} • {cls.className || 'Grade 10'} ({cls.sectionName || 'A'})
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {cls.startTime} – {cls.endTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Quick Attendance Roll-Call */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-5)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Quick Attendance Roll-Call
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {profile?.assignedClasses?.[0] || 'Grade 10'} • Section A • {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>
            <Link to="/teacher/attendance" style={{ fontSize: '0.825rem', color: 'var(--primary-600)', textDecoration: 'none', fontWeight: 600 }}>
              Full Roster →
            </Link>
          </div>

          {attendanceMarked ? (
            <div
              style={{
                padding: 'var(--space-8)',
                textAlign: 'center',
                backgroundColor: 'var(--success-bg)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--success-border)',
                color: 'var(--success-text)',
              }}
            >
              <CheckCircle2 size={40} style={{ margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 6px', fontWeight: 800 }}>Roll Call Submitted & Saved</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                Attendance records successfully committed to PostgreSQL database ledger.
              </p>
              <button
                className="ed-btn ed-btn-secondary"
                onClick={() => setAttendanceMarked(false)}
                style={{ marginTop: 'var(--space-4)', fontSize: '0.8rem' }}
              >
                Re-open Quick Roll Call
              </button>
            </div>
          ) : loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 8px' }} />
              <p style={{ margin: 0, fontSize: '0.85rem' }}>Loading student roster...</p>
            </div>
          ) : quickAttendance.length === 0 ? (
            <div style={{ padding: 'var(--space-6)', textAlign: 'center', color: 'var(--text-secondary)' }}>
              No students enrolled in this section.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div
                style={{
                  maxHeight: '260px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  paddingRight: '4px',
                }}
              >
                {quickAttendance.slice(0, 10).map((st) => (
                  <div
                    key={st.id}
                    onClick={() => toggleStatus(st.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-primary)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-default)',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', width: '20px' }}>
                        #{st.roll}
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {st.name}
                      </span>
                    </div>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-xs)',
                        backgroundColor: st.status === 'PRESENT' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: st.status === 'PRESENT' ? '#16a34a' : '#ef4444',
                      }}
                    >
                      {st.status}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  Click row to toggle Present / Absent
                </span>
                <button
                  className="ed-btn ed-btn-primary"
                  onClick={handleQuickSubmitAttendance}
                  disabled={attendanceSubmitting}
                  style={{ fontSize: '0.825rem' }}
                >
                  <CalendarCheck size={14} />
                  {attendanceSubmitting ? 'Saving to DB...' : 'Save Attendance Ledger'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Subpage Quick Nav Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 'var(--space-4)',
        }}
      >
        <Link
          to="/teacher/quizzes"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-600)' }}>
              <FileQuestion size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Online Quizzes</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Manage question bank & AI generation</div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link
          to="/teacher/exams/marks"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#16a34a' }}>
              <Award size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Exam Marks Entry</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Score submissions & grade audits</div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link
          to="/teacher/resources"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(168, 85, 247, 0.1)', color: '#9333ea' }}>
              <BookOpen size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Study Resources</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Notes, lab manuals & study guides</div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </Link>

        <Link
          to="/teacher/homework"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 'var(--space-4)',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            textDecoration: 'none',
            color: 'inherit',
            transition: 'box-shadow 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div style={{ padding: '8px', borderRadius: 'var(--radius-sm)', backgroundColor: 'rgba(234, 179, 8, 0.1)', color: '#ca8a04' }}>
              <ClipboardList size={20} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>Homework & Tasks</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assign tasks & evaluate submissions</div>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </Link>
      </div>
    </div>
  );
};

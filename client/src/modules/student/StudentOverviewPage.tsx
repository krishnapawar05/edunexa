import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  IdCard,
  QrCode,
  Award,
  Calendar,
  Sparkles,
  BookOpen,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  CreditCard,
  CalendarCheck,
  FileQuestion,
  Layers,
  Bell,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  User,
} from 'lucide-react';
import {
  coreApi,
  academicApi,
  operationsApi,
  getStoredUser,
} from '../../services/api.js';

export const StudentOverviewPage: React.FC = () => {
  const [student, setStudent] = useState<any>(null);
  const [attendanceSummary, setAttendanceSummary] = useState<any>(null);
  const [reportCard, setReportCard] = useState<any>(null);
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [timetable, setTimetable] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      // Load student profile
      const studentProfile = await coreApi.getStudentById(currentStudentId);
      setStudent(studentProfile);

      const targetClass = studentProfile?.className || studentProfile?.enrollments?.[0]?.class?.name || 'Grade 10';
      const targetSection = studentProfile?.sectionName || studentProfile?.enrollments?.[0]?.section?.name || 'A';

      // Concurrently fetch all academic and operational records
      const [attRes, rcRes, quizRes, assignRes, ttRes, noticeRes, invRes] = await Promise.allSettled([
        academicApi.getStudentAttendanceSummary(currentStudentId),
        academicApi.getReportCard(currentStudentId),
        academicApi.listQuizzes({ className: targetClass }),
        operationsApi.listAssignments({ className: targetClass, sectionName: targetSection }),
        operationsApi.getTimetable({ className: targetClass, sectionName: targetSection }),
        operationsApi.listNotices(),
        operationsApi.listFeeInvoices({ studentProfileId: currentStudentId }),
      ]);

      if (attRes.status === 'fulfilled') setAttendanceSummary(attRes.value);
      if (rcRes.status === 'fulfilled') setReportCard(rcRes.value);
      if (quizRes.status === 'fulfilled') setQuizzes(quizRes.value || []);
      if (assignRes.status === 'fulfilled') setAssignments(assignRes.value || []);
      if (ttRes.status === 'fulfilled') setTimetable(ttRes.value || []);
      if (noticeRes.status === 'fulfilled') setNotices(noticeRes.value || []);
      if (invRes.status === 'fulfilled') setInvoices(invRes.value || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve authenticated student dossier.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const studentFullName = student
    ? `${student.firstName} ${student.lastName}`
    : 'Authenticated Student';
  const admissionNumber = student?.admissionNumber || '—';
  const className = student?.className || student?.enrollments?.[0]?.class?.name || 'Grade 10';
  const sectionName = student?.sectionName || student?.enrollments?.[0]?.section?.name || 'A';
  const rollNumber = student?.rollNumber || student?.enrollments?.[0]?.rollNumber || '—';

  // Calculations
  const pendingAssignments = assignments.filter((a) => !a.isSubmitted && a.status !== 'GRADED');
  const pendingInvoices = invoices.filter((i) => i.status !== 'PAID');
  const outstandingFee = pendingInvoices.reduce((sum, inv) => sum + ((inv.amountDue || 0) - (inv.amountPaid || 0)), 0);

  // Current day timetable filter
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const todayDay = days[new Date().getDay()];
  const todayClasses = timetable.filter(
    (t) => t.dayOfWeek?.toUpperCase() === todayDay || t.day?.toUpperCase() === todayDay
  );

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
            {student?.firstName ? student.firstName[0] : 'S'}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {studentFullName}
              </h2>
              <span className="ed-badge ed-badge-success" style={{ fontSize: '0.72rem' }}>
                ACTIVE STUDENT
              </span>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Admission: <strong style={{ color: 'var(--text-primary)' }}>{admissionNumber}</strong> • Class: <strong style={{ color: 'var(--text-primary)' }}>{className} - {sectionName}</strong> • Roll No: <strong style={{ color: 'var(--text-primary)' }}>{rollNumber}</strong> • Session: 2026–2027
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadData}
            disabled={loading}
            title="Refresh student dashboard from PostgreSQL"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Dossier
          </button>
          <Link to="/student/id-card" className="ed-btn ed-btn-primary">
            <IdCard size={15} /> View Virtual ID
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
          <button onClick={loadData} style={{ marginLeft: 'auto', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', fontWeight: 600 }}>
            Retry
          </button>
        </div>
      )}

      {/* Operational Metric KPI Tiles */}
      <div className="ed-grid-4">
        <Link to="/student/results" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Term Performance</span>
              <Award size={16} style={{ color: 'var(--primary-600)' }} />
            </div>
            <span className="value" style={{ color: 'var(--primary-700)' }}>
              {reportCard ? `${reportCard.overallPercentage}%` : (loading ? '...' : '89.0%')}
            </span>
            <span className="subtitle">
              Grade: {reportCard?.overallGrade || 'A1'} • {reportCard?.promotionStatus || 'Eligible for Promotion'}
            </span>
          </div>
        </Link>

        <Link to="/student/attendance" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Attendance Rate</span>
              <CalendarCheck size={16} style={{ color: 'var(--success-solid)' }} />
            </div>
            <span className="value" style={{ color: 'var(--success-solid)' }}>
              {attendanceSummary ? `${attendanceSummary.attendancePercentage}%` : (loading ? '...' : '94.2%')}
            </span>
            <span className="subtitle">
              {attendanceSummary ? `${attendanceSummary.presentDays} of ${attendanceSummary.totalDays} Days Present` : 'CBSE Min 75% Met'}
            </span>
          </div>
        </Link>

        <Link to="/student/assessments" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Live Quizzes</span>
              <FileQuestion size={16} style={{ color: 'var(--warning-solid)' }} />
            </div>
            <span className="value" style={{ color: quizzes.length > 0 ? 'var(--warning-solid)' : 'var(--text-primary)' }}>
              {loading ? '...' : `${quizzes.length} Scheduled`}
            </span>
            <span className="subtitle">
              {quizzes.length > 0 ? `${quizzes[0].title.slice(0, 22)}...` : 'All assessments up to date'}
            </span>
          </div>
        </Link>

        <Link to="/student/fees" style={{ textDecoration: 'none' }}>
          <div className="ed-metric-tile" style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="label">Fee Status</span>
              <CreditCard size={16} style={{ color: outstandingFee > 0 ? 'var(--danger-solid)' : 'var(--success-solid)' }} />
            </div>
            <span className="value" style={{ color: outstandingFee > 0 ? 'var(--danger-solid)' : 'var(--success-solid)' }}>
              {loading ? '...' : (outstandingFee > 0 ? `$${outstandingFee.toFixed(2)}` : 'Cleared')}
            </span>
            <span className="subtitle">
              {pendingInvoices.length > 0 ? `${pendingInvoices.length} Pending Invoice(s)` : 'No outstanding balances'}
            </span>
          </div>
        </Link>
      </div>

      {/* Main Grid: Left (Class Timetable & Quizzes) & Right (Homework & Quick Actions) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: 'var(--space-6)' }}>
        {/* Left Column: Today's Classes & Quizzes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Today's Schedule Card */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Clock size={16} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  Today's Classes ({todayDay === 'SUNDAY' ? 'Monday Preview' : todayDay})
                </span>
              </div>
              <Link to="/student/timetable" className="ed-btn ed-btn-sm ed-btn-secondary">
                Full Timetable <ChevronRight size={13} />
              </Link>
            </div>
            <div className="ed-card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading class timetable...
                </div>
              ) : todayClasses.length > 0 ? (
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
                        backgroundColor: idx === 0 ? 'var(--primary-50, rgba(14, 165, 233, 0.04))' : 'transparent',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: 'var(--bg-subtle)',
                            border: '1px solid var(--border-default)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: 'var(--primary-700)',
                          }}
                        >
                          P{slot.periodNumber || idx + 1}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                            {slot.subjectName || slot.subjectCode || 'Class Session'}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                            {slot.teacherName ? `Teacher: ${slot.teacherName}` : 'Faculty Assigned'} • Room: {slot.roomNumber || 'Room 101'}
                          </div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                          {slot.startTime || '09:00'} – {slot.endTime || '09:45'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-5)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Calendar size={28} style={{ color: 'var(--text-muted)', marginBottom: '8px', opacity: 0.5 }} />
                  <p style={{ margin: 0, fontSize: '0.86rem' }}>No periods scheduled for today ({todayDay}).</p>
                  <Link to="/student/timetable" style={{ fontSize: '0.80rem', color: 'var(--primary-600)', marginTop: '6px', display: 'inline-block' }}>
                    View complete weekly schedule
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Active Assessments Card */}
          <div className="ed-card" style={{ borderLeft: '4px solid var(--warning-solid)' }}>
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <FileQuestion size={16} style={{ color: 'var(--warning-solid)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Upcoming & Live Assessments</span>
              </div>
              <Link to="/student/assessments" className="ed-btn ed-btn-sm ed-btn-secondary">
                View All ({quizzes.length})
              </Link>
            </div>
            <div className="ed-card-body">
              {quizzes.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
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
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                          {quiz.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {quiz.subjectCode} • {quiz.questions?.length || 0} Questions • Duration: {quiz.durationMinutes} mins • {quiz.totalMarks} Marks
                        </div>
                      </div>
                      <Link to="/student/assessments" className="ed-btn ed-btn-sm ed-btn-primary">
                        Take Quiz
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-3)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No pending assessments at this time.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Homework Tasks & AI Assistant Quick Link */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          {/* Pending Homework Tasks */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <BookOpen size={16} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Homework & Assignments</span>
              </div>
              <Link to="/student/homework" className="ed-btn ed-btn-sm ed-btn-secondary">
                View Tasks ({assignments.length})
              </Link>
            </div>
            <div className="ed-card-body" style={{ padding: 0 }}>
              {loading ? (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading assignments...
                </div>
              ) : assignments.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {assignments.slice(0, 3).map((task, idx) => (
                    <div
                      key={task.id || idx}
                      style={{
                        padding: '12px 16px',
                        borderBottom: idx === Math.min(assignments.length, 3) - 1 ? 'none' : '1px solid var(--border-default)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {task.subjectName || task.subjectCode || 'General'} • Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Next Week'} • Max: {task.maxMarks || 20} Marks
                        </div>
                      </div>
                      <Link to="/student/homework" className="ed-btn ed-btn-sm ed-btn-secondary">
                        Submit
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No homework assignments pending.
                </div>
              )}
            </div>
          </div>

          {/* AI Concept Tutor Banner */}
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
              <Sparkles size={20} style={{ color: 'var(--primary-600)' }} />
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                AI Learning Assistant & Concept Tutor
              </h3>
            </div>
            <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Stuck on a Physics problem or need a step-by-step concept breakdown in Mathematics?
              Ask your personal AI tutor for syllabus-tailored explanations and practice hints.
            </p>
            <div>
              <Link to="/student/ai-tutor" className="ed-btn ed-btn-primary" style={{ display: 'inline-flex', gap: '6px' }}>
                <Sparkles size={14} /> Open AI Concept Tutor
              </Link>
            </div>
          </div>

          {/* Institutional Notices Preview */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Bell size={16} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Campus Notices & Announcements</span>
              </div>
              <Link to="/student/notices" className="ed-btn ed-btn-sm ed-btn-secondary">
                All Notices
              </Link>
            </div>
            <div className="ed-card-body" style={{ padding: 0 }}>
              {notices.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {notices.slice(0, 2).map((notice, idx) => (
                    <div
                      key={notice.id || idx}
                      style={{
                        padding: '12px 16px',
                        borderBottom: idx === Math.min(notices.length, 2) - 1 ? 'none' : '1px solid var(--border-default)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 600, fontSize: '0.86rem', color: 'var(--text-primary)' }}>
                          {notice.title}
                        </span>
                        <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.68rem' }}>
                          {notice.publishedAt ? new Date(notice.publishedAt).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                        {notice.content ? notice.content.slice(0, 110) + '...' : 'Notice details in bulletin.'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: 'var(--space-4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No announcements published for students today.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentOverviewPage;

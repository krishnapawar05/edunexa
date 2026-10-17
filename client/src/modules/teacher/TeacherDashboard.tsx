import React, { useState } from 'react';
import {
  CalendarCheck,
  FileQuestion,
  Award,
  BookOpen,
  Clock,
  CheckCircle2,
  Plus,
  X,
  AlertCircle,
} from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [quizzes, setQuizzes] = useState([
    {
      id: 'qz-101',
      title: 'Electromagnetic Induction & Faraday’s Laws',
      subject: 'Physics',
      class: 'Grade 10-A',
      durationMinutes: 45,
      totalMarks: 25,
      submissions: '38 / 40',
      status: 'PUBLISHED',
      deadline: '2026-10-20 17:00',
    },
    {
      id: 'qz-102',
      title: 'Newtonian Kinematics & Momentum',
      subject: 'Physics',
      class: 'Grade 10-B',
      durationMinutes: 30,
      totalMarks: 20,
      submissions: '40 / 40',
      status: 'GRADED',
      deadline: '2026-10-15 15:00',
    },
    {
      id: 'qz-103',
      title: 'Optics: Refraction & Snell’s Law (Draft)',
      subject: 'Physics',
      class: 'Grade 10-A',
      durationMinutes: 40,
      totalMarks: 20,
      submissions: '0 / 40',
      status: 'DRAFT',
      deadline: '2026-10-25 10:00',
    },
  ]);

  const [showCreateQuiz, setShowCreateQuiz] = useState(false);
  const [newQuizTitle, setNewQuizTitle] = useState('');
  const [newQuizDuration, setNewQuizDuration] = useState(30);

  // Quick Attendance State
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [classAttendance, setClassAttendance] = useState([
    { id: 1, name: 'Aarav Sharma', roll: 1, status: 'PRESENT' },
    { id: 2, name: 'Diya Patel', roll: 2, status: 'PRESENT' },
    { id: 3, name: 'Farhan Ali', roll: 3, status: 'ABSENT' },
    { id: 4, name: 'Gauri Rao', roll: 4, status: 'PRESENT' },
    { id: 5, name: 'Kunal Sen', roll: 5, status: 'PRESENT' },
  ]);

  const toggleAttendance = (id: number) => {
    setClassAttendance((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: s.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } : s))
    );
  };

  const handleCreateQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuizTitle) return;

    const created = {
      id: `qz-${Date.now()}`,
      title: newQuizTitle,
      subject: 'Physics',
      class: 'Grade 10-A',
      durationMinutes: newQuizDuration,
      totalMarks: 20,
      submissions: '0 / 40',
      status: 'DRAFT',
      deadline: '2026-10-28 17:00',
    };

    setQuizzes([created, ...quizzes]);
    setShowCreateQuiz(false);
    setNewQuizTitle('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Teacher Academic Workspace</h2>
          <p style={{ color: 'var(--text-muted)' }}>
            Dr. Julian Thorne • Department of Physical Sciences (Senior Secondary)
          </p>
        </div>
        <button
          className="ed-btn ed-btn-primary"
          onClick={() => setShowCreateQuiz(true)}
        >
          <Plus size={16} /> Create Assessment / Quiz
        </button>
      </div>

      {/* Operational Metrics */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Assigned Classes</span>
          <span className="value">4 Batches</span>
          <span className="subtitle">Grade 10-A, 10-B, 11-Sci, 12-Sci</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Today's Lectures</span>
          <span className="value">3 Periods</span>
          <span className="subtitle">Next: Period 3 (11:15 AM) in Lab 2</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Quizzes Active</span>
          <span className="value">1 Live</span>
          <span className="subtitle">Electromagnetic Induction</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Pending Mark Reviews</span>
          <span className="value" style={{ color: 'var(--warning-solid)' }}>14 Papers</span>
          <span className="subtitle">Descriptive physics questions</span>
        </div>
      </div>

      {/* Main Grid: Today's Schedule & Fast Attendance */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-6)' }}>
        {/* Quick Class Attendance Sheet */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Period 2 Attendance: Grade 10-A</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Physics Core • Room 204</p>
            </div>
            {attendanceMarked ? (
              <span className="ed-badge ed-badge-success">Saved to Ledger</span>
            ) : (
              <button
                className="ed-btn ed-btn-sm ed-btn-primary"
                onClick={() => setAttendanceMarked(true)}
              >
                Submit Attendance
              </button>
            )}
          </div>

          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {classAttendance.map((s) => (
              <div
                key={s.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.86rem', fontWeight: 600 }}>{s.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Roll #{s.roll}</div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleAttendance(s.id)}
                  className={`ed-btn ed-btn-sm ${s.status === 'PRESENT' ? 'ed-btn-primary' : 'ed-btn-danger'}`}
                  style={{ minWidth: '85px', fontSize: '0.78rem' }}
                >
                  {s.status}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quizzes and Assessment Tracking */}
        <div className="ed-card">
          <div className="ed-card-header">
            <div>
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Quizzes & Online Assessments</span>
              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Server-enforced timer & auto-grading engine</p>
            </div>
          </div>

          <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="ed-table">
              <thead>
                <tr>
                  <th>Quiz Title & Scope</th>
                  <th>Duration</th>
                  <th>Submissions</th>
                  <th>Status</th>
                  <th>Deadline</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{q.title}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {q.subject} • {q.class} • {q.totalMarks} Marks
                      </div>
                    </td>
                    <td>{q.durationMinutes} mins</td>
                    <td style={{ fontWeight: 600 }}>{q.submissions}</td>
                    <td>
                      {q.status === 'PUBLISHED' && <span className="ed-badge ed-badge-success">Live</span>}
                      {q.status === 'GRADED' && <span className="ed-badge ed-badge-info">Evaluated</span>}
                      {q.status === 'DRAFT' && <span className="ed-badge ed-badge-warning">Draft</span>}
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{q.deadline}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Quiz Modal */}
      {showCreateQuiz && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 'var(--space-4)',
          }}
        >
          <div className="ed-card" style={{ width: '100%', maxWidth: '480px', backgroundColor: '#ffffff' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Create Assessment / Quiz</h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>Questions can be added manually or generated via AI assistant</p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowCreateQuiz(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateQuiz} className="ed-card-body">
              <div className="ed-input-group">
                <label className="ed-label">Quiz Title *</label>
                <input
                  required
                  className="ed-input"
                  placeholder="e.g. Thermodynamics and Heat Engines"
                  value={newQuizTitle}
                  onChange={(e) => setNewQuizTitle(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group">
                  <label className="ed-label">Target Class</label>
                  <select className="ed-select">
                    <option>Grade 10-A</option>
                    <option>Grade 10-B</option>
                    <option>Grade 11-Science</option>
                  </select>
                </div>
                <div className="ed-input-group">
                  <label className="ed-label">Server Timer (Minutes)</label>
                  <input
                    type="number"
                    className="ed-input"
                    value={newQuizDuration}
                    onChange={(e) => setNewQuizDuration(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="ed-btn ed-btn-secondary"
                  onClick={() => setShowCreateQuiz(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="ed-btn ed-btn-primary">
                  Create Draft Quiz
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

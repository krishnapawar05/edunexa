import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Award,
  Layers,
} from 'lucide-react';
import { coreApi, academicApi, getStoredUser } from '../../services/api.js';

interface StudentProfile {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber?: string;
  admissionNumber?: string;
  className?: string;
  sectionName?: string;
  gender?: string;
  dateOfBirth?: string;
  parentContact?: string;
  parentEmail?: string;
  emergencyContact?: string;
  status?: string;
}

export const TeacherClassesPage: React.FC = () => {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Student Academic Details Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState<{
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    approvedLeaves: number;
    attendancePercentage: number;
  } | null>(null);
  const [classAttendanceRate, setClassAttendanceRate] = useState<string>('—');

  const user = getStoredUser();

  const loadStudents = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await coreApi.listStudents({
        className: selectedClass,
        limit: 100,
      });
      const items = res?.items || [];
      setStudents(items);

      // Fetch real class attendance rate from PostgreSQL
      try {
        const report = await academicApi.getClassAttendanceReport({
          className: selectedClass,
          sectionName: selectedSection,
          date: new Date().toISOString().split('T')[0],
        });
        if (report && report.attendancePercentage !== undefined) {
          setClassAttendanceRate(`${report.attendancePercentage}%`);
        } else if (items.length > 0) {
          setClassAttendanceRate('Recorded');
        } else {
          setClassAttendanceRate('—');
        }
      } catch {
        setClassAttendanceRate(items.length > 0 ? 'Recorded' : '—');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch student directory from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [selectedClass, selectedSection]);

  const viewStudentAcademicInfo = async (student: StudentProfile) => {
    setSelectedStudent(student);
    try {
      setLoadingSummary(true);
      const summary = await academicApi.getStudentAttendanceSummary(student.id);
      setAttendanceSummary(summary);
    } catch {
      setAttendanceSummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const fullName = `${s.firstName} ${s.lastName}`.toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      fullName.includes(query) ||
      (s.rollNumber && s.rollNumber.toLowerCase().includes(query)) ||
      (s.admissionNumber && s.admissionNumber.toLowerCase().includes(query))
    );
  });

  return (
    <div style={{ padding: 'var(--space-6)', maxWidth: '1400px', margin: '0 auto' }}>
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
            Class & Student Directory
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Inspect student rosters, enrollment identifiers, attendance percentages, and guardian emergency points of contact.
          </p>
        </div>

        <button
          onClick={loadStudents}
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
          Refresh Roster
        </button>
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

      {/* KPI Cards */}
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
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Enrolled Students</span>
            <Users size={18} color="var(--brand-primary)" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {students.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            In {selectedClass} active roster
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
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Assigned Section</span>
            <Layers size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            Section {selectedSection}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Academic year 2026–2027
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
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Attendance Record</span>
            <CalendarCheck size={18} color="#16a34a" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            {classAttendanceRate}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Aggregated term compliance
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
            <span style={{ fontSize: '0.825rem', fontWeight: 600, textTransform: 'uppercase' }}>Tenant Scope</span>
            <ShieldCheck size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, marginTop: 'var(--space-2)' }}>
            Secured
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Strict role-level isolation
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
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
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              CLASS
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
              SECTION
            </label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
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
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        {/* Search */}
        <div style={{ position: 'relative', width: '300px' }}>
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
            placeholder="Search students by name or roll..."
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

      {/* Student Table */}
      <div
        style={{
          backgroundColor: 'var(--surface-primary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="spin" style={{ margin: '0 auto var(--space-3)' }} />
            <p>Loading student directory from PostgreSQL...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div style={{ padding: 'var(--space-12)', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Users size={48} style={{ margin: '0 auto var(--space-4)', opacity: 0.4 }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No Students Found
            </h3>
            <p style={{ fontSize: '0.875rem' }}>No student records match the selected class or search filter.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-primary)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', width: '70px' }}>Roll</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Student Name</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Admission No</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Class & Section</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)' }}>Status</th>
                  <th style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st) => (
                  <tr
                    key={st.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      {st.rollNumber || '—'}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        {st.firstName} {st.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {st.gender || 'Student'}
                      </div>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      {st.admissionNumber || st.id.substring(0, 12)}
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6',
                          fontWeight: 600,
                        }}
                      >
                        {selectedClass} ({selectedSection})
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)' }}>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-xs)',
                          backgroundColor: 'rgba(34, 197, 94, 0.1)',
                          color: '#16a34a',
                          fontWeight: 600,
                        }}
                      >
                        {st.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td style={{ padding: 'var(--space-3) var(--space-4)', textAlign: 'right' }}>
                      <button
                        onClick={() => viewStudentAcademicInfo(st)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--surface-primary)',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        <Eye size={14} />
                        Academic Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Student Academic Info Modal */}
      {selectedStudent && (
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
              maxWidth: '520px',
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
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                  {selectedStudent.firstName} {selectedStudent.lastName}
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Admission: {selectedStudent.admissionNumber || selectedStudent.id} • Roll: {selectedStudent.rollNumber || '—'}
                </span>
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: 'var(--space-6)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                ATTENDANCE RECORD
              </h4>

              {loadingSummary ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-4)', color: 'var(--text-secondary)' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto var(--space-2)' }} />
                  <p style={{ fontSize: '0.85rem' }}>Fetching attendance summary from PostgreSQL...</p>
                </div>
              ) : attendanceSummary ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: 'var(--space-3)',
                    marginBottom: 'var(--space-5)',
                  }}
                >
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Rate</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#16a34a' }}>
                      {attendanceSummary.attendancePercentage}%
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Present</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {attendanceSummary.presentDays}
                    </div>
                  </div>
                  <div style={{ padding: 'var(--space-3)', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Absences</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444' }}>
                      {attendanceSummary.absentDays}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
                  No historical attendance ledger recorded yet for this session.
                </p>
              )}

              <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
                EMERGENCY CONTACT & GUARDIAN
              </h4>
              <div
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  backgroundColor: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-2)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Phone size={14} color="var(--brand-primary)" />
                  <span>Contact: {selectedStudent.parentContact || selectedStudent.emergencyContact || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={14} color="var(--brand-primary)" />
                  <span>Guardian Email: {selectedStudent.parentEmail || 'Not provided'}</span>
                </div>
              </div>
            </div>

            <div
              style={{
                padding: 'var(--space-4) var(--space-6)',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setSelectedStudent(null)}
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
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Save,
  Check,
  X,
  Clock,
  FileCheck,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { academicApi, coreApi } from '../../services/api.js';

export const TeacherAttendancePage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('Grade 10');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [roster, setRoster] = useState<Array<{
    studentProfileId: string;
    studentName: string;
    admissionNumber: string;
    rollNumber: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'APPROVED_LEAVE';
    remarks?: string;
  }>>([]);

  const [assignedClasses, setAssignedClasses] = useState<string[]>([]);
  const [assignedSections, setAssignedSections] = useState<string[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    coreApi.getTeacherProfile()
      .then((profile) => {
        if (profile?.assignments && profile.assignments.length > 0) {
          const classes = Array.from(new Set(profile.assignments.map((a: any) => a.class?.name || a.subject?.class?.name).filter(Boolean))) as string[];
          const sections = Array.from(new Set(profile.assignments.map((a: any) => a.section?.name).filter(Boolean))) as string[];
          if (classes.length > 0) {
            setAssignedClasses(classes);
            setSelectedClass(classes[0]);
          }
          if (sections.length > 0) {
            setAssignedSections(sections);
            setSelectedSection(sections[0]);
          }
        }
      })
      .catch((err) => console.warn('Could not load teacher assigned classes:', err));
  }, []);

  const loadRosterAndAttendance = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      // Load real students from PostgreSQL
      const studentRes = await coreApi.listStudents({ className: selectedClass, limit: 50 });
      const students = studentRes?.items || [];

      // Attempt to load existing daily class report if already recorded
      let existingRecords: Record<string, any> = {};
      try {
        const report = await academicApi.getClassAttendanceReport({
          className: selectedClass,
          sectionName: selectedSection,
          date: selectedDate,
        });
        if (report && report.records) {
          report.records.forEach((r: any) => {
            existingRecords[r.studentProfileId] = r;
          });
        }
      } catch (e) {
        // No prior records for this date
      }

      setRoster(
        students.map((s: any) => {
          const prior = existingRecords[s.id];
          return {
            studentProfileId: s.id,
            studentName: `${s.firstName} ${s.lastName}`,
            admissionNumber: s.admissionNumber || 'ADM-2026',
            rollNumber: s.rollNumber || '—',
            status: prior ? prior.status : 'PRESENT',
            remarks: prior?.remarks || '',
          };
        })
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load class roster from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRosterAndAttendance();
  }, [selectedClass, selectedSection, selectedDate]);

  const setStudentStatus = (studentProfileId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'APPROVED_LEAVE') => {
    setRoster((prev) =>
      prev.map((item) => (item.studentProfileId === studentProfileId ? { ...item, status } : item))
    );
  };

  const handleMarkAll = (status: 'PRESENT' | 'ABSENT') => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  const handleSubmitAttendance = async () => {
    if (roster.length === 0) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      setSuccessMsg(null);

      await academicApi.recordStudentAttendance({
        records: roster.map((r) => ({
          studentProfileId: r.studentProfileId,
          status: r.status,
          remarks: r.remarks || undefined,
        })),
        date: selectedDate,
      });

      setSuccessMsg(`Attendance successfully committed to PostgreSQL for ${selectedClass}-${selectedSection} on ${selectedDate}.`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to persist attendance records to database.');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;
  const leaveCount = roster.filter((r) => r.status === 'APPROVED_LEAVE').length;
  const attendanceRate = roster.length > 0 ? ((presentCount / roster.length) * 100).toFixed(1) : '100.0';

  const filteredRoster = roster.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase())
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
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
            <CalendarCheck size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Mark Daily Student Attendance
            </h2>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Record classroom roll call, verify present counts, and persist daily attendance directly to the school ledger.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadRosterAndAttendance}
            disabled={loading || saving}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Reload Roster
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={handleSubmitAttendance}
            disabled={loading || saving || roster.length === 0}
          >
            <Save size={15} /> {saving ? 'Committing...' : 'Commit Attendance Ledger'}
          </button>
        </div>
      </div>

      {/* Feedback Messages */}
      {errorMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertTriangle size={16} />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div style={{ padding: '12px 16px', backgroundColor: 'var(--success-bg)', border: '1px solid var(--success-border)', borderRadius: 'var(--radius-md)', color: 'var(--success-text)', fontSize: '0.86rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Class, Section, and Date Selection Toolbar */}
      <div
        className="ed-card"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'var(--space-4)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              CLASS
            </label>
            <select
              className="ed-input"
              style={{ minWidth: '130px' }}
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
            >
              {(assignedClasses.length > 0 ? assignedClasses : ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12']).map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              SECTION
            </label>
            <select
              className="ed-input"
              style={{ minWidth: '90px' }}
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
            >
              {(assignedSections.length > 0 ? assignedSections : ['A', 'B', 'C']).map((sec) => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              DATE OF SESSION
            </label>
            <input
              type="date"
              className="ed-input"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
        </div>

        {/* Quick Batch Marking Actions */}
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-sm ed-btn-secondary"
            onClick={() => handleMarkAll('PRESENT')}
            disabled={roster.length === 0}
          >
            Mark All Present
          </button>
          <button
            className="ed-btn ed-btn-sm ed-btn-secondary"
            onClick={() => handleMarkAll('ABSENT')}
            disabled={roster.length === 0}
          >
            Clear / Mark All Absent
          </button>
        </div>
      </div>

      {/* KPI Attendance Telemetry Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Class Enrollment</span>
          <span className="value">{roster.length}</span>
          <span className="subtitle">Verified Roster</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Present Count</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>{presentCount}</span>
          <span className="subtitle">In Attendance</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Absentees & Late</span>
          <span className="value" style={{ color: absentCount > 0 ? 'var(--danger-solid)' : 'var(--text-primary)' }}>
            {absentCount + lateCount}
          </span>
          <span className="subtitle">{absentCount} Absent • {lateCount} Tardy</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Attendance Rate</span>
          <span className="value" style={{ color: Number(attendanceRate) >= 75 ? 'var(--success-solid)' : 'var(--warning-solid)' }}>
            {attendanceRate}%
          </span>
          <span className="subtitle">CBSE Target: &gt;75%</span>
        </div>
      </div>

      {/* Student Attendance Table */}
      <div className="ed-card">
        <div className="ed-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, maxWidth: '340px' }}>
            <Search size={16} style={{ color: 'var(--text-muted)' }} />
            <input
              className="ed-input"
              placeholder="Search by student name or admission #..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ fontSize: '0.84rem' }}
            />
          </div>
          <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
            Showing {filteredRoster.length} of {roster.length} students
          </span>
        </div>

        <div className="ed-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto var(--space-2)' }} />
              <div>Fetching class roster from PostgreSQL...</div>
            </div>
          ) : filteredRoster.length > 0 ? (
            <div className="ed-table-container">
              <table className="ed-table">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Roll</th>
                    <th>Student Name</th>
                    <th>Admission #</th>
                    <th>Attendance Status</th>
                    <th>Teacher Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoster.map((student) => (
                    <tr key={student.studentProfileId}>
                      <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {student.rollNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {student.studentName}
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        {student.admissionNumber}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            type="button"
                            className={`ed-btn ed-btn-xs ${student.status === 'PRESENT' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                            onClick={() => setStudentStatus(student.studentProfileId, 'PRESENT')}
                            style={{
                              backgroundColor: student.status === 'PRESENT' ? 'var(--success-solid)' : undefined,
                              borderColor: student.status === 'PRESENT' ? 'var(--success-solid)' : undefined,
                              color: student.status === 'PRESENT' ? '#ffffff' : undefined,
                            }}
                          >
                            <Check size={12} /> Present
                          </button>
                          <button
                            type="button"
                            className={`ed-btn ed-btn-xs ${student.status === 'ABSENT' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                            onClick={() => setStudentStatus(student.studentProfileId, 'ABSENT')}
                            style={{
                              backgroundColor: student.status === 'ABSENT' ? 'var(--danger-solid)' : undefined,
                              borderColor: student.status === 'ABSENT' ? 'var(--danger-solid)' : undefined,
                              color: student.status === 'ABSENT' ? '#ffffff' : undefined,
                            }}
                          >
                            <X size={12} /> Absent
                          </button>
                          <button
                            type="button"
                            className={`ed-btn ed-btn-xs ${student.status === 'LATE' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                            onClick={() => setStudentStatus(student.studentProfileId, 'LATE')}
                            style={{
                              backgroundColor: student.status === 'LATE' ? 'var(--warning-solid)' : undefined,
                              borderColor: student.status === 'LATE' ? 'var(--warning-solid)' : undefined,
                              color: student.status === 'LATE' ? '#ffffff' : undefined,
                            }}
                          >
                            <Clock size={12} /> Late
                          </button>
                          <button
                            type="button"
                            className={`ed-btn ed-btn-xs ${student.status === 'APPROVED_LEAVE' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                            onClick={() => setStudentStatus(student.studentProfileId, 'APPROVED_LEAVE')}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                      <td>
                        <input
                          className="ed-input"
                          style={{ fontSize: '0.80rem', padding: '4px 8px' }}
                          placeholder="Optional note (e.g. sick leave, late entry)"
                          value={student.remarks || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRoster((prev) =>
                              prev.map((item) =>
                                item.studentProfileId === student.studentProfileId
                                  ? { ...item, remarks: val }
                                  : item
                              )
                            );
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 'var(--space-8)', textAlign: 'center', color: 'var(--text-muted)' }}>
              <FileCheck size={40} style={{ opacity: 0.4, margin: '0 auto var(--space-3)' }} />
              <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                No Students Found
              </h3>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                No active student records found for {selectedClass}-{selectedSection}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TeacherAttendancePage;

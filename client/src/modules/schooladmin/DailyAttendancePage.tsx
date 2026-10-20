import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  Users,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  RefreshCw,
  AlertTriangle,
  UserCheck,
  FileText,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge.js';
import { Button } from '../../components/ui/Button.js';
import { coreApi, academicApi } from '../../services/api.js';

interface StudentRosterItem {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  rollNumber: number;
  className: string;
  sectionName: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'APPROVED_LEAVE';
  remarks: string;
}

export const DailyAttendancePage: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState('Grade 10');
  const [selectedSection, setSelectedSection] = useState('A');
  const [roster, setRoster] = useState<StudentRosterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Active Tab: Student Attendance vs Staff Leaves
  const [activeTab, setActiveTab] = useState<'students' | 'staffLeaves'>('students');
  const [staffLeaves, setStaffLeaves] = useState<any[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Load Roster & Existing Attendance for Class/Date
  const loadClassAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const [studentsRes, reportRes] = await Promise.all([
        coreApi.listStudents({ className: selectedClass, limit: 100 }),
        academicApi
          .getClassAttendanceReport({
            className: selectedClass,
            sectionName: selectedSection,
            date: selectedDate,
          })
          .catch(() => null),
      ]);

      const existingRecordsMap: Record<string, any> = {};
      if (reportRes?.records) {
        reportRes.records.forEach((r: any) => {
          existingRecordsMap[r.studentProfileId] = r;
        });
      }

      const rawStudents = Array.isArray(studentsRes) ? studentsRes : (studentsRes as any)?.items || [];
      const items: StudentRosterItem[] = rawStudents.map((s: any) => {
        const existing = existingRecordsMap[s.id];
        return {
          id: s.id,
          admissionNumber: s.admissionNumber,
          firstName: s.firstName,
          lastName: s.lastName,
          rollNumber: s.rollNumber || 1,
          className: s.className,
          sectionName: s.sectionName,
          status: existing?.status || 'PRESENT',
          remarks: existing?.remarks || '',
        };
      });

      setRoster(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load attendance roster.');
    } finally {
      setLoading(false);
    }
  };

  const loadStaffLeaves = async () => {
    try {
      const leaves = await academicApi.listStaffLeaves();
      setStaffLeaves(leaves || []);
    } catch {
      // Ignored
    }
  };

  useEffect(() => {
    loadClassAttendance();
    loadStaffLeaves();
  }, [selectedClass, selectedSection, selectedDate]);

  // Bulk Status Setter
  const markAllStatus = (status: 'PRESENT' | 'ABSENT' | 'LATE') => {
    setRoster((prev) => prev.map((item) => ({ ...item, status })));
  };

  // Single Item Status Updater
  const updateStudentStatus = (studentId: string, status: any) => {
    setRoster((prev) =>
      prev.map((item) => (item.id === studentId ? { ...item, status } : item))
    );
  };

  // Single Item Remarks Updater
  const updateStudentRemarks = (studentId: string, remarks: string) => {
    setRoster((prev) =>
      prev.map((item) => (item.id === studentId ? { ...item, remarks } : item))
    );
  };

  // Save Attendance Batch to PostgreSQL
  const handleSaveAttendance = async () => {
    if (roster.length === 0) return;
    setIsSubmitting(true);
    try {
      const records = roster.map((r) => ({
        studentProfileId: r.id,
        status: r.status,
        remarks: r.remarks.trim() || undefined,
      }));

      await academicApi.recordStudentAttendance({
        className: selectedClass,
        sectionName: selectedSection,
        date: selectedDate,
        records,
      });

      showToast(`Daily attendance register successfully saved for ${selectedClass} (${selectedDate})!`);
      loadClassAttendance();
    } catch (err: any) {
      showToast(err.message || 'Failed to save attendance register.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const totalCount = roster.length;
  const presentCount = roster.filter((r) => r.status === 'PRESENT').length;
  const absentCount = roster.filter((r) => r.status === 'ABSENT').length;
  const lateCount = roster.filter((r) => r.status === 'LATE').length;
  const leaveCount = roster.filter((r) => r.status === 'APPROVED_LEAVE' || r.status === 'HALF_DAY').length;
  const attendancePercentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: 'var(--ink-900)',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} style={{ color: '#10b981' }} />
          <span>{toastMessage}</span>
        </div>
      )}

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
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Daily Attendance Register
            </h1>
            <Badge variant="info">{selectedDate}</Badge>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            Record, audit, and verify daily classroom rosters with atomic transactional persistence.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <button
            onClick={() => setActiveTab('students')}
            className={`ed-btn ed-btn-sm ${activeTab === 'students' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          >
            Student Roster
          </button>
          <button
            onClick={() => setActiveTab('staffLeaves')}
            className={`ed-btn ed-btn-sm ${activeTab === 'staffLeaves' ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
          >
            Staff Leaves ({staffLeaves.length})
          </button>
        </div>
      </div>

      {activeTab === 'students' ? (
        <>
          {/* Controls Bar */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-4)',
              backgroundColor: 'var(--bg-surface)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Date:</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="ed-input"
                  style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Class:</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="ed-input"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Section:</span>
                <select
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="ed-input"
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => markAllStatus('PRESENT')}
                className="ed-btn ed-btn-sm ed-btn-secondary"
                title="Mark entire roster Present"
              >
                Mark All Present
              </button>
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSubmitting || roster.length === 0}
                className="ed-btn ed-btn-sm ed-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Save size={14} />
                <span>{isSubmitting ? 'Saving Register...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>

          {/* KPI Statistics Bar */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 'var(--space-3)',
            }}
          >
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Enrolled</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>{totalCount}</div>
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Present Today</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981', marginTop: '2px' }}>{presentCount}</div>
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Absent</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ef4444', marginTop: '2px' }}>{absentCount}</div>
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Late Arrival</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f59e0b', marginTop: '2px' }}>{lateCount}</div>
            </div>
            <div style={{ padding: 'var(--space-3) var(--space-4)', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-default)' }}>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Attendance Rate</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#6366f1', marginTop: '2px' }}>{attendancePercentage}%</div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: 'var(--space-4)',
                backgroundColor: 'var(--danger-50)',
                border: '1px solid var(--danger-200)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--danger-800)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-3)',
              }}
            >
              <AlertTriangle size={20} />
              <div>{error}</div>
            </div>
          )}

          {/* Roster Table */}
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="ed-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--bg-subtle)', borderBottom: '1px solid var(--border-default)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)', width: '60px' }}>Roll</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Student</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Admission No.</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Attendance Status</th>
                    <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-muted)' }}>Remarks / Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Loading class roster for {selectedClass}...
                      </td>
                    </tr>
                  ) : roster.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No enrolled students found in {selectedClass} Section {selectedSection}.
                      </td>
                    </tr>
                  ) : (
                    roster.map((student) => (
                      <tr
                        key={student.id}
                        style={{ borderBottom: '1px solid var(--border-default)', transition: 'background-color 0.1s ease' }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--text-muted)' }}>
                          #{student.rollNumber}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {student.firstName} {student.lastName}
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {student.admissionNumber}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'inline-flex', gap: '4px' }}>
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(student.id, 'PRESENT')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                borderColor: student.status === 'PRESENT' ? '#10b981' : 'var(--border-default)',
                                backgroundColor: student.status === 'PRESENT' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                                color: student.status === 'PRESENT' ? '#10b981' : 'var(--text-muted)',
                              }}
                            >
                              Present
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(student.id, 'ABSENT')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                borderColor: student.status === 'ABSENT' ? '#ef4444' : 'var(--border-default)',
                                backgroundColor: student.status === 'ABSENT' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                color: student.status === 'ABSENT' ? '#ef4444' : 'var(--text-muted)',
                              }}
                            >
                              Absent
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(student.id, 'LATE')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                borderColor: student.status === 'LATE' ? '#f59e0b' : 'var(--border-default)',
                                backgroundColor: student.status === 'LATE' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                                color: student.status === 'LATE' ? '#f59e0b' : 'var(--text-muted)',
                              }}
                            >
                              Late
                            </button>
                            <button
                              type="button"
                              onClick={() => updateStudentStatus(student.id, 'APPROVED_LEAVE')}
                              style={{
                                padding: '4px 10px',
                                borderRadius: '4px',
                                border: '1px solid',
                                fontSize: '0.74rem',
                                fontWeight: 700,
                                cursor: 'pointer',
                                borderColor: student.status === 'APPROVED_LEAVE' ? '#8b5cf6' : 'var(--border-default)',
                                backgroundColor: student.status === 'APPROVED_LEAVE' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
                                color: student.status === 'APPROVED_LEAVE' ? '#8b5cf6' : 'var(--text-muted)',
                              }}
                            >
                              Leave
                            </button>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <input
                            type="text"
                            placeholder="Optional remark..."
                            value={student.remarks}
                            onChange={(e) => updateStudentRemarks(student.id, e.target.value)}
                            className="ed-input"
                            style={{ padding: '4px 8px', fontSize: '0.78rem', width: '100%', maxWidth: '240px' }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Bar */}
            <div
              style={{
                padding: '12px 16px',
                borderTop: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                backgroundColor: 'var(--bg-subtle)',
              }}
            >
              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSubmitting || roster.length === 0}
                className="ed-btn ed-btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}
              >
                <Save size={15} />
                <span>{isSubmitting ? 'Saving Register...' : 'Save Daily Attendance'}</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Staff Leaves Tab */
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-sm)',
            padding: 'var(--space-5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Staff Leave Applications & Permissions
          </h2>
          {staffLeaves.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No faculty or staff leave requests recorded in this academic cycle.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {staffLeaves.map((l) => (
                <div
                  key={l.id}
                  style={{
                    padding: 'var(--space-3) var(--space-4)',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-default)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      {l.leaveType} — {l.reason}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      Period: {l.startDate} to {l.endDate}
                    </div>
                  </div>
                  <Badge variant={l.status === 'APPROVED' ? 'success' : l.status === 'PENDING' ? 'warning' : 'neutral'}>
                    {l.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

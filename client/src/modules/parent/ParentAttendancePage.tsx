import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Filter,
  RefreshCw,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';
import { coreApi, academicApi } from '../../services/api.js';

interface Ward {
  id: string;
  studentProfileId: string;
  admissionNumber: string;
  name: string;
  grade: string;
  className: string;
  sectionName: string;
  rollNumber: number;
}

export const ParentAttendancePage: React.FC = () => {
  const [children, setChildren] = useState<Ward[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [errorChildren, setErrorChildren] = useState<string | null>(null);

  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [attendanceError, setAttendanceError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchDate, setSearchDate] = useState<string>('');

  const loadChildren = async () => {
    try {
      setLoadingChildren(true);
      setErrorChildren(null);
      const res = await coreApi.getParentChildren();
      const mapped = (res || []).map((c: any) => ({
        id: c.id || c.studentProfileId,
        studentProfileId: c.studentProfileId || c.id,
        admissionNumber: c.admissionNumber,
        name: c.name || `${c.firstName} ${c.lastName}`.trim(),
        grade: c.grade || `${c.className}-${c.sectionName}`,
        className: c.className,
        sectionName: c.sectionName,
        rollNumber: c.rollNumber || 1,
      }));
      setChildren(mapped);
      if (mapped.length > 0) {
        loadAttendance(mapped[0].id);
      }
    } catch (err: any) {
      setErrorChildren(err.message || 'Failed to retrieve registered children records.');
    } finally {
      setLoadingChildren(false);
    }
  };

  const loadAttendance = async (childId: string) => {
    try {
      setLoadingAttendance(true);
      setAttendanceError(null);
      const data = await academicApi.getStudentAttendanceSummary(childId);
      setAttendanceData(data);
    } catch (err: any) {
      console.warn('Attendance summary error:', err);
      setAttendanceData(null);
      setAttendanceError(err.message || 'Failed to retrieve attendance logs from server.');
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleSelectChild = (idx: number) => {
    setSelectedChildIndex(idx);
    if (children[idx]) {
      loadAttendance(children[idx].id);
    }
  };

  const selectedChild = children[selectedChildIndex];

  // Records filtering
  const allRecords: any[] = attendanceData?.records || [];
  const filteredRecords = allRecords.filter((r) => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (searchDate && !r.date.includes(searchDate)) return false;
    return true;
  });

  const totalWorkingDays = attendanceData?.totalWorkingDays || 0;
  const presentDays = attendanceData?.presentDays || 0;
  const absentDays = attendanceData?.absentDays || 0;
  const lateDays = attendanceData?.lateDays || 0;
  const leaveDays = attendanceData?.leaveDays || 0;
  const attendanceRate = totalWorkingDays > 0 ? `${attendanceData.attendancePercentage}%` : 'Not recorded';

  return (
    <div className="ed-page">
      <Breadcrumbs
        items={[
          { label: 'Parent Portal', href: '/parent' },
          { label: 'Attendance Records' },
        ]}
      />

      {/* Header */}
      <div className="ed-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <CalendarCheck size={24} style={{ color: 'var(--primary-600)' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Student Attendance & Session Records
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Verified biometric and classroom roll call ledger directly synchronized with institutional records.
            </p>
          </div>

          <button
            className="ed-btn ed-btn-secondary"
            onClick={() => selectedChild && loadAttendance(selectedChild.id)}
            disabled={loadingAttendance || !selectedChild}
          >
            <RefreshCw size={14} className={loadingAttendance ? 'animate-spin' : ''} /> Reload Ledger
          </button>
        </div>

        {/* Child Selector Tabs */}
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            SELECT WARD:
          </span>
          {loadingChildren ? (
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Loading wards...</span>
          ) : children.length === 0 ? (
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No registered children linked</span>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
              {children.map((child, idx) => (
                <button
                  key={child.id}
                  onClick={() => handleSelectChild(idx)}
                  className={`ed-btn ed-btn-sm ${selectedChildIndex === idx ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Users size={13} />
                  <span>{child.name}</span>
                  <span style={{ opacity: 0.8, fontSize: '0.74rem' }}>({child.grade})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {errorChildren && (
        <div style={{ padding: '12px 16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-4)' }}>
          <AlertTriangle size={16} />
          <span>{errorChildren}</span>
        </div>
      )}

      {selectedChild && (
        <>
          {/* Key Metrics Overview */}
          <div className="ed-grid-4" style={{ marginBottom: 'var(--space-6)' }}>
            <div className="ed-metric-tile">
              <span className="label">Cumulative Attendance</span>
              <span className="value" style={{ color: totalWorkingDays > 0 && attendanceData?.attendancePercentage >= 75 ? 'var(--teal-accent)' : 'var(--text-primary)' }}>
                {attendanceRate}
              </span>
              <span className="subtitle">
                {totalWorkingDays > 0 ? (
                  attendanceData?.attendancePercentage >= 75 ? (
                    <span style={{ color: 'var(--success-text)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle2 size={13} /> Satisfies CBSE 75% norm
                    </span>
                  ) : (
                    <span style={{ color: 'var(--danger-text)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <AlertTriangle size={13} /> Below 75% requirement
                    </span>
                  )
                ) : 'No recorded sessions'}
              </span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Days In Attendance</span>
              <span className="value" style={{ color: 'var(--primary-700)' }}>
                {presentDays} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {totalWorkingDays} days</span>
              </span>
              <span className="subtitle">Full & Tardy Sessions</span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Absences & Tardiness</span>
              <span className="value" style={{ color: absentDays > 0 ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                {absentDays} Absent • {lateDays} Tardy
              </span>
              <span className="subtitle">Official Excused / Unexcused</span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Approved Leaves</span>
              <span className="value" style={{ color: 'var(--text-secondary)' }}>
                {leaveDays}
              </span>
              <span className="subtitle">Documented Formal Leaves</span>
            </div>
          </div>

          {/* Attendance Log Table */}
          <div className="ed-card">
            <div className="ed-card-header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  Session Roll Call History
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {selectedChild.name} • Admission: {selectedChild.admissionNumber}
                </p>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                <input
                  type="date"
                  className="ed-input"
                  style={{ padding: '5px 8px', fontSize: '0.8rem' }}
                  value={searchDate}
                  onChange={(e) => setSearchDate(e.target.value)}
                />
                <select
                  className="ed-input"
                  style={{ padding: '5px 8px', fontSize: '0.8rem', minWidth: '130px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PRESENT">Present Only</option>
                  <option value="ABSENT">Absent Only</option>
                  <option value="LATE">Late Only</option>
                  <option value="APPROVED_LEAVE">Approved Leave</option>
                </select>
                {(statusFilter !== 'ALL' || searchDate) && (
                  <button
                    className="ed-btn ed-btn-sm ed-btn-secondary"
                    onClick={() => { setStatusFilter('ALL'); setSearchDate(''); }}
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {loadingAttendance ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>Loading attendance session records...</p>
              </div>
            ) : filteredRecords.length > 0 ? (
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Class & Section</th>
                      <th>Status</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((r: any) => {
                      const dateObj = new Date(r.date);
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const formattedDate = dateObj.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      });

                      let statusBadge = <span className="ed-badge ed-badge-success">PRESENT</span>;
                      if (r.status === 'ABSENT') {
                        statusBadge = <span className="ed-badge ed-badge-danger">ABSENT</span>;
                      } else if (r.status === 'LATE') {
                        statusBadge = <span className="ed-badge ed-badge-warning">LATE</span>;
                      } else if (r.status === 'APPROVED_LEAVE') {
                        statusBadge = <span className="ed-badge ed-badge-neutral">APPROVED LEAVE</span>;
                      } else if (r.status === 'HALF_DAY') {
                        statusBadge = <span className="ed-badge ed-badge-info">HALF DAY</span>;
                      }

                      return (
                        <tr key={r.id}>
                          <td style={{ fontWeight: 600 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                              <span>{formattedDate}</span>
                              <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>({dayName})</span>
                            </div>
                          </td>
                          <td>
                            {r.className || selectedChild.className} - Section {r.sectionName || selectedChild.sectionName}
                          </td>
                          <td>{statusBadge}</td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {r.remarks || 'Regular classroom attendance logged'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CalendarCheck size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  No Attendance Records Found
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {allRecords.length === 0
                    ? 'No attendance records have been recorded for this student yet. Attendance registers are updated daily by assigned class faculty.'
                    : 'No attendance entries matched your selected filter criteria. Try resetting the status or date filters.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

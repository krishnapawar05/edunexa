import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  ShieldCheck,
} from 'lucide-react';
import { academicApi, coreApi, getStoredUser } from '../../services/api.js';

export const StudentAttendancePage: React.FC = () => {
  const [summary, setSummary] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const [studentProfile, attSummary] = await Promise.all([
        coreApi.getStudentById(currentStudentId),
        academicApi.getStudentAttendanceSummary(currentStudentId),
      ]);

      setStudent(studentProfile);
      setSummary(attSummary);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve attendance history from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, []);

  const studentFullName = student
    ? `${student.firstName} ${student.lastName}`
    : 'Authenticated Student';
  const attendancePct = summary?.attendancePercentage ?? 0;
  const isEligible = attendancePct >= 75.0;

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
              Attendance Record & History
            </h2>
            <span
              className={`ed-badge ${isEligible ? 'ed-badge-success' : 'ed-badge-danger'}`}
              style={{ fontSize: '0.72rem' }}
            >
              {isEligible ? 'EXAM ELIGIBLE (>75%)' : 'ATTENDANCE SHORTAGE (<75%)'}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Comprehensive attendance ledger, verified present days, and board exam compliance status.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadAttendance}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Attendance
          </button>
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

      {/* KPI Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Cumulative Rate</span>
          <span className="value" style={{ color: isEligible ? 'var(--success-solid)' : 'var(--danger-solid)' }}>
            {loading ? '...' : `${attendancePct}%`}
          </span>
          <span className="subtitle">CBSE Minimum Requirement: 75.0%</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Days Present</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>
            {summary ? summary.presentDays : (loading ? '...' : 0)}
          </span>
          <span className="subtitle">Total School Days: {summary ? summary.totalDays : 0}</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Unexcused Absences</span>
          <span className="value" style={{ color: (summary?.absentDays || 0) > 5 ? 'var(--danger-solid)' : 'var(--text-primary)' }}>
            {summary ? summary.absentDays : (loading ? '...' : 0)}
          </span>
          <span className="subtitle">Tardy / Late Days: {summary?.lateDays ?? 0}</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Approved Leaves</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>
            {summary ? summary.approvedLeaves : (loading ? '...' : 0)}
          </span>
          <span className="subtitle">Verified Medical / Sanctioned</span>
        </div>
      </div>

      {/* Main Breakdown: Progress Bar & Ledger Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: 'var(--space-6)' }}>
        {/* Progress & Compliance Breakdown */}
        <div className="ed-card">
          <div className="ed-card-header">
            <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Board Examination Eligibility</span>
          </div>
          <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', marginBottom: '8px' }}>
                <span style={{ fontWeight: 600 }}>Current Attendance Standing</span>
                <span style={{ fontWeight: 800, color: isEligible ? 'var(--success-solid)' : 'var(--danger-solid)' }}>
                  {attendancePct}%
                </span>
              </div>
              <div
                style={{
                  height: '14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-pill)',
                  overflow: 'hidden',
                  border: '1px solid var(--border-default)',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${Math.min(attendancePct, 100)}%`,
                    backgroundColor: isEligible ? 'var(--success-solid)' : 'var(--danger-solid)',
                    borderRadius: 'var(--radius-pill)',
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>0%</span>
                <span style={{ color: 'var(--warning-solid)', fontWeight: 600 }}>Threshold: 75%</span>
                <span>100%</span>
              </div>
            </div>

            <div
              style={{
                padding: '14px',
                backgroundColor: isEligible ? 'var(--success-bg)' : 'var(--danger-bg)',
                border: `1px solid ${isEligible ? 'var(--success-border)' : 'var(--danger-border)'}`,
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.84rem',
                lineHeight: 1.5,
              }}
            >
              <div style={{ fontWeight: 700, color: isEligible ? 'var(--success-text)' : 'var(--danger-text)', marginBottom: '4px' }}>
                {isEligible ? '✓ Full Examination Clearance' : '⚠️ Immediate Remedial Action Required'}
              </div>
              <div style={{ color: 'var(--text-primary)' }}>
                {isEligible
                  ? `${studentFullName} maintains satisfactory attendance above the 75% threshold mandated by CBSE academic regulations. Eligible for all term examinations.`
                  : 'Attendance is below the mandatory 75% threshold. Contact your class teacher and academic advisor immediately.'}
              </div>
            </div>

            {/* Attendance Summary List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span>Total Instructional School Days:</span>
                <strong>{summary ? summary.totalDays : 0} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span>Full Days Present:</span>
                <strong style={{ color: 'var(--success-solid)' }}>{summary ? summary.presentDays : 0} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span>Unexcused Days Absent:</span>
                <strong style={{ color: 'var(--danger-solid)' }}>{summary ? summary.absentDays : 0} Days</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-xs)' }}>
                <span>Approved Leaves / Medical Exemption:</span>
                <strong style={{ color: 'var(--primary-700)' }}>{summary ? summary.approvedLeaves : 0} Days</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attendance Policy & Verified Records */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
          <div className="ed-card">
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Institutional Attendance Rules</span>
              </div>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              <div>
                <strong>1. Daily Roll Call:</strong> Homeroom teachers record daily section attendance during the morning homeroom period.
              </div>
              <div>
                <strong>2. Leave Approvals:</strong> Medical and sanctioned leaves require formal parent submission through the Parent Portal and administrative verification.
              </div>
              <div>
                <strong>3. Biometric Verification:</strong> Daily gate ingress logs are cross-referenced with section attendance to prevent discrepancies.
              </div>
              <div>
                <strong>4. Read-Only Student Access:</strong> In compliance with security standards, students can monitor verified logs but cannot alter attendance entries.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentAttendancePage;

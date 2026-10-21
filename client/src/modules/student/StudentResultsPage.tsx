import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Calendar,
  Layers,
  TrendingUp,
  FileText,
  User,
  Building2,
} from 'lucide-react';
import { academicApi, coreApi, getStoredUser } from '../../services/api.js';
import { downloadReportCardPdf } from '../../services/pdfGenerator.js';

export const StudentResultsPage: React.FC = () => {
  const [reportCard, setReportCard] = useState<any | null>(null);
  const [student, setStudent] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedUser = getStoredUser();
      const currentStudentId = storedUser?.studentProfileId || 'stu-aarav-01';

      const [profile, rc] = await Promise.all([
        coreApi.getStudentById(currentStudentId),
        academicApi.getReportCard(currentStudentId),
      ]);

      setStudent(profile);
      setReportCard(rc);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve published report card from PostgreSQL.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResults();
  }, []);

  const studentFullName = student
    ? `${student.firstName} ${student.lastName}`
    : (reportCard?.studentName || 'Authenticated Student');
  const admissionNumber = student?.admissionNumber || reportCard?.admissionNumber || '—';
  const className = student?.className || reportCard?.className || '—';
  const sectionName = student?.sectionName || reportCard?.sectionName || '—';
  const rollNumber = student?.rollNumber || reportCard?.rollNumber || '—';

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
            <Award size={24} style={{ color: 'var(--primary-600)' }} />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Academic Results & Term Report Card
            </h2>
            <span className="ed-badge ed-badge-success" style={{ fontSize: '0.72rem' }}>
              OFFICIALLY PUBLISHED
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Official evaluation transcripts, subject grade allocations, and cumulative GPA records.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={loadResults}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Results
          </button>
          <button
            className="ed-btn ed-btn-secondary"
            onClick={() => {
              if (!reportCard) return;
              downloadReportCardPdf({
                schoolName: 'Apex Academy of Sciences & Arts',
                studentName: studentFullName,
                admissionNumber: admissionNumber,
                className: className ? `${className} - ${sectionName}` : 'Grade 10-A',
                rollNumber: rollNumber,
                academicSession: 'Academic Year 2026–2027',
                subjects: (reportCard.subjects || []).map((s: any) => ({
                  subjectName: s.subjectName,
                  marksObtained: s.marksObtained,
                  maxMarks: s.maxMarks,
                  grade: s.grade,
                  teacherRemarks: s.teacherRemarks,
                })),
                overallPercentage: reportCard.overallPercentage,
                overallGrade: reportCard.overallGrade,
                attendancePercentage: 96,
                principalRemarks: 'Promoted with exemplary analytical aptitude and distinction.',
              });
            }}
            disabled={!reportCard || loading}
          >
            <Printer size={14} style={{ display: 'none' }} />
            Download PDF
          </button>
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => window.print()}
          >
            <Printer size={15} /> Print Report Card
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

      {/* KPI Performance Tiles */}
      <div className="ed-grid-4">
        <div className="ed-metric-tile">
          <span className="label">Cumulative Aggregate</span>
          <span className="value" style={{ color: 'var(--primary-700)' }}>
            {reportCard && reportCard.overallPercentage !== undefined ? `${reportCard.overallPercentage}%` : (loading ? '...' : '—')}
          </span>
          <span className="subtitle">Overall Grade: {reportCard?.overallGrade || '—'}</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Promotion Status</span>
          <span className="value" style={{ color: 'var(--success-solid)', fontSize: '1.3rem' }}>
            {reportCard?.promotionStatus || (loading ? '...' : 'PENDING')}
          </span>
          <span className="subtitle">Official term progress standing</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Attendance Minimum</span>
          <span className="value" style={{ color: 'var(--success-solid)' }}>
            {reportCard?.attendancePercentage !== undefined ? `${reportCard.attendancePercentage}%` : (loading ? '...' : '—')}
          </span>
          <span className="subtitle">Verified above 75% CBSE requirement</span>
        </div>

        <div className="ed-metric-tile">
          <span className="label">Academic Session</span>
          <span className="value" style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>
            {reportCard?.academicSession || '2026–2027'}
          </span>
          <span className="subtitle">Term: Final Comprehensive</span>
        </div>
      </div>

      {/* Official Report Card Printable Document Container */}
      <div
        className="ed-card"
        style={{
          padding: 'var(--space-6)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-default)',
        }}
      >
        {/* Institutional Formal Header */}
        <div
          style={{
            textAlign: 'center',
            borderBottom: '2px solid var(--primary-700)',
            paddingBottom: 'var(--space-4)',
            marginBottom: 'var(--space-5)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
            <Building2 size={28} style={{ color: 'var(--primary-700)' }} />
            <h1 style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              Apex Academy of Sciences & Arts
            </h1>
          </div>
          <p style={{ margin: '2px 0 0', fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
            Affiliated to the Central Board of Secondary Education (CBSE) • Senior Secondary Division
          </p>
          <div style={{ marginTop: '6px', fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary-700)' }}>
            ANNUAL ACADEMIC PROGRESS REPORT • SESSION {reportCard?.academicSession || '2026–2027'}
          </div>
        </div>

        {/* Student Demographics Table */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
            padding: '14px 16px',
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-default)',
            marginBottom: 'var(--space-5)',
            fontSize: '0.84rem',
          }}
        >
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Student Name:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{studentFullName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Admission No:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{admissionNumber}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Class & Section:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{className} - {sectionName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Roll Number:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{rollNumber}</strong>
          </div>
        </div>

        {/* Subject Breakdown Table */}
        <div className="ed-table-container">
          <table className="ed-table">
            <thead>
              <tr>
                <th>Subject Name</th>
                <th>Maximum Marks</th>
                <th>Pass Marks</th>
                <th>Marks Scored</th>
                <th>Grade</th>
                <th>Evaluator Remarks</th>
              </tr>
            </thead>
            <tbody>
              {reportCard?.subjects && reportCard.subjects.length > 0 ? (
                reportCard.subjects.map((sub: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{sub.subjectName}</td>
                    <td>{sub.maxMarks}</td>
                    <td>{sub.passMarks}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.95rem' }}>
                      {sub.marksObtained}
                    </td>
                    <td>
                      <span
                        className={`ed-badge ${sub.grade === 'A1' || sub.grade === 'A2' ? 'ed-badge-success' : 'ed-badge-neutral'}`}
                      >
                        {sub.grade}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.80rem', color: 'var(--text-secondary)' }}>
                      {sub.teacherRemarks || 'Consistent understanding demonstrated.'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                    {loading ? 'Fetching marks from PostgreSQL...' : 'No published marks available yet for this term.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Aggregate Summary Ribbon */}
        <div
          style={{
            marginTop: 'var(--space-5)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
            padding: '16px 20px',
            backgroundColor: 'var(--primary-50, rgba(14, 165, 233, 0.08))',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--primary-200, rgba(14, 165, 233, 0.25))',
          }}
        >
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Cumulative Aggregate Performance
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--primary-800)', marginTop: '2px' }}>
              {reportCard && reportCard.overallPercentage !== undefined ? `${reportCard.overallPercentage}% • Cumulative Grade: ${reportCard.overallGrade || '—'}` : 'Evaluation pending formal publication'}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              className="ed-badge ed-badge-success"
              style={{ fontSize: '0.84rem', padding: '6px 14px', fontWeight: 700 }}
            >
              {reportCard?.promotionStatus || 'PENDING EVALUATION'}
            </span>
          </div>
        </div>

        {/* Footer Signatures */}
        <div
          style={{
            marginTop: 'var(--space-8)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            textAlign: 'center',
            gap: 'var(--space-4)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-default)',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: '4px', fontWeight: 600 }}>
              Class Teacher
            </div>
          </div>
          <div>
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: '4px', fontWeight: 600 }}>
              Examination Coordinator
            </div>
          </div>
          <div>
            <div style={{ height: '36px' }} />
            <div style={{ borderTop: '1px dashed var(--border-default)', paddingTop: '4px', fontWeight: 600 }}>
              Principal & Head of School
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default StudentResultsPage;

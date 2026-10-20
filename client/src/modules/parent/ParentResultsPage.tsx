import React, { useState, useEffect } from 'react';
import {
  Award,
  Users,
  Download,
  Printer,
  X,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  BookOpen,
  FileText,
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

export const ParentResultsPage: React.FC = () => {
  const [children, setChildren] = useState<Ward[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [loadingChildren, setLoadingChildren] = useState(true);
  const [errorChildren, setErrorChildren] = useState<string | null>(null);

  const [reportCard, setReportCard] = useState<any>(null);
  const [loadingReportCard, setLoadingReportCard] = useState(false);
  const [reportCardError, setReportCardError] = useState<string | null>(null);

  const [showPrintModal, setShowPrintModal] = useState(false);

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
        loadReportCard(mapped[0].id);
      }
    } catch (err: any) {
      setErrorChildren(err.message || 'Failed to retrieve registered children records.');
    } finally {
      setLoadingChildren(false);
    }
  };

  const loadReportCard = async (childId: string) => {
    try {
      setLoadingReportCard(true);
      setReportCardError(null);
      const data = await academicApi.getReportCard(childId);
      setReportCard(data);
    } catch (err: any) {
      console.warn('Report card fetch notice:', err);
      setReportCard(null);
      setReportCardError(err.message || 'Results have not been published yet for this student.');
    } finally {
      setLoadingReportCard(false);
    }
  };

  useEffect(() => {
    loadChildren();
  }, []);

  const handleSelectChild = (idx: number) => {
    setSelectedChildIndex(idx);
    if (children[idx]) {
      loadReportCard(children[idx].id);
    }
  };

  const selectedChild = children[selectedChildIndex];

  return (
    <div className="ed-page">
      <Breadcrumbs
        items={[
          { label: 'Parent Portal', href: '/parent' },
          { label: 'Published Report Cards' },
        ]}
      />

      {/* Page Header */}
      <div className="ed-card" style={{ marginBottom: 'var(--space-6)', padding: 'var(--space-5)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 'var(--space-4)' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
              <Award size={24} style={{ color: 'var(--primary-600)' }} />
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Published Examination Results & Report Cards
              </h2>
            </div>
            <p style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
              Access authorized institutional term assessments, official subject grades, and formal performance sheets.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <button
              className="ed-btn ed-btn-secondary"
              onClick={() => selectedChild && loadReportCard(selectedChild.id)}
              disabled={loadingReportCard || !selectedChild}
            >
              <RefreshCw size={14} className={loadingReportCard ? 'animate-spin' : ''} /> Refresh
            </button>
            {reportCard && reportCard.subjects && reportCard.subjects.length > 0 && (
              <button
                className="ed-btn ed-btn-primary"
                onClick={() => setShowPrintModal(true)}
              >
                <Printer size={15} /> Official Grade Sheet
              </button>
            )}
          </div>
        </div>

        {/* Child Selector Tabs */}
        <div style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            SELECT WARD:
          </span>
          {loadingChildren ? (
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>Loading wards...</span>
          ) : children.length === 0 ? (
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No registered children linked to this guardian profile</span>
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
              <span className="label">Cumulative Score</span>
              <span className="value" style={{ color: 'var(--primary-700)' }}>
                {reportCard?.overallPercentage ? `${reportCard.overallPercentage}%` : 'N/A'}
              </span>
              <span className="subtitle">Weighted Term Aggregate</span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Institutional Grade</span>
              <span className="value" style={{ color: 'var(--teal-accent)' }}>
                {reportCard?.overallGrade || (reportCard?.overallPercentage >= 90 ? 'A1' : reportCard?.overallPercentage >= 80 ? 'A2' : 'N/A')}
              </span>
              <span className="subtitle">
                <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} /> Certified Performance
              </span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Evaluated Subjects</span>
              <span className="value">
                {reportCard?.subjects ? reportCard.subjects.length : 0}
              </span>
              <span className="subtitle">Curricular Disciplines</span>
            </div>

            <div className="ed-metric-tile">
              <span className="label">Result Status</span>
              <span className="value" style={{ fontSize: '1rem', color: reportCard?.isPublished ? 'var(--success-text)' : 'var(--warning-text)' }}>
                {reportCard?.isPublished ? 'Published & Certified' : 'Under Review'}
              </span>
              <span className="subtitle">Academic Session 2026–2027</span>
            </div>
          </div>

          {/* Subject Wise Performance Table */}
          <div className="ed-card">
            <div className="ed-card-header">
              <div>
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>
                  {selectedChild.name} — Formal Examination Marksheet
                </span>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Admission: {selectedChild.admissionNumber} • Class: {selectedChild.className} (Section {selectedChild.sectionName}) • Roll #{selectedChild.rollNumber}
                </p>
              </div>
            </div>

            {loadingReportCard ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px' }} />
                <p style={{ margin: 0, fontWeight: 500 }}>Retrieving certified report card records from database...</p>
              </div>
            ) : reportCard && reportCard.subjects && reportCard.subjects.length > 0 ? (
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Subject Code</th>
                      <th>Subject Name</th>
                      <th>Marks Obtained</th>
                      <th>Maximum Marks</th>
                      <th>Percentage</th>
                      <th>Awarded Grade</th>
                      <th>Faculty Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportCard.subjects.map((sub: any, idx: number) => {
                      const pct = sub.maxMarks > 0 ? ((sub.marksObtained / sub.maxMarks) * 100).toFixed(1) : '—';
                      return (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>
                            {sub.subjectCode || `SUB-10${idx + 1}`}
                          </td>
                          <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {sub.subjectName}
                          </td>
                          <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>
                            {sub.marksObtained}
                          </td>
                          <td>{sub.maxMarks}</td>
                          <td style={{ fontWeight: 600 }}>{pct}%</td>
                          <td>
                            <span className={`ed-badge ${sub.grade?.startsWith('A') ? 'ed-badge-success' : 'ed-badge-neutral'}`}>
                              {sub.grade || '—'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            {sub.teacherRemarks || 'Satisfactory academic performance'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <h4 style={{ margin: '0 0 6px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Results have not been published yet
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', maxWidth: '460px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {reportCardError || 'Official term results have not been finalized or published by the school examination committee. Please check back following formal grade release.'}
                </p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Printable Report Card Modal */}
      {showPrintModal && reportCard && (
        <div className="ed-modal-overlay" onClick={() => setShowPrintModal(false)}>
          <div
            className="ed-modal-content"
            style={{ maxWidth: '780px', width: '100%', padding: 'var(--space-6)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid var(--border-default)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                  Apex Academy of Sciences & Arts
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Affiliated to CBSE, New Delhi • Official Academic Progress Report 2026–2027
                </p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="ed-btn ed-btn-sm ed-btn-secondary" onClick={() => window.print()}>
                  <Printer size={14} /> Print
                </button>
                <button className="ed-btn ed-btn-sm ed-btn-secondary" onClick={() => setShowPrintModal(false)}>
                  <X size={14} /> Close
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', backgroundColor: 'var(--bg-subtle)', padding: '14px', borderRadius: 'var(--radius-sm)', marginBottom: '20px', fontSize: '0.84rem' }}>
              <div><strong>Student Name:</strong><br />{selectedChild?.name}</div>
              <div><strong>Admission No:</strong><br />{selectedChild?.admissionNumber}</div>
              <div><strong>Class & Section:</strong><br />{selectedChild?.grade}</div>
              <div><strong>Roll Number:</strong><br />#{selectedChild?.rollNumber}</div>
            </div>

            <table className="ed-table" style={{ marginBottom: '24px' }}>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Obtained</th>
                  <th>Maximum</th>
                  <th>Grade</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {(reportCard.subjects || []).map((s: any, idx: number) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 600 }}>{s.subjectName}</td>
                    <td style={{ fontWeight: 700 }}>{s.marksObtained}</td>
                    <td>{s.maxMarks}</td>
                    <td><span className="ed-badge ed-badge-success">{s.grade || 'A'}</span></td>
                    <td style={{ fontSize: '0.8rem' }}>{s.teacherRemarks || 'Satisfactory'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '36px', paddingTop: '16px', borderTop: '1px dashed var(--border-default)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <div>Class Teacher Signature</div>
              <div>Controller of Examinations</div>
              <div>Principal Signature & Seal</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

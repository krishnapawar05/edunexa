import React, { useState } from 'react';
import {
  Award,
  Lock,
  Save,
  CheckCircle2,
  AlertTriangle,
  History,
  Download,
  Filter,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { Breadcrumbs } from '../../components/Breadcrumbs.js';

interface StudentMarkRow {
  studentId: string;
  admissionNo: string;
  name: string;
  rollNo: number;
  marksObtained: number | '';
  isAbsent: boolean;
  isExempt: boolean;
  teacherRemarks: string;
}

export const ExaminationWorkflow: React.FC = () => {
  const maxMarks = 100;
  const passMarks = 40;

  const [selectedExam, setSelectedExam] = useState('Term 1 Mid-Term 2026');
  const [selectedSubject, setSelectedSubject] = useState('Physics Core (Grade 10-A)');
  const [isLocked, setIsLocked] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const [showReportCard, setShowReportCard] = useState<any>(null);

  const [studentsMarks, setStudentsMarks] = useState<StudentMarkRow[]>([
    {
      studentId: 'stu-01',
      admissionNo: 'ADM-2026-0042',
      name: 'Aarav Sharma',
      rollNo: 1,
      marksObtained: 94,
      isAbsent: false,
      isExempt: false,
      teacherRemarks: 'Exceptional mastery of kinematics and circuits',
    },
    {
      studentId: 'stu-02',
      admissionNo: 'ADM-2026-0043',
      name: 'Diya Patel',
      rollNo: 2,
      marksObtained: 88,
      isAbsent: false,
      isExempt: false,
      teacherRemarks: 'Strong analytical reasoning on mechanics',
    },
    {
      studentId: 'stu-03',
      admissionNo: 'ADM-2026-0044',
      name: 'Rohan Verma',
      rollNo: 3,
      marksObtained: '',
      isAbsent: true,
      isExempt: false,
      teacherRemarks: 'Medical absence verified by clinic',
    },
    {
      studentId: 'stu-04',
      admissionNo: 'ADM-2026-0045',
      name: 'Ananya Iyer',
      rollNo: 4,
      marksObtained: 76,
      isAbsent: false,
      isExempt: false,
      teacherRemarks: 'Solid grasp; practice numerical calculations',
    },
    {
      studentId: 'stu-05',
      admissionNo: 'ADM-2026-0046',
      name: 'Vikram Joshi',
      rollNo: 5,
      marksObtained: 58,
      isAbsent: false,
      isExempt: false,
      teacherRemarks: 'Needs extra revision on optics formulas',
    },
  ]);

  const calculateGrade = (marks: number | '', isAbsent: boolean, isExempt: boolean) => {
    if (isExempt) return { grade: 'EXEMPT', color: 'var(--info-solid)' };
    if (isAbsent) return { grade: 'ABSENT', color: 'var(--danger-solid)' };
    if (marks === '') return { grade: 'PENDING', color: 'var(--text-muted)' };
    if (marks >= 90) return { grade: 'A+', color: 'var(--success-solid)' };
    if (marks >= 80) return { grade: 'A', color: 'var(--teal-accent)' };
    if (marks >= 70) return { grade: 'B', color: 'var(--primary-600)' };
    if (marks >= 60) return { grade: 'C', color: 'var(--warning-solid)' };
    if (marks >= 40) return { grade: 'D', color: 'var(--warning-text)' };
    return { grade: 'F', color: 'var(--danger-solid)' };
  };

  const handleMarkChange = (index: number, val: string) => {
    if (isLocked) return;
    const num = val === '' ? '' : Math.min(100, Math.max(0, Number(val)));
    setStudentsMarks((prev) =>
      prev.map((row, i) => (i === index ? { ...row, marksObtained: num, isAbsent: false, isExempt: false } : row))
    );
  };

  const toggleAbsent = (index: number) => {
    if (isLocked) return;
    setStudentsMarks((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, isAbsent: !row.isAbsent, marksObtained: !row.isAbsent ? '' : row.marksObtained, isExempt: false }
          : row
      )
    );
  };

  const toggleExempt = (index: number) => {
    if (isLocked) return;
    setStudentsMarks((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, isExempt: !row.isExempt, marksObtained: !row.isExempt ? '' : row.marksObtained, isAbsent: false }
          : row
      )
    );
  };

  const handleSaveDraft = () => {
    setDraftSavedToast(true);
    setTimeout(() => setDraftSavedToast(false), 2500);
  };

  const handleConfirmLock = () => {
    setIsLocked(true);
    setShowConfirmModal(false);
  };

  // Metrics summary
  const totalStudents = studentsMarks.length;
  const gradedStudents = studentsMarks.filter((s) => s.marksObtained !== '' && !s.isAbsent && !s.isExempt);
  const averageMarks =
    gradedStudents.length > 0
      ? (
          gradedStudents.reduce((acc, s) => acc + (Number(s.marksObtained) || 0), 0) / gradedStudents.length
        ).toFixed(1)
      : 'N/A';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      {/* Breadcrumbs & Title */}
      <div>
        <Breadcrumbs items={[{ label: 'Examinations' }, { label: 'Marks Entry & Grade Calculation' }]} />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <div>
            <h2>Examination Marks & Grading Ledger</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Enter, audit, and lock examination results with automated grading scale computation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <button
              className="ed-btn ed-btn-secondary"
              onClick={handleSaveDraft}
              disabled={isLocked}
            >
              <Save size={15} /> Save Draft
            </button>
            {isLocked ? (
              <span className="ed-badge ed-badge-neutral" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
                <Lock size={14} /> Marks Locked & Submitted
              </span>
            ) : (
              <button
                className="ed-btn ed-btn-primary"
                onClick={() => setShowConfirmModal(true)}
              >
                <Lock size={15} /> Lock & Publish Marks
              </button>
            )}
          </div>
        </div>
      </div>

      {draftSavedToast && (
        <div
          style={{
            padding: '10px 14px',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--success-text)',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <CheckCircle2 size={16} /> Marks sheet draft saved to database with change audit trail.
        </div>
      )}

      {/* Filter and Exam Context Bar */}
      <div className="ed-card ed-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 'var(--space-4)', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="ed-label">Examination Term</label>
            <select
              className="ed-select"
              style={{ width: '220px' }}
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
            >
              <option>Term 1 Mid-Term 2026</option>
              <option>Half-Yearly Examination 2026</option>
              <option>Annual Final Examination 2027</option>
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label className="ed-label">Class & Subject</label>
            <select
              className="ed-select"
              style={{ width: '240px' }}
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
            >
              <option>Physics Core (Grade 10-A)</option>
              <option>Physics Advanced (Grade 10-B)</option>
              <option>Chemistry Lab (Grade 11-Sci)</option>
            </select>
          </div>
        </div>

        {/* Quick Batch Summary */}
        <div style={{ display: 'flex', gap: 'var(--space-5)', textAlign: 'right' }}>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>MAX / PASS MARKS</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{maxMarks} / {passMarks}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>CLASS AVERAGE</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--teal-accent)' }}>
              {averageMarks} / {maxMarks}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ENTRY PROGRESS</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              {studentsMarks.filter((s) => s.marksObtained !== '' || s.isAbsent || s.isExempt).length} / {totalStudents}
            </div>
          </div>
        </div>
      </div>

      {/* Marks Entry Spreadsheet Table */}
      <div className="ed-card">
        <div className="ed-card-header">
          <div>
            <span style={{ fontWeight: 700, fontSize: '1rem' }}>Grade 10-A Student Mark Sheet</span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
              Weightage: 100% • Evaluator: Dr. Julian Thorne
            </span>
          </div>
          <button
            className="ed-btn ed-btn-sm ed-btn-secondary"
            onClick={() => alert('Exporting evaluation sheet as PDF report...')}
          >
            <Download size={13} /> Export PDF
          </button>
        </div>

        <div className="ed-table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="ed-table">
            <thead>
              <tr>
                <th style={{ width: '70px' }}>Roll No</th>
                <th>Admission No</th>
                <th>Student Full Name</th>
                <th style={{ width: '130px' }}>Marks (0–100)</th>
                <th style={{ width: '90px' }}>Calculated Grade</th>
                <th style={{ width: '150px' }}>Status Flags</th>
                <th>Academic Feedback Remarks</th>
              </tr>
            </thead>
            <tbody>
              {studentsMarks.map((row, idx) => {
                const gradeInfo = calculateGrade(row.marksObtained, row.isAbsent, row.isExempt);
                return (
                  <tr key={row.studentId}>
                    <td style={{ fontWeight: 600 }}>#{row.rollNo}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--primary-700)' }}>
                      {row.admissionNo}
                    </td>
                    <td style={{ fontWeight: 600 }}>{row.name}</td>
                    <td>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        disabled={isLocked || row.isAbsent || row.isExempt}
                        placeholder={row.isAbsent ? 'ABS' : row.isExempt ? 'EXM' : '0–100'}
                        className="ed-input"
                        style={{
                          width: '100px',
                          padding: '4px 8px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          textAlign: 'center',
                          backgroundColor: row.isAbsent || row.isExempt ? 'var(--bg-subtle)' : 'var(--bg-surface)',
                        }}
                        value={row.marksObtained}
                        onChange={(e) => handleMarkChange(idx, e.target.value)}
                      />
                    </td>
                    <td>
                      <span
                        className="ed-badge"
                        style={{
                          backgroundColor: 'var(--bg-subtle)',
                          border: `1px solid ${gradeInfo.color}`,
                          color: gradeInfo.color,
                          fontWeight: 700,
                        }}
                      >
                        {gradeInfo.grade}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => toggleAbsent(idx)}
                          className={`ed-btn ed-btn-sm ${row.isAbsent ? 'ed-btn-danger' : 'ed-btn-secondary'}`}
                          style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        >
                          Absent
                        </button>
                        <button
                          type="button"
                          disabled={isLocked}
                          onClick={() => toggleExempt(idx)}
                          className={`ed-btn ed-btn-sm ${row.isExempt ? 'ed-btn-primary' : 'ed-btn-secondary'}`}
                          style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                        >
                          Exempt
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowReportCard({
                            studentName: row.name,
                            admissionNumber: row.admissionNo,
                            rollNumber: row.rollNo,
                            className: 'Grade 10',
                            sectionName: 'A',
                            marksObtained: row.marksObtained !== '' ? Number(row.marksObtained) : 92,
                            grade: gradeInfo.grade,
                          })}
                          className="ed-btn ed-btn-sm ed-btn-secondary"
                          style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                          title="Generate Official Term Report Card"
                        >
                          Report Card
                        </button>
                      </div>
                    </td>
                    <td>
                      <input
                        disabled={isLocked}
                        className="ed-input"
                        style={{ padding: '4px 8px', fontSize: '0.82rem' }}
                        value={row.teacherRemarks}
                        onChange={(e) => {
                          const val = e.target.value;
                          setStudentsMarks((prev) =>
                            prev.map((r, i) => (i === idx ? { ...r, teacherRemarks: val } : r))
                          );
                        }}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Term Report Card Modal */}
      {showReportCard && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: 'var(--space-4)',
          }}
        >
          <div
            className="ed-card"
            style={{
              width: '100%',
              maxWidth: '680px',
              backgroundColor: '#ffffff',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div className="ed-card-header" style={{ borderBottom: '2px solid var(--primary-700)' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: 'var(--primary-800)', fontWeight: 800 }}>
                  Apex Academy of Sciences & Arts
                </h3>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  Affiliated to Central Board of Secondary Education • Academic Session 2026–2027
                </p>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowReportCard(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {/* Student Demographics Banner */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-2)',
                  padding: '12px 14px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.84rem',
                }}
              >
                <div><strong>Student Name:</strong> {showReportCard.studentName}</div>
                <div><strong>Admission Number:</strong> {showReportCard.admissionNumber}</div>
                <div><strong>Class & Section:</strong> {showReportCard.className} - {showReportCard.sectionName} (Roll #{showReportCard.rollNumber})</div>
                <div><strong>Attendance Standing:</strong> 96.4% (Eligible for Promotion)</div>
              </div>

              {/* Assessment Marks Breakdown Table */}
              <div className="ed-table-container">
                <table className="ed-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Max Marks</th>
                      <th>Pass Marks</th>
                      <th>Marks Scored</th>
                      <th>Grade</th>
                      <th>Weight</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Physics Core</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>{showReportCard.marksObtained}</td>
                      <td><span className="ed-badge ed-badge-success">{showReportCard.grade}</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Mathematics (Advanced)</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>88</td>
                      <td><span className="ed-badge ed-badge-success">A2</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>Chemistry Theory & Lab</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>91</td>
                      <td><span className="ed-badge ed-badge-success">A1</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 600 }}>English Literature</td>
                      <td>100</td>
                      <td>35</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-700)' }}>85</td>
                      <td><span className="ed-badge ed-badge-success">A2</span></td>
                      <td>30% (Mid-Term)</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary Stats */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  backgroundColor: 'var(--primary-50, #f0fdfa)',
                  border: '1px solid var(--primary-200, #99f6e4)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>CUMULATIVE WEIGHTED SCORE</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                    89.0% • Grade A1
                  </div>
                </div>

                <div>
                  <span className="ed-badge ed-badge-success" style={{ fontSize: '0.82rem', padding: '6px 12px' }}>
                    PROMOTED TO NEXT GRADE
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)' }}>
                <button
                  type="button"
                  className="ed-btn ed-btn-secondary"
                  onClick={() => setShowReportCard(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="ed-btn ed-btn-primary"
                  onClick={() => window.print()}
                >
                  <Download size={15} /> Print / Save PDF Report Card
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock Confirmation Dialog */}
      {showConfirmModal && (
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
          <div className="ed-card" style={{ width: '100%', maxWidth: '460px', backgroundColor: '#ffffff' }}>
            <div className="ed-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--warning-solid)' }} />
                <h3 style={{ fontSize: '1.05rem' }}>Lock & Publish Marks</h3>
              </div>
              <button className="ed-btn-icon" onClick={() => setShowConfirmModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body">
              <p style={{ fontSize: '0.86rem', lineHeight: 1.5 }}>
                You are about to lock the marks for <strong>Physics Core (Grade 10-A)</strong>.
              </p>
              <div
                style={{
                  margin: 'var(--space-3) 0',
                  padding: '10px 12px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  color: 'var(--text-secondary)',
                }}
              >
                Once locked, marks cannot be altered without Principal authorization and an audited correction trail. Published marks will immediately become visible on student and parent report cards.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                <button
                  type="button"
                  className="ed-btn ed-btn-secondary"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="ed-btn ed-btn-primary"
                  onClick={handleConfirmLock}
                >
                  Confirm & Lock Marks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


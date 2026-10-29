import React from 'react';
import { Award, CheckCircle2, Clock, Calendar, FileText, ShieldAlert } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const ExaminationInfoPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>EVALUATION POLICY</span>
        <h1>Examination Framework & Grading Standards</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Comprehensive evaluation guidelines compliant with CBSE Continuous and Comprehensive Evaluation (CCE) standards and internal EduNexa auto-grading controls.
        </p>
      </div>

      <div className="ed-responsive-split">
        {/* Left Column: Schedule Overview */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Academic Term Schedule 2026–2027</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Term 1 Mid-Term Assessments</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>October 14 – October 25, 2026</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--primary-700)', marginTop: '4px' }}>Weightage: 30% of Cumulative Annual Score</div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>Half-Yearly Examination</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>November 10 – November 22, 2026</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--primary-700)', marginTop: '4px' }}>Weightage: 30% of Cumulative Annual Score</div>
              </div>

              <div style={{ padding: '10px 12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>CBSE Pre-Board & Annual Final Exams</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>February 15 – March 10, 2027</div>
                <div style={{ fontSize: '0.76rem', color: 'var(--primary-700)', marginTop: '4px' }}>Weightage: 40% of Cumulative Annual Score</div>
              </div>
            </div>
          </div>

          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Integrity & Anti-Tamper Policy</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              All online quizzes utilize server-enforced timestamps, prohibiting client-side clock tampering. Published marks are locked to the PostgreSQL ledger and require audited Principal authorization to modify.
            </p>
          </div>
        </div>

        {/* Right Column: Grading Scale Table */}
        <div className="ed-card ed-card-body">
          <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-3)' }}>CBSE 9-Point Grading Scale</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Grades are automatically assigned upon marks submission in accordance with board percentile bands:
          </p>

          <table className="ed-table" style={{ fontSize: '0.84rem' }}>
            <thead>
              <tr>
                <th>Marks Range</th>
                <th>Awarded Grade</th>
                <th>Grade Point</th>
                <th>Academic Standing</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>91 – 100</td>
                <td><span className="ed-badge ed-badge-success">A1</span></td>
                <td>10.0</td>
                <td>Outstanding Mastery</td>
              </tr>
              <tr>
                <td>81 – 90</td>
                <td><span className="ed-badge ed-badge-success">A2</span></td>
                <td>9.0</td>
                <td>Excellent Performance</td>
              </tr>
              <tr>
                <td>71 – 80</td>
                <td><span className="ed-badge ed-badge-info">B1</span></td>
                <td>8.0</td>
                <td>Very Good Competency</td>
              </tr>
              <tr>
                <td>61 – 70</td>
                <td><span className="ed-badge ed-badge-info">B2</span></td>
                <td>7.0</td>
                <td>Good Progress</td>
              </tr>
              <tr>
                <td>51 – 60</td>
                <td><span className="ed-badge ed-badge-warning">C1</span></td>
                <td>6.0</td>
                <td>Satisfactory Proficiency</td>
              </tr>
              <tr>
                <td>41 – 50</td>
                <td><span className="ed-badge ed-badge-warning">C2</span></td>
                <td>5.0</td>
                <td>Basic Passing Grade</td>
              </tr>
              <tr>
                <td>35 – 40</td>
                <td><span className="ed-badge ed-badge-neutral">D</span></td>
                <td>4.0</td>
                <td>Marginal Pass Threshold</td>
              </tr>
              <tr>
                <td>0 – 34</td>
                <td><span className="ed-badge ed-badge-danger">E / Essential Repeat</span></td>
                <td>0.0</td>
                <td>Remedial Support Required</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

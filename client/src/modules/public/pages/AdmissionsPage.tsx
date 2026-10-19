import React, { useState } from 'react';
import { CheckCircle2, Clock, Calendar, FileText, ArrowRight, ShieldCheck, CheckCircle } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';
import { coreApi } from '../../../services/api.js';

export const AdmissionsPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const [formData, setFormData] = useState({
    studentName: '',
    applyingGrade: 'Grade 9',
    parentName: '',
    email: '',
    phone: '',
    city: 'Bangalore',
    prevSchool: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppNo, setSubmittedAppNo] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.email.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const parts = formData.studentName.trim().split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || 'Applicant';

      const res = await coreApi.submitPublicAdmission({
        schoolIdentifier: 'apex-academy',
        firstName,
        lastName,
        applyingGrade: formData.applyingGrade,
        guardianName: formData.parentName || 'Guardian',
        guardianEmail: formData.email,
        guardianPhone: formData.phone || undefined,
        previousSchool: formData.prevSchool || undefined,
      });

      setSubmittedAppNo(res.applicationNumber || `ADM-APP-${Math.floor(1000 + Math.random() * 9000)}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit admission application to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-success" style={{ marginBottom: '8px' }}>NOW ENROLLING</span>
        <h1>Admissions for Academic Year 2026–2027</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Join an inspiring scholastic community dedicated to academic rigor, scientific inquiry, and ethical character.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-8)' }}>
        {/* Left Column: Guidelines & Criteria */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Admission Process Steps</h3>
            <ol style={{ paddingLeft: '20px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <li><strong>Step 1:</strong> Submit the online application below to receive a formal tracking reference.</li>
              <li><strong>Step 2:</strong> Upload prior academic transcripts and birth certification documents.</li>
              <li><strong>Step 3:</strong> Interactive student assessment and parent orientation with senior faculty.</li>
              <li><strong>Step 4:</strong> Formal enrollment review and section classroom allocation by school admin.</li>
              <li><strong>Step 5:</strong> Issuance of verifiable ISO CR80 digital student ID card.</li>
            </ol>
          </div>

          <div className="ed-card ed-card-body">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 'var(--space-3)' }}>Eligibility & Age Criteria</h3>
            <table className="ed-table" style={{ fontSize: '0.82rem' }}>
              <thead>
                <tr>
                  <th>Grade Level</th>
                  <th>Minimum Age</th>
                  <th>Prerequisite</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Grade 1</td>
                  <td>6 Years (as of June 1)</td>
                  <td>Kindergarten Completion</td>
                </tr>
                <tr>
                  <td>Grade 6 (Middle)</td>
                  <td>11 Years</td>
                  <td>Grade 5 Clearance</td>
                </tr>
                <tr>
                  <td>Grade 9 (Secondary)</td>
                  <td>14 Years</td>
                  <td>Grade 8 Clearance</td>
                </tr>
                <tr>
                  <td>Grade 11 (Senior Sec)</td>
                  <td>16 Years</td>
                  <td>CBSE Class 10 Board Passed</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Interactive Application Form */}
        <div className="ed-card ed-card-body" style={{ backgroundColor: '#ffffff' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Online Admission Application</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--space-4)' }}>
            Applications are persisted directly to the school administrative ledger in PostgreSQL.
          </p>

          {errorMessage && (
            <div style={{ padding: '10px 14px', marginBottom: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.84rem' }}>
              {errorMessage}
            </div>
          )}

          {submittedAppNo ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
              <CheckCircle size={54} style={{ color: 'var(--success-solid)', margin: '0 auto var(--space-3)' }} />
              <h3>Application Submitted Successfully!</h3>
              <div style={{ margin: 'var(--space-4) auto', maxWidth: '320px', padding: '14px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>APPLICATION REFERENCE NUMBER</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary-700)', marginTop: '2px' }}>
                  {submittedAppNo}
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                An automated acknowledgment has been dispatched to <strong>{formData.email}</strong>. Our admissions committee will review credentials within 3 business days.
              </p>
              <button
                className="ed-btn ed-btn-secondary"
                style={{ marginTop: 'var(--space-4)' }}
                onClick={() => {
                  setSubmittedAppNo(null);
                  setFormData({
                    studentName: '',
                    applyingGrade: 'Grade 9',
                    parentName: '',
                    email: '',
                    phone: '',
                    city: 'Bangalore',
                    prevSchool: '',
                  });
                }}
              >
                Submit Another Application
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Applicant Full Name *</label>
                  <input
                    required
                    className="ed-input"
                    placeholder="e.g. Maya Krishnan"
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  />
                </div>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Applying Grade *</label>
                  <select
                    className="ed-select"
                    value={formData.applyingGrade}
                    onChange={(e) => setFormData({ ...formData, applyingGrade: e.target.value })}
                  >
                    <option>Grade 8</option>
                    <option>Grade 9</option>
                    <option>Grade 10</option>
                    <option>Grade 11 - Science</option>
                    <option>Grade 11 - Commerce</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Parent / Guardian Name *</label>
                  <input
                    required
                    className="ed-input"
                    placeholder="e.g. Dr. S. Krishnan"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>
                <div className="ed-input-group" style={{ marginBottom: 0 }}>
                  <label className="ed-label">Contact Phone *</label>
                  <input
                    required
                    type="tel"
                    className="ed-input"
                    placeholder="+91 98450 00000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Parent Email Address *</label>
                <input
                  required
                  type="email"
                  className="ed-input"
                  placeholder="parent@institution.org"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="ed-input-group" style={{ marginBottom: 0 }}>
                <label className="ed-label">Previous Institution Attended</label>
                <input
                  className="ed-input"
                  placeholder="e.g. St. Xavier High School"
                  value={formData.prevSchool}
                  onChange={(e) => setFormData({ ...formData, prevSchool: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 'var(--space-2)' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ed-btn ed-btn-primary"
                  style={{ width: '100%', padding: '10px', fontSize: '0.92rem', fontWeight: 600 }}
                >
                  {isSubmitting ? 'Submitting to Admissions...' : 'Submit Official Application'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

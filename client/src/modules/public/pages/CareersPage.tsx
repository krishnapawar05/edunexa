import React from 'react';
import { Briefcase, Award, CheckCircle2, Mail, GraduationCap } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const CareersPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  const openings = [
    {
      title: 'Senior Faculty in Pure Mathematics (Grades 11–12)',
      department: 'Department of Mathematical Sciences',
      type: 'Permanent Full-Time',
      qualification: 'M.Sc. in Mathematics, B.Ed. required; doctoral degree or IIT-JEE coaching track record strongly favored.',
      deadline: 'Nov 30, 2026',
    },
    {
      title: 'Assistant Professor / Faculty in Physical Sciences',
      department: 'Department of Physical Sciences',
      type: 'Permanent Full-Time',
      qualification: 'M.Sc. in Physics with practical experimental optics and electromagnetism laboratory experience.',
      deadline: 'Nov 30, 2026',
    },
    {
      title: 'Robotics & STEM Prototyping Lab Instructor',
      department: 'Department of Computer Science & AI',
      type: 'Contractual Full-Time',
      qualification: 'B.Tech / M.Tech in Electronics, Robotics, or Computer Science with Arduino/Raspberry Pi mentoring background.',
      deadline: 'Dec 15, 2026',
    },
    {
      title: 'Pastoral Care & Student Academic Counselor',
      department: 'Administration & Counseling Services',
      type: 'Permanent Full-Time',
      qualification: 'Master’s in Educational Psychology or Child Guidance with 5+ years secondary school counseling tenure.',
      deadline: 'Dec 15, 2026',
    },
  ];

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-8) var(--space-6)' }}>
      {/* Title */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>FACULTY RECRUITMENT</span>
        <h1>Careers at {branding.schoolName}</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Join an intellectually ambitious and ethically grounded faculty community shaping the next generation of scientists, humanists, and innovators.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
        {openings.map((job, idx) => (
          <div key={idx} className="ed-card ed-card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div style={{ maxWidth: '780px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                <span className="ed-badge ed-badge-success">{job.type}</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{job.department}</span>
              </div>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{job.title}</h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                <strong>Requirements:</strong> {job.qualification}
              </p>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                Application Deadline: {job.deadline}
              </div>
            </div>

            <div>
              <a
                href={`mailto:careers@apexacademy.edu?subject=Application: ${encodeURIComponent(job.title)}`}
                className="ed-btn ed-btn-primary"
                style={{ textDecoration: 'none', padding: '8px 16px', fontSize: '0.84rem' }}
              >
                Apply via Dossier →
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-subtle)', textAlign: 'center' }}>
        <h4 style={{ marginBottom: '4px' }}>General Faculty Inquiries & Research Fellowships</h4>
        <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', maxWidth: '640px', margin: '0 auto 12px' }}>
          We welcome spontaneous curriculum dossiers from credentialed educators in all CBSE disciplines. Please submit a cover letter, curriculum vitae, and three professional references to <strong>careers@apexacademy.edu</strong>.
        </p>
      </div>
    </div>
  );
};

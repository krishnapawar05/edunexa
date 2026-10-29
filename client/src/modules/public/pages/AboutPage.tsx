import React from 'react';
import { Award, ShieldCheck, CheckCircle2, Building, Target, Compass, BookOpen } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const AboutPage: React.FC = () => {
  const { branding } = useSchoolBranding();

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>INSTITUTIONAL PROFILE</span>
        <h1>About {branding.schoolName}</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: '720px', margin: '8px auto 0', fontSize: '1rem', lineHeight: 1.6 }}>
          Established under the CBSE Educational Charter with a commitment to scientific inquiry, intellectual resilience, and ethical leadership.
        </p>
      </div>

      {/* Vision & Mission */}
      <div className="ed-grid-2" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="ed-card ed-card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
            <Compass size={22} style={{ color: 'var(--primary-600)' }} />
            <h3 style={{ margin: 0 }}>Our Vision</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            To emerge as a national exemplar of transformative school education where scientific reason, moral integrity, and social responsibility converge, empowering each graduate to lead and thrive in a complex, interconnected world.
          </p>
        </div>

        <div className="ed-card ed-card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-2)' }}>
            <Target size={22} style={{ color: 'var(--teal-accent)' }} />
            <h3 style={{ margin: 0 }}>Our Mission</h3>
          </div>
          <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            To deliver rigorous curriculum standards enriched by state-of-the-art laboratory research, personalized teacher mentorship, competitive examination mastery, and a culture of empathy, discipline, and lifelong discovery.
          </p>
        </div>
      </div>

      {/* Institutional Profile & CBSE Affiliation */}
      <div className="ed-card ed-card-body" style={{ marginBottom: 'var(--space-8)' }}>
        <h3 style={{ marginBottom: 'var(--space-3)' }}>CBSE Affiliation & Regulatory Governance</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
          Apex Academy of Sciences & Arts is fully accredited by the Central Board of Secondary Education (CBSE Affiliation Code {branding.code}), New Delhi. All institutional operations adhere to strict statutory child safeguarding mandates, academic audit protocols, and fire/safety regulatory certifications.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 'var(--space-3)' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>AFFILIATION NUMBER</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{branding.code}</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>BOARD CODE</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>CBSE-SEC-89410</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>ACADEMIC SESSION</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>April 2026 – March 2027</div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>INSTRUCTION MEDIUM</div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>English Medium Core</div>
          </div>
        </div>
      </div>

      {/* Campus Infrastructure Highlights */}
      <div>
        <h3 style={{ marginBottom: 'var(--space-4)' }}>Campus Facilities & Research Laboratories</h3>
        <div className="ed-grid-3">
          <div className="ed-card ed-card-body">
            <h4>Advanced Physical Sciences Lab</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '6px' }}>
              Equipped with digital oscilloscopes, optics benches, spectrometers, and electromagnetic induction testing apparatus conforming to Senior Secondary physics syllabi.
            </p>
          </div>

          <div className="ed-card ed-card-body">
            <h4>Turing AI & Computing Studio</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '6px' }}>
              60 high-performance workstations with Python, Arduino microcontrollers, and localized machine learning sandboxes respecting student privacy guidelines.
            </p>
          </div>

          <div className="ed-card ed-card-body">
            <h4>Dr. Kalam Memorial Library</h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginTop: '6px' }}>
              Over 28,000 print volumes, peer-reviewed scientific journals, and digital research archives with individual quiet study carrels.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Award, BookOpen, Quote, Sparkles } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const PrincipalMessagePage: React.FC = () => {
  const { branding } = useSchoolBranding();

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>LEADERSHIP DESK</span>
        <h1>Principal's Message</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem' }}>
          Dr. Alistair Thorne, Ph.D. • Apex Academy of Sciences & Arts
        </p>
      </div>

      <div className="ed-card ed-card-body" style={{ padding: 'var(--space-8)', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '120px',
              height: '140px',
              backgroundColor: 'var(--primary-100)',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--primary-300)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-800)',
              flexShrink: 0,
            }}
          >
            <Award size={44} style={{ color: 'var(--primary-600)', marginBottom: '4px' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700 }}>PRINCIPAL</span>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '4px' }}>Welcome to Our Scholarly Community</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              Head of Institution & Professor of Physical Sciences • Apex Academy
            </p>
            <div style={{ fontStyle: 'italic', color: 'var(--primary-700)', fontSize: '0.94rem', marginTop: '12px', borderLeft: '3px solid var(--primary-600)', paddingLeft: '12px' }}>
              "We do not merely teach science and mathematics; we cultivate the habits of inquiry, observation, skepticism, and moral responsibility."
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p>
            Dear Students, Parents, and Esteemed Colleagues,
          </p>
          <p>
            It is my distinct honor to welcome you to <strong>{branding.schoolName}</strong> for the Academic Session 2026–2027. We stand at a pivotal juncture in educational history, where traditional paradigms of rote memorization are rightfully giving way to experiential inquiry, authentic problem solving, and technological fluency.
          </p>
          <p>
            At our academy, we champion an unapologetically rigorous academic curriculum under the Central Board of Secondary Education framework. Yet, our classrooms are anything but passive. Whether our Grade 10 students are investigating Faraday's laws through digital flux sensors or our senior secondary scholars are modeling ecological systems in computational Python labs, our pedagogy demands active intellectual courage.
          </p>
          <p>
            Crucially, intellectual excellence without ethical scaffolding produces clever minds devoid of purpose. Every student entrusted to our care participates in service projects, environmental stewardships, and reflective ethics dialogues. We teach our students to ask not only <em>"Can this be engineered?"</em> but <em>"Should this be done, and whom does it serve?"</em>
          </p>
          <p>
            To our parents: thank you for your enduring partnership. Our transparent digital ERP ledger, verifiable ID card systems, and real-time attendance registers ensure that your child’s educational journey is transparent, secure, and collaborative.
          </p>
          <p>
            I invite every student entering our gates to bring their curiosity, their questions, and their audacity to learn.
          </p>
          <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-default)', paddingTop: 'var(--space-4)' }}>
            <strong>Dr. Alistair Thorne, Ph.D.</strong><br />
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Principal, Apex Academy of Sciences & Arts<br />
              Former Senior Research Fellow, Indian Institute of Science
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Award, BookOpen, Quote, Sparkles } from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const PrincipalMessagePage: React.FC = () => {
  const { branding, websiteData } = useSchoolBranding();
  const content = websiteData?.content || {};

  const principalName = content.principalName || 'Dr. Alistair Thorne';
  const principalTitle = content.principalTitle || 'Principal & Head of Faculty';
  const principalQual = content.principalQualification || 'Ph.D. in Applied Physics • 24 Years Academic Leadership';
  const quote = content.principalMessageExcerpt || "We do not merely teach science and mathematics; we cultivate the habits of inquiry, observation, skepticism, and moral responsibility.";

  return (
    <div className="ed-public-container" style={{ padding: 'var(--space-8) 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-8)', textAlign: 'center' }}>
        <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>LEADERSHIP DESK</span>
        <h1 style={{ color: 'var(--text-primary)' }}>Principal's Message</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.96rem' }}>
          {principalName} • {branding.schoolName}
        </p>
      </div>

      <div className="ed-card ed-card-body" style={{ padding: 'var(--space-8)', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-default)' }}>
        <div style={{ display: 'flex', gap: 'var(--space-6)', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '120px',
              height: '140px',
              backgroundColor: 'var(--bg-subtle)',
              borderRadius: 'var(--radius-sm)',
              border: '2px solid var(--border-default)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-primary)',
              flexShrink: 0,
            }}
          >
            <Award size={44} style={{ color: 'var(--color-primary)', marginBottom: '4px' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-primary)' }}>PRINCIPAL</span>
          </div>

          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Welcome to Our Scholarly Community</h3>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
              {principalTitle} • {principalQual}
            </p>
            <div style={{ fontStyle: 'italic', color: 'var(--color-primary)', fontSize: '0.94rem', marginTop: '12px', borderLeft: '3px solid var(--color-accent)', paddingLeft: '12px' }}>
              "{quote}"
            </div>
          </div>
        </div>

        <div style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.8, display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {content.principalMessageFull ? (
            content.principalMessageFull.split('\n\n').map((para: string, idx: number) => (
              <p key={idx}>{para}</p>
            ))
          ) : (
            <>
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
                Equally fundamental is our insistence upon moral discipline and civic character. A brilliant mind untethered to empathy, humility, and justice is an incomplete formation. Our students are challenged to lead with integrity, treat peers and teachers with profound respect, and direct their skills toward societal welfare.
              </p>
              <p>
                To our parents, we offer an open, transparent, and respectful partnership. Our faculty desks, administrative councils, and parent-teacher portals exist to nurture the potential within your child. Together, let us cultivate scholars who are not only equipped to excel in examinations, but prepared to live purposeful, enlightened lives.
              </p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{principalName}</div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>{principalTitle}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600 }}>{branding.schoolName}</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

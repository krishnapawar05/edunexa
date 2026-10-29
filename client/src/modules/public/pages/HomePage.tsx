import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  Users,
  ShieldCheck,
  ArrowRight,
  GraduationCap,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const HomePage: React.FC = () => {
  const { branding } = useSchoolBranding();

  return (
    <div>
      {/* Hero Section (Restrained, High-Contrast Academic Design) */}
      <section className="ed-hero">
        <div className="ed-public-container">
          <div className="ed-hero-eyebrow">
            <Award size={14} /> CBSE Affiliated Institution • Affiliation Code: {branding.code}
          </div>

          <h1 className="ed-hero-title">
            Fostering Intellect, Character, and Scientific Excellence.
          </h1>

          <p className="ed-hero-subtitle">
            {branding.schoolName} offers an innovative learning ecosystem blending CBSE rigorous academics, advanced robotics research labs, and holistic character formation.
          </p>

          <div className="ed-hero-actions">
            <Link
              to="/admissions"
              className="ed-btn ed-btn-primary"
              style={{
                padding: '12px 26px',
                fontSize: '0.96rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                textDecoration: 'none',
              }}
            >
              Admissions Open 2026–2027 <ArrowRight size={16} />
            </Link>

            <Link
              to="/academics"
              className="ed-btn ed-btn-secondary"
              style={{
                padding: '12px 22px',
                fontSize: '0.96rem',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textDecoration: 'none',
              }}
            >
              Explore Curriculum
            </Link>

            <Link
              to="/verify-id"
              style={{
                color: '#38bdf8',
                fontSize: '0.88rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                padding: '8px 12px',
              }}
            >
              <ShieldCheck size={16} /> Verify Digital Student ID
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional Core Pillars (Responsive 4-column) */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0', backgroundColor: 'var(--bg-surface)' }}>
        <div className="ed-public-container">
          <div className="ed-responsive-4col">
            <div className="ed-card ed-card-body">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-700)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <BookOpen size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Curriculum Rigor</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                CBSE benchmarked learning with project-based inquiry in physical sciences, computational math, and literature.
              </p>
            </div>

            <div className="ed-card ed-card-body">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--teal-subtle, #f0fdfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--teal-accent)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <Award size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>AI & Robotics Labs</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Hands-on STEM prototyping centers with server-enforced safety protocols and ethical technology education.
              </p>
            </div>

            <div className="ed-card ed-card-body">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--primary-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--primary-700)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Verified Credentials</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Anti-tamper digital ID cards with verifiable cryptographic QR tokens for campus access and identity safety.
              </p>
            </div>

            <div className="ed-card ed-card-body">
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--teal-subtle, #f0fdfa)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--teal-accent)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <Users size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Faculty Mentorship</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                1:14 teacher-to-student ratio ensuring individualized pastoral care, academic guidance, and olympiad training.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Highlight Section (Responsive Split) */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0', backgroundColor: 'var(--bg-subtle)' }}>
        <div className="ed-public-container">
          <div className="ed-responsive-split">
            {/* Principal Profile Card */}
            <div className="ed-card" style={{ padding: 'var(--space-6)', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
              <div
                style={{
                  width: '96px',
                  height: '96px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary-100)',
                  color: 'var(--primary-700)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-3)',
                  fontWeight: 800,
                  fontSize: '1.9rem',
                  border: '3px solid var(--primary-200)',
                }}
              >
                AT
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Dr. Alistair Thorne</h3>
              <div style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600 }}>Principal & Head of Faculty</div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                Ph.D. in Applied Physics (IISc) • 24 Years Academic Leadership
              </p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Link to="/principal-message" className="ed-btn ed-btn-sm ed-btn-primary" style={{ textDecoration: 'none' }}>
                  Read Principal's Message →
                </Link>
              </div>
            </div>

            {/* Welcome Message Column */}
            <div>
              <div style={{ color: 'var(--primary-700)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Principal's Welcome
              </div>
              <h2 style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 800, lineHeight: 1.25, marginBottom: 'var(--space-4)' }}>
                "Education must inspire moral clarity as powerfully as intellectual prowess."
              </h2>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 'var(--space-5)' }}>
                At {branding.schoolName}, our mission extends beyond textbook mastery. We equip our young scholars with the critical faculties, scientific rigor, and ethical compass demanded by a rapidly changing technological world.
              </p>

              {/* Verified Institutional Indicators */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 'var(--space-4)' }}>
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-700)' }}>100%</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>CBSE Pass Rate</div>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-700)' }}>64+</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Full-Time Faculty</div>
                </div>
                <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--primary-700)' }}>1:14</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Teacher-Student Ratio</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Wings Overview (Responsive 3-column) */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0', backgroundColor: 'var(--bg-surface)' }}>
        <div className="ed-public-container">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontSize: 'clamp(1.35rem, 3vw, 1.85rem)' }}>Academic Wings & Stages</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '640px', margin: '6px auto 0' }}>
              Continuous academic progression from foundational discovery to pre-university honors
            </p>
          </div>

          <div className="ed-responsive-3col">
            <div className="ed-card ed-card-body">
              <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>GRADES 1–5</span>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Primary Wing: Foundations</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0 16px' }}>
                Activity-based phonics, mathematical reasoning, sensory observation, bilingual communication, and digital literacy.
              </p>
              <Link to="/academics" style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600, textDecoration: 'none' }}>
                Primary Syllabus Details →
              </Link>
            </div>

            <div className="ed-card ed-card-body">
              <span className="ed-badge ed-badge-success" style={{ marginBottom: '8px' }}>GRADES 6–8</span>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Middle Wing: Scientific Discovery</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0 16px' }}>
                Laboratory-driven experiments in physics, chemistry, biology, pre-algebra, robotics, and social sciences.
              </p>
              <Link to="/academics" style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600, textDecoration: 'none' }}>
                Middle School Syllabus Details →
              </Link>
            </div>

            <div className="ed-card ed-card-body">
              <span className="ed-badge ed-badge-warning" style={{ marginBottom: '8px' }}>GRADES 9–12</span>
              <h4 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>Senior Secondary: Pre-University</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0 16px' }}>
                Specialized tracks in Pure Sciences, Engineering Core, Commerce & Economics with competitive exam coaching.
              </p>
              <Link to="/academics" style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600, textDecoration: 'none' }}>
                Senior Secondary Tracks →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

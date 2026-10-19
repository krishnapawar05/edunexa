import React from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Award,
  BookOpen,
  Users,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Clock,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const HomePage: React.FC = () => {
  const { branding } = useSchoolBranding();

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: 'var(--space-12) var(--space-8)',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.18) 0%, transparent 60%)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', color: '#93c5fd', marginBottom: 'var(--space-4)' }}>
            <Award size={14} /> National STEM & Holistic Inquiry Accreditation 2026
          </div>
          <h1
            style={{
              fontSize: '2.8rem',
              fontWeight: 800,
              maxWidth: '820px',
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-4)',
            }}
          >
            Fostering Intellect, Character, and Scientific Excellence.
          </h1>
          <p
            style={{
              fontSize: '1.1rem',
              maxWidth: '680px',
              color: '#cbd5e1',
              lineHeight: 1.6,
              marginBottom: 'var(--space-8)',
            }}
          >
            {branding.schoolName} offers an innovative learning ecosystem blending CBSE rigorous academics, advanced robotics research labs, and holistic character formation.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <Link
              to="/admissions"
              className="ed-btn ed-btn-primary"
              style={{
                padding: '12px 28px',
                fontSize: '0.98rem',
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
              to="/about"
              className="ed-btn ed-btn-secondary"
              style={{
                padding: '12px 24px',
                fontSize: '0.98rem',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                border: '1px solid rgba(255,255,255,0.2)',
                textDecoration: 'none',
              }}
            >
              Explore Campus Life
            </Link>
          </div>
        </div>
      </section>

      {/* Institutional Core Pillars */}
      <section style={{ padding: 'var(--space-10) var(--space-8)', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="ed-grid-4">
            <div className="ed-card ed-card-body">
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-700)', marginBottom: 'var(--space-3)' }}>
                <BookOpen size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Curriculum Rigor</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                CBSE benchmarked learning with project-based inquiry in physical sciences, computational math, and literature.
              </p>
            </div>

            <div className="ed-card ed-card-body">
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--teal-50, #f0fdfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-accent)', marginBottom: 'var(--space-3)' }}>
                <Award size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>AI & Robotics Labs</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Hands-on STEM prototyping centers with server-enforced safety protocols and ethical technology education.
              </p>
            </div>

            <div className="ed-card ed-card-body">
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-700)', marginBottom: 'var(--space-3)' }}>
                <ShieldCheck size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Verified Credentials</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Anti-tamper digital ID cards with verifiable cryptographic QR tokens for physical and bus transport access.
              </p>
            </div>

            <div className="ed-card ed-card-body">
              <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--teal-50, #f0fdfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal-accent)', marginBottom: 'var(--space-3)' }}>
                <Users size={20} />
              </div>
              <h4 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Faculty Mentorship</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                1:14 teacher-to-student ratio ensuring individualized pastoral care, academic guidance, and olympiad training.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Leadership Highlight Section */}
      <section style={{ padding: 'var(--space-10) var(--space-8)', backgroundColor: 'var(--bg-subtle)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 'var(--space-8)', alignItems: 'center' }}>
          <div className="ed-card" style={{ padding: 'var(--space-6)', textAlign: 'center', backgroundColor: '#ffffff' }}>
            <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)', fontWeight: 800, fontSize: '2rem' }}>
              AT
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>Dr. Alistair Thorne</h3>
            <div style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600 }}>Principal & Head of Faculty</div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ph.D. in Applied Physics (IISc) • 24 Years Academic Leadership
            </p>
            <div style={{ marginTop: 'var(--space-4)' }}>
              <Link to="/principal-message" className="ed-btn ed-btn-sm ed-btn-primary" style={{ textDecoration: 'none' }}>
                Read Principal's Message →
              </Link>
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--primary-700)', fontWeight: 700, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              Principal's Welcome
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1.25, marginBottom: 'var(--space-4)' }}>
              "Education must inspire moral clarity as powerfully as intellectual prowess."
            </h2>
            <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--space-4)' }}>
              At Apex Academy, our mission extends beyond textbook mastery. We equip our young scholars with the critical faculties, scientific rigor, and ethical compass demanded by a rapidly changing technological world.
            </p>
            <div style={{ display: 'flex', gap: 'var(--space-6)' }}>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-800)' }}>100%</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CBSE Board Pass Rate</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-800)' }}>64+</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Full-Time Faculty</div>
              </div>
              <div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-800)' }}>18</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>State Science Medals</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Campus Wings Overview */}
      <section style={{ padding: 'var(--space-10) var(--space-8)', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-8)' }}>
            <h2>Academic Wings & Stages</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Continuous academic progression from foundational discovery to pre-university honors
            </p>
          </div>

          <div className="ed-grid-3">
            <div className="ed-card ed-card-body">
              <span className="ed-badge ed-badge-info" style={{ marginBottom: '8px' }}>GRADES 1–5</span>
              <h4>Primary Wing: Foundations</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0' }}>
                Activity-based phonics, mathematical reasoning, sensory observation, bilingual communication, and digital literacy.
              </p>
              <Link to="/academics" style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600, textDecoration: 'none' }}>
                Primary Syllabus Details →
              </Link>
            </div>

            <div className="ed-card ed-card-body">
              <span className="ed-badge ed-badge-success" style={{ marginBottom: '8px' }}>GRADES 6–8</span>
              <h4>Middle Wing: Scientific Discovery</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0' }}>
                Laboratory-driven experiments in physics, chemistry, biology, pre-algebra, robotics, and social sciences.
              </p>
              <Link to="/academics" style={{ fontSize: '0.82rem', color: 'var(--primary-700)', fontWeight: 600, textDecoration: 'none' }}>
                Middle School Syllabus Details →
              </Link>
            </div>

            <div className="ed-card ed-card-body">
              <span className="ed-badge ed-badge-warning" style={{ marginBottom: '8px' }}>GRADES 9–12</span>
              <h4>Senior Secondary: Pre-University</h4>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '8px 0' }}>
                Specialized tracks in Pure Sciences, Engineering Core, Commerce & Economics with AI-assisted competitive exam coaching.
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

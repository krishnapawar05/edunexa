import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  BookOpen,
  Award,
  Users,
  CheckCircle,
  FileText,
  X,
  LogIn,
  Sliders,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';

interface PublicSchoolWebsiteProps {
  onGoToLogin: () => void;
  onGoToVerify?: () => void;
}

export const PublicSchoolWebsite: React.FC<PublicSchoolWebsiteProps> = ({ onGoToLogin, onGoToVerify }) => {
  const { branding, setIsCustomizing } = useSchoolBranding();
  const [activeSection, setActiveSection] = useState<'home' | 'about' | 'academics' | 'admissions' | 'faculty' | 'contact'>('home');
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionSubmitted, setAdmissionSubmitted] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    applyingGrade: 'Grade 9',
    parentName: '',
    email: '',
    phone: '',
    city: 'Bangalore',
    prevSchool: '',
  });

  const handleAdmissionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdmissionSubmitted(true);
    setTimeout(() => {
      // simulate receipt
    }, 1500);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#ffffff', color: 'var(--text-primary)' }}>
      {/* Top Notification Bar */}
      <div
        style={{
          backgroundColor: 'var(--ink-900)',
          color: '#cbd5e1',
          padding: '8px var(--space-8)',
          fontSize: '0.78rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} style={{ color: 'var(--primary-500)' }} /> {branding.address}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={12} style={{ color: 'var(--primary-500)' }} /> {branding.contactPhone}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
          <button
            onClick={() => setIsCustomizing(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.74rem',
            }}
          >
            <Sliders size={11} /> Customize School Identity
          </button>
          {onGoToVerify && (
            <button
              onClick={onGoToVerify}
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 'var(--radius-xs)',
                fontSize: '0.74rem',
              }}
            >
              <CheckCircle size={11} /> Verify ID Card
            </button>
          )}
          <span style={{ color: '#93c5fd' }}>Admissions Open for Academic Year 2026–2027</span>
          <button
            onClick={onGoToLogin}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            <LogIn size={12} /> ERP Staff & Student Portal
          </button>
        </div>
      </div>

      {/* Main Website Navigation */}
      <nav
        style={{
          padding: '16px var(--space-8)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#ffffff',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              backgroundColor: branding.primaryAccent,
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.4rem',
            }}
          >
            {branding.monogram}
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {branding.schoolName}
            </div>
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
              {branding.affiliation} • Code: {branding.code}
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
          {[
            { id: 'home', label: 'Home' },
            { id: 'about', label: 'About School' },
            { id: 'academics', label: 'Curriculum' },
            { id: 'faculty', label: 'Faculty' },
            { id: 'contact', label: 'Contact & Campus' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '0.9rem',
                fontWeight: activeSection === item.id ? 700 : 500,
                color: activeSection === item.id ? 'var(--primary-700)' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px 0',
                borderBottom: activeSection === item.id ? '2px solid var(--primary-700)' : '2px solid transparent',
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => setShowAdmissionModal(true)}
            style={{ padding: '8px 18px', fontWeight: 600 }}
          >
            Apply for Admission
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: 'var(--space-12) var(--space-8)',
          position: 'relative',
          overflow: 'hidden',
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(37, 99, 235, 0.15) 0%, transparent 60%)',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-pill)', fontSize: '0.8rem', color: '#93c5fd', marginBottom: 'var(--space-4)' }}>
            <Award size={14} /> National Center of Academic Excellence • Ranked #1 in STEM
          </div>
          <h1
            style={{
              fontSize: '3.2rem',
              fontWeight: 800,
              lineHeight: 1.15,
              maxWidth: '850px',
              color: '#ffffff',
              marginBottom: 'var(--space-5)',
            }}
          >
            Cultivating Intellectual Rigor, Scientific Inquiry, and Global Leadership.
          </h1>
          <p style={{ fontSize: '1.15rem', color: '#94a3b8', maxWidth: '680px', lineHeight: 1.6, marginBottom: 'var(--space-8)' }}>
            Apex Academy blends disciplined academic tradition with state-of-the-art laboratory facilities, personalized AI-assisted tutoring, and comprehensive athletic programs.
          </p>

          <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
            <button
              className="ed-btn ed-btn-primary"
              onClick={() => setShowAdmissionModal(true)}
              style={{ padding: '12px 24px', fontSize: '1rem', fontWeight: 600 }}
            >
              Start Admission Process 2026-27 <ArrowRight size={16} />
            </button>
            <button
              className="ed-btn ed-btn-secondary"
              onClick={onGoToLogin}
              style={{
                padding: '12px 24px',
                fontSize: '1rem',
                backgroundColor: 'rgba(255,255,255,0.05)',
                color: '#ffffff',
                borderColor: 'rgba(255,255,255,0.2)',
              }}
            >
              Parent & Student ERP Login
            </button>
          </div>
        </div>
      </section>

      {/* Key Metric Indicators */}
      <section style={{ borderBottom: '1px solid var(--border-default)', backgroundColor: 'var(--bg-subtle)' }}>
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            padding: 'var(--space-6) 0',
          }}
        >
          {[
            { value: '100%', label: 'Board Pass Rate', sub: 'Last 10 consecutive years' },
            { value: '1:12', label: 'Faculty-Student Ratio', sub: 'Personalized attention' },
            { value: '45+', label: 'Advanced Laboratories', sub: 'Robotics, Biotech, Physics' },
            { value: '18,500', label: 'Alumni Network', sub: 'Across 34 countries' },
          ].map((stat, idx) => (
            <div key={idx} style={{ padding: '0 var(--space-6)', borderRight: idx < 3 ? '1px solid var(--border-default)' : 'none' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '2.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {stat.value}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--primary-700)' }}>{stat.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Academic Highlights & Campus Notices */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: 'var(--space-12) var(--space-4)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)' }}>
          <div>
            <h2 style={{ marginBottom: 'var(--space-2)' }}>Academic Programs & Pathways</h2>
            <p style={{ marginBottom: 'var(--space-6)' }}>
              Structured developmental frameworks calibrated to prepare students for top international universities and competitive examinations.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
              <div className="ed-card ed-card-body">
                <BookOpen size={24} style={{ color: 'var(--primary-600)', marginBottom: 'var(--space-2)' }} />
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Primary & Middle Years</h3>
                <p style={{ fontSize: '0.84rem' }}>
                  Inquiry-based foundational curriculum emphasizing numeracy, scientific experimentation, and bilingual linguistics.
                </p>
              </div>

              <div className="ed-card ed-card-body">
                <GraduationCap size={24} style={{ color: 'var(--primary-600)', marginBottom: 'var(--space-2)' }} />
                <h3 style={{ fontSize: '1.05rem', marginBottom: '6px' }}>Senior Secondary (Grades 11–12)</h3>
                <p style={{ fontSize: '0.84rem' }}>
                  Rigorous specialization tracks in Pure Sciences, Mathematics, Commerce & Economics, and Advanced Humanities.
                </p>
              </div>
            </div>
          </div>

          {/* Dynamic Notice Board */}
          <div className="ed-card" style={{ height: 'fit-content' }}>
            <div className="ed-card-header">
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Official Announcements</span>
              <span className="ed-badge ed-badge-info">Live Ticker</span>
            </div>
            <div className="ed-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ borderLeft: '3px solid var(--primary-600)', paddingLeft: '10px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>OCTOBER 18, 2026</div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>National Science Olympiad Registration Open</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Eligible for Grade 8 through 12 students.</div>
              </div>

              <div style={{ borderLeft: '3px solid var(--warning-solid)', paddingLeft: '10px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>OCTOBER 22, 2026</div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>Half-Yearly Examination Timetable Published</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Available on student and parent ERP dashboards.</div>
              </div>

              <div style={{ borderLeft: '3px solid var(--success-solid)', paddingLeft: '10px' }}>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>NOVEMBER 05, 2026</div>
                <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>Annual Inter-School Robotics Showcase</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Campus Auditorium, Main Block.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Online Admission Application Modal */}
      {showAdmissionModal && (
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
          <div
            className="ed-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: '#ffffff',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.15rem' }}>Online Admission Application</h3>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Academic Session 2026–2027 • Apex Academy</p>
              </div>
              <button
                className="ed-btn-icon"
                onClick={() => {
                  setShowAdmissionModal(false);
                  setAdmissionSubmitted(false);
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body">
              {admissionSubmitted ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
                  <CheckCircle size={48} style={{ color: 'var(--success-solid)', margin: '0 auto var(--space-3)' }} />
                  <h3>Application Submitted Successfully!</h3>
                  <p style={{ marginTop: '8px', fontSize: '0.88rem' }}>
                    Reference Number: <strong style={{ color: 'var(--primary-700)' }}>APP-2026-0842</strong>
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                    An automated acknowledgment has been dispatched to {formData.email || 'your email'}. Our admissions committee will review credentials within 3 business days.
                  </p>
                  <button
                    className="ed-btn ed-btn-primary"
                    style={{ marginTop: 'var(--space-5)' }}
                    onClick={() => {
                      setShowAdmissionModal(false);
                      setAdmissionSubmitted(false);
                    }}
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAdmissionSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    <div className="ed-input-group">
                      <label className="ed-label">Applicant Full Name *</label>
                      <input
                        required
                        className="ed-input"
                        placeholder="e.g. Maya Krishnan"
                        value={formData.studentName}
                        onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
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
                    <div className="ed-input-group">
                      <label className="ed-label">Parent / Guardian Name *</label>
                      <input
                        required
                        className="ed-input"
                        placeholder="e.g. Dr. S. Krishnan"
                        value={formData.parentName}
                        onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      />
                    </div>
                    <div className="ed-input-group">
                      <label className="ed-label">Contact Phone *</label>
                      <input
                        required
                        className="ed-input"
                        placeholder="+91 98450 00000"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="ed-input-group">
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

                  <div className="ed-input-group">
                    <label className="ed-label">Previous Institution Attended</label>
                    <input
                      className="ed-input"
                      placeholder="e.g. St. Xavier High School"
                      value={formData.prevSchool}
                      onChange={(e) => setFormData({ ...formData, prevSchool: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
                    <button
                      type="button"
                      className="ed-btn ed-btn-secondary"
                      onClick={() => setShowAdmissionModal(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="ed-btn ed-btn-primary">
                      Submit Official Application
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ backgroundColor: 'var(--bg-dark-sidebar)', color: '#94a3b8', padding: 'var(--space-10) var(--space-8)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--space-8)' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              EduNexa Powered Portal
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', maxWidth: '400px' }}>
              Apex Academy of Sciences & Arts is administered under the EduNexa multi-tenant school operating system with role-based governance and strict privacy isolation.
            </p>
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Campus Location</div>
            <p style={{ fontSize: '0.82rem', lineHeight: 1.6 }}>
              42 Knowledge Boulevard, Tech Corridor,<br />
              Bangalore, Karnataka 560100<br />
              Tel: +91 (80) 4123-9000
            </p>
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Institutional Portals</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                onClick={onGoToLogin}
                style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem' }}
              >
                Staff ERP Access →
              </button>
              <button
                onClick={onGoToLogin}
                style={{ background: 'transparent', border: 'none', color: '#93c5fd', cursor: 'pointer', textAlign: 'left', fontSize: '0.84rem' }}
              >
                Student & Parent Portal →
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

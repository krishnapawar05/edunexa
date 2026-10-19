import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
  BookOpen,
  Award,
  Users,
  CheckCircle,
  FileText,
  X,
  LogIn,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { SchoolIdentityModal } from '../../components/SchoolIdentityModal.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';
import { coreApi } from '../../services/api.js';

export const PublicLayout: React.FC = () => {
  const { branding, setIsCustomizing } = useSchoolBranding();
  const location = useLocation();
  const navigate = useNavigate();

  const [showAdmissionModal, setShowAdmissionModal] = useState(false);
  const [admissionSubmitted, setAdmissionSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppNo, setSubmittedAppNo] = useState<string>('APP-2026-0842');
  const [admissionError, setAdmissionError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    studentName: '',
    applyingGrade: 'Grade 9',
    parentName: '',
    email: '',
    phone: '',
    city: 'Bangalore',
    prevSchool: '',
  });

  const handleAdmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.studentName.trim() || !formData.email.trim()) return;

    try {
      setIsSubmitting(true);
      setAdmissionError(null);

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

      setSubmittedAppNo(res.applicationNumber || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setAdmissionSubmitted(true);
    } catch (err: any) {
      setAdmissionError(err.message || 'Failed to submit application to admissions desk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const navLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About School' },
    { to: '/principal-message', label: "Principal's Message" },
    { to: '/academics', label: 'Curriculum' },
    { to: '/departments', label: 'Departments' },
    { to: '/admissions', label: 'Admissions' },
    { to: '/faculty', label: 'Faculty' },
    { to: '/events', label: 'Events' },
    { to: '/news', label: 'News' },
    { to: '/gallery', label: 'Gallery' },
    { to: '/examination-info', label: 'Examinations' },
    { to: '/careers', label: 'Careers' },
    { to: '/contact', label: 'Contact' },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Dynamic School Identity Modal */}
      <SchoolIdentityModal />

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
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} style={{ color: 'var(--primary-500)' }} /> {branding.address}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={12} style={{ color: 'var(--primary-500)' }} /> {branding.contactPhone}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={12} style={{ color: 'var(--primary-500)' }} /> admissions@apexacademy.edu
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
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
            <Sliders size={11} /> Customize Identity
          </button>
          <Link
            to="/verify-id"
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.74rem',
            }}
          >
            <CheckCircle size={11} /> Verify ID Card
          </Link>
          <Link
            to="/login"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.76rem',
            }}
          >
            <LogIn size={12} /> ERP Portal Login
          </Link>

          {/* Theme Switcher Toggle */}
          <ThemeSwitcher compact={true} />
        </div>
      </div>

      {/* Main Website Header / Sticky Nav */}
      <nav
        style={{
          padding: '14px var(--space-8)',
          borderBottom: '1px solid var(--border-default)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-surface)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
          boxShadow: 'var(--shadow-xs)',
        }}
      >
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', textDecoration: 'none', color: 'inherit' }}>
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
            <div style={{ fontSize: '1.2rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              {branding.schoolName}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {branding.affiliation} • Code: {branding.code}
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                style={{
                  textDecoration: 'none',
                  fontSize: '0.84rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? 'var(--primary-700)' : 'var(--text-secondary)',
                  padding: '4px 6px',
                  borderBottom: isActive ? '2px solid var(--primary-700)' : '2px solid transparent',
                  transition: 'color 0.15s ease',
                }}
              >
                {link.label}
              </Link>
            );
          })}
          <button
            className="ed-btn ed-btn-primary"
            onClick={() => setShowAdmissionModal(true)}
            style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600, marginLeft: '6px' }}
          >
            Apply for Admission
          </button>
        </div>
      </nav>

      {/* Main Outlet for Current Public Subpage */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

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
          <div className="ed-card ed-modal-container" style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--bg-surface)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="ed-card-header">
              <div>
                <h3 style={{ fontSize: '1.1rem' }}>Online Admission Application 2026–2027</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Apex Academy Institutional Enrollment Desk (Direct PostgreSQL Entry)
                </p>
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
              {admissionError && (
                <div style={{ padding: '8px 12px', marginBottom: '12px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-sm)', color: '#dc2626', fontSize: '0.80rem' }}>
                  {admissionError}
                </div>
              )}

              {admissionSubmitted ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
                  <CheckCircle size={48} style={{ color: 'var(--success-solid)', margin: '0 auto var(--space-3)' }} />
                  <h3>Application Submitted Successfully!</h3>
                  <p style={{ marginTop: '8px', fontSize: '0.88rem' }}>
                    Reference Number: <strong style={{ color: 'var(--primary-700)' }}>{submittedAppNo}</strong>
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
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ed-btn ed-btn-primary"
                    >
                      {isSubmitting ? 'Submitting to Admissions...' : 'Submit Official Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Institutional Footer */}
      <footer style={{ backgroundColor: 'var(--bg-dark-sidebar)', color: '#94a3b8', padding: 'var(--space-10) var(--space-8)', marginTop: 'auto' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 'var(--space-8)' }}>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
              {branding.schoolName}
            </div>
            <p style={{ color: '#94a3b8', fontSize: '0.84rem', maxWidth: '360px', lineHeight: 1.6 }}>
              Affiliated to the Central Board of Secondary Education (CBSE Code {branding.code}). Committed to holistic inquiry, scientific excellence, and ethical leadership.
            </p>
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Academics</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
              <Link to="/academics" style={{ color: '#94a3b8', textDecoration: 'none' }}>Curriculum Standards</Link>
              <Link to="/departments" style={{ color: '#94a3b8', textDecoration: 'none' }}>Research Labs & Depts</Link>
              <Link to="/examination-info" style={{ color: '#94a3b8', textDecoration: 'none' }}>Examination Framework</Link>
              <Link to="/gallery" style={{ color: '#94a3b8', textDecoration: 'none' }}>Campus Showcase</Link>
            </div>
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Community</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
              <Link to="/principal-message" style={{ color: '#94a3b8', textDecoration: 'none' }}>Principal's Message</Link>
              <Link to="/faculty" style={{ color: '#94a3b8', textDecoration: 'none' }}>Faculty Roster</Link>
              <Link to="/events" style={{ color: '#94a3b8', textDecoration: 'none' }}>Events Calendar</Link>
              <Link to="/news" style={{ color: '#94a3b8', textDecoration: 'none' }}>Announcements</Link>
              <Link to="/careers" style={{ color: '#94a3b8', textDecoration: 'none' }}>Career Openings</Link>
            </div>
          </div>
          <div>
            <div style={{ color: '#ffffff', fontWeight: 600, marginBottom: 'var(--space-3)' }}>Institutional Access</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.84rem' }}>
              <Link to="/login" style={{ color: '#93c5fd', textDecoration: 'none' }}>Staff & Faculty ERP →</Link>
              <Link to="/login" style={{ color: '#93c5fd', textDecoration: 'none' }}>Student & Parent Portal →</Link>
              <Link to="/verify-id" style={{ color: '#34d399', textDecoration: 'none' }}>Public ID Card Verifier →</Link>
              <Link to="/contact" style={{ color: '#94a3b8', textDecoration: 'none' }}>Campus Inquiries →</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

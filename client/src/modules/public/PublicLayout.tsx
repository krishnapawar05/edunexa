import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
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
  Menu,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Building,
  Briefcase,
  Image,
  Newspaper,
  Compass,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { SchoolIdentityModal } from '../../components/SchoolIdentityModal.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';
import { coreApi } from '../../services/api.js';

export const PublicLayout: React.FC = () => {
  const { branding, setIsCustomizing } = useSchoolBranding();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
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

  // Close mobile menu and dropdown on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setMoreDropdownOpen(false);
  }, [location.pathname]);

  // Handle escape key and body scroll lock for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (mobileMenuOpen) setMobileMenuOpen(false);
        if (moreDropdownOpen) setMoreDropdownOpen(false);
        if (showAdmissionModal) setShowAdmissionModal(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, moreDropdownOpen, showAdmissionModal]);

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

  // Primary navigation links for desktop navbar
  const primaryNavLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About School' },
    { to: '/academics', label: 'Curriculum' },
    { to: '/admissions', label: 'Admissions' },
    { to: '/faculty', label: 'Faculty' },
    { to: '/examination-info', label: 'Examinations' },
    { to: '/contact', label: 'Contact' },
  ];

  // Secondary links for "More" dropdown
  const secondaryNavLinks = [
    { to: '/principal-message', label: "Principal's Message", icon: Award },
    { to: '/departments', label: 'Departments & Labs', icon: Building },
    { to: '/events', label: 'Campus Events', icon: Calendar },
    { to: '/news', label: 'Announcements & News', icon: Newspaper },
    { to: '/gallery', label: 'Campus Photo Gallery', icon: Image },
    { to: '/careers', label: 'Career Opportunities', icon: Briefcase },
  ];

  // All 13 navigation links for mobile drawer
  const allNavLinks = [
    { to: '/', label: 'Home', icon: Compass },
    { to: '/about', label: 'About School', icon: Building },
    { to: '/principal-message', label: "Principal's Message", icon: Award },
    { to: '/academics', label: 'Curriculum Standards', icon: BookOpen },
    { to: '/departments', label: 'Departments & Labs', icon: Building },
    { to: '/admissions', label: 'Admissions & Eligibility', icon: GraduationCap },
    { to: '/faculty', label: 'Faculty Directory', icon: Users },
    { to: '/events', label: 'Campus Events', icon: Calendar },
    { to: '/news', label: 'News & Notices', icon: Newspaper },
    { to: '/gallery', label: 'Campus Gallery', icon: Image },
    { to: '/examination-info', label: 'Examination Framework', icon: FileText },
    { to: '/careers', label: 'Career Opportunities', icon: Briefcase },
    { to: '/contact', label: 'Contact & Inquiries', icon: Phone },
  ];

  const isSecondaryActive = secondaryNavLinks.some((link) => location.pathname === link.to);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-app)', color: 'var(--text-primary)' }}>
      {/* Dynamic School Identity Modal */}
      <SchoolIdentityModal />

      {/* Top Notification / Utility Bar (Desktop only, hides on <= 768px) */}
      <header className="ed-public-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} style={{ color: 'var(--primary-400)' }} /> {branding.address}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Phone size={12} style={{ color: 'var(--primary-400)' }} /> {branding.contactPhone}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Mail size={12} style={{ color: 'var(--primary-400)' }} /> admissions@apexacademy.edu
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            onClick={() => setIsCustomizing(true)}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              color: '#38bdf8',
              display: 'inline-flex',
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
              background: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#34d399',
              display: 'inline-flex',
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
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.76rem',
              marginLeft: '4px',
            }}
          >
            <LogIn size={12} /> ERP Portal Login
          </Link>

          <div style={{ marginLeft: '4px' }}>
            <ThemeSwitcher compact={true} />
          </div>
        </div>
      </header>

      {/* Main Responsive Sticky Navbar */}
      <nav className="ed-public-navbar" aria-label="Main Navigation">
        <div className="ed-public-navbar-inner">
          {/* School Branding */}
          <Link to="/" className="ed-public-brand" aria-label={`${branding.schoolName} Home`}>
            <div
              className="ed-public-brand-logo"
              style={{ backgroundColor: branding.primaryAccent }}
            >
              {branding.monogram}
            </div>
            <div className="ed-public-brand-text">
              <span className="ed-public-brand-title">{branding.schoolName}</span>
              <span className="ed-public-brand-subtitle">
                {branding.affiliation} • Code: {branding.code}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links (>= 1024px) */}
          <div className="ed-nav-desktop">
            {primaryNavLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`ed-nav-link ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* "More" Dropdown for Secondary Links */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                className={`ed-nav-link ${isSecondaryActive ? 'active' : ''}`}
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  border: 'none',
                  background: isSecondaryActive ? 'var(--primary-50)' : 'transparent',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
                aria-expanded={moreDropdownOpen}
                aria-haspopup="true"
              >
                More <ChevronDown size={14} style={{ transform: moreDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} />
              </button>

              {moreDropdownOpen && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 45 }}
                    onClick={() => setMoreDropdownOpen(false)}
                  />
                  <div
                    className="ed-card ed-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 6px)',
                      right: 0,
                      minWidth: '220px',
                      borderRadius: 'var(--radius-md)',
                      padding: '6px',
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {secondaryNavLinks.map((subLink) => {
                      const SubIcon = subLink.icon;
                      const isSubActive = location.pathname === subLink.to;
                      return (
                        <Link
                          key={subLink.to}
                          to={subLink.to}
                          onClick={() => setMoreDropdownOpen(false)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '8px 12px',
                            fontSize: '0.84rem',
                            fontWeight: isSubActive ? 700 : 500,
                            color: isSubActive ? 'var(--primary-700)' : 'var(--text-primary)',
                            backgroundColor: isSubActive ? 'var(--primary-50)' : 'transparent',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                          }}
                        >
                          <SubIcon size={14} style={{ color: 'var(--primary-600)' }} />
                          {subLink.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Admission Action CTA */}
            <button
              className="ed-btn ed-btn-primary"
              onClick={() => setShowAdmissionModal(true)}
              style={{
                padding: '7px 16px',
                fontSize: '0.84rem',
                fontWeight: 600,
                marginLeft: '8px',
              }}
            >
              Apply for Admission
            </button>
          </div>

          {/* Mobile Header Controls (< 1024px) */}
          <div className="ed-nav-mobile-controls">
            <ThemeSwitcher compact={true} />

            <button
              type="button"
              className="ed-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="ed-mobile-navigation-drawer"
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Accessible Mobile Navigation Drawer (< 1024px) */}
      <div
        className={`ed-drawer-overlay ${mobileMenuOpen ? 'open' : ''}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="ed-mobile-navigation-drawer"
        className={`ed-drawer-panel ${mobileMenuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Campus Mobile Navigation"
      >
        {/* Drawer Header */}
        <div className="ed-drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              className="ed-public-brand-logo"
              style={{ width: '32px', height: '32px', fontSize: '1rem', backgroundColor: branding.primaryAccent }}
            >
              {branding.monogram}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', lineHeight: 1.2 }}>{branding.schoolName}</div>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>CBSE Code: {branding.code}</div>
            </div>
          </div>
          <button
            type="button"
            className="ed-btn-icon"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Navigation Menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="ed-drawer-body">
          {/* Primary Action Button */}
          <button
            type="button"
            className="ed-btn ed-btn-primary"
            style={{ width: '100%', padding: '10px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}
            onClick={() => {
              setMobileMenuOpen(false);
              setShowAdmissionModal(true);
            }}
          >
            Apply for Admission 2026–2027
          </button>

          <div className="ed-drawer-section-title">Institutional Navigation</div>
          {allNavLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`ed-drawer-link ${isActive ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Icon size={16} style={{ color: isActive ? 'var(--primary-700)' : 'var(--text-muted)' }} />
                  {link.label}
                </span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              </Link>
            );
          })}

          <div className="ed-drawer-section-title">Access & Portals</div>
          <Link
            to="/login"
            className="ed-drawer-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LogIn size={16} style={{ color: 'var(--primary-600)' }} />
              ERP Portal Login
            </span>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          </Link>

          <Link
            to="/verify-id"
            className="ed-drawer-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle size={16} style={{ color: 'var(--success-solid)' }} />
              Verify Student ID Card
            </span>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          </Link>

          <button
            type="button"
            className="ed-drawer-link"
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
            onClick={() => {
              setMobileMenuOpen(false);
              setIsCustomizing(true);
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Sliders size={16} style={{ color: '#0284c7' }} />
              Customize School Identity
            </span>
            <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
          </button>
        </div>

        {/* Drawer Footer with Essential Contact Info */}
        <div className="ed-drawer-footer">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>{branding.address}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>{branding.contactPhone}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} style={{ color: 'var(--primary-600)', flexShrink: 0 }} />
              <span>admissions@apexacademy.edu</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main Outlet for Current Public Subpage */}
      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      {/* Online Admission Application Modal (Responsive) */}
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
          role="dialog"
          aria-modal="true"
          aria-label="Online Admission Application"
        >
          <div
            className="ed-card ed-modal-container"
            style={{
              width: '100%',
              maxWidth: '540px',
              backgroundColor: 'var(--bg-surface)',
              maxHeight: '92vh',
              overflowY: 'auto',
            }}
          >
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
                aria-label="Close Admission Dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="ed-card-body">
              {admissionError && (
                <div
                  style={{
                    padding: '8px 12px',
                    marginBottom: '12px',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: 'var(--radius-sm)',
                    color: '#dc2626',
                    fontSize: '0.80rem',
                  }}
                >
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
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
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
                  <div className="ed-modal-grid-2">
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

                  <div className="ed-modal-grid-2" style={{ marginTop: '10px' }}>
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

                  <div className="ed-input-group" style={{ marginTop: '10px' }}>
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

                  <div className="ed-input-group" style={{ marginTop: '10px' }}>
                    <label className="ed-label">Previous Institution Attended</label>
                    <input
                      className="ed-input"
                      placeholder="e.g. St. Xavier High School"
                      value={formData.prevSchool}
                      onChange={(e) => setFormData({ ...formData, prevSchool: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-5)' }}>
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

      {/* Official Institutional Footer (Responsive) */}
      <footer style={{ backgroundColor: 'var(--bg-dark-sidebar)', color: '#94a3b8', padding: 'clamp(2.5rem, 5vw, 3.5rem) 0', marginTop: 'auto' }}>
        <div className="ed-public-container">
          <div className="ed-footer-columns">
            <div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginBottom: '8px' }}>
                {branding.schoolName}
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', maxWidth: '360px', lineHeight: 1.6, marginBottom: '12px' }}>
                Affiliated to the Central Board of Secondary Education (CBSE Affiliation Code {branding.code}). Committed to academic rigor, scientific inquiry, and ethical leadership.
              </p>
              <div style={{ fontSize: '0.76rem', color: '#64748b' }}>
                © {new Date().getFullYear()} {branding.schoolName}. All rights reserved.
              </div>
            </div>

            <div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem', marginBottom: 'var(--space-3)' }}>Academics</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <Link to="/academics" style={{ color: '#94a3b8', textDecoration: 'none' }}>Curriculum Standards</Link>
                <Link to="/departments" style={{ color: '#94a3b8', textDecoration: 'none' }}>Research Labs & Depts</Link>
                <Link to="/examination-info" style={{ color: '#94a3b8', textDecoration: 'none' }}>Examination Framework</Link>
                <Link to="/gallery" style={{ color: '#94a3b8', textDecoration: 'none' }}>Campus Showcase</Link>
              </div>
            </div>

            <div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem', marginBottom: 'var(--space-3)' }}>Community</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <Link to="/principal-message" style={{ color: '#94a3b8', textDecoration: 'none' }}>Principal's Message</Link>
                <Link to="/faculty" style={{ color: '#94a3b8', textDecoration: 'none' }}>Faculty Roster</Link>
                <Link to="/events" style={{ color: '#94a3b8', textDecoration: 'none' }}>Events Calendar</Link>
                <Link to="/news" style={{ color: '#94a3b8', textDecoration: 'none' }}>Announcements</Link>
                <Link to="/careers" style={{ color: '#94a3b8', textDecoration: 'none' }}>Career Openings</Link>
              </div>
            </div>

            <div>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '0.92rem', marginBottom: 'var(--space-3)' }}>Institutional Access</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem' }}>
                <Link to="/login" style={{ color: '#93c5fd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Staff & Faculty ERP →
                </Link>
                <Link to="/login" style={{ color: '#93c5fd', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Student & Parent Portal →
                </Link>
                <Link to="/verify-id" style={{ color: '#34d399', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Public ID Card Verifier →
                </Link>
                <Link to="/contact" style={{ color: '#94a3b8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  Campus Inquiries →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
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
  Menu,
  ChevronDown,
  ChevronRight,
  Building,
  Briefcase,
  Image,
  Newspaper,
  Compass,
  GraduationCap,
  Sparkles,
  PhoneCall,
  Send,
  ExternalLink,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';
import { coreApi, marketingApi } from '../../services/api.js';
import { AdmissionEnquiryModal } from '../../components/AdmissionEnquiryModal.js';
import { ChatbotWidget } from '../../components/ChatbotWidget.js';
import { CallbackRequestModal } from '../../components/CallbackRequestModal.js';
import { captureAndStoreUtmParams, trackGa4Event } from '../../utils/utmTracker.js';

export const PublicLayout: React.FC = () => {
  const { branding } = useSchoolBranding();
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
    city: 'New Delhi',
    prevSchool: '',
  });

  // Section 14 Marketing & SEO states
  const [showCallbackModal, setShowCallbackModal] = useState(false);
  const [activeBanners, setActiveBanners] = useState<any[]>([]);
  const [dismissedBannerIds, setDismissedBannerIds] = useState<string[]>([]);
  const [marketingConfig, setMarketingConfig] = useState<any>(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterMsg, setNewsletterMsg] = useState<string | null>(null);

  // 1. Capture UTM parameters from URL
  useEffect(() => {
    captureAndStoreUtmParams();
  }, [location.pathname, location.search]);

  // Listen for global callback request triggers from landing page sections
  useEffect(() => {
    const handleOpenCallback = () => setShowCallbackModal(true);
    window.addEventListener('edunexa:open-callback-modal', handleOpenCallback);
    return () => window.removeEventListener('edunexa:open-callback-modal', handleOpenCallback);
  }, []);

  // 2. Fetch SEO Metadata & Schema.org JSON-LD dynamically per route
  useEffect(() => {
    marketingApi
      .getPageSeo(location.pathname)
      .then((res) => {
        if (res?.data) {
          const seo = res.data;
          document.title = seo.pageTitle || `${branding.schoolName} - Excellence in Education`;

          // Update description
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', seo.metaDescription || '');

          // Update canonical URL
          let canonical = document.querySelector('link[rel="canonical"]');
          if (!canonical && seo.canonicalUrl) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
          }
          if (canonical && seo.canonicalUrl) {
            canonical.setAttribute('href', seo.canonicalUrl);
          }

          // OpenGraph tags
          const ogMap: Record<string, string | undefined> = {
            'og:title': seo.ogTitle || seo.pageTitle,
            'og:description': seo.ogDescription || seo.metaDescription,
            'og:image': seo.ogImage || branding.logoUrl,
            'og:url': window.location.href,
          };
          Object.entries(ogMap).forEach(([prop, val]) => {
            if (val) {
              let el = document.querySelector(`meta[property="${prop}"]`);
              if (!el) {
                el = document.createElement('meta');
                el.setAttribute('property', prop);
                document.head.appendChild(el);
              }
              el.setAttribute('content', val);
            }
          });
        }
      })
      .catch((err) => console.debug('Page SEO fetch skipped', err));

    // Structured Data JSON-LD
    marketingApi
      .getSchemaMarkup()
      .then((res) => {
        if (res?.data) {
          let scriptEl = document.getElementById('school-schema-ld');
          if (!scriptEl) {
            scriptEl = document.createElement('script');
            scriptEl.id = 'school-schema-ld';
            scriptEl.setAttribute('type', 'application/ld+json');
            document.head.appendChild(scriptEl);
          }
          scriptEl.textContent = JSON.stringify(res.data);
        }
      })
      .catch((err) => console.debug('Schema LD skipped', err));
  }, [location.pathname, branding.schoolName, branding.logoUrl]);

  // 3. Fetch Active Marketing Banners & Integrations Config
  useEffect(() => {
    marketingApi
      .listPublicBanners()
      .then((banners) => {
        if (Array.isArray(banners)) setActiveBanners(banners);
      })
      .catch(() => {});

    marketingApi
      .getMarketingConfig()
      .then((res) => {
        if (res?.data) setMarketingConfig(res.data);
      })
      .catch(() => {});
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      setNewsletterMsg('Please provide a valid email address.');
      return;
    }
    setNewsletterLoading(true);
    setNewsletterMsg(null);
    try {
      await marketingApi.subscribeNewsletter(newsletterEmail);
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      trackGa4Event('subscribe_newsletter', { source: 'FOOTER' });
    } catch (err: any) {
      setNewsletterMsg(err.message || 'Unable to subscribe. Please try again.');
    } finally {
      setNewsletterLoading(false);
    }
  };

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
    const studentName = formData.studentName.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!studentName) {
      setAdmissionError('Please provide the applicant student full name.');
      return;
    }
    if (!email || !email.includes('@')) {
      setAdmissionError('Please provide a valid parent/guardian email address.');
      return;
    }
    if (!phone || phone.length < 8) {
      setAdmissionError('Please provide a valid contact telephone number.');
      return;
    }

    try {
      setIsSubmitting(true);
      setAdmissionError(null);

      const parts = studentName.split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || 'Applicant';

      const res = await coreApi.submitPublicAdmission({
        schoolIdentifier: 'apex-academy',
        studentFirstName: firstName,
        studentLastName: lastName,
        firstName,
        lastName,
        applyingClass: formData.applyingGrade,
        applyingGrade: formData.applyingGrade,
        guardianName: formData.parentName.trim() || 'Parent / Guardian',
        parentName: formData.parentName.trim() || 'Parent / Guardian',
        guardianEmail: email,
        email,
        guardianPhone: phone,
        phone,
        previousSchool: formData.prevSchool.trim() || undefined,
        residentialAddress: 'Bangalore Campus Applicant',
      });

      setSubmittedAppNo(res.data?.applicationNumber || res.applicationNumber || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      setAdmissionSubmitted(true);
    } catch (err: any) {
      setAdmissionError(err.message || 'Failed to submit application to admissions desk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Primary navigation links based on classic CBSE institutional hierarchy (St. Joseph's style)
  const primaryNavLinks = [
    { to: '/', label: 'Home' },
    { to: '/about', label: 'About Us' },
    { to: '/academics', label: 'Academics' },
    { to: '/admissions', label: 'Admission' },
    { to: '/faculty', label: 'Faculty' },
    { to: '/examination-info', label: 'Examinations' },
    { to: '/contact', label: 'Contact' },
  ];

  // Secondary links for "More" dropdown
  const secondaryNavLinks = [
    { to: '/blog', label: 'School Blog & Hub', icon: BookOpen },
    { to: '/principal-message', label: "Principal's Desk", icon: Award },
    { to: '/departments', label: 'Laboratories & Depts', icon: Building },
    { to: '/events', label: 'School Events', icon: Sparkles },
    { to: '/news', label: 'Notices & Circulars', icon: Newspaper },
    { to: '/gallery', label: 'Photo Gallery', icon: Image },
    { to: '/careers', label: 'Career Opportunities', icon: Briefcase },
  ];

  // All navigation links for mobile drawer
  const allNavLinks = [
    { to: '/', label: 'Home', icon: Compass },
    { to: '/about', label: 'About School & Story', icon: Building },
    { to: '/blog', label: 'School Blog & Knowledge Hub', icon: BookOpen },
    { to: '/principal-message', label: "Principal's Desk", icon: Award },
    { to: '/academics', label: 'Academics & Curriculum', icon: BookOpen },
    { to: '/departments', label: 'Laboratories & Depts', icon: Building },
    { to: '/admissions', label: 'Admission & Guidelines', icon: GraduationCap },
    { to: '/faculty', label: 'Faculty Directory', icon: Users },
    { to: '/events', label: 'School Events & Sports', icon: Sparkles },
    { to: '/news', label: 'Notices & Circulars', icon: Newspaper },
    { to: '/gallery', label: 'Campus Photo Gallery', icon: Image },
    { to: '/examination-info', label: 'Examination Standards', icon: FileText },
    { to: '/careers', label: 'Careers & Recruitment', icon: Briefcase },
    { to: '/contact', label: 'Contact & Campus Map', icon: Phone },
  ];

  const isSecondaryActive = secondaryNavLinks.some((link) => location.pathname === link.to);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--academic-warm-white)', color: 'var(--text-primary)' }}>
      {/* Dynamic Admission Open / Promotional Marketing Banner */}
      {activeBanners
        .filter((b) => b.isPublished && !dismissedBannerIds.includes(b.id) && b.displayPosition === 'TOP_BAR')
        .slice(0, 1)
        .map((banner) => (
          <div
            key={banner.id}
            className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-600 text-slate-950 px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-md relative z-30"
          >
            <div className="max-w-6xl mx-auto flex items-center justify-center gap-3 flex-wrap text-center w-full">
              <span className="px-2 py-0.5 bg-black/15 rounded text-[11px] font-black uppercase tracking-wider">
                {banner.bannerType.replace('_', ' ')}
              </span>
              <span className="font-bold">{banner.title}</span>
              {banner.description && <span className="opacity-90 hidden md:inline">— {banner.description}</span>}
              {banner.ctaLink && (
                <Link
                  to={banner.ctaLink}
                  onClick={() => trackGa4Event('banner_click', { banner_title: banner.title, banner_id: banner.id })}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-slate-950 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition"
                >
                  {banner.ctaText || 'Learn More'} <ArrowRight size={12} />
                </Link>
              )}
            </div>
            <button
              onClick={() => setDismissedBannerIds((prev) => [...prev, banner.id])}
              className="p-1 hover:bg-black/10 rounded text-slate-900 transition shrink-0"
              title="Dismiss announcement"
            >
              <X size={14} />
            </button>
          </div>
        ))}

      {/* Top Contact Strip (Deep Forest Green with Gold Accent Border) */}
      <header className="ed-public-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <MapPin size={12} style={{ color: 'var(--academic-gold-500)' }} /> {branding.address}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Phone size={12} style={{ color: 'var(--academic-gold-500)' }} /> {branding.contactPhone}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Mail size={12} style={{ color: 'var(--academic-gold-500)' }} /> admissions@apexacademy.edu
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          {/* Quick Callback Trigger */}
          <button
            type="button"
            onClick={() => setShowCallbackModal(true)}
            className="ed-btn-academic-callback-gold"
            title="Request an instant callback from admissions counsellors"
          >
            <PhoneCall size={12} />
            <span>Request Callback</span>
          </button>

          <Link
            to="/verify-id"
            style={{
              background: 'rgba(196, 164, 107, 0.15)',
              border: '1px solid var(--academic-gold-500)',
              color: 'var(--academic-gold-100)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              textDecoration: 'none',
              fontWeight: 600,
              padding: '2px 9px',
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
              gap: '5px',
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: '0.76rem',
              marginLeft: '4px',
            }}
          >
            <LogIn size={12} style={{ color: 'var(--academic-gold-500)' }} /> Portal Login
          </Link>

          <div style={{ marginLeft: '4px' }}>
            <ThemeSwitcher compact={true} />
          </div>
        </div>
      </header>

      {/* Main Responsive Sticky Navbar (White / Ivory with Forest Green Branding) */}
      <nav className="ed-public-navbar" aria-label="Main Navigation">
        <div className="ed-public-navbar-inner">
          {/* Institutional School Branding */}
          <Link to="/" className="ed-public-brand" aria-label={`${branding.schoolName} Home`}>
            <div
              className="ed-public-brand-logo"
              style={{ backgroundColor: branding.primaryAccent || '#14532d' }}
            >
              {branding.monogram}
            </div>
            <div className="ed-public-brand-text">
              <span className="ed-public-brand-title">{branding.schoolName}</span>
              <span className="ed-public-brand-subtitle">
                {branding.affiliation || 'Affiliated to CBSE, New Delhi'} • Code: {branding.code}
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
                  background: isSecondaryActive ? 'var(--bg-subtle)' : 'transparent',
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
                      minWidth: '230px',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px',
                      zIndex: 50,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      border: '1px solid var(--border-default)',
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
                            gap: '10px',
                            padding: '9px 12px',
                            fontSize: '0.84rem',
                            fontWeight: isSubActive ? 700 : 500,
                            color: isSubActive ? 'var(--color-primary)' : 'var(--text-primary)',
                            backgroundColor: isSubActive ? 'var(--bg-subtle)' : 'transparent',
                            borderRadius: 'var(--radius-xs)',
                            textDecoration: 'none',
                          }}
                        >
                          <SubIcon size={14} style={{ color: isSubActive ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                          {subLink.label}
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Traditional Gold / Forest Admission Action CTA */}
            <button
              className="ed-btn-academic-gold"
              onClick={() => setShowAdmissionModal(true)}
              style={{
                padding: '8px 18px',
                fontSize: '0.84rem',
                marginLeft: '8px',
                cursor: 'pointer',
              }}
            >
              Online Admission
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
              style={{ width: '34px', height: '34px', fontSize: '1.1rem', backgroundColor: branding.primaryAccent || '#14532d' }}
            >
              {branding.monogram}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.94rem', lineHeight: 1.2, color: '#ffffff' }}>{branding.schoolName}</div>
              <div style={{ fontSize: '0.70rem', color: '#a7f3d0' }}>CBSE Code: {branding.code}</div>
            </div>
          </div>
          <button
            type="button"
            className="ed-btn-icon"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close Navigation Menu"
            style={{ color: '#ffffff' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="ed-drawer-body">
          {/* Primary Action Button */}
          <button
            type="button"
            className="ed-btn-academic-gold"
            style={{ width: '100%', padding: '11px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px', justifyContent: 'center' }}
            onClick={() => {
              setMobileMenuOpen(false);
              setShowAdmissionModal(true);
            }}
          >
            Online Admission 2026–2027
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
                  <Icon size={16} style={{ color: isActive ? 'var(--color-primary)' : 'var(--text-muted)' }} />
                  {link.label}
                </span>
                <ChevronRight size={14} style={{ color: 'var(--text-muted)', opacity: 0.6 }} />
              </Link>
            );
          })}

          <div className="ed-drawer-section-title">Institutional Portals</div>
          <Link
            to="/login"
            className="ed-drawer-link"
            onClick={() => setMobileMenuOpen(false)}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <LogIn size={16} style={{ color: 'var(--color-primary)' }} />
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
        </div>

        {/* Drawer Footer with Essential Contact Info */}
        <div className="ed-drawer-footer">
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MapPin size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{branding.address}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>{branding.contactPhone}</span>
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
              <span>admissions@apexacademy.edu</span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main Outlet for Current Public Subpage */}
      <main style={{ flex: 1 }}>
        <Outlet context={{ setShowCallbackModal, openCallbackModal: () => setShowCallbackModal(true) }} />
      </main>

      {/* Online Admission Application Modal (Responsive) */}
      {showAdmissionModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(10, 38, 24, 0.72)',
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
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="ed-card-header" style={{ backgroundColor: 'var(--bg-subtle)' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)' }}>Online Admission Application 2026–2027</h3>
                <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  Institutional Enrollment Desk • Direct System Verification
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
                    backgroundColor: 'var(--danger-bg)',
                    border: '1px solid var(--danger-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--danger-text)',
                    fontSize: '0.80rem',
                  }}
                >
                  {admissionError}
                </div>
              )}

              {admissionSubmitted ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-6) 0' }}>
                  <CheckCircle size={48} style={{ color: 'var(--success-solid)', margin: '0 auto var(--space-3)' }} />
                  <h3 style={{ color: 'var(--text-primary)' }}>Application Submitted Successfully!</h3>
                  <p style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                    Reference Tracking Number: <strong style={{ color: 'var(--color-primary)' }}>{submittedAppNo}</strong>
                  </p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
                    An automated acknowledgment has been dispatched to {formData.email || 'your email'}. Our admissions committee will review credentials within 3 business days.
                  </p>
                  <button
                    className="ed-btn-academic-forest"
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
                        <option>Nursery / Kindergarten</option>
                        <option>Grade 1</option>
                        <option>Grade 2</option>
                        <option>Grade 3</option>
                        <option>Grade 4</option>
                        <option>Grade 5</option>
                        <option>Grade 6</option>
                        <option>Grade 7</option>
                        <option>Grade 8</option>
                        <option>Grade 9</option>
                        <option>Grade 10</option>
                        <option>Grade 11 - Science</option>
                        <option>Grade 11 - Commerce</option>
                        <option>Grade 12</option>
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
                    <label className="ed-label">Previous School Attended</label>
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
                      className="ed-btn-academic-forest"
                    >
                      {isSubmitting ? 'Submitting Application...' : 'Submit Official Application'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Official Institutional Footer (St. Joseph's Inspiration - Forest Green) */}
      <footer className="ed-academic-footer">
        {/* Newsletter & Marketing Bar (Section 14) */}
        <div className="ed-footer-newsletter-wrap">
          <div className="ed-public-container">
            <div className="ed-footer-newsletter-card">
              <div className="ed-footer-newsletter-info">
                <h3 className="ed-footer-newsletter-title">
                  <Mail className="w-5 h-5" style={{ color: '#f59e0b' }} />
                  <span>Subscribe to School Newsletter & Updates</span>
                </h3>
                <p className="ed-footer-newsletter-desc">
                  Receive academic circulars, exam notifications, and parenting insights directly in your inbox.
                </p>
              </div>

              {newsletterSubscribed ? (
                <div className="ed-footer-newsletter-success">
                  <CheckCircle size={16} style={{ color: '#34d399' }} />
                  <span>Thank you for subscribing!</span>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="ed-footer-newsletter-form">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email address..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="ed-footer-newsletter-input"
                  />
                  <button
                    type="submit"
                    disabled={newsletterLoading}
                    className="ed-footer-newsletter-btn"
                  >
                    {newsletterLoading ? '...' : (
                      <>
                        <Send size={13} />
                        <span>Subscribe</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
            {newsletterMsg && (
              <p style={{ fontSize: '0.82rem', color: '#fde68a', textAlign: 'center', marginTop: '0.65rem' }}>
                {newsletterMsg}
              </p>
            )}
            <div className="ed-footer-divider" />
          </div>
        </div>

        <div className="ed-public-container">
          <div className="ed-footer-columns">
            {/* School Profile Column */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div
                  className="ed-public-brand-logo"
                  style={{ width: '38px', height: '38px', fontSize: '1.2rem', backgroundColor: branding.primaryAccent || '#14532d' }}
                >
                  {branding.monogram}
                </div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-crest)' }}>
                  {branding.schoolName}
                </div>
              </div>
              <p style={{ color: '#cbd5e1', fontSize: '0.84rem', maxWidth: '360px', lineHeight: 1.65, marginBottom: '14px' }}>
                A premier co-educational institution committed to academic excellence, discipline, scientific inquiry, and moral character. Affiliated to CBSE, New Delhi (Affiliation Code: {branding.code}).
              </p>

              {/* Social Channels from Marketing Config */}
              {marketingConfig && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  {marketingConfig.facebookUrl && (
                    <a href={marketingConfig.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1' }} title="Facebook">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {marketingConfig.instagramUrl && (
                    <a href={marketingConfig.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1' }} title="Instagram">
                      <ExternalLink size={14} />
                    </a>
                  )}
                  {marketingConfig.youtubeUrl && (
                    <a href={marketingConfig.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#cbd5e1' }} title="YouTube">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              )}

              <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                © {new Date().getFullYear()} {branding.schoolName}. All institutional rights reserved.
              </div>
            </div>

            {/* Quick Links Column */}
            <div>
              <div style={{ color: 'var(--academic-gold-500)', fontWeight: 700, fontSize: '0.90rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-3)' }}>
                About School
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/about" className="ed-academic-footer-link">Our Heritage & Story</Link>
                <Link to="/blog" className="ed-academic-footer-link">School Blog & Knowledge Hub</Link>
                <Link to="/principal-message" className="ed-academic-footer-link">Principal's Desk</Link>
                <Link to="/faculty" className="ed-academic-footer-link">Faculty & Mentors</Link>
                <Link to="/gallery" className="ed-academic-footer-link">Campus Facilities</Link>
                <Link to="/careers" className="ed-academic-footer-link">Career Opportunities</Link>
              </div>
            </div>

            {/* Academics & Student Welfare */}
            <div>
              <div style={{ color: 'var(--academic-gold-500)', fontWeight: 700, fontSize: '0.90rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-3)' }}>
                Academics
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/academics" className="ed-academic-footer-link">CBSE Curriculum Standards</Link>
                <Link to="/departments" className="ed-academic-footer-link">Science & Robotics Labs</Link>
                <Link to="/examination-info" className="ed-academic-footer-link">Examination Framework</Link>
                <Link to="/events" className="ed-academic-footer-link">Activities & Sports</Link>
                <Link to="/news" className="ed-academic-footer-link">Circulars & Notices</Link>
              </div>
            </div>

            {/* Contact & Portals */}
            <div>
              <div style={{ color: 'var(--academic-gold-500)', fontWeight: 700, fontSize: '0.90rem', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-3)' }}>
                Contact & Portals
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ color: '#cbd5e1', fontSize: '0.84rem' }}>
                  {branding.address}
                </span>
                <span style={{ color: '#cbd5e1', fontSize: '0.84rem' }}>
                  Phone: {branding.contactPhone}
                </span>
                <button
                  type="button"
                  onClick={() => setShowCallbackModal(true)}
                  style={{
                    background: 'rgba(196, 164, 107, 0.14)',
                    border: '1px solid rgba(196, 164, 107, 0.45)',
                    color: 'var(--academic-gold-100, #fef9c3)',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm, 6px)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    width: 'fit-content',
                    transition: 'all 0.2s ease',
                    marginTop: '4px',
                    marginBottom: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(196, 164, 107, 0.24)';
                    e.currentTarget.style.borderColor = 'var(--academic-gold-500, #c4a46b)';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(196, 164, 107, 0.14)';
                    e.currentTarget.style.borderColor = 'rgba(196, 164, 107, 0.45)';
                    e.currentTarget.style.color = 'var(--academic-gold-100, #fef9c3)';
                  }}
                >
                  <PhoneCall size={13} style={{ color: 'var(--academic-gold-400, #dfc08a)' }} />
                  <span>Request an Admissions Callback</span>
                  <ArrowRight size={13} style={{ opacity: 0.8 }} />
                </button>
                <Link to="/login" style={{ color: 'var(--academic-gold-500)', fontWeight: 600, fontSize: '0.84rem', textDecoration: 'none', marginTop: '4px' }}>
                  Staff & Student ERP Portal →
                </Link>
                <Link to="/verify-id" style={{ color: 'var(--academic-gold-500)', fontWeight: 600, fontSize: '0.84rem', textDecoration: 'none' }}>
                  Verify Student ID Card →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Dynamic Admission Enquiry Popup Modal */}
      <AdmissionEnquiryModal />

      {/* Quick Callback Request Modal (Section 14) */}
      <CallbackRequestModal
        isOpen={showCallbackModal}
        onClose={() => setShowCallbackModal(false)}
        schoolName={branding.schoolName}
      />

      {/* Floating Public AI Chatbot & WhatsApp Integration */}
      <ChatbotWidget schoolIdentifier={branding?.schoolName} />
    </div>
  );
};

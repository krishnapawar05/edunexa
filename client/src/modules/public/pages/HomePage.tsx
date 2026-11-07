import React, { useState, useEffect } from 'react';
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
  Building,
  HeartHandshake,
  Compass,
  Laptop,
  Library,
  FlaskConical,
  Bus,
  Activity,
  Dumbbell,
  Palette,
  Trophy,
  Smile,
  Check,
  Clock,
  Phone,
  PhoneCall,
  Bell,
  Calendar,
  Download,
  Mail,
  MapPin,
  ExternalLink,
  Star,
  FileText,
  Play,
  Video,
  ChevronRight,
} from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';
import { websiteApi } from '../../../services/api.js';
import { PublicWebsiteData } from '@edunexa/shared';

export const HomePage: React.FC = () => {
  const { branding, websiteData: contextData, loadingWebsiteData } = useSchoolBranding();

  const [data, setData] = useState<PublicWebsiteData | null>(contextData);
  const [loading, setLoading] = useState<boolean>(!contextData);

  useEffect(() => {
    if (contextData) {
      setData(contextData);
      setLoading(false);
      return;
    }

    let isMounted = true;
    const fetchWebsiteData = async () => {
      try {
        setLoading(true);
        const res = await websiteApi.getPublicData();
        if (isMounted && res.success && res.data) {
          setData(res.data);
        }
      } catch (err) {
        console.warn('Failed to load public website content:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchWebsiteData();
    return () => {
      isMounted = false;
    };
  }, [contextData]);

  const content = data?.content || {};
  const highlights = data?.highlights?.filter((h: any) => h.isPublished) || [];
  const facilities = data?.facilities?.filter((f: any) => f.isPublished) || [];
  const academicPrograms = data?.academicPrograms || [];
  const faculty = data?.faculty || [];
  const achievements = data?.achievements?.filter((a: any) => a.isPublished) || [];
  const testimonials = data?.testimonials?.filter((t: any) => t.isPublished) || [];
  const latestNotices = data?.latestNotices || [];
  const upcomingEvents = data?.upcomingEvents || [];
  const galleryPhotos = data?.galleryPreview?.photos || [];
  const galleryVideos = data?.galleryPreview?.videos || [];
  const downloadableDocs = data?.downloadableDocs?.filter((d: any) => d.isPublished) || [];

  return (
    <div>
      {/* =========================================================================
          SECTION 1: HERO BANNER (Full-Bleed Photographic Atmosphere & Primary CTAs)
          ========================================================================= */}
      <section className="ed-hero-photo-banner" aria-label="Welcome Banner">
        <img
          src={content.heroImageUrl || '/images/school/hero_classroom.jpg'}
          alt={`${branding.schoolName} Active Classroom in Session`}
          className="ed-hero-bg-image"
          loading="eager"
        />

        <div className="ed-hero-overlay" />

        <div className="ed-public-container">
          <div className="ed-hero-photo-content">
            <div className="ed-hero-eyebrow-badge">
              <Award size={15} style={{ color: 'var(--academic-gold-500)' }} />
              <span>{content.heroEyebrowBadge || `Welcome to ${branding.schoolName}`}</span>
            </div>

            <h1 className="ed-hero-photo-title">
              {content.heroTitle || 'Where Learning Inspires Every Possibility'}
            </h1>

            <p className="ed-hero-photo-desc">
              {content.heroSubtitle ||
                `We nurture curious minds, encourage creativity, and help students build the knowledge and confidence to shape their future. Affiliated to CBSE, New Delhi (Code: ${branding.code}).`}
            </p>

            <div className="ed-hero-photo-actions">
              <Link to={content.heroCtaLink || '/admissions'} className="ed-btn-academic-gold">
                <span>{content.heroCtaText || 'Admissions Open 2026–2027'}</span>
                <ArrowRight size={17} />
              </Link>

              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('edunexa:open-callback-modal'))}
                className="ed-btn-academic-forest"
                style={{
                  cursor: 'pointer',
                  border: '1px solid rgba(196, 164, 107, 0.65)',
                  backgroundColor: 'rgba(14, 42, 34, 0.85)',
                  backdropFilter: 'blur(4px)',
                }}
                title="Schedule an admissions callback"
              >
                <PhoneCall size={16} style={{ color: 'var(--academic-gold-400, #dfc08a)' }} />
                <span>Request Callback</span>
              </button>

              <Link to="/about" className="ed-btn-academic-forest">
                <span>{content.heroSecondaryCtaText || 'Explore Our School'}</span>
              </Link>

              <Link
                to="/verify-id"
                style={{
                  color: '#fef08a',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                  padding: '8px 12px',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                <ShieldCheck size={16} style={{ color: 'var(--academic-gold-500)' }} />
                <span>Verify Student ID</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: ABOUT THE SCHOOL ("OUR STORY & HERITAGE")
          ========================================================================= */}
      <section className="ed-section-white">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Institutional Profile</span>
            <h2 className="ed-section-title">{content.aboutTitle || 'Let Us Tell You Our Story'}</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              {content.aboutSubtitle ||
                'Founded on the belief that education is the bedrock of character, scientific inquiry, and societal welfare.'}
            </p>
          </div>

          <div className="ed-story-grid">
            <div className="ed-photo-frame" style={{ height: '360px' }}>
              <img
                src={content.aboutImageUrl || '/images/school/campus_building.jpg'}
                alt={`${branding.schoolName} Campus Exterior`}
                loading="lazy"
              />
              <div className="ed-photo-caption-tag">
                Main Academic Complex • Est. {branding.establishedYear || '1998'}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Compass size={24} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.28rem', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-crest)' }}>
                  A Tradition of Care, Rigor & Moral Purpose
                </h3>
              </div>

              {content.aboutStory ? (
                <div style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '20px' }}>
                  {content.aboutStory.split('\n\n').map((para: string, idx: number) => (
                    <p key={idx} style={{ marginBottom: '12px' }}>
                      {para}
                    </p>
                  ))}
                </div>
              ) : (
                <>
                  <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '14px' }}>
                    Established with a vision to deliver authentic, values-centered education, <strong>{branding.schoolName}</strong> stands as a sanctuary of disciplined learning and personal transformation. Drawing inspiration from dedicated educators and social pioneers, our campus creates an environment where young scholars flourish in character, intellect, and empathy.
                  </p>
                  <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '20px' }}>
                    From our foundational primary classrooms to pre-university senior secondary tracks, we uphold the Central Board of Secondary Education curriculum with structured formative assessments, modern laboratories, and individualized pastoral guidance.
                  </p>
                </>
              )}

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <Link to="/about" className="ed-btn-academic-forest" style={{ padding: '9px 20px', fontSize: '0.88rem' }}>
                  Read Complete Heritage →
                </Link>
                <Link to="/academics" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                  Explore Curriculum Standards →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: PRINCIPAL'S DESK & WELCOME MESSAGE
          ========================================================================= */}
      <section className="ed-section-warm">
        <div className="ed-public-container">
          <div className="ed-responsive-split">
            <div
              className="ed-card"
              style={{
                padding: 'var(--space-6)',
                textAlign: 'center',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div
                style={{
                  width: '104px',
                  height: '104px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-subtle)',
                  color: 'var(--color-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-3)',
                  fontWeight: 800,
                  fontSize: '2.2rem',
                  border: '2px solid var(--color-accent)',
                  fontFamily: 'var(--font-crest)',
                }}
              >
                {content.principalName
                  ? content.principalName
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)
                  : 'AT'}
              </div>

              <h3 style={{ fontSize: '1.22rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {content.principalName || 'Dr. Alistair Thorne'}
              </h3>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                {content.principalTitle || 'Principal & Head of Faculty'}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                {content.principalQualification || 'Ph.D. in Applied Physics • 24 Years Academic Leadership'}
              </p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Link to="/principal-message" className="ed-btn-academic-forest" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
                  Read Principal's Message →
                </Link>
              </div>
            </div>

            <div>
              <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                From the Principal's Desk
              </div>
              <h2 style={{ fontFamily: 'var(--font-crest)', fontSize: 'clamp(1.4rem, 2.8vw, 1.95rem)', color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 'var(--space-4)' }}>
                "Education must awaken moral clarity as purposefully as intellectual skill."
              </h2>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
                {content.principalMessageExcerpt ||
                  `At ${branding.schoolName}, we consider each child a sacred trust. Our calling goes beyond preparing scholars for examinations; we guide them to cultivate sincere discipline, thoughtful observation, moral strength, and a spirit of service.`}
              </p>
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-5)' }}>
                We welcome parents to visit our campus, observe our classrooms, and join us in partnership for the holistic formation of our young scholars.
              </p>

              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>100%</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>CBSE Board Pass Rate</div>
                </div>
                <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>1:14</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Teacher-Student Ratio</div>
                </div>
                <div style={{ padding: '10px 16px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-default)' }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>64+</div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Experienced Educators</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: WHY CHOOSE OUR SCHOOL (INSTITUTIONAL PILLARS / HIGHLIGHTS)
          ========================================================================= */}
      <section className="ed-section-white">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Institutional Strengths</span>
            <h2 className="ed-section-title">Why Choose {branding.schoolName}?</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              Core commitments that make our learning community a trusted choice for parents and students.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {highlights.map((pillar: any, idx: number) => (
              <div key={pillar.id || idx} className="ed-why-choose-item">
                <div className="ed-why-choose-check">
                  <Check size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {pillar.title}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {pillar.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: ACADEMIC CURRICULUM WINGS & PROGRAMS
          ========================================================================= */}
      <section className="ed-section-warm">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Curriculum Progression</span>
            <h2 className="ed-section-title">Academic Wings & Stages</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              Structured developmental curriculum stages from foundational primary play to pre-university senior secondary tracks.
            </p>
          </div>

          <div className="ed-responsive-3col">
            {academicPrograms.map((prog: any, idx: number) => (
              <div key={idx} className="ed-facility-photo-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                <span className="ed-facility-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-primary)', borderColor: 'var(--border-default)', alignSelf: 'flex-start' }}>
                  {prog.gradeRange}
                </span>
                <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: '12px', marginBottom: '8px' }}>
                  {prog.title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px', flex: 1 }}>
                  {prog.description}
                </p>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  <strong>Curriculum:</strong> {prog.curriculum}
                </div>
                <Link to="/academics" style={{ fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none' }}>
                  View Syllabus & Tracks →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: CAMPUS INFRASTRUCTURE & FACILITIES
          ========================================================================= */}
      <section className="ed-section-white">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Campus Infrastructure</span>
            <h2 className="ed-section-title">World-Class Facilities</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              Equipped with purposeful learning facilities that support intellectual discovery, athletic fitness, and student wellbeing.
            </p>
          </div>

          <div className="ed-responsive-3col">
            {facilities.slice(0, 6).map((fac: any, idx: number) => (
              <div key={fac.id || idx} className="ed-facility-photo-card">
                <div className="ed-facility-photo-thumb">
                  <img
                    src={fac.imageUrl || '/images/school/hero_classroom.jpg'}
                    alt={fac.name}
                    loading="lazy"
                  />
                  <span className="ed-facility-photo-badge">
                    {fac.category}
                  </span>
                </div>

                <div className="ed-facility-photo-body">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <Building size={18} style={{ color: 'var(--color-primary)' }} />
                    <h4 style={{ fontSize: '1.08rem', color: 'var(--text-primary)', margin: 0 }}>
                      {fac.name}
                    </h4>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginTop: '4px' }}>
                    {fac.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/gallery" className="ed-btn-academic-forest">
              <span>View All Campus Facilities & Gallery →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 7 & 8: SMART CLASSROOMS, STEM LABORATORIES & ATHLETICS
          ========================================================================= */}
      <section className="ed-section-warm">
        <div className="ed-public-container">
          <div className="ed-responsive-split">
            {/* STEM & Classrooms */}
            <div className="ed-card ed-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Laptop size={22} style={{ color: 'var(--color-primary)' }} />
                <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>STEM & DIGITAL INNOVATION</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-crest)', marginBottom: '8px' }}>
                {content.stemHeadline || 'Interactive Smart Classrooms & High-Tech Labs'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                {content.stemDescription ||
                  'Equipped with multi-touch interactive digital panels, high-precision science apparatus, and computational workstations to foster experiential reasoning and scientific mastery.'}
              </p>
              <div style={{ height: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <img
                  src="/images/school/science_lab.jpg"
                  alt="Science Lab"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
            </div>

            {/* Athletics & Extracurriculars */}
            <div className="ed-card ed-card-body">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <Dumbbell size={22} style={{ color: 'var(--academic-gold-500)' }} />
                <span className="ed-badge ed-badge-neutral" style={{ fontSize: '0.72rem' }}>ATHLETICS & PERFORMING ARTS</span>
              </div>
              <h3 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-crest)', marginBottom: '8px' }}>
                {content.athleticsHeadline || 'Comprehensive Sports, Track & Fine Arts'}
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
                {content.athleticsDescription ||
                  'An all-weather 400m synthetic running track, turf football pitch, indoor badminton courts, and fine arts studio ensure every scholar discovers and hones their passions.'}
              </p>
              <div style={{ height: '180px', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                <img
                  src="/images/school/sports_ground.jpg"
                  alt="Sports Ground"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: FACULTY & TEACHING STAFF HIGHLIGHTS
          ========================================================================= */}
      {faculty.length > 0 && (
        <section className="ed-section-white">
          <div className="ed-public-container">
            <div className="ed-section-heading">
              <span className="ed-section-eyebrow">Academic Mentors</span>
              <h2 className="ed-section-title">Distinguished Teaching Faculty</h2>
              <div className="ed-section-rule" />
              <p className="ed-section-subtitle">
                Passionate educators with postgraduate credentials, dedicated to individualized student growth and cognitive inquiry.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
              {faculty.slice(0, 4).map((f: any) => (
                <div key={f.id} className="ed-card" style={{ padding: '1.25rem', textAlign: 'center' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      margin: '0 auto 12px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--bg-subtle)',
                      border: '2px solid var(--border-default)',
                    }}
                  >
                    <img
                      src={f.photoUrl || '/images/school/hero_classroom.jpg'}
                      alt={f.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>{f.name}</h4>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '2px' }}>
                    {f.designation}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>{f.qualification}</div>
                </div>
              ))}
            </div>

            <div style={{ textAlign: 'center', marginTop: '2rem' }}>
              <Link to="/faculty" style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                Meet Full Academic Faculty & Mentors →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 10: STUDENT HONORS & ACHIEVEMENTS
          ========================================================================= */}
      {achievements.length > 0 && (
        <section className="ed-section-warm">
          <div className="ed-public-container">
            <div className="ed-section-heading">
              <span className="ed-section-eyebrow">Excellence in Action</span>
              <h2 className="ed-section-title">Student Honors & Achievements</h2>
              <div className="ed-section-rule" />
              <p className="ed-section-subtitle">
                Celebrating exceptional student performance in national Olympiads, science fairs, sports leagues, and cultural contests.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
              {achievements.map((ach: any) => (
                <div key={ach.id} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span className="ed-badge ed-badge-info" style={{ fontSize: '0.72rem' }}>
                      {ach.academicYear}
                    </span>
                    <Trophy size={16} style={{ color: 'var(--academic-gold-500)' }} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', margin: '0 0 4px', color: 'var(--text-primary)' }}>{ach.title}</h4>
                  <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '6px' }}>
                    {ach.studentName} {ach.competition ? `• ${ach.competition}` : ''}
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    {ach.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 11 & 12: LATEST NOTICES & UPCOMING EVENTS (PostgreSQL-Driven)
          ========================================================================= */}
      {(latestNotices.length > 0 || upcomingEvents.length > 0) && (
        <section className="ed-section-white">
          <div className="ed-public-container">
            <div className="ed-section-heading">
              <span className="ed-section-eyebrow">Institutional Updates</span>
              <h2 className="ed-section-title">Notices & Campus Calendar</h2>
              <div className="ed-section-rule" />
              <p className="ed-section-subtitle">
                Official circulars, parent notices, and upcoming academic events live from the {branding.schoolName} administration desk.
              </p>
            </div>

            <div className="ed-responsive-split">
              {/* Official Notices */}
              <div className="ed-card ed-card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Bell size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontFamily: 'var(--font-crest)' }}>Official Circulars</h3>
                  </div>
                  <Link to="/news" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                    All Circulars →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {latestNotices.map((n: any) => (
                    <div key={n.id} style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`ed-badge ${n.priority === 'URGENT' ? 'ed-badge-danger' : 'ed-badge-neutral'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {n.priority}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{n.publishedAt}</span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {n.title}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {n.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming Events */}
              <div className="ed-card ed-card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={20} style={{ color: 'var(--color-primary)' }} />
                    <h3 style={{ fontSize: '1.05rem', margin: 0, fontFamily: 'var(--font-crest)' }}>Campus Events Calendar</h3>
                  </div>
                  <Link to="/events" style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>
                    Full Calendar →
                  </Link>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {upcomingEvents.map((ev: any) => (
                    <div key={ev.id} style={{ borderBottom: '1px solid var(--border-default)', paddingBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className="ed-badge ed-badge-info" style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {ev.category || 'School Event'}
                        </span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {ev.description}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 13: PARENT TESTIMONIALS & COMMUNITY ENDORSEMENTS
          ========================================================================= */}
      {testimonials.length > 0 && (
        <section className="ed-section-warm">
          <div className="ed-public-container">
            <div className="ed-section-heading">
              <span className="ed-section-eyebrow">Parent Voices</span>
              <h2 className="ed-section-title">What Our Parents Say</h2>
              <div className="ed-section-rule" />
              <p className="ed-section-subtitle">
                Hear from parents about the holistic transformation, moral culture, and academic growth experienced by their children.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
              {testimonials.map((t: any) => (
                <div key={t.id} className="ed-card ed-card-body" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', color: 'var(--academic-gold-500)', fontSize: '0.95rem', marginBottom: '8px' }}>
                      {'★'.repeat(t.rating || 5)}
                    </div>
                    <p style={{ fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.65, margin: '0 0 12px' }}>
                      "{t.content}"
                    </p>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{t.parentName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.studentRelation}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 14: PHOTO & VIDEO GALLERY PREVIEW
          ========================================================================= */}
      <section className="ed-section-white">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Life at {branding.schoolName}</span>
            <h2 className="ed-section-title">Campus Photography & Video Moments</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              From morning assemblies and athletic track meets to fine arts exhibitions and science discoveries.
            </p>
          </div>

          <div className="ed-activity-gallery-grid">
            {galleryPhotos.slice(0, 4).map((p: any) => (
              <Link to="/gallery" key={p.id} className="ed-gallery-card">
                <img
                  src={p.thumbnailUrl || p.mediaUrl || '/images/school/hero_classroom.jpg'}
                  alt={p.title}
                  loading="lazy"
                />
                <div className="ed-gallery-card-overlay">
                  <span className="ed-gallery-tag">Photo Album</span>
                  <h4 className="ed-gallery-title">{p.title}</h4>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
            <Link to="/gallery" className="ed-btn-academic-gold">
              <span>Explore Complete Photo & Video Gallery →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 15: ADMISSIONS OPEN NOTICE & CALLOUT
          ========================================================================= */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0', backgroundColor: 'var(--academic-warm-white)' }}>
        <div className="ed-public-container">
          <div className="ed-admissions-banner">
            <div>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--academic-gold-500)', fontWeight: 700, marginBottom: '6px' }}>
                Enrolling for Academic Session {content.admissionSession || '2026–2027'}
              </div>
              <h2 style={{ fontFamily: 'var(--font-crest)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#ffffff', marginBottom: '8px' }}>
                {content.admissionNoticeTitle || `Join the ${branding.schoolName} Family`}
              </h2>
              <p style={{ fontSize: '0.94rem', color: '#cbd5e1', maxWidth: '580px', lineHeight: 1.6 }}>
                {content.admissionNoticeDesc ||
                  'Applications are open for Pre-Primary through Grade 11. Complete our transparent online application or schedule an orientation visit with our admissions committee.'}
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <Link to="/admissions" className="ed-btn-academic-gold">
                <span>Start Online Application</span>
                <ArrowRight size={16} />
              </Link>
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent('edunexa:open-callback-modal'))}
                className="ed-btn-academic-callback"
                style={{ cursor: 'pointer' }}
                title="Schedule an admissions callback"
              >
                <PhoneCall size={16} style={{ color: 'var(--academic-gold-400, #dfc08a)' }} />
                <span>Request Admissions Callback</span>
              </button>
              <Link to="/contact" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 22px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.94rem' }}>
                Campus Inquiries
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 16: DOWNLOAD ADMISSION FORMS & PROSPECTUS
          ========================================================================= */}
      {downloadableDocs.length > 0 && (
        <section className="ed-section-white">
          <div className="ed-public-container">
            <div className="ed-section-heading">
              <span className="ed-section-eyebrow">Official Resources</span>
              <h2 className="ed-section-title">Download Admission Documents & Circulars</h2>
              <div className="ed-section-rule" />
              <p className="ed-section-subtitle">
                Download printable PDF application forms, prospectus, academic curriculum guides, and fee schedules.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              {downloadableDocs.map((doc: any) => (
                <div key={doc.id} className="ed-card ed-card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-subtle)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={22} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--text-primary)' }}>{doc.title}</div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {doc.fileType} • {doc.fileSize}
                      </div>
                    </div>
                  </div>

                  <a
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="ed-btn-academic-forest"
                    style={{ padding: '6px 14px', fontSize: '0.8rem', flexShrink: 0, textDecoration: 'none' }}
                  >
                    <Download size={13} style={{ marginRight: '4px' }} />
                    <span>Download</span>
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* =========================================================================
          SECTION 17: CONTACT INFORMATION & CAMPUS LOCATION
          ========================================================================= */}
      <section className="ed-section-warm" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Connect With Us</span>
            <h2 className="ed-section-title">Visit Our Campus & Inquiries</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              We welcome prospective families for campus tours and admissions counseling during official institutional hours.
            </p>
          </div>

          <div className="ed-responsive-split">
            {/* Contact Details Card */}
            <div className="ed-card ed-card-body">
              <h3 style={{ fontSize: '1.15rem', marginBottom: 'var(--space-4)', fontFamily: 'var(--font-crest)' }}>
                Campus Contact Information
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <MapPin size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Campus Address</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {branding.address}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Phone size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Admissions Helpline</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {branding.contactPhone}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Mail size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Inquiry Email</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      {branding.contactEmail}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <Clock size={20} style={{ color: 'var(--color-primary)', flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>Campus Visiting Hours</div>
                    <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                      Monday – Saturday: 8:00 AM – 4:00 PM
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '20px' }}>
                <Link to="/contact" className="ed-btn-academic-forest" style={{ width: '100%', textAlign: 'center', display: 'block', textDecoration: 'none' }}>
                  Send an Inquiry Message →
                </Link>
              </div>
            </div>

            {/* Interactive Campus Map View */}
            <div className="ed-card" style={{ overflow: 'hidden', height: '100%', minHeight: '320px', position: 'relative' }}>
              <iframe
                title="School Campus Location Map"
                src="https://maps.google.com/maps?q=Sector%2014,%20Institutional%20Area,%20New%20Delhi&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '320px' }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

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
} from 'lucide-react';
import { useSchoolBranding } from '../../../context/SchoolBrandingContext.js';

export const HomePage: React.FC = () => {
  const { branding } = useSchoolBranding();

  // Realistic Image-Led Facilities inspired by St. Joseph's Public School
  const facilitiesWithPhotos = [
    {
      title: 'Smart Classrooms',
      badge: 'Interactive Learning',
      image: '/images/school/hero_classroom.jpg',
      icon: Laptop,
      desc: 'Digital audiovisual projection suites and modern ergonomic desks encouraging interactive group inquiry.',
    },
    {
      title: 'Central Library',
      badge: 'Academic Resource',
      image: '/images/school/library.jpg',
      icon: Library,
      desc: 'Vast collection of curriculum reference volumes, periodicals, literature, and quiet study alcoves.',
    },
    {
      title: 'Science Laboratories',
      badge: 'Practical Inquiry',
      image: '/images/school/science_lab.jpg',
      icon: FlaskConical,
      desc: 'Specialized physics, chemistry, and biology experimental stations with safety and analytical equipment.',
    },
    {
      title: 'Computer Workstations',
      badge: 'Technology Skills',
      image: '/images/school/computer_lab.jpg',
      icon: BookOpen,
      desc: 'High-speed networked computing laboratories dedicated to algorithmic thinking and digital literacy.',
    },
    {
      title: 'Sports Fields & Athletics',
      badge: 'Physical Wellness',
      image: '/images/school/sports_ground.jpg',
      icon: Dumbbell,
      desc: 'Sprawling grass sports grounds, cricket pitches, and athletic tracks fostering teamwork and endurance.',
    },
    {
      title: 'Regulated Transport Fleet',
      badge: 'Commute Services',
      image: '/images/school/school_bus.jpg',
      icon: Bus,
      desc: 'Dedicated institutional bus network serving regional routes with verified drivers and student escorts.',
    },
  ];

  // Activities & Co-Curricular Photo Gallery
  const activityGallery = [
    {
      title: 'Morning Campus Assembly',
      tag: 'Discipline & Prayer',
      image: '/images/school/school_assembly.jpg',
      desc: 'Unified student morning assembly instilling patriotic values, moral thought, and institutional spirit.',
    },
    {
      title: 'Athletic Sports & Box Leagues',
      tag: 'Sports & Teamwork',
      image: '/images/school/sports_ground.jpg',
      desc: 'Competitive sports meets, football tournaments, and track championships.',
    },
    {
      title: 'Creative Art & Studio Craft',
      tag: 'Fine Arts Studio',
      image: '/images/school/cultural_arts.jpg',
      desc: 'Expressive painting, pottery, and sketching workshops cultivating aesthetic excellence.',
    },
    {
      title: 'Interactive Classroom Debates',
      tag: 'Scholastic Life',
      image: '/images/school/hero_classroom.jpg',
      desc: 'Socratic discussions and science demonstrations encouraging every student to speak and think critically.',
    },
  ];

  // Why Choose Us Pillars inspired by St. Joseph's Public School
  const whyChooseUsPillars = [
    {
      title: 'Dedicated & Qualified Faculty',
      desc: 'Experienced educators with postgraduate and doctoral credentials, committed to pastoral care and personal mentoring.',
    },
    {
      title: 'Values-Based Education & Discipline',
      desc: 'Balancing CBSE benchmarked academics with timeless moral principles, civic responsibility, and mutual respect.',
    },
    {
      title: 'Safe, Green & Nurturing Campus',
      desc: 'A secure, serene, and clean environment where each student feels valued, safe, heard, and inspired.',
    },
    {
      title: 'Holistic 360-Degree Growth',
      desc: 'Active integration of co-curricular athletics, performing arts, and scientific inquiry alongside textbook studies.',
    },
    {
      title: 'Verifiable Digital Credentials',
      desc: 'Official anti-tamper student ID verification with cryptographic QR tokens for child safety and institutional transparency.',
    },
    {
      title: 'Active Parent-Teacher Partnership',
      desc: 'Dedicated portal communication, transparent academic evaluations, and responsive administrative desks.',
    },
  ];

  return (
    <div>
      {/* =========================================================================
          SECTION 1 & 2: PHOTOGRAPHIC HERO BANNER (Full-Bleed Classroom Atmosphere)
          ========================================================================= */}
      <section className="ed-hero-photo-banner" aria-label="Welcome Banner">
        {/* Realistic High-Resolution Classroom Photo */}
        <img
          src="/images/school/hero_classroom.jpg"
          alt={`${branding.schoolName} Active Classroom in Session`}
          className="ed-hero-bg-image"
          loading="eager"
        />

        {/* Soft Contrast Gradient Overlay */}
        <div className="ed-hero-overlay" />

        <div className="ed-public-container">
          <div className="ed-hero-photo-content">
            <div className="ed-hero-eyebrow-badge">
              <Award size={15} style={{ color: 'var(--academic-gold-500)' }} />
              <span>Welcome to {branding.schoolName}</span>
            </div>

            <h1 className="ed-hero-photo-title">
              Where Learning Inspires Every Possibility
            </h1>

            <p className="ed-hero-photo-desc">
              We nurture curious minds, encourage creativity, and help students build the knowledge and confidence to shape their future. Affiliated to CBSE, New Delhi (Code: {branding.code}).
            </p>

            <div className="ed-hero-photo-actions">
              <Link to="/admissions" className="ed-btn-academic-gold">
                <span>Admissions Open 2026–2027</span>
                <ArrowRight size={17} />
              </Link>

              <Link to="/about" className="ed-btn-academic-forest">
                <span>Explore Our School</span>
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
          SECTION 3: ABOUT OUR SCHOOL / "LET US TELL YOU OUR STORY"
          Two-column composition with realistic campus building photograph
          ========================================================================= */}
      <section className="ed-section-white">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">About Our School</span>
            <h2 className="ed-section-title">Let Us Tell You Our Story</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              Founded on the belief that education is the bedrock of character, scientific inquiry, and societal welfare.
            </p>
          </div>

          <div className="ed-story-grid">
            {/* Real Campus Photograph Frame */}
            <div className="ed-photo-frame" style={{ height: '360px' }}>
              <img
                src="/images/school/campus_building.jpg"
                alt={`${branding.schoolName} Campus Building Exterior`}
                loading="lazy"
              />
              <div className="ed-photo-caption-tag">
                Main Academic Complex • Est. {branding.establishedYear || '1998'}
              </div>
            </div>

            {/* Authentic School Story Narrative */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Compass size={24} style={{ color: 'var(--color-primary)' }} />
                <h3 style={{ fontSize: '1.28rem', color: 'var(--text-primary)', margin: 0, fontFamily: 'var(--font-crest)' }}>
                  A Tradition of Care, Rigor & Moral Purpose
                </h3>
              </div>

              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '14px' }}>
                Established with a vision to deliver authentic, values-centered education, <strong>{branding.schoolName}</strong> stands as a sanctuary of disciplined learning and personal transformation. Drawing inspiration from dedicated educators and social pioneers, our campus creates an environment where young scholars flourish in character, intellect, and empathy.
              </p>

              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: '20px' }}>
                From our foundational kindergarten classrooms to pre-university senior secondary tracks, we uphold the Central Board of Secondary Education curriculum with structured formative assessments, modern laboratories, and individualized pastoral guidance.
              </p>

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
          SECTION 4: CAMPUS FACILITIES (Realistic Image-Led Grid)
          ========================================================================= */}
      <section className="ed-section-warm">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Campus Infrastructure</span>
            <h2 className="ed-section-title">Our School Facilities</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              Equipped with purposeful learning facilities that support intellectual discovery, athletic fitness, and student wellbeing.
            </p>
          </div>

          <div className="ed-responsive-3col">
            {facilitiesWithPhotos.map((fac, idx) => {
              const FacIcon = fac.icon;
              return (
                <div key={idx} className="ed-facility-photo-card">
                  {/* Real Facility Photograph */}
                  <div className="ed-facility-photo-thumb">
                    <img
                      src={fac.image}
                      alt={fac.title}
                      loading="lazy"
                    />
                    <span className="ed-facility-photo-badge">
                      {fac.badge}
                    </span>
                  </div>

                  <div className="ed-facility-photo-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <FacIcon size={18} style={{ color: 'var(--color-primary)' }} />
                      <h4 style={{ fontSize: '1.08rem', color: 'var(--text-primary)', margin: 0 }}>
                        {fac.title}
                      </h4>
                    </div>
                    <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, flex: 1, marginTop: '4px' }}>
                      {fac.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: WHY CHOOSE US (Institutional Strengths)
          ========================================================================= */}
      <section className="ed-section-white">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Institutional Strengths</span>
            <h2 className="ed-section-title">Why Choose {branding.schoolName}?</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              Six core commitments that make our learning community a trusted choice for parents and students.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {whyChooseUsPillars.map((pillar, idx) => (
              <div key={idx} className="ed-why-choose-item">
                <div className="ed-why-choose-check">
                  <Check size={16} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {pillar.title}
                  </h4>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                    {pillar.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: PRINCIPAL'S WELCOME DESK
          ========================================================================= */}
      <section className="ed-section-warm">
        <div className="ed-public-container">
          <div className="ed-responsive-split">
            {/* Principal Profile Box */}
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
                AT
              </div>
              <h3 style={{ fontSize: '1.22rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Dr. Alistair Thorne
              </h3>
              <div style={{ fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                Principal & Head of Faculty
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                Ph.D. in Applied Physics • 24 Years Academic Leadership
              </p>
              <div style={{ marginTop: 'var(--space-4)' }}>
                <Link to="/principal-message" className="ed-btn-academic-forest" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
                  Read Principal's Message →
                </Link>
              </div>
            </div>

            {/* Welcome Message Column */}
            <div>
              <div style={{ color: 'var(--color-primary)', fontWeight: 700, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>
                From the Principal's Desk
              </div>
              <h2 style={{ fontFamily: 'var(--font-crest)', fontSize: 'clamp(1.4rem, 2.8vw, 1.95rem)', color: 'var(--text-primary)', lineHeight: 1.25, marginBottom: 'var(--space-4)' }}>
                "Education must awaken moral clarity as purposefully as intellectual skill."
              </h2>
              <p style={{ fontSize: '0.94rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 'var(--space-4)' }}>
                At {branding.schoolName}, we consider each child a sacred trust. Our calling goes beyond preparing scholars for examinations; we guide them to cultivate sincere discipline, thoughtful observation, moral strength, and a spirit of service.
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
          SECTION 7: ACADEMIC STAGES & CURRICULUM
          ========================================================================= */}
      <section className="ed-section-white">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Academic Progression</span>
            <h2 className="ed-section-title">Academic Wings & Curriculum Stages</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              Seamless curriculum progression from foundational early-childhood activity up to pre-university senior secondary excellence.
            </p>
          </div>

          <div className="ed-responsive-3col">
            {/* Primary Wing */}
            <div className="ed-facility-photo-card" style={{ padding: '1.5rem' }}>
              <span className="ed-facility-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-primary)', borderColor: 'var(--border-default)', alignSelf: 'flex-start' }}>
                GRADES 1–5
              </span>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: '12px', marginBottom: '8px' }}>
                Primary Wing: Foundations
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                Interactive phonics, foundational mathematics, environmental observation, bilingual literacy, and cooperative social play.
              </p>
              <Link to="/academics" style={{ fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', marginTop: 'auto' }}>
                View Primary Syllabus →
              </Link>
            </div>

            {/* Middle Wing */}
            <div className="ed-facility-photo-card" style={{ padding: '1.5rem' }}>
              <span className="ed-facility-badge" style={{ backgroundColor: 'rgba(196, 164, 107, 0.15)', color: 'var(--color-accent)', borderColor: 'var(--color-accent)', alignSelf: 'flex-start' }}>
                GRADES 6–8
              </span>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: '12px', marginBottom: '8px' }}>
                Middle Wing: Discovery
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                Laboratory-driven introduction to physics, chemistry, biology, geometry, historical inquiry, and introductory computational logic.
              </p>
              <Link to="/academics" style={{ fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', marginTop: 'auto' }}>
                View Middle Wing Syllabus →
              </Link>
            </div>

            {/* Senior Secondary Wing */}
            <div className="ed-facility-photo-card" style={{ padding: '1.5rem' }}>
              <span className="ed-facility-badge" style={{ backgroundColor: 'var(--bg-subtle)', color: 'var(--color-primary)', borderColor: 'var(--border-default)', alignSelf: 'flex-start' }}>
                GRADES 9–12
              </span>
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-primary)', marginTop: '12px', marginBottom: '8px' }}>
                Senior Wing: Pre-University
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                Specialized academic tracks in Pure Science (Physics, Chem, Math, Bio) and Commerce with career counseling and exam mentoring.
              </p>
              <Link to="/academics" style={{ fontSize: '0.84rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'none', marginTop: 'auto' }}>
                View Senior Secondary Tracks →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 8: SCHOOL ACTIVITIES & VISUAL GALLERY
          Photographic showcase of assemblies, sports, arts, and classrooms
          ========================================================================= */}
      <section className="ed-section-warm">
        <div className="ed-public-container">
          <div className="ed-section-heading">
            <span className="ed-section-eyebrow">Life at {branding.schoolName}</span>
            <h2 className="ed-section-title">Co-Curricular & Campus Activities</h2>
            <div className="ed-section-rule" />
            <p className="ed-section-subtitle">
              From morning assemblies and competitive sports to fine arts and science inquiry — a vibrant campus life.
            </p>
          </div>

          <div className="ed-activity-gallery-grid">
            {activityGallery.map((item, idx) => (
              <div key={idx} className="ed-gallery-card">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                />
                <div className="ed-gallery-card-overlay">
                  <span className="ed-gallery-tag">{item.tag}</span>
                  <h4 className="ed-gallery-title">{item.title}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 9: ADMISSIONS CALLOUT BANNER
          ========================================================================= */}
      <section style={{ padding: 'clamp(2.5rem, 5vw, 4rem) 0', backgroundColor: 'var(--academic-warm-white)' }}>
        <div className="ed-public-container">
          <div className="ed-admissions-banner">
            <div>
              <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--academic-gold-500)', fontWeight: 700, marginBottom: '6px' }}>
                Enrolling for Academic Session 2026–2027
              </div>
              <h2 style={{ fontFamily: 'var(--font-crest)', fontSize: 'clamp(1.5rem, 3vw, 2.2rem)', color: '#ffffff', marginBottom: '8px' }}>
                Join the {branding.schoolName} Family
              </h2>
              <p style={{ fontSize: '0.94rem', color: '#cbd5e1', maxWidth: '580px', lineHeight: 1.6 }}>
                Applications are open for Pre-Primary through Grade 11. Complete our transparent online application or schedule an orientation visit with our admissions committee.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/admissions" className="ed-btn-academic-gold">
                <span>Start Online Application</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/contact" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff', border: '1px solid rgba(255,255,255,0.3)', padding: '12px 22px', borderRadius: 'var(--radius-sm)', textDecoration: 'none', fontWeight: 600, fontSize: '0.94rem' }}>
                Campus Inquiries
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

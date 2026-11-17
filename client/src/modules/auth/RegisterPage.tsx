import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  School,
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Users,
  Award,
  Hash,
  Globe,
  User,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { AuthLayout, AuthHeader, AuthFooter } from './components/index.js';

export const RegisterPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    schoolName: '',
    code: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    city: '',
    state: '',
    board: 'CBSE',
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const leftFeatures = [
    { icon: BookOpen, label: 'Academic Management' },
    { icon: GraduationCap, label: 'Student Administration' },
    { icon: Users, label: 'Staff Management' },
    { icon: Award, label: 'Examination Management' },
  ];

  return (
    <AuthLayout
      leftHeading="Bring Your School Together."
      leftTagline="A unified, AI-powered ERP platform designed to seamlessly connect administration, faculty, students, and parents into one cohesive academic ecosystem."
      leftFeatures={leftFeatures}
      cardMaxWidth="620px"
    >
      <AuthHeader
        title="School Tenant Registration"
        subtitle="Register your institution for the EduNexa Advanced School Management & ERP System."
        badge="Institutional Onboarding"
      />

      {submitted ? (
        <div style={{ textAlign: 'center', padding: '16px 8px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: 'rgba(34, 197, 94, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: '#16a34a',
            }}
          >
            <CheckCircle2 size={38} />
          </div>
          <h3
            style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}
          >
            Institutional Onboarding Initiated!
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            Thank you for registering <strong>{formData.schoolName}</strong>. Our Super Administration provisioning team has received your institutional deployment application. A dedicated instance configuration link has been dispatched to <strong>{formData.adminEmail}</strong>.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <Link
              to="/"
              className="ed-btn ed-btn-outline"
              style={{
                height: '44px',
                borderRadius: '10px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Return to Website
            </Link>
            <Link
              to="/login"
              className="ed-btn ed-btn-primary"
              style={{
                height: '44px',
                borderRadius: '10px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                backgroundColor: 'var(--color-primary, #244c3a)',
              }}
            >
              Go to Portal Login
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* SCHOOL NAME (Full Width) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              School / Institution Name *
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <School size={16} />
              </div>
              <input
                required
                className="ed-input"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                }}
                placeholder="e.g. Apex Global Academy of Sciences"
                value={formData.schoolName}
                onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
              />
            </div>
          </div>

          {/* CODE & BOARD (2 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Institution Code *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Hash size={16} />
                </div>
                <input
                  required
                  className="ed-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    height: '44px',
                    borderRadius: '10px',
                    fontSize: '0.90rem',
                    textTransform: 'uppercase',
                  }}
                  placeholder="e.g. APEX-02"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Educational Board *
              </label>
              <select
                className="ed-select"
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                }}
                value={formData.board}
                onChange={(e) => setFormData({ ...formData, board: e.target.value })}
              >
                <option value="CBSE">CBSE (Central Board)</option>
                <option value="ICSE">ICSE / CISCE</option>
                <option value="STATE">State Secondary Board</option>
                <option value="IB">International Baccalaureate (IB)</option>
                <option value="CAMBRIDGE">Cambridge CAIE</option>
              </select>
            </div>
          </div>

          {/* ADMIN NAME & PHONE (2 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Primary Administrator *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <User size={16} />
                </div>
                <input
                  required
                  className="ed-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    height: '44px',
                    borderRadius: '10px',
                    fontSize: '0.90rem',
                  }}
                  placeholder="e.g. Principal Dr. Raman"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Admin Phone *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Phone size={16} />
                </div>
                <input
                  required
                  type="tel"
                  className="ed-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    height: '44px',
                    borderRadius: '10px',
                    fontSize: '0.90rem',
                  }}
                  placeholder="+91 98000 00000"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* OFFICIAL ADMIN EMAIL (Full Width) */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Official Administrative Email *
            </label>
            <div style={{ position: 'relative' }}>
              <div
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none',
                }}
              >
                <Mail size={16} />
              </div>
              <input
                required
                type="email"
                className="ed-input"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                }}
                placeholder="admin@institution.edu"
                value={formData.adminEmail}
                onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
              />
            </div>
          </div>

          {/* CITY & STATE (2 Columns) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                City *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <MapPin size={16} />
                </div>
                <input
                  required
                  className="ed-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    height: '44px',
                    borderRadius: '10px',
                    fontSize: '0.90rem',
                  }}
                  placeholder="e.g. Bangalore"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                State / Province *
              </label>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    pointerEvents: 'none',
                  }}
                >
                  <Building2 size={16} />
                </div>
                <input
                  required
                  className="ed-input"
                  style={{
                    width: '100%',
                    paddingLeft: '38px',
                    height: '44px',
                    borderRadius: '10px',
                    fontSize: '0.90rem',
                  }}
                  placeholder="e.g. Karnataka"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={submitting}
            className="ed-btn ed-btn-primary"
            style={{
              width: '100%',
              height: '46px',
              fontSize: '0.96rem',
              fontWeight: 700,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-primary, #244c3a)',
              marginTop: '6px',
            }}
          >
            {submitting ? 'Submitting Application...' : 'Submit Institutional Registration'}
            <ArrowRight size={17} />
          </button>
        </form>
      )}

      {/* FOOTER */}
      <AuthFooter
        links={[
          {
            textBefore: 'Already an onboarded institution?',
            label: 'Log in to ERP Portal',
            to: '/login',
          },
        ]}
      />
    </AuthLayout>
  );
};

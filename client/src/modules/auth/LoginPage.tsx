import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { getApiUrl, setAuthSession } from '../../services/api.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';

interface LoginPageProps {
  onLoginSuccess?: (role: string) => void;
  onGoToPublic?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToPublic }) => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleToRouteMap: Record<string, string> = {
    SUPER_ADMIN: '/superadmin',
    SCHOOL_ADMIN: '/admin',
    PRINCIPAL: '/admin',
    TEACHER: '/teacher',
    STUDENT: '/student',
    PARENT: '/parent',
    EXAM_COORDINATOR: '/examinations',
    HR_STAFF: '/hr',
    ACCOUNTS: '/accounts',
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(getApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      let data: any = null;
      try {
        const text = await res.text();
        data = text ? JSON.parse(text) : null;
      } catch {
        throw new Error('Cannot connect to the EduNexa backend API server (http://localhost:5000). Please ensure the backend is running with "npm run dev".');
      }

      if (!res.ok || !data || !data.success) {
        if (!data) {
          throw new Error('Backend server is currently offline or unreachable at port 5000. Please start the backend server with "npm run dev".');
        }
        throw new Error(data.error?.message || 'Authentication failed. Please check your institutional credentials.');
      }

      // Store verified token and session
      setAuthSession(data.data.accessToken, data.data.user);

      const userRole = data.data.user.role;
      if (onLoginSuccess) {
        onLoginSuccess(userRole);
      } else {
        const from = (location.state as any)?.from?.pathname;
        const targetRoute = from || roleToRouteMap[userRole] || '/admin';
        navigate(targetRoute, { replace: true });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to connect to authentication server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-app)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
        position: 'relative',
      }}
    >
      {/* Top Right Floating Toolbar with Theme Toggle */}
      <div style={{ position: 'absolute', top: '16px', right: '20px', zIndex: 10 }}>
        <ThemeSwitcher compact={false} />
      </div>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              backgroundColor: branding.primaryAccent,
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.4rem',
              marginBottom: 'var(--space-3)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            {branding.monogram}
          </div>
          <h1 style={{ fontSize: '1.6rem', color: 'var(--text-primary)' }}>{branding.shortName} Portal</h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Unified Academic & Administrative ERP Access • Powered by EduNexa
          </p>
        </div>

        {/* Login Form */}
        <div className="ed-card ed-card-body" style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              marginBottom: 'var(--space-4)',
              paddingBottom: 'var(--space-3)',
              borderBottom: '1px solid var(--border-default)',
            }}
          >
            <ShieldCheck size={18} style={{ color: 'var(--primary-600)' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Institutional Single Sign-On
            </span>
          </div>

          <form onSubmit={handleFormSubmit}>
            <div className="ed-input-group">
              <label className="ed-label">Institutional Email</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
                <input
                  required
                  type="email"
                  className="ed-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="name@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="ed-input-group">
              <label className="ed-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
                <input
                  required
                  type="password"
                  className="ed-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)',
                fontSize: '0.8rem',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Remember terminal session
              </label>
              <a href="#reset" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.78rem', color: 'var(--primary-600)' }}>
                Forgot Password?
              </a>
            </div>

            {errorMessage && (
              <div
                style={{
                  marginBottom: 'var(--space-4)',
                  padding: '8px 12px',
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger-text)',
                  fontSize: '0.82rem',
                }}
              >
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="ed-btn ed-btn-primary"
              style={{ width: '100%', padding: '10px', fontSize: '0.95rem' }}
            >
              {isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Dashboard'}
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Quick Demo Credentials for Evaluation & PRD Verification */}
          <div
            style={{
              marginTop: 'var(--space-4)',
              paddingTop: 'var(--space-3)',
              borderTop: '1px dashed var(--border-default)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
                DEMO CREDENTIALS (9 PRD ROLES)
              </span>
              <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>
                Pass: Password@123
              </span>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '6px',
              }}
            >
              {[
                { label: 'Super Admin', email: 'superadmin@edunexa.org' },
                { label: 'School Admin', email: 'admin@apexacademy.edu' },
                { label: 'Principal', email: 'principal@apexacademy.edu' },
                { label: 'Teacher', email: 'julian.thorne@apexacademy.edu' },
                { label: 'Student', email: 'aarav.sharma@apexacademy.edu' },
                { label: 'Parent', email: 'vikram.sharma@gmail.com' },
                { label: 'HR Staff', email: 'hr@apexacademy.edu' },
                { label: 'Accounts', email: 'accounts@apexacademy.edu' },
                { label: 'Exam Coord', email: 'exam.coordinator@apexacademy.edu' },
              ].map((role) => (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => {
                    setEmail(role.email);
                    setPassword('Password@123');
                    setErrorMessage(null);
                  }}
                  className="ed-btn ed-btn-sm"
                  style={{
                    fontSize: '0.72rem',
                    padding: '4px 6px',
                    textAlign: 'center',
                    backgroundColor: email === role.email ? 'var(--primary-50)' : 'var(--bg-subtle)',
                    borderColor: email === role.email ? 'var(--primary-500)' : 'var(--border-default)',
                    color: email === role.email ? 'var(--primary-700)' : 'var(--text-secondary)',
                    fontWeight: email === role.email ? 700 : 500,
                    borderRadius: 'var(--radius-sm)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={`Fill credentials for ${role.label} (${role.email})`}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Public Website and Registration Links */}
        <div style={{ textAlign: 'center', marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {onGoToPublic ? (
            <button
              onClick={onGoToPublic}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              ← Return to Public School Website
            </button>
          ) : (
            <Link
              to="/"
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
              }}
            >
              ← Return to Public School Website
            </Link>
          )}

          <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
            Need to register a new school tenant?{' '}
            <Link to="/register" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
              Register Here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

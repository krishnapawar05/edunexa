import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Shield, Lock, Mail, ArrowRight, CheckCircle2, School } from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { getApiUrl } from '../../services/api.js';

interface LoginPageProps {
  onLoginSuccess?: (role: string) => void;
  onGoToPublic?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToPublic }) => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('admin@apexacademy.edu');
  const [password, setPassword] = useState('••••••••••••');
  const [selectedRole, setSelectedRole] = useState('SCHOOL_ADMIN');
  const [isLoading, setIsLoading] = useState(false);

  const demoAccounts = [
    { role: 'SUPER_ADMIN', label: 'Super Admin', email: 'superadmin@edunexa.org', badge: 'Multi-Tenant' },
    { role: 'SCHOOL_ADMIN', label: 'School Admin', email: 'admin@apexacademy.edu', badge: 'Apex Academy' },
    { role: 'TEACHER', label: 'Faculty / Teacher', email: 'dr.thorne@apexacademy.edu', badge: 'Grade 10' },
    { role: 'STUDENT', label: 'Student Profile', email: 'aarav.sharma@student.apex.edu', badge: 'Grade 10-A' },
    { role: 'PARENT', label: 'Parent / Guardian', email: 'sunil.sharma@parent.apex.edu', badge: '2 Children' },
    { role: 'EXAM_COORDINATOR', label: 'Exam Coordinator', email: 'exam.coordinator@apexacademy.edu', badge: 'Assessments' },
    { role: 'HR_STAFF', label: 'HR / Staff Admin', email: 'hr.admin@apexacademy.edu', badge: 'Workforce' },
    { role: 'ACCOUNTS', label: 'Accounts Staff', email: 'accounts@apexacademy.edu', badge: 'Finance' },
  ];

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const roleToRouteMap: Record<string, string> = {
    SUPER_ADMIN: '/superadmin',
    SCHOOL_ADMIN: '/admin',
    TEACHER: '/teacher',
    STUDENT: '/student',
    PARENT: '/parent',
    EXAM_COORDINATOR: '/examinations',
    HR_STAFF: '/hr',
    ACCOUNTS: '/accounts',
  };

  const handleSelectDemo = (acc: typeof demoAccounts[0]) => {
    setSelectedRole(acc.role);
    setEmail(acc.email);
    setPassword('DemoPass2026!');
    setErrorMessage(null);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(getApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Authentication failed. Please check credentials.');
      }

      // Store verified token and session
      localStorage.setItem('edunexa_access_token', data.data.accessToken);
      localStorage.setItem('edunexa_user', JSON.stringify(data.data.user));

      const userRole = data.data.user.role;
      if (onLoginSuccess) {
        onLoginSuccess(userRole);
      } else {
        const from = (location.state as any)?.from?.pathname || roleToRouteMap[userRole] || '/admin';
        navigate(from, { replace: true });
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
      }}
    >
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Brand Banner */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
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

        {/* Demo Fast-Switcher Card */}
        <div
          className="ed-card"
          style={{
            marginBottom: 'var(--space-4)',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-default)',
            padding: 'var(--space-3) var(--space-4)',
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: 'var(--text-muted)',
              marginBottom: 'var(--space-2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>One-Click Role Demonstration</span>
            <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>Synthetic Sandbox</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
            {demoAccounts.map((acc) => {
              const isSelected = selectedRole === acc.role;
              return (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleSelectDemo(acc)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: isSelected ? '1px solid var(--primary-600)' : '1px solid var(--border-default)',
                    backgroundColor: isSelected ? 'var(--primary-50)' : 'var(--bg-subtle)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: isSelected ? 'var(--primary-700)' : 'var(--text-primary)',
                    }}
                  >
                    {acc.label}
                  </div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{acc.badge}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Form */}
        <div className="ed-card ed-card-body" style={{ backgroundColor: '#ffffff', boxShadow: 'var(--shadow-md)' }}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)', fontSize: '0.8rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked /> Remember terminal session
              </label>
              <a href="#reset" onClick={(e) => e.preventDefault()} style={{ fontSize: '0.78rem' }}>
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

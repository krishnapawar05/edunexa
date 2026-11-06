import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { getApiUrl, setAuthSession, forgotPasswordApi } from '../../services/api.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';
import { MfaVerificationModal } from '../../components/ui/MfaVerificationModal.js';

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

  // Section 17 MFA state
  const [mfaChallenge, setMfaChallenge] = useState<{ mfaToken: string; emailMasked?: string } | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotDevToken, setForgotDevToken] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotInput.trim()) return;
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccessMessage(null);
    setForgotDevToken(null);
    try {
      const res = await forgotPasswordApi(forgotInput.trim(), branding.code);
      setForgotSuccessMessage(res.message || 'If an account exists with this email or username, password reset instructions have been sent.');
      if ((res as any).devToken) {
        setForgotDevToken((res as any).devToken);
      }
    } catch (err: any) {
      setForgotError(err.message || 'Failed to submit reset request.');
    } finally {
      setForgotLoading(false);
    }
  };

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

      // Check if MFA challenge is issued
      if (data.data?.mfaRequired) {
        setMfaChallenge({
          mfaToken: data.data.mfaToken,
          emailMasked: data.data.emailMasked,
        });
        setIsLoading(false);
        return;
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
              <label className="ed-label">Institutional Email or Username</label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={16}
                  style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                />
                <input
                  required
                  type="text"
                  className="ed-input"
                  style={{ paddingLeft: '34px' }}
                  placeholder="name@school.edu or username"
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
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(true);
                  setForgotInput(email);
                  setForgotError(null);
                  setForgotSuccessMessage(null);
                  setForgotDevToken(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  fontSize: '0.78rem',
                  color: 'var(--primary-600)',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
              >
                Forgot Password?
              </button>
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
            Received an account invitation or code?{' '}
            <Link to="/activate" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
              Activate Your Account
            </Link>
          </div>

          <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)' }}>
            Need to register a new school tenant?{' '}
            <Link to="/register" style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'none' }}>
              Register Here
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="ed-card"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-surface)',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-default)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-default)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: 'var(--primary-600)' }} />
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  Password Recovery
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {forgotSuccessMessage ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px',
                      padding: '12px 14px',
                      backgroundColor: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      marginBottom: '16px',
                    }}
                  >
                    <CheckCircle2 size={20} style={{ color: '#16a34a', flexShrink: 0, marginTop: '2px' }} />
                    <div>
                      <strong>Request Sent:</strong>
                      <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                        {forgotSuccessMessage}
                      </p>
                    </div>
                  </div>

                  {forgotDevToken && (
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.82rem',
                        marginBottom: '16px',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
                        🛠️ Development Mode Reset Link:
                      </div>
                      <Link
                        to={`/reset-password?token=${forgotDevToken}`}
                        onClick={() => setShowForgotModal(false)}
                        style={{ color: 'var(--primary-600)', wordBreak: 'break-all', fontWeight: 600 }}
                      >
                        Click here to reset password directly
                      </Link>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="ed-btn ed-btn-primary"
                    style={{ width: '100%', padding: '10px' }}
                  >
                    Return to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPassword}>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 0, marginBottom: '16px', lineHeight: 1.5 }}>
                    Enter your institutional email address or username. If your account is registered, you will receive a secure single-use password reset link.
                  </p>

                  <div className="ed-input-group" style={{ marginBottom: '16px' }}>
                    <label className="ed-label">Institutional Email or Username</label>
                    <div style={{ position: 'relative' }}>
                      <Mail
                        size={16}
                        style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--text-muted)' }}
                      />
                      <input
                        required
                        type="text"
                        className="ed-input"
                        style={{ paddingLeft: '34px' }}
                        placeholder="e.g. name@school.edu or aarav.sharma"
                        value={forgotInput}
                        onChange={(e) => setForgotInput(e.target.value)}
                        autoFocus
                      />
                    </div>
                  </div>

                  {forgotError && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '16px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--danger-bg)',
                        border: '1px solid var(--danger-border)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--danger-text)',
                        fontSize: '0.82rem',
                      }}
                    >
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>{forgotError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="ed-btn ed-btn-outline"
                      style={{ padding: '8px 16px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={forgotLoading}
                      className="ed-btn ed-btn-primary"
                      style={{ padding: '8px 18px' }}
                    >
                      {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Section 17 Two-Factor OTP Modal */}
      {mfaChallenge && (
        <MfaVerificationModal
          isOpen={Boolean(mfaChallenge)}
          mfaToken={mfaChallenge.mfaToken}
          emailMasked={mfaChallenge.emailMasked}
          onSuccess={(result) => {
            setAuthSession(result.accessToken, result.user);
            setMfaChallenge(null);
            const userRole = result.user.role;
            if (onLoginSuccess) {
              onLoginSuccess(userRole);
            } else {
              const from = (location.state as any)?.from?.pathname;
              const targetRoute = from || roleToRouteMap[userRole] || '/admin';
              navigate(targetRoute, { replace: true });
            }
          }}
          onCancel={() => setMfaChallenge(null)}
        />
      )}
    </div>
  );
};

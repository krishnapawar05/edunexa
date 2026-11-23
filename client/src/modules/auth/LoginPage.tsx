import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  X,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  Settings,
  CalendarCheck,
  BookOpen,
  CreditCard,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { getApiUrl, setAuthSession, forgotPasswordApi } from '../../services/api.js';
import { MfaVerificationModal } from '../../components/ui/MfaVerificationModal.js';
import { AuthLayout, AuthHeader, AuthFooter } from './components/index.js';

interface LoginPageProps {
  onLoginSuccess?: (role: string) => void;
  onGoToPublic?: () => void;
}

interface DemoRoleConfig {
  label: string;
  email: string;
  roleKey: string;
  category: 'STUDENT' | 'TEACHER' | 'ADMIN' | 'OTHER';
}

const DEMO_ROLES: DemoRoleConfig[] = [
  { label: 'Super Admin', email: 'superadmin@edunexa.org', roleKey: 'SUPER_ADMIN', category: 'ADMIN' },
  { label: 'School Admin', email: 'admin@apexacademy.edu', roleKey: 'SCHOOL_ADMIN', category: 'ADMIN' },
  { label: 'Principal', email: 'principal@apexacademy.edu', roleKey: 'PRINCIPAL', category: 'ADMIN' },
  { label: 'Teacher', email: 'julian.thorne@apexacademy.edu', roleKey: 'TEACHER', category: 'TEACHER' },
  { label: 'Student', email: 'aarav.sharma@apexacademy.edu', roleKey: 'STUDENT', category: 'STUDENT' },
  { label: 'Parent', email: 'vikram.sharma@gmail.com', roleKey: 'PARENT', category: 'OTHER' },
  { label: 'HR Staff', email: 'hr@apexacademy.edu', roleKey: 'HR_STAFF', category: 'ADMIN' },
  { label: 'Accounts', email: 'accounts@apexacademy.edu', roleKey: 'ACCOUNTS', category: 'ADMIN' },
  { label: 'Exam Coord', email: 'exam.coordinator@apexacademy.edu', roleKey: 'EXAM_COORDINATOR', category: 'ADMIN' },
];

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onGoToPublic }) => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Quick Role Filter Tab (Student | Teacher | Admin)
  const [selectedQuickRole, setSelectedQuickRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN' | 'ALL'>('ALL');
  const [activeDemoRole, setActiveDemoRole] = useState<string | null>(null);

  // Section 17 MFA state
  const [mfaChallenge, setMfaChallenge] = useState<{ mfaToken: string; emailMasked?: string } | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccessMessage, setForgotSuccessMessage] = useState<string | null>(null);
  const [forgotDevToken, setForgotDevToken] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Demo credentials visibility check:
  // 1. Explicit environment variable check (VITE_ENABLE_DEMO_CREDENTIALS):
  //    Allows staging or private Railway deployments to display demo accounts when enabled.
  // 2. Default fallback when the env var is not specified:
  //    - Enabled on local development environments (localhost, 127.0.0.1, or vite dev server).
  //    - Strictly disabled in production/deployed environments by default for security.
  const rawDemoEnv = (import.meta as any).env?.VITE_ENABLE_DEMO_CREDENTIALS;
  const isExplicitlyEnabled = rawDemoEnv === 'true' || rawDemoEnv === true || rawDemoEnv === '1';
  const isExplicitlyDisabled = rawDemoEnv === 'false' || rawDemoEnv === false || rawDemoEnv === '0';

  const isLocalHost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
  );
  const isViteDev = Boolean(
    (import.meta as any).env?.DEV ||
    (import.meta as any).env?.MODE === 'development'
  );

  const showDemoCredentials = isExplicitlyEnabled || (!isExplicitlyDisabled && (isLocalHost || isViteDev));

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

  const handleQuickRoleSelect = (category: 'STUDENT' | 'TEACHER' | 'ADMIN') => {
    setSelectedQuickRole(category);
    // Find representative demo account if demo credentials are enabled
    if (showDemoCredentials) {
      let match = DEMO_ROLES.find((r) => r.category === category);
      if (category === 'ADMIN') match = DEMO_ROLES.find((r) => r.roleKey === 'SCHOOL_ADMIN');
      if (match) {
        setEmail(match.email);
        setPassword('Password@123');
        setActiveDemoRole(match.label);
        setErrorMessage(null);
      }
    }
  };

  const handleSelectDemoRole = (role: DemoRoleConfig) => {
    setEmail(role.email);
    setPassword('Password@123');
    setActiveDemoRole(role.label);
    setErrorMessage(null);
    if (role.category === 'STUDENT' || role.category === 'TEACHER' || role.category === 'ADMIN') {
      setSelectedQuickRole(role.category);
    } else {
      setSelectedQuickRole('ALL');
    }
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

  const leftFeatures = [
    { icon: CalendarCheck, label: 'Attendance' },
    { icon: BookOpen, label: 'Academics' },
    { icon: CreditCard, label: 'Fee Management' },
    { icon: BarChart3, label: 'Reports' },
  ];

  return (
    <AuthLayout
      leftHeading="Your School, Connected."
      leftTagline="A complete school management solution for students, teachers and administrators."
      leftFeatures={leftFeatures}
      cardMaxWidth="490px"
    >
      {/* CARD HEADER */}
      <AuthHeader
        title="Welcome Back"
        subtitle="Sign in to access your institutional account."
      />

      {/* QUICK ROLE SWITCHER TABS (Matches Reference ERP Design) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px',
          marginBottom: '20px',
          backgroundColor: 'var(--bg-subtle, #f0f3ee)',
          padding: '4px',
          borderRadius: '12px',
          border: '1px solid var(--border-default, #e2e6e0)',
        }}
      >
        <button
          type="button"
          onClick={() => handleQuickRoleSelect('STUDENT')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            border: 'none',
            borderRadius: '9px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: selectedQuickRole === 'STUDENT' ? 'var(--color-primary, #244c3a)' : 'transparent',
            color: selectedQuickRole === 'STUDENT' ? '#ffffff' : 'var(--text-secondary, #66716a)',
            boxShadow: selectedQuickRole === 'STUDENT' ? '0 2px 6px rgba(36, 76, 58, 0.25)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <GraduationCap size={15} />
          <span>Student</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickRoleSelect('TEACHER')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            border: 'none',
            borderRadius: '9px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: selectedQuickRole === 'TEACHER' ? 'var(--color-primary, #244c3a)' : 'transparent',
            color: selectedQuickRole === 'TEACHER' ? '#ffffff' : 'var(--text-secondary, #66716a)',
            boxShadow: selectedQuickRole === 'TEACHER' ? '0 2px 6px rgba(36, 76, 58, 0.25)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Users size={15} />
          <span>Teacher</span>
        </button>

        <button
          type="button"
          onClick={() => handleQuickRoleSelect('ADMIN')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 10px',
            border: 'none',
            borderRadius: '9px',
            fontSize: '0.82rem',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: selectedQuickRole === 'ADMIN' ? 'var(--color-primary, #244c3a)' : 'transparent',
            color: selectedQuickRole === 'ADMIN' ? '#ffffff' : 'var(--text-secondary, #66716a)',
            boxShadow: selectedQuickRole === 'ADMIN' ? '0 2px 6px rgba(36, 76, 58, 0.25)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Settings size={15} />
          <span>Admin</span>
        </button>
      </div>

      {/* LOGIN FORM */}
      <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* EMAIL / USERNAME FIELD */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.80rem',
              fontWeight: 700,
              color: 'var(--text-primary, #242c27)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            User ID / Admission No. / Email *
          </label>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #8a968f)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <User size={17} />
            </div>
            <input
              required
              type="text"
              className="ed-input"
              style={{
                width: '100%',
                paddingLeft: '38px',
                height: '44px',
                borderRadius: '10px',
                fontSize: '0.90rem',
              }}
              placeholder="e.g. name@school.edu or ADM-2026-0042"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setActiveDemoRole(null);
              }}
              autoComplete="username"
            />
          </div>
        </div>

        {/* PASSWORD FIELD */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.80rem',
              fontWeight: 700,
              color: 'var(--text-primary, #242c27)',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Password *
          </label>
          <div style={{ position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #8a968f)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <Lock size={17} />
            </div>
            <input
              required
              type={showPassword ? 'text' : 'password'}
              className="ed-input"
              style={{
                width: '100%',
                paddingLeft: '38px',
                paddingRight: '40px',
                height: '44px',
                borderRadius: '10px',
                fontSize: '0.90rem',
              }}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setActiveDemoRole(null);
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted, #8a968f)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* REMEMBER ME & FORGOT PASSWORD */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '0.82rem',
          }}
        >
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              color: 'var(--text-secondary, #66716a)',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                accentColor: 'var(--color-primary, #244c3a)',
                width: '15px',
                height: '15px',
                borderRadius: '3px',
              }}
            />
            Remember me
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
              fontSize: '0.82rem',
              color: 'var(--color-primary, #244c3a)',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Forgot Password?
          </button>
        </div>

        {/* ERROR MESSAGE ALERT */}
        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--danger-bg, #fee2e2)',
              border: '1px solid var(--danger-border, #fca5a5)',
              borderRadius: '8px',
              color: 'var(--danger-text, #991b1b)',
              fontSize: '0.84rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              lineHeight: 1.45,
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SIGN IN BUTTON */}
        <button
          type="submit"
          disabled={isLoading}
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
            boxShadow: '0 4px 14px rgba(36, 76, 58, 0.28)',
            backgroundColor: 'var(--color-primary, #244c3a)',
            marginTop: '4px',
          }}
        >
          {isLoading ? (
            <span>Verifying Credentials...</span>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>

      {/* DEMO CREDENTIALS: DISPLAYED LOCALLY OR WHEN VITE_ENABLE_DEMO_CREDENTIALS IS TRUE */}
      {showDemoCredentials && (
        <div
          style={{
            marginTop: '22px',
            paddingTop: '16px',
            borderTop: '1px dashed var(--border-default, #e2e6e0)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a',
                  display: 'inline-block',
                }}
              />
              <span
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 800,
                  color: 'var(--text-muted, #8a968f)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Demo Credentials (9 PRD Roles)
              </span>
            </div>
            <span
              style={{
                fontSize: '0.72rem',
                color: 'var(--brand-gold-700, #8c6e37)',
                fontWeight: 700,
                backgroundColor: 'rgba(196, 164, 107, 0.15)',
                padding: '2px 7px',
                borderRadius: '4px',
              }}
            >
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
            {DEMO_ROLES.map((role) => {
              const isSelected = email === role.email || activeDemoRole === role.label;
              return (
                <button
                  key={role.label}
                  type="button"
                  onClick={() => handleSelectDemoRole(role)}
                  style={{
                    fontSize: '0.74rem',
                    padding: '6px 8px',
                    textAlign: 'center',
                    backgroundColor: isSelected ? 'var(--primary-100, #dce7e1)' : 'var(--bg-subtle, #f0f3ee)',
                    borderColor: isSelected ? 'var(--color-primary, #244c3a)' : 'var(--border-default, #e2e6e0)',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: isSelected ? 'var(--color-primary, #244c3a)' : 'var(--text-secondary, #66716a)',
                    fontWeight: isSelected ? 800 : 600,
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title={`Use Demo: ${role.label} (${role.email})`}
                >
                  {role.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SECONDARY NAVIGATION LINKS (FOOTER) */}
      <AuthFooter
        links={[
          {
            textBefore: 'Received an account invitation or code?',
            label: 'Activate Your Account',
            to: '/activate',
          },
          {
            textBefore: 'Need to register a new school tenant?',
            label: 'Register Here',
            to: '/register',
          },
        ]}
        onGoToPublic={onGoToPublic}
      />

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
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
              backgroundColor: 'var(--bg-surface, #ffffff)',
              boxShadow: 'var(--shadow-xl)',
              borderRadius: '16px',
              border: '1px solid var(--border-default, #e2e6e0)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                borderBottom: '1px solid var(--border-default, #e2e6e0)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={20} style={{ color: 'var(--color-primary, #244c3a)' }} />
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
                      borderRadius: '8px',
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
                        borderRadius: '8px',
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
                        style={{ color: 'var(--color-primary, #244c3a)', wordBreak: 'break-all', fontWeight: 600 }}
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
                        borderRadius: '8px',
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

      {/* SECTION 17 TWO-FACTOR OTP CHALLENGE MODAL */}
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
    </AuthLayout>
  );
};

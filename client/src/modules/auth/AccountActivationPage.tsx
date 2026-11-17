import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Sparkles,
  Eye,
  EyeOff,
  UserCheck,
  Building2,
  User,
  Mail,
  RefreshCw,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { verifyActivationTokenApi, activateAccountApi } from '../../services/api.js';
import { AuthLayout, AuthHeader, AuthFooter } from './components/index.js';

export const AccountActivationPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || searchParams.get('code') || '';

  const [inputCode, setInputCode] = useState(tokenParam);
  const [verifying, setVerifying] = useState(Boolean(tokenParam));
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [accountDetails, setAccountDetails] = useState<{
    email: string;
    recipientName: string;
    role: string;
    schoolName: string;
    isAssisted: boolean;
  } | null>(null);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password validation rules
  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const performVerification = async (codeToVerify: string) => {
    if (!codeToVerify.trim()) return;
    setVerifying(true);
    setVerificationError(null);
    try {
      const res = await verifyActivationTokenApi(codeToVerify.trim());
      setAccountDetails(res);
      setTokenValid(true);
    } catch (err: any) {
      setTokenValid(false);
      setVerificationError(
        err.message || 'This activation invitation is invalid, has expired, or has already been used.'
      );
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (tokenParam) {
      performVerification(tokenParam);
    } else {
      setVerifying(false);
    }
  }, [tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeToken = tokenParam || inputCode;
    if (!isFormValid || !activeToken) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await activateAccountApi(activeToken.trim(), password);
      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to activate account. Invitation may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const leftFeatures = [
    { icon: UserCheck, label: 'Verified Identity' },
    { icon: KeyRound, label: 'Instant Credentials' },
    { icon: ShieldCheck, label: 'Multi-Factor Shield' },
    { icon: Sparkles, label: 'Role-Based Access' },
  ];

  return (
    <AuthLayout
      leftHeading="Welcome to Your School Community."
      leftTagline="Complete your official account activation to access your personalized institutional portal, academic records, and campus resources."
      leftFeatures={leftFeatures}
      cardMaxWidth="500px"
    >
      <AuthHeader
        title="Activate Your Account"
        subtitle="Complete your account activation to access your school portal."
        badge="Identity Verification"
      />

      {verifying ? (
        <div style={{ textAlign: 'center', padding: '36px 16px' }}>
          <RefreshCw
            size={32}
            className="animate-spin"
            style={{ color: 'var(--color-primary, #244c3a)', margin: '0 auto 16px auto' }}
          />
          <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Validating institutional invitation token...
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Checking verification record on institutional ledger
          </p>
        </div>
      ) : isSuccess ? (
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
            Account Successfully Activated!
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: '22px',
            }}
          >
            Welcome to <strong>{accountDetails?.schoolName || branding.schoolName}</strong>. Your institutional profile is fully activated and ready. You may now sign in using your email and newly configured password.
          </p>
          <button
            type="button"
            onClick={() => navigate('/login')}
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
            }}
          >
            Proceed to Portal Sign In
            <ArrowRight size={17} />
          </button>
        </div>
      ) : tokenValid === false ? (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px',
              backgroundColor: 'var(--danger-bg, #fee2e2)',
              border: '1px solid var(--danger-border, #fca5a5)',
              borderRadius: '10px',
              color: 'var(--danger-text, #991b1b)',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.90rem' }}>
                Invalid or Expired Invitation
              </strong>
              <span style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
                {verificationError ||
                  'This activation link or code has expired, been revoked, or already been accepted.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setTokenValid(null);
                setInputCode('');
              }}
              className="ed-btn ed-btn-outline"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '10px',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              Enter a Different Activation Code
            </button>
            <Link
              to="/login"
              className="ed-btn ed-btn-primary"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '10px',
                fontWeight: 700,
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
              }}
            >
              Return to Login
            </Link>
          </div>
        </div>
      ) : !tokenValid ? (
        <div>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}
          >
            Enter the activation token from your institutional welcome letter or the{' '}
            <strong>ACT-XXXX-XXXX</strong> code provided by your school administrator:
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label
              style={{
                display: 'block',
                fontSize: '0.80rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Activation Token or Code *
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
                <KeyRound size={17} />
              </div>
              <input
                type="text"
                className="ed-input"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                }}
                placeholder="e.g. ACT-1234-5678 or paste token"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => performVerification(inputCode)}
            disabled={!inputCode.trim()}
            className="ed-btn ed-btn-primary"
            style={{
              width: '100%',
              height: '46px',
              fontSize: '0.95rem',
              fontWeight: 700,
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              backgroundColor: 'var(--color-primary, #244c3a)',
            }}
          >
            <span>Validate Activation Code</span>
            <Sparkles size={16} />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {accountDetails && (
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-subtle, #f0f3ee)',
                borderRadius: '12px',
                border: '1px solid var(--border-default, #e2e6e0)',
                fontSize: '0.84rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  color: 'var(--color-primary, #244c3a)',
                  marginBottom: '8px',
                  textTransform: 'uppercase',
                  fontSize: '0.74rem',
                  letterSpacing: '0.05em',
                }}
              >
                <UserCheck size={16} />
                <span>Verified Institutional Profile</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', color: 'var(--text-secondary)' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>RECIPIENT NAME</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{accountDetails.recipientName}</strong>
                </div>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>ASSIGNED ROLE</span>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      backgroundColor: 'var(--primary-100, #dce7e1)',
                      color: 'var(--color-primary, #244c3a)',
                      borderRadius: '4px',
                      fontWeight: 700,
                      fontSize: '0.75rem',
                    }}
                  >
                    {accountDetails.role.replace(/_/g, ' ')}
                  </span>
                </div>
                <div style={{ gridColumn: 'span 2', marginTop: '2px' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block' }}>INSTITUTIONAL EMAIL</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{accountDetails.email}</span>
                </div>
              </div>
            </div>
          )}

          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-secondary)',
              margin: 0,
              lineHeight: 1.45,
            }}
          >
            Create your confidential password to complete activation and access your school portal:
          </p>

          {/* CREATE PASSWORD */}
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
              Create Password *
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
                <Lock size={16} />
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
                placeholder="Enter secure password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
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
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* CONFIRM PASSWORD */}
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
              Confirm Password *
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
                <Lock size={16} />
              </div>
              <input
                required
                type={showConfirmPassword ? 'text' : 'password'}
                className="ed-input"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '40px',
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                }}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* PASSWORD CHECKLIST */}
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--bg-subtle, #f0f3ee)',
              borderRadius: '10px',
              border: '1px solid var(--border-default, #e2e6e0)',
              fontSize: '0.76rem',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: 'var(--text-primary)',
                marginBottom: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Security Criteria:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <span style={{ color: hasMinLength ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                {hasMinLength ? '✓' : '○'} 8+ Characters
              </span>
              <span style={{ color: hasUppercase ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                {hasUppercase ? '✓' : '○'} Uppercase Letter
              </span>
              <span style={{ color: hasLowercase ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                {hasLowercase ? '✓' : '○'} Lowercase Letter
              </span>
              <span style={{ color: hasNumber ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                {hasNumber ? '✓' : '○'} Numeric Digit (0-9)
              </span>
              <span style={{ color: hasSpecial ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                {hasSpecial ? '✓' : '○'} Special Symbol (!@#$)
              </span>
              <span style={{ color: passwordsMatch ? '#16a34a' : 'var(--text-muted)', fontWeight: 600 }}>
                {passwordsMatch ? '✓' : '○'} Passwords Match
              </span>
            </div>
          </div>

          {submitError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 14px',
                backgroundColor: 'var(--danger-bg, #fee2e2)',
                border: '1px solid var(--danger-border, #fca5a5)',
                borderRadius: '8px',
                color: 'var(--danger-text, #991b1b)',
                fontSize: '0.82rem',
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{submitError}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={!isFormValid || submitting}
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
              marginTop: '4px',
            }}
          >
            {submitting ? 'Activating Account...' : 'Activate Account & Enter Portal'}
            <ShieldCheck size={17} />
          </button>
        </form>
      )}

      {/* FOOTER */}
      <AuthFooter
        links={[
          {
            textBefore: 'Already have an active account?',
            label: 'Sign In to Portal',
            to: '/login',
          },
        ]}
      />
    </AuthLayout>
  );
};

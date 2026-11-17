import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { verifyResetTokenApi, resetPasswordApi } from '../../services/api.js';
import { AuthLayout, AuthHeader, AuthFooter } from './components/index.js';

export const ResetPasswordPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenParam);
  const [verifying, setVerifying] = useState(Boolean(tokenParam));
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [verificationError, setVerificationError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Validation rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid =
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  useEffect(() => {
    if (!tokenParam) {
      setVerifying(false);
      return;
    }

    let isMounted = true;
    (async () => {
      try {
        setVerifying(true);
        setVerificationError(null);
        const res = await verifyResetTokenApi(tokenParam);
        if (isMounted) {
          setTokenValid(true);
          setRecipientEmail(res.email);
          setRecipientName(res.recipientName);
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenValid(false);
          setVerificationError(
            err.message || 'This password reset link is invalid or has expired.'
          );
        }
      } finally {
        if (isMounted) {
          setVerifying(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !token) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      await resetPasswordApi(token, newPassword);
      setIsSuccess(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to reset password. Link may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  const leftFeatures = [
    { icon: KeyRound, label: 'Secure Reset' },
    { icon: ShieldCheck, label: 'Identity Protection' },
    { icon: Lock, label: 'Encrypted Passwords' },
    { icon: Sparkles, label: 'Instant Access' },
  ];

  return (
    <AuthLayout
      leftHeading="Secure Account Recovery."
      leftTagline="Reset your password securely to regain immediate access to your institutional portal and academic workspace."
      leftFeatures={leftFeatures}
      cardMaxWidth="490px"
    >
      <AuthHeader
        title="Reset Account Password"
        subtitle="Identity & Access Security Verification"
        badge="Account Recovery"
      />

      {verifying ? (
        <div style={{ textAlign: 'center', padding: '36px 16px' }}>
          <RefreshCw
            size={32}
            className="animate-spin"
            style={{ color: 'var(--color-primary, #244c3a)', margin: '0 auto 16px auto' }}
          />
          <div style={{ fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Verifying password reset token...
          </div>
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
            Password Reset Complete!
          </h3>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.55,
              marginBottom: '24px',
            }}
          >
            Your institutional password has been securely updated. You can now log in to the portal with your new credentials.
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
            Sign In with New Password
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
                Invalid or Expired Link
              </strong>
              <span style={{ fontSize: '0.84rem', lineHeight: 1.5 }}>
                {verificationError ||
                  'This password reset link is invalid, has expired, or has already been used.'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
      ) : !token ? (
        <div>
          <p
            style={{
              fontSize: '0.86rem',
              color: 'var(--text-secondary)',
              marginBottom: '16px',
              lineHeight: 1.5,
            }}
          >
            Enter your reset token from your email to create a new password:
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
              Reset Token *
            </label>
            <input
              type="text"
              className="ed-input"
              style={{
                width: '100%',
                height: '44px',
                borderRadius: '10px',
                fontSize: '0.90rem',
                fontFamily: 'monospace',
              }}
              placeholder="Paste password reset token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={async () => {
              if (!token.trim()) return;
              try {
                setVerifying(true);
                const res = await verifyResetTokenApi(token.trim());
                setTokenValid(true);
                setRecipientEmail(res.email);
                setRecipientName(res.recipientName);
              } catch (err: any) {
                setTokenValid(false);
                setVerificationError(err.message || 'Token verification failed.');
              } finally {
                setVerifying(false);
              }
            }}
            disabled={!token.trim()}
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
            Verify Token & Proceed
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {recipientEmail && (
            <div
              style={{
                padding: '12px 14px',
                backgroundColor: 'var(--bg-subtle, #f0f3ee)',
                borderRadius: '10px',
                border: '1px solid var(--border-default, #e2e6e0)',
                fontSize: '0.82rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div><strong>Recipient:</strong> {recipientName || 'Institutional User'}</div>
              <div><strong>Account Email:</strong> {recipientEmail}</div>
            </div>
          )}

          {/* NEW PASSWORD */}
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
              New Password *
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
                type={showNewPassword ? 'text' : 'password'}
                className="ed-input"
                style={{
                  width: '100%',
                  paddingLeft: '38px',
                  paddingRight: '40px',
                  height: '44px',
                  borderRadius: '10px',
                  fontSize: '0.90rem',
                }}
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
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
                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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
              Confirm New Password *
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
                placeholder="Confirm your new password"
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
            {submitting ? 'Updating Password...' : 'Save New Password & Sign In'}
            <ShieldCheck size={17} />
          </button>
        </form>
      )}

      <AuthFooter
        links={[
          {
            label: 'Return to Login',
            to: '/login',
          },
        ]}
      />
    </AuthLayout>
  );
};

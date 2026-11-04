import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { verifyResetTokenApi, resetPasswordApi } from '../../services/api.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';

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
      <div style={{ position: 'absolute', top: '16px', right: '20px', zIndex: 10 }}>
        <ThemeSwitcher compact={false} />
      </div>

      <div style={{ width: '100%', maxWidth: '460px' }}>
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
          <h1 style={{ fontSize: '1.5rem', color: 'var(--text-primary)', margin: 0 }}>
            Reset Account Password
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {branding.shortName} • Identity & Access Security
          </p>
        </div>

        <div
          className="ed-card ed-card-body"
          style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}
        >
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Verifying password reset token...
              </div>
            </div>
          ) : isSuccess ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <CheckCircle2
                size={48}
                style={{ color: '#16a34a', margin: '0 auto 16px auto' }}
              />
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Password Reset Complete
              </h2>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '24px',
                }}
              >
                Your institutional password has been updated. You can now log in with your new credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="ed-btn ed-btn-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                Sign In with New Password
                <ArrowRight size={16} />
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
                  backgroundColor: 'var(--danger-bg)',
                  border: '1px solid var(--danger-border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger-text)',
                  marginBottom: '20px',
                }}
              >
                <AlertCircle size={22} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ display: 'block', marginBottom: '4px' }}>
                    Invalid or Expired Link
                  </strong>
                  <span style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
                    {verificationError ||
                      'This password reset link is invalid, has expired, or was already used.'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  to="/login"
                  className="ed-btn ed-btn-primary"
                  style={{ textAlign: 'center', padding: '10px' }}
                >
                  Return to Login & Request New Link
                </Link>
              </div>
            </div>
          ) : !tokenParam && !token ? (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Please enter the security token you received via email:
              </p>
              <div className="ed-input-group" style={{ marginBottom: '16px' }}>
                <label className="ed-label">Password Reset Token</label>
                <input
                  type="text"
                  className="ed-input"
                  placeholder="Paste token here..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (token.trim()) {
                    navigate(`/reset-password?token=${encodeURIComponent(token.trim())}`);
                  }
                }}
                className="ed-btn ed-btn-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                Verify Token
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {recipientEmail && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                  }}
                >
                  <KeyRound size={16} style={{ color: 'var(--primary-600)' }} />
                  <span>
                    Setting password for: <strong>{recipientName || recipientEmail}</strong> ({recipientEmail})
                  </span>
                </div>
              )}

              <div className="ed-input-group" style={{ marginBottom: '14px' }}>
                <label className="ed-label">New Secure Password</label>
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
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="ed-input-group" style={{ marginBottom: '16px' }}>
                <label className="ed-label">Confirm New Password</label>
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
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Password Requirements Checklist */}
              <div
                style={{
                  padding: '12px',
                  backgroundColor: 'var(--bg-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '16px',
                  fontSize: '0.78rem',
                }}
              >
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  Password Requirements:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                  <span style={{ color: hasMinLength ? '#16a34a' : 'var(--text-muted)' }}>
                    {hasMinLength ? '✓' : '○'} 8+ Characters
                  </span>
                  <span style={{ color: hasUppercase ? '#16a34a' : 'var(--text-muted)' }}>
                    {hasUppercase ? '✓' : '○'} Uppercase Letter
                  </span>
                  <span style={{ color: hasLowercase ? '#16a34a' : 'var(--text-muted)' }}>
                    {hasLowercase ? '✓' : '○'} Lowercase Letter
                  </span>
                  <span style={{ color: hasNumber ? '#16a34a' : 'var(--text-muted)' }}>
                    {hasNumber ? '✓' : '○'} Numeric Digit
                  </span>
                  <span style={{ color: hasSpecial ? '#16a34a' : 'var(--text-muted)' }}>
                    {hasSpecial ? '✓' : '○'} Special Symbol
                  </span>
                  <span style={{ color: passwordsMatch ? '#16a34a' : 'var(--text-muted)' }}>
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
                  <span>{submitError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className="ed-btn ed-btn-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                {submitting ? 'Updating Password...' : 'Save New Password & Continue'}
                <ShieldCheck size={16} />
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px' }}>
          <Link
            to="/login"
            style={{
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              textDecoration: 'none',
            }}
          >
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

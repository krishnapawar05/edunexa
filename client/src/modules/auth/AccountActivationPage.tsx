import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { verifyActivationTokenApi, activateAccountApi } from '../../services/api.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';

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

      <div style={{ width: '100%', maxWidth: '480px' }}>
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
            Activate Institutional Account
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {accountDetails?.schoolName || branding.shortName} • Access Onboarding
          </p>
        </div>

        <div
          className="ed-card ed-card-body"
          style={{ backgroundColor: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}
        >
          {verifying ? (
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>
                Validating your institutional invitation...
              </div>
            </div>
          ) : isSuccess ? (
            <div style={{ textAlign: 'center', padding: '16px 8px' }}>
              <CheckCircle2
                size={48}
                style={{ color: '#16a34a', margin: '0 auto 16px auto' }}
              />
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '8px' }}>
                Account Successfully Activated!
              </h2>
              <p
                style={{
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  marginBottom: '20px',
                }}
              >
                Welcome to <strong>{accountDetails?.schoolName || branding.shortName}</strong>. Your account is active and you can now log in with your credentials.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="ed-btn ed-btn-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                Proceed to Login
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
                    Invalid or Expired Invitation
                  </strong>
                  <span style={{ fontSize: '0.85rem', lineHeight: 1.5 }}>
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
                  style={{ textAlign: 'center', padding: '10px' }}
                >
                  Enter a Different Code
                </button>
                <Link
                  to="/login"
                  className="ed-btn ed-btn-primary"
                  style={{ textAlign: 'center', padding: '10px' }}
                >
                  Return to Login
                </Link>
              </div>
            </div>
          ) : !tokenValid ? (
            <div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                Enter the activation token from your welcome email or the <strong>ACT-XXXX-XXXX</strong> code provided by your school administrator:
              </p>
              <div className="ed-input-group" style={{ marginBottom: '16px' }}>
                <label className="ed-label">Activation Token or Code</label>
                <input
                  type="text"
                  className="ed-input"
                  placeholder="e.g. ACT-1234-5678 or paste token"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={() => performVerification(inputCode)}
                disabled={!inputCode.trim()}
                className="ed-btn ed-btn-primary"
                style={{ width: '100%', padding: '10px' }}
              >
                Validate Activation Code
                <Sparkles size={16} />
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {accountDetails && (
                <div
                  style={{
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '16px',
                    fontSize: '0.82rem',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '6px' }}>
                    <KeyRound size={16} style={{ color: 'var(--primary-600)' }} />
                    <span>Invitation Verified</span>
                  </div>
                  <div style={{ lineHeight: 1.6 }}>
                    <div><strong>Name:</strong> {accountDetails.recipientName}</div>
                    <div><strong>Email:</strong> {accountDetails.email}</div>
                    <div><strong>Assigned Role:</strong> <span style={{ textTransform: 'capitalize' }}>{accountDetails.role.toLowerCase().replace(/_/g, ' ')}</span></div>
                    <div><strong>Institution:</strong> {accountDetails.schoolName}</div>
                  </div>
                </div>
              )}

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Set your personal password to complete activation and access your portal:
              </p>

              <div className="ed-input-group" style={{ marginBottom: '14px' }}>
                <label className="ed-label">Create Password</label>
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
                    placeholder="Enter secure password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="ed-input-group" style={{ marginBottom: '16px' }}>
                <label className="ed-label">Confirm Password</label>
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
                    placeholder="Confirm your password"
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
                  Password Strength Requirements:
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
                {submitting ? 'Activating Account...' : 'Activate Account & Access ERP'}
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
            ← Already have an active account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};


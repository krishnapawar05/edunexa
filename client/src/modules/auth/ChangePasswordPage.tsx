import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, KeyRound, Eye, EyeOff } from 'lucide-react';
import { useSchoolBranding } from '../../context/SchoolBrandingContext.js';
import { changePasswordApi, getStoredUser, setAuthSession, getStoredAuthToken } from '../../services/api.js';
import { ThemeSwitcher } from '../../components/ThemeSwitcher.js';

export const ChangePasswordPage: React.FC = () => {
  const { branding } = useSchoolBranding();
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = getStoredUser();

  const isForced = Boolean((location.state as any)?.forced || currentUser?.mustChangePassword);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password Strength Indicators
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const differentFromCurrent = !currentPassword || currentPassword !== newPassword;

  const isFormValid =
    Boolean(currentPassword.trim()) &&
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch &&
    differentFromCurrent;

  const getDashboardPath = (role?: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return '/superadmin';
      case 'SCHOOL_ADMIN':
      case 'PRINCIPAL':
        return '/admin';
      case 'TEACHER':
        return '/teacher';
      case 'STUDENT':
        return '/student';
      case 'PARENT':
        return '/parent';
      case 'EXAM_COORDINATOR':
        return '/examinations';
      case 'HR_STAFF':
        return '/hr';
      case 'ACCOUNTS':
        return '/accounts';
      default:
        return '/';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    try {
      setSubmitting(true);
      setSubmitError(null);
      await changePasswordApi(currentPassword, newPassword);

      // Update cached session
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          mustChangePassword: false,
          passwordChangedAt: new Date().toISOString(),
        };
        const token = getStoredAuthToken();
        setAuthSession(token, updatedUser);
      }

      setIsSuccess(true);
      setTimeout(() => {
        const returnUrl = (location.state as any)?.from?.pathname || getDashboardPath(currentUser?.role);
        navigate(returnUrl, { replace: true });
      }, 2000);
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to change password. Please check your current password and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-primary, #f8fafc)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '24px',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <ThemeSwitcher />
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--border-default, #e2e8f0)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0, 0, 0, 0.1))',
          padding: '36px',
          margin: '0 auto',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              backgroundColor: 'var(--primary-50, #f0fdf4)',
              border: '1px solid var(--primary-200, #bbf7d0)',
              color: 'var(--primary-700, #15803d)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <KeyRound size={28} />
          </div>
          <h1
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary, #0f172a)',
              marginBottom: '6px',
            }}
          >
            {isForced ? 'Mandatory Password Update' : 'Change Your Password'}
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)' }}>
            {branding?.schoolName || 'EduNexa School ERP'} • Account Security & Access Control
          </p>
        </div>

        {isForced && (
          <div
            style={{
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={20} color="#b45309" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#92400e', marginBottom: '2px' }}>
                Password Reset by Administrator
              </p>
              <p style={{ fontSize: '12px', color: '#b45309', margin: 0, lineHeight: 1.4 }}>
                A temporary password was assigned to your account. For institutional security compliance, you must set a new confidential password before proceeding to your dashboard.
              </p>
            </div>
          </div>
        )}

        {isSuccess ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-100, #dcfce7)',
                color: 'var(--primary-700, #15803d)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary, #0f172a)', marginBottom: '8px' }}>
              Password Changed Successfully
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #64748b)', marginBottom: '24px' }}>
              Your credentials have been securely persisted. Redirecting you to your institutional workspace...
            </p>
            <button
              onClick={() => navigate(getDashboardPath(currentUser?.role), { replace: true })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-800, #166534)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Go to Dashboard Now <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {submitError && (
              <div
                style={{
                  backgroundColor: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  color: '#991b1b',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{submitError}</span>
              </div>
            )}

            {/* Current / Temporary Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0f172a)',
                  marginBottom: '6px',
                }}
              >
                {isForced ? 'Temporary Password' : 'Current Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current or temporary password"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    backgroundColor: 'var(--bg-primary, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary, #64748b)',
                    cursor: 'pointer',
                  }}
                >
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0f172a)',
                  marginBottom: '6px',
                }}
              >
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showNew ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Create a strong institutional password"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    backgroundColor: 'var(--bg-primary, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary, #64748b)',
                    cursor: 'pointer',
                  }}
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Password Strength Checklist */}
            <div
              style={{
                backgroundColor: 'var(--bg-secondary, #f8fafc)',
                borderRadius: '8px',
                padding: '12px',
                border: '1px solid var(--border-subtle, #f1f5f9)',
              }}
            >
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary, #64748b)', marginBottom: '8px' }}>
                Password Security Criteria:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: hasMinLength ? '#16a34a' : '#94a3b8' }}>
                  <CheckCircle2 size={13} color={hasMinLength ? '#16a34a' : '#cbd5e1'} /> 8+ Characters
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: hasUppercase ? '#16a34a' : '#94a3b8' }}>
                  <CheckCircle2 size={13} color={hasUppercase ? '#16a34a' : '#cbd5e1'} /> Uppercase letter
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: hasLowercase ? '#16a34a' : '#94a3b8' }}>
                  <CheckCircle2 size={13} color={hasLowercase ? '#16a34a' : '#cbd5e1'} /> Lowercase letter
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: hasNumber ? '#16a34a' : '#94a3b8' }}>
                  <CheckCircle2 size={13} color={hasNumber ? '#16a34a' : '#cbd5e1'} /> Numeric digit
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: hasSpecial ? '#16a34a' : '#94a3b8' }}>
                  <CheckCircle2 size={13} color={hasSpecial ? '#16a34a' : '#cbd5e1'} /> Special symbol
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: differentFromCurrent ? '#16a34a' : '#ef4444' }}>
                  <CheckCircle2 size={13} color={differentFromCurrent ? '#16a34a' : '#fca5a5'} /> Distinct from current
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary, #0f172a)',
                  marginBottom: '6px',
                }}
              >
                Confirm New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your new password"
                  style={{
                    width: '100%',
                    padding: '10px 40px 10px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-default, #cbd5e1)',
                    backgroundColor: 'var(--bg-primary, #ffffff)',
                    color: 'var(--text-primary, #0f172a)',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-secondary, #64748b)',
                    cursor: 'pointer',
                  }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword.length > 0 && !passwordsMatch && (
                <span style={{ fontSize: '11px', color: '#dc2626', marginTop: '4px', display: 'block' }}>
                  Passwords do not match.
                </span>
              )}
            </div>

            <button
              type="submit"
              disabled={!isFormValid || submitting}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '12px',
                borderRadius: '10px',
                backgroundColor: isFormValid && !submitting ? 'var(--primary-800, #166534)' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isFormValid && !submitting ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
            >
              {submitting ? (
                'Updating Credentials...'
              ) : (
                <>
                  <ShieldCheck size={18} /> Update Password & Access System
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

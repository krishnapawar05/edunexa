import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  KeyRound,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
} from 'lucide-react';
import { HealthCheckData } from '@edunexa/shared';
import { operationsApi, getStoredUser, changePasswordApi } from '../services/api.js';
import { ThemeSwitcher } from './ThemeSwitcher.js';

interface HeaderProps {
  currentRole: string;
  serverHealth?: HealthCheckData | null;
  onRefreshHealth?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  serverHealth: _serverHealth,
  onRefreshHealth: _onRefreshHealth,
  onToggleMobileMenu,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Change password modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Password rules
  const hasMinLength = newPassword.length >= 8;
  const hasUppercase = /[A-Z]/.test(newPassword);
  const hasLowercase = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isFormValid =
    currentPassword.length > 0 &&
    hasMinLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumber &&
    hasSpecial &&
    passwordsMatch;

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setSubmittingPassword(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await changePasswordApi(currentPassword, newPassword);
      setPasswordSuccess(res.message || 'Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordSuccess(null);
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to change password. Please verify current password.');
    } finally {
      setSubmittingPassword(false);
    }
  };

  const user = getStoredUser();
  const activeRole = user?.role || currentRole;

  const loadNotifications = async () => {
    try {
      const data = await operationsApi.listNotifications();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // unauthenticated or guest mode
    }
  };

  React.useEffect(() => {
    loadNotifications();
  }, [activeRole]);

  const handleMarkAllRead = async () => {
    try {
      await operationsApi.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  return (
    <header
      style={{
        height: 'var(--header-height)',
        backgroundColor: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-default)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 var(--space-6)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
      }}
    >
      {/* Left Area: Mobile Menu Toggle + Contextual Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', flex: 1, maxWidth: '440px' }}>
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="ed-btn-icon ed-mobile-toggle"
            aria-label="Toggle navigation menu"
            style={{ display: 'none' }}
          >
            <Menu size={20} />
          </button>
        )}

        <div
          style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '10px',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search records, students, classes, or policies... (Ctrl+K)"
            style={{
              width: '100%',
              padding: '6px 10px 6px 32px',
              fontSize: '0.86rem',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* Right Controls: Notifications, Global Theme Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Notifications Icon */}
        <div style={{ position: 'relative' }}>
          <button
            className="ed-btn-icon"
            onClick={() => setShowNotifications(!showNotifications)}
            title="Notifications & Alerts"
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--danger-solid)',
                }}
              />
            )}
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                width: '320px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: 'var(--space-4)',
                zIndex: 100,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 'var(--space-3)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>System Alerts</span>
                {unreadCount > 0 && (
                  <span
                    style={{
                      fontSize: '0.74rem',
                      color: 'var(--primary-700)',
                      cursor: 'pointer',
                    }}
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ fontSize: '0.80rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                    No active notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        fontSize: '0.80rem',
                        padding: '8px',
                        backgroundColor: n.isRead ? 'var(--bg-subtle)' : 'var(--primary-50)',
                        borderLeft: n.isRead ? '3px solid transparent' : '3px solid var(--primary-600)',
                        borderRadius: 'var(--radius-xs)',
                      }}
                    >
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem', marginTop: '2px' }}>
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Change Password Button */}
        <button
          onClick={() => {
            setShowChangePasswordModal(true);
            setPasswordError(null);
            setPasswordSuccess(null);
          }}
          className="ed-btn-icon"
          title="Account Security & Password"
          aria-label="Change Password"
          style={{ position: 'relative' }}
        >
          <KeyRound size={18} />
        </button>

        {/* Global Light / Dark / System Theme Switcher */}
        <ThemeSwitcher />
      </div>

      {/* Change Password Modal */}
      {showChangePasswordModal && (
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
                  Change Account Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(false)}
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
              {passwordSuccess ? (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '14px',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.90rem',
                  }}
                >
                  <CheckCircle2 size={22} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span>{passwordSuccess}</span>
                </div>
              ) : (
                <form onSubmit={handleChangePassword}>
                  <div className="ed-input-group" style={{ marginBottom: '14px' }}>
                    <label className="ed-label">Current Password</label>
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
                        placeholder="Enter current password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        autoComplete="current-password"
                      />
                    </div>
                  </div>

                  <div className="ed-input-group" style={{ marginBottom: '14px' }}>
                    <label className="ed-label">New Password</label>
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

                  {/* Checklist */}
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
                      Requirements:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                      <span style={{ color: hasMinLength ? '#16a34a' : 'var(--text-muted)' }}>
                        {hasMinLength ? '✓' : '○'} 8+ Characters
                      </span>
                      <span style={{ color: hasUppercase ? '#16a34a' : 'var(--text-muted)' }}>
                        {hasUppercase ? '✓' : '○'} Uppercase
                      </span>
                      <span style={{ color: hasLowercase ? '#16a34a' : 'var(--text-muted)' }}>
                        {hasLowercase ? '✓' : '○'} Lowercase
                      </span>
                      <span style={{ color: hasNumber ? '#16a34a' : 'var(--text-muted)' }}>
                        {hasNumber ? '✓' : '○'} Number
                      </span>
                      <span style={{ color: hasSpecial ? '#16a34a' : 'var(--text-muted)' }}>
                        {hasSpecial ? '✓' : '○'} Special Char
                      </span>
                      <span style={{ color: passwordsMatch ? '#16a34a' : 'var(--text-muted)' }}>
                        {passwordsMatch ? '✓' : '○'} Match
                      </span>
                    </div>
                  </div>

                  {passwordError && (
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
                      <span>{passwordError}</span>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                      type="button"
                      onClick={() => setShowChangePasswordModal(false)}
                      className="ed-btn ed-btn-outline"
                      style={{ padding: '8px 16px' }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!isFormValid || submittingPassword}
                      className="ed-btn ed-btn-primary"
                      style={{ padding: '8px 18px' }}
                    >
                      {submittingPassword ? 'Updating...' : 'Update Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

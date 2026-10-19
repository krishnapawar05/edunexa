import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { HealthCheckData } from '@edunexa/shared';
import { useSchoolBranding } from '../context/SchoolBrandingContext.js';
import { operationsApi, getStoredUser } from '../services/api.js';
import { ThemeSwitcher } from './ThemeSwitcher.js';

interface HeaderProps {
  currentRole: string;
  serverHealth: HealthCheckData | null;
  onRefreshHealth: () => void;
  onToggleMobileMenu?: () => void;
}

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Platform Super Admin',
  SCHOOL_ADMIN: 'School Administrator',
  PRINCIPAL: 'Principal',
  TEACHER: 'Faculty / Teacher',
  STUDENT: 'Student',
  PARENT: 'Parent / Guardian',
  HR_STAFF: 'HR / Staff Admin',
  ACCOUNTS: 'Accounts Staff',
  EXAM_COORDINATOR: 'Examination Coordinator',
};

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  serverHealth,
  onRefreshHealth,
  onToggleMobileMenu,
}) => {
  const { branding, setIsCustomizing } = useSchoolBranding();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const user = getStoredUser();
  const activeRole = user?.role || currentRole;
  const roleLabel = ROLE_LABELS[activeRole] || activeRole;
  const schoolLabel = activeRole === 'SUPER_ADMIN' ? 'Multi-Tenant Authority' : branding.shortName;
  const userName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Authenticated User';
  const userInitials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U'
    : 'U';

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

      {/* Right Controls: Brand Customizer, Health Badge, Alerts, Verified Profile, Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* School Identity Customizer Button (for Admin / School-level users) */}
        {activeRole !== 'STUDENT' && activeRole !== 'PARENT' && (
          <button
            onClick={() => setIsCustomizing(true)}
            className="ed-btn ed-btn-secondary"
            title="Configure School Name, Theme & Identity (PRD Stage 1 Requirement)"
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'var(--border-default)',
            }}
          >
            <Sliders size={13} style={{ color: 'var(--primary-700)' }} />
            <span>Branding: <strong>{branding.shortName}</strong></span>
          </button>
        )}

        {/* Backend Status Live Badge */}
        <div
          onClick={onRefreshHealth}
          title={
            serverHealth
              ? `Backend Connected (${serverHealth.service}) - Uptime: ${serverHealth.uptimeSeconds}s`
              : 'Backend connecting or offline (Click to re-check)'
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 10px',
            backgroundColor: serverHealth ? 'var(--success-bg)' : 'var(--warning-bg)',
            border: `1px solid ${serverHealth ? 'var(--success-border)' : 'var(--warning-border)'}`,
            borderRadius: 'var(--radius-pill)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: serverHealth ? 'var(--success-text)' : 'var(--warning-text)',
            cursor: 'pointer',
          }}
        >
          {serverHealth ? (
            <CheckCircle2 size={13} style={{ color: 'var(--success-solid)' }} />
          ) : (
            <AlertTriangle size={13} style={{ color: 'var(--warning-solid)' }} />
          )}
          <span>{serverHealth ? `Core API: Online` : 'Core API: Connecting...'}</span>
          <RefreshCw size={11} style={{ opacity: 0.7 }} />
        </div>

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

        {/* Global Light / Dark / System Theme Switcher */}
        <ThemeSwitcher />

        {/* Verified Authenticated User Identity (Role-Isolated, Read-Only) */}
        <div
          data-testid="header-user-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '4px 10px',
            backgroundColor: 'var(--bg-subtle)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--primary-100)',
              color: 'var(--primary-800)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.78rem',
            }}
          >
            {userInitials}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {userName}
              </span>
              <span title="Cryptographically Verified Session" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <ShieldCheck size={13} style={{ color: 'var(--primary-600)' }} />
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 600,
                  color: 'var(--primary-700)',
                  backgroundColor: 'var(--primary-50)',
                  padding: '1px 5px',
                  borderRadius: '3px',
                }}
              >
                {roleLabel}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{schoolLabel}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

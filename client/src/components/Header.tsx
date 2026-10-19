import React, { useState } from 'react';
import {
  Search,
  Bell,
  Shield,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Menu,
  Building2,
} from 'lucide-react';
import { HealthCheckData } from '@edunexa/shared';
import { useSchoolBranding } from '../context/SchoolBrandingContext.js';
import { demoLoginForRole, operationsApi } from '../services/api.js';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  serverHealth: HealthCheckData | null;
  onRefreshHealth: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  serverHealth,
  onRefreshHealth,
  onToggleMobileMenu,
}) => {
  const { branding, setIsCustomizing } = useSchoolBranding();
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

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
  }, [currentRole]);

  const handleMarkAllRead = async () => {
    try {
      await operationsApi.markAllNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.warn('Failed to mark read:', err);
    }
  };

  const roles = [
    { id: 'SUPER_ADMIN', label: 'Platform Super Admin', school: 'Multi-Tenant Authority' },
    { id: 'SCHOOL_ADMIN', label: 'School Admin / Principal', school: branding.shortName },
    { id: 'TEACHER', label: 'Teacher (Dr. Thorne)', school: 'Grade 10 Physics' },
    { id: 'STUDENT', label: 'Student (Aarav Sharma)', school: `Grade 10-A (#ADM-2026-042)` },
    { id: 'PARENT', label: 'Parent / Guardian', school: 'Children: Aarav & Maya' },
    { id: 'EXAM_COORDINATOR', label: 'Examination Coordinator', school: 'Exam Workspace & Audit' },
    { id: 'HR_STAFF', label: 'HR / Staff Admin', school: 'Faculty & Leave Registry' },
    { id: 'ACCOUNTS', label: 'Accounts Staff', school: 'Fee Ledger & Invoicing' },
    { id: 'PUBLIC', label: 'Public School Website', school: `${branding.shortName} Portal` },
    { id: 'VERIFY_CARD', label: 'Public ID Card Verification', school: 'Anti-Tamper QR Gateway' },
  ];

  const currentRoleObj = roles.find((r) => r.id === currentRole) || roles[1];

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

      {/* Right Controls: Brand Customizer, Health Badge, Role Switcher, Alerts, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* School Identity Customizer Button */}
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
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
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

        {/* Role Fast-Switcher Menu */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '4px 10px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: 'var(--primary-50)',
                color: 'var(--primary-700)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.80rem',
              }}
            >
              {currentRoleObj.label[0]}
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {currentRoleObj.label}
              </div>
              <div style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{currentRoleObj.school}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 6px)',
                width: '280px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '8px',
                zIndex: 100,
                maxHeight: '440px',
                overflowY: 'auto',
              }}
            >
              <div
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  padding: '6px 8px',
                }}
              >
                Switch User Role (8 PRD Roles)
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={async () => {
                    if (r.id !== 'PUBLIC' && r.id !== 'VERIFY_CARD') {
                      await demoLoginForRole(r.id);
                    }
                    onRoleChange(r.id);
                    setShowRoleMenu(false);
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    backgroundColor: r.id === currentRole ? 'var(--primary-50)' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: r.id === currentRole ? 700 : 500,
                      color: r.id === currentRole ? 'var(--primary-700)' : 'var(--text-primary)',
                    }}
                  >
                    {r.label}
                  </span>
                  <span style={{ fontSize: '0.70rem', color: 'var(--text-muted)' }}>{r.school}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

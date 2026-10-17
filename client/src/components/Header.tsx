import React, { useState } from 'react';
import { Search, Bell, Shield, ChevronDown, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { HealthCheckData } from '@edunexa/shared';

interface HeaderProps {
  currentRole: string;
  onRoleChange: (role: string) => void;
  serverHealth: HealthCheckData | null;
  onRefreshHealth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  serverHealth,
  onRefreshHealth,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roles = [
    { id: 'SUPER_ADMIN', label: 'Platform Super Admin', school: 'System-Wide' },
    { id: 'SCHOOL_ADMIN', label: 'School Admin', school: 'Apex Academy' },
    { id: 'TEACHER', label: 'Teacher (Dr. Thorne)', school: 'Grade 10 Physics' },
    { id: 'STUDENT', label: 'Student (Aarav Sharma)', school: 'Grade 10-A (#ADM-2026-042)' },
    { id: 'PUBLIC', label: 'Public School Website', school: 'Apex Academy Portal' },
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
      {/* Contextual Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', width: '380px' }}>
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

      {/* Right Controls: Backend Connectivity, Role Switcher, Alerts, Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
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
          <span>{serverHealth ? `Core API: Online (${serverHealth.status})` : 'Core API: Connecting...'}</span>
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
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                width: '320px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: 'var(--space-3)',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--space-2)',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: 'var(--space-2)',
                }}
              >
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>System Alerts</span>
                <span className="ed-badge ed-badge-info">3 New</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.8rem' }}>
                <div style={{ padding: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Unit Test Marks Submitted</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Grade 10 Physics marks entered by Dr. Thorne</p>
                </div>
                <div style={{ padding: '6px', backgroundColor: 'var(--bg-subtle)', borderRadius: '4px' }}>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)' }}>New Admission Application</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>Student Rohan Verma applied for Grade 11 Science</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Pill */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              padding: '6px 12px',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <Shield size={15} style={{ color: 'var(--primary-600)' }} />
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {currentRoleObj.label}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{currentRoleObj.school}</div>
            </div>
            <ChevronDown size={14} style={{ color: 'var(--text-muted)', marginLeft: '4px' }} />
          </button>

          {showRoleMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '110%',
                width: '260px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                padding: '6px',
                zIndex: 50,
              }}
            >
              <div
                style={{
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                  padding: '6px 8px',
                }}
              >
                Switch Demonstration Role
              </div>
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => {
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
                      fontSize: '0.84rem',
                      fontWeight: r.id === currentRole ? 700 : 500,
                      color: r.id === currentRole ? 'var(--primary-700)' : 'var(--text-primary)',
                    }}
                  >
                    {r.label}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.school}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  CalendarCheck,
  FileQuestion,
  Award,
  CreditCard,
  Bell,
  Settings,
  LogOut,
  ExternalLink,
  BookOpen,
  IdCard,
  Layers,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  currentRole: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onGoPublic: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onLogout,
  onGoPublic,
}) => {
  // Navigation structure tailored strictly to each role per PRD
  const getNavItems = () => {
    switch (currentRole) {
      case 'SUPER_ADMIN':
        return [
          { id: 'overview', label: 'Platform Telemetry', icon: LayoutDashboard },
          { id: 'schools', label: 'School Tenants', icon: Building2 },
          { id: 'subscriptions', label: 'Subscriptions & Plans', icon: CreditCard },
          { id: 'audit', label: 'Administrative Audit Logs', icon: Layers },
          { id: 'settings', label: 'Platform Settings', icon: Settings },
        ];
      case 'SCHOOL_ADMIN':
        return [
          { id: 'overview', label: 'School Overview', icon: LayoutDashboard },
          { id: 'students', label: 'Student Directory & SIS', icon: GraduationCap },
          { id: 'staff', label: 'Faculty & HR', icon: Users },
          { id: 'id-cards', label: 'Virtual ID Cards & QR', icon: IdCard },
          { id: 'attendance', label: 'Daily Attendance', icon: CalendarCheck },
          { id: 'finance', label: 'Fees & Invoices', icon: CreditCard },
          { id: 'notices', label: 'Events & Notices', icon: Bell },
        ];
      case 'TEACHER':
        return [
          { id: 'overview', label: 'Teacher Schedule', icon: LayoutDashboard },
          { id: 'attendance', label: 'Mark Attendance', icon: CalendarCheck },
          { id: 'quizzes', label: 'Online Quizzes', icon: FileQuestion },
          { id: 'examinations', label: 'Exam Marks Entry', icon: Award },
          { id: 'resources', label: 'Study Resources', icon: BookOpen },
        ];
      case 'STUDENT':
        return [
          { id: 'overview', label: 'Student Dashboard', icon: LayoutDashboard },
          { id: 'id-card', label: 'My Virtual ID Card', icon: IdCard },
          { id: 'quizzes', label: 'Assessments & Quizzes', icon: FileQuestion },
          { id: 'results', label: 'Academic Results', icon: Award },
          { id: 'ai-tutor', label: 'AI Learning Assistant', icon: Sparkles },
        ];
      default:
        return [
          { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--bg-dark-sidebar)',
        color: 'var(--text-inverse)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        userSelect: 'none',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: 'var(--space-5) var(--space-5) var(--space-4)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              backgroundColor: 'var(--primary-600)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '1.1rem',
              color: '#ffffff',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            E
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
              EduNexa
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-inverse-muted)', letterSpacing: '0.04em' }}>
              SCHOOL ERP & AI
            </div>
          </div>
        </div>

        {/* Tenant Chip */}
        <div
          style={{
            marginTop: 'var(--space-3)',
            padding: '4px 8px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            borderRadius: 'var(--radius-xs)',
            fontSize: '0.72rem',
            color: '#93c5fd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{currentRole === 'SUPER_ADMIN' ? 'Platform Authority' : 'Apex Academy (APX-01)'}</span>
          <span style={{ fontSize: '0.66rem', color: '#60a5fa', textTransform: 'uppercase' }}>Active</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav style={{ flex: 1, padding: 'var(--space-3) var(--space-3)', overflowY: 'auto' }}>
        <div
          style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--text-inverse-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            padding: '8px 10px 4px',
          }}
        >
          Operational Workspace
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-3)',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: isActive ? 'var(--primary-700)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-inverse-muted)',
                  border: 'none',
                  fontSize: '0.86rem',
                  fontWeight: isActive ? 600 : 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.12s ease, color 0.12s ease',
                  width: '100%',
                }}
              >
                <Icon size={16} style={{ color: isActive ? '#ffffff' : '#94a3b8' }} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer Navigation: Public School Link & User Account */}
      <div
        style={{
          padding: 'var(--space-3)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <button
          onClick={onGoPublic}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 'var(--radius-sm)',
            color: '#cbd5e1',
            fontSize: '0.78rem',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <span>View Public Website</span>
          <ExternalLink size={13} />
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 4px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#f8fafc',
              }}
            >
              {currentRole.slice(0, 2)}
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f8fafc' }}>
                {currentRole === 'SUPER_ADMIN' ? 'Administrator' : 'Dr. Thorne'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Session Active</div>
            </div>
          </div>
          <button
            onClick={onLogout}
            title="Log out of session"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

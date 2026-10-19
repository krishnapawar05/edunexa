import React from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
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
  ClipboardList,
  UserCheck,
  FileSpreadsheet,
  CheckCircle2,
  Receipt,
  FileCheck,
  X,
} from 'lucide-react';
import { useSchoolBranding } from '../context/SchoolBrandingContext.js';

interface SidebarProps {
  currentRole: string;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  onLogout?: () => void;
  onGoPublic?: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onTabChange,
  onLogout,
  onGoPublic,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const { branding } = useSchoolBranding();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavItems = () => {
    switch (currentRole) {
      case 'SUPER_ADMIN':
        return [
          { id: 'overview', path: '/superadmin', label: 'Platform Telemetry', icon: LayoutDashboard },
          { id: 'schools', path: '/superadmin/schools', label: 'School Tenants', icon: Building2 },
          { id: 'subscriptions', path: '/superadmin/subscriptions', label: 'Subscriptions & Plans', icon: CreditCard },
          { id: 'audit', path: '/superadmin/audit', label: 'Administrative Audit Logs', icon: Layers },
          { id: 'settings', path: '/superadmin/settings', label: 'Platform Settings', icon: Settings },
        ];
      case 'SCHOOL_ADMIN':
        return [
          { id: 'overview', path: '/admin', label: 'School Overview', icon: LayoutDashboard },
          { id: 'students', path: '/admin/students', label: 'Student Directory & SIS', icon: GraduationCap },
          { id: 'admissions', path: '/admin/admissions', label: 'Admissions Review Queue', icon: FileCheck },
          { id: 'staff', path: '/admin/staff', label: 'Faculty & HR', icon: Users },
          { id: 'id-cards', path: '/admin/id-cards', label: 'Virtual ID Cards & QR', icon: IdCard },
          { id: 'attendance', path: '/admin/attendance', label: 'Daily Attendance', icon: CalendarCheck },
          { id: 'finance', path: '/admin/finance', label: 'Fees & Invoices', icon: CreditCard },
          { id: 'notices', path: '/admin/notices', label: 'Events & Notices', icon: Bell },
        ];
      case 'TEACHER':
        return [
          { id: 'overview', path: '/teacher', label: 'Teacher Schedule', icon: LayoutDashboard },
          { id: 'attendance', path: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck },
          { id: 'quizzes', path: '/teacher/quizzes', label: 'Online Quizzes', icon: FileQuestion },
          { id: 'examinations', path: '/teacher/examinations', label: 'Exam Marks Entry', icon: Award },
          { id: 'resources', path: '/teacher/resources', label: 'Study Resources', icon: BookOpen },
        ];
      case 'STUDENT':
        return [
          { id: 'overview', path: '/student', label: 'Student Dashboard', icon: LayoutDashboard },
          { id: 'id-card', path: '/student/id-card', label: 'My Virtual ID Card', icon: IdCard },
          { id: 'quizzes', path: '/student/quizzes', label: 'Assessments & Quizzes', icon: FileQuestion },
          { id: 'results', path: '/student/results', label: 'Academic Results', icon: Award },
          { id: 'ai-tutor', path: '/student/ai-tutor', label: 'AI Learning Assistant', icon: Sparkles },
        ];
      case 'PARENT':
        return [
          { id: 'overview', path: '/parent', label: 'Parent Dashboard', icon: LayoutDashboard },
          { id: 'results', path: '/parent/results', label: 'Published Report Cards', icon: Award },
          { id: 'attendance', path: '/parent/attendance', label: 'Attendance Records', icon: CalendarCheck },
          { id: 'fees', path: '/parent/fees', label: 'Fee Payments & Invoices', icon: CreditCard },
          { id: 'notices', path: '/parent/notices', label: 'School Notices', icon: Bell },
        ];
      case 'EXAM_COORDINATOR':
        return [
          { id: 'overview', path: '/examinations', label: 'Exam Workspace', icon: LayoutDashboard },
          { id: 'schedules', path: '/examinations/schedules', label: 'Examination Schedules', icon: FileSpreadsheet },
          { id: 'marks-audit', path: '/examinations/marks-audit', label: 'Marks Entry Audit', icon: Award },
          { id: 'grading', path: '/examinations/grading', label: 'Grading Schemes', icon: Layers },
          { id: 'publish', path: '/examinations/publish', label: 'Publish Results', icon: CheckCircle2 },
        ];
      case 'HR_STAFF':
        return [
          { id: 'overview', path: '/hr', label: 'HR Directory', icon: LayoutDashboard },
          { id: 'employees', path: '/hr/employees', label: 'Staff Records', icon: Users },
          { id: 'leaves', path: '/hr/leaves', label: 'Leave Requests', icon: CalendarCheck },
          { id: 'training', path: '/hr/training', label: 'Staff Training Quizzes', icon: FileQuestion },
        ];
      case 'ACCOUNTS':
        return [
          { id: 'overview', path: '/accounts', label: 'Financial Overview', icon: LayoutDashboard },
          { id: 'invoices', path: '/accounts/invoices', label: 'Student Invoices', icon: CreditCard },
          { id: 'structures', path: '/accounts/structures', label: 'Fee Structures', icon: FileSpreadsheet },
          { id: 'reconciliation', path: '/accounts/reconciliation', label: 'Bank Reconciliations', icon: Receipt },
        ];
      default:
        return [
          { id: 'overview', path: '/admin', label: 'Overview', icon: LayoutDashboard },
        ];
    }
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('edunexa_access_token');
      localStorage.removeItem('edunexa_token');
      localStorage.removeItem('edunexa_user');
      navigate('/login');
    }
  };

  const isExactRootPath = (path: string) => {
    return [
      '/superadmin',
      '/admin',
      '/teacher',
      '/student',
      '/parent',
      '/examinations',
      '/hr',
      '/accounts',
    ].includes(path);
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 49,
          }}
        />
      )}

      {/* Sidebar Aside */}
      <aside
        className={`ed-sidebar ${isOpenMobile ? 'ed-sidebar-mobile-open' : ''}`}
        style={{
          width: 'var(--sidebar-width)',
          minWidth: 'var(--sidebar-width)',
          backgroundColor: 'var(--ink-900)',
          color: 'var(--text-inverse)',
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          userSelect: 'none',
          transition: 'transform 0.25s ease-in-out',
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                backgroundColor: branding.primaryAccent,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                color: '#ffffff',
              }}
            >
              {branding.monogram}
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                EduNexa
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-inverse-muted)', letterSpacing: '0.04em' }}>
                SCHOOL ERP & AI
              </div>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="ed-btn-icon ed-mobile-close"
              aria-label="Close menu"
              style={{ color: '#94a3b8', display: 'none' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Tenant Chip */}
        <div style={{ padding: '0 var(--space-5)', marginTop: 'var(--space-3)' }}>
          <div
            style={{
              padding: '5px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              borderRadius: 'var(--radius-xs)',
              fontSize: '0.72rem',
              color: '#93c5fd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}>
              {currentRole === 'SUPER_ADMIN' ? 'Platform Authority' : `${branding.shortName} (${branding.code})`}
            </span>
            <span style={{ fontSize: '0.66rem', color: '#34d399', textTransform: 'uppercase', fontWeight: 700 }}>
              Active
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav style={{ flex: 1, padding: 'var(--space-3)', overflowY: 'auto' }}>
          <div
            style={{
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--text-inverse-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              padding: '6px 8px 4px',
            }}
          >
            {currentRole.replace('_', ' ')} Navigation
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  end={isExactRootPath(item.path)}
                  onClick={() => {
                    if (onTabChange) onTabChange(item.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-inverse-muted)',
                    textDecoration: 'none',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 600 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.12s ease, color 0.12s ease',
                    width: '100%',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} style={{ color: isActive ? '#38bdf8' : '#94a3b8' }} />
                      <span>{item.label}</span>
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Footer Navigation */}
        <div
          style={{
            padding: 'var(--space-3)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
          }}
        >
          {onGoPublic ? (
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
          ) : (
            <Link
              to="/"
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
                textDecoration: 'none',
                width: '100%',
              }}
            >
              <span>View Public Website</span>
              <ExternalLink size={13} />
            </Link>
          )}

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
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  backgroundColor: '#334155',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: '#f8fafc',
                }}
              >
                {currentRole.slice(0, 2)}
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
                  Session Active
                </div>
                <div style={{ fontSize: '0.66rem', color: '#94a3b8' }}>{currentRole}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log out of session"
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

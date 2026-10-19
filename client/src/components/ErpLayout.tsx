import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { SchoolIdentityModal } from './SchoolIdentityModal.js';
import { fetchServerHealth, demoLoginForRole, getStoredUser } from '../services/api.js';
import { HealthCheckData } from '@edunexa/shared';

interface ErpLayoutProps {
  forcedRole?: string;
}

export const ErpLayout: React.FC<ErpLayoutProps> = ({ forcedRole }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [serverHealth, setServerHealth] = useState<HealthCheckData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Determine current active role from pathname or user session
  const determineCurrentRole = (): string => {
    if (forcedRole) return forcedRole;
    const path = location.pathname;
    if (path.startsWith('/superadmin')) return 'SUPER_ADMIN';
    if (path.startsWith('/teacher')) return 'TEACHER';
    if (path.startsWith('/student')) return 'STUDENT';
    if (path.startsWith('/parent')) return 'PARENT';
    if (path.startsWith('/examinations')) return 'EXAM_COORDINATOR';
    if (path.startsWith('/hr')) return 'HR_STAFF';
    if (path.startsWith('/accounts')) return 'ACCOUNTS';
    if (path.startsWith('/admin')) return 'SCHOOL_ADMIN';

    const user = getStoredUser();
    return user?.role || 'SCHOOL_ADMIN';
  };

  const currentRole = determineCurrentRole();

  const loadHealth = async () => {
    const health = await fetchServerHealth();
    setServerHealth(health);
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = async (newRole: string) => {
    if (newRole === 'PUBLIC') {
      navigate('/');
      return;
    }
    if (newRole === 'VERIFY_CARD') {
      navigate('/verify-id');
      return;
    }
    if (newRole === 'LOGIN') {
      navigate('/login');
      return;
    }

    await demoLoginForRole(newRole);

    const roleToRouteMap: Record<string, string> = {
      SUPER_ADMIN: '/superadmin',
      SCHOOL_ADMIN: '/admin',
      TEACHER: '/teacher',
      STUDENT: '/student',
      PARENT: '/parent',
      EXAM_COORDINATOR: '/examinations',
      HR_STAFF: '/hr',
      ACCOUNTS: '/accounts',
    };

    navigate(roleToRouteMap[newRole] || '/admin');
    setIsMobileMenuOpen(false);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Dynamic School Identity Configuration Modal */}
      <SchoolIdentityModal />

      {/* Persistent Left Sidebar with React Router NavLinks */}
      <Sidebar
        currentRole={currentRole}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Persistent Top Header */}
        <Header
          currentRole={currentRole}
          onRoleChange={handleRoleChange}
          serverHealth={serverHealth}
          onRefreshHealth={loadHealth}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Dashboard Workspaces Outlet */}
        <main style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

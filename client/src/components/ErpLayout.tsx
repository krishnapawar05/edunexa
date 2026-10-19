import React, { useState, useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.js';
import { Header } from './Header.js';
import { SchoolIdentityModal } from './SchoolIdentityModal.js';
import { fetchServerHealth, getStoredUser } from '../services/api.js';
import { HealthCheckData } from '@edunexa/shared';

export const ErpLayout: React.FC = () => {
  const location = useLocation();
  const [serverHealth, setServerHealth] = useState<HealthCheckData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const user = getStoredUser();

  // If session is absent, redirect to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const authenticatedRole = user.role;

  const loadHealth = async () => {
    const health = await fetchServerHealth();
    setServerHealth(health);
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 20000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Dynamic School Identity Configuration Modal */}
      <SchoolIdentityModal />

      {/* Persistent Left Sidebar with React Router NavLinks */}
      <Sidebar
        currentRole={authenticatedRole}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Persistent Top Header */}
        <Header
          currentRole={authenticatedRole}
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

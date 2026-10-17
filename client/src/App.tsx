import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { PublicSchoolWebsite } from './modules/public/PublicSchoolWebsite.js';
import { LoginPage } from './modules/auth/LoginPage.js';
import { SuperAdminDashboard } from './modules/superadmin/SuperAdminDashboard.js';
import { SchoolAdminDashboard } from './modules/schooladmin/SchoolAdminDashboard.js';
import { TeacherDashboard } from './modules/teacher/TeacherDashboard.js';
import { StudentDashboard } from './modules/student/StudentDashboard.js';
import { fetchServerHealth } from './services/api.js';
import { HealthCheckData } from '@edunexa/shared';

export const App: React.FC = () => {
  // Navigation State
  const [currentView, setCurrentView] = useState<string>('SCHOOL_ADMIN');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [serverHealth, setServerHealth] = useState<HealthCheckData | null>(null);

  // Poll server health on boot
  const loadHealth = async () => {
    const health = await fetchServerHealth();
    setServerHealth(health);
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = (newRole: string) => {
    setCurrentView(newRole);
    setActiveTab('overview');
  };

  // If in Public Website mode, render the public school landing
  if (currentView === 'PUBLIC') {
    return <PublicSchoolWebsite onGoToLogin={() => setCurrentView('LOGIN')} />;
  }

  // If in Login mode, render the institutional login page
  if (currentView === 'LOGIN') {
    return (
      <LoginPage
        onLoginSuccess={(role) => setCurrentView(role)}
        onGoToPublic={() => setCurrentView('PUBLIC')}
      />
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentRole={currentView}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={() => setCurrentView('LOGIN')}
        onGoPublic={() => setCurrentView('PUBLIC')}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Persistent Top Header */}
        <Header
          currentRole={currentView}
          onRoleChange={handleRoleChange}
          serverHealth={serverHealth}
          onRefreshHealth={loadHealth}
        />

        {/* Dashboard Workspaces */}
        <main style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>
          {currentView === 'SUPER_ADMIN' && <SuperAdminDashboard />}
          {currentView === 'SCHOOL_ADMIN' && <SchoolAdminDashboard />}
          {currentView === 'TEACHER' && <TeacherDashboard />}
          {currentView === 'STUDENT' && <StudentDashboard />}
        </main>
      </div>
    </div>
  );
};

export default App;

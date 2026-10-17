import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { SchoolIdentityModal } from './components/SchoolIdentityModal.js';
import { PublicSchoolWebsite } from './modules/public/PublicSchoolWebsite.js';
import { LoginPage } from './modules/auth/LoginPage.js';
import { SuperAdminDashboard } from './modules/superadmin/SuperAdminDashboard.js';
import { SchoolAdminDashboard } from './modules/schooladmin/SchoolAdminDashboard.js';
import { TeacherDashboard } from './modules/teacher/TeacherDashboard.js';
import { StudentDashboard } from './modules/student/StudentDashboard.js';
import { ParentDashboard } from './modules/parent/ParentDashboard.js';
import { ExaminationWorkflow } from './modules/examinations/ExaminationWorkflow.js';
import { HrStaffDashboard } from './modules/hr/HrStaffDashboard.js';
import { AccountsDashboard } from './modules/accounts/AccountsDashboard.js';
import { PublicIdCardVerification } from './modules/public/PublicIdCardVerification.js';
import { fetchServerHealth } from './services/api.js';
import { HealthCheckData } from '@edunexa/shared';

export const App: React.FC = () => {
  // Navigation State across 8 PRD roles + PUBLIC + LOGIN + VERIFY_CARD
  const [currentView, setCurrentView] = useState<string>('SCHOOL_ADMIN');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [serverHealth, setServerHealth] = useState<HealthCheckData | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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
    setIsMobileMenuOpen(false);
  };

  // If in Public Website mode, render the public school landing
  if (currentView === 'PUBLIC') {
    return (
      <>
        <PublicSchoolWebsite
          onGoToLogin={() => setCurrentView('LOGIN')}
          onGoToVerify={() => setCurrentView('VERIFY_CARD')}
        />
        <SchoolIdentityModal />
      </>
    );
  }

  // If in ID Card Verification mode, render the anti-tamper QR gateway
  if (currentView === 'VERIFY_CARD') {
    return (
      <>
        <PublicIdCardVerification
          onBackToPublic={() => setCurrentView('PUBLIC')}
        />
        <SchoolIdentityModal />
      </>
    );
  }

  // If in Login mode, render the institutional login page
  if (currentView === 'LOGIN') {
    return (
      <>
        <LoginPage
          onLoginSuccess={(role) => setCurrentView(role)}
          onGoToPublic={() => setCurrentView('PUBLIC')}
        />
        <SchoolIdentityModal />
      </>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Dynamic School Identity Configuration Modal (PRD Stage 1 Requirement) */}
      <SchoolIdentityModal />

      {/* Persistent Left Sidebar with Mobile Drawer support */}
      <Sidebar
        currentRole={currentView}
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={() => setCurrentView('LOGIN')}
        onGoPublic={() => setCurrentView('PUBLIC')}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Persistent Top Header */}
        <Header
          currentRole={currentView}
          onRoleChange={handleRoleChange}
          serverHealth={serverHealth}
          onRefreshHealth={loadHealth}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Dashboard Workspaces (all 8 roles supported) */}
        <main style={{ flex: 1, padding: 'var(--space-6)', overflowY: 'auto' }}>
          {currentView === 'SUPER_ADMIN' && <SuperAdminDashboard />}
          {currentView === 'SCHOOL_ADMIN' && <SchoolAdminDashboard />}
          {currentView === 'TEACHER' && <TeacherDashboard />}
          {currentView === 'STUDENT' && <StudentDashboard />}
          {currentView === 'PARENT' && <ParentDashboard />}
          {currentView === 'EXAM_COORDINATOR' && <ExaminationWorkflow />}
          {currentView === 'HR_STAFF' && <HrStaffDashboard />}
          {currentView === 'ACCOUNTS' && <AccountsDashboard />}
        </main>
      </div>
    </div>
  );
};

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts & Security Guards
import { PublicLayout } from './modules/public/PublicLayout.js';
import { ErpLayout } from './components/ErpLayout.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';
import { NotFoundPage } from './components/NotFoundPage.js';

// Standalone Public & Auth Pages
import { LoginPage } from './modules/auth/LoginPage.js';
import { RegisterPage } from './modules/auth/RegisterPage.js';
import { PublicIdCardVerification } from './modules/public/PublicIdCardVerification.js';

// Public School Website Subpages
import { HomePage } from './modules/public/pages/HomePage.js';
import { AboutPage } from './modules/public/pages/AboutPage.js';
import { PrincipalMessagePage } from './modules/public/pages/PrincipalMessagePage.js';
import { AcademicsPage } from './modules/public/pages/AcademicsPage.js';
import { DepartmentsPage } from './modules/public/pages/DepartmentsPage.js';
import { AdmissionsPage } from './modules/public/pages/AdmissionsPage.js';
import { FacultyPage } from './modules/public/pages/FacultyPage.js';
import { EventsPage } from './modules/public/pages/EventsPage.js';
import { NewsPage } from './modules/public/pages/NewsPage.js';
import { GalleryPage } from './modules/public/pages/GalleryPage.js';
import { ExaminationInfoPage } from './modules/public/pages/ExaminationInfoPage.js';
import { ContactPage } from './modules/public/pages/ContactPage.js';
import { CareersPage } from './modules/public/pages/CareersPage.js';

// ERP Role Dashboards & Pages
import { SuperAdminDashboard } from './modules/superadmin/SuperAdminDashboard.js';
import { SchoolAdminDashboard } from './modules/schooladmin/SchoolAdminDashboard.js';
import { StudentDossierPage } from './modules/schooladmin/StudentDossierPage.js';
import { TeacherDashboard } from './modules/teacher/TeacherDashboard.js';
import { StudentDashboard } from './modules/student/StudentDashboard.js';
import { ParentDashboard } from './modules/parent/ParentDashboard.js';
import { ExaminationWorkflow } from './modules/examinations/ExaminationWorkflow.js';
import { HrStaffDashboard } from './modules/hr/HrStaffDashboard.js';
import { AccountsDashboard } from './modules/accounts/AccountsDashboard.js';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ================================================================ */}
        {/* 1. PUBLIC SCHOOL WEBSITE PAGES (Nested in PublicLayout)           */}
        {/* ================================================================ */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="principal-message" element={<PrincipalMessagePage />} />
          <Route path="academics" element={<AcademicsPage />} />
          <Route path="departments" element={<DepartmentsPage />} />
          <Route path="admissions" element={<AdmissionsPage />} />
          <Route path="faculty" element={<FacultyPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="news" element={<NewsPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="examination-info" element={<ExaminationInfoPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="careers" element={<CareersPage />} />
        </Route>

        {/* ================================================================ */}
        {/* 2. STANDALONE PUBLIC & AUTHENTICATION ROUTES                     */}
        {/* ================================================================ */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-id" element={<PublicIdCardVerification />} />
        <Route path="/verify-id/:token" element={<PublicIdCardVerification />} />

        {/* ================================================================ */}
        {/* 3. ROLE-SPECIFIC ERP PAGE HIERARCHY                              */}
        {/* ================================================================ */}

        {/* Super Admin Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/superadmin" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/schools" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/subscriptions" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/audit" element={<SuperAdminDashboard />} />
          <Route path="/superadmin/settings" element={<SuperAdminDashboard />} />
        </Route>

        {/* School Admin & Principal Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<SchoolAdminDashboard initialTab="students" />} />
          <Route path="/admin/students" element={<SchoolAdminDashboard initialTab="students" />} />
          <Route path="/admin/students/:id" element={<StudentDossierPage />} />
          <Route path="/admin/admissions" element={<SchoolAdminDashboard initialTab="admissions" />} />
          <Route path="/admin/staff" element={<SchoolAdminDashboard initialTab="staff" />} />
          <Route path="/admin/id-cards" element={<SchoolAdminDashboard initialTab="id-cards" />} />
          <Route path="/admin/attendance" element={<SchoolAdminDashboard initialTab="students" />} />
          <Route path="/admin/finance" element={<AccountsDashboard />} />
          <Route path="/admin/notices" element={<ParentDashboard />} />
        </Route>

        {/* Teacher Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/teacher" element={<TeacherDashboard />} />
          <Route path="/teacher/attendance" element={<TeacherDashboard />} />
          <Route path="/teacher/quizzes" element={<TeacherDashboard />} />
          <Route path="/teacher/examinations" element={<TeacherDashboard />} />
          <Route path="/teacher/resources" element={<TeacherDashboard />} />
        </Route>

        {/* Student Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/student" element={<StudentDashboard />} />
          <Route path="/student/id-card" element={<StudentDashboard />} />
          <Route path="/student/quizzes" element={<StudentDashboard />} />
          <Route path="/student/results" element={<StudentDashboard />} />
          <Route path="/student/ai-tutor" element={<StudentDashboard />} />
        </Route>

        {/* Parent / Guardian Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['PARENT']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/parent" element={<ParentDashboard />} />
          <Route path="/parent/results" element={<ParentDashboard />} />
          <Route path="/parent/attendance" element={<ParentDashboard />} />
          <Route path="/parent/fees" element={<ParentDashboard />} />
          <Route path="/parent/notices" element={<ParentDashboard />} />
        </Route>

        {/* Examination Coordinator Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['EXAM_COORDINATOR']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/examinations" element={<ExaminationWorkflow />} />
          <Route path="/examinations/schedules" element={<ExaminationWorkflow />} />
          <Route path="/examinations/marks-audit" element={<ExaminationWorkflow />} />
          <Route path="/examinations/grading" element={<ExaminationWorkflow />} />
          <Route path="/examinations/publish" element={<ExaminationWorkflow />} />
        </Route>

        {/* HR & Staff Admin Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['HR_STAFF']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/hr" element={<HrStaffDashboard />} />
          <Route path="/hr/employees" element={<HrStaffDashboard />} />
          <Route path="/hr/leaves" element={<HrStaffDashboard />} />
          <Route path="/hr/training" element={<HrStaffDashboard />} />
        </Route>

        {/* Accounts & Finance Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['ACCOUNTS']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/accounts" element={<AccountsDashboard />} />
          <Route path="/accounts/invoices" element={<AccountsDashboard />} />
          <Route path="/accounts/structures" element={<AccountsDashboard />} />
          <Route path="/accounts/reconciliation" element={<AccountsDashboard />} />
        </Route>

        {/* ================================================================ */}
        {/* 4. 404 UNKNOWN ROUTE FALLBACK                                    */}
        {/* ================================================================ */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

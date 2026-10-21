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
import { TelemetryDashboard } from './modules/superadmin/TelemetryDashboard.js';
import { SchoolTenantsPage } from './modules/superadmin/SchoolTenantsPage.js';
import { SubscriptionsPage } from './modules/superadmin/SubscriptionsPage.js';
import { AuditLogsPage } from './modules/superadmin/AuditLogsPage.js';
import { PlatformSettingsPage } from './modules/superadmin/PlatformSettingsPage.js';
import { SchoolOverviewPage } from './modules/schooladmin/SchoolOverviewPage.js';
import { StudentDirectoryPage } from './modules/schooladmin/StudentDirectoryPage.js';
import { StudentDossierPage } from './modules/schooladmin/StudentDossierPage.js';
import { AdmissionsQueuePage } from './modules/schooladmin/AdmissionsQueuePage.js';
import { FacultyHrPage } from './modules/schooladmin/FacultyHrPage.js';
import { VirtualIdCardsPage } from './modules/schooladmin/VirtualIdCardsPage.js';
import { DailyAttendancePage } from './modules/schooladmin/DailyAttendancePage.js';
import { FeesInvoicesPage } from './modules/schooladmin/FeesInvoicesPage.js';
import { EventsNoticesPage } from './modules/schooladmin/EventsNoticesPage.js';
import { TeacherDashboard } from './modules/teacher/TeacherDashboard.js';
import { TeacherSchedulePage } from './modules/teacher/TeacherSchedulePage.js';
import { TeacherAttendancePage } from './modules/teacher/TeacherAttendancePage.js';
import { TeacherQuizzesPage } from './modules/teacher/TeacherQuizzesPage.js';
import { TeacherExamMarksPage } from './modules/teacher/TeacherExamMarksPage.js';
import { TeacherResourcesPage } from './modules/teacher/TeacherResourcesPage.js';
import { TeacherHomeworkPage } from './modules/teacher/TeacherHomeworkPage.js';
import { TeacherTimetablePage } from './modules/teacher/TeacherTimetablePage.js';
import { TeacherClassesPage } from './modules/teacher/TeacherClassesPage.js';
import { TeacherNoticesPage } from './modules/teacher/TeacherNoticesPage.js';
import { StudentOverviewPage } from './modules/student/StudentOverviewPage.js';
import { StudentVirtualIdCardPage } from './modules/student/StudentVirtualIdCardPage.js';
import { StudentAssessmentsPage } from './modules/student/StudentAssessmentsPage.js';
import { StudentResultsPage } from './modules/student/StudentResultsPage.js';
import { StudentTimetablePage } from './modules/student/StudentTimetablePage.js';
import { StudentHomeworkPage } from './modules/student/StudentHomeworkPage.js';
import { StudentAttendancePage } from './modules/student/StudentAttendancePage.js';
import { StudentResourcesPage } from './modules/student/StudentResourcesPage.js';
import { StudentFeesPage } from './modules/student/StudentFeesPage.js';
import { StudentNoticesPage } from './modules/student/StudentNoticesPage.js';
import { StudentAiTutorPage } from './modules/student/StudentAiTutorPage.js';
import { ParentDashboard } from './modules/parent/ParentDashboard.js';
import { ParentResultsPage } from './modules/parent/ParentResultsPage.js';
import { ParentAttendancePage } from './modules/parent/ParentAttendancePage.js';
import { ParentFeesPage } from './modules/parent/ParentFeesPage.js';
import { ParentNoticesPage } from './modules/parent/ParentNoticesPage.js';
import { ExamOverviewPage } from './modules/examinations/ExamOverviewPage.js';
import { ExamSchedulesPage } from './modules/examinations/ExamSchedulesPage.js';
import { ExamMarksEntryPage } from './modules/examinations/ExamMarksEntryPage.js';
import { ExamMarksAuditPage } from './modules/examinations/ExamMarksAuditPage.js';
import { ExamGradingSchemesPage } from './modules/examinations/ExamGradingSchemesPage.js';
import { ExamPublishResultsPage } from './modules/examinations/ExamPublishResultsPage.js';
import { HrOverviewPage } from './modules/hr/HrOverviewPage.js';
import { HrStaffRecordsPage } from './modules/hr/HrStaffRecordsPage.js';
import { HrLeaveRequestsPage } from './modules/hr/HrLeaveRequestsPage.js';
import { HrStaffTrainingPage } from './modules/hr/HrStaffTrainingPage.js';
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
          <Route path="/superadmin" element={<TelemetryDashboard />} />
          <Route path="/superadmin/schools" element={<SchoolTenantsPage />} />
          <Route path="/superadmin/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/superadmin/audit" element={<Navigate to="/superadmin/audit-logs" replace />} />
          <Route path="/superadmin/audit-logs" element={<AuditLogsPage />} />
          <Route path="/superadmin/settings" element={<PlatformSettingsPage />} />
        </Route>

        {/* School Admin & Principal Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['SCHOOL_ADMIN', 'PRINCIPAL']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/admin" element={<SchoolOverviewPage />} />
          <Route path="/admin/students" element={<StudentDirectoryPage />} />
          <Route path="/admin/students/:id" element={<StudentDossierPage />} />
          <Route path="/admin/admissions" element={<AdmissionsQueuePage />} />
          <Route path="/admin/faculty" element={<FacultyHrPage />} />
          <Route path="/admin/staff" element={<Navigate to="/admin/faculty" replace />} />
          <Route path="/admin/id-cards" element={<VirtualIdCardsPage />} />
          <Route path="/admin/attendance" element={<DailyAttendancePage />} />
          <Route path="/admin/fees" element={<FeesInvoicesPage />} />
          <Route path="/admin/finance" element={<Navigate to="/admin/fees" replace />} />
          <Route path="/admin/events-notices" element={<EventsNoticesPage />} />
          <Route path="/admin/notices" element={<Navigate to="/admin/events-notices" replace />} />
        </Route>

        {/* Teacher Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/teacher" element={<TeacherSchedulePage />} />
          <Route path="/teacher/attendance" element={<TeacherAttendancePage />} />
          <Route path="/teacher/quizzes" element={<TeacherQuizzesPage />} />
          <Route path="/teacher/exams/marks" element={<TeacherExamMarksPage />} />
          <Route path="/teacher/examinations" element={<Navigate to="/teacher/exams/marks" replace />} />
          <Route path="/teacher/resources" element={<TeacherResourcesPage />} />
          <Route path="/teacher/homework" element={<TeacherHomeworkPage />} />
          <Route path="/teacher/timetable" element={<TeacherTimetablePage />} />
          <Route path="/teacher/classes" element={<TeacherClassesPage />} />
          <Route path="/teacher/notices" element={<TeacherNoticesPage />} />
        </Route>

        {/* Student Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/student" element={<StudentOverviewPage />} />
          <Route path="/student/id-card" element={<StudentVirtualIdCardPage />} />
          <Route path="/student/assessments" element={<StudentAssessmentsPage />} />
          <Route path="/student/quizzes" element={<Navigate to="/student/assessments" replace />} />
          <Route path="/student/results" element={<StudentResultsPage />} />
          <Route path="/student/timetable" element={<StudentTimetablePage />} />
          <Route path="/student/homework" element={<StudentHomeworkPage />} />
          <Route path="/student/attendance" element={<StudentAttendancePage />} />
          <Route path="/student/resources" element={<StudentResourcesPage />} />
          <Route path="/student/fees" element={<StudentFeesPage />} />
          <Route path="/student/notices" element={<StudentNoticesPage />} />
          <Route path="/student/ai-tutor" element={<StudentAiTutorPage />} />
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
          <Route path="/parent/results" element={<ParentResultsPage />} />
          <Route path="/parent/attendance" element={<ParentAttendancePage />} />
          <Route path="/parent/fees" element={<ParentFeesPage />} />
          <Route path="/parent/notices" element={<ParentNoticesPage />} />
        </Route>

        {/* Examination Coordinator Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['EXAM_COORDINATOR', 'SCHOOL_ADMIN', 'PRINCIPAL']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/examinations" element={<ExamOverviewPage />} />
          <Route path="/examinations/schedules" element={<ExamSchedulesPage />} />
          <Route path="/examinations/marks" element={<ExamMarksEntryPage />} />
          <Route path="/examinations/marks-entry" element={<ExamMarksEntryPage />} />
          <Route path="/examinations/marks-audit" element={<ExamMarksAuditPage />} />
          <Route path="/examinations/audit" element={<ExamMarksAuditPage />} />
          <Route path="/examinations/grading" element={<ExamGradingSchemesPage />} />
          <Route path="/examinations/publish" element={<ExamPublishResultsPage />} />
        </Route>

        {/* HR & Staff Admin Workspace */}
        <Route
          element={
            <ProtectedRoute allowedRoles={['HR_STAFF', 'SCHOOL_ADMIN', 'PRINCIPAL', 'SUPER_ADMIN']}>
              <ErpLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/hr" element={<HrOverviewPage />} />
          <Route path="/hr/employees" element={<HrStaffRecordsPage />} />
          <Route path="/hr/staff" element={<HrStaffRecordsPage />} />
          <Route path="/hr/leaves" element={<HrLeaveRequestsPage />} />
          <Route path="/hr/training" element={<HrStaffTrainingPage />} />
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

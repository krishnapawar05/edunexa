import {
  HealthCheckData,
  ApiResponse,
  BulkActionResponse,
  RazorpayOrderResponse,
  RazorpayVerifyResponse,
  PaymentTransactionRecord,
  PublicWebsiteData,
} from '@edunexa/shared';

export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function getApiUrl(endpoint: string): string {
  if (!API_BASE_URL) return endpoint;
  const base = API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${base}/${cleanEndpoint}`;
}

// ============================================================================
// AUTHENTICATION & SESSION MANAGEMENT
// ============================================================================

export interface StoredUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  schoolId?: string;
  studentProfileId?: string;
  staffProfileId?: string;
  mustChangePassword?: boolean;
  accountLocked?: boolean;
  passwordResetAt?: string;
  passwordChangedAt?: string;
}

export function getStoredAuthToken(_role?: string): string {
  const stored = localStorage.getItem('edunexa_access_token') || localStorage.getItem('edunexa_token');
  return stored || '';
}

export function setAuthSession(token: string, user: StoredUser): void {
  localStorage.setItem('edunexa_access_token', token);
  localStorage.setItem('edunexa_token', token);
  localStorage.setItem('edunexa_user', JSON.stringify(user));
}

export function getStoredUser(): StoredUser | null {
  try {
    const raw = localStorage.getItem('edunexa_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  localStorage.removeItem('edunexa_access_token');
  localStorage.removeItem('edunexa_token');
  localStorage.removeItem('edunexa_user');
}

export async function loginApi(email: string, password: string): Promise<{ accessToken: string; user: StoredUser }> {
  const res = await fetch(getApiUrl('/api/v1/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  let json: any = null;
  try {
    const text = await res.text();
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error('Cannot connect to the EduNexa backend API server (http://localhost:5000). Please ensure the backend is running with "npm run dev".');
  }
  if (!res.ok || !json?.success) {
    throw new Error(json?.error?.message || 'Login failed. Please verify credentials.');
  }
  setAuthSession(json.data.accessToken, json.data.user);
  return json.data;
}

// ============================================================================
// TYPED FETCH WRAPPER
// ============================================================================

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Authorization') && token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(getApiUrl(endpoint), {
    ...options,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('text/csv')) {
    return (await res.text()) as unknown as T;
  }

  let json: any;
  try {
    json = await res.json();
  } catch {
    throw new ApiError(`Server responded with HTTP ${res.status}`, res.status);
  }

  if (!res.ok || !json.success) {
    const details = json.error?.details;
    const detailText = Array.isArray(details) && details.length > 0
      ? details.map((d: any) => d.message ? `${d.field ? d.field + ': ' : ''}${d.message}` : JSON.stringify(d)).join(', ')
      : '';
    const errMsg = detailText
      ? `${json.error?.message || 'Validation error'} (${detailText})`
      : (json.error?.message || json.message || `Request failed with status ${res.status}`);
    const errCode = json.error?.code;
    throw new ApiError(errMsg, res.status, errCode);
  }

  return json.data;
}

// ============================================================================
// SERVER HEALTH
// ============================================================================

export async function fetchServerHealth(): Promise<HealthCheckData | null> {
  try {
    const res = await fetch(getApiUrl('/api/health'));
    if (!res.ok) return null;
    const json: ApiResponse<HealthCheckData> = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    return null;
  }
}

// ============================================================================
// 1. SUPER ADMIN APIS
// ============================================================================

function parseBulkArgs(
  idsOrPayload: string[] | { ids: string[]; action: string; params?: any },
  actionArg?: string,
  paramsArg?: any
): { ids: string[]; action: string; params?: any } {
  if (Array.isArray(idsOrPayload)) {
    return { ids: idsOrPayload, action: actionArg || '', params: paramsArg };
  }
  return idsOrPayload;
}

export const superadminApi = {
  getTelemetry: () => apiRequest<any>('/api/v1/superadmin/telemetry'),
  listSchools: (params: { query?: string; status?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.query) q.set('query', params.query);
    if (params.status && params.status !== 'ALL') q.set('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/superadmin/schools${qs}`);
  },
  onboardSchool: (data: any) =>
    apiRequest<any>('/api/v1/superadmin/schools', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleStatus: (id: string, status: string) =>
    apiRequest<any>(`/api/v1/superadmin/schools/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  bulkSchoolActions: (idsOrPayload: string[] | { ids: string[]; action: string; params?: any }, action?: string, params?: any) => {
    const payload = parseBulkArgs(idsOrPayload, action, params);
    return apiRequest<BulkActionResponse>('/api/v1/superadmin/schools/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateSchool: (id: string, data: any) =>
    apiRequest<any>(`/api/v1/superadmin/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listSubscriptions: () => apiRequest<any[]>('/api/v1/superadmin/subscriptions'),
  bulkSubscriptionActions: (idsOrPayload: string[] | { ids: string[]; action: string; params?: any }, action?: string, params?: any) => {
    const payload = parseBulkArgs(idsOrPayload, action, params);
    return apiRequest<BulkActionResponse>('/api/v1/superadmin/subscriptions/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  updateSubscription: (id: string, data: any) =>
    apiRequest<any>(`/api/v1/superadmin/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  getAuditLogs: (params: { action?: string; schoolId?: string; limit?: number } = {}) => {
    const q = new URLSearchParams();
    if (params.action && params.action !== 'ALL') q.set('action', params.action);
    if (params.schoolId && params.schoolId !== 'ALL') q.set('schoolId', params.schoolId);
    if (params.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/superadmin/audit-logs${qs}`);
  },
  getSettings: () => apiRequest<any>('/api/v1/superadmin/settings'),
  updateSettings: (data: any) =>
    apiRequest<any>('/api/v1/superadmin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  listSchoolInvitations: (schoolId: string) =>
    apiRequest<any[]>(`/api/v1/superadmin/schools/${schoolId}/invitations`),
  sendSchoolAdminInvitation: (
    schoolId: string,
    data: { adminFullName: string; adminEmail: string; adminPhone?: string; sendInvitation?: boolean }
  ) =>
    apiRequest<any>(`/api/v1/superadmin/schools/${schoolId}/invitations/send`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendSchoolAdminInvitation: (schoolId: string, invitationId: string) =>
    apiRequest<any>(`/api/v1/superadmin/schools/${schoolId}/invitations/${invitationId}/resend`, {
      method: 'POST',
    }),
  revokeSchoolAdminInvitation: (schoolId: string, invitationId: string, reason?: string) =>
    apiRequest<any>(`/api/v1/superadmin/schools/${schoolId}/invitations/${invitationId}/revoke`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
};

// ============================================================================
// 2. CORE APIS (Academic Structure, Students, Staff, ID Cards, Admissions)
// ============================================================================

export const coreApi = {
  getAcademicStructure: () =>
    apiRequest<{
      sessions: any[];
      departments: any[];
      classes: any[];
    }>('/api/v1/core/academic/structure'),

  createAcademicSession: (data: { name: string; startDate: string; endDate: string; isCurrent?: boolean }) =>
    apiRequest<any>('/api/v1/core/academic/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createClass: (data: { name: string; code?: string }) =>
    apiRequest<any>('/api/v1/core/academic/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createSection: (classId: string, data: { name: string; capacity?: number }) =>
    apiRequest<any>(`/api/v1/core/academic/classes/${classId}/sections`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createSubject: (classId: string, data: { name: string; code: string }) =>
    apiRequest<any>(`/api/v1/core/academic/classes/${classId}/subjects`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listStudents: async (params: { className?: string; sectionName?: string; query?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.sectionName) query.set('sectionName', params.sectionName);
    if (params.query) query.set('query', params.query);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    const data = await apiRequest<any>(`/api/v1/core/students?${query.toString()}`);
    if (Array.isArray(data)) {
      const result: any = [...data];
      result.items = data;
      result.meta = { total: data.length, page: 1, limit: data.length };
      return result as any[] & { items: any[]; meta: any };
    }
    return data;
  },

  getStudentById: (studentId: string) =>
    apiRequest<any>(`/api/v1/core/students/${studentId}`),

  createStudent: (data: any) =>
    apiRequest<any>('/api/v1/core/students', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listStaff: (params: { department?: string; query?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.department) query.set('department', params.department);
    if (params.query) query.set('query', params.query);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return apiRequest<{ items: any[]; meta: any }>(`/api/v1/core/staff?${query.toString()}`);
  },

  createStaff: (data: any) =>
    apiRequest<any>('/api/v1/core/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStaff: (staffId: string, data: any) =>
    apiRequest<any>(`/api/v1/core/staff/${staffId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  assignTeacher: (data: any) =>
    apiRequest<any>('/api/v1/core/staff/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  generateIdCard: (data: { holderType: 'STUDENT' | 'STAFF'; profileId: string }) =>
    apiRequest<any>('/api/v1/core/id-cards/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deactivateIdCard: (cardId: string, reason: string) =>
    apiRequest<any>(`/api/v1/core/id-cards/${cardId}/deactivate`, {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    }),

  verifyIdCardPublic: (token: string) =>
    apiRequest<any>(`/api/v1/core/id-cards/verify/${encodeURIComponent(token.trim())}`),

  listAdmissions: (status?: string) => {
    const url = status && status !== 'ALL' ? `/api/v1/core/admissions/applications?status=${status}` : '/api/v1/core/admissions/applications';
    return apiRequest<any[]>(url);
  },

  reviewAdmission: (id: string, data: { decision: 'APPROVED' | 'REJECTED'; reviewNotes: string; assignedClass?: string; assignedSection?: string }) =>
    apiRequest<any>(`/api/v1/core/admissions/applications/${id}/review`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  submitPublicAdmission: (data: any) =>
    apiRequest<any>('/api/v1/core/admissions/apply', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPublicFaculty: (schoolIdentifier = 'apex-academy') =>
    apiRequest<any[]>(`/api/v1/core/public/faculty?schoolIdentifier=${encodeURIComponent(schoolIdentifier)}`),

  getPublicEvents: (schoolIdentifier = 'apex-academy') =>
    apiRequest<any[]>(`/api/v1/core/public/events?schoolIdentifier=${encodeURIComponent(schoolIdentifier)}`),

  getPublicNotices: (schoolIdentifier = 'apex-academy') =>
    apiRequest<any[]>(`/api/v1/core/public/notices?schoolIdentifier=${encodeURIComponent(schoolIdentifier)}`),

  getPublicDepartments: (schoolIdentifier = 'apex-academy') =>
    apiRequest<any[]>(`/api/v1/core/public/departments?schoolIdentifier=${encodeURIComponent(schoolIdentifier)}`),

  getSchoolOverviewStats: () =>
    apiRequest<{
      schoolId: string;
      students: { total: number; active: number };
      staff: { total: number; active: number };
      admissions: { pendingReview: number };
      idCards: { activeCount: number };
      attendance: { markedToday: number; present: number; absent: number; late: number; percentage: number };
      finance: { totalInvoiced: number; totalCollected: number; totalOutstanding: number; collectionRate: number };
      upcomingEvents: Array<{ id: string; title: string; description: string; venue?: string; startDate: string; endDate: string; audience: string }>;
      recentNotices: Array<{ id: string; title: string; content: string; audience: string; isUrgent: boolean; publishedAt: string }>;
    }>('/api/v1/core/school/overview-stats'),

  updateStudent: (studentId: string, data: any) =>
    apiRequest<any>(`/api/v1/core/students/${studentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteStudent: (studentId: string) =>
    apiRequest<any>(`/api/v1/core/students/${studentId}`, {
      method: 'DELETE',
    }),

  bulkStudentActions: (idsOrPayload: string[] | { ids: string[]; action: string; params?: any }, action?: string, params?: any) => {
    const payload = parseBulkArgs(idsOrPayload, action, params);
    return apiRequest<BulkActionResponse>('/api/v1/core/students/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  bulkAdmissionsReview: (idsOrPayload: string[] | { ids: string[]; action: string; params?: any }, action?: string, params?: any) => {
    const payload = parseBulkArgs(idsOrPayload, action, params);
    return apiRequest<BulkActionResponse>('/api/v1/core/admissions/bulk-review', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  bulkStaffActions: (idsOrPayload: string[] | { ids: string[]; action: string; params?: any }, action?: string, params?: any) => {
    const payload = parseBulkArgs(idsOrPayload, action, params);
    return apiRequest<BulkActionResponse>('/api/v1/core/staff/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStaffStatus: (staffId: string, status: string) =>
    apiRequest<any>(`/api/v1/core/staff/${staffId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getTeacherProfile: () =>
    apiRequest<{
      id: string;
      employeeId: string;
      firstName: string;
      lastName: string;
      email: string;
      phone: string | null;
      designation: string;
      department: string;
      joiningDate: string;
      status: string;
      schoolId: string;
      schoolName: string;
      idCardNumber: string | null;
      assignments: Array<{
        id: string;
        subjectId: string;
        subjectCode: string;
        subjectName: string;
        classId: string;
        className: string;
        sections: Array<{ id: string; name: string; capacity: number }>;
        isLeadTeacher: boolean;
      }>;
      assignedClasses: string[];
      assignedSubjects: string[];
    }>('/api/v1/core/teacher/profile'),

  getParentChildren: () =>
    apiRequest<
      Array<{
        id: string;
        studentProfileId: string;
        admissionNumber: string;
        firstName: string;
        lastName: string;
        name: string;
        email: string;
        phone: string | null;
        avatarUrl: string | null;
        bloodGroup: string | null;
        status: string;
        relationship: string;
        isPrimaryContact: boolean;
        className: string;
        sectionName: string;
        grade: string;
        classId: string | null;
        sectionId: string | null;
        rollNumber: number;
        academicSession: string;
        idCardNumber: string | null;
        idCardStatus: string | null;
      }>
    >('/api/v1/core/parent/children'),
};

// ============================================================================
// 3. ACADEMIC APIS (Attendance, Quizzes, Examinations, Marks, Report Cards)
// ============================================================================

export const academicApi = {
  recordStudentAttendance: (payload: { className?: string; sectionName?: string; records: Array<{ studentProfileId: string; status: string; remarks?: string }>; date: string }) =>
    apiRequest<any>('/api/v1/academic/attendance/students', {
      method: 'POST',
      body: JSON.stringify({
        className: payload.className || 'Grade 10',
        sectionName: payload.sectionName || 'A',
        ...payload,
      }),
    }),

  getAttendanceRoster: (params: { className: string; sectionName: string; date?: string }) => {
    const query = new URLSearchParams();
    query.set('className', params.className);
    query.set('sectionName', params.sectionName);
    if (params.date) query.set('date', params.date);
    return apiRequest<{
      className: string;
      sectionName: string;
      date: string;
      totalEnrolled: number;
      recordedCount: number;
      isRecorded: boolean;
      presentCount: number;
      absentCount: number;
      lateCount: number;
      leaveCount: number;
      attendanceRate: number | null;
      roster: Array<{
        studentProfileId: string;
        studentName: string;
        admissionNumber: string;
        rollNumber: string;
        status: 'PRESENT' | 'ABSENT' | 'LATE' | 'APPROVED_LEAVE' | null;
        remarks?: string;
        recordId?: string | null;
      }>;
    }>(`/api/v1/academic/attendance/roster?${query.toString()}`);
  },

  correctStudentAttendance: (recordId: string, status: string, reason: string) =>
    apiRequest<any>('/api/v1/academic/attendance/students/correct', {
      method: 'PATCH',
      body: JSON.stringify({ recordId, status, reason }),
    }),

  getStudentAttendanceSummary: (studentProfileId: string) =>
    apiRequest<{ totalDays: number; presentDays: number; absentDays: number; lateDays: number; approvedLeaves: number; attendancePercentage: number }>(
      `/api/v1/academic/attendance/students/${studentProfileId}/summary`
    ),

  getClassAttendanceReport: (params: { className: string; sectionName: string; date?: string }) => {
    const query = new URLSearchParams();
    query.set('className', params.className);
    query.set('sectionName', params.sectionName);
    if (params.date) query.set('date', params.date);
    return apiRequest<any>(`/api/v1/academic/attendance/class-report?${query.toString()}`);
  },

  recordStaffAttendance: (records: Array<{ staffProfileId: string; status: string; remarks?: string }>, date?: string) =>
    apiRequest<any>('/api/v1/academic/attendance/staff', {
      method: 'POST',
      body: JSON.stringify({ records, date }),
    }),

  submitStaffLeave: (data: { leaveType: string; startDate: string; endDate: string; reason: string }) =>
    apiRequest<any>('/api/v1/academic/attendance/staff/leave', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  reviewStaffLeave: (leaveId: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) =>
    apiRequest<any>(`/api/v1/academic/attendance/staff/leave/${leaveId}/review`, {
      method: 'PATCH',
      body: JSON.stringify({ decision: status, reviewNotes }),
    }),

  bulkReviewStaffLeaves: (idsOrPayload: string[] | { ids: string[]; action: 'APPROVE' | 'REJECT'; params?: any }, action?: 'APPROVE' | 'REJECT', params?: any) => {
    const payload = parseBulkArgs(idsOrPayload as any, action, params);
    return apiRequest<BulkActionResponse>('/api/v1/academic/attendance/staff/leave/bulk-review', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listStaffLeaves: (status?: string) => {
    const url = status && status !== 'ALL' ? `/api/v1/academic/attendance/staff/leave?status=${status}` : '/api/v1/academic/attendance/staff/leave';
    return apiRequest<any[]>(url);
  },

  listStaffTrainingQuizzes: () =>
    apiRequest<any[]>('/api/v1/academic/training/quizzes'),

  createStaffTrainingQuiz: (data: any) =>
    apiRequest<any>('/api/v1/academic/training/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  recordStaffQuizAttempt: (quizId: string, data: { staffProfileId: string; scoreObtained: number }) =>
    apiRequest<any>(`/api/v1/academic/training/quizzes/${quizId}/attempts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listQuizzes: (params: { subjectCode?: string; className?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.subjectCode) query.set('subjectCode', params.subjectCode);
    if (params.className) query.set('className', params.className);
    if (params.status) query.set('status', params.status);
    return apiRequest<any[]>(`/api/v1/academic/quizzes?${query.toString()}`);
  },

  createQuiz: (data: any) =>
    apiRequest<any>('/api/v1/academic/quizzes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  startQuizAttempt: (quizId: string) =>
    apiRequest<any>(`/api/v1/academic/quizzes/${quizId}/attempts/start`, {
      method: 'POST',
    }),

  submitQuizAttempt: (quizId: string, answers: any[], saveOnly: boolean = false) =>
    apiRequest<any>(`/api/v1/academic/quizzes/${quizId}/attempts/submit`, {
      method: 'POST',
      body: JSON.stringify({ quizId, answers, saveOnly }),
    }),

  listExamSchedules: (params: { academicSessionId?: string; className?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.academicSessionId) query.set('academicSessionId', params.academicSessionId);
    if (params.className) query.set('className', params.className);
    return apiRequest<any[]>(`/api/v1/academic/exams/schedules?${query.toString()}`);
  },

  createExamSchedule: (data: any) =>
    apiRequest<any>('/api/v1/academic/exams/schedules', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitExamMarksBatch: (data: { examScheduleId: string; isDraft?: boolean; marks: Array<{ studentProfileId: string; marksObtained?: number | ''; isAbsent?: boolean; isExempt?: boolean; teacherRemarks?: string }> }) =>
    apiRequest<any>('/api/v1/academic/exams/marks/batch', {
      method: 'POST',
      body: JSON.stringify({
        examScheduleId: data.examScheduleId,
        isDraft: Boolean(data.isDraft),
        marks: data.marks.map((m) => ({
          studentProfileId: m.studentProfileId,
          marksObtained: m.marksObtained === '' || m.isAbsent || m.isExempt ? undefined : Number(m.marksObtained),
          isAbsent: Boolean(m.isAbsent),
          isExempt: Boolean(m.isExempt),
          teacherRemarks: m.teacherRemarks,
        })),
      }),
    }),

  getExamMarks: (examScheduleId: string) =>
    apiRequest<any[]>(`/api/v1/academic/exams/schedules/${examScheduleId}/marks`),

  correctExamMark: (data: { markId: string; newMarksObtained?: number; newMarks?: number; reason?: string; rationale?: string; isAbsent?: boolean; isExempt?: boolean; teacherRemarks?: string }) =>
    apiRequest<any>('/api/v1/academic/exams/marks/correct', {
      method: 'PATCH',
      body: JSON.stringify({
        markId: data.markId,
        newMarksObtained: data.newMarksObtained !== undefined ? data.newMarksObtained : data.newMarks,
        reason: data.reason || data.rationale || 'Audited marks entry correction',
        isAbsent: data.isAbsent,
        isExempt: data.isExempt,
        teacherRemarks: data.teacherRemarks,
      }),
    }),

  updateExamSchedule: (id: string, data: any) =>
    apiRequest<any>(`/api/v1/academic/exams/schedules/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  publishExamResults: (
    dataOrId: string | { examScheduleId: string; publish?: boolean; isPublished?: boolean },
    maybePublish?: boolean
  ) => {
    const payload =
      typeof dataOrId === 'string'
        ? { examScheduleId: dataOrId, publish: Boolean(maybePublish) }
        : {
            examScheduleId: dataOrId.examScheduleId,
            publish: dataOrId.publish !== undefined ? dataOrId.publish : Boolean(dataOrId.isPublished),
          };
    return apiRequest<any>('/api/v1/academic/exams/publish', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  getExamAuditLogs: (paramsOrScheduleId?: string | { examScheduleId?: string }) => {
    const query = new URLSearchParams();
    const scheduleId =
      typeof paramsOrScheduleId === 'string'
        ? paramsOrScheduleId
        : paramsOrScheduleId?.examScheduleId;
    if (scheduleId) query.set('examScheduleId', scheduleId);
    return apiRequest<any[]>(`/api/v1/academic/exams/audit?${query.toString()}`);
  },

  getGradingSchemes: () =>
    apiRequest<any>('/api/v1/academic/exams/grading-schemes'),

  updateGradingScheme: (data: any) =>
    apiRequest<any>('/api/v1/academic/exams/grading-schemes', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getReportCard: (studentProfileId: string) =>
    apiRequest<any>(`/api/v1/academic/report-cards/${studentProfileId}`),

  getStudentReportCard: (studentProfileId: string) =>
    apiRequest<any>(`/api/v1/academic/report-cards/${studentProfileId}`),
};

// ============================================================================
// 4. OPERATIONS APIS (Timetable, Assignments, Resources, Notices, Fees)
// ============================================================================

export const operationsApi = {
  getTimetable: (params: { className?: string; sectionName?: string }) => {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.sectionName) query.set('sectionName', params.sectionName);
    return apiRequest<any[]>(`/api/v1/operations/timetables?${query.toString()}`);
  },

  createTimetableSlot: (data: any) =>
    apiRequest<any>('/api/v1/operations/timetables', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listAssignments: (params: { className?: string; sectionName?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.sectionName) query.set('sectionName', params.sectionName);
    return apiRequest<any[]>(`/api/v1/operations/assignments?${query.toString()}`);
  },

  createAssignment: (data: any) =>
    apiRequest<any>('/api/v1/operations/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  submitAssignment: (data: any) =>
    apiRequest<any>('/api/v1/operations/assignments/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  gradeAssignment: (data: { submissionId: string; marksAwarded: number; teacherFeedback?: string }) =>
    apiRequest<any>('/api/v1/operations/assignments/grade', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  listResources: (params: { className?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    return apiRequest<any[]>(`/api/v1/operations/resources?${query.toString()}`);
  },

  publishResource: (data: any) =>
    apiRequest<any>('/api/v1/operations/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listNotices: () => apiRequest<any[]>('/api/v1/operations/notices'),

  bulkNoticeActions: (idsOrPayload: string[] | { ids: string[]; action: string; params?: any }, action?: string, params?: any) => {
    const payload = parseBulkArgs(idsOrPayload, action, params);
    return apiRequest<BulkActionResponse>('/api/v1/operations/notices/bulk-actions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  broadcastNotice: (data: any) =>
    apiRequest<any>('/api/v1/operations/notices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listEvents: () => apiRequest<any[]>('/api/v1/operations/events'),

  createSchoolEvent: (data: any) =>
    apiRequest<any>('/api/v1/operations/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listNotifications: () =>
    apiRequest<{ unreadCount: number; notifications: any[] }>('/api/v1/operations/notifications'),

  markAllNotificationsRead: () =>
    apiRequest<any>('/api/v1/operations/notifications/read-all', {
      method: 'PATCH',
    }),

  listFeeInvoices: (params: { studentProfileId?: string; status?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.studentProfileId) query.set('studentProfileId', params.studentProfileId);
    if (params.status) query.set('status', params.status);
    return apiRequest<any[]>(`/api/v1/operations/fees/invoices?${query.toString()}`);
  },

  getFeeSummary: () =>
    apiRequest<{
      currency: string;
      totalInvoiced: number;
      totalCollected: number;
      totalOutstanding: number;
      totalConcessions: number;
      collectionRatePercentage: number;
    }>('/api/v1/operations/fees/summary'),

  recordFeePayment: (data: {
    invoiceId: string;
    amount?: number;
    amountPaid?: number;
    paymentMethod: string;
    transactionReference?: string;
    transactionRef?: string;
    notes?: string;
    isSimulated?: boolean;
  }) => {
    const payload = {
      invoiceId: data.invoiceId,
      amountPaid: data.amountPaid ?? data.amount ?? 0,
      paymentMethod: data.paymentMethod,
      transactionRef: data.transactionRef ?? data.transactionReference ?? `TXN-${Date.now()}`,
      notes: data.notes,
      isSimulated: data.isSimulated ?? true,
    };
    return apiRequest<any>('/api/v1/operations/fees/payments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  applyFeeConcession: (data: { invoiceId: string; concessionAmount: number; reason: string }) =>
    apiRequest<any>('/api/v1/operations/fees/concessions', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  recordFeeRefund: (data: { paymentId: string; refundAmount: number; reason: string }) =>
    apiRequest<any>('/api/v1/operations/fees/refunds', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  exportFeeCsv: () => apiRequest<string>('/api/v1/operations/fees/export-csv'),

  listFeeStructures: (params: { className?: string; feeHead?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.feeHead) query.set('feeHead', params.feeHead);
    return apiRequest<any[]>(`/api/v1/operations/fees/structures?${query.toString()}`);
  },

  createFeeStructure: (data: { className: string; feeHead: string; amount: number; frequency: string }) =>
    apiRequest<any>('/api/v1/operations/fees/structures', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateFeeStructure: (id: string, data: { feeHead?: string; amount?: number; frequency?: string }) =>
    apiRequest<any>(`/api/v1/operations/fees/structures/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteFeeStructure: (id: string) =>
    apiRequest<any>(`/api/v1/operations/fees/structures/${id}`, {
      method: 'DELETE',
    }),

  createFeeInvoice: (data: {
    studentProfileId: string;
    feeStructureId?: string;
    feeHead?: string;
    className?: string;
    amountDue: number;
    dueDate: string;
  }) =>
    apiRequest<any>('/api/v1/operations/fees/invoices', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getReconciliationReport: () =>
    apiRequest<{
      summary: {
        totalVolume: number;
        totalReconciled: number;
        totalPending: number;
        discrepanciesCount: number;
        reconciliationRate: number;
      };
      transactions: Array<{
        id: string;
        receiptNumber: string;
        invoiceNumber: string;
        studentName: string;
        admissionNo: string;
        className: string;
        amountPaid: number;
        paymentMethod: string;
        transactionRef: string;
        paidAt: string;
        isSimulated: boolean;
        status: 'RECONCILED' | 'PENDING' | 'DISCREPANCY';
        verifiedAt?: string | null;
        notes?: string;
      }>;
    }>('/api/v1/operations/fees/reconciliation'),

  recordReconciliation: (data: {
    paymentId: string;
    action: 'RECONCILE' | 'FLAG_DISCREPANCY';
    statementRef?: string;
    reason?: string;
  }) =>
    apiRequest<any>('/api/v1/operations/fees/reconcile', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ============================================================================
// 4b. PAYMENTS & RAZORPAY GATEWAY APIS
// ============================================================================

export const paymentsApi = {
  getConfig: () =>
    apiRequest<{ keyId: string; mode: string; currency: string }>('/api/v1/payments/config'),

  createRazorpayOrder: (data: { invoiceId: string; amount?: number; notes?: Record<string, string> }) =>
    apiRequest<RazorpayOrderResponse>('/api/v1/payments/razorpay/create-order', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  verifyRazorpayPayment: (data: {
    invoiceId: string;
    orderId: string;
    paymentId: string;
    signature: string;
  }) =>
    apiRequest<RazorpayVerifyResponse>('/api/v1/payments/razorpay/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  listTransactions: (params: { invoiceId?: string } = {}) => {
    const query = new URLSearchParams();
    if (params.invoiceId) query.set('invoiceId', params.invoiceId);
    return apiRequest<PaymentTransactionRecord[]>(`/api/v1/payments/transactions?${query.toString()}`);
  },

  getReceipt: (identifier: string) =>
    apiRequest<any>(`/api/v1/payments/receipts/${identifier}`),
};

// ============================================================================
// 5. AI ASSISTANT & QUIZ GENERATION APIS
// ============================================================================

export async function fetchAiStatusApi() {
  try {
    const res = await fetch(getApiUrl('/api/v1/ai/status'));
    return await res.json();
  } catch (err) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: 'Unable to connect to EduNexa AI service.' },
    };
  }
}

export async function askSchoolAssistantApi(
  question: string,
  contextScope: string = 'GENERAL',
  token: string = ''
) {
  try {
    const authToken = token || getStoredAuthToken();
    const res = await fetch(getApiUrl('/api/v1/ai/assistant/ask'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, contextScope }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err.message || 'Connection failed' },
    };
  }
}

export async function askConceptTutorApi(
  payload: { topic: string; question: string; subject?: string; gradeLevel?: string },
  token: string = ''
) {
  try {
    const authToken = token || getStoredAuthToken();
    const res = await fetch(getApiUrl('/api/v1/ai/tutor/ask'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err.message || 'Connection failed' },
    };
  }
}

export async function generateQuizDraftApi(payload: any, token: string = '') {
  try {
    const authToken = token || getStoredAuthToken();
    const res = await fetch(getApiUrl('/api/v1/ai/quiz/generate'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err.message || 'Connection failed' },
    };
  }
}

export async function reviewQuizDraftApi(draftId: string, reviews: any[], token: string = '') {
  try {
    const authToken = token || getStoredAuthToken();
    const res = await fetch(getApiUrl(`/api/v1/ai/quiz/drafts/${draftId}/review`), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reviews }),
    });
    return await res.json();
  } catch (err: any) {
    return {
      success: false,
      error: { code: 'NETWORK_ERROR', message: err.message || 'Connection failed' },
    };
  }
}


// ============================================================================
// ACCOUNT PROVISIONING & PASSWORD RECOVERY APIS
// ============================================================================

export async function forgotPasswordApi(email: string, schoolSlug?: string): Promise<{ success: boolean; message: string; data?: any }> {
  return apiRequest('/api/v1/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email, schoolSlug }),
  });
}

export async function verifyResetTokenApi(token: string): Promise<{ valid: boolean; email: string; recipientName: string }> {
  return apiRequest(`/api/v1/auth/reset-password/verify/${encodeURIComponent(token)}`, {
    method: 'GET',
  });
}

export async function resetPasswordApi(token: string, password: string): Promise<{ success: boolean; message: string }> {
  return apiRequest('/api/v1/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function changePasswordApi(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  return apiRequest('/api/v1/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function verifyActivationTokenApi(token: string): Promise<{ valid: boolean; email: string; recipientName: string; role: string; schoolName: string; isAssisted: boolean }> {
  return apiRequest(`/api/v1/auth/invitations/verify/${encodeURIComponent(token)}`, {
    method: 'GET',
  });
}

export async function activateAccountApi(token: string, password: string): Promise<{ success: boolean; data: any; message: string }> {
  return apiRequest('/api/v1/auth/invitations/activate', {
    method: 'POST',
    body: JSON.stringify({ token, password }),
  });
}

export async function triggerUserPasswordResetApi(userId: string): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/v1/core/accounts/${encodeURIComponent(userId)}/reset-password`, {
    method: 'POST',
  });
}

export async function updateUserAccountStatusApi(userId: string, isActive: boolean, reason?: string): Promise<{ userId: string; schoolId: string; isActive: boolean; role: string }> {
  return apiRequest(`/api/v1/core/accounts/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive, reason }),
  });
}

export async function resendInvitationApi(invitationId: string): Promise<any> {
  return apiRequest(`/api/v1/core/invitations/${encodeURIComponent(invitationId)}/resend`, {
    method: 'POST',
  });
}

export async function revokeInvitationApi(invitationId: string, reason?: string): Promise<any> {
  return apiRequest(`/api/v1/core/invitations/${encodeURIComponent(invitationId)}/revoke`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function listInvitationsApi(status?: string): Promise<any[]> {
  const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
  return apiRequest(`/api/v1/core/invitations${query}`, {
    method: 'GET',
  });
}

export async function fetchStaffMemberApi(staffId: string): Promise<any> {
  return apiRequest(`/api/v1/core/staff/${encodeURIComponent(staffId)}`, {
    method: 'GET',
  });
}

// ============================================================================
// ACCOUNT ACCESS & ADMIN PASSWORD RECOVERY MANAGEMENT
// ============================================================================

export interface TenantAccountUser {
  id: string;
  membershipId: string;
  schoolId: string;
  schoolName?: string;
  schoolSlug?: string;
  schoolStatus?: string;
  email: string;
  username?: string | null;
  firstName: string;
  lastName: string;
  name: string;
  phone?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
  accountLocked: boolean;
  failedLoginAttempts: number;
  lockoutUntil?: string | null;
  mustChangePassword?: boolean;
  passwordResetAt?: string | null;
  passwordChangedAt?: string | null;
  createdAt: string;
  studentProfile?: {
    id: string;
    admissionNumber: string;
    status: string;
  } | null;
  staffProfile?: {
    id: string;
    employeeId: string;
    designation: string;
    employmentStatus: string;
  } | null;
}

export interface ListTenantAccountsResponse {
  users: TenantAccountUser[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function listTenantAccountsApi(filters: {
  role?: string;
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ListTenantAccountsResponse> {
  const params = new URLSearchParams();
  if (filters.role && filters.role !== 'ALL') params.set('role', filters.role);
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/core/accounts${queryStr}`, { method: 'GET' });
}

export async function adminResetPasswordApi(
  userId: string,
  data: {
    temporaryPassword?: string;
    mustChangePassword?: boolean;
    reason?: string;
  } = {}
): Promise<{
  success: boolean;
  message: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
  user: { id: string; email: string; firstName: string; lastName: string; role?: string };
}> {
  return apiRequest(`/api/v1/core/accounts/${encodeURIComponent(userId)}/admin-reset-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function adminUnlockAccountApi(
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/v1/core/accounts/${encodeURIComponent(userId)}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function bulkUserAccountActionsApi(
  userIds: string[],
  action: 'ACTIVATE' | 'DEACTIVATE' | 'UNLOCK' | 'RESET_PASSWORD',
  reason?: string
): Promise<BulkActionResponse> {
  return apiRequest('/api/v1/core/accounts/bulk-actions', {
    method: 'POST',
    body: JSON.stringify({ userIds, action, reason }),
  });
}

// Super Admin cross-tenant account APIs
export async function listSuperAdminAccountsApi(filters: {
  search?: string;
  schoolId?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
} = {}): Promise<ListTenantAccountsResponse> {
  const params = new URLSearchParams();
  if (filters.schoolId && filters.schoolId !== 'ALL') params.set('schoolId', filters.schoolId);
  if (filters.role && filters.role !== 'ALL') params.set('role', filters.role);
  if (filters.search) params.set('search', filters.search);
  if (filters.status && filters.status !== 'ALL') params.set('status', filters.status);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const queryStr = params.toString() ? `?${params.toString()}` : '';
  return apiRequest(`/api/v1/superadmin/accounts${queryStr}`, { method: 'GET' });
}

export async function superAdminResetPasswordApi(
  userId: string,
  data: {
    temporaryPassword?: string;
    mustChangePassword?: boolean;
    reason?: string;
  } = {}
): Promise<{
  success: boolean;
  message: string;
  temporaryPassword: string;
  mustChangePassword: boolean;
  user: { id: string; email: string; firstName: string; lastName: string };
}> {
  return apiRequest(`/api/v1/superadmin/accounts/${encodeURIComponent(userId)}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function superAdminUnlockAccountApi(
  userId: string,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/v1/superadmin/accounts/${encodeURIComponent(userId)}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

export async function superAdminUpdateAccountStatusApi(
  userId: string,
  isActive: boolean,
  reason?: string
): Promise<{ success: boolean; message: string }> {
  return apiRequest(`/api/v1/superadmin/accounts/${encodeURIComponent(userId)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive, reason }),
  });
}

// ============================================================================
// DYNAMIC WEBSITE CMS & GALLERY API
// ============================================================================

export const websiteApi = {
  // Public Endpoints
  async getPublicData(schoolIdentifier?: string): Promise<ApiResponse<PublicWebsiteData>> {
    const query = schoolIdentifier ? `?schoolId=${encodeURIComponent(schoolIdentifier)}` : '';
    return apiRequest<ApiResponse<PublicWebsiteData>>(`/api/v1/website/public${query}`);
  },

  async getGalleryCategories(schoolIdentifier?: string): Promise<ApiResponse<any[]>> {
    const query = schoolIdentifier ? `?schoolId=${encodeURIComponent(schoolIdentifier)}` : '';
    return apiRequest<ApiResponse<any[]>>(`/api/v1/website/gallery/categories${query}`);
  },

  async getGalleryItems(params: {
    categoryId?: string;
    mediaType?: 'ALL' | 'IMAGE' | 'VIDEO';
    page?: number;
    limit?: number;
    schoolIdentifier?: string;
  } = {}): Promise<ApiResponse<{ items: any[]; total: number; page: number; limit: number }>> {
    const q = new URLSearchParams();
    if (params.categoryId) q.set('categoryId', params.categoryId);
    if (params.mediaType && params.mediaType !== 'ALL') q.set('mediaType', params.mediaType);
    if (params.page) q.set('page', String(params.page));
    if (params.limit) q.set('limit', String(params.limit));
    if (params.schoolIdentifier) q.set('schoolId', params.schoolIdentifier);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<ApiResponse<{ items: any[]; total: number; page: number; limit: number }>>(`/api/v1/website/gallery/items${qs}`);
  },

  async getPublicDocuments(schoolIdentifier?: string): Promise<ApiResponse<any[]>> {
    const query = schoolIdentifier ? `?schoolId=${encodeURIComponent(schoolIdentifier)}` : '';
    return apiRequest<ApiResponse<any[]>>(`/api/v1/website/documents${query}`);
  },

  // School Admin Endpoints
  async getAdminData(): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin');
  },

  async updateContent(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/content', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async updateBranding(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/branding', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Highlights
  async createHighlight(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/highlights', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateHighlight(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/highlights/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteHighlight(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/highlights/${id}`, {
      method: 'DELETE',
    });
  },

  // Facilities
  async createFacility(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/facilities', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateFacility(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/facilities/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteFacility(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/facilities/${id}`, {
      method: 'DELETE',
    });
  },

  // Achievements
  async createAchievement(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/achievements', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateAchievement(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/achievements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteAchievement(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/achievements/${id}`, {
      method: 'DELETE',
    });
  },

  // Testimonials
  async createTestimonial(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/testimonials', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateTestimonial(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteTestimonial(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/testimonials/${id}`, {
      method: 'DELETE',
    });
  },

  // Documents
  async createDocument(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateDocument(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/documents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteDocument(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // Gallery Categories
  async createGalleryCategory(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/gallery/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateGalleryCategory(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/gallery/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteGalleryCategory(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/gallery/categories/${id}`, {
      method: 'DELETE',
    });
  },

  // Gallery Items
  async createGalleryItem(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/website/admin/gallery/items', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateGalleryItem(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/gallery/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteGalleryItem(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/website/admin/gallery/items/${id}`, {
      method: 'DELETE',
    });
  },
};

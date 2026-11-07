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

export async function loginApi(email: string, password: string): Promise<any> {
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
  if (json.data?.mfaRequired) {
    return json.data;
  }
  setAuthSession(json.data.accessToken, json.data.user);
  return json.data;
}

export const authApi = {
  verifyMfa: (data: { mfaToken: string; otpCode: string }) =>
    apiRequest<any>('/api/v1/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendMfa: (data: { mfaToken: string }) =>
    apiRequest<any>('/api/v1/auth/mfa/resend', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  toggleMfa: (data: { enable: boolean; method?: string }) =>
    apiRequest<any>('/api/v1/auth/mfa/toggle', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

export const storageApi = {
  uploadFile: (data: { originalName: string; mimeType: string; category?: string; isPublic?: boolean; base64Data: string; metadata?: any }) =>
    apiRequest<any>('/api/v1/storage/upload', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  listFiles: (params?: { category?: string; isPublic?: boolean; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.category) q.set('category', params.category);
    if (params?.isPublic !== undefined) q.set('isPublic', String(params.isPublic));
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any>(`/api/v1/storage/files${qs}`);
  },
  getFileMetadata: (id: string) => apiRequest<any>(`/api/v1/storage/files/${encodeURIComponent(id)}/meta`),
  deleteFile: (id: string) =>
    apiRequest<any>(`/api/v1/storage/files/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),
};

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

// ============================================================================
// ADMISSION MANAGEMENT & ONLINE PORTAL API
// ============================================================================

export const admissionsApi = {
  // Public APIs
  async getPublicConfig(school?: string): Promise<ApiResponse<any>> {
    const q = school ? `?school=${encodeURIComponent(school)}` : '';
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/public/config${q}`);
  },

  async submitEnquiry(data: any, school?: string): Promise<ApiResponse<any>> {
    const q = school ? `?school=${encodeURIComponent(school)}` : '';
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/public/enquiry${q}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitApplication(data: any, school?: string): Promise<ApiResponse<any>> {
    const q = school ? `?school=${encodeURIComponent(school)}` : '';
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/public/apply${q}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async trackStatus(data: { applicationNumber: string; verificationContact: string }, school?: string): Promise<ApiResponse<any>> {
    const q = school ? `?school=${encodeURIComponent(school)}` : '';
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/public/track${q}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin APIs
  async getAdminStats(): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/admissions/admin/stats');
  },

  async listAdminEnquiries(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.search) sp.set('search', params.search);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/admin/enquiries${qs}`);
  },

  async updateAdminEnquiry(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/admin/enquiries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteAdminEnquiry(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/admin/enquiries/${id}`, {
      method: 'DELETE',
    });
  },

  async listAdminApplications(params?: { status?: string; search?: string; applyingClass?: string; page?: number; limit?: number }): Promise<ApiResponse<any>> {
    const sp = new URLSearchParams();
    if (params?.status) sp.set('status', params.status);
    if (params?.search) sp.set('search', params.search);
    if (params?.applyingClass) sp.set('applyingClass', params.applyingClass);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/admin/applications${qs}`);
  },

  async getAdminApplicationById(id: string): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/admin/applications/${id}`);
  },

  async reviewApplication(id: string, data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>(`/api/v1/admissions/admin/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateAdmissionConfig(data: any): Promise<ApiResponse<any>> {
    return apiRequest<ApiResponse<any>>('/api/v1/admissions/admin/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// ID CARD MANAGEMENT & TEMPLATES API (SECTION 4)
// ============================================================================

export const idCardsApi = {
  // Self-Service (Student & Teacher/Staff)
  async getMyIdCard(): Promise<any> {
    return apiRequest<any>('/api/v1/id-cards/my-card');
  },

  // Admin Dashboard & Telemetry
  async getDashboardStats(): Promise<any> {
    return apiRequest<any>('/api/v1/id-cards/admin/stats');
  },

  // Student Rosters
  async listStudents(params?: { classId?: string; sectionId?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<any> {
    const sp = new URLSearchParams();
    if (params?.classId) sp.set('classId', params.classId);
    if (params?.sectionId) sp.set('sectionId', params.sectionId);
    if (params?.status) sp.set('status', params.status);
    if (params?.search) sp.set('search', params.search);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest<any>(`/api/v1/id-cards/admin/students${qs}`);
  },

  // Employee Rosters
  async listEmployees(params?: { category?: string; departmentId?: string; status?: string; search?: string; page?: number; limit?: number }): Promise<any> {
    const sp = new URLSearchParams();
    if (params?.category) sp.set('category', params.category);
    if (params?.departmentId) sp.set('departmentId', params.departmentId);
    if (params?.status) sp.set('status', params.status);
    if (params?.search) sp.set('search', params.search);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest<any>(`/api/v1/id-cards/admin/employees${qs}`);
  },

  // Generation & Status
  async generateIndividual(data: { holderType: string; profileId: string; templateId?: string }): Promise<any> {
    return apiRequest<any>('/api/v1/id-cards/admin/generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async bulkGenerate(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/id-cards/admin/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateStatus(cardId: string, data: { status: string; reason?: string }): Promise<any> {
    return apiRequest<any>(`/api/v1/id-cards/admin/cards/${cardId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Templates
  async listTemplates(): Promise<any> {
    return apiRequest<any>('/api/v1/id-cards/admin/templates');
  },

  async createTemplate(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/id-cards/admin/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateTemplate(id: string, data: any): Promise<any> {
    return apiRequest<any>(`/api/v1/id-cards/admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteTemplate(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/id-cards/admin/templates/${id}`, {
      method: 'DELETE',
    });
  },

  // Photo Management (Student & Employee)
  async uploadStudentPhoto(studentId: string, payload: { photoData: string; fileName?: string; mimeType?: string }): Promise<any> {
    return apiRequest<any>(`/api/v1/id-cards/admin/students/${studentId}/photo`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async removeStudentPhoto(studentId: string): Promise<any> {
    return apiRequest<any>(`/api/v1/id-cards/admin/students/${studentId}/photo`, {
      method: 'DELETE',
    });
  },

  async uploadEmployeePhoto(employeeId: string, payload: { photoData: string; fileName?: string; mimeType?: string }): Promise<any> {
    return apiRequest<any>(`/api/v1/id-cards/admin/employees/${employeeId}/photo`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async removeEmployeePhoto(employeeId: string): Promise<any> {
    return apiRequest<any>(`/api/v1/id-cards/admin/employees/${employeeId}/photo`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// ADMIT CARD GENERATION, DOWNLOAD & CLEARANCE API (SECTION 5)
// ============================================================================

export const admitCardsApi = {
  // Admin & Exam Coordinator Telemetry
  async getDashboardStats(): Promise<any> {
    return apiRequest<any>('/api/v1/admit-cards/admin/stats');
  },

  // Admin Rosters & Directory
  async listAdmitCards(params?: {
    examTitle?: string;
    className?: string;
    sectionName?: string;
    status?: string;
    clearanceStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const sp = new URLSearchParams();
    if (params?.examTitle) sp.set('examTitle', params.examTitle);
    if (params?.className) sp.set('className', params.className);
    if (params?.sectionName) sp.set('sectionName', params.sectionName);
    if (params?.status) sp.set('status', params.status);
    if (params?.clearanceStatus) sp.set('clearanceStatus', params.clearanceStatus);
    if (params?.search) sp.set('search', params.search);
    if (params?.page) sp.set('page', String(params.page));
    if (params?.limit) sp.set('limit', String(params.limit));
    const qs = sp.toString() ? `?${sp.toString()}` : '';
    return apiRequest<any>(`/api/v1/admit-cards/admin/list${qs}`);
  },

  // Single Candidate Generation
  async generateIndividual(data: {
    studentProfileId: string;
    examTitle: string;
    examType?: string;
    academicSessionId?: string;
    centerName?: string;
    roomNumber?: string;
    candidateInstructions?: string;
    rollNumber?: string;
    overrideClearance?: boolean;
    clearanceReason?: string;
  }): Promise<any> {
    return apiRequest<any>('/api/v1/admit-cards/admin/generate-individual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Bulk Generation Studio
  async bulkGenerate(data: {
    examTitle: string;
    examType?: string;
    academicSessionId?: string;
    className?: string;
    sectionName?: string;
    studentProfileIds?: string[];
    allEligible?: boolean;
    centerName?: string;
    defaultRoomNumber?: string;
    candidateInstructions?: string;
    skipUnpaidFees?: boolean;
    feeThresholdAmount?: number;
    skipLowAttendance?: boolean;
    minAttendancePercent?: number;
  }): Promise<any> {
    return apiRequest<any>('/api/v1/admit-cards/admin/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Publishing & Withholding Gatekeeper
  async publishCards(data: {
    cardIds: string[];
    action: 'PUBLISH' | 'UNPUBLISH' | 'WITHHOLD' | 'REVOKE';
    enforceClearance?: boolean;
  }): Promise<any> {
    return apiRequest<any>('/api/v1/admit-cards/admin/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Clearance Override
  async updateClearance(
    cardId: string,
    data: {
      clearanceStatus: 'CLEARED' | 'PENDING_FEES' | 'PENDING_ATTENDANCE' | 'PENDING_ADMIN' | 'BLOCKED';
      reason?: string;
    }
  ): Promise<any> {
    return apiRequest<any>(`/api/v1/admit-cards/admin/cards/${cardId}/clearance`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Student Self-Service
  async getMyAdmitCards(): Promise<any> {
    return apiRequest<any>('/api/v1/admit-cards/my-cards');
  },

  // Parent / Guardian Self-Service
  async getChildAdmitCards(studentProfileId?: string): Promise<any> {
    const qs = studentProfileId ? `?studentProfileId=${encodeURIComponent(studentProfileId)}` : '';
    return apiRequest<any>(`/api/v1/admit-cards/child-cards${qs}`);
  },

  // Public Verification (QR Code)
  async verifyAdmitCardToken(token: string): Promise<any> {
    return apiRequest<any>(`/api/v1/admit-cards/public/verify/${encodeURIComponent(token)}`);
  },
};

// ============================================================================
// SECTION 6: QUESTION BANK, QUESTION PAPER & ASSESSMENT ENGINE API
// ============================================================================

export const assessmentApi = {
  // Question Bank Management
  async listQuestionBank(filters?: {
    subjectId?: string;
    classId?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    questionType?: string;
    chapter?: string;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.difficulty) params.append('difficulty', filters.difficulty);
    if (filters?.questionType) params.append('questionType', filters.questionType);
    if (filters?.chapter) params.append('chapter', filters.chapter);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/assessments/bank${qs}`);
  },

  async getQuestionBankItem(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/bank/${id}`);
  },

  async createQuestionBankItem(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/assessments/bank', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateQuestionBankItem(id: string, data: any): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/bank/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteQuestionBankItem(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/bank/${id}`, {
      method: 'DELETE',
    });
  },

  // Question Papers Builder
  async listQuestionPapers(filters?: {
    subjectId?: string;
    classId?: string;
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    examScheduleId?: string;
    search?: string;
  }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.subjectId) params.append('subjectId', filters.subjectId);
    if (filters?.classId) params.append('classId', filters.classId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.examScheduleId) params.append('examScheduleId', filters.examScheduleId);
    if (filters?.search) params.append('search', filters.search);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/assessments/papers${qs}`);
  },

  async getQuestionPaper(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/papers/${id}`);
  },

  async createQuestionPaper(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/assessments/papers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateQuestionPaper(id: string, data: any): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/papers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async deleteQuestionPaper(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/papers/${id}`, {
      method: 'DELETE',
    });
  },

  // Online Exam Taking Engine
  async startAttempt(paperId: string): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/papers/${paperId}/attempts/start`, {
      method: 'POST',
    });
  },

  async saveAnswer(data: { attemptId: string; paperItemId: string; studentAnswer: any }): Promise<any> {
    return apiRequest<any>('/api/v1/assessments/attempts/answer', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitAttempt(data: { attemptId: string; answers?: any[]; isAutoSubmitted?: boolean }): Promise<any> {
    return apiRequest<any>('/api/v1/assessments/attempts/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAttempt(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/attempts/${id}`);
  },

  // Manual Evaluation & Publishing
  async evaluateAttempt(data: {
    attemptId: string;
    status?: 'SUBMITTED' | 'EVALUATED' | 'PUBLISHED';
    teacherFeedback?: string;
    itemEvaluations: Array<{ paperItemId: string; marksAwarded: number; teacherRemarks?: string }>;
  }): Promise<any> {
    return apiRequest<any>('/api/v1/assessments/attempts/evaluate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async publishResults(paperId: string, data: { publish: boolean; syncToExamMarks?: boolean }): Promise<any> {
    return apiRequest<any>(`/api/v1/assessments/papers/${paperId}/publish-results`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Student / Parent Results
  async getStudentResults(studentProfileId?: string): Promise<any[]> {
    const qs = studentProfileId ? `?studentProfileId=${encodeURIComponent(studentProfileId)}` : '';
    return apiRequest<any[]>(`/api/v1/assessments/results/student${qs}`);
  },
};

export const marksheetsApi = {
  // Stats & Telemetry
  async getStats(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/stats');
    return res?.data ?? res;
  },

  // Templates
  async getTemplates(): Promise<any[]> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/templates');
    return res?.data ?? res;
  },

  async createTemplate(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/templates', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async updateTemplate(id: string, data: any): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/marksheets/admin/templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async deleteTemplate(id: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/marksheets/admin/templates/${id}`, {
      method: 'DELETE',
    });
    return res?.data ?? res;
  },

  // Grading Criteria
  async getGrading(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/grading');
    return res?.data ?? res;
  },

  async updateGrading(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/grading', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  // Marksheets Roster & Management
  async listMarksheets(params?: {
    search?: string;
    classId?: string;
    className?: string;
    examTitle?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ items: any[]; total: number; page: number; limit: number; totalPages: number }> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.classId) q.set('classId', params.classId);
    if (params?.className) q.set('className', params.className);
    if (params?.examTitle) q.set('examTitle', params.examTitle);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));

    const qs = q.toString() ? `?${q.toString()}` : '';
    const res = await apiRequest<any>(`/api/v1/marksheets/admin/list${qs}`);
    return res?.data ?? res;
  },

  async getMarksheetById(id: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/marksheets/admin/cards/${id}`);
    return res?.data ?? res;
  },

  async generateIndividual(data: {
    studentProfileId: string;
    examTitle: string;
    examType?: string;
    academicSessionId?: string;
    templateId?: string;
    subjectMarks?: any[];
    classTeacherRemarks?: string;
    principalRemarks?: string;
  }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/generate-individual', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async bulkGenerate(data: {
    examTitle: string;
    examType?: string;
    academicSessionId?: string;
    classId?: string;
    sectionId?: string;
    allEligible?: boolean;
    templateId?: string;
    publishImmediately?: boolean;
  }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/bulk-generate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async publishMarksheets(data: {
    marksheetIds?: string[];
    action: 'PUBLISH' | 'UNPUBLISH' | 'WITHHOLD';
    examTitle?: string;
    className?: string;
  }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/publish', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res;
  },

  async correctMarksheet(data: {
    marksheetId: string;
    reason: string;
    updatedSubjectMarks?: any[];
    classTeacherRemarks?: string;
    principalRemarks?: string;
  }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/marksheets/admin/correct', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async getAudits(marksheetId?: string): Promise<any[]> {
    const qs = marksheetId ? `?marksheetId=${encodeURIComponent(marksheetId)}` : '';
    const res = await apiRequest<any>(`/api/v1/marksheets/admin/audits${qs}`);
    return res?.data ?? res;
  },

  // Student & Parent Self-Service
  async getMyMarksheets(): Promise<any[]> {
    const res = await apiRequest<any>('/api/v1/marksheets/my-marksheets');
    return res?.data ?? res;
  },

  async getChildMarksheets(studentProfileId?: string): Promise<any[]> {
    const qs = studentProfileId ? `?studentProfileId=${encodeURIComponent(studentProfileId)}` : '';
    const res = await apiRequest<any>(`/api/v1/marksheets/child-marksheets${qs}`);
    return res?.data ?? res;
  },

  // Public QR Verification
  async verifyPublicToken(token: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/marksheets/public/verify/${encodeURIComponent(token)}`);
    return res?.data ?? res;
  },
};

// ============================================================================
// SECTION 8: ROLE-BASED PORTALS API (STUDENT, PARENT, TEACHER)
// ============================================================================

export const portalsApi = {
  // Student Portal
  async getStudentDashboard(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/portals/student/dashboard');
    return res?.data ?? res;
  },

  async getStudentAdmissionDetails(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/portals/student/admission-details');
    return res?.data ?? res;
  },

  async getStudentLibrary(): Promise<any[]> {
    const res = await apiRequest<any>('/api/v1/portals/student/library');
    return res?.data ?? res ?? [];
  },

  async getStudentMeetings(): Promise<any[]> {
    const res = await apiRequest<any>('/api/v1/portals/student/meetings');
    return res?.data ?? res ?? [];
  },

  // Parent Portal (Multi-Child)
  async getParentChildren(): Promise<any[]> {
    const res = await apiRequest<any>('/api/v1/portals/parent/children');
    return res?.data ?? res ?? [];
  },

  async getParentChildDashboard(studentProfileId: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/portals/parent/child/${encodeURIComponent(studentProfileId)}/dashboard`);
    return res?.data ?? res;
  },

  async getParentChildHomework(studentProfileId: string): Promise<any[]> {
    const res = await apiRequest<any>(`/api/v1/portals/parent/child/${encodeURIComponent(studentProfileId)}/homework`);
    return res?.data ?? res ?? [];
  },

  async getParentChildReceipts(studentProfileId: string): Promise<any[]> {
    const res = await apiRequest<any>(`/api/v1/portals/parent/child/${encodeURIComponent(studentProfileId)}/receipts`);
    return res?.data ?? res ?? [];
  },

  async getParentChildMeetings(studentProfileId: string): Promise<any[]> {
    const res = await apiRequest<any>(`/api/v1/portals/parent/child/${encodeURIComponent(studentProfileId)}/meetings`);
    return res?.data ?? res ?? [];
  },

  async getParentChildAdmission(studentProfileId: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/portals/parent/child/${encodeURIComponent(studentProfileId)}/dashboard`);
    return res?.data?.student ?? res?.student ?? res;
  },

  async getParentMessages(studentProfileId: string): Promise<any[]> {
    const res = await apiRequest<any>(`/api/v1/portals/parent/child/${encodeURIComponent(studentProfileId)}/messages`);
    return res?.data ?? res ?? [];
  },

  async getMessages(studentProfileId?: string): Promise<any[]> {
    if (studentProfileId) {
      return this.getParentMessages(studentProfileId);
    }
    const res = await apiRequest<any>('/api/v1/portals/parent/messages');
    return res?.data ?? res ?? [];
  },

  async sendParentMessage(studentProfileId: string, data: { subject?: string; messageContent: string; recipientUserId?: string }): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/portals/parent/child/${encodeURIComponent(studentProfileId)}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async sendMessage(data: { studentProfileId?: string; subject?: string; messageContent: string; channel?: string; recipientUserId?: string }): Promise<any> {
    if (data.studentProfileId) {
      return this.sendParentMessage(data.studentProfileId, data);
    }
    const res = await apiRequest<any>('/api/v1/portals/parent/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  // Teacher Portal
  async getTeacherDashboard(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/portals/teacher/dashboard');
    return res?.data ?? res;
  },

  async getTeacherAcademicReports(params?: { classId?: string; subjectId?: string; className?: string; sectionName?: string }): Promise<any> {
    const qs = new URLSearchParams();
    if (params?.classId) qs.set('classId', params.classId);
    if (params?.subjectId) qs.set('subjectId', params.subjectId);
    if (params?.className) qs.set('className', params.className);
    if (params?.sectionName) qs.set('sectionName', params.sectionName);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    const res = await apiRequest<any>(`/api/v1/portals/teacher/academic-reports${queryString}`);
    return res?.data ?? res;
  },

  async getTeacherAcademicReport(params?: { classId?: string; subjectId?: string; className?: string; sectionName?: string }): Promise<any> {
    return this.getTeacherAcademicReports(params);
  },

  async getTeacherMeetings(params?: { status?: string }): Promise<any[]> {
    const qs = params?.status ? `?status=${encodeURIComponent(params.status)}` : '';
    const res = await apiRequest<any>(`/api/v1/portals/teacher/meetings${qs}`);
    return res?.data ?? res ?? [];
  },

  async getTeacherRemarks(studentProfileId?: string): Promise<any[]> {
    if (studentProfileId) {
      return this.getStudentRemarks(studentProfileId);
    }
    const res = await apiRequest<any>('/api/v1/portals/student/dashboard');
    return res?.data?.remarks ?? res?.remarks ?? [];
  },

  async getStudentRemarks(studentProfileId: string): Promise<any[]> {
    const res = await apiRequest<any>(`/api/v1/portals/teacher/students/${encodeURIComponent(studentProfileId)}/remarks`);
    return res?.data ?? res ?? [];
  },

  async addStudentRemark(data: { studentProfileId: string; remark: string; category?: string; academicSessionId?: string; isPrivate?: boolean }): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/portals/teacher/students/${encodeURIComponent(data.studentProfileId)}/remarks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async scheduleMeeting(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/portals/teacher/meetings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async updateMeeting(meetingId: string, data: any): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/portals/teacher/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async updateMeetingStatus(meetingId: string, data: { status?: string; notes?: string; joiningUrl?: string; scheduledDate?: string; startTime?: string; endTime?: string }): Promise<any> {
    return this.updateMeeting(meetingId, data);
  },

  async deleteMeeting(meetingId: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/portals/teacher/meetings/${encodeURIComponent(meetingId)}`, {
      method: 'DELETE',
    });
    return res?.data ?? res;
  },

  // Library Module
  async listLibraryBooks(params?: { search?: string; category?: string }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.category) qs.set('category', params.category);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    const res = await apiRequest<any>(`/api/v1/portals/library/books${queryString}`);
    return res?.data ?? res ?? [];
  },

  async createLibraryBook(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/portals/library/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async issueLibraryBook(data: { bookId: string; studentProfileId: string; dueDate: string; notes?: string }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/portals/library/issue', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async returnLibraryBook(issueId: string, fineAmount: number = 0): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/portals/library/return/${encodeURIComponent(issueId)}`, {
      method: 'POST',
      body: JSON.stringify({ fineAmount }),
    });
    return res?.data ?? res;
  },
};

// ============================================================================
// SECTION 9: INTERNAL CHAT, MESSAGING, MEETINGS & CALENDAR API
// ============================================================================

export const communicationApi = {
  // 1. One-to-One and Group Chat
  async getOrCreateDirectConversation(targetUserId: string): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/direct', {
      method: 'POST',
      body: JSON.stringify({ targetUserId }),
    });
    return res?.data ?? res;
  },

  async createGroupConversation(data: {
    title: string;
    participantIds: string[];
    groupType?: string;
    initialMessage?: string;
  }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/groups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async listUserConversations(query?: string): Promise<any[]> {
    const qs = query ? `?q=${encodeURIComponent(query)}` : '';
    const res = await apiRequest<any>(`/api/v1/communication/conversations${qs}`);
    return res?.data ?? res ?? [];
  },

  async getConversationDetails(id: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/communication/conversations/${encodeURIComponent(id)}`);
    return res?.data ?? res;
  },

  async addGroupParticipants(id: string, userIds: string[]): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/communication/groups/${encodeURIComponent(id)}/participants`, {
      method: 'POST',
      body: JSON.stringify({ userIds }),
    });
    return res?.data ?? res;
  },

  async removeGroupParticipant(id: string, targetUserId: string): Promise<any> {
    const res = await apiRequest<any>(
      `/api/v1/communication/groups/${encodeURIComponent(id)}/participants/${encodeURIComponent(targetUserId)}`,
      { method: 'DELETE' }
    );
    return res?.data ?? res;
  },

  // 2. Messages, Receipts & Search
  async sendMessage(data: {
    conversationId: string;
    content: string;
    messageType?: string;
    attachments?: Array<{ fileName: string; fileUrl: string; fileType: string; fileSize: number }>;
  }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/messages', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async getConversationMessages(id: string, limit = 50, before?: string): Promise<any[]> {
    const qs = new URLSearchParams();
    qs.set('limit', String(limit));
    if (before) qs.set('before', before);
    const res = await apiRequest<any>(`/api/v1/communication/conversations/${encodeURIComponent(id)}/messages?${qs.toString()}`);
    return res?.data ?? res ?? [];
  },

  async markMessageRead(conversationId: string, messageId: string): Promise<any> {
    const res = await apiRequest<any>(
      `/api/v1/communication/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/read`,
      { method: 'POST' }
    );
    return res?.data ?? res;
  },

  async searchMessages(query: string): Promise<any[]> {
    const res = await apiRequest<any>(`/api/v1/communication/messages/search?q=${encodeURIComponent(query)}`);
    return res?.data ?? res ?? [];
  },

  // 3. Reporting & Moderation
  async reportMessage(data: { messageId: string; reason: string }): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/messages/report', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async listReportedMessages(): Promise<any[]> {
    const res = await apiRequest<any>('/api/v1/communication/moderation/reports');
    return res?.data ?? res ?? [];
  },

  async moderateReport(reportId: string, data: { action: string; moderatorNotes?: string }): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/communication/moderation/reports/${encodeURIComponent(reportId)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  // 4. Super Admin Monitoring & Export
  async getSuperAdminMonitoringTelemetry(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/superadmin/telemetry');
    return res?.data ?? res;
  },

  async listMonitoredConversations(filters?: { schoolId?: string; role?: string; userId?: string; search?: string }): Promise<any[]> {
    const qs = new URLSearchParams();
    if (filters?.schoolId) qs.set('schoolId', filters.schoolId);
    if (filters?.role) qs.set('role', filters.role);
    if (filters?.userId) qs.set('userId', filters.userId);
    if (filters?.search) qs.set('search', filters.search);
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    const res = await apiRequest<any>(`/api/v1/communication/superadmin/conversations${queryString}`);
    return res?.data ?? res ?? [];
  },

  async exportConversationRecords(id: string, format: 'PDF' | 'CSV' = 'CSV'): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/communication/superadmin/conversations/${encodeURIComponent(id)}/export?format=${format}`);
    return res?.data ?? res;
  },

  async getCommunicationAuditLogs(schoolId?: string): Promise<any[]> {
    const qs = schoolId ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    const res = await apiRequest<any>(`/api/v1/communication/superadmin/audit-logs${qs}`);
    return res?.data ?? res ?? [];
  },

  async getPermissionConfig(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/permissions/config');
    return res?.data ?? res;
  },

  async updatePermissionConfig(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/permissions/config', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  // 5. Google Workspace & Meet
  async getGoogleIntegration(): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/google/config');
    return res?.data ?? res;
  },

  async configureGoogleWorkspace(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/google/config', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async scheduleMeetingWithGoogleMeet(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/meetings/schedule', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  // 6. Calendar Events
  async listCalendarEvents(month?: number, year?: number): Promise<any[]> {
    const qs = new URLSearchParams();
    if (month) qs.set('month', String(month));
    if (year) qs.set('year', String(year));
    const queryString = qs.toString() ? `?${qs.toString()}` : '';
    const res = await apiRequest<any>(`/api/v1/communication/calendar/events${queryString}`);
    return res?.data ?? res ?? [];
  },

  async createCalendarEvent(data: any): Promise<any> {
    const res = await apiRequest<any>('/api/v1/communication/calendar/events', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async updateCalendarEvent(id: string, data: any): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/communication/calendar/events/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res?.data ?? res;
  },

  async deleteCalendarEvent(id: string): Promise<any> {
    const res = await apiRequest<any>(`/api/v1/communication/calendar/events/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    return res?.data ?? res;
  },

  // Ergonomic Aliases
  getConversations(query?: string) {
    return this.listUserConversations(query);
  },
  getMessages(id: string, opts?: { limit?: number; before?: string }) {
    return this.getConversationMessages(id, opts?.limit ?? 50, opts?.before);
  },
  markMessageAsRead(conversationId: string, messageId: string) {
    return this.markMessageRead(conversationId, messageId);
  },
  createGroup(data: { title: string; groupType?: string; participantUserIds: string[] }) {
    return this.createGroupConversation({
      title: data.title,
      groupType: data.groupType,
      participantIds: data.participantUserIds,
    });
  },
  getReportedMessages() {
    return this.listReportedMessages();
  },
  moderateReportedMessage(id: string, data: { status: string; moderatorNotes?: string }) {
    return this.moderateReport(id, { action: data.status, moderatorNotes: data.moderatorNotes });
  },
  getSuperAdminTelemetry() {
    return this.getSuperAdminMonitoringTelemetry();
  },
  getSuperAdminConversations(filters?: any) {
    return this.listMonitoredConversations(filters);
  },
  getSuperAdminAuditLogs(schoolId?: string) {
    return this.getCommunicationAuditLogs(schoolId);
  },
  exportConversation(id: string, format: 'PDF' | 'CSV' = 'CSV') {
    return this.exportConversationRecords(id, format);
  },
  getCalendarEvents(params?: any) {
    return this.listCalendarEvents(params?.month, params?.year);
  },
  updateEvent(id: string, data: any) {
    return this.updateCalendarEvent(id, data);
  },
  deleteEvent(id: string) {
    return this.deleteCalendarEvent(id);
  },
  getGoogleWorkspaceConfig() {
    return this.getGoogleIntegration();
  },
  scheduleMeeting(data: any) {
    return this.scheduleMeetingWithGoogleMeet(data);
  },
};

// ============================================================================
// SECTION 11: LIBRARY MANAGEMENT SYSTEM API CLIENT
// ============================================================================
export const libraryApi = {
  getDashboardStats(): Promise<any> {
    return apiRequest<any>('/api/v1/library/dashboard/stats');
  },
  listBooks(params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.category) query.append('category', params.category);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<any>(
      `/api/v1/library/books${qs ? `?${qs}` : ''}`
    );
  },
  getBookById(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/library/books/${id}`);
  },
  createBook(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/library/books', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateBook(id: string, data: any): Promise<any> {
    return apiRequest<any>(`/api/v1/library/books/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteBook(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/library/books/${id}`, {
      method: 'DELETE',
    });
  },
  listIssues(params?: {
    studentProfileId?: string;
    bookId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.studentProfileId) query.append('studentProfileId', params.studentProfileId);
    if (params?.bookId) query.append('bookId', params.bookId);
    if (params?.status) query.append('status', params.status);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<any>(
      `/api/v1/library/issues${qs ? `?${qs}` : ''}`
    );
  },
  issueBook(data: { bookId: string; studentProfileId: string; dueDate: string; notes?: string }): Promise<any> {
    return apiRequest<any>('/api/v1/library/issues', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  returnBook(issueId: string, data: { returnCondition?: string; notes?: string; waiveFine?: boolean }): Promise<any> {
    return apiRequest<any>(`/api/v1/library/issues/${issueId}/return`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  getOverdueBooks(params?: { page?: number; limit?: number }): Promise<any> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    const qs = query.toString();
    return apiRequest<any>(
      `/api/v1/library/overdue${qs ? `?${qs}` : ''}`
    );
  },
  updateFineStatus(issueId: string, data: { fineStatus: 'PAID' | 'WAIVED' | 'PENDING'; notes?: string }): Promise<any> {
    return apiRequest<any>(`/api/v1/library/issues/${issueId}/fine`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  getStudentHistory(studentProfileId: string): Promise<any> {
    return apiRequest<any>(`/api/v1/library/students/${studentProfileId}/history`);
  },
  getMyHistory(): Promise<any> {
    return apiRequest<any>('/api/v1/library/my-history');
  },
  getSettings(): Promise<any> {
    return apiRequest<any>('/api/v1/library/settings');
  },
  updateSettings(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/library/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  generateReport(params: {
    reportType: string;
    startDate?: string;
    endDate?: string;
    category?: string;
  }): Promise<any> {
    const query = new URLSearchParams();
    query.append('reportType', params.reportType);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.category) query.append('category', params.category);
    return apiRequest<any>(`/api/v1/library/reports?${query.toString()}`);
  },
  seedSampleBooks(): Promise<any> {
    return apiRequest<any>('/api/v1/library/seed-sample-books', {
      method: 'POST',
    });
  },
};

// ============================================================================
// 13. AI CHATBOT, FAQ & ENQUIRY APIS
// ============================================================================

export const chatbotApi = {
  // Public Chatbot APIs
  getPublicData(schoolIdentifier?: string): Promise<{
    school: { id: string; name: string; slug?: string; contactPhone?: string; contactEmail?: string; address?: string };
    config: {
      botName: string;
      welcomeMessage: string;
      suggestedQuestions: string[];
      fallbackMessage: string;
      whatsappNumber?: string;
      whatsappPrefillText?: string;
      whatsappEnabled: boolean;
      escalationEnabled: boolean;
      escalationMessage?: string;
      escalationPhone?: string;
      escalationEmail?: string;
      escalationAvailability?: string;
    };
    faqs: Array<{ id: string; question: string; answer: string; category: string; displayOrder: number }>;
  }> {
    const query = schoolIdentifier ? `?schoolIdentifier=${encodeURIComponent(schoolIdentifier)}` : '';
    return apiRequest(`/api/v1/ai/chatbot/public-data${query}`);
  },

  sendMessage(data: {
    message?: string;
    question?: string;
    history?: Array<{ sender: 'user' | 'bot'; text: string }>;
    conversationHistory?: Array<{ sender: 'user' | 'bot'; text: string }>;
    schoolIdentifier?: string;
  }): Promise<any> {
    const text = data.message || data.question || '';
    const hist = data.history || data.conversationHistory || [];
    return apiRequest('/api/v1/ai/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        question: text,
        history: hist,
        conversationHistory: hist,
        schoolIdentifier: data.schoolIdentifier,
      }),
    });
  },

  submitEnquiry(data: {
    schoolIdentifier?: string;
    parentName: string;
    studentName: string;
    phone: string;
    email?: string;
    classApplying: string;
    previousSchool?: string;
    message?: string;
  }): Promise<{
    success: boolean;
    enquiryNumber: string;
    message: string;
    applyUrl: string;
  }> {
    return apiRequest('/api/v1/ai/chatbot/enquiry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  submitEscalation(data: {
    schoolIdentifier?: string;
    visitorName: string;
    visitorPhone: string;
    visitorEmail?: string;
    query: string;
    reason?: string;
    conversationSnapshot?: any;
  }): Promise<{
    escalationId: string;
    message: string;
  }> {
    return apiRequest('/api/v1/ai/chatbot/escalation', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin FAQ Management APIs
  listFaqs(params?: { category?: string; search?: string; isPublished?: boolean }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.isPublished !== undefined) q.set('isPublished', String(params.isPublished));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any>(`/api/v1/ai/admin/faqs${qs}`).then((res) => (res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : []));
  },

  createFaq(data: {
    question: string;
    answer: string;
    category: string;
    displayOrder?: number;
    isPublished?: boolean;
  }): Promise<any> {
    return apiRequest('/api/v1/ai/admin/faqs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFaq(id: string, data: {
    question?: string;
    answer?: string;
    category?: string;
    displayOrder?: number;
    isPublished?: boolean;
  }): Promise<any> {
    return apiRequest(`/api/v1/ai/admin/faqs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteFaq(id: string): Promise<any> {
    return apiRequest(`/api/v1/ai/admin/faqs/${id}`, {
      method: 'DELETE',
    });
  },

  reorderFaqs(faqIds: string[]): Promise<any> {
    return apiRequest('/api/v1/ai/admin/faqs/reorder', {
      method: 'POST',
      body: JSON.stringify({ faqIds }),
    });
  },

  // Admin Chatbot Config APIs
  getConfig(): Promise<any> {
    return apiRequest('/api/v1/ai/admin/config');
  },

  updateConfig(data: any): Promise<any> {
    return apiRequest('/api/v1/ai/admin/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Admin Escalation Management APIs
  listEscalations(params?: { status?: string; search?: string }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any>(`/api/v1/ai/admin/escalations${qs}`).then((res) => (res && Array.isArray(res.items) ? res.items : Array.isArray(res) ? res : []));
  },

  updateEscalationStatus(id: string, data: {
    status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED';
    staffNotes?: string;
    assignedToStaffId?: string;
  }): Promise<any> {
    return apiRequest(`/api/v1/ai/admin/escalations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteEscalation(id: string): Promise<any> {
    return apiRequest(`/api/v1/ai/admin/escalations/${id}`, {
      method: 'DELETE',
    });
  },
};

// ============================================================================
// SECTION 14: MARKETING, SEO & CONVERSION API
// ============================================================================

export const marketingApi = {
  // Public SEO & Schema
  getPageSeo(path = '/'): Promise<any> {
    return apiRequest(`/api/v1/website/seo?path=${encodeURIComponent(path)}`);
  },

  getSchemaMarkup(): Promise<any> {
    return apiRequest('/api/v1/website/schema-markup');
  },

  getMarketingConfig(): Promise<any> {
    return apiRequest('/api/v1/website/marketing/config');
  },

  // Public Blogs
  listPublicBlogs(params?: { category?: string; tag?: string; search?: string; page?: number; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') q.set('category', params.category);
    if (params?.tag) q.set('tag', params.tag);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/api/v1/website/blogs${qs}`);
  },

  getPublicBlog(slug: string): Promise<any> {
    return apiRequest(`/api/v1/website/blogs/${encodeURIComponent(slug)}`);
  },

  // Public Banners & Conversion
  listPublicBanners(): Promise<any[]> {
    return apiRequest<any[]>('/api/v1/website/banners').then((res) => (Array.isArray(res) ? res : []));
  },

  submitCallback(data: {
    fullName: string;
    phone: string;
    email?: string;
    applyingClass?: string;
    preferredTime?: string;
    message?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
  }): Promise<any> {
    return apiRequest('/api/v1/website/callback-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  subscribeNewsletter(email: string, source = 'WEBSITE_FOOTER'): Promise<any> {
    return apiRequest('/api/v1/website/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    });
  },

  recordAnalyticsEvent(data: {
    eventType: string;
    pagePath: string;
    source?: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
    referrer?: string;
  }): Promise<any> {
    return apiRequest('/api/v1/website/analytics/event', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Admin SEO & Integrations
  listPageSeos(): Promise<any[]> {
    return apiRequest<any[]>('/api/v1/website/admin/seo').then((res) => (Array.isArray(res) ? res : []));
  },

  upsertPageSeo(data: any): Promise<any> {
    return apiRequest('/api/v1/website/admin/seo', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  updateMarketingConfig(data: any): Promise<any> {
    return apiRequest('/api/v1/website/admin/marketing/config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Admin Blogs
  listAdminBlogs(params?: { category?: string; search?: string; page?: number; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.category && params.category !== 'ALL') q.set('category', params.category);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/api/v1/website/admin/blogs${qs}`);
  },

  createBlog(data: any): Promise<any> {
    return apiRequest('/api/v1/website/admin/blogs', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBlog(id: string, data: any): Promise<any> {
    return apiRequest(`/api/v1/website/admin/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteBlog(id: string): Promise<any> {
    return apiRequest(`/api/v1/website/admin/blogs/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Banners
  listAdminBanners(): Promise<any[]> {
    return apiRequest<any[]>('/api/v1/website/admin/banners').then((res) => (Array.isArray(res) ? res : []));
  },

  createBanner(data: any): Promise<any> {
    return apiRequest('/api/v1/website/admin/banners', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateBanner(id: string, data: any): Promise<any> {
    return apiRequest(`/api/v1/website/admin/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteBanner(id: string): Promise<any> {
    return apiRequest(`/api/v1/website/admin/banners/${id}`, {
      method: 'DELETE',
    });
  },

  // Admin Callbacks & Subscribers
  listCallbacks(params?: { status?: string; search?: string; page?: number; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/api/v1/website/admin/callbacks${qs}`);
  },

  updateCallbackStatus(id: string, data: { status: string; staffNotes?: string; assignedStaffId?: string }): Promise<any> {
    return apiRequest(`/api/v1/website/admin/callbacks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  listSubscribers(params?: { status?: string }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/website/admin/newsletter/subscribers${qs}`).then((res) => (Array.isArray(res) ? res : []));
  },

  // Admin Leads & Follow-ups
  listConsolidatedLeads(params?: { status?: string; search?: string; type?: string; page?: number; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.search) q.set('search', params.search);
    if (params?.type && params.type !== 'ALL') q.set('type', params.type);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest(`/api/v1/website/admin/leads${qs}`);
  },

  updateLeadStatus(leadType: 'ADMISSION_ENQUIRY' | 'CALLBACK_REQUEST', id: string, status: string, staffNotes?: string): Promise<any> {
    return apiRequest(`/api/v1/website/admin/leads/${leadType}/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, staffNotes }),
    });
  },

  listFollowUps(params?: { status?: string; upcomingOnly?: boolean }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.upcomingOnly) q.set('upcomingOnly', 'true');
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/website/admin/follow-ups${qs}`).then((res) => (Array.isArray(res) ? res : []));
  },

  createFollowUp(data: {
    enquiryId?: string;
    callbackId?: string;
    counsellorId?: string;
    counsellorName?: string;
    followUpDate: string;
    followUpTime?: string;
    description: string;
    status?: string;
    outcomeNotes?: string;
  }): Promise<any> {
    return apiRequest('/api/v1/website/admin/follow-ups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateFollowUp(id: string, data: any): Promise<any> {
    return apiRequest(`/api/v1/website/admin/follow-ups/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Admin Marketing Analytics Dashboard
  getMarketingAnalytics(): Promise<any> {
    return apiRequest('/api/v1/website/admin/marketing/analytics');
  },
};

// ============================================================================
// SECTION 16: SUPER ADMIN GOVERNANCE, RBAC, SYSTEM CONTROLS & AUDIT APIS
// ============================================================================

export const governanceApi = {
  // 1. User & Admin Account Management
  listAccounts(params?: { search?: string; schoolId?: string; role?: string; status?: string; page?: number; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.schoolId && params.schoolId !== 'ALL') q.set('schoolId', params.schoolId);
    if (params?.role && params.role !== 'ALL') q.set('role', params.role);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any>(`/api/v1/superadmin/governance/accounts${qs}`);
  },

  createUser(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/superadmin/governance/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser(id: string, data: any): Promise<any> {
    return apiRequest<any>(`/api/v1/superadmin/governance/accounts/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  resetPassword(id: string, data?: { temporaryPassword?: string; mustChangePassword?: boolean; reason?: string }): Promise<any> {
    return apiRequest<any>(`/api/v1/superadmin/governance/accounts/${encodeURIComponent(id)}/reset-password`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  unlockAccount(id: string): Promise<any> {
    return apiRequest<any>(`/api/v1/superadmin/governance/accounts/${encodeURIComponent(id)}/unlock`, {
      method: 'POST',
    });
  },

  updateAccountStatus(id: string, action: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND', reason?: string): Promise<any> {
    return apiRequest<any>(`/api/v1/superadmin/governance/accounts/${encodeURIComponent(id)}/status`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    });
  },

  // 2. Role & Module Permission Matrix
  listPermissions(params?: { role?: string; schoolId?: string }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.role) q.set('role', params.role);
    if (params?.schoolId && params.schoolId !== 'ALL') q.set('schoolId', params.schoolId);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/superadmin/governance/permissions${qs}`);
  },

  updatePermission(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/superadmin/governance/permissions', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 3. Admission Enquiries Centralized Monitoring
  listAdmissionEnquiries(params?: { search?: string; schoolId?: string; status?: string; page?: number; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.schoolId && params.schoolId !== 'ALL') q.set('schoolId', params.schoolId);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any>(`/api/v1/superadmin/governance/admissions/enquiries${qs}`);
  },

  // 4. Marksheet Publication Approval Controls
  listMarksheetRequests(params?: { schoolId?: string; status?: string }): Promise<any[]> {
    const q = new URLSearchParams();
    if (params?.schoolId && params.schoolId !== 'ALL') q.set('schoolId', params.schoolId);
    if (params?.status && params.status !== 'ALL') q.set('status', params.status);
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any[]>(`/api/v1/superadmin/governance/marksheets/requests${qs}`);
  },

  reviewMarksheetRequest(id: string, data: { status: 'APPROVED' | 'REJECTED' | 'PUBLISHED'; reviewNotes?: string }): Promise<any> {
    return apiRequest<any>(`/api/v1/superadmin/governance/marksheets/requests/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 5. ID Cards & Certificates Templates Oversight
  listTemplates(schoolId?: string): Promise<any> {
    const qs = schoolId && schoolId !== 'ALL' ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return apiRequest<any>(`/api/v1/superadmin/governance/templates${qs}`);
  },

  // 6. ERP Analytics
  getAnalytics(schoolId?: string): Promise<any> {
    const qs = schoolId && schoolId !== 'ALL' ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return apiRequest<any>(`/api/v1/superadmin/governance/analytics${qs}`);
  },

  // 7. Backup Management
  listBackups(schoolId?: string): Promise<any[]> {
    const qs = schoolId && schoolId !== 'ALL' ? `?schoolId=${encodeURIComponent(schoolId)}` : '';
    return apiRequest<any[]>(`/api/v1/superadmin/governance/backups${qs}`);
  },

  initiateBackup(data: { backupType?: string; schoolId?: string; metadata?: any; notes?: string }): Promise<any> {
    return apiRequest<any>('/api/v1/superadmin/governance/backups', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 8. Platform System Configuration
  getSystemConfig(): Promise<any> {
    return apiRequest<any>('/api/v1/superadmin/governance/system-config');
  },

  updateSystemConfig(data: any): Promise<any> {
    return apiRequest<any>('/api/v1/superadmin/governance/system-config', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 9. Activity Logs & Auditing
  listActivityLogs(params?: { search?: string; schoolId?: string; module?: string; action?: string; page?: number; limit?: number }): Promise<any> {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.schoolId && params.schoolId !== 'ALL') q.set('schoolId', params.schoolId);
    if (params?.module && params.module !== 'ALL') q.set('module', params.module);
    if (params?.action && params.action !== 'ALL') q.set('action', params.action);
    if (params?.page) q.set('page', String(params.page));
    if (params?.limit) q.set('limit', String(params.limit));
    const qs = q.toString() ? `?${q.toString()}` : '';
    return apiRequest<any>(`/api/v1/superadmin/governance/activity-logs${qs}`);
  },

  exportActivityLogsCsvUrl(params?: any): string {
    const q = new URLSearchParams();
    if (params?.schoolId && params.schoolId !== 'ALL') q.set('schoolId', params.schoolId);
    if (params?.module && params.module !== 'ALL') q.set('module', params.module);
    if (params?.action && params.action !== 'ALL') q.set('action', params.action);
    return getApiUrl(`/api/v1/superadmin/governance/activity-logs/export?${q.toString()}`);
  },
};



import { HealthCheckData, ApiResponse } from '@edunexa/shared';

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
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message || 'Login failed.');
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
  updateSchool: (id: string, data: any) =>
    apiRequest<any>(`/api/v1/superadmin/schools/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  listSubscriptions: () => apiRequest<any[]>('/api/v1/superadmin/subscriptions'),
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

  listStudents: (params: { className?: string; query?: string; page?: number; limit?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.className) query.set('className', params.className);
    if (params.query) query.set('query', params.query);
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    return apiRequest<{ items: any[]; meta: any }>(`/api/v1/core/students?${query.toString()}`);
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
};

// ============================================================================
// 3. ACADEMIC APIS (Attendance, Quizzes, Examinations, Marks, Report Cards)
// ============================================================================

export const academicApi = {
  recordStudentAttendance: (payload: { records: Array<{ studentProfileId: string; status: string; remarks?: string }>; date?: string; sectionId?: string }) =>
    apiRequest<any>('/api/v1/academic/attendance/students', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

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

  listStaffLeaves: (status?: string) => {
    const url = status && status !== 'ALL' ? `/api/v1/academic/attendance/staff/leave?status=${status}` : '/api/v1/academic/attendance/staff/leave';
    return apiRequest<any[]>(url);
  },

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

  submitExamMarksBatch: (data: { examScheduleId: string; marks: Array<{ studentProfileId: string; marksObtained: number; isAbsent?: boolean; teacherRemarks?: string }> }) =>
    apiRequest<any>('/api/v1/academic/exams/marks/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getExamMarks: (examScheduleId: string) =>
    apiRequest<any[]>(`/api/v1/academic/exams/schedules/${examScheduleId}/marks`),

  correctExamMark: (data: { markId: string; newMarks: number; rationale: string }) =>
    apiRequest<any>('/api/v1/academic/exams/marks/correct', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  publishExamResults: (data: { examScheduleId: string; isPublished: boolean }) =>
    apiRequest<any>('/api/v1/academic/exams/publish', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getReportCard: (studentProfileId: string) =>
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

  recordFeePayment: (data: { invoiceId: string; amount: number; paymentMethod: string; transactionReference?: string }) =>
    apiRequest<any>('/api/v1/operations/fees/payments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

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

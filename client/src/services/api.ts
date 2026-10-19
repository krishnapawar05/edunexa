import { HealthCheckData, ApiResponse } from '@edunexa/shared';

export const API_BASE_URL: string = (import.meta as any).env?.VITE_API_BASE_URL || '';

export function getApiUrl(endpoint: string): string {
  if (!API_BASE_URL) return endpoint;
  const base = API_BASE_URL.replace(/\/$/, '');
  const cleanEndpoint = endpoint.replace(/^\//, '');
  return `${base}/${cleanEndpoint}`;
}

export async function fetchServerHealth(): Promise<HealthCheckData | null> {
  try {
    const res = await fetch(getApiUrl('/api/health'));
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const json: ApiResponse<HealthCheckData> = await res.json();
    if (json.success) {
      return json.data;
    }
    return null;
  } catch (err) {
    console.warn('Backend server connectivity check:', err);
    return null;
  }
}

// Token helper: retrieves stored token or fallback demo teacher/admin token
export function getStoredAuthToken(role?: string): string {
  const stored = localStorage.getItem('edunexa_token');
  if (stored) return stored;
  // Fallback demo tokens for visual evaluation in dev mode
  return role === 'TEACHER' ? 'demo-teacher-token' : 'demo-student-token';
}

export async function fetchStudentReportCard(studentProfileId: string, token: string) {
  const res = await fetch(getApiUrl(`/api/v1/academic/report-cards/${studentProfileId}`), {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });
  return res.json();
}

export async function submitStudentAttendanceApi(payload: any, token: string) {
  const res = await fetch(getApiUrl('/api/v1/academic/attendance/students'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  return res.json();
}

export async function submitQuizAttemptApi(quizId: string, answers: any[], token: string) {
  const res = await fetch(getApiUrl(`/api/v1/academic/quizzes/${quizId}/attempts/submit`), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ quizId, answers, saveOnly: false }),
  });
  return res.json();
}

// ============================================================================
// STAGE 7: EDUNEXA AI CLIENT HELPERS
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
    const res = await fetch(getApiUrl('/api/v1/ai/assistant/ask'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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

export async function generateQuizDraftApi(payload: any, token: string = '') {
  try {
    const res = await fetch(getApiUrl('/api/v1/ai/quiz/generate'), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
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
    const res = await fetch(getApiUrl(`/api/v1/ai/quiz/drafts/${draftId}/review`), {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
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



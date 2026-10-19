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

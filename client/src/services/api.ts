import { HealthCheckData, ApiResponse } from '@edunexa/shared';

export async function fetchServerHealth(): Promise<HealthCheckData | null> {
  try {
    const res = await fetch('/api/health');
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

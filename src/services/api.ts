/**
 * Base HTTP client for SEYO API
 */

export interface ApiResponse<T = any> {
  success: boolean;
  code?: string;
  message?: string;
  [key: string]: any;
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    message: `Server returned status ${response.status}`,
  }));

  if (!response.ok || data.success === false) {
    const error: any = new Error(data.message || 'An error occurred');
    error.code = data.code || 'UNKNOWN_ERROR';
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data as T;
}

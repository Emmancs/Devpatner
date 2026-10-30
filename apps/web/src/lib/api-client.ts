import { ApiResponse, ApiErrorResponse } from '@devpilot/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiClientError extends Error {
  statusCode: number;
  error: string;
  details?: string | string[];

  constructor(errorResponse: ApiErrorResponse) {
    const message = Array.isArray(errorResponse.message)
      ? errorResponse.message.join(', ')
      : errorResponse.message || 'An unexpected error occurred';
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = errorResponse.statusCode;
    this.error = errorResponse.error;
    this.details = errorResponse.message;
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include authentication cookies
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');

  if (!response.ok) {
    if (isJson) {
      const errorJson = (await response.json()) as ApiErrorResponse;
      throw new ApiClientError(errorJson);
    } else {
      throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
    }
  }

  if (!isJson) {
    return (await response.text()) as unknown as T;
  }

  const envelope = (await response.json()) as ApiResponse<T>;
  return envelope.data !== undefined ? envelope.data : (envelope as unknown as T);
}


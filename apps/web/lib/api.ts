const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export function apiAssetUrl(path: string): string {
  return new URL(path, API_URL).toString();
}

interface RequestOptions {
  method?: string;
  body?: any;
  token?: string | null;
}

export async function api<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

export const apiClient = {
  get: <T = any>(path: string, token?: string | null) => api<T>(path, { token }),
  post: <T = any>(path: string, body: any, token?: string | null) => api<T>(path, { method: 'POST', body, token }),
  put: <T = any>(path: string, body: any, token?: string | null) => api<T>(path, { method: 'PUT', body, token }),
  delete: <T = any>(path: string, token?: string | null) => api<T>(path, { method: 'DELETE', token }),
  postForm: async <T = any>(path: string, body: FormData, token?: string | null): Promise<T> => {
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers,
      body,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }

    return res.json();
  },
};

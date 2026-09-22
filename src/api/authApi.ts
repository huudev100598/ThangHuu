import { ApiResult } from './projectApi';

export interface AuthUser {
  id: number;
  email: string;
  fullName: string;
  role: 'admin' | 'user';
  status: 'active' | 'disabled';
}

const TOKEN_KEY = 'mm_auth_token';

export function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<ApiResult<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  let body: ApiResult<T>;
  try {
    body = await res.json();
  } catch {
    body = { success: false, message: `Invalid JSON (${res.status})` };
  }
  if (!res.ok && body.success !== false) {
    body.success = false;
    body.message = body.message || `HTTP ${res.status}`;
  }
  return body;
}

export function login(email: string, password: string) {
  return request<{ user: AuthUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(email: string, password: string, fullName: string) {
  return request<{ user: AuthUser; token: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
}

export function me() {
  return request<{ user: AuthUser }>('/api/auth/me');
}

export function adminListUsers() {
  return request<AuthUser[]>('/api/admin/users');
}

export function adminSetUserStatus(id: number, status: 'active' | 'disabled') {
  return request(`/api/admin/users/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function adminSetUserRole(id: number, role: 'admin' | 'user') {
  return request(`/api/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

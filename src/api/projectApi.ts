/**
 * Frontend API client — MySQL normalized project persistence
 */
import { getToken } from './authApi';

export interface ProjectDataPayload {
  projectName: string;
  parameters: unknown;
  categories: unknown[];
  skus: unknown[];
  sheet3CogsMap: Record<string, unknown>;
  suppliers: unknown[];
  quotations: unknown[];
  salesMonths: unknown[];
  salesVolumes: Record<string, Record<string, number>>;
  channelMix: Record<string, number>;
  creatorPlan: Record<string, unknown>;
  creatorCampaigns: unknown[];
  hrPositions: unknown[];
  hrHeadcountMap: Record<string, Record<string, number>>;
  initialCapexItems: unknown[];
  monthlyOpexItems: unknown[];
  hrConfig: unknown;
}

export interface ApiResult<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
  storage?: string;
  timestamp?: string;
}

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<ApiResult<T>> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, {
    ...options,
    headers,
  });

  let body: ApiResult<T>;
  try {
    body = await res.json();
  } catch {
    body = { success: false, message: `Invalid JSON response (${res.status})` };
  }

  if (!res.ok && body.success !== false) {
    body.success = false;
    body.message = body.message || `HTTP ${res.status}`;
  }

  return body;
}

export function getDefaultProject() {
  return request<ProjectDataPayload>('/api/get-default-project');
}

export function saveProject(data: ProjectDataPayload) {
  return request('/api/save-project', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function loadProject(projectName: string) {
  return request<ProjectDataPayload>(
    `/api/load-project/${encodeURIComponent(projectName)}`
  );
}

export function listProjects(all = false) {
  const q = all ? '?all=true' : '';
  return request<
    Array<{
      id: number;
      userId: number;
      projectName: string;
      isActive: boolean;
      createdAt: string;
      updatedAt: string;
    }>
  >(`/api/projects${q}`);
}

export function deleteProject(projectName: string, hard = false) {
  const q = hard ? '?hard=true' : '';
  return request(`/api/projects/${encodeURIComponent(projectName)}${q}`, {
    method: 'DELETE',
  });
}

export function healthCheck() {
  return request<{ status: string; database: string }>('/api/health');
}

export function aiBepAdvisor(body: {
  bepData: unknown;
  pnlSummary: unknown;
  monthsCount?: number;
  simulation?: unknown;
  userQuery?: string;
}) {
  return request<{ analysis: string; source?: string }>('/api/ai-bep-advisor', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

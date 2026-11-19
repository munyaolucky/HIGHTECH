import type {
  CmsDepartmentItem,
  CmsStaffProfileItem,
  CmsSummaryResponse,
  PublicDepartmentDetail,
  PublicDepartmentSummary,
  PublicStaffProfileDetail,
  PublicStaffSummary,
  WebsiteStaffCategory,
} from './website-types';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(json?.error || `Request failed (${res.status})`);
  }
  return json.data as T;
}

export const websiteApi = {
  // Public directory endpoints
  listPublicStaff(params: {
    q?: string;
    category?: string;
    departmentId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.category && params.category !== 'ALL') qs.set('category', params.category);
    if (params.departmentId && params.departmentId !== 'ALL') qs.set('departmentId', params.departmentId);
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    return requestJson<{
      items: PublicStaffSummary[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
      categories: WebsiteStaffCategory[];
      departments: { id: string; slug: string; name: string }[];
    }>(`/api/public/staff?${qs.toString()}`);
  },

  getPublicStaffBySlug(slug: string) {
    return requestJson<PublicStaffProfileDetail>(`/api/public/staff/${encodeURIComponent(slug)}`);
  },

  listPublicDepartments(params: { q?: string; page?: number; pageSize?: number }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.page) qs.set('page', String(params.page));
    if (params.pageSize) qs.set('pageSize', String(params.pageSize));
    return requestJson<{
      items: PublicDepartmentSummary[];
      total: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }>(`/api/public/departments?${qs.toString()}`);
  },

  getPublicDepartmentBySlug(slug: string) {
    return requestJson<PublicDepartmentDetail>(`/api/public/departments/${encodeURIComponent(slug)}`);
  },

  subscribeNewsletter(email: string, source = 'website-footer') {
    return requestJson<{
      alreadySubscribed: boolean;
      email: string;
      message: string;
    }>('/api/public/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email, source }),
    });
  },

  // Staff Website CMS endpoints
  getCmsSummary() {
    return requestJson<CmsSummaryResponse>('/api/website/summary');
  },

  listCmsStaff(params: { q?: string; status?: string; category?: string; departmentId?: string }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.status) qs.set('status', params.status);
    if (params.category) qs.set('category', params.category);
    if (params.departmentId) qs.set('departmentId', params.departmentId);
    return requestJson<{
      items: CmsStaffProfileItem[];
      categories: WebsiteStaffCategory[];
      departments: { id: string; name: string; slug: string; status: string }[];
    }>(`/api/website/staff?${qs.toString()}`);
  },

  createStaff(payload: Partial<CmsStaffProfileItem>) {
    return requestJson<CmsStaffProfileItem>('/api/website/staff', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateStaff(id: string, payload: Partial<CmsStaffProfileItem>) {
    return requestJson<CmsStaffProfileItem>(`/api/website/staff/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  transitionStaffStatus(id: string, action: 'submit' | 'approve' | 'publish' | 'archive') {
    return requestJson<CmsStaffProfileItem>(
      `/api/website/staff/${encodeURIComponent(id)}/${action}`,
      { method: 'POST' }
    );
  },

  listCmsDepartments(params: { q?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.status) qs.set('status', params.status);
    return requestJson<{
      items: CmsDepartmentItem[];
      staffOptions: {
        id: string;
        fullName: string;
        officialTitle: string;
        category: string;
        status: string;
      }[];
    }>(`/api/website/departments?${qs.toString()}`);
  },

  createDepartment(payload: Partial<CmsDepartmentItem>) {
    return requestJson<CmsDepartmentItem>('/api/website/departments', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateDepartment(id: string, payload: Partial<CmsDepartmentItem>) {
    return requestJson<CmsDepartmentItem>(`/api/website/departments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  transitionDepartmentStatus(id: string, action: 'submit' | 'approve' | 'publish' | 'archive') {
    return requestJson<CmsDepartmentItem>(
      `/api/website/departments/${encodeURIComponent(id)}/${action}`,
      { method: 'POST' }
    );
  },

  assignDepartmentStaff(
    departmentId: string,
    assignments: {
      staffProfileId: string;
      isHod: boolean;
      roleInDepartment?: string;
      isPrimaryDepartment?: boolean;
      displayOrder?: number;
    }[]
  ) {
    return requestJson<{ department: CmsDepartmentItem }>(
      `/api/website/departments/${encodeURIComponent(departmentId)}/assign-staff`,
      {
        method: 'POST',
        body: JSON.stringify({ assignments }),
      }
    );
  },

  async exportDirectoryCsv(): Promise<void> {
    const res = await fetch('/api/website/staff/export/csv', { credentials: 'include' });
    if (!res.ok) throw new Error('Unable to export CSV directory.');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'hitech-public-staff-directory.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};

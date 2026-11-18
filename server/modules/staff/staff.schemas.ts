import type { StaffTaskStatus } from '../../data/store.ts';
import {
  ALL_STAFF_PERMISSION_LIST,
  ROLE_TO_STAFF_PERMISSIONS,
  type StaffPermission,
  type StaffRoleCode,
} from './staff.permissions.ts';

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const VALID_ROLES = new Set<string>(Object.keys(ROLE_TO_STAFF_PERMISSIONS));
const VALID_TASK_STATUSES = new Set<StaffTaskStatus>([
  'PENDING',
  'IN_PROGRESS',
  'COMPLETED',
  'URGENT',
]);

export function validateSessionSwitch(body: unknown): ValidationResult<{
  role: StaffRoleCode | 'UNCONFIGURED';
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const role = String((body as Record<string, unknown>).role ?? '').trim();
  if (role === 'UNCONFIGURED') {
    return { ok: true, data: { role: 'UNCONFIGURED' } };
  }
  if (!VALID_ROLES.has(role)) {
    return { ok: false, error: `Unsupported staff role "${role}".` };
  }
  return { ok: true, data: { role: role as StaffRoleCode } };
}

export function validateProfilePatch(body: unknown): ValidationResult<{
  phone?: string;
  officeLocation?: string;
  bio?: string;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const patch: { phone?: string; officeLocation?: string; bio?: string } = {};
  const fieldErrors: Record<string, string> = {};

  if (obj.phone !== undefined) {
    const phone = String(obj.phone).trim();
    if (phone.length < 7 || phone.length > 30) {
      fieldErrors.phone = 'Phone must be between 7 and 30 characters.';
    } else {
      patch.phone = phone;
    }
  }
  if (obj.officeLocation !== undefined) {
    const officeLocation = String(obj.officeLocation).trim();
    if (officeLocation.length < 2 || officeLocation.length > 120) {
      fieldErrors.officeLocation = 'Office location must be 2–120 characters.';
    } else {
      patch.officeLocation = officeLocation;
    }
  }
  if (obj.bio !== undefined) {
    const bio = String(obj.bio).trim();
    if (bio.length > 400) {
      fieldErrors.bio = 'Role summary cannot exceed 400 characters.';
    } else {
      patch.bio = bio;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: 'Validation failed for profile update.', fieldErrors };
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'Provide at least one permitted profile field to update.' };
  }
  return { ok: true, data: patch };
}

export function validatePaginationQuery(query: Record<string, unknown>): {
  page: number;
  pageSize: number;
  search: string;
  status: string;
} {
  const rawPage = Number(query.page ?? 1);
  const rawSize = Number(query.pageSize ?? 10);
  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : 1;
  const pageSize =
    Number.isFinite(rawSize) && rawSize >= 1 ? Math.min(50, Math.floor(rawSize)) : 10;
  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 120) : '';
  const status = typeof query.status === 'string' ? query.status.trim().toUpperCase() : 'ALL';
  return { page, pageSize, search, status };
}

export function validateTaskCreate(body: unknown): ValidationResult<{
  title: string;
  description: string;
  dueAt?: string;
  status: StaffTaskStatus;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const title = String(obj.title ?? '').trim();
  const description = String(obj.description ?? '').trim();
  const dueAt = obj.dueAt ? String(obj.dueAt).trim() : undefined;
  const rawStatus = String(obj.status ?? 'PENDING').trim().toUpperCase() as StaffTaskStatus;

  if (title.length < 3 || title.length > 160) {
    return { ok: false, error: 'Task title must be between 3 and 160 characters.' };
  }
  if (!VALID_TASK_STATUSES.has(rawStatus)) {
    return { ok: false, error: 'Invalid task status.' };
  }

  return {
    ok: true,
    data: {
      title,
      description: description || 'Operational action item.',
      dueAt,
      status: rawStatus,
    },
  };
}

export function validateTaskUpdate(body: unknown): ValidationResult<{
  status: StaffTaskStatus;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const status = String((body as Record<string, unknown>).status ?? '')
    .trim()
    .toUpperCase() as StaffTaskStatus;
  if (!VALID_TASK_STATUSES.has(status)) {
    return { ok: false, error: 'Status must be PENDING, IN_PROGRESS, COMPLETED, or URGENT.' };
  }
  return { ok: true, data: { status } };
}

export function validateStaffInvitation(body: unknown): ValidationResult<{
  fullName: string;
  email: string;
  role: StaffRoleCode;
  departmentId: string;
  campusId: string;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const fullName = String(obj.fullName ?? '').trim();
  const email = String(obj.email ?? '').trim().toLowerCase();
  const role = String(obj.role ?? '').trim() as StaffRoleCode;
  const departmentId = String(obj.departmentId ?? '').trim();
  const campusId = String(obj.campusId ?? '').trim();

  if (fullName.length < 3) {
    return { ok: false, error: 'Staff full name must be at least 3 characters.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Provide a valid institutional email address.' };
  }
  if (!VALID_ROLES.has(role)) {
    return { ok: false, error: 'Select a valid staff role.' };
  }
  if (!departmentId || !campusId) {
    return { ok: false, error: 'Select both campus and department.' };
  }
  return { ok: true, data: { fullName, email, role, departmentId, campusId } };
}

export function validateStudentCreate(body: unknown): ValidationResult<{
  fullName: string;
  email: string;
  programme: string;
  campusId: string;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const fullName = String(obj.fullName ?? '').trim();
  const email = String(obj.email ?? '').trim().toLowerCase();
  const programme = String(obj.programme ?? '').trim();
  const campusId = String(obj.campusId ?? '').trim();

  if (fullName.length < 3) {
    return { ok: false, error: 'Student full name must be at least 3 characters.' };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: 'Provide a valid student email address.' };
  }
  if (programme.length < 3) {
    return { ok: false, error: 'Enter the academic programme name.' };
  }
  if (!campusId) {
    return { ok: false, error: 'Select a campus.' };
  }
  return { ok: true, data: { fullName, email, programme, campusId } };
}

export function validateStaffAccessUpdate(body: unknown): ValidationResult<{
  role: StaffRoleCode;
  permissions: StaffPermission[];
  status?: 'ACTIVE' | 'SUSPENDED';
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const role = String(obj.role ?? '').trim() as StaffRoleCode;
  if (!VALID_ROLES.has(role)) {
    return { ok: false, error: 'Invalid staff role specified.' };
  }
  const rawPerms = Array.isArray(obj.permissions) ? obj.permissions : [];
  const allowedSet = new Set<string>(ALL_STAFF_PERMISSION_LIST);
  const permissions = rawPerms
    .map((p) => String(p))
    .filter((p): p is StaffPermission => allowedSet.has(p));

  const rawStatus = obj.status ? String(obj.status).toUpperCase() : undefined;
  const status =
    rawStatus === 'ACTIVE' || rawStatus === 'SUSPENDED' ? rawStatus : undefined;

  return { ok: true, data: { role, permissions, status } };
}

export function validateCampusCreate(body: unknown): ValidationResult<{
  code: string;
  name: string;
  address: string;
  phone: string;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const code = String(obj.code ?? '').trim().toUpperCase();
  const name = String(obj.name ?? '').trim();
  const address = String(obj.address ?? '').trim();
  const phone = String(obj.phone ?? '').trim();

  if (code.length < 2 || code.length > 8) {
    return { ok: false, error: 'Campus code must be 2–8 characters (e.g. ELD).' };
  }
  if (name.length < 4) {
    return { ok: false, error: 'Campus name must be at least 4 characters.' };
  }
  if (address.length < 4) {
    return { ok: false, error: 'Campus address is required.' };
  }
  return { ok: true, data: { code, name, address, phone: phone || '+254 700 100 200' } };
}

export function validateDepartmentCreate(body: unknown): ValidationResult<{
  code: string;
  name: string;
  campusId: string;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const code = String(obj.code ?? '').trim().toUpperCase();
  const name = String(obj.name ?? '').trim();
  const campusId = String(obj.campusId ?? '').trim();

  if (code.length < 2 || code.length > 8) {
    return { ok: false, error: 'Department code must be 2–8 characters.' };
  }
  if (name.length < 3) {
    return { ok: false, error: 'Department name must be at least 3 characters.' };
  }
  if (!campusId) {
    return { ok: false, error: 'Select the host campus.' };
  }
  return { ok: true, data: { code, name, campusId } };
}

export function validateWorkflowDecision(body: unknown): ValidationResult<{
  decision: 'APPROVED' | 'REJECTED';
  comment: string;
}> {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body must be a JSON object.' };
  }
  const obj = body as Record<string, unknown>;
  const decision = String(obj.decision ?? '').trim().toUpperCase();
  const comment = String(obj.comment ?? '').trim();
  if (decision !== 'APPROVED' && decision !== 'REJECTED') {
    return { ok: false, error: 'Decision must be APPROVED or REJECTED.' };
  }
  if (decision === 'REJECTED' && comment.length < 3) {
    return { ok: false, error: 'A clear reason is required when rejecting a workflow.' };
  }
  return { ok: true, data: { decision, comment } };
}

import { STAFF_ACCOUNTS, type StaffRole } from '../config/staff-navigation';
import type { AccountStatus, PortalUser, UserRole } from './auth-types';
import { getPortalType, resolveStaffPermissionsForRole } from './auth-utils';

export interface LoginPayload {
  identifier: string;
  password: string;
  rememberMe?: boolean;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface CompleteProfilePayload {
  fullName?: string;
  phoneNumber: string;
  address?: string;
}

interface RawServerUser {
  uid?: string;
  id?: string;
  email?: string;
  registrationNumber?: string | null;
  fullName?: string;
  primaryRole?: string;
  accountStatus?: string;
  mustChangePassword?: boolean;
  requiresProfileCompletion?: boolean;
  mfaEnabled?: boolean;
  campusId?: string | null;
  departmentId?: string | null;
  destination?: string;
  staffPermissions?: string[];
  permissions?: string[];
  roleTitle?: string;
  department?: string;
  campus?: string;
}

export function normalizeServerUser(raw: RawServerUser | null | undefined): PortalUser | null {
  if (!raw || (!raw.email && !raw.uid && !raw.primaryRole)) {
    return null;
  }

  const primaryRole = (String(raw.primaryRole ?? 'UNCONFIGURED').toUpperCase() ||
    'UNCONFIGURED') as UserRole;
  const staffMeta = STAFF_ACCOUNTS[primaryRole as StaffRole];
  const permissions = resolveStaffPermissionsForRole(
    primaryRole,
    raw.permissions ?? raw.staffPermissions
  );

  const accountStatusRaw = String(raw.accountStatus ?? 'ACTIVE').toUpperCase();
  const validStatuses = new Set<AccountStatus>([
    'ACTIVE',
    'PENDING_ACTIVATION',
    'SUSPENDED',
    'DEACTIVATED',
  ]);
  const accountStatus: AccountStatus = validStatuses.has(accountStatusRaw as AccountStatus)
    ? (accountStatusRaw as AccountStatus)
    : 'ACTIVE';

  return {
    id: String(raw.uid ?? raw.id ?? raw.email ?? 'portal-user'),
    uid: String(raw.uid ?? raw.id ?? raw.email ?? 'portal-user'),
    fullName: String(raw.fullName ?? staffMeta?.fullName ?? 'Portal User'),
    email: String(raw.email ?? staffMeta?.email ?? ''),
    registrationNumber: raw.registrationNumber ?? staffMeta?.employeeNumber ?? null,
    primaryRole,
    roles: [primaryRole],
    portalType: getPortalType(primaryRole),
    accountStatus,
    mustChangePassword: Boolean(raw.mustChangePassword),
    requiresProfileCompletion: Boolean(raw.requiresProfileCompletion),
    mfaEnabled: Boolean(raw.mfaEnabled),
    permissions,
    department: raw.department ?? staffMeta?.department,
    departmentId: raw.departmentId ?? null,
    campus: raw.campus ?? staffMeta?.campus,
    campusId: raw.campusId ?? null,
    roleTitle: raw.roleTitle ?? staffMeta?.roleTitle,
    destination: raw.destination,
  };
}

export async function fetchCurrentUser(): Promise<{
  user: PortalUser | null;
  unauthorized: boolean;
}> {
  const response = await fetch('/api/auth/me', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });

  if (response.status === 401) {
    return { user: null, unauthorized: true };
  }

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success || !json?.data) {
    return { user: null, unauthorized: false };
  }

  const normalized = normalizeServerUser(json.data as RawServerUser);
  return { user: normalized, unauthorized: false };
}

export async function logoutRequest(): Promise<void> {
  await Promise.allSettled([
    fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
    fetch('/api/staff/logout', { method: 'POST', credentials: 'include' }),
  ]);
}

export async function logoutAllRequest(): Promise<void> {
  await Promise.allSettled([
    fetch('/api/auth/logout-all', { method: 'POST', credentials: 'include' }),
    fetch('/api/staff/logout', { method: 'POST', credentials: 'include' }),
  ]);
}

export async function changePasswordRequest(
  payload: ChangePasswordPayload
): Promise<{ message: string }> {
  const response = await fetch('/api/auth/password/change', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || 'Unable to update password.');
  }

  return { message: json.data?.message || 'Password updated successfully.' };
}

export async function completeProfileRequest(
  payload: CompleteProfilePayload
): Promise<{ completed: boolean }> {
  const response = await fetch('/api/auth/complete-profile', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || 'Unable to complete profile setup.');
  }

  return { completed: Boolean(json.data?.completed ?? true) };
}

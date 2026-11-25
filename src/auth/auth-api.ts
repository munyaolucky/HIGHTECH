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
  passwordChangedAt?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  emailVerificationRequired?: boolean;
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
    passwordChangedAt: raw.passwordChangedAt ?? null,
    emailVerified:
      raw.emailVerified !== undefined
        ? Boolean(raw.emailVerified)
        : Boolean(raw.emailVerifiedAt),
    emailVerifiedAt: raw.emailVerifiedAt ?? null,
    emailVerificationRequired:
      raw.emailVerificationRequired !== undefined
        ? Boolean(raw.emailVerificationRequired)
        : false,
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
): Promise<{
  message: string;
  nextStep?: 'VERIFY_EMAIL' | 'COMPLETE_PROFILE' | 'DASHBOARD';
  destination?: string;
  requiresEmailVerification?: boolean;
}> {
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

  return {
    message: json.data?.message || 'Password updated successfully.',
    nextStep: json.data?.nextStep,
    destination: json.data?.destination,
    requiresEmailVerification: json.data?.requiresEmailVerification,
  };
}

export interface EmailVerificationDispatchResult {
  alreadyVerified?: boolean;
  email: string;
  maskedEmail: string;
  expiresAt?: string;
  cooldownSeconds?: number;
  destination?: string;
  message: string;
}

export interface EmailVerificationVerifyResult {
  verified: boolean;
  emailVerifiedAt: string;
  nextStep?: string;
  destination: string;
  message: string;
}

export interface AuthSecurityStatusResult {
  uid: string;
  email: string;
  maskedEmail: string;
  mustChangePassword: boolean;
  passwordChangedAt: string | null;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  emailVerificationRequired: boolean;
  requiresProfileCompletion: boolean;
  destination: string;
  securityRedirect: string;
  activeSessionsCount: number;
  cooldownRemainingSeconds: number;
  otpExpiresAt: string | null;
}

export async function sendEmailVerificationRequest(): Promise<EmailVerificationDispatchResult> {
  const response = await fetch('/api/auth/email/send-verification', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || 'Unable to send email verification code.');
  }
  return json.data as EmailVerificationDispatchResult;
}

export async function resendEmailVerificationRequest(): Promise<EmailVerificationDispatchResult> {
  const response = await fetch('/api/auth/email/resend', {
    method: 'POST',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || 'Unable to resend verification code.');
  }
  return json.data as EmailVerificationDispatchResult;
}

export async function verifyEmailOtpRequest(
  code: string
): Promise<EmailVerificationVerifyResult> {
  const response = await fetch('/api/auth/email/verify', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ code }),
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || 'Verification code could not be confirmed.');
  }
  return json.data as EmailVerificationVerifyResult;
}

export async function fetchAuthSecurityStatus(): Promise<AuthSecurityStatusResult> {
  const response = await fetch('/api/auth/security/status', {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  });
  const json = await response.json().catch(() => null);
  if (!response.ok || !json?.success) {
    throw new Error(json?.error || 'Unable to load account security status.');
  }
  return json.data as AuthSecurityStatusResult;
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

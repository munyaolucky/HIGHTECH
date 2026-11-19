import { STAFF_ACCOUNTS, type StaffRole } from '../config/staff-navigation';
import type { PortalType, PortalUser, UserRole } from './auth-types';

export function isStudentRole(role: string | null | undefined): boolean {
  return String(role ?? '').toUpperCase() === 'STUDENT';
}

export function getPortalType(role: string | null | undefined): PortalType {
  return isStudentRole(role) ? 'student' : 'staff';
}

export function isAccountActive(user: PortalUser | null | undefined): boolean {
  if (!user) return false;
  return user.accountStatus === 'ACTIVE';
}

export function getUserDashboardPath(user: PortalUser | null | undefined): string {
  if (!user) return '/portal/login';

  if (user.mustChangePassword) {
    return '/portal/change-password';
  }

  if (user.requiresProfileCompletion) {
    return '/portal/complete-profile';
  }

  if (isStudentRole(user.primaryRole)) {
    return '/portal/student';
  }

  if (user.destination && user.destination.startsWith('/portal/')) {
    return user.destination;
  }

  return '/portal/staff';
}

export function hasUserPermission(
  user: PortalUser | null | undefined,
  permission: string | undefined
): boolean {
  if (!permission) return true;
  if (!user) return false;
  if (user.permissions.includes('*')) return true;
  return user.permissions.includes(permission);
}

export function hasAnyUserPermission(
  user: PortalUser | null | undefined,
  permissions: string[]
): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (!user) return false;
  if (user.permissions.includes('*')) return true;
  return permissions.some((permission) => user.permissions.includes(permission));
}

export function hasAllUserPermissions(
  user: PortalUser | null | undefined,
  permissions: string[]
): boolean {
  if (!permissions || permissions.length === 0) return true;
  if (!user) return false;
  if (user.permissions.includes('*')) return true;
  return permissions.every((permission) => user.permissions.includes(permission));
}

export function hasAnyUserRole(
  user: PortalUser | null | undefined,
  allowedRoles: UserRole[]
): boolean {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  if (!user) return false;
  const userRoles = new Set<string>([
    user.primaryRole.toUpperCase(),
    ...user.roles.map((r) => r.toUpperCase()),
  ]);
  return allowedRoles.some((r) => userRoles.has(r.toUpperCase()));
}

export function resolveStaffPermissionsForRole(
  role: string,
  serverPermissions?: string[]
): string[] {
  const upper = role.toUpperCase() as StaffRole;
  const roleDefaults = STAFF_ACCOUNTS[upper]?.permissions ?? [];
  if (!Array.isArray(serverPermissions) || serverPermissions.length === 0) {
    return roleDefaults;
  }
  return Array.from(new Set([...serverPermissions, ...roleDefaults]));
}

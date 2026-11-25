import type { StaffRole } from '../config/staff-navigation';

export type UserRole =
  | StaffRole
  | 'STUDENT'
  | 'PARENT'
  | 'ALUMNI'
  | 'CONTRACTOR'
  | 'PARTNER'
  | 'GUEST'
  | 'UNCONFIGURED';

export type PortalType = 'staff' | 'student';

export type AccountStatus =
  | 'ACTIVE'
  | 'PENDING_ACTIVATION'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface PortalUser {
  id: string;
  uid: string;
  fullName: string;
  email: string;
  registrationNumber: string | null;
  primaryRole: UserRole;
  roles: UserRole[];
  portalType: PortalType;
  accountStatus: AccountStatus;
  mustChangePassword: boolean;
  passwordChangedAt?: string | null;
  emailVerified?: boolean;
  emailVerifiedAt?: string | null;
  emailVerificationRequired?: boolean;
  requiresProfileCompletion: boolean;
  mfaEnabled: boolean;
  permissions: string[];
  department?: string;
  departmentId?: string | null;
  campus?: string;
  campusId?: string | null;
  roleTitle?: string;
  destination?: string;
}

export interface AuthState {
  user: PortalUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  sessionExpired: boolean;
  error: string | null;
}

export interface AuthContextValue extends AuthState {
  refreshSession: () => Promise<PortalUser | null>;
  setAuthenticatedUser: (user: PortalUser | null) => void;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
}

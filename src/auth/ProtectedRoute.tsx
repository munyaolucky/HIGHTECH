import React, { useEffect } from 'react';
import AccessDenied from '../components/portal/AccessDenied';
import SessionExpired from '../components/portal/SessionExpired';
import SessionLoading from '../components/portal/SessionLoading';
import type { PortalType, PortalUser, UserRole } from './auth-types';
import {
  getUserDashboardPath,
  hasAnyUserPermission,
  hasAnyUserRole,
  isAccountActive,
} from './auth-utils';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  children?: React.ReactNode;
  portalType?: PortalType;
  allowedRoles?: UserRole[];
  requiredPermissions?: string[];
  allowPasswordChange?: boolean;
  allowProfileCompletion?: boolean;
  onRedirect: (path: string) => void;
  onNavigateHome?: () => void;
  userOverride?: PortalUser | null;
}

export function ProtectedRoute({
  children,
  portalType,
  allowedRoles,
  requiredPermissions,
  allowPasswordChange = false,
  allowProfileCompletion = false,
  onRedirect,
  onNavigateHome,
  userOverride,
}: ProtectedRouteProps) {
  const { user: ctxUser, isAuthenticated, isLoading, sessionExpired } = useAuth();
  const user = userOverride !== undefined ? userOverride : ctxUser;
  const authed = userOverride !== undefined ? Boolean(userOverride) : isAuthenticated;

  useEffect(() => {
    if (userOverride !== undefined) return;
    if (isLoading || sessionExpired) return;
    if (!authed || !user) {
      onRedirect('/portal/login');
      return;
    }
    if (user.mustChangePassword && !allowPasswordChange) {
      onRedirect('/portal/change-password');
      return;
    }
    if (user.requiresProfileCompletion && !allowProfileCompletion) {
      onRedirect('/portal/complete-profile');
      return;
    }
  }, [
    userOverride,
    isLoading,
    sessionExpired,
    authed,
    user,
    allowPasswordChange,
    allowProfileCompletion,
    onRedirect,
  ]);

  if (userOverride === undefined && isLoading) {
    return <SessionLoading />;
  }

  if (userOverride === undefined && sessionExpired) {
    return (
      <SessionExpired
        onSignIn={() => onRedirect('/portal/login')}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (!authed || !user) {
    return <SessionLoading message="Redirecting to HI-TECH College Portal Sign-In..." />;
  }

  if (!isAccountActive(user)) {
    return (
      <AccessDenied
        title="Account not active"
        message="Your account is pending activation or currently suspended. Please contact the HI-TECH College Registrar or ICT Office."
        actionLabel="Go to Portal Sign-In"
        onAction={() => onRedirect('/portal/login')}
        onSecondaryAction={onNavigateHome}
      />
    );
  }

  if (user.mustChangePassword && !allowPasswordChange) {
    return <SessionLoading message="Password update required before opening portal..." />;
  }

  if (user.requiresProfileCompletion && !allowProfileCompletion) {
    return <SessionLoading message="Profile completion required before opening portal..." />;
  }

  if (portalType && user.portalType !== portalType) {
    const targetDashboard = getUserDashboardPath(user);
    return (
      <AccessDenied
        title="Wrong portal area"
        message={
          portalType === 'staff'
            ? 'This workspace belongs to the Staff Portal. Student accounts cannot open staff operations.'
            : 'This workspace belongs to the Student Portal. Please open your assigned Staff Portal workspace.'
        }
        actionLabel="Go to My Workspace"
        onAction={() => onRedirect(targetDashboard)}
        onSecondaryAction={onNavigateHome}
      />
    );
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasAnyUserRole(user, allowedRoles)) {
    return (
      <AccessDenied
        title="Role not authorized"
        message="Your assigned HI-TECH College role does not include access to this section."
        actionLabel="Return to Workspace"
        onAction={() => onRedirect(getUserDashboardPath(user))}
        onSecondaryAction={onNavigateHome}
      />
    );
  }

  if (
    requiredPermissions &&
    requiredPermissions.length > 0 &&
    !hasAnyUserPermission(user, requiredPermissions)
  ) {
    return (
      <AccessDenied
        title="Permission required"
        message="You do not have the required institutional permission for this section."
        actionLabel="Return to Workspace"
        onAction={() => onRedirect(getUserDashboardPath(user))}
        onSecondaryAction={onNavigateHome}
      />
    );
  }

  return <>{children}</>;
}

export default ProtectedRoute;

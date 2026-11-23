import React, { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import type { PortalUser, UserRole } from './auth-types';
import { hasAnyUserRole } from './auth-utils';

interface RoleGateProps {
  roles: UserRole[];
  user?: PortalUser | null;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export function RoleGate({
  roles,
  user: explicitUser,
  fallback = null,
  children,
}: RoleGateProps) {
  const ctx = useContext(AuthContext);
  const user = explicitUser !== undefined ? explicitUser : (ctx?.user ?? null);

  if (!hasAnyUserRole(user, roles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RoleGate;

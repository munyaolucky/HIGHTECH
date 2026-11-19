import React, { useContext } from 'react';
import { AuthContext } from './AuthProvider';
import type { PortalUser } from './auth-types';
import {
  hasAllUserPermissions,
  hasAnyUserPermission,
  hasUserPermission,
} from './auth-utils';

interface PermissionGateProps {
  permission?: string;
  anyOf?: string[];
  allOf?: string[];
  user?: PortalUser | null;
  fallback?: React.ReactNode;
  children?: React.ReactNode;
}

export function PermissionGate({
  permission,
  anyOf,
  allOf,
  user: explicitUser,
  fallback = null,
  children,
}: PermissionGateProps) {
  const ctx = useContext(AuthContext);
  const user = explicitUser !== undefined ? explicitUser : (ctx?.user ?? null);

  if (permission && !hasUserPermission(user, permission)) {
    return <>{fallback}</>;
  }

  if (anyOf && anyOf.length > 0 && !hasAnyUserPermission(user, anyOf)) {
    return <>{fallback}</>;
  }

  if (allOf && allOf.length > 0 && !hasAllUserPermissions(user, allOf)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;

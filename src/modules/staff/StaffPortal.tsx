import { useEffect, useState } from 'react';
import { STAFF_ACCOUNTS, type StaffRole } from '../../config/staff-navigation';
import type { PortalRole } from '../../types';
import StaffLayout from './StaffLayout';

export default function StaffPortal({
  initialRole,
  initialPath = '/staff/dashboard',
  onSwitchPortal,
  onOpenActivationPage,
  onOpenPublicPreview,
  onLogout,
}: {
  initialRole?: StaffRole;
  initialPath?: string;
  onSwitchPortal?: (portal: PortalRole) => void;
  onOpenActivationPage?: (token?: string) => void;
  onOpenPublicPreview?: (publicPath: string) => void;
  onLogout: () => void;
}) {
  const [role, setRole] = useState<StaffRole | 'UNCONFIGURED'>(initialRole ?? 'ADMIN');

  useEffect(() => {
    if (initialRole) {
      setRole(initialRole);
      return;
    }
    let active = true;
    fetch('/api/auth/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((json) => {
        if (!active) return;
        const primary = json?.data?.user?.primaryRole as StaffRole | undefined;
        if (json?.data?.authenticated && primary && STAFF_ACCOUNTS[primary]) {
          setRole(primary);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [initialRole]);

  return (
    <StaffLayout
      role={role}
      initialPath={initialPath}
      onSwitchRole={setRole}
      onSwitchPortal={onSwitchPortal}
      onOpenActivationPage={onOpenActivationPage}
      onOpenPublicPreview={onOpenPublicPreview}
      onLogout={onLogout}
    />
  );
}

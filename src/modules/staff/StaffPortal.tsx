import { useAuth } from '../../auth/useAuth';
import { STAFF_ACCOUNTS, type StaffRole } from '../../config/staff-navigation';
import type { PortalRole } from '../../types';
import StaffLayout from './StaffLayout';

export default function StaffPortal({
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
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F4F7FB] dark:bg-[#0b1424] text-slate-700 dark:text-slate-200 p-6">
        <p className="text-sm font-semibold">Verifying your staff account...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#F4F7FB] dark:bg-[#0b1424] text-slate-700 dark:text-slate-200 p-6">
        <p className="text-sm font-semibold">
          Your staff session has expired. Please sign in again.
        </p>
      </div>
    );
  }

  const assignedRole = user.primaryRole as StaffRole;

  const role: StaffRole | 'UNCONFIGURED' =
    STAFF_ACCOUNTS[assignedRole] ? assignedRole : 'UNCONFIGURED';

  return (
    <StaffLayout
      role={role}
      initialPath={initialPath}
      onSwitchPortal={onSwitchPortal}
      onOpenActivationPage={onOpenActivationPage}
      onOpenPublicPreview={onOpenPublicPreview}
      onLogout={onLogout}
    />
  );
}

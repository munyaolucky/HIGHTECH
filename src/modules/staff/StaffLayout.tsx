import { useEffect, useState } from 'react';
import { PortalConfirmDialog } from '../../components/ui/PortalUI';
import {
  STAFF_ACCOUNTS,
  type StaffRole,
  type StaffUserAccount,
} from '../../config/staff-navigation';
import type { PortalRole } from '../../types';
import { syncStaffServerSession } from './hooks/useStaffDashboard';
import StaffDashboardRouter from './StaffDashboardRouter';
import StaffHeader from './StaffHeader';
import StaffSidebar from './StaffSidebar';

export interface StaffUser {
  id: string;
  fullName: string;
  role: StaffRole | 'UNCONFIGURED';
  permissions: string[];
}

interface Props {
  role: StaffRole | 'UNCONFIGURED';
  initialPath?: string;
  onSwitchRole: (role: StaffRole | 'UNCONFIGURED') => void;
  onSwitchPortal?: (portal: PortalRole) => void;
  onOpenActivationPage?: (token?: string) => void;
  onLogout: () => void;
}

export default function StaffLayout({
  role,
  initialPath = '/staff/dashboard',
  onSwitchRole,
  onSwitchPortal,
  onOpenActivationPage,
  onLogout,
}: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePath, setActivePath] = useState(initialPath);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    setActivePath(initialPath);
  }, [initialPath]);

  const account: StaffUserAccount | null =
    role !== 'UNCONFIGURED' ? STAFF_ACCOUNTS[role] ?? null : null;

  const [selectedCampus, setSelectedCampus] = useState<string>(
    account?.campus ?? 'Nairobi Main Campus'
  );

  useEffect(() => {
    syncStaffServerSession(role).catch(() => {});
  }, [role]);

  const activeCampus =
    account && account.allowedCampuses.includes(selectedCampus)
      ? selectedCampus
      : account?.campus ?? 'Nairobi Main Campus';

  const handleRoleSwitch = (nextRole: StaffRole | 'UNCONFIGURED') => {
    syncStaffServerSession(nextRole, true).catch(() => {});
    onSwitchRole(nextRole);
    setActivePath('/staff/dashboard');
    setMobileOpen(false);
    if (nextRole !== 'UNCONFIGURED' && STAFF_ACCOUNTS[nextRole]) {
      setSelectedCampus(STAFF_ACCOUNTS[nextRole].campus);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] text-slate-900 dark:text-slate-100 flex">
      <StaffSidebar
        role={role}
        activePath={activePath}
        onNavigate={setActivePath}
        onSwitchRole={handleRoleSwitch}
        permissions={account?.permissions ?? []}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
      />

      <div className="flex min-h-screen flex-1 flex-col min-w-0">
        <StaffHeader
          staffName={account?.fullName ?? 'Unconfigured Staff Account'}
          staffRole={role}
          activeCampus={activeCampus}
          allowedCampuses={account?.allowedCampuses ?? ['Nairobi Main Campus']}
          permissions={account?.permissions ?? []}
          sidebarCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
          onCampusChange={setSelectedCampus}
          onMenuClick={() => setMobileOpen(true)}
          onNavigate={setActivePath}
          onRequestLogout={() => setLogoutConfirmOpen(true)}
        />

        <main className="mx-auto w-full max-w-[1600px] flex-1 p-4 md:p-7">
          <StaffDashboardRouter
            role={role}
            user={account}
            activePath={activePath}
            activeCampus={activeCampus}
            onNavigate={setActivePath}
            onSwitchPortal={onSwitchPortal}
            onOpenActivationPage={onOpenActivationPage}
          />
        </main>

        <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 text-center text-xs text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} HI-TECH College · Staff Portal
        </footer>
      </div>

      <PortalConfirmDialog
        isOpen={logoutConfirmOpen}
        title="Sign out of Staff Portal"
        message="You will exit your current staff workspace and return to the HI-TECH College public portal."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        onConfirm={() => {
          setLogoutConfirmOpen(false);
          fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
          fetch('/api/staff/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
          onLogout();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}

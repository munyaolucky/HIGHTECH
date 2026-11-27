import { useContext, useEffect, useState } from 'react';
import { Bell, ClipboardList, Home, Menu, User } from 'lucide-react';
import { AuthContext } from '../../auth/AuthProvider';
import { PortalConfirmDialog } from '../../components/ui/PortalUI';
import {
  STAFF_ACCOUNTS,
  type StaffRole,
  type StaffUserAccount,
} from '../../config/staff-navigation';
import type { PortalRole } from '../../types';
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
  onSwitchPortal?: (portal: PortalRole) => void;
  onOpenActivationPage?: (token?: string) => void;
  onOpenPublicPreview?: (publicPath: string) => void;
  onLogout: () => void;
}

export default function StaffLayout({
  role,
  initialPath = '/staff/dashboard',
  onSwitchPortal,
  onOpenActivationPage,
  onOpenPublicPreview,
  onLogout,
}: Props) {
  const authCtx = useContext(AuthContext);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePath, setActivePath] = useState(initialPath);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  useEffect(() => {
    setActivePath(initialPath);
  }, [initialPath]);

  const resolvedStaffRole: StaffRole | null =
    role !== 'UNCONFIGURED' ? role : null;
  const accountTemplate: StaffUserAccount | null =
    resolvedStaffRole ? STAFF_ACCOUNTS[resolvedStaffRole] ?? null : null;

  const account: StaffUserAccount | null =
    accountTemplate && resolvedStaffRole
      ? {
          ...accountTemplate,
          id: authCtx?.user?.uid ?? '',
          fullName: authCtx?.user?.fullName ?? '',
          email: authCtx?.user?.email ?? '',
          employeeNumber:
            authCtx?.user?.registrationNumber ?? accountTemplate.employeeNumber,
          role: resolvedStaffRole,
          roleTitle: authCtx?.user?.roleTitle ?? accountTemplate.roleTitle,
          department: authCtx?.user?.department ?? accountTemplate.department,
          campus: authCtx?.user?.campus ?? accountTemplate.campus,
          permissions: authCtx?.user?.permissions ?? [],
        }
      : null;

  const [selectedCampus, setSelectedCampus] = useState<string>(
    account?.campus ?? 'Nairobi Main Campus'
  );

  const activeCampus =
    account && account.allowedCampuses.includes(selectedCampus)
      ? selectedCampus
      : account?.campus ?? 'Nairobi Main Campus';

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] text-slate-900 dark:text-slate-100 flex">
      <StaffSidebar
        role={role}
        activePath={activePath}
        onNavigate={setActivePath}
        permissions={account?.permissions ?? []}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={sidebarCollapsed}
      />

      <div className="flex min-h-screen flex-1 flex-col min-w-0 pb-20 lg:pb-0">
        <StaffHeader
          staffName={account?.fullName ?? authCtx?.user?.fullName ?? 'Unconfigured Staff Account'}
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
            onOpenPublicPreview={onOpenPublicPreview}
          />
        </main>

        <footer className="no-print border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-4 text-center text-xs text-slate-600 dark:text-slate-300">
          © {new Date().getFullYear()} HI-TECH College · Staff Portal
        </footer>
      </div>

      {/* MOBILE STAFF BOTTOM NAVIGATION BAR */}
      <nav
        aria-label="Mobile staff quick navigation"
        className="lg:hidden fixed inset-x-0 bottom-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 grid grid-cols-5 items-center gap-1"
      >
        <button
          type="button"
          aria-current={activePath === '/staff/dashboard' ? 'page' : undefined}
          onClick={() => setActivePath('/staff/dashboard')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors ${
            activePath === '/staff/dashboard'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Home size={18} aria-hidden="true" />
          <span>Home</span>
        </button>
        <button
          type="button"
          aria-current={activePath === '/staff/tasks' ? 'page' : undefined}
          onClick={() => setActivePath('/staff/tasks')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors ${
            activePath === '/staff/tasks'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <ClipboardList size={18} aria-hidden="true" />
          <span>Tasks</span>
        </button>
        <button
          type="button"
          aria-current={activePath === '/staff/notifications' ? 'page' : undefined}
          onClick={() => setActivePath('/staff/notifications')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors ${
            activePath === '/staff/notifications'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Bell size={18} aria-hidden="true" />
          <span>Notices</span>
        </button>
        <button
          type="button"
          aria-current={activePath === '/staff/profile' ? 'page' : undefined}
          onClick={() => setActivePath('/staff/profile')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors ${
            activePath === '/staff/profile'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <User size={18} aria-hidden="true" />
          <span>Profile</span>
        </button>
        <button
          type="button"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[11px] font-semibold transition-colors ${
            mobileOpen
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Menu size={18} aria-hidden="true" />
          <span>Menu</span>
        </button>
      </nav>

      <PortalConfirmDialog
        isOpen={logoutConfirmOpen}
        title="Sign out of Staff Portal"
        message="You will exit your current staff workspace and return to the HI-TECH College public portal."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        onConfirm={async () => {
          setLogoutConfirmOpen(false);
          if (authCtx) {
            await authCtx.signOut().catch(() => {});
          } else {
            await Promise.allSettled([
              fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }),
              fetch('/api/staff/logout', { method: 'POST', credentials: 'include' }),
            ]);
          }
          onLogout();
        }}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bell,
  ChevronDown,
  HelpCircle,
  LogOut,
  MapPin,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  User,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getStaffNavigation, type StaffRole } from '../../config/staff-navigation';
import { engagementService } from '../../services/engagementService';
import { staffPortalService } from '../../services/staffPortalService';

interface Props {
  staffName: string;
  staffRole: StaffRole | 'UNCONFIGURED';
  activeCampus: string;
  allowedCampuses: string[];
  permissions: string[];
  sidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  onCampusChange: (campus: string) => void;
  onMenuClick: () => void;
  onNavigate: (path: string) => void;
  onRequestLogout: () => void;
}

export default function StaffHeader({
  staffName,
  staffRole,
  activeCampus,
  allowedCampuses,
  permissions,
  sidebarCollapsed,
  onToggleCollapse,
  onCampusChange,
  onMenuClick,
  onNavigate,
  onRequestLogout,
}: Props) {
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifRefreshTick, setNotifRefreshTick] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
        setNotifOpen(false);
        setMobileSearchOpen(false);
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  void notifRefreshTick;
  const engagement = engagementService.getState();
  const unreadNotifs = engagement.notifications.filter((n) => !n.read);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || staffRole === 'UNCONFIGURED') return [];

    const { roleItems, sharedItems } = getStaffNavigation(staffRole, permissions);
    const navMatches = [...roleItems, ...sharedItems]
      .filter((item) => item.label.toLowerCase().includes(q))
      .map((item) => ({
        id: item.path,
        label: item.label,
        meta: 'Workspace Module',
        path: item.path,
      }));

    const taskMatches = staffPortalService
      .getTasksForRole(staffRole)
      .filter(
        (t) =>
          t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)
      )
      .map((t) => ({
        id: t.id,
        label: t.title,
        meta: `Task · ${t.status.replaceAll('_', ' ')}`,
        path: '/staff/tasks',
      }));

    return [...navMatches, ...taskMatches].slice(0, 6);
  }, [searchQuery, staffRole, permissions]);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 px-4 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>

        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="hidden lg:inline-flex rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {sidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>

        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-bold text-[#102D50] dark:text-white">
            Staff Portal
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin size={12} className="shrink-0" />
            {allowedCampuses.length > 1 ? (
              <select
                aria-label="Active campus scope"
                value={activeCampus}
                onChange={(e) => onCampusChange(e.target.value)}
                className="bg-transparent text-xs font-medium text-slate-600 dark:text-slate-300 cursor-pointer rounded"
              >
                {allowedCampuses.map((campus) => (
                  <option key={campus} value={campus} className="bg-white dark:bg-slate-900">
                    {campus}
                  </option>
                ))}
              </select>
            ) : (
              <span className="truncate">{activeCampus}</span>
            )}
          </div>
        </div>
      </div>

      <div className="relative hidden w-full max-w-sm md:block">
        <label className="relative block">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchResults.length > 0) {
                onNavigate(searchResults[0].path);
                setSearchQuery('');
              }
            }}
            placeholder="Search modules or tasks..."
            aria-label="Search staff portal"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-10 pr-8 text-sm text-slate-900 dark:text-slate-100 focus:border-[#1769AA] focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-[#1769AA]/20"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </label>

        {searchQuery.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-12 z-40 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl">
            {searchResults.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-slate-600 dark:text-slate-300">
                No permitted modules or tasks match &ldquo;{searchQuery}&rdquo;.
              </div>
            ) : (
              searchResults.map((hit) => (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => {
                    onNavigate(hit.path);
                    setSearchQuery('');
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                    {hit.label}
                  </span>
                  <span className="text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
                    {hit.meta}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setMobileSearchOpen((o) => !o)}
          aria-label="Toggle staff search"
          aria-expanded={mobileSearchOpen}
          className="md:hidden rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
        </button>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <button
          type="button"
          onClick={() => onNavigate('/staff/support')}
          aria-label="Help and support centre"
          className="hidden sm:inline-flex rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <HelpCircle size={18} />
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((o) => !o);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-haspopup="menu"
            className="relative rounded-xl p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Bell size={18} />
            {unreadNotifs.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-md bg-red-600 px-1 text-[10px] font-bold text-white tabular-nums">
                {unreadNotifs.length}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-12 z-40 w-80 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 shadow-xl">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold text-[#102D50] dark:text-white">
                  Institutional Notices
                </span>
                {unreadNotifs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      engagementService.markAllRead();
                      setNotifRefreshTick((t) => t + 1);
                    }}
                    className="text-[11px] font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-60 space-y-2 overflow-y-auto">
                {engagement.notifications.slice(0, 4).map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => {
                      engagementService.markNotificationRead(n.id);
                      setNotifRefreshTick((t) => t + 1);
                      setNotifOpen(false);
                      onNavigate('/staff/notifications');
                    }}
                    className={`block w-full rounded-lg border p-2.5 text-left transition-colors ${
                      n.read
                        ? 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40'
                        : 'border-blue-200 dark:border-blue-800 bg-blue-50/70 dark:bg-blue-950/30'
                    }`}
                  >
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {n.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {n.message}
                    </p>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setNotifOpen(false);
                  onNavigate('/staff/notifications');
                }}
                className="mt-2.5 w-full rounded-lg bg-slate-100 dark:bg-slate-800 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Open Notifications Centre
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((open) => !open);
              setNotifOpen(false);
            }}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#102D50] text-xs font-bold text-[#E8B44A]">
              {staffName.trim().charAt(0).toUpperCase() || 'S'}
            </div>
            <div className="hidden text-left sm:block">
              <div className="max-w-36 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">
                {staffName}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {staffRole.replaceAll('_', ' ')}
              </div>
            </div>
            <ChevronDown size={14} className="hidden text-slate-500 sm:block" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-12 z-40 w-56 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2 shadow-xl">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onNavigate('/staff/profile');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <User size={16} /> My Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onNavigate('/staff/settings');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Settings size={16} /> Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onNavigate('/staff/support');
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <HelpCircle size={16} /> Help &amp; Support
              </button>
              <hr className="my-2 border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  onRequestLogout();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {mobileSearchOpen && (
        <div className="fixed inset-x-0 top-16 z-30 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 md:hidden shadow-lg">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300"
            />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  onNavigate(searchResults[0].path);
                  setSearchQuery('');
                  setMobileSearchOpen(false);
                }
              }}
              placeholder="Search modules or tasks..."
              aria-label="Search staff portal"
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchQuery.trim().length > 0 && (
            <div className="space-y-1">
              {searchResults.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-300 px-1">
                  No permitted modules or tasks match &ldquo;{searchQuery}&rdquo;.
                </p>
              ) : (
                searchResults.map((hit) => (
                  <button
                    key={hit.id}
                    type="button"
                    onClick={() => {
                      onNavigate(hit.path);
                      setSearchQuery('');
                      setMobileSearchOpen(false);
                    }}
                    className="flex w-full items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-800 px-3 py-2 text-left text-xs text-slate-800 dark:text-slate-100"
                  >
                    <span className="truncate font-semibold">{hit.label}</span>
                    <ArrowRight size={13} className="text-slate-500 dark:text-slate-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}

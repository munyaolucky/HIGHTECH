import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  X,
} from 'lucide-react';
import ScrollView from './ScrollView';
import StaffEventFeedPane from './StaffEventFeedPane';
import StaffIdentityDrawer from './StaffIdentityDrawer';
import AccountRoleWorkspace from './portal/AccountRoleWorkspace';
import { resolveCatalogRoleForPortalShell } from '../config/roleDutyCatalog';
import { usePortalShellContext } from '../context/PortalShellContext';
import { useTheme } from '../context/ThemeContext';
import { institutionalEventBus } from '../services/institutionalEventBus';
import { PortalRole } from '../types';

export interface SidebarNavItem {
  id: string;
  label: string;
  description: string;
  keywords: string;
  icon: React.ComponentType<{ size?: number }>;
  group: string;
  gradientClass?: string;
}

export interface UserPortalConfig {
  role: PortalRole;
  portalTitle: string;
  portalSubtitle: string;
  userName: string;
  userRegNo: string;
  userTitle: string;
  department: string;
  campus: string;
  defaultTab: string;
  navItems: SidebarNavItem[];
  quickStats: { label: string; value: string; toneClass: string }[];
  relatedPortals: { role: PortalRole; label: string }[];
}

interface UserPortalShellProps {
  config: UserPortalConfig;
  onSwitchPortal: (role: PortalRole) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

function withDarkStatTone(toneClass: string): string {
  if (toneClass.includes('dark:')) return toneClass;
  if (toneClass.includes('amber') || toneClass.includes('orange') || toneClass.includes('yellow')) {
    return `${toneClass} dark:text-amber-300`;
  }
  if (toneClass.includes('emerald') || toneClass.includes('green')) {
    return `${toneClass} dark:text-emerald-300`;
  }
  if (toneClass.includes('red') || toneClass.includes('rose')) {
    return `${toneClass} dark:text-red-300`;
  }
  if (toneClass.includes('purple') || toneClass.includes('violet') || toneClass.includes('indigo')) {
    return `${toneClass} dark:text-violet-300`;
  }
  return `${toneClass} dark:text-blue-300`;
}

export default function UserPortalShell({
  config,
  onSwitchPortal,
  onLogout,
  children,
}: UserPortalShellProps) {
  const ctx = usePortalShellContext();
  const { theme, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [eventFeedOpen, setEventFeedOpen] = useState(false);
  const [identityDrawerOpen, setIdentityDrawerOpen] = useState(false);
  const [roleCapabilitiesOpen, setRoleCapabilitiesOpen] = useState(false);
  const [unreadChannelCount, setUnreadChannelCount] = useState(() =>
    institutionalEventBus.getUnreadCountForRole(config.role)
  );

  const isOverview = ctx?.overviewOpenByRole[config.role] ?? true;
  const activeTab = ctx?.tabsByRole[config.role] ?? config.defaultTab;

  useEffect(() => {
    const syncUnread = () => {
      setUnreadChannelCount(institutionalEventBus.getUnreadCountForRole(config.role));
    };
    syncUnread();
    return institutionalEventBus.subscribe(syncUnread);
  }, [config.role]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setMobileSearchOpen(false);
        setSearchValue('');
        setLogoutModalOpen(false);
        setEventFeedOpen(false);
        setIdentityDrawerOpen(false);
        setRoleCapabilitiesOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openOverview = () => {
    ctx?.setOverviewOpen(config.role, true);
    setSidebarOpen(false);
    setMobileSearchOpen(false);
    setSearchValue('');
  };

  const selectTab = (tabId: string) => {
    ctx?.setPortalTab(config.role, tabId);
    setSidebarOpen(false);
    setMobileSearchOpen(false);
    setSearchValue('');
  };

  const groupedItems = config.navItems.reduce<Record<string, SidebarNavItem[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  const searchMatches = searchValue.trim()
    ? config.navItems.filter(
        (item) =>
          item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.keywords.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.description.toLowerCase().includes(searchValue.toLowerCase())
      )
    : [];

  const initials = config.userName
    .split(' ')
    .filter((w) => !w.endsWith('.'))
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="min-h-screen bg-[#f5f8fd] dark:bg-[#0b1424] text-[#102b55] dark:text-slate-100 font-sans flex flex-col transition-colors">
      {/* TOP USER WORKSPACE BAR */}
      <header className="sticky top-0 z-30 h-16 px-4 sm:px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label={sidebarOpen ? 'Close workspace menu' : 'Open workspace menu'}
            aria-expanded={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-[#092c60] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            type="button"
            onClick={openOverview}
            className="flex items-center gap-3 text-left min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eef4fd] dark:bg-slate-800 text-[#092c60] dark:text-blue-300 flex items-center justify-center shrink-0">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-[#092c60] dark:text-white tracking-tight truncate">
                {config.portalTitle}
              </h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 truncate hidden sm:block">
                {config.portalSubtitle}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* LIVE SECTION SEARCH (DESKTOP) */}
          <div className="relative hidden md:block">
            <div className="w-56 h-9 px-3 bg-[#f5f8fc] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 text-slate-600 dark:text-slate-300 focus-within:border-[#0866d7] focus-within:ring-2 focus-within:ring-[#0866d7]/20">
              <Search size={14} className="shrink-0" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchMatches.length > 0) {
                    selectTab(searchMatches[0].id);
                  }
                }}
                placeholder="Jump to workspace tool..."
                aria-label="Search portal modules"
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  aria-label="Clear search"
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {searchValue.trim().length > 0 && (
              <div className="absolute top-10 right-0 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-1.5 z-50">
                {searchMatches.length === 0 ? (
                  <p className="px-3 py-2 text-xs text-slate-600 dark:text-slate-300">
                    No workspace modules match &ldquo;{searchValue}&rdquo;.
                  </p>
                ) : (
                  searchMatches.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
                      className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-[#eef4fd] dark:hover:bg-slate-800 hover:text-[#092c60] dark:hover:text-white rounded-lg flex items-center justify-between"
                    >
                      <span className="truncate">{item.label}</span>
                      <ArrowRight size={13} className="text-slate-500 dark:text-slate-300 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* QUICK PORTAL SWITCHER BUTTON */}
          <button
            type="button"
            onClick={() => ctx?.openSwitcher?.()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-[#092c60] dark:text-blue-200 text-xs font-bold border border-blue-200 dark:border-slate-700 transition"
            title="Browse all 20 institutional portals"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Switch Portal</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileSearchOpen((o) => !o)}
            aria-label="Toggle workspace search"
            aria-expanded={mobileSearchOpen}
            className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {mobileSearchOpen ? <X size={17} /> : <Search size={17} />}
          </button>

          <button
            type="button"
            onClick={() => setEventFeedOpen(true)}
            aria-label="Open Staff Channel Event Feed"
            className="relative p-2 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Staff Channel Alerts &amp; Events"
          >
            <Bell size={17} />
            {unreadChannelCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                {unreadChannelCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-lg text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          <button
            type="button"
            onClick={() => setRoleCapabilitiesOpen(true)}
            aria-label="Inspect Role Duties, Events & Permissions"
            className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            <ShieldCheck size={14} className="text-[#1769AA] dark:text-blue-400" />
            <span>Duties &amp; Permissions</span>
          </button>

          <button
            type="button"
            onClick={() => onSwitchPortal('staff')}
            className="hidden lg:inline-flex items-center gap-1.5 rounded-lg bg-[#eef4fd] dark:bg-slate-800 hover:bg-[#dceafe] dark:hover:bg-slate-700 px-2.5 py-1.5 text-xs font-bold text-[#092c60] dark:text-blue-200 transition-colors whitespace-nowrap"
          >
            <ShieldCheck size={14} />
            <span>Staff Portal</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors whitespace-nowrap"
          >
            <Home size={14} />
            <span>Website</span>
          </button>

          <button
            type="button"
            onClick={() => setIdentityDrawerOpen(true)}
            aria-label="Open Staff Identity & Channel Hub"
            className="hidden sm:flex items-center gap-2.5 pl-2 pr-1.5 py-1 rounded-lg border-l border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Inspect Staff Identity &amp; Switch Officer Persona"
          >
            <div className="w-8 h-8 rounded-full bg-[#092c60] text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
              {initials || 'HT'}
            </div>
            <div className="text-left leading-tight">
              <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                {config.userName}
              </strong>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                {config.userRegNo}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* EXPANDABLE MOBILE SEARCH DRAWER */}
      {mobileSearchOpen && (
        <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 space-y-2 z-20">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
            <Search size={15} className="text-slate-500 dark:text-slate-300 shrink-0" />
            <input
              autoFocus
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchMatches.length > 0) {
                  selectTab(searchMatches[0].id);
                }
              }}
              placeholder="Jump to workspace tool..."
              aria-label="Search portal modules"
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                aria-label="Clear search"
                className="text-slate-500 dark:text-slate-300"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchValue.trim().length > 0 && (
            <div className="space-y-1">
              {searchMatches.length === 0 ? (
                <p className="text-xs text-slate-600 dark:text-slate-300 px-1">
                  No workspace modules match &ldquo;{searchValue}&rdquo;.
                </p>
              ) : (
                searchMatches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  >
                    <span className="truncate">{item.label}</span>
                    <ArrowRight size={13} className="text-slate-500 dark:text-slate-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* DARK NAVY SIDEBAR MENU */}
        <aside
          className={`fixed lg:sticky top-16 left-0 z-30 w-60 h-[calc(100vh-4rem)] bg-gradient-to-b from-[#092b5d] to-[#061f46] text-white p-3 pt-4 flex flex-col overflow-y-auto scrollview-dark transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav aria-label={`${config.portalTitle} navigation`} className="space-y-1">
            <button
              type="button"
              onClick={openOverview}
              aria-current={isOverview ? 'page' : undefined}
              className={`w-full min-h-[40px] px-3 rounded-lg flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                isOverview
                  ? 'bg-gradient-to-r from-[#0875e8] to-[#1761c6] text-white shadow-sm'
                  : 'text-blue-50 hover:bg-white/10'
              }`}
            >
              <Home size={16} />
              <span className="flex-1 whitespace-nowrap truncate">My Dashboard Overview</span>
            </button>
          </nav>

          {Object.entries(groupedItems).map(([group, items]) => (
            <div key={group} className="mt-4">
              <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wide text-blue-200">
                {group}
              </p>
              <nav aria-label={group} className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = !isOverview && activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
                      aria-current={active ? 'page' : undefined}
                      className={`w-full min-h-[38px] px-3 rounded-lg flex items-center gap-2.5 text-xs font-semibold text-left transition-colors ${
                        active
                          ? 'bg-gradient-to-r from-[#0875e8] to-[#1761c6] text-white shadow-sm'
                          : 'text-blue-50 hover:bg-white/10'
                      }`}
                    >
                      <Icon size={16} />
                      <span className="flex-1 whitespace-nowrap truncate">{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ))}

          <div className="mt-5">
            <p className="px-3 mb-1.5 text-[11px] font-bold tracking-wide text-blue-200">
              Connected Portals
            </p>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => onSwitchPortal('staff')}
                className="w-full px-3 py-2 rounded-lg text-[11px] font-semibold text-amber-200 hover:bg-white/10 flex items-center justify-between transition-colors"
              >
                <span className="truncate">Staff Portal (21 Roles)</span>
                <ArrowRight size={12} className="opacity-85 shrink-0" />
              </button>
              {config.relatedPortals
                .filter((rel) => rel.role !== 'staff')
                .map((rel) => (
                  <button
                    key={rel.role}
                    type="button"
                    onClick={() => onSwitchPortal(rel.role)}
                    className="w-full px-3 py-2 rounded-lg text-[11px] font-medium text-blue-100 hover:bg-white/10 flex items-center justify-between transition-colors"
                  >
                    <span className="truncate">{rel.label}</span>
                    <ArrowRight size={12} className="opacity-85 shrink-0" />
                  </button>
                ))}
              <button
                type="button"
                onClick={() => ctx?.openSwitcher?.()}
                className="w-full px-3 py-2 rounded-lg text-[11px] font-bold text-amber-300 hover:bg-white/10 flex items-center justify-between transition-colors"
              >
                <span className="truncate">Browse All 20 Portals...</span>
                <Sparkles size={12} className="opacity-90 shrink-0" />
              </button>
            </div>
          </div>

          <div className="mt-auto pt-4 space-y-2">
            <div className="p-3 rounded-xl bg-white/10 border border-white/15 space-y-0.5 text-[11px]">
              <strong className="text-white block truncate">{config.userName}</strong>
              <span className="text-amber-300 font-mono block">{config.userRegNo}</span>
              <span className="text-blue-100 block truncate">{config.userTitle}</span>
            </div>

            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              className="w-full py-2.5 px-3 border-t border-white/15 flex items-center gap-2.5 text-xs font-semibold text-blue-100 hover:text-red-200"
            >
              <LogOut size={16} /> Return to Public Website
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-16 bg-slate-950/50 z-20 lg:hidden"
          />
        )}

        {/* USER PORTAL CONTENT AREA */}
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <div className="max-w-7xl mx-auto space-y-5">
            {isOverview ? (
              <div className="space-y-5">
                {/* PERSONALIZED USER DASHBOARD HERO */}
                <section className="bg-gradient-to-r from-[#092c60] via-[#0c3a7a] to-[#114a96] text-white rounded-2xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-2xl">
                    <span className="text-[11px] font-bold tracking-wide text-amber-300 font-mono">
                      {config.userRegNo} · {config.department}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-balance">
                      Welcome back, {config.userName}
                    </h1>
                    <p className="text-sm text-blue-100">
                      {config.userTitle} · {config.campus} — Use the sidebar menu or tiles below to operate your workspace modules.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => selectTab(config.navItems[0]?.id ?? config.defaultTab)}
                        className="px-4 py-2 bg-[#ffc400] hover:bg-[#ffda54] text-[#092c60] text-xs font-extrabold rounded-lg inline-flex items-center gap-1.5"
                      >
                        Open {config.navItems[0]?.label ?? 'Workspace'} <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => onSwitchPortal('student')}
                        className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg border border-white/25"
                      >
                        Switch to Student View
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-blue-100 shrink-0">
                    <ShieldCheck size={16} className="text-amber-300" />
                    <span>Authenticated Role Session</span>
                  </div>
                </section>

                {/* USER KPI SUMMARY */}
                <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {config.quickStats.map((st) => (
                    <div
                      key={st.label}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {st.label}
                      </span>
                      <strong
                        className={`text-xl font-extrabold font-mono tabular-nums mt-1 ${withDarkStatTone(st.toneClass)}`}
                      >
                        {st.value}
                      </strong>
                    </div>
                  ))}
                </section>

                {/* QUICK ACCESS MODULES GRID */}
                <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#092c60] dark:text-white">
                        {config.portalTitle} — Quick Access Actions
                      </h2>
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Select any module below or use the sidebar menu to open it directly.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEventFeedOpen(true)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
                    >
                      <Bell size={15} />
                      <span>Channel Alerts{unreadChannelCount > 0 ? ` (${unreadChannelCount})` : ''}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {config.navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTab(item.id)}
                          className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 hover:bg-[#eef4fd] dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0866d7] dark:hover:border-blue-500 text-left flex items-start justify-between gap-3 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-10 h-10 rounded-lg text-white flex items-center justify-center shrink-0 ${
                                item.gradientClass ?? 'bg-[#092c60]'
                              }`}
                            >
                              <Icon size={18} />
                            </div>
                            <div>
                              <strong className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-[#092c60] dark:group-hover:text-blue-300">
                                {item.label}
                              </strong>
                              <span className="text-[11px] text-slate-600 dark:text-slate-300 block mt-0.5">
                                {item.description}
                              </span>
                            </div>
                          </div>
                          <ArrowRight
                            size={15}
                            className="text-slate-500 dark:text-slate-300 group-hover:text-[#0866d7] dark:group-hover:text-blue-300 shrink-0 mt-1"
                          />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openOverview}
                    className="px-3 py-2 rounded-lg text-xs font-bold text-[#092c60] dark:text-blue-200 bg-[#eef4fd] dark:bg-slate-800 hover:bg-[#dceafe] dark:hover:bg-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <ArrowLeft size={14} /> Overview
                  </button>

                  <ScrollView
                    direction="horizontal"
                    snap
                    showArrows
                    hideScrollbar
                    fadeColor={theme === 'dark' ? 'from-slate-900' : 'from-white'}
                    ariaLabel="Workspace module quick switcher"
                    className="flex-1 min-w-0"
                  >
                    <div className="flex items-center gap-1.5 px-1">
                      {config.navItems.map((item) => {
                        const Icon = item.icon;
                        const active = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectTab(item.id)}
                            aria-current={active ? 'page' : undefined}
                            className={`scrollview-snap-item px-3 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors ${
                              active
                                ? 'bg-[#092c60] dark:bg-[#1769aa] text-white shadow-xs'
                                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            <Icon size={14} />
                            <span>{item.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollView>
                </div>

                {children}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* LOGOUT MODAL */}
      {logoutModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setLogoutModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="portal-logout-dialog-title"
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <div className="flex items-center justify-between gap-2">
              <h3
                id="portal-logout-dialog-title"
                className="text-base font-bold text-[#092c60] dark:text-white"
              >
                Sign Out of {config.portalTitle}
              </h3>
              <button
                type="button"
                aria-label="Close dialog"
                onClick={() => setLogoutModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Return from {config.userName}&apos;s workspace ({config.userRegNo}) back to the HI-TECH College Public Website? All changes remain saved.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setLogoutModalOpen(false);
                  onLogout();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      <StaffEventFeedPane
        isOpen={eventFeedOpen}
        onClose={() => setEventFeedOpen(false)}
        currentRole={config.role}
        onNavigateTab={selectTab}
        onSwitchPortal={onSwitchPortal}
      />

      <StaffIdentityDrawer
        isOpen={identityDrawerOpen}
        onClose={() => setIdentityDrawerOpen(false)}
        currentRole={config.role}
        onSwitchPortal={onSwitchPortal}
        onLogout={onLogout}
      />

      {roleCapabilitiesOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRoleCapabilitiesOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Portal Role Duties, Events & Permissions"
            className="w-full max-w-4xl h-full bg-[#f5f8fd] dark:bg-[#0b1424] border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl overflow-hidden"
          >
            <div className="px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-bold text-[#092c60] dark:text-white truncate">
                  {config.portalTitle} — User Duties, Events, Properties &amp; Permissions
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate">
                  {config.userName} ({config.userRegNo}) · {config.userTitle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRoleCapabilitiesOpen(false)}
                aria-label="Close duties and permissions drawer"
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <AccountRoleWorkspace
                roleOverride={resolveCatalogRoleForPortalShell(config.role)}
                compact
                onSwitchPortal={(portal) => {
                  setRoleCapabilitiesOpen(false);
                  onSwitchPortal(portal);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

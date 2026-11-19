import React, { useState } from 'react';
import {
  ArrowRight,
  Bell,
  GraduationCap,
  Home,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { usePortalShellContext } from '../context/PortalShellContext';
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

export default function UserPortalShell({
  config,
  onSwitchPortal,
  onLogout,
  children,
}: UserPortalShellProps) {
  const ctx = usePortalShellContext();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const isOverview = ctx?.overviewOpenByRole[config.role] ?? true;
  const activeTab = ctx?.tabsByRole[config.role] ?? config.defaultTab;

  const openOverview = () => {
    ctx?.setOverviewOpen(config.role, true);
    setSidebarOpen(false);
    setSearchValue('');
  };

  const selectTab = (tabId: string) => {
    ctx?.setPortalTab(config.role, tabId);
    setSidebarOpen(false);
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
    <div className="min-h-[calc(100vh-56px)] bg-[#f5f8fd] text-[#102b55] font-sans flex flex-col">
      {/* WHITE TOP USER WORKSPACE BAR */}
      <header className="sticky top-[52px] z-30 h-16 px-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Toggle workspace menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-[#092c60] hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            type="button"
            onClick={openOverview}
            className="flex items-center gap-3 text-left min-w-0"
          >
            <div className="w-10 h-10 rounded-xl bg-[#eef4fd] text-[#092c60] flex items-center justify-center shrink-0">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-[#092c60] tracking-tight truncate">
                {config.portalTitle}
              </h2>
              <p className="text-[11px] text-slate-500 truncate hidden sm:block">
                {config.portalSubtitle}
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* LIVE SECTION SEARCH */}
          <div className="relative hidden md:block">
            <div className="w-56 h-9 px-3 bg-[#f5f8fc] border border-slate-200 rounded-lg flex items-center gap-2 text-slate-500 focus-within:border-[#0866d7]">
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
                className="w-full bg-transparent text-xs text-slate-900 outline-none"
              />
            </div>

            {searchMatches.length > 0 && (
              <div className="absolute top-10 right-0 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                {searchMatches.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectTab(item.id)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#eef4fd] hover:text-[#092c60] rounded-lg flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={13} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* QUICK PORTAL SWITCHER BUTTON */}
          <button
            type="button"
            onClick={() => ctx?.openSwitcher?.()}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#092c60] text-xs font-bold border border-blue-200 transition"
            title="Browse all 20 institutional portals"
          >
            <Sparkles size={14} className="text-amber-500" />
            <span>Switch Portal</span>
          </button>

          <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-[#092c60] text-amber-300 font-bold text-xs flex items-center justify-center shrink-0">
              {initials || 'HT'}
            </div>
            <div className="text-left leading-tight">
              <strong className="text-xs font-bold text-slate-900 block">{config.userName}</strong>
              <span className="text-[10px] font-mono text-slate-500">{config.userRegNo}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* DARK NAVY SIDEBAR MENU */}
        <aside
          className={`fixed lg:sticky top-[116px] left-0 z-30 w-60 h-[calc(100vh-116px)] bg-gradient-to-b from-[#092b5d] to-[#061f46] text-white p-3 pt-4 flex flex-col overflow-y-auto transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <nav className="space-y-1">
            <button
              type="button"
              onClick={openOverview}
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
              <p className="px-3 mb-1.5 text-[10px] font-extrabold tracking-widest text-blue-300 uppercase">
                {group}
              </p>
              <nav className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const active = !isOverview && activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => selectTab(item.id)}
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
            <p className="px-3 mb-1.5 text-[10px] font-extrabold tracking-widest text-blue-300 uppercase">
              Connected Portals
            </p>
            <div className="space-y-1">
              {config.relatedPortals.map((rel) => (
                <button
                  key={rel.role}
                  type="button"
                  onClick={() => onSwitchPortal(rel.role)}
                  className="w-full px-3 py-2 rounded-lg text-[11px] font-medium text-blue-100 hover:bg-white/10 flex items-center justify-between transition-colors"
                >
                  <span className="truncate">{rel.label}</span>
                  <ArrowRight size={12} className="opacity-75 shrink-0" />
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
              <span className="text-blue-200 block truncate">{config.userTitle}</span>
            </div>

            <button
              type="button"
              onClick={() => setLogoutModalOpen(true)}
              className="w-full py-2.5 px-3 border-t border-white/15 flex items-center gap-2.5 text-xs font-semibold text-blue-100 hover:text-red-200"
            >
              <LogOut size={16} /> Sign Out to Website
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-[116px] bg-slate-950/50 z-20 lg:hidden"
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
                    <span className="text-[11px] font-extrabold tracking-widest text-amber-300 font-mono">
                      {config.userRegNo} · {config.department}
                    </span>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
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
                      className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
                    >
                      <span className="text-xs font-semibold text-slate-500">{st.label}</span>
                      <strong className={`text-xl font-extrabold font-mono tabular-nums mt-1 ${st.toneClass}`}>
                        {st.value}
                      </strong>
                    </div>
                  ))}
                </section>

                {/* QUICK ACCESS MODULES GRID */}
                <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-extrabold text-[#092c60]">
                        {config.portalTitle} — Quick Access Actions
                      </h2>
                      <p className="text-xs text-slate-500">
                        Select any module below or use the sidebar menu to open it directly.
                      </p>
                    </div>
                    <Bell size={18} className="text-slate-400" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {config.navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTab(item.id)}
                          className="p-4 rounded-xl bg-slate-50 hover:bg-[#eef4fd] border border-slate-200 hover:border-[#0866d7] text-left flex items-start justify-between gap-3 transition-colors group"
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
                              <strong className="text-xs font-bold text-slate-900 block group-hover:text-[#092c60]">
                                {item.label}
                              </strong>
                              <span className="text-[11px] text-slate-500 block mt-0.5">
                                {item.description}
                              </span>
                            </div>
                          </div>
                          <ArrowRight size={15} className="text-slate-400 group-hover:text-[#0866d7] shrink-0 mt-1" />
                        </button>
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : (
              children
            )}
          </div>
        </main>
      </div>

      {/* LOGOUT MODAL */}
      {logoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#092c60]">Sign Out of {config.portalTitle}</h3>
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Return from {config.userName}&apos;s workspace ({config.userRegNo}) back to the HI-TECH College Public Website? All changes remain saved.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLogoutModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
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
    </div>
  );
}

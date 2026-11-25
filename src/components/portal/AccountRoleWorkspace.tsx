import React, { useContext, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  Bell,
  CheckCircle2,
  ClipboardCheck,
  Compass,
  FileText,
  KeyRound,
  Layers,
  Lock,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import { AuthContext } from '../../auth/AuthProvider';
import {
  resolveCatalogEntryForRole,
  type RoleDutyDefinition,
  type RoleAccessiblePortal,
} from '../../config/roleDutyCatalog';
import { STAFF_ACCOUNTS, type StaffRole } from '../../config/staff-navigation';
import {
  institutionalEventBus,
  STAFF_CHANNEL_REGISTRY,
} from '../../services/institutionalEventBus';
import type { PortalRole } from '../../types';

export type WorkspaceSubTab =
  | 'duties'
  | 'events'
  | 'properties'
  | 'permissions'
  | 'portals';

interface LiveCapabilityEvent {
  id: string;
  source: string;
  eventType: string;
  title: string;
  detail: string;
  severity: 'INFO' | 'ACTION_REQUIRED' | 'CRITICAL' | 'SUCCESS';
  timestampIso: string;
}

interface ServerCapabilitiesData {
  role: string;
  title: string;
  dataScopeSummary: string;
  restrictedFrom: string[];
  accountProperties: {
    uid: string;
    fullName: string;
    email: string;
    registrationNumber: string;
    primaryRole: string;
    roleTitle: string;
    accountStatus: string;
    department: string;
    campus: string;
    allowedCampuses: string[];
    emailVerified: boolean;
    emailVerifiedAt: string | null;
    mustChangePassword: boolean;
    passwordChangedAt: string | null;
    mfaEnabled: boolean;
    requiresProfileCompletion: boolean;
    activeSessionsCount: number;
    portalDestination: string;
    studentMetrics?: {
      programmeName: string | null;
      intakeName: string | null;
      studyMode: string | null;
      feeBalanceKes: number;
      attendanceRatePct: number;
      meanGradeLabel: string | null;
      academicStatus: string;
    };
  };
  liveEvents: LiveCapabilityEvent[];
  permissions: {
    staffPermissions: string[];
    uiNavPermissions: string[];
    documentPermissions: string[];
    registrationPermissions: string[];
    portalCapabilities: string[];
  };
}

export interface AccountRoleWorkspaceProps {
  roleOverride?: string;
  compact?: boolean;
  initialTab?: WorkspaceSubTab;
  onNavigatePath?: (path: string) => void;
  onNavigateStudentSection?: (section: string) => void;
  onSwitchPortal?: (portal: PortalRole) => void;
}

const SEVERITY_TEXT: Record<string, string> = {
  CRITICAL: 'text-red-700 dark:text-red-400',
  ACTION_REQUIRED: 'text-amber-700 dark:text-amber-400',
  SUCCESS: 'text-emerald-700 dark:text-emerald-400',
  INFO: 'text-[#1769AA] dark:text-blue-400',
};

export default function AccountRoleWorkspace({
  roleOverride,
  compact = false,
  initialTab = 'duties',
  onNavigatePath,
  onNavigateStudentSection,
  onSwitchPortal,
}: AccountRoleWorkspaceProps) {
  const authCtx = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState<WorkspaceSubTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [serverData, setServerData] = useState<ServerCapabilitiesData | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [busVersion, setBusVersion] = useState(0);

  const effectiveRole = (
    roleOverride ??
    authCtx?.user?.primaryRole ??
    'STUDENT'
  ).toUpperCase();

  const catalog = useMemo(
    () => resolveCatalogEntryForRole(effectiveRole),
    [effectiveRole]
  );

  const loadCapabilities = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/portal/my-capabilities', {
        credentials: 'include',
      });
      if (res.ok) {
        const json = await res.json();
        if (json?.success && json.data) {
          setServerData(json.data as ServerCapabilitiesData);
        }
      }
    } catch {
      // Offline/preview mode falls back smoothly to catalog + local auth state
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void loadCapabilities();
  }, [effectiveRole]);

  useEffect(() => {
    return institutionalEventBus.subscribe(() => setBusVersion((n) => n + 1));
  }, []);

  void busVersion;

  // Use live server payload only when it matches the inspected role
  const matchedServer =
    serverData && serverData.role.toUpperCase() === effectiveRole ? serverData : null;

  const staffAccount =
    catalog.category === 'STAFF'
      ? STAFF_ACCOUNTS[catalog.role as StaffRole]
      : undefined;

  const resolvedProperties = useMemo(() => {
    if (matchedServer) return matchedServer.accountProperties;
    const authUser =
      authCtx?.user && authCtx.user.primaryRole?.toUpperCase() === effectiveRole
        ? authCtx.user
        : null;

    return {
      uid: authUser?.uid ?? staffAccount?.id ?? `usr-${catalog.role.toLowerCase()}`,
      fullName: authUser?.fullName ?? staffAccount?.fullName ?? catalog.title,
      email:
        authUser?.email ??
        staffAccount?.email ??
        `${catalog.role.toLowerCase().replaceAll('_', '.')}@hitech.ac.ke`,
      registrationNumber:
        authUser?.registrationNumber ??
        staffAccount?.employeeNumber ??
        `${catalog.regNoPrefix}/2026/001`,
      primaryRole: catalog.role,
      roleTitle: staffAccount?.roleTitle ?? catalog.title,
      accountStatus: authUser?.accountStatus ?? 'ACTIVE',
      department: staffAccount?.department ?? catalog.department,
      campus: staffAccount?.campus ?? catalog.defaultCampus,
      allowedCampuses: staffAccount?.allowedCampuses ?? catalog.allowedCampuses,
      emailVerified: authUser?.emailVerified ?? true,
      emailVerifiedAt: authUser?.emailVerifiedAt ?? null,
      mustChangePassword: authUser?.mustChangePassword ?? false,
      passwordChangedAt: authUser?.passwordChangedAt ?? null,
      mfaEnabled: authUser?.mfaEnabled ?? false,
      requiresProfileCompletion: authUser?.requiresProfileCompletion ?? false,
      activeSessionsCount: authUser ? 1 : 0,
      portalDestination: catalog.portalDestination,
      studentMetrics: undefined,
    };
  }, [matchedServer, authCtx?.user, effectiveRole, staffAccount, catalog]);

  const resolvedPermissions = matchedServer?.permissions ?? catalog.permissions;
  const resolvedRestrictions =
    matchedServer?.restrictedFrom && matchedServer.restrictedFrom.length > 0
      ? matchedServer.restrictedFrom
      : catalog.restrictedFrom;

  const busEvents = useMemo(() => {
    const channelEntry = Object.values(STAFF_CHANNEL_REGISTRY).find(
      (c) => c.role === catalog.primaryPortalRole
    );
    const allBus = institutionalEventBus.getAllEvents();
    if (catalog.role === 'ADMIN' || catalog.role === 'PRINCIPAL') {
      return allBus.slice(0, 8);
    }
    if (channelEntry) {
      return institutionalEventBus.getEventsForChannel(channelEntry.channel);
    }
    return allBus.filter((e) => e.channel === 'academic' || e.channel === 'finance').slice(0, 5);
  }, [catalog.primaryPortalRole, catalog.role]);

  const query = searchQuery.trim().toLowerCase();

  const filteredDuties = catalog.duties.filter(
    (d) =>
      !query ||
      d.title.toLowerCase().includes(query) ||
      d.description.toLowerCase().includes(query) ||
      d.workflowType.toLowerCase().includes(query)
  );

  const filteredRoleEvents = catalog.events.filter(
    (ev) =>
      !query ||
      ev.title.toLowerCase().includes(query) ||
      ev.eventType.toLowerCase().includes(query) ||
      ev.channel.toLowerCase().includes(query) ||
      ev.trigger.toLowerCase().includes(query)
  );

  const filteredLiveEvents = (matchedServer?.liveEvents ?? []).filter(
    (ev) =>
      !query ||
      ev.title.toLowerCase().includes(query) ||
      ev.detail.toLowerCase().includes(query) ||
      ev.eventType.toLowerCase().includes(query)
  );

  const filteredPortals = catalog.accessiblePortals.filter(
    (p) =>
      !query ||
      p.label.toLowerCase().includes(query) ||
      p.path.toLowerCase().includes(query)
  );

  const handleLaunchDuty = (duty: RoleDutyDefinition) => {
    if (duty.studentSection && onNavigateStudentSection) {
      onNavigateStudentSection(duty.studentSection);
      return;
    }
    if (duty.targetPath.startsWith('/staff/') && onNavigatePath) {
      onNavigatePath(duty.targetPath);
      return;
    }
    if (onSwitchPortal) {
      onSwitchPortal(duty.portalRole);
    }
  };

  const handleLaunchPortal = (portal: RoleAccessiblePortal) => {
    if (portal.studentSection && onNavigateStudentSection) {
      onNavigateStudentSection(portal.studentSection);
      return;
    }
    if (portal.path.startsWith('/staff/') && onNavigatePath) {
      onNavigatePath(portal.path);
      return;
    }
    if (onSwitchPortal) {
      onSwitchPortal(portal.portalRole);
    }
  };

  const totalPermissionCount =
    resolvedPermissions.staffPermissions.length +
    resolvedPermissions.uiNavPermissions.length +
    resolvedPermissions.documentPermissions.length +
    resolvedPermissions.registrationPermissions.length;

  const tabs: { id: WorkspaceSubTab; label: string; count: number; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'duties', label: 'Duties & Workflows', count: catalog.duties.length, icon: ClipboardCheck },
    { id: 'events', label: 'Events & Activity', count: catalog.events.length + (matchedServer?.liveEvents.length ?? busEvents.length), icon: Bell },
    { id: 'properties', label: 'Properties & Scope', count: catalog.properties.length, icon: UserCheck },
    { id: 'permissions', label: 'Permissions', count: totalPermissionCount, icon: KeyRound },
    { id: 'portals', label: 'Portals & Modules', count: catalog.accessiblePortals.length, icon: Compass },
  ];

  return (
    <div className="space-y-5">
      {/* HEADER BAR */}
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1 min-w-0">
            <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
              {resolvedProperties.registrationNumber} · {catalog.category} · {resolvedProperties.primaryRole}
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#102D50] dark:text-white tracking-tight">
              {resolvedProperties.roleTitle} — Duties, Events, Properties &amp; Permissions
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
              {catalog.dataScopeSummary}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void loadCapabilities()}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 transition-colors"
            >
              <RefreshCw size={14} />
              <span>{syncing ? 'Syncing…' : 'Sync Live Scope'}</span>
            </button>
          </div>
        </div>

        {/* METRIC SUMMARY ROW (TABULAR NUMERALS, HAIRLINE DIVIDERS) */}
        <div className={`grid gap-3 border-t border-slate-200 dark:border-slate-800 pt-4 ${compact ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 lg:grid-cols-5'}`}>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Assigned Duties
            </span>
            <strong className="text-lg font-bold font-mono tabular-nums text-[#102D50] dark:text-white">
              {catalog.duties.length}
            </strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Scoped Events
            </span>
            <strong className="text-lg font-bold font-mono tabular-nums text-[#102D50] dark:text-white">
              {catalog.events.length + (matchedServer?.liveEvents.length ?? busEvents.length)}
            </strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Active Permissions
            </span>
            <strong className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {totalPermissionCount}
            </strong>
          </div>
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Access Exclusions
            </span>
            <strong className="text-lg font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
              {resolvedRestrictions.length}
            </strong>
          </div>
          {!compact && (
            <div className="space-y-0.5">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
                Accessible Portals
              </span>
              <strong className="text-lg font-bold font-mono tabular-nums text-[#1769AA] dark:text-blue-400">
                {catalog.accessiblePortals.length}
              </strong>
            </div>
          )}
        </div>

        {/* NAVIGATION TABS & FILTER BAR */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 pt-4">
          <div className="flex flex-wrap items-center gap-1.5" role="tablist" aria-label="Role capability views">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'bg-[#102D50] text-white dark:bg-[#1769AA]'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                  <span className="font-mono tabular-nums opacity-80">({tab.count})</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full lg:w-64">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter duties, events, permissions..."
              aria-label="Filter role capabilities"
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 py-2 pl-8 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:border-[#1769AA] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear filter"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* TAB 1: DUTIES & WORKFLOWS */}
      {activeTab === 'duties' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Operational Duties &amp; Direct Workspace Launchers
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Every workflow {resolvedProperties.roleTitle} performs, linked straight to the active portal workspace.
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {filteredDuties.length} shown
            </span>
          </div>

          {filteredDuties.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300">
                No duties match &ldquo;{searchQuery}&rdquo;.
              </p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
              >
                Reset search filter
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredDuties.map((duty) => (
                <div
                  key={duty.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                        {duty.workflowType}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{duty.targetPath}</span>
                    </div>
                    <strong className="text-sm font-semibold text-slate-900 dark:text-white block">
                      {duty.title}
                    </strong>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {duty.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLaunchDuty(duty)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-[#102D50] hover:text-white hover:border-[#102D50] dark:hover:bg-[#1769AA] text-xs font-semibold text-[#102D50] dark:text-slate-100 whitespace-nowrap shrink-0 transition-colors"
                  >
                    <span>Open Module</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* TAB 2: EVENTS & ACTIVITY */}
      {activeTab === 'events' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-[#1769AA] dark:text-blue-400" />
                <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                  Subscribed Role Events &amp; Triggers
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {filteredRoleEvents.length} defined
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {filteredRoleEvents.map((ev) => (
                <div key={ev.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                      {ev.eventType}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400">
                      {ev.responsibility} · channel:{ev.channel}
                    </span>
                  </div>
                  <strong className="text-xs font-semibold text-slate-900 dark:text-white block">
                    {ev.title}
                  </strong>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{ev.trigger}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#1769AA] dark:text-blue-400" />
                <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                  Live User &amp; Channel Event Feed
                </h3>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
                {filteredLiveEvents.length + busEvents.length} events
              </span>
            </div>

            {filteredLiveEvents.length === 0 && busEvents.length === 0 ? (
              <p className="py-6 text-xs text-slate-600 dark:text-slate-300 text-center">
                No recent account or channel events recorded for this filter.
              </p>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-800 max-h-96 overflow-y-auto pr-1">
                {filteredLiveEvents.map((ev) => (
                  <div key={ev.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className={`font-semibold ${SEVERITY_TEXT[ev.severity] ?? SEVERITY_TEXT.INFO}`}>
                        {ev.source} · {ev.eventType}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                        {new Date(ev.timestampIso).toLocaleString()}
                      </span>
                    </div>
                    <strong className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {ev.title}
                    </strong>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{ev.detail}</p>
                  </div>
                ))}

                {busEvents.map((ev) => (
                  <div key={ev.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono">
                      <span className={`font-semibold ${SEVERITY_TEXT[ev.severity] ?? SEVERITY_TEXT.INFO}`}>
                        BUS · {ev.channel.toUpperCase()} · {ev.status}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
                        {new Date(ev.timestampIso).toLocaleTimeString()}
                      </span>
                    </div>
                    <strong className="text-xs font-semibold text-slate-900 dark:text-white block">
                      {ev.title}
                    </strong>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{ev.summary}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* TAB 3: PROPERTIES & SCOPE */}
      {activeTab === 'properties' && (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white pb-2 border-b border-slate-200 dark:border-slate-800">
              Account Identity, Security &amp; Campus Properties
            </h3>
            <dl className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Full Name</dt>
                <dd className="font-semibold text-slate-900 dark:text-white text-right">
                  {resolvedProperties.fullName}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Institutional UID</dt>
                <dd className="font-mono text-slate-800 dark:text-slate-200 text-right">
                  {resolvedProperties.uid}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Registration / Staff ID</dt>
                <dd className="font-mono font-semibold text-[#1769AA] dark:text-blue-400 text-right">
                  {resolvedProperties.registrationNumber}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Email Address</dt>
                <dd className="text-slate-800 dark:text-slate-200 text-right">
                  {resolvedProperties.email}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Account Status</dt>
                <dd className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 text-right">
                  {resolvedProperties.accountStatus}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Email Verification</dt>
                <dd
                  className={`font-semibold text-right ${
                    resolvedProperties.emailVerified
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {resolvedProperties.emailVerified ? 'Verified' : 'Pending 6-digit OTP verification'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Password Policy Flag</dt>
                <dd
                  className={`font-semibold text-right ${
                    resolvedProperties.mustChangePassword
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {resolvedProperties.mustChangePassword
                    ? 'First-login replacement pending'
                    : 'Compliant'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">MFA Protection</dt>
                <dd className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                  {resolvedProperties.mfaEnabled ? 'Enabled (TOTP / OTP)' : 'Standard session'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Department</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 text-right">
                  {resolvedProperties.department}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Primary &amp; Allowed Campuses</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-200 text-right">
                  {resolvedProperties.allowedCampuses.join(' · ')}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Active Sessions</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200 text-right">
                  {resolvedProperties.activeSessionsCount}
                </dd>
              </div>
              {resolvedProperties.studentMetrics && (
                <>
                  <div className="py-2.5 flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">Programme &amp; Intake</dt>
                    <dd className="font-medium text-slate-800 dark:text-slate-200 text-right">
                      {resolvedProperties.studentMetrics.programmeName ?? 'Registered Programme'} ·{' '}
                      {resolvedProperties.studentMetrics.intakeName ?? 'Current Intake'}
                    </dd>
                  </div>
                  <div className="py-2.5 flex justify-between gap-3">
                    <dt className="text-slate-500 dark:text-slate-400">Attendance &amp; Fee Balance</dt>
                    <dd className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white text-right">
                      {resolvedProperties.studentMetrics.attendanceRatePct}% · KES{' '}
                      {resolvedProperties.studentMetrics.feeBalanceKes.toLocaleString()}
                    </dd>
                  </div>
                </>
              )}
            </dl>
          </section>

          <div className="space-y-5">
            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <ShieldAlert size={16} className="text-amber-700 dark:text-amber-400" />
                <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                  Explicit Access Boundaries (Restricted From)
                </h3>
              </div>
              <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                {resolvedRestrictions.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Lock size={13} className="text-amber-700 dark:text-amber-400 mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                <Layers size={16} className="text-[#1769AA] dark:text-blue-400" />
                <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                  Tracked Schema Attributes
                </h3>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {catalog.properties.map((prop) => (
                  <div key={prop.key} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="font-semibold text-slate-900 dark:text-white">
                        {prop.label}
                      </strong>
                      <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {prop.category} · {prop.key}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{prop.description}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 4: PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <PermissionGroupCard
            title="Operational & Module Permissions"
            subtitle="Server RBAC & navigation capability keys enforced on API routes"
            icon={ShieldCheck}
            items={[
              ...new Set([
                ...resolvedPermissions.staffPermissions,
                ...resolvedPermissions.uiNavPermissions,
              ]),
            ].filter((p) => !query || p.toLowerCase().includes(query))}
          />
          <PermissionGroupCard
            title="Document Management (DMS) Permissions"
            subtitle="Access, upload, approval, signature & archival controls"
            icon={FileText}
            items={resolvedPermissions.documentPermissions.filter(
              (p) => !query || p.toLowerCase().includes(query)
            )}
          />
          <PermissionGroupCard
            title="User Registration & Identity Governance"
            subtitle="Account onboarding, role assignment & invitation permissions"
            icon={UserCheck}
            items={resolvedPermissions.registrationPermissions.filter(
              (p) => !query || p.toLowerCase().includes(query)
            )}
          />
          <PermissionGroupCard
            title="Portal Capabilities & Functional Scopes"
            subtitle="Active workspace modules and workflows enabled for this user"
            icon={CheckCircle2}
            items={resolvedPermissions.portalCapabilities.filter(
              (p) => !query || p.toLowerCase().includes(query)
            )}
          />
        </div>
      )}

      {/* TAB 5: ACCESSIBLE PORTALS & MODULES */}
      {activeTab === 'portals' && (
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Authorized Portals &amp; Sidebar Modules
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Primary destination: <span className="font-mono font-semibold">{catalog.portalDestination}</span>
              </p>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
              {filteredPortals.length} modules
            </span>
          </div>

          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPortals.map((portal) => (
              <button
                key={portal.id}
                type="button"
                onClick={() => handleLaunchPortal(portal)}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-left hover:border-[#1769AA] hover:bg-blue-50/50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="min-w-0">
                  <strong className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                    {portal.label}
                  </strong>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block truncate">
                    {portal.path}
                  </span>
                </div>
                <ArrowRight size={14} className="text-[#1769AA] dark:text-blue-400 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function PermissionGroupCard({
  title,
  subtitle,
  icon: Icon,
  items,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: string[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 min-w-0">
          <Icon size={16} className="text-[#1769AA] dark:text-blue-400 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white truncate">{title}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
        <span className="font-mono tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="py-4 text-xs text-slate-500 dark:text-slate-400">
          No permissions granted in this domain for the current role.
        </p>
      ) : (
        <div className="grid gap-1.5 sm:grid-cols-2 max-h-72 overflow-y-auto pr-1">
          {items.map((perm) => (
            <div
              key={perm}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1.5 font-mono text-[11px] text-slate-800 dark:text-slate-200 truncate"
              title={perm}
            >
              {perm}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

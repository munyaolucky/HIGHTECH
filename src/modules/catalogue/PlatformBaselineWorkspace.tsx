import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Database,
  ExternalLink,
  Filter,
  FolderGit2,
  GraduationCap,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import {
  DATABASE_DOMAINS_44,
  DEFINITION_OF_DONE_10,
  PRIORITY_LABELS,
  SYSTEM_GROUPS,
  TESTING_PLAN_10,
  TVETA_ODPC_COMPLIANCE_ITEMS,
  type DeliveryPriority,
  type FeatureStatus,
  type PlatformFeatureSeed,
} from '../../data/platformMasterBlueprint';

interface BaselineChecklistItem {
  id: string;
  sprintCode: string;
  orderIndex: number;
  title: string;
  category: string;
  completed: boolean;
  evidenceSummary: string;
  verifiedBy: string | null;
}

interface BaselinePayload {
  auditTimestamp: string;
  runtime: {
    stack: string;
    port: number;
    nodeVersion: string;
    postgresConnected: boolean;
  };
  counts: {
    totalModules: number;
    totalSystems: number;
    totalDatabaseDomains: number;
    livePostgresTables: number;
    backendRouteModules: number;
    frontendModuleFolders: number;
    clientServicesRemaining: number;
    sprintCompleted: number;
    sprintTotal: number;
  };
  statusCounts: Record<string, number>;
  prioritySummary: Record<
    number,
    { total: number; verifiedOrTesting: number; inProgress: number; prototype: number; planned: number }
  >;
  domainStatusCounts: { verified: number; partial: number; planned: number };
  inventory: {
    pgTables: Array<{ tableName: string; columnCount: number }>;
    backendModules: string[];
    frontendModules: string[];
    clientServices: string[];
  };
  checklist: BaselineChecklistItem[];
}

interface AcademicStructureData {
  campuses: Array<{ id: string; code: string; name: string; address: string; phone: string; isMain: boolean }>;
  departments: Array<{ id: string; code: string; name: string; facultyName: string; campusId: string; hodName: string | null }>;
  programmes: Array<{
    id: string;
    code: string;
    title: string;
    level: string;
    examBody: string;
    departmentId: string;
    durationSemesters: number;
    tuitionPerSemesterKes: number;
    tvetaApproved: boolean;
  }>;
  periods: Array<{
    id: string;
    academicYear: string;
    semesterName: string;
    intakeCode: string;
    startDate: string;
    endDate: string;
    registrationOpen: boolean;
    isCurrent: boolean;
    status: string;
  }>;
}

const ALL_STATUSES: FeatureStatus[] = [
  'Verified',
  'Testing',
  'In progress',
  'Prototype',
  'Existing',
  'Planned',
  'Blocked',
  'Released',
];

function statusBadgeClass(status: string): string {
  switch (status) {
    case 'Verified':
    case 'Released':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'Testing':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'In progress':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    case 'Prototype':
    case 'Existing':
      return 'bg-slate-100 text-slate-700 border-slate-200';
    case 'Blocked':
      return 'bg-red-50 text-red-800 border-red-200';
    default:
      return 'bg-purple-50 text-purple-800 border-purple-200';
  }
}

export type BaselineViewSection = 'register' | 'sprint1' | 'domains';

export default function PlatformBaselineWorkspace({
  initialSection = 'register',
  onOpenPortalPath,
}: {
  initialSection?: BaselineViewSection;
  onOpenPortalPath?: (path: string) => void;
}) {
  const [section, setSection] = useState<BaselineViewSection>(initialSection);
  const [baseline, setBaseline] = useState<BaselinePayload | null>(null);
  const [features, setFeatures] = useState<PlatformFeatureSeed[]>([]);
  const [structure, setStructure] = useState<AcademicStructureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Filters for 84-module Central Feature Register
  const [search, setSearch] = useState('');
  const [systemFilter, setSystemFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | '1' | '2' | '3' | '4'>('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState<FeatureStatus>('Verified');
  const [editOwner, setEditOwner] = useState('');
  const [editTestStatus, setEditTestStatus] = useState('');

  // Quick Create Programme form (Priority 1 Academic Structure)
  const [progCode, setProgCode] = useState('');
  const [progTitle, setProgTitle] = useState('');
  const [progLevel, setProgLevel] = useState('DIPLOMA');
  const [progBody, setProgBody] = useState('CDACC');
  const [progDeptId, setProgDeptId] = useState('dept-computing');
  const [progFee, setProgFee] = useState('28500');

  useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const loadAll = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, fRes, sRes] = await Promise.all([
        fetch('/api/platform/baseline', { credentials: 'include' }),
        fetch('/api/platform/features', { credentials: 'include' }),
        fetch('/api/platform/academic-structure', { credentials: 'include' }),
      ]);
      const [bJson, fJson, sJson] = await Promise.all([bRes.json(), fRes.json(), sRes.json()]);
      if (bJson?.success) setBaseline(bJson.data);
      if (fJson?.success) setFeatures(fJson.data.features);
      if (sJson?.success) setStructure(sJson.data);
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to load platform baseline.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredFeatures = useMemo(() => {
    const q = search.trim().toLowerCase();
    return features.filter((f) => {
      if (systemFilter !== 'ALL' && f.systemCode !== systemFilter) return false;
      if (priorityFilter !== 'ALL' && f.priority !== Number(priorityFilter)) return false;
      if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
      if (q) {
        const hay = `${f.featureId} ${f.moduleName} ${f.description} ${f.systemName} ${f.assignedOwner} ${f.acceptanceCriteria}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [features, search, systemFilter, priorityFilter, statusFilter]);

  const handleSaveFeature = async (featureId: string) => {
    setNotice(null);
    const res = await fetch(`/api/platform/features/${encodeURIComponent(featureId)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: editStatus,
        assignedOwner: editOwner,
        testStatus: editTestStatus,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice({
        type: 'err',
        text: json.error || 'Sign in as Admin, Principal, Registrar, QA, or IT Support to save register updates.',
      });
      return;
    }
    setEditingFeatureId(null);
    setNotice({ type: 'ok', text: `Updated ${featureId} in Cloud SQL Feature Register.` });
    await loadAll();
  };

  const handleToggleSprintTask = async (task: BaselineChecklistItem) => {
    setNotice(null);
    const res = await fetch(`/api/platform/checklist/${encodeURIComponent(task.id)}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: !task.completed }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice({
        type: 'err',
        text: json.error || 'Sign in with a governance staff role to update Sprint 1 checklist status.',
      });
      return;
    }
    setNotice({
      type: 'ok',
      text: `Sprint task #${task.orderIndex} marked ${json.data.completed ? 'completed' : 'pending'}.`,
    });
    await loadAll();
  };

  const handleCopyChecklist = async () => {
    if (!baseline) return;
    const text = [
      `HI-TECH College Sprint 1 — Platform Baseline (${baseline.counts.sprintCompleted}/${baseline.counts.sprintTotal})`,
      ...baseline.checklist.map(
        (c) => `[${c.completed ? 'x' : ' '}] ${c.orderIndex}. ${c.title} — ${c.evidenceSummary}`
      ),
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setNotice({ type: 'ok', text: 'Copied Sprint 1 checklist and audit findings to clipboard.' });
    } catch {
      setNotice({ type: 'err', text: 'Clipboard permission unavailable in this browser context.' });
    }
  };

  const handleAddProgramme = async () => {
    setNotice(null);
    const res = await fetch('/api/platform/academic-structure/programmes', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: progCode,
        title: progTitle,
        level: progLevel,
        examBody: progBody,
        departmentId: progDeptId,
        tuitionPerSemesterKes: Number(progFee) || 28500,
        tvetaApproved: true,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice({
        type: 'err',
        text: json.error || 'Sign in as Administrator, Registrar, or Principal to register a programme.',
      });
      return;
    }
    setProgCode('');
    setProgTitle('');
    setNotice({
      type: 'ok',
      text: `Saved programme ${json.data.code} — ${json.data.title} to Cloud SQL.`,
    });
    await loadAll();
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Sub-Navigation Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSection('register')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              section === 'register'
                ? 'bg-[#102D50] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Central Feature Register (84 Modules)</span>
          </button>

          <button
            type="button"
            onClick={() => setSection('sprint1')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              section === 'sprint1'
                ? 'bg-[#102D50] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <ClipboardCheck className="w-4 h-4" />
            <span>
              Sprint 1 Baseline ({baseline ? `${baseline.counts.sprintCompleted}/${baseline.counts.sprintTotal}` : '10/10'})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSection('domains')}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              section === 'domains'
                ? 'bg-[#102D50] text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>44 DB Domains, Structure &amp; Governance</span>
          </button>
        </div>

        <button
          type="button"
          onClick={loadAll}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Audit</span>
        </button>
      </div>

      {notice && (
        <div
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-xs font-semibold ${
            notice.type === 'ok'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-red-200 bg-red-50 text-red-900'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Priority 1-4 Progress Summary Strip */}
      {baseline && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {([1, 2, 3, 4] as DeliveryPriority[]).map((p) => {
            const stats = baseline.prioritySummary[p];
            const meta = PRIORITY_LABELS[p];
            const readyCount = stats ? stats.verifiedOrTesting + stats.inProgress : 0;
            const total = stats?.total || 1;
            const pct = Math.round((readyCount / total) * 100);
            return (
              <div
                key={p}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wide text-[#1769AA]">
                    {meta.label}
                  </span>
                  <span className="text-xs font-black text-[#102D50] dark:text-white">
                    {readyCount}/{total}
                  </span>
                </div>
                <div
                  className="grid grid-cols-10 gap-1 w-full"
                  role="progressbar"
                  aria-label={`${meta.label} completion ${pct}%`}
                  aria-valuenow={pct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  {Array.from({ length: 10 }, (_, idx) => {
                    const filledCount = Math.max(readyCount > 0 ? 1 : 0, Math.round(pct / 10));
                    const activeColor =
                      p === 1
                        ? 'bg-emerald-600'
                        : p === 2
                        ? 'bg-[#1769AA]'
                        : p === 3
                        ? 'bg-amber-600'
                        : 'bg-slate-500';
                    return (
                      <div
                        key={idx}
                        className={`h-2 rounded-full ${
                          idx < filledCount ? activeColor : 'bg-slate-200 dark:bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                  {stats?.verifiedOrTesting ?? 0} Verified/Testing · {stats?.inProgress ?? 0} In Progress ·{' '}
                  {stats?.prototype ?? 0} Prototype · {stats?.planned ?? 0} Planned
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 1: 84-MODULE CENTRAL FEATURE REGISTER */}
      {section === 'register' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 shadow-xs">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search 84 modules by ID, name, description, or owner..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                />
              </div>

              <select
                value={systemFilter}
                onChange={(e) => setSystemFilter(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
              >
                <option value="ALL">All 12 Systems (A–L)</option>
                {SYSTEM_GROUPS.map((g) => (
                  <option key={g.code} value={g.code}>
                    {g.code}. {g.name}
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2">
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value as 'ALL' | '1' | '2' | '3' | '4')}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="1">P1 Critical</option>
                  <option value="2">P2 High</option>
                  <option value="3">P3 Ops</option>
                  <option value="4">P4 Expansion</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                >
                  <option value="ALL">All Statuses</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>
                Showing <strong className="text-[#102D50] dark:text-white">{filteredFeatures.length}</strong> of{' '}
                {features.length} registered modules · Grounded against Cloud SQL &amp; Express API audit
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium">
                <Lock className="w-3 h-3 text-[#B83232]" />
                Super Admin restricted from confidential student/counselling/medical records
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#102D50] text-white">
                  <tr>
                    <th className="py-3 px-4 font-bold">ID / #</th>
                    <th className="py-3 px-4 font-bold">System &amp; Module</th>
                    <th className="py-3 px-4 font-bold">Priority</th>
                    <th className="py-3 px-4 font-bold">Status</th>
                    <th className="py-3 px-4 font-bold">Backend / DB / Frontend / Tests</th>
                    <th className="py-3 px-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredFeatures.map((feat) => {
                    const isEditing = editingFeatureId === feat.featureId;
                    return (
                      <tr key={feat.featureId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 align-top">
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-mono font-bold text-[#1769AA]">{feat.featureId}</div>
                          <div className="text-[11px] text-slate-500">Mod #{feat.moduleNumber} · Sys {feat.systemCode}</div>
                        </td>

                        <td className="py-3 px-4 max-w-md">
                          <div className="font-bold text-slate-900 dark:text-white">{feat.moduleName}</div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">{feat.description}</p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            <span className="font-semibold">Acceptance:</span> {feat.acceptanceCriteria}
                          </p>
                          {feat.dependencies.length > 0 && (
                            <div className="mt-1 flex flex-wrap gap-1">
                              {feat.dependencies.map((d) => (
                                <span
                                  key={d}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300"
                                >
                                  dep:{d}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block rounded-lg px-2 py-0.5 text-[11px] font-bold border ${
                              feat.priority === 1
                                ? 'bg-red-50 text-[#B83232] border-red-200'
                                : feat.priority === 2
                                ? 'bg-blue-50 text-[#1769AA] border-blue-200'
                                : feat.priority === 3
                                ? 'bg-[#F5EBDD] text-[#102D50] border-amber-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            P{feat.priority}
                          </span>
                          <div className="text-[10px] text-slate-500 mt-1">{feat.releaseVersion}</div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value as FeatureStatus)}
                              className="rounded-lg border border-[#1769AA] bg-white dark:bg-slate-800 px-2 py-1 text-xs font-semibold"
                            >
                              {ALL_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className={`inline-block rounded-lg border px-2.5 py-0.5 text-[11px] font-bold ${statusBadgeClass(feat.status)}`}>
                              {feat.status}
                            </span>
                          )}
                          <div className="mt-1 text-[10px] text-slate-500">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editOwner}
                                onChange={(e) => setEditOwner(e.target.value)}
                                className="w-32 rounded border border-slate-300 px-1.5 py-0.5 text-[11px]"
                                placeholder="Owner"
                              />
                            ) : (
                              feat.assignedOwner
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-[11px] space-y-0.5 max-w-xs">
                          <div>
                            <span className="font-semibold text-slate-500">API:</span>{' '}
                            <span className="text-slate-800 dark:text-slate-200">{feat.backendStatus}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">DB:</span>{' '}
                            <span className="text-slate-800 dark:text-slate-200">{feat.databaseStatus}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">UI:</span>{' '}
                            <span className="text-slate-800 dark:text-slate-200">{feat.frontendStatus}</span>
                          </div>
                          <div>
                            <span className="font-semibold text-slate-500">QA:</span>{' '}
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTestStatus}
                                onChange={(e) => setEditTestStatus(e.target.value)}
                                className="w-40 rounded border border-slate-300 px-1.5 py-0.5 text-[11px]"
                              />
                            ) : (
                              <span className="text-slate-800 dark:text-slate-200">{feat.testStatus}</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right whitespace-nowrap space-y-1.5">
                          {isEditing ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveFeature(feat.featureId)}
                                className="rounded-lg bg-emerald-700 hover:bg-emerald-800 px-2.5 py-1 text-[11px] font-bold text-white"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingFeatureId(null)}
                                className="rounded-lg border border-slate-300 px-2 py-1 text-[11px] font-semibold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFeatureId(feat.featureId);
                                  setEditStatus(feat.status);
                                  setEditOwner(feat.assignedOwner);
                                  setEditTestStatus(feat.testStatus);
                                }}
                                className="rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                              >
                                Update Status
                              </button>
                              {feat.portalPath && onOpenPortalPath && (
                                <button
                                  type="button"
                                  onClick={() => onOpenPortalPath(feat.portalPath!)}
                                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1769AA] hover:underline"
                                >
                                  <span>Open Module</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: SPRINT 1 PLATFORM BASELINE (10-ITEM CHECKLIST + REPO INVENTORY) */}
      {section === 'sprint1' && baseline && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-[#1769AA]" />
                  Sprint 1 — Platform Baseline ({baseline.counts.sprintCompleted}/{baseline.counts.sprintTotal})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Live repository audit persisted in Cloud SQL (`sprint_baseline_tasks`). Last audited{' '}
                  {baseline.auditTimestamp.slice(0, 19).replace('T', ' ')} UTC.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyChecklist}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1769AA] hover:bg-[#102D50] px-4 py-2 text-xs font-bold text-white transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Sprint Checklist</span>
              </button>
            </div>

            <div className="grid gap-3">
              {baseline.checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-4 transition ${
                    item.completed
                      ? 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#102D50] text-[11px] font-black text-white">
                        {item.orderIndex}
                      </span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</span>
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-8">{item.evidenceSummary}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleSprintTask(item)}
                    className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border transition ${
                      item.completed
                        ? 'bg-emerald-700 text-white border-emerald-700 hover:bg-emerald-800'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{item.completed ? 'Verified' : 'Mark Complete'}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Live Repository Architecture Inventory */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#1769AA]" />
                Cloud SQL PostgreSQL Tables ({baseline.counts.livePostgresTables})
              </h3>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {baseline.inventory.pgTables.map((t) => (
                  <div key={t.tableName} className="py-1.5 flex items-center justify-between">
                    <span className="font-mono text-slate-800 dark:text-slate-200">{t.tableName}</span>
                    <span className="text-[11px] font-semibold text-slate-500">{t.columnCount} cols</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <Server className="w-4 h-4 text-emerald-600" />
                Backend API Modules ({baseline.counts.backendRouteModules})
              </h3>
              <div className="flex flex-wrap gap-2">
                {baseline.inventory.backendModules.map((mod) => (
                  <span
                    key={mod}
                    className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-900"
                  >
                    /api/{mod === 'registration' ? 'registrations' : mod}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 pt-2">
                Runtime: {baseline.runtime.stack} on port {baseline.runtime.port} ({baseline.runtime.nodeVersion}).
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-amber-600" />
                Client Services Backlog ({baseline.counts.clientServicesRemaining})
              </h3>
              <p className="text-[11px] text-slate-500">
                Existing frontend `src/services/*` stores scheduled for Priority 1–4 Cloud SQL migration:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {baseline.inventory.clientServices.map((svc) => (
                  <span
                    key={svc}
                    className="rounded-lg border border-amber-200 bg-[#F5EBDD] px-2 py-0.5 font-mono text-[11px] font-semibold text-[#102D50]"
                  >
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 10-Point Definition of Done + 10-Category Testing Matrix */}
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1769AA]" />
                10-Point Module Definition of Done
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {DEFINITION_OF_DONE_10.map((line) => (
                  <li key={line} className="flex items-start gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
              <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#B83232]" />
                10-Category QA &amp; Testing Standard
              </h3>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {TESTING_PLAN_10.map((t) => (
                  <div key={t.category} className="py-1.5 flex items-start justify-between gap-4">
                    <span className="font-bold text-[#102D50] dark:text-white shrink-0">{t.category}</span>
                    <span className="text-slate-600 dark:text-slate-300 text-right">{t.checks}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: 44 DATABASE DOMAINS, PRIORITY 1 ACADEMIC STRUCTURE & TVETA/ODPC */}
      {section === 'domains' && (
        <div className="space-y-6">
          {/* Live Cloud SQL Academic Structure */}
          {structure && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-base font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-[#1769AA]" />
                    Priority 1 Academic Structure (Live Cloud SQL PostgreSQL)
                  </h2>
                  <p className="text-xs text-slate-500">
                    {structure.campuses.length} Campuses · {structure.departments.length} Departments ·{' '}
                    {structure.programmes.length} Accredited Programmes · {structure.periods.length} Academic Periods
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Registered Programmes ({structure.programmes.length})
                  </h3>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-800">
                    {structure.programmes.map((p) => (
                      <div key={p.id} className="p-3 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">
                            <span className="font-mono text-[#1769AA] mr-1.5">{p.code}</span>
                            {p.title}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {p.level} · Body: {p.examBody} · {p.durationSemesters} semesters
                          </div>
                        </div>
                        <span className="font-bold text-emerald-700 whitespace-nowrap">
                          KES {p.tuitionPerSemesterKes.toLocaleString()}/term
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#102D50] dark:text-white flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-[#1769AA]" />
                    Register New Accredited Programme
                  </h3>
                  <div className="grid gap-2.5 sm:grid-cols-2 text-xs">
                    <input
                      type="text"
                      value={progCode}
                      onChange={(e) => setProgCode(e.target.value)}
                      placeholder="Code e.g. DAIML-L6"
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    />
                    <select
                      value={progDeptId}
                      onChange={(e) => setProgDeptId(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    >
                      {structure.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="text"
                    value={progTitle}
                    onChange={(e) => setProgTitle(e.target.value)}
                    placeholder="Programme Title e.g. Diploma in Applied AI & Robotics"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  />
                  <div className="grid gap-2.5 sm:grid-cols-3 text-xs">
                    <select
                      value={progLevel}
                      onChange={(e) => setProgLevel(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    >
                      <option value="DIPLOMA">Diploma (L6)</option>
                      <option value="CERTIFICATE">Certificate (L5)</option>
                      <option value="ARTISAN">Artisan (L4)</option>
                      <option value="PROFESSIONAL">Professional</option>
                    </select>
                    <select
                      value={progBody}
                      onChange={(e) => setProgBody(e.target.value)}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    >
                      <option value="CDACC">CDACC</option>
                      <option value="KNEC">KNEC</option>
                      <option value="KASNEB">KASNEB</option>
                      <option value="NITA">NITA</option>
                      <option value="TVETA">TVETA</option>
                    </select>
                    <input
                      type="number"
                      value={progFee}
                      onChange={(e) => setProgFee(e.target.value)}
                      placeholder="Tuition KES"
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddProgramme}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#1769AA] hover:bg-[#102D50] px-4 py-2 text-xs font-bold text-white"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Save Programme to Cloud SQL</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 44 Database Domains Reconciliation Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                <Database className="w-4 h-4 text-[#1769AA]" />
                44 Database Domains Architectural Reconciliation
              </h2>
              {baseline && (
                <span className="text-xs text-slate-500">
                  {baseline.domainStatusCounts.verified} Verified · {baseline.domainStatusCounts.partial} Partial ·{' '}
                  {baseline.domainStatusCounts.planned} Planned
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 font-bold">#</th>
                    <th className="py-2.5 px-4 font-bold">Domain</th>
                    <th className="py-2.5 px-4 font-bold">Core Entities</th>
                    <th className="py-2.5 px-4 font-bold">Existing Cloud SQL Tables</th>
                    <th className="py-2.5 px-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {DATABASE_DOMAINS_44.map((dom) => (
                    <tr key={dom.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono text-slate-500">{dom.id}</td>
                      <td className="py-2.5 px-4 font-bold text-[#102D50] dark:text-white">{dom.domain}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{dom.coreEntities}</td>
                      <td className="py-2.5 px-4">
                        {dom.existingPostgresTables.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {dom.existingPostgresTables.map((t) => (
                              <span
                                key={t}
                                className="rounded bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-800"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">{dom.notes}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block rounded-lg border px-2 py-0.5 text-[11px] font-bold ${
                            dom.status === 'Verified'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : dom.status === 'Partial'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {dom.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* TVETA & ODPC Security / Privacy Governance */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#B83232]" />
              TVETA &amp; ODPC Regulatory Safeguards
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              {TVETA_ODPC_COMPLIANCE_ITEMS.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-1 bg-slate-50/60 dark:bg-slate-800/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-[#102D50] dark:text-white">{c.requirement}</span>
                    <span className="rounded bg-[#1769AA] px-2 py-0.5 text-[10px] font-black text-white">
                      {c.framework}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">{c.safeguard}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

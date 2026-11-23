import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Circle,
  Clock,
  Filter,
  RotateCcw,
  Search,
  ShieldAlert,
} from 'lucide-react';
import {
  ChecklistItemStatus,
  IMPLEMENTATION_CHECKLIST_AREAS,
  RECOMMENDED_IMPLEMENTATION_ORDER,
  TOTAL_CHECKLIST_ITEMS,
} from '../../data/implementationChecklist318';

const CHECKLIST_STORAGE_KEY = 'hitech.implementation-checklist.v1';

function buildInitialStatusMap(mode: 'baseline' | 'zero'): Record<string, ChecklistItemStatus> {
  const map: Record<string, ChecklistItemStatus> = {};
  for (const area of IMPLEMENTATION_CHECKLIST_AREAS) {
    for (const item of area.items) {
      map[item.id] = mode === 'zero' ? 'not_started' : item.defaultStatus;
    }
  }
  return map;
}

function loadSavedStatusMap(): Record<string, ChecklistItemStatus> {
  const baseline = buildInitialStatusMap('baseline');
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return baseline;
    const parsed = JSON.parse(raw) as Record<string, ChecklistItemStatus>;
    if (!parsed || typeof parsed !== 'object') return baseline;
    return { ...baseline, ...parsed };
  } catch {
    return baseline;
  }
}

function saveStatusMap(next: Record<string, ChecklistItemStatus>): void {
  try {
    localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage write errors in restricted contexts
  }
}

const STATUS_META: Record<
  ChecklistItemStatus,
  {
    symbol: string;
    label: string;
    badgeClass: string;
    icon: React.ComponentType<{ className?: string }>;
  }
> = {
  completed: {
    symbol: '☑',
    label: 'Completed',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    icon: CheckCircle2,
  },
  in_progress: {
    symbol: '◐',
    label: 'In progress',
    badgeClass: 'bg-blue-100 text-[#102D50] border-blue-200',
    icon: Clock,
  },
  needs_attention: {
    symbol: '⚠',
    label: 'Needs attention',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    icon: AlertTriangle,
  },
  not_started: {
    symbol: '☐',
    label: 'Not started',
    badgeClass: 'bg-slate-100 text-slate-600 border-slate-200',
    icon: Circle,
  },
};

export default function ImplementationChecklistWorkspace() {
  const [statusMap, setStatusMap] = useState<Record<string, ChecklistItemStatus>>(() =>
    loadSavedStatusMap()
  );
  const [selectedAreaId, setSelectedAreaId] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<ChecklistItemStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const updateItemStatus = (itemId: string, nextStatus: ChecklistItemStatus) => {
    setStatusMap((prev) => {
      const updated = { ...prev, [itemId]: nextStatus };
      saveStatusMap(updated);
      return updated;
    });
  };

  const handleResetToZero = () => {
    const empty = buildInitialStatusMap('zero');
    setStatusMap(empty);
    saveStatusMap(empty);
  };

  const handleLoadAuditedBaseline = () => {
    const baseline = buildInitialStatusMap('baseline');
    setStatusMap(baseline);
    saveStatusMap(baseline);
  };

  const summary = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let needsAttention = 0;
    let notStarted = 0;

    const areaSummaries = IMPLEMENTATION_CHECKLIST_AREAS.map((area) => {
      let areaCompleted = 0;
      for (const item of area.items) {
        const st = statusMap[item.id] ?? item.defaultStatus;
        if (st === 'completed') {
          completed += 1;
          areaCompleted += 1;
        } else if (st === 'in_progress') {
          inProgress += 1;
        } else if (st === 'needs_attention') {
          needsAttention += 1;
        } else {
          notStarted += 1;
        }
      }
      return {
        id: area.id,
        shortTitle: area.shortTitle,
        completed: areaCompleted,
        total: area.items.length,
      };
    });

    const percent = TOTAL_CHECKLIST_ITEMS
      ? Math.round((completed / TOTAL_CHECKLIST_ITEMS) * 100)
      : 0;

    return {
      completed,
      inProgress,
      needsAttention,
      notStarted,
      percent,
      areaSummaries,
    };
  }, [statusMap]);

  const visibleAreas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return IMPLEMENTATION_CHECKLIST_AREAS.filter(
      (area) => selectedAreaId === 'ALL' || area.id === selectedAreaId
    )
      .map((area) => ({
        ...area,
        items: area.items.filter((item) => {
          const st = statusMap[item.id] ?? item.defaultStatus;
          const matchesStatus = statusFilter === 'ALL' || st === statusFilter;
          const matchesQuery =
            !q ||
            item.label.toLowerCase().includes(q) ||
            area.title.toLowerCase().includes(q);
          return matchesStatus && matchesQuery;
        }),
      }))
      .filter((area) => area.items.length > 0);
  }, [selectedAreaId, statusFilter, searchQuery, statusMap]);

  return (
    <div className="space-y-6">
      {/* Executive Progress Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#F5EBDD] px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[#102D50]">
              <span>Section 16 · Complete Implementation Tracker</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#102D50] tracking-tight">
              Implementation Progress Register ({summary.completed} / {TOTAL_CHECKLIST_ITEMS})
            </h2>
            <p className="text-xs text-slate-600">
              Interactive audit across all 15 project areas. Super Admin governance isolates
              confidential student, HR, finance, and counselling records from configuration roles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleLoadAuditedBaseline}
              className="rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-4 py-2 text-xs font-extrabold text-white transition"
            >
              Sync Audited Baseline
            </button>
            <button
              type="button"
              onClick={handleResetToZero}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-extrabold text-[#B83232] transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Progress Tracker</span>
            </button>
          </div>
        </div>

        {/* Summary KPI Cards & Progress Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3.5">
            <div className="text-[11px] font-bold text-emerald-900">☑ Completed</div>
            <div className="mt-1 text-2xl font-black tabular-nums text-emerald-800">
              {summary.completed}
              <span className="text-xs font-bold text-emerald-700 ml-1">
                ({summary.percent}%)
              </span>
            </div>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5">
            <div className="text-[11px] font-bold text-[#102D50]">◐ In progress</div>
            <div className="mt-1 text-2xl font-black tabular-nums text-[#1769AA]">
              {summary.inProgress}
            </div>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5">
            <div className="text-[11px] font-bold text-amber-900">⚠ Needs attention</div>
            <div className="mt-1 text-2xl font-black tabular-nums text-amber-800">
              {summary.needsAttention}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] font-bold text-slate-600">☐ Not started</div>
            <div className="mt-1 text-2xl font-black tabular-nums text-slate-700">
              {summary.notStarted}
            </div>
          </div>
        </div>

        {/* Recommended Implementation Order Banner */}
        <div className="rounded-xl border border-slate-200 bg-[#F4F7FB] p-3.5 text-xs text-[#102D50]">
          <div className="font-extrabold mb-1.5 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-[#B83232]" />
            <span>Recommended Implementation Order:</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
            {RECOMMENDED_IMPLEMENTATION_ORDER.map((step, i) => (
              <React.Fragment key={step}>
                <span className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[#102D50]">
                  {step}
                </span>
                {i < RECOMMENDED_IMPLEMENTATION_ORDER.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 15 Area Quick Progress Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {summary.areaSummaries.map((area) => (
            <button
              key={area.id}
              type="button"
              onClick={() =>
                setSelectedAreaId((prev) => (prev === area.id ? 'ALL' : area.id))
              }
              className={`rounded-xl border p-3 text-left transition ${
                selectedAreaId === area.id
                  ? 'border-[#102D50] bg-[#102D50] text-white shadow-sm'
                  : 'border-slate-200 bg-white hover:border-[#1769AA] text-[#102D50]'
              }`}
            >
              <div className="text-[11px] font-bold truncate">{area.shortTitle}</div>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-black tabular-nums">
                  {area.completed}/{area.total}
                </span>
                <span
                  className={`text-[10px] font-bold tabular-nums ${
                    selectedAreaId === area.id ? 'text-blue-200' : 'text-slate-500'
                  }`}
                >
                  {Math.round((area.completed / area.total) * 100)}%
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter checklist items or areas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white pl-9 pr-3 py-2 text-xs text-[#102D50] focus:border-[#1769AA] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Status:</span>
          </span>
          {(
            [
              ['ALL', 'All'],
              ['completed', '☑ Completed'],
              ['in_progress', '◐ In progress'],
              ['needs_attention', '⚠ Attention'],
              ['not_started', '☐ Not started'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatusFilter(key)}
              className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition ${
                statusFilter === key
                  ? 'bg-[#102D50] text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Checklist Sections */}
      <div className="space-y-4">
        {visibleAreas.map((area) => (
          <section
            key={area.id}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm"
          >
            <div className="flex items-center justify-between bg-[#F4F7FB] px-5 py-3.5 border-b border-slate-200">
              <h3 className="text-sm font-black text-[#102D50]">
                {area.number}. {area.title}
              </h3>
              <span className="text-xs font-extrabold tabular-nums text-[#1769AA]">
                {area.items.filter((i) => (statusMap[i.id] ?? i.defaultStatus) === 'completed').length} /{' '}
                {area.items.length}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {area.items.map((item) => {
                const st = statusMap[item.id] ?? item.defaultStatus;
                const meta = STATUS_META[st];
                const IconComp = meta.icon;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-5 py-2.5 text-xs hover:bg-slate-50/80"
                  >
                    <div className="flex items-center gap-2.5">
                      <IconComp
                        className={`w-4 h-4 shrink-0 ${
                          st === 'completed'
                            ? 'text-emerald-600'
                            : st === 'in_progress'
                            ? 'text-[#1769AA]'
                            : st === 'needs_attention'
                            ? 'text-amber-600'
                            : 'text-slate-400'
                        }`}
                      />
                      <span className="font-semibold text-[#102D50]">{item.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <select
                        aria-label={`Status for ${item.label}`}
                        value={st}
                        onChange={(e) =>
                          updateItemStatus(item.id, e.target.value as ChecklistItemStatus)
                        }
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold focus:outline-none ${meta.badgeClass}`}
                      >
                        <option value="not_started">☐ Not started</option>
                        <option value="in_progress">◐ In progress</option>
                        <option value="completed">☑ Completed</option>
                        <option value="needs_attention">⚠ Needs attention</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

import React, { useMemo, useState, type FormEvent } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Calendar,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  Edit3,
  FileText,
  List,
  Mail,
  MapPin,
  Mic,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { type StaffUserAccount } from '../../../config/staff-navigation';
import {
  staffEventsApi,
  type EventAuditLogRecord,
  type EventNotificationRecord,
  type EventScheduleItemRecord,
  type EventSpeakerRecord,
  type PublicEventSummary,
} from '../../../website/events/eventsApi';

interface BannerNotify {
  (msg: { type: 'success' | 'error'; text: string }): void;
}

// ==========================================================
// SLICE 2: EVENT COORDINATOR DASHBOARD
// ==========================================================
export function CoordinatorDashboardPanel({
  user,
  events,
  canEdit,
  onEditEvent,
  onSelectWorkspaceTab,
  onOpenWizard,
}: {
  user: StaffUserAccount;
  events: PublicEventSummary[];
  canEdit: boolean;
  onEditEvent: (ev: PublicEventSummary) => void;
  onSelectWorkspaceTab: (
    tab: 'registrations' | 'programme' | 'communications' | 'checkin' | 'reports',
    eventId: string
  ) => void;
  onOpenWizard: () => void;
}) {
  const [scope, setScope] = useState<'MY_OR_DEPT' | 'ALL'>('MY_OR_DEPT');

  const assignedEvents = useMemo(() => {
    if (scope === 'ALL') return events;
    const myEvents = events.filter(
      (ev) =>
        ev.createdById === user.id ||
        ev.organizerName.toLowerCase() === user.fullName.toLowerCase() ||
        ev.organisingDepartmentName.toLowerCase() === user.department.toLowerCase()
    );
    return myEvents.length > 0 ? myEvents : events;
  }, [events, scope, user.id, user.fullName, user.department]);

  const draftCount = assignedEvents.filter((e) => e.status === 'DRAFT').length;
  const openCount = assignedEvents.filter((e) => e.status === 'PUBLISHED').length;
  const totalRegs = assignedEvents.reduce((acc, e) => acc + e.registeredCount, 0);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">
              Event Coordinator Workspace — {user.department}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Assigned events, programme schedules, speakers, participants, and communications for{' '}
              <strong>{user.fullName}</strong>.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Coordinator scope"
              value={scope}
              onChange={(e) => setScope(e.target.value as 'MY_OR_DEPT' | 'ALL')}
              className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold"
            >
              <option value="MY_OR_DEPT">My / Department Events</option>
              <option value="ALL">All College Events ({events.length})</option>
            </select>
            <button
              type="button"
              onClick={onOpenWizard}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-3.5 py-2 text-xs font-bold cursor-pointer"
            >
              <Plus size={14} />
              <span>New Event Draft</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 font-mono tabular-nums text-xs">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
            <p className="font-sans text-[11px] font-semibold text-slate-500">Assigned Events</p>
            <p className="mt-1 text-xl font-black text-[#102D50] dark:text-white">
              {assignedEvents.length}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
            <p className="font-sans text-[11px] font-semibold text-slate-500">
              Published / Drafts
            </p>
            <p className="mt-1 text-xl font-black text-[#1769AA]">
              {openCount} / {draftCount}
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3.5">
            <p className="font-sans text-[11px] font-semibold text-slate-500">
              Total Assigned Participants
            </p>
            <p className="mt-1 text-xl font-black text-emerald-700 dark:text-emerald-400">
              {totalRegs}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {assignedEvents.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-slate-500">{ev.eventCode}</span>
                  <span className="rounded-lg bg-blue-100 text-blue-900 px-2 py-0.5 font-extrabold">
                    {ev.status}
                  </span>
                  <span className="text-[#1769AA] font-bold">{ev.organisingDepartmentName}</span>
                </div>
                <h3 className="text-sm font-black text-[#102D50] dark:text-white">{ev.title}</h3>
                <p className="text-slate-500 font-mono tabular-nums">
                  {ev.eventDate} · {ev.startTime} · {ev.venue} · {ev.registeredCount}/{ev.capacity}{' '}
                  registrations
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => onEditEvent(ev)}
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-bold hover:bg-slate-50 cursor-pointer"
                  >
                    <Edit3 size={13} />
                    <span>Edit</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectWorkspaceTab('programme', ev.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <Mic size={13} />
                  <span>Programme &amp; Speakers</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectWorkspaceTab('registrations', ev.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 dark:border-slate-700 px-3 py-1.5 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <Users size={13} />
                  <span>Participants</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectWorkspaceTab('communications', ev.id)}
                  className="inline-flex items-center gap-1 rounded-xl bg-[#102D50] text-white px-3 py-1.5 font-bold hover:bg-[#1769AA] cursor-pointer"
                >
                  <Mail size={13} />
                  <span>Communicate</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// SLICE 3: EVENT APPROVAL DASHBOARD & DETAILED REVIEW
// ==========================================================
export function ApprovalsDashboardPanel({
  user,
  events,
  auditLogs,
  canApprove,
  canEdit,
  onReload,
  onEditEvent,
  onNotify,
}: {
  user: StaffUserAccount;
  events: PublicEventSummary[];
  auditLogs: EventAuditLogRecord[];
  canApprove: boolean;
  canEdit: boolean;
  onReload: () => Promise<void>;
  onEditEvent: (ev: PublicEventSummary) => void;
  onNotify: BannerNotify;
}) {
  const pendingEvents = useMemo(
    () => events.filter((e) => e.status === 'PENDING_APPROVAL'),
    [events]
  );
  const [selectedId, setSelectedId] = useState<string>(() => pendingEvents[0]?.id || events[0]?.id || '');
  const [reviewComment, setReviewComment] = useState('');
  const [busy, setBusy] = useState(false);

  const selected = useMemo(
    () => pendingEvents.find((e) => e.id === selectedId) || pendingEvents[0] || null,
    [pendingEvents, selectedId]
  );

  const eventAudit = useMemo(
    () => (selected ? auditLogs.filter((l) => l.eventId === selected.id) : []),
    [auditLogs, selected]
  );

  const handleDecision = async (decision: 'APPROVE' | 'RETURN_DRAFT' | 'REJECT') => {
    if (!selected) return;
    setBusy(true);
    try {
      if (decision === 'APPROVE') {
        await staffEventsApi.approveEvent(selected.id);
        onNotify({ type: 'success', text: `Approved "${selected.title}" for publication.` });
      } else if (decision === 'RETURN_DRAFT') {
        await staffEventsApi.updateEvent(selected.id, { status: 'DRAFT' });
        onNotify({
          type: 'success',
          text: `Returned "${selected.title}" to DRAFT for revision${
            reviewComment ? `: ${reviewComment}` : '.'
          }`,
        });
      } else {
        await staffEventsApi.cancelEvent(
          selected.id,
          reviewComment.trim() || 'Rejected during institutional approval review.'
        );
        onNotify({ type: 'success', text: `Rejected & cancelled "${selected.title}".` });
      }
      setReviewComment('');
      await onReload();
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Approval action failed.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <div>
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#1769AA]" />
            <span>Pending Event Approval Queue ({pendingEvents.length})</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Separation of duties: event creators cannot self-approve submissions.
          </p>
        </div>

        {pendingEvents.length === 0 ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-5 text-center text-xs text-emerald-900 font-semibold">
            All submitted events have been reviewed. No items waiting in the approval queue.
          </div>
        ) : (
          <div className="space-y-2.5">
            {pendingEvents.map((ev) => {
              const active = selected?.id === ev.id;
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelectedId(ev.id)}
                  className={`w-full text-left rounded-xl border p-3.5 text-xs transition cursor-pointer ${
                    active
                      ? 'border-[#1769AA] bg-blue-50/60 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#1769AA]">{ev.eventCode}</span>
                    <span className="rounded-lg bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-extrabold">
                      PENDING REVIEW
                    </span>
                  </div>
                  <p className="mt-1 font-black text-sm text-[#102D50] dark:text-white">
                    {ev.title}
                  </p>
                  <p className="mt-1 text-slate-500">
                    {ev.organisingDepartmentName} · Requested by {ev.createdByName}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
        {!selected ? (
          <div className="py-12 text-center text-xs text-slate-500">
            Select a pending event to inspect venue, budget, participant limits, and audit trail.
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#1769AA]">
                  {selected.eventCode} · {selected.category}
                </span>
                <h3 className="text-lg font-black text-[#102D50] dark:text-white">
                  {selected.title}
                </h3>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onEditEvent(selected)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  <Edit3 size={13} />
                  <span>Open in Wizard</span>
                </button>
              )}
            </div>

            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {selected.fullDescription || selected.shortDescription}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 p-3.5">
              <div>
                <span className="text-slate-500 block">Organising Department</span>
                <strong className="text-[#102D50] dark:text-white">
                  {selected.organisingDepartmentName}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Event Owner / Requested By</span>
                <strong className="text-[#102D50] dark:text-white">
                  {selected.organizerName} ({selected.createdByName})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Venue &amp; Schedule</span>
                <strong className="text-[#102D50] dark:text-white">
                  {selected.venue} · {selected.eventDate} ({selected.startTime} – {selected.endTime})
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Capacity &amp; Fee Structure</span>
                <strong className="text-[#102D50] dark:text-white font-mono tabular-nums">
                  {selected.capacity} seats ·{' '}
                  {selected.isPaid ? `KES ${selected.feeAmount.toLocaleString()}` : 'Free'}
                </strong>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 block">Safety, Accessibility &amp; Requirements</span>
                <strong className="text-[#102D50] dark:text-white">
                  {selected.requirements || selected.accessibilityInfo || 'Standard campus safety rules apply.'}
                </strong>
              </div>
            </div>

            {eventAudit.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold text-[#102D50] dark:text-white">Approval History</h4>
                {eventAudit.slice(0, 4).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 dark:border-slate-800 px-3 py-1.5 text-[11px]"
                  >
                    <span>
                      <strong>{log.action}</strong> — {log.detail}
                    </span>
                    <span className="font-mono text-slate-400">{log.createdAt.slice(0, 10)}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label className="block font-bold text-[#102D50] dark:text-white">
                Reviewer Comments / Revision Notes
              </label>
              <textarea
                rows={2}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Optional feedback for coordinator or reason for revision/rejection..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5"
              />
              {selected.createdById === user.id ? (
                <p className="text-amber-700 font-semibold">
                  You created this event. Another Principal, Registrar, HOD, or Events Admin must
                  perform approval.
                </p>
              ) : canApprove ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDecision('APPROVE')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 font-bold cursor-pointer"
                  >
                    <CheckCircle2 size={14} />
                    <span>Approve Event</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDecision('RETURN_DRAFT')}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 px-4 py-2 font-bold cursor-pointer"
                  >
                    <Edit3 size={14} />
                    <span>Return for Revision</span>
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleDecision('REJECT')}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#B83232] hover:bg-red-800 text-white px-4 py-2 font-bold cursor-pointer"
                  >
                    <XCircle size={14} />
                    <span>Reject</span>
                  </button>
                </div>
              ) : (
                <p className="text-slate-500">
                  Read-only preview: approval requires Principal, Registrar, HOD, or Events Admin
                  rights.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================================
// SLICE 14: INTERNAL STAFF EVENTS CALENDAR (MONTH / AGENDA / LIST)
// ==========================================================
export function StaffEventsCalendarPanel({
  events,
  onSelectEvent,
}: {
  events: PublicEventSummary[];
  onSelectEvent: (ev: PublicEventSummary) => void;
}) {
  const [viewMode, setViewMode] = useState<'MONTH' | 'AGENDA' | 'LIST'>('MONTH');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [cursor, setCursor] = useState(() => {
    const first = events[0]?.eventDate ? new Date(`${events[0].eventDate}T00:00:00`) : new Date();
    return new Date(first.getFullYear(), first.getMonth(), 1);
  });

  const campuses = useMemo(
    () => Array.from(new Set(events.map((e) => e.campus || 'Nairobi Main Campus'))),
    [events]
  );
  const departments = useMemo(
    () => Array.from(new Set(events.map((e) => e.organisingDepartmentName))),
    [events]
  );

  const filtered = useMemo(
    () =>
      events.filter((e) => {
        if (campusFilter !== 'ALL' && (e.campus || 'Nairobi Main Campus') !== campusFilter)
          return false;
        if (deptFilter !== 'ALL' && e.organisingDepartmentName !== deptFilter) return false;
        return true;
      }),
    [events, campusFilter, deptFilter]
  );

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOffset = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = cursor.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' });

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <CalendarDays size={16} className="text-[#1769AA]" />
            <span>Master Institutional Events Calendar</span>
          </h2>
          <p className="text-xs text-slate-500">
            Filter across campuses and departments, export .ics calendar files, or inspect schedules.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            aria-label="Filter campus"
            value={campusFilter}
            onChange={(e) => setCampusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-semibold"
          >
            <option value="ALL">All Campuses</option>
            {campuses.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            aria-label="Filter department"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1.5 font-semibold"
          >
            <option value="ALL">All Departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-800">
            {(['MONTH', 'AGENDA', 'LIST'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`px-3 py-1 rounded-lg font-bold cursor-pointer ${
                  viewMode === m ? 'bg-[#102D50] text-white' : 'text-slate-600 dark:text-slate-300'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </div>

      {viewMode === 'MONTH' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-[#102D50] dark:text-white">{monthLabel}</h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="rounded-lg border border-slate-300 p-1.5 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                aria-label="Next month"
                onClick={() => setCursor(new Date(year, month + 1, 1))}
                className="rounded-lg border border-slate-300 p-1.5 hover:bg-slate-50 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-slate-500">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: firstDayOffset }).map((_, idx) => (
              <div
                key={`blank-${idx}`}
                className="min-h-[82px] rounded-xl bg-slate-50/50 dark:bg-slate-800/20"
              />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
                2,
                '0'
              )}`;
              const dayEvents = filtered.filter((e) => e.eventDate === iso);
              return (
                <div
                  key={iso}
                  className="min-h-[82px] rounded-xl border border-slate-200 dark:border-slate-800 p-1.5 text-[11px]"
                >
                  <span className="font-mono font-bold text-slate-500">{day}</span>
                  <div className="mt-1 space-y-1">
                    {dayEvents.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => onSelectEvent(ev)}
                        className="w-full text-left rounded-md bg-[#102D50] hover:bg-[#1769AA] text-white px-1.5 py-0.5 text-[10px] font-semibold truncate cursor-pointer"
                        title={`${ev.title} (${ev.startTime})`}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(viewMode === 'AGENDA' || viewMode === 'LIST') && (
        <div className="space-y-2.5 text-xs">
          {filtered.map((ev) => (
            <div
              key={ev.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[#1769AA]">{ev.eventDate}</span>
                  <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 font-bold">
                    {ev.status}
                  </span>
                  <span className="text-slate-500">{ev.organisingDepartmentName}</span>
                </div>
                <h4 className="font-bold text-[#102D50] dark:text-white mt-0.5">{ev.title}</h4>
                <p className="text-slate-500">
                  {ev.startTime} – {ev.endTime} · {ev.venue}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/public/events/${encodeURIComponent(ev.slug)}/ics`}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 font-bold hover:bg-slate-50"
                >
                  <Download size={13} />
                  <span>.ICS</span>
                </a>
                <button
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className="rounded-xl bg-[#102D50] text-white px-3 py-1.5 font-bold cursor-pointer"
                >
                  Manage
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==========================================================
// SLICE 8: PROGRAMME & SPEAKER DASHBOARD
// ==========================================================
export function ProgrammeSpeakersPanel({
  eventId,
  eventTitle,
  schedules,
  speakers,
  canEdit,
  onReload,
  onNotify,
}: {
  eventId: string;
  eventTitle: string;
  schedules: EventScheduleItemRecord[];
  speakers: EventSpeakerRecord[];
  canEdit: boolean;
  onReload: () => Promise<void>;
  onNotify: BannerNotify;
}) {
  const [sessionItems, setSessionItems] = useState<Array<Partial<EventScheduleItemRecord>>>(schedules);
  const [speakerItems, setSpeakerItems] = useState<Array<Partial<EventSpeakerRecord>>>(speakers);
  const [saving, setSaving] = useState(false);

  React.useEffect(() => {
    setSessionItems(schedules);
    setSpeakerItems(speakers);
  }, [schedules, speakers, eventId]);

  const moveSession = (index: number, delta: -1 | 1) => {
    const next = [...sessionItems];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSessionItems(next);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await Promise.all([
        staffEventsApi.saveSchedules(eventId, sessionItems),
        staffEventsApi.saveSpeakers(eventId, speakerItems),
      ]);
      onNotify({ type: 'success', text: `Saved programme & speakers for "${eventTitle}".` });
      await onReload();
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save programme.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-[#1769AA]" />
              <span>Programme &amp; Session Timetable — {eventTitle}</span>
            </h2>
            <p className="text-xs text-slate-500">
              Reorder sessions, assign rooms, moderators, and timeslots.
            </p>
          </div>
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setSessionItems((prev) => [
                    ...prev,
                    {
                      dayNumber: 1,
                      timeRange: '11:00 AM – 12:00 PM',
                      title: 'New Session',
                      speakerName: '',
                      location: 'Main Hall',
                      description: '',
                    },
                  ])
                }
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                <Plus size={13} />
                <span>Add Session</span>
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={handleSaveAll}
                className="inline-flex items-center gap-1 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-4 py-1.5 text-xs font-bold cursor-pointer"
              >
                <CheckCircle2 size={13} />
                <span>{saving ? 'Saving...' : 'Save Programme & Speakers'}</span>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2.5 text-xs">
          {sessionItems.length === 0 ? (
            <p className="py-4 text-center text-slate-500">No programme sessions added yet.</p>
          ) : (
            sessionItems.map((s, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 grid grid-cols-1 md:grid-cols-12 gap-2 items-center"
              >
                <input
                  type="text"
                  value={s.timeRange || ''}
                  onChange={(e) =>
                    setSessionItems((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, timeRange: e.target.value } : row))
                    )
                  }
                  placeholder="Time Range"
                  className="md:col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5 font-mono"
                />
                <input
                  type="text"
                  value={s.title || ''}
                  onChange={(e) =>
                    setSessionItems((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, title: e.target.value } : row))
                    )
                  }
                  placeholder="Session Title"
                  className="md:col-span-4 rounded-lg border border-slate-300 px-2.5 py-1.5 font-bold"
                />
                <input
                  type="text"
                  value={s.speakerName || ''}
                  onChange={(e) =>
                    setSessionItems((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, speakerName: e.target.value } : row
                      )
                    )
                  }
                  placeholder="Speaker / Facilitator"
                  className="md:col-span-3 rounded-lg border border-slate-300 px-2.5 py-1.5"
                />
                <input
                  type="text"
                  value={s.location || ''}
                  onChange={(e) =>
                    setSessionItems((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, location: e.target.value } : row))
                    )
                  }
                  placeholder="Room"
                  className="md:col-span-2 rounded-lg border border-slate-300 px-2.5 py-1.5"
                />
                {canEdit && (
                  <div className="md:col-span-1 flex items-center justify-end gap-1">
                    <button
                      type="button"
                      aria-label="Move up"
                      onClick={() => moveSession(idx, -1)}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label="Move down"
                      onClick={() => moveSession(idx, 1)}
                      className="p-1 rounded border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      <ArrowDown size={12} />
                    </button>
                    <button
                      type="button"
                      aria-label="Remove session"
                      onClick={() =>
                        setSessionItems((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="p-1 rounded border border-red-200 text-red-700 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Mic size={16} className="text-[#1769AA]" />
              <span>Speakers, Facilitators &amp; Hosts ({speakerItems.length})</span>
            </h2>
          </div>
          {canEdit && (
            <button
              type="button"
              onClick={() =>
                setSpeakerItems((prev) => [
                  ...prev,
                  {
                    name: '',
                    roleTitle: '',
                    speakerRole: 'Guest Speaker' as const,
                    organization: 'HI-TECH College',
                    confirmationStatus: 'INVITED' as const,
                    bio: '',
                  },
                ])
              }
              className="inline-flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Speaker</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {speakerItems.map((sp, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2"
            >
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={sp.name || ''}
                  onChange={(e) =>
                    setSpeakerItems((prev) =>
                      prev.map((row, i) => (i === idx ? { ...row, name: e.target.value } : row))
                    )
                  }
                  placeholder="Speaker Full Name"
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5 font-bold"
                />
                <input
                  type="text"
                  value={sp.organization || ''}
                  onChange={(e) =>
                    setSpeakerItems((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, organization: e.target.value } : row
                      )
                    )
                  }
                  placeholder="Organization"
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5"
                />
                <select
                  value={sp.speakerRole || 'Guest Speaker'}
                  onChange={(e) =>
                    setSpeakerItems((prev) =>
                      prev.map((row, i) =>
                        i === idx
                          ? {
                              ...row,
                              speakerRole: e.target.value as EventSpeakerRecord['speakerRole'],
                            }
                          : row
                      )
                    )
                  }
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5"
                >
                  <option value="Keynote Speaker">Keynote Speaker</option>
                  <option value="Guest Speaker">Guest Speaker</option>
                  <option value="Panelist">Panelist</option>
                  <option value="Trainer">Trainer</option>
                  <option value="Facilitator">Facilitator</option>
                  <option value="Moderator">Moderator</option>
                  <option value="Host">Host</option>
                </select>
                <select
                  value={sp.confirmationStatus || 'INVITED'}
                  onChange={(e) =>
                    setSpeakerItems((prev) =>
                      prev.map((row, i) =>
                        i === idx
                          ? {
                              ...row,
                              confirmationStatus: e.target.value as
                                | 'INVITED'
                                | 'CONFIRMED'
                                | 'DECLINED',
                            }
                          : row
                      )
                    )
                  }
                  className="rounded-lg border border-slate-300 px-2.5 py-1.5"
                >
                  <option value="INVITED">Invited</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="DECLINED">Declined</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={sp.roleTitle || ''}
                  onChange={(e) =>
                    setSpeakerItems((prev) =>
                      prev.map((row, i) =>
                        i === idx ? { ...row, roleTitle: e.target.value } : row
                      )
                    )
                  }
                  placeholder="Title / Expertise"
                  className="flex-1 rounded-lg border border-slate-300 px-2.5 py-1.5"
                />
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setSpeakerItems((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded-lg border border-red-200 text-red-700 px-2.5 py-1.5 font-bold hover:bg-red-50 cursor-pointer"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================================
// SLICE 7: COMMUNICATIONS & TEMPLATE LIBRARY DASHBOARD
// ==========================================================
const MESSAGE_TEMPLATES = [
  {
    key: 'REMINDER',
    label: 'Event Schedule Reminder',
    subject: 'Reminder: Upcoming HI-TECH College Event — Bring Your QR Pass',
    body: 'Dear Participant, this is a friendly reminder to arrive 20 minutes before opening keynote with your digital QR ticket pass ready at the registration desk.',
  },
  {
    key: 'VENUE_CHANGED',
    label: 'Venue / Room Update',
    subject: 'Important Venue Update for Your Registered Event',
    body: 'Please note that our upcoming session has been relocated to Technology Block A — Innovation Hall to accommodate additional attendees.',
  },
  {
    key: 'PAYMENT_REMINDER',
    label: 'Payment Verification Reminder',
    subject: 'Complete Event Registration Fee via Lipa na M-Pesa',
    body: 'Your provisional seat is reserved. Please submit your M-Pesa transaction reference in the registration confirmation portal to unlock your verified QR ticket.',
  },
  {
    key: 'FEEDBACK_REQUEST',
    label: 'Post-Event Feedback Request',
    subject: 'Share Your Feedback & Unlock Your Event Certificate',
    body: 'Thank you for attending! Please take 60 seconds to rate the sessions and speakers so we can issue your verified completion certificate.',
  },
  {
    key: 'CERTIFICATE_ISSUED',
    label: 'Certificate Issued Notification',
    subject: 'Your Official HI-TECH College Digital Certificate is Ready',
    body: 'Congratulations! Your verifiable event certificate has been issued and is now available for download inside your registration portal.',
  },
];

export function CommunicationsDashboardPanel({
  eventId,
  eventTitle,
  notifications,
  onReload,
  onNotify,
}: {
  eventId: string;
  eventTitle: string;
  notifications: EventNotificationRecord[];
  onReload: () => Promise<void>;
  onNotify: BannerNotify;
}) {
  const [audience, setAudience] = useState<'CONFIRMED' | 'WAITLISTED' | 'ALL'>('CONFIRMED');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const applyTemplate = (tpl: (typeof MESSAGE_TEMPLATES)[number]) => {
    setSubject(`${tpl.subject} (${eventTitle})`);
    setMessage(tpl.body);
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!eventId) return;
    setSending(true);
    try {
      const res = await staffEventsApi.sendAnnouncement(eventId, {
        subject,
        message,
        audience,
      });
      onNotify({
        type: 'success',
        text: `Dispatched communication to ${res.sentCount} participant(s).`,
      });
      setSubject('');
      setMessage('');
      await onReload();
    } catch (err) {
      onNotify({
        type: 'error',
        text: err instanceof Error ? err.message : 'Dispatch failed.',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Mail size={16} className="text-[#1769AA]" />
            <span>Communications &amp; Template Composer — {eventTitle}</span>
          </h2>
          <p className="text-xs text-slate-500">
            Use an institutional template or compose custom email &amp; portal announcements.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {MESSAGE_TEMPLATES.map((tpl) => (
            <button
              key={tpl.key}
              type="button"
              onClick={() => applyTemplate(tpl)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-bold text-[#102D50] dark:text-white hover:bg-blue-50 cursor-pointer"
            >
              {tpl.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSend} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Target Audience</label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value as 'CONFIRMED' | 'WAITLISTED' | 'ALL')}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
            >
              <option value="CONFIRMED">Confirmed Registrants Only</option>
              <option value="WAITLISTED">Waitlisted Queue Only</option>
              <option value="ALL">All Active Participants</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1">Subject Line *</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Message Body *</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your update..."
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-3"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#102D50] hover:bg-[#1769AA] text-white px-4 py-2 font-bold cursor-pointer"
          >
            <Send size={14} />
            <span>{sending ? 'Dispatching...' : 'Send Bulk Notification'}</span>
          </button>
        </form>
      </div>

      <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
          Delivery Tracking Log ({notifications.length})
        </h3>
        <div className="space-y-2.5 max-h-[420px] overflow-y-auto text-xs">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 space-y-1"
            >
              <div className="flex items-center justify-between font-bold text-[#102D50] dark:text-white">
                <span className="truncate">{n.subject}</span>
                <span className="text-[10px] text-emerald-700 shrink-0 ml-2">{n.channel}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300">{n.message}</p>
              <p className="text-[11px] text-slate-400">
                To: {n.recipientName} ({n.recipientTarget})
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

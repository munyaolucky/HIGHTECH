import { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Download,
  FileText,
  LifeBuoy,
  Lock,
  Mail,
  Moon,
  Plus,
  Send,
  Settings,
  Sun,
  Trash2,
  User,
} from 'lucide-react';
import {
  ALL_STAFF_ROLES,
  STAFF_ACCOUNTS,
  type StaffRole,
  type StaffUserAccount,
} from '../../config/staff-navigation';
import { useTheme } from '../../context/ThemeContext';
import { aiSupportCentreService } from '../../services/aiSupportCentreService';
import { engagementService } from '../../services/engagementService';
import { buildSafeCsv, qualityDocsReportsService } from '../../services/qualityDocsReportsService';
import {
  staffPortalService,
  type StaffTaskStatus,
} from '../../services/staffPortalService';
import type { SupportAssistantRole, SupportTicketCategory } from '../../types/aiSupportCentre';
import AccountRoleWorkspace from '../../components/portal/AccountRoleWorkspace';
import {
  StaffButton,
  StaffPageHeader,
  StaffPermissionNotice,
  StaffSearchToolbar,
  StaffStatusTag,
} from './components/StaffDashboardUI';

function mapStaffRoleToSupportRole(role: StaffRole): SupportAssistantRole {
  if (role === 'LECTURER' || role === 'HOD') return 'LECTURER';
  if (role === 'REGISTRAR' || role === 'ADMISSIONS_OFFICER' || role === 'EXAMINATIONS_OFFICER')
    return 'REGISTRAR';
  if (role === 'FINANCE_OFFICER') return 'FINANCE_OFFICER';
  if (role === 'HR') return 'HR_OFFICER';
  if (role === 'LIBRARIAN') return 'LIBRARIAN';
  return 'IT_SUPPORT';
}

export function StaffProfilePage({ user }: { user: StaffUserAccount }) {
  const [phone, setPhone] = useState('+254 700 100 200');
  const [office, setOffice] = useState(`${user.campus} · Block A`);
  const [bio, setBio] = useState(
    `Authorized ${user.roleTitle} serving in ${user.department}.`
  );
  const [saving, setSaving] = useState(false);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/staff/me', { credentials: 'include' })
      .then((res) => res.json())
      .then((json) => {
        if (!active || !json?.success || !json.data) return;
        setPhone(json.data.phone ?? '+254 700 100 200');
        setOffice(json.data.officeLocation ?? `${user.campus} · Block A`);
        setBio(json.data.bio ?? '');
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [user.role, user.campus]);

  const handleSaveProfile = async () => {
    setSaving(true);
    setSavedNotice(null);
    setErrorNotice(null);
    try {
      const res = await fetch('/api/staff/me', {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, officeLocation: office, bio }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setErrorNotice(json.error || 'Unable to update staff profile.');
      } else {
        setSavedNotice('Staff profile details saved to server.');
      }
    } catch {
      setErrorNotice('Network error while saving profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="My Staff Profile"
        description="Manage your permitted contact details, office location, and review authorized role boundaries."
        breadcrumb="My Profile"
      />

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1.4fr]">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#102D50] text-lg font-extrabold text-[#E8B44A]">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#102D50] dark:text-white truncate">
                {user.fullName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {user.roleTitle} · <span className="font-mono">{user.employeeNumber}</span>
              </p>
            </div>
          </div>

          <dl className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
            <div className="flex justify-between gap-2 py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">Email</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-100">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-2 py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">Department</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-100">{user.department}</dd>
            </div>
            <div className="flex justify-between gap-2 py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">Primary Campus</dt>
              <dd className="font-medium text-slate-800 dark:text-slate-100">{user.campus}</dd>
            </div>
            <div className="flex justify-between gap-2 py-2.5">
              <dt className="text-slate-500 dark:text-slate-400">Authorized Campuses</dt>
              <dd className="text-right font-medium text-slate-800 dark:text-slate-100">
                {user.allowedCampuses.join(', ')}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <div className="flex items-center gap-2 text-base font-bold text-[#102D50] dark:text-white">
            <User size={18} />
            <span>Permitted Contact &amp; Office Details</span>
          </div>

          {savedNotice && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={15} /> {savedNotice}
            </div>
          )}
          {errorNotice && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-2.5 text-xs font-semibold text-red-800 dark:text-red-300">
              {errorNotice}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Extension / Work Phone
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Office Location
              <input
                type="text"
                value={office}
                onChange={(e) => setOffice(e.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
              />
            </label>
          </div>

          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Role Responsibility Summary
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
            />
          </label>

          <div className="flex justify-end">
            <StaffButton disabled={saving} onClick={handleSaveProfile}>
              {saving ? 'Saving...' : 'Save Profile Changes'}
            </StaffButton>
          </div>
        </section>
      </div>

      <StaffPermissionNotice
        roleTitle={user.roleTitle}
        dataScopeSummary={user.dataScopeSummary}
        restrictedFrom={user.restrictedFrom}
      />

      <AccountRoleWorkspace roleOverride={user.role} compact />
    </div>
  );
}

interface ApiTaskItem {
  id: string;
  title: string;
  description: string;
  dueAt?: string;
  status: StaffTaskStatus;
}

export function StaffTasksPage({ user }: { user: StaffUserAccount }) {
  const [tasks, setTasks] = useState<ApiTaskItem[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [due, setDue] = useState('');
  const [status, setStatus] = useState<StaffTaskStatus>('PENDING');
  const [notice, setNotice] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: '6',
        search,
        status: filter,
      });
      const res = await fetch(`/api/staff/tasks?${qs.toString()}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setTasks(json.data.items);
        setTotalPages(json.data.totalPages);
        setTotal(json.data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [page, search, filter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleCreateTask = async () => {
    setNotice(null);
    const res = await fetch('/api/staff/tasks', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        dueAt: due || undefined,
        status,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setNotice(json.error || 'Could not create task.');
      return;
    }
    setTitle('');
    setDescription('');
    setDue('');
    setNotice('Task saved to your role queue.');
    setPage(1);
    await loadTasks();
  };

  const handleStatusChange = async (taskId: string, nextStatus: StaffTaskStatus) => {
    await fetch(`/api/staff/tasks/${taskId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    await fetch(`/api/staff/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    await loadTasks();
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="My Tasks"
        description={`Authenticated role-scoped task queue for ${user.roleTitle} (${total} total).`}
        breadcrumb="My Tasks"
      />

      {notice && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-2.5 text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <StaffSearchToolbar
            search={search}
            onSearch={(val) => {
              setPage(1);
              setSearch(val);
            }}
            placeholder="Search tasks..."
            filterOptions={['ALL', 'PENDING', 'IN_PROGRESS', 'URGENT', 'COMPLETED']}
            activeFilter={filter}
            onFilterChange={(val) => {
              setPage(1);
              setFilter(val);
            }}
          />

          {loading && tasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              Loading tasks...
            </div>
          ) : tasks.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching tasks found for this role queue.
            </div>
          ) : (
            <>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {task.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {task.description}
                      </p>
                      {task.dueAt && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                          Due: {task.dueAt}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <StaffStatusTag status={task.status} />
                      <select
                        aria-label={`Update status for ${task.title}`}
                        value={task.status}
                        onChange={(e) =>
                          handleStatusChange(task.id, e.target.value as StaffTaskStatus)
                        }
                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs font-medium text-slate-700 dark:text-slate-200"
                      >
                        <option value="PENDING">Pending</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="URGENT">Urgent</option>
                        <option value="COMPLETED">Completed</option>
                      </select>
                      <button
                        type="button"
                        aria-label={`Delete task ${task.title}`}
                        onClick={() => handleDeleteTask(task.id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-mono">
                    Page {page} of {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <StaffButton
                      variant="secondary"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </StaffButton>
                    <StaffButton
                      variant="secondary"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </StaffButton>
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Plus size={17} /> Log New Action Item
          </h2>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Task Title
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Verify trimester registration forms"
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Description
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Operational steps or reference code..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Due Date
              <input
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              />
            </label>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
              Priority / Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StaffTaskStatus)}
                className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="PENDING">PENDING</option>
                <option value="IN_PROGRESS">IN PROGRESS</option>
                <option value="URGENT">URGENT</option>
              </select>
            </label>
          </div>
          <StaffButton onClick={handleCreateTask}>Add Task</StaffButton>
        </section>
      </div>
    </div>
  );
}

export function StaffMessagesPage({ user }: { user: StaffUserAccount }) {
  const [tick, setTick] = useState(0);
  const [toRole, setToRole] = useState<StaffRole>('REGISTRAR');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  void tick;
  const messages = staffPortalService.getMessagesForRole(user.role);

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Internal Staff Messages"
        description="Role-to-role college correspondence and handover notes."
        breadcrumb="Messages"
      />

      {feedback && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Mail size={17} /> Inbox &amp; Sent Threads
          </h2>
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No messages for {user.roleTitle} yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {messages.map((m) => (
                <div key={m.id} className="py-4 space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {m.subject}
                    </span>
                    <StaffStatusTag
                      status={
                        m.fromRole === user.role
                          ? 'SENT'
                          : m.read
                          ? 'READ'
                          : 'UNREAD'
                      }
                    />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    From: {m.fromName} · To: {STAFF_ACCOUNTS[m.toRole]?.roleTitle ?? m.toRole}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{m.body}</p>
                  {!m.read && m.toRole === user.role && (
                    <button
                      type="button"
                      onClick={() => {
                        staffPortalService.markMessageRead(m.id);
                        setTick((n) => n + 1);
                      }}
                      className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                    >
                      Mark as read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Send size={16} /> Compose Staff Memo
          </h2>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Recipient Office / Role
            <select
              value={toRole}
              onChange={(e) => setToRole(e.target.value as StaffRole)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            >
              {ALL_STAFF_ROLES.map((r) => (
                <option key={r} value={r}>
                  {STAFF_ACCOUNTS[r].roleTitle} ({r.replaceAll('_', ' ')})
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Subject
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Memo subject..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Message
            <textarea
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter official office communication..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </label>
          <StaffButton
            onClick={() => {
              const res = staffPortalService.sendMessage({
                fromRole: user.role,
                toRole,
                subject,
                body,
              });
              if (res.ok) {
                setSubject('');
                setBody('');
                setFeedback('Internal memo dispatched.');
                setTick((n) => n + 1);
              } else {
                setFeedback(res.error ?? 'Unable to send message.');
              }
            }}
          >
            <Send size={14} /> Send Memo
          </StaffButton>
        </section>
      </div>
    </div>
  );
}

export function StaffNotificationsPage() {
  const [tick, setTick] = useState(0);
  void tick;
  const engagement = engagementService.getState();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Notifications"
        description="Institutional notices, security alerts, and workflow reminders."
        breadcrumb="Notifications"
        actions={
          <StaffButton
            variant="secondary"
            onClick={() => {
              engagementService.markAllRead();
              setTick((n) => n + 1);
            }}
          >
            Mark All Read
          </StaffButton>
        }
      />

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {engagement.notifications.map((n) => (
            <div
              key={n.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-[#eef4fd] dark:bg-slate-800 p-2 text-[#1769AA] dark:text-blue-400">
                  <Bell size={16} />
                </div>
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span>{n.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{n.createdAt.slice(0, 10)}</span>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white">
                    {n.title}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StaffStatusTag status={n.read ? 'READ' : 'UNREAD'} />
                {!n.read && (
                  <StaffButton
                    variant="secondary"
                    onClick={() => {
                      engagementService.markNotificationRead(n.id);
                      setTick((k) => k + 1);
                    }}
                  >
                    Mark read
                  </StaffButton>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function StaffDocumentsPage({ user }: { user: StaffUserAccount }) {
  const [search, setSearch] = useState('');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);
  const docs = qualityDocsReportsService.getState().documents;

  // Respect confidentiality: OWNER_ONLY confidential files belong strictly to their owner/Student Affairs
  const visibleDocs = docs.filter((d) => {
    const canSeeConfidential =
      d.accessPolicy !== 'OWNER_ONLY' ||
      d.ownerUserId === user.id ||
      user.role === 'STUDENT_AFFAIRS';
    if (!canSeeConfidential) return false;
    if (!search.trim()) return true;
    return (
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.reference.toLowerCase().includes(search.toLowerCase())
    );
  });

  const exportCsv = () => {
    const csv = buildSafeCsv(
      ['Reference', 'Title', 'Category', 'Access Policy', 'Status', 'Branch'],
      visibleDocs.map((d) => [d.reference, d.title, d.category, d.accessPolicy, d.status, d.branch])
    );
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hitech-staff-documents-${user.role.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadNotice(`Exported ${visibleDocs.length} authorized document records to CSV.`);
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="College Documents"
        description="Permission-filtered institutional policies, accreditation forms, and departmental manuals."
        breadcrumb="Documents"
        actions={
          <StaffButton variant="secondary" onClick={exportCsv}>
            <Download size={15} /> Export Authorized List (CSV)
          </StaffButton>
        }
      />

      {downloadNotice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          {downloadNotice}
        </div>
      )}

      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
        <StaffSearchToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search document reference or title..."
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <th className="py-3 pr-4">Reference</th>
                <th className="py-3 pr-4">Title</th>
                <th className="py-3 pr-4">Category</th>
                <th className="py-3 pr-4">Access Policy</th>
                <th className="py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {visibleDocs.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-mono text-xs font-semibold text-[#1769AA] dark:text-blue-400">
                    {d.reference}
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-white">
                      <FileText size={15} className="text-slate-400 shrink-0" />
                      <span>{d.title}</span>
                    </div>
                  </td>
                  <td className="py-3 pr-4 text-xs text-slate-600 dark:text-slate-300">
                    {d.category}
                  </td>
                  <td className="py-3 pr-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                    {d.accessPolicy}
                  </td>
                  <td className="py-3">
                    <StaffStatusTag status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export function StaffSupportPage({ user }: { user: StaffUserAccount }) {
  const [tick, setTick] = useState(0);
  const [category, setCategory] = useState<SupportTicketCategory>('PORTAL_TECH');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  void tick;
  const supportRole = mapStaffRoleToSupportRole(user.role);
  const state = aiSupportCentreService.getState();

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Staff Help & Support Centre"
        description="Submit ICT/portal tickets and view requester-visible updates (internal support notes remain restricted to IT Support)."
        breadcrumb="Support Centre"
      />

      {feedback && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <LifeBuoy size={17} /> Active Support Tickets
          </h2>

          <div className="space-y-3">
            {state.tickets.map((t) => {
              const visibleMessages = aiSupportCentreService.getVisibleTicketMessages(
                t,
                supportRole
              );
              return (
                <div
                  key={t.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400 mr-2">
                        {t.ticketRef}
                      </span>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {t.subject}
                      </span>
                    </div>
                    <StaffStatusTag status={t.status} />
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{t.description}</p>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Requester: {t.requesterName} · Priority: {t.priority} · Visible replies:{' '}
                    {visibleMessages.length}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="h-fit rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white">
            Open New Support Ticket
          </h2>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Category
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportTicketCategory)}
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-slate-100"
            >
              <option value="PORTAL_TECH">Portal &amp; Network Technical</option>
              <option value="ACCOUNT_ACCESS">Account Access &amp; MFA</option>
              <option value="EXAMS_RESULTS">Examinations &amp; CBT</option>
              <option value="FEES_FINANCE">Fees &amp; Billing</option>
              <option value="HOSTEL_GENERAL">Facilities &amp; Campus</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Subject
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief issue summary..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </label>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
            Description
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe steps or workstation location..."
              className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            />
          </label>
          <StaffButton
            onClick={() => {
              if (!subject.trim() || !description.trim()) {
                setFeedback('Provide a ticket subject and description.');
                return;
              }
              const res = aiSupportCentreService.createSupportTicket({
                role: supportRole,
                category,
                subject,
                description,
              });
              if (res.ok) {
                setSubject('');
                setDescription('');
                setFeedback(`Ticket ${res.ticketRef} logged with system-assigned priority.`);
                setTick((n) => n + 1);
              }
            }}
          >
            Submit Support Ticket
          </StaffButton>
        </section>
      </div>
    </div>
  );
}

export function StaffSettingsPage({ user }: { user: StaffUserAccount }) {
  const { theme, toggleTheme } = useTheme();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [compactTables, setCompactTables] = useState(false);

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Workspace Settings"
        description="Configure appearance, notification preferences, and review your active RBAC permission grants."
        breadcrumb="Settings"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Settings size={17} /> Interface &amp; Display
          </h2>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Color Theme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Currently using {theme === 'dark' ? 'Dark' : 'Light'} mode across all portals.
              </p>
            </div>
            <StaffButton variant="secondary" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
            </StaffButton>
          </div>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Workflow Email Digest
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Receive morning summary of pending approvals in your role queue.
              </p>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="h-4 w-4 accent-[#1769AA]"
            />
          </label>

          <label className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-4 cursor-pointer">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                High-Density Data Tables
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Prefer compact row padding on large registers and ledgers.
              </p>
            </div>
            <input
              type="checkbox"
              checked={compactTables}
              onChange={(e) => setCompactTables(e.target.checked)}
              className="h-4 w-4 accent-[#1769AA]"
            />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <Lock size={17} /> Active Role Permissions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Explicit permission scopes bound to {user.roleTitle} ({user.employeeNumber}):
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {user.permissions.map((perm) => (
              <div
                key={perm}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-200"
              >
                {perm}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

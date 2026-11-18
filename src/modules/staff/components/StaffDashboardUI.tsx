import type { ElementType, ReactNode } from 'react';
import {
  AlertCircle,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Lock,
  Plus,
  Search,
} from 'lucide-react';
import type { StaffTaskStatus } from '../../../services/staffPortalService';

export function StaffPageHeader({
  title,
  description,
  breadcrumb = 'Staff Portal',
  actions,
}: {
  title: string;
  description: string;
  breadcrumb?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>HI-TECH College</span>
          <ChevronRight size={13} />
          <span className="truncate">{breadcrumb}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#102D50] dark:text-white text-balance">
          {title}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

export function StaffButton({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  type = 'button',
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  disabled?: boolean;
  type?: 'button' | 'submit';
  title?: string;
}) {
  const styles = {
    primary: 'bg-[#1769AA] text-white hover:bg-[#12568E]',
    secondary:
      'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-emerald-700 text-white hover:bg-emerald-800',
  };

  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

export function StaffStatusTag({
  status,
}: {
  status: string;
}) {
  const normalized = status.toUpperCase();
  let tone =
    'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

  if (
    normalized === 'COMPLETED' ||
    normalized === 'APPROVED' ||
    normalized === 'ACTIVE' ||
    normalized === 'ISSUED' ||
    normalized === 'COMPLIANT'
  ) {
    tone =
      'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300';
  } else if (
    normalized === 'PENDING' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'OPEN' ||
    normalized === 'UNDER_REVIEW' ||
    normalized === 'SUBMITTED'
  ) {
    tone =
      'border-amber-200 dark:border-amber-800/70 bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
  } else if (
    normalized === 'URGENT' ||
    normalized === 'REJECTED' ||
    normalized === 'REVOKED' ||
    normalized === 'TERMINATED'
  ) {
    tone =
      'border-red-200 dark:border-red-800/70 bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300';
  }

  return (
    <span
      className={`inline-flex w-fit items-center rounded-lg border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${tone}`}
    >
      {status.replaceAll('_', ' ')}
    </span>
  );
}

export function StaffStatCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  onClick,
}: {
  label: string;
  value: string | number;
  description: string;
  icon: ElementType;
  trend?: string;
  onClick?: () => void;
}) {
  const baseClass =
    'rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 text-left transition-colors';
  const interactiveClass = onClick
    ? 'hover:border-[#1769AA]/60 dark:hover:border-blue-500/50 cursor-pointer w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA]'
    : '';

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {label}
          </p>
          <p className="mt-2.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#102D50] dark:text-white font-mono tabular-nums">
            {value}
          </p>
        </div>
        <div className="rounded-xl bg-[#eef4fd] dark:bg-slate-800 p-2.5 text-[#1769AA] dark:text-blue-400 shrink-0">
          <Icon size={20} />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{description}</p>
        {trend && (
          <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 shrink-0">
            {trend}
          </span>
        )}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${baseClass} ${interactiveClass}`}>
        {content}
      </button>
    );
  }

  return <article className={baseClass}>{content}</article>;
}

export function StaffTaskList({
  tasks,
  onViewAll,
  onUpdateStatus,
  onQuickCreate,
}: {
  tasks: {
    id: string;
    title: string;
    description: string;
    due?: string;
    dueAt?: string;
    status: StaffTaskStatus;
  }[];
  onViewAll?: () => void;
  onUpdateStatus?: (taskId: string, status: StaffTaskStatus) => void;
  onQuickCreate?: () => void;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[#102D50] dark:text-white">My tasks</h2>
        <div className="flex items-center gap-3">
          {onQuickCreate && (
            <button
              type="button"
              onClick={onQuickCreate}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              <Plus size={14} /> Add task
            </button>
          )}
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap shrink-0"
            >
              View all <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No tasks have been assigned to your role queue yet.
          </p>
          {onViewAll && (
            <div className="mt-3">
              <StaffButton variant="secondary" onClick={onViewAll}>
                <Plus size={14} /> Create First Task
              </StaffButton>
            </div>
          )}
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {tasks.slice(0, 5).map((task) => {
            const dueDisplay = task.dueAt ?? task.due;
            return (
            <div
              key={task.id}
              className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {task.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {task.description}
                </p>
                {dueDisplay && (
                  <p className="mt-1.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    <CalendarDays size={13} /> Due: {dueDisplay}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StaffStatusTag status={task.status} />
                {onUpdateStatus && task.status !== 'COMPLETED' && (
                  <button
                    type="button"
                    onClick={() => onUpdateStatus(task.id, 'COMPLETED')}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap"
                  >
                    Mark done
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function StaffActivityPanel({
  items,
}: {
  items: { id: string; title: string; time: string; type: 'success' | 'pending' | 'alert' }[];
}) {
  const icons = {
    success: CheckCircle2,
    pending: Clock3,
    alert: AlertCircle,
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <h2 className="mb-4 text-base font-bold text-[#102D50] dark:text-white">Recent activity</h2>
      {items.length === 0 ? (
        <div className="py-8 text-center text-sm text-slate-500 dark:text-slate-400">
          No recent activity recorded in this session.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => {
            const Icon = icons[item.type];
            return (
              <div key={item.id} className="flex items-start gap-3">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 shrink-0">
                  <Icon size={16} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">{item.title}</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {item.time}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export function StaffPermissionNotice({
  roleTitle,
  dataScopeSummary,
  restrictedFrom,
}: {
  roleTitle: string;
  dataScopeSummary: string;
  restrictedFrom: string[];
}) {
  return (
    <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-[#1769AA] dark:text-blue-400">
            <Lock size={14} />
            <span>Role Scope &amp; Record Access Boundary</span>
          </div>
          <p className="text-sm font-semibold text-[#102D50] dark:text-white">{roleTitle}</p>
          <p className="text-xs text-slate-600 dark:text-slate-300">{dataScopeSummary}</p>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 sm:max-w-md">
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            Restricted scopes:{' '}
          </span>
          <span>{restrictedFrom.join(' · ')}</span>
        </div>
      </div>
    </section>
  );
}

export function StaffSearchToolbar({
  search,
  onSearch,
  placeholder = 'Search records...',
  filterOptions,
  activeFilter,
  onFilterChange,
  actions,
}: {
  search: string;
  onSearch: (val: string) => void;
  placeholder?: string;
  filterOptions?: string[];
  activeFilter?: string;
  onFilterChange?: (val: string) => void;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
          />
        </div>

        {filterOptions && onFilterChange && (
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 dark:bg-slate-800 p-1">
            {filterOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => onFilterChange(opt)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeFilter === opt
                    ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {opt.replaceAll('_', ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}

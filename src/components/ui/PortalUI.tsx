import { useEffect, type ReactNode } from 'react';
import {
  AlertTriangle,
  ChevronRight,
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { SkeletonTable } from './StudentSkeletons';

export {
  Phase4ModuleSkeleton,
  SkeletonBlock,
  SkeletonCardList,
  SkeletonPageHeader,
  SkeletonStatGrid,
  SkeletonTable,
  SkeletonText,
  SkeletonToolbar,
} from './StudentSkeletons';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const buttonStyles: Record<ButtonVariant, string> = {
  primary: 'bg-[#1769AA] text-white hover:bg-[#12568E] shadow-xs',
  secondary:
    'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/70',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-xs',
  ghost:
    'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
};

export function PortalButton({
  children,
  variant = 'primary',
  onClick,
  disabled,
  type = 'button',
  className = '',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function PortalPageHeader({
  title,
  description,
  breadcrumbSection = 'STUDENT PORTAL',
  children,
}: {
  title: string;
  description: string;
  breadcrumbSection?: string;
  children?: ReactNode;
}) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-2xs">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
          <span>HI-TECH COLLEGE</span>
          <ChevronRight size={13} aria-hidden="true" />
          <span>{breadcrumbSection}</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-[#102D50] dark:text-white tracking-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1">{description}</p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </div>
  );
}

export function PortalCard({
  title,
  description,
  children,
  action,
  className = '',
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="font-bold text-sm sm:text-base text-[#102D50] dark:text-slate-100">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PortalToolbar({
  search,
  onSearch,
  placeholder = 'Search records...',
  onFilter,
  onRefresh,
  isRefreshing = false,
  onAdd,
  addLabel = 'Add New',
}: {
  search: string;
  onSearch: (value: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onAdd?: () => void;
  addLabel?: string;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-between mb-4">
      <div className="relative flex-1 max-w-lg">
        <Search
          size={16}
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:border-[#1769AA] focus:ring-2 focus:ring-[#1769AA]/25"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {onFilter && (
          <PortalButton variant="secondary" onClick={onFilter}>
            <Filter size={15} /> Filter
          </PortalButton>
        )}
        {onRefresh && (
          <PortalButton variant="secondary" onClick={onRefresh} disabled={isRefreshing}>
            <RefreshCw size={15} className={isRefreshing ? 'animate-spin' : ''} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </PortalButton>
        )}
        {onAdd && (
          <PortalButton onClick={onAdd}>
            <Plus size={15} /> {addLabel}
          </PortalButton>
        )}
      </div>
    </div>
  );
}

export function PortalStatus({
  status,
}: {
  status:
    | 'Approved'
    | 'Pending'
    | 'Rejected'
    | 'Under Review'
    | 'INVITED'
    | 'PENDING'
    | 'INCOMPLETE'
    | 'SUBMITTED'
    | 'RETURNED'
    | 'VERIFIED'
    | 'SUSPENDED'
    | 'GRADUATED';
}) {
  const styles: Record<string, string> = {
    Approved:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70',
    VERIFIED:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70',
    GRADUATED:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70',
    Pending:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70',
    PENDING:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70',
    INCOMPLETE:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/70',
    Rejected:
      'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/70',
    RETURNED:
      'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/70',
    SUSPENDED:
      'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/70',
    'Under Review':
      'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/70',
    INVITED:
      'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/70',
    SUBMITTED:
      'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/70',
  };

  return (
    <span
      className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${
        styles[status] ?? styles.Pending
      }`}
    >
      {status}
    </span>
  );
}

export function PortalEmptyState({
  title,
  description,
  actionLabel = 'Get Started',
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <div className="mx-auto w-12 h-12 rounded-2xl bg-[#eef4fd] dark:bg-slate-800 text-[#1769AA] dark:text-blue-400 flex items-center justify-center">
        <MoreHorizontal size={24} />
      </div>
      <h3 className="font-bold text-sm mt-3.5 text-slate-800 dark:text-slate-100">{title}</h3>
      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 max-w-sm mx-auto">
        {description}
      </p>
      {onAction && (
        <div className="mt-4">
          <PortalButton onClick={onAction}>
            <Plus size={15} /> {actionLabel}
          </PortalButton>
        </div>
      )}
    </div>
  );
}

export function PortalDownloadButton({
  label = 'Download',
  onClick,
}: {
  label?: string;
  onClick: () => void;
}) {
  return (
    <PortalButton variant="secondary" onClick={onClick}>
      <Download size={15} /> {label}
    </PortalButton>
  );
}

export function PortalTableSkeleton({ rows = 4 }: { rows?: number }) {
  return <SkeletonTable rows={rows} columns={3} showHeader={false} label="Loading records" />;
}

export function PortalConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  tone = 'danger',
  onConfirm,
  onCancel,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="portal-confirm-dialog-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                tone === 'danger'
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400'
                  : 'bg-blue-50 dark:bg-blue-950/60 text-[#1769AA] dark:text-blue-400'
              }`}
            >
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <h3
              id="portal-confirm-dialog-title"
              className="text-base font-bold text-slate-900 dark:text-slate-100"
            >
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close dialog"
            className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <PortalButton variant="secondary" onClick={onCancel}>
            {cancelLabel}
          </PortalButton>
          <PortalButton variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </PortalButton>
        </div>
      </div>
    </div>
  );
}

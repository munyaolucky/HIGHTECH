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
  primary: 'bg-[#1769AA] text-white hover:bg-[#12568E]',
  secondary:
    'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
  success: 'bg-emerald-700 text-white hover:bg-emerald-800',
  danger: 'bg-red-700 text-white hover:bg-red-800',
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
      className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors duration-150 whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1769AA] disabled:opacity-50 disabled:cursor-not-allowed ${buttonStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function formatBreadcrumbText(raw: string): string {
  return raw
    .split(/\s*·\s*/)
    .map((segment) =>
      segment
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\bAnd\b/g, '&')
        .replace(/\bCbt\b/g, 'CBT')
    )
    .join(' / ');
}

export function PortalPageHeader({
  title,
  description,
  breadcrumbSection = 'Student Portal',
  children,
}: {
  title: string;
  description: string;
  breadcrumbSection?: string;
  children?: ReactNode;
}) {
  return (
    <header className="pb-5 border-b border-slate-200/85 dark:border-slate-800 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
      <div className="min-w-0">
        <nav
          aria-label="Workspace breadcrumb"
          className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5"
        >
          <span>HI-TECH College</span>
          <ChevronRight size={13} aria-hidden="true" className="text-slate-400" />
          <span className="text-[#1769AA] dark:text-blue-400 font-semibold">
            {formatBreadcrumbText(breadcrumbSection)}
          </span>
        </nav>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#102D50] dark:text-white tracking-tight text-balance leading-tight">
          {title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
          {description}
        </p>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2 shrink-0">{children}</div>}
    </header>
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
      className={`bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200/75 dark:border-slate-800">
        <div className="min-w-0">
          <h2 className="font-semibold text-sm sm:text-base text-[#102D50] dark:text-slate-100 tracking-tight">
            {title}
          </h2>
          {description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5 sm:p-6">{children}</div>
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
          size={15}
          aria-hidden="true"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm focus:border-[#1769AA] focus:outline-none focus:ring-2 focus:ring-[#1769AA]/20"
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
    Approved: 'text-emerald-700 dark:text-emerald-400',
    VERIFIED: 'text-emerald-700 dark:text-emerald-400',
    GRADUATED: 'text-emerald-700 dark:text-emerald-400',
    Pending: 'text-amber-700 dark:text-amber-400',
    PENDING: 'text-amber-700 dark:text-amber-400',
    INCOMPLETE: 'text-amber-700 dark:text-amber-400',
    Rejected: 'text-red-700 dark:text-red-400',
    RETURNED: 'text-red-700 dark:text-red-400',
    SUSPENDED: 'text-red-700 dark:text-red-400',
    'Under Review': 'text-[#1769AA] dark:text-blue-400',
    INVITED: 'text-[#1769AA] dark:text-blue-400',
    SUBMITTED: 'text-[#1769AA] dark:text-blue-400',
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold whitespace-nowrap ${
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

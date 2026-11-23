import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';

export function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <div className="h-24 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-center gap-2">
        <div className="h-4 w-48 rounded-md bg-slate-200 dark:bg-slate-800" />
        <div className="h-3 w-80 max-w-full rounded-md bg-slate-100 dark:bg-slate-800/70" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-32 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-col justify-between"
          >
            <div className="h-3.5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-7 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-36 rounded bg-slate-100 dark:bg-slate-800/70" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
        <div className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          <div className="h-12 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
        </div>
        <div className="h-64 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="h-4 w-36 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
          <div className="h-10 rounded-xl bg-slate-100 dark:bg-slate-800/70" />
        </div>
      </div>
    </div>
  );
}

export function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 dark:border-red-900/70 bg-red-50 dark:bg-red-950/40 p-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} className="mt-0.5 text-red-600 dark:text-red-400 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-red-900 dark:text-red-200">
            Unable to load workspace data
          </h2>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-xl border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 px-4 py-2 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-100/60 dark:hover:bg-red-900/40 shrink-0"
        >
          <RefreshCw size={14} /> Retry
        </button>
      )}
    </div>
  );
}

export function DashboardEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-10 text-center">
      <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        <Inbox size={20} />
      </div>
      <h3 className="text-sm font-bold text-[#102D50] dark:text-white">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500 dark:text-slate-400">
        {description}
      </p>
    </div>
  );
}

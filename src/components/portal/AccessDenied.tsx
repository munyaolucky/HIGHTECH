import { ArrowLeft, ShieldAlert } from 'lucide-react';

export function AccessDenied({
  title = 'Access denied',
  message = 'You do not have permission to view this portal workspace or perform this action.',
  actionLabel = 'Return to Portal Login',
  onAction,
  secondaryLabel = 'College Website',
  onSecondaryAction,
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondaryAction?: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] flex items-center justify-center p-6">
      <section
        className="w-full max-w-lg rounded-2xl border border-[#dce4ef] dark:border-slate-800 bg-white dark:bg-slate-900 p-7 text-center shadow-sm space-y-4"
        aria-labelledby="portal-access-denied-title"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F5EBDD] dark:bg-red-950/50 text-[#B83232] dark:text-red-300">
          <ShieldAlert size={28} aria-hidden="true" />
        </div>

        <h1
          id="portal-access-denied-title"
          className="text-xl font-extrabold text-[#102D50] dark:text-white tracking-tight"
        >
          {title}
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {message}
        </p>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          {onAction && (
            <button
              type="button"
              onClick={onAction}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-[#102D50] hover:bg-[#1769AA] px-5 py-2.5 text-sm font-semibold text-white transition"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>{actionLabel}</span>
            </button>
          )}
          {onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2.5 text-sm font-semibold text-[#102D50] dark:text-slate-100 transition"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      </section>
    </div>
  );
}

export default AccessDenied;

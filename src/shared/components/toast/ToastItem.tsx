import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import type { ToastItemData, ToastType } from './toast.types';

interface ToastItemProps {
  toast: ToastItemData;
  onDismiss: (id: string) => void;
}

function getToneClasses(type: ToastType): string {
  switch (type) {
    case 'success':
    case 'saved':
      return 'bg-white dark:bg-slate-900 border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-slate-100';
    case 'error':
      return 'bg-white dark:bg-slate-900 border-red-300 dark:border-red-700 text-slate-900 dark:text-slate-100';
    case 'warning':
      return 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700 text-slate-900 dark:text-slate-100';
    case 'saving':
    case 'loading':
    case 'info':
    default:
      return 'bg-white dark:bg-slate-900 border-[#1769AA]/40 dark:border-blue-700 text-slate-900 dark:text-slate-100';
  }
}

function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
    case 'saved':
      return <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />;
    case 'error':
      return <XCircle size={17} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />;
    case 'warning':
      return <AlertTriangle size={17} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />;
    case 'saving':
    case 'loading':
      return <Loader2 size={17} className="text-[#1769AA] dark:text-blue-400 shrink-0 mt-0.5 animate-spin" aria-hidden="true" />;
    case 'info':
    default:
      return <Info size={17} className="text-[#1769AA] dark:text-blue-400 shrink-0 mt-0.5" aria-hidden="true" />;
  }
}

export function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const isAssertive = toast.type === 'error';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      className={`pointer-events-auto w-full rounded-xl border shadow-lg px-4 py-3 flex items-start gap-3 text-xs transition-all duration-150 ${getToneClasses(
        toast.type
      )}`}
    >
      <ToastIcon type={toast.type} />

      <div className="flex-1 min-w-0 space-y-1">
        {toast.title && (
          <strong className="block font-bold text-slate-900 dark:text-white leading-snug">
            {toast.title}
          </strong>
        )}
        <p className="text-slate-700 dark:text-slate-200 leading-relaxed break-words">
          {toast.message}
        </p>

        {toast.action && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                toast.action?.onClick();
                onDismiss(toast.id);
              }}
              className="px-2.5 py-1 rounded-md border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-[#102D50] dark:text-blue-300"
            >
              {toast.action.label}
            </button>
          </div>
        )}
      </div>

      {toast.dismissible !== false && (
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Dismiss notification"
          className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

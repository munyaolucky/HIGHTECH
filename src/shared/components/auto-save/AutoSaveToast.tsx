import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  CloudOff,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import type { AutoSaveState } from './autoSave.types';

interface AutoSaveToastProps {
  state: AutoSaveState;
  onRetry?: () => void;
  className?: string;
}

export function AutoSaveToast({ state, onRetry, className = '' }: AutoSaveToastProps) {
  if (state.status === 'idle') return null;

  const formattedTime = state.lastSavedAt
    ? new Date(state.lastSavedAt).toLocaleTimeString()
    : undefined;

  const toneClasses =
    state.status === 'saved'
      ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
      : state.status === 'error'
      ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800 text-red-900 dark:text-red-200'
      : state.status === 'offline' || state.status === 'dirty'
      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
      : 'bg-blue-50 dark:bg-blue-950/50 border-blue-300 dark:border-blue-800 text-[#102D50] dark:text-blue-200';

  return (
    <div
      role={state.status === 'error' ? 'alert' : 'status'}
      aria-live={state.status === 'error' ? 'assertive' : 'polite'}
      className={`inline-flex flex-wrap items-center gap-2.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${toneClasses} ${className}`}
    >
      {state.status === 'saving' && (
        <>
          <Loader2 size={14} className="animate-spin shrink-0" aria-hidden="true" />
          <span>Saving changes…</span>
        </>
      )}

      {state.status === 'dirty' && (
        <>
          <Clock size={14} className="shrink-0" aria-hidden="true" />
          <span>Unsaved changes…</span>
        </>
      )}

      {state.status === 'saved' && (
        <>
          <CheckCircle2 size={14} className="shrink-0" aria-hidden="true" />
          <span>
            Saved{formattedTime ? ' ' : ''}
            {formattedTime && <span className="font-mono tabular-nums">at {formattedTime}</span>}
          </span>
        </>
      )}

      {state.status === 'offline' && (
        <>
          <CloudOff size={14} className="shrink-0" aria-hidden="true" />
          <span>Offline — local recovery saved</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-2 py-0.5 rounded border border-amber-400 bg-white dark:bg-slate-900 text-amber-900 dark:text-amber-200 font-semibold inline-flex items-center gap-1"
            >
              <RefreshCw size={11} aria-hidden="true" />
              <span>Retry</span>
            </button>
          )}
        </>
      )}

      {state.status === 'error' && (
        <>
          <AlertCircle size={14} className="shrink-0" aria-hidden="true" />
          <span>{state.errorMessage || 'Save failed'}</span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="px-2 py-0.5 rounded border border-red-400 bg-white dark:bg-slate-900 text-red-900 dark:text-red-200 font-semibold inline-flex items-center gap-1"
            >
              <RefreshCw size={11} aria-hidden="true" />
              <span>Retry</span>
            </button>
          )}
        </>
      )}
    </div>
  );
}

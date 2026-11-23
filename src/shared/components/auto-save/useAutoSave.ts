import { useCallback, useEffect, useRef, useState } from 'react';
import type { AutoSaveState, AutoSaveStatus } from './autoSave.types';

export interface UseAutoSaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delayMs?: number;
  enabled?: boolean;
  onNotifySaved?: () => void;
  onNotifyError?: (message: string) => void;
}

export function useAutoSave<T>({
  data,
  onSave,
  delayMs = 1000,
  enabled = true,
  onNotifySaved,
  onNotifyError,
}: UseAutoSaveOptions<T>) {
  const [state, setState] = useState<AutoSaveState>({ status: 'idle' });
  const timerRef = useRef<number | undefined>(undefined);
  const firstRenderRef = useRef(true);
  const latestDataRef = useRef<T>(data);
  const onSaveRef = useRef(onSave);

  useEffect(() => {
    latestDataRef.current = data;
  }, [data]);

  useEffect(() => {
    onSaveRef.current = onSave;
  }, [onSave]);

  const setStatus = useCallback((status: AutoSaveStatus, errorMessage?: string) => {
    setState((prev) => ({
      ...prev,
      status,
      errorMessage,
      ...(status === 'saved' ? { lastSavedAt: new Date().toISOString() } : {}),
    }));
  }, []);

  const executeSave = useCallback(async () => {
    if (!enabled) return;
    setStatus('saving');

    try {
      await onSaveRef.current(latestDataRef.current);
      setStatus('saved');
      onNotifySaved?.();
    } catch (err) {
      const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
      const msg =
        err instanceof Error && err.message
          ? err.message
          : online
          ? 'Could not save changes to server.'
          : 'Offline — changes kept locally until connection returns.';
      setStatus(online ? 'error' : 'offline', msg);
      onNotifyError?.(msg);
    }
  }, [enabled, onNotifyError, onNotifySaved, setStatus]);

  useEffect(() => {
    if (!enabled) return;
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }

    setStatus('dirty');
    if (timerRef.current !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(timerRef.current);
    }

    if (typeof window !== 'undefined') {
      timerRef.current = window.setTimeout(() => {
        void executeSave();
      }, delayMs);
    }

    return () => {
      if (timerRef.current !== undefined && typeof window !== 'undefined') {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [data, delayMs, enabled, executeSave, setStatus]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const handleOnline = () => {
      if (state.status === 'offline' || state.status === 'error' || state.status === 'dirty') {
        void executeSave();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, executeSave, state.status]);

  return {
    state,
    retrySave: executeSave,
    setStatus,
  };
}

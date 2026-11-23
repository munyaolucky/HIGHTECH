import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { CreateToastInput, ToastItemData } from './toast.types';
import { ToastContainer } from './ToastContainer';

export interface ToastContextValue {
  toasts: ToastItemData[];
  toast: (input: CreateToastInput) => string;
  dismissToast: (id: string) => void;
  clearToasts: () => void;
  updateToast: (id: string, patch: Partial<CreateToastInput>) => void;
}

const DEFAULT_DURATIONS: Record<CreateToastInput['type'], number> = {
  success: 3500,
  saved: 2500,
  info: 4000,
  warning: 4500,
  error: 6000,
  saving: 0,
  loading: 0,
};

const MAX_VISIBLE_TOASTS = 5;

export const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const clearTimer = useCallback((id: string) => {
    const existing = timersRef.current.get(id);
    if (existing !== undefined && typeof window !== 'undefined') {
      window.clearTimeout(existing);
    }
    timersRef.current.delete(id);
  }, []);

  const dismissToast = useCallback(
    (id: string) => {
      clearTimer(id);
      setToasts((prev) => prev.filter((item) => item.id !== id));
    },
    [clearTimer]
  );

  const scheduleAutoDismiss = useCallback(
    (id: string, durationMs: number) => {
      clearTimer(id);
      if (durationMs > 0 && typeof window !== 'undefined') {
        const handle = window.setTimeout(() => {
          dismissToast(id);
        }, durationMs);
        timersRef.current.set(id, handle);
      }
    },
    [clearTimer, dismissToast]
  );

  const toast = useCallback(
    (input: CreateToastInput) => {
      const id =
        input.id || `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration =
        input.duration !== undefined ? input.duration : DEFAULT_DURATIONS[input.type];

      const nextItem: ToastItemData = {
        id,
        type: input.type,
        title: input.title,
        message: input.message,
        duration,
        dismissible: input.dismissible ?? true,
        action: input.action,
        createdAt: Date.now(),
      };

      setToasts((prev) => {
        const filtered = prev.filter((item) => item.id !== id);
        return [nextItem, ...filtered].slice(0, MAX_VISIBLE_TOASTS);
      });

      scheduleAutoDismiss(id, duration);
      return id;
    },
    [scheduleAutoDismiss]
  );

  const updateToast = useCallback(
    (id: string, patch: Partial<CreateToastInput>) => {
      setToasts((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const nextType = patch.type ?? item.type;
          const nextDuration =
            patch.duration !== undefined ? patch.duration : DEFAULT_DURATIONS[nextType];
          scheduleAutoDismiss(id, nextDuration);
          return {
            ...item,
            ...patch,
            type: nextType,
            duration: nextDuration,
          };
        })
      );
    },
    [scheduleAutoDismiss]
  );

  const clearToasts = useCallback(() => {
    for (const id of timersRef.current.keys()) {
      clearTimer(id);
    }
    setToasts([]);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        if (typeof window !== 'undefined') {
          window.clearTimeout(timer);
        }
      }
      timersRef.current.clear();
    };
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toasts,
      toast,
      dismissToast,
      clearToasts,
      updateToast,
    }),
    [toasts, toast, dismissToast, clearToasts, updateToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
}

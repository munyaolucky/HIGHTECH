import { useContext } from 'react';
import { ToastContext, type ToastContextValue } from './ToastProvider';

const NOOP_TOAST_VALUE: ToastContextValue = {
  toasts: [],
  toast: () => '',
  dismissToast: () => {},
  clearToasts: () => {},
  updateToast: () => {},
};

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  return ctx ?? NOOP_TOAST_VALUE;
}

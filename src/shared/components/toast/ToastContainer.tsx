import React from 'react';
import type { ToastItemData } from './toast.types';
import { ToastItem } from './ToastItem';

interface ToastContainerProps {
  toasts: ToastItemData[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Application notifications"
      className="pointer-events-none fixed bottom-4 right-4 left-4 sm:left-auto z-[90] w-auto sm:w-[360px] flex flex-col gap-2.5"
    >
      {toasts.map((item) => (
        <ToastItem key={item.id} toast={item} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

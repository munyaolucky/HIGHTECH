export type ToastType =
  | 'success'
  | 'error'
  | 'warning'
  | 'info'
  | 'saving'
  | 'saved'
  | 'loading';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastItemData {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
  createdAt: number;
}

export interface CreateToastInput {
  id?: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
  dismissible?: boolean;
  action?: ToastAction;
}

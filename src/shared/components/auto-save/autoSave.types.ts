export type AutoSaveStatus =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'offline'
  | 'error';

export interface AutoSaveState {
  status: AutoSaveStatus;
  lastSavedAt?: string;
  errorMessage?: string;
}

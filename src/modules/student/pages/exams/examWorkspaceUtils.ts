import {
  StudentAssessmentStatus,
  StudentPortalSection,
} from '../../../../services/studentPortalService';
import type { ExamSession } from '../../exams/secure/examTypes';

export interface ExamWorkspaceProps {
  onNavigate: (section: StudentPortalSection) => void;
  onNotify: (type: 'ok' | 'err', message: string) => void;
  onRefresh: () => void;
  onSwitchPortal?: (role: string) => void;
  onLaunchSecureExam?: (session: ExamSession) => void;
}

export function getStatusTextClasses(status: StudentAssessmentStatus): string {
  switch (status) {
    case 'Marked':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'Submitted':
      return 'text-[#1769AA] dark:text-blue-400';
    case 'In progress':
      return 'text-sky-700 dark:text-sky-400';
    case 'Overdue':
      return 'text-red-700 dark:text-red-400';
    case 'Upcoming':
      return 'text-slate-600 dark:text-slate-300';
    case 'Pending':
    default:
      return 'text-amber-700 dark:text-amber-400';
  }
}

export function formatCountdownLabel(deadlineIso: string): string {
  const target = new Date(deadlineIso).getTime();
  if (Number.isNaN(target)) return 'Scheduled';
  const diffMs = target - Date.now();
  if (diffMs < 0) {
    const overdueDays = Math.max(1, Math.floor(Math.abs(diffMs) / 86400000));
    return `${overdueDays}d overdue`;
  }
  const days = Math.floor(diffMs / 86400000);
  const hours = Math.floor((diffMs % 86400000) / 3600000);
  if (days >= 1) return `${days}d ${hours}h left`;
  const mins = Math.max(1, Math.floor((diffMs % 3600000) / 60000));
  return `${hours}h ${mins}m left`;
}

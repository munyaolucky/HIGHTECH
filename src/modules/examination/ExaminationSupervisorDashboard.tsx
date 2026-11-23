import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  MessageSquare,
  RefreshCw,
  RotateCcw,
  ScrollText,
  ShieldAlert,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import IncidentReviewModal, {
  formatSecurityEventLabel,
  type IncidentReviewItem,
  type IncidentSecurityEventItem,
} from './components/IncidentReviewModal';
import SupervisorMessagingPanel from './components/SupervisorMessagingPanel';
import { useExamMessaging } from '../student/exams/secure/useExamMessaging';
import { downloadCsv } from '../student/fees/feesApi';
import { useToast } from '../../shared/components/toast/useToast';

export interface SupervisorCandidateSession {
  id: string;
  examId: string;
  examTitle: string;
  unitCode: string;
  studentRegNo: string;
  studentName: string;
  attemptNumber: number;
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED' | 'TERMINATED';
  isDisconnected: boolean;
  startedAt: string;
  expiresAt: string;
  submittedAt: string | null;
  lastSavedAt: string | null;
  answeredCount: number;
  totalQuestions: number;
  securityEventCount: number;
  tabSwitchCount: number;
  fullscreenExitCount: number;
  openIncidentCount: number;
}

export interface SupervisorSecurityLogEntry extends IncidentSecurityEventItem {
  studentName?: string;
  studentRegNo?: string;
  examTitle?: string;
}

export interface SupervisorAuditLogEntry {
  id: string;
  sessionId?: string;
  examId?: string;
  actorId: string;
  actorName: string;
  action: string;
  detail: string;
  createdAt: string;
}

interface SupervisorDashboardState {
  counts: {
    total: number;
    active: number;
    disconnected: number;
    submitted: number;
    expired: number;
    openIncidents: number;
  };
  sessions: SupervisorCandidateSession[];
  incidents: IncidentReviewItem[];
  securityEvents: SupervisorSecurityLogEntry[];
  auditLogs: SupervisorAuditLogEntry[];
}

interface InspectedSessionDetail {
  session: {
    id: string;
    examId: string;
    studentName: string;
    studentRegNo: string;
    status: string;
    startedAt: string;
    expiresAt: string;
    answers: unknown[];
    timeAdjustments?: {
      id: string;
      additionalSeconds: number;
      reason: string;
      adjustedByName: string;
      createdAt: string;
    }[];
  };
  examTitle: string;
  unitCode: string;
  totalQuestions: number;
  events: IncidentSecurityEventItem[];
  incidents: IncidentReviewItem[];
  logs: SupervisorAuditLogEntry[];
}

interface ExaminationSupervisorDashboardProps {
  onNotify?: (type: 'ok' | 'err', message: string) => void;
}

function createInitialSupervisorState(): SupervisorDashboardState {
  const now = Date.now();
  return {
    counts: {
      total: 3,
      active: 2,
      disconnected: 0,
      submitted: 1,
      expired: 0,
      openIncidents: 1,
    },
    sessions: [
      {
        id: 'EXAM-SESSION-001',
        examId: 'sec-exam-net-cat',
        examTitle: 'Computer Networking CAT',
        unitCode: 'ICT 204',
        studentRegNo: 'HCA/STU/2026/014',
        studentName: 'Brian Kipkorir',
        attemptNumber: 1,
        status: 'ACTIVE',
        isDisconnected: false,
        startedAt: new Date(now - 35 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 25 * 60 * 1000).toISOString(),
        submittedAt: null,
        lastSavedAt: new Date(now - 90 * 1000).toISOString(),
        answeredCount: 3,
        totalQuestions: 5,
        securityEventCount: 3,
        tabSwitchCount: 1,
        fullscreenExitCount: 1,
        openIncidentCount: 1,
      },
      {
        id: 'EXAM-SESSION-003',
        examId: 'sec-exam-net-cat',
        examTitle: 'Computer Networking CAT',
        unitCode: 'ICT 204',
        studentRegNo: 'HCA/STU/2026/025',
        studentName: 'Mercy Nyambura',
        attemptNumber: 1,
        status: 'ACTIVE',
        isDisconnected: false,
        startedAt: new Date(now - 22 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 38 * 60 * 1000).toISOString(),
        submittedAt: null,
        lastSavedAt: new Date(now - 30 * 1000).toISOString(),
        answeredCount: 4,
        totalQuestions: 5,
        securityEventCount: 0,
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        openIncidentCount: 0,
      },
      {
        id: 'EXAM-SESSION-002',
        examId: 'sec-exam-csc301',
        examTitle: 'CSC 301 Data Structures & Algorithms CBT',
        unitCode: 'CSC 301',
        studentRegNo: 'HCA/STU/2026/001',
        studentName: 'Amina Wanjiku',
        attemptNumber: 1,
        status: 'SUBMITTED',
        isDisconnected: false,
        startedAt: new Date(now - 90 * 60 * 1000).toISOString(),
        expiresAt: new Date(now - 45 * 60 * 1000).toISOString(),
        submittedAt: new Date(now - 48 * 60 * 1000).toISOString(),
        lastSavedAt: new Date(now - 48 * 60 * 1000).toISOString(),
        answeredCount: 3,
        totalQuestions: 3,
        securityEventCount: 0,
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        openIncidentCount: 0,
      },
    ],
    incidents: [
      {
        id: 'INC-2026-001',
        sessionId: 'EXAM-SESSION-001',
        examId: 'sec-exam-net-cat',
        examTitle: 'Computer Networking CAT',
        studentId: 'stu-sample-002',
        studentRegNo: 'HCA/STU/2026/014',
        studentName: 'Brian Kipkorir',
        status: 'UNDER_REVIEW',
        severity: 'MEDIUM',
        summary:
          'Multiple focus/fullscreen interruptions and blocked clipboard copy attempt recorded.',
        eventCount: 3,
        createdAt: new Date(now - 11 * 60 * 1000).toISOString(),
        updatedAt: new Date(now - 8 * 60 * 1000).toISOString(),
      },
    ],
    securityEvents: [
      {
        id: 'sec-ev-003',
        sessionId: 'EXAM-SESSION-001',
        studentName: 'Brian Kipkorir',
        studentRegNo: 'HCA/STU/2026/014',
        examTitle: 'Computer Networking CAT',
        eventType: 'COPY_ATTEMPT',
        occurredAt: new Date(now - 8 * 60 * 1000).toISOString(),
        receivedAt: new Date(now - 8 * 60 * 1000).toISOString(),
        details: 'Clipboard copy blocked inside exam workspace.',
        responseTriggered: 'BLOCK_AND_LOG',
      },
      {
        id: 'sec-ev-002',
        sessionId: 'EXAM-SESSION-001',
        studentName: 'Brian Kipkorir',
        studentRegNo: 'HCA/STU/2026/014',
        examTitle: 'Computer Networking CAT',
        eventType: 'FULLSCREEN_EXIT',
        occurredAt: new Date(now - 11 * 60 * 1000).toISOString(),
        receivedAt: new Date(now - 11 * 60 * 1000).toISOString(),
        details: 'Browser exited fullscreen during active session.',
        responseTriggered: 'WARNING_AND_LOG',
      },
      {
        id: 'sec-ev-001',
        sessionId: 'EXAM-SESSION-001',
        studentName: 'Brian Kipkorir',
        studentRegNo: 'HCA/STU/2026/014',
        examTitle: 'Computer Networking CAT',
        eventType: 'TAB_HIDDEN',
        occurredAt: new Date(now - 12 * 60 * 1000).toISOString(),
        receivedAt: new Date(now - 12 * 60 * 1000).toISOString(),
        details: 'Candidate tab visibility changed to hidden.',
        responseTriggered: 'WARNING',
      },
    ],
    auditLogs: [
      {
        id: 'AUD-SEED-001',
        sessionId: 'EXAM-SESSION-001',
        examId: 'sec-exam-net-cat',
        actorId: 'usr-exam-01',
        actorName: 'Dr. Kiprop Chemweno',
        action: 'SESSION_PROCTORING_STARTED',
        detail: 'Live proctoring telemetry started for Computer Networking CAT cohort.',
        createdAt: new Date(now - 35 * 60 * 1000).toISOString(),
      },
    ],
  };
}

export default function ExaminationSupervisorDashboard({
  onNotify,
}: ExaminationSupervisorDashboardProps) {
  const { toast } = useToast();
  const [data, setData] = useState<SupervisorDashboardState>(() => createInitialSupervisorState());
  const [serverConnected, setServerConnected] = useState(false);
  const [sseStatus, setSseStatus] = useState<'connecting' | 'live' | 'polling'>('polling');
  const [loading, setLoading] = useState(false);
  const [autoPoll, setAutoPoll] = useState(true);
  const [lastUpdatedIso, setLastUpdatedIso] = useState(() => new Date().toISOString());

  const [viewMode, setViewMode] = useState<'live' | 'reports' | 'audit'>('live');

  const [sessionFilter, setSessionFilter] = useState<
    'ALL' | 'ACTIVE' | 'DISCONNECTED' | 'SUBMITTED' | 'EXPIRED'
  >('ALL');
  const [candidateSearch, setCandidateSearch] = useState('');

  const [logEventFilter, setLogEventFilter] = useState<
    'ALL' | 'TAB_HIDDEN' | 'FULLSCREEN_EXIT' | 'CLIPBOARD' | 'CONNECTION'
  >('ALL');
  const [logSearch, setLogSearch] = useState('');

  const [activeIncident, setActiveIncident] = useState<IncidentReviewItem | null>(null);
  const [interveneTarget, setInterveneTarget] = useState<SupervisorCandidateSession | null>(null);
  const [interveneReason, setInterveneReason] = useState('');

  // Phase 10B Candidate Inspection + Extend Time / Restore Modal State
  const [inspectTarget, setInspectTarget] = useState<SupervisorCandidateSession | null>(null);
  const [inspectDetail, setInspectDetail] = useState<InspectedSessionDetail | null>(null);
  const [extendMinutes, setExtendMinutes] = useState(10);
  const [controlReason, setControlReason] = useState('');
  const [controlBusy, setControlBusy] = useState(false);

  const [selectedChatSessionId, setSelectedChatSessionId] = useState('EXAM-SESSION-001');
  const messagingPanelRef = useRef<HTMLDivElement | null>(null);

  const messaging = useExamMessaging({
    role: 'supervisor',
    enabled: true,
  });

  const notifySupervisor = useCallback(
    (type: 'ok' | 'err', msg: string) => {
      onNotify?.(type, msg);
      toast({
        type: type === 'ok' ? 'success' : 'error',
        title: type === 'ok' ? 'Supervisor Control' : 'Control Error',
        message: msg,
      });
    },
    [onNotify, toast]
  );

  const fetchOverview = useCallback(async () => {
    if (typeof fetch !== 'function') return;
    setLoading(true);
    try {
      const res = await fetch('/api/exams/supervisor/sessions', { credentials: 'include' });
      if (!res.ok) {
        setServerConnected(false);
        return;
      }
      const payload = (await res.json()) as {
        success?: boolean;
        data?: {
          counts: SupervisorDashboardState['counts'];
          sessions: SupervisorCandidateSession[];
          incidents: IncidentReviewItem[];
          securityEvents?: SupervisorSecurityLogEntry[];
          auditLogs?: SupervisorAuditLogEntry[];
        };
      };
      if (payload.success && payload.data) {
        setData({
          counts: payload.data.counts,
          sessions: payload.data.sessions,
          incidents: payload.data.incidents,
          securityEvents: payload.data.securityEvents ?? [],
          auditLogs: payload.data.auditLogs ?? [],
        });
        setServerConnected(true);
        setLastUpdatedIso(new Date().toISOString());
      }
    } catch {
      setServerConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  // SSE Live Event Stream Subscription (Phase 10B)
  useEffect(() => {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined' || !autoPoll) {
      setSseStatus('polling');
      return;
    }

    let source: EventSource | null = null;
    try {
      setSseStatus('connecting');
      source = new EventSource('/api/exams/supervisor/events', { withCredentials: true });
      const handleLiveUpdate = () => {
        setSseStatus('live');
        void fetchOverview();
      };
      source.onopen = () => setSseStatus('live');
      source.addEventListener('connected', () => setSseStatus('live'));
      source.addEventListener('candidate.started', handleLiveUpdate);
      source.addEventListener('candidate.submitted', handleLiveUpdate);
      source.addEventListener('candidate.expired', handleLiveUpdate);
      source.addEventListener('candidate.disconnected', handleLiveUpdate);
      source.addEventListener('candidate.reconnected', handleLiveUpdate);
      source.addEventListener('incident.created', handleLiveUpdate);
      source.addEventListener('supervisor.action', handleLiveUpdate);
      source.onerror = () => {
        setSseStatus('polling');
      };
    } catch {
      setSseStatus('polling');
    }

    return () => {
      source?.close();
    };
  }, [autoPoll, fetchOverview]);

  useEffect(() => {
    if (!autoPoll) return;
    const id = window.setInterval(() => {
      void fetchOverview();
    }, 15_000);
    return () => window.clearInterval(id);
  }, [autoPoll, fetchOverview]);

  const openInspectModal = async (session: SupervisorCandidateSession) => {
    setInspectTarget(session);
    setControlReason('');
    setExtendMinutes(10);
    setInspectDetail({
      session: {
        id: session.id,
        examId: session.examId,
        studentName: session.studentName,
        studentRegNo: session.studentRegNo,
        status: session.status,
        startedAt: session.startedAt,
        expiresAt: session.expiresAt,
        answers: [],
      },
      examTitle: session.examTitle,
      unitCode: session.unitCode,
      totalQuestions: session.totalQuestions,
      events: data.securityEvents.filter((e) => e.sessionId === session.id),
      incidents: data.incidents.filter((i) => i.sessionId === session.id),
      logs: data.auditLogs.filter((l) => l.sessionId === session.id),
    });

    if (serverConnected && typeof fetch === 'function') {
      try {
        const res = await fetch(
          `/api/exams/supervisor/sessions/${encodeURIComponent(session.id)}`,
          { credentials: 'include' }
        );
        const payload = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          data?: InspectedSessionDetail;
        };
        if (res.ok && payload.success && payload.data) {
          setInspectDetail(payload.data);
        }
      } catch {
        // retain overview fallback detail
      }
    }
  };

  const handleExtendTime = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectTarget) return;
    const reason = controlReason.trim();
    if (reason.length < 5) {
      notifySupervisor('err', 'Provide a justification for extending exam time (min 5 characters).');
      return;
    }

    const additionalSeconds = extendMinutes * 60;
    setControlBusy(true);
    try {
      if (serverConnected && typeof fetch === 'function') {
        const res = await fetch(
          `/api/exams/supervisor/sessions/${encodeURIComponent(inspectTarget.id)}/extend-time`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ additionalSeconds, reason }),
          }
        );
        const payload = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || 'Time extension failed.');
        }
        await fetchOverview();
        await openInspectModal(inspectTarget);
      } else {
        const newExpiry = new Date(
          Math.max(Date.now(), new Date(inspectTarget.expiresAt).getTime()) +
            additionalSeconds * 1000
        ).toISOString();
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === inspectTarget.id ? { ...s, expiresAt: newExpiry, status: 'ACTIVE' } : s
          ),
          auditLogs: [
            {
              id: `AUD-${Date.now()}`,
              sessionId: inspectTarget.id,
              examId: inspectTarget.examId,
              actorId: 'supervisor-preview',
              actorName: 'Examination Supervisor',
              action: 'SUPERVISOR_EXTEND_TIME',
              detail: `Extended time by +${extendMinutes} min(s). Reason: ${reason}`,
              createdAt: new Date().toISOString(),
            },
            ...prev.auditLogs,
          ],
        }));
      }
      notifySupervisor(
        'ok',
        `Extended ${inspectTarget.studentName}'s exam time by +${extendMinutes} minutes.`
      );
      setControlReason('');
    } catch (err) {
      notifySupervisor('err', err instanceof Error ? err.message : 'Unable to extend time.');
    } finally {
      setControlBusy(false);
    }
  };

  const handleRestoreSession = async () => {
    if (!inspectTarget) return;
    const reason = controlReason.trim();
    if (reason.length < 5) {
      notifySupervisor('err', 'Provide a reason for restoring this session (min 5 characters).');
      return;
    }

    setControlBusy(true);
    try {
      if (serverConnected && typeof fetch === 'function') {
        const res = await fetch(
          `/api/exams/supervisor/sessions/${encodeURIComponent(inspectTarget.id)}/restore`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason, graceSeconds: 600 }),
          }
        );
        const payload = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !payload.success) {
          throw new Error(payload.error || 'Session restoration failed.');
        }
        await fetchOverview();
        await openInspectModal(inspectTarget);
      } else {
        setData((prev) => ({
          ...prev,
          sessions: prev.sessions.map((s) =>
            s.id === inspectTarget.id
              ? { ...s, status: 'ACTIVE', isDisconnected: false }
              : s
          ),
        }));
      }
      notifySupervisor('ok', `Restored session ${inspectTarget.id} to ACTIVE.`);
      setControlReason('');
    } catch (err) {
      notifySupervisor('err', err instanceof Error ? err.message : 'Unable to restore session.');
    } finally {
      setControlBusy(false);
    }
  };

  const filteredSessions = useMemo(() => {
    const q = candidateSearch.trim().toLowerCase();
    return data.sessions.filter((s) => {
      if (sessionFilter === 'ACTIVE' && (s.status !== 'ACTIVE' || s.isDisconnected)) return false;
      if (sessionFilter === 'DISCONNECTED' && !s.isDisconnected) return false;
      if (sessionFilter === 'SUBMITTED' && s.status !== 'SUBMITTED') return false;
      if (
        sessionFilter === 'EXPIRED' &&
        s.status !== 'EXPIRED' &&
        s.status !== 'TERMINATED'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        s.studentName.toLowerCase().includes(q) ||
        s.studentRegNo.toLowerCase().includes(q) ||
        s.examTitle.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
      );
    });
  }, [data.sessions, candidateSearch, sessionFilter]);

  const filteredSecurityLogs = useMemo(() => {
    const q = logSearch.trim().toLowerCase();
    return data.securityEvents.filter((ev) => {
      if (
        logEventFilter === 'TAB_HIDDEN' &&
        ev.eventType !== 'TAB_HIDDEN' &&
        ev.eventType !== 'WINDOW_BLUR'
      ) {
        return false;
      }
      if (logEventFilter === 'FULLSCREEN_EXIT' && ev.eventType !== 'FULLSCREEN_EXIT') {
        return false;
      }
      if (
        logEventFilter === 'CLIPBOARD' &&
        ![
          'COPY_ATTEMPT',
          'PASTE_ATTEMPT',
          'CUT_ATTEMPT',
          'CONTEXT_MENU',
          'PROHIBITED_SHORTCUT',
          'DRAG_ATTEMPT',
        ].includes(ev.eventType)
      ) {
        return false;
      }
      if (
        logEventFilter === 'CONNECTION' &&
        ev.eventType !== 'CONNECTION_LOST' &&
        ev.eventType !== 'CONNECTION_RESTORED'
      ) {
        return false;
      }
      if (!q) return true;
      return (
        (ev.studentName ?? '').toLowerCase().includes(q) ||
        (ev.studentRegNo ?? '').toLowerCase().includes(q) ||
        ev.sessionId.toLowerCase().includes(q) ||
        ev.eventType.toLowerCase().includes(q) ||
        (ev.details ?? '').toLowerCase().includes(q)
      );
    });
  }, [data.securityEvents, logEventFilter, logSearch]);

  const handleIntervene = async (action: 'FORCE_SUBMIT' | 'TERMINATE') => {
    if (!interveneTarget) return;
    const reason = interveneReason.trim();
    if (reason.length < 5) {
      notifySupervisor('err', 'Provide a supervisor intervention reason (minimum 5 characters).');
      return;
    }

    if (serverConnected && typeof fetch === 'function') {
      try {
        const res = await fetch(
          `/api/exams/supervisor/sessions/${encodeURIComponent(interveneTarget.id)}/intervene`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, reason }),
          }
        );
        const payload = (await res.json().catch(() => ({}))) as {
          success?: boolean;
          error?: string;
        };
        if (!res.ok || !payload.success) {
          notifySupervisor('err', payload.error ?? 'Supervisor intervention failed.');
          return;
        }
        notifySupervisor('ok', `Session ${interveneTarget.id} updated (${action.replace('_', ' ')}).`);
        setInterveneTarget(null);
        setInterveneReason('');
        await fetchOverview();
        return;
      } catch {
        // Fallback below
      }
    }

    const nextStatus = action === 'FORCE_SUBMIT' ? 'SUBMITTED' : 'TERMINATED';
    setData((prev) => {
      const nextSessions = prev.sessions.map((s) =>
        s.id === interveneTarget.id
          ? { ...s, status: nextStatus as SupervisorCandidateSession['status'] }
          : s
      );
      return {
        ...prev,
        sessions: nextSessions,
        counts: {
          ...prev.counts,
          active: nextSessions.filter((s) => s.status === 'ACTIVE' && !s.isDisconnected).length,
          submitted: nextSessions.filter((s) => s.status === 'SUBMITTED').length,
          expired: nextSessions.filter(
            (s) => s.status === 'EXPIRED' || s.status === 'TERMINATED'
          ).length,
        },
      };
    });
    notifySupervisor('ok', `Session ${interveneTarget.id} marked ${nextStatus}.`);
    setInterveneTarget(null);
    setInterveneReason('');
  };

  const handleExportAttendanceCsv = () => {
    downloadCsv(
      `Exam_Attendance_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      [
        'Session ID',
        'Student Name',
        'Reg No',
        'Unit Code',
        'Exam Title',
        'Status',
        'Answered',
        'Total Questions',
        'Tab Switches',
        'Fullscreen Exits',
        'Open Incidents',
      ],
      data.sessions.map((s) => [
        s.id,
        s.studentName,
        s.studentRegNo,
        s.unitCode,
        s.examTitle,
        s.status,
        s.answeredCount,
        s.totalQuestions,
        s.tabSwitchCount,
        s.fullscreenExitCount,
        s.openIncidentCount,
      ])
    );
    notifySupervisor('ok', 'Examination attendance CSV report exported.');
  };

  const handleExportSecurityCsv = () => {
    downloadCsv(
      `Exam_Security_Report_${new Date().toISOString().slice(0, 10)}.csv`,
      ['Incident ID', 'Session ID', 'Student Name', 'Reg No', 'Exam', 'Severity', 'Status', 'Events', 'Summary'],
      data.incidents.map((inc) => [
        inc.id,
        inc.sessionId,
        inc.studentName,
        inc.studentRegNo,
        inc.examTitle,
        inc.severity,
        inc.status,
        inc.eventCount,
        inc.summary,
      ])
    );
    notifySupervisor('ok', 'Examination security incidents CSV report exported.');
  };

  return (
    <div className="space-y-6">
      {/* REAL-TIME STATUS WIDGETS HEADER */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Examination Supervisor Dashboard · Real-Time Proctoring &amp; Telemetry
            </p>
            <h2 className="text-xl font-bold text-[#092c60] tracking-tight">
              Active Exam Sessions &amp; Security Log Monitor
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0 text-xs">
            <span className="font-mono tabular-nums text-slate-500">
              Updated {new Date(lastUpdatedIso).toLocaleTimeString()} ·{' '}
              {sseStatus === 'live' ? 'SSE Stream Live' : 'Polling 15s'}
            </span>
            <button
              type="button"
              onClick={() => setAutoPoll((p) => !p)}
              className={`min-h-[38px] px-3.5 py-2 rounded-lg border font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                autoPoll
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                  : 'border-slate-200 bg-white text-slate-700'
              }`}
            >
              <Activity size={14} aria-hidden="true" />
              <span>{autoPoll ? 'Live Sync: On (SSE/15s)' : 'Live Sync: Paused'}</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => void fetchOverview()}
              className="min-h-[38px] px-3.5 py-2 rounded-lg bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <RefreshCw size={14} aria-hidden="true" />
              <span>{loading ? 'Syncing…' : 'Refresh Now'}</span>
            </button>
          </div>
        </div>

        {/* Status Widgets Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-slate-200 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-600 block">Active Sessions</span>
            <strong className="text-2xl font-bold text-emerald-700 font-mono tabular-nums mt-1 block">
              {data.counts.active}
            </strong>
            <span className="text-[11px] text-slate-500">Connected &amp; in progress</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-600 block">Disconnected</span>
            <strong className="text-2xl font-bold text-amber-700 font-mono tabular-nums mt-1 block">
              {data.counts.disconnected}
            </strong>
            <span className="text-[11px] text-slate-500">Heartbeat interrupted</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-600 block">Submitted</span>
            <strong className="text-2xl font-bold text-[#1769AA] font-mono tabular-nums mt-1 block">
              {data.counts.submitted}
            </strong>
            <span className="text-[11px] text-slate-500">Scripts finalized</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-600 block">Expired / Terminated</span>
            <strong className="text-2xl font-bold text-slate-900 font-mono tabular-nums mt-1 block">
              {data.counts.expired}
            </strong>
            <span className="text-[11px] text-slate-500">Closed by timer or supervisor</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-600 block">Open Incidents</span>
            <strong className="text-2xl font-bold text-red-700 font-mono tabular-nums mt-1 block">
              {data.counts.openIncidents}
            </strong>
            <span className="text-[11px] text-slate-500">Awaiting supervisor action</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-600 block">Help Requests</span>
            <strong className="text-2xl font-bold text-[#1769AA] font-mono tabular-nums mt-1 block">
              {messaging.unreadCount}
            </strong>
            <span className="text-[11px] text-slate-500">Unread student messages</span>
          </div>
        </div>

        {/* Phase 10B View Switcher */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-200 text-xs">
          {(
            [
              ['live', 'Live Sessions, Incidents & Logs'],
              ['reports', 'Attendance & Security Reports (CSV)'],
              ['audit', `Supervisor Audit Trail (${data.auditLogs.length})`],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setViewMode(key)}
              className={`px-3.5 py-2 rounded-lg font-semibold border transition-colors ${
                viewMode === key
                  ? 'bg-[#092c60] text-white border-[#092c60]'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* VIEW: LIVE OPERATIONS */}
      {viewMode === 'live' && (
        <>
          {/* CANDIDATES CURRENTLY TAKING THE EXAM + CONNECTION STATUS */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Students Taking Exam &amp; Connection Status
                </h3>
                <p className="text-xs text-slate-500">
                  Monitor candidate heartbeat status, extend time or restore sessions, and intervene if required.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg">
                  {(['ALL', 'ACTIVE', 'DISCONNECTED', 'SUBMITTED', 'EXPIRED'] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setSessionFilter(tab)}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap ${
                          sessionFilter === tab
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>

                <input
                  type="text"
                  value={candidateSearch}
                  onChange={(e) => setCandidateSearch(e.target.value)}
                  placeholder="Search student or reg no..."
                  aria-label="Search active exam candidates"
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56"
                />
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Student</th>
                    <th className="py-2.5 px-4 font-semibold">Examination</th>
                    <th className="py-2.5 px-4 font-semibold">Connection Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Progress</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Tab / FS Events</th>
                    <th className="py-2.5 px-4 font-semibold">Last Saved</th>
                    <th className="py-2.5 px-4 font-semibold">Session State</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSessions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 px-4 text-center text-slate-500">
                        No candidate sessions match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredSessions.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{s.studentName}</div>
                          <div className="font-mono text-slate-500">{s.studentRegNo}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-800">{s.examTitle}</div>
                          <div className="font-mono text-slate-500">
                            {s.unitCode} · {s.id}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {s.status !== 'ACTIVE' ? (
                            <span className="text-slate-600 font-medium">Session Closed</span>
                          ) : s.isDisconnected ? (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-amber-700">
                              <WifiOff size={13} aria-hidden="true" />
                              <span>Disconnected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
                              <Wifi size={13} aria-hidden="true" />
                              <span>Connected</span>
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                          {s.answeredCount} / {s.totalQuestions}
                        </td>
                        <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700">
                          {s.tabSwitchCount} / {s.fullscreenExitCount}
                        </td>
                        <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                          {s.lastSavedAt ? new Date(s.lastSavedAt).toLocaleTimeString() : '—'}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          <span
                            className={
                              s.status === 'ACTIVE'
                                ? 'text-emerald-700'
                                : s.status === 'SUBMITTED'
                                ? 'text-[#1769AA]'
                                : 'text-red-700'
                            }
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => void openInspectModal(s)}
                              className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 font-semibold text-slate-800 inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <Clock size={12} aria-hidden="true" />
                              <span>Inspect / Time</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedChatSessionId(s.id);
                                void messaging.markSessionRead(s.id);
                                messagingPanelRef.current?.scrollIntoView({
                                  behavior: 'smooth',
                                  block: 'nearest',
                                });
                              }}
                              className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 font-semibold text-[#092c60] inline-flex items-center gap-1 whitespace-nowrap"
                            >
                              <MessageSquare size={12} aria-hidden="true" />
                              <span>Message</span>
                            </button>
                            {s.status === 'ACTIVE' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setInterveneTarget(s);
                                  setInterveneReason('');
                                }}
                                className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-800 whitespace-nowrap"
                              >
                                Intervene
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {interveneTarget && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900">
                    Supervisor Intervention: {interveneTarget.studentName} ({interveneTarget.id})
                  </strong>
                  <button
                    type="button"
                    onClick={() => setInterveneTarget(null)}
                    className="text-slate-600 hover:text-slate-900 font-semibold"
                  >
                    Close
                  </button>
                </div>
                <input
                  type="text"
                  value={interveneReason}
                  onChange={(e) => setInterveneReason(e.target.value)}
                  placeholder="Mandatory reason for Force Submit or Terminate (min 5 characters)..."
                  aria-label="Supervisor intervention reason"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleIntervene('FORCE_SUBMIT')}
                    className="px-3.5 py-2 rounded-lg bg-[#092c60] hover:bg-[#1769AA] text-white font-semibold"
                  >
                    Force Submit
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleIntervene('TERMINATE')}
                    className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold"
                  >
                    Terminate Session
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* REAL-TIME CANDIDATE HELP DESK & SUPERVISOR INSTRUCTIONS */}
          <div ref={messagingPanelRef}>
            <SupervisorMessagingPanel
              sessions={data.sessions}
              messages={messaging.messages}
              connectionState={messaging.connectionState}
              sending={messaging.sending}
              errorMessage={messaging.errorMessage}
              selectedSessionId={selectedChatSessionId}
              onSelectSession={(id) => setSelectedChatSessionId(id)}
              onSendInstruction={async (input) => {
                const sent = await messaging.sendMessage({
                  sessionId: input.sessionId,
                  body: input.body,
                  priority: input.priority,
                  kind: 'SUPERVISOR_INSTRUCTION',
                  targetStudentName: input.targetStudentName,
                  targetStudentRegNo: input.targetStudentRegNo,
                  targetExamTitle: input.targetExamTitle,
                });
                if (sent) {
                  notifySupervisor(
                    'ok',
                    `Direct instruction sent to ${input.targetStudentName ?? 'candidate'}.`
                  );
                }
              }}
              onBroadcastInstruction={async (input) => {
                const created = await messaging.broadcastInstruction(input);
                if (created.length > 0) {
                  notifySupervisor(
                    'ok',
                    `Instruction broadcast to ${created.length} active candidate(s).`
                  );
                }
              }}
              onMarkSessionRead={(sessionId) => void messaging.markSessionRead(sessionId)}
            />
          </div>

          {/* DEDICATED SECURITY LOG VIEWER & INCIDENT REPORTS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Incident Reports List (opens IncidentReviewModal) */}
            <section className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-600" aria-hidden="true" />
                  <span>Incident Reports Queue</span>
                </h3>
                <span className="font-mono tabular-nums text-xs text-slate-500">
                  {data.incidents.length} report(s)
                </span>
              </div>

              {data.incidents.length === 0 ? (
                <p className="text-xs text-slate-500">No incident reports flagged.</p>
              ) : (
                <div className="divide-y divide-slate-200 text-xs">
                  {data.incidents.map((inc) => (
                    <div key={inc.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                        <span className="font-bold text-[#092c60]">
                          {inc.id} · {inc.severity}
                        </span>
                        <span
                          className={`font-bold ${
                            inc.status === 'DISMISSED'
                              ? 'text-slate-600'
                              : inc.status === 'CONFIRMED'
                              ? 'text-red-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {inc.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="font-semibold text-slate-900">
                        {inc.studentName} ({inc.studentRegNo})
                      </p>
                      <p className="text-slate-600">{inc.summary}</p>
                      {inc.reviewerNotes && (
                        <p className="text-slate-700">
                          Notes: <strong>{inc.reviewerNotes}</strong>
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setActiveIncident(inc)}
                        className="px-3 py-1.5 rounded-lg bg-[#092c60] hover:bg-[#1769AA] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                      >
                        <Eye size={13} aria-hidden="true" />
                        <span>Review Incident</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Dedicated Security Log Viewer */}
            <section className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ScrollText size={16} className="text-[#1769AA]" aria-hidden="true" />
                    <span>Dedicated Security Log Viewer</span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Server-timestamped focus, fullscreen, clipboard, and connection telemetry.
                  </p>
                </div>
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter security logs..."
                  aria-label="Filter security logs"
                  className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg w-full sm:w-48"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
                {(
                  [
                    ['ALL', 'All Events'],
                    ['TAB_HIDDEN', 'Tab / Focus'],
                    ['FULLSCREEN_EXIT', 'Fullscreen'],
                    ['CLIPBOARD', 'Clipboard / Shortcuts'],
                    ['CONNECTION', 'Connection'],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setLogEventFilter(key)}
                    className={`px-2.5 py-1 rounded-md font-semibold whitespace-nowrap ${
                      logEventFilter === key
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3.5 font-semibold">Time</th>
                      <th className="py-2 px-3.5 font-semibold">Candidate</th>
                      <th className="py-2 px-3.5 font-semibold">Security Event</th>
                      <th className="py-2 px-3.5 font-semibold">Automated Action</th>
                      <th className="py-2 px-3.5 font-semibold text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSecurityLogs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 px-4 text-center text-slate-500">
                          No security log entries match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredSecurityLogs.map((ev) => {
                        const matchedIncident = data.incidents.find(
                          (i) => i.sessionId === ev.sessionId
                        );
                        return (
                          <tr key={ev.id} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3.5 font-mono tabular-nums text-slate-600 whitespace-nowrap">
                              {new Date(ev.receivedAt).toLocaleTimeString()}
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-semibold text-slate-900">
                                {ev.studentName ?? 'Candidate'}
                              </div>
                              <div className="font-mono text-slate-500">
                                {ev.studentRegNo ?? ev.sessionId}
                              </div>
                            </td>
                            <td className="py-2.5 px-3.5">
                              <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                                <ShieldAlert
                                  size={13}
                                  className="text-amber-600 shrink-0"
                                  aria-hidden="true"
                                />
                                <span>{formatSecurityEventLabel(ev.eventType)}</span>
                              </div>
                              {ev.details && (
                                <div className="text-slate-600 truncate max-w-[260px]">
                                  {ev.details}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3.5 font-mono text-[11px] text-[#1769AA] whitespace-nowrap">
                              {ev.responseTriggered.replace(/_/g, ' ')}
                            </td>
                            <td className="py-2.5 px-3.5 text-right">
                              {matchedIncident ? (
                                <button
                                  type="button"
                                  onClick={() => setActiveIncident(matchedIncident)}
                                  className="px-2.5 py-1 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-800 whitespace-nowrap"
                                >
                                  Review
                                </button>
                              ) : (
                                <span className="font-mono text-slate-400">Logged</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </>
      )}

      {/* VIEW: REPORTS & CSV EXPORT */}
      {viewMode === 'reports' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileSpreadsheet size={16} className="text-[#1769AA]" aria-hidden="true" />
                <span>Attendance &amp; Security Telemetry Reports</span>
              </h3>
              <p className="text-slate-500 mt-0.5">
                Export formula-safe CSV attendance registers and flagged proctoring summaries.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExportAttendanceCsv}
                className="px-3.5 py-2 bg-[#092c60] hover:bg-[#1769AA] text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Download size={14} aria-hidden="true" />
                <span>Export Attendance CSV</span>
              </button>
              <button
                type="button"
                onClick={handleExportSecurityCsv}
                className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-lg inline-flex items-center gap-1.5"
              >
                <Download size={14} aria-hidden="true" />
                <span>Export Security CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Candidate</th>
                  <th className="py-2.5 px-4 font-semibold">Examination</th>
                  <th className="py-2.5 px-4 font-semibold">Started</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Answered</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Security Events</th>
                  <th className="py-2.5 px-4 font-semibold">Final Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sessions.map((s) => (
                  <tr key={s.id}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      {s.studentName} ({s.studentRegNo})
                    </td>
                    <td className="py-2.5 px-4 text-slate-700">{s.examTitle}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-500">
                      {new Date(s.startedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">
                      {s.answeredCount}/{s.totalQuestions}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono">{s.securityEventCount}</td>
                    <td className="py-2.5 px-4 font-semibold">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* VIEW: AUDIT TRAIL */}
      {viewMode === 'audit' && (
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Supervisor Control &amp; Incident Audit Trail
            </h3>
            <p className="text-slate-500">
              Chronological log of time extensions, session restorations, forced submissions, and incident reviews.
            </p>
          </div>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl">
            {data.auditLogs.length === 0 ? (
              <p className="p-6 text-center text-slate-500">No supervisor audit entries recorded yet.</p>
            ) : (
              data.auditLogs.map((log) => (
                <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <strong className="font-mono text-[#092c60]">{log.action}</strong>
                    <p className="text-slate-700 mt-0.5">{log.detail}</p>
                    <span className="text-slate-500">
                      Actor: {log.actorName}
                      {log.sessionId ? ` · Session ${log.sessionId}` : ''}
                    </span>
                  </div>
                  <span className="font-mono text-slate-500 shrink-0">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* Candidate Inspection & Time Control Modal (Phase 10B) */}
      {inspectTarget && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Inspect Candidate Session and Time Control"
          className="fixed inset-0 z-50 bg-slate-950/55 flex items-center justify-center p-4"
        >
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 space-y-5 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-3">
              <div>
                <span className="font-mono text-[11px] font-bold text-[#1769AA] block">
                  {inspectTarget.id} · {inspectTarget.unitCode}
                </span>
                <h3 className="text-base font-bold text-[#092c60]">
                  Candidate Control: {inspectTarget.studentName} ({inspectTarget.studentRegNo})
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Current expiry: {new Date(inspectTarget.expiresAt).toLocaleTimeString()} · State:{' '}
                  <strong>{inspectTarget.status}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectTarget(null)}
                aria-label="Close session inspector"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExtendTime} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <strong className="text-slate-900 block">
                Extend Time / Restore Candidate Session
              </strong>
              <div className="flex flex-wrap gap-2">
                {[5, 10, 15, 30].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setExtendMinutes(mins)}
                    className={`px-3 py-1.5 rounded-lg font-mono font-semibold border ${
                      extendMinutes === mins
                        ? 'bg-[#092c60] text-white border-[#092c60]'
                        : 'bg-white text-slate-800 border-slate-300'
                    }`}
                  >
                    +{mins} min
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                value={controlReason}
                onChange={(e) => setControlReason(e.target.value)}
                placeholder="Mandatory justification (e.g. Lab workstation reboot verified)..."
                aria-label="Session time control justification"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={controlBusy}
                  className="px-3.5 py-2 rounded-lg bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold inline-flex items-center gap-1.5"
                >
                  <Clock size={13} aria-hidden="true" />
                  <span>Apply +{extendMinutes} Min Extension</span>
                </button>
                <button
                  type="button"
                  disabled={controlBusy || inspectTarget.status === 'SUBMITTED'}
                  onClick={() => void handleRestoreSession()}
                  className="px-3.5 py-2 rounded-lg border border-emerald-600 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 font-semibold inline-flex items-center gap-1.5"
                >
                  <RotateCcw size={13} aria-hidden="true" />
                  <span>Restore Interrupted Session</span>
                </button>
              </div>
            </form>

            {inspectDetail && (
              <div className="space-y-3">
                <strong className="text-slate-900 block">
                  Session Security &amp; Adjustment Timeline ({inspectDetail.events.length} events)
                </strong>
                <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {inspectDetail.events.length === 0 ? (
                    <p className="p-4 text-slate-500">No security events flagged for this session.</p>
                  ) : (
                    inspectDetail.events.map((ev) => (
                      <div key={ev.id} className="p-3 flex justify-between gap-2">
                        <div>
                          <strong className="text-slate-800">
                            {formatSecurityEventLabel(ev.eventType)}
                          </strong>
                          {ev.details && <p className="text-slate-600">{ev.details}</p>}
                        </div>
                        <span className="font-mono text-slate-500 shrink-0">
                          {new Date(ev.receivedAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incident Review Modal */}
      <IncidentReviewModal
        isOpen={Boolean(activeIncident)}
        incident={activeIncident}
        events={
          activeIncident
            ? data.securityEvents.filter((ev) => ev.sessionId === activeIncident.sessionId)
            : []
        }
        serverConnected={serverConnected}
        onClose={() => setActiveIncident(null)}
        onNotify={onNotify}
        onReviewed={(incidentId, nextStatus, reviewerNotes) => {
          setData((prev) => {
            const nextIncidents = prev.incidents.map((inc) =>
              inc.id === incidentId
                ? {
                    ...inc,
                    status: nextStatus,
                    reviewerNotes: reviewerNotes || inc.reviewerNotes,
                    updatedAt: new Date().toISOString(),
                  }
                : inc
            );
            return {
              ...prev,
              incidents: nextIncidents,
              counts: {
                ...prev.counts,
                openIncidents: nextIncidents.filter(
                  (i) => i.status === 'OPEN' || i.status === 'UNDER_REVIEW'
                ).length,
              },
            };
          });
        }}
      />
    </div>
  );
}

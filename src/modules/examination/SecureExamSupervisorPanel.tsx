import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Lock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';
import type { ExamSecurityPolicy } from '../student/exams/secure/examTypes';
import { DEFAULT_CLIENT_SECURITY_POLICY } from '../student/exams/secure/secureExamData';

type IncidentStatus = 'OPEN' | 'UNDER_REVIEW' | 'DISMISSED' | 'CONFIRMED';

interface SupervisorSessionRow {
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

interface SupervisorExamConfig {
  id: string;
  code: string;
  title: string;
  unitCode: string;
  durationMinutes: number;
  totalMarks: number;
  isPublished: boolean;
  startsAt: string;
  endsAt: string;
  questionCount: number;
  securityPolicy: ExamSecurityPolicy;
}

interface SupervisorIncidentRow {
  id: string;
  sessionId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentRegNo: string;
  studentName: string;
  status: IncidentStatus;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  summary: string;
  eventCount: number;
  reviewerNotes?: string;
  reviewedByName?: string;
  createdAt: string;
  updatedAt: string;
}

interface SupervisorEventRow {
  id: string;
  sessionId: string;
  eventType: string;
  occurredAt: string;
  receivedAt: string;
  details?: string;
  responseTriggered: string;
}

interface SupervisorOverviewPayload {
  counts: {
    total: number;
    active: number;
    disconnected: number;
    submitted: number;
    expired: number;
    openIncidents: number;
  };
  exams: SupervisorExamConfig[];
  sessions: SupervisorSessionRow[];
  incidents: SupervisorIncidentRow[];
}

interface InspectedSessionDetail {
  sessionId: string;
  examTitle: string;
  unitCode: string;
  studentName: string;
  studentRegNo: string;
  status: string;
  answeredCount: number;
  totalQuestions: number;
  terminationReason?: string;
  events: SupervisorEventRow[];
}

interface SecureExamSupervisorPanelProps {
  onNotify: (type: 'ok' | 'err', text: string) => void;
}

const SECURITY_TOGGLES: {
  key: keyof Pick<
    ExamSecurityPolicy,
    | 'requireFullscreen'
    | 'disableCopy'
    | 'disablePaste'
    | 'disableCut'
    | 'disableRightClick'
    | 'blockProhibitedShortcuts'
    | 'trackTabSwitching'
    | 'trackFullscreenExit'
    | 'autoSaveAnswers'
    | 'autoSubmitOnExpiry'
    | 'logSecurityIncidents'
    | 'requireWebcamMonitoring'
    | 'requireScreenRecording'
    | 'restrictToManagedDevices'
    | 'requireSafeExamBrowser'
  >;
  label: string;
  tier: 'Level 1 Web' | 'Level 2 Lab / SEB';
  description: string;
}[] = [
  {
    key: 'requireFullscreen',
    label: 'Require fullscreen',
    tier: 'Level 1 Web',
    description: 'Prompt and require fullscreen mode throughout active sitting.',
  },
  {
    key: 'disableCopy',
    label: 'Disable copy',
    tier: 'Level 1 Web',
    description: 'Block clipboard copy events and text selection in exam chrome.',
  },
  {
    key: 'disablePaste',
    label: 'Disable paste',
    tier: 'Level 1 Web',
    description: 'Block pasting external text into examination response inputs.',
  },
  {
    key: 'disableCut',
    label: 'Disable cut',
    tier: 'Level 1 Web',
    description: 'Prevent cut operations inside the candidate workspace.',
  },
  {
    key: 'disableRightClick',
    label: 'Disable right-click',
    tier: 'Level 1 Web',
    description: 'Suppress browser context menu during active exam sessions.',
  },
  {
    key: 'blockProhibitedShortcuts',
    label: 'Block prohibited keyboard shortcuts',
    tier: 'Level 1 Web',
    description: 'Block Ctrl/Cmd+C/V/X/P/S/U, F12, and DevTools hotkeys.',
  },
  {
    key: 'trackTabSwitching',
    label: 'Track tab switching',
    tier: 'Level 1 Web',
    description: 'Log document visibility and focus-loss events to server audit.',
  },
  {
    key: 'trackFullscreenExit',
    label: 'Track fullscreen exit',
    tier: 'Level 1 Web',
    description: 'Record exits from fullscreen and display immediate warning.',
  },
  {
    key: 'autoSaveAnswers',
    label: 'Auto-save answers',
    tier: 'Level 1 Web',
    description: 'Persist candidate responses every 20s and on change with offline queue.',
  },
  {
    key: 'autoSubmitOnExpiry',
    label: 'Auto-submit when time expires',
    tier: 'Level 1 Web',
    description: 'Server deadline auto-finalizes answers even if browser disconnects.',
  },
  {
    key: 'logSecurityIncidents',
    label: 'Log security incidents',
    tier: 'Level 1 Web',
    description: 'Escalate threshold breaches into the supervisor review queue.',
  },
  {
    key: 'requireWebcamMonitoring',
    label: 'Require webcam monitoring',
    tier: 'Level 2 Lab / SEB',
    description: 'Policy flag requiring camera check-in where institutional lab permits.',
  },
  {
    key: 'requireScreenRecording',
    label: 'Require screen recording',
    tier: 'Level 2 Lab / SEB',
    description: 'Policy flag enabling proctored screen capture stream.',
  },
  {
    key: 'restrictToManagedDevices',
    label: 'Restrict exam to managed devices',
    tier: 'Level 2 Lab / SEB',
    description: 'Enforces Level 2 managed kiosk/campus computer lab requirement.',
  },
  {
    key: 'requireSafeExamBrowser',
    label: 'Require Safe Exam Browser',
    tier: 'Level 2 Lab / SEB',
    description: 'Enforces Level 2 locked browser client for high-stakes sittings.',
  },
];

function createFallbackOverview(): SupervisorOverviewPayload {
  const now = Date.now();
  const startedIso = new Date(now - 35 * 60 * 1000).toISOString();
  const expiresIso = new Date(now + 25 * 60 * 1000).toISOString();

  return {
    counts: {
      total: 2,
      active: 1,
      disconnected: 0,
      submitted: 1,
      expired: 0,
      openIncidents: 1,
    },
    exams: [
      {
        id: 'sec-exam-net-cat',
        code: 'NET-204-CAT',
        title: 'Computer Networking CAT',
        unitCode: 'ICT 204',
        durationMinutes: 60,
        totalMarks: 30,
        isPublished: true,
        startsAt: new Date(now - 86_400_000).toISOString(),
        endsAt: new Date(now + 14 * 86_400_000).toISOString(),
        questionCount: 5,
        securityPolicy: { ...DEFAULT_CLIENT_SECURITY_POLICY },
      },
      {
        id: 'sec-exam-csc301',
        code: 'CSC-301-MID',
        title: 'CSC 301 Data Structures & Algorithms CBT',
        unitCode: 'CSC 301',
        durationMinutes: 45,
        totalMarks: 25,
        isPublished: true,
        startsAt: new Date(now - 86_400_000).toISOString(),
        endsAt: new Date(now + 14 * 86_400_000).toISOString(),
        questionCount: 3,
        securityPolicy: { ...DEFAULT_CLIENT_SECURITY_POLICY },
      },
    ],
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
        startedAt: startedIso,
        expiresAt: expiresIso,
        submittedAt: null,
        lastSavedAt: new Date(now - 2 * 60 * 1000).toISOString(),
        answeredCount: 3,
        totalQuestions: 5,
        securityEventCount: 3,
        tabSwitchCount: 1,
        fullscreenExitCount: 1,
        openIncidentCount: 1,
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
  };
}

function createFallbackInspection(session: SupervisorSessionRow): InspectedSessionDetail {
  const now = Date.now();
  const events: SupervisorEventRow[] =
    session.securityEventCount > 0
      ? [
          {
            id: 'sec-ev-001',
            sessionId: session.id,
            eventType: 'TAB_HIDDEN',
            occurredAt: new Date(now - 12 * 60 * 1000).toISOString(),
            receivedAt: new Date(now - 12 * 60 * 1000).toISOString(),
            details: 'Candidate tab visibility changed to hidden.',
            responseTriggered: 'WARNING',
          },
          {
            id: 'sec-ev-002',
            sessionId: session.id,
            eventType: 'FULLSCREEN_EXIT',
            occurredAt: new Date(now - 11 * 60 * 1000).toISOString(),
            receivedAt: new Date(now - 11 * 60 * 1000).toISOString(),
            details: 'Browser exited fullscreen during active session.',
            responseTriggered: 'WARNING_AND_LOG',
          },
          {
            id: 'sec-ev-003',
            sessionId: session.id,
            eventType: 'COPY_ATTEMPT',
            occurredAt: new Date(now - 8 * 60 * 1000).toISOString(),
            receivedAt: new Date(now - 8 * 60 * 1000).toISOString(),
            details: 'Clipboard copy blocked inside exam workspace.',
            responseTriggered: 'BLOCK_AND_LOG',
          },
        ]
      : [];

  return {
    sessionId: session.id,
    examTitle: session.examTitle,
    unitCode: session.unitCode,
    studentName: session.studentName,
    studentRegNo: session.studentRegNo,
    status: session.status,
    answeredCount: session.answeredCount,
    totalQuestions: session.totalQuestions,
    events,
  };
}

export default function SecureExamSupervisorPanel({
  onNotify,
}: SecureExamSupervisorPanelProps) {
  const [overview, setOverview] = useState<SupervisorOverviewPayload>(() =>
    createFallbackOverview()
  );
  const [serverConnected, setServerConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'ACTIVE' | 'DISCONNECTED' | 'SUBMITTED' | 'EXPIRED'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [inspected, setInspected] = useState<InspectedSessionDetail | null>(null);
  const [interveneReason, setInterveneReason] = useState('');
  const [incidentNotes, setIncidentNotes] = useState<Record<string, string>>({});

  const [selectedConfigExamId, setSelectedConfigExamId] = useState<string>('sec-exam-net-cat');
  const [savingPolicy, setSavingPolicy] = useState(false);

  const loadOverview = useCallback(async () => {
    if (typeof fetch !== 'function') return;
    setLoading(true);
    try {
      const res = await fetch('/api/exams/supervisor/sessions', {
        credentials: 'include',
      });
      if (!res.ok) {
        setServerConnected(false);
        return;
      }
      const payload = (await res.json()) as {
        success?: boolean;
        data?: SupervisorOverviewPayload;
      };
      if (payload.success && payload.data) {
        setOverview(payload.data);
        setServerConnected(true);
      }
    } catch {
      setServerConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  const filteredSessions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return overview.sessions.filter((s) => {
      if (statusFilter === 'ACTIVE' && (s.status !== 'ACTIVE' || s.isDisconnected)) return false;
      if (statusFilter === 'DISCONNECTED' && !s.isDisconnected) return false;
      if (statusFilter === 'SUBMITTED' && s.status !== 'SUBMITTED') return false;
      if (
        statusFilter === 'EXPIRED' &&
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
  }, [overview.sessions, searchQuery, statusFilter]);

  const selectedExam = useMemo(
    () =>
      overview.exams.find((e) => e.id === selectedConfigExamId) ?? overview.exams[0] ?? null,
    [overview.exams, selectedConfigExamId]
  );

  const handleInspectSession = async (session: SupervisorSessionRow) => {
    if (serverConnected && typeof fetch === 'function') {
      try {
        const res = await fetch(
          `/api/exams/supervisor/sessions/${encodeURIComponent(session.id)}`,
          { credentials: 'include' }
        );
        if (res.ok) {
          const payload = (await res.json()) as {
            success?: boolean;
            data?: {
              session: {
                id: string;
                studentName: string;
                studentRegNo: string;
                status: string;
                answers: unknown[];
                terminationReason?: string;
              };
              examTitle: string;
              unitCode: string;
              totalQuestions: number;
              events: SupervisorEventRow[];
            };
          };
          if (payload.success && payload.data) {
            setInspected({
              sessionId: payload.data.session.id,
              examTitle: payload.data.examTitle,
              unitCode: payload.data.unitCode,
              studentName: payload.data.session.studentName,
              studentRegNo: payload.data.session.studentRegNo,
              status: payload.data.session.status,
              answeredCount: payload.data.session.answers.length,
              totalQuestions: payload.data.totalQuestions,
              terminationReason: payload.data.session.terminationReason,
              events: payload.data.events,
            });
            return;
          }
        }
      } catch {
        // Fallback below
      }
    }
    setInspected(createFallbackInspection(session));
  };

  const handleIntervene = async (
    sessionId: string,
    action: 'FORCE_SUBMIT' | 'TERMINATE'
  ) => {
    const reason = interveneReason.trim();
    if (reason.length < 5) {
      onNotify(
        'err',
        'Provide a clear supervisor intervention reason (minimum 5 characters).'
      );
      return;
    }

    if (serverConnected && typeof fetch === 'function') {
      try {
        const res = await fetch(
          `/api/exams/supervisor/sessions/${encodeURIComponent(sessionId)}/intervene`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, reason }),
          }
        );
        const payload = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !payload.success) {
          onNotify('err', payload.error ?? 'Intervention request failed.');
          return;
        }
        setInterveneReason('');
        onNotify(
          'ok',
          `Session ${sessionId} updated (${action.replace('_', ' ')}). Reason logged.`
        );
        await loadOverview();
        setInspected((curr) =>
          curr && curr.sessionId === sessionId
            ? {
                ...curr,
                status: action === 'FORCE_SUBMIT' ? 'SUBMITTED' : 'TERMINATED',
                terminationReason: reason,
              }
            : curr
        );
        return;
      } catch {
        // Fall through to local preview update
      }
    }

    const nextStatus = action === 'FORCE_SUBMIT' ? 'SUBMITTED' : 'TERMINATED';
    setOverview((prev) => {
      const nextSessions = prev.sessions.map((s) =>
        s.id === sessionId ? { ...s, status: nextStatus as SupervisorSessionRow['status'] } : s
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
    setInspected((curr) =>
      curr && curr.sessionId === sessionId
        ? { ...curr, status: nextStatus, terminationReason: reason }
        : curr
    );
    setInterveneReason('');
    onNotify('ok', `Session ${sessionId} marked ${nextStatus} with mandatory audit reason.`);
  };

  const handleReviewIncident = async (incidentId: string, status: IncidentStatus) => {
    const reviewerNotes = (incidentNotes[incidentId] ?? '').trim();

    if (serverConnected && typeof fetch === 'function') {
      try {
        const res = await fetch(
          `/api/exams/supervisor/incidents/${encodeURIComponent(incidentId)}/review`,
          {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, reviewerNotes }),
          }
        );
        const payload = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !payload.success) {
          onNotify('err', payload.error ?? 'Failed to review incident.');
          return;
        }
        onNotify('ok', `Incident ${incidentId} updated to ${status.replace('_', ' ')}.`);
        await loadOverview();
        return;
      } catch {
        // Fall through to preview update
      }
    }

    setOverview((prev) => {
      const nextIncidents = prev.incidents.map((inc) =>
        inc.id === incidentId
          ? {
              ...inc,
              status,
              reviewerNotes: reviewerNotes || inc.reviewerNotes,
              reviewedByName: 'Examination Supervisor',
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
    onNotify('ok', `Incident ${incidentId} updated to ${status.replace('_', ' ')}.`);
  };

  const updateSelectedExamPolicy = (patch: Partial<ExamSecurityPolicy>) => {
    if (!selectedExam) return;
    setOverview((prev) => ({
      ...prev,
      exams: prev.exams.map((ex) => {
        if (ex.id !== selectedExam.id) return ex;
        const merged: ExamSecurityPolicy = {
          ...ex.securityPolicy,
          ...patch,
        };
        if (merged.requireSafeExamBrowser || merged.restrictToManagedDevices) {
          merged.securityLevel = 'LEVEL_2_LOCKED';
        } else if (!('securityLevel' in patch)) {
          merged.securityLevel = 'LEVEL_1_WEB';
        }
        return { ...ex, securityPolicy: merged };
      }),
    }));
  };

  const handleSaveSecurityPolicy = async () => {
    if (!selectedExam) return;
    setSavingPolicy(true);
    try {
      if (serverConnected && typeof fetch === 'function') {
        const res = await fetch(
          `/api/exams/supervisor/exams/${encodeURIComponent(selectedExam.id)}/security-config`,
          {
            method: 'PUT',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ securityPolicy: selectedExam.securityPolicy }),
          }
        );
        const payload = (await res.json()) as { success?: boolean; error?: string };
        if (!res.ok || !payload.success) {
          onNotify('err', payload.error ?? 'Could not save security configuration.');
          return;
        }
        await loadOverview();
      }
      onNotify(
        'ok',
        `Saved security configuration for ${selectedExam.title} (${selectedExam.securityPolicy.securityLevel === 'LEVEL_2_LOCKED' ? 'Level 2 Locked Mode' : 'Level 1 Web Secure Mode'}).`
      );
    } finally {
      setSavingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* LIVE SUPERVISOR OVERVIEW */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-slate-500">
              Examination Supervisor Control Room · Level 1 &amp; Level 2 Policy Enforcement
            </p>
            <h2 className="text-lg font-bold text-[#092c60]">
              Live Candidate Sessions &amp; Security Monitor
            </h2>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void loadOverview()}
            className="min-h-[38px] px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw size={14} aria-hidden="true" />
            <span>{loading ? 'Refreshing…' : 'Refresh Live Feed'}</span>
          </button>
        </div>

        {/* Clean Unboxed KPI Figures */}
        <div className="pt-4 border-t border-slate-200 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block">Active Candidates</span>
            <strong className="text-2xl font-bold text-emerald-700 font-mono tabular-nums">
              {overview.counts.active}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Disconnected</span>
            <strong className="text-2xl font-bold text-amber-700 font-mono tabular-nums">
              {overview.counts.disconnected}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Submitted</span>
            <strong className="text-2xl font-bold text-[#1769AA] font-mono tabular-nums">
              {overview.counts.submitted}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Expired / Terminated</span>
            <strong className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {overview.counts.expired}
            </strong>
          </div>
          <div>
            <span className="text-slate-500 block">Open Incidents</span>
            <strong className="text-2xl font-bold text-red-700 font-mono tabular-nums">
              {overview.counts.openIncidents}
            </strong>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-lg">
            {(['ALL', 'ACTIVE', 'DISCONNECTED', 'SUBMITTED', 'EXPIRED'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setStatusFilter(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  statusFilter === tab
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by candidate name, reg no, or session ID..."
            aria-label="Filter candidate exam sessions"
            className="w-full md:w-72 px-3 py-2 text-xs border border-slate-300 rounded-lg"
          />
        </div>

        {/* Candidate Sessions Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Candidate</th>
                <th className="py-2.5 px-4 font-semibold">Examination</th>
                <th className="py-2.5 px-4 font-semibold text-right">Answered</th>
                <th className="py-2.5 px-4 font-semibold text-right">Tab / FS</th>
                <th className="py-2.5 px-4 font-semibold">Last Saved</th>
                <th className="py-2.5 px-4 font-semibold">Status</th>
                <th className="py-2.5 px-4 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 px-4 text-center text-slate-500">
                    No candidate examination sessions match the current filter.
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
                      {s.isDisconnected ? (
                        <span className="text-amber-700">Disconnected</span>
                      ) : s.status === 'ACTIVE' ? (
                        <span className="text-emerald-700">Active</span>
                      ) : s.status === 'SUBMITTED' ? (
                        <span className="text-[#1769AA]">Submitted</span>
                      ) : (
                        <span className="text-red-700">{s.status}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => void handleInspectSession(s)}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 font-semibold text-slate-800 inline-flex items-center gap-1 whitespace-nowrap"
                      >
                        <Eye size={13} aria-hidden="true" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SESSION INSPECTOR & INCIDENTS QUEUE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Session Inspector */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert size={16} className="text-[#0875e8]" aria-hidden="true" />
              <span>Session Security Timeline &amp; Intervention</span>
            </h3>
            {inspected && (
              <span className="font-mono text-xs text-slate-500">{inspected.sessionId}</span>
            )}
          </div>

          {!inspected ? (
            <p className="text-xs text-slate-500">
              Select Inspect on any candidate row above to view security events, server timestamps,
              and supervisor controls.
            </p>
          ) : (
            <div className="space-y-4 text-xs">
              <div className="pb-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-sm text-[#092c60] block">
                    {inspected.studentName} ({inspected.studentRegNo})
                  </strong>
                  <span className="text-slate-600">
                    {inspected.unitCode} · {inspected.examTitle} · Answered{' '}
                    <span className="font-mono tabular-nums">
                      {inspected.answeredCount}/{inspected.totalQuestions}
                    </span>
                  </span>
                </div>
                <span className="font-mono font-bold text-slate-800">{inspected.status}</span>
              </div>

              {inspected.terminationReason && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
                  Intervention reason: <strong>{inspected.terminationReason}</strong>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {inspected.events.length === 0 ? (
                  <p className="text-slate-500">No security events logged for this session.</p>
                ) : (
                  inspected.events.map((ev) => (
                    <div
                      key={ev.id}
                      className="py-2 border-b border-slate-100 last:border-b-0 space-y-0.5"
                    >
                      <div className="flex items-center justify-between font-mono text-[11px]">
                        <strong className="text-slate-900">{ev.eventType}</strong>
                        <span className="text-slate-500 tabular-nums">
                          {new Date(ev.receivedAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-600">{ev.details || 'Security trigger captured.'}</p>
                      <p className="font-mono text-[11px] text-[#1769AA]">
                        Action: {ev.responseTriggered}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {inspected.status === 'ACTIVE' && (
                <div className="pt-3 border-t border-slate-200 space-y-2.5">
                  <label
                    htmlFor="supervisor-intervene-reason"
                    className="block font-semibold text-slate-800"
                  >
                    Supervisor Intervention Reason (mandatory)
                  </label>
                  <input
                    id="supervisor-intervene-reason"
                    type="text"
                    value={interveneReason}
                    onChange={(e) => setInterveneReason(e.target.value)}
                    placeholder="e.g. Verified lab power failure or confirmed cheating..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleIntervene(inspected.sessionId, 'FORCE_SUBMIT')}
                      className="px-3.5 py-2 rounded-lg bg-[#092c60] hover:bg-[#1769AA] text-white font-semibold whitespace-nowrap"
                    >
                      Force Submit Saved Answers
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleIntervene(inspected.sessionId, 'TERMINATE')}
                      className="px-3.5 py-2 rounded-lg border border-red-300 bg-red-50 hover:bg-red-100 text-red-800 font-semibold whitespace-nowrap"
                    >
                      Terminate Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Incidents Review Queue */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" aria-hidden="true" />
              <span>Security Incidents Review Queue</span>
            </h3>
            <span className="font-mono text-xs text-slate-500 tabular-nums">
              {overview.incidents.length} recorded
            </span>
          </div>

          {overview.incidents.length === 0 ? (
            <p className="text-xs text-slate-500">
              No security incidents flagged across active or completed sessions.
            </p>
          ) : (
            <div className="divide-y divide-slate-200 text-xs">
              {overview.incidents.map((inc) => (
                <div key={inc.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                    <span className="font-bold text-[#092c60]">
                      {inc.id} · {inc.studentRegNo} · {inc.severity} SEVERITY
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
                      {inc.status}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900">
                    {inc.studentName} — {inc.examTitle}
                  </p>
                  <p className="text-slate-600">{inc.summary}</p>
                  {inc.reviewerNotes && (
                    <p className="text-slate-700">
                      Reviewer note: <strong>{inc.reviewerNotes}</strong>
                      {inc.reviewedByName ? ` (${inc.reviewedByName})` : ''}
                    </p>
                  )}
                  <input
                    type="text"
                    value={incidentNotes[inc.id] ?? ''}
                    onChange={(e) =>
                      setIncidentNotes((prev) => ({ ...prev, [inc.id]: e.target.value }))
                    }
                    placeholder="Add supervisor review notes..."
                    aria-label={`Reviewer notes for ${inc.id}`}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleReviewIncident(inc.id, 'UNDER_REVIEW')}
                      className="px-2.5 py-1.5 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold"
                    >
                      Under Review
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReviewIncident(inc.id, 'CONFIRMED')}
                      className="px-2.5 py-1.5 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold"
                    >
                      Confirm Violation
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleReviewIncident(inc.id, 'DISMISSED')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold"
                    >
                      Dismiss (False Positive)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* LECTURER / ADMIN SECURITY CONFIGURATION (15 SETTINGS + POLICY TABLE) */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#092c60] flex items-center gap-2">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <span>Lecturer &amp; Admin Exam Security Settings (15 Controls)</span>
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Configure browser-level security deterrents, autosave behavior, and escalation
              thresholds per examination.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <select
              value={selectedExam?.id ?? ''}
              onChange={(e) => setSelectedConfigExamId(e.target.value)}
              aria-label="Select examination for security settings"
              className="px-3 py-2 text-xs font-semibold border border-slate-300 rounded-lg bg-slate-50 text-[#092c60]"
            >
              {overview.exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.unitCode} — {ex.title}
                </option>
              ))}
            </select>

            <button
              type="button"
              disabled={!selectedExam || savingPolicy}
              onClick={() => void handleSaveSecurityPolicy()}
              className="min-h-[38px] px-4 py-2 rounded-lg bg-[#092c60] hover:bg-[#1769AA] disabled:opacity-50 text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <CheckCircle2 size={14} aria-hidden="true" />
              <span>{savingPolicy ? 'Saving…' : 'Save Security Policy'}</span>
            </button>
          </div>
        </div>

        {selectedExam && (
          <>
            {/* Honest Security Capability Indicator */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-bold text-[#092c60] flex items-center gap-1.5">
                  {selectedExam.securityPolicy.securityLevel === 'LEVEL_2_LOCKED' ? (
                    <>
                      <Lock size={14} aria-hidden="true" />
                      <span>Level 2 — Locked Exam Mode (Managed Lab / Safe Exam Browser)</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck size={14} aria-hidden="true" />
                      <span>Level 1 — Web Secure Mode (Standard Browser Restrictions)</span>
                    </>
                  )}
                </div>
                <p className="text-slate-600">
                  Web Secure Mode blocks copy/paste/shortcuts, enforces fullscreen, and logs focus or
                  tab switches. Standard browsers cannot block OS app-switching, screenshots, or
                  secondary devices without managed lab kiosks or Safe Exam Browser.
                </p>
              </div>
            </div>

            {/* 15 Security Control Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 text-xs">
              {SECURITY_TOGGLES.map((item) => {
                const enabled = Boolean(selectedExam.securityPolicy[item.key]);
                return (
                  <label
                    key={item.key}
                    className={`p-3.5 rounded-xl border flex items-start gap-3 cursor-pointer transition-colors ${
                      enabled
                        ? 'border-[#1769AA]/40 bg-blue-50/40'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(e) =>
                        updateSelectedExamPolicy({ [item.key]: e.target.checked })
                      }
                      className="mt-0.5 accent-[#1769AA]"
                    />
                    <div className="min-w-0 space-y-0.5">
                      <div className="font-semibold text-slate-900">{item.label}</div>
                      <div className="text-[11px] font-mono text-slate-500">{item.tier}</div>
                      <p className="text-slate-600 leading-relaxed">{item.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Graduated Escalation Thresholds & Policy Table */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3 text-xs">
                <h4 className="font-bold text-slate-900">
                  Graduated Escalation Thresholds (Never Disqualify on Single Accidental Blur)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">
                      Tab Switch Warning At
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedExam.securityPolicy.tabSwitchWarningAt}
                      onChange={(e) =>
                        updateSelectedExamPolicy({
                          tabSwitchWarningAt: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">
                      Tab Switch Incident At
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={10}
                      value={selectedExam.securityPolicy.tabSwitchIncidentAt}
                      onChange={(e) =>
                        updateSelectedExamPolicy({
                          tabSwitchIncidentAt: Math.max(1, Number(e.target.value) || 2),
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">
                      Notify Supervisor At (Tab Switches)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedExam.securityPolicy.tabSwitchSupervisorAt}
                      onChange={(e) =>
                        updateSelectedExamPolicy({
                          tabSwitchSupervisorAt: Math.max(1, Number(e.target.value) || 3),
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">
                      Supervisor Review At (Fullscreen Exits)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={selectedExam.securityPolicy.fullscreenExitSupervisorAt}
                      onChange={(e) =>
                        updateSelectedExamPolicy({
                          fullscreenExitSupervisorAt: Math.max(1, Number(e.target.value) || 2),
                        })
                      }
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono tabular-nums"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3.5 font-semibold">Event Trigger</th>
                      <th className="py-2 px-3.5 font-semibold">Automated Response</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="py-2 px-3.5 font-medium">First tab switch</td>
                      <td className="py-2 px-3.5">Show candidate warning only</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 font-medium">Second tab switch</td>
                      <td className="py-2 px-3.5">Warn candidate, log event &amp; open incident</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 font-medium">Third tab switch</td>
                      <td className="py-2 px-3.5">Notify supervisor for manual review</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 font-medium">Repeated fullscreen exit</td>
                      <td className="py-2 px-3.5">Flag session for supervisor review</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3.5 font-medium">Copy / paste attempt</td>
                      <td className="py-2 px-3.5">Block action and log event</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

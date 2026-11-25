import React, { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  Laptop,
  PauseCircle,
  Play,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import ExaminationSupervisorDashboard from './ExaminationSupervisorDashboard';

interface InvigilatorPortalWorkspaceProps {
  onBack?: () => void;
}

type InvigilatorTab = 'sessions' | 'attendance' | 'live-monitor' | 'closure-report';

async function invigApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({ success: false, error: 'Invalid response' }));
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export default function InvigilatorPortalWorkspace({ onBack }: InvigilatorPortalWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<InvigilatorTab>('sessions');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [dashboard, setDashboard] = useState<any>(null);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('isess-001');

  const [checkInForm, setCheckInForm] = useState({
    studentRegNo: 'HCA/STU/2026/025',
    workstation: 'PC-03',
    attendanceStatus: 'PRESENT' as 'PRESENT' | 'LATE' | 'ABSENT',
  });
  const [closureForm, setClosureForm] = useState({
    finalOutcome: 'CONCLUDED_NORMALLY',
    notes: 'All candidates verified, temporary disconnections recovered cleanly without answer loss.',
  });

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await invigApi<any>('/api/invigilator/dashboard');
      setDashboard(data);
      if (data.sessions?.length && !data.sessions.some((s: any) => s.id === selectedSessionId)) {
        setSelectedSessionId(data.sessions[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load invigilator dashboard.');
    } finally {
      setLoading(false);
    }
  }, [selectedSessionId]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const activeSession =
    dashboard?.sessions?.find((s: any) => s.id === selectedSessionId) || dashboard?.sessions?.[0];

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    try {
      await invigApi(`/api/invigilator/sessions/${activeSession.id}/checkin`, {
        method: 'POST',
        body: JSON.stringify(checkInForm),
      });
      setBanner({
        type: 'ok',
        text: `Verified ${checkInForm.studentRegNo} (${checkInForm.attendanceStatus}) at workstation ${checkInForm.workstation}.`,
      });
      await loadDashboard();
    } catch (err) {
      setBanner({
        type: 'err',
        text: err instanceof Error ? err.message : 'Candidate check-in failed.',
      });
    }
  };

  const handleSessionControl = async (
    sessionId: string,
    action: 'START' | 'PAUSE' | 'RESUME' | 'INVESTIGATE'
  ) => {
    try {
      await invigApi(`/api/invigilator/sessions/${sessionId}/control`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      setBanner({ type: 'ok', text: `Session action ${action} executed and audited.` });
      await loadDashboard();
    } catch (err) {
      setBanner({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to update session control state.',
      });
    }
  };

  const handleClosureReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    try {
      await invigApi(`/api/invigilator/sessions/${activeSession.id}/closure-report`, {
        method: 'POST',
        body: JSON.stringify(closureForm),
      });
      setBanner({
        type: 'ok',
        text: `Submitted signed closure report for session ${activeSession.sessionRef}.`,
      });
      await loadDashboard();
    } catch (err) {
      setBanner({
        type: 'err',
        text: err instanceof Error ? err.message : 'Failed to submit closure report.',
      });
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-300">
        Loading Invigilator Examination Operations Portal...
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 space-y-3">
        <p className="text-sm font-semibold text-red-900 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void loadDashboard()}
          className="px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs: { id: InvigilatorTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'sessions', label: 'Scheduled Sessions', icon: ClipboardCheck },
    { id: 'attendance', label: 'Candidate Verification & Seating', icon: UserCheck },
    { id: 'live-monitor', label: 'Live Proctoring & Incidents', icon: Activity },
    { id: 'closure-report', label: 'Session Closure Report', icon: FileCheck2 },
  ];

  return (
    <div className="space-y-6">
      {/* Header & KPI Strip */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1769AA] dark:text-blue-400">
              02 · Invigilator &amp; Examination Supervisor Portal
            </p>
            <h1 className="text-2xl font-bold text-[#102D50] dark:text-white tracking-tight">
              Examination Session Control, Attendance &amp; Live Supervision
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Verify candidate identities &amp; credits, assign lab workstations, monitor active
              heartbeats, handle disconnections safely, and file post-exam closure reports.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void loadDashboard()}
              className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <RefreshCw size={14} /> Refresh
            </button>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-3.5 py-2 rounded-xl bg-[#102D50] text-white text-xs font-semibold whitespace-nowrap shrink-0"
              >
                Back to Dashboard
              </button>
            )}
          </div>
        </div>

        {/* 4 KPI Cards */}
        {dashboard?.kpis && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Scheduled Sessions', value: dashboard.kpis.scheduledSessions },
              { label: 'Registered Candidates', value: dashboard.kpis.registeredCandidates },
              { label: 'Active Candidates', value: dashboard.kpis.activeCandidates },
              { label: 'Open Security Incidents', value: dashboard.kpis.openIncidents },
            ].map((k) => (
              <div
                key={k.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/60 p-4"
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{k.label}</span>
                <strong className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#102D50] dark:text-white block">
                  {k.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {/* Navigation Strip */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition ${
                  active
                    ? 'bg-[#102D50] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {banner && (
        <div
          className={`rounded-xl border px-4 py-3 text-xs font-medium flex items-center justify-between gap-4 ${
            banner.type === 'ok'
              ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-200'
          }`}
        >
          <span>{banner.text}</span>
          <button type="button" onClick={() => setBanner(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: SCHEDULED SESSIONS */}
      {activeTab === 'sessions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {(dashboard?.sessions || []).map((sess: any) => (
            <div
              key={sess.id}
              className={`rounded-2xl border p-5 space-y-4 bg-white dark:bg-slate-900 ${
                sess.id === activeSession?.id
                  ? 'border-[#1769AA] dark:border-blue-500'
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-mono text-xs font-bold text-[#1769AA] dark:text-blue-400">
                    {sess.sessionRef} · {sess.examBody} · {sess.moduleCode}
                  </p>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                    {sess.examTitle}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {sess.scheduledDate} · {sess.startTime} · {sess.durationMinutes} min · {sess.room}
                  </p>
                </div>
                <span className="font-mono text-xs font-bold text-[#102D50] dark:text-blue-300 shrink-0">
                  {sess.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono tabular-nums">
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
                  <span className="text-slate-500 block font-sans">Rostered</span>
                  <strong>{sess.candidates.length}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
                  <span className="text-slate-500 block font-sans">Present</span>
                  <strong>
                    {sess.candidates.filter((c: any) => c.attendanceStatus === 'PRESENT' || c.attendanceStatus === 'LATE').length}
                  </strong>
                </div>
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800 p-2.5">
                  <span className="text-slate-500 block font-sans">Active</span>
                  <strong>
                    {sess.candidates.filter((c: any) => c.examConnectionState === 'ACTIVE').length}
                  </strong>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSessionId(sess.id);
                    setActiveTab('attendance');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[#102D50] text-white font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <UserCheck size={13} /> Verify Attendance
                </button>
                <button
                  type="button"
                  onClick={() => void handleSessionControl(sess.id, 'START')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Play size={13} /> Start
                </button>
                <button
                  type="button"
                  onClick={() => void handleSessionControl(sess.id, 'PAUSE')}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <PauseCircle size={13} /> Pause
                </button>
                <button
                  type="button"
                  onClick={() => void handleSessionControl(sess.id, 'INVESTIGATE')}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <ShieldAlert size={13} /> Flag Investigation
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: CANDIDATE IDENTITY & CREDIT VERIFICATION */}
      {activeTab === 'attendance' && activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6">
          <form
            onSubmit={handleCheckIn}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs h-fit"
          >
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <QrCode size={16} /> Candidate Check-In &amp; Workstation Gate
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Session: <strong>{activeSession.sessionRef}</strong> · {activeSession.room}
            </p>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                Registration Number or QR Code
              </label>
              <input
                required
                value={checkInForm.studentRegNo}
                onChange={(e) => setCheckInForm({ ...checkInForm, studentRegNo: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                Assigned Workstation
              </label>
              <input
                required
                value={checkInForm.workstation}
                onChange={(e) => setCheckInForm({ ...checkInForm, workstation: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">
                Attendance Status
              </label>
              <select
                value={checkInForm.attendanceStatus}
                onChange={(e) =>
                  setCheckInForm({
                    ...checkInForm,
                    attendanceStatus: e.target.value as 'PRESENT' | 'LATE' | 'ABSENT',
                  })
                }
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="PRESENT">PRESENT (On Time)</option>
                <option value="LATE">LATE (Permitted Entry)</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#102D50] text-white font-semibold"
            >
              Verify Identity, Credits &amp; Check In
            </button>
          </form>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Roster Verification ({activeSession.sessionRef})
              </h2>
              <span className="text-xs text-slate-500">
                Disconnection alone does not auto-flag misconduct
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4">Candidate</th>
                    <th className="py-2.5 px-4">Workstation</th>
                    <th className="py-2.5 px-4 text-right">Credits</th>
                    <th className="py-2.5 px-4">Account &amp; Email</th>
                    <th className="py-2.5 px-4">Attendance</th>
                    <th className="py-2.5 px-4">Connection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {activeSession.candidates.map((row: any) => (
                    <tr key={row.studentRegNo}>
                      <td className="py-2.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{row.studentName}</div>
                        <div className="font-mono text-slate-500">{row.studentRegNo}</div>
                      </td>
                      <td className="py-2.5 px-4 font-mono">
                        <span className="inline-flex items-center gap-1">
                          <Laptop size={12} /> {row.workstation}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                        {row.creditsAvailable}
                      </td>
                      <td className="py-2.5 px-4 text-emerald-700 dark:text-emerald-400">
                        {row.accountActive && row.emailVerified ? 'Verified Active' : 'Blocked'}
                      </td>
                      <td className="py-2.5 px-4 font-semibold">{row.attendanceStatus}</td>
                      <td className="py-2.5 px-4 font-mono">{row.examConnectionState}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE PROCTORING & INCIDENT REVIEW (EXISTING SUPERVISOR DASHBOARD) */}
      {activeTab === 'live-monitor' && <ExaminationSupervisorDashboard />}

      {/* TAB 4: CLOSURE REPORT */}
      {activeTab === 'closure-report' && activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleClosureReport}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs"
          >
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Submit Post-Examination Closure Report ({activeSession.sessionRef})
            </h2>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Final Outcome</label>
              <select
                value={closureForm.finalOutcome}
                onChange={(e) => setClosureForm({ ...closureForm, finalOutcome: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="CONCLUDED_NORMALLY">CONCLUDED NORMALLY</option>
                <option value="CONCLUDED_WITH_INCIDENTS">CONCLUDED WITH RECORDED INCIDENTS</option>
                <option value="RESCHEDULE_RECOMMENDED">RESCHEDULE RECOMMENDED (INFRASTRUCTURE)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 mb-1">Invigilator Summary Notes</label>
              <textarea
                rows={4}
                required
                value={closureForm.notes}
                onChange={(e) => setClosureForm({ ...closureForm, notes: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[#102D50] text-white font-semibold"
            >
              Sign &amp; Submit Closure Report
            </button>

            {activeSession.closureReport && (
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-4 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 size={15} /> Closure Report Recorded
                </div>
                <p className="font-mono tabular-nums text-emerald-900 dark:text-emerald-200">
                  Registered: {activeSession.closureReport.registeredCount} · Present:{' '}
                  {activeSession.closureReport.presentCount} · Absent:{' '}
                  {activeSession.closureReport.absentCount} · Incidents:{' '}
                  {activeSession.closureReport.incidentCount}
                </p>
                <p className="text-emerald-800 dark:text-emerald-300">
                  Submitted by {activeSession.closureReport.submittedByName} ({activeSession.closureReport.finalOutcome})
                </p>
              </div>
            )}
          </form>

          {/* Permission Restriction Notice */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1769AA]" />
              Invigilator Role &amp; Permission Boundaries
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              To preserve institutional integrity, the Invigilator Operations Portal enforces strict
              separation of duties:
            </p>
            <ul className="space-y-2 text-slate-700 dark:text-slate-300 list-disc pl-4">
              <li>Authorized: View assigned sessions, verify candidate QR/reg identities, record attendance, monitor live heartbeats, review incidents, send exam-room instructions, and file closure reports.</li>
              <li>Restricted: Cannot edit Central Question Bank items, cannot approve or release final candidate grades, cannot alter candidate fee ledgers or HR records, and cannot silently edit submitted answers.</li>
            </ul>
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 flex items-start gap-2 text-amber-900 dark:text-amber-200">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <span>
                Network interruptions automatically place candidates in a reconnection-recovery grace state; temporary disconnections do not deduct extra credits or auto-terminate sessions.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Coins,
  ExternalLink,
  GraduationCap,
  Play,
  Printer,
  QrCode,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  buildFallbackCatalog,
  buildInstructionSessionFromCatalog,
  fetchAvailableSecureExams,
  resumeServerSecureExamSession,
} from '../../exams/secure/secureExamData';
import type { ExamSession } from '../../exams/secure/examTypes';
import { studentPortalService } from '../../../../services/studentPortalService';

export type CandidateHubTab = 'overview' | 'modules' | 'examinations' | 'credits' | 'results-certificates';

interface CandidateCertificationPortalProps {
  initialTab?: CandidateHubTab;
  onNotify?: (type: 'ok' | 'err', message: string) => void;
  onLaunchSecureExam?: (session: ExamSession) => void;
}

async function candApi<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({ success: false, error: 'Invalid response.' }));
  if (!res.ok || !body.success) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body.data as T;
}

export default function CandidateCertificationPortal({
  initialTab = 'overview',
  onNotify,
  onLaunchSecureExam,
}: CandidateCertificationPortalProps) {
  const [activeTab, setActiveTab] = useState<CandidateHubTab>(initialTab);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [launchingId, setLaunchingId] = useState<string | null>(null);
  const [readinessConfirmed, setReadinessConfirmed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const loadCandidateHub = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await candApi<any>('/api/candidate/dashboard');
      setData(payload);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to load your Candidate Learning & Certification workspace.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCandidateHub();
  }, [loadCandidateHub]);

  const handleLaunchExam = async (examItem: any) => {
    setLaunchingId(examItem.sessionId);
    try {
      const launchRes = await candApi<any>(
        `/api/candidate/examinations/${encodeURIComponent(examItem.sessionId)}/launch`,
        {
          method: 'POST',
          body: JSON.stringify({
            idempotencyKey: `${data?.candidate?.studentRegNo || 'CAND'}:${examItem.sessionRef}`,
          }),
        }
      );

      onNotify?.(
        'ok',
        launchRes.deduplicated
          ? `Reconnected to ${examItem.examTitle} without duplicate credit deduction.`
          : `Committed 1 examination credit and initialized secure session for ${examItem.examTitle}.`
      );
      await loadCandidateHub();

      // Launch into existing SecureExamPage + SecureExamLayout
      if (onLaunchSecureExam) {
        const profile = studentPortalService.getState().profile;
        const candidate = {
          name: data?.candidate?.studentName || profile.fullName,
          regNo: data?.candidate?.studentRegNo || profile.registrationNumber,
        };
        const { items, serverBacked } = await fetchAvailableSecureExams();
        const match =
          items.find((it) => it.id === examItem.examId || it.title.includes('Spreadsheets')) ||
          buildFallbackCatalog()[0];
        let secureSession: ExamSession | null = null;
        if (serverBacked && match.activeSessionId) {
          secureSession = await resumeServerSecureExamSession(match.activeSessionId, candidate);
        }
        if (!secureSession) {
          secureSession = buildInstructionSessionFromCatalog(match, candidate, !serverBacked);
        }
        onLaunchSecureExam(secureSession);
      }
    } catch (err) {
      onNotify?.(
        'err',
        err instanceof Error ? err.message : 'Unable to launch secure examination session.'
      );
    } finally {
      setLaunchingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-sm text-slate-600 dark:text-slate-300">
        Loading Candidate Learning, Credit Wallet &amp; Certification Portal...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6 space-y-3">
        <p className="text-sm font-semibold text-red-900 dark:text-red-300">{error}</p>
        <button
          type="button"
          onClick={() => void loadCandidateHub()}
          className="px-4 py-2 rounded-lg bg-red-700 text-white text-xs font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const tabs: { id: CandidateHubTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
    { id: 'overview', label: 'Certification Overview', icon: GraduationCap },
    { id: 'modules', label: 'My Assigned Modules', icon: BookOpen },
    { id: 'examinations', label: 'Scheduled Exams & Launch', icon: ClipboardCheck },
    { id: 'credits', label: 'Exam Credit Wallet', icon: Coins },
    { id: 'results-certificates', label: 'Results & Certificates', icon: Award },
  ];

  return (
    <div className="space-y-6">
      {/* Header + Progression Summary */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#1769AA] dark:text-blue-400">
              03 · Candidate Learning &amp; Certification Portal · {data?.candidate?.examBody}
            </p>
            <h1 className="text-2xl font-bold text-[#102D50] dark:text-white tracking-tight">
              {data?.candidate?.programmeName} — Learning, Credits &amp; Examinations
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              Candidate <strong className="font-mono">{data?.candidate?.studentRegNo}</strong> ·
              Progression Stage:{' '}
              <strong className="text-[#1769AA] dark:text-blue-400">
                {data?.progression?.stage}
              </strong>{' '}
              (<span className="font-mono tabular-nums">{data?.progression?.progressPercent ?? 0}%</span>)
            </p>
          </div>
          <button
            type="button"
            onClick={() => void loadCandidateHub()}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 whitespace-nowrap shrink-0 self-start"
          >
            <RefreshCw size={14} /> Refresh Status
          </button>
        </div>

        {/* 5 Candidate KPIs */}
        {data?.kpis && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {[
              { label: 'Assigned Modules', value: data.kpis.assignedModules },
              { label: 'Completed Modules', value: data.kpis.completedModules },
              { label: 'Upcoming Exams', value: data.kpis.upcomingExams },
              { label: 'Certificates Earned', value: data.kpis.certificatesEarned },
              { label: 'Available Exam Credits', value: data.kpis.availableCredits },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-[#F4F7FB] dark:bg-slate-800/60 p-4"
              >
                <span className="text-xs text-slate-500 dark:text-slate-400 block">{kpi.label}</span>
                <strong className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#102D50] dark:text-white block">
                  {kpi.value}
                </strong>
              </div>
            ))}
          </div>
        )}

        {data?.lowCreditAlert && (
          <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
            <AlertTriangle size={16} className="shrink-0" />
            <span>{data.lowCreditAlert.message}</span>
          </div>
        )}

        {/* Sub-navigation */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-200 dark:border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 transition ${
                  active
                    ? 'bg-[#102D50] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Certification Progression Gate
            </h2>
            <p className="text-slate-600 dark:text-slate-300">
              Completed <strong className="font-mono tabular-nums">{data.progression.completedModulesCount}</strong> of{' '}
              <strong className="font-mono tabular-nums">{data.progression.totalRequiredModules}</strong> mandatory modules.
            </p>
            {data.progression.eligibilityBlockReason ? (
              <p className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-slate-700 dark:text-slate-300">
                {data.progression.eligibilityBlockReason}
              </p>
            ) : (
              <p className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 p-3 text-emerald-800 dark:text-emerald-300 font-semibold">
                All required certification modules passed! Eligible for certificate issuance.
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Next Scheduled Examination
            </h2>
            {(data.upcomingExams || []).slice(0, 2).map((ex: any) => (
              <div
                key={ex.sessionId}
                className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-3"
              >
                <div>
                  <strong className="text-slate-900 dark:text-white block">{ex.examTitle}</strong>
                  <span className="font-mono text-slate-500">
                    {ex.scheduledDate} · {ex.startTime} · {ex.room} · {ex.creditCost} credit
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('examinations')}
                  className="px-3 py-1.5 rounded-lg bg-[#1769AA] text-white font-semibold whitespace-nowrap shrink-0"
                >
                  Pre-Flight Check
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MY ASSIGNED MODULES */}
      {activeTab === 'modules' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(data.assignedModules || []).map((mod: any) => (
            <div
              key={mod.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                    {mod.moduleCode} · {mod.requirementKind}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {mod.moduleTitle}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {mod.assessmentMode} · {mod.trainingHours} hrs · Pass mark {mod.passMarkPercent}% · {mod.creditCost} credit
                  </p>
                </div>
                <strong className="font-mono tabular-nums text-sm text-[#102D50] dark:text-white">
                  {mod.progressPercent}%
                </strong>
              </div>
              <div className="w-full h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full bg-[#1769AA] ${
                    mod.progressPercent >= 100
                      ? 'w-full'
                      : mod.progressPercent >= 75
                      ? 'w-3/4'
                      : mod.progressPercent >= 50
                      ? 'w-1/2'
                      : mod.progressPercent > 0
                      ? 'w-1/4'
                      : 'w-0'
                  }`}
                />
              </div>
              {mod.prerequisites?.length > 0 && (
                <p className="text-slate-600 dark:text-slate-300">
                  Prerequisites:{' '}
                  {mod.prerequisites
                    .map((p: any) => `${p.moduleCode} (${p.completed ? 'Done' : 'Pending'})`)
                    .join(', ')}
                </p>
              )}
              <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                {(mod.studyMaterials || []).map((mat: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>{mat.kind}: {mat.title}</span>
                    <span className="font-mono">{mat.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULED EXAMS & 9-POINT PRE-FLIGHT LAUNCH */}
      {activeTab === 'examinations' && (
        <div className="space-y-4">
          {(data.upcomingExams || []).map((ex: any) => (
            <div
              key={ex.sessionId}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4 text-xs"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                    {ex.sessionRef} · {ex.examBody} · {ex.moduleCode}
                  </p>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">{ex.examTitle}</h2>
                  <p className="text-slate-600 dark:text-slate-300">
                    {ex.scheduledDate} · {ex.startTime} · {ex.durationMinutes} min · Venue: {ex.room} · Seat: {ex.workstation}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-mono tabular-nums font-bold text-[#102D50] dark:text-white">
                    Cost: {ex.creditCost} credit
                  </span>
                  <button
                    type="button"
                    disabled={
                      !ex.readyToLaunch ||
                      !readinessConfirmed[ex.sessionId] ||
                      launchingId === ex.sessionId
                    }
                    onClick={() => void handleLaunchExam(ex)}
                    className="px-4 py-2.5 rounded-xl bg-[#102D50] hover:bg-[#173f6e] disabled:opacity-50 text-white font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0"
                  >
                    <Play size={14} />
                    {launchingId === ex.sessionId
                      ? 'Initializing...'
                      : ex.alreadyReservedOrCommitted
                      ? 'Resume Secure Exam'
                      : 'Commit Credit & Launch Exam'}
                  </button>
                </div>
              </div>

              {/* Pre-flight readiness gates */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {(ex.readinessChecks || []).map((chk: any) => (
                  <div
                    key={chk.id}
                    className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${
                      chk.passed
                        ? 'border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200'
                        : 'border-red-200 dark:border-red-900 bg-red-50/70 dark:bg-red-950/30 text-red-900 dark:text-red-200'
                    }`}
                  >
                    {chk.passed ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                    <span>{chk.label}</span>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(readinessConfirmed[ex.sessionId])}
                  onChange={(e) =>
                    setReadinessConfirmed((prev) => ({
                      ...prev,
                      [ex.sessionId]: e.target.checked,
                    }))
                  }
                />
                <span>
                  I confirm I am ready for fullscreen secure examination mode, single active tab,
                  stable connection, and 1 examination credit deduction (no double charge on reconnection).
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* CREDIT WALLET & LEDGER */}
      {activeTab === 'credits' && data?.wallet && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Available Credits', val: data.wallet.availableCredits },
              { label: 'Reserved Credits', val: data.wallet.reservedCredits },
              { label: 'Consumed Credits', val: data.wallet.consumedCredits },
              { label: 'Refunded Credits', val: data.wallet.refundedCredits },
            ].map((c) => (
              <div
                key={c.label}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4"
              >
                <span className="text-xs text-slate-500 block">{c.label}</span>
                <strong className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#102D50] dark:text-white block">
                  {c.val}
                </strong>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                My Examination Credit Ledger ({data.transactions.length} transactions)
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4">Tx Ref</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Delta</th>
                    <th className="py-2.5 px-4 text-right">Balance</th>
                    <th className="py-2.5 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.transactions.map((tx: any) => (
                    <tr key={tx.id}>
                      <td className="py-2.5 px-4 font-mono font-bold text-[#1769AA]">{tx.txRef}</td>
                      <td className="py-2.5 px-4 font-mono">{tx.type}</td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums font-bold">
                        {tx.creditsDelta > 0 ? `+${tx.creditsDelta}` : tx.creditsDelta}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono tabular-nums">
                        {tx.balanceBefore} &rarr; {tx.balanceAfter}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{tx.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESULTS & CERTIFICATES */}
      {activeTab === 'results-certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} /> Released Examination Results
            </h2>
            {data.results.length === 0 ? (
              <p className="text-slate-500">No moderated and released exam results yet.</p>
            ) : (
              data.results.map((r: any) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-1.5"
                >
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white">
                    <span>{r.examTitle} ({r.moduleCode})</span>
                    <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                      {r.objectiveScore + r.manualScore}/{r.totalMarks} (Pass {r.passMark})
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{r.lecturerFeedback}</p>
                  {r.practicalFeedback && (
                    <p className="text-slate-500">Practical: {r.practicalFeedback}</p>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <QrCode size={16} /> My Digital Certificates
            </h2>
            {data.certificates.length === 0 ? (
              <p className="text-slate-500">
                Complete all mandatory modules and pass assessments to unlock your verifiable digital certificate.
              </p>
            ) : (
              data.certificates.map((cert: any) => (
                <div
                  key={cert.id}
                  className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/60 dark:bg-emerald-950/30 p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <strong className="text-sm text-emerald-950 dark:text-emerald-200">
                      {cert.qualificationTitle}
                    </strong>
                    <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300">
                      {cert.serialNumber}
                    </span>
                  </div>
                  <p className="text-emerald-900 dark:text-emerald-200">
                    Issued by {cert.issuedByName} · Code:{' '}
                    <span className="font-mono font-bold">{cert.verificationCode}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3 py-1.5 rounded-lg bg-[#102D50] text-white font-semibold flex items-center gap-1.5"
                    >
                      <Printer size={13} /> Print / Save PDF
                    </button>
                    <a
                      href={`/api/public/verify-certificate/${encodeURIComponent(cert.serialNumber)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-emerald-700 text-emerald-900 dark:text-emerald-200 font-semibold flex items-center gap-1.5"
                    >
                      <ExternalLink size={13} /> Verify QR Record
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

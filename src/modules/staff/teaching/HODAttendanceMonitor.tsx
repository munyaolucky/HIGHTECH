import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileWarning,
  ShieldAlert,
} from 'lucide-react';
import type { StaffUserAccount } from '../../../config/staff-navigation';
import { StaffButton, StaffPageHeader, StaffStatCard } from '../components/StaffDashboardUI';
import {
  teachingModuleApi,
  type AbsenceCaseDTO,
} from '../../../services/teachingModuleApi';

export default function HODAttendanceMonitor({
  user,
  onBack,
}: {
  user: StaffUserAccount;
  onBack: () => void;
}) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [absenceCases, setAbsenceCases] = useState<AbsenceCaseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [returnCommentMap, setReturnCommentMap] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mgmt, cases] = await Promise.all([
        teachingModuleApi.getManagementDashboard(),
        teachingModuleApi.listStaffAbsenceCases({}),
      ]);
      setDashboard(mgmt);
      setAbsenceCases(cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load HOD teaching monitor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDocDecision = async (docId: string, action: 'APPROVE' | 'RETURN') => {
    const comment = returnCommentMap[docId]?.trim() || '';
    if (action === 'RETURN' && !comment) {
      setError('Please enter revision comments before returning a document to the lecturer.');
      return;
    }
    try {
      setError(null);
      await teachingModuleApi.transitionDocumentStatus(
        docId,
        action,
        comment || (action === 'APPROVE' ? `Approved by ${user.fullName}` : '')
      );
      setNotice(`Document ${action === 'APPROVE' ? 'approved' : 'returned with revision feedback'}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update document status.');
    }
  };

  const handleVerifyLesson = async (lessonId: string, reviewStatus: 'VERIFIED' | 'FLAGGED') => {
    try {
      setError(null);
      await teachingModuleApi.hodReviewLesson(
        lessonId,
        reviewStatus,
        reviewStatus === 'VERIFIED' ? 'Lesson delivery & attendance verified by HOD.' : 'Flagged for follow-up meeting.'
      );
      setNotice(`Lesson record marked ${reviewStatus}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update lesson verification.');
    }
  };

  const handleAbsenceDecision = async (
    caseId: string,
    decision: 'APPROVED' | 'REJECTED' | 'ESCALATED'
  ) => {
    try {
      setError(null);
      await teachingModuleApi.reviewAbsenceCase(
        caseId,
        decision,
        decision === 'APPROVED'
          ? `Approved & excused by ${user.fullName} (HOD).`
          : decision === 'ESCALATED'
          ? `Escalated to Principal for chronic absenteeism review.`
          : `Explanation not accepted by ${user.fullName}.`,
        decision === 'ESCALATED' ? 'PRINCIPAL' : undefined
      );
      setNotice(`Absence case marked ${decision}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not decide absence case.');
    }
  };

  const handleCorrectionReview = async (corrId: string, decision: 'APPROVED' | 'REJECTED') => {
    try {
      setError(null);
      await teachingModuleApi.reviewCorrection(corrId, decision, `Reviewed by ${user.fullName}`);
      setNotice(`Attendance amendment request ${decision}.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not review correction request.');
    }
  };

  const kpis = dashboard?.kpis;

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="HOD Teaching, Documents & Attendance Monitor"
        description={`Departmental accountability workspace scoped to ${user.department}.`}
        breadcrumb="HOD / Teaching & Attendance"
        actions={
          <StaffButton variant="secondary" onClick={onBack}>
            Back to Role Dashboard
          </StaffButton>
        }
      />

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={15} />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-[#B83232] dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {loading || !dashboard ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-600">
          Loading departmental teaching compliance &amp; attendance telemetry...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 tabular-nums">
            <StaffStatCard
              label="Department Attendance"
              value={`${kpis.overallAttendancePct}%`}
              description={`${kpis.sessionsHeld} class sessions logged`}
              icon={ClipboardCheck}
            />
            <StaffStatCard
              label="Pending Document Approvals"
              value={kpis.pendingDocumentApprovals}
              description="Schemes, notes & lesson plans"
              icon={BookOpenCheck}
            />
            <StaffStatCard
              label="Unconducted Lessons"
              value={kpis.unconductedLessons}
              description={`${kpis.lessonsConducted} conducted cleanly`}
              icon={FileWarning}
            />
            <StaffStatCard
              label="HOD Escalated Absences"
              value={kpis.escalatedToHod + kpis.escalatedToPrincipal}
              description={`${kpis.pendingCorrections} pending register edits`}
              icon={ShieldAlert}
            />
          </div>

          {/* 1. PENDING DOCUMENT APPROVALS */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Teaching Documents Awaiting HOD Approval ({dashboard.pendingDocuments.length})
            </h2>
            {dashboard.pendingDocuments.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-300">All department teaching documents are reviewed.</p>
            ) : (
              <div className="space-y-3">
                {dashboard.pendingDocuments.map((doc: any) => (
                  <div key={doc.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                          {doc.unitCode} · {doc.categoryLabel} · v{doc.currentVersion}
                        </span>
                        <strong className="block text-sm text-slate-900 dark:text-white">{doc.title}</strong>
                        <span className="text-slate-600 dark:text-slate-300">Uploaded by {doc.uploadedByName}</span>
                      </div>
                      <span className="font-bold text-[#102D50] dark:text-blue-300">{doc.status}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Optional approval comment or mandatory return reason..."
                        value={returnCommentMap[doc.id] || ''}
                        onChange={(e) =>
                          setReturnCommentMap((prev) => ({ ...prev, [doc.id]: e.target.value }))
                        }
                        className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleDocDecision(doc.id, 'APPROVE')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDocDecision(doc.id, 'RETURN')}
                        className="px-3 py-1.5 rounded-lg bg-[#B83232] text-white font-semibold"
                      >
                        Return for Revision
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* 2. LESSON DELIVERY VERIFICATION */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Department Lesson Delivery Verification ({dashboard.pendingLessons.length})
            </h2>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {dashboard.pendingLessons.map((l: any) => (
                <div key={l.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="font-mono font-bold text-[#102D50] dark:text-blue-300">
                      {l.unitCode} · {l.lessonDate} · {l.status}
                    </span>
                    <strong className="block text-slate-900 dark:text-white">{l.actualTopicTaught || l.plannedTopic}</strong>
                    <span className="text-slate-600 dark:text-slate-300">
                      Trainer: {l.actualTrainerName} · Attendance: {l.attendanceRate ?? 'N/A'}% · HOD Status: <strong>{l.hodReviewStatus}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleVerifyLesson(l.id, 'VERIFIED')}
                      className="px-3 py-1.5 rounded-lg bg-[#102D50] text-white font-semibold"
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVerifyLesson(l.id, 'FLAGGED')}
                      className="px-3 py-1.5 rounded-lg border border-[#B83232] text-[#B83232] font-semibold"
                    >
                      Flag Gap
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 3. ABSENCE CASES & MEDICAL EVIDENCE REVIEW */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Department Student Absence Cases &amp; Escalations ({absenceCases.length})
            </h2>
            <div className="space-y-3">
              {absenceCases.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                        {c.studentRegNo} · {c.unitCode} ({c.absenceDate})
                      </span>
                      <strong className="block text-sm text-slate-900 dark:text-white">{c.studentName}</strong>
                      <span className="text-slate-600 dark:text-slate-300 tabular-nums">
                        Unit Absences: {c.unitAbsenceCount} · Term Total: {c.termAbsenceCount} · Escalation: {c.escalationLevel}
                      </span>
                    </div>
                    <span className="font-bold text-[#102D50] dark:text-blue-300">{c.status}</span>
                  </div>

                  {c.explanations.map((e) => (
                    <p key={e.id} className="text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/70 rounded-lg p-2.5">
                      <strong>[{e.category}]</strong> {e.reasonText}
                    </p>
                  ))}

                  {c.evidence.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {c.evidence.map((ev) => (
                        <a
                          key={ev.id}
                          href={teachingModuleApi.getAbsenceEvidenceDownloadUrl(c.id, ev.id)}
                          download
                          className="inline-flex items-center gap-1 text-[#1769AA] dark:text-blue-300 font-semibold hover:underline"
                        >
                          <Download size={12} /> {ev.fileName}
                        </a>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAbsenceDecision(c.id, 'APPROVED')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold"
                    >
                      Approve &amp; Excuse
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAbsenceDecision(c.id, 'REJECTED')}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold"
                    >
                      Reject Reason
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAbsenceDecision(c.id, 'ESCALATED')}
                      className="px-3 py-1.5 rounded-lg bg-[#B83232] text-white font-semibold"
                    >
                      Escalate to Principal
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 4. LOCKED ATTENDANCE AMENDMENT APPROVALS */}
          {dashboard.pendingCorrections.length > 0 && (
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Pending Locked Attendance Amendments ({dashboard.pendingCorrections.length})
              </h2>
              {dashboard.pendingCorrections.map((corr: any) => (
                <div key={corr.id} className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800 pt-2">
                  <span>
                    <strong>{corr.studentName}</strong> ({corr.previousStatus} &rarr; {corr.requestedStatus}) — {corr.reason}
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleCorrectionReview(corr.id, 'APPROVED')}
                      className="px-3 py-1 rounded-lg bg-emerald-700 text-white font-semibold"
                    >
                      Approve Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCorrectionReview(corr.id, 'REJECTED')}
                      className="px-3 py-1 rounded-lg border border-[#B83232] text-[#B83232] font-semibold"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}

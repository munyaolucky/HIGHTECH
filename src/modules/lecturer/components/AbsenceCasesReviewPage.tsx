import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle2,
  Download,
  Lock,
  MessageSquarePlus,
  ShieldAlert,
} from 'lucide-react';
import {
  teachingModuleApi,
  type AbsenceCaseDTO,
} from '../../../services/teachingModuleApi';

export default function AbsenceCasesReviewPage() {
  const [cases, setCases] = useState<AbsenceCaseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Option B verbal note panel
  const [verbalCase, setVerbalCase] = useState<AbsenceCaseDTO | null>(null);
  const [verbalCat, setVerbalCat] = useState('MEDICAL');
  const [verbalReason, setVerbalReason] = useState('');

  // Staff Review comment panel
  const [reviewCase, setReviewCase] = useState<AbsenceCaseDTO | null>(null);
  const [reviewDecision, setReviewDecision] = useState<'RECOMMENDED' | 'ESCALATED' | 'UNDER_REVIEW' | 'REJECTED'>('RECOMMENDED');
  const [reviewComment, setReviewComment] = useState('');

  // Catch-up schedule modal
  const [catchUpCase, setCatchUpCase] = useState<AbsenceCaseDTO | null>(null);
  const [cuDate, setCuDate] = useState('2026-11-24');
  const [cuTime, setCuTime] = useState('14:00 - 15:30');
  const [cuVenue, setCuVenue] = useState('Computer Lab 3B');
  const [cuMaterials, setCuMaterials] = useState('');

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      await teachingModuleApi.ensureLecturerSession();
      const rows = await teachingModuleApi.listStaffAbsenceCases({
        status: statusFilter,
        search,
      });
      setCases(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load absence cases.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleVerbalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verbalCase) return;
    try {
      setError(null);
      await teachingModuleApi.recordTrainerVerbalNote(
        verbalCase.id,
        verbalCat,
        verbalReason.trim(),
        verbalReason.trim()
      );
      setNotice(`Recorded Option B verbal note for ${verbalCase.studentName}. Student alerted to confirm accuracy.`);
      setVerbalCase(null);
      setVerbalReason('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save trainer verbal note.');
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCase) return;
    try {
      setError(null);
      await teachingModuleApi.reviewAbsenceCase(
        reviewCase.id,
        reviewDecision,
        reviewComment.trim(),
        reviewDecision === 'ESCALATED' ? 'HOD' : undefined
      );
      setNotice(`Case updated (${reviewDecision}) for ${reviewCase.studentRegNo}.`);
      setReviewCase(null);
      setReviewComment('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update absence review.');
    }
  };

  const handleCatchUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catchUpCase) return;
    try {
      setError(null);
      await teachingModuleApi.createCatchUp({
        studentRegNo: catchUpCase.studentRegNo,
        studentName: catchUpCase.studentName,
        absenceCaseId: catchUpCase.id,
        unitCode: catchUpCase.unitCode,
        unitTitle: catchUpCase.unitTitle,
        missedLessonDate: catchUpCase.absenceDate,
        scheduledDate: cuDate,
        scheduledTime: cuTime,
        roomOrLink: cuVenue,
        materialsAttached: cuMaterials,
      });
      setNotice(`Catch-up lesson scheduled for ${catchUpCase.studentName} on ${cuDate}.`);
      setCatchUpCase(null);
      setCuMaterials('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not schedule catch-up lesson.');
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-400">
          Student Support &amp; Attendance Follow-Up
        </p>
        <h1 className="text-xl font-bold text-[#102D50] dark:text-white mt-0.5">
          Student Absence Cases &amp; Pending Explanations
        </h1>
        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
          Review Student Portal explanations (Option A), record verbal explanations shared in person (Option B for student confirmation), verify restricted evidence, or schedule catch-up sessions.
        </p>
      </div>

      {notice && (
        <div role="status" className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 px-4 py-3 text-xs font-medium text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={15} className="shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-[#B83232] dark:text-red-300 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ACTIVE ACTION PANELS */}
      {verbalCase && (
        <form onSubmit={handleVerbalSubmit} className="rounded-2xl border-2 border-[#1769AA] bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Option B — Record Verbal Absence Note for {verbalCase.studentName} ({verbalCase.studentRegNo})
            </h2>
            <button type="button" onClick={() => setVerbalCase(null)} className="text-slate-500">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Reason Category</label>
              <select
                value={verbalCat}
                onChange={(e) => setVerbalCat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="MEDICAL">Medical</option>
                <option value="FAMILY_EMERGENCY">Family Emergency</option>
                <option value="OFFICIAL_DUTY">Official Duty</option>
                <option value="TRANSPORT">Transport Delay</option>
                <option value="FINANCIAL">Financial / Fees</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Trainer Summary of Verbal Reason (Student will be prompted to confirm accuracy)
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Student reported outpatient hospital review on morning of session..."
                value={verbalReason}
                onChange={(e) => setVerbalReason(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#102D50] text-white font-semibold">
            Save Verbal Note &amp; Request Student Confirmation
          </button>
        </form>
      )}

      {reviewCase && (
        <form onSubmit={handleReviewSubmit} className="rounded-2xl border-2 border-[#102D50] bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Review Decision — {reviewCase.studentName} ({reviewCase.unitCode})
            </h2>
            <button type="button" onClick={() => setReviewCase(null)} className="text-slate-500">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Action</label>
              <select
                value={reviewDecision}
                onChange={(e) => setReviewDecision(e.target.value as any)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              >
                <option value="RECOMMENDED">Recommend Excusal to HOD</option>
                <option value="UNDER_REVIEW">Mark Under Review</option>
                <option value="ESCALATED">Escalate to HOD</option>
                <option value="REJECTED">Reject Explanation</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Reviewer Comment *</label>
              <input
                type="text"
                required
                placeholder="State assessment of student explanation and evidence..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-[#1769AA] text-white font-semibold">
            Submit Case Review
          </button>
        </form>
      )}

      {catchUpCase && (
        <form onSubmit={handleCatchUpSubmit} className="rounded-2xl border-2 border-emerald-700 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Schedule Catch-Up Session — {catchUpCase.studentName} ({catchUpCase.unitCode})
            </h2>
            <button type="button" onClick={() => setCatchUpCase(null)} className="text-slate-500">Cancel</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input type="date" required value={cuDate} onChange={(e) => setCuDate(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            <input type="text" required value={cuTime} onChange={(e) => setCuTime(e.target.value)} placeholder="14:00 - 15:30" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            <input type="text" required value={cuVenue} onChange={(e) => setCuVenue(e.target.value)} placeholder="Venue or Meeting Link" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
            <input type="text" value={cuMaterials} onChange={(e) => setCuMaterials(e.target.value)} placeholder="Handout / Lab Guide" className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800" />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-semibold">
            Confirm Catch-Up Session &amp; Notify Student
          </button>
        </form>
      )}

      {/* FILTERS */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <select
          aria-label="Filter absence cases by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        >
          <option value="ALL">All Absence Case Statuses</option>
          <option value="AWAITING_EXPLANATION">Awaiting Student Explanation</option>
          <option value="EXPLANATION_SUBMITTED">Explanation Submitted</option>
          <option value="DOCUMENT_SUBMITTED">Medical / Evidence Attached</option>
          <option value="RECOMMENDED">Recommended to HOD</option>
          <option value="ESCALATED">Escalated (HOD / Principal)</option>
          <option value="APPROVED">Approved / Excused</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search student name, registration no, or unit..."
          className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
        />
      </div>

      {/* CASES LIST */}
      <div className="space-y-3">
        {loading ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-600">
            Loading absence review queue...
          </div>
        ) : cases.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-600">
            No absence cases match the selected filters.
          </div>
        ) : (
          cases.map((c) => (
            <div key={c.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3 text-xs">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[#102D50] dark:text-blue-300">{c.studentRegNo}</span>
                    <strong className="text-sm text-slate-900 dark:text-white">{c.studentName}</strong>
                    <span className="text-slate-500">·</span>
                    <span className="font-mono font-semibold text-[#1769AA] dark:text-blue-400">{c.unitCode}</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">Date: {c.absenceDate}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
                    Consecutive: <strong>{c.consecutiveAbsenceCount}</strong> · Unit Absences:{' '}
                    <strong>{c.unitAbsenceCount}</strong> · Term Total: <strong>{c.termAbsenceCount}</strong>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {c.escalationLevel !== 'NONE' && (
                    <span className="inline-flex items-center gap-1 font-bold text-[#B83232] dark:text-red-400">
                      <ShieldAlert size={13} /> Escalated: {c.escalationLevel}
                    </span>
                  )}
                  <span className="font-bold text-[#102D50] dark:text-blue-300">{c.status}</span>
                </div>
              </div>

              {c.explanations.length > 0 && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-3 space-y-1.5">
                  {c.explanations.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-800 dark:text-slate-100">
                        <span>
                          [{exp.source === 'TRAINER_VERBAL_ENTRY' ? 'Option B · Verbal Note' : 'Option A · Student Portal'}] {exp.category}
                        </span>
                        <span className={exp.studentConfirmedAccuracy ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-300'}>
                          {exp.studentConfirmedAccuracy ? 'Student Confirmed Accurate' : 'Awaiting Student Confirmation'}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 mt-0.5">{exp.reasonText}</p>
                    </div>
                  ))}
                </div>
              )}

              {c.evidence.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  {c.evidence.map((ev) =>
                    ev.accessRestricted ? (
                      <span key={ev.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500">
                        <Lock size={12} /> {ev.fileName}
                      </span>
                    ) : (
                      <a
                        key={ev.id}
                        href={teachingModuleApi.getAbsenceEvidenceDownloadUrl(c.id, ev.id)}
                        download
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1769AA] text-[#1769AA] dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-800 font-semibold"
                      >
                        <Download size={12} /> {ev.fileName}
                      </a>
                    )
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setVerbalCase(c)}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold inline-flex items-center gap-1.5"
                >
                  <MessageSquarePlus size={13} /> Record Verbal Note (Option B)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewCase(c)}
                  className="px-3 py-1.5 rounded-lg bg-[#102D50] text-white font-semibold"
                >
                  Review / Recommend / Escalate
                </button>
                <button
                  type="button"
                  onClick={() => setCatchUpCase(c)}
                  className="px-3 py-1.5 rounded-lg border border-emerald-700 text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5"
                >
                  <CalendarPlus size={13} /> Schedule Catch-Up
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

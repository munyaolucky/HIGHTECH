import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Download,
  FileUp,
  LogIn,
  QrCode,
  ShieldCheck,
} from 'lucide-react';
import {
  readFileAsBase64,
  teachingModuleApi,
  type AbsenceCaseDTO,
} from '../../../services/teachingModuleApi';

export default function StudentAbsenceSection({
  onNotify,
}: {
  onNotify: (type: 'ok' | 'err', message: string) => void;
}) {
  const [data, setData] = useState<any>(null);
  const [authRequired, setAuthRequired] = useState(false);
  const [loading, setLoading] = useState(true);
  const [qrInput, setQrInput] = useState('');
  const [submittingQr, setSubmittingQr] = useState(false);

  // Option A form
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [expCategory, setExpCategory] = useState('MEDICAL');
  const [expReason, setExpReason] = useState('');
  const [evFile, setEvFile] = useState<File | null>(null);
  const [evDesc, setEvDesc] = useState('Medical / Supporting Document');
  const [isMedical, setIsMedical] = useState(true);
  const [busyCaseId, setBusyCaseId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setAuthRequired(false);
      const res = await teachingModuleApi.getMyAbsenceCases();
      setData(res);
    } catch (err) {
      if ((err as { status?: number }).status === 401) {
        setAuthRequired(true);
      } else {
        onNotify('err', err instanceof Error ? err.message : 'Could not load absence cases.');
      }
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleQrCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setSubmittingQr(true);
    try {
      const res = await teachingModuleApi.studentQrCheckIn(qrInput.trim());
      setQrInput('');
      onNotify('ok', `Checked in via QR for ${res.unitCode} (${res.sessionDate}).`);
      await load();
    } catch (err) {
      onNotify('err', err instanceof Error ? err.message : 'QR check-in failed.');
    } finally {
      setSubmittingQr(false);
    }
  };

  const handleOptionASubmit = async (e: React.FormEvent, caseId: string) => {
    e.preventDefault();
    setBusyCaseId(caseId);
    try {
      if (expReason.trim()) {
        await teachingModuleApi.submitStudentExplanation(caseId, expCategory, expReason.trim());
      }
      if (evFile) {
        const filePayload = await readFileAsBase64(evFile);
        await teachingModuleApi.uploadAbsenceEvidence(caseId, {
          ...filePayload,
          description: evDesc.trim() || 'Supporting absence documentation',
          isConfidentialMedical: isMedical,
        });
      }
      setActiveCaseId(null);
      setExpReason('');
      setEvFile(null);
      onNotify('ok', 'Submitted your absence explanation and supporting evidence cleanly.');
      await load();
    } catch (err) {
      onNotify('err', err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setBusyCaseId(null);
    }
  };

  const handleConfirmVerbalNote = async (caseId: string, explanationId: string) => {
    setBusyCaseId(caseId);
    try {
      await teachingModuleApi.confirmTrainerVerbalNote(caseId, explanationId);
      onNotify('ok', 'Confirmed accuracy of lecturer-recorded verbal explanation.');
      await load();
    } catch (err) {
      onNotify('err', err instanceof Error ? err.message : 'Could not confirm verbal note.');
    } finally {
      setBusyCaseId(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-xs text-slate-600 dark:text-slate-300">
        Synchronizing student attendance standing, QR sessions &amp; absence cases...
      </div>
    );
  }

  if (authRequired) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1769AA]" />
              Live Absence Explanations, Option B Note Confirmation &amp; QR Check-In
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Sign in with your verified Student Registration Number (e.g. <code className="font-mono font-bold">HCA/STU/2026/001</code>) on the Student Login page to view your live absence cases, upload confidential medical evidence, confirm lecturer verbal notes, and scan classroom QR session tokens.
            </p>
          </div>
          <a
            href="/portal/student/login"
            className="px-4 py-2 rounded-xl bg-[#102D50] hover:bg-[#0b203a] text-white font-semibold inline-flex items-center gap-2 shrink-0"
          >
            <LogIn size={14} /> Open Student Login
          </a>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5 text-xs">
      {/* LIVE STANDING & QR SELF CHECK-IN */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
                Verified Live Attendance Standing ({data.studentRegNo})
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Institutional examination eligibility floor: {data.minimumRequiredPct}%
              </p>
            </div>
            <strong
              className={`text-xl font-bold font-mono tabular-nums ${
                data.overallAttendancePct >= data.minimumRequiredPct
                  ? 'text-emerald-700 dark:text-emerald-400'
                  : 'text-[#B83232] dark:text-red-400'
              }`}
            >
              {data.overallAttendancePct}%
            </strong>
          </div>

          {data.alerts?.length > 0 && (
            <div className="space-y-2 pt-1">
              {data.alerts.slice(0, 3).map((al: any) => (
                <div
                  key={al.id}
                  className="rounded-xl border border-amber-200 dark:border-amber-800 bg-[#F5EBDD]/60 dark:bg-amber-950/30 px-3.5 py-2.5 flex items-start gap-2 text-[#102D50] dark:text-amber-200"
                >
                  <Bell size={14} className="shrink-0 mt-0.5 text-[#B83232]" />
                  <div>
                    <strong className="block">{al.title}</strong>
                    <span>{al.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form
          onSubmit={handleQrCheckIn}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3"
        >
          <h3 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <QrCode size={16} className="text-[#1769AA]" /> Live Classroom QR Check-In
          </h3>
          <p className="text-slate-600 dark:text-slate-300">
            Enter the live expiring session token generated by your lecturer.
          </p>
          <input
            type="text"
            required
            placeholder="e.g. CSC301-LIVE99"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono uppercase"
          />
          <button
            type="submit"
            disabled={submittingQr}
            className="w-full py-2.5 rounded-xl bg-[#102D50] hover:bg-[#0b203a] text-white font-semibold disabled:opacity-50"
          >
            {submittingQr ? 'Checking In...' : 'Submit Live Check-In Token'}
          </button>
        </form>
      </div>

      {/* MY ABSENCE CASES (OPTION A + OPTION B) */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-[#102D50] dark:text-white">
            My Absence Cases, Explanations &amp; Evidence ({data.cases.length})
          </h3>
          <span className="text-slate-500 dark:text-slate-400">
            Option A: Submit online · Option B: Confirm verbal reason noted by trainer
          </span>
        </div>

        {data.cases.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-300">You have zero recorded absence cases.</p>
        ) : (
          <div className="space-y-4">
            {data.cases.map((c: AbsenceCaseDTO) => {
              const unconfirmedVerbal = c.explanations.find(
                (exp) => exp.source === 'TRAINER_VERBAL_ENTRY' && !exp.studentConfirmedAccuracy
              );
              const isEditing = activeCaseId === c.id;

              return (
                <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                        {c.unitCode} · {c.absenceDate}
                      </span>
                      <strong className="block text-sm text-slate-900 dark:text-white">{c.unitTitle}</strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        Lecturer: {c.lecturerName} · Status: <strong>{c.status}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveCaseId(isEditing ? null : c.id)}
                      className="px-3 py-1.5 rounded-lg bg-[#1769AA] text-white font-semibold"
                    >
                      {isEditing ? 'Close Form' : 'Submit Explanation / Upload Evidence'}
                    </button>
                  </div>

                  {/* OPTION B CONFIRMATION CARD */}
                  {unconfirmedVerbal && (
                    <div className="rounded-xl border-2 border-amber-400 dark:border-amber-700 bg-[#F5EBDD]/70 dark:bg-amber-950/30 p-3.5 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle size={15} className="text-[#B83232] shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-[#102D50] dark:text-amber-200 block">
                            Option B Confirmation Requested — Trainer Recorded Verbal Note
                          </strong>
                          <p className="text-slate-700 dark:text-slate-200 mt-0.5">
                            &ldquo;{unconfirmedVerbal.trainerRecordedNote || unconfirmedVerbal.reasonText}&rdquo;
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={busyCaseId === c.id}
                        onClick={() => handleConfirmVerbalNote(c.id, unconfirmedVerbal.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={14} /> Confirm Accuracy of Trainer Note
                      </button>
                    </div>
                  )}

                  {/* EXPLANATION HISTORY */}
                  {c.explanations.map((exp) => (
                    <div key={exp.id} className="rounded-lg bg-slate-50 dark:bg-slate-800/70 p-2.5">
                      <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-100">
                        <span>{exp.category} ({exp.source === 'TRAINER_VERBAL_ENTRY' ? 'Verbal Entry' : 'Student Portal'})</span>
                        <span className={exp.studentConfirmedAccuracy ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700'}>
                          {exp.studentConfirmedAccuracy ? 'Confirmed Accurate' : 'Unconfirmed'}
                        </span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-200 mt-0.5">{exp.reasonText}</p>
                    </div>
                  ))}

                  {/* UPLOADED EVIDENCE */}
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

                  {/* OPTION A SUBMIT FORM */}
                  {isEditing && (
                    <form onSubmit={(e) => handleOptionASubmit(e, c.id)} className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">Reason Category</label>
                          <select
                            value={expCategory}
                            onChange={(e) => setExpCategory(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                          >
                            <option value="MEDICAL">Medical</option>
                            <option value="FAMILY_EMERGENCY">Family Emergency</option>
                            <option value="OFFICIAL_DUTY">Official Duty</option>
                            <option value="TRANSPORT">Transport Delay</option>
                            <option value="FINANCIAL">Financial Clearance</option>
                            <option value="OTHER">Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                            Medical / Supporting Document (PDF/JPG/PNG, Confidential)
                          </label>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                            onChange={(e) => setEvFile(e.target.files?.[0] ?? null)}
                            className="w-full text-xs"
                          />
                        </div>
                      </div>

                      <textarea
                        rows={2}
                        placeholder="Write clear absence explanation..."
                        value={expReason}
                        onChange={(e) => setExpReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isMedical}
                            onChange={(e) => setIsMedical(e.target.checked)}
                            className="rounded border-slate-300"
                          />
                          Mark upload as Confidential Medical Evidence (Admin blocked)
                        </label>
                        <button
                          type="submit"
                          disabled={busyCaseId === c.id}
                          className="px-4 py-2 rounded-lg bg-[#102D50] text-white font-semibold inline-flex items-center gap-1.5"
                        >
                          <FileUp size={13} /> {busyCaseId === c.id ? 'Submitting...' : 'Submit Explanation'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MISSED LESSONS & SCHEDULED CATCH-UP SESSIONS */}
      {data.catchUpLessons?.length > 0 && (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3">
          <h3 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
            <CalendarClock size={16} className="text-[#1769AA]" /> Scheduled Catch-Up Lessons &amp; Practicals
          </h3>
          {data.catchUpLessons.map((cu: any) => (
            <div key={cu.id} className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <strong className="text-slate-900 dark:text-white block">{cu.unitCode} — {cu.unitTitle}</strong>
                <span className="text-slate-600 dark:text-slate-300">
                  Makeup: {cu.scheduledDate} ({cu.scheduledTime}) at {cu.roomOrLink} · Materials: {cu.materialsAttached}
                </span>
              </div>
              <span className="font-bold text-emerald-700 dark:text-emerald-400">{cu.status}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

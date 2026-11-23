import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Lock, Settings2 } from 'lucide-react';
import type { StaffUserAccount } from '../../../config/staff-navigation';
import { StaffButton, StaffPageHeader } from '../components/StaffDashboardUI';
import {
  teachingModuleApi,
  type AttendancePolicyDTO,
} from '../../../services/teachingModuleApi';

export default function AdminAttendancePolicyView({
  user,
  onBack,
}: {
  user: StaffUserAccount;
  onBack: () => void;
}) {
  const [policy, setPolicy] = useState<AttendancePolicyDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teachingModuleApi.getAttendancePolicy();
      setPolicy(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load attendance policy.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!policy) return;
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const updated = await teachingModuleApi.updateAttendancePolicy({
        policyName: policy.policyName,
        minimumExamAttendancePct: Number(policy.minimumExamAttendancePct),
        lateThresholdMinutes: Number(policy.lateThresholdMinutes),
        consecutiveAbsenceTrainerAlert: Number(policy.consecutiveAbsenceTrainerAlert),
        unitAbsenceHodAlert: Number(policy.unitAbsenceHodAlert),
        termAbsenceHodEscalation: Number(policy.termAbsenceHodEscalation),
        unresolvedPrincipalEscalation: Number(policy.unresolvedPrincipalEscalation),
        lessonRecordOverdueHours: Number(policy.lessonRecordOverdueHours),
        allowQrCheckIn: Boolean(policy.allowQrCheckIn),
        qrValidityMinutes: Number(policy.qrValidityMinutes),
      });
      setPolicy(updated);
      setNotice('Institutional attendance & escalation thresholds saved cleanly.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update policy.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Attendance & Escalation Policy Governance"
        description={`Configure institution-wide attendance thresholds and automated alert rules (${user.roleTitle}).`}
        breadcrumb="Administration / Attendance Policy"
        actions={
          <StaffButton variant="secondary" onClick={onBack}>
            Back to Role Dashboard
          </StaffButton>
        }
      />

      <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-[#F5EBDD]/60 dark:bg-amber-950/30 p-4 text-xs flex items-start gap-3 text-[#102D50] dark:text-amber-200">
        <Lock size={16} className="shrink-0 mt-0.5 text-[#B83232]" />
        <div>
          <strong>Governance Separation &amp; Medical Privacy Active:</strong> System Administrators configure threshold numbers and check-in rules here. Confidential student medical documentation remains strictly restricted to the student, assigned lecturer, HOD, Student Affairs, and Principal.
        </div>
      </div>

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

      {loading || !policy ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 text-center text-xs text-slate-600">
          Loading configurable attendance policy rules...
        </div>
      ) : (
        <form onSubmit={handleSave} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-5 text-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Settings2 size={16} className="text-[#1769AA]" />
              {policy.policyName}
            </h2>
            <span className="text-slate-500 dark:text-slate-400">
              Last updated by {policy.updatedByName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Minimum Exam Attendance (%)
              </label>
              <input
                type="number"
                min={50}
                max={100}
                value={policy.minimumExamAttendancePct}
                onChange={(e) => setPolicy({ ...policy, minimumExamAttendancePct: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Late Grace Window (Minutes)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={policy.lateThresholdMinutes}
                onChange={(e) => setPolicy({ ...policy, lateThresholdMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Consecutive Absences &rarr; Trainer Alert
              </label>
              <input
                type="number"
                min={1}
                max={15}
                value={policy.consecutiveAbsenceTrainerAlert}
                onChange={(e) => setPolicy({ ...policy, consecutiveAbsenceTrainerAlert: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Unit Absences &rarr; HOD Alert
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={policy.unitAbsenceHodAlert}
                onChange={(e) => setPolicy({ ...policy, unitAbsenceHodAlert: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Term Absences &rarr; HOD Escalation
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={policy.termAbsenceHodEscalation}
                onChange={(e) => setPolicy({ ...policy, termAbsenceHodEscalation: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Term / Unresolved &rarr; Principal Escalation
              </label>
              <input
                type="number"
                min={1}
                max={40}
                value={policy.unresolvedPrincipalEscalation}
                onChange={(e) => setPolicy({ ...policy, unresolvedPrincipalEscalation: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Lesson Log Overdue Hours
              </label>
              <input
                type="number"
                min={1}
                max={168}
                value={policy.lessonRecordOverdueHours}
                onChange={(e) => setPolicy({ ...policy, lessonRecordOverdueHours: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                QR Token Validity (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={120}
                value={policy.qrValidityMinutes}
                onChange={(e) => setPolicy({ ...policy, qrValidityMinutes: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono tabular-nums"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={policy.allowQrCheckIn}
                  onChange={(e) => setPolicy({ ...policy, allowQrCheckIn: e.target.checked })}
                  className="rounded border-slate-300"
                />
                Enable Student QR Self Check-In
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-[#102D50] hover:bg-[#0b203a] text-white font-semibold disabled:opacity-50"
            >
              {saving ? 'Saving Policy...' : 'Save Escalation & Policy Rules'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

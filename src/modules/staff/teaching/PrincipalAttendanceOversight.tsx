import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileWarning,
  ShieldAlert,
} from 'lucide-react';
import type { StaffUserAccount } from '../../../config/staff-navigation';
import { StaffButton, StaffPageHeader, StaffStatCard } from '../components/StaffDashboardUI';
import TeachingReportsPage from '../../lecturer/components/TeachingReportsPage';
import {
  teachingModuleApi,
  type AbsenceCaseDTO,
} from '../../../services/teachingModuleApi';

export default function PrincipalAttendanceOversight({
  user,
  onBack,
}: {
  user: StaffUserAccount;
  onBack: () => void;
}) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [escalatedCases, setEscalatedCases] = useState<AbsenceCaseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [mgmt, cases] = await Promise.all([
        teachingModuleApi.getManagementDashboard(),
        teachingModuleApi.listStaffAbsenceCases({ escalationLevel: 'PRINCIPAL' }),
      ]);
      setDashboard(mgmt);
      setEscalatedCases(cases);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load executive oversight dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleResolveCase = async (caseId: string, decision: 'APPROVED' | 'CLOSED' | 'REJECTED') => {
    try {
      setError(null);
      await teachingModuleApi.reviewAbsenceCase(
        caseId,
        decision,
        `Final executive determination recorded by ${user.fullName} (${user.roleTitle}).`
      );
      setNotice(`Escalated case resolved (${decision}).`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resolve escalated absence.');
    }
  };

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Institutional Teaching & Attendance Oversight"
        description={`Cross-department compliance, escalated chronic absenteeism resolution, and 14 executive reports (${user.roleTitle}).`}
        breadcrumb="Executive / Teaching Oversight"
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
          Loading institution-wide attendance &amp; academic telemetry...
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 tabular-nums">
            <StaffStatCard
              label="Institution Attendance"
              value={`${dashboard.kpis.overallAttendancePct}%`}
              description={`Exam eligibility floor: ${dashboard.policy.minimumExamAttendancePct}%`}
              icon={ClipboardCheck}
            />
            <StaffStatCard
              label="Active Departments"
              value={dashboard.departmentComparison.length}
              description={`${dashboard.kpis.sessionsHeld} sessions audited`}
              icon={Building2}
            />
            <StaffStatCard
              label="Principal Escalations"
              value={dashboard.kpis.escalatedToPrincipal}
              description="Chronic term absenteeism alerts"
              icon={ShieldAlert}
            />
            <StaffStatCard
              label="Unconducted Lessons"
              value={dashboard.kpis.unconductedLessons}
              description={`${dashboard.kpis.pendingDocumentApprovals} pending doc approvals`}
              icon={FileWarning}
            />
          </div>

          {/* DEPARTMENT COMPARISON */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden text-xs">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
                Department Attendance &amp; Lesson Delivery Comparison
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Department</th>
                    <th className="py-2.5 px-4 font-semibold">Sessions</th>
                    <th className="py-2.5 px-4 font-semibold">Avg Attendance</th>
                    <th className="py-2.5 px-4 font-semibold">Lessons Logged</th>
                    <th className="py-2.5 px-4 font-semibold">Unconducted</th>
                    <th className="py-2.5 px-4 font-semibold">Escalated Absences</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 tabular-nums">
                  {dashboard.departmentComparison.map((d: any) => (
                    <tr key={d.departmentId}>
                      <td className="py-2.5 px-4 font-semibold text-slate-900 dark:text-white">{d.departmentName}</td>
                      <td className="py-2.5 px-4">{d.sessionsCount}</td>
                      <td className="py-2.5 px-4 font-bold text-[#102D50] dark:text-blue-300">{d.avgAttendancePct}%</td>
                      <td className="py-2.5 px-4">{d.lessonsRecorded}</td>
                      <td className="py-2.5 px-4 text-[#B83232] dark:text-red-400 font-semibold">{d.unconductedLessons}</td>
                      <td className="py-2.5 px-4 font-semibold">{d.escalatedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ESCALATED CHRONIC ABSENCES */}
          <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-[#102D50] dark:text-white">
              Principal Chronic Absence Escalations ({escalatedCases.length})
            </h2>
            {escalatedCases.length === 0 ? (
              <p className="text-slate-600 dark:text-slate-300">No unresolved chronic cases escalated to Principal.</p>
            ) : (
              <div className="space-y-3">
                {escalatedCases.map((c) => (
                  <div key={c.id} className="rounded-xl border border-[#B83232]/30 bg-red-50/30 dark:bg-red-950/20 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="font-mono font-bold text-[#B83232] dark:text-red-300">
                        {c.studentRegNo} · {c.unitCode} ({c.termAbsenceCount} term absences)
                      </span>
                      <strong className="block text-sm text-slate-900 dark:text-white">{c.studentName}</strong>
                      <span className="text-slate-600 dark:text-slate-300">{c.departmentName} · Status: {c.status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleResolveCase(c.id, 'APPROVED')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-semibold"
                      >
                        Approve Compassionate Excusal
                      </button>
                      <button
                        type="button"
                        onClick={() => handleResolveCase(c.id, 'CLOSED')}
                        className="px-3 py-1.5 rounded-lg bg-[#102D50] text-white font-semibold"
                      >
                        Close with Welfare Plan
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* EXECUTIVE 14-REPORT CENTRE */}
          <TeachingReportsPage />
        </>
      )}
    </div>
  );
}

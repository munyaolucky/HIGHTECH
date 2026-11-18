import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Database,
  Lock,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import {
  HITECH_CURRICULUM_UNITS,
  type AcademicPeriodApiRecord,
  type AcademicRegistrationApiRecord,
} from '../../../data/academicUnitsCatalog';
import { SkeletonCardList } from '../../../components/ui/StudentSkeletons';

interface CloudSqlAcademicRegistrationCardProps {
  onNotify: (type: 'ok' | 'err', message: string) => void;
}

const FEE_THRESHOLD_KES = 20000;

export default function CloudSqlAcademicRegistrationCard({
  onNotify,
}: CloudSqlAcademicRegistrationCardProps) {
  const [registrations, setRegistrations] = useState<AcademicRegistrationApiRecord[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriodApiRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);

  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedUnitCodes, setSelectedUnitCodes] = useState<string[]>([
    'ICT-201',
    'ICT-204',
    'ICT-310',
    'COM-101',
  ]);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setAuthRequired(false);

      const [structRes, regRes] = await Promise.all([
        fetch('/api/platform/academic-structure', { credentials: 'include' }),
        fetch('/api/platform/academic-registrations', { credentials: 'include' }),
      ]);

      const structJson = await structRes.json();
      if (structJson?.success && Array.isArray(structJson.data?.periods)) {
        const pList = structJson.data.periods as AcademicPeriodApiRecord[];
        setPeriods(pList);
        const upcomingOpen = pList.find((p) => p.registrationOpen && !p.isCurrent) ?? pList.find((p) => p.registrationOpen);
        setSelectedPeriodId((prev) => prev || upcomingOpen?.id || pList[0]?.id || '');
      }

      if (regRes.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      const regJson = await regRes.json();
      if (regJson?.success && Array.isArray(regJson.data)) {
        setRegistrations(regJson.data);
      }
    } catch {
      // Leave calm error fallback without breaking student dashboard
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openPeriods = useMemo(() => periods.filter((p) => p.registrationOpen), [periods]);

  const registeredPeriodIds = useMemo(
    () =>
      new Set(
        registrations
          .filter((r) => r.approvalStatus !== 'REJECTED')
          .map((r) => r.academicPeriodId)
      ),
    [registrations]
  );

  const selectedUnits = useMemo(
    () => HITECH_CURRICULUM_UNITS.filter((u) => selectedUnitCodes.includes(u.code)),
    [selectedUnitCodes]
  );

  const totalSelectedCredits = useMemo(
    () => selectedUnits.reduce((sum, u) => sum + u.credits, 0),
    [selectedUnits]
  );

  const toggleUnit = (code: string) => {
    setSelectedUnitCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPeriodId) {
      onNotify('err', 'Select an open trimester to submit registration.');
      return;
    }
    if (selectedUnits.length === 0) {
      onNotify('err', 'Select at least one curriculum unit.');
      return;
    }
    if (totalSelectedCredits > 24) {
      onNotify('err', 'Total credit load cannot exceed 24 credits per trimester.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/platform/academic-registrations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academicPeriodId: selectedPeriodId,
          units: selectedUnits.map(({ code, title, credits }) => ({ code, title, credits })),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        onNotify('err', json.error || 'Could not submit Cloud SQL trimester registration.');
        return;
      }
      onNotify(
        'ok',
        `Submitted ${json.data.unitsJson.length} units (${json.data.totalCredits} credits) for ${json.data.intakeCode}. Status: ${json.data.approvalStatus}.`
      );
      await loadData();
    } catch (err) {
      onNotify(
        'err',
        err instanceof Error ? err.message : 'Network error submitting trimester registration.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const latestFeeBalance = registrations[0]?.feeBalanceKes;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 text-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-[#1769AA] font-mono font-bold text-[11px] uppercase tracking-wider">
            <Database size={14} />
            <span>OFFICIAL ACADEMIC REGISTRY · CLOUD SQL POSTGRESQL (FEAT-016)</span>
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1">
            Official Trimester Academic Registration &amp; Fee Clearance
          </h3>
          <p className="text-slate-600 dark:text-slate-300 mt-0.5">
            Register curriculum units for open intakes and track Registrar approval &amp; KES {FEE_THRESHOLD_KES.toLocaleString()} fee-threshold clearance.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadData()}
          disabled={loading}
          className="px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 inline-flex items-center gap-1.5 shrink-0"
        >
          <RefreshCw size={13} /> Sync Registry
        </button>
      </div>

      {authRequired ? (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Lock size={16} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Sign in via Portal Authentication to Load Live Cloud SQL Records</p>
              <p className="text-[11px] text-amber-900 mt-0.5">
                Authenticated student sessions (e.g. awanjiku@student.hitech.ac.ke) unlock live PostgreSQL unit submission and Registrar fee clearance verification.
              </p>
            </div>
          </div>
          <a
            href="/portal/login"
            className="px-3.5 py-2 bg-[#092c60] hover:bg-[#061f46] text-white font-bold rounded-lg whitespace-nowrap text-center shrink-0"
          >
            Portal Sign In
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Existing Live PostgreSQL Registrations */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <ShieldCheck size={15} className="text-emerald-600" />
                Recorded Trimester Enrolments ({registrations.length})
              </h4>
              {typeof latestFeeBalance === 'number' && (
                <span
                  className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded border ${
                    latestFeeBalance <= FEE_THRESHOLD_KES
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-[#B83232] border-red-200'
                  }`}
                >
                  Fee Bal: KES {latestFeeBalance.toLocaleString()}
                </span>
              )}
            </div>

            {loading ? (
              <SkeletonCardList
                items={2}
                columns={1}
                showMeta
                showAction={false}
                label="Loading live PostgreSQL academic registrations..."
              />
            ) : registrations.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-600">
                No Cloud SQL trimester registrations submitted yet. Use the form to register for an open intake.
              </div>
            ) : (
              <div className="space-y-3">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <span className="font-mono font-bold text-[#1769AA]">{reg.intakeCode}</span>{' '}
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          — {reg.semesterName}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          reg.approvalStatus === 'APPROVED'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : reg.approvalStatus === 'REJECTED'
                            ? 'bg-red-50 text-[#B83232] border-red-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {reg.approvalStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {reg.unitsJson.map((u) => (
                        <span
                          key={u.code}
                          className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-200"
                        >
                          {u.code} · {u.credits} Cr
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-300 pt-1 border-t border-slate-200/70 dark:border-slate-700">
                      <span>
                        Total Load: <strong>{reg.totalCredits} Credits</strong>
                        {reg.approvedByName ? ` · Reviewed by ${reg.approvedByName}` : ' · Awaiting Registrar review'}
                      </span>
                      {reg.feeThresholdCleared ? (
                        <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
                          <CheckCircle2 size={12} /> Fee Cleared
                        </span>
                      ) : (
                        <span className="text-[#B83232] font-semibold inline-flex items-center gap-1">
                          <AlertTriangle size={12} /> Fee Clearance Hold
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Submit New Trimester Registration */}
          <form
            onSubmit={handleSubmit}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <BookOpen size={15} className="text-[#092c60]" />
                Register for Open Trimester
              </h4>
              <span className="font-mono font-bold text-[11px] text-[#092c60] bg-white px-2 py-0.5 rounded border border-slate-200">
                {selectedUnits.length} Units · {totalSelectedCredits} / 24 Cr
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Open Academic Period
              </label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg"
                required
              >
                {openPeriods.map((p) => {
                  const alreadyRegistered = registeredPeriodIds.has(p.id);
                  return (
                    <option key={p.id} value={p.id} disabled={alreadyRegistered}>
                      {p.intakeCode} — {p.semesterName} {alreadyRegistered ? '(Already Registered)' : `(${p.status})`}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {HITECH_CURRICULUM_UNITS.map((unit) => {
                const checked = selectedUnitCodes.includes(unit.code);
                return (
                  <label
                    key={unit.code}
                    className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer ${
                      checked
                        ? 'bg-blue-50 border-[#1769AA] text-[#092c60]'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleUnit(unit.code)}
                      />
                      <span className="font-mono font-bold shrink-0">{unit.code}</span>
                      <span className="truncate">{unit.title}</span>
                    </span>
                    <span className="font-mono text-[11px] font-semibold shrink-0">{unit.credits} Cr</span>
                  </label>
                );
              })}
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                selectedUnits.length === 0 ||
                totalSelectedCredits > 24 ||
                registeredPeriodIds.has(selectedPeriodId)
              }
              className="w-full py-2.5 bg-[#092c60] hover:bg-[#061f46] text-white font-bold rounded-lg disabled:opacity-50"
            >
              {registeredPeriodIds.has(selectedPeriodId)
                ? 'Already Submitted for Selected Period'
                : submitting
                ? 'Submitting to Academic Registry...'
                : 'Submit Trimester Registration (Cloud SQL)'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

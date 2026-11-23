import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import {
  HITECH_CURRICULUM_UNITS,
  type AcademicPeriodApiRecord,
  type AcademicRegistrationApiRecord,
} from '../../data/academicUnitsCatalog';

interface SisStudentLite {
  id: string;
  registrationNumber: string;
  fullName: string;
  programmeName: string | null;
  campusName: string | null;
  status: string;
  feeBalanceKes: number | null;
}

const FEE_THRESHOLD_KES = 20000;

export default function SemesterRegistrationTab() {
  const [records, setRecords] = useState<AcademicRegistrationApiRecord[]>([]);
  const [periods, setPeriods] = useState<AcademicPeriodApiRecord[]>([]);
  const [students, setStudents] = useState<SisStudentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [authRequired, setAuthRequired] = useState(false);
  const [notice, setNotice] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [periodFilter, setPeriodFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Create form drawer
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedPeriodId, setSelectedPeriodId] = useState('');
  const [selectedUnitCodes, setSelectedUnitCodes] = useState<string[]>(['ICT-201', 'ICT-204', 'ICT-207']);
  const [autoApprove, setAutoApprove] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Inline decision state
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [decisionNote, setDecisionNote] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setAuthRequired(false);
      const [regRes, structRes, stuRes] = await Promise.all([
        fetch('/api/platform/academic-registrations', { credentials: 'include' }),
        fetch('/api/platform/academic-structure', { credentials: 'include' }),
        fetch('/api/sis/students', { credentials: 'include' }),
      ]);

      if (regRes.status === 401 || stuRes.status === 401) {
        setAuthRequired(true);
        setLoading(false);
        return;
      }

      const [regJson, structJson, stuJson] = await Promise.all([
        regRes.json(),
        structRes.json(),
        stuRes.json(),
      ]);

      if (regJson?.success && Array.isArray(regJson.data)) {
        setRecords(regJson.data);
      }
      if (structJson?.success && Array.isArray(structJson.data?.periods)) {
        const pList = structJson.data.periods as AcademicPeriodApiRecord[];
        setPeriods(pList);
        const firstOpen = pList.find((p) => p.registrationOpen);
        setSelectedPeriodId((prev) => prev || firstOpen?.id || pList[0]?.id || '');
      }
      if (stuJson?.success && Array.isArray(stuJson.data?.items)) {
        const sList = stuJson.data.items as SisStudentLite[];
        setStudents(sList);
        setSelectedStudentId((prev) => prev || sList[0]?.id || '');
      }
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Unable to fetch Cloud SQL semester registrations.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const openPeriods = useMemo(() => periods.filter((p) => p.registrationOpen), [periods]);

  const selectedUnits = useMemo(
    () => HITECH_CURRICULUM_UNITS.filter((u) => selectedUnitCodes.includes(u.code)),
    [selectedUnitCodes]
  );

  const selectedTotalCredits = useMemo(
    () => selectedUnits.reduce((sum, u) => sum + u.credits, 0),
    [selectedUnits]
  );

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId]
  );

  const stats = useMemo(() => {
    return {
      total: records.length,
      pending: records.filter((r) => r.approvalStatus === 'PENDING').length,
      approved: records.filter((r) => r.approvalStatus === 'APPROVED').length,
      feeHolds: records.filter((r) => !r.feeThresholdCleared).length,
    };
  }, [records]);

  const filteredRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return records.filter((r) => {
      if (statusFilter !== 'ALL' && r.approvalStatus !== statusFilter) return false;
      if (periodFilter !== 'ALL' && r.academicPeriodId !== periodFilter) return false;
      if (q) {
        const hay = `${r.studentName} ${r.registrationNumber} ${r.programmeName ?? ''} ${r.intakeCode} ${r.semesterName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [records, statusFilter, periodFilter, searchQuery]);

  const toggleUnit = (code: string) => {
    setSelectedUnitCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handleSubmitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);

    if (!selectedStudentId || !selectedPeriodId) {
      setNotice({ type: 'err', text: 'Select both a student profile and an open academic period.' });
      return;
    }
    if (selectedUnits.length === 0) {
      setNotice({ type: 'err', text: 'Select at least one curriculum unit.' });
      return;
    }
    if (selectedTotalCredits > 24) {
      setNotice({ type: 'err', text: 'Maximum credit load per trimester is 24 credits.' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/platform/academic-registrations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentProfileId: selectedStudentId,
          academicPeriodId: selectedPeriodId,
          units: selectedUnits.map(({ code, title, credits }) => ({ code, title, credits })),
          autoApprove,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotice({ type: 'err', text: json.error || 'Could not register student units.' });
        return;
      }
      setNotice({
        type: 'ok',
        text: `Registered ${json.data.registrationNumber} for ${json.data.intakeCode} (${json.data.totalCredits} credits · Status: ${json.data.approvalStatus}).`,
      });
      setShowCreateForm(false);
      await loadData();
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Network error submitting academic registration.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecision = async (
    reg: AcademicRegistrationApiRecord,
    decision: 'APPROVED' | 'REJECTED',
    feeThresholdOverride = false
  ) => {
    setNotice(null);
    setDecidingId(reg.id);
    try {
      const res = await fetch(`/api/platform/academic-registrations/${encodeURIComponent(reg.id)}/decision`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          feeThresholdOverride,
          comment: decisionNote.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setNotice({ type: 'err', text: json.error || 'Failed to record Registrar decision.' });
        return;
      }
      setDecisionNote('');
      setNotice({
        type: 'ok',
        text: `${reg.registrationNumber} (${reg.intakeCode}) marked ${json.data.approvalStatus}${
          feeThresholdOverride ? ' with Registrar fee clearance override' : ''
        }.`,
      });
      await loadData();
    } catch (err) {
      setNotice({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error updating academic registration.',
      });
    } finally {
      setDecidingId(null);
    }
  };

  if (authRequired) {
    return (
      <div className="bg-white rounded-2xl border border-amber-200 p-8 text-center space-y-3 max-w-xl mx-auto">
        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto">
          <Lock size={20} />
        </div>
        <h3 className="text-base font-bold text-[#092c60]">Registrar Cloud SQL Session Required</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Semester unit registrations and fee-clearance approvals are stored live in Cloud SQL PostgreSQL with strict Registrar/Admin RBAC enforcement. Sign in via the Unified Portal Login to load and approve records.
        </p>
        <div className="pt-2 flex items-center justify-center gap-3">
          <a
            href="/portal/login"
            className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-bold rounded-xl"
          >
            Sign In at /portal/login
          </a>
          <button
            type="button"
            onClick={() => void loadData()}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {notice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-3 ${
            notice.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <span>{notice.text}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Total Registrations</p>
          <p className="text-2xl font-extrabold text-[#092c60] mt-1 font-mono tabular-nums">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">Pending Approval</p>
          <p className="text-2xl font-extrabold text-amber-700 mt-1 font-mono tabular-nums">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Approved &amp; Confirmed</p>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono tabular-nums">{stats.approved}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#B83232]">Fee Threshold Holds</p>
          <p className="text-2xl font-extrabold text-[#B83232] mt-1 font-mono tabular-nums">{stats.feeHolds}</p>
        </div>
      </div>

      {/* Controls Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reg no, student, intake..."
              className="pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED')}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
          >
            <option value="ALL">All Academic Periods</option>
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.intakeCode} — {p.semesterName}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={decisionNote}
            onChange={(e) => setDecisionNote(e.target.value)}
            placeholder="Optional Registrar decision note..."
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg w-56"
          />
          <button
            type="button"
            onClick={() => void loadData()}
            disabled={loading}
            className="px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg inline-flex items-center gap-1.5"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowCreateForm((v) => !v)}
            className="px-3.5 py-1.5 text-xs font-bold bg-[#092c60] hover:bg-[#061f46] text-white rounded-lg inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> {showCreateForm ? 'Close Enrolment Form' : 'Register Student Units'}
          </button>
        </div>
      </div>

      {/* Registrar Create Registration Form */}
      {showCreateForm && (
        <form
          onSubmit={handleSubmitRegistration}
          className="bg-white rounded-2xl border border-[#1769AA]/30 shadow-sm p-5 space-y-4 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#092c60] flex items-center gap-2">
                <BookOpen size={16} className="text-[#1769AA]" />
                Register Student for Trimester Units (Cloud SQL)
              </h3>
              <p className="text-slate-500 mt-0.5">
                Validates open academic period, maximum 24-credit cap, duplicate-period guard, and KES 20,000 fee threshold.
              </p>
            </div>
            <span className="font-mono font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-[#092c60]">
              {selectedUnits.length} Units · {selectedTotalCredits} / 24 Credits
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Student Profile</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                required
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.registrationNumber} — {s.fullName} ({s.status})
                  </option>
                ))}
              </select>
              {selectedStudent && (
                <p className="mt-1.5 text-[11px] text-slate-600">
                  Programme: <strong>{selectedStudent.programmeName || 'Unassigned'}</strong> · Fee Balance:{' '}
                  <strong
                    className={
                      (selectedStudent.feeBalanceKes ?? 0) > FEE_THRESHOLD_KES
                        ? 'text-[#B83232]'
                        : 'text-emerald-700'
                    }
                  >
                    KES {(selectedStudent.feeBalanceKes ?? 0).toLocaleString()}
                  </strong>{' '}
                  {(selectedStudent.feeBalanceKes ?? 0) > FEE_THRESHOLD_KES
                    ? '(Exceeds KES 20,000 — submits as PENDING for override)'
                    : '(Fee threshold cleared)'}
                </p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Open Academic Period</label>
              <select
                value={selectedPeriodId}
                onChange={(e) => setSelectedPeriodId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                required
              >
                {openPeriods.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.intakeCode} — {p.semesterName} ({p.status})
                  </option>
                ))}
              </select>
              <label className="mt-2 inline-flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoApprove}
                  onChange={(e) => setAutoApprove(e.target.checked)}
                />
                <span>Auto-approve immediately if fee threshold (KES 20,000) is cleared</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">
              Select Trimester Units (1–8 units, max 24 credits)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {HITECH_CURRICULUM_UNITS.map((unit) => {
                const checked = selectedUnitCodes.includes(unit.code);
                return (
                  <label
                    key={unit.code}
                    className={`p-2.5 rounded-xl border cursor-pointer flex items-start gap-2 transition ${
                      checked
                        ? 'bg-blue-50 border-[#1769AA] text-[#092c60]'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleUnit(unit.code)}
                      className="mt-0.5"
                    />
                    <div className="min-w-0">
                      <div className="font-mono font-bold text-[11px]">
                        {unit.code} · {unit.credits} Cr
                      </div>
                      <div className="text-[11px] leading-snug">{unit.title}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || selectedUnits.length === 0}
              className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white rounded-lg font-bold disabled:opacity-60"
            >
              {submitting ? 'Submitting to Cloud SQL...' : 'Commit Academic Registration'}
            </button>
          </div>
        </form>
      )}

      {/* Live Cloud SQL Registrations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ClipboardCheck size={16} className="text-[#1769AA]" />
              Cloud SQL Trimester Academic Registrations ({filteredRecords.length})
            </h3>
            <p className="text-xs text-slate-500">
              Official unit enrolments validated against KES 20,000 fee clearance threshold and Registrar authorization
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">
            Loading live semester registrations from Cloud SQL PostgreSQL...
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No semester registration records match the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 uppercase font-semibold">
                <tr>
                  <th className="p-3.5">Student &amp; Reg No</th>
                  <th className="p-3.5">Trimester / Intake</th>
                  <th className="p-3.5">Registered Units</th>
                  <th className="p-3.5">Fee Threshold</th>
                  <th className="p-3.5">Approval Status</th>
                  <th className="p-3.5 text-right">Registry Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.map((reg) => {
                  const isBusy = decidingId === reg.id;
                  return (
                    <tr key={reg.id} className="hover:bg-slate-50/70 align-top">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-[#092c60]">{reg.registrationNumber}</div>
                        <div className="font-bold text-slate-900 mt-0.5">{reg.studentName}</div>
                        <div className="text-[11px] text-slate-500">{reg.programmeName || 'Programme N/A'}</div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-[#1769AA]">{reg.intakeCode}</div>
                        <div className="text-slate-700">{reg.semesterName}</div>
                        <div className="text-[11px] text-slate-500">Student Status: {reg.studentStatus}</div>
                      </td>
                      <td className="p-3.5 max-w-xs">
                        <div className="font-semibold text-slate-800 mb-1">
                          {reg.unitsJson.length} Units ·{' '}
                          <span className="font-mono text-[#092c60]">{reg.totalCredits} Credits</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {reg.unitsJson.map((u) => (
                            <span
                              key={u.code}
                              className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-700"
                              title={u.title}
                            >
                              {u.code} ({u.credits})
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-800">
                          KES {Number(reg.feeBalanceKes ?? 0).toLocaleString()}
                        </div>
                        {reg.feeThresholdCleared ? (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 size={11} /> Cleared
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-[#B83232] border border-red-200">
                            <ShieldAlert size={11} /> Hold (&gt; 20k)
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            reg.approvalStatus === 'APPROVED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : reg.approvalStatus === 'REJECTED'
                              ? 'bg-red-50 text-[#B83232] border-red-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {reg.approvalStatus}
                        </span>
                        {reg.approvedByName && (
                          <div className="text-[11px] text-slate-500 mt-1">By: {reg.approvedByName}</div>
                        )}
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        {reg.approvalStatus === 'PENDING' ? (
                          <div className="inline-flex flex-col sm:flex-row gap-1.5 justify-end">
                            {reg.feeThresholdCleared ? (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleDecision(reg, 'APPROVED', false)}
                                className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                <CheckCircle2 size={12} /> Approve
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => void handleDecision(reg, 'APPROVED', true)}
                                className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold inline-flex items-center gap-1 disabled:opacity-50"
                              >
                                <AlertTriangle size={12} /> Override Fee &amp; Approve
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleDecision(reg, 'REJECTED', false)}
                              className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-[#B83232] border border-red-200 font-semibold inline-flex items-center gap-1 disabled:opacity-50"
                            >
                              <XCircle size={12} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-medium">Decision Recorded</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

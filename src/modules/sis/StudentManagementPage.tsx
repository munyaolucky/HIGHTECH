import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Eye,
  GraduationCap,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type { StaffUserAccount } from '../../config/staff-navigation';
import {
  StaffButton,
  StaffPageHeader,
  StaffSearchToolbar,
  StaffStatCard,
  StaffStatusTag,
} from '../staff/components/StaffDashboardUI';
import StudentProfileDetailPage from './StudentProfileDetailPage';

interface StudentSummaryItem {
  id: string;
  registrationNumber: string;
  fullName: string;
  email: string;
  campusName: string | null;
  departmentName: string | null;
  programmeName: string | null;
  intakeName: string | null;
  yearOfStudy: number;
  status: string;
}

interface LookupData {
  campuses: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
  intakes: string[];
}

export default function StudentManagementPage({
  user,
  initialStudentId,
}: {
  user: StaffUserAccount;
  initialStudentId?: string;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    initialStudentId ?? null
  );
  const [students, setStudents] = useState<StudentSummaryItem[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    admittedStudents: 0,
    deferredStudents: 0,
    completedOrGraduated: 0,
  });
  const [canCreate, setCanCreate] = useState(false);
  const [lookups, setLookups] = useState<LookupData>({
    campuses: [],
    programmes: [],
    intakes: ['September 2026 Intake', 'January 2026 Intake'],
  });

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [campusFilter, setCampusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Enrolment Report panel
  const [showReport, setShowReport] = useState(false);
  const [report, setReport] = useState<{
    totalRecords: number;
    byCampus: Record<string, number>;
    byStatus: Record<string, number>;
    byProgramme: Record<string, number>;
  } | null>(null);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCampusId, setNewCampusId] = useState('cmp-nairobi');
  const [newProgrammeId, setNewProgrammeId] = useState('prog-dict-l6');
  const [newIntake, setNewIntake] = useState('September 2026 Intake');
  const [newGuardianName, setNewGuardianName] = useState('');
  const [newGuardianPhone, setNewGuardianPhone] = useState('');

  const loadStudents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        campusId: campusFilter,
      });
      const [res, lkpRes] = await Promise.all([
        fetch(`/api/sis/students?${params.toString()}`, { credentials: 'include' }),
        fetch('/api/sis/lookups', { credentials: 'include' }),
      ]);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Unable to load SIS students.');
        return;
      }
      setStudents(json.data.items ?? []);
      setStats(json.data.stats);
      setCanCreate(Boolean(json.data.canCreate));

      const lkpJson = await lkpRes.json().catch(() => null);
      if (lkpJson?.success) {
        setLookups({
          campuses: lkpJson.data.campuses ?? [],
          programmes: lkpJson.data.programmes ?? [],
          intakes: lkpJson.data.intakes ?? ['September 2026 Intake'],
        });
      }
    } catch {
      setError('Network error while loading Student Information System.');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, campusFilter]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const handleLoadReport = async () => {
    const next = !showReport;
    setShowReport(next);
    if (next && !report) {
      const res = await fetch('/api/sis/reports/enrolment', { credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setReport(json.data);
      }
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    const res = await fetch('/api/sis/students', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: newName,
        email: newEmail,
        phoneNumber: newPhone,
        campusId: newCampusId,
        programmeId: newProgrammeId,
        intakeName: newIntake,
        guardianName: newGuardianName || undefined,
        guardianPhone: newGuardianPhone || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to create student master record.');
      return;
    }
    setCreateOpen(false);
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewGuardianName('');
    setNewGuardianPhone('');
    setNotice(
      `Created student master profile ${json.data.fullName} with atomic number ${json.data.registrationNumber}.`
    );
    await loadStudents();
    setSelectedStudentId(json.data.id);
  };

  if (selectedStudentId) {
    return (
      <StudentProfileDetailPage
        studentId={selectedStudentId}
        onBack={() => {
          setSelectedStudentId(null);
          loadStudents();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <StaffPageHeader
        title="Student Information System (SIS)"
        description={`Authoritative student master directory, atomic registration sequences, and 14-tab lifecycle records for ${user.roleTitle}.`}
        breadcrumb="Student Information System"
        actions={
          <div className="flex flex-wrap gap-2">
            <StaffButton variant="secondary" onClick={handleLoadReport}>
              <BarChart3 size={15} /> {showReport ? 'Hide Enrolment Report' : 'Enrolment Report'}
            </StaffButton>
            {canCreate && (
              <StaffButton onClick={() => setCreateOpen(true)}>
                <UserPlus size={15} /> New Student Master Record
              </StaffButton>
            )}
          </div>
        }
      />

      {notice && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-4 py-3 text-xs font-semibold text-emerald-900 dark:text-emerald-200 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={15} /> {notice}
          </span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-xs font-semibold text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StaffStatCard
          label="Total Student Records"
          value={stats.totalStudents}
          description="Within your role & department scope"
          icon={Users}
        />
        <StaffStatCard
          label="Active Enrolled"
          value={stats.activeStudents}
          description="In current academic session"
          icon={UserCheck}
        />
        <StaffStatCard
          label="Newly Admitted"
          value={stats.admittedStudents}
          description="Pending trimester registration"
          icon={UserPlus}
        />
        <StaffStatCard
          label="Deferred"
          value={stats.deferredStudents}
          description="Approved academic leave"
          icon={GraduationCap}
        />
        <StaffStatCard
          label="Completed / Graduated"
          value={stats.completedOrGraduated}
          description="Cleared alumni standing"
          icon={GraduationCap}
        />
      </div>

      {/* Enrolment Report Panel */}
      {showReport && report && (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
          <h2 className="text-base font-bold text-[#102D50] dark:text-white">
            Institutional Enrolment Breakdown ({report.totalRecords} Records)
          </h2>
          <div className="grid gap-4 md:grid-cols-3 text-xs">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="font-bold text-[#102D50] dark:text-white">By Campus</div>
              {Object.entries(report.byCampus).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{k}</span>
                  <span className="font-mono font-bold">{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="font-bold text-[#102D50] dark:text-white">By Academic Status</div>
              {Object.entries(report.byStatus).map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-300">{k}</span>
                  <span className="font-mono font-bold">{v}</span>
                </div>
              ))}
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
              <div className="font-bold text-[#102D50] dark:text-white">By Programme</div>
              {Object.entries(report.byProgramme).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-600 dark:text-slate-300 truncate">{k}</span>
                  <span className="font-mono font-bold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Directory */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4">
        <StaffSearchToolbar
          search={search}
          onSearch={setSearch}
          placeholder="Search student name, HCA/STU/... number, email, or programme..."
          filterOptions={['ALL', 'ACTIVE', 'ADMITTED', 'DEFERRED', 'GRADUATED', 'WITHDRAWN']}
          activeFilter={statusFilter}
          onFilterChange={setStatusFilter}
          actions={
            <select
              aria-label="Filter by campus"
              value={campusFilter}
              onChange={(e) => setCampusFilter(e.target.value)}
              className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs font-semibold"
            >
              <option value="ALL">All Campuses</option>
              {lookups.campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          }
        />

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading student directory...</div>
        ) : students.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No student records match your current scope or search filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                  <th className="py-3 pr-4 font-bold">Reg Number</th>
                  <th className="py-3 pr-4 font-bold">Student Name</th>
                  <th className="py-3 pr-4 font-bold">Programme</th>
                  <th className="py-3 pr-4 font-bold">Campus</th>
                  <th className="py-3 pr-4 font-bold">Status</th>
                  <th className="py-3 font-bold text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3.5 pr-4 font-mono font-bold text-[#1769AA]">
                      {s.registrationNumber}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="font-bold text-[#102D50] dark:text-white">{s.fullName}</div>
                      <div className="text-[11px] text-slate-500">{s.email}</div>
                    </td>
                    <td className="py-3.5 pr-4 text-slate-700 dark:text-slate-300">
                      {s.programmeName}
                    </td>
                    <td className="py-3.5 pr-4 text-slate-600 dark:text-slate-300">
                      {s.campusName}
                    </td>
                    <td className="py-3.5 pr-4">
                      <StaffStatusTag status={s.status} />
                    </td>
                    <td className="py-3.5 text-right">
                      <StaffButton
                        variant="secondary"
                        onClick={() => setSelectedStudentId(s.id)}
                      >
                        <Eye size={13} /> Open 14-Tab Profile
                      </StaffButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Create Student Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-[#102D50] dark:text-white">
                  Create Student Master Record
                </h3>
                <p className="text-xs text-slate-500">
                  Atomically allocates a new HCA/STU/2026/NNNN registration number and portal account.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="text-xs font-semibold text-slate-500"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-3 text-xs">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="Student full legal name"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="student@hitech.ac.ke"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+254 7XX XXX XXX"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  aria-label="Campus"
                  value={newCampusId}
                  onChange={(e) => setNewCampusId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {lookups.campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Programme"
                  value={newProgrammeId}
                  onChange={(e) => setNewProgrammeId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                >
                  {lookups.programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                value={newIntake}
                onChange={(e) => setNewIntake(e.target.value)}
                placeholder="Intake Cohort"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="text"
                  value={newGuardianName}
                  onChange={(e) => setNewGuardianName(e.target.value)}
                  placeholder="Optional primary guardian name"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
                <input
                  type="text"
                  value={newGuardianPhone}
                  onChange={(e) => setNewGuardianPhone(e.target.value)}
                  placeholder="Optional guardian phone"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <StaffButton variant="secondary" onClick={() => setCreateOpen(false)}>
                  Cancel
                </StaffButton>
                <StaffButton type="submit">Create &amp; Allocate Reg Number</StaffButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

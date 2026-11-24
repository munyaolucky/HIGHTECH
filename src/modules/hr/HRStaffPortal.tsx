import React, { useState } from 'react';
import {
  Briefcase,
  Users,
  FileSignature,
  CalendarClock,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Plus,
  FileText,
} from 'lucide-react';
import { hrService } from '../../services/hrService';
import { getNairobiTodayDate } from '../../services/hostelsService';
import {
  HROperatorRole,
  StaffAttendanceStatus,
  StaffEmploymentStatus,
  StaffEmploymentType,
  StaffLeaveType,
  StaffWorkloadType,
} from '../../types/hr';
import { COLLEGE_INFO } from '../../data/college';
import { useSyncedPortalTab } from '../../context/PortalShellContext';
import ModuleDocumentRepository from '../documents/ModuleDocumentRepository';

type TabId = 'directory' | 'contracts' | 'leave' | 'attendance' | 'workloads' | 'hr_docs';

const ACTORS: Record<HROperatorRole, { userId: string; name: string; label: string; isHR: boolean }> = {
  HR_OFFICER_PRIMARY: {
    userId: 'usr-hr-primary',
    name: 'Beatrice Wanjiku (HR Officer)',
    label: 'HR Officer (Creator)',
    isHR: true,
  },
  HR_REVIEWER_INDEPENDENT: {
    userId: 'usr-hr-reviewer',
    name: 'Dr. Samuel Karanja (Principal / Reviewer)',
    label: 'Independent HR Reviewer',
    isHR: true,
  },
  STAFF_SELF_SERVICE: {
    userId: 'usr-lecturer-kamau',
    name: 'Eng. Peter Kamau Njoroge',
    label: 'Staff Self-Service (Kamau)',
    isHR: false,
  },
};

export default function HRStaffPortal() {
  const [role, setRole] = useState<HROperatorRole>('HR_OFFICER_PRIMARY');
  const [activeTab, setActiveTab] = useSyncedPortalTab<TabId>('hr', 'directory');
  const [search, setSearch] = useState('');
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const actor = ACTORS[role];
  const state = hrService.getState();
  const nairobiToday = getNairobiTodayDate();
  void tick;

  // Forms
  const [empNo, setEmpNo] = useState('HCA/STAFF/2026/004');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState(COLLEGE_INFO.campuses[0].name);
  const [dept, setDept] = useState('School of Computing & Informatics');
  const [jobTitle, setJobTitle] = useState('');
  const [empType, setEmpType] = useState<StaffEmploymentType>('FULL_TIME');
  const [workLoc, setWorkLoc] = useState('Academic Towers Floor 2');

  const [cntStaffId, setCntStaffId] = useState(state.staff[0]?.id ?? '');
  const [cntPos, setCntPos] = useState('');
  const [cntType, setCntType] = useState<StaffEmploymentType>('FULL_TIME');
  const [cntStart, setCntStart] = useState('2026-11-01');
  const [cntEnd, setCntEnd] = useState('2027-10-31');
  const [cntSalary, setCntSalary] = useState('110000');
  const [cntReviewNote, setCntReviewNote] = useState<Record<string, string>>({});

  const [lvType, setLvType] = useState<StaffLeaveType>('ANNUAL');
  const [lvStart, setLvStart] = useState(nairobiToday);
  const [lvEnd, setLvEnd] = useState(nairobiToday);
  const [lvDays, setLvDays] = useState('1');
  const [lvReason, setLvReason] = useState('');
  const [lvReviewNote, setLvReviewNote] = useState<Record<string, string>>({});

  const [attStaffId, setAttStaffId] = useState(state.staff[0]?.id ?? '');
  const [attDate, setAttDate] = useState(nairobiToday);
  const [attStatus, setAttStatus] = useState<StaffAttendanceStatus>('PRESENT');
  const [attIn, setAttIn] = useState('08:00');
  const [attOut, setAttOut] = useState('17:00');
  const [attNote, setAttNote] = useState('');

  const [wklStaffId, setWklStaffId] = useState(state.staff[0]?.id ?? '');
  const [wklType, setWklType] = useState<StaffWorkloadType>('TEACHING');
  const [wklCourse, setWklCourse] = useState('DICT-L6 / CS-301');
  const [wklTitle, setWklTitle] = useState('');
  const [wklHours, setWklHours] = useState('12');

  const runAction = (res: { ok: boolean; error?: string }, okText: string) => {
    if (res.ok) {
      setFeedback({ type: 'ok', text: okText });
      setTick((t) => t + 1);
    } else {
      setFeedback({ type: 'err', text: res.error || 'Action denied.' });
    }
  };

  const selfStaff = state.staff.find((s) => s.userId === actor.userId);
  const visibleStaff = actor.isHR
    ? state.staff.filter(
        (s) =>
          !search.trim() ||
          s.fullName.toLowerCase().includes(search.toLowerCase()) ||
          s.employeeNumber.toLowerCase().includes(search.toLowerCase())
      )
    : state.staff.filter((s) => s.userId === actor.userId);

  const visibleContracts = actor.isHR
    ? state.contracts
    : state.contracts.filter((c) => c.staffId === selfStaff?.id);
  const visibleLeave = actor.isHR
    ? state.leaveRequests
    : state.leaveRequests.filter((l) => l.staffId === selfStaff?.id);
  const visibleAttendance = actor.isHR
    ? state.attendance
    : state.attendance.filter((a) => a.staffId === selfStaff?.id);
  const visibleWorkloads = actor.isHR
    ? state.workloads
    : state.workloads.filter((w) => w.staffId === selfStaff?.id);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153b70] to-[#0b1f42] rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <Briefcase className="w-4 h-4" />
              <span>Human Resources &amp; Faculty Operations • {nairobiToday} EAT</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              HR &amp; Staff Management Portal
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Staff directory (HCA/STAFF/…), independent-review contracts, half-day overlap-safe
              leave approvals, Nairobi timezone attendance, and academic course workloads.
            </p>
          </div>

          <div className="bg-black/25 border border-white/15 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              HR Actor Perspective (Tests Creator ≠ Reviewer Guardrails)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ACTORS) as HROperatorRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setFeedback(null);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    role === r
                      ? 'bg-amber-400 text-[#092c60] shadow'
                      : 'bg-white/10 text-blue-100 hover:bg-white/20'
                  }`}
                >
                  {ACTORS[r].label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Active Staff Profiles</div>
            <div className="text-xl font-black mt-0.5">
              {state.staff.filter((s) => s.status !== 'TERMINATED').length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Contracts Pending Review</div>
            <div className="text-xl font-black mt-0.5 text-amber-300">
              {state.contracts.filter((c) => c.status === 'SUBMITTED').length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Submitted Leave Requests</div>
            <div className="text-xl font-black mt-0.5">
              {state.leaveRequests.filter((l) => l.status === 'SUBMITTED').length}
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <div className="text-[11px] text-blue-200 font-semibold">Active Weekly Teaching Hrs</div>
            <div className="text-xl font-black mt-0.5">
              {state.workloads
                .filter((w) => w.status === 'ACTIVE')
                .reduce((acc, w) => acc + w.weeklyHours, 0)}{' '}
              hrs
            </div>
          </div>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button type="button" onClick={() => setFeedback(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'directory', label: 'Staff Directory & HR Docs', icon: Users },
          { id: 'contracts', label: 'Contracts & Independent Review', icon: FileSignature },
          { id: 'leave', label: 'Leave Requests', icon: CalendarClock },
          { id: 'attendance', label: 'Daily Attendance (EAT)', icon: Clock },
          { id: 'workloads', label: 'Faculty Workloads', icon: Layers },
          { id: 'hr_docs', label: 'Staff HR Files (Confidential)', icon: FileText },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as TabId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-extrabold flex items-center gap-2 transition ${
                activeTab === t.id
                  ? 'bg-[#153b70] text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* DIRECTORY */}
      {activeTab === 'directory' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-extrabold text-[#153b70]">
                {actor.isHR ? 'Institutional Staff Registry' : 'My Staff Self-Service Profile'}
              </h2>
              {actor.isHR && (
                <input
                  type="text"
                  placeholder="Search HCA/STAFF or name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 text-xs w-60"
                />
              )}
            </div>

            <div className="space-y-3">
              {visibleStaff.map((s) => (
                <div key={s.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-[#153b70] bg-blue-100 px-2 py-0.5 rounded">
                        {s.employeeNumber}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900">{s.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : s.status === 'PROBATION'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {s.status}
                      </span>
                      {actor.isHR && (
                        <select
                          aria-label={`Update status for ${s.fullName}`}
                          value={s.status}
                          onChange={(e) =>
                            runAction(
                              hrService.updateStaffStatus(
                                s.id,
                                e.target.value as StaffEmploymentStatus,
                                actor.name
                              ),
                              `Updated ${s.fullName} status.`
                            )
                          }
                          className="border border-slate-300 rounded px-2 py-0.5 text-[10px] bg-white font-bold"
                        >
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="PROBATION">PROBATION</option>
                          <option value="ON_LEAVE">ON_LEAVE</option>
                          <option value="TERMINATED">TERMINATED (Cascades Contracts)</option>
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="text-slate-600">
                    <strong>{s.jobTitle}</strong> • {s.department} • {s.branch}
                  </div>
                  <div className="text-slate-500">
                    Type: {s.employmentType} • Joined: {s.joiningDate} • Location: {s.workLocation}
                  </div>
                  {s.linkedDocumentRefs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {s.linkedDocumentRefs.map((d) => (
                        <span
                          key={d}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-[10px] font-semibold text-slate-700"
                        >
                          <FileText className="w-3 h-3 text-[#153b70]" />
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            {actor.isHR ? (
              <>
                <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Create Staff Profile</span>
                </h3>
                <input
                  type="text"
                  placeholder="Employee No e.g. HCA/STAFF/2026/004"
                  value={empNo}
                  onChange={(e) => setEmpNo(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
                />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <input
                  type="email"
                  placeholder="Official College Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  {COLLEGE_INFO.campuses.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Department"
                  value={dept}
                  onChange={(e) => setDept(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <select
                  value={empType}
                  onChange={(e) => setEmpType(e.target.value as StaffEmploymentType)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
                >
                  <option value="FULL_TIME">FULL_TIME</option>
                  <option value="PART_TIME">PART_TIME</option>
                  <option value="ADJUNCT_TRAINER">ADJUNCT_TRAINER</option>
                  <option value="CONTRACT">CONTRACT</option>
                </select>
                <input
                  type="text"
                  placeholder="Work Location"
                  value={workLoc}
                  onChange={(e) => setWorkLoc(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!fullName || !email || !jobTitle) {
                      setFeedback({ type: 'err', text: 'Complete full name, email, and job title.' });
                      return;
                    }
                    runAction(
                      hrService.createStaffProfile({
                        employeeNumber: empNo,
                        fullName,
                        email,
                        branch,
                        department: dept,
                        jobTitle,
                        employmentType: empType,
                        joiningDate: nairobiToday,
                        workLocation: workLoc,
                        actor: actor.name,
                      }),
                      `Created staff profile for ${fullName}.`
                    );
                    setFullName('');
                    setEmail('');
                    setJobTitle('');
                  }}
                  className="w-full bg-[#153b70] hover:bg-[#0f274a] text-white py-2 rounded-lg text-xs font-extrabold"
                >
                  Register Staff Profile
                </button>
              </>
            ) : (
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 space-y-2">
                <div className="font-extrabold flex items-center gap-1.5">
                  <Lock className="w-4 h-4" />
                  <span>Self-Service Mode</span>
                </div>
                <p>
                  Staff self-service exposes only your own profile, contract terms, leave requests,
                  attendance, and workload. Switch to an HR Officer role to manage directory records.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#153b70]">
                Employment Contracts &amp; Separation-of-Duties Review
              </h2>
              <span className="text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg">
                Creator ≠ Independent Reviewer
              </span>
            </div>

            {visibleContracts.map((c) => (
              <div key={c.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#153b70] mr-2">
                      {c.contractNumber}
                    </span>
                    <span className="font-extrabold text-slate-900">{c.staffName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      c.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'APPROVED'
                        ? 'bg-blue-100 text-blue-800'
                        : c.status === 'REJECTED' || c.status === 'TERMINATED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <div className="text-slate-700">
                  {c.position} ({c.employmentType}) • {c.startDate} → {c.endDate} •{' '}
                  <strong>KES {c.monthlySalaryKes.toLocaleString()}/mo</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Created by: <strong>{c.createdByName}</strong>
                  {c.reviewedByName && (
                    <>
                      {' '}
                      • Reviewed by: <strong>{c.reviewedByName}</strong> ({c.reviewNote})
                    </>
                  )}
                </div>

                {actor.isHR && (
                  <div className="flex flex-wrap items-center gap-2 pt-2">
                    {c.status === 'DRAFT' && (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            hrService.submitContract(c.id, actor.name),
                            `Submitted ${c.contractNumber} for independent review.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-[#153b70] text-white font-bold"
                      >
                        Submit for Review
                      </button>
                    )}
                    {c.status === 'SUBMITTED' && (
                      <>
                        <input
                          type="text"
                          placeholder="Review note (required on reject)"
                          value={cntReviewNote[c.id] || ''}
                          onChange={(e) =>
                            setCntReviewNote((prev) => ({ ...prev, [c.id]: e.target.value }))
                          }
                          className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              hrService.reviewContract({
                                contractId: c.id,
                                decision: 'APPROVE',
                                reviewerUserId: actor.userId,
                                reviewerName: actor.name,
                                note: cntReviewNote[c.id] || 'Approved after terms verification',
                              }),
                              `Approved contract ${c.contractNumber}.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              hrService.reviewContract({
                                contractId: c.id,
                                decision: 'REJECT',
                                reviewerUserId: actor.userId,
                                reviewerName: actor.name,
                                note: cntReviewNote[c.id] || '',
                              }),
                              `Rejected contract ${c.contractNumber}.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {c.status === 'APPROVED' && (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            hrService.activateContract(c.id, actor.name),
                            `Activated contract ${c.contractNumber}.`
                          )
                        }
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white font-bold"
                      >
                        Activate Contract
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {actor.isHR && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
              <h3 className="text-sm font-extrabold text-[#153b70]">Draft New Contract</h3>
              <select
                value={cntStaffId}
                onChange={(e) => setCntStaffId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                {state.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.employeeNumber} — {s.fullName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Position title"
                value={cntPos}
                onChange={(e) => setCntPos(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <select
                value={cntType}
                onChange={(e) => setCntType(e.target.value as StaffEmploymentType)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="FULL_TIME">FULL_TIME</option>
                <option value="PART_TIME">PART_TIME</option>
                <option value="CONTRACT">CONTRACT</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={cntStart}
                  onChange={(e) => setCntStart(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                />
                <input
                  type="date"
                  value={cntEnd}
                  onChange={(e) => setCntEnd(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                />
              </div>
              <input
                type="number"
                placeholder="Monthly compensation (KES)"
                value={cntSalary}
                onChange={(e) => setCntSalary(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  runAction(
                    hrService.createContractDraft({
                      staffId: cntStaffId,
                      position: cntPos || 'Lecturer / Academic Staff',
                      employmentType: cntType,
                      startDate: cntStart,
                      endDate: cntEnd,
                      monthlySalaryKes: Number(cntSalary),
                      creatorUserId: actor.userId,
                      creatorName: actor.name,
                    }),
                    'Contract draft created.'
                  )
                }
                className="w-full bg-[#153b70] hover:bg-[#0f274a] text-white py-2 rounded-lg text-xs font-extrabold"
              >
                Save Draft Contract
              </button>
            </div>
          )}
        </div>
      )}

      {/* LEAVE REQUESTS */}
      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Leave Requests (Half-Day Increments &amp; No-Overlap Enforced)
            </h2>
            {visibleLeave.map((lv) => (
              <div key={lv.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-[#153b70] mr-2">{lv.reference}</span>
                    <span className="font-extrabold text-slate-900">{lv.staffName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                      lv.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : lv.status === 'REJECTED' || lv.status === 'CANCELLED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {lv.status}
                  </span>
                </div>
                <div className="text-slate-700">
                  <strong>{lv.leaveType}</strong> • {lv.startDate} to {lv.endDate} (
                  <strong>{lv.requestedDays} days</strong>)
                </div>
                <div className="text-slate-600">{lv.reason}</div>
                {lv.status === 'SUBMITTED' && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {actor.isHR && (
                      <>
                        <input
                          type="text"
                          placeholder="Review note..."
                          value={lvReviewNote[lv.id] || ''}
                          onChange={(e) =>
                            setLvReviewNote((prev) => ({ ...prev, [lv.id]: e.target.value }))
                          }
                          className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs bg-white"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              hrService.reviewLeaveRequest({
                                leaveId: lv.id,
                                decision: 'APPROVE',
                                reviewerUserId: actor.userId,
                                reviewerName: actor.name,
                                note: lvReviewNote[lv.id] || 'Approved',
                              }),
                              `Approved ${lv.reference}.`
                            )
                          }
                          className="px-3 py-1 rounded bg-emerald-700 text-white font-bold"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            runAction(
                              hrService.reviewLeaveRequest({
                                leaveId: lv.id,
                                decision: 'REJECT',
                                reviewerUserId: actor.userId,
                                reviewerName: actor.name,
                                note: lvReviewNote[lv.id] || '',
                              }),
                              `Rejected ${lv.reference}.`
                            )
                          }
                          className="px-3 py-1 rounded bg-red-600 text-white font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {selfStaff?.id === lv.staffId && (
                      <button
                        type="button"
                        onClick={() =>
                          runAction(
                            hrService.cancelOwnLeaveRequest(lv.id, actor.userId, actor.name),
                            `Cancelled ${lv.reference}.`
                          )
                        }
                        className="px-3 py-1 rounded border border-slate-300 bg-white text-slate-700 font-bold"
                      >
                        Cancel My Request
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70]">Submit Leave Request</h3>
            <select
              value={lvType}
              onChange={(e) => setLvType(e.target.value as StaffLeaveType)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="ANNUAL">ANNUAL</option>
              <option value="SICK">SICK</option>
              <option value="STUDY">STUDY</option>
              <option value="COMPASSIONATE">COMPASSIONATE</option>
              <option value="MATERNITY_PATERNITY">MATERNITY_PATERNITY</option>
            </select>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={lvStart}
                onChange={(e) => setLvStart(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
              />
              <input
                type="date"
                value={lvEnd}
                onChange={(e) => setLvEnd(e.target.value)}
                className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
              />
            </div>
            <input
              type="number"
              step="0.5"
              min="0.5"
              placeholder="Days (0.5 increments)"
              value={lvDays}
              onChange={(e) => setLvDays(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <textarea
              placeholder="Reason..."
              value={lvReason}
              onChange={(e) => setLvReason(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                runAction(
                  hrService.submitLeaveRequest({
                    staffId: selfStaff?.id || state.staff[0].id,
                    leaveType: lvType,
                    startDate: lvStart,
                    endDate: lvEnd,
                    requestedDays: Number(lvDays),
                    reason: lvReason || 'Scheduled leave request',
                  }),
                  'Leave request submitted cleanly.'
                )
              }
              className="w-full bg-[#153b70] hover:bg-[#0f274a] text-white py-2 rounded-lg text-xs font-extrabold"
            >
              Submit Leave Request
            </button>
          </div>
        </div>
      )}

      {/* ATTENDANCE */}
      {activeTab === 'attendance' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Daily Staff Attendance Log (Africa/Nairobi)
            </h2>
            <div className="space-y-2">
              {visibleAttendance.map((a) => (
                <div
                  key={a.id}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-extrabold text-slate-900">
                      {a.staffName} • <span className="font-mono text-[#153b70]">{a.date}</span>
                    </div>
                    <div className="text-slate-600 mt-0.5">
                      {a.checkIn ? `In: ${a.checkIn}` : 'No clock-in'}{' '}
                      {a.checkOut ? `• Out: ${a.checkOut}` : ''}{' '}
                      {a.note ? `• ${a.note}` : ''}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {actor.isHR && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
              <h3 className="text-sm font-extrabold text-[#153b70]">Record Staff Attendance</h3>
              <select
                value={attStaffId}
                onChange={(e) => setAttStaffId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                {state.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <select
                value={attStatus}
                onChange={(e) => setAttStatus(e.target.value as StaffAttendanceStatus)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="LATE">LATE</option>
                <option value="REMOTE">REMOTE</option>
                <option value="HALF_DAY">HALF_DAY</option>
                <option value="ON_LEAVE">ON_LEAVE</option>
                <option value="ABSENT">ABSENT</option>
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={attIn}
                  onChange={(e) => setAttIn(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                />
                <input
                  type="time"
                  value={attOut}
                  onChange={(e) => setAttOut(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2 py-1.5 text-xs"
                />
              </div>
              <input
                type="text"
                placeholder="Optional note"
                value={attNote}
                onChange={(e) => setAttNote(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  runAction(
                    hrService.recordAttendance({
                      staffId: attStaffId,
                      date: attDate,
                      status: attStatus,
                      checkIn: attIn,
                      checkOut: attOut,
                      note: attNote,
                      actor: actor.name,
                    }),
                    `Saved attendance record for ${attDate}.`
                  )
                }
                className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
              >
                Save Attendance
              </button>
            </div>
          )}
        </div>
      )}

      {/* WORKLOADS */}
      {activeTab === 'workloads' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h2 className="text-base font-extrabold text-[#153b70]">
              Academic Teaching &amp; Committee Workloads
            </h2>
            {visibleWorkloads.map((w) => (
              <div key={w.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-xs flex items-center justify-between gap-2">
                <div>
                  <div className="font-extrabold text-slate-900">
                    {w.title}{' '}
                    {w.courseOfferingCode && (
                      <span className="font-mono text-[#153b70]">({w.courseOfferingCode})</span>
                    )}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    {w.staffName} • {w.workloadType} • {w.startDate} to {w.endDate}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-black text-[#153b70] text-sm">{w.weeklyHours} hrs/wk</div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {w.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {actor.isHR && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
              <h3 className="text-sm font-extrabold text-[#153b70]">Assign Staff Workload</h3>
              <select
                value={wklStaffId}
                onChange={(e) => setWklStaffId(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                {state.staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName}
                  </option>
                ))}
              </select>
              <select
                value={wklType}
                onChange={(e) => setWklType(e.target.value as StaffWorkloadType)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
              >
                <option value="TEACHING">TEACHING</option>
                <option value="SUPERVISION">SUPERVISION</option>
                <option value="ADMINISTRATION">ADMINISTRATION</option>
                <option value="PROJECTS">PROJECTS</option>
                <option value="COMMITTEES">COMMITTEES</option>
              </select>
              <input
                type="text"
                placeholder="Course Code (optional)"
                value={wklCourse}
                onChange={(e) => setWklCourse(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <input
                type="text"
                placeholder="Workload Description"
                value={wklTitle}
                onChange={(e) => setWklTitle(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <input
                type="number"
                placeholder="Weekly hours"
                value={wklHours}
                onChange={(e) => setWklHours(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={() =>
                  runAction(
                    hrService.assignWorkload({
                      staffId: wklStaffId,
                      workloadType: wklType,
                      courseOfferingCode: wklCourse,
                      title: wklTitle || 'Trimester Course Delivery',
                      weeklyHours: Number(wklHours),
                      startDate: nairobiToday,
                      endDate: '2027-03-31',
                      actor: actor.name,
                    }),
                    'Assigned staff workload.'
                  )
                }
                className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
              >
                Assign Workload
              </button>
            </div>
          )}
        </div>
      )}

      {/* STAFF HR FILES DMS */}
      {activeTab === 'hr_docs' && (
        <ModuleDocumentRepository
          moduleKey="HR"
          defaultRecipient="Human Resources Directorate"
          title="Confidential Staff HR Files & Contracts (Central DMS)"
          description="Restricted repository for employment contracts, academic certificates, appraisal letters, and medical/leave documentation."
          securityBanner="HR Confidentiality Guard: Access is restricted to authorized HR officers and the Principal. Super Admin does NOT automatically bypass CONFIDENTIAL or RESTRICTED HR personnel files."
        />
      )}
    </div>
  );
}

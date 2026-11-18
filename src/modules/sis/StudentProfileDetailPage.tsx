import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Award,
  BookOpen,
  CheckCircle2,
  CreditCard,
  FileText,
  GraduationCap,
  HeartHandshake,
  History,
  Lock,
  Plus,
  ShieldAlert,
  ShieldCheck,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { StaffButton, StaffStatusTag } from '../staff/components/StaffDashboardUI';

interface StudentProfileDto {
  id: string;
  userId: number;
  registrationNumber: string;
  fullName: string;
  email: string;
  gender: string | null;
  dateOfBirth: string | null;
  nationalIdOrPassport: string | null;
  phoneNumber: string | null;
  alternatePhone: string | null;
  address: string | null;
  nationality: string | null;
  campusId: string | null;
  campusName: string | null;
  departmentId: string | null;
  departmentName: string | null;
  programmeId: string | null;
  programmeName: string | null;
  intakeName: string | null;
  yearOfStudy: number;
  semesterLabel: string | null;
  status: string;
  feeBalanceKes: string | null;
  feeCategory: string | null;
  attendanceRatePct: number;
  gpa: string | null;
  welfareFlag: string | null;
  admissionDate: string | null;
  completionDate: string | null;
  graduationDate: string | null;
  profileCompleted: boolean;
}

interface DetailPayload {
  profile: StudentProfileDto;
  portalAccount: {
    id: number;
    uid: string;
    email: string;
    primaryRole: string;
    accountStatus: string;
    mfaEnabled: boolean;
    mustChangePassword: boolean;
    lastLoginAt: string | null;
  } | null;
  guardians: {
    id: string;
    fullName: string;
    relationship: string;
    phoneNumber: string | null;
    email: string | null;
    isPrimary: boolean;
    portalAccess: boolean;
  }[];
  emergencyContacts: {
    id: string;
    fullName: string;
    relationship: string;
    phoneNumber: string;
  }[];
  statusHistory: {
    id: string;
    previousStatus: string | null;
    newStatus: string;
    reason: string;
    changedByName: string;
    effectiveAt: string;
  }[];
  changeRequests: {
    id: string;
    changeType: string;
    status: string;
    reason: string;
    requestedByName: string;
    reviewedByName: string | null;
    reviewComment: string | null;
    createdAt: string;
  }[];
  documents: {
    id: string;
    title: string;
    referenceNumber: string | null;
    category: string;
    status: string;
    issuedAt: string | null;
  }[];
  registeredUnits: {
    code: string;
    title: string;
    credits: number;
    grade: string;
  }[];
  permissions: {
    canEditPersonal: boolean;
    canViewFinance: boolean;
    canViewWelfare: boolean;
    canManageStatus: boolean;
    canApproveChanges: boolean;
    canRequestChanges: boolean;
    canManageGuardians: boolean;
    canViewAudit: boolean;
  };
}

interface LookupData {
  campuses: { id: string; name: string }[];
  programmes: { id: string; name: string }[];
}

const TABS = [
  ['overview', 'Overview'],
  ['personal', 'Personal info'],
  ['admission', 'Admission'],
  ['academic_records', 'Academic records'],
  ['academic_registration', 'Academic registration'],
  ['attendance', 'Attendance'],
  ['exam_results', 'Exam results'],
  ['finance', 'Finance summary'],
  ['documents', 'Documents'],
  ['guardians', 'Guardians'],
  ['welfare', 'Student support / Welfare'],
  ['change_requests', 'Change requests'],
  ['portal_account', 'Portal account'],
  ['audit', 'Audit history'],
] as const;

type SisTabKey = (typeof TABS)[number][0];

export default function StudentProfileDetailPage({
  studentId,
  onBack,
}: {
  studentId: string;
  onBack?: () => void;
}) {
  const [activeTab, setActiveTab] = useState<SisTabKey>('overview');
  const [data, setData] = useState<DetailPayload | null>(null);
  const [lookups, setLookups] = useState<LookupData>({ campuses: [], programmes: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Personal info edit
  const [phone, setPhone] = useState('');
  const [altPhone, setAltPhone] = useState('');
  const [address, setAddress] = useState('');
  const [nationality, setNationality] = useState('');
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Guardian modal/form
  const [gName, setGName] = useState('');
  const [gRel, setGRel] = useState('Parent');
  const [gPhone, setGPhone] = useState('');
  const [gEmail, setGEmail] = useState('');
  const [gPortalAccess, setGPortalAccess] = useState(true);

  // Change request form
  const [changeType, setChangeType] = useState('DEFERMENT');
  const [changeReason, setChangeReason] = useState('');
  const [targetCampusId, setTargetCampusId] = useState('');
  const [targetProgrammeId, setTargetProgrammeId] = useState('');
  const [decisionComments, setDecisionComments] = useState<Record<string, string>>({});

  const loadDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [detRes, lkpRes] = await Promise.all([
        fetch(`/api/sis/students/${encodeURIComponent(studentId)}`, { credentials: 'include' }),
        fetch('/api/sis/lookups', { credentials: 'include' }),
      ]);
      const detJson = await detRes.json();
      if (!detRes.ok || !detJson.success) {
        setError(detJson.error || 'Unable to load student profile.');
        return;
      }
      const detail = detJson.data as DetailPayload;
      setData(detail);
      setPhone(detail.profile.phoneNumber ?? '');
      setAltPhone(detail.profile.alternatePhone ?? '');
      setAddress(detail.profile.address ?? '');
      setNationality(detail.profile.nationality ?? 'Kenyan');

      const lkpJson = await lkpRes.json().catch(() => null);
      if (lkpJson?.success) {
        setLookups({
          campuses: lkpJson.data.campuses ?? [],
          programmes: lkpJson.data.programmes ?? [],
        });
      }
    } catch {
      setError('Network error while loading SIS record.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPersonal(true);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`/api/sis/students/${encodeURIComponent(studentId)}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          alternatePhone: altPhone,
          address,
          nationality,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'Failed to update personal information.');
        return;
      }
      setNotice('Student contact & personal information updated.');
      await loadDetail();
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleAddGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    const res = await fetch(`/api/sis/students/${encodeURIComponent(studentId)}/guardians`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: gName,
        relationship: gRel,
        phoneNumber: gPhone,
        email: gEmail,
        portalAccess: gPortalAccess,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Failed to add guardian.');
      return;
    }
    setGName('');
    setGPhone('');
    setGEmail('');
    setNotice('Guardian contact linked to student record.');
    await loadDetail();
  };

  const handleSubmitChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setNotice(null);
    setError(null);
    const metadata: Record<string, string> = {};
    if (changeType === 'CAMPUS_TRANSFER' && targetCampusId) {
      metadata.targetCampusId = targetCampusId;
    }
    if (changeType === 'PROGRAMME_TRANSFER' && targetProgrammeId) {
      metadata.targetProgrammeId = targetProgrammeId;
    }
    const res = await fetch(`/api/sis/students/${encodeURIComponent(studentId)}/change-requests`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        changeType,
        reason: changeReason,
        metadata,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Could not submit change request.');
      return;
    }
    setChangeReason('');
    setNotice(`Submitted ${changeType.replaceAll('_', ' ')} request for registry decision.`);
    await loadDetail();
  };

  const handleDecideChange = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    setNotice(null);
    setError(null);
    const res = await fetch(`/api/sis/change-requests/${requestId}/decide`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision,
        comment: decisionComments[requestId] || '',
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      setError(json.error || 'Decision could not be recorded.');
      return;
    }
    setNotice(`Change request marked ${json.data.status}. Student master record updated.`);
    await loadDetail();
  };

  if (loading && !data) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center text-xs text-slate-500">
        Loading 14-tab student master profile...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="space-y-4">
        {onBack && (
          <StaffButton variant="secondary" onClick={onBack}>
            <ArrowLeft size={14} /> Back to Student Directory
          </StaffButton>
        )}
        <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-6 text-sm font-semibold text-red-800 dark:text-red-200">
          {error}
        </div>
      </div>
    );
  }

  if (!data) return null;
  const { profile, permissions } = data;

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          {onBack && (
            <StaffButton variant="secondary" onClick={onBack}>
              <ArrowLeft size={14} /> Directory
            </StaffButton>
          )}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#102D50] text-lg font-extrabold text-[#E8B44A] shrink-0">
            {profile.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-extrabold text-[#102D50] dark:text-white truncate">
                {profile.fullName}
              </h1>
              <StaffStatusTag status={profile.status} />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                {profile.registrationNumber}
              </span>{' '}
              · {profile.programmeName} · {profile.campusName}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 text-xs">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500">Year / Semester</div>
            <div className="font-bold text-[#102D50] dark:text-white">
              Year {profile.yearOfStudy} · {profile.semesterLabel ?? 'Trimester 1'}
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2 border border-slate-200 dark:border-slate-700">
            <div className="text-slate-500">Cumulative GPA</div>
            <div className="font-mono font-bold text-[#102D50] dark:text-white">
              {profile.gpa ?? '3.50'}
            </div>
          </div>
        </div>
      </div>

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

      {/* 14-Tab Strip */}
      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === key
                ? 'bg-[#102D50] text-white'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        {activeTab === 'overview' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3 text-xs">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                <GraduationCap size={18} className="text-[#1769AA]" /> Academic &amp; Campus Summary
              </h2>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Official Reg Number</dt>
                  <dd className="font-mono font-bold">{profile.registrationNumber}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Programme</dt>
                  <dd className="font-semibold text-right">{profile.programmeName}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Department</dt>
                  <dd className="font-semibold text-right">{profile.departmentName}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Campus</dt>
                  <dd className="font-semibold">{profile.campusName}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Intake Cohort</dt>
                  <dd className="font-semibold">{profile.intakeName}</dd>
                </div>
              </dl>
            </div>
            <div className="space-y-3 text-xs">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                <User size={18} className="text-[#1769AA]" /> Standing &amp; Contacts
              </h2>
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Student Status</dt>
                  <dd><StaffStatusTag status={profile.status} /></dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Email</dt>
                  <dd className="font-medium">{profile.email}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium">{profile.phoneNumber || 'Not recorded'}</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Attendance Rate</dt>
                  <dd className="font-mono font-bold">{profile.attendanceRatePct}%</dd>
                </div>
                <div className="py-2 flex justify-between">
                  <dt className="text-slate-500">Linked Guardians</dt>
                  <dd className="font-bold">{data.guardians.length}</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <form onSubmit={handleSavePersonal} className="max-w-2xl space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">
              Personal &amp; Contact Particulars
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Mobile Phone
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!permissions.canEditPersonal}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                />
              </label>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Alternate Phone
                <input
                  type="text"
                  value={altPhone}
                  onChange={(e) => setAltPhone(e.target.value)}
                  disabled={!permissions.canEditPersonal}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                />
              </label>
              <label className="block font-semibold text-slate-700 dark:text-slate-200 sm:col-span-2">
                Residential / Postal Address
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  disabled={!permissions.canEditPersonal}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                />
              </label>
              <label className="block font-semibold text-slate-700 dark:text-slate-200">
                Nationality
                <input
                  type="text"
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                  disabled={!permissions.canEditPersonal}
                  className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm disabled:opacity-60"
                />
              </label>
            </div>
            {permissions.canEditPersonal && (
              <StaffButton type="submit" disabled={savingPersonal}>
                {savingPersonal ? 'Saving...' : 'Save Personal Details'}
              </StaffButton>
            )}
          </form>
        )}

        {activeTab === 'admission' && (
          <div className="space-y-3 text-xs max-w-2xl">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">
              Admission &amp; Matriculation Record
            </h2>
            <dl className="divide-y divide-slate-100 dark:divide-slate-800">
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Admission Date</dt>
                <dd className="font-mono">
                  {profile.admissionDate ? String(profile.admissionDate).slice(0, 10) : '2026-01-12'}
                </dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Intake Cohort</dt>
                <dd className="font-semibold">{profile.intakeName}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">National ID / Passport</dt>
                <dd className="font-mono">{profile.nationalIdOrPassport || 'Verified at Intake'}</dd>
              </div>
              <div className="py-2.5 flex justify-between">
                <dt className="text-slate-500">Profile Onboarding</dt>
                <dd>
                  <StaffStatusTag status={profile.profileCompleted ? 'COMPLETED' : 'PENDING'} />
                </dd>
              </div>
            </dl>
          </div>
        )}

        {(activeTab === 'academic_records' || activeTab === 'academic_registration') && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <BookOpen size={18} className="text-[#1769AA]" />
              {activeTab === 'academic_records'
                ? 'Academic Progression & Programme Standing'
                : `Current Registered Units (${profile.semesterLabel ?? 'Trimester 1'})`}
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 pr-4 font-bold">Unit Code</th>
                    <th className="py-2.5 pr-4 font-bold">Unit Title</th>
                    <th className="py-2.5 pr-4 font-bold">Credit Hours</th>
                    <th className="py-2.5 font-bold">Standing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.registeredUnits.map((u) => (
                    <tr key={u.code}>
                      <td className="py-3 pr-4 font-mono font-bold text-[#1769AA]">{u.code}</td>
                      <td className="py-3 pr-4 font-semibold text-slate-900 dark:text-white">
                        {u.title}
                      </td>
                      <td className="py-3 pr-4 font-mono">{u.credits}</td>
                      <td className="py-3">
                        <StaffStatusTag status="REGISTERED" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-3 text-xs">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white">
              Class &amp; Laboratory Attendance
            </h2>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 flex items-center justify-between">
              <div>
                <div className="text-slate-500">Overall Trimester Attendance</div>
                <div className="text-2xl font-extrabold text-[#102D50] dark:text-white">
                  {profile.attendanceRatePct}%
                </div>
              </div>
              <StaffStatusTag
                status={profile.attendanceRatePct >= 75 ? 'ELIGIBLE' : 'AT_RISK'}
              />
            </div>
          </div>
        )}

        {activeTab === 'exam_results' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Award size={18} className="text-[#1769AA]" /> Examination &amp; Assessment Results
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2.5 pr-4 font-bold">Unit Code</th>
                    <th className="py-2.5 pr-4 font-bold">Unit Title</th>
                    <th className="py-2.5 pr-4 font-bold">Grade</th>
                    <th className="py-2.5 font-bold">Remark</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.registeredUnits.map((u) => (
                    <tr key={u.code}>
                      <td className="py-3 pr-4 font-mono font-bold text-[#1769AA]">{u.code}</td>
                      <td className="py-3 pr-4">{u.title}</td>
                      <td className="py-3 pr-4 font-mono font-bold">{u.grade}</td>
                      <td className="py-3">
                        <StaffStatusTag status="PASS" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <Wallet size={18} className="text-[#1769AA]" /> Student Fee &amp; Financial Summary
            </h2>
            {!permissions.canViewFinance ? (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Lock size={16} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Confidential Finance Boundary:</strong> Fee balances, bursary ledgers, and M-Pesa settlement histories are restricted to Finance Officers, Registrar, Principal, and the student account holder.
                </div>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-slate-500 flex items-center gap-1.5">
                    <CreditCard size={14} /> Current Fee Balance
                  </div>
                  <div className="mt-1 text-2xl font-extrabold text-[#102D50] dark:text-white font-mono">
                    KES {Number(profile.feeBalanceKes ?? 0).toLocaleString()}
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <div className="text-slate-500">Fee Sponsorship Category</div>
                  <div className="mt-1 text-lg font-bold text-[#102D50] dark:text-white">
                    {profile.feeCategory ?? 'SELF_SPONSORED'}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <FileText size={18} className="text-[#1769AA]" /> Official Issued Student Documents
            </h2>
            {data.documents.length === 0 ? (
              <p className="text-xs text-slate-500">
                No student-linked documents have been issued yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {data.documents.map((doc) => (
                  <div key={doc.id} className="py-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-mono font-bold text-[#1769AA]">
                        {doc.referenceNumber ?? 'DRAFT'}
                      </div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {doc.title}
                      </div>
                    </div>
                    <StaffStatusTag status={doc.status} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'guardians' && (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
                <Users size={18} className="text-[#1769AA]" /> Verified Guardians &amp; Emergency Contacts
              </h2>
              {data.guardians.length === 0 ? (
                <p className="text-xs text-slate-500">No guardians linked yet.</p>
              ) : (
                <div className="space-y-2.5 text-xs">
                  {data.guardians.map((g) => (
                    <div
                      key={g.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {g.fullName} ({g.relationship})
                        </div>
                        <div className="text-slate-500">
                          {g.phoneNumber} · {g.email}
                        </div>
                      </div>
                      <StaffStatusTag status={g.portalAccess ? 'PORTAL_LINKED' : 'CONTACT_ONLY'} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {permissions.canManageGuardians && (
              <form
                onSubmit={handleAddGuardian}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3 text-xs"
              >
                <div className="font-bold text-[#102D50] dark:text-white flex items-center gap-1.5">
                  <Plus size={14} /> Link Guardian / Parent
                </div>
                <input
                  type="text"
                  value={gName}
                  onChange={(e) => setGName(e.target.value)}
                  required
                  placeholder="Guardian full name"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <input
                  type="text"
                  value={gRel}
                  onChange={(e) => setGRel(e.target.value)}
                  placeholder="Relationship (Mother, Father, Sponsor)"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <input
                  type="text"
                  value={gPhone}
                  onChange={(e) => setGPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <input
                  type="email"
                  value={gEmail}
                  onChange={(e) => setGEmail(e.target.value)}
                  placeholder="Email address"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={gPortalAccess}
                    onChange={(e) => setGPortalAccess(e.target.checked)}
                    className="accent-[#1769AA]"
                  />
                  <span>Grant parent portal consent</span>
                </label>
                <StaffButton type="submit">Add Guardian</StaffButton>
              </form>
            )}
          </div>
        )}

        {activeTab === 'welfare' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <HeartHandshake size={18} className="text-[#1769AA]" /> Student Support &amp; Welfare Notes
            </h2>
            {!permissions.canViewWelfare ? (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                <div>
                  <strong>Strict Privacy Enforcement:</strong> Confidential student counselling and welfare records are strictly isolated to the Dean of Student Affairs and the Principal — hidden from general Admin, Finance, HR, and Lecturer views.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 text-xs space-y-2">
                <div className="font-bold text-[#102D50] dark:text-white">
                  Current Welfare Indicator
                </div>
                <p className="text-slate-700 dark:text-slate-300">
                  {profile.welfareFlag || 'CLEAR — No active counselling or support holds.'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'change_requests' && (
          <div className="grid gap-6 lg:grid-cols-[1.25fr_1fr] items-start">
            <div className="space-y-3">
              <h2 className="text-base font-bold text-[#102D50] dark:text-white">
                Transfer, Deferment &amp; Graduation Requests
              </h2>
              {data.changeRequests.length === 0 ? (
                <p className="text-xs text-slate-500">No lifecycle change requests filed.</p>
              ) : (
                <div className="space-y-3 text-xs">
                  {data.changeRequests.map((req) => (
                    <div
                      key={req.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[#102D50] dark:text-white">
                          {req.changeType.replaceAll('_', ' ')}
                        </span>
                        <StaffStatusTag status={req.status} />
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{req.reason}</p>
                      <div className="text-[11px] text-slate-500">
                        Requested by {req.requestedByName} ·{' '}
                        {String(req.createdAt).slice(0, 10)}
                      </div>
                      {req.reviewComment && (
                        <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                          Decision ({req.reviewedByName}): {req.reviewComment}
                        </div>
                      )}
                      {req.status === 'REQUESTED' && permissions.canApproveChanges && (
                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          <input
                            type="text"
                            value={decisionComments[req.id] ?? ''}
                            onChange={(e) =>
                              setDecisionComments((prev) => ({
                                ...prev,
                                [req.id]: e.target.value,
                              }))
                            }
                            placeholder="Registry review comment..."
                            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5"
                          />
                          <div className="flex gap-2">
                            <StaffButton
                              variant="success"
                              onClick={() => handleDecideChange(req.id, 'APPROVED')}
                            >
                              Approve &amp; Apply Transition
                            </StaffButton>
                            <StaffButton
                              variant="danger"
                              onClick={() => handleDecideChange(req.id, 'REJECTED')}
                            >
                              Reject
                            </StaffButton>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {permissions.canRequestChanges && (
              <form
                onSubmit={handleSubmitChangeRequest}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-4 space-y-3 text-xs"
              >
                <div className="font-bold text-[#102D50] dark:text-white">
                  Submit Student Status / Transfer Request
                </div>
                <select
                  aria-label="Change request type"
                  value={changeType}
                  onChange={(e) => setChangeType(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                >
                  <option value="DEFERMENT">Academic Deferment</option>
                  <option value="RESUMPTION">Academic Resumption</option>
                  <option value="PROGRAMME_TRANSFER">Programme Transfer</option>
                  <option value="CAMPUS_TRANSFER">Campus Transfer</option>
                  <option value="WITHDRAWAL">Official Withdrawal</option>
                  <option value="GRADUATION">Clear for Graduation</option>
                </select>

                {changeType === 'CAMPUS_TRANSFER' && (
                  <select
                    aria-label="Destination campus"
                    value={targetCampusId}
                    onChange={(e) => setTargetCampusId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                  >
                    <option value="">Select destination campus...</option>
                    {lookups.campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {changeType === 'PROGRAMME_TRANSFER' && (
                  <select
                    aria-label="Destination programme"
                    value={targetProgrammeId}
                    onChange={(e) => setTargetProgrammeId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                  >
                    <option value="">Select destination programme...</option>
                    {lookups.programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}

                <textarea
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  required
                  placeholder="Provide official academic or personal justification..."
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2"
                />
                <StaffButton type="submit">Submit Request</StaffButton>
              </form>
            )}
          </div>
        )}

        {activeTab === 'portal_account' && (
          <div className="space-y-3 text-xs max-w-xl">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#1769AA]" /> Linked Portal Identity
            </h2>
            {!data.portalAccount ? (
              <p className="text-slate-500">No linked portal login record found.</p>
            ) : (
              <dl className="divide-y divide-slate-100 dark:divide-slate-800">
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Identity UID</dt>
                  <dd className="font-mono">{data.portalAccount.uid}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Login Email</dt>
                  <dd className="font-medium">{data.portalAccount.email}</dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Account Status</dt>
                  <dd><StaffStatusTag status={data.portalAccount.accountStatus} /></dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">MFA Protection</dt>
                  <dd><StaffStatusTag status={data.portalAccount.mfaEnabled ? 'ENABLED' : 'OFF'} /></dd>
                </div>
                <div className="py-2.5 flex justify-between">
                  <dt className="text-slate-500">Last Portal Sign-In</dt>
                  <dd className="font-mono">
                    {data.portalAccount.lastLoginAt
                      ? String(data.portalAccount.lastLoginAt).slice(0, 16).replace('T', ' ')
                      : 'Never signed in'}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        )}

        {activeTab === 'audit' && (
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[#102D50] dark:text-white flex items-center gap-2">
              <History size={18} className="text-[#1769AA]" /> Student Status &amp; Lifecycle Audit Log
            </h2>
            {!permissions.canViewAudit ? (
              <p className="text-xs text-slate-500">
                Full lifecycle audit logs are reserved for Academic Registry, Administration, Quality Assurance, and Principal roles.
              </p>
            ) : data.statusHistory.length === 0 ? (
              <p className="text-xs text-slate-500">No status transitions recorded.</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {data.statusHistory.map((h) => (
                  <div key={h.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-[#1769AA] mr-2">
                        {h.previousStatus ?? 'INITIAL'} → {h.newStatus}
                      </span>
                      <span className="text-slate-700 dark:text-slate-200">{h.reason}</span>
                      <span className="ml-2 text-slate-500">— {h.changedByName}</span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-400">
                      {String(h.effectiveAt).slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

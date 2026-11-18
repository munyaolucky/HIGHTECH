import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Award,
  Briefcase,
  Building,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  HeartHandshake,
  Info,
  Lock,
  Save,
  Send,
  ShieldAlert,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import type { StaffRole } from '../../config/staff-navigation';
import { StaffButton } from '../staff/components/StaffDashboardUI';
import { CATEGORY_META, ODPC_NOTICE_TEXT, STAFF_ROLE_OPTIONS } from './registration.config';
import type {
  DuplicateMatchItem,
  ReferenceCampus,
  ReferenceDepartment,
  ReferenceIntake,
  ReferenceProgramme,
  RegistrationCategory,
  RegistrationRecordItem,
  RegistrationWorkspacePayload,
} from './registration.types';

export interface ManualPortalRegistrationProps {
  userRole: StaffRole | string;
  canCreate?: boolean;
  allowedCategories?: RegistrationCategory[];
  campuses?: ReferenceCampus[];
  departments?: ReferenceDepartment[];
  programmes?: ReferenceProgramme[];
  intakes?: ReferenceIntake[];
  totalAccounts?: number;
  pendingActivation?: number;
  approvedAwaitingInvite?: number;
  onCreated?: (record: RegistrationRecordItem) => void;
  onSaveSuccess?: () => void;
  onNavigateToApprovals?: () => void;
  onCancel?: () => void;
}

const ALL_CATEGORIES: {
  id: RegistrationCategory;
  label: string;
  hint: string;
  icon: typeof GraduationCap;
}[] = [
  { id: 'STUDENT', label: 'Student', hint: 'HCA/STU/...', icon: GraduationCap },
  { id: 'STAFF', label: 'Staff / Lecturer', hint: 'HCA/STAFF/...', icon: Briefcase },
  { id: 'PARENT', label: 'Parent / Guardian', hint: 'HCA/PAR/...', icon: Users },
  { id: 'ALUMNI', label: 'Alumni', hint: 'HCA/ALU/...', icon: Award },
  { id: 'CONTRACTOR', label: 'Contractor', hint: 'HCA/CTR/...', icon: Building },
  { id: 'PARTNER', label: 'Partner', hint: 'HCA/PRT/...', icon: HeartHandshake },
  { id: 'GUEST', label: 'Guest / Visitor', hint: 'HCA/GST/...', icon: UserPlus },
];

export default function ManualPortalRegistration({
  userRole,
  canCreate: canCreateProp,
  allowedCategories: allowedCatsProp,
  campuses: campusesProp,
  departments: departmentsProp,
  programmes: programmesProp,
  intakes: intakesProp,
  totalAccounts: totalAccountsProp,
  pendingActivation: pendingActivationProp,
  approvedAwaitingInvite: approvedAwaitingInviteProp,
  onCreated,
  onSaveSuccess,
  onNavigateToApprovals,
  onCancel,
}: ManualPortalRegistrationProps) {
  const [lookupsLoading, setLookupsLoading] = useState(!campusesProp);
  const [remoteCampuses, setRemoteCampuses] = useState<ReferenceCampus[]>([]);
  const [remoteDepartments, setRemoteDepartments] = useState<ReferenceDepartment[]>([]);
  const [remoteProgrammes, setRemoteProgrammes] = useState<ReferenceProgramme[]>([]);
  const [remoteIntakes, setRemoteIntakes] = useState<ReferenceIntake[]>([]);
  const [remoteAllowedCats, setRemoteAllowedCats] = useState<RegistrationCategory[]>([]);
  const [remoteCanCreate, setRemoteCanCreate] = useState<boolean>(true);
  const [remoteSummary, setRemoteSummary] = useState<{
    total: number;
    pendingApproval: number;
    invitedPendingActivation: number;
    approvedAwaitingInvite: number;
  } | null>(null);

  const loadReferences = useCallback(async () => {
    try {
      setLookupsLoading(true);
      const res = await fetch('/api/registrations?pageSize=1', { credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        const ws = json.data as RegistrationWorkspacePayload;
        setRemoteCampuses(ws.references.campuses ?? []);
        setRemoteDepartments(ws.references.departments ?? []);
        setRemoteProgrammes(ws.references.programmes ?? []);
        setRemoteIntakes(ws.references.intakes ?? []);
        setRemoteAllowedCats(ws.references.allowedRegisterCategories ?? []);
        setRemoteCanCreate(
          (ws.references.registrationPermissions ?? []).includes('users.registration.create')
        );
        setRemoteSummary({
          total: ws.summary.total,
          pendingApproval: ws.summary.pendingApproval,
          invitedPendingActivation: ws.summary.invitedPendingActivation,
          approvedAwaitingInvite: ws.summary.approvedAwaitingInvite,
        });
      }
    } finally {
      setLookupsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!campusesProp || !programmesProp || totalAccountsProp === undefined) {
      loadReferences().catch(() => {});
    }
  }, [campusesProp, programmesProp, totalAccountsProp, loadReferences]);

  const campuses = campusesProp ?? remoteCampuses;
  const departments = departmentsProp ?? remoteDepartments;
  const programmes = programmesProp ?? remoteProgrammes;
  const intakes = intakesProp ?? remoteIntakes;
  const allowedCategories = useMemo(
    () => allowedCatsProp ?? remoteAllowedCats,
    [allowedCatsProp, remoteAllowedCats]
  );
  const canCreate = canCreateProp ?? remoteCanCreate;

  const totalAccounts = totalAccountsProp ?? remoteSummary?.total ?? 0;
  const pendingActivation =
    pendingActivationProp ?? remoteSummary?.invitedPendingActivation ?? 0;
  const approvedAwaitingInvite =
    approvedAwaitingInviteProp ?? remoteSummary?.approvedAwaitingInvite ?? 0;

  const defaultCat: RegistrationCategory = allowedCategories[0] ?? 'STUDENT';
  const [category, setCategory] = useState<RegistrationCategory>(defaultCat);

  useEffect(() => {
    if (allowedCategories.length > 0 && !allowedCategories.includes(category)) {
      setCategory(allowedCategories[0]);
    }
  }, [allowedCategories, category]);

  // Personal fields
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [identificationType, setIdentificationType] = useState<
    'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT'
  >('NATIONAL_ID');
  const [nationalId, setNationalId] = useState('');
  const [gender, setGender] = useState('Prefer not to say');
  const [dateOfBirth, setDateOfBirth] = useState('2002-01-15');
  const [odpcConsentAccepted, setOdpcConsentAccepted] = useState(true);

  // Institutional placement
  const [campusId, setCampusId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [intakeId, setIntakeId] = useState('');
  const [roleCode, setRoleCode] = useState('LECTURER');

  // Category-specific
  const [jobTitle, setJobTitle] = useState('');
  const [employeeType, setEmployeeType] = useState<
    'LECTURER' | 'TEACHING' | 'NON_TEACHING' | 'LIBRARIAN' | 'FINANCE' | 'IT_SUPPORT' | 'ADMINISTRATOR'
  >('LECTURER');
  const [employmentType, setEmploymentType] = useState<'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP'>(
    'FIXED_TERM'
  );
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [studentId, setStudentId] = useState('');
  const [relationship, setRelationship] = useState('Parent');
  const [organizationName, setOrganizationName] = useState('');
  const [contractOrMouRef, setContractOrMouRef] = useState('');
  const [accessExpiryDate, setAccessExpiryDate] = useState('');
  const [hostStaffName, setHostStaffName] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');
  const [graduationYear, setGraduationYear] = useState('2025');
  const [completedProgramme, setCompletedProgramme] = useState('');
  const [notes, setNotes] = useState('');

  // Duplicate check & feedback
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateMatchItem[]>([]);
  const [checkingDup, setCheckingDup] = useState(false);
  const [duplicateChecked, setDuplicateChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<{
    tone: 'success' | 'error';
    message: string;
    record?: RegistrationRecordItem;
  } | null>(null);

  useEffect(() => {
    if (!campusId && campuses.length > 0) setCampusId(campuses[0].id);
  }, [campusId, campuses]);

  useEffect(() => {
    if (!programmeId && programmes.length > 0) setProgrammeId(programmes[0].id);
  }, [programmeId, programmes]);

  useEffect(() => {
    if (!intakeId && intakes.length > 0) setIntakeId(intakes[0].id);
  }, [intakeId, intakes]);

  const campusDepartments = useMemo(
    () => departments.filter((d) => !campusId || d.campusId === campusId),
    [departments, campusId]
  );

  useEffect(() => {
    if (
      campusDepartments.length > 0 &&
      (!departmentId || !campusDepartments.some((d) => d.id === departmentId))
    ) {
      setDepartmentId(campusDepartments[0].id);
    }
  }, [campusDepartments, departmentId]);

  const roleAllowedForCategory =
    allowedCategories.length === 0 || allowedCategories.includes(category);

  const handleDuplicateCheck = async () => {
    if (!email.trim() && !phone.trim() && !nationalId.trim()) {
      setBanner({
        tone: 'error',
        message: 'Enter email, phone, or national ID/passport to run a duplicate identity check.',
      });
      return;
    }
    try {
      setCheckingDup(true);
      const res = await fetch('/api/registrations/duplicates/check', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          identificationNumber: nationalId.trim(),
        }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setDuplicateMatches((json.data?.matches ?? []) as DuplicateMatchItem[]);
        setDuplicateChecked(true);
      }
    } finally {
      setCheckingDup(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setNationalId('');
    setJobTitle('');
    setStudentId('');
    setOrganizationName('');
    setContractOrMouRef('');
    setAccessExpiryDate('');
    setHostStaffName('');
    setVisitPurpose('');
    setNotes('');
    setDuplicateMatches([]);
    setDuplicateChecked(false);
    setBanner(null);
  };

  const hasHardDuplicate = duplicateMatches.some(
    (m) => m.matchedReason.includes('Email') || m.matchedReason.includes('National ID')
  );

  const handleSubmit = async (action: 'DRAFT' | 'SUBMIT') => {
    setBanner(null);
    if (!canCreate || !roleAllowedForCategory) {
      setBanner({
        tone: 'error',
        message: `Role ${userRole} does not hold creation authority for ${category} accounts.`,
      });
      return;
    }
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setBanner({
        tone: 'error',
        message: 'First name and last name are required before saving.',
      });
      return;
    }
    if (!email.trim() || !phone.trim() || nationalId.trim().length < 4) {
      setBanner({
        tone: 'error',
        message: 'Valid email, mobile phone, and National ID / Passport (min 4 chars) are required.',
      });
      return;
    }

    const selectedProg = programmes.find((p) => p.id === programmeId);
    const selectedIntake = intakes.find((i) => i.id === intakeId);

    const payload: Record<string, unknown> = {
      category,
      action,
      submitImmediately: action === 'SUBMIT',
      odpcConsentAccepted,
      personal: {
        firstName: firstName.trim(),
        middleName: middleName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        identificationType,
        nationalId: nationalId.trim(),
        gender,
        dateOfBirth,
      },
      institution: {
        campusId: campusId || campuses[0]?.id || 'cmp-nairobi',
        departmentId: departmentId || null,
        programmeId: category === 'STUDENT' ? programmeId || programmes[0]?.id : undefined,
        programmeName: category === 'STUDENT' ? selectedProg?.name : undefined,
        intakeId: category === 'STUDENT' ? intakeId || intakes[0]?.id : undefined,
        intakeName: category === 'STUDENT' ? selectedIntake?.name : undefined,
        role: category === 'STAFF' ? roleCode : category,
      },
      notes: notes.trim() || undefined,
    };

    if (category === 'STAFF') {
      payload.staff = {
        jobTitle: jobTitle.trim(),
        employeeType,
        employmentType,
        startDate,
      };
    } else if (category === 'PARENT') {
      payload.parent = {
        studentId: studentId.trim(),
        relationship,
      };
    } else if (category !== 'STUDENT') {
      payload.other = {
        organizationName: organizationName.trim(),
        contractOrMouRef: contractOrMouRef.trim(),
        accessExpiryDate,
        hostStaffName: hostStaffName.trim(),
        visitPurpose: visitPurpose.trim(),
        graduationYear,
        completedProgramme: completedProgramme.trim(),
      };
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/registrations', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Registration request failed (${res.status}).`);
      }

      const created = json.data as RegistrationRecordItem;
      setBanner({
        tone: 'success',
        message:
          action === 'SUBMIT'
            ? `Submitted ${created.fullName} (${created.category}) for independent approval. No password was set by staff; portal access remains INACTIVE until approved & activated.`
            : `Saved ${created.fullName} as a DRAFT registration record.`,
        record: created,
      });

      onCreated?.(created);
      onSaveSuccess?.();
      await loadReferences();

      // Clear personal & duplicate state while preserving campus defaults
      setFirstName('');
      setMiddleName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setNationalId('');
      setJobTitle('');
      setStudentId('');
      setNotes('');
      setDuplicateMatches([]);
      setDuplicateChecked(false);
    } catch (err) {
      setBanner({
        tone: 'error',
        message: err instanceof Error ? err.message : 'Unable to create registration.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header + Live Institutional Counters */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#1769AA] dark:text-blue-300">
              <UserPlus size={13} /> Controlled Staff Manual Onboarding
            </span>
            <h2 className="text-xl font-extrabold text-[#102D50] dark:text-white tracking-tight">
              Manual Portal User Registration
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl">
              Create verified portal accounts on behalf of students, staff, parents, alumni,
              contractors, partners, or guests. Creating an account here does not auto-admit students
              or grant confidential access—every record passes independent verification, atomic
              numbering, and single-use invitation activation.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 shrink-0">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-3.5 py-2.5 text-center">
              <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Scoped Records
              </span>
              <strong className="text-base font-extrabold font-mono text-[#102D50] dark:text-white tabular-nums">
                {lookupsLoading ? '—' : totalAccounts}
              </strong>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-3.5 py-2.5 text-center">
              <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Awaiting Invite
              </span>
              <strong className="text-base font-extrabold font-mono text-cyan-700 dark:text-cyan-300 tabular-nums">
                {lookupsLoading ? '—' : approvedAwaitingInvite}
              </strong>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 px-3.5 py-2.5 text-center">
              <span className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Pending Activation
              </span>
              <strong className="text-base font-extrabold font-mono text-amber-700 dark:text-amber-300 tabular-nums">
                {lookupsLoading ? '—' : pendingActivation}
              </strong>
            </div>
          </div>
        </div>

        {/* Boundary Warning */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/80 dark:bg-amber-950/40 px-4 py-3 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <ShieldAlert size={16} className="shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          <div>
            <strong>Security & Academic Separation:</strong> Staff never set user passwords. After an
            independent approver approves the submitted record and dispatches an activation link,
            the recipient sets their own password at{' '}
            <code className="font-mono font-bold">/activate-account</code>.
          </div>
        </div>
      </div>

      {/* Result Banner */}
      {banner && (
        <div
          className={`rounded-2xl border px-4 py-3.5 text-xs flex flex-wrap items-center justify-between gap-3 ${
            banner.tone === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
              : 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {banner.tone === 'success' ? (
              <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            ) : (
              <AlertTriangle size={16} className="shrink-0 mt-0.5 text-red-600" />
            )}
            <span>{banner.message}</span>
          </div>
          <div className="flex items-center gap-2">
            {banner.tone === 'success' && onNavigateToApprovals && (
              <button
                type="button"
                onClick={onNavigateToApprovals}
                className="rounded-lg bg-[#102D50] px-3 py-1.5 text-[11px] font-bold text-white hover:bg-[#1769AA]"
              >
                Open Approvals Queue
              </button>
            )}
            <button
              type="button"
              onClick={() => setBanner(null)}
              aria-label="Dismiss notification"
              className="p-1 opacity-75 hover:opacity-100"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Main Split Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-2xs space-y-6">
        {/* Category Selector Grid */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              1. Account Category ({userRole} Authority Scope)
            </label>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Approver for {category}: <strong>{CATEGORY_META[category].approverSummary}</strong>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {ALL_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const selected = category === cat.id;
              const permitted =
                allowedCategories.length === 0 || allowedCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategory(cat.id);
                    setBanner(null);
                  }}
                  className={`rounded-xl border p-3 text-left transition-all flex flex-col justify-between gap-2 ${
                    selected
                      ? 'border-[#1769AA] bg-[#102D50] text-white shadow-sm'
                      : permitted
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 hover:border-[#1769AA]'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-950/30 text-slate-400 dark:text-slate-500 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <Icon size={16} />
                    {!permitted && <Lock size={12} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold leading-tight">{cat.label}</div>
                    <div
                      className={`font-mono text-[10px] mt-0.5 ${
                        selected ? 'text-blue-200' : 'text-slate-400'
                      }`}
                    >
                      {cat.hint}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {!roleAllowedForCategory && (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <Lock size={14} className="shrink-0" />
              <span>
                Your current role (<strong>{userRole}</strong>) is restricted from manually creating{' '}
                <strong>{category}</strong> records. Authorized roles:{' '}
                <strong>{CATEGORY_META[category].registrarSummary}</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Section 2: Personal Identity + Live Duplicate Detection */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white">
                2. Personal Details &amp; Duplicate Identity Check
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Verify email, mobile phone, and National ID against existing students, staff, and registrations.
              </p>
            </div>
            <StaffButton
              variant="secondary"
              type="button"
              onClick={handleDuplicateCheck}
              disabled={checkingDup}
            >
              <ClipboardCheck size={14} />
              <span>{checkingDup ? 'Scanning...' : 'Run Duplicate Check'}</span>
            </StaffButton>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                First Name *
              </label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="e.g. Faith"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Middle Name
              </label>
              <input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Last Name *
              </label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Chepkemoi"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Official / Personal Email *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setDuplicateChecked(false);
                }}
                placeholder="name@example.ac.ke"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Phone Number *
              </label>
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setDuplicateChecked(false);
                }}
                placeholder="+254 712 345 678"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
              />
            </div>
            <div className="grid grid-cols-[120px_1fr] gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID Type
                </label>
                <select
                  value={identificationType}
                  onChange={(e) =>
                    setIdentificationType(
                      e.target.value as 'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT'
                    )
                  }
                  aria-label="Identification type"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200"
                >
                  <option value="NATIONAL_ID">National ID</option>
                  <option value="PASSPORT">Passport</option>
                  <option value="ALIEN_ID">Alien ID</option>
                  <option value="BIRTH_CERT">Birth Cert</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ID / Passport No *
                </label>
                <input
                  value={nationalId}
                  onChange={(e) => {
                    setNationalId(e.target.value);
                    setDuplicateChecked(false);
                  }}
                  placeholder="38491022"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                aria-label="Gender"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {duplicateChecked && duplicateMatches.length === 0 && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 px-3.5 py-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={14} />
              <span>No duplicate identities found in registrations, staff, or students.</span>
            </div>
          )}

          {duplicateMatches.length > 0 && (
            <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/50 p-3.5 space-y-1.5 text-xs text-amber-900 dark:text-amber-200">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-600" />
                <span>Potential Duplicate Identity Detected ({duplicateMatches.length})</span>
              </div>
              {duplicateMatches.map((m, idx) => (
                <div key={idx} className="text-[11px]">
                  • <strong>{m.matchedName}</strong> ({m.matchedEmail}) — {m.matchedReason} [{m.matchedStatus}]
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Institutional Assignment & Category-Specific Metadata */}
        <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-extrabold text-[#102D50] dark:text-white">
            3. Institutional Scope &amp; Category Assignment
          </h3>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Campus *
              </label>
              <select
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                aria-label="Campus"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department / Faculty
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                aria-label="Department"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
              >
                {campusDepartments.length === 0 ? (
                  <option value="">Institutional / Cross-Campus</option>
                ) : (
                  campusDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))
                )}
              </select>
            </div>

            {category === 'STUDENT' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Programme *
                  </label>
                  <select
                    value={programmeId}
                    onChange={(e) => setProgrammeId(e.target.value)}
                    aria-label="Academic programme"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Intake Cohort *
                  </label>
                  <select
                    value={intakeId}
                    onChange={(e) => setIntakeId(e.target.value)}
                    aria-label="Intake cohort"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {intakes.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {category === 'STAFF' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Portal Staff Role *
                  </label>
                  <select
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    aria-label="Staff portal role"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    {STAFF_ROLE_OPTIONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Job Title *
                  </label>
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Assistant Registrar"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Employee Classification
                  </label>
                  <select
                    value={employeeType}
                    onChange={(e) =>
                      setEmployeeType(
                        e.target.value as
                          | 'LECTURER'
                          | 'TEACHING'
                          | 'NON_TEACHING'
                          | 'LIBRARIAN'
                          | 'FINANCE'
                          | 'IT_SUPPORT'
                          | 'ADMINISTRATOR'
                      )
                    }
                    aria-label="Employee classification"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="LECTURER">Lecturer / Trainer</option>
                    <option value="TEACHING">Teaching Staff</option>
                    <option value="NON_TEACHING">Non-Teaching Operations</option>
                    <option value="LIBRARIAN">Librarian</option>
                    <option value="FINANCE">Finance Officer</option>
                    <option value="IT_SUPPORT">IT Support</option>
                    <option value="ADMINISTRATOR">Administrator</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contract Type &amp; Start Date *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={employmentType}
                      onChange={(e) =>
                        setEmploymentType(
                          e.target.value as 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP'
                        )
                      }
                      aria-label="Contract type"
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200"
                    >
                      <option value="PERMANENT">Permanent</option>
                      <option value="FIXED_TERM">Fixed-Term</option>
                      <option value="PART_TIME">Part-Time</option>
                      <option value="INTERNSHIP">Internship</option>
                    </select>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-2 text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </>
            )}

            {category === 'PARENT' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Linked Student Number *
                  </label>
                  <input
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="e.g. HCA/STU/2026/001"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono text-xs uppercase text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relationship to Student *
                  </label>
                  <select
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    aria-label="Relationship to student"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs text-slate-800 dark:text-slate-200"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Mother">Mother</option>
                    <option value="Father">Father</option>
                    <option value="Legal Guardian">Legal Guardian</option>
                    <option value="Sponsor">Educational Sponsor</option>
                  </select>
                </div>
              </>
            )}

            {category === 'ALUMNI' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Graduation Year
                  </label>
                  <input
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2025"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Completed Programme
                  </label>
                  <input
                    value={completedProgramme}
                    onChange={(e) => setCompletedProgramme(e.target.value)}
                    placeholder="e.g. Diploma in ICT"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                </div>
              </>
            )}

            {(category === 'CONTRACTOR' || category === 'PARTNER') && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Organization / Vendor Name
                  </label>
                  <input
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Organization name"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Contract / MOU Reference
                  </label>
                  <input
                    value={contractOrMouRef}
                    onChange={(e) => setContractOrMouRef(e.target.value)}
                    placeholder="e.g. MOU-2026-041"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 font-mono text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Access Expiry Date
                  </label>
                  <input
                    type="date"
                    value={accessExpiryDate}
                    onChange={(e) => setAccessExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                </div>
              </>
            )}

            {category === 'GUEST' && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Host Staff Name
                  </label>
                  <input
                    value={hostStaffName}
                    onChange={(e) => setHostStaffName(e.target.value)}
                    placeholder="Host officer"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visit Purpose
                  </label>
                  <input
                    value={visitPurpose}
                    onChange={(e) => setVisitPurpose(e.target.value)}
                    placeholder="e.g. TVETA Accreditation Audit"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Visitor Pass Expiry
                  </label>
                  <input
                    type="date"
                    value={accessExpiryDate}
                    onChange={(e) => setAccessExpiryDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                </div>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Internal Onboarding Notes (Visible Only to Authorized Reviewers)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Document verification notes, physical file ref, or campus transfer context..."
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950 px-3 py-2 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
            />
          </div>

          {/* ODPC Consent */}
          <label className="flex items-start gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-3.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={odpcConsentAccepted}
              onChange={(e) => setOdpcConsentAccepted(e.target.checked)}
              className="mt-0.5 rounded border-slate-300"
            />
            <span>
              <strong className="text-slate-900 dark:text-white flex items-center gap-1">
                <Info size={13} className="text-[#1769AA]" /> Kenya ODPC Data Verification Acknowledgment
              </strong>
              <span className="block mt-1 text-[11px] leading-relaxed">{ODPC_NOTICE_TEXT}</span>
            </span>
          </label>
        </div>

        {/* Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            {onCancel && (
              <StaffButton variant="secondary" type="button" onClick={onCancel}>
                Back to Overview
              </StaffButton>
            )}
            <StaffButton variant="secondary" type="button" onClick={resetForm}>
              Clear Form
            </StaffButton>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <StaffButton
              variant="secondary"
              type="button"
              disabled={submitting || !canCreate || !roleAllowedForCategory || !odpcConsentAccepted}
              onClick={() => handleSubmit('DRAFT')}
            >
              <Save size={14} />
              <span>{submitting ? 'Saving...' : 'Save Draft'}</span>
            </StaffButton>
            <StaffButton
              type="button"
              disabled={
                submitting ||
                !canCreate ||
                !roleAllowedForCategory ||
                !odpcConsentAccepted ||
                hasHardDuplicate
              }
              onClick={() => handleSubmit('SUBMIT')}
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting...' : 'Submit for Review'}</span>
            </StaffButton>
          </div>
        </div>
      </div>
    </div>
  );
}

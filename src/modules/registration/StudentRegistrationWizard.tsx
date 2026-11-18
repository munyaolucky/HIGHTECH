import { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  FileUp,
  Save,
  Send,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import {
  ACADEMIC_INTAKES,
  ACADEMIC_PROGRAMMES,
  ODPC_NOTICE_TEXT,
} from './registration.config';
import type {
  CreateRegistrationPayload,
  DuplicateMatchItem,
  ReferenceCampus,
  ReferenceDepartment,
  RegistrationDocumentItem,
} from './registration.types';

const STEPS = [
  { id: 1, label: 'Personal' },
  { id: 2, label: 'Academic' },
  { id: 3, label: 'Prior Education' },
  { id: 4, label: 'Guardian' },
  { id: 5, label: 'Documents' },
  { id: 6, label: 'Finance' },
  { id: 7, label: 'Review & Submit' },
];

interface Props {
  campuses: ReferenceCampus[];
  departments: ReferenceDepartment[];
  onSubmit: (payload: CreateRegistrationPayload) => Promise<void>;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]';
const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

export default function StudentRegistrationWizard({
  campuses,
  departments,
  onSubmit,
  onCancel,
}: Props) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicates, setDuplicates] = useState<DuplicateMatchItem[]>([]);
  const [checkingDup, setCheckingDup] = useState(false);

  // Step 1: Personal
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('2005-04-12');
  const [nationality, setNationality] = useState('Kenyan');
  const [identificationType, setIdentificationType] = useState<
    'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT'
  >('NATIONAL_ID');
  const [identificationNumber, setIdentificationNumber] = useState('');

  // Step 2: Academic
  const [programme, setProgramme] = useState(ACADEMIC_PROGRAMMES[0]);
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? 'cmp-nairobi');
  const [departmentId, setDepartmentId] = useState(
    departments.find((d) => d.code === 'SCI')?.id ?? departments[0]?.id ?? ''
  );
  const [intake, setIntake] = useState(ACADEMIC_INTAKES[0]);
  const [studyMode, setStudyMode] = useState<'FULL_TIME' | 'PART_TIME' | 'EVENING' | 'ONLINE'>(
    'FULL_TIME'
  );

  // Step 3: Previous education
  const [previousInstitution, setPreviousInstitution] = useState('');
  const [previousQualification, setPreviousQualification] = useState('KCSE Certificate');
  const [previousGrade, setPreviousGrade] = useState('');

  // Step 4: Guardian
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Parent');

  // Step 5: Documents
  const [documents, setDocuments] = useState<RegistrationDocumentItem[]>([
    {
      docType: 'National ID / Birth Certificate',
      fileName: 'national_id_scan.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 224000,
      verified: false,
    },
  ]);
  const [newDocType, setNewDocType] = useState('KCSE Result Slip / Certificate');

  // Step 6: Finance
  const [feeCategory, setFeeCategory] = useState<
    'SELF_SPONSORED' | 'GOVERNMENT_KUCCPS' | 'HELB_LOAN' | 'SCHOLARSHIP' | 'CORPORATE'
  >('SELF_SPONSORED');
  const [sponsorshipReference, setSponsorshipReference] = useState('');

  // Step 7: ODPC
  const [odpcConsentAccepted, setOdpcConsentAccepted] = useState(false);

  async function runDuplicateCheck() {
    if (!email.trim() && !phone.trim() && !identificationNumber.trim()) return;
    try {
      setCheckingDup(true);
      const res = await fetch('/api/registrations/duplicates/check', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, identificationNumber }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success) {
        setDuplicates(json.data.matches ?? []);
      }
    } finally {
      setCheckingDup(false);
    }
  }

  function validateCurrentStep(): string | null {
    if (step === 1) {
      if (fullName.trim().length < 3) return 'Enter student full name (at least 3 characters).';
      if (!email.includes('@')) return 'Enter a valid email address.';
      if (phone.trim().length < 7) return 'Enter a valid mobile phone number.';
      if (identificationNumber.trim().length < 4)
        return 'Provide National ID, Passport, or Birth Certificate number.';
    }
    if (step === 3) {
      if (!previousInstitution.trim()) return 'Enter previous school or institution name.';
      if (!previousGrade.trim()) return 'Enter previous qualification grade/score.';
    }
    if (step === 4) {
      if (!guardianName.trim() || !guardianPhone.trim())
        return 'Guardian name and mobile phone are required.';
    }
    return null;
  }

  function handleNext() {
    const err = validateCurrentStep();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    if (step === 1) {
      runDuplicateCheck().catch(() => {});
    }
    setStep((s) => Math.min(7, s + 1));
  }

  function handleAttachFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Attachment exceeds the 10 MB maximum file size.');
      return;
    }
    setError(null);
    setDocuments((prev) => [
      ...prev,
      {
        docType: newDocType,
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        sizeBytes: file.size,
        verified: false,
      },
    ]);
  }

  async function handleSave(submitImmediately: boolean) {
    setError(null);
    if (!odpcConsentAccepted) {
      setError('Please acknowledge the ODPC Data Protection & Student Rights notice.');
      return;
    }
    if (submitImmediately) {
      if (!fullName.trim() || !email.trim() || !identificationNumber.trim()) {
        setError('Complete Step 1 personal details before submitting.');
        return;
      }
      if (!guardianName.trim() || !guardianPhone.trim()) {
        setError('Complete Step 4 guardian contact details before submitting.');
        return;
      }
    }

    try {
      setSubmitting(true);
      await onSubmit({
        category: 'STUDENT',
        subType: 'REGULAR_STUDENT',
        submitImmediately,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        gender,
        dateOfBirth,
        nationality,
        identificationType,
        identificationNumber: identificationNumber.trim(),
        campusId,
        departmentId: departmentId || null,
        proposedRole: 'STUDENT',
        odpcConsentAccepted,
        documents,
        studentDetails: {
          programme,
          intake,
          studyMode,
          previousInstitution: previousInstitution.trim() || 'Pending School Verification',
          previousQualification,
          previousGrade: previousGrade.trim() || 'Pending Grade',
          guardianName: guardianName.trim() || 'Pending Guardian',
          guardianPhone: guardianPhone.trim() || phone.trim(),
          guardianEmail: guardianEmail.trim(),
          guardianRelationship,
          feeCategory,
          sponsorshipReference: sponsorshipReference.trim() || 'SELF-FUNDED',
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save student registration.');
    } finally {
      setSubmitting(false);
    }
  }

  const campusName = campuses.find((c) => c.id === campusId)?.name ?? campusId;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 space-y-6 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#102D50] dark:text-white">
            Student Enrolment & Registration Wizard (7 Steps)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Creates an enrolment registration file only. Admission number (HCA/STU/YYYY/0001) and
            portal access remain unassigned until Registrar approval and token activation.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          Back to Overview
        </button>
      </div>

      {/* Stepper */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STEPS.map((s) => {
          const active = step === s.id;
          const done = step > s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                active
                  ? 'border-[#1769AA] bg-[#eef4fd] dark:bg-blue-950/60 text-[#102D50] dark:text-blue-200 font-bold'
                  : done
                  ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                  active
                    ? 'bg-[#1769AA] text-white'
                    : done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                }`}
              >
                {done ? <Check size={12} /> : s.id}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      {duplicates.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <div className="font-bold">Potential Duplicate Record Detected</div>
            <ul className="mt-1 space-y-0.5">
              {duplicates.map((d, i) => (
                <li key={i}>
                  Matches <span className="font-semibold">{d.matchedName}</span> ({d.matchedEmail}) via{' '}
                  {d.matchedReason} — status: {d.matchedStatus}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Step Content */}
      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Full Legal Name *</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Faith Wanjiru Kamau"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => runDuplicateCheck().catch(() => {})}
              placeholder="e.g. applicant@example.com"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Mobile Phone *</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={() => runDuplicateCheck().catch(() => {})}
              placeholder="+254 712 345 678"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Gender</label>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Date of Birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Nationality</label>
            <input
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Identification Document Type *</label>
            <select
              value={identificationType}
              onChange={(e) =>
                setIdentificationType(
                  e.target.value as 'NATIONAL_ID' | 'PASSPORT' | 'ALIEN_ID' | 'BIRTH_CERT'
                )
              }
              className={inputCls}
            >
              <option value="NATIONAL_ID">National ID</option>
              <option value="PASSPORT">Passport</option>
              <option value="BIRTH_CERT">Birth Certificate</option>
              <option value="ALIEN_ID">Alien / Refugee ID</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>ID / Passport Number (Masked in Directory) *</label>
            <input
              value={identificationNumber}
              onChange={(e) => setIdentificationNumber(e.target.value)}
              onBlur={() => runDuplicateCheck().catch(() => {})}
              placeholder="e.g. 38492014"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Academic Programme *</label>
            <select value={programme} onChange={(e) => setProgramme(e.target.value)} className={inputCls}>
              {ACADEMIC_PROGRAMMES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Campus *</label>
            <select value={campusId} onChange={(e) => setCampusId(e.target.value)} className={inputCls}>
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Academic Department</label>
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputCls}>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Intake Cohort *</label>
            <select value={intake} onChange={(e) => setIntake(e.target.value)} className={inputCls}>
              {ACADEMIC_INTAKES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Study Mode</label>
            <select
              value={studyMode}
              onChange={(e) =>
                setStudyMode(e.target.value as 'FULL_TIME' | 'PART_TIME' | 'EVENING' | 'ONLINE')
              }
              className={inputCls}
            >
              <option value="FULL_TIME">Full-Time (Day)</option>
              <option value="EVENING">Evening Cohort</option>
              <option value="PART_TIME">Part-Time / Weekend</option>
              <option value="ONLINE">ODeL Online Learning</option>
            </select>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls}>Previous High School / College *</label>
            <input
              value={previousInstitution}
              onChange={(e) => setPreviousInstitution(e.target.value)}
              placeholder="e.g. Alliance Girls High School"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Qualification Obtained</label>
            <select
              value={previousQualification}
              onChange={(e) => setPreviousQualification(e.target.value)}
              className={inputCls}
            >
              <option value="KCSE Certificate">KCSE Certificate</option>
              <option value="KNEC Craft Certificate">KNEC Craft Certificate</option>
              <option value="IGCSE / A-Level">IGCSE / A-Level</option>
              <option value="Diploma Credit Transfer">Diploma Credit Transfer</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Mean Grade / GPA *</label>
            <input
              value={previousGrade}
              onChange={(e) => setPreviousGrade(e.target.value)}
              placeholder="e.g. C+ (58 pts) or Credit"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Parent / Guardian Full Name *</label>
            <input
              value={guardianName}
              onChange={(e) => setGuardianName(e.target.value)}
              placeholder="e.g. Samuel Kamau"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Relationship</label>
            <select
              value={guardianRelationship}
              onChange={(e) => setGuardianRelationship(e.target.value)}
              className={inputCls}
            >
              <option value="Parent">Parent</option>
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Legal Guardian">Legal Guardian</option>
              <option value="Sponsor">Sponsor</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Guardian Mobile Number *</label>
            <input
              value={guardianPhone}
              onChange={(e) => setGuardianPhone(e.target.value)}
              placeholder="+254 722 000 111"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Guardian Email (Optional for Parent Portal Invite)</label>
            <input
              type="email"
              value={guardianEmail}
              onChange={(e) => setGuardianEmail(e.target.value)}
              placeholder="guardian@example.com"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-950/40 p-4">
            <div>
              <label className={labelCls}>Document Category (PDF, JPG, PNG · Max 10 MB)</label>
              <select
                value={newDocType}
                onChange={(e) => setNewDocType(e.target.value)}
                className={inputCls}
              >
                <option value="KCSE Result Slip / Certificate">KCSE Result Slip / Certificate</option>
                <option value="National ID / Birth Certificate">National ID / Birth Certificate</option>
                <option value="Passport Size Photograph">Passport Size Photograph</option>
                <option value="Admission Acceptance Letter">Admission Acceptance Letter</option>
                <option value="Sponsor / HELB Award Letter">Sponsor / HELB Award Letter</option>
              </select>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#1769AA] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#12568E]">
              <FileUp size={15} />
              <span>Attach Verification File</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(e) => handleAttachFile(e.target.files?.[0])}
              />
            </label>
          </div>

          <div className="space-y-2">
            {documents.map((doc, idx) => (
              <div
                key={`${doc.docType}-${idx}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2.5 text-xs"
              >
                <div>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">
                    {doc.docType}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400">
                    {doc.fileName} · {(doc.sizeBytes / 1024).toFixed(0)} KB
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDocuments((prev) =>
                        prev.map((d, i) => (i === idx ? { ...d, verified: !d.verified } : d))
                      )
                    }
                    className={`rounded-lg px-2.5 py-1 font-semibold ${
                      doc.verified
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {doc.verified ? 'Verified' : 'Mark Verified'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDocuments((prev) => prev.filter((_, i) => i !== idx))}
                    aria-label="Remove document"
                    className="rounded-lg p-1.5 text-slate-400 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Tuition Billing & Fee Category</label>
            <select
              value={feeCategory}
              onChange={(e) =>
                setFeeCategory(
                  e.target.value as
                    | 'SELF_SPONSORED'
                    | 'GOVERNMENT_KUCCPS'
                    | 'HELB_LOAN'
                    | 'SCHOLARSHIP'
                    | 'CORPORATE'
                )
              }
              className={inputCls}
            >
              <option value="SELF_SPONSORED">Self-Sponsored</option>
              <option value="GOVERNMENT_KUCCPS">Government / KUCCPS Placement</option>
              <option value="HELB_LOAN">HELB / TVET Bursary</option>
              <option value="SCHOLARSHIP">Institutional Scholarship</option>
              <option value="CORPORATE">Corporate Sponsor</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Sponsorship / Bursary Reference</label>
            <input
              value={sponsorshipReference}
              onChange={(e) => setSponsorshipReference(e.target.value)}
              placeholder="e.g. HELB-2026-9104 or SELF"
              className={inputCls}
            />
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 p-4 text-xs">
            <div>
              <span className="text-slate-400">Applicant Name</span>
              <div className="font-bold text-slate-900 dark:text-white mt-0.5">{fullName || '—'}</div>
            </div>
            <div>
              <span className="text-slate-400">Email & Phone</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {email || '—'} · {phone || '—'}
              </div>
            </div>
            <div>
              <span className="text-slate-400">Campus & Intake</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {campusName} · {intake}
              </div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-slate-400">Programme</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{programme}</div>
            </div>
            <div>
              <span className="text-slate-400">Guardian & Fee Type</span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                {guardianName || '—'} · {feeCategory.replaceAll('_', ' ')}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 dark:border-blue-900/70 bg-blue-50/70 dark:bg-blue-950/30 p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2.5">
            <div className="flex items-center gap-2 font-bold text-[#102D50] dark:text-blue-200">
              <ShieldCheck size={16} />
              <span>ODPC Data Protection & Lifecycle Notice</span>
            </div>
            <p className="leading-relaxed">{ODPC_NOTICE_TEXT}</p>
            <label className="flex items-start gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={odpcConsentAccepted}
                onChange={(e) => setOdpcConsentAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1769AA]"
              />
              <span className="font-semibold text-slate-900 dark:text-white">
                I confirm the student has been informed of data collection purposes and verified
                documents are authentic. {checkingDup ? '(Checking duplicates...)' : ''}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40"
        >
          <ArrowLeft size={14} /> Previous
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSave(false)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            <Save size={14} /> Save Draft
          </button>

          {step < 7 ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#1769AA] px-4 py-2 text-xs font-semibold text-white hover:bg-[#12568E]"
            >
              <span>Next Step</span>
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleSave(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 size={14} />
              <span>{submitting ? 'Submitting...' : 'Submit for Registrar Approval'}</span>
              <Send size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

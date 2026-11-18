import { useState } from 'react';
import { CheckCircle2, Save, Send, ShieldCheck } from 'lucide-react';
import { CATEGORY_META, ODPC_NOTICE_TEXT } from './registration.config';
import type {
  CreateRegistrationPayload,
  ReferenceCampus,
  ReferenceDepartment,
  RegistrationCategory,
} from './registration.types';

const OTHER_CATEGORIES: RegistrationCategory[] = [
  'PARENT',
  'ALUMNI',
  'CONTRACTOR',
  'PARTNER',
  'GUEST',
];

interface Props {
  allowedCategories: RegistrationCategory[];
  campuses: ReferenceCampus[];
  departments: ReferenceDepartment[];
  initialCategory?: RegistrationCategory;
  onSubmit: (payload: CreateRegistrationPayload) => Promise<void>;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]';
const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

export default function OtherUserRegistrationForm({
  allowedCategories,
  campuses,
  departments,
  initialCategory,
  onSubmit,
  onCancel,
}: Props) {
  const permittedOther = OTHER_CATEGORIES.filter((c) => allowedCategories.includes(c));
  const defaultCat =
    initialCategory && permittedOther.includes(initialCategory)
      ? initialCategory
      : permittedOther[0] ?? 'GUEST';

  const [category, setCategory] = useState<RegistrationCategory>(defaultCat);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [identificationNumber, setIdentificationNumber] = useState('');
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? 'cmp-nairobi');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? '');

  // Category-specific fields
  const [linkedStudentNumber, setLinkedStudentNumber] = useState('HCA/STU/2026/0001');
  const [relationshipToStudent, setRelationshipToStudent] = useState('Mother');
  const [graduationYear, setGraduationYear] = useState('2024');
  const [completedProgramme, setCompletedProgramme] = useState(
    'Diploma in Information Communication Technology'
  );
  const [organizationName, setOrganizationName] = useState('');
  const [contractOrMouRef, setContractOrMouRef] = useState('');
  const [accessExpiryDate, setAccessExpiryDate] = useState('2026-12-31');
  const [hostStaffName, setHostStaffName] = useState('');
  const [visitPurpose, setVisitPurpose] = useState('');

  const [odpcConsentAccepted, setOdpcConsentAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(submitImmediately: boolean) {
    setError(null);
    if (!odpcConsentAccepted) {
      setError('ODPC data-protection consent checkbox is required.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !identificationNumber.trim()) {
      setError('Full name, email, and identification number are required.');
      return;
    }
    if (category === 'PARENT' && !linkedStudentNumber.trim()) {
      setError('Linked student registration number is required for Parent/Guardian verification.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        category,
        subType: category,
        submitImmediately,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '+254700000000',
        gender: 'Prefer not to say',
        dateOfBirth: '1985-01-01',
        nationality: 'Kenyan',
        identificationType: 'NATIONAL_ID',
        identificationNumber: identificationNumber.trim(),
        campusId,
        departmentId: departmentId || null,
        proposedRole: category,
        odpcConsentAccepted,
        documents: [],
        otherDetails: {
          linkedStudentNumber: category === 'PARENT' ? linkedStudentNumber.trim() : undefined,
          relationshipToStudent: category === 'PARENT' ? relationshipToStudent : undefined,
          relationshipVerified: category === 'PARENT' ? false : undefined,
          graduationYear: category === 'ALUMNI' ? graduationYear : undefined,
          completedProgramme: category === 'ALUMNI' ? completedProgramme : undefined,
          organizationName:
            category === 'CONTRACTOR' || category === 'PARTNER'
              ? organizationName.trim()
              : undefined,
          contractOrMouRef:
            category === 'CONTRACTOR' || category === 'PARTNER'
              ? contractOrMouRef.trim()
              : undefined,
          accessExpiryDate:
            category === 'CONTRACTOR' || category === 'PARTNER' || category === 'GUEST'
              ? accessExpiryDate
              : undefined,
          hostStaffName: category === 'GUEST' ? hostStaffName.trim() : undefined,
          visitPurpose: category === 'GUEST' ? visitPurpose.trim() : undefined,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create registration.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 space-y-6 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#102D50] dark:text-white">
            Register Stakeholder / External User
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Structured onboarding for Parents/Guardians, Alumni, Contractors/Suppliers, Partner
            Institutions, and Guests/Visitors.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300"
        >
          Back to Overview
        </button>
      </div>

      {/* Category Picker */}
      <div className="grid gap-2 sm:grid-cols-5">
        {OTHER_CATEGORIES.map((cat) => {
          const allowed = allowedCategories.includes(cat);
          const active = category === cat;
          return (
            <button
              key={cat}
              type="button"
              disabled={!allowed}
              onClick={() => setCategory(cat)}
              className={`rounded-xl border p-3 text-left text-xs transition-colors ${
                active
                  ? 'border-[#1769AA] bg-[#eef4fd] dark:bg-blue-950/60 text-[#102D50] dark:text-blue-200 font-bold'
                  : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <div>{CATEGORY_META[cat].shortLabel}</div>
              <div className="mt-1 font-mono text-[10px] text-slate-400">
                {allowed ? CATEGORY_META[cat].numberFormat : 'Restricted Role'}
              </div>
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelCls}>Full Name *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full legal name"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@example.com"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Phone Number *</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254 712 000 000"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>National ID / Passport (Masked) *</label>
          <input
            value={identificationNumber}
            onChange={(e) => setIdentificationNumber(e.target.value)}
            placeholder="e.g. 24510982"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Campus Scope</label>
          <select value={campusId} onChange={(e) => setCampusId(e.target.value)} className={inputCls}>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Sponsoring Office / Department</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputCls}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category specific section */}
      {category === 'PARENT' && (
        <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <label className={labelCls}>Linked Student Registration Number *</label>
            <input
              value={linkedStudentNumber}
              onChange={(e) => setLinkedStudentNumber(e.target.value)}
              placeholder="HCA/STU/2026/0001"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Relationship to Student *</label>
            <select
              value={relationshipToStudent}
              onChange={(e) => setRelationshipToStudent(e.target.value)}
              className={inputCls}
            >
              <option value="Mother">Mother</option>
              <option value="Father">Father</option>
              <option value="Legal Guardian">Legal Guardian</option>
              <option value="Fee Sponsor">Fee Sponsor</option>
            </select>
          </div>
        </div>
      )}

      {category === 'ALUMNI' && (
        <div className="grid gap-4 sm:grid-cols-2 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <label className={labelCls}>Graduation / Completion Year</label>
            <input
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Completed Programme</label>
            <input
              value={completedProgramme}
              onChange={(e) => setCompletedProgramme(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}

      {(category === 'CONTRACTOR' || category === 'PARTNER') && (
        <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <label className={labelCls}>Organization / Institution Name *</label>
            <input
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g. Safaricom Enterprise / TVETA"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Contract / LPO / MOU Reference</label>
            <input
              value={contractOrMouRef}
              onChange={(e) => setContractOrMouRef(e.target.value)}
              placeholder="e.g. LPO-2026-0812"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Access Expiry Date *</label>
            <input
              type="date"
              value={accessExpiryDate}
              onChange={(e) => setAccessExpiryDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}

      {category === 'GUEST' && (
        <div className="grid gap-4 sm:grid-cols-3 border-t border-slate-100 dark:border-slate-800 pt-4">
          <div>
            <label className={labelCls}>Host Staff / Office *</label>
            <input
              value={hostStaffName}
              onChange={(e) => setHostStaffName(e.target.value)}
              placeholder="e.g. H. Oduor (Registrar)"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Purpose of Visit *</label>
            <input
              value={visitPurpose}
              onChange={(e) => setVisitPurpose(e.target.value)}
              placeholder="e.g. External Accreditation Visit"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Temporary Access Expiry *</label>
            <input
              type="date"
              value={accessExpiryDate}
              onChange={(e) => setAccessExpiryDate(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      )}

      <div className="rounded-xl border border-blue-200 dark:border-blue-900/70 bg-blue-50/70 dark:bg-blue-950/30 p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#102D50] dark:text-blue-200">
          <ShieldCheck size={16} />
          <span>ODPC Privacy & Access Boundary</span>
        </div>
        <p>{ODPC_NOTICE_TEXT}</p>
        <label className="flex items-start gap-2.5 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={odpcConsentAccepted}
            onChange={(e) => setOdpcConsentAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#1769AA]"
          />
          <span className="font-semibold text-slate-900 dark:text-white">
            I confirm identity verification & data protection acknowledgment for this stakeholder.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSave(false)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
        >
          <Save size={14} /> Save Draft
        </button>
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSave(true)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
        >
          <CheckCircle2 size={14} />
          <span>{submitting ? 'Submitting...' : 'Submit for Verification'}</span>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { AlertTriangle, CheckCircle2, FileUp, Save, Send, ShieldCheck, Trash2 } from 'lucide-react';
import { ODPC_NOTICE_TEXT, STAFF_ROLE_OPTIONS } from './registration.config';
import type {
  CreateRegistrationPayload,
  DuplicateMatchItem,
  ReferenceCampus,
  ReferenceDepartment,
  RegistrationDocumentItem,
} from './registration.types';

interface Props {
  actorRole: string;
  campuses: ReferenceCampus[];
  departments: ReferenceDepartment[];
  onSubmit: (payload: CreateRegistrationPayload) => Promise<void>;
  onCancel: () => void;
}

const inputCls =
  'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]';
const labelCls = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

export default function StaffRegistrationForm({
  actorRole,
  campuses,
  departments,
  onSubmit,
  onCancel,
}: Props) {
  const isAdminActor = actorRole === 'ADMIN';
  const availableRoles = isAdminActor
    ? STAFF_ROLE_OPTIONS.filter((r) => r.value === 'ADMIN')
    : STAFF_ROLE_OPTIONS.filter((r) => r.value !== 'ADMIN');

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('Female');
  const [dateOfBirth, setDateOfBirth] = useState('1990-05-15');
  const [nationality, setNationality] = useState('Kenyan');
  const [identificationType, setIdentificationType] = useState<'NATIONAL_ID' | 'PASSPORT'>('NATIONAL_ID');
  const [identificationNumber, setIdentificationNumber] = useState('');

  const [employeeType, setEmployeeType] = useState<
    'TEACHING' | 'NON_TEACHING' | 'LECTURER' | 'LIBRARIAN' | 'FINANCE' | 'IT_SUPPORT' | 'ADMINISTRATOR'
  >(isAdminActor ? 'ADMINISTRATOR' : 'LECTURER');
  const [jobTitle, setJobTitle] = useState('');
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? 'cmp-nairobi');
  const [departmentId, setDepartmentId] = useState(departments[0]?.id ?? '');
  const [supervisorName, setSupervisorName] = useState('');
  const [contractType, setContractType] = useState<'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP'>(
    'FIXED_TERM'
  );
  const [startDate, setStartDate] = useState('2026-09-01');
  const [endDate, setEndDate] = useState('2029-08-31');
  const [highestQualification, setHighestQualification] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('');
  const [proposedRole, setProposedRole] = useState(availableRoles[0]?.value ?? 'LECTURER');
  const [compensationBand, setCompensationBand] = useState('Scale L3 (Confidential)');
  const [documents, setDocuments] = useState<RegistrationDocumentItem[]>([
    {
      docType: 'National ID & PIN Certificate',
      fileName: 'staff_id_kra.pdf',
      mimeType: 'application/pdf',
      sizeBytes: 310000,
      verified: true,
    },
  ]);
  const [odpcConsentAccepted, setOdpcConsentAccepted] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatchItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runDuplicateCheck() {
    if (!email.trim() && !identificationNumber.trim()) return;
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
  }

  function handleAttachFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError('Attachment exceeds maximum 10 MB size.');
      return;
    }
    setDocuments((prev) => [
      ...prev,
      {
        docType: 'Academic / Employment Credential',
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
      setError('ODPC data-protection acknowledgment is required.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !identificationNumber.trim()) {
      setError('Staff full name, email, and national ID / passport are required.');
      return;
    }
    if (submitImmediately && (!jobTitle.trim() || !emergencyContactName.trim())) {
      setError('Job title and emergency contact are required before submitting for approval.');
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        category: 'STAFF',
        subType: employeeType,
        submitImmediately,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || '+254700000000',
        gender,
        dateOfBirth,
        nationality,
        identificationType,
        identificationNumber: identificationNumber.trim(),
        campusId,
        departmentId: departmentId || null,
        proposedRole,
        odpcConsentAccepted,
        documents,
        staffDetails: {
          employeeType,
          jobTitle: jobTitle.trim() || 'College Staff Member',
          supervisorName: supervisorName.trim() || 'Department Head',
          contractType,
          startDate,
          endDate,
          highestQualification: highestQualification.trim() || 'Degree / Diploma',
          specialization: specialization.trim() || 'Institutional Operations',
          emergencyContactName: emergencyContactName.trim() || 'Pending Contact',
          emergencyContactPhone: emergencyContactPhone.trim() || phone.trim(),
          compensationBandConfidential: compensationBand.trim(),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save staff registration.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:p-6 space-y-6 shadow-2xs">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-extrabold text-[#102D50] dark:text-white">
            Staff & Faculty Onboarding Form
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isAdminActor
              ? 'System Administrators may initiate Administrator onboarding (subject to Principal approval). Teaching & general staff must be registered by HR.'
              : 'HR Officers register teaching, non-teaching, lecturers, librarians, finance & IT staff. Independent approval by Principal or separate HR approver is enforced.'}
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

      {duplicates.length > 0 && (
        <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <div className="font-bold">Potential Duplicate Found</div>
            {duplicates.map((d, i) => (
              <div key={i}>
                {d.matchedName} ({d.matchedEmail}) · {d.matchedReason}
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelCls}>Full Legal Name *</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Dr. Jane Muthoni"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Official / Personal Email *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => runDuplicateCheck().catch(() => {})}
            placeholder="jmuthoni@hitech.ac.ke"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Mobile Phone *</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+254 712 000 333"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>ID / Passport Type</label>
          <select
            value={identificationType}
            onChange={(e) => setIdentificationType(e.target.value as 'NATIONAL_ID' | 'PASSPORT')}
            className={inputCls}
          >
            <option value="NATIONAL_ID">National ID</option>
            <option value="PASSPORT">Passport</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Identification Number (Masked) *</label>
          <input
            value={identificationNumber}
            onChange={(e) => setIdentificationNumber(e.target.value)}
            onBlur={() => runDuplicateCheck().catch(() => {})}
            placeholder="e.g. 27491028"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Gender & DOB</label>
          <div className="grid grid-cols-2 gap-2">
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inputCls}>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className={labelCls}>Staff Category</label>
          <select
            value={employeeType}
            onChange={(e) =>
              setEmployeeType(
                e.target.value as
                  | 'TEACHING'
                  | 'NON_TEACHING'
                  | 'LECTURER'
                  | 'LIBRARIAN'
                  | 'FINANCE'
                  | 'IT_SUPPORT'
                  | 'ADMINISTRATOR'
              )
            }
            className={inputCls}
          >
            {!isAdminActor && (
              <>
                <option value="LECTURER">Lecturer (Teaching)</option>
                <option value="TEACHING">Teaching Staff / Trainer</option>
                <option value="NON_TEACHING">Non-Teaching Staff</option>
                <option value="LIBRARIAN">Librarian</option>
                <option value="FINANCE">Finance Officer</option>
                <option value="IT_SUPPORT">IT Support / Technician</option>
              </>
            )}
            {isAdminActor && <option value="ADMINISTRATOR">System Administrator</option>}
          </select>
        </div>
        <div>
          <label className={labelCls}>Job Title *</label>
          <input
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            placeholder="e.g. Senior Lecturer in Cloud Computing"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Proposed Portal Role (Preview Only)</label>
          <select
            value={proposedRole}
            onChange={(e) => setProposedRole(e.target.value)}
            className={inputCls}
          >
            {availableRoles.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Duty Campus *</label>
          <select value={campusId} onChange={(e) => setCampusId(e.target.value)} className={inputCls}>
            {campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Department *</label>
          <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} className={inputCls}>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Reporting Supervisor</label>
          <input
            value={supervisorName}
            onChange={(e) => setSupervisorName(e.target.value)}
            placeholder="e.g. Dr. Margaret Wambui (HOD)"
            className={inputCls}
          />
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelCls}>Contract Type</label>
          <select
            value={contractType}
            onChange={(e) =>
              setContractType(
                e.target.value as 'PERMANENT' | 'FIXED_TERM' | 'PART_TIME' | 'INTERNSHIP'
              )
            }
            className={inputCls}
          >
            <option value="FIXED_TERM">Fixed-Term Contract</option>
            <option value="PERMANENT">Permanent & Pensionable</option>
            <option value="PART_TIME">Part-Time Adjunct</option>
            <option value="INTERNSHIP">Graduate Internship</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Start Date *</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Contract End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Confidential Pay Scale (HR & Principal Only)</label>
          <input
            value={compensationBand}
            onChange={(e) => setCompensationBand(e.target.value)}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Highest Qualification</label>
          <input
            value={highestQualification}
            onChange={(e) => setHighestQualification(e.target.value)}
            placeholder="e.g. MSc Information Systems"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Area of Specialization</label>
          <input
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Distributed Cloud Security"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Emergency Contact Name *</label>
          <input
            value={emergencyContactName}
            onChange={(e) => setEmergencyContactName(e.target.value)}
            placeholder="Next of kin full name"
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Emergency Contact Phone *</label>
          <input
            value={emergencyContactPhone}
            onChange={(e) => setEmergencyContactPhone(e.target.value)}
            placeholder="+254 722 111 222"
            className={inputCls}
          />
        </div>
      </div>

      {/* Documents checklist */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
            Verification Documents Checklist
          </div>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-[#1769AA] dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800">
            <FileUp size={14} /> Attach Credential
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              onChange={(e) => handleAttachFile(e.target.files?.[0])}
            />
          </label>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {documents.map((d, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2 text-xs"
            >
              <span className="truncate font-medium text-slate-700 dark:text-slate-300">
                {d.docType} ({d.fileName})
              </span>
              <button
                type="button"
                onClick={() => setDocuments((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="Remove document"
                className="text-slate-400 hover:text-red-600 ml-2"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 dark:border-blue-900/70 bg-blue-50/70 dark:bg-blue-950/30 p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2">
        <div className="flex items-center gap-2 font-bold text-[#102D50] dark:text-blue-200">
          <ShieldCheck size={16} />
          <span>Separation of Duties & ODPC Notice</span>
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
            I confirm employee consent has been captured and understand portal role activation only
            occurs after independent Principal/HR approval and invitation verification.
          </span>
        </label>
      </div>

      <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-4">
        <button
          type="button"
          disabled={submitting}
          onClick={() => handleSave(false)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
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
          <span>{submitting ? 'Submitting...' : 'Submit for Independent Approval'}</span>
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}

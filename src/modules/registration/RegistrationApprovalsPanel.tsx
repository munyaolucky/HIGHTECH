import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  History,
  MessageSquareWarning,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import type { StaffUserAccount } from '../../config/staff-navigation';
import { PortalConfirmDialog } from '../../components/ui/PortalUI';
import { StaffButton, StaffStatCard } from '../staff/components/StaffDashboardUI';
import { CATEGORY_META, STATUS_BADGE_MAP } from './registration.config';
import type {
  RegistrationCategory,
  RegistrationHistoryItem,
  RegistrationRecordItem,
} from './registration.types';

interface Props {
  items: RegistrationRecordItem[];
  allowedApproveCategories: RegistrationCategory[];
  user: StaffUserAccount;
  canReject: boolean;
  actionLoading: boolean;
  onVerifyDocument: (id: string, docIndex: number, verified: boolean) => Promise<void>;
  onApprove: (id: string, comments?: string) => Promise<void>;
  onReject: (id: string, comments: string) => Promise<void>;
  onRequestChanges: (id: string, comments: string) => Promise<void>;
  onInspectFullFile: (record: RegistrationRecordItem) => void;
}

export default function RegistrationApprovalsPanel({
  items,
  allowedApproveCategories,
  user,
  canReject,
  actionLoading,
  onVerifyDocument,
  onApprove,
  onReject,
  onRequestChanges,
  onInspectFullFile,
}: Props) {
  const pendingQueue = useMemo(
    () => items.filter((r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'),
    [items]
  );
  const approvedCount = useMemo(
    () =>
      items.filter(
        (r) => r.status === 'APPROVED' || r.status === 'INVITED' || r.status === 'ACTIVATED'
      ).length,
    [items]
  );
  const changesRequestedQueue = useMemo(
    () => items.filter((r) => r.status === 'CHANGES_REQUESTED'),
    [items]
  );

  const [queueFilter, setQueueFilter] = useState<'PENDING' | 'CHANGES_REQUESTED'>('PENDING');
  const visibleQueue = queueFilter === 'PENDING' ? pendingQueue : changesRequestedQueue;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [validationNote, setValidationNote] = useState<string | null>(null);
  const [confirmApproveOpen, setConfirmApproveOpen] = useState(false);

  const [history, setHistory] = useState<RegistrationHistoryItem | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (visibleQueue.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !visibleQueue.some((r) => r.id === selectedId)) {
      setSelectedId(visibleQueue[0].id);
    }
  }, [visibleQueue, selectedId]);

  const selectedRecord = useMemo(
    () => visibleQueue.find((r) => r.id === selectedId) ?? null,
    [visibleQueue, selectedId]
  );

  useEffect(() => {
    setValidationNote(null);
    setComment('');
    if (!selectedId) {
      setHistory(null);
      return;
    }
    let cancelled = false;
    async function fetchHistory() {
      setHistoryLoading(true);
      try {
        const res = await fetch(`/api/registrations/${selectedId}/history`, {
          credentials: 'include',
        });
        const json = await res.json().catch(() => null);
        if (!cancelled && res.ok && json?.success) {
          setHistory(json.data as RegistrationHistoryItem);
        }
      } catch {
        // Non-blocking fallback to record.reviewerHistory
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    }
    fetchHistory();
    return () => {
      cancelled = true;
    };
  }, [selectedId, selectedRecord?.updatedAt]);

  const isSelfCreated = selectedRecord ? selectedRecord.createdById === user.id : false;
  const canApproveRecord = Boolean(
    selectedRecord &&
      (selectedRecord.status === 'SUBMITTED' || selectedRecord.status === 'UNDER_REVIEW') &&
      allowedApproveCategories.includes(selectedRecord.category) &&
      !isSelfCreated
  );

  const allDocsVerified = Boolean(
    selectedRecord &&
      selectedRecord.documents.length > 0 &&
      selectedRecord.documents.every((d) => d.verified)
  );

  async function handleRequestChangesClick() {
    if (!selectedRecord) return;
    if (comment.trim().length < 5) {
      setValidationNote(
        'Provide clear correction instructions (at least 5 characters) before requesting changes.'
      );
      return;
    }
    setValidationNote(null);
    await onRequestChanges(selectedRecord.id, comment.trim());
    setComment('');
  }

  async function handleRejectClick() {
    if (!selectedRecord) return;
    if (comment.trim().length < 5) {
      setValidationNote(
        'A documented reason (at least 5 characters) is mandatory when rejecting a registration.'
      );
      return;
    }
    setValidationNote(null);
    await onReject(selectedRecord.id, comment.trim());
    setComment('');
  }

  async function handleConfirmApprove() {
    if (!selectedRecord) return;
    setConfirmApproveOpen(false);
    await onApprove(selectedRecord.id, comment.trim() || undefined);
    setComment('');
  }

  const timelineEvents = history?.reviewerHistory ?? selectedRecord?.reviewerHistory ?? [];

  return (
    <div className="space-y-6">
      {/* Live Approval Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StaffStatCard
          label="Pending Approval"
          value={pendingQueue.length}
          description="Submitted or under active review"
          icon={Clock3}
        />
        <StaffStatCard
          label="Approved Records"
          value={approvedCount}
          description="Number assigned (approved, invited or active)"
          icon={UserCheck}
        />
        <StaffStatCard
          label="Changes Requested"
          value={changesRequestedQueue.length}
          description="Returned to registrar for correction"
          icon={MessageSquareWarning}
        />
      </div>

      {/* Main Split Workspace */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-2xs space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-base font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
              <ClipboardCheck size={18} className="text-[#1769AA]" />
              <span>Registration Review & Approvals Workspace</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Approval authority for {user.role}:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {allowedApproveCategories.length > 0
                  ? allowedApproveCategories.join(', ')
                  : 'View Only (No Approve Authority)'}
              </span>
              . Self-created records cannot be self-approved.
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-1">
            <button
              type="button"
              onClick={() => setQueueFilter('PENDING')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                queueFilter === 'PENDING'
                  ? 'bg-[#102D50] text-white dark:bg-[#1769AA]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Pending Queue ({pendingQueue.length})
            </button>
            <button
              type="button"
              onClick={() => setQueueFilter('CHANGES_REQUESTED')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                queueFilter === 'CHANGES_REQUESTED'
                  ? 'bg-[#102D50] text-white dark:bg-[#1769AA]'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Changes Requested ({changesRequestedQueue.length})
            </button>
          </div>
        </div>

        {visibleQueue.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
            {queueFilter === 'PENDING'
              ? 'No registrations are currently awaiting approval in your authorized scope.'
              : 'No registrations are currently flagged for changes in your authorized scope.'}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
            {/* Left Column: Queue List */}
            <div className="space-y-2.5 max-h-[720px] overflow-y-auto pr-1">
              {visibleQueue.map((r) => {
                const selected = r.id === selectedRecord?.id;
                const badge = STATUS_BADGE_MAP[r.status];
                const selfCreated = r.createdById === user.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left rounded-xl border p-3.5 transition-all ${
                      selected
                        ? 'border-[#1769AA] bg-blue-50/70 dark:bg-blue-950/30 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-sm text-[#102D50] dark:text-white truncate">
                          {r.fullName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {r.email}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-slate-700 dark:text-slate-200">
                        {CATEGORY_META[r.category].shortLabel} · {r.proposedRole}
                      </span>
                      <span className="font-mono text-slate-500 dark:text-slate-400">
                        {r.campusName}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      <span className="font-mono text-slate-400">
                        ID {r.identificationNumberMasked}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {r.duplicateFlag && (
                          <span className="rounded bg-amber-100 dark:bg-amber-950/70 px-1.5 py-0.5 font-bold text-amber-800 dark:text-amber-300">
                            Duplicate Alert
                          </span>
                        )}
                        {selfCreated && (
                          <span className="rounded bg-slate-200 dark:bg-slate-800 px-1.5 py-0.5 font-semibold text-slate-600 dark:text-slate-300">
                            Self-Created
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Column: Detailed Decision View */}
            {selectedRecord && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-5 space-y-5">
                {/* Applicant Header */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-extrabold text-[#102D50] dark:text-white">
                        {selectedRecord.fullName}
                      </h3>
                      <span
                        className={`rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${
                          STATUS_BADGE_MAP[selectedRecord.status].className
                        }`}
                      >
                        {STATUS_BADGE_MAP[selectedRecord.status].label}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      {selectedRecord.category} ({selectedRecord.proposedRole}) ·{' '}
                      {selectedRecord.campusName}
                      {selectedRecord.departmentName ? ` · ${selectedRecord.departmentName}` : ''}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Initiated by{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-200">
                        {selectedRecord.createdByName}
                      </span>{' '}
                      ({selectedRecord.createdByRole}) · Number format:{' '}
                      <span className="font-mono text-[#1769AA] dark:text-blue-300">
                        {CATEGORY_META[selectedRecord.category].numberFormat}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onInspectFullFile(selectedRecord)}
                    className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-[#1769AA] dark:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Open Full File
                  </button>
                </div>

                {/* Duplicate & Governance Alerts */}
                {selectedRecord.duplicateFlag && (
                  <div className="rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 p-3.5 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                    <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <div>
                      <div className="font-bold">Duplicate Identity Warning</div>
                      <p className="mt-0.5">
                        {selectedRecord.duplicateNotes ||
                          'Matching email, phone, or national ID detected against existing records.'}
                      </p>
                    </div>
                  </div>
                )}

                {isSelfCreated && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/80 dark:bg-amber-950/40 p-3.5 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Separation of Duties Enforced</div>
                      <p className="mt-0.5">
                        You created this registration record, so an independent authorized approver
                        must review and approve it.
                      </p>
                    </div>
                  </div>
                )}

                {!allowedApproveCategories.includes(selectedRecord.category) && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3.5 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
                    <ShieldAlert size={16} className="shrink-0 mt-0.5 text-slate-400" />
                    <div>
                      <span className="font-bold">Read-Only Scope:</span> Your role ({user.role})
                      does not hold approval authority for {selectedRecord.category} registrations.
                    </div>
                  </div>
                )}

                {/* Applicant & Category-Specific Details */}
                <div className="grid gap-3 sm:grid-cols-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Personal Contact & DOB</div>
                    <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                      {selectedRecord.email}
                    </div>
                    <div className="text-slate-600 dark:text-slate-300">
                      {selectedRecord.phone} · {selectedRecord.gender} · DOB{' '}
                      {selectedRecord.dateOfBirth}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-400">
                      Masked Identity & ODPC Consent
                    </div>
                    <div className="mt-0.5 font-mono font-semibold text-slate-800 dark:text-slate-100">
                      {selectedRecord.identificationType}: {selectedRecord.identificationNumberMasked}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 mt-0.5">
                      <ShieldCheck size={13} />
                      <span>
                        {selectedRecord.odpcConsentAccepted
                          ? 'ODPC Consent Verified'
                          : 'Consent Pending'}
                      </span>
                    </div>
                  </div>

                  {selectedRecord.studentDetails && (
                    <>
                      <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-400">
                          Academic Programme, Intake & Mode
                        </div>
                        <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                          {selectedRecord.studentDetails.programme} ·{' '}
                          {selectedRecord.studentDetails.intake} (
                          {selectedRecord.studentDetails.studyMode})
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 mt-0.5">
                          Prior: {selectedRecord.studentDetails.previousQualification} (
                          {selectedRecord.studentDetails.previousGrade}) —{' '}
                          {selectedRecord.studentDetails.previousInstitution}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Guardian Contact</div>
                        <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                          {selectedRecord.studentDetails.guardianName} (
                          {selectedRecord.studentDetails.guardianRelationship})
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {selectedRecord.studentDetails.guardianPhone}
                        </div>
                      </div>
                      <div>
                        <div className="text-[11px] text-slate-400">Fee & Sponsorship</div>
                        <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                          {selectedRecord.studentDetails.feeCategory}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          Ref: {selectedRecord.studentDetails.sponsorshipReference}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRecord.staffDetails && (
                    <>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-400">Employment & Role</div>
                        <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                          {selectedRecord.staffDetails.jobTitle} (
                          {selectedRecord.staffDetails.employeeType})
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          {selectedRecord.staffDetails.contractType} · Start{' '}
                          {selectedRecord.staffDetails.startDate}
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="text-[11px] text-slate-400">Qualification & Supervisor</div>
                        <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                          {selectedRecord.staffDetails.highestQualification} —{' '}
                          {selectedRecord.staffDetails.specialization}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          Supervisor: {selectedRecord.staffDetails.supervisorName}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedRecord.otherDetails && (
                    <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="text-[11px] text-slate-400">
                        Relationship / Organization Verification
                      </div>
                      <div className="mt-0.5 font-semibold text-slate-800 dark:text-slate-100">
                        {[
                          selectedRecord.otherDetails.linkedStudentNumber &&
                            `Linked Student: ${selectedRecord.otherDetails.linkedStudentNumber}`,
                          selectedRecord.otherDetails.linkedStudentName &&
                            `(${selectedRecord.otherDetails.linkedStudentName})`,
                          selectedRecord.otherDetails.relationshipToStudent &&
                            `Relationship: ${selectedRecord.otherDetails.relationshipToStudent}`,
                          selectedRecord.otherDetails.organizationName &&
                            `Organization: ${selectedRecord.otherDetails.organizationName}`,
                          selectedRecord.otherDetails.contractOrMouRef &&
                            `MOU/Contract: ${selectedRecord.otherDetails.contractOrMouRef}`,
                          selectedRecord.otherDetails.hostStaffName &&
                            `Host: ${selectedRecord.otherDetails.hostStaffName}`,
                          selectedRecord.otherDetails.accessExpiryDate &&
                            `Access Expiry: ${selectedRecord.otherDetails.accessExpiryDate}`,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'Standard stakeholder record'}
                      </div>
                    </div>
                  )}
                </div>

                {/* Supporting Documents Verification Checklist */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                      <FileCheck2 size={15} className="text-[#1769AA]" />
                      <span>Supporting Documents Verification Checklist</span>
                    </div>
                    <span
                      className={`text-[11px] font-semibold ${
                        allDocsVerified
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      {selectedRecord.documents.filter((d) => d.verified).length}/
                      {selectedRecord.documents.length} Verified
                    </span>
                  </div>

                  {selectedRecord.documents.length === 0 ? (
                    <div className="text-xs text-slate-400">
                      No supporting documents attached yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {selectedRecord.documents.map((doc, idx) => (
                        <div
                          key={`${doc.docType}-${idx}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <FileText size={14} className="text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                                {doc.docType}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate">
                                {doc.fileName} · {Math.max(1, Math.round(doc.sizeBytes / 1024))} KB
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() =>
                              onVerifyDocument(selectedRecord.id, idx, !doc.verified)
                            }
                            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                              doc.verified
                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                            }`}
                          >
                            <CheckCircle2 size={13} />
                            <span>{doc.verified ? 'Verified (Click to Undo)' : 'Mark Verified'}</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Previous Reviewer & Correction History */}
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-[#102D50] dark:text-white flex items-center gap-2">
                      <History size={15} className="text-[#1769AA]" />
                      <span>Reviewer & Correction Timeline</span>
                    </div>
                    {historyLoading && (
                      <span className="text-[11px] text-slate-400">Syncing history...</span>
                    )}
                  </div>

                  {selectedRecord.reviewerComment && (
                    <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-900 dark:text-blue-200">
                      <span className="font-bold">Latest Reviewer Note:</span>{' '}
                      {selectedRecord.reviewerComment}
                    </div>
                  )}

                  {timelineEvents.length === 0 ? (
                    <div className="text-xs text-slate-400">
                      No review decisions recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                      {timelineEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="flex flex-wrap items-start justify-between gap-2 border-l-2 border-[#1769AA] pl-3 py-1 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-[#102D50] dark:text-blue-300">
                              {ev.decision}
                            </span>
                            <span className="mx-1.5 text-slate-300">·</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-100">
                              {ev.actorName} ({ev.actorRole})
                            </span>
                            {ev.comment && (
                              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                                {ev.comment}
                              </p>
                            )}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 whitespace-nowrap">
                            {ev.createdAt.slice(0, 16).replace('T', ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Decision Form (Only for Pending Queue Items) */}
                {(selectedRecord.status === 'SUBMITTED' ||
                  selectedRecord.status === 'UNDER_REVIEW') && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3">
                    <label
                      htmlFor="approval-decision-comment"
                      className="block text-xs font-bold text-slate-700 dark:text-slate-200"
                    >
                      Reviewer Decision Comments{' '}
                      <span className="font-normal text-slate-400">
                        (Required when requesting changes or rejecting)
                      </span>
                    </label>
                    <textarea
                      id="approval-decision-comment"
                      rows={3}
                      value={comment}
                      onChange={(e) => {
                        setComment(e.target.value);
                        if (validationNote) setValidationNote(null);
                      }}
                      placeholder="Enter verification notes, missing document instructions, or rejection reasons..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-[#1769AA]"
                    />
                    {validationNote && (
                      <div className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300">
                        {validationNote}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <StaffButton
                        variant="success"
                        disabled={!canApproveRecord || actionLoading}
                        onClick={() => setConfirmApproveOpen(true)}
                      >
                        <CheckCircle2 size={14} />
                        <span>Approve & Assign Number</span>
                      </StaffButton>
                      <StaffButton
                        variant="secondary"
                        disabled={!canApproveRecord || actionLoading}
                        onClick={handleRequestChangesClick}
                      >
                        <MessageSquareWarning size={14} />
                        <span>Request Changes</span>
                      </StaffButton>
                      <StaffButton
                        variant="danger"
                        disabled={!canApproveRecord || !canReject || actionLoading}
                        onClick={handleRejectClick}
                      >
                        <XCircle size={14} />
                        <span>Reject</span>
                      </StaffButton>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explicit Final Approval Confirmation Dialog */}
      <PortalConfirmDialog
        isOpen={confirmApproveOpen && Boolean(selectedRecord)}
        tone="primary"
        title="Confirm Registration Approval & Number Assignment"
        message={
          selectedRecord
            ? `Approve ${selectedRecord.fullName} (${selectedRecord.category}) and generate an official institutional number (${CATEGORY_META[selectedRecord.category].numberFormat})? Portal access will remain INACTIVE until an activation invitation is dispatched and completed by the user.`
            : ''
        }
        confirmLabel="Approve & Assign Number"
        cancelLabel="Review Again"
        onConfirm={handleConfirmApprove}
        onCancel={() => setConfirmApproveOpen(false)}
      />
    </div>
  );
}

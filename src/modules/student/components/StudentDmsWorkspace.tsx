import React, { useCallback, useEffect, useState } from 'react';
import { ClipboardList, FileUp, ShieldCheck } from 'lucide-react';
import ModuleDocumentRepository from '../../documents/ModuleDocumentRepository';
import UniversalDocumentUploader from '../../documents/UniversalDocumentUploader';
import type { DocumentCategory } from '../../documents/dmsCatalog';

interface StudentDocumentRequestItem {
  id: string;
  requestNumber?: string;
  title: string;
  categoryCode: DocumentCategory;
  targetUserName: string;
  requestedByName: string;
  dueDate: string | null;
  instructions: string;
  status: 'OPEN' | 'SUBMITTED' | 'FULFILLED' | 'CANCELLED' | 'EXPIRED';
}

export const STUDENT_ALLOWED_DMS_CATEGORIES: DocumentCategory[] = [
  'ADMISSION_LETTER',
  'STUDENT_REGISTRATION_RECORD',
  'TRANSCRIPT_CERTIFICATE',
  'FEE_STATEMENT',
  'SCHOLARSHIP_BURSARY_DOC',
  'ABSENCE_EXPLANATION',
  'ASSIGNMENT_SUBMISSION',
  'PRACTICAL_PROJECT_FILE',
  'INDUSTRIAL_ATTACHMENT_DOC',
  'STUDENT_WELFARE_CONFIDENTIAL',
];

export default function StudentDmsWorkspace({
  onNotify,
}: {
  onNotify: (type: 'ok' | 'err', message: string) => void;
}) {
  const [requests, setRequests] = useState<StudentDocumentRequestItem[]>([]);
  const [activeRequestId, setActiveRequestId] = useState<string | null>(null);
  const [repoRefreshTick, setRepoRefreshTick] = useState(0);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/documents/requests', { credentials: 'include' });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && Array.isArray(json.data)) {
        setRequests(json.data);
      }
    } catch {
      // Unauthenticated preview mode ignores silent request sync
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const openRequests = requests.filter((r) => r.status === 'OPEN');

  return (
    <div className="space-y-5">
      {openRequests.length > 0 && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-5 space-y-3 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#102D50] dark:text-amber-200 flex items-center gap-2">
              <ClipboardList size={16} className="text-amber-700 dark:text-amber-300" />
              Open Institutional Document Requests ({openRequests.length})
            </h3>
            <span className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">
              Upload requested files directly to fulfill registry checks
            </span>
          </div>

          <div className="space-y-3">
            {openRequests.map((req) => {
              const isOpen = activeRequestId === req.id;
              return (
                <div
                  key={req.id}
                  className="rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 p-4 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <strong className="text-sm text-[#102D50] dark:text-white block">
                        {req.title}
                      </strong>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                        Requested by {req.requestedByName}
                        {req.dueDate ? ` · Due ${req.dueDate}` : ''}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 mt-1">{req.instructions}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveRequestId(isOpen ? null : req.id)}
                      className="px-3.5 py-2 rounded-lg bg-[#102D50] hover:bg-[#173d6b] text-white font-semibold inline-flex items-center gap-1.5 shrink-0"
                    >
                      <FileUp size={14} /> {isOpen ? 'Close Uploader' : 'Upload Requested File'}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-800">
                      <UniversalDocumentUploader
                        moduleKey="STUDENT"
                        fixedCategory={req.categoryCode}
                        isStudent={true}
                        requestId={req.id}
                        defaultTitle={req.title}
                        defaultRecipient={req.requestedByName}
                        compact={true}
                        onUploaded={async (res) => {
                          onNotify(
                            'ok',
                            `Fulfilled "${req.title}" with "${res.document.title}".`
                          );
                          setActiveRequestId(null);
                          setRepoRefreshTick((n) => n + 1);
                          await loadRequests();
                        }}
                        onCancel={() => setActiveRequestId(null)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ModuleDocumentRepository
        key={repoRefreshTick}
        moduleKey="ALL"
        allowedCategories={STUDENT_ALLOWED_DMS_CATEGORIES}
        isStudentView={true}
        title="My Central Document Vault & Submissions"
        description="Unified verified repository for admission records, fee evidence, assignments, practicals, attachment logs, and confidential welfare/medical filings."
        securityBanner="Privacy & Exam Integrity Guard: Uploads are scanned with magic-byte verification, stored in private non-public storage, and never expose unpublished exam papers or other students' confidential records."
        onDocumentChanged={() => void loadRequests()}
      />

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 px-4 py-3 text-[11px] text-slate-600 dark:text-slate-300 flex items-center gap-2">
        <ShieldCheck size={14} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
        <span>
          All official downloads use time-limited HMAC-signed URLs and SHA-256 verification digests logged in the immutable institutional audit trail.
        </span>
      </div>
    </div>
  );
}

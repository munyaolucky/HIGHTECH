import React, { useState } from 'react';
import {
  FileArchive,
  ShieldCheck,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  Lock,
  ClipboardCheck,
} from 'lucide-react';
import {
  buildSafeCsv,
  qualityDocsReportsService,
} from '../../services/qualityDocsReportsService';
import { hostelsService, getNairobiTodayDate } from '../../services/hostelsService';
import { hrService } from '../../services/hrService';
import { communityService } from '../../services/communityService';
import {
  DocumentAccessPolicy,
  DocumentCategory,
  QualityOperatorRole,
} from '../../types/campusOps';
import { COLLEGE_INFO } from '../../data/college';
import { useSyncedPortalTab } from '../../context/PortalShellContext';

type TabId = 'documents' | 'quality' | 'reports';

const ACTORS: Record<QualityOperatorRole, { userId: string; name: string; label: string }> = {
  QA_CREATOR: {
    userId: 'usr-qa-officer',
    name: 'C. Mwenda (QA Officer)',
    label: 'QA Officer (Creator)',
  },
  QUALITY_REVIEWER_PRINCIPAL: {
    userId: 'usr-principal',
    name: 'Dr. Samuel Karanja (Principal)',
    label: 'Principal / Independent Reviewer',
  },
  DOCUMENTS_MANAGER: {
    userId: 'usr-registrar',
    name: 'H. Oduor (Registrar / Docs)',
    label: 'Registrar / Docs Reviewer',
  },
};

export default function QualityReportsPortal() {
  const [role, setRole] = useState<QualityOperatorRole>('QA_CREATOR');
  const [activeTab, setActiveTab] = useSyncedPortalTab<TabId>('quality-reports', 'documents');
  const [tick, setTick] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const actor = ACTORS[role];
  const state = qualityDocsReportsService.getState();
  const hostelsState = hostelsService.getState();
  const hrState = hrService.getState();
  const communityState = communityService.getState();
  void tick;

  // Document form state
  const [docTitle, setDocTitle] = useState('');
  const [docCat, setDocCat] = useState<DocumentCategory>('academics');
  const [docPolicy, setDocPolicy] = useState<DocumentAccessPolicy>('OWNER_ONLY');
  const [docFileName, setDocFileName] = useState('accreditation-audit-pack.pdf');
  const [grantEmail, setGrantEmail] = useState<Record<string, string>>({});

  // Quality evidence form
  const [evReviewId, setEvReviewId] = useState(state.reviews[0]?.id ?? '');
  const [evStdCode, setEvStdCode] = useState('TVETA-S1');
  const [evDocId, setEvDocId] = useState(state.documents[0]?.id ?? '');
  const [evSummary, setEvSummary] = useState('');
  const [closureNote, setClosureNote] = useState('');

  // Reports filters
  const nairobiToday = getNairobiTodayDate();
  const [fromDate, setFromDate] = useState('2026-01-01');
  const [toDate, setToDate] = useState(nairobiToday);
  const [branchFilter, setBranchFilter] = useState('ALL');

  const run = (res: { ok: boolean; error?: string }, okMsg: string) => {
    if (res.ok) {
      setFeedback({ type: 'ok', text: okMsg });
      setTick((t) => t + 1);
    } else {
      setFeedback({ type: 'err', text: res.error || 'Rejected by policy guardrail.' });
    }
  };

  const handleDownloadCsv = (type: string) => {
    const check = qualityDocsReportsService.validateDateWindow(fromDate, toDate);
    if (!check.ok) {
      setFeedback({ type: 'err', text: check.error! });
      return;
    }

    let csv = '';
    if (type === 'finance') {
      // Strictly grouped by currency without mixing totals (per REPORTS-ANALYTICS.md)
      csv = buildSafeCsv(
        ['Currency', 'Invoice Count', 'Invoiced Total', 'Collected Total', 'Campus Scope'],
        [
          ['KES', 412, 18450000, 16120000, branchFilter],
          ['USD', 18, 24600, 21400, branchFilter],
        ]
      );
    } else if (type === 'hostels') {
      csv = buildSafeCsv(
        ['Metric', 'Count', 'Campus Scope'],
        [
          ['Total Registered Beds', hostelsState.beds.length, branchFilter],
          ['Occupied Beds', hostelsState.beds.filter((b) => b.status === 'OCCUPIED').length, branchFilter],
          ['Hostel Applications', hostelsState.applications.length, branchFilter],
        ]
      );
    } else if (type === 'staff') {
      csv = buildSafeCsv(
        ['Branch', 'Active Staff Count', 'Active Contracts'],
        [
          ['All Selected', hrState.staff.filter((s) => s.status !== 'TERMINATED').length, hrState.contracts.filter((c) => c.status === 'ACTIVE').length],
        ]
      );
    } else {
      csv = buildSafeCsv(
        ['Domain', 'Summary Metric', 'Value'],
        [
          ['Documents', 'Approved Institutional Docs', state.documents.filter((d) => d.status === 'APPROVED').length],
          ['Quality Assurance', 'Open / In-Remediation Findings', state.findings.filter((f) => f.status !== 'CLOSED').length],
          ['Community', 'Active Clubs', communityState.clubs.filter((c) => c.active).length],
        ]
      );
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hitech-report-${type}-${fromDate}-to-${toDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setFeedback({
      type: 'ok',
      text: `Exported UTF-8 BOM & formula-safe CSV (${type}) for ${fromDate} to ${toDate}.`,
    });
  };

  // Attendance calculation: (PRESENT + LATE) / (all - EXCUSED)
  const presentOrLate = hrState.attendance.filter(
    (a) => a.status === 'PRESENT' || a.status === 'LATE'
  ).length;
  const attendancePct =
    hrState.attendance.length > 0
      ? ((presentOrLate / hrState.attendance.length) * 100).toFixed(1)
      : '100.0';
  const occupiedBeds = hostelsState.beds.filter((b) => b.status === 'OCCUPIED').length;
  const occupancyPct =
    hostelsState.beds.length > 0
      ? ((occupiedBeds / hostelsState.beds.length) * 100).toFixed(1)
      : '0.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#092c60] via-[#153b70] to-[#0a1e40] rounded-2xl p-6 text-white shadow-lg border border-blue-800/50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-300 text-xs font-extrabold uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>TVETA Quality Compliance, Document Vault &amp; Analytics</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              Document Centre, Quality Accreditation &amp; Executive Reports
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-2xl">
              Category-gated documents with independent review, TVETA accreditation frameworks and
              evidence verification, and bounded multi-currency CSV executive exports.
            </p>
          </div>

          <div className="bg-black/25 border border-white/15 rounded-xl p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200 mb-1.5">
              Reviewer Perspective (Creator ≠ Reviewer)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(ACTORS) as QualityOperatorRole[]).map((r) => (
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
          { id: 'documents', label: 'Document Centre', icon: FileArchive },
          { id: 'quality', label: 'Quality & TVETA Accreditation', icon: ClipboardCheck },
          { id: 'reports', label: 'Executive Reports & CSV Export', icon: BarChart3 },
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

      {/* TAB 1: DOCUMENT CENTRE */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-[#153b70]">
                Institutional Document Repository
              </h2>
              <span className="text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-900 px-2.5 py-1 rounded-lg">
                Owner/Uploader ≠ Reviewer
              </span>
            </div>

            {state.documents.map((doc) => (
              <div key={doc.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono font-bold text-[#153b70] mr-2">{doc.reference}</span>
                    <span className="font-extrabold text-sm text-slate-900">{doc.title}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-mono text-[10px] font-bold">
                      {doc.accessPolicy}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                        doc.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : doc.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                </div>
                <div className="text-slate-600">
                  Category: <strong>{doc.category}</strong> • File: {doc.fileName} (v{doc.version},{' '}
                  {doc.fileSizeKb} KB) • Owner: <strong>{doc.ownerName}</strong>
                </div>

                {doc.grants.length > 0 && (
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    Named Grants: {doc.grants.map((g) => `${g.granteeEmail} (exp ${g.expiresAt})`).join('; ')}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {doc.status === 'PENDING_REVIEW' && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            qualityDocsReportsService.reviewDocument({
                              docId: doc.id,
                              decision: 'APPROVED',
                              reviewerUserId: actor.userId,
                              reviewerName: actor.name,
                              note: 'Verified against institutional repository standards',
                            }),
                            `Approved document ${doc.reference}.`
                          )
                        }
                        className="px-3 py-1 rounded bg-emerald-700 text-white font-bold"
                      >
                        Approve Document
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          run(
                            qualityDocsReportsService.reviewDocument({
                              docId: doc.id,
                              decision: 'CHANGES_REQUESTED',
                              reviewerUserId: actor.userId,
                              reviewerName: actor.name,
                              note: 'Upload signed cover sheet',
                            }),
                            `Requested changes on ${doc.reference}.`
                          )
                        }
                        className="px-3 py-1 rounded bg-amber-600 text-white font-bold"
                      >
                        Request Changes
                      </button>
                    </>
                  )}
                  <input
                    type="email"
                    placeholder="Grant user email..."
                    value={grantEmail[doc.id] || ''}
                    onChange={(e) =>
                      setGrantEmail((prev) => ({ ...prev, [doc.id]: e.target.value }))
                    }
                    className="border border-slate-300 rounded px-2 py-1 text-xs bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!grantEmail[doc.id]) return;
                      run(
                        qualityDocsReportsService.grantDocumentAccess(
                          doc.id,
                          grantEmail[doc.id],
                          '2026-12-31',
                          false
                        ),
                        `Granted preview-only expiring access to ${grantEmail[doc.id]}.`
                      );
                    }}
                    className="px-2.5 py-1 rounded border border-slate-300 bg-white font-bold text-[#153b70]"
                  >
                    Grant Expiring Access
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
              <Upload className="w-4 h-4" />
              <span>Upload Controlled Document</span>
            </h3>
            <input
              type="text"
              placeholder="Document title"
              value={docTitle}
              onChange={(e) => setDocTitle(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <select
              value={docCat}
              onChange={(e) => setDocCat(e.target.value as DocumentCategory)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="academics">academics</option>
              <option value="policies-forms">policies-forms</option>
              <option value="library">library</option>
              <option value="hr">hr (Confidential)</option>
              <option value="finance">finance (Confidential)</option>
              <option value="hostel-welfare">hostel-welfare (Confidential)</option>
              <option value="certificates">certificates (Confidential)</option>
            </select>
            <select
              value={docPolicy}
              onChange={(e) => setDocPolicy(e.target.value as DocumentAccessPolicy)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="OWNER_ONLY">OWNER_ONLY (Default)</option>
              <option value="AUTHENTICATED">AUTHENTICATED (Safe allowlist)</option>
              <option value="STAFF_ONLY">STAFF_ONLY (Safe allowlist)</option>
              <option value="PUBLIC">PUBLIC (library/media/policies only)</option>
            </select>
            <input
              type="text"
              placeholder="Sanitized filename (.pdf)"
              value={docFileName}
              onChange={(e) => setDocFileName(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono"
            />
            <button
              type="button"
              onClick={() => {
                if (!docTitle) return;
                run(
                  qualityDocsReportsService.uploadDocument({
                    title: docTitle,
                    category: docCat,
                    branch: 'Nairobi Main Campus',
                    fileName: docFileName,
                    accessPolicy: docPolicy,
                    ownerUserId: actor.userId,
                    ownerName: actor.name,
                  }),
                  'Uploaded document to private repository (status: PENDING_REVIEW).'
                );
                setDocTitle('');
              }}
              className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
            >
              Upload Version 1
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: QUALITY & TVETA ACCREDITATION */}
      {activeTab === 'quality' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            {/* Frameworks & Review Cycles */}
            {state.reviews.map((rev) => {
              const fw = state.frameworks.find((f) => f.id === rev.frameworkId);
              const revEvidence = state.evidence.filter((e) => e.reviewId === rev.id);
              const revFindings = state.findings.filter((f) => f.reviewId === rev.id);

              return (
                <div key={rev.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-black text-[#153b70] bg-blue-100 px-2 py-0.5 rounded">
                        {rev.code}
                      </span>
                      <h2 className="text-base font-extrabold text-[#153b70] mt-1">{rev.title}</h2>
                      <div className="text-xs text-slate-600 mt-0.5">
                        Framework: <strong>{fw?.code}</strong> ({fw?.authority}) • Lead:{' '}
                        <strong>{rev.leadName}</strong> • Due: {rev.dueDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded bg-amber-100 text-amber-800 text-[10px] font-extrabold">
                        {rev.status}
                      </span>
                      {rev.status !== 'APPROVED_CLOSED' && (
                        <button
                          type="button"
                          onClick={() =>
                            run(
                              qualityDocsReportsService.closeReviewCycle(
                                rev.id,
                                actor.userId,
                                actor.name
                              ),
                              `Approved & closed accreditation review cycle ${rev.code}.`
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold"
                        >
                          Independent Close Review
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Evidence */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <h3 className="text-xs font-extrabold uppercase text-slate-500">
                      Attached Accreditation Evidence ({revEvidence.length})
                    </h3>
                    {revEvidence.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2"
                      >
                        <div>
                          <span className="font-mono font-bold text-[#153b70] mr-2">
                            {ev.standardCode}
                          </span>
                          <span className="font-bold text-slate-900">{ev.documentTitle}</span>
                          <div className="text-slate-600 mt-0.5">{ev.summary}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-900 text-[10px] font-bold">
                            {ev.status}
                          </span>
                          {ev.status === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() =>
                                run(
                                  qualityDocsReportsService.verifyEvidence(
                                    ev.id,
                                    actor.userId,
                                    actor.name
                                  ),
                                  'Verified quality evidence independently.'
                                )
                              }
                              className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold"
                            >
                              Verify Evidence
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Findings & Corrective Actions */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <h3 className="text-xs font-extrabold uppercase text-slate-500">
                      Audit Findings &amp; Corrective Actions ({revFindings.length})
                    </h3>
                    {revFindings.map((fnd) => (
                      <div key={fnd.id} className="p-3.5 rounded-xl bg-red-50/40 border border-red-200 text-xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-red-900">
                            [{fnd.severity}] {fnd.standardCode}: {fnd.description}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                            {fnd.status}
                          </span>
                        </div>
                        <div className="text-slate-600">Root Cause: {fnd.rootCause}</div>
                        {fnd.actions.map((act) => (
                          <div
                            key={act.id}
                            className="p-2.5 rounded-lg bg-white border border-slate-200 flex flex-wrap items-center justify-between gap-2"
                          >
                            <div>
                              <div className="font-bold text-slate-800">{act.title}</div>
                              <div className="text-[11px] text-slate-500">
                                Owner: {act.ownerName} • Due: {act.dueDate}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                                {act.status}
                              </span>
                              {act.status === 'SUBMITTED_FOR_VERIFICATION' && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    run(
                                      qualityDocsReportsService.verifyFindingAction(
                                        fnd.id,
                                        act.id,
                                        actor.userId
                                      ),
                                      'Corrective action independently verified.'
                                    )
                                  }
                                  className="px-2.5 py-1 rounded bg-emerald-700 text-white font-bold"
                                >
                                  Verify Action
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                        {fnd.status !== 'CLOSED' && (
                          <div className="flex gap-2 pt-1">
                            <input
                              type="text"
                              placeholder="Closure note..."
                              value={closureNote}
                              onChange={(e) => setClosureNote(e.target.value)}
                              className="flex-1 border border-slate-300 rounded px-2.5 py-1 bg-white text-xs"
                            />
                            <button
                              type="button"
                              onClick={() =>
                                run(
                                  qualityDocsReportsService.closeFinding(
                                    fnd.id,
                                    closureNote || 'All corrective actions independently verified.'
                                  ),
                                  'Closed finding cleanly.'
                                )
                              }
                              className="px-3 py-1 rounded bg-[#153b70] text-white font-bold"
                            >
                              Close Finding
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 h-fit">
            <h3 className="text-sm font-extrabold text-[#153b70] flex items-center gap-1.5">
              <Lock className="w-4 h-4" />
              <span>Attach Document as Evidence</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Guardrail: Only APPROVED non-confidential documents can be linked; OWNER_ONLY files
              are blocked to prevent accidental disclosure.
            </p>
            <select
              value={evReviewId}
              onChange={(e) => setEvReviewId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              {state.reviews.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.code}
                </option>
              ))}
            </select>
            <select
              value={evStdCode}
              onChange={(e) => setEvStdCode(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              <option value="TVETA-S1">TVETA-S1 (Lab &amp; Safety Ratios)</option>
              <option value="TVETA-S2">TVETA-S2 (CBT Moderation)</option>
            </select>
            <select
              value={evDocId}
              onChange={(e) => setEvDocId(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs bg-white"
            >
              {state.documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.reference} — {d.title} ({d.accessPolicy}, {d.status})
                </option>
              ))}
            </select>
            <textarea
              placeholder="Evidence justification summary..."
              value={evSummary}
              onChange={(e) => setEvSummary(e.target.value)}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs"
            />
            <button
              type="button"
              onClick={() =>
                run(
                  qualityDocsReportsService.linkQualityEvidence({
                    reviewId: evReviewId,
                    standardCode: evStdCode,
                    documentId: evDocId,
                    summary: evSummary || 'Accreditation compliance evidence mapping',
                    submitterUserId: actor.userId,
                    submitterName: actor.name,
                  }),
                  'Linked document as quality evidence (pending independent verification).'
                )
              }
              className="w-full bg-[#153b70] text-white py-2 rounded-lg text-xs font-extrabold"
            >
              Link Evidence
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: EXECUTIVE REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-wrap items-end justify-between gap-4">
            <div className="flex flex-wrap items-end gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">From Date (Inclusive)</label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">To Date (Max 731 days)</label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Campus Filter</label>
                <select
                  value={branchFilter}
                  onChange={(e) => setBranchFilter(e.target.value)}
                  className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white"
                >
                  <option value="ALL">All HI-TECH Campuses</option>
                  {COLLEGE_INFO.campuses.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'finance', label: 'Export Finance (By Currency)' },
                { id: 'hostels', label: 'Export Hostels CSV' },
                { id: 'staff', label: 'Export Staff Aggregates' },
                { id: 'quality', label: 'Export Quality & Docs' },
              ].map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => handleDownloadCsv(btn.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#153b70] hover:bg-[#0f274a] text-white text-xs font-extrabold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">Finance (KES Group)</div>
              <div className="text-xl font-black text-[#153b70] mt-1">KES 16,120,000</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Collected against KES 18,450,000 invoiced (never mixed with USD)
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">Finance (USD Group)</div>
              <div className="text-xl font-black text-emerald-700 mt-1">USD 21,400</div>
              <div className="text-[11px] text-slate-500 mt-1">
                International certification receipts against USD 24,600 invoiced
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">HR Attendance Rate</div>
              <div className="text-xl font-black text-[#153b70] mt-1">{attendancePct}%</div>
              <div className="text-[11px] text-slate-500 mt-1">
                Formula: (PRESENT + LATE) / (Total − EXCUSED)
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="text-xs font-bold text-slate-500">Hostel Bed Occupancy</div>
              <div className="text-xl font-black text-[#d92332] mt-1">{occupancyPct}%</div>
              <div className="text-[11px] text-slate-500 mt-1">
                {occupiedBeds} occupied of {hostelsState.beds.length} registered beds
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

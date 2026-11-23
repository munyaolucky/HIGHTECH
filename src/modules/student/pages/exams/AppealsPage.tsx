import React, { useState } from 'react';
import { RefreshCw, Scale, Trash2 } from 'lucide-react';
import {
  PortalButton,
  PortalCard,
  PortalConfirmDialog,
  PortalEmptyState,
  PortalPageHeader,
  PortalStatus,
  PortalToolbar,
} from '../../../../components/ui/PortalUI';
import {
  StudentAppealItem,
  studentPortalService,
} from '../../../../services/studentPortalService';
import { ExamWorkspaceProps } from './examWorkspaceUtils';

export default function AppealsPage({
  onNotify,
  onRefresh,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();

  const [showForm, setShowForm] = useState(false);
  const [appealSearch, setAppealSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'ALL' | StudentAppealItem['category']>('ALL');
  const [withdrawTarget, setWithdrawTarget] = useState<StudentAppealItem | null>(null);
  const [appealForm, setAppealForm] = useState({
    category: 'GRADE_REMARKING' as StudentAppealItem['category'],
    unitCode: state.units[0]?.code ?? 'CSC 301',
    subject: '',
    evidenceRef: '',
    reason: '',
  });

  const filteredAppeals = state.appeals.filter((ap) => {
    const matchesCat = catFilter === 'ALL' || ap.category === catFilter;
    const matchesSearch =
      !appealSearch.trim() ||
      ap.unitCode.toLowerCase().includes(appealSearch.toLowerCase()) ||
      ap.subject.toLowerCase().includes(appealSearch.toLowerCase()) ||
      ap.reason.toLowerCase().includes(appealSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories: { value: 'ALL' | StudentAppealItem['category']; label: string }[] = [
    { value: 'ALL', label: `All (${state.appeals.length})` },
    { value: 'GRADE_REMARKING', label: 'Grade Remarking' },
    { value: 'ATTENDANCE_CORRECTION', label: 'Attendance' },
    { value: 'EXAM_MISSED', label: 'Missed Exam' },
    { value: 'FEE_WAIVER_REVIEW', label: 'Fee Review' },
  ];

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Appeals & Remarking"
        title="Appeals & Remarking"
        description="Submit formal CAT/examination remarking requests, special exam petitions, or attendance corrections to the Registrar."
      >
        <PortalButton
          variant="secondary"
          onClick={() => {
            onRefresh();
            onNotify('ok', 'Academic appeals register synchronized.');
          }}
        >
          <RefreshCw size={14} /> Sync Appeals
        </PortalButton>
        <PortalButton onClick={() => setShowForm((v) => !v)}>
          <Scale size={14} /> {showForm ? 'Close Appeal Form' : 'Submit New Appeal'}
        </PortalButton>
      </PortalPageHeader>

      {showForm && (
        <PortalCard
          title="File Formal Academic Appeal / Remarking Request"
          description="Requests are routed automatically to your Course Lecturer, HOD, and Academic Registrar."
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.submitAppeal(appealForm);
              if (!res.ok) {
                onNotify('err', res.error ?? 'Could not submit appeal');
                return;
              }
              onNotify('ok', `Academic appeal "${appealForm.subject}" filed for Registrar review.`);
              setAppealForm({ ...appealForm, subject: '', evidenceRef: '', reason: '' });
              setShowForm(false);
              onRefresh();
            }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs"
          >
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Appeal Category
              </label>
              <select
                value={appealForm.category}
                onChange={(e) =>
                  setAppealForm({
                    ...appealForm,
                    category: e.target.value as StudentAppealItem['category'],
                  })
                }
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                <option value="GRADE_REMARKING">Examination / CAT Grade Remarking</option>
                <option value="ATTENDANCE_CORRECTION">Class Attendance Roll Correction</option>
                <option value="EXAM_MISSED">Special / Supplementary Exam (Missed)</option>
                <option value="FEE_WAIVER_REVIEW">Late Fee Penalty Waiver Review</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Course Unit / Reference
              </label>
              <select
                value={appealForm.unitCode}
                onChange={(e) => setAppealForm({ ...appealForm, unitCode: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              >
                {state.units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.title}
                  </option>
                ))}
                <option value="GENERAL">General Institutional Matter</option>
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Appeal Subject
              </label>
              <input
                type="text"
                required
                placeholder="Concise summary of the remarking or review request..."
                value={appealForm.subject}
                onChange={(e) => setAppealForm({ ...appealForm, subject: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Supporting Evidence Filename
              </label>
              <input
                type="text"
                placeholder="e.g. Medical_Note_2026.pdf"
                value={appealForm.evidenceRef}
                onChange={(e) => setAppealForm({ ...appealForm, evidenceRef: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                Detailed Justification (Min 10 characters)
              </label>
              <textarea
                rows={3}
                required
                placeholder="Provide assessment reference, script details, or factual evidence..."
                value={appealForm.reason}
                onChange={(e) => setAppealForm({ ...appealForm, reason: e.target.value })}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <PortalButton variant="secondary" onClick={() => setShowForm(false)}>
                Cancel
              </PortalButton>
              <PortalButton type="submit">Submit Appeal to Registrar</PortalButton>
            </div>
          </form>
        </PortalCard>
      )}

      <PortalCard
        title={`My Submitted Appeals (${state.appeals.length})`}
        description="Track review status or withdraw pending appeals before final determination."
      >
        <PortalToolbar
          search={appealSearch}
          onSearch={setAppealSearch}
          placeholder="Search appeals by unit code, title, or detail..."
          onRefresh={() => {
            onRefresh();
            onNotify('ok', 'Appeals register synchronized.');
          }}
          onAdd={() => setShowForm(true)}
          addLabel="New Appeal"
        />

        <div className="inline-flex flex-wrap gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg mb-5">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => setCatFilter(cat.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                catFilter === cat.value
                  ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white font-semibold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {filteredAppeals.length === 0 ? (
          <PortalEmptyState
            title="No appeals match your filters"
            description="You can submit a formal grade remarking, special exam, or attendance correction appeal anytime."
            actionLabel="File an Appeal"
            onAction={() => setShowForm(true)}
          />
        ) : (
          <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
            {filteredAppeals.map((ap) => (
              <div key={ap.id} className="py-4 last:pb-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                      {ap.unitCode} · {ap.category.replace(/_/g, ' ')} ·{' '}
                      {new Date(ap.submittedAt).toLocaleDateString()}
                    </span>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                      {ap.subject}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <PortalStatus status={ap.status} />
                    {ap.status !== 'Approved' && (
                      <button
                        type="button"
                        onClick={() => setWithdrawTarget(ap)}
                        className="px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/70 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-semibold inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                      >
                        <Trash2 size={13} /> Withdraw
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{ap.reason}</p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  <span>Evidence: {ap.evidenceRef || 'None attached'}</span>
                  {ap.reviewerComment && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      Outcome: {ap.reviewerComment}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PortalCard>

      <PortalConfirmDialog
        isOpen={Boolean(withdrawTarget)}
        title="Withdraw Academic Appeal?"
        message={`Are you sure you want to withdraw "${withdrawTarget?.subject}"? This action removes it from the Registrar review queue.`}
        confirmLabel="Yes, Withdraw Appeal"
        cancelLabel="Keep Appeal"
        onConfirm={() => {
          if (withdrawTarget) {
            const res = studentPortalService.cancelAppeal(withdrawTarget.id);
            if (!res.ok) onNotify('err', res.error ?? 'Could not withdraw appeal');
            else onNotify('ok', `Withdrew appeal "${withdrawTarget.subject}".`);
          }
          setWithdrawTarget(null);
          onRefresh();
        }}
        onCancel={() => setWithdrawTarget(null)}
      />
    </div>
  );
}

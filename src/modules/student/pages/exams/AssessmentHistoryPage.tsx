import React, { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { PortalCard, PortalEmptyState, PortalPageHeader } from '../../../../components/ui/PortalUI';
import {
  downloadStudentDocument,
  STUDENT_ASSESSMENT_TYPES,
  studentPortalService,
} from '../../../../services/studentPortalService';
import { ExamWorkspaceProps, getStatusTextClasses } from './examWorkspaceUtils';

export default function AssessmentHistoryPage({
  onNotify,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  const [query, setQuery] = useState('');
  const [termFilter, setTermFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const historicalItems = state.assessments.filter(
    (a) => a.status === 'Marked' || a.status === 'Submitted' || a.termLabel.includes('2025')
  );
  const terms = Array.from(new Set(historicalItems.map((i) => i.termLabel)));

  const filtered = historicalItems.filter((item) => {
    if (termFilter !== 'ALL' && item.termLabel !== termFilter) return false;
    if (typeFilter !== 'ALL' && item.assessmentType !== typeFilter) return false;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.unitCode.toLowerCase().includes(q) ||
        item.unitTitle.toLowerCase().includes(q) ||
        item.lecturerName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Assessment History"
        title="Assessment History"
        description="Complete archive of submitted coursework, graded CATs, practical logs, mock exams, and past term sittings."
      >
        <button
          type="button"
          onClick={() => {
            downloadStudentDocument(
              `Assessment_History_${regNo.replace(/\//g, '_')}.txt`,
              `HI-TECH COLLEGE ASSESSMENT ARCHIVE\nStudent: ${profile.fullName} (${regNo})\n\n` +
                filtered
                  .map(
                    (a) =>
                      `${a.termLabel}\t${a.unitCode}\t${a.assessmentType}\t${a.title}\tStatus: ${a.status}\tScore: ${
                        typeof a.scoreObtained === 'number'
                          ? `${a.scoreObtained}/${a.totalMarks}`
                          : '-'
                      }`
                  )
                  .join('\n')
            );
            onNotify('ok', 'Assessment history archive downloaded.');
          }}
          className="px-3.5 py-2 rounded-lg bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Download size={14} /> Export History
        </button>
      </PortalPageHeader>

      <PortalCard
        title={`Completed & Historical Assessments (${filtered.length})`}
        description="Chronological submission record with score breakdown and lecturer evaluation notes."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pb-5 mb-2 border-b border-slate-200/80 dark:border-slate-800">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search archive by unit or title..."
              aria-label="Search assessment history"
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            aria-label="Filter by academic term"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Academic Terms ({terms.length})</option>
            {terms.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            aria-label="Filter by assessment category"
            className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Assessment Categories</option>
            {STUDENT_ASSESSMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <PortalEmptyState
            title="No matching historical records"
            description="Adjust your academic term or category filter to view completed assessments."
            actionLabel="Reset Filters"
            onAction={() => {
              setQuery('');
              setTermFilter('ALL');
              setTypeFilter('ALL');
            }}
          />
        ) : (
          <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="py-4 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                      {item.unitCode}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">{item.termLabel}</span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className={`font-semibold ${getStatusTextClasses(item.status)}`}>
                      {item.status}
                    </span>
                  </div>
                  <strong className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </strong>
                  <p className="text-slate-600 dark:text-slate-300">
                    {item.assessmentType} · Lecturer: {item.lecturerName} ·{' '}
                    {item.submittedAt
                      ? `Submitted ${new Date(item.submittedAt).toLocaleDateString()}`
                      : `Completed ${item.deadline}`}
                  </p>
                  {item.lecturerFeedback && (
                    <p className="text-slate-500 dark:text-slate-400 italic">
                      Feedback: “{item.lecturerFeedback}”
                    </p>
                  )}
                </div>
                <div className="sm:text-right font-mono tabular-nums shrink-0">
                  <strong className="text-base font-bold text-[#102D50] dark:text-white block">
                    {typeof item.scoreObtained === 'number'
                      ? `${item.scoreObtained} / ${item.totalMarks}`
                      : 'Awaiting Marking'}
                  </strong>
                  {item.gradeLabel && (
                    <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                      {item.gradeLabel}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PortalCard>
    </div>
  );
}

import React, { useState } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  Search,
  UploadCloud,
  X,
} from 'lucide-react';
import { PortalEmptyState, PortalPageHeader } from '../../../../components/ui/PortalUI';
import {
  STUDENT_ASSESSMENT_TYPES,
  StudentAssessmentItem,
  StudentAssessmentStatus,
  studentPortalService,
} from '../../../../services/studentPortalService';
import {
  ExamWorkspaceProps,
  formatCountdownLabel,
  getStatusTextClasses,
} from './examWorkspaceUtils';

const STATUS_FILTERS: ('All assessments' | StudentAssessmentStatus)[] = [
  'All assessments',
  'Pending',
  'In progress',
  'Submitted',
  'Marked',
  'Overdue',
  'Upcoming',
];

export function MyAssessmentsPage({
  onNavigate,
  onNotify,
  onRefresh,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();

  const [statusFilter, setStatusFilter] = useState<'All assessments' | StudentAssessmentStatus>(
    'All assessments'
  );
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [unitFilter, setUnitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeItem, setActiveItem] = useState<StudentAssessmentItem | null>(null);
  const [workNote, setWorkNote] = useState('');
  const [workFile, setWorkFile] = useState<{ fileName: string; fileSize: string } | null>(null);

  const units = Array.from(new Set(state.assessments.map((a) => a.unitCode)));

  const filtered = state.assessments.filter((item) => {
    if (statusFilter !== 'All assessments' && item.status !== statusFilter) return false;
    if (typeFilter !== 'ALL' && item.assessmentType !== typeFilter) return false;
    if (unitFilter !== 'ALL' && item.unitCode !== unitFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.unitCode.toLowerCase().includes(q) ||
        item.unitTitle.toLowerCase().includes(q) ||
        item.assessmentType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAssessment = (item: StudentAssessmentItem) => {
    setActiveItem(item);
    setWorkNote(item.submissionNote ?? '');
    setWorkFile(null);
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · My Assessments"
        title="My Assessments"
        description="Complete catalog of CATs, end-term exams, practicals, assignments, quizzes, projects, and competency evaluations."
      >
        <button
          type="button"
          onClick={() => onNavigate('examinations')}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
        >
          Overview
        </button>
        <button
          type="button"
          onClick={() => onNavigate('exams-online')}
          className="px-3.5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white text-xs font-semibold whitespace-nowrap shrink-0 transition-colors"
        >
          Launch Online Exams
        </button>
      </PortalPageHeader>

      {/* Unified Filter & Assessment Catalog Surface */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-slate-200/80 dark:border-slate-800 space-y-4">
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg">
            {STATUS_FILTERS.map((st) => {
              const count =
                st === 'All assessments'
                  ? state.assessments.length
                  : state.assessments.filter((a) => a.status === st).length;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    statusFilter === st
                      ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {st} <span className="font-mono tabular-nums opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
            <div className="md:col-span-2 flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus-within:border-[#1769AA]">
              <Search size={14} className="text-slate-400 shrink-0" aria-hidden="true" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assessment title, unit code, or type..."
                aria-label="Search assessments"
                className="w-full bg-transparent text-slate-900 dark:text-slate-100 focus:outline-none"
              />
            </div>

            <select
              aria-label="Filter by assessment type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All 14 Assessment Types</option>
              {STUDENT_ASSESSMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by unit code"
              value={unitFilter}
              onChange={(e) => setUnitFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            >
              <option value="ALL">All Enrolled Units</option>
              {units.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Showing <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{filtered.length}</strong> of{' '}
              <strong className="font-mono tabular-nums text-slate-800 dark:text-slate-200">{state.assessments.length}</strong> assessments
            </span>
            {(statusFilter !== 'All assessments' ||
              typeFilter !== 'ALL' ||
              unitFilter !== 'ALL' ||
              searchQuery.trim() !== '') && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter('All assessments');
                  setTypeFilter('ALL');
                  setUnitFilter('ALL');
                  setSearchQuery('');
                }}
                className="font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-6">
            <PortalEmptyState
              title="No assessments match these filters"
              description="Reset your status, type, or search filter to view all term assessments."
              actionLabel="Reset Filters"
              onAction={() => {
                setStatusFilter('All assessments');
                setTypeFilter('ALL');
                setUnitFilter('ALL');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          <>
            {/* Mobile Stacked Assessment Rows */}
            <div className="md:hidden divide-y divide-slate-200/75 dark:divide-slate-800 px-5 text-xs">
              {filtered.map((item) => (
                <div key={item.id} className="py-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-[#102D50] dark:text-blue-400 block">
                        {item.unitCode} · {item.assessmentType}
                      </span>
                      <strong className="font-semibold text-slate-900 dark:text-slate-100 block">
                        {item.title}
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                        {item.unitTitle} · {item.lecturerName}
                      </span>
                    </div>
                    <span className={`font-semibold shrink-0 ${getStatusTextClasses(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
                    <div className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-300 space-y-0.5">
                      <div>
                        Total Marks:{' '}
                        <strong className="text-slate-900 dark:text-slate-100">
                          {item.status === 'Marked' && typeof item.scoreObtained === 'number'
                            ? `${item.scoreObtained} / ${item.totalMarks}`
                            : item.totalMarks}
                        </strong>{' '}
                        ({item.weightPercent}%)
                      </div>
                      <div>
                        Deadline: <strong className="text-slate-900 dark:text-slate-100">{item.deadline}</strong> ·{' '}
                        {formatCountdownLabel(item.deadlineIso)}
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 shrink-0">
                      {item.cbtAssessmentId && item.status !== 'Marked' && (
                        <button
                          type="button"
                          onClick={() => onNavigate('exams-online')}
                          aria-label={`Launch online exam for ${item.title}`}
                          className="px-2.5 py-1.5 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                        >
                          <span>Start</span>
                          <ExternalLink size={12} aria-hidden="true" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleOpenAssessment(item)}
                        aria-label={`Open ${item.title}`}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#1769AA] hover:text-[#1769AA] dark:hover:text-blue-400 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap shrink-0 transition-colors"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Filterable Assessment Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3 px-4 font-medium">Assessment Name</th>
                    <th className="py-3 px-4 font-medium">Unit</th>
                    <th className="py-3 px-4 font-medium">Type</th>
                    <th className="py-3 px-4 font-medium text-right">Total Marks</th>
                    <th className="py-3 px-4 font-medium text-right">Weight</th>
                    <th className="py-3 px-4 font-medium">Start Date</th>
                    <th className="py-3 px-4 font-medium">Deadline</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4 min-w-[220px]">
                        <strong className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {item.title}
                        </strong>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.lecturerName}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-semibold text-[#102D50] dark:text-blue-400 block">
                          {item.unitCode}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.unitTitle}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-200">
                        {item.assessmentType}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.status === 'Marked' && typeof item.scoreObtained === 'number'
                          ? `${item.scoreObtained} / ${item.totalMarks}`
                          : item.totalMarks}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {item.weightPercent}%
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {item.startDate}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums whitespace-nowrap">
                        <span className="text-slate-900 dark:text-slate-100 font-medium block">
                          {item.deadline}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatCountdownLabel(item.deadlineIso)}
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`font-semibold ${getStatusTextClasses(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {item.cbtAssessmentId && item.status !== 'Marked' && (
                            <button
                              type="button"
                              onClick={() => onNavigate('exams-online')}
                              aria-label={`Launch online exam for ${item.title}`}
                              className="px-2.5 py-1.5 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                            >
                              <span>Start</span>
                              <ExternalLink size={12} aria-hidden="true" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenAssessment(item)}
                            aria-label={`Open ${item.title}`}
                            className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#1769AA] hover:text-[#1769AA] dark:hover:text-blue-400 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap shrink-0 transition-colors"
                          >
                            Open
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Assessment Detail & Submission Modal */}
      {activeItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="assessment-detail-title"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono font-semibold text-[#1769AA] dark:text-blue-400">
                  {activeItem.unitCode} · {activeItem.assessmentType} ·{' '}
                  {activeItem.examBody || 'HI-TECH INTERNAL'}
                </span>
                <h3
                  id="assessment-detail-title"
                  className="text-lg font-bold text-[#102D50] dark:text-white mt-0.5"
                >
                  {activeItem.title}
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close assessment details"
                onClick={() => setActiveItem(null)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 border-y border-slate-200/80 dark:border-slate-800 font-mono tabular-nums">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Status</span>
                <strong className={`font-semibold ${getStatusTextClasses(activeItem.status)}`}>
                  {activeItem.status}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Total Marks</span>
                <strong className="text-slate-900 dark:text-white">{activeItem.totalMarks}</strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Grade Weight</span>
                <strong className="text-slate-900 dark:text-white">
                  {activeItem.weightPercent}%
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Deadline</span>
                <strong className="text-slate-900 dark:text-white">{activeItem.deadline}</strong>
              </div>
            </div>

            {(activeItem.venue || activeItem.durationMinutes || activeItem.attachmentName) && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
                {activeItem.venue && (
                  <span>
                    Venue: <strong className="text-slate-900 dark:text-white">{activeItem.venue}</strong>
                  </span>
                )}
                {activeItem.durationMinutes && (
                  <span>
                    Duration:{' '}
                    <strong className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {activeItem.durationMinutes} min
                    </strong>
                  </span>
                )}
                {activeItem.attachmentName && (
                  <span>
                    Submitted file:{' '}
                    <strong className="font-mono text-emerald-700 dark:text-emerald-400">
                      {activeItem.attachmentName}
                      {activeItem.attachmentSize ? ` (${activeItem.attachmentSize})` : ''}
                    </strong>
                  </span>
                )}
              </div>
            )}

            {activeItem.instructions && (
              <div className="space-y-1">
                <strong className="text-slate-900 dark:text-white font-semibold block">
                  Assessment Instructions
                </strong>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activeItem.instructions}
                </p>
              </div>
            )}

            {activeItem.status === 'Marked' && (
              <div className="py-3 border-t border-slate-200/80 dark:border-slate-800 space-y-1">
                <strong className="text-emerald-700 dark:text-emerald-400 text-sm block font-mono tabular-nums">
                  Score: {activeItem.scoreObtained} / {activeItem.totalMarks} ·{' '}
                  {activeItem.gradeLabel}
                </strong>
                {activeItem.lecturerFeedback && (
                  <p className="text-slate-600 dark:text-slate-300">
                    Feedback: {activeItem.lecturerFeedback}
                  </p>
                )}
              </div>
            )}

            {activeItem.status !== 'Marked' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const res = studentPortalService.submitAssessmentWork(
                    activeItem.id,
                    workNote,
                    workFile ?? undefined
                  );
                  if (!res.ok) return onNotify('err', res.error ?? 'Could not submit work.');
                  onNotify('ok', `Submitted ${activeItem.title}.`);
                  setActiveItem(null);
                  onRefresh();
                }}
                className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-slate-800"
              >
                <label className="block font-semibold text-slate-900 dark:text-slate-100">
                  Submission Response / Notes / Repository Link
                </label>
                <textarea
                  rows={3}
                  value={workNote}
                  onChange={(e) => setWorkNote(e.target.value)}
                  placeholder="Enter summary notes, repository URL, or practical observations..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <UploadCloud size={14} />
                    <span>{workFile ? workFile.fileName : 'Attach File (PDF / DOCX / ZIP)'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.zip,.txt,.png,.jpg"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const size =
                          f.size >= 1024 * 1024
                            ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.max(1, Math.round(f.size / 1024))} KB`;
                        setWorkFile({ fileName: f.name, fileSize: size });
                      }}
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    {(activeItem.status === 'Pending' || activeItem.status === 'Upcoming') && (
                      <button
                        type="button"
                        onClick={() => {
                          studentPortalService.startAssessment(activeItem.id);
                          onNotify('ok', `Marked "${activeItem.title}" as In progress.`);
                          onRefresh();
                          setActiveItem(null);
                        }}
                        className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
                      >
                        Mark In Progress
                      </button>
                    )}

                    {activeItem.cbtAssessmentId && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveItem(null);
                          onNavigate('exams-online');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-[#102D50] text-white font-semibold inline-flex items-center gap-1"
                      >
                        <span>Open Online CBT</span>
                        <ExternalLink size={13} />
                      </button>
                    )}

                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={14} /> Submit Assessment
                    </button>
                  </div>
                </div>
              </form>
            )}

            {activeItem.status === 'Marked' && (
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveItem(null);
                    onNavigate('exams-appeals');
                  }}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 font-semibold"
                >
                  Request Remarking Appeal
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MyAssessmentsPage;

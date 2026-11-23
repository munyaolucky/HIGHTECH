import React, { useState } from 'react';
import { CheckCircle2, Download, FileText, UploadCloud } from 'lucide-react';
import { PortalCard, PortalPageHeader } from '../../../../components/ui/PortalUI';
import {
  downloadStudentDocument,
  studentPortalService,
} from '../../../../services/studentPortalService';
import { ExamWorkspaceProps, getStatusTextClasses } from './examWorkspaceUtils';

export default function AssignmentsPage({
  onNavigate,
  onNotify,
  onRefresh,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'SUBMITTED' | 'GRADED'>('ALL');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [fileAttachment, setFileAttachment] = useState<{ fileName: string; fileSize: string } | null>(
    null
  );

  const assignmentCatalogItems = state.assessments.filter(
    (a) => a.assessmentType === 'Assignment' || a.assessmentType === 'Project'
  );

  const filteredTasks = state.assignments.filter((asg) =>
    filter === 'ALL' ? true : asg.status === filter
  );

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Assignments"
        title="Assignments & Coursework"
        description="Submit assignment files, repository links, and project reports before unit deadlines."
      >
        <button
          type="button"
          onClick={() => onNavigate('exams-assessments')}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
        >
          View All Assessments
        </button>
      </PortalPageHeader>

      <PortalCard
        title="Coursework & Lab Assignment Submissions"
        description="Attach PDF/DOCX/ZIP lab reports or paste repository links."
        action={
          <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg">
            {(['ALL', 'PENDING', 'SUBMITTED', 'GRADED'] as const).map((statusKey) => (
              <button
                key={statusKey}
                type="button"
                onClick={() => setFilter(statusKey)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  filter === statusKey
                    ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {statusKey === 'ALL'
                  ? `All (${state.assignments.length})`
                  : `${statusKey.charAt(0) + statusKey.slice(1).toLowerCase()} (${
                      state.assignments.filter((a) => a.status === statusKey).length
                    })`}
              </button>
            ))}
          </div>
        }
      >
        <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
          {filteredTasks.map((asg) => (
            <div key={asg.id} className="py-4 first:pt-0 last:pb-0 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
                    <span className="font-semibold text-[#1769AA] dark:text-blue-400">
                      {asg.unitCode}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 tabular-nums">
                      Due {asg.dueLabel}
                    </span>
                    <span aria-hidden="true" className="text-slate-400">
                      ·
                    </span>
                    <span
                      className={`font-semibold ${
                        asg.status === 'GRADED'
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : asg.status === 'SUBMITTED'
                          ? 'text-[#1769AA] dark:text-blue-400'
                          : 'text-amber-700 dark:text-amber-400'
                      }`}
                    >
                      {asg.status}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {asg.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                    Lecturer: {asg.lecturerName}
                  </p>
                  {asg.submissionNote && (
                    <p className="text-slate-700 dark:text-slate-200 mt-1">
                      Submission note: {asg.submissionNote}
                    </p>
                  )}
                  {asg.attachmentName && (
                    <p className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Uploaded file: {asg.attachmentName} ({asg.attachmentSize})
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {asg.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveId(activeId === asg.id ? null : asg.id);
                        setNoteText('');
                        setFileAttachment(null);
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap transition-colors"
                    >
                      <UploadCloud size={14} /> Submit Assignment
                    </button>
                  ) : (
                    <>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {asg.scoreLabel ?? 'Submitted'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          downloadStudentDocument(
                            `Submission_Receipt_${asg.id}.txt`,
                            `HI-TECH COLLEGE ASSIGNMENT RECEIPT\nUnit: ${asg.unitCode}\nTitle: ${asg.title}\nStudent: ${state.profile.fullName} (${state.profile.registrationNumber})\nSubmitted At: ${asg.submittedAt ?? 'Recorded'}\nFile: ${asg.attachmentName ?? 'Text/URL submission'}\nNote: ${asg.submissionNote ?? '-'}\n`
                          );
                          onNotify('ok', `Downloaded submission receipt for ${asg.unitCode}.`);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold inline-flex items-center gap-1 whitespace-nowrap transition-colors"
                      >
                        <Download size={13} /> Receipt
                      </button>
                    </>
                  )}
                </div>
              </div>

              {activeId === asg.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const res = studentPortalService.submitAssignment(
                      asg.id,
                      noteText,
                      fileAttachment ?? undefined
                    );
                    if (!res.ok) return onNotify('err', res.error ?? 'Submission failed.');
                    setActiveId(null);
                    setNoteText('');
                    setFileAttachment(null);
                    onNotify('ok', `Assignment submitted for ${asg.unitCode}.`);
                    onRefresh();
                  }}
                  className="pt-3 border-t border-slate-200/75 dark:border-slate-800 space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Repository URL, executive summary, or lab notes..."
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                    <label className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                      <UploadCloud size={14} />
                      <span>{fileAttachment ? fileAttachment.fileName : 'Attach File'}</span>
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
                          setFileAttachment({ fileName: f.name, fileSize: size });
                        }}
                      />
                    </label>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                    >
                      <CheckCircle2 size={14} /> Confirm Submit
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      </PortalCard>

      <PortalCard
        title="Term Projects & Assessment Briefs"
        description="Extended project and written assignment briefs tracked in the examination calendar."
      >
        <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
          {assignmentCatalogItems.map((item) => (
            <div
              key={item.id}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                  {item.unitCode} · {item.assessmentType} · Due {item.deadline}
                </span>
                <strong className="block text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                  {item.title}
                </strong>
                <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                  {item.instructions || item.submissionNote}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`font-semibold ${getStatusTextClasses(item.status)}`}>
                  {item.status}
                </span>
                <button
                  type="button"
                  onClick={() => onNavigate('exams-assessments')}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#1769AA] text-slate-800 dark:text-slate-200 font-semibold inline-flex items-center gap-1 whitespace-nowrap"
                >
                  <FileText size={13} /> Open Brief
                </button>
              </div>
            </div>
          ))}
        </div>
      </PortalCard>
    </div>
  );
}

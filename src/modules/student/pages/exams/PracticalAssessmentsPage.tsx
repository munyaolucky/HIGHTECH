import React, { useState } from 'react';
import { CheckCircle2, Save, UploadCloud } from 'lucide-react';
import { PortalCard, PortalPageHeader } from '../../../../components/ui/PortalUI';
import { studentPortalService } from '../../../../services/studentPortalService';
import { ExamWorkspaceProps, getStatusTextClasses } from './examWorkspaceUtils';

export default function PracticalAssessmentsPage({
  onNavigate,
  onNotify,
  onRefresh,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const practicals = state.assessments.filter(
    (a) => a.assessmentType === 'Practical' || a.assessmentType === 'Competency assessment'
  );

  const [selectedId, setSelectedId] = useState<string>(practicals[0]?.id ?? '');
  const activePractical = practicals.find((p) => p.id === selectedId) ?? practicals[0];

  const [stepsState, setStepsState] = useState<Record<string, boolean[]>>({});
  const [notesState, setNotesState] = useState<Record<string, string>>({});
  const [fileState, setFileState] = useState<
    Record<string, { fileName: string; fileSize: string } | null>
  >({});

  const currentSteps = activePractical
    ? stepsState[activePractical.id] ??
      activePractical.completedSteps ??
      (activePractical.checklistSteps || []).map(() => false)
    : [];
  const currentNote = activePractical
    ? notesState[activePractical.id] ?? activePractical.submissionNote ?? ''
    : '';
  const currentFile = activePractical ? fileState[activePractical.id] ?? null : null;

  const toggleStep = (idx: number) => {
    if (!activePractical) return;
    const next = [...currentSteps];
    next[idx] = !next[idx];
    setStepsState((prev) => ({ ...prev, [activePractical.id]: next }));
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Practical Assessments"
        title="Practical & Competency Assessments"
        description="Complete lab checklists, record workshop observations, and upload practical evidence files."
      >
        <button
          type="button"
          onClick={() => onNavigate('exams-assessments')}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
        >
          All Assessments
        </button>
      </PortalPageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Master List Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-200/75 dark:divide-slate-800">
          {practicals.map((prac) => {
            const isSelected = activePractical?.id === prac.id;
            return (
              <button
                key={prac.id}
                type="button"
                onClick={() => setSelectedId(prac.id)}
                className={`w-full text-left p-4 transition-colors text-xs space-y-1 ${
                  isSelected
                    ? 'bg-[#eff6ff] dark:bg-blue-950/35'
                    : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                    {prac.unitCode} · {prac.examBody || 'TVET CDACC'}
                  </span>
                  <span className={`font-semibold ${getStatusTextClasses(prac.status)}`}>
                    {prac.status}
                  </span>
                </div>
                <strong className="text-sm font-semibold text-[#102D50] dark:text-white block">
                  {prac.title}
                </strong>
                <span className="text-slate-500 dark:text-slate-400 block font-mono tabular-nums">
                  {prac.venue || 'Engineering & ICT Lab'} · Due {prac.deadline} · {prac.totalMarks}{' '}
                  marks
                </span>
              </button>
            );
          })}
        </div>

        {/* Detail Evidence Workspace */}
        <div className="lg:col-span-7">
          {activePractical && (
            <PortalCard
              title={activePractical.title}
              description={`${activePractical.unitCode} · Assessor: ${activePractical.lecturerName} · Due ${activePractical.deadline}`}
            >
              <div className="space-y-5 text-xs">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {activePractical.instructions}
                </p>

                {activePractical.checklistSteps && activePractical.checklistSteps.length > 0 && (
                  <div className="space-y-2">
                    <strong className="text-slate-900 dark:text-white font-semibold block">
                      Practical Execution Checklist (
                      <span className="font-mono tabular-nums">
                        {currentSteps.filter(Boolean).length}/{activePractical.checklistSteps.length}
                      </span>{' '}
                      completed)
                    </strong>
                    <div className="divide-y divide-slate-200/70 dark:divide-slate-800 border-y border-slate-200/80 dark:border-slate-800">
                      {activePractical.checklistSteps.map((step, idx) => (
                        <label
                          key={step}
                          className="flex items-start gap-2.5 py-2.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                        >
                          <input
                            type="checkbox"
                            checked={Boolean(currentSteps[idx])}
                            onChange={() => toggleStep(idx)}
                            className="mt-0.5 rounded accent-[#1769AA]"
                          />
                          <span className="text-slate-800 dark:text-slate-100 leading-snug">
                            {step}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block font-semibold text-slate-900 dark:text-white">
                    Lab Observations / Command Output Summary
                  </label>
                  <textarea
                    rows={3}
                    value={currentNote}
                    onChange={(e) =>
                      setNotesState((prev) => ({ ...prev, [activePractical.id]: e.target.value }))
                    }
                    placeholder="Document your configuration steps, measurements, or verification output..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200/75 dark:border-slate-800">
                  <label className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1.5 cursor-pointer">
                    <UploadCloud size={14} />
                    <span>
                      {currentFile
                        ? `${currentFile.fileName} (${currentFile.fileSize})`
                        : activePractical.attachmentName
                        ? `Attached: ${activePractical.attachmentName}`
                        : 'Upload Practical Evidence'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.zip,.png,.jpg,.txt,.docx"
                      className="sr-only"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const size =
                          f.size >= 1024 * 1024
                            ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                            : `${Math.max(1, Math.round(f.size / 1024))} KB`;
                        setFileState((prev) => ({
                          ...prev,
                          [activePractical.id]: { fileName: f.name, fileSize: size },
                        }));
                      }}
                    />
                  </label>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const res = studentPortalService.savePracticalEvidence(
                          activePractical.id,
                          currentSteps,
                          currentNote,
                          currentFile ?? undefined,
                          false
                        );
                        if (!res.ok) return onNotify('err', res.error ?? 'Save failed');
                        onNotify('ok', 'Practical progress saved cleanly.');
                        onRefresh();
                      }}
                      className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Save size={14} /> Save Draft
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const res = studentPortalService.savePracticalEvidence(
                          activePractical.id,
                          currentSteps,
                          currentNote,
                          currentFile ?? undefined,
                          true
                        );
                        if (!res.ok) return onNotify('err', res.error ?? 'Submission failed');
                        onNotify('ok', `Practical evidence submitted for ${activePractical.unitCode}.`);
                        onRefresh();
                      }}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <CheckCircle2 size={14} /> Submit Practical Evidence
                    </button>
                  </div>
                </div>
              </div>
            </PortalCard>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Download, MessageSquare, ShieldCheck } from 'lucide-react';
import { PortalCard, PortalPageHeader } from '../../../../components/ui/PortalUI';
import { examAssessmentService } from '../../../../services/examAssessmentService';
import {
  downloadStudentDocument,
  studentPortalService,
} from '../../../../services/studentPortalService';
import { ExamWorkspaceProps } from './examWorkspaceUtils';

export default function ResultsPage({
  onNavigate,
  onNotify,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const resources = studentPortalService.getStaticResources();
  const engineState = examAssessmentService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;
  const trx = resources.transcripts[0];

  const [tab, setTab] = useState<'FINAL' | 'CATS' | 'CBT'>('FINAL');

  const markedAssessments = state.assessments.filter((a) => a.status === 'Marked');
  const myAttempts = engineState.attempts.filter(
    (a) => a.studentRegNo.toUpperCase() === regNo.toUpperCase()
  );

  const handleDownloadTranscript = () => {
    downloadStudentDocument(
      `Transcript_${regNo.replace(/\//g, '_')}.txt`,
      `HI-TECH COLLEGE OFFICIAL ACADEMIC TRANSCRIPT\nStudent: ${profile.fullName}\nReg No: ${regNo}\nTranscript Ref: ${trx?.issuanceReference ?? 'TRX-2026-0001'}\nVerification Code: ${trx?.verificationCode ?? 'VRF-HCA-99210-2026'}\nGPA: ${profile.gpa.toFixed(2)}\n\n` +
        state.units
          .map((u) => `${u.code}\t${u.title}\tScore: ${u.score ?? '-'}\tGrade: ${u.grade ?? '-'}`)
          .join('\n')
    );
    onNotify('ok', 'Official Registrar-verified transcript downloaded.');
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Results & Grades"
        title="Results & Grades"
        description="View CAT scores, released CBT assessment scripts, final unit grades, and Registrar-verified transcripts."
      >
        <button
          type="button"
          onClick={() => onNavigate('exams-appeals')}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <MessageSquare size={14} /> Request Remarking
        </button>
        <button
          type="button"
          onClick={handleDownloadTranscript}
          className="px-3.5 py-2 rounded-lg bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Download size={14} /> Download Official Transcript
        </button>
      </PortalPageHeader>

      {/* Registrar Verification Strip */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div>
          <p className="font-mono text-[11px] text-[#1769AA] dark:text-blue-400 font-semibold">
            {trx?.issuanceReference ?? 'TRX-2026-0001'} · Code{' '}
            {trx?.verificationCode ?? 'VRF-HCA-99210-2026'}
          </p>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white mt-0.5 flex items-center gap-1.5">
            <ShieldCheck size={15} className="text-emerald-600 shrink-0" />
            <span>Issued by {trx?.issuedBy ?? 'Dr. Kiprop Chemweno (Registrar)'}</span>
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            Approved examination marks are permanently locked and audit-logged by the Academic
            Registry.
          </p>
        </div>
        <div className="sm:text-right font-mono tabular-nums shrink-0 sm:pl-6 sm:border-l sm:border-slate-200 dark:sm:border-slate-800">
          <span className="text-slate-500 dark:text-slate-400 block">Cumulative GPA</span>
          <strong className="text-2xl font-bold text-[#102D50] dark:text-blue-300">
            {profile.gpa.toFixed(2)} / 4.00
          </strong>
        </div>
      </section>

      {/* Sub-Tabs */}
      <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg">
        {[
          { id: 'FINAL', label: `Final Unit Results (${state.units.length})` },
          { id: 'CATS', label: `CAT & Assessment Marks (${markedAssessments.length})` },
          { id: 'CBT', label: `Online CBT Scripts (${myAttempts.length})` },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as 'FINAL' | 'CATS' | 'CBT')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              tab === t.id
                ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white font-semibold shadow-2xs'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'FINAL' && (
        <PortalCard
          title={`Unit Results Breakdown — ${profile.academicYear} ${profile.semester}`}
          description="Final aggregate scores combining CATs, practicals, and end-term examinations."
        >
          <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
            <table className="w-full text-xs text-left">
              <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 pr-3 font-medium">Unit Code</th>
                  <th className="py-2.5 px-3 font-medium">Course Title</th>
                  <th className="py-2.5 px-3 font-medium">Lecturer</th>
                  <th className="py-2.5 px-3 font-medium text-right">Credits</th>
                  <th className="py-2.5 px-3 font-medium text-right">Score</th>
                  <th className="py-2.5 pl-3 font-medium text-right">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                {state.units.map((u) => (
                  <tr
                    key={u.code}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 pr-3 font-mono font-semibold text-[#102D50] dark:text-blue-400 whitespace-nowrap">
                      {u.code}
                    </td>
                    <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                      {u.title}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {u.lecturerName}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                      {u.credits}
                    </td>
                    <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                      {u.score ?? '-'}%
                    </td>
                    <td className="py-3 pl-3 text-right font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {u.grade ?? '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PortalCard>
      )}

      {tab === 'CATS' && (
        <PortalCard
          title="Continuous Assessment (CAT), Practical & Midterm Marks"
          description="Published scores and lecturer marking feedback."
        >
          <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
            {markedAssessments.map((item) => (
              <div
                key={item.id}
                className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                    {item.unitCode} · {item.assessmentType} · Weight {item.weightPercent}%
                  </span>
                  <strong className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </strong>
                  {item.lecturerFeedback && (
                    <p className="text-slate-600 dark:text-slate-300">
                      {item.lecturerName}: “{item.lecturerFeedback}”
                    </p>
                  )}
                </div>
                <div className="sm:text-right font-mono tabular-nums shrink-0">
                  <strong className="text-lg font-bold text-emerald-700 dark:text-emerald-400 block">
                    {item.scoreObtained} / {item.totalMarks}
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400">{item.gradeLabel}</span>
                </div>
              </div>
            ))}
          </div>
        </PortalCard>
      )}

      {tab === 'CBT' && (
        <PortalCard
          title="Online CBT Examination Scripts & Moderation Status"
          description="Official released and pending-moderation CBT scripts from the Examination Engine."
        >
          <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
            {myAttempts.map((att) => (
              <div key={att.id} className="py-4 first:pt-0 last:pb-0 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                      {att.unitCode} · Script {att.anonymousScriptId}
                    </span>
                    <strong className="block text-sm font-semibold text-slate-900 dark:text-white">
                      {att.assessmentTitle}
                    </strong>
                  </div>
                  <div className="text-right font-mono tabular-nums">
                    <strong className="text-base font-bold text-[#102D50] dark:text-white block">
                      {att.moderationStatus === 'RELEASED'
                        ? `${att.totalAwarded} / ${att.maxPossibleMarks}`
                        : 'Pending Moderation'}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400">
                      {att.moderationStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {att.hasUnmarkedItems
                    ? 'Essay/rubric questions are currently undergoing anonymous moderation before official outcome release.'
                    : `Final outcome: ${att.passFailOutcome ?? 'RELEASED'}`}
                </p>
              </div>
            ))}
          </div>
        </PortalCard>
      )}
    </div>
  );
}

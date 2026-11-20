import React from 'react';
import { Award, CheckCircle2, Download, GraduationCap, ShieldCheck } from 'lucide-react';
import { PortalCard, PortalPageHeader } from '../../../../components/ui/PortalUI';
import {
  downloadStudentDocument,
  studentPortalService,
} from '../../../../services/studentPortalService';
import { ExamWorkspaceProps } from './examWorkspaceUtils';

export default function AcademicProgressPage({
  onNavigate,
  onNotify,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  const totalCredits = state.units.reduce((s, u) => s + u.credits, 0);
  const completedCredits = state.units
    .filter((u) => typeof u.score === 'number')
    .reduce((s, u) => s + u.credits, 0);

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Certificates & Progress"
        title="Certificates & Academic Progress"
        description="Track cumulative GPA, degree credit progression, unit standings, and verified institutional/KNEC/TVET certificates."
      >
        <button
          type="button"
          onClick={() => onNavigate('exams-results')}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
        >
          View Official Transcript
        </button>
        <button
          type="button"
          onClick={() => {
            downloadStudentDocument(
              `Academic_Standing_${regNo.replace(/\//g, '_')}.txt`,
              `HI-TECH COLLEGE ACADEMIC PROGRESSION STATEMENT\nStudent: ${profile.fullName}\nReg No: ${regNo}\nProgramme: ${profile.programme}\nGPA: ${profile.gpa.toFixed(2)} / 4.00\nCredits Completed: ${completedCredits}/${totalCredits}\nAttendance Rate: ${profile.attendanceRate}%\n`
            );
            onNotify('ok', 'Academic progression statement downloaded.');
          }}
          className="px-3.5 py-2 rounded-lg bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Download size={14} /> Export Progress Statement
        </button>
      </PortalPageHeader>

      {/* Unified 3-Column Metric Bar */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800 text-xs overflow-hidden">
        <div className="p-5">
          <span className="font-medium text-slate-500 dark:text-slate-400 block">
            Cumulative GPA
          </span>
          <strong className="text-3xl font-bold text-[#102D50] dark:text-white font-mono tabular-nums mt-1.5 block">
            {profile.gpa.toFixed(2)} / 4.00
          </strong>
          <span className="text-emerald-700 dark:text-emerald-400 font-medium mt-1 block">
            Good Academic Standing · Dean’s List Track
          </span>
        </div>

        <div className="p-5">
          <span className="font-medium text-slate-500 dark:text-slate-400 block">
            Semester Credits Earned
          </span>
          <strong className="text-3xl font-bold text-[#102D50] dark:text-white font-mono tabular-nums mt-1.5 block">
            {completedCredits} / {totalCredits}
          </strong>
          <progress
            value={completedCredits}
            max={Math.max(1, totalCredits)}
            aria-label="Semester credits completed"
            className="w-full h-2 mt-2.5 rounded-full overflow-hidden accent-[#1769AA] bg-slate-200 dark:bg-slate-800"
          />
        </div>

        <div className="p-5">
          <span className="font-medium text-slate-500 dark:text-slate-400 block">
            Attendance Compliance
          </span>
          <strong className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1.5 block">
            {profile.attendanceRate}%
          </strong>
          <span className="text-slate-600 dark:text-slate-300 font-medium mt-1 block">
            Minimum 75% exam sitting threshold met
          </span>
        </div>
      </section>

      {/* Certificates & Competency Credentials (flat hairline directory) */}
      <PortalCard
        title={`Certificates & Competency Statements (${state.certificates.length})`}
        description="Institutional academic certificates, TVET CDACC Level 6 competencies, and KNEC exam statements."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800 -mx-5 sm:-mx-6 text-xs">
          {state.certificates.map((cert) => (
            <div key={cert.id} className="px-5 sm:px-6 py-4 md:py-1 flex flex-col justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Award size={17} className="text-[#1769AA] dark:text-blue-400 shrink-0" />
                  <span
                    className={`font-semibold ${
                      cert.status === 'Issued'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : cert.status === 'Eligible'
                        ? 'text-[#1769AA] dark:text-blue-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    {cert.status}
                  </span>
                </div>
                <strong className="text-sm font-semibold text-slate-900 dark:text-white block">
                  {cert.title}
                </strong>
                <p className="text-slate-600 dark:text-slate-300">{cert.issuingBody}</p>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  {cert.unitOrProgramme}
                </p>
              </div>

              {cert.verificationCode ? (
                <div className="pt-3 border-t border-slate-200/75 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1">
                    <ShieldCheck size={13} /> {cert.verificationCode}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      downloadStudentDocument(
                        `${cert.id}_${regNo.replace(/\//g, '_')}.txt`,
                        `HI-TECH COLLEGE VERIFIED CERTIFICATE\nCredential: ${cert.title}\nRecipient: ${profile.fullName} (${regNo})\nIssuing Body: ${cert.issuingBody}\nIssued Date: ${cert.issuedDate ?? '2026'}\nVerification Code: ${cert.verificationCode}\n`
                      );
                      onNotify('ok', `Downloaded verified certificate: ${cert.title}`);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold transition-colors"
                  >
                    Download
                  </button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200/75 dark:border-slate-800 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 inline-flex items-center gap-1">
                    <GraduationCap size={13} />
                    {cert.status === 'Eligible' ? 'Ready for Registry Claim' : 'Active Modules'}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      onNotify(
                        'ok',
                        cert.status === 'Eligible'
                          ? `Requested official issuance for ${cert.title}.`
                          : `${cert.title} will unlock once remaining competencies are moderated.`
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#1769AA] text-slate-700 dark:text-slate-200 font-semibold transition-colors"
                  >
                    {cert.status === 'Eligible' ? 'Claim Statement' : 'View Track'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </PortalCard>

      <PortalCard
        title="Current Programme Unit Progress"
        description={`${profile.programme} · ${profile.academicYear} ${profile.semester}`}
      >
        <div className="overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="py-2.5 pr-3 font-medium">Unit Code</th>
                <th className="py-2.5 px-3 font-medium">Course Title</th>
                <th className="py-2.5 px-3 font-medium text-right">Credits</th>
                <th className="py-2.5 px-3 font-medium text-right">Attendance</th>
                <th className="py-2.5 px-3 font-medium text-right">Score</th>
                <th className="py-2.5 pl-3 font-medium text-right">Standing</th>
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
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200">
                    {u.credits}
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                    {u.attendance}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                    {u.score ?? '-'}%
                  </td>
                  <td className="py-3 pl-3 text-right font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <CheckCircle2 size={13} /> {u.grade ?? 'On Track'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PortalCard>
    </div>
  );
}

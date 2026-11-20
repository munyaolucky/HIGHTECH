import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Download,
  FileCheck,
  MapPin,
  ShieldAlert,
} from 'lucide-react';
import { PortalCard, PortalPageHeader } from '../../../../components/ui/PortalUI';
import { collegeErpService } from '../../../../services/collegeErpService';
import { examAssessmentService } from '../../../../services/examAssessmentService';
import { hostelsService } from '../../../../services/hostelsService';
import {
  downloadStudentDocument,
  studentPortalService,
} from '../../../../services/studentPortalService';
import { ExamWorkspaceProps } from './examWorkspaceUtils';

export default function ExamClearancePage({
  onNavigate,
  onNotify,
  onRefresh,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const fin = studentPortalService.getFinancialSummary();
  const resources = studentPortalService.getStaticResources();
  const engineState = examAssessmentService.getState();
  const hostelState = hostelsService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  const pendingHostelInvoices = hostelState.charges.filter(
    (c) =>
      c.studentRegNo.toUpperCase() === regNo.toUpperCase() &&
      (c.status === 'INVOICED' || c.status === 'APPROVED')
  );
  const activeLoans = collegeErpService
    .getLoansForStudent(regNo)
    .filter((l) => l.status === 'BORROWED' || l.status === 'OVERDUE');

  const attendanceUnitsMet = state.units.filter((u) => u.attendance >= 75).length;
  const seatings = engineState.seatingAllocations.filter(
    (s) => s.studentRegNo.toUpperCase() === regNo.toUpperCase()
  );

  const checks = [
    {
      dept: 'Finance & Student Accounts',
      cleared: fin.examCleared,
      note: fin.examCleared
        ? '100% Semester Fees Settled — Final Exam Card Unlocked'
        : `Fee Clearance ${fin.percentPaid}% (Balance KES ${fin.balance.toLocaleString()} required for final sitting)`,
      actionLabel: !fin.examCleared ? 'Pay via M-Pesa' : undefined,
      actionSection: 'finance' as const,
    },
    {
      dept: 'Class Attendance Compliance (75% Rule)',
      cleared: profile.attendanceRate >= 75,
      note: `Overall Attendance ${profile.attendanceRate}% · ${attendanceUnitsMet}/${state.units.length} units meet the 75% threshold`,
      actionLabel: 'View Attendance',
      actionSection: 'attendance' as const,
    },
    {
      dept: 'Library Circulation Desk',
      cleared: profile.libraryFines === 0 && activeLoans.length === 0,
      note:
        activeLoans.length > 0
          ? `${activeLoans.length} active book loan(s) awaiting return or renewal`
          : 'Zero overdue book fines (KES 0)',
      actionLabel: activeLoans.length > 0 ? 'Check Library' : undefined,
      actionSection: 'library' as const,
    },
    {
      dept: 'ICT & Computer Laboratories',
      cleared: true,
      note: 'All lab equipment kits and practical workbenches verified',
    },
    {
      dept: 'Hostels & Student Welfare',
      cleared: pendingHostelInvoices.length === 0,
      note:
        pendingHostelInvoices.length > 0
          ? `${pendingHostelInvoices.length} unpaid residence invoice(s)`
          : 'No pending accommodation maintenance charges',
    },
    {
      dept: 'Academic Registry / HOD',
      cleared: state.semesterReported,
      note: `${state.units.length} Semester units registered and verified on nominal roll`,
    },
  ];

  const clearedCount = checks.filter((c) => c.cleared).length;

  const handleDownloadExamPermit = () => {
    downloadStudentDocument(
      `Exam_Permit_${regNo.replace(/\//g, '_')}.txt`,
      `HI-TECH COLLEGE OFFICIAL EXAMINATION PERMIT & CLEARANCE\nStudent: ${profile.fullName}\nRegistration No: ${regNo}\nProgramme: ${profile.programme}\nAttendance Standing: ${profile.attendanceRate}%\nFee Paid: ${fin.percentPaid}% (Balance KES ${fin.balance.toLocaleString()})\nCleared Departments: ${clearedCount}/${checks.length}\nStatus: ${
        fin.examCleared
          ? 'CLEARED FOR ALL FINAL EXAMINATIONS'
          : 'CAT CLEARED — COMPLETE FEE CLEARANCE FOR FINAL HALL ENTRY'
      }\n\nCONFIRMED SEATING & PAPERS:\n` +
        resources.exams
          .map((ex) => {
            const seat = seatings.find((s) => s.examId === ex.id);
            return `- ${ex.courseCode} ${ex.courseTitle} | ${ex.examDate} ${ex.time} | ${ex.room}${
              seat ? ` Seat ${seat.seatNumber}` : ''
            }`;
          })
          .join('\n')
    );
    onNotify('ok', 'Official Exam Clearance Permit downloaded.');
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Exam Clearance"
        title="Exam Clearance & Hall Permit"
        description="Verify 75% attendance, fee settlement, library clearance, and download your stamped Exam Card."
      >
        <button
          type="button"
          onClick={() => {
            studentPortalService.submitClearance();
            onNotify('ok', 'Institutional clearance verification refreshed.');
            onRefresh();
          }}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
        >
          {state.clearanceSubmittedAt ? 'Refresh Clearance' : 'Initiate Clearance'}
        </button>
        <button
          type="button"
          onClick={handleDownloadExamPermit}
          className="px-3.5 py-2 rounded-lg bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Download size={14} /> Download Exam Permit
        </button>
      </PortalPageHeader>

      {/* Summary Banner */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          {fin.examCleared ? (
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Examination Clearance Progress: <span className="font-mono tabular-nums">{clearedCount}</span> of{' '}
              <span className="font-mono tabular-nums">{checks.length}</span> Departments Cleared
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
              {fin.examCleared
                ? 'All academic, library, and financial holds are satisfied. Present your printed or digital Exam Permit at the examination hall.'
                : `Attendance requirement (${profile.attendanceRate}%) met. Settle remaining KES ${fin.balance.toLocaleString()} to unlock Final Examination Hall entry.`}
            </p>
          </div>
        </div>
        {!fin.examCleared ? (
          <button
            type="button"
            onClick={() => onNavigate('finance')}
            className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            <CreditCard size={14} /> Clear Balance (KES {fin.balance.toLocaleString()})
          </button>
        ) : (
          <span className="text-emerald-700 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <FileCheck size={15} /> Permit Active
          </span>
        )}
      </section>

      <PortalCard
        title="Departmental Sign-Off Checklist"
        description="Real-time verification across Finance, Attendance, Library, Laboratories, Hostels & Academic Registry."
      >
        <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
          {checks.map((item) => (
            <div
              key={item.dept}
              className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <strong className="text-sm font-semibold text-slate-900 dark:text-white block">
                  {item.dept}
                </strong>
                <span className="text-slate-600 dark:text-slate-300">{item.note}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {item.actionLabel && item.actionSection && (
                  <button
                    type="button"
                    onClick={() => onNavigate(item.actionSection!)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 whitespace-nowrap transition-colors"
                  >
                    {item.actionLabel}
                  </button>
                )}
                <span
                  className={`inline-flex items-center gap-1 font-semibold whitespace-nowrap ${
                    item.cleared
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {item.cleared ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                  <span>{item.cleared ? 'Cleared' : 'Action required'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </PortalCard>

      <PortalCard
        title="Exam Hall Seat & Roster Assignments"
        description="Verified examination room and desk assignments linked to your Exam Permit."
      >
        <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
          {resources.exams.map((ex) => {
            const seat = seatings.find((s) => s.examId === ex.id);
            return (
              <div
                key={ex.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-4"
              >
                <div>
                  <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                    {ex.courseCode} · {ex.examDate}
                  </span>
                  <strong className="block text-sm font-semibold text-slate-900 dark:text-white mt-0.5">
                    {ex.courseTitle}
                  </strong>
                  <span className="text-slate-500 dark:text-slate-400 inline-flex items-center gap-1 mt-0.5">
                    <MapPin size={12} /> {ex.room} · {ex.time}
                  </span>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Seat</span>
                  <strong className="text-sm font-bold text-[#102D50] dark:text-white">
                    {seat ? seat.seatNumber : 'Assigned'}
                  </strong>
                </div>
              </div>
            );
          })}
        </div>
      </PortalCard>
    </div>
  );
}

import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Download,
  FileCheck,
  Monitor,
} from 'lucide-react';
import { PortalCard, PortalPageHeader } from '../../../../components/ui/PortalUI';
import { examAssessmentService } from '../../../../services/examAssessmentService';
import {
  downloadStudentDocument,
  studentPortalService,
  StudentAssessmentItem,
} from '../../../../services/studentPortalService';
import {
  ExamWorkspaceProps,
  formatCountdownLabel,
  getStatusTextClasses,
} from './examWorkspaceUtils';

export function StudentExamDashboard({
  onNavigate,
  onNotify,
  onRefresh,
}: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const fin = studentPortalService.getFinancialSummary();
  const resources = studentPortalService.getStaticResources();
  const metrics = studentPortalService.getExamDashboardSummary();
  const engineState = examAssessmentService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  const [selectedAssessment, setSelectedAssessment] = useState<StudentAssessmentItem | null>(null);

  const upcomingRows = state.assessments.filter(
    (a) =>
      a.status === 'Pending' ||
      a.status === 'In progress' ||
      a.status === 'Upcoming' ||
      a.status === 'Submitted'
  );
  const pendingAssignmentTasks = state.assignments.filter((a) => a.status === 'PENDING');
  const missingOrOverdue = state.assessments.filter((a) => a.status === 'Overdue');
  const markedAssessments = state.assessments.filter((a) => a.status === 'Marked');
  const mySeatings = engineState.seatingAllocations.filter(
    (s) => s.studentRegNo.toUpperCase() === regNo.toUpperCase()
  );
  const unreadNotices = state.examNotices.filter((n) => !n.acknowledged);
  const completedCredits = state.units
    .filter((u) => typeof u.score === 'number')
    .reduce((s, u) => s + u.credits, 0);
  const totalCredits = state.units.reduce((s, u) => s + u.credits, 0);

  const openAssessmentTarget = (item: StudentAssessmentItem) => {
    if (
      item.cbtAssessmentId ||
      item.assessmentType === 'Quiz' ||
      item.assessmentType === 'Mock exam'
    ) {
      onNavigate('exams-online');
      return;
    }
    if (
      item.assessmentType === 'Practical' ||
      item.assessmentType === 'Competency assessment'
    ) {
      onNavigate('exams-practical');
      return;
    }
    if (item.assessmentType === 'Assignment' || item.assessmentType === 'Project') {
      onNavigate('exams-assignments');
      return;
    }
    if (
      item.assessmentType === 'End-term exam' ||
      item.assessmentType === 'Supplementary exam'
    ) {
      onNavigate('exams-timetable');
      return;
    }
    setSelectedAssessment(item);
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments"
        title="Exams & Assessments"
        description={`Assessment workspace · ${profile.academicYear} ${profile.semester} · ${profile.programme}`}
      >
        <button
          type="button"
          onClick={() => onNavigate('exams-assessments')}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 whitespace-nowrap shrink-0 transition-colors"
        >
          All Assessments ({state.assessments.length})
        </button>
        <button
          type="button"
          onClick={() => onNavigate('exams-online')}
          className="px-3.5 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Monitor size={14} /> Online CBT Exams
        </button>
        <button
          type="button"
          onClick={() => {
            downloadStudentDocument(
              `Exam_Summary_${regNo.replace(/\//g, '_')}.txt`,
              `HI-TECH COLLEGE STUDENT ASSESSMENT OVERVIEW\nStudent: ${profile.fullName} (${regNo})\nTerm: ${profile.academicYear} ${profile.semester}\nPending: ${metrics.pendingAssessments}\nUpcoming Exams: ${metrics.upcomingExams}\nAverage Score: ${metrics.averageScore}%\nReleased Results: ${metrics.releasedResults}\n`
            );
            onNotify('ok', 'Assessment summary report downloaded.');
          }}
          className="px-3.5 py-2 rounded-lg bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Download size={14} /> Export Summary
        </button>
      </PortalPageHeader>

      {/* Unified 4-Column Architectural Metric Strip */}
      <section
        aria-label="Assessment key metrics"
        className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800 overflow-hidden"
      >
        <button
          type="button"
          onClick={() => onNavigate('exams-assessments')}
          className="text-left p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Pending Assessments
          </span>
          <strong className="text-3xl font-bold text-[#102D50] dark:text-white font-mono tabular-nums mt-1.5 block">
            {metrics.pendingAssessments}
          </strong>
          <span className="text-xs text-amber-700 dark:text-amber-400 font-medium mt-1 block">
            To complete · {metrics.overdueCount} overdue
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('exams-timetable')}
          className="text-left p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Upcoming Exams
          </span>
          <strong className="text-3xl font-bold text-[#102D50] dark:text-white font-mono tabular-nums mt-1.5 block">
            {metrics.upcomingExams}
          </strong>
          <span className="text-xs text-[#1769AA] dark:text-blue-400 font-medium mt-1 block">
            Scheduled · {resources.exams.length} final sittings
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('exams-results')}
          className="text-left p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Average Score
          </span>
          <strong className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1.5 block">
            {metrics.averageScore}%
          </strong>
          <span className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-1 block">
            Graded work · GPA {profile.gpa.toFixed(2)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('exams-results')}
          className="text-left p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 block">
            Released Results
          </span>
          <strong className="text-3xl font-bold text-[#102D50] dark:text-white font-mono tabular-nums mt-1.5 block">
            {metrics.releasedResults}
          </strong>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium mt-1 block">
            Published · Registrar verified
          </span>
        </button>
      </section>

      {/* Overdue / Missing Submissions Alert Strip */}
      {missingOrOverdue.length > 0 && (
        <div
          role="alert"
          className="bg-red-50/80 dark:bg-red-950/35 border border-red-200 dark:border-red-900/70 rounded-xl px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle size={17} className="text-red-700 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-sm font-semibold text-red-900 dark:text-red-200 block">
                Missing / Overdue Assessment Alert ({missingOrOverdue.length})
              </strong>
              <p className="text-red-800 dark:text-red-300 mt-0.5">
                {missingOrOverdue.map((m) => `${m.unitCode}: ${m.title} (${m.deadline})`).join(' · ')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('exams-appeals')}
              className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              Request Makeup / Appeal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('exams-assessments')}
              className="px-3.5 py-2 rounded-lg border border-red-300 dark:border-red-800 bg-white dark:bg-slate-900 text-red-800 dark:text-red-200 font-semibold whitespace-nowrap shrink-0 transition-colors"
            >
              View Details
            </button>
          </div>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 columns */}
        <div className="xl:col-span-8 space-y-6">
          <PortalCard
            title="Upcoming Assessment Schedule"
            description="Active CATs, practicals, assignments, and end-term exams ordered by submission deadline."
            action={
              <button
                type="button"
                onClick={() => onNavigate('exams-assessments')}
                className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
              >
                <span>Open Full Catalog</span>
                <ArrowRight size={13} />
              </button>
            }
          >
            {/* Mobile Stacked Schedule Rows */}
            <div className="md:hidden divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
              {upcomingRows.slice(0, 6).map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[11px] font-semibold text-[#102D50] dark:text-blue-400 block">
                        {item.unitCode} · {item.assessmentType}
                      </span>
                      <strong className="font-semibold text-slate-900 dark:text-slate-100 block">
                        {item.title}
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {item.unitTitle}
                      </span>
                    </div>
                    <span
                      className={`text-xs font-semibold shrink-0 ${getStatusTextClasses(item.status)}`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    <div className="font-mono tabular-nums text-[11px] text-slate-600 dark:text-slate-300">
                      <span>Due {item.deadline}</span>
                      <span className="text-slate-400 dark:text-slate-500"> · </span>
                      <span>{formatCountdownLabel(item.deadlineIso)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openAssessmentTarget(item)}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#1769AA] hover:text-[#1769AA] dark:hover:text-blue-400 text-slate-800 dark:text-slate-200 font-semibold whitespace-nowrap shrink-0 transition-colors"
                    >
                      Open
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 pr-3 font-medium">Assessment</th>
                    <th className="py-2.5 px-3 font-medium">Unit</th>
                    <th className="py-2.5 px-3 font-medium">Due date</th>
                    <th className="py-2.5 px-3 font-medium">Status</th>
                    <th className="py-2.5 pl-3 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {upcomingRows.slice(0, 6).map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-3">
                        <strong className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {item.title}
                        </strong>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.assessmentType} · {item.totalMarks} marks · {item.weightPercent}% weight
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className="font-mono font-semibold text-[#102D50] dark:text-blue-400 block">
                          {item.unitCode}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {item.unitTitle}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums whitespace-nowrap">
                        <span className="text-slate-900 dark:text-slate-100 font-medium block">
                          {item.deadline}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {formatCountdownLabel(item.deadlineIso)}
                        </span>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`text-xs font-semibold ${getStatusTextClasses(item.status)}`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openAssessmentTarget(item)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-[#1769AA] hover:text-[#1769AA] dark:hover:text-blue-400 text-slate-800 dark:text-slate-200 font-semibold transition-colors"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PortalCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PortalCard
              title="Pending Assignment Submissions"
              description="Coursework & lab reports awaiting upload."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('exams-assignments')}
                  className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
                >
                  All Assignments
                </button>
              }
            >
              {pendingAssignmentTasks.length === 0 ? (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                  <CheckCircle2 size={15} /> All active assignments submitted.
                </p>
              ) : (
                <div className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                  {pendingAssignmentTasks.map((asg) => (
                    <div key={asg.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                          {asg.unitCode} · {asg.dueLabel}
                        </span>
                        <strong className="block font-semibold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                          {asg.title}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate('exams-assignments')}
                        className="px-3 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white font-semibold shrink-0 whitespace-nowrap transition-colors"
                      >
                        Submit
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </PortalCard>

            <PortalCard
              title="Examination Timetable"
              description="Confirmed dates, halls, and seat allocations."
              action={
                <button
                  type="button"
                  onClick={() => onNavigate('exams-timetable')}
                  className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
                >
                  Full Timetable
                </button>
              }
            >
              <div className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
                {resources.exams.map((ex) => {
                  const seat = mySeatings.find((s) => s.examId === ex.id);
                  return (
                    <div key={ex.id} className="py-3 first:pt-0 last:pb-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2 font-mono tabular-nums text-[11px]">
                        <span className="font-semibold text-[#102D50] dark:text-blue-400">
                          {ex.courseCode} · {ex.examBody}
                        </span>
                        <span className="text-slate-500 dark:text-slate-400">{ex.examDate}</span>
                      </div>
                      <strong className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                        {ex.courseTitle}
                      </strong>
                      <span className="text-slate-500 dark:text-slate-400 block">
                        {ex.time} · {ex.room}
                        {seat ? ` · Seat ${seat.seatNumber}` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>
            </PortalCard>
          </div>

          <PortalCard
            title="Latest Results & Lecturer Feedback"
            description="Moderated CATs, midterms, presentations, and evaluator notes."
            action={
              <button
                type="button"
                onClick={() => onNavigate('exams-results')}
                className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                View All Results
              </button>
            }
          >
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {markedAssessments.slice(0, 4).map((res) => (
                <div
                  key={res.id}
                  className="py-3.5 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                      {res.unitCode} · {res.assessmentType}
                    </span>
                    <strong className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {res.title}
                    </strong>
                    {res.lecturerFeedback && (
                      <p className="text-slate-600 dark:text-slate-300">
                        {res.lecturerName}: “{res.lecturerFeedback}”
                      </p>
                    )}
                  </div>
                  <div className="sm:text-right font-mono tabular-nums shrink-0">
                    <strong className="text-base font-bold text-emerald-700 dark:text-emerald-400 block">
                      {res.scoreObtained} / {res.totalMarks}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400">{res.gradeLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          </PortalCard>
        </div>

        {/* Right 4 columns */}
        <div className="xl:col-span-4 space-y-6">
          <PortalCard
            title="Exam Eligibility & Clearance"
            description="Attendance, fee balance & registry permit checks."
            action={
              <button
                type="button"
                onClick={() => onNavigate('exams-clearance')}
                className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                Clearance Desk
              </button>
            }
          >
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <span className="text-slate-600 dark:text-slate-300">Attendance Standing</span>
                <strong className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                  {profile.attendanceRate}% (Min 75% Met)
                </strong>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-600 dark:text-slate-300">Fee Clearance</span>
                <strong
                  className={`font-mono tabular-nums font-semibold ${
                    fin.examCleared
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-amber-700 dark:text-amber-400'
                  }`}
                >
                  {fin.percentPaid}% (Bal KES {fin.balance.toLocaleString()})
                </strong>
              </div>
              <div className="flex items-center justify-between py-2.5">
                <span className="text-slate-600 dark:text-slate-300">Library Fines</span>
                <strong className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                  KES {profile.libraryFines} (Cleared)
                </strong>
              </div>
            </div>
            <div className="pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate('exams-clearance')}
                className="w-full py-2.5 px-3 rounded-lg bg-[#102D50] hover:bg-[#1769AA] text-white text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileCheck size={14} /> Open Exam Permit &amp; Clearance
              </button>
              {!fin.examCleared && (
                <button
                  type="button"
                  onClick={() => onNavigate('finance')}
                  className="w-full py-2 px-3 rounded-lg border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-xs font-semibold transition-colors"
                >
                  Settle Balance via M-Pesa
                </button>
              )}
            </div>
          </PortalCard>

          <PortalCard
            title={`Exam Notices (${unreadNotices.length} New)`}
            description="Schedule changes, room updates & exam hall rules."
          >
            <div className="divide-y divide-slate-200/70 dark:divide-slate-800 text-xs">
              {state.examNotices.map((notice) => (
                <div key={notice.id} className="py-3.5 first:pt-0 last:pb-0 space-y-1">
                  <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                    <span
                      className={`font-semibold ${
                        notice.urgent
                          ? 'text-red-700 dark:text-red-400'
                          : 'text-[#1769AA] dark:text-blue-400'
                      }`}
                    >
                      {notice.unitCode} · {notice.noticeType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 tabular-nums">
                      {new Date(notice.publishedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold block">
                    {notice.title}
                  </strong>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {notice.message}
                  </p>
                  {!notice.acknowledged && (
                    <button
                      type="button"
                      onClick={() => {
                        studentPortalService.acknowledgeExamNotice(notice.id);
                        onNotify('ok', `Acknowledged notice: ${notice.title}`);
                        onRefresh();
                      }}
                      className="text-[11px] font-semibold text-[#1769AA] dark:text-blue-400 hover:underline pt-0.5"
                    >
                      Mark notice read
                    </button>
                  )}
                </div>
              ))}
            </div>
          </PortalCard>

          <PortalCard
            title="Academic Progress & Calendar"
            description="Credit accumulation and upcoming assessment dates."
            action={
              <button
                type="button"
                onClick={() => onNavigate('exams-progress')}
                className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                Certificates
              </button>
            }
          >
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between font-mono tabular-nums">
                  <span className="text-slate-600 dark:text-slate-300">Term Credit Progress</span>
                  <strong className="text-[#102D50] dark:text-white">
                    {completedCredits} / {totalCredits} Credits
                  </strong>
                </div>
                <progress
                  value={completedCredits}
                  max={Math.max(1, totalCredits)}
                  aria-label="Term credit progress"
                  className="w-full h-2 rounded-full overflow-hidden accent-[#1769AA] bg-slate-200 dark:bg-slate-800"
                />
              </div>

              <div className="border-t border-slate-200/75 dark:border-slate-800 pt-3.5 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-[#1769AA]" /> Exam Calendar Preview
                  </strong>
                  <button
                    type="button"
                    onClick={() => onNavigate('exams-timetable')}
                    className="text-[11px] font-semibold text-[#1769AA] dark:text-blue-400 hover:underline whitespace-nowrap"
                  >
                    Calendar View
                  </button>
                </div>
                <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {upcomingRows.slice(0, 4).map((cal) => (
                    <div
                      key={cal.id}
                      className="flex items-center justify-between gap-2 py-2 last:pb-0"
                    >
                      <div className="min-w-0">
                        <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400 block">
                          {cal.deadline} · {cal.unitCode}
                        </span>
                        <span className="text-slate-800 dark:text-slate-200 truncate block">
                          {cal.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
                        {cal.assessmentType}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PortalCard>
        </div>
      </div>

      {/* Inline Assessment Quick-Detail Modal */}
      {selectedAssessment && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="exam-overview-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl text-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="font-mono font-semibold text-[#1769AA] dark:text-blue-400">
                  {selectedAssessment.unitCode} · {selectedAssessment.assessmentType}
                </span>
                <h3
                  id="exam-overview-modal-title"
                  className="text-base font-bold text-[#102D50] dark:text-white mt-0.5"
                >
                  {selectedAssessment.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAssessment(null)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold"
              >
                Close
              </button>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedAssessment.instructions ||
                'Review rubric criteria and submit before the published deadline.'}
            </p>
            <div className="grid grid-cols-2 gap-3 py-3 border-y border-slate-200/80 dark:border-slate-800 font-mono tabular-nums">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Deadline</span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedAssessment.deadline}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Marks &amp; Weight</span>
                <strong className="text-slate-900 dark:text-white">
                  {selectedAssessment.totalMarks} marks ({selectedAssessment.weightPercent}%)
                </strong>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedAssessment(null);
                  onNavigate('exams-assessments');
                }}
                className="px-4 py-2 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white font-semibold"
              >
                Open in My Assessments
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentExamDashboard;

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Download,
  ExternalLink,
  List,
  MapPin,
  Monitor,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { PortalCard, PortalEmptyState, PortalPageHeader } from '../../../../components/ui/PortalUI';
import { examAssessmentService } from '../../../../services/examAssessmentService';
import {
  downloadStudentDocument,
  studentPortalService,
} from '../../../../services/studentPortalService';
import { ExamWorkspaceProps } from './examWorkspaceUtils';

type TimetableViewMode = 'list' | 'calendar';

interface TimetableEntry {
  id: string;
  examDate: string;
  sortKey: number;
  timeLabel: string;
  paperCode: string;
  unitName: string;
  examTitle: string;
  examBody: string;
  mode: 'HALL' | 'ONLINE';
  venueLabel: string;
  seatLabel?: string;
  onlineRoute?: 'exams-online';
  durationMinutes: number;
}

function formatCalendarHeader(dateStr: string): {
  monthDay: string;
  weekday: string;
  isoDate: string;
} {
  const parsed = new Date(`${dateStr}T09:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return { monthDay: dateStr, weekday: 'Scheduled', isoDate: dateStr };
  }
  return {
    monthDay: parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weekday: parsed.toLocaleDateString('en-US', { weekday: 'long' }),
    isoDate: dateStr,
  };
}

export function ExamTimetablePage({ onNavigate, onNotify }: ExamWorkspaceProps) {
  const state = studentPortalService.getState();
  const resources = studentPortalService.getStaticResources();
  const engineState = examAssessmentService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  const [viewMode, setViewMode] = useState<TimetableViewMode>('list');
  const [bodyFilter, setBodyFilter] = useState<string>('ALL');

  const mySeats = engineState.seatingAllocations.filter(
    (s) => s.studentRegNo.toUpperCase() === regNo.toUpperCase()
  );

  const unitTitleByCode = useMemo(() => {
    const map = new Map<string, string>();
    for (const u of state.units) {
      map.set(u.code.toUpperCase(), u.title);
    }
    return map;
  }, [state.units]);

  const allEntries = useMemo<TimetableEntry[]>(() => {
    const hallEntries: TimetableEntry[] = resources.exams.map((ex) => {
      const seat = mySeats.find((s) => s.examId === ex.id);
      const parsedTime = new Date(`${ex.examDate}T09:00:00`).getTime();
      const matchedUnit = unitTitleByCode.get(ex.courseCode.toUpperCase());
      return {
        id: ex.id,
        examDate: ex.examDate,
        sortKey: Number.isNaN(parsedTime) ? 0 : parsedTime,
        timeLabel: ex.time,
        paperCode: ex.courseCode,
        unitName: matchedUnit || ex.courseTitle,
        examTitle: ex.courseTitle,
        examBody: ex.examBody,
        mode: 'HALL',
        venueLabel: ex.room,
        seatLabel: seat ? `Seat ${seat.seatNumber} · ${seat.permitStatus}` : undefined,
        durationMinutes: ex.durationMinutes,
      };
    });

    const onlineEntries: TimetableEntry[] = engineState.assessments
      .filter((a) => a.status === 'PUBLISHED' || a.status === 'MARKING')
      .map((cbt) => {
        const linkedCatalog = state.assessments.find((s) => s.cbtAssessmentId === cbt.id);
        const closingDate = new Date(cbt.closingTimeIso);
        const isoDate = Number.isNaN(closingDate.getTime())
          ? '2026-11-26'
          : closingDate.toISOString().slice(0, 10);
        const closeTimeText = Number.isNaN(closingDate.getTime())
          ? '11:59 PM'
          : closingDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });
        const unitName =
          linkedCatalog?.unitTitle ||
          unitTitleByCode.get(cbt.unitCode.toUpperCase()) ||
          cbt.title;

        return {
          id: `cbt-${cbt.id}`,
          examDate: isoDate,
          sortKey: Number.isNaN(closingDate.getTime()) ? 0 : closingDate.getTime(),
          timeLabel: `Open Window · Closes ${closeTimeText}`,
          paperCode: cbt.unitCode,
          unitName,
          examTitle: cbt.title,
          examBody: cbt.examBody,
          mode: 'ONLINE',
          venueLabel: 'Online CBT Portal (/portal/student/exams/online)',
          onlineRoute: 'exams-online',
          durationMinutes: cbt.durationMinutes,
        };
      });

    return [...hallEntries, ...onlineEntries].sort((a, b) => a.sortKey - b.sortKey);
  }, [engineState.assessments, mySeats, resources.exams, state.assessments, unitTitleByCode]);

  const scheduledExams = useMemo(
    () =>
      allEntries.filter((entry) => {
        if (bodyFilter === 'ALL') return true;
        if (bodyFilter === 'ONLINE') return entry.mode === 'ONLINE';
        return entry.examBody === bodyFilter;
      }),
    [allEntries, bodyFilter]
  );

  const calendarGroups = useMemo(() => {
    const groups = new Map<string, TimetableEntry[]>();
    for (const entry of scheduledExams) {
      const existing = groups.get(entry.examDate) ?? [];
      existing.push(entry);
      groups.set(entry.examDate, existing);
    }
    return Array.from(groups.entries());
  }, [scheduledExams]);

  const examNotices = state.examNotices.filter(
    (n) =>
      n.noticeType === 'SCHEDULE_CHANGE' ||
      n.noticeType === 'VENUE_UPDATE' ||
      n.noticeType === 'CANCELLATION' ||
      n.noticeType === 'INSTRUCTIONS'
  );

  const handleDownloadTimetable = () => {
    const lines = scheduledExams.map(
      (ex) =>
        `${ex.examDate}\t${ex.timeLabel}\t${ex.paperCode}\t${ex.unitName}\t${ex.examTitle}\t${ex.examBody}\t${ex.venueLabel}${
          ex.seatLabel ? `\t${ex.seatLabel}` : ''
        }`
    );
    downloadStudentDocument(
      `Exam_Timetable_${regNo.replace(/\//g, '_')}.txt`,
      `HI-TECH COLLEGE EXAMINATION TIMETABLE\nStudent: ${profile.fullName} (${regNo})\nProgramme: ${profile.programme}\nTerm: ${profile.academicYear} ${profile.semester}\n\n` +
        lines.join('\n')
    );
    onNotify('ok', 'Examination timetable downloaded.');
  };

  return (
    <div className="space-y-6">
      <PortalPageHeader
        breadcrumbSection="Exams & Assessments · Exam Timetable"
        title="Examination Timetable"
        description="Official CAT, KNEC, TVET CDACC, online CBT, and end-term examination sittings, venues, and access links."
      >
        <button
          type="button"
          onClick={() => window.print()}
          className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Printer size={14} /> Print Timetable
        </button>
        <button
          type="button"
          onClick={handleDownloadTimetable}
          className="px-3.5 py-2 rounded-lg bg-[#102D50] hover:bg-[#0b203a] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
        >
          <Download size={14} /> Download Timetable
        </button>
      </PortalPageHeader>

      {examNotices.length > 0 && (
        <div className="bg-amber-50/80 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-900/70 rounded-xl px-5 py-4 space-y-1.5 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-900 dark:text-amber-200">
            <AlertCircle size={15} />
            <span>Examination Schedule &amp; Venue Notices</span>
          </div>
          {examNotices.map((n) => (
            <div key={n.id} className="text-amber-900 dark:text-amber-100">
              <strong className="font-mono">{n.unitCode}:</strong> {n.title} — {n.message}
            </div>
          ))}
        </div>
      )}

      <PortalCard
        title="Scheduled Examination Sittings"
        description="Switch between structured list view and chronological calendar view. Arrive 30 minutes early for hall sittings or launch CBT sessions directly."
        action={
          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Timetable view mode"
              className="inline-flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg"
            >
              <button
                type="button"
                aria-pressed={viewMode === 'list'}
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List size={13} aria-hidden="true" />
                <span>List View</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === 'calendar'}
                onClick={() => setViewMode('calendar')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays size={13} aria-hidden="true" />
                <span>Calendar View</span>
              </button>
            </div>

            <div className="inline-flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg">
              {['ALL', 'ONLINE', 'HI-TECH INTERNAL', 'TVET CDACC', 'KNEC'].map((body) => (
                <button
                  key={body}
                  type="button"
                  onClick={() => setBodyFilter(body)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap shrink-0 transition-colors ${
                    bodyFilter === body
                      ? 'bg-white dark:bg-slate-900 text-[#102D50] dark:text-white font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {body === 'ALL' ? 'All Sittings' : body === 'ONLINE' ? 'Online CBT' : body}
                </button>
              ))}
            </div>
          </div>
        }
      >
        {scheduledExams.length === 0 ? (
          <PortalEmptyState
            title="No scheduled examinations match this filter"
            description="Select All Sittings to view both physical examination halls and online CBT windows."
            actionLabel="Show All Sittings"
            onAction={() => setBodyFilter('ALL')}
          />
        ) : viewMode === 'calendar' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarGroups.map(([dateStr, items]) => {
              const header = formatCalendarHeader(dateStr);
              return (
                <div
                  key={dateStr}
                  className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-900/60 flex flex-col"
                >
                  <div className="px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <div>
                      <strong className="text-sm font-bold text-[#102D50] dark:text-white block">
                        {header.monthDay}
                      </strong>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {header.weekday}
                      </span>
                    </div>
                    <span className="font-mono tabular-nums text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                      {header.isoDate}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200/75 dark:divide-slate-800 p-4 space-y-3 text-xs">
                    {items.map((ex) => (
                      <div key={ex.id} className="pt-3 first:pt-0 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 font-mono text-[11px]">
                          <span className="font-semibold text-[#102D50] dark:text-blue-400">
                            {ex.paperCode} · {ex.examBody}
                          </span>
                          <span className="tabular-nums text-slate-500 dark:text-slate-400">
                            {ex.durationMinutes} mins
                          </span>
                        </div>
                        <strong className="block font-semibold text-slate-900 dark:text-white">
                          {ex.unitName}
                        </strong>
                        <p className="text-slate-600 dark:text-slate-300">{ex.examTitle}</p>
                        <p className="font-mono tabular-nums text-[11px] text-slate-700 dark:text-slate-200">
                          {ex.timeLabel}
                        </p>
                        {ex.mode === 'ONLINE' && ex.onlineRoute ? (
                          <div className="pt-1 flex items-center justify-between gap-2">
                            <span className="inline-flex items-center gap-1 text-[#1769AA] dark:text-blue-400 font-medium">
                              <Monitor size={13} aria-hidden="true" />
                              <span>Online Exam Link</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onNavigate(ex.onlineRoute!)}
                              className="px-2.5 py-1 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                            >
                              <span>Launch CBT</span>
                              <ExternalLink size={11} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <div className="pt-0.5 text-slate-600 dark:text-slate-300">
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={13} className="text-[#1769AA] shrink-0" aria-hidden="true" />
                              <span>{ex.venueLabel}</span>
                            </span>
                            {ex.seatLabel && (
                              <span className="block font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {ex.seatLabel}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <>
            {/* Mobile Stacked Timetable Rows */}
            <div className="md:hidden divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
              {scheduledExams.map((ex) => (
                <div key={ex.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between gap-2 font-mono tabular-nums text-[11px]">
                    <span className="font-semibold text-[#102D50] dark:text-blue-400">
                      {ex.paperCode} · {ex.examBody}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300">
                      {ex.examDate} · {ex.durationMinutes} mins
                    </span>
                  </div>
                  <div>
                    <strong className="font-semibold text-slate-900 dark:text-white block">
                      {ex.unitName}
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400 block">{ex.examTitle}</span>
                  </div>
                  <div className="font-mono tabular-nums text-[11px] text-slate-700 dark:text-slate-200">
                    {ex.timeLabel}
                  </div>
                  {ex.mode === 'ONLINE' && ex.onlineRoute ? (
                    <div className="flex items-center justify-between gap-2 pt-0.5">
                      <span className="inline-flex items-center gap-1 text-[#1769AA] dark:text-blue-400 font-medium">
                        <Monitor size={13} aria-hidden="true" />
                        <span>{ex.venueLabel}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => onNavigate(ex.onlineRoute!)}
                        className="px-3 py-1.5 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                      >
                        <span>Open Exam Link</span>
                        <ExternalLink size={12} aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-slate-700 dark:text-slate-200">
                      <span className="inline-flex items-center gap-1">
                        <MapPin size={13} className="text-[#1769AA] shrink-0" aria-hidden="true" />
                        <span>{ex.venueLabel}</span>
                      </span>
                      {ex.seatLabel && (
                        <span className="block font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {ex.seatLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Structured Table */}
            <div className="hidden md:block overflow-x-auto -mx-5 sm:-mx-6 px-5 sm:px-6">
              <table className="w-full text-xs text-left">
                <thead className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-2.5 pr-3 font-medium">Date &amp; Time</th>
                    <th className="py-2.5 px-3 font-medium">Paper Code</th>
                    <th className="py-2.5 px-3 font-medium">Unit &amp; Examination</th>
                    <th className="py-2.5 px-3 font-medium">Exam Body</th>
                    <th className="py-2.5 px-3 font-medium">Venue / Online Link</th>
                    <th className="py-2.5 pl-3 font-medium text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
                  {scheduledExams.map((ex) => (
                    <tr
                      key={ex.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 pr-3 font-mono tabular-nums whitespace-nowrap">
                        <strong className="font-semibold text-slate-900 dark:text-white block">
                          {ex.examDate}
                        </strong>
                        <span className="text-slate-500 dark:text-slate-400">{ex.timeLabel}</span>
                      </td>
                      <td className="py-3 px-3 font-mono font-semibold text-[#102D50] dark:text-blue-400 whitespace-nowrap">
                        {ex.paperCode}
                      </td>
                      <td className="py-3 px-3">
                        <strong className="font-semibold text-slate-900 dark:text-slate-100 block">
                          {ex.unitName}
                        </strong>
                        {ex.examTitle !== ex.unitName && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                            {ex.examTitle}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        <span>{ex.examBody}</span>
                        <span className="block text-[11px] text-slate-500 dark:text-slate-400">
                          {ex.mode === 'ONLINE' ? 'Online CBT' : 'Exam Hall'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {ex.mode === 'ONLINE' && ex.onlineRoute ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200">
                              <Monitor size={13} className="text-[#1769AA] shrink-0" aria-hidden="true" />
                              <span>{ex.venueLabel}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => onNavigate(ex.onlineRoute!)}
                              className="px-2.5 py-1 rounded-lg bg-[#1769AA] hover:bg-[#12568E] text-white text-[11px] font-semibold inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
                            >
                              <span>Open Online Exam</span>
                              <ExternalLink size={11} aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="inline-flex items-center gap-1 text-slate-800 dark:text-slate-200">
                              <MapPin size={13} className="text-[#1769AA] shrink-0" aria-hidden="true" />
                              <span>{ex.venueLabel}</span>
                            </span>
                            {ex.seatLabel && (
                              <span className="block font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5">
                                {ex.seatLabel}
                              </span>
                            )}
                          </>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right font-mono tabular-nums text-slate-700 dark:text-slate-200 whitespace-nowrap">
                        {ex.durationMinutes} mins
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </PortalCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <PortalCard
          title="Upcoming CATs, Mock & End-Term Dates"
          description="Chronological timetable across all enrolled units."
        >
          <div className="divide-y divide-slate-200/75 dark:divide-slate-800 text-xs">
            {state.assessments
              .filter(
                (a) =>
                  a.assessmentType === 'CAT 2' ||
                  a.assessmentType === 'End-term exam' ||
                  a.assessmentType === 'Practical' ||
                  a.assessmentType === 'Competency assessment' ||
                  a.cbtAssessmentId
              )
              .map((a) => (
                <div
                  key={a.id}
                  className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                >
                  <div>
                    <span className="font-mono text-[11px] font-semibold text-[#1769AA] dark:text-blue-400">
                      {a.deadline} · {a.unitCode} · {a.assessmentType}
                    </span>
                    <strong className="block font-semibold text-slate-900 dark:text-white mt-0.5">
                      {a.title} ({a.unitTitle})
                    </strong>
                    <span className="text-slate-500 dark:text-slate-400">
                      {a.cbtAssessmentId
                        ? 'Online CBT Portal (/portal/student/exams/online)'
                        : a.venue || 'Assigned Departmental Lab'}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300 shrink-0">
                    {a.durationMinutes ? `${a.durationMinutes}m` : `${a.totalMarks} mks`}
                  </span>
                </div>
              ))}
          </div>
        </PortalCard>

        <PortalCard
          title="Examination Hall Candidate Instructions"
          description="Mandatory rules enforced by Chief Invigilators & Academic Registry."
          action={
            <button
              type="button"
              onClick={() => onNavigate('exams-clearance')}
              className="text-xs font-semibold text-[#1769AA] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <ShieldCheck size={14} /> Verify Permit
            </button>
          }
        >
          <ul className="space-y-3 text-xs text-slate-700 dark:text-slate-200 list-disc pl-4 leading-relaxed">
            <li>
              Present both your HI-TECH Digital/Physical Student ID and verified Examination Card at
              the hall entrance.
            </li>
            <li>
              No mobile phones, smartwatches, or unauthorized electronic storage devices are allowed
              inside examination rooms.
            </li>
            <li>
              For CBT &amp; Practical sessions, confirm workstation login credentials 15 minutes
              prior to start time.
            </li>
            <li>
              Report timetable clashes or medical emergencies immediately via Appeals &amp; Remarking
              for Special Sitting consideration.
            </li>
          </ul>
        </PortalCard>
      </div>
    </div>
  );
}

export default ExamTimetablePage;

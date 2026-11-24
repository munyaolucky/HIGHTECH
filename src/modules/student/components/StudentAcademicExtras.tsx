import React, { useEffect, useState } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Download,
  FileCheck2,
  PlayCircle,
  RefreshCw,
  Send,
  Users,
  Vote,
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { Phase4ModuleSkeleton } from '../../../components/ui/PortalUI';
import { collegeErpService } from '../../../services/collegeErpService';
import { communityService } from '../../../services/communityService';
import { engagementService } from '../../../services/engagementService';
import { hostelsService } from '../../../services/hostelsService';
import {
  downloadStudentDocument,
  studentPortalService,
  StudentPortalSection,
} from '../../../services/studentPortalService';
import StudentAbsenceSection from './StudentAbsenceSection';
import StudentEventsPanel from './StudentEventsPanel';
import ModuleDocumentRepository from '../../documents/ModuleDocumentRepository';

interface Props {
  activeSection: Extract<
    StudentPortalSection,
    'attendance' | 'elearning' | 'attachment' | 'clearance' | 'campus-life'
  >;
  headerBlock: React.ReactNode;
  onNotify: (type: 'ok' | 'err', message: string) => void;
  onRefresh: () => void;
}

export default function StudentAcademicExtras({
  activeSection,
  headerBlock,
  onNotify,
  onRefresh,
}: Props) {
  const { reducedMotion } = useTheme();
  const state = studentPortalService.getState();
  const fin = studentPortalService.getFinancialSummary();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  const [transitionLoading, setTransitionLoading] = useState(false);
  const [elearningSyncing, setElearningSyncing] = useState(false);

  useEffect(() => {
    if (activeSection !== 'elearning' && activeSection !== 'attendance') {
      setTransitionLoading(false);
      return;
    }
    if (reducedMotion) {
      setTransitionLoading(false);
      return;
    }
    setTransitionLoading(true);
    const timer = window.setTimeout(() => setTransitionLoading(false), 160);
    return () => window.clearTimeout(timer);
  }, [activeSection, reducedMotion]);

  const handleSyncMaterials = () => {
    setElearningSyncing(true);
    window.setTimeout(() => {
      setElearningSyncing(false);
      onRefresh();
      onNotify('ok', 'E-learning modules and recorded lecture links synchronized.');
    }, reducedMotion ? 80 : 300);
  };

  // E-Learning unit filter
  const [elearnUnit, setElearnUnit] = useState<string>('ALL');

  // Industrial attachment placement & weekly logbook
  const [placement, setPlacement] = useState(state.attachmentPlacement);
  const [logSummary, setLogSummary] = useState('');
  const [logSkills, setLogSkills] = useState('');

  // Campus life / elections
  const [ballotPicks, setBallotPicks] = useState<Record<string, string>>({});
  const [lastBallotHash, setLastBallotHash] = useState<string | null>(null);

  if (transitionLoading || (activeSection === 'elearning' && elearningSyncing)) {
    return (
      <div className="space-y-5">
        {headerBlock}
        <Phase4ModuleSkeleton section={activeSection} />
      </div>
    );
  }

  // 1. CLASS ATTENDANCE REGISTER, LIVE QR CHECK-IN & ABSENCE MANAGEMENT
  if (activeSection === 'attendance') {
    return (
      <div className="space-y-5">
        {headerBlock}

        <StudentAbsenceSection onNotify={onNotify} />

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Registered Unit Attendance Summary (75% Exam Eligibility Rule)
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
              Profile Rate: {profile.attendanceRate}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {state.units.map((u) => (
              <div key={u.code} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono font-bold text-[#102D50] dark:text-blue-400">{u.code}</p>
                  <strong className="text-slate-900 dark:text-slate-100 block">{u.title}</strong>
                  <span className="text-slate-600 dark:text-slate-300">{u.lecturerName}</span>
                </div>
                <div className="text-right font-mono tabular-nums shrink-0">
                  <strong className={`text-base ${u.attendance >= 75 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'}`}>
                    {u.attendance}%
                  </strong>
                  <span className="block text-[11px] text-slate-600 dark:text-slate-300">
                    {u.attendance >= 75 ? 'Cleared' : 'Low'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. E-LEARNING & COURSE MATERIALS
  if (activeSection === 'elearning') {
    const completedCount = state.elearningMaterials.filter((m) => m.completed).length;
    const filtered =
      elearnUnit === 'ALL'
        ? state.elearningMaterials
        : state.elearningMaterials.filter((m) => m.unitCode === elearnUnit);

    return (
      <div className="space-y-5">
        {headerBlock}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Lecture Notes, Recorded Classes &amp; Lab Manuals
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-mono tabular-nums">
                {completedCount} of {state.elearningMaterials.length} modules completed
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {['ALL', ...state.units.slice(0, 4).map((u) => u.code)].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setElearnUnit(code)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                      elearnUnit === code
                        ? 'bg-white dark:bg-slate-900 text-[#092c60] dark:text-white font-semibold shadow-sm'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {code === 'ALL' ? 'All Units' : code}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSyncMaterials}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap"
              >
                <RefreshCw size={13} /> Sync Materials
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((mat) => (
              <div key={mat.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <p className="font-mono text-[#0866d7] dark:text-blue-400 font-semibold">
                    {mat.unitCode} · {mat.format.replace('_', ' ')} · {mat.durationOrSize}
                  </p>
                  <strong className="text-sm text-slate-900 dark:text-slate-100 block">{mat.title}</strong>
                  <span className="text-slate-600 dark:text-slate-300">Instructor: {mat.lecturerName}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      downloadStudentDocument(
                        `${mat.unitCode.replace(/\s+/g, '')}_${mat.id}.txt`,
                        `HI-TECH E-LEARNING RESOURCE\nUnit: ${mat.unitCode}\nTitle: ${mat.title}\nInstructor: ${mat.lecturerName}\nFormat: ${mat.format} (${mat.durationOrSize})\n`
                      );
                      onNotify('ok', `Opened/downloaded "${mat.title}".`);
                    }}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    {mat.format === 'RECORDED_CLASS' ? <PlayCircle size={14} /> : <Download size={14} />}
                    {mat.format === 'RECORDED_CLASS' ? 'Open Notes' : 'Download'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      studentPortalService.toggleELearningComplete(mat.id);
                      onRefresh();
                    }}
                    className={`px-3 py-1.5 rounded-lg font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${
                      mat.completed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#092c60] text-white'
                    }`}
                  >
                    <CheckCircle2 size={14} />
                    {mat.completed ? 'Completed' : 'Mark Done'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 3. INDUSTRIAL ATTACHMENT & DIGITAL LOGBOOK
  if (activeSection === 'attachment') {
    const engState = engagementService.getState();
    return (
      <div className="space-y-5">
        {headerBlock}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.saveAttachmentPlacement(placement);
              if (!res.ok) return onNotify('err', res.error ?? 'Could not save placement');
              onNotify('ok', 'Industrial attachment host organization saved.');
              onRefresh();
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Briefcase size={16} className="text-[#0866d7] dark:text-blue-400" /> Industrial Attachment Placement
              </h3>
              <button
                type="button"
                onClick={() => {
                  downloadStudentDocument(
                    `Attachment_Intro_Letter_${regNo.replace(/\//g, '_')}.txt`,
                    `TO WHOM IT MAY CONCERN\nHI-TECH COLLEGE INDUSTRIAL ATTACHMENT INTRODUCTION LETTER\n\nThis confirms that ${profile.fullName} (${regNo}) pursuing ${profile.programme} is cleared for a 12-week industrial attachment placement.\nHost Company: ${placement.companyName}\nDates: ${placement.startDate} to ${placement.endDate}\n`
                  );
                  onNotify('ok', 'Official Attachment Introduction Letter downloaded.');
                }}
                className="text-[#0866d7] dark:text-blue-400 font-semibold hover:underline inline-flex items-center gap-1"
              >
                <Download size={13} /> Intro Letter
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Host Company / Organization</label>
                <input
                  type="text"
                  required
                  value={placement.companyName}
                  onChange={(e) => setPlacement({ ...placement, companyName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Industry Supervisor</label>
                <input
                  type="text"
                  required
                  value={placement.supervisorName}
                  onChange={(e) => setPlacement({ ...placement, supervisorName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Supervisor Phone</label>
                <input
                  type="text"
                  required
                  value={placement.supervisorPhone}
                  onChange={(e) => setPlacement({ ...placement, supervisorPhone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Start Date</label>
                <input
                  type="date"
                  value={placement.startDate}
                  onChange={(e) => setPlacement({ ...placement, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">End Date</label>
                <input
                  type="date"
                  value={placement.endDate}
                  onChange={(e) => setPlacement({ ...placement, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg"
            >
              Save Placement Details
            </button>
          </form>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.addAttachmentLog(logSummary, logSkills);
              if (!res.ok) return onNotify('err', res.error ?? 'Could not save log entry');
              setLogSummary('');
              setLogSkills('');
              onNotify('ok', 'Weekly attachment logbook entry submitted.');
              onRefresh();
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Submit Weekly Digital Logbook Entry</h3>
            <textarea
              rows={3}
              required
              placeholder="Summarize weekly engineering / ICT duties completed..."
              value={logSummary}
              onChange={(e) => setLogSummary(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
            />
            <input
              type="text"
              placeholder="Tools & skills applied (e.g. Docker, SQL, Cisco CLI)"
              value={logSkills}
              onChange={(e) => setLogSkills(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
            >
              <Send size={13} /> Log Weekly Activity
            </button>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 max-h-44 overflow-y-auto">
              {state.attachmentLogs.map((log) => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-[#092c60] dark:text-blue-300">Week {log.weekNumber} · {log.loggedAt}</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400">{log.status}</span>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 mt-1">{log.summary}</p>
                </div>
              ))}
            </div>
          </form>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">College Career &amp; Attachment Board</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {engState.opportunities.map((opp) => {
              const applied = engState.applications.some((a) => a.opportunityId === opp.id);
              return (
                <div key={opp.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col justify-between gap-3">
                  <div>
                    <p className="font-mono text-[#0866d7] dark:text-blue-400 font-semibold">
                      {opp.employmentType} · Deadline {opp.deadline}
                    </p>
                    <strong className="text-sm text-slate-900 dark:text-slate-100 block mt-0.5">{opp.title}</strong>
                    <span className="text-slate-600 dark:text-slate-300">{opp.employerName} · {opp.location}</span>
                  </div>
                  {opp.applicationMode === 'INTERNAL_PLATFORM' ? (
                    <button
                      type="button"
                      disabled={applied}
                      onClick={() => {
                        const res = engagementService.applyInternalOpportunity(
                          opp.id,
                          `Application from ${profile.fullName} (${regNo}), ${profile.programme}.`
                        );
                        if (!res.ok) return onNotify('err', res.error ?? 'Could not apply');
                        onNotify('ok', `Submitted placement application to ${opp.employerName}.`);
                        onRefresh();
                      }}
                      className="px-3.5 py-2 bg-[#092c60] text-white font-semibold rounded-lg disabled:opacity-50 w-fit"
                    >
                      {applied ? 'Applied' : 'Apply via Student Portal'}
                    </button>
                  ) : (
                    <span className="text-slate-600 dark:text-slate-300 font-mono">
                      External Employer Application Portal ({opp.externalUrl})
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <ModuleDocumentRepository
          moduleKey="STUDENT"
          fixedCategory="INDUSTRIAL_ATTACHMENT_DOC"
          isStudentView={true}
          compact={true}
          defaultRecipient="Industrial Attachment Coordinator"
          title="Attachment Documents & Logbook Repository"
          description="Upload signed introduction letters, scanned weekly logbooks, assessment forms, and employer reports."
        />
      </div>
    );
  }

  // 4. INSTITUTIONAL MULTI-DEPARTMENT CLEARANCE
  if (activeSection === 'clearance') {
    const hostelState = hostelsService.getState();
    const pendingHostelInvoices = hostelState.charges.filter(
      (c) =>
        c.studentRegNo.toUpperCase() === regNo.toUpperCase() &&
        (c.status === 'INVOICED' || c.status === 'APPROVED')
    );
    const activeLoans = collegeErpService
      .getLoansForStudent(regNo)
      .filter((l) => l.status === 'BORROWED' || l.status === 'OVERDUE');

    const depts = [
      {
        dept: 'Finance & Student Accounts',
        cleared: fin.balance === 0,
        note: fin.balance === 0 ? 'Balance KES 0.00 — Fee Cleared' : `Pending Balance KES ${fin.balance.toLocaleString()}`,
      },
      {
        dept: 'Library Circulation Desk',
        cleared: profile.libraryFines === 0 && activeLoans.length === 0,
        note:
          activeLoans.length > 0
            ? `${activeLoans.length} active library book loan(s) due for return`
            : 'No overdue book fines (KES 0)',
      },
      {
        dept: 'ICT & Computer Laboratories',
        cleared: true,
        note: 'All lab equipment kits returned in good condition',
      },
      {
        dept: 'Hostels & Student Welfare',
        cleared: pendingHostelInvoices.length === 0,
        note:
          pendingHostelInvoices.length > 0
            ? `${pendingHostelInvoices.length} unpaid residence invoice(s)`
            : 'No pending residence maintenance charges',
      },
      {
        dept: 'Dean of Students & Discipline',
        cleared: true,
        note: 'Good academic and disciplinary standing',
      },
      {
        dept: 'Academic Registry / HOD',
        cleared: state.semesterReported,
        note: `${state.units.length} Semester units verified`,
      },
    ];
    const clearedCount = depts.filter((d) => d.cleared).length;

    return (
      <div className="space-y-5">
        {headerBlock}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              End-of-Semester / Graduation Clearance Progress ({clearedCount}/{depts.length} Departments)
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              {state.clearanceSubmittedAt
                ? `Clearance form initiated on ${new Date(state.clearanceSubmittedAt).toLocaleDateString()}.`
                : 'Initiate institutional clearance to notify all departments automatically.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                studentPortalService.submitClearance();
                onNotify('ok', 'Institutional clearance workflow submitted.');
                onRefresh();
              }}
              className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg"
            >
              {state.clearanceSubmittedAt ? 'Refresh Clearance Status' : 'Initiate Clearance'}
            </button>
            <button
              type="button"
              onClick={() => {
                downloadStudentDocument(
                  `Clearance_Certificate_${regNo.replace(/\//g, '_')}.txt`,
                  `HI-TECH COLLEGE STUDENT CLEARANCE FORM\nStudent: ${profile.fullName} (${regNo})\nCleared Departments: ${clearedCount}/${depts.length}\n\n` +
                    depts.map((d) => `${d.dept}: ${d.cleared ? 'CLEARED' : 'PENDING'} (${d.note})`).join('\n')
                );
                onNotify('ok', 'Clearance checklist document downloaded.');
              }}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 font-semibold rounded-lg inline-flex items-center gap-1.5"
            >
              <FileCheck2 size={14} /> Download Form
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
          {depts.map((d) => (
            <div key={d.dept} className="p-4 flex items-center justify-between gap-4 text-xs">
              <div>
                <strong className="text-sm text-slate-900 dark:text-slate-100 block">{d.dept}</strong>
                <span className="text-slate-600 dark:text-slate-300">{d.note}</span>
              </div>
              <span
                className={`font-mono font-bold whitespace-nowrap shrink-0 ${
                  d.cleared ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400'
                }`}
              >
                {d.cleared ? 'CLEARED' : 'ACTION REQUIRED'}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 5. CLUBS, CAMPUS EVENTS & SRC ELECTIONS
  const commState = communityService.getState();
  const activeElection = commState.elections[0];
  const hasVoted = commState.participations.some(
    (p) => p.electionId === activeElection?.id && p.voterStudentRegNo === regNo && p.hasVoted
  );

  return (
    <div className="space-y-5">
      {headerBlock}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users size={16} className="text-[#0866d7] dark:text-blue-400" /> Campus Clubs, Societies &amp; Events
          </h3>
          {commState.clubs.map((cl) => {
            const members = commState.memberships.filter(
              (m) => m.clubId === cl.id && m.status === 'APPROVED'
            ).length;
            const joined = commState.memberships.some(
              (m) => m.clubId === cl.id && m.studentRegNo === regNo
            );
            return (
              <div key={cl.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[#0866d7] dark:text-blue-400 font-semibold">
                    {cl.code} · {members} Approved Members
                  </p>
                  <strong className="text-sm text-slate-900 dark:text-slate-100 block">{cl.name}</strong>
                  <span className="text-slate-600 dark:text-slate-300">{cl.description}</span>
                </div>
                <button
                  type="button"
                  disabled={joined}
                  onClick={() => {
                    const res = communityService.requestClubJoin(cl.id, regNo, profile.fullName);
                    if (!res.ok) return onNotify('err', res.error ?? 'Failed');
                    onNotify('ok', `Joined ${cl.name}.`);
                    onRefresh();
                  }}
                  className="px-3.5 py-2 bg-[#092c60] text-white font-semibold rounded-lg disabled:opacity-50 shrink-0"
                >
                  {joined ? 'Member / Pending' : 'Join Club'}
                </button>
              </div>
            );
          })}

          {commState.events.map((ev) => {
            const registered = ev.registrations.some((r) => r.studentRegNo === regNo);
            return (
              <div key={ev.id} className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[#092c60] dark:text-blue-300 font-semibold">
                    EVENT · {ev.startDateTime}
                  </p>
                  <strong className="text-sm text-slate-900 dark:text-slate-100 block">{ev.title}</strong>
                  <span className="text-slate-600 dark:text-slate-300">{ev.location}</span>
                </div>
                <button
                  type="button"
                  disabled={registered}
                  onClick={() => {
                    const res = communityService.registerForEvent(ev.id, regNo, profile.fullName);
                    if (!res.ok) return onNotify('err', res.error ?? 'RSVP failed');
                    onNotify('ok', `RSVP confirmed for ${ev.title}.`);
                    onRefresh();
                  }}
                  className="px-3.5 py-2 bg-[#0866d7] text-white font-semibold rounded-lg disabled:opacity-50 shrink-0"
                >
                  {registered ? 'RSVP Confirmed' : 'RSVP Event'}
                </button>
              </div>
            );
          })}
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Vote size={16} className="text-emerald-700 dark:text-emerald-400" /> SRC Student Council Secret Ballot
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">{activeElection?.title}</p>
            </div>
            <span className={`font-mono font-bold ${hasVoted ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#0866d7] dark:text-blue-400'}`}>
              {hasVoted ? 'BALLOT CAST' : 'ELIGIBLE'}
            </span>
          </div>

          {lastBallotHash && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
              Anonymous Receipt Token: <strong className="font-mono">{lastBallotHash}</strong>
            </div>
          )}

          {activeElection?.positions.map((pos) => {
            const cands = commState.candidates.filter(
              (c) => c.electionId === activeElection.id && c.positionId === pos.id && c.status === 'APPROVED'
            );
            return (
              <div key={pos.id} className="space-y-1.5">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">{pos.title}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cands.map((cand) => {
                    const picked = ballotPicks[pos.id] === cand.id;
                    return (
                      <button
                        key={cand.id}
                        type="button"
                        disabled={hasVoted}
                        onClick={() => setBallotPicks({ ...ballotPicks, [pos.id]: cand.id })}
                        className={`p-3 rounded-lg border text-left transition ${
                          picked
                            ? 'bg-[#092c60] text-white border-[#092c60]'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <strong className="block">{cand.studentName}</strong>
                        <span className={picked ? 'text-blue-100' : 'text-slate-600 dark:text-slate-300'}>{cand.manifesto}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {activeElection && !hasVoted && (
            <button
              type="button"
              onClick={() => {
                const res = communityService.castSecretBallot(activeElection.id, regNo, ballotPicks);
                if (!res.ok) return onNotify('err', res.error ?? 'Select candidates for all positions');
                setLastBallotHash(res.anonymousReceiptHash ?? 'Verified');
                onNotify('ok', 'Anonymous SRC ballot recorded cleanly.');
                onRefresh();
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg"
            >
              Submit Secret Ballot
            </button>
          )}
        </div>
      </div>

      <StudentEventsPanel
        studentName={profile.fullName}
        registrationNumber={regNo}
        email={state.contact.email}
        phone={state.contact.phoneNumber}
        compact
        onNotify={onNotify}
      />
    </div>
  );
}

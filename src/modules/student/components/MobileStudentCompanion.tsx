import React, { useState } from 'react';
import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  Headphones,
  Laptop,
  PlayCircle,
  QrCode,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  UploadCloud,
} from 'lucide-react';
import { aiSupportCentreService } from '../../../services/aiSupportCentreService';
import { collegeErpService } from '../../../services/collegeErpService';
import { engagementService } from '../../../services/engagementService';
import { examAssessmentService } from '../../../services/examAssessmentService';
import {
  downloadStudentDocument,
  studentPortalService,
  StudentPortalSection,
} from '../../../services/studentPortalService';
import { SupportTicketCategory } from '../../../types/aiSupportCentre';
import StudentEventsPanel from './StudentEventsPanel';

export type MobileCompanionTab =
  | 'today'
  | 'learning'
  | 'assignments'
  | 'documents'
  | 'assessments'
  | 'events'
  | 'support'
  | 'alerts-pay';

interface MobileStudentCompanionProps {
  headerBlock: React.ReactNode;
  initialTab?: MobileCompanionTab;
  onNavigate: (section: StudentPortalSection) => void;
  onNotify: (type: 'ok' | 'err', message: string) => void;
  onRefresh: () => void;
  onSwitchPortal?: (role: string) => void;
}

const WEEK_DAYS = [
  { key: 'Monday', short: 'MON', dateNum: '17' },
  { key: 'Tuesday', short: 'TUE', dateNum: '18' },
  { key: 'Wednesday', short: 'WED', dateNum: '19' },
  { key: 'Thursday', short: 'THU', dateNum: '20' },
  { key: 'Friday', short: 'FRI', dateNum: '21' },
];

const COMPANION_TABS: {
  id: MobileCompanionTab;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}[] = [
  { id: 'today', label: 'Today', icon: CalendarDays },
  { id: 'learning', label: 'Learn & Library', icon: BookOpen },
  { id: 'assignments', label: 'Assignments', icon: UploadCloud },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'assessments', label: 'Assessments', icon: FileCheck2 },
  { id: 'events', label: 'Events & QR', icon: CalendarDays },
  { id: 'support', label: 'Support', icon: Headphones },
  { id: 'alerts-pay', label: 'Alerts & Pay', icon: CreditCard },
];

function RingStat({
  percent,
  label,
  valueText,
  strokeClass,
  caption,
}: {
  percent: number;
  label: string;
  valueText: string;
  strokeClass: string;
  caption: string;
}) {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  const dashOffset = 100 - safePercent;
  return (
    <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center gap-3.5 shadow-2xs">
      <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 36 36" className="w-14 h-14 -rotate-90" aria-hidden="true">
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            strokeWidth="3.2"
            className="stroke-slate-200 dark:stroke-slate-800"
          />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            strokeWidth="3.2"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            className={strokeClass}
          />
        </svg>
        <span className="absolute text-xs font-extrabold font-mono tabular-nums text-[var(--text-primary)]">
          {safePercent}%
        </span>
      </div>
      <div className="min-w-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
          {label}
        </span>
        <strong className="text-base font-extrabold text-[var(--text-primary)] block truncate">
          {valueText}
        </strong>
        <span className="text-[11px] text-slate-600 dark:text-slate-300 block truncate">
          {caption}
        </span>
      </div>
    </div>
  );
}

export default function MobileStudentCompanion({
  headerBlock,
  initialTab = 'today',
  onNavigate,
  onNotify,
  onRefresh,
  onSwitchPortal,
}: MobileStudentCompanionProps) {
  const [activeTab, setActiveTab] = useState<MobileCompanionTab>(initialTab);
  const state = studentPortalService.getState();
  const fin = studentPortalService.getFinancialSummary();
  const resources = studentPortalService.getStaticResources();
  const engState = engagementService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  // Today & QR Check-in
  const [selectedDay, setSelectedDay] = useState<string>('Monday');
  const [qrUnit, setQrUnit] = useState(state.units[0]?.code ?? 'CSC 301');
  const [qrCode, setQrCode] = useState('');

  // Learning & Library
  const [libraryQuery, setLibraryQuery] = useState('');

  // Assignments
  const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(
    state.assignments.find((a) => a.status === 'PENDING')?.id ?? null
  );
  const [assignmentNote, setAssignmentNote] = useState('');
  const [assignmentFile, setAssignmentFile] = useState<{ fileName: string; fileSize: string } | null>(null);

  // Documents upload
  const [docType, setDocType] = useState('KCSE Result Slip / Certificate');
  const [docFileName, setDocFileName] = useState('');
  const [docFileSize, setDocFileSize] = useState<string | undefined>(undefined);

  // Support
  const [supportCategory, setSupportCategory] = useState<SupportTicketCategory>('PORTAL_TECH');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportDesc, setSupportDesc] = useState('');

  // Notifications & M-Pesa
  const [alertsFilter, setAlertsFilter] = useState<'ALL' | 'UNREAD'>('ALL');
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [mpesaAmount, setMpesaAmount] = useState(String(fin.balance > 0 ? fin.balance : 5000));
  const [mpesaBusy, setMpesaBusy] = useState(false);

  const unreadAlerts = engState.notifications.filter((n) => !n.read);
  const dayClasses = state.units.filter((u) => u.day === selectedDay);
  const erpBooks = collegeErpService.getState().books;
  const myLoans = collegeErpService.getLoansForStudent(regNo);
  const myTickets = aiSupportCentreService.getState().tickets.filter((t) => t.requesterUserId === 'stu-001');
  const assessments = examAssessmentService.getState().assessments;

  const filteredBooks = erpBooks.filter(
    (b) =>
      !libraryQuery.trim() ||
      b.title.toLowerCase().includes(libraryQuery.toLowerCase()) ||
      b.author.toLowerCase().includes(libraryQuery.toLowerCase()) ||
      b.category.toLowerCase().includes(libraryQuery.toLowerCase())
  );

  const filteredNotifications =
    alertsFilter === 'UNREAD' ? unreadAlerts : engState.notifications;

  const resolveNotificationTarget = (category: string, title: string): StudentPortalSection => {
    const t = title.toLowerCase();
    if (category === 'FINANCE' || t.includes('fee') || t.includes('receipt')) return 'finance';
    if (category === 'CAREERS' || t.includes('attachment')) return 'attachment';
    if (category === 'WELFARE' || t.includes('hostel')) return 'support';
    if (category === 'SECURITY') return 'settings';
    if (t.includes('exam') || t.includes('cat')) return 'examinations';
    return 'timetable';
  };

  return (
    <div className="space-y-5">
      {headerBlock}

      {/* Mobile Companion Top Summary Rings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <RingStat
          percent={profile.attendanceRate}
          label="Attendance"
          valueText={`${profile.attendanceRate}% Standing`}
          strokeClass="stroke-emerald-600 dark:stroke-emerald-400"
          caption={profile.attendanceRate >= 75 ? '75% Exam rule met' : 'Below 75% threshold'}
        />
        <RingStat
          percent={fin.percentPaid}
          label="Fee Clearance"
          valueText={`KES ${fin.balance.toLocaleString()}`}
          strokeClass="stroke-[#1769AA] dark:stroke-blue-400"
          caption={fin.balance === 0 ? 'Cleared for exams' : 'Pending semester balance'}
        />
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              Trimester GPA
            </span>
            <strong className="text-xl font-extrabold font-mono tabular-nums text-[var(--text-primary)]">
              {profile.gpa.toFixed(2)}
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 block">
              {state.units.length} Registered Units
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center shrink-0">
            <GraduationCap size={22} />
          </div>
        </div>
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 block">
              Mobile Alerts
            </span>
            <strong className="text-xl font-extrabold font-mono tabular-nums text-[var(--text-primary)]">
              {unreadAlerts.length} Unread
            </strong>
            <span className="text-[11px] text-slate-600 dark:text-slate-300 block">
              {state.assignments.filter((a) => a.status === 'PENDING').length} pending task(s)
            </span>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#102D50] dark:text-blue-300 flex items-center justify-center shrink-0">
            <Smartphone size={22} />
          </div>
        </div>
      </div>

      {/* Horizontal Touch-Sized Companion Module Switcher (44px+ hitboxes) */}
      <div
        role="tablist"
        aria-label="Mobile student experience modules"
        className="flex items-center gap-2 overflow-x-auto scrollview-clean pb-1"
      >
        {COMPANION_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap shrink-0 border transition-colors ${
                active
                  ? 'bg-[#102D50] text-white border-[#102D50] dark:bg-[#1769AA] dark:border-[#1769AA] shadow-sm'
                  : 'bg-[var(--surface)] text-slate-700 dark:text-slate-200 border-[var(--border-subtle)] hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.id === 'alerts-pay' && unreadAlerts.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-mono">
                  {unreadAlerts.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. TODAY MOBILE DASHBOARD & DATE SCROLLER */}
      {activeTab === 'today' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <CalendarDays size={18} className="text-[#1769AA] dark:text-blue-400" />
                <span>Mobile Timetable Companion</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('timetable')}
                className="min-h-[44px] px-2 text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
              >
                Full Week <ChevronRight size={15} />
              </button>
            </div>

            {/* Horizontal Day Scroller */}
            <div className="flex items-center gap-2 overflow-x-auto scrollview-clean pb-1">
              {WEEK_DAYS.map((d) => {
                const selected = selectedDay === d.key;
                return (
                  <button
                    key={d.key}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelectedDay(d.key)}
                    className={`min-h-[56px] min-w-[64px] px-3 py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 border transition-colors shrink-0 ${
                      selected
                        ? 'bg-[#102D50] text-white border-[#102D50] dark:bg-[#1769AA] dark:border-[#1769AA]'
                        : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span className="text-[10px] font-bold tracking-wider">{d.short}</span>
                    <strong className="text-sm font-extrabold font-mono tabular-nums">
                      {d.dateNum}
                    </strong>
                  </button>
                );
              })}
            </div>

            <div className="divide-y divide-[var(--border-subtle)]">
              {dayClasses.length === 0 ? (
                <p className="py-6 text-xs text-slate-600 dark:text-slate-300 text-center">
                  No scheduled lectures on {selectedDay}. Use this slot for library research or practical lab review.
                </p>
              ) : (
                dayClasses.map((u) => (
                  <button
                    key={u.code}
                    type="button"
                    onClick={() => onNavigate('attendance')}
                    className="w-full min-h-[64px] py-3 px-2 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-[#102D50] dark:text-blue-300 flex items-center justify-center font-mono text-xs font-extrabold shrink-0">
                        {u.code.split(' ')[0]}
                      </div>
                      <div className="min-w-0">
                        <strong className="text-sm text-[var(--text-primary)] block truncate">
                          {u.code} — {u.title}
                        </strong>
                        <span className="text-xs text-slate-600 dark:text-slate-300 inline-flex items-center gap-2">
                          <Clock size={12} /> {u.time} · {u.room}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-slate-600 dark:text-slate-300 shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Mobile Quick QR Attendance Check-In */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.checkInAttendanceCode(qrUnit, qrCode);
              if (!res.ok) return onNotify('err', res.error ?? 'Check-in failed');
              setQrCode('');
              onNotify('ok', `Mobile check-in recorded for ${qrUnit}.`);
              onRefresh();
            }}
            className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3.5 text-xs"
          >
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
              <QrCode size={17} className="text-[#1769AA] dark:text-blue-400" />
              <span>Quick QR Session Check-In</span>
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Enter your lecturer&apos;s live session code straight from your phone to mark attendance.
            </p>
            <div>
              <label htmlFor="mobile-qr-unit" className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Course Unit
              </label>
              <select
                id="mobile-qr-unit"
                value={qrUnit}
                onChange={(e) => setQrUnit(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
              >
                {state.units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="mobile-qr-code" className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Session Code
              </label>
              <input
                id="mobile-qr-code"
                type="text"
                required
                placeholder="e.g. CSC301-LAB"
                value={qrCode}
                onChange={(e) => setQrCode(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-mono uppercase"
              />
            </div>
            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#102D50] hover:bg-[#1769AA] text-white font-bold rounded-xl text-xs transition-colors"
            >
              Confirm Mobile Check-In
            </button>
          </form>
        </div>
      )}

      {/* 2. MOBILE LEARNING & DIGITAL LIBRARY */}
      {activeTab === 'learning' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Laptop size={17} className="text-[#1769AA] dark:text-blue-400" />
                <span>E-Learning Modules</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('elearning')}
                className="min-h-[44px] px-2 text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
              >
                All Notes
              </button>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {state.elearningMaterials.map((mat) => (
                <div key={mat.id} className="py-3 space-y-2 text-xs">
                  <div>
                    <p className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                      {mat.unitCode} · {mat.format.replace('_', ' ')} · {mat.durationOrSize}
                    </p>
                    <strong className="text-sm text-[var(--text-primary)] block">{mat.title}</strong>
                    <span className="text-slate-600 dark:text-slate-300">{mat.lecturerName}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        downloadStudentDocument(
                          `${mat.unitCode.replace(/\s+/g, '')}_${mat.id}.txt`,
                          `HI-TECH E-LEARNING RESOURCE\nUnit: ${mat.unitCode}\nTitle: ${mat.title}\nInstructor: ${mat.lecturerName}\n`
                        );
                        onNotify('ok', `Downloaded "${mat.title}".`);
                      }}
                      className="min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-semibold inline-flex items-center gap-1.5"
                    >
                      {mat.format === 'RECORDED_CLASS' ? <PlayCircle size={15} /> : <Download size={15} />}
                      <span>{mat.format === 'RECORDED_CLASS' ? 'Open Notes' : 'Download'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        studentPortalService.toggleELearningComplete(mat.id);
                        onRefresh();
                      }}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 ${
                        mat.completed ? 'bg-emerald-600 text-white' : 'bg-[#102D50] text-white'
                      }`}
                    >
                      <CheckCircle2 size={15} />
                      <span>{mat.completed ? 'Completed' : 'Mark Done'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <BookOpen size={17} className="text-[#1769AA] dark:text-blue-400" />
                <span>Mobile Library &amp; Loans ({myLoans.length})</span>
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('library')}
                className="min-h-[44px] px-2 text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
              >
                Full Catalogue
              </button>
            </div>
            <div className="relative">
              <Search size={15} className="absolute left-3 top-3.5 text-slate-600 dark:text-slate-300" aria-hidden="true" />
              <input
                type="search"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder="Search books, authors, or ISBN..."
                aria-label="Search library books"
                className="w-full min-h-[44px] pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
              />
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredBooks.slice(0, 4).map((b) => {
                const reserved = state.reservedBookIds.includes(b.id);
                return (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <strong className="text-sm text-[var(--text-primary)] block truncate">{b.title}</strong>
                      <span className="text-slate-600 dark:text-slate-300 block truncate">
                        {b.author} · {b.availableCopies} copy/copies free
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={reserved || b.availableCopies === 0}
                      onClick={() => {
                        const res = studentPortalService.reserveBook(b.id);
                        if (!res.ok) return onNotify('err', res.error ?? 'Could not reserve');
                        onNotify('ok', `Reserved "${b.title}" for mobile pickup.`);
                        onRefresh();
                      }}
                      className="min-h-[44px] px-3.5 py-2 bg-[#102D50] hover:bg-[#1769AA] disabled:opacity-50 text-white font-semibold rounded-xl shrink-0"
                    >
                      {reserved ? 'Reserved' : 'Reserve'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 3. MOBILE ASSIGNMENTS & SUBMISSIONS */}
      {activeTab === 'assignments' && (
        <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Coursework &amp; Mobile File Submissions
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('timetable')}
              className="min-h-[44px] px-2 text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
            >
              Timetable View
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {state.assignments.map((asg) => {
              const isOpen = expandedAssignmentId === asg.id;
              return (
                <div
                  key={asg.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                        {asg.unitCode} · Due {asg.dueLabel}
                      </p>
                      <strong className="text-sm text-[var(--text-primary)] block mt-0.5">{asg.title}</strong>
                      <span className="text-slate-600 dark:text-slate-300">Lecturer: {asg.lecturerName}</span>
                    </div>
                    <span
                      className={`font-mono font-bold shrink-0 ${
                        asg.status === 'PENDING'
                          ? 'text-amber-700 dark:text-amber-300'
                          : 'text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {asg.status}
                    </span>
                  </div>

                  {asg.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setExpandedAssignmentId(isOpen ? null : asg.id)}
                      className="w-full min-h-[44px] px-3.5 py-2 bg-[#102D50] hover:bg-[#1769AA] text-white font-bold rounded-xl inline-flex items-center justify-center gap-2"
                    >
                      <UploadCloud size={15} />
                      <span>{isOpen ? 'Hide Upload Form' : 'Submit Assignment'}</span>
                    </button>
                  )}

                  {isOpen && asg.status === 'PENDING' && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const res = studentPortalService.submitAssignment(
                          asg.id,
                          assignmentNote,
                          assignmentFile ?? undefined
                        );
                        if (!res.ok) return onNotify('err', res.error ?? 'Submission failed');
                        setExpandedAssignmentId(null);
                        setAssignmentNote('');
                        setAssignmentFile(null);
                        onNotify('ok', `Submitted "${asg.title}" from mobile workspace.`);
                        onRefresh();
                      }}
                      className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-700"
                    >
                      <input
                        type="text"
                        placeholder="Lab notes or Git link..."
                        aria-label="Mobile assignment submission note"
                        value={assignmentNote}
                        onChange={(e) => setAssignmentNote(e.target.value)}
                        className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-xl"
                      />
                      <label className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
                        <UploadCloud size={15} aria-hidden="true" />
                        <span>{assignmentFile ? assignmentFile.fileName : 'Attach Lab / PDF File'}</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.zip,.txt,.png,.jpg"
                          className="sr-only"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const sizeLabel =
                              f.size >= 1024 * 1024
                                ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                                : `${Math.max(1, Math.round(f.size / 1024))} KB`;
                            setAssignmentFile({ fileName: f.name, fileSize: sizeLabel });
                          }}
                        />
                      </label>
                      <button
                        type="submit"
                        className="w-full min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                      >
                        Confirm Submission
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. MOBILE DOCUMENT CENTRE */}
      {activeTab === 'documents' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Instant Official Downloads
            </h3>
            {[
              {
                title: 'Official Admission Letter',
                file: `Admission_Letter_${regNo.replace(/\//g, '_')}.txt`,
                body: `HI-TECH COLLEGE ADMISSION LETTER\nStudent: ${profile.fullName}\nReg No: ${regNo}\nProgramme: ${profile.programme}\nStatus: ${profile.status}\n`,
              },
              {
                title: 'Official Academic Transcript',
                file: `Official_Transcript_${regNo.replace(/\//g, '_')}.txt`,
                body: `HI-TECH COLLEGE OFFICIAL TRANSCRIPT\nStudent: ${profile.fullName} (${regNo})\nCumulative GPA: ${profile.gpa.toFixed(2)}\n`,
              },
              {
                title: 'Fee Statement & Clearance Summary',
                file: `Fee_Statement_${regNo.replace(/\//g, '_')}.txt`,
                body: `HI-TECH COLLEGE FEE STATEMENT\nBilled: KES ${fin.totalBilled}\nPaid: KES ${fin.totalPaid}\nBalance: KES ${fin.balance}\n`,
              },
              {
                title: 'Digital Student ID Verification',
                file: `Student_ID_${regNo.replace(/\//g, '_')}.txt`,
                body: `HI-TECH COLLEGE DIGITAL ID\nHolder: ${profile.fullName}\nReg No: ${regNo}\nCampus: ${profile.campus}\n`,
              },
            ].map((doc) => (
              <button
                key={doc.title}
                type="button"
                onClick={() => {
                  downloadStudentDocument(doc.file, doc.body);
                  onNotify('ok', `Downloaded ${doc.title}.`);
                }}
                className="w-full min-h-[56px] p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <div className="min-w-0">
                  <strong className="text-sm text-[var(--text-primary)] block truncate">{doc.title}</strong>
                  <span className="font-mono text-slate-600 dark:text-slate-300">{doc.file}</span>
                </div>
                <Download size={18} className="text-[#1769AA] dark:text-blue-400 shrink-0" />
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.uploadOrReplaceDocument(
                null,
                docType,
                docFileName,
                docFileSize
              );
              if (!res.ok) return onNotify('err', res.error ?? 'Upload failed');
              setDocFileName('');
              setDocFileSize(undefined);
              onNotify('ok', `Uploaded ${docType} for Registrar verification.`);
              onRefresh();
            }}
            className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                Upload Verification Document
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('documents')}
                className="min-h-[44px] px-2 text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
              >
                Document Centre
              </button>
            </div>
            <select
              aria-label="Document category"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
            >
              <option value="KCSE Result Slip / Certificate">KCSE Result Slip / Certificate</option>
              <option value="National ID / Birth Certificate">National ID / Birth Certificate</option>
              <option value="Medical Clearance Form">Medical Clearance Form</option>
              <option value="Transfer / Exemption Transcript">Transfer / Exemption Transcript</option>
            </select>
            <label className="w-full min-h-[48px] px-3 py-2 border border-dashed border-slate-400 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/70 text-slate-900 dark:text-slate-100 font-semibold rounded-xl flex items-center justify-center gap-2 cursor-pointer">
              <UploadCloud size={16} aria-hidden="true" />
              <span>{docFileName ? `${docFileName} (${docFileSize})` : 'Tap to Choose PDF or Photo'}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const sizeLabel =
                    f.size >= 1024 * 1024
                      ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.max(1, Math.round(f.size / 1024))} KB`;
                  setDocFileName(f.name);
                  setDocFileSize(sizeLabel);
                }}
              />
            </label>
            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#102D50] hover:bg-[#1769AA] text-white font-bold rounded-xl"
            >
              Submit to Registrar Queue
            </button>
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              {state.uploadedDocuments.slice(0, 3).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium text-[var(--text-primary)]">{d.docType}</span>
                  <span className="font-mono font-bold text-[#1769AA] dark:text-blue-400 shrink-0">
                    {d.verificationStatus}
                  </span>
                </div>
              ))}
            </div>
          </form>
        </div>
      )}

      {/* 5. MOBILE ASSESSMENT & EXAM ACCESS */}
      {activeTab === 'assessments' && (
        <div className="space-y-4 text-xs">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck size={17} className="text-emerald-600 dark:text-emerald-400" />
                <span>Exam Eligibility &amp; Mobile CBT Access</span>
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Attendance: <strong className="font-mono">{profile.attendanceRate}%</strong> · Fee Clearance:{' '}
                <strong className="font-mono">{fin.percentPaid}%</strong> (Balance KES {fin.balance.toLocaleString()})
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  downloadStudentDocument(
                    `Exam_Permit_${regNo.replace(/\//g, '_')}.txt`,
                    `HI-TECH COLLEGE EXAM PERMIT\nStudent: ${profile.fullName}\nReg No: ${regNo}\nCleared: ${fin.examCleared ? 'YES' : 'PENDING BALANCE'}\n`
                  );
                  onNotify('ok', 'Mobile Exam Permit downloaded.');
                }}
                className="min-h-[44px] px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-semibold rounded-xl inline-flex items-center gap-1.5"
              >
                <Download size={14} /> Exam Card
              </button>
              {onSwitchPortal && (
                <button
                  type="button"
                  onClick={() => onSwitchPortal('examination')}
                  className="min-h-[44px] px-4 py-2 bg-[#1769AA] hover:bg-[#12568E] text-white font-bold rounded-xl"
                >
                  Open CBT Runner
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {assessments.map((asm) => (
              <div
                key={asm.id}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                    {asm.unitCode} · {asm.assessmentKind} · {asm.durationMinutes} mins
                  </p>
                  <strong className="text-sm text-[var(--text-primary)] block truncate">{asm.title}</strong>
                  <span className="text-slate-600 dark:text-slate-300">Status: {asm.status}</span>
                </div>
                <button
                  type="button"
                  onClick={() => (onSwitchPortal ? onSwitchPortal('examination') : onNavigate('examinations'))}
                  className="min-h-[44px] px-3.5 py-2 bg-[#102D50] text-white font-semibold rounded-xl shrink-0"
                >
                  Open
                </button>
              </div>
            ))}
            {resources.exams.map((ex) => (
              <div
                key={ex.id}
                className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="font-mono font-bold text-slate-600 dark:text-slate-300">
                    {ex.courseCode} · {ex.examBody}
                  </p>
                  <strong className="text-sm text-[var(--text-primary)] block truncate">{ex.courseTitle}</strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    {ex.examDate} · {ex.time} · {ex.room}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('examinations')}
                  className="min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-semibold rounded-xl shrink-0"
                >
                  Details
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. MOBILE STUDENT SUPPORT */}
      {activeTab === 'support' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = aiSupportCentreService.createSupportTicket({
                role: 'STUDENT',
                category: supportCategory,
                subject: supportSubject,
                description: supportDesc,
              });
              if (!res.ok) return onNotify('err', res.error ?? 'Could not create ticket');
              setSupportSubject('');
              setSupportDesc('');
              onNotify('ok', `Mobile support ticket ${res.ticketRef} logged.`);
              onRefresh();
            }}
            className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3"
          >
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
              Create Helpdesk Ticket
            </h3>
            <select
              aria-label="Support ticket category"
              value={supportCategory}
              onChange={(e) => setSupportCategory(e.target.value as SupportTicketCategory)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
            >
              <option value="PORTAL_TECH">Portal &amp; Mobile Companion Access</option>
              <option value="EXAMS_RESULTS">Examinations, CATs &amp; Results</option>
              <option value="FEES_INVOICING">Fees, M-Pesa &amp; Receipts</option>
              <option value="LIBRARY_ELEARNING">Library &amp; E-Learning</option>
              <option value="HOSTEL_GENERAL">Hostels &amp; Student Welfare</option>
            </select>
            <input
              type="text"
              required
              placeholder="Ticket subject"
              value={supportSubject}
              onChange={(e) => setSupportSubject(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
            />
            <textarea
              rows={3}
              required
              placeholder="Describe how the student support desk can assist..."
              value={supportDesc}
              onChange={(e) => setSupportDesc(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl"
            />
            <button
              type="submit"
              className="w-full min-h-[48px] bg-[#102D50] hover:bg-[#1769AA] text-white font-bold rounded-xl inline-flex items-center justify-center gap-2"
            >
              <Send size={15} /> Submit Mobile Ticket
            </button>
          </form>

          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">
                Active Tickets ({myTickets.length})
              </h3>
              <button
                type="button"
                onClick={() => onNavigate('support')}
                className="min-h-[44px] px-2 text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
              >
                Hostels &amp; Welfare
              </button>
            </div>
            <div className="space-y-2.5">
              {myTickets.map((t) => (
                <div
                  key={t.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1"
                >
                  <div className="flex justify-between font-mono text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-[#1769AA] dark:text-blue-400">{t.ticketRef}</span>
                    <span>{t.status}</span>
                  </div>
                  <strong className="text-[var(--text-primary)] block">{t.subject}</strong>
                  <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7. MOBILE NOTIFICATIONS & LIPA NA M-PESA PAYMENTS */}
      {activeTab === 'alerts-pay' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Bell size={17} className="text-[#1769AA] dark:text-blue-400" />
                <span>Mobile Alerts ({unreadAlerts.length} unread)</span>
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setAlertsFilter(alertsFilter === 'ALL' ? 'UNREAD' : 'ALL')}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-100"
                >
                  {alertsFilter === 'ALL' ? 'Unread Only' : 'Show All'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    engagementService.markAllRead();
                    onNotify('ok', 'All mobile notifications marked read.');
                    onRefresh();
                  }}
                  className="min-h-[44px] px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-100"
                >
                  Read All
                </button>
              </div>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {filteredNotifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    engagementService.markNotificationRead(n.id);
                    onRefresh();
                    onNavigate(resolveNotificationTarget(n.category, n.title));
                  }}
                  className="w-full min-h-[60px] py-3 px-2 flex items-center justify-between gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl"
                >
                  <div className="min-w-0">
                    <p className="font-mono font-bold text-[#1769AA] dark:text-blue-400">{n.category}</p>
                    <strong className="text-sm text-[var(--text-primary)] block truncate">{n.title}</strong>
                    <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{n.message}</span>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 dark:text-slate-300 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMpesaBusy(true);
              window.setTimeout(() => {
                const res = studentPortalService.recordMpesaPayment(mpesaPhone, Number(mpesaAmount));
                setMpesaBusy(false);
                if (!res.ok) return onNotify('err', res.error ?? 'M-Pesa payment failed');
                onNotify('ok', `M-Pesa STK payment verified cleanly (${res.receiptNumber}).`);
                onRefresh();
              }, 300);
            }}
            className="bg-[var(--surface)] border border-[var(--border-subtle)] rounded-2xl p-4 sm:p-5 space-y-3.5"
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <CreditCard size={17} className="text-emerald-600 dark:text-emerald-400" />
                <span>Lipa na M-Pesa Mobile Pay</span>
              </h3>
              <span className="font-mono font-bold text-[#102D50] dark:text-blue-300">
                Bal: KES {fin.balance.toLocaleString()}
              </span>
            </div>
            <div>
              <label htmlFor="mobile-mpesa-phone" className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Safaricom M-Pesa Number
              </label>
              <input
                id="mobile-mpesa-phone"
                type="tel"
                required
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
              />
            </div>
            <div>
              <label htmlFor="mobile-mpesa-amount" className="block font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Amount (KES)
              </label>
              <input
                id="mobile-mpesa-amount"
                type="number"
                min={100}
                required
                value={mpesaAmount}
                onChange={(e) => setMpesaAmount(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={mpesaBusy}
              className="w-full min-h-[48px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl"
            >
              {mpesaBusy ? 'Sending STK Push...' : 'Send M-Pesa STK Push'}
            </button>
            <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
              {state.transactions.slice(0, 2).map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-2 font-mono">
                  <span className="text-[var(--text-primary)]">{tx.receiptNumber}</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                    KES {tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </form>
        </div>
      )}

      {activeTab === 'events' && (
        <StudentEventsPanel
          studentName={profile.fullName}
          registrationNumber={regNo}
          email={state.contact.email}
          phone={state.contact.phoneNumber}
          compact
          onNotify={onNotify}
        />
      )}
    </div>
  );
}

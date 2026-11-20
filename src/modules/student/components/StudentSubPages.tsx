import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Lock,
  Mail,
  MapPin,
  Moon,
  Printer,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sun,
  UploadCloud,
  Users,
} from 'lucide-react';
import studentAvatarUrl from '../../../assets/images/student_profile_portrait_1794587291385.jpg';
import campusHeroUrl from '../../../assets/images/campus_hero_banner_1794587290452.jpg';
import { useTheme } from '../../../context/ThemeContext';
import { aiSupportCentreService } from '../../../services/aiSupportCentreService';
import { engagementService } from '../../../services/engagementService';
import { hostelsService } from '../../../services/hostelsService';
import {
  downloadStudentDocument,
  PortalOnboardingStage,
  studentPortalService,
  StudentPortalSection,
} from '../../../services/studentPortalService';
import {
  Phase4ModuleSkeleton,
  PortalButton,
  PortalCard,
  PortalConfirmDialog,
  PortalEmptyState,
  PortalPageHeader,
  PortalStatus,
  PortalToolbar,
  SkeletonCardList,
} from '../../../components/ui/PortalUI';
import { SupportTicketCategory } from '../../../types/aiSupportCentre';
import { SupportRequestCategory } from '../../../types/hostels';
import StudentAcademicExtras from './StudentAcademicExtras';
import CloudSqlAcademicRegistrationCard from './CloudSqlAcademicRegistrationCard';
import MobileStudentCompanion, { MobileCompanionTab } from './MobileStudentCompanion';
import StudentEventsPanel from './StudentEventsPanel';
import StudentExamDashboard from '../pages/exams/StudentExamDashboard';
import MyAssessmentsPage from '../pages/exams/MyAssessmentsPage';
import AssignmentsPage from '../pages/exams/AssignmentsPage';
import ExamTimetablePage from '../pages/exams/ExamTimetablePage';
import OnlineExamsPage from '../pages/exams/OnlineExamsPage';
import PracticalAssessmentsPage from '../pages/exams/PracticalAssessmentsPage';
import ResultsPage from '../pages/exams/ResultsPage';
import ExamClearancePage from '../pages/exams/ExamClearancePage';
import AssessmentHistoryPage from '../pages/exams/AssessmentHistoryPage';
import AppealsPage from '../pages/exams/AppealsPage';
import AcademicProgressPage from '../pages/exams/AcademicProgressPage';
import type { ExamSession } from '../exams/secure/examTypes';

interface StudentSubPagesProps {
  activeSection: StudentPortalSection;
  mobileInitialTab?: MobileCompanionTab;
  onBackToDashboard: () => void;
  onNavigate: (section: StudentPortalSection) => void;
  onNotify: (type: 'ok' | 'err', message: string) => void;
  onRefresh: () => void;
  onSwitchPortal?: (role: string) => void;
  onLaunchSecureExam?: (session: ExamSession) => void;
}

const SECTION_META: Record<Exclude<StudentPortalSection, 'dashboard'>, { title: string; subtitle: string }> = {
  profile: {
    title: 'My Student Profile',
    subtitle: 'Official student identity record, personal contacts, and Next of Kin details',
  },
  programme: {
    title: 'My Programme & Onboarding Status',
    subtitle: 'School of Computing & Informatics degree structure, credits, and admission verification',
  },
  'academic-progress': {
    title: 'Academic Progress & GPA Summary',
    subtitle: 'Cumulative credit hours, attendance compliance, and semester standing',
  },
  'course-registration': {
    title: 'Course Registration & Unit Changes',
    subtitle: 'Active Semester 1 course units and Registrar unit add/drop requests',
  },
  timetable: {
    title: 'Weekly Class Timetable & Assignments',
    subtitle: 'Scheduled lecture halls, laboratories, and upcoming coursework deadlines',
  },
  calendar: {
    title: 'Academic Calendar & Deadlines',
    subtitle: 'Key Trimester dates, CAT schedules, assignment deadlines, and campus events',
  },
  attendance: {
    title: 'Class Attendance & QR Check-In',
    subtitle: 'Unit attendance standing (75% exam rule) and live lecture session code check-in',
  },
  elearning: {
    title: 'E-Learning & Course Materials',
    subtitle: 'Downloadable lecture notes, recorded classes, and practical lab manuals',
  },
  examinations: {
    title: 'Exams & Assessments Overview',
    subtitle: 'Scheduled internal, KNEC & TVET CDACC assessments, CATs, and exam clearance status',
  },
  'exams-assessments': {
    title: 'My Assessments',
    subtitle: 'All CATs, midterms, practicals, assignments, quizzes, and formal exams',
  },
  'exams-assignments': {
    title: 'Assignments & Coursework',
    subtitle: 'Upload lab reports, project deliverables, and coursework submissions before deadline',
  },
  'exams-timetable': {
    title: 'Examination Timetable',
    subtitle: 'Confirmed sittings, venues, seat numbers, and examination rules',
  },
  'exams-online': {
    title: 'Online Exams (CBT Sessions)',
    subtitle: 'Timed computer-based tests with server-clock autosave and anonymous marking',
  },
  'exams-practical': {
    title: 'Practical Assessments',
    subtitle: 'Laboratory checklists, TVET CDACC competencies, and evidence uploads',
  },
  'exams-results': {
    title: 'Results & Grades',
    subtitle: 'CAT marks, released CBT scripts, final grades, and verified transcripts',
  },
  'exams-clearance': {
    title: 'Exam Clearance & Permit',
    subtitle: '75% attendance rule, fee balance clearance, library sign-off, and official Exam Card',
  },
  'exams-history': {
    title: 'Assessment History',
    subtitle: 'Completed coursework, graded CATs, mock sittings, and archived term results',
  },
  'exams-appeals': {
    title: 'Appeals & Remarking',
    subtitle: 'Submit formal CAT/exam grade remarking, special exam, or attendance appeals',
  },
  'exams-progress': {
    title: 'Certificates & Academic Progress',
    subtitle: 'Cumulative GPA, semester credits earned, and verified institutional certificates',
  },
  results: {
    title: 'Results & Grades',
    subtitle: 'Registrar-approved marks and verified academic transcripts (read-only student record)',
  },
  finance: {
    title: 'Fees, Lipa na M-Pesa & Statements',
    subtitle: 'Live fee balance, online M-Pesa STK settlement, and verified receipts',
  },
  receipts: {
    title: 'Verified Payment Receipts',
    subtitle: 'Immutable tuition payment receipts and downloadable financial statement',
  },
  library: {
    title: 'Digital Library, Loans & E-Resources',
    subtitle: 'Search physical holdings, reserve books for pickup, and download PDF manuals',
  },
  attachment: {
    title: 'Industrial Attachment & Careers',
    subtitle: 'Placement details, intro letter downloads, weekly digital logbook, and career board',
  },
  clearance: {
    title: 'Multi-Department Student Clearance',
    subtitle: 'Finance, library, laboratories, hostels, dean, and academic registry sign-off status',
  },
  'campus-life': {
    title: 'Campus Clubs, Events & SRC Voting',
    subtitle: 'Student societies, campus activity RSVP, and anonymous SRC secret ballot voting',
  },
  events: {
    title: 'Campus Events, Passes & Certificates',
    subtitle: 'Browse college workshops, one-click RSVP, view QR entry passes, rate events, and download certificates',
  },
  'student-id': {
    title: 'Digital Student Identification Card',
    subtitle: 'Accepted at campus security gates, computer labs, library desk, and exam halls',
  },
  documents: {
    title: 'Official Student Documents & Uploads',
    subtitle: 'Download certified letters and upload/replace Registrar verification documents',
  },
  appeals: {
    title: 'Academic Appeals & Remarking',
    subtitle: 'Submit formal grade remarking, attendance correction, fee waiver, or missed exam reviews',
  },
  support: {
    title: 'Student Support, Hostels & Welfare',
    subtitle: 'Helpdesk tickets, direct lecturer messaging, hostel applications, and counselling',
  },
  notifications: {
    title: 'Notifications Center',
    subtitle: 'Academic alerts, financial receipts, and security updates',
  },
  settings: {
    title: 'Account Security & Guardian Linking',
    subtitle: 'Manage MFA, password rotation, revocable parent consent links, and security history',
  },
  'college-information': {
    title: 'HI-TECH College Campus Directory',
    subtitle: 'Nairobi Main Campus facilities, laboratories, operating hours, and student handbook',
  },
  'mobile-companion': {
    title: 'Mobile Student Companion',
    subtitle: 'Touch-first schedule, e-learning, library, assignments, documents, exams, support & M-Pesa',
  },
};

export default function StudentSubPages({
  activeSection,
  mobileInitialTab,
  onBackToDashboard,
  onNavigate,
  onNotify,
  onRefresh,
  onSwitchPortal,
  onLaunchSecureExam,
}: StudentSubPagesProps) {
  const { theme, setTheme, textScale, setTextScale, reducedMotion, setReducedMotion } = useTheme();
  const state = studentPortalService.getState();
  const fin = studentPortalService.getFinancialSummary();
  const resources = studentPortalService.getStaticResources();
  const engState = engagementService.getState();
  const hostelsState = hostelsService.getState();
  const profile = state.profile;
  const regNo = profile.registrationNumber;

  // Profile state
  const [contactForm, setContactForm] = useState(state.contact);
  const [profileFieldErrors, setProfileFieldErrors] = useState<Record<string, string>>({});

  // Course change & academic leave / deferment state
  const [unitChangeForm, setUnitChangeForm] = useState({
    action: 'ADD' as 'ADD' | 'DROP' | 'SWAP',
    unitCode: 'AI 310 — Applied Machine Learning',
    reason: '',
  });
  const [defermentForm, setDefermentForm] = useState({
    type: 'ACADEMIC_LEAVE' as 'ACADEMIC_LEAVE' | 'DEFERMENT' | 'CAMPUS_TRANSFER',
    targetSemester: '2026 / Semester 2',
    reason: '',
  });

  // Timetable & assignment submission state
  const [dayFilter, setDayFilter] = useState<string>('ALL');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState<{ fileName: string; fileSize: string } | null>(null);

  // M-Pesa payment state
  const [mpesaPhone, setMpesaPhone] = useState('0712345678');
  const [mpesaAmount, setMpesaAmount] = useState(String(fin.balance > 0 ? fin.balance : 5000));
  const [mpesaPending, setMpesaPending] = useState(false);

  // Library search
  const [libraryQuery, setLibraryQuery] = useState('');

  // Documents search & upload state
  const [docSearch, setDocSearch] = useState('');
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [replaceDocId, setReplaceDocId] = useState<string | null>(null);
  const [uploadDocType, setUploadDocType] = useState('KCSE Result Slip / Certificate');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadFileSize, setUploadFileSize] = useState<string | undefined>(undefined);

  // Phase 4 module transition & refresh skeleton states
  const PHASE_4_SECTIONS = new Set<StudentPortalSection>([
    'examinations',
    'results',
    'timetable',
    'calendar',
    'library',
    'documents',
    'notifications',
    'appeals',
    'finance',
    'receipts',
    'course-registration',
    'mobile-companion',
  ]);
  const [phase4Transitioning, setPhase4Transitioning] = useState(false);
  const [syncingSection, setSyncingSection] = useState<StudentPortalSection | null>(null);
  const [docsRefreshing, setDocsRefreshing] = useState(false);

  useEffect(() => {
    if (reducedMotion || !PHASE_4_SECTIONS.has(activeSection)) {
      setPhase4Transitioning(false);
      return;
    }
    setPhase4Transitioning(true);
    const timer = window.setTimeout(() => {
      setPhase4Transitioning(false);
    }, 160);
    return () => window.clearTimeout(timer);
  }, [activeSection, reducedMotion]);

  const triggerSectionSync = (section: StudentPortalSection, notice: string) => {
    setSyncingSection(section);
    window.setTimeout(() => {
      setSyncingSection(null);
      onRefresh();
      onNotify('ok', notice);
    }, 320);
  };

  // Support tab & forms
  const [supportTab, setSupportTab] = useState<'tickets' | 'lecturers' | 'welfare'>('tickets');
  const [ticketForm, setTicketForm] = useState<{
    category: SupportTicketCategory;
    subject: string;
    description: string;
  }>({
    category: 'EXAMS_RESULTS',
    subject: '',
    description: '',
  });
  const [msgForm, setMsgForm] = useState({
    unitCode: state.units[0]?.code ?? 'CSC 301',
    subject: '',
    body: '',
  });
  const studentHostels = hostelsState.hostels.filter((h) => h.active && h.occupancyPolicy !== 'STAFF_ONLY');
  const [hostelApp, setHostelApp] = useState({
    hostelId: studentHostels[0]?.id ?? 'hos-nrb-1',
    startDate: '2026-05-01',
    endDate: '2026-08-31',
    reason: '',
  });
  const [welfareForm, setWelfareForm] = useState<{
    category: SupportRequestCategory;
    subject: string;
    description: string;
  }>({
    category: 'COUNSELLING',
    subject: '',
    description: '',
  });

  // Settings & Guardian form
  const [newPassword, setNewPassword] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [revokeGuardianTarget, setRevokeGuardianTarget] = useState<{ id: string; parentName: string } | null>(null);

  if (activeSection === 'dashboard') return null;

  const meta = SECTION_META[activeSection];

  const SectionShellHeader = (rightAction?: React.ReactNode) => (
    <PortalPageHeader
      title={meta.title}
      description={meta.subtitle}
      breadcrumbSection={`STUDENT PORTAL / ${meta.title.toUpperCase()}`}
    >
      <PortalButton variant="secondary" onClick={onBackToDashboard}>
        <ArrowLeft size={15} /> Dashboard
      </PortalButton>
      {rightAction}
    </PortalPageHeader>
  );

  if (
    activeSection === 'attendance' ||
    activeSection === 'elearning' ||
    activeSection === 'attachment' ||
    activeSection === 'campus-life'
  ) {
    return (
      <StudentAcademicExtras
        activeSection={activeSection}
        headerBlock={SectionShellHeader()}
        onNotify={onNotify}
        onRefresh={onRefresh}
      />
    );
  }

  if (
    PHASE_4_SECTIONS.has(activeSection) &&
    (phase4Transitioning || syncingSection === activeSection)
  ) {
    return (
      <div className="space-y-5">
        {SectionShellHeader()}
        <Phase4ModuleSkeleton section={activeSection} />
      </div>
    );
  }

  const examWorkspaceProps = {
    onNavigate,
    onNotify,
    onRefresh,
    onSwitchPortal,
    onLaunchSecureExam,
  };

  if (activeSection === 'examinations') {
    return <StudentExamDashboard {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-assessments') {
    return <MyAssessmentsPage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-assignments') {
    return <AssignmentsPage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-timetable') {
    return <ExamTimetablePage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-online') {
    return <OnlineExamsPage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-practical') {
    return <PracticalAssessmentsPage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-results' || activeSection === 'results') {
    return <ResultsPage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-clearance' || activeSection === 'clearance') {
    return <ExamClearancePage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-history') {
    return <AssessmentHistoryPage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-appeals' || activeSection === 'appeals') {
    return <AppealsPage {...examWorkspaceProps} />;
  }
  if (activeSection === 'exams-progress' || activeSection === 'academic-progress') {
    return <AcademicProgressPage {...examWorkspaceProps} />;
  }

  if (activeSection === 'mobile-companion') {
    return (
      <MobileStudentCompanion
        headerBlock={SectionShellHeader()}
        initialTab={mobileInitialTab}
        onNavigate={onNavigate}
        onNotify={onNotify}
        onRefresh={onRefresh}
        onSwitchPortal={onSwitchPortal}
      />
    );
  }

  if (activeSection === 'events') {
    return (
      <div className="space-y-5">
        {SectionShellHeader()}
        <StudentEventsPanel
          studentName={profile.fullName}
          registrationNumber={regNo}
          email={state.contact.email}
          phone={state.contact.phoneNumber}
          onNotify={onNotify}
        />
      </div>
    );
  }

  // 1. PROFILE & ONBOARDING
  if (activeSection === 'profile') {
    const completion = studentPortalService.getProfileCompletion(contactForm);
    const onboardingStages: PortalOnboardingStage[] = [
      'INVITED',
      'PENDING',
      'INCOMPLETE',
      'SUBMITTED',
      'RETURNED',
      'VERIFIED',
      'SUSPENDED',
      'GRADUATED',
    ];

    return (
      <div className="space-y-5">
        {SectionShellHeader()}

        {state.onboardingReviewerNote && (
          <div
            role={state.onboardingStage === 'RETURNED' || state.onboardingStage === 'SUSPENDED' ? 'alert' : 'status'}
            className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
              state.onboardingStage === 'RETURNED' || state.onboardingStage === 'SUSPENDED'
                ? 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                : 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
            }`}
          >
            <div>
              <strong className="font-mono uppercase block">
                Onboarding Notice · {state.onboardingStage}
              </strong>
              <span>{state.onboardingReviewerNote}</span>
            </div>
            {state.onboardingDraftSavedAt && (
              <span className="font-mono text-[11px] shrink-0">
                Draft saved {new Date(state.onboardingDraftSavedAt).toLocaleString()}
              </span>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={studentAvatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{profile.fullName}</h3>
                <p className="text-xs font-mono font-semibold text-[#0866d7] dark:text-blue-400 mt-0.5">{regNo}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{profile.programme}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  Profile &amp; Onboarding Completion
                </span>
                <span className="font-mono font-bold text-[#0866d7] dark:text-blue-400 tabular-nums">
                  {completion.percent}% ({completion.completedCount}/{completion.totalCount})
                </span>
              </div>
              <progress
                value={completion.percent}
                max={100}
                aria-label={`Profile and onboarding completion ${completion.percent} percent`}
                className="w-full h-2.5 rounded-full overflow-hidden accent-[#0866d7] bg-slate-200 dark:bg-slate-700"
              />
              {completion.missingFields.length > 0 ? (
                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                  Missing: {completion.missingFields.join(', ')}
                </p>
              ) : (
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  All required contact, Next of Kin, and document items are complete.
                </p>
              )}
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2.5 text-xs">
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">Admission Number</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{profile.admissionNumber}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">KCSE / National ID</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">{profile.nationalId}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">Department</span>
                <span className="font-medium text-slate-900 dark:text-slate-100 text-right">{profile.department}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">Campus</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{profile.campus}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">Academic Status</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">{profile.status}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-600 dark:text-slate-300">Onboarding Stage</span>
                <PortalStatus status={state.onboardingStage} />
              </div>
            </div>
          </div>

          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.submitOnboardingProfile(contactForm);
              if (!res.ok) {
                setProfileFieldErrors(res.fieldErrors ?? {});
                onNotify('err', res.error ?? 'Could not submit profile changes.');
                return;
              }
              setProfileFieldErrors({});
              onNotify('ok', 'Contact details and Next of Kin validated and submitted.');
              onRefresh();
            }}
            className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Contact, Residence &amp; Next of Kin Onboarding
              </h3>
              {state.onboardingDraftSavedAt && (
                <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300">
                  Last saved: {new Date(state.onboardingDraftSavedAt).toLocaleString()}
                </span>
              )}
            </div>

            {Object.keys(profileFieldErrors).length > 0 && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-xs text-red-900 dark:text-red-200"
              >
                Please fix the {Object.keys(profileFieldErrors).length} highlighted field(s) below before submitting. Use <strong>Save Draft</strong> if you need to pause with partial information.
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label htmlFor="profile-email" className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Student Email Address
                </label>
                <input
                  id="profile-email"
                  type="email"
                  value={contactForm.email}
                  aria-invalid={Boolean(profileFieldErrors.email)}
                  aria-describedby={profileFieldErrors.email ? 'profile-email-err' : undefined}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, email: e.target.value });
                    if (profileFieldErrors.email) setProfileFieldErrors({ ...profileFieldErrors, email: '' });
                  }}
                  className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:border-[#0866d7] ${
                    profileFieldErrors.email ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {profileFieldErrors.email && (
                  <p id="profile-email-err" className="text-red-700 dark:text-red-400 font-medium mt-1">
                    {profileFieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="profile-phone" className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Mobile Phone Number
                </label>
                <input
                  id="profile-phone"
                  type="text"
                  value={contactForm.phoneNumber}
                  aria-invalid={Boolean(profileFieldErrors.phoneNumber)}
                  aria-describedby={profileFieldErrors.phoneNumber ? 'profile-phone-err' : undefined}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, phoneNumber: e.target.value });
                    if (profileFieldErrors.phoneNumber) {
                      setProfileFieldErrors({ ...profileFieldErrors, phoneNumber: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono focus:border-[#0866d7] ${
                    profileFieldErrors.phoneNumber ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {profileFieldErrors.phoneNumber && (
                  <p id="profile-phone-err" className="text-red-700 dark:text-red-400 font-medium mt-1">
                    {profileFieldErrors.phoneNumber}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="profile-residence" className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Current Residence Address
                </label>
                <input
                  id="profile-residence"
                  type="text"
                  value={contactForm.residenceAddress}
                  aria-invalid={Boolean(profileFieldErrors.residenceAddress)}
                  aria-describedby={profileFieldErrors.residenceAddress ? 'profile-residence-err' : undefined}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, residenceAddress: e.target.value });
                    if (profileFieldErrors.residenceAddress) {
                      setProfileFieldErrors({ ...profileFieldErrors, residenceAddress: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:border-[#0866d7] ${
                    profileFieldErrors.residenceAddress ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {profileFieldErrors.residenceAddress && (
                  <p id="profile-residence-err" className="text-red-700 dark:text-red-400 font-medium mt-1">
                    {profileFieldErrors.residenceAddress}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="profile-kin-name" className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Next of Kin Full Name
                </label>
                <input
                  id="profile-kin-name"
                  type="text"
                  value={contactForm.nextOfKinName}
                  aria-invalid={Boolean(profileFieldErrors.nextOfKinName)}
                  aria-describedby={profileFieldErrors.nextOfKinName ? 'profile-kin-name-err' : undefined}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, nextOfKinName: e.target.value });
                    if (profileFieldErrors.nextOfKinName) {
                      setProfileFieldErrors({ ...profileFieldErrors, nextOfKinName: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:border-[#0866d7] ${
                    profileFieldErrors.nextOfKinName ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {profileFieldErrors.nextOfKinName && (
                  <p id="profile-kin-name-err" className="text-red-700 dark:text-red-400 font-medium mt-1">
                    {profileFieldErrors.nextOfKinName}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="profile-kin-relation" className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Next of Kin Relationship
                </label>
                <input
                  id="profile-kin-relation"
                  type="text"
                  placeholder="e.g. Mother / Guardian"
                  value={contactForm.nextOfKinRelation}
                  aria-invalid={Boolean(profileFieldErrors.nextOfKinRelation)}
                  aria-describedby={profileFieldErrors.nextOfKinRelation ? 'profile-kin-rel-err' : undefined}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, nextOfKinRelation: e.target.value });
                    if (profileFieldErrors.nextOfKinRelation) {
                      setProfileFieldErrors({ ...profileFieldErrors, nextOfKinRelation: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg focus:border-[#0866d7] ${
                    profileFieldErrors.nextOfKinRelation ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {profileFieldErrors.nextOfKinRelation && (
                  <p id="profile-kin-rel-err" className="text-red-700 dark:text-red-400 font-medium mt-1">
                    {profileFieldErrors.nextOfKinRelation}
                  </p>
                )}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="profile-kin-phone" className="block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  Next of Kin Emergency Phone
                </label>
                <input
                  id="profile-kin-phone"
                  type="text"
                  value={contactForm.nextOfKinPhone}
                  aria-invalid={Boolean(profileFieldErrors.nextOfKinPhone)}
                  aria-describedby={profileFieldErrors.nextOfKinPhone ? 'profile-kin-phone-err' : undefined}
                  onChange={(e) => {
                    setContactForm({ ...contactForm, nextOfKinPhone: e.target.value });
                    if (profileFieldErrors.nextOfKinPhone) {
                      setProfileFieldErrors({ ...profileFieldErrors, nextOfKinPhone: '' });
                    }
                  }}
                  className={`w-full px-3 py-2 border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono focus:border-[#0866d7] ${
                    profileFieldErrors.nextOfKinPhone ? 'border-red-500 dark:border-red-400' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {profileFieldErrors.nextOfKinPhone && (
                  <p id="profile-kin-phone-err" className="text-red-700 dark:text-red-400 font-medium mt-1">
                    {profileFieldErrors.nextOfKinPhone}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Official Registration Number and Programme edits require Registrar approval.
              </span>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <PortalButton
                  variant="secondary"
                  onClick={() => {
                    studentPortalService.saveOnboardingDraft(contactForm);
                    setProfileFieldErrors({});
                    onNotify('ok', 'Onboarding draft saved. You may resume later without losing progress.');
                    onRefresh();
                  }}
                >
                  Save Draft
                </PortalButton>
                <PortalButton type="submit">
                  Submit Profile for Verification
                </PortalButton>
              </div>
            </div>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <PortalCard
            title="Submission & Verification History"
            description="Chronological record of saved drafts, profile submissions, and Registrar reviews."
          >
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {state.onboardingSubmissions.map((entry) => (
                <div key={entry.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <PortalStatus status={entry.stage} />
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{entry.actor}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-200">{entry.summary}</p>
                    {entry.reviewerNote && (
                      <p className="text-amber-700 dark:text-amber-300 font-medium">Note: {entry.reviewerNote}</p>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300 shrink-0">
                    {new Date(entry.timestampIso).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </PortalCard>

          <PortalCard
            title="Onboarding Lifecycle Standing Switcher (QA Preview)"
            description="Simulate all 8 portal standing states on the Student Dashboard readiness banner."
          >
            <div className="flex flex-wrap gap-2">
              {onboardingStages.map((stage) => (
                <button
                  key={stage}
                  type="button"
                  aria-pressed={state.onboardingStage === stage}
                  onClick={() => {
                    const note =
                      stage === 'RETURNED'
                        ? 'Registrar requested clearer copy of National ID front & back and updated Next of Kin phone.'
                        : stage === 'SUSPENDED'
                        ? 'Administrative hold placed pending Academic Registry clearance interview.'
                        : undefined;
                    studentPortalService.setOnboardingStage(stage, note);
                    onNotify('ok', `Portal onboarding standing set to ${stage}.`);
                    onRefresh();
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                    state.onboardingStage === stage
                      ? 'bg-[#092c60] text-white border-[#092c60] dark:bg-blue-600 dark:border-blue-600'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {stage}
                </button>
              ))}
            </div>
          </PortalCard>
        </div>
      </div>
    );
  }

  // 2. PROGRAMME STRUCTURE
  if (activeSection === 'programme') {
    const totalCredits = state.units.reduce((acc, u) => acc + u.credits, 0);
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => onNavigate('course-registration')}
            className="px-4 py-2 bg-[#0866d7] hover:bg-[#0652b3] text-white text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
          >
            Manage Course Units
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-slate-600 dark:text-slate-300">Programme Track</span>
            <strong className="block text-base font-bold text-[#092c60] dark:text-white mt-1">{profile.programme}</strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-slate-600 dark:text-slate-300">Semester Credit Load</span>
            <strong className="block text-base font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              {totalCredits} Credits · {state.units.length} Units
            </strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-slate-600 dark:text-slate-300">Average Attendance</span>
            <strong className="block text-base font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
              {profile.attendanceRate}% (Exam Eligible)
            </strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-slate-600 dark:text-slate-300">Cumulative GPA</span>
            <strong className="block text-base font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums mt-1">
              {profile.gpa.toFixed(2)} / 4.00
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">11-Step Admission &amp; Academic Onboarding</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.onboardingSteps.map((step) => (
                <div key={step.stepNumber} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium text-slate-800 dark:text-slate-100">
                      {step.stepNumber}. {step.title}
                    </span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">{step.owner}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Enrolled Curriculum &amp; Lecturers</h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.units.map((u) => (
                <div key={u.code} className="py-3 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <p className="font-mono font-bold text-[#102D50] dark:text-blue-400">{u.code} · {u.credits} Credits</p>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{u.title}</p>
                    <p className="text-slate-600 dark:text-slate-300">{u.lecturerName}</p>
                  </div>
                  <div className="text-right font-mono tabular-nums shrink-0">
                    <strong className="text-emerald-700 dark:text-emerald-400 block">{u.attendance}% Att.</strong>
                    <span className="text-slate-600 dark:text-slate-300">Current: {u.grade ?? 'In Progress'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. COURSE REGISTRATION, NOMINAL ROLL REPORTING & ACADEMIC LEAVE
  if (activeSection === 'course-registration') {
    return (
      <div className="space-y-5">
        {SectionShellHeader()}

        {/* Live Cloud SQL Academic Registration & Fee Clearance (FEAT-016) */}
        <CloudSqlAcademicRegistrationCard onNotify={onNotify} />

        {/* Semester Nominal Roll Reporting */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
          <div>
            <p className="font-mono text-[#0866d7] font-semibold">
              NOMINAL ROLL · {profile.academicYear} · {profile.semester}
            </p>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {state.semesterReported
                ? `Semester Reporting Confirmed (${new Date(state.semesterReportedAt).toLocaleDateString()})`
                : 'Semester Nominal Roll Reporting Required'}
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              All continuing and admitted students confirm session attendance on the Academic Registry nominal roll each semester.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              studentPortalService.confirmSemesterReporting();
              onNotify('ok', `Nominal roll attendance re-confirmed for ${profile.academicYear} ${profile.semester}.`);
              onRefresh();
            }}
            className={`px-4 py-2 font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              state.semesterReported
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                : 'bg-[#092c60] text-white hover:bg-[#061f46]'
            }`}
          >
            <CheckCircle2 size={15} />
            {state.semesterReported ? 'Reported — Re-Confirm Session' : 'Confirm Semester Reporting'}
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Registered Units — {profile.academicYear} · {profile.semester}
              </h3>
              <span className="text-xs font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                {state.units.length} Active Units
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Code</th>
                    <th className="py-2.5 px-4 font-semibold">Course Title</th>
                    <th className="py-2.5 px-4 font-semibold">Lecturer</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Credits</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Attendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {state.units.map((u) => (
                    <tr key={u.code} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-4 font-mono font-bold text-[#102D50] dark:text-blue-400 whitespace-nowrap">{u.code}</td>
                      <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{u.title}</td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{u.lecturerName}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 dark:text-slate-200">{u.credits}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                        {u.attendance}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.submitUnitChangeRequest(unitChangeForm);
              if (!res.ok) return onNotify('err', res.error ?? 'Failed to submit request.');
              setUnitChangeForm({ ...unitChangeForm, reason: '' });
              onNotify('ok', 'Unit change request submitted for Registrar review.');
              onRefresh();
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Request Unit Add / Drop / Swap</h3>
            <p className="text-slate-600 dark:text-slate-300">
              Enrolled units cannot be altered directly after census date; submit a change request to the Registrar.
            </p>
            <select
              value={unitChangeForm.action}
              onChange={(e) =>
                setUnitChangeForm({ ...unitChangeForm, action: e.target.value as 'ADD' | 'DROP' | 'SWAP' })
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
            >
              <option value="ADD">Add Elective Unit</option>
              <option value="SWAP">Swap Enrolled Unit</option>
              <option value="DROP">Drop Unit</option>
            </select>
            <select
              value={unitChangeForm.unitCode}
              onChange={(e) => setUnitChangeForm({ ...unitChangeForm, unitCode: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
            >
              <option value="AI 310 — Applied Machine Learning">AI 310 — Applied Machine Learning</option>
              <option value="IOT 305 — Embedded IoT Systems">IOT 305 — Embedded IoT Systems</option>
              <option value="ENT 101 — Technology Entrepreneurship">ENT 101 — Technology Entrepreneurship</option>
            </select>
            <textarea
              rows={3}
              required
              placeholder="Academic reason for Registrar approval..."
              value={unitChangeForm.reason}
              onChange={(e) => setUnitChangeForm({ ...unitChangeForm, reason: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
            />
            <button
              type="submit"
              className="w-full py-2.5 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg"
            >
              Submit to Academic Registry
            </button>

            {state.unitChanges.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-800 dark:text-slate-100">Submitted Requests ({state.unitChanges.length})</h4>
                {state.unitChanges.map((req) => (
                  <div key={req.id} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between font-mono text-[11px]">
                      <span className="font-bold text-[#092c60] dark:text-blue-300">{req.action}</span>
                      <span className="text-amber-700 dark:text-amber-400 font-semibold">{req.status}</span>
                    </div>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-0.5">{req.unitCode}</p>
                  </div>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Academic Leave, Deferment & Campus Transfer */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-xs">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Academic Leave, Semester Deferment &amp; Campus Transfer
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mt-0.5">
              Submit formal requests to the Academic Dean and Registrar for temporary leave, intake deferment, or campus transfer.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const res = studentPortalService.submitDefermentOrTransfer(defermentForm);
              if (!res.ok) return onNotify('err', res.error ?? 'Could not submit request.');
              setDefermentForm({ ...defermentForm, reason: '' });
              onNotify('ok', 'Request forwarded to Academic Dean & Registrar.');
              onRefresh();
            }}
            className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
          >
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Request Type</label>
              <select
                value={defermentForm.type}
                onChange={(e) =>
                  setDefermentForm({
                    ...defermentForm,
                    type: e.target.value as 'ACADEMIC_LEAVE' | 'DEFERMENT' | 'CAMPUS_TRANSFER',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              >
                <option value="ACADEMIC_LEAVE">Academic Leave (1 Semester)</option>
                <option value="DEFERMENT">Semester Deferment</option>
                <option value="CAMPUS_TRANSFER">Inter-Campus Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Effective Semester / Intake</label>
              <select
                value={defermentForm.targetSemester}
                onChange={(e) => setDefermentForm({ ...defermentForm, targetSemester: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              >
                <option value="2026 / Semester 2">2026 / Semester 2 (May Intake)</option>
                <option value="2026 / Semester 3">2026 / Semester 3 (Sept Intake)</option>
                <option value="2027 / Semester 1">2027 / Semester 1 (Jan Intake)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Official Reason</label>
              <input
                type="text"
                required
                placeholder="State medical, financial, or academic reason..."
                value={defermentForm.reason}
                onChange={(e) => setDefermentForm({ ...defermentForm, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
            </div>
            <button
              type="submit"
              className="py-2 px-4 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg whitespace-nowrap"
            >
              Submit to Dean
            </button>
          </form>

          {state.defermentRequests.length > 0 && (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 border-t border-slate-100 dark:border-slate-800 pt-2">
              {state.defermentRequests.map((req) => (
                <div key={req.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-mono font-bold text-[#102D50] dark:text-blue-400">
                      {req.type.replace('_', ' ')} · {req.targetSemester}
                    </p>
                    <p className="text-slate-700 dark:text-slate-200">{req.reason}</p>
                  </div>
                  <span className="font-mono font-semibold text-amber-700 dark:text-amber-400 whitespace-nowrap">
                    {req.status.replace(/_/g, ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 4. TIMETABLE, CALENDAR & ASSIGNMENTS
  if (activeSection === 'timetable' || activeSection === 'calendar') {
    const days = ['ALL', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const filteredUnits =
      dayFilter === 'ALL' ? state.units : state.units.filter((u) => u.day === dayFilter);

    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <PortalButton variant="secondary" onClick={() => window.print()}>
            <Printer size={14} /> Print Timetable
          </PortalButton>
        )}

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarDays size={16} className="text-[#0866d7] dark:text-blue-400" /> Weekly Lecture &amp; Lab Schedule
            </h3>
            <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {days.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDayFilter(day)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors ${
                    dayFilter === day
                      ? 'bg-white dark:bg-slate-900 text-[#092c60] dark:text-white font-semibold shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {day === 'ALL' ? 'Full Week' : day}
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredUnits.map((u) => (
              <div
                key={u.code}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-mono font-bold text-[#0866d7] dark:text-blue-400">
                    {u.day} · {u.time} · {u.code}
                  </p>
                  <strong className="text-sm text-slate-900 dark:text-slate-100 block">{u.title}</strong>
                  <span className="text-slate-600 dark:text-slate-300">{u.lecturerName}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-medium shrink-0">
                  <MapPin size={14} className="text-slate-600 dark:text-slate-300" aria-hidden="true" />
                  <span>{u.room}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Submission Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Active Assignments &amp; Submissions</h3>
          <div className="space-y-3">
            {state.assignments.map((asg) => (
              <div key={asg.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/70 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-[#092c60] dark:text-blue-300 font-bold">
                      {asg.unitCode} · {asg.dueLabel} · {asg.status}
                    </p>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">{asg.title}</h4>
                    <p className="text-slate-600 dark:text-slate-300">Lecturer: {asg.lecturerName}</p>
                    {asg.attachmentName && (
                      <p className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 mt-1">
                        Attached file: {asg.attachmentName} ({asg.attachmentSize})
                      </p>
                    )}
                  </div>
                  {asg.status === 'PENDING' ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubmissionId(activeSubmissionId === asg.id ? null : asg.id);
                        setSubmissionText('');
                        setSubmissionFile(null);
                      }}
                      className="px-3.5 py-2 bg-[#0866d7] hover:bg-[#0652b3] text-white font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
                    >
                      <UploadCloud size={14} /> Submit Assignment
                    </button>
                  ) : (
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 whitespace-nowrap shrink-0">
                      {asg.scoreLabel ?? 'Submitted for Grading'}
                    </span>
                  )}
                </div>

                {activeSubmissionId === asg.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const res = studentPortalService.submitAssignment(
                        asg.id,
                        submissionText,
                        submissionFile ?? undefined
                      );
                      if (!res.ok) return onNotify('err', res.error ?? 'Submission failed');
                      setActiveSubmissionId(null);
                      setSubmissionText('');
                      setSubmissionFile(null);
                      onNotify('ok', `Assignment submitted for ${asg.unitCode}.`);
                      onRefresh();
                    }}
                    className="space-y-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Enter Git repository URL, lab summary, or note..."
                        aria-label="Assignment submission note or link"
                        value={submissionText}
                        onChange={(e) => setSubmissionText(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
                      />
                      <label className="px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-lg inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0">
                        <UploadCloud size={14} aria-hidden="true" />
                        <span>{submissionFile ? 'Replace File' : 'Attach Lab File'}</span>
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
                            setSubmissionFile({ fileName: f.name, fileSize: sizeLabel });
                          }}
                        />
                      </label>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg whitespace-nowrap shrink-0"
                      >
                        Confirm Submission
                      </button>
                    </div>
                    {submissionFile && (
                      <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                        <span className="font-mono truncate">
                          Selected: {submissionFile.fileName} ({submissionFile.fileSize})
                        </span>
                        <button
                          type="button"
                          onClick={() => setSubmissionFile(null)}
                          className="font-semibold underline shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </form>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 7. FEES, M-PESA STK PUSH & RECEIPTS
  if (activeSection === 'finance' || activeSection === 'receipts') {
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => {
              downloadStudentDocument(
                `Fee_Statement_${regNo.replace(/\//g, '_')}.txt`,
                `HI-TECH COLLEGE STUDENT FEE STATEMENT\nStudent: ${profile.fullName}\nReg No: ${regNo}\nTotal Billed: KES ${fin.totalBilled.toLocaleString()}\nTotal Paid: KES ${fin.totalPaid.toLocaleString()}\nOutstanding Balance: KES ${fin.balance.toLocaleString()}\n\n` +
                  state.transactions
                    .map((t) => `${t.receiptNumber}\t${t.paymentMethod}\t${t.referenceNumber}\tKES ${t.amount}`)
                    .join('\n')
              );
              onNotify('ok', 'Certified fee statement downloaded.');
            }}
            className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Download size={14} /> Export Statement
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-slate-600 dark:text-slate-300">Semester Total Billed</span>
            <strong className="block text-xl font-bold text-slate-900 dark:text-slate-100 font-mono tabular-nums mt-1">
              KES {fin.totalBilled.toLocaleString()}
            </strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-slate-600 dark:text-slate-300">Verified Payments ({fin.percentPaid}%)</span>
            <strong className="block text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono tabular-nums mt-1">
              KES {fin.totalPaid.toLocaleString()}
            </strong>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
            <span className="text-slate-600 dark:text-slate-300">Outstanding Balance</span>
            <strong className="block text-xl font-bold text-[#092c60] dark:text-blue-300 font-mono tabular-nums mt-1">
              KES {fin.balance.toLocaleString()}
            </strong>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setMpesaPending(true);
              const numericAmount = Number(mpesaAmount);
              window.setTimeout(() => {
                const res = studentPortalService.recordMpesaPayment(mpesaPhone, numericAmount);
                setMpesaPending(false);
                if (!res.ok) return onNotify('err', res.error ?? 'M-Pesa settlement failed.');
                const updated = studentPortalService.getFinancialSummary();
                setMpesaAmount(String(updated.balance > 0 ? updated.balance : 1000));
                onNotify('ok', `M-Pesa payment settled! Verified Receipt ${res.receiptNumber} posted.`);
                onRefresh();
              }, 500);
            }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3.5 text-xs"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" /> Lipa na M-Pesa Online (STK Push)
            </h3>
            <p className="text-slate-600 dark:text-slate-300">
              Verified callbacks post an immutable receipt immediately and update your dashboard fee balance.
            </p>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">M-Pesa Phone Number</label>
              <input
                type="text"
                required
                value={mpesaPhone}
                onChange={(e) => setMpesaPhone(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-600 dark:text-slate-300 font-medium mb-1">Amount to Pay (KES)</label>
              <input
                type="number"
                min={100}
                required
                value={mpesaAmount}
                onChange={(e) => setMpesaAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono font-bold"
              />
            </div>
            <button
              type="submit"
              disabled={mpesaPending}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg disabled:opacity-60 transition-colors"
            >
              {mpesaPending ? 'Processing M-Pesa Callback...' : 'Send M-Pesa Payment Prompt'}
            </button>
          </form>

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Verified Tuition Receipts (Read-Only Ledger)</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="py-2.5 px-4 font-semibold">Receipt</th>
                    <th className="py-2.5 px-4 font-semibold">Channel / Ref</th>
                    <th className="py-2.5 px-4 font-semibold">Description</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Amount</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {state.transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td className="py-3 px-4 font-mono font-bold text-[#102D50] dark:text-blue-400 whitespace-nowrap">{tx.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {tx.paymentMethod} · {tx.referenceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-200">{tx.description}</td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-400 whitespace-nowrap">
                        KES {tx.amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            downloadStudentDocument(
                              `${tx.receiptNumber}.txt`,
                              `HI-TECH COLLEGE OFFICIAL RECEIPT\nReceipt No: ${tx.receiptNumber}\nStudent: ${profile.fullName} (${regNo})\nAmount: KES ${tx.amount.toLocaleString()}\nChannel: ${tx.paymentMethod}\nRef: ${tx.referenceNumber}\nStatus: ${tx.status}\n`
                            );
                            onNotify('ok', `Downloaded receipt ${tx.receiptNumber}.`);
                          }}
                          className="text-[#0866d7] dark:text-blue-400 font-semibold hover:underline"
                        >
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Itemized Semester Fee Structure & Sponsorship Status */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Itemized Semester Fee Structure Invoice ({profile.academicYear} · {profile.semester})
              </h3>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                Funding Status: <strong className="text-slate-800 dark:text-slate-100">{state.sponsorshipStatus}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                downloadStudentDocument(
                  `Fee_Invoice_${regNo.replace(/\//g, '_')}.txt`,
                  `HI-TECH COLLEGE SEMESTER FEE INVOICE\nStudent: ${profile.fullName} (${regNo})\nProgramme: ${profile.programme}\nSponsorship: ${state.sponsorshipStatus}\n\n` +
                    state.feeStructure.map((f) => `${f.code}\t${f.voteHead}\tKES ${f.amount.toLocaleString()}`).join('\n') +
                    `\n\nTOTAL BILLED: KES ${fin.totalBilled.toLocaleString()}\nTOTAL PAID: KES ${fin.totalPaid.toLocaleString()}\nBALANCE DUE: KES ${fin.balance.toLocaleString()}\n`
                );
                onNotify('ok', 'Itemized semester fee invoice downloaded.');
              }}
              className="px-3.5 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Download size={14} /> Download Fee Invoice
            </button>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
              <tr>
                <th className="py-2.5 px-4 font-semibold">Vote Head</th>
                <th className="py-2.5 px-4 font-semibold">Fee Description</th>
                <th className="py-2.5 px-4 font-semibold text-right">Billed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {state.feeStructure.map((line) => (
                <tr key={line.code}>
                  <td className="py-2.5 px-4 font-mono font-bold text-[#102D50] dark:text-blue-400">{line.code}</td>
                  <td className="py-2.5 px-4 text-slate-800 dark:text-slate-200">{line.voteHead}</td>
                  <td className="py-2.5 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                    KES {line.amount.toLocaleString()}.00
                  </td>
                </tr>
              ))}
              <tr className="bg-slate-50 dark:bg-slate-800/80 font-bold text-[#092c60] dark:text-blue-300">
                <td className="py-3 px-4 font-mono">TOTAL</td>
                <td className="py-3 px-4">Approved Semester Vote Heads</td>
                <td className="py-3 px-4 text-right font-mono tabular-nums">
                  KES {fin.totalBilled.toLocaleString()}.00
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 8. DIGITAL LIBRARY
  if (activeSection === 'library') {
    const filteredBooks = resources.books.filter(
      (b) =>
        !libraryQuery.trim() ||
        b.title.toLowerCase().includes(libraryQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(libraryQuery.toLowerCase()) ||
        b.category.toLowerCase().includes(libraryQuery.toLowerCase())
    );
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 focus-within:ring-2 focus-within:ring-[#1769AA]/25">
              <Search size={14} className="text-slate-500 dark:text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={libraryQuery}
                onChange={(e) => setLibraryQuery(e.target.value)}
                placeholder="Filter library catalogue..."
                aria-label="Filter library catalogue"
                className="text-xs bg-transparent w-48 text-slate-900 dark:text-slate-100 placeholder:text-slate-600 dark:placeholder:text-slate-300"
              />
            </div>
            <PortalButton
              variant="secondary"
              onClick={() => triggerSectionSync('library', 'Library holdings and loan records synchronized.')}
            >
              <RefreshCw size={14} /> Sync Catalogue
            </PortalButton>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Physical Library Catalogue &amp; Active Loans ({resources.loans.length} Loaned)
            </h3>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredBooks.map((b) => {
                const reserved = resources.loans.some(
                  (l) => l.barcode === b.barcode && l.status === 'BORROWED'
                );
                return (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div>
                      <strong className="text-slate-900 dark:text-slate-100 block">{b.title}</strong>
                      <span className="text-slate-600 dark:text-slate-300">
                        {b.author} · {b.shelfLocation} · {b.availableCopies}/{b.totalCopies} available
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={reserved || b.availableCopies === 0}
                      onClick={() => {
                        const res = studentPortalService.reserveBook(b.id);
                        if (!res.ok) return onNotify('err', res.error ?? 'Could not reserve');
                        onNotify('ok', `Hold placed on "${b.title}" for circulation desk pickup.`);
                        onRefresh();
                      }}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 whitespace-nowrap shrink-0"
                    >
                      {reserved ? 'Borrowed / Hold' : 'Reserve Book'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Digital E-Books &amp; Lecture Manuals</h3>
            <div className="space-y-3">
              {resources.digitalResources.map((doc) => (
                <div key={doc.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <p className="font-mono text-[#0866d7] dark:text-blue-400 font-semibold">
                    {doc.type} · {doc.fileFormat} ({doc.fileSize}) · {doc.publishYear}
                  </p>
                  <strong className="text-sm text-slate-900 dark:text-slate-100 block">{doc.title}</strong>
                  <p className="text-slate-600 dark:text-slate-300">{doc.description}</p>
                  <button
                    type="button"
                    onClick={() => {
                      downloadStudentDocument(
                        `${doc.id}_digital_pack.txt`,
                        `HI-TECH DIGITAL LIBRARY\nTitle: ${doc.title}\nAuthors: ${doc.author}\nProgramme: ${doc.programme}\nSummary: ${doc.description}\n`
                      );
                      onNotify('ok', `Downloaded "${doc.title}".`);
                    }}
                    className="px-3.5 py-1.5 bg-[#092c60] hover:bg-[#061f46] text-white font-semibold rounded-lg inline-flex items-center gap-1.5"
                  >
                    <Download size={13} /> Download Resource
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 9. DIGITAL STUDENT ID CARD
  if (activeSection === 'student-id') {
    const qrCells = Array.from(
      { length: 49 },
      (_, idx) => ((idx * 7 + regNo.charCodeAt(idx % regNo.length)) % 3) !== 0
    );
    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 bg-[#092c60] hover:bg-[#061f46] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Printer size={14} /> Print Student ID
          </button>
        )}

        <div className="max-w-md bg-[#092c60] text-white rounded-2xl p-6 space-y-5 border border-blue-900">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold tracking-wide text-amber-300">HI-TECH COLLEGE AFRICA</span>
            <span className="font-mono">VALID {profile.academicYear}</span>
          </div>
          <div className="flex items-center gap-4">
            <img
              src={studentAvatarUrl}
              alt={profile.fullName}
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-xl object-cover border-2 border-amber-300 shrink-0"
            />
            <div className="space-y-1">
              <h3 className="text-lg font-bold">{profile.fullName}</h3>
              <p className="text-xs font-mono text-amber-300 font-bold">{regNo}</p>
              <p className="text-xs text-blue-100">{profile.programme}</p>
              <p className="text-xs text-blue-200">{profile.campus}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-white/15 flex items-center justify-between">
            <div className="text-[11px] font-mono text-blue-100 space-y-0.5">
              <div>ADMISSION: {profile.admissionNumber}</div>
              <div>STATUS: {profile.status}</div>
            </div>
            <div className="bg-white p-1.5 rounded-lg grid grid-cols-7 gap-0.5 shrink-0" aria-label="Student QR Verification">
              {qrCells.map((filled, idx) => (
                <span key={idx} className={`w-1.5 h-1.5 ${filled ? 'bg-[#092c60]' : 'bg-white'}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 10. DOCUMENTS & VERIFICATION UPLOADS
  if (activeSection === 'documents') {
    const officialDocs = [
      {
        title: 'Official Admission Letter',
        file: `Admission_${profile.admissionNumber}.txt`,
        body: `HI-TECH COLLEGE ADMISSION LETTER\nStudent: ${profile.fullName}\nReg No: ${regNo}\nAdmission: ${profile.admissionNumber}\nProgramme: ${profile.programme}\nCampus: ${profile.campus}`,
      },
      {
        title: 'Consolidated Fee Statement',
        file: `FeeStatement_${regNo.replace(/\//g, '_')}.txt`,
        body: `FEE STATEMENT\nStudent: ${profile.fullName} (${regNo})\nBilled: KES ${fin.totalBilled}\nPaid: KES ${fin.totalPaid}\nBalance: KES ${fin.balance}`,
      },
      {
        title: 'Semester 1 Examination Card',
        file: `ExamCard_${regNo.replace(/\//g, '_')}.txt`,
        body: `EXAMINATION PERMIT\nStudent: ${profile.fullName} (${regNo})\nAttendance: ${profile.attendanceRate}%\nBalance: KES ${fin.balance}`,
      },
      {
        title: 'Student Academic Handbook & Integrity Code',
        file: 'HITECH_Student_Handbook_2026.txt',
        body: 'HI-TECH COLLEGE ACADEMIC CODE: 75% minimum class attendance, 100% final fee clearance, zero tolerance for exam malpractice, Kenya Data Protection Act compliance.',
      },
    ];

    const filteredUploads = state.uploadedDocuments.filter(
      (d) =>
        !docSearch.trim() ||
        d.docType.toLowerCase().includes(docSearch.toLowerCase()) ||
        d.fileName.toLowerCase().includes(docSearch.toLowerCase())
    );

    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <PortalButton
            onClick={() => {
              setReplaceDocId(null);
              setShowDocUpload((v) => !v);
            }}
          >
            <UploadCloud size={15} /> {showDocUpload ? 'Close Upload Form' : 'Upload Document'}
          </PortalButton>
        )}

        {showDocUpload && (
          <PortalCard
            title={replaceDocId ? 'Replace Verification Document' : 'Upload Admission / Compliance Document'}
            description="PDF, JPG, PNG, or DOCX evidence forwarded directly to the Registrar verification queue."
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = studentPortalService.uploadOrReplaceDocument(
                  replaceDocId,
                  uploadDocType,
                  uploadFileName,
                  uploadFileSize
                );
                if (!res.ok) return onNotify('err', res.error ?? 'Upload failed');
                onNotify(
                  'ok',
                  replaceDocId
                    ? `Document "${uploadFileName}" replaced and queued for Registrar audit.`
                    : `Document "${uploadFileName}" uploaded successfully.`
                );
                setUploadFileName('');
                setUploadFileSize(undefined);
                setReplaceDocId(null);
                setShowDocUpload(false);
                onRefresh();
              }}
              className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end text-xs"
            >
              <div>
                <label htmlFor="doc-category-select" className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Document Category
                </label>
                <select
                  id="doc-category-select"
                  value={uploadDocType}
                  onChange={(e) => setUploadDocType(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
                >
                  <option value="KCSE Result Slip / Certificate">KCSE Result Slip / Certificate</option>
                  <option value="National ID / Birth Certificate">National ID / Birth Certificate</option>
                  <option value="Medical & Insurance Fitness Form">Medical &amp; Insurance Fitness Form</option>
                  <option value="Industrial Attachment Insurance Letter">Attachment Insurance Letter</option>
                </select>
              </div>
              <div>
                <label htmlFor="doc-file-picker" className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  Choose File from Device
                </label>
                <input
                  id="doc-file-picker"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const sizeLabel =
                      f.size >= 1024 * 1024
                        ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.max(1, Math.round(f.size / 1024))} KB`;
                    setUploadFileName(f.name);
                    setUploadFileSize(sizeLabel);
                  }}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:bg-[#092c60] file:text-white file:text-xs file:font-semibold"
                />
              </div>
              <div>
                <label htmlFor="doc-file-ref" className="block font-medium text-slate-600 dark:text-slate-300 mb-1">
                  File Name / Reference
                </label>
                <input
                  id="doc-file-ref"
                  type="text"
                  required
                  placeholder="e.g. KCSE_Certified_Slip_2026.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono"
                />
              </div>
              <PortalButton type="submit">
                <UploadCloud size={15} /> {replaceDocId ? 'Submit Replacement' : 'Submit to Registrar'}
              </PortalButton>
            </form>
          </PortalCard>
        )}

        <PortalCard
          title="Official Certified College Downloads"
          description="Instant official records signed for your academic registration."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {officialDocs.map((doc) => (
              <div
                key={doc.title}
                className="bg-[#F4F7FB] dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                    {doc.title}
                  </h3>
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                    {doc.file}
                  </p>
                </div>
                <PortalButton
                  onClick={() => {
                    downloadStudentDocument(doc.file, doc.body);
                    onNotify('ok', `Downloaded ${doc.title}.`);
                  }}
                >
                  <Download size={14} /> Download
                </PortalButton>
              </div>
            ))}
          </div>
        </PortalCard>

        <PortalCard
          title="Uploaded Admission & Verification Documents"
          description="Monitor Registrar verification status, download copies, or replace outdated files."
        >
          <PortalToolbar
            search={docSearch}
            onSearch={setDocSearch}
            placeholder="Filter uploaded documents by type or filename..."
            isRefreshing={docsRefreshing}
            onRefresh={() => {
              setDocsRefreshing(true);
              window.setTimeout(() => {
                setDocsRefreshing(false);
                onRefresh();
                onNotify('ok', 'Verification document queue synchronized.');
              }, 320);
            }}
            onAdd={() => {
              setReplaceDocId(null);
              setUploadFileName('');
              setUploadFileSize(undefined);
              setShowDocUpload(true);
            }}
            addLabel="Upload Document"
          />

          {docsRefreshing ? (
            <SkeletonCardList
              items={3}
              columns={1}
              showMeta
              label="Refreshing verification documents..."
            />
          ) : filteredUploads.length === 0 ? (
            <PortalEmptyState
              title="No matching documents found"
              description="Try clearing your search filter or upload a required compliance file."
              actionLabel="Upload New Document"
              onAction={() => setShowDocUpload(true)}
            />
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {filteredUploads.map((ud) => (
                <div
                  key={ud.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 min-w-0">
                    <strong className="text-sm text-slate-900 dark:text-slate-100 block truncate">
                      {ud.docType}
                    </strong>
                    <p className="font-mono text-slate-600 dark:text-slate-300">
                      {ud.fileName}
                      {ud.fileSize ? ` (${ud.fileSize})` : ''} · Uploaded {ud.uploadedAt} · {ud.verifiedBy}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <PortalStatus status={ud.verificationStatus} />
                    <PortalButton
                      variant="secondary"
                      onClick={() => {
                        downloadStudentDocument(
                          ud.fileName.endsWith('.txt') ? ud.fileName : `${ud.fileName}.txt`,
                          `HI-TECH COLLEGE VERIFICATION DOCUMENT RECORD\nStudent: ${profile.fullName} (${regNo})\nDocument Type: ${ud.docType}\nFile Name: ${ud.fileName}\nUploaded: ${ud.uploadedAt}\nStatus: ${ud.verificationStatus}\nVerified By: ${ud.verifiedBy}\n`
                        );
                        onNotify('ok', `Downloaded record for ${ud.fileName}.`);
                      }}
                    >
                      <Download size={13} /> Download
                    </PortalButton>
                    <PortalButton
                      variant="secondary"
                      onClick={() => {
                        setReplaceDocId(ud.id);
                        setUploadDocType(ud.docType);
                        setUploadFileName(ud.fileName);
                        setUploadFileSize(ud.fileSize);
                        setShowDocUpload(true);
                      }}
                    >
                      Replace
                    </PortalButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </PortalCard>
      </div>
    );
  }

  // 11. STUDENT SUPPORT, LECTURER MESSAGING & HOSTELS/WELFARE
  if (activeSection === 'support') {
    const myTickets = aiSupportCentreService.getState().tickets.filter((t) => t.requesterUserId === 'stu-001');
    const myHostelApps = hostelsState.applications.filter((a) => a.studentRegNo === regNo);
    const myAllocs = hostelsState.allocations.filter((a) => a.studentRegNo === regNo);
    const myWelfare = hostelsState.supportRequests.filter((w) => w.studentRegNo === regNo);

    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setSupportTab('tickets')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                supportTab === 'tickets'
                  ? 'bg-white dark:bg-slate-900 text-[#092c60] dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Helpdesk Tickets
            </button>
            <button
              type="button"
              onClick={() => setSupportTab('lecturers')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                supportTab === 'lecturers'
                  ? 'bg-white dark:bg-slate-900 text-[#092c60] dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Message Lecturer
            </button>
            <button
              type="button"
              onClick={() => setSupportTab('welfare')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
                supportTab === 'welfare'
                  ? 'bg-white dark:bg-slate-900 text-[#092c60] dark:text-white font-semibold shadow-sm'
                  : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Hostels &amp; Welfare
            </button>
          </div>
        )}

        {supportTab === 'tickets' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = aiSupportCentreService.createSupportTicket({
                  role: 'STUDENT',
                  category: ticketForm.category,
                  subject: ticketForm.subject,
                  description: ticketForm.description,
                });
                if (!res.ok) return onNotify('err', res.error ?? 'Could not create ticket');
                setTicketForm({ ...ticketForm, subject: '', description: '' });
                onNotify('ok', `Support ticket ${res.ticketRef} created cleanly.`);
                onRefresh();
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Raise Student Helpdesk Ticket</h3>
              <select
                value={ticketForm.category}
                onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value as SupportTicketCategory })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              >
                <option value="EXAMS_RESULTS">Examinations, CATs &amp; Results</option>
                <option value="FEES_INVOICING">Finance, Invoicing &amp; Fee Receipt</option>
                <option value="LIBRARY_ELEARNING">Digital Library &amp; E-Learning</option>
                <option value="PORTAL_TECH">Portal &amp; Technical Access</option>
                <option value="ACCOUNT_ACCESS">Account &amp; Password Access</option>
                <option value="HOSTEL_GENERAL">Hostel &amp; Student Services</option>
                <option value="DOCUMENTS">Letters &amp; Official Documents</option>
              </select>
              <input
                type="text"
                required
                placeholder="Ticket subject"
                value={ticketForm.subject}
                onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
              <textarea
                rows={3}
                required
                placeholder="Describe your request clearly..."
                value={ticketForm.description}
                onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg">
                Submit Support Ticket
              </button>
            </form>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">My Active Support Tickets ({myTickets.length})</h3>
              {myTickets.map((t) => (
                <div key={t.id} className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1">
                  <div className="flex justify-between font-mono text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-[#092c60] dark:text-blue-300">{t.ticketRef}</span>
                    <span>{t.status} · Priority {t.priority}</span>
                  </div>
                  <strong className="text-slate-900 dark:text-slate-100 block">{t.subject}</strong>
                  <p className="text-slate-600 dark:text-slate-300">{t.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {supportTab === 'lecturers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = studentPortalService.sendLecturerMessage(msgForm.unitCode, msgForm.subject, msgForm.body);
                if (!res.ok) return onNotify('err', res.error ?? 'Could not send message');
                setMsgForm({ ...msgForm, subject: '', body: '' });
                onNotify('ok', `Message sent to ${msgForm.unitCode} lecturer.`);
                onRefresh();
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Message Unit Lecturer</h3>
              <select
                value={msgForm.unitCode}
                onChange={(e) => setMsgForm({ ...msgForm, unitCode: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              >
                {state.units.map((u) => (
                  <option key={u.code} value={u.code}>
                    {u.code} — {u.lecturerName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                required
                placeholder="Subject"
                value={msgForm.subject}
                onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
              <textarea
                rows={3}
                required
                placeholder="Write your academic message..."
                value={msgForm.body}
                onChange={(e) => setMsgForm({ ...msgForm, body: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
              <button
                type="submit"
                className="w-full py-2 bg-[#092c60] text-white font-semibold rounded-lg inline-flex items-center justify-center gap-1.5"
              >
                <Send size={13} /> Send Message
              </button>
            </form>

            <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
              {state.messages.map((m) => (
                <div key={m.id} className="p-4 space-y-1 text-xs">
                  <div className="flex justify-between font-mono text-slate-600 dark:text-slate-300">
                    <span>
                      {m.direction === 'OUTBOUND' ? `To ${m.recipientName}` : `From ${m.recipientName}`} · {m.unitCode}
                    </span>
                    <span>{new Date(m.sentAt).toLocaleDateString()}</span>
                  </div>
                  <strong className="text-sm text-slate-900 dark:text-slate-100 block">{m.subject}</strong>
                  <p className="text-slate-600 dark:text-slate-300">{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {supportTab === 'welfare' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = hostelsService.submitApplication({
                  studentRegNo: regNo,
                  studentName: profile.fullName,
                  branch: profile.campus,
                  hostelId: hostelApp.hostelId,
                  startDate: hostelApp.startDate,
                  endDate: hostelApp.endDate,
                  reason: hostelApp.reason,
                });
                if (!res.ok) return onNotify('err', res.error ?? 'Application rejected');
                setHostelApp({ ...hostelApp, reason: '' });
                onNotify('ok', 'Hostel accommodation application submitted cleanly.');
                onRefresh();
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Apply for Campus Accommodation</h3>
              <select
                value={hostelApp.hostelId}
                onChange={(e) => setHostelApp({ ...hostelApp, hostelId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              >
                {studentHostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.branch} · {h.occupancyPolicy})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="date"
                  value={hostelApp.startDate}
                  onChange={(e) => setHostelApp({ ...hostelApp, startDate: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                />
                <input
                  type="date"
                  value={hostelApp.endDate}
                  onChange={(e) => setHostelApp({ ...hostelApp, endDate: e.target.value })}
                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg font-mono"
                />
              </div>
              <textarea
                rows={2}
                required
                placeholder="Room preference or medical/proximity note..."
                value={hostelApp.reason}
                onChange={(e) => setHostelApp({ ...hostelApp, reason: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg">
                Submit Hostel Application
              </button>

              {(myAllocs.length > 0 || myHostelApps.length > 0) && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  {myAllocs.map((al) => {
                    const hostel = hostelsState.hostels.find((h) => h.id === al.hostelId);
                    const room = hostelsState.rooms.find((r) => r.id === al.roomId);
                    const bed = hostelsState.beds.find((b) => b.id === al.bedId);
                    return (
                      <div key={al.id} className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                        <strong>
                          {hostel?.name ?? al.hostelId} · Room {room?.roomCode ?? al.roomId} · Bed {bed?.bedCode ?? al.bedId}
                        </strong>
                        <span className="block font-mono text-[11px]">{al.status} · {al.startDate} to {al.endDate}</span>
                      </div>
                    );
                  })}
                  {myHostelApps.map((ap) => (
                    <div key={ap.id} className="flex justify-between py-1 font-mono text-[11px] text-slate-700 dark:text-slate-200">
                      <span>{ap.reference}</span>
                      <span className="text-[#0866d7] dark:text-blue-400 font-bold">{ap.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                hostelsService.submitSupportRequest({
                  studentRegNo: regNo,
                  studentName: profile.fullName,
                  branch: profile.campus,
                  category: welfareForm.category,
                  explicitSensitive: true,
                  subject: welfareForm.subject,
                  description: welfareForm.description,
                });
                setWelfareForm({ ...welfareForm, subject: '', description: '' });
                onNotify('ok', 'Confidential welfare request sent to Student Services.');
                onRefresh();
              }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3 text-xs"
            >
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Confidential Counselling &amp; Welfare</h3>
              <select
                value={welfareForm.category}
                onChange={(e) => setWelfareForm({ ...welfareForm, category: e.target.value as SupportRequestCategory })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              >
                <option value="COUNSELLING">Confidential Counselling Appointment</option>
                <option value="ACCOMMODATION_WELFARE">Accommodation &amp; Residence Welfare</option>
                <option value="FINANCIAL_AID">Financial Aid / Bursary Support</option>
                <option value="HEALTH_REFERRAL">Health &amp; Medical Referral</option>
                <option value="GENERAL_SUPPORT">General Welfare Support</option>
              </select>
              <input
                type="text"
                required
                placeholder="Confidential request subject"
                value={welfareForm.subject}
                onChange={(e) => setWelfareForm({ ...welfareForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
              <textarea
                rows={2}
                required
                placeholder="Private note for college counsellor..."
                value={welfareForm.description}
                onChange={(e) => setWelfareForm({ ...welfareForm, description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-lg"
              />
              <button type="submit" className="px-4 py-2 bg-[#092c60] text-white font-semibold rounded-lg">
                Submit Confidential Request
              </button>

              {myWelfare.length > 0 && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                  {myWelfare.map((w) => (
                    <div key={w.id} className="flex justify-between font-mono text-[11px] text-slate-700 dark:text-slate-200">
                      <span>{w.caseRef} · {w.subject}</span>
                      <span className="font-bold text-[#092c60] dark:text-blue-300">{w.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    );
  }

  // 12. NOTIFICATIONS CENTER
  if (activeSection === 'notifications') {
    const getNotificationTarget = (category: string, title: string): StudentPortalSection => {
      const lower = title.toLowerCase();
      if (category === 'FINANCE' || lower.includes('fee') || lower.includes('receipt')) return 'finance';
      if (category === 'CAREERS' || lower.includes('attachment')) return 'attachment';
      if (category === 'WELFARE' || lower.includes('hostel')) return 'support';
      if (category === 'SECURITY') return 'settings';
      if (lower.includes('exam') || lower.includes('cat') || lower.includes('practical')) return 'examinations';
      return 'timetable';
    };

    return (
      <div className="space-y-5">
        {SectionShellHeader(
          <div className="flex flex-wrap items-center gap-2">
            <PortalButton
              variant="secondary"
              onClick={() => triggerSectionSync('notifications', 'Notifications feed synchronized.')}
            >
              <RefreshCw size={14} /> Refresh
            </PortalButton>
            <button
              type="button"
              onClick={() => {
                engagementService.markAllRead();
                onNotify('ok', 'All notifications marked read.');
                onRefresh();
              }}
              className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0"
            >
              Mark All Read
            </button>
          </div>
        )}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
          {engState.notifications.map((n) => {
            const targetSection = getNotificationTarget(n.category, n.title);
            return (
              <div key={n.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div>
                  <p className="font-mono text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-[#1769AA] dark:text-blue-400">{n.category}</span> ·{' '}
                    {new Date(n.createdAt).toLocaleString()}
                  </p>
                  <strong
                    className={`block mt-0.5 text-sm ${
                      n.read ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {n.title}
                  </strong>
                  <p className="text-slate-600 dark:text-slate-300 mt-0.5">{n.message}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      engagementService.markNotificationRead(n.id);
                      onRefresh();
                      onNavigate(targetSection);
                    }}
                    className="px-3 py-1.5 bg-[#102D50] hover:bg-[#1769AA] text-white rounded-lg font-semibold whitespace-nowrap"
                  >
                    Open Section
                  </button>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => {
                        engagementService.markNotificationRead(n.id);
                        onRefresh();
                      }}
                      className="px-3 py-1.5 border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg font-semibold whitespace-nowrap"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 13. SETTINGS, APPEARANCE, GUARDIAN LINKING & AUDIT LOG
  if (activeSection === 'settings') {
    return (
      <div className="space-y-5">
        {SectionShellHeader()}

        {/* Appearance Theme, Text Scale & Motion Card */}
        <PortalCard
          title="Portal Appearance & Accessibility"
          description="Switch cleanly between Light and Dark themes, adjust reading text scale, or reduce motion animations across all modules."
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                aria-pressed={theme === 'light'}
                onClick={() => setTheme('light')}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  theme === 'light'
                    ? 'border-[#1769AA] bg-[#eef4fd] text-[#102D50]'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-[#E8B44A] border border-slate-200 flex items-center justify-center">
                    <Sun size={18} />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold">Light Mode</strong>
                    <span className="text-[11px] opacity-85">Bright crisp university workspace</span>
                  </div>
                </div>
                {theme === 'light' && <PortalStatus status="Approved" />}
              </button>

              <button
                type="button"
                aria-pressed={theme === 'dark'}
                onClick={() => setTheme('dark')}
                className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  theme === 'dark'
                    ? 'border-[#1769AA] bg-slate-800 text-white'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#102D50] text-[#E8B44A] flex items-center justify-center">
                    <Moon size={18} />
                  </div>
                  <div>
                    <strong className="block text-sm font-bold">Dark Mode</strong>
                    <span className="text-[11px] opacity-85">Reduced-glare evening study theme</span>
                  </div>
                </div>
                {theme === 'dark' && <PortalStatus status="Approved" />}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <strong className="block text-slate-900 dark:text-white">Portal Text Size</strong>
                  <span className="text-slate-600 dark:text-slate-300">Adjust base reading scale</span>
                </div>
                <div className="inline-flex items-center gap-1 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {(
                    [
                      { id: 'standard', label: 'Standard' },
                      { id: 'comfortable', label: 'Comfortable' },
                      { id: 'large', label: 'Large' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      aria-pressed={textScale === opt.id}
                      onClick={() => {
                        setTextScale(opt.id);
                        onNotify('ok', `Text scale updated to ${opt.label}.`);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors ${
                        textScale === opt.id
                          ? 'bg-[#102D50] text-white'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 cursor-pointer">
                <span>
                  <strong className="block text-slate-900 dark:text-white">Reduce Portal Motion</strong>
                  <span className="text-slate-600 dark:text-slate-300">
                    Disable smooth scrolling and UI transitions for accessibility
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => {
                    setReducedMotion(e.target.checked);
                    onNotify('ok', `Reduced motion ${e.target.checked ? 'enabled' : 'disabled'}.`);
                  }}
                />
              </label>
            </div>
          </div>
        </PortalCard>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#1769AA] dark:text-blue-400" /> Account Security &amp; Alerts
            </h3>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <span>
                <strong className="block text-slate-900 dark:text-white">Multi-Factor Verification (MFA)</strong>
                <span className="text-slate-600 dark:text-slate-300">
                  Require OTP code when downloading transcripts or altering contacts
                </span>
              </span>
              <input
                type="checkbox"
                checked={state.contact.mfaEnabled}
                onChange={(e) => {
                  studentPortalService.updateSecurityFlags({ mfaEnabled: e.target.checked });
                  onNotify('ok', `MFA verification ${e.target.checked ? 'enabled' : 'disabled'}.`);
                  onRefresh();
                }}
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <span>
                <strong className="block text-slate-900 dark:text-white">SMS Examination &amp; Fee Alerts</strong>
                <span className="text-slate-600 dark:text-slate-300">
                  Send instant transactional alerts to {state.contact.phoneNumber}
                </span>
              </span>
              <input
                type="checkbox"
                checked={state.contact.smsAlertsEnabled}
                onChange={(e) => {
                  studentPortalService.updateSecurityFlags({ smsAlertsEnabled: e.target.checked });
                  onRefresh();
                }}
              />
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (newPassword.length < 8) {
                  return onNotify('err', 'Password must be at least 8 characters long.');
                }
                studentPortalService.updateSecurityFlags({ passwordRotated: true });
                setNewPassword('');
                onNotify('ok', 'Portal password updated and recorded in your security audit history.');
                onRefresh();
              }}
              className="flex gap-2 pt-1"
            >
              <input
                type="password"
                placeholder="New password (min 8 chars)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
              <PortalButton type="submit">Rotate Password</PortalButton>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users size={16} className="text-[#1769AA] dark:text-blue-400" /> Student-Authorized Guardian Access
            </h3>
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 cursor-pointer">
              <span>
                <strong className="block text-slate-900 dark:text-white">Allow Parent / Guardian Portal Access</strong>
                <span className="text-slate-600 dark:text-slate-300">
                  1-year consent window · revocable anytime by student
                </span>
              </span>
              <input
                type="checkbox"
                checked={engState.studentGuardianSharingEnabled}
                onChange={(e) => {
                  engagementService.setGuardianConsentEnabled(e.target.checked);
                  onNotify('ok', `Guardian consent ${e.target.checked ? 'enabled' : 'revoked'}.`);
                  onRefresh();
                }}
              />
            </label>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const res = engagementService.inviteGuardian(guardianEmail, ['FEES', 'ACADEMICS', 'ATTENDANCE']);
                if (!res.ok) return onNotify('err', res.error ?? 'Could not send invite');
                setGuardianEmail('');
                onNotify('ok', 'One-time guardian invite sent.');
                onRefresh();
              }}
              className="flex gap-2"
            >
              <input
                type="email"
                required
                placeholder="guardian.email@example.co.ke"
                value={guardianEmail}
                onChange={(e) => setGuardianEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100"
              />
              <PortalButton type="submit">Invite Guardian</PortalButton>
            </form>

            <div className="space-y-1.5">
              {engState.guardianLinks.map((lnk) => (
                <div
                  key={lnk.id}
                  className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                >
                  <span>
                    <strong className="text-slate-900 dark:text-white">{lnk.parentName}</strong> ({lnk.status})
                  </span>
                  {lnk.status === 'ACTIVE' && (
                    <button
                      type="button"
                      onClick={() =>
                        setRevokeGuardianTarget({ id: lnk.id, parentName: lnk.parentName })
                      }
                      className="text-red-600 dark:text-red-400 font-semibold hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Lock size={15} className="text-[#1769AA] dark:text-blue-400" /> Student Security Audit History
          </h3>
          <div className="space-y-1.5 max-h-52 overflow-y-auto text-xs font-mono">
            {state.auditLog.map((ev) => (
              <div
                key={ev.id}
                className="py-1.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-2 text-slate-600 dark:text-slate-300"
              >
                <span className="text-slate-600 dark:text-slate-300 tabular-nums">{new Date(ev.timestampIso).toLocaleTimeString()}</span>
                <span className="font-bold text-[#102D50] dark:text-blue-400">{ev.module}</span>
                <span className="text-slate-800 dark:text-slate-100">{ev.action}</span>
                <span>— {ev.detail}</span>
              </div>
            ))}
          </div>
        </div>

        <PortalConfirmDialog
          isOpen={Boolean(revokeGuardianTarget)}
          title="Revoke Guardian Portal Access?"
          message={`Are you sure you want to revoke portal visibility for ${revokeGuardianTarget?.parentName}? They will no longer view your fees, grades, or attendance unless re-invited.`}
          confirmLabel="Revoke Access"
          cancelLabel="Keep Access"
          onConfirm={() => {
            if (revokeGuardianTarget) {
              engagementService.revokeGuardianLink(
                revokeGuardianTarget.id,
                'Revoked by student in Settings'
              );
              onNotify('ok', `Revoked guardian access for ${revokeGuardianTarget.parentName}.`);
            }
            setRevokeGuardianTarget(null);
            onRefresh();
          }}
          onCancel={() => setRevokeGuardianTarget(null)}
        />
      </div>
    );
  }

  // 14. COLLEGE INFORMATION
  return (
    <div className="space-y-5">
      {SectionShellHeader()}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">
        <div className="min-h-[240px]">
          <img
            src={campusHeroUrl}
            alt="HI-TECH College Nairobi Main Campus"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="p-6 space-y-3 text-xs">
          <p className="font-semibold text-[#0866d7] dark:text-blue-400">Nairobi Main Campus · Innovation &amp; ICT Centre</p>
          <h3 className="text-lg font-bold text-[#092c60] dark:text-white">HI-TECH College Academic &amp; Student Services</h3>
          <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
            TVET-registered and KNEC/CDACC/KASNEB accredited examination centre equipping learners in Software Engineering, Cybersecurity, Cloud Computing, and Business Systems.
          </p>
          <div className="pt-2 space-y-1.5 text-slate-700 dark:text-slate-200 font-medium">
            <div className="flex items-center gap-2"><Clock size={14} className="text-[#0866d7] dark:text-blue-400" /> Mon – Sat: 07:30 AM – 08:30 PM EAT</div>
            <div className="flex items-center gap-2"><MapPin size={14} className="text-[#0866d7] dark:text-blue-400" /> Innovation Hub, Academic Wing, Nairobi</div>
            <div className="flex items-center gap-2"><Mail size={14} className="text-[#0866d7] dark:text-blue-400" /> registrar@hitech.ac.ke</div>
          </div>
        </div>
      </div>
    </div>
  );
}

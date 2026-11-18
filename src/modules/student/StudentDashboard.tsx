import React, { useEffect, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Clock,
  CreditCard,
  Download,
  FileCheck2,
  FileText,
  GraduationCap,
  Headphones,
  HeartHandshake,
  Home,
  Laptop,
  LogOut,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  Scale,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  Star,
  Sun,
  UploadCloud,
  User,
  UserCheck,
  UserRound,
  Users,
  Vote,
  Wallet,
  X,
} from 'lucide-react';
import campusHeroUrl from '../../assets/images/campus_hero_banner_1794587290452.jpg';
import libraryPromoUrl from '../../assets/images/student_library_promo_1794587291004.jpg';
import studentAvatarUrl from '../../assets/images/student_profile_portrait_1794587291385.jpg';
import { useTheme } from '../../context/ThemeContext';
import { subscribeErpSync } from '../../services/collegeErpService';
import { engagementService } from '../../services/engagementService';
import {
  PortalOnboardingStage,
  studentPortalService,
  StudentPortalSection,
} from '../../services/studentPortalService';
import ScrollView from '../../components/ScrollView';
import { PortalConfirmDialog } from '../../components/ui/PortalUI';
import { MobileCompanionTab } from './components/MobileStudentCompanion';
import StudentAnalyticsRow from './components/StudentAnalyticsRow';
import StudentAssistantWidget from './components/StudentAssistantWidget';
import StudentSubPages from './components/StudentSubPages';

type StudentDashboardProps = {
  studentName?: string;
  registrationNumber?: string;
  programme?: string;
  academicYear?: string;
  semester?: string;
  registeredCourses?: number;
  attendance?: number;
  gpa?: number;
  onNavigate?: (page: string) => void;
  onLogout?: () => void;
  onSwitchPortal?: (role: string) => void;
};

interface SidebarNavItem {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  page: StudentPortalSection;
  badgeText?: string;
}

const MENU_GROUPS: { group: string; items: SidebarNavItem[] }[] = [
  {
    group: 'OVERVIEW',
    items: [
      { label: 'Dashboard', icon: Home, page: 'dashboard' },
      { label: 'Mobile Companion', icon: Smartphone, page: 'mobile-companion', badgeText: 'App' },
    ],
  },
  {
    group: 'ACADEMIC MANAGEMENT',
    items: [
      { label: 'My Profile', icon: UserRound, page: 'profile' },
      { label: 'My Programme', icon: GraduationCap, page: 'programme' },
      { label: 'Academic Registration', icon: ClipboardList, page: 'course-registration' },
      { label: 'Timetable & Tasks', icon: CalendarDays, page: 'timetable' },
      { label: 'Class Attendance', icon: UserCheck, page: 'attendance' },
      { label: 'E-Learning', icon: Laptop, page: 'elearning' },
      { label: 'Examinations & Card', icon: FileCheck2, page: 'examinations' },
      { label: 'Results & Transcripts', icon: FileText, page: 'results' },
      { label: 'Academic Appeals', icon: Scale, page: 'appeals' },
    ],
  },
  {
    group: 'FINANCIAL SERVICES',
    items: [
      { label: 'Fees & Finance', icon: CreditCard, page: 'finance' },
      { label: 'Payment Receipts', icon: Receipt, page: 'receipts' },
    ],
  },
  {
    group: 'STUDENT SERVICES',
    items: [
      { label: 'Digital Library', icon: BookOpen, page: 'library' },
      { label: 'Attachment & Careers', icon: Briefcase, page: 'attachment' },
      { label: 'Clearance', icon: FileCheck2, page: 'clearance' },
      { label: 'Clubs & SRC Voting', icon: Vote, page: 'campus-life' },
      { label: 'Digital Student ID', icon: UserRound, page: 'student-id' },
      { label: 'Documents & Downloads', icon: Download, page: 'documents' },
      { label: 'Support & Hostels', icon: HeartHandshake, page: 'support', badgeText: 'Help' },
      { label: 'Notifications', icon: Bell, page: 'notifications' },
      { label: 'Settings', icon: Settings, page: 'settings' },
    ],
  },
];

const QUICK_ACTIONS: {
  title: string;
  description: string;
  icon: React.ComponentType<{ size?: number }>;
  gradientClass: string;
  page: StudentPortalSection;
}[] = [
  {
    title: 'View Timetable',
    description: 'See your classes',
    icon: CalendarDays,
    gradientClass: 'bg-gradient-to-br from-[#0871df] to-[#0757b9]',
    page: 'timetable',
  },
  {
    title: 'Register Units',
    description: 'Manage your courses',
    icon: CheckCircle2,
    gradientClass: 'bg-gradient-to-br from-[#0a9a5d] to-[#087b4c]',
    page: 'course-registration',
  },
  {
    title: 'Check Results',
    description: 'View your grades',
    icon: ClipboardList,
    gradientClass: 'bg-gradient-to-br from-[#8252d8] to-[#6840b9]',
    page: 'results',
  },
  {
    title: 'Pay Fees',
    description: 'Lipa na M-Pesa STK',
    icon: CreditCard,
    gradientClass: 'bg-gradient-to-br from-[#08a6a9] to-[#078c98]',
    page: 'finance',
  },
  {
    title: 'Access Library',
    description: 'Books and e-resources',
    icon: BookMarked,
    gradientClass: 'bg-gradient-to-br from-[#f49b1c] to-[#e98013]',
    page: 'library',
  },
  {
    title: 'Get Support',
    description: 'Contact the college',
    icon: Headphones,
    gradientClass: 'bg-gradient-to-br from-[#174c8b] to-[#10396f]',
    page: 'support',
  },
];

const SEARCH_DIRECTORY: { label: string; keywords: string; section: StudentPortalSection }[] = [
  { label: 'My Profile & Next of Kin', keywords: 'profile contact phone email kin avatar', section: 'profile' },
  { label: 'My Programme & Onboarding Steps', keywords: 'programme degree onboarding registration status', section: 'programme' },
  { label: 'Course Registration, Nominal Roll & Deferment', keywords: 'courses units add drop nominal roll report deferment leave transfer', section: 'course-registration' },
  { label: 'Weekly Timetable & Assignments', keywords: 'timetable classes schedule assignment submit', section: 'timetable' },
  { label: 'Class Attendance & QR Check-In', keywords: 'attendance register qr checkin roll percentage', section: 'attendance' },
  { label: 'E-Learning Notes & Lab Manuals', keywords: 'elearning lecture notes videos slides labs lms', section: 'elearning' },
  { label: 'Examinations, CBT & Exam Card', keywords: 'exams knec cdacc cbt permit card venue', section: 'examinations' },
  { label: 'Results & Official Transcripts', keywords: 'results grades marks gpa transcript', section: 'results' },
  { label: 'Academic Appeals & Remarking', keywords: 'appeal remarking grade correction attendance missed exam fee waiver', section: 'appeals' },
  { label: 'Fees, Invoice, Lipa na M-Pesa & Receipts', keywords: 'fees invoice helb mpesa payment balance receipt', section: 'finance' },
  { label: 'Verified Payment Receipts', keywords: 'receipts download tuition ledger statement', section: 'receipts' },
  { label: 'Digital Library & Book Holds', keywords: 'library books reserve ebooks pdf loans', section: 'library' },
  { label: 'Industrial Attachment & Logbook', keywords: 'attachment internship logbook intro letter career board', section: 'attachment' },
  { label: 'Institutional Clearance Form', keywords: 'clearance graduation finance library hostel hod', section: 'clearance' },
  { label: 'Campus Clubs, Events & SRC Elections', keywords: 'clubs societies events rsvp src voting elections ballot', section: 'campus-life' },
  { label: 'Digital Student ID Card', keywords: 'id card qr print badge', section: 'student-id' },
  { label: 'Official Documents & Uploaded Verification', keywords: 'documents admission letter handbook statement upload kcse', section: 'documents' },
  { label: 'Helpdesk, Lecturers, Hostels & Welfare', keywords: 'support ticket lecturer message hostel counselling', section: 'support' },
  { label: 'Security, MFA, Dark Mode & Guardian Consent', keywords: 'settings password mfa guardian parent audit theme dark light', section: 'settings' },
  { label: 'Mobile Student Companion Hub', keywords: 'mobile companion app phone schedule assignments library documents cbt mpesa', section: 'mobile-companion' },
];

export default function StudentDashboard({
  onNavigate,
  onLogout,
  onSwitchPortal,
}: StudentDashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [activePage, setActivePage] = useState<StudentPortalSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarQuery, setSidebarQuery] = useState('');
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileCompanionTab, setMobileCompanionTab] = useState<MobileCompanionTab>('today');
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'logout' | null>(null);
  const [, setVersionTick] = useState(0);

  const refresh = () => setVersionTick((n) => n + 1);
  const notify = (type: 'ok' | 'err', text: string) => setBanner({ type, text });

  useEffect(() => {
    return subscribeErpSync(refresh);
  }, []);

  useEffect(() => {
    if (activeModal !== 'privacy' && activeModal !== 'terms' && !mobileSheetOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveModal(null);
        setMobileSheetOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [activeModal, mobileSheetOpen]);

  const state = studentPortalService.getState();
  const profile = state.profile;
  const fin = studentPortalService.getFinancialSummary();
  const engState = engagementService.getState();

  const unreadNotifications = engState.notifications.filter((n) => !n.read);
  const pendingAssignments = state.assignments.filter((a) => a.status === 'PENDING');

  const resolveNotificationSection = (category: string, title: string): StudentPortalSection => {
    const t = title.toLowerCase();
    if (category === 'FINANCE' || t.includes('fee') || t.includes('mpesa') || t.includes('receipt')) {
      return 'finance';
    }
    if (category === 'CAREERS' || t.includes('attachment')) {
      return 'attachment';
    }
    if (category === 'WELFARE' || t.includes('hostel') || t.includes('support')) {
      return 'support';
    }
    if (category === 'SECURITY') {
      return 'settings';
    }
    if (t.includes('exam') || t.includes('cat') || t.includes('practical')) {
      return 'examinations';
    }
    return 'timetable';
  };

  const navigate = (page: StudentPortalSection) => {
    setActivePage(page);
    setSidebarOpen(false);
    setMobileSheetOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
    setSearchValue('');
    setMobileSearchOpen(false);
    setBanner(null);
    onNavigate?.(page);
  };

  const openMobileCompanion = (tab: MobileCompanionTab) => {
    setMobileCompanionTab(tab);
    navigate('mobile-companion');
  };

  const handleLogoutConfirm = () => {
    setActiveModal(null);
    if (onLogout) {
      onLogout();
      return;
    }
    notify('ok', 'Signed out of student workspace cleanly.');
  };

  const progressWidthClass =
    fin.percentPaid >= 100
      ? 'w-full'
      : fin.percentPaid >= 90
      ? 'w-11/12'
      : fin.percentPaid >= 80
      ? 'w-4/5'
      : fin.percentPaid >= 70
      ? 'w-3/4'
      : fin.percentPaid >= 50
      ? 'w-1/2'
      : 'w-1/4';

  const trimmedQuery = searchValue.trim().toLowerCase();
  const searchMatches: { key: string; label: string; category: string; section: StudentPortalSection }[] =
    trimmedQuery
      ? [
          ...SEARCH_DIRECTORY.filter(
            (item) =>
              item.label.toLowerCase().includes(trimmedQuery) ||
              item.keywords.toLowerCase().includes(trimmedQuery)
          ).map((item) => ({
            key: `dir-${item.section}`,
            label: item.label,
            category: 'Portal Section',
            section: item.section,
          })),
          ...state.units
            .filter(
              (u) =>
                u.code.toLowerCase().includes(trimmedQuery) ||
                u.title.toLowerCase().includes(trimmedQuery) ||
                u.lecturerName.toLowerCase().includes(trimmedQuery)
            )
            .map((u) => ({
              key: `unit-${u.code}`,
              label: `${u.code} — ${u.title}`,
              category: 'Course Unit',
              section: 'course-registration' as StudentPortalSection,
            })),
          ...state.transactions
            .filter(
              (tx) =>
                tx.receiptNumber.toLowerCase().includes(trimmedQuery) ||
                tx.referenceNumber.toLowerCase().includes(trimmedQuery) ||
                tx.description.toLowerCase().includes(trimmedQuery)
            )
            .map((tx) => ({
              key: `tx-${tx.id}`,
              label: `${tx.receiptNumber} · KES ${tx.amount.toLocaleString()}`,
              category: 'Fee Receipt',
              section: 'receipts' as StudentPortalSection,
            })),
          ...state.uploadedDocuments
            .filter(
              (doc) =>
                doc.docType.toLowerCase().includes(trimmedQuery) ||
                doc.fileName.toLowerCase().includes(trimmedQuery)
            )
            .map((doc) => ({
              key: `doc-${doc.id}`,
              label: `${doc.docType} (${doc.fileName})`,
              category: 'Document',
              section: 'documents' as StudentPortalSection,
            })),
        ].slice(0, 7)
      : [];

  const upcomingEvents = [
    {
      day: '14',
      month: 'NOV',
      title: pendingAssignments[0]?.title ?? 'Assignment Deadline – Web Technologies',
      time: pendingAssignments[0]?.dueLabel ?? '11:59 PM',
      location: 'LMS Portal',
      actionSection: 'timetable' as StudentPortalSection,
    },
    {
      day: '19',
      month: 'NOV',
      title: 'Distributed Database Systems Case Study',
      time: '10:00 AM – 5:00 PM',
      location: 'Lecture Hall 102',
      actionSection: 'timetable' as StudentPortalSection,
    },
    {
      day: '24',
      month: 'MAR',
      title: 'CSC 301 Final Examination — Data Structures',
      time: '9:00 AM – 12:00 PM',
      location: 'Exam Room A-1',
      actionSection: 'examinations' as StudentPortalSection,
    },
  ];

  const resources = studentPortalService.getStaticResources();
  const filteredGroups = MENU_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter(
      (item) =>
        !sidebarQuery.trim() ||
        item.label.toLowerCase().includes(sidebarQuery.toLowerCase()) ||
        item.page.toLowerCase().includes(sidebarQuery.toLowerCase())
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0b1424] text-[#102D50] dark:text-slate-100 font-sans flex flex-col transition-colors">
      {/* TOP PORTAL HEADER */}
      <header className="sticky top-0 z-40 h-[72px] px-4 sm:px-7 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Toggle student menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl text-[#102D50] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-[#102D50] text-[#E8B44A] flex items-center justify-center shrink-0 shadow-xs">
              <GraduationCap size={22} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-[#102D50] dark:text-white tracking-tight truncate">
                HI-TECH COLLEGE
              </h1>
              <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 hidden sm:block">
                Student Management Portal
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 sm:gap-3.5">
          {/* MOBILE COMPANION LAUNCHER */}
          <button
            type="button"
            onClick={() => openMobileCompanion('today')}
            className={`hidden sm:inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-xl border text-xs font-bold transition-colors ${
              activePage === 'mobile-companion'
                ? 'bg-[#102D50] text-white border-[#102D50] dark:bg-[#1769AA] dark:border-[#1769AA]'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-[#102D50] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Smartphone size={15} />
            <span>Companion</span>
          </button>

          {/* MOBILE SEARCH TOGGLE (<768px) */}
          <button
            type="button"
            aria-label={mobileSearchOpen ? 'Close portal search' : 'Open portal search'}
            aria-expanded={mobileSearchOpen}
            onClick={() => {
              setMobileSearchOpen((prev) => !prev);
              setNotificationOpen(false);
              setProfileOpen(false);
            }}
            className="md:hidden min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#102D50] dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {mobileSearchOpen ? <X size={18} /> : <Search size={18} />}
          </button>

          {/* LIVE PORTAL SEARCH (DESKTOP & TABLET) */}
          <div className="relative hidden md:block">
            <div className="w-64 lg:w-72 h-10 px-3 bg-[#F4F7FB] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center gap-2 text-slate-600 dark:text-slate-300 focus-within:border-[#1769AA] focus-within:ring-2 focus-within:ring-[#1769AA]/25">
              <Search size={15} className="shrink-0" aria-hidden="true" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchMatches.length > 0) {
                    navigate(searchMatches[0].section);
                  }
                  if (e.key === 'Escape') setSearchValue('');
                }}
                placeholder="Search sections, units, receipts..."
                aria-label="Search student portal"
                className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={() => setSearchValue('')}
                  aria-label="Clear search query"
                  className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {searchMatches.length > 0 && (
              <div className="absolute top-11 right-0 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-lg p-1.5 z-50">
                {searchMatches.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => navigate(item.section)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 hover:bg-[#eef4fd] dark:hover:bg-slate-800 hover:text-[#102D50] dark:hover:text-white rounded-xl flex items-center justify-between gap-2"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-semibold">{item.label}</span>
                      <span className="block text-[10px] font-mono text-slate-600 dark:text-slate-300">
                        {item.category}
                      </span>
                    </span>
                    <ArrowRight size={13} className="text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* LIGHT / DARK THEME SWITCHER */}
          <button
            type="button"
            aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-[#102D50] dark:text-[#E8B44A] hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* NOTIFICATIONS DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              aria-expanded={notificationOpen}
              aria-haspopup="true"
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setProfileOpen(false);
              }}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[#102D50] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bell size={20} />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-3 z-50 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <strong className="text-xs text-slate-900 dark:text-white block">Notifications</strong>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300">
                      {unreadNotifications.length} unread
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      engagementService.markAllRead();
                      refresh();
                    }}
                    className="text-[11px] font-semibold text-[#1769AA] dark:text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 scrollview-y pr-1">
                  {engState.notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        engagementService.markNotificationRead(item.id);
                        refresh();
                        navigate(resolveNotificationSection(item.category, item.title));
                      }}
                      className="w-full text-left py-2.5 px-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs space-y-0.5"
                    >
                      <strong className={`block ${item.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {item.title}
                      </strong>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">{item.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* STUDENT PROFILE MENU */}
          <div className="relative">
            <button
              type="button"
              aria-expanded={profileOpen}
              aria-haspopup="true"
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationOpen(false);
              }}
              className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-left"
            >
              <img
                src={studentAvatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
              />
              <div className="hidden sm:block">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {profile.fullName}
                </strong>
                <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300">
                  {profile.registrationNumber}
                </span>
              </div>
              <ChevronDown size={15} className="text-slate-600 dark:text-slate-300 hidden sm:block" aria-hidden="true" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl p-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => navigate('profile')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <User size={15} /> My Profile
                </button>
                <button
                  type="button"
                  onClick={() => navigate('student-id')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <UserRound size={15} /> Digital ID Card
                </button>
                <button
                  type="button"
                  onClick={() => navigate('appeals')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <Scale size={15} /> Academic Appeals
                </button>
                <button
                  type="button"
                  onClick={() => navigate('settings')}
                  className="w-full px-3 py-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-800 dark:text-slate-100 font-medium"
                >
                  <Settings size={15} /> Account Settings
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveModal('logout');
                  }}
                  className="w-full px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/50 flex items-center gap-2 text-red-700 dark:text-red-400 font-semibold"
                >
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* EXPANDABLE MOBILE GLOBAL SEARCH BAR */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30 space-y-2">
          <div className="h-10 px-3 bg-[#F4F7FB] dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl flex items-center gap-2 text-slate-600 dark:text-slate-300 focus-within:border-[#1769AA] focus-within:ring-2 focus-within:ring-[#1769AA]/25">
            <Search size={15} className="shrink-0" aria-hidden="true" />
            <input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchMatches.length > 0) {
                  navigate(searchMatches[0].section);
                }
                if (e.key === 'Escape') {
                  setSearchValue('');
                  setMobileSearchOpen(false);
                }
              }}
              autoFocus
              placeholder="Search sections, units, receipts..."
              aria-label="Search student portal on mobile"
              className="w-full bg-transparent text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue('')}
                aria-label="Clear mobile search"
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
          {searchMatches.length > 0 && (
            <div className="bg-[#F4F7FB] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
              {searchMatches.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => navigate(item.section)}
                  className="w-full text-left px-3 py-2 text-xs font-medium text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 rounded-lg flex items-center justify-between gap-2"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{item.label}</span>
                    <span className="block text-[10px] font-mono text-slate-600 dark:text-slate-300">
                      {item.category}
                    </span>
                  </span>
                  <ArrowRight size={13} className="text-slate-500 dark:text-slate-400 shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        {/* SECTIONED COLLAPSIBLE NAVY SIDEBAR */}
        <aside
          className={`fixed lg:sticky top-[72px] left-0 z-30 h-[calc(100vh-72px)] bg-gradient-to-b from-[#102D50] to-[#08192e] text-white p-3 pt-4 flex flex-col overflow-y-auto scrollview-dark transition-all duration-200 ${
            sidebarCollapsed ? 'lg:w-[74px]' : 'w-64'
          } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          {/* Sidebar Brand Header & Collapse Control */}
          <div className="flex items-center justify-between gap-2 px-1.5 mb-3">
            {!sidebarCollapsed && (
              <span className="text-[10px] font-extrabold tracking-widest text-[#E8B44A]">
                STUDENT PORTAL
              </span>
            )}
            <button
              type="button"
              onClick={() => setSidebarCollapsed((c) => !c)}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="hidden lg:flex w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 items-center justify-center text-blue-100 ml-auto"
            >
              {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          </div>

          {/* Instant Sidebar Search */}
          {!sidebarCollapsed && (
            <div className="px-1 mb-3">
              <div className="bg-white/10 border border-white/15 rounded-xl px-2.5 py-2 flex items-center gap-2 focus-within:border-[#E8B44A] focus-within:ring-2 focus-within:ring-[#E8B44A]/35">
                <Search size={14} className="text-blue-200 shrink-0" aria-hidden="true" />
                <input
                  value={sidebarQuery}
                  onChange={(e) => setSidebarQuery(e.target.value)}
                  placeholder="Filter portal menu..."
                  aria-label="Filter student sidebar menu"
                  className="w-full bg-transparent text-[11px] text-white placeholder:text-blue-200 focus:outline-none"
                />
                {sidebarQuery && (
                  <button
                    type="button"
                    onClick={() => setSidebarQuery('')}
                    aria-label="Clear menu filter"
                    className="text-blue-100 hover:text-white"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Sectioned Nav Groups */}
          <div className="space-y-4">
            {filteredGroups.map((group) => (
              <div key={group.group}>
                {!sidebarCollapsed && (
                  <p className="px-3 mb-1.5 text-[10px] font-extrabold tracking-widest text-blue-200">
                    {group.group}
                  </p>
                )}
                <nav className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activePage === item.page;
                    const unreadCount = item.page === 'notifications' ? unreadNotifications.length : 0;
                    return (
                      <button
                        key={item.page}
                        type="button"
                        aria-current={isActive ? 'page' : undefined}
                        title={sidebarCollapsed ? item.label : undefined}
                        onClick={() => navigate(item.page)}
                        className={`w-full min-h-[38px] px-3 rounded-xl flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                          isActive
                            ? 'bg-[#1769AA] text-white shadow-sm'
                            : 'text-blue-50 hover:bg-white/10'
                        } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                      >
                        <Icon size={17} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 whitespace-nowrap truncate">{item.label}</span>
                            {unreadCount > 0 ? (
                              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                                {unreadCount}
                              </span>
                            ) : (
                              item.badgeText && (
                                <span className="text-[10px] text-[#E8B44A] font-bold">
                                  {item.badgeText}
                                </span>
                              )
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>
            ))}
          </div>

          <div className="mt-auto pt-5 space-y-3">
            {!sidebarCollapsed && (
              <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 space-y-2">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                  <MessageCircle size={17} />
                </div>
                <strong className="text-xs block">Need assistance?</strong>
                <p className="text-[11px] text-blue-100 leading-relaxed">
                  Raise a helpdesk ticket or message your lecturer directly.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('support')}
                  className="text-[11px] font-bold text-[#E8B44A] inline-flex items-center gap-1 hover:underline"
                >
                  Contact Support <ArrowRight size={13} />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => setActiveModal('logout')}
              title={sidebarCollapsed ? 'Logout' : undefined}
              className={`w-full py-2.5 px-3 border-t border-white/15 flex items-center gap-3 text-xs font-semibold text-blue-100 hover:text-red-200 ${
                sidebarCollapsed ? 'justify-center px-0' : ''
              }`}
            >
              <LogOut size={17} /> {!sidebarCollapsed && 'Logout'}
            </button>
          </div>
        </aside>

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 top-[72px] bg-slate-950/50 z-20 lg:hidden"
          />
        )}

        {/* MAIN VIEWPORT */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-20 lg:pb-6">
          <div className="max-w-[1440px] mx-auto space-y-5">
            {banner && (
              <div
                role={banner.type === 'err' ? 'alert' : 'status'}
                aria-live={banner.type === 'err' ? 'assertive' : 'polite'}
                className={`p-3.5 rounded-2xl border text-xs font-medium flex items-center justify-between gap-3 ${
                  banner.type === 'ok'
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                    : 'bg-red-50 dark:bg-red-950/60 border-red-200 dark:border-red-800 text-red-900 dark:text-red-200'
                }`}
              >
                <span>{banner.text}</span>
                <button
                  type="button"
                  onClick={() => setBanner(null)}
                  className="text-xs font-bold opacity-80 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {activePage !== 'dashboard' ? (
              <StudentSubPages
                activeSection={activePage}
                mobileInitialTab={mobileCompanionTab}
                onBackToDashboard={() => navigate('dashboard')}
                onNavigate={navigate}
                onNotify={notify}
                onRefresh={refresh}
                onSwitchPortal={onSwitchPortal}
              />
            ) : (
              <>
                {/* CAMPUS HERO BANNER */}
                <section className="relative min-h-[250px] rounded-2xl overflow-hidden text-white flex items-center bg-[#0a3671]">
                  <img
                    src={campusHeroUrl}
                    alt="HI-TECH College Nairobi Main Campus"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#052352]/95 via-[#052a5b]/85 to-[#052a5b]/25" />

                  <div className="relative z-10 p-6 sm:p-10 max-w-xl space-y-3">
                    <span className="text-[11px] font-extrabold tracking-widest text-[#fbc52e]">
                      {profile.registrationNumber} · {profile.programme}
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight tracking-tight">
                      Welcome back, {profile.fullName.split(' ')[0]}
                    </h2>
                    <p className="text-sm sm:text-base text-blue-100 font-medium">
                      {profile.campus} · {profile.academicYear} {profile.semester} —{' '}
                      {pendingAssignments.length} pending assignment(s) · Nominal Roll:{' '}
                      {state.semesterReported ? 'Reported' : 'Action Required'}
                    </p>
                    <div className="pt-1 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => navigate('programme')}
                        className="px-5 py-2.5 bg-[#ffc400] hover:bg-[#ffda54] text-[#092b5d] text-xs font-extrabold rounded-lg inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0"
                      >
                        Explore Your Programme <ArrowRight size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('finance')}
                        className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white text-xs font-semibold rounded-lg border border-white/25 whitespace-nowrap shrink-0 transition-colors"
                      >
                        Balance: KES {fin.balance.toLocaleString()}
                      </button>
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-1.5 absolute right-6 bottom-4 z-10 text-xs font-bold text-blue-100">
                    <ShieldCheck size={15} /> Student Portal · {profile.status}
                  </div>
                </section>

                {/* MOBILE-FIRST COMPANION TRACKER RINGS & QUICK HUB (<1024px) */}
                <section aria-label="Mobile companion summary" className="lg:hidden space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => openMobileCompanion('today')}
                      className="min-h-[82px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 text-left shadow-2xs"
                    >
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90" aria-hidden="true">
                          <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-slate-200 dark:stroke-slate-800" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            strokeWidth="3.5"
                            pathLength={100}
                            strokeDasharray="100"
                            strokeDashoffset={100 - Math.min(100, Math.round(profile.attendanceRate))}
                            strokeLinecap="round"
                            className="stroke-emerald-600 dark:stroke-emerald-400"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-extrabold font-mono text-slate-900 dark:text-white">
                          {profile.attendanceRate}%
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">Attendance</span>
                        <strong className="text-xs font-extrabold text-[#102D50] dark:text-white block truncate">
                          {profile.attendanceRate >= 75 ? 'Exam Cleared' : 'Action Needed'}
                        </strong>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => openMobileCompanion('alerts-pay')}
                      className="min-h-[82px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 flex items-center gap-3 text-left shadow-2xs"
                    >
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg viewBox="0 0 36 36" className="w-12 h-12 -rotate-90" aria-hidden="true">
                          <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3.5" className="stroke-slate-200 dark:stroke-slate-800" />
                          <circle
                            cx="18"
                            cy="18"
                            r="15.5"
                            fill="none"
                            strokeWidth="3.5"
                            pathLength={100}
                            strokeDasharray="100"
                            strokeDashoffset={100 - Math.min(100, Math.round(fin.percentPaid))}
                            strokeLinecap="round"
                            className="stroke-[#1769AA] dark:stroke-blue-400"
                          />
                        </svg>
                        <span className="absolute text-[11px] font-extrabold font-mono text-slate-900 dark:text-white">
                          {fin.percentPaid}%
                        </span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">Fees Paid</span>
                        <strong className="text-xs font-extrabold text-[#102D50] dark:text-white block truncate">
                          KES {fin.balance.toLocaleString()}
                        </strong>
                      </div>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMobileSheetOpen(true)}
                    className="w-full min-h-[48px] px-4 py-2.5 bg-[#102D50] hover:bg-[#1769AA] text-white rounded-2xl text-xs font-bold flex items-center justify-between gap-3 shadow-sm"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Smartphone size={16} className="text-[#E8B44A]" />
                      <span>Open Mobile Companion Hub (Learning, Docs, CBT, M-Pesa)</span>
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </section>

                {/* STATUS-AWARE STUDENT READINESS STRIP (ALL 8 LIFECYCLE STATES) */}
                {(() => {
                  const completion = studentPortalService.getProfileCompletion();
                  const effectiveStage: PortalOnboardingStage =
                    profile.status === 'SUSPENDED'
                      ? 'SUSPENDED'
                      : profile.status === 'GRADUATED'
                      ? 'GRADUATED'
                      : state.onboardingStage;

                  const stageMessages: Record<
                    PortalOnboardingStage,
                    { headline: string; ctaLabel?: string; ctaSection?: StudentPortalSection; tone: string }
                  > = {
                    INVITED: {
                      headline:
                        'Portal invitation activated. Complete your personal contacts, Next of Kin, and admission documents to unlock full semester registration.',
                      ctaLabel: 'Start Student Onboarding',
                      ctaSection: 'profile',
                      tone: 'border-blue-300 dark:border-blue-800',
                    },
                    PENDING: {
                      headline:
                        'Student onboarding is pending completion. Review your personal details and upload required KCSE and National ID copies.',
                      ctaLabel: 'Complete Profile & Docs',
                      ctaSection: 'profile',
                      tone: 'border-blue-300 dark:border-blue-800',
                    },
                    INCOMPLETE: {
                      headline: `Saved onboarding draft is ${completion.percent}% complete (${completion.completedCount}/${completion.totalCount} items). Missing: ${
                        completion.missingFields.slice(0, 3).join(', ') || 'Registrar submission'
                      }.`,
                      ctaLabel: 'Resume Saved Draft',
                      ctaSection: 'profile',
                      tone: 'border-amber-300 dark:border-amber-700',
                    },
                    SUBMITTED: {
                      headline:
                        'Your onboarding profile and verification documents have been submitted and are queued for Academic Registrar approval.',
                      ctaLabel: 'Track Verification Status',
                      ctaSection: 'profile',
                      tone: 'border-sky-300 dark:border-sky-800',
                    },
                    RETURNED: {
                      headline:
                        state.onboardingReviewerNote ||
                        'Registrar returned your onboarding submission for correction. Update the highlighted profile or document items and resubmit.',
                      ctaLabel: 'Fix & Resubmit Profile',
                      ctaSection: 'profile',
                      tone: 'border-red-300 dark:border-red-800',
                    },
                    VERIFIED: {
                      headline: !state.semesterReported
                        ? 'Nominal roll reporting is pending for this semester. Confirm attendance to keep exam card eligibility.'
                        : fin.balance > 0
                        ? `Profile verified. Remaining fee balance of KES ${fin.balance.toLocaleString()} must be cleared before final KNEC/CDACC examination sitting.`
                        : 'Academic identity, fee clearance, and semester unit registration are verified.',
                      tone: 'border-slate-200 dark:border-slate-800',
                    },
                    SUSPENDED: {
                      headline:
                        state.onboardingReviewerNote ||
                        'Portal academic services are currently restricted due to administrative or disciplinary hold. Contact the Dean of Students or Registrar.',
                      ctaLabel: 'Contact Student Support',
                      ctaSection: 'support',
                      tone: 'border-red-400 dark:border-red-700',
                    },
                    GRADUATED: {
                      headline:
                        'Programme requirements completed (Alumni standing). You retain read-only access to official transcripts, certificates, and fee receipts.',
                      ctaLabel: 'Download Transcripts & Clearance',
                      ctaSection: 'results',
                      tone: 'border-emerald-300 dark:border-emerald-800',
                    },
                  };

                  const info = stageMessages[effectiveStage];
                  const showStrip =
                    effectiveStage !== 'VERIFIED' ||
                    profile.status !== 'ACTIVE' ||
                    !state.semesterReported ||
                    fin.balance > 0;

                  if (!showStrip) return null;

                  return (
                    <section
                      aria-label="Student readiness status"
                      className={`bg-white dark:bg-slate-900 border ${info.tone} rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs`}
                    >
                      <div className="space-y-0.5">
                        <p className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                          PORTAL READINESS · ONBOARDING: {effectiveStage} · STANDING: {profile.status}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200">{info.headline}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {info.ctaLabel && info.ctaSection && (
                          <button
                            type="button"
                            onClick={() => navigate(info.ctaSection!)}
                            className="px-3.5 py-2 bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold rounded-xl whitespace-nowrap"
                          >
                            {info.ctaLabel}
                          </button>
                        )}
                        {effectiveStage === 'VERIFIED' && !state.semesterReported && (
                          <button
                            type="button"
                            onClick={() => navigate('course-registration')}
                            className="px-3.5 py-2 bg-[#102D50] hover:bg-[#1769AA] text-white font-semibold rounded-xl whitespace-nowrap"
                          >
                            Report &amp; Register Units
                          </button>
                        )}
                        {effectiveStage !== 'SUSPENDED' &&
                          effectiveStage !== 'GRADUATED' &&
                          fin.balance > 0 && (
                            <button
                              type="button"
                              onClick={() => navigate('finance')}
                              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl whitespace-nowrap"
                            >
                              Settle via M-Pesa
                            </button>
                          )}
                      </div>
                    </section>
                  );
                })()}

                {/* 6 QUICK ACTION CARDS (HORIZONTAL SNAP SCROLLVIEW ON COMPACT VIEWPORTS, 6-COL GRID ON XL) */}
                <section aria-label="Quick student actions">
                  <ScrollView
                    direction="horizontal"
                    snap
                    showArrows
                    hideScrollbar
                    fadeColor={isDark ? 'from-[#0b1424]' : 'from-[#F4F7FB]'}
                    ariaLabel="Quick actions horizontal scrollview"
                  >
                    <div className="flex xl:grid xl:grid-cols-6 gap-3 pb-1">
                      {QUICK_ACTIONS.map((action) => {
                        const Icon = action.icon;
                        return (
                          <button
                            key={action.page}
                            type="button"
                            onClick={() => navigate(action.page)}
                            className={`${action.gradientClass} scrollview-snap-item min-w-[205px] xl:min-w-0 text-white rounded-2xl p-3.5 min-h-[76px] flex items-center gap-3 text-left shadow-sm hover:-translate-y-0.5 transition-transform`}
                          >
                            <span className="shrink-0">
                              <Icon size={24} />
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block text-xs font-bold leading-tight truncate">
                                {action.title}
                              </strong>
                              <span className="block text-[11px] text-white/85 truncate mt-0.5">
                                {action.description}
                              </span>
                            </span>
                            <ArrowRight size={15} className="shrink-0 opacity-85" />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollView>
                </section>

                {/* MAIN 2-COLUMN DASHBOARD GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  {/* LEFT 2 COLUMNS */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* ACADEMIC OVERVIEW */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                          <BarChart3 size={20} className="text-[#1769AA] dark:text-blue-400" />
                          <h3 className="text-sm font-extrabold">Your Academic Overview</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('academic-progress')}
                          className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          View Details <ArrowRight size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#102D50] to-[#17467b] text-white flex items-center gap-3">
                          <GraduationCap size={26} className="shrink-0 text-[#E8B44A]" />
                          <div className="min-w-0">
                            <span className="text-[11px] text-blue-100 block">Current Programme</span>
                            <strong className="text-xs font-bold block truncate">{profile.programme}</strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#12a66c] to-[#078452] text-white flex items-center gap-3">
                          <CalendarDays size={26} className="shrink-0" />
                          <div>
                            <span className="text-[11px] text-emerald-100 block">Academic Year</span>
                            <strong className="text-sm font-bold font-mono tabular-nums">{profile.academicYear}</strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-gradient-to-br from-[#1769AA] to-[#104f82] text-white flex items-center gap-3">
                          <CalendarCheck size={26} className="shrink-0" />
                          <div>
                            <span className="text-[11px] text-blue-100 block">Current Semester</span>
                            <strong className="text-sm font-bold">{profile.semester}</strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#d9eaff] dark:bg-blue-950/60 text-[#0753ac] dark:text-blue-300 flex items-center gap-3">
                          <BookOpen size={26} className="shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold block">Registered Units</span>
                            <strong className="text-base font-extrabold font-mono tabular-nums">
                              {state.units.length}
                            </strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#d4f5e4] dark:bg-emerald-950/60 text-[#08784d] dark:text-emerald-300 flex items-center gap-3">
                          <CheckCircle2 size={26} className="shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold block">Attendance</span>
                            <strong className="text-base font-extrabold font-mono tabular-nums">
                              {profile.attendanceRate}%
                            </strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-xl bg-[#fff0d8] dark:bg-amber-950/60 text-[#a65c00] dark:text-amber-300 flex items-center gap-3">
                          <Star size={26} className="shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold block">GPA</span>
                            <strong className="text-base font-extrabold font-mono tabular-nums">
                              {profile.gpa.toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* INTERACTIVE ATTENDANCE & ACADEMIC PERFORMANCE CHARTS */}
                    <StudentAnalyticsRow
                      units={state.units}
                      gpa={profile.gpa}
                      attendanceRate={profile.attendanceRate}
                      onNavigateResults={() => navigate('results')}
                      onNavigateAttendance={() => navigate('attendance')}
                    />

                    {/* TODAY'S TIMETABLE & RECENT EXAM RESULTS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                            <Clock size={18} className="text-[#1769AA] dark:text-blue-400" />
                            <h3 className="text-sm font-extrabold">Weekly Classes Snapshot</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('timetable')}
                            className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
                          >
                            Timetable
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {state.units.slice(0, 4).map((u) => (
                            <div key={u.code} className="py-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="font-mono font-bold text-[#1769AA] dark:text-blue-400">
                                  {u.day} · {u.time}
                                </p>
                                <strong className="text-slate-900 dark:text-slate-100 block truncate">
                                  {u.code} — {u.title}
                                </strong>
                              </div>
                              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 shrink-0">
                                {u.room}
                              </span>
                            </div>
                          ))}
                        </div>
                      </section>

                      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                            <FileCheck2 size={18} className="text-[#1769AA] dark:text-blue-400" />
                            <h3 className="text-sm font-extrabold">Recent Exam Results</h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => navigate('results')}
                            className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
                          >
                            Full Transcript
                          </button>
                        </div>
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                          {state.units.slice(0, 4).map((u) => (
                            <div key={u.code} className="py-2.5 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <strong className="text-slate-900 dark:text-slate-100 block truncate">
                                  {u.title}
                                </strong>
                                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-300">
                                  {u.code} · {u.credits} Credits
                                </span>
                              </div>
                              <div className="text-right font-mono tabular-nums shrink-0">
                                <strong className="text-[#102D50] dark:text-white block">
                                  {u.score ?? '-'}%
                                </strong>
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                                  Grade {u.grade ?? 'IP'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>

                    {/* UPCOMING EVENTS & PENDING ASSIGNMENTS */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                          <CalendarDays size={20} className="text-[#1769AA] dark:text-blue-400" />
                          <h3 className="text-sm font-extrabold">Upcoming Deadlines &amp; Examinations</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('calendar')}
                          className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          View Calendar <ArrowRight size={14} />
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {upcomingEvents.map((ev) => (
                          <button
                            key={ev.title}
                            type="button"
                            onClick={() => navigate(ev.actionSection)}
                            className="w-full min-h-[56px] py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 dark:hover:bg-slate-800/60 rounded-xl px-1.5 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-11 rounded-xl bg-[#e6f0ff] dark:bg-blue-950/70 text-[#102D50] dark:text-blue-300 flex flex-col items-center justify-center shrink-0">
                                <span className="text-[9px] font-extrabold">{ev.month}</span>
                                <strong className="text-base font-extrabold leading-none font-mono tabular-nums">
                                  {ev.day}
                                </strong>
                              </div>
                              <div className="min-w-0">
                                <strong className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">
                                  {ev.title}
                                </strong>
                                <span className="text-[11px] text-slate-600 dark:text-slate-300 inline-flex items-center gap-3 mt-0.5">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock size={12} /> {ev.time}
                                  </span>
                                  <span className="hidden sm:inline-flex items-center gap-1">
                                    <MapPin size={12} /> {ev.location}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <ArrowRight size={14} className="text-slate-600 dark:text-slate-300 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* STUDENT SERVICES SHORTCUTS */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                        <Wallet size={20} className="text-[#1769AA] dark:text-blue-400" />
                        <h3 className="text-sm font-extrabold">Student Services</h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          onClick={() => navigate('documents')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <FileText size={20} /> My Documents
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('receipts')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Download size={20} /> Fee Receipts
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('student-id')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <UserRound size={20} /> Student ID Card
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('attendance')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <UserCheck size={20} /> QR Attendance
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('elearning')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Laptop size={20} /> E-Learning Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('appeals')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Scale size={20} /> Academic Appeals
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('clearance')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <FileCheck2 size={20} /> Clearance Form
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('campus-life')}
                          className="p-3 rounded-xl bg-[#f4f8fe] dark:bg-slate-800/80 hover:bg-[#e7f1ff] dark:hover:bg-slate-800 border border-[#e5edf8] dark:border-slate-700 text-[#15518f] dark:text-blue-300 flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Users size={20} /> Clubs &amp; Voting
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-5">
                    {/* LIVE NOTIFICATIONS */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                          <Bell size={19} className="text-[#1769AA] dark:text-blue-400" />
                          <h3 className="text-sm font-extrabold">Notifications</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('notifications')}
                          className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          View All <ArrowRight size={14} />
                        </button>
                      </div>

                      <ScrollView
                        direction="vertical"
                        maxHeight="max-h-72"
                        showEdgeFades
                        ariaLabel="Student notifications scrollview"
                      >
                        <div className="divide-y divide-slate-100 dark:divide-slate-800 pr-1.5">
                          {engState.notifications.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                engagementService.markNotificationRead(item.id);
                                refresh();
                                navigate(resolveNotificationSection(item.category, item.title));
                              }}
                              className={`w-full py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg px-2 transition-colors ${
                                item.read ? 'bg-slate-50/60 dark:bg-slate-800/35' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
                                <span className="font-semibold">{item.category}</span>
                                <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                              </div>
                              <strong className={`text-xs font-bold block mt-0.5 ${item.read ? 'text-slate-700 dark:text-slate-200' : 'text-slate-900 dark:text-white'}`}>
                                {item.title}
                              </strong>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 line-clamp-2">
                                {item.message}
                              </p>
                            </button>
                          ))}
                        </div>
                      </ScrollView>

                      <button
                        type="button"
                        onClick={() => {
                          engagementService.markAllRead();
                          refresh();
                        }}
                        className="w-full py-1.5 text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
                      >
                        Mark all notifications as read
                      </button>
                    </section>

                    {/* LIVE FEE SUMMARY */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                          <CreditCard size={19} className="text-[#1769AA] dark:text-blue-400" />
                          <h3 className="text-sm font-extrabold">Fee Summary</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('finance')}
                          className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
                        >
                          Details
                        </button>
                      </div>

                      <div className="p-4 rounded-xl bg-gradient-to-br from-[#edf5ff] to-[#f7faff] dark:from-slate-800 dark:to-slate-800/70 space-y-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                          Outstanding Balance
                        </span>
                        <strong className="text-2xl font-extrabold text-[#102D50] dark:text-white font-mono tabular-nums block">
                          KES {fin.balance.toLocaleString()}.00
                        </strong>
                        <span className="text-[11px] text-slate-600 dark:text-slate-300 block font-mono tabular-nums">
                          {state.transactions.length} Verified Receipt(s) · Billed KES {fin.totalBilled.toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Fee clearance progress</span>
                          <strong className="text-emerald-700 dark:text-emerald-400 font-mono tabular-nums">
                            {fin.percentPaid}%
                          </strong>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r from-[#07975d] to-[#35c58b] transition-all duration-300 ${progressWidthClass}`}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('finance')}
                        className="w-full py-2.5 px-4 bg-[#1769AA] hover:bg-[#12568E] text-white text-xs font-bold rounded-xl flex items-center justify-between transition-colors"
                      >
                        <span className="inline-flex items-center gap-2">
                          <CreditCard size={16} /> Make a Payment (M-Pesa)
                        </span>
                        <ArrowRight size={15} />
                      </button>
                    </section>

                    {/* RECENT ACTIVITIES AUDIT FEED */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#102D50] dark:text-white">
                          <Activity size={18} className="text-[#1769AA] dark:text-blue-400" />
                          <h3 className="text-sm font-extrabold">Recent Activity</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('settings')}
                          className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline"
                        >
                          Audit Log
                        </button>
                      </div>
                      <div className="space-y-2.5 text-xs">
                        {state.auditLog.slice(0, 4).map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2.5 rounded-xl bg-[#F4F7FB] dark:bg-slate-800/70 space-y-0.5"
                          >
                            <div className="flex items-center justify-between font-mono text-[10px] text-slate-600 dark:text-slate-300">
                              <span className="font-bold text-[#1769AA] dark:text-blue-400">{ev.module}</span>
                              <span>{new Date(ev.timestampIso).toLocaleTimeString()}</span>
                            </div>
                            <p className="font-medium text-slate-800 dark:text-slate-100 line-clamp-1">
                              {ev.detail}
                            </p>
                          </div>
                        ))}
                      </div>
                    </section>

                    {/* INNOVATION HUB PROMO BANNER */}
                    <section className="relative min-h-[168px] rounded-2xl overflow-hidden text-white p-5 flex items-center bg-[#073b83]">
                      <img
                        src={libraryPromoUrl}
                        alt="HI-TECH College Innovation Hub"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#042868]/95 via-[#053e85]/85 to-[#042d64]/35" />
                      <div className="relative z-10 space-y-2">
                        <span className="text-[10px] font-extrabold tracking-widest text-[#E8B44A]">
                          LEARN • INNOVATE • EXCEL
                        </span>
                        <h3 className="text-lg font-extrabold leading-snug">
                          Build Your Future with <span className="text-[#E8B44A]">HI-TECH College</span>
                        </h3>
                        <p className="text-[11px] text-blue-100">
                          Explore labs, exam cards &amp; campus facilities ({resources.exams.length} scheduled exams).
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('college-information')}
                          className="px-3.5 py-1.5 bg-[#E8B44A] hover:bg-[#f2c361] text-[#102D50] text-xs font-extrabold rounded-xl inline-flex items-center gap-1.5"
                        >
                          Learn More <ArrowRight size={14} />
                        </button>
                      </div>
                    </section>

                    {/* SUPPORT CARD */}
                    <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#e8f2ff] dark:bg-blue-950/60 text-[#1769AA] dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Headphones size={20} />
                      </div>
                      <div className="space-y-1">
                        <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                          Student Support Centre
                        </strong>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          Need help with exams, hostels, or fees?
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('support')}
                          className="text-xs font-bold text-[#1769AA] dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                        >
                          Get Help <ArrowRight size={13} />
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}

            {/* CLEAN PORTAL FOOTER */}
            <footer className="pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
              <div>
                <strong className="text-[#102D50] dark:text-white block">HI-TECH COLLEGE</strong>
                <span className="text-[11px]">Learn • Innovate • Excel</span>
              </div>
              <p className="text-[11px]">
                © {new Date().getFullYear()} HI-TECH College. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
                >
                  Privacy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
                >
                  Terms
                </button>
                <button
                  type="button"
                  onClick={() => navigate('support')}
                  className="hover:text-slate-800 dark:hover:text-slate-200 hover:underline"
                >
                  Help Centre
                </button>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR (THUMB-ZONE ERGONOMIC) */}
      <nav
        aria-label="Mobile student navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-1.5 grid grid-cols-5 items-center no-print"
      >
        <button
          type="button"
          aria-current={activePage === 'dashboard' ? 'page' : undefined}
          onClick={() => navigate('dashboard')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${
            activePage === 'dashboard'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Home size={19} />
          <span>Home</span>
        </button>
        <button
          type="button"
          aria-current={activePage === 'mobile-companion' ? 'page' : undefined}
          onClick={() => openMobileCompanion('today')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${
            activePage === 'mobile-companion'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Smartphone size={19} />
          <span>Companion</span>
        </button>
        <button
          type="button"
          aria-current={activePage === 'finance' ? 'page' : undefined}
          onClick={() => navigate('finance')}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${
            activePage === 'finance'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <CreditCard size={19} />
          <span>M-Pesa</span>
        </button>
        <button
          type="button"
          aria-current={activePage === 'notifications' ? 'page' : undefined}
          onClick={() => navigate('notifications')}
          className={`relative min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${
            activePage === 'notifications'
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Bell size={19} />
          {unreadNotifications.length > 0 && (
            <span className="absolute top-1.5 right-3 w-4 h-4 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
              {unreadNotifications.length}
            </span>
          )}
          <span>Alerts</span>
        </button>
        <button
          type="button"
          aria-expanded={mobileSheetOpen}
          onClick={() => setMobileSheetOpen(true)}
          className={`min-h-[44px] min-w-[44px] flex flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition-colors ${
            mobileSheetOpen
              ? 'text-[#1769AA] dark:text-blue-400 bg-blue-50/80 dark:bg-blue-950/40'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          <Menu size={19} />
          <span>Hub</span>
        </button>
      </nav>

      {/* PHASE 5 MOBILE QUICK ACTION BOTTOM SHEET */}
      {mobileSheetOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile student companion quick hub"
        >
          <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-4 pb-6 space-y-4 shadow-2xl max-h-[82vh] overflow-y-auto">
            <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto" />
            <div className="flex items-center justify-between gap-2">
              <div>
                <strong className="text-sm font-extrabold text-[#102D50] dark:text-white block">
                  Student Mobile Quick Hub
                </strong>
                <span className="text-xs text-slate-600 dark:text-slate-300">
                  Direct thumb access to all Phase 5 student workflows
                </span>
              </div>
              <button
                type="button"
                aria-label="Close mobile hub"
                onClick={() => setMobileSheetOpen(false)}
                className="min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              {[
                { label: 'Today & QR Check-In', icon: CalendarDays, action: () => openMobileCompanion('today') },
                { label: 'Learning & Library', icon: BookOpen, action: () => openMobileCompanion('learning') },
                { label: 'Assignments Upload', icon: UploadCloud, action: () => openMobileCompanion('assignments') },
                { label: 'Document Centre', icon: FileText, action: () => openMobileCompanion('documents') },
                { label: 'Assessments & CBT', icon: FileCheck2, action: () => openMobileCompanion('assessments') },
                { label: 'Student Support', icon: Headphones, action: () => openMobileCompanion('support') },
                { label: 'Alerts & M-Pesa Pay', icon: CreditCard, action: () => openMobileCompanion('alerts-pay') },
                { label: 'Digital Student ID', icon: UserRound, action: () => navigate('student-id') },
              ].map((tile) => {
                const Icon = tile.icon;
                return (
                  <button
                    key={tile.label}
                    type="button"
                    onClick={tile.action}
                    className="min-h-[54px] p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left flex items-center gap-2.5 font-bold text-[#102D50] dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-slate-700"
                  >
                    <Icon size={18} className="text-[#1769AA] dark:text-blue-400 shrink-0" />
                    <span className="truncate">{tile.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileSheetOpen(false);
                setSidebarOpen(true);
              }}
              className="w-full min-h-[48px] bg-[#102D50] hover:bg-[#1769AA] text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2"
            >
              <Menu size={16} /> Open Full Portal Directory
            </button>
          </div>
        </div>
      )}

      {/* FLOATING GROUNDED STUDENT ASSISTANT */}
      <StudentAssistantWidget onNavigate={navigate} />

      {/* LOGOUT CONFIRMATION DIALOG */}
      <PortalConfirmDialog
        isOpen={activeModal === 'logout'}
        title="Sign Out of Student Portal"
        message={`Are you sure you want to sign out of ${profile.fullName}'s student portal (${profile.registrationNumber})?`}
        confirmLabel="Confirm Log Out"
        cancelLabel="Stay Signed In"
        onConfirm={handleLogoutConfirm}
        onCancel={() => setActiveModal(null)}
      />

      {/* PRIVACY / TERMS MODAL */}
      {(activeModal === 'privacy' || activeModal === 'terms') && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-legal-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3
                id="student-legal-modal-title"
                className="text-base font-bold text-[#102D50] dark:text-white"
              >
                {activeModal === 'privacy'
                  ? 'Student Data Privacy Policy'
                  : 'Portal Academic & Integrity Terms'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                aria-label="Close modal"
                className="p-1 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X size={18} />
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {activeModal === 'privacy'
                ? 'HI-TECH College processes student academic, fee, and biometric/QR attendance records in strict compliance with the Kenya Data Protection Act (2019). Guardian portal sharing requires explicit student consent and may be revoked at any time in Settings.'
                : 'Students have read-only access to Registrar-approved examination marks and verified M-Pesa fee receipts. Final examination hall entry requires at least 75% unit attendance and 100% semester fee clearance.'}
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#102D50] hover:bg-[#1769AA] rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

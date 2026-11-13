import React, { useEffect, useState } from 'react';
import {
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
  Search,
  Settings,
  ShieldCheck,
  Star,
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
import { subscribeErpSync } from '../../services/collegeErpService';
import { engagementService } from '../../services/engagementService';
import {
  studentPortalService,
  StudentPortalSection,
} from '../../services/studentPortalService';
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

const MENU_ITEMS: {
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  page: StudentPortalSection;
  badgeText?: string;
}[] = [
  { label: 'Dashboard', icon: Home, page: 'dashboard' },
  { label: 'My Profile', icon: UserRound, page: 'profile' },
  { label: 'My Programme', icon: GraduationCap, page: 'programme' },
  { label: 'Course Registration', icon: ClipboardList, page: 'course-registration' },
  { label: 'Timetable & Tasks', icon: CalendarDays, page: 'timetable' },
  { label: 'Class Attendance', icon: UserCheck, page: 'attendance' },
  { label: 'E-Learning', icon: Laptop, page: 'elearning' },
  { label: 'Exams & Permit', icon: FileCheck2, page: 'examinations' },
  { label: 'Results & Transcripts', icon: FileText, page: 'results' },
  { label: 'Fees & M-Pesa', icon: CreditCard, page: 'finance' },
  { label: 'Library', icon: BookOpen, page: 'library' },
  { label: 'Attachment & Careers', icon: Briefcase, page: 'attachment' },
  { label: 'Clearance', icon: FileCheck2, page: 'clearance' },
  { label: 'Clubs & SRC Voting', icon: Vote, page: 'campus-life' },
  { label: 'Student Support', icon: HeartHandshake, page: 'support', badgeText: 'Help' },
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
    title: 'Register Courses',
    description: 'Manage your units',
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
  { label: 'Fees, Invoice, Lipa na M-Pesa & Receipts', keywords: 'fees invoice helb mpesa payment balance receipt', section: 'finance' },
  { label: 'Digital Library & Book Holds', keywords: 'library books reserve ebooks pdf loans', section: 'library' },
  { label: 'Industrial Attachment & Logbook', keywords: 'attachment internship logbook intro letter career board', section: 'attachment' },
  { label: 'Institutional Clearance Form', keywords: 'clearance graduation finance library hostel hod', section: 'clearance' },
  { label: 'Campus Clubs, Events & SRC Elections', keywords: 'clubs societies events rsvp src voting elections ballot', section: 'campus-life' },
  { label: 'Digital Student ID Card', keywords: 'id card qr print badge', section: 'student-id' },
  { label: 'Official Documents & Letters', keywords: 'documents admission letter handbook statement', section: 'documents' },
  { label: 'Helpdesk, Lecturers, Hostels & Welfare', keywords: 'support ticket lecturer message hostel counselling', section: 'support' },
  { label: 'Security, MFA & Guardian Consent', keywords: 'settings password mfa guardian parent audit', section: 'settings' },
];

export default function StudentDashboard({
  onNavigate,
  onLogout,
  onSwitchPortal,
}: StudentDashboardProps) {
  const [activePage, setActivePage] = useState<StudentPortalSection>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [banner, setBanner] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [activeModal, setActiveModal] = useState<'privacy' | 'terms' | 'logout' | null>(null);
  const [, setVersionTick] = useState(0);

  const refresh = () => setVersionTick((n) => n + 1);
  const notify = (type: 'ok' | 'err', text: string) => setBanner({ type, text });

  useEffect(() => {
    return subscribeErpSync(refresh);
  }, []);

  const state = studentPortalService.getState();
  const profile = state.profile;
  const fin = studentPortalService.getFinancialSummary();
  const engState = engagementService.getState();

  const unreadNotifications = engState.notifications.filter((n) => !n.read);
  const pendingAssignments = state.assignments.filter((a) => a.status === 'PENDING');

  const navigate = (page: StudentPortalSection) => {
    setActivePage(page);
    setSidebarOpen(false);
    setNotificationOpen(false);
    setProfileOpen(false);
    setSearchValue('');
    setBanner(null);
    onNavigate?.(page);
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

  const searchMatches = searchValue.trim()
    ? SEARCH_DIRECTORY.filter(
        (item) =>
          item.label.toLowerCase().includes(searchValue.toLowerCase()) ||
          item.keywords.toLowerCase().includes(searchValue.toLowerCase())
      ).slice(0, 6)
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

  return (
    <div className="min-h-screen bg-[#f5f8fd] text-[#102b55] font-sans flex flex-col">
      {/* WHITE TOP PORTAL HEADER */}
      <header className="sticky top-0 z-40 h-[72px] px-4 sm:px-7 bg-white border-b border-slate-200 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            aria-label="Toggle student menu"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg text-[#092c60] hover:bg-slate-100"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="flex items-center gap-3 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-[#eef4fd] text-[#092c60] flex items-center justify-center shrink-0">
              <GraduationCap size={26} />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-extrabold text-[#092c60] tracking-tight truncate">
                HI-TECH COLLEGE
              </h1>
              <p className="text-[11px] font-semibold text-slate-500 hidden sm:block">
                Learn • Innovate • Excel
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          {/* LIVE PORTAL SEARCH */}
          <div className="relative hidden md:block">
            <div className="w-60 h-10 px-3 bg-[#f5f8fc] border border-slate-200 rounded-lg flex items-center gap-2 text-slate-500 focus-within:border-[#0866d7]">
              <Search size={15} className="shrink-0" />
              <input
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchMatches.length > 0) {
                    navigate(searchMatches[0].section);
                  }
                }}
                placeholder="Search courses, fees, exams..."
                aria-label="Search student portal"
                className="w-full bg-transparent text-xs text-slate-900 outline-none"
              />
            </div>

            {searchMatches.length > 0 && (
              <div className="absolute top-11 right-0 w-72 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50">
                {searchMatches.map((item) => (
                  <button
                    key={item.section}
                    type="button"
                    onClick={() => navigate(item.section)}
                    className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-[#eef4fd] hover:text-[#092c60] rounded-lg flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <ArrowRight size={13} className="text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* NOTIFICATIONS DROPDOWN */}
          <div className="relative">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => {
                setNotificationOpen(!notificationOpen);
                setProfileOpen(false);
              }}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-[#092c60] hover:bg-slate-100"
            >
              <Bell size={20} />
              {unreadNotifications.length > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            {notificationOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-50 space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <strong className="text-xs text-slate-900 block">Notifications</strong>
                    <span className="text-[11px] text-slate-500">
                      {unreadNotifications.length} unread
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      engagementService.markAllRead();
                      refresh();
                    }}
                    className="text-[11px] font-semibold text-[#0866d7] hover:underline"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {engState.notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        engagementService.markNotificationRead(item.id);
                        refresh();
                        navigate('notifications');
                      }}
                      className="w-full text-left py-2.5 px-1.5 hover:bg-slate-50 rounded text-xs space-y-0.5"
                    >
                      <strong className={`block ${item.read ? 'text-slate-500' : 'text-slate-900'}`}>
                        {item.title}
                      </strong>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.message}</p>
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
              onClick={() => {
                setProfileOpen(!profileOpen);
                setNotificationOpen(false);
              }}
              className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-100 text-left"
            >
              <img
                src={studentAvatarUrl}
                alt={profile.fullName}
                referrerPolicy="no-referrer"
                className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="hidden sm:block">
                <strong className="text-xs font-bold text-slate-900 block leading-tight">
                  {profile.fullName}
                </strong>
                <span className="text-[10px] font-mono text-slate-500">
                  {profile.registrationNumber}
                </span>
              </div>
              <ChevronDown size={15} className="text-slate-500 hidden sm:block" />
            </button>

            {profileOpen && (
              <div className="absolute right-0 top-12 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-50 text-xs">
                <button
                  type="button"
                  onClick={() => navigate('profile')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-800 font-medium"
                >
                  <User size={15} /> My Profile
                </button>
                <button
                  type="button"
                  onClick={() => navigate('student-id')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-800 font-medium"
                >
                  <UserRound size={15} /> Digital ID Card
                </button>
                <button
                  type="button"
                  onClick={() => navigate('settings')}
                  className="w-full px-3 py-2 rounded-lg hover:bg-slate-50 flex items-center gap-2 text-slate-800 font-medium"
                >
                  <Settings size={15} /> Account Settings
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => {
                    setProfileOpen(false);
                    setActiveModal('logout');
                  }}
                  className="w-full px-3 py-2 rounded-lg hover:bg-red-50 flex items-center gap-2 text-red-700 font-semibold"
                >
                  <LogOut size={15} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* NAVY SIDEBAR */}
        <aside
          className={`fixed lg:sticky top-[72px] left-0 z-30 w-60 h-[calc(100vh-72px)] bg-gradient-to-b from-[#092b5d] to-[#061f46] text-white p-3 pt-5 flex flex-col overflow-y-auto transition-transform duration-200 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          <p className="px-3 mb-2 text-[10px] font-extrabold tracking-widest text-blue-300">
            STUDENT MENU
          </p>

          <nav className="space-y-1">
            {MENU_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.page;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => navigate(item.page)}
                  className={`w-full min-h-[42px] px-3 rounded-lg flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? 'bg-gradient-to-r from-[#0875e8] to-[#1761c6] text-white shadow-sm'
                      : 'text-blue-50 hover:bg-white/10'
                  }`}
                >
                  <Icon size={17} />
                  <span className="flex-1 whitespace-nowrap truncate">{item.label}</span>
                  {item.badgeText && (
                    <span className="text-[10px] text-blue-200">{item.badgeText}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <p className="px-3 mt-6 mb-2 text-[10px] font-extrabold tracking-widest text-blue-300">
            ACCOUNT
          </p>

          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => navigate('notifications')}
              className={`w-full min-h-[42px] px-3 rounded-lg flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                activePage === 'notifications'
                  ? 'bg-gradient-to-r from-[#0875e8] to-[#1761c6] text-white'
                  : 'text-blue-50 hover:bg-white/10'
              }`}
            >
              <Bell size={17} />
              <span className="flex-1">Notifications</span>
              {unreadNotifications.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                  {unreadNotifications.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigate('settings')}
              className={`w-full min-h-[42px] px-3 rounded-lg flex items-center gap-3 text-xs font-semibold text-left transition-colors ${
                activePage === 'settings'
                  ? 'bg-gradient-to-r from-[#0875e8] to-[#1761c6] text-white'
                  : 'text-blue-50 hover:bg-white/10'
              }`}
            >
              <Settings size={17} />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-auto pt-5 space-y-3">
            <div className="p-3.5 rounded-xl bg-white/10 border border-white/15 space-y-2">
              <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center">
                <MessageCircle size={17} />
              </div>
              <strong className="text-xs block">Need assistance?</strong>
              <p className="text-[11px] text-blue-100 leading-relaxed">
                Raise a helpdesk ticket or message your lecturer directly.
              </p>
              <button
                type="button"
                onClick={() => navigate('support')}
                className="text-[11px] font-bold text-white inline-flex items-center gap-1 hover:underline"
              >
                Contact Support <ArrowRight size={13} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setActiveModal('logout')}
              className="w-full py-2.5 px-3 border-t border-white/15 flex items-center gap-3 text-xs font-semibold text-blue-100 hover:text-red-200"
            >
              <LogOut size={17} /> Logout
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
        <main className="flex-1 min-w-0 p-4 sm:p-6">
          <div className="max-w-[1440px] mx-auto space-y-5">
            {banner && (
              <div
                role="status"
                className={`p-3.5 rounded-xl border text-xs font-medium flex items-center justify-between gap-3 ${
                  banner.type === 'ok'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <span>{banner.text}</span>
                <button
                  type="button"
                  onClick={() => setBanner(null)}
                  className="text-xs font-bold opacity-70 hover:opacity-100"
                >
                  Dismiss
                </button>
              </div>
            )}

            {activePage !== 'dashboard' ? (
              <StudentSubPages
                activeSection={activePage}
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
                    <ShieldCheck size={15} /> Student Portal
                  </div>
                </section>

                {/* 6 QUICK ACTION CARDS */}
                <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                  {QUICK_ACTIONS.map((action) => {
                    const Icon = action.icon;
                    return (
                      <button
                        key={action.page}
                        type="button"
                        onClick={() => navigate(action.page)}
                        className={`${action.gradientClass} text-white rounded-xl p-3.5 min-h-[76px] flex items-center gap-3 text-left shadow-sm hover:-translate-y-0.5 transition-transform`}
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
                </section>

                {/* MAIN 2-COLUMN DASHBOARD GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
                  {/* LEFT 2 COLUMNS */}
                  <div className="lg:col-span-2 space-y-5">
                    {/* ACADEMIC OVERVIEW */}
                    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[#092c60]">
                          <BarChart3 size={20} />
                          <h3 className="text-sm font-extrabold">Your Academic Overview</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('academic-progress')}
                          className="text-xs font-bold text-[#075fc7] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          View Details <ArrowRight size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-lg bg-gradient-to-br from-[#15518f] to-[#0d3972] text-white flex items-center gap-3">
                          <GraduationCap size={28} className="shrink-0" />
                          <div className="min-w-0">
                            <span className="text-[11px] text-blue-100 block">Current Programme</span>
                            <strong className="text-xs font-bold block truncate">{profile.programme}</strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-gradient-to-br from-[#12a66c] to-[#078452] text-white flex items-center gap-3">
                          <CalendarDays size={28} className="shrink-0" />
                          <div>
                            <span className="text-[11px] text-emerald-100 block">Academic Year</span>
                            <strong className="text-sm font-bold font-mono tabular-nums">{profile.academicYear}</strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-gradient-to-br from-[#7953d2] to-[#6341b4] text-white flex items-center gap-3">
                          <CalendarCheck size={28} className="shrink-0" />
                          <div>
                            <span className="text-[11px] text-purple-100 block">Current Semester</span>
                            <strong className="text-sm font-bold">{profile.semester}</strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-[#d9eaff] text-[#0753ac] flex items-center gap-3">
                          <BookOpen size={28} className="shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold block">Registered Units</span>
                            <strong className="text-base font-extrabold font-mono tabular-nums">
                              {state.units.length}
                            </strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-[#d4f5e4] text-[#08784d] flex items-center gap-3">
                          <CheckCircle2 size={28} className="shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold block">Attendance</span>
                            <strong className="text-base font-extrabold font-mono tabular-nums">
                              {profile.attendanceRate}%
                            </strong>
                          </div>
                        </div>

                        <div className="p-3.5 rounded-lg bg-[#fff0d8] text-[#a65c00] flex items-center gap-3">
                          <Star size={28} className="shrink-0" />
                          <div>
                            <span className="text-[11px] font-semibold block">GPA</span>
                            <strong className="text-base font-extrabold font-mono tabular-nums">
                              {profile.gpa.toFixed(2)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* UPCOMING EVENTS & DEADLINES */}
                    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-[#092c60]">
                          <CalendarDays size={20} />
                          <h3 className="text-sm font-extrabold">Upcoming Deadlines &amp; Events</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('calendar')}
                          className="text-xs font-bold text-[#075fc7] hover:underline inline-flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          View Calendar <ArrowRight size={14} />
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {upcomingEvents.map((ev) => (
                          <button
                            key={ev.title}
                            type="button"
                            onClick={() => navigate(ev.actionSection)}
                            className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-slate-50/70 rounded-lg px-1 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-12 h-11 rounded-lg bg-[#e6f0ff] text-[#092c60] flex flex-col items-center justify-center shrink-0">
                                <span className="text-[9px] font-extrabold">{ev.month}</span>
                                <strong className="text-base font-extrabold leading-none font-mono tabular-nums">
                                  {ev.day}
                                </strong>
                              </div>
                              <div className="min-w-0">
                                <strong className="text-xs font-bold text-slate-900 block truncate">
                                  {ev.title}
                                </strong>
                                <span className="text-[11px] text-slate-500 inline-flex items-center gap-3 mt-0.5">
                                  <span className="inline-flex items-center gap-1">
                                    <Clock size={12} /> {ev.time}
                                  </span>
                                  <span className="hidden sm:inline-flex items-center gap-1">
                                    <MapPin size={12} /> {ev.location}
                                  </span>
                                </span>
                              </div>
                            </div>
                            <ArrowRight size={14} className="text-slate-400 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </section>

                    {/* STUDENT SERVICES SHORTCUTS */}
                    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center gap-2 text-[#092c60]">
                        <Wallet size={20} />
                        <h3 className="text-sm font-extrabold">Student Services</h3>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <button
                          type="button"
                          onClick={() => navigate('documents')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <FileText size={20} /> My Documents
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('receipts')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Download size={20} /> Fee Invoices &amp; Receipts
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('student-id')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <UserRound size={20} /> Student ID Card
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('attendance')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <UserCheck size={20} /> QR Attendance
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('elearning')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Laptop size={20} /> E-Learning Notes
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('attachment')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Briefcase size={20} /> Attachment Logbook
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('clearance')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <FileCheck2 size={20} /> Clearance Form
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('campus-life')}
                          className="p-3 rounded-lg bg-[#f4f8fe] hover:bg-[#e7f1ff] border border-[#e5edf8] text-[#15518f] flex flex-col items-center justify-center gap-2 text-xs font-bold transition-colors"
                        >
                          <Users size={20} /> Clubs &amp; SRC Voting
                        </button>
                      </div>
                    </section>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-5">
                    {/* LIVE NOTIFICATIONS */}
                    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#092c60]">
                          <Bell size={19} />
                          <h3 className="text-sm font-extrabold">Notifications</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('notifications')}
                          className="text-xs font-bold text-[#075fc7] hover:underline inline-flex items-center gap-1"
                        >
                          View All <ArrowRight size={14} />
                        </button>
                      </div>

                      <div className="divide-y divide-slate-100">
                        {engState.notifications.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              engagementService.markNotificationRead(item.id);
                              refresh();
                            }}
                            className={`w-full py-2.5 text-left hover:bg-slate-50 rounded px-1 transition-colors ${
                              item.read ? 'opacity-65' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                              <span>{item.category}</span>
                              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <strong className="text-xs font-bold text-slate-900 block mt-0.5">
                              {item.title}
                            </strong>
                            <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{item.message}</p>
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          engagementService.markAllRead();
                          refresh();
                        }}
                        className="w-full py-1.5 text-xs font-bold text-[#0865c9] hover:underline"
                      >
                        Mark all notifications as read
                      </button>
                    </section>

                    {/* LIVE FEE SUMMARY */}
                    <section className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[#092c60]">
                          <CreditCard size={19} />
                          <h3 className="text-sm font-extrabold">Fee Summary</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate('finance')}
                          className="text-xs font-bold text-[#075fc7] hover:underline"
                        >
                          Details
                        </button>
                      </div>

                      <div className="p-4 rounded-lg bg-gradient-to-br from-[#edf5ff] to-[#f7faff] space-y-1">
                        <span className="text-[11px] font-semibold text-slate-600 block">
                          Outstanding Balance
                        </span>
                        <strong className="text-2xl font-extrabold text-[#103c76] font-mono tabular-nums block">
                          KES {fin.balance.toLocaleString()}.00
                        </strong>
                        <span className="text-[11px] text-slate-500 block font-mono tabular-nums">
                          {state.transactions.length} Verified Receipt(s) · Billed KES {fin.totalBilled.toLocaleString()}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600">Fee clearance progress</span>
                          <strong className="text-emerald-700 font-mono tabular-nums">{fin.percentPaid}%</strong>
                        </div>
                        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r from-[#07975d] to-[#35c58b] transition-all duration-300 ${progressWidthClass}`}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate('finance')}
                        className="w-full py-2.5 px-4 bg-[#0963c6] hover:bg-[#064d9d] text-white text-xs font-bold rounded-lg flex items-center justify-between transition-colors"
                      >
                        <span className="inline-flex items-center gap-2">
                          <CreditCard size={16} /> Make a Payment (M-Pesa)
                        </span>
                        <ArrowRight size={15} />
                      </button>
                    </section>

                    {/* INNOVATION HUB PROMO BANNER */}
                    <section className="relative min-h-[168px] rounded-xl overflow-hidden text-white p-5 flex items-center bg-[#073b83]">
                      <img
                        src={libraryPromoUrl}
                        alt="HI-TECH College Innovation Hub"
                        referrerPolicy="no-referrer"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-[#042868]/95 via-[#053e85]/85 to-[#042d64]/35" />
                      <div className="relative z-10 space-y-2">
                        <span className="text-[10px] font-extrabold tracking-widest text-[#ffd04a]">
                          LEARN • INNOVATE • EXCEL
                        </span>
                        <h3 className="text-lg font-extrabold leading-snug">
                          Build Your Future with <span className="text-[#ffd12d]">HI-TECH College</span>
                        </h3>
                        <p className="text-[11px] text-blue-100">
                          Explore labs, exam cards &amp; campus facilities.
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('college-information')}
                          className="px-3.5 py-1.5 bg-[#ffc400] hover:bg-[#ffda54] text-[#092d60] text-xs font-extrabold rounded-md inline-flex items-center gap-1.5"
                        >
                          Learn More <ArrowRight size={14} />
                        </button>
                      </div>
                    </section>

                    {/* SUPPORT CARD */}
                    <section className="bg-white border border-slate-200 rounded-xl p-4 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#e8f2ff] text-[#075fc2] flex items-center justify-center shrink-0">
                        <Headphones size={20} />
                      </div>
                      <div className="space-y-1">
                        <strong className="text-xs font-bold text-slate-900 block">
                          Student Support Centre
                        </strong>
                        <p className="text-[11px] text-slate-500">
                          Need help with exams, hostels, or fees?
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate('support')}
                          className="text-xs font-bold text-[#0864c9] hover:underline inline-flex items-center gap-1"
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
            <footer className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                <strong className="text-[#092c60] block">HI-TECH COLLEGE</strong>
                <span className="text-[11px]">Learn • Innovate • Excel</span>
              </div>
              <p className="text-[11px]">
                © {new Date().getFullYear()} HI-TECH College. All rights reserved.
              </p>
              <div className="flex items-center gap-4 text-[11px]">
                <button
                  type="button"
                  onClick={() => setActiveModal('privacy')}
                  className="hover:text-slate-800 hover:underline"
                >
                  Privacy
                </button>
                <button
                  type="button"
                  onClick={() => setActiveModal('terms')}
                  className="hover:text-slate-800 hover:underline"
                >
                  Terms
                </button>
                <button
                  type="button"
                  onClick={() => navigate('support')}
                  className="hover:text-slate-800 hover:underline"
                >
                  Help Centre
                </button>
              </div>
            </footer>
          </div>
        </main>
      </div>

      {/* INLINE MODALS (PRIVACY, TERMS, LOGOUT CONFIRMATION) */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#092c60]">
                {activeModal === 'privacy'
                  ? 'Student Data Privacy Policy'
                  : activeModal === 'terms'
                  ? 'Portal Academic & Integrity Terms'
                  : 'Sign Out of Student Portal'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {activeModal === 'logout' ? (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to sign out of {profile.fullName}&apos;s student portal ({profile.registrationNumber})?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50"
                  >
                    Stay Signed In
                  </button>
                  <button
                    type="button"
                    onClick={handleLogoutConfirm}
                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
                  >
                    Confirm Log Out
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeModal === 'privacy'
                    ? 'HI-TECH College processes student academic, fee, and biometric/QR attendance records in strict compliance with the Kenya Data Protection Act (2019). Guardian portal sharing requires explicit student consent and may be revoked at any time in Settings.'
                    : 'Students have read-only access to Registrar-approved examination marks and verified M-Pesa fee receipts. Final examination hall entry requires at least 75% unit attendance and 100% semester fee clearance.'}
                </p>
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-white bg-[#092c60] rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

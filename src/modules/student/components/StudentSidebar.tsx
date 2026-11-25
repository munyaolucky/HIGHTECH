import React, { useEffect, useState } from 'react';
import {
  Award,
  BarChart3,
  Bell,
  BookMarked,
  BookOpen,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  Download,
  FileCheck,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  History,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  MessageSquare,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  ShieldCheck,
  Smartphone,
  UserCheck,
  UserRound,
  Vote,
  Wallet,
  X,
} from 'lucide-react';
import {
  STUDENT_SECTION_PATHS,
  StudentPortalSection,
} from '../../../services/studentPortalService';

export interface ExamSubmenuItem {
  label: string;
  page: StudentPortalSection;
  matchPages?: StudentPortalSection[];
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export const STUDENT_EXAM_SUBMENU_ITEMS: ExamSubmenuItem[] = [
  {
    label: 'Assessment Overview',
    page: 'examinations',
    path: '/portal/student/exams',
    icon: LayoutDashboard,
  },
  {
    label: 'My Assessments',
    page: 'exams-assessments',
    path: '/portal/student/exams/assessments',
    icon: ClipboardList,
  },
  {
    label: 'Assignments',
    page: 'exams-assignments',
    path: '/portal/student/exams/assignments',
    icon: FileText,
  },
  {
    label: 'Exam Timetable',
    page: 'exams-timetable',
    path: '/portal/student/exams/timetable',
    icon: CalendarDays,
  },
  {
    label: 'Online Exams',
    page: 'exams-online',
    path: '/portal/student/exams/online',
    icon: Monitor,
  },
  {
    label: 'Practical Assessments',
    page: 'exams-practical',
    path: '/portal/student/exams/practical',
    icon: ClipboardCheck,
  },
  {
    label: 'Results & Grades',
    page: 'exams-results',
    matchPages: ['exams-results', 'results'],
    path: '/portal/student/exams/results',
    icon: BarChart3,
  },
  {
    label: 'Exam Clearance',
    page: 'exams-clearance',
    matchPages: ['exams-clearance', 'clearance'],
    path: '/portal/student/exams/clearance',
    icon: FileCheck,
  },
  {
    label: 'Assessment History',
    page: 'exams-history',
    path: '/portal/student/exams/history',
    icon: History,
  },
  {
    label: 'Appeals & Remarking',
    page: 'exams-appeals',
    matchPages: ['exams-appeals', 'appeals'],
    path: '/portal/student/exams/appeals',
    icon: MessageSquare,
  },
  {
    label: 'Certificates & Progress',
    page: 'exams-progress',
    matchPages: ['exams-progress', 'academic-progress'],
    path: '/portal/student/exams/progress',
    icon: Award,
  },
];

const EXAM_SECTIONS = new Set<StudentPortalSection>([
  'examinations',
  'exams-assessments',
  'exams-assignments',
  'exams-timetable',
  'exams-online',
  'exams-practical',
  'exams-results',
  'exams-clearance',
  'exams-history',
  'exams-appeals',
  'exams-progress',
  'certification-hub',
  'results',
  'clearance',
  'appeals',
  'academic-progress',
]);

export const STUDENT_FEES_SUBMENU_ITEMS: ExamSubmenuItem[] = [
  {
    label: 'Fee Overview',
    page: 'fees-overview',
    matchPages: ['fees-overview', 'finance'],
    path: '/portal/student/fees',
    icon: LayoutDashboard,
  },
  {
    label: 'Fee Statement',
    page: 'fees-statement',
    path: '/portal/student/fees/statement',
    icon: FileSpreadsheet,
  },
  {
    label: 'Pay Fees',
    page: 'fees-pay',
    path: '/portal/student/fees/pay',
    icon: CreditCard,
  },
  {
    label: 'Payment History',
    page: 'fees-history',
    path: '/portal/student/fees/history',
    icon: History,
  },
  {
    label: 'Receipts',
    page: 'fees-receipts',
    matchPages: ['fees-receipts', 'receipts'],
    path: '/portal/student/fees/receipts',
    icon: Receipt,
  },
  {
    label: 'Fee Structure',
    page: 'fees-structure',
    path: '/portal/student/fees/structure',
    icon: Layers,
  },
  {
    label: 'Payment Plans',
    page: 'fees-plans',
    path: '/portal/student/fees/plans',
    icon: CalendarCheck,
  },
  {
    label: 'Financial Clearance',
    page: 'fees-clearance',
    path: '/portal/student/fees/clearance',
    icon: ShieldCheck,
  },
  {
    label: 'Refund Requests',
    page: 'fees-refunds',
    path: '/portal/student/fees/refunds',
    icon: RotateCcw,
  },
];

const FEES_SECTIONS = new Set<StudentPortalSection>([
  'finance',
  'receipts',
  'fees-overview',
  'fees-statement',
  'fees-pay',
  'fees-history',
  'fees-receipts',
  'fees-structure',
  'fees-plans',
  'fees-clearance',
  'fees-refunds',
]);

interface MainNavLink {
  label: string;
  page: StudentPortalSection;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeText?: string;
}

const PRIMARY_MAIN_LINKS: MainNavLink[] = [
  { label: 'Dashboard', page: 'dashboard', path: '/portal/student', icon: LayoutDashboard },
  { label: 'My Learning', page: 'elearning', path: '/portal/student/learning', icon: BookOpen },
  { label: 'Timetable', page: 'timetable', path: '/portal/student/timetable', icon: CalendarDays },
  { label: 'Certification Hub', page: 'certification-hub', path: '/portal/student/certification', icon: GraduationCap, badgeText: 'ICDL' },
];

const SECONDARY_MAIN_LINKS: MainNavLink[] = [
  { label: 'Digital Library', page: 'library', path: '/portal/student/library', icon: BookMarked },
  { label: 'Support Centre', page: 'support', path: '/portal/student/support', icon: MessageCircle },
];

const CAMPUS_SERVICE_LINKS: MainNavLink[] = [
  { label: 'Mobile Companion', page: 'mobile-companion', path: STUDENT_SECTION_PATHS['mobile-companion'], icon: Smartphone, badgeText: 'App' },
  { label: 'My Profile', page: 'profile', path: STUDENT_SECTION_PATHS.profile, icon: UserRound },
  { label: 'My Programme', page: 'programme', path: STUDENT_SECTION_PATHS.programme, icon: GraduationCap },
  { label: 'Academic Registration', page: 'course-registration', path: STUDENT_SECTION_PATHS['course-registration'], icon: ClipboardList },
  { label: 'Class Attendance', page: 'attendance', path: STUDENT_SECTION_PATHS.attendance, icon: UserCheck },
  { label: 'Payment Receipts', page: 'receipts', path: STUDENT_SECTION_PATHS.receipts, icon: Receipt },
  { label: 'Attachment & Careers', page: 'attachment', path: STUDENT_SECTION_PATHS.attachment, icon: Briefcase },
  { label: 'Campus Events & Passes', page: 'events', path: STUDENT_SECTION_PATHS.events, icon: CalendarCheck },
  { label: 'Clubs & SRC Voting', page: 'campus-life', path: STUDENT_SECTION_PATHS['campus-life'], icon: Vote },
  { label: 'Digital Student ID', page: 'student-id', path: STUDENT_SECTION_PATHS['student-id'], icon: CreditCard },
  { label: 'My Documents', page: 'documents', path: STUDENT_SECTION_PATHS.documents, icon: Download },
  { label: 'Notifications', page: 'notifications', path: STUDENT_SECTION_PATHS.notifications, icon: Bell },
  { label: 'My Duties & Access', page: 'role-capabilities', path: STUDENT_SECTION_PATHS['role-capabilities'], icon: ShieldCheck },
  { label: 'Settings', page: 'settings', path: STUDENT_SECTION_PATHS.settings, icon: Settings },
];

export interface StudentSidebarProps {
  activePage: StudentPortalSection;
  studentName: string;
  registrationNumber: string;
  unreadNotificationsCount?: number;
  pendingAssessmentsCount?: number;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile: () => void;
  onNavigate: (page: StudentPortalSection) => void;
  onLogoutClick: () => void;
}

export default function StudentSidebar({
  activePage,
  studentName,
  registrationNumber,
  unreadNotificationsCount = 0,
  pendingAssessmentsCount = 0,
  sidebarOpen,
  sidebarCollapsed,
  onToggleCollapse,
  onCloseMobile,
  onNavigate,
  onLogoutClick,
}: StudentSidebarProps) {
  const [examOpen, setExamOpen] = useState(true);
  const [feesOpen, setFeesOpen] = useState(true);
  const [servicesOpen, setServicesOpen] = useState(() =>
    CAMPUS_SERVICE_LINKS.some((item) => item.page === activePage)
  );
  const [menuQuery, setMenuQuery] = useState('');

  useEffect(() => {
    if (EXAM_SECTIONS.has(activePage)) {
      setExamOpen(true);
    } else if (FEES_SECTIONS.has(activePage)) {
      setFeesOpen(true);
    } else if (CAMPUS_SERVICE_LINKS.some((item) => item.page === activePage)) {
      setServicesOpen(true);
    }
  }, [activePage]);

  const q = menuQuery.trim().toLowerCase();
  const filterByQuery = <T extends { label: string }>(items: T[]) =>
    !q ? items : items.filter((item) => item.label.toLowerCase().includes(q));

  const visiblePrimary = filterByQuery(PRIMARY_MAIN_LINKS);
  const visibleExams = filterByQuery(STUDENT_EXAM_SUBMENU_ITEMS);
  const visibleFees = filterByQuery(STUDENT_FEES_SUBMENU_ITEMS);
  const visibleSecondary = filterByQuery(SECONDARY_MAIN_LINKS);
  const visibleCampusServices = filterByQuery(CAMPUS_SERVICE_LINKS);

  const initials =
    studentName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || 'ST';

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    page: StudentPortalSection
  ) => {
    e.preventDefault();
    onNavigate(page);
    onCloseMobile();
  };

  const renderTopLink = (item: MainNavLink) => {
    const Icon = item.icon;
    const isActive = activePage === item.page;
    const unread = item.page === 'notifications' ? unreadNotificationsCount : 0;

    return (
      <a
        key={item.page}
        href={item.path}
        aria-current={isActive ? 'page' : undefined}
        title={sidebarCollapsed ? item.label : undefined}
        onClick={(e) => handleNavClick(e, item.page)}
        className={`flex w-full min-h-[40px] items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-colors duration-150 whitespace-nowrap focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b] focus-visible:outline-offset-2 ${
          isActive
            ? 'bg-[#1769aa] text-white font-semibold'
            : 'text-[#d5e1ee] hover:bg-white/8 hover:text-white font-medium'
        } ${sidebarCollapsed ? 'justify-center px-0 min-h-[44px]' : ''}`}
      >
        <Icon size={17} className="shrink-0 opacity-90" />
        {!sidebarCollapsed && (
          <>
            <span className="flex-1 truncate">{item.label}</span>
            {unread > 0 ? (
              <span className="text-[11px] font-mono tabular-nums font-bold text-[#f2b84b]">
                {unread}
              </span>
            ) : (
              item.badgeText && (
                <span className="text-[11px] font-medium text-[#9ec0e6]">{item.badgeText}</span>
              )
            )}
          </>
        )}
      </a>
    );
  };

  const isExamGroupActive = EXAM_SECTIONS.has(activePage);
  const showExamSubmenu = (examOpen || Boolean(q)) && visibleExams.length > 0;
  const isFeesGroupActive = FEES_SECTIONS.has(activePage);
  const showFeesSubmenu = (feesOpen || Boolean(q)) && visibleFees.length > 0;

  return (
    <>
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation overlay"
          onClick={onCloseMobile}
          className="fixed inset-0 top-[64px] bg-slate-950/50 z-20 lg:hidden"
        />
      )}

      <aside
        aria-label="HI-TECH College Student Sidebar"
        className={`fixed lg:sticky top-[64px] left-0 z-30 h-[calc(100vh-64px)] bg-[#102d50] text-white flex flex-col border-r border-white/10 transition-all duration-200 ${
          sidebarCollapsed ? 'lg:w-[74px]' : 'w-[264px] min-w-[264px]'
        } ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Anchor & Collapse Control */}
        <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-white/10">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white/10 border border-white/15 text-white grid place-items-center shrink-0">
                <GraduationCap size={18} />
              </div>
              <div className="min-w-0">
                <strong className="block text-xs font-bold tracking-tight text-white truncate">
                  HI-TECH COLLEGE
                </strong>
                <small className="block text-[11px] text-[#b8cde3] truncate">
                  Student Portal
                </small>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:grid place-items-center w-8 h-8 rounded-lg hover:bg-white/10 text-[#cbd9e8] hover:text-white ml-auto transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b]"
          >
            {sidebarCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close student navigation"
            className="lg:hidden grid place-items-center w-10 h-10 rounded-lg hover:bg-white/10 text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Minimal Quick Menu Filter */}
        {!sidebarCollapsed && (
          <div className="px-3 pt-3">
            <div className="bg-white/7 border border-white/10 rounded-lg px-2.5 py-1.5 flex items-center gap-2 focus-within:border-[#f2b84b] focus-within:bg-white/10">
              <Search size={13} className="text-[#a9bfd6] shrink-0" aria-hidden="true" />
              <input
                value={menuQuery}
                onChange={(e) => setMenuQuery(e.target.value)}
                placeholder="Jump to menu..."
                aria-label="Filter student sidebar menu"
                className="w-full bg-transparent text-xs text-white placeholder:text-[#a9bfd6] focus:outline-none"
              />
              {menuQuery && (
                <button
                  type="button"
                  onClick={() => setMenuQuery('')}
                  aria-label="Clear menu filter"
                  className="text-[#cbd9e8] hover:text-white"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav
          aria-label="Student portal navigation"
          className="flex-1 overflow-y-auto scrollview-dark px-3 py-3.5 space-y-1"
        >
          {!sidebarCollapsed && (
            <div className="px-2.5 pb-1 text-[11px] font-medium text-[#95aec9]">
              Main menu
            </div>
          )}

          {visiblePrimary.map(renderTopLink)}

          {/* Collapsible Exams & Assessments Menu */}
          {(!q || visibleExams.length > 0 || 'exams & assessments'.includes(q)) && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (sidebarCollapsed) {
                    onNavigate('examinations');
                  } else {
                    setExamOpen((prev) => !prev);
                  }
                }}
                title={sidebarCollapsed ? 'Exams & Assessments' : undefined}
                aria-expanded={showExamSubmenu}
                aria-controls="student-exam-submenu"
                className={`flex w-full min-h-[40px] items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b] focus-visible:outline-offset-2 ${
                  isExamGroupActive && !showExamSubmenu
                    ? 'bg-[#1769aa] text-white font-semibold'
                    : isExamGroupActive
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-[#d5e1ee] hover:bg-white/8 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center px-0 min-h-[44px]' : ''}`}
              >
                <ClipboardCheck size={17} className="shrink-0 opacity-90" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">Exams &amp; Assessments</span>
                    {pendingAssessmentsCount > 0 && (
                      <span className="text-[11px] font-mono tabular-nums font-bold text-[#f2b84b]">
                        {pendingAssessmentsCount}
                      </span>
                    )}
                    <ChevronDown
                      size={15}
                      className={`shrink-0 opacity-75 transition-transform duration-150 ${
                        showExamSubmenu ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
              </button>

              {!sidebarCollapsed && showExamSubmenu && (
                <div
                  id="student-exam-submenu"
                  className="mt-1 mb-2 ml-4 pl-2.5 border-l border-white/15 space-y-0.5"
                >
                  {visibleExams.map((sub) => {
                    const Icon = sub.icon;
                    const isSubActive = sub.matchPages
                      ? sub.matchPages.includes(activePage)
                      : activePage === sub.page;

                    return (
                      <a
                        key={sub.path}
                        href={sub.path}
                        aria-current={isSubActive ? 'page' : undefined}
                        onClick={(e) => handleNavClick(e, sub.page)}
                        className={`flex items-center gap-2.5 min-h-[36px] px-2.5 py-1.5 rounded-md text-[12px] transition-colors duration-150 whitespace-nowrap focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b] focus-visible:outline-offset-2 ${
                          isSubActive
                            ? 'bg-[#e9f2fc] text-[#102d50] font-semibold'
                            : 'text-[#c4d5e6] hover:bg-white/8 hover:text-white font-normal'
                        }`}
                      >
                        <Icon size={15} className="shrink-0 opacity-85" />
                        <span className="truncate">{sub.label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Collapsible Fees & Payments Menu */}
          {(!q || visibleFees.length > 0 || 'fees & payments'.includes(q)) && (
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (sidebarCollapsed) {
                    onNavigate('fees-overview');
                  } else {
                    setFeesOpen((prev) => !prev);
                  }
                }}
                title={sidebarCollapsed ? 'Fees & Payments' : undefined}
                aria-expanded={showFeesSubmenu}
                aria-controls="student-fees-submenu"
                className={`flex w-full min-h-[40px] items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b] focus-visible:outline-offset-2 ${
                  isFeesGroupActive && !showFeesSubmenu
                    ? 'bg-[#1769aa] text-white font-semibold'
                    : isFeesGroupActive
                    ? 'bg-white/10 text-white font-semibold'
                    : 'text-[#d5e1ee] hover:bg-white/8 hover:text-white'
                } ${sidebarCollapsed ? 'justify-center px-0 min-h-[44px]' : ''}`}
              >
                <Wallet size={17} className="shrink-0 opacity-90" />
                {!sidebarCollapsed && (
                  <>
                    <span className="flex-1 truncate">Fees &amp; Payments</span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 opacity-75 transition-transform duration-150 ${
                        showFeesSubmenu ? 'rotate-180' : ''
                      }`}
                    />
                  </>
                )}
              </button>

              {!sidebarCollapsed && showFeesSubmenu && (
                <div
                  id="student-fees-submenu"
                  className="mt-1 mb-2 ml-4 pl-2.5 border-l border-white/15 space-y-0.5"
                >
                  {visibleFees.map((sub) => {
                    const Icon = sub.icon;
                    const isSubActive = sub.matchPages
                      ? sub.matchPages.includes(activePage)
                      : activePage === sub.page;

                    return (
                      <a
                        key={sub.path}
                        href={sub.path}
                        aria-current={isSubActive ? 'page' : undefined}
                        onClick={(e) => handleNavClick(e, sub.page)}
                        className={`flex items-center gap-2.5 min-h-[36px] px-2.5 py-1.5 rounded-md text-[12px] transition-colors duration-150 whitespace-nowrap focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b] focus-visible:outline-offset-2 ${
                          isSubActive
                            ? 'bg-[#e9f2fc] text-[#102d50] font-semibold'
                            : 'text-[#c4d5e6] hover:bg-white/8 hover:text-white font-normal'
                        }`}
                      >
                        <Icon size={15} className="shrink-0 opacity-85" />
                        <span className="truncate">{sub.label}</span>
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {visibleSecondary.map(renderTopLink)}

          {/* Academic & Campus Services */}
          {(!q || visibleCampusServices.length > 0) && (
            <div className="pt-3 mt-3 border-t border-white/10">
              {!sidebarCollapsed ? (
                <button
                  type="button"
                  onClick={() => setServicesOpen((prev) => !prev)}
                  aria-expanded={servicesOpen || Boolean(q)}
                  className="w-full px-2.5 py-1.5 flex items-center justify-between text-[11px] font-medium text-[#95aec9] hover:text-white rounded-md focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b]"
                >
                  <span>Campus services</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform duration-150 ${
                      servicesOpen || Boolean(q) ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              ) : null}

              {(sidebarCollapsed || servicesOpen || Boolean(q)) && (
                <div className="mt-1 space-y-0.5">
                  {visibleCampusServices.map(renderTopLink)}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Account & Logout Footer */}
        <div className="p-3 border-t border-white/10 space-y-2">
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2.5 px-1.5 py-1">
              <div className="w-8 h-8 rounded-full bg-[#e9f2fc] text-[#102d50] grid place-items-center font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <strong className="block text-xs font-semibold text-white truncate">
                  {studentName}
                </strong>
                <small className="block text-[11px] font-mono text-[#b8cde3] truncate">
                  {registrationNumber}
                </small>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={onLogoutClick}
            title={sidebarCollapsed ? 'Log out' : undefined}
            className={`w-full min-h-[38px] px-3 rounded-lg hover:bg-red-500/20 text-[#d5e1ee] hover:text-white flex items-center gap-2.5 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#f2b84b] ${
              sidebarCollapsed ? 'justify-center px-0 min-h-[44px]' : ''
            }`}
          >
            <LogOut size={15} />
            {!sidebarCollapsed && <span>Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
